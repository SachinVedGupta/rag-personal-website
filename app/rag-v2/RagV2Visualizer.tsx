"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { CorpusPoint, QueryTrace, VisualizationData } from "./types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];
const SEARCH_AREA_STEPS = 72;

export const ALL_SEARCHES = "__all_searches__";
export const PROFILE_ONLY = "__profile_only__";

interface RagV2VisualizerProps {
  data: VisualizationData | null;
  mapView: string;
  onMapViewChange: (value: string) => void;
  darkTheme?: boolean;
}

function escapeHover(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrappedPreview(value: string, maxCharacters = 112, lineLength = 42) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const clipped = normalized.length > maxCharacters
    ? `${normalized.slice(0, maxCharacters).trimEnd()}…`
    : normalized;
  const words: string[] = [];
  for (const word of clipped.split(" ").filter(Boolean)) {
    if (word.length <= lineLength) {
      words.push(word);
      continue;
    }
    for (let offset = 0; offset < word.length; offset += lineLength) {
      words.push(word.slice(offset, offset + lineLength));
    }
  }
  const lines: string[] = [];

  for (const word of words) {
    const lastLine = lines.at(-1);
    if (!lastLine || lastLine.length + word.length + 1 > lineLength) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${lastLine} ${word}`;
    }
  }

  return lines.slice(0, 3).map(escapeHover).join("<br>");
}

function pointHover(point: CorpusPoint) {
  return [
    `<b>${escapeHover(point.title)}</b>`,
    escapeHover(point.category),
    `PCA: (${point.x.toFixed(4)}, ${point.y.toFixed(4)})`,
    wrappedPreview(point.text || "No preview available."),
    "<i>Click to inspect the full indexed chunk</i>",
  ].join("<br>");
}

function queryHover(query: QueryTrace) {
  return [
    `<b>${escapeHover(query.label)}</b>`,
    wrappedPreview(query.query, 100, 42),
    `PCA: (${query.point[0].toFixed(4)}, ${query.point[1].toFixed(4)})`,
  ].join("<br>");
}

function colorWithAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function searchArea(query: QueryTrace, hitPoints: CorpusPoint[]) {
  const distances = hitPoints.map((point) =>
    Math.hypot(point.x - query.point[0], point.y - query.point[1]),
  );
  const radius = Math.max(0.045, ...distances) * 1.06;
  const angles = Array.from(
    { length: SEARCH_AREA_STEPS + 1 },
    (_, index) => (index * 2 * Math.PI) / SEARCH_AREA_STEPS,
  );

  return {
    x: angles.map((angle) => query.point[0] + radius * Math.cos(angle)),
    y: angles.map((angle) => query.point[1] + radius * Math.sin(angle)),
    radius,
  };
}

export default function RagV2Visualizer({ data, mapView, onMapViewChange, darkTheme = false }: RagV2VisualizerProps) {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(() => new Set());
  const searchSetKey = (data?.queries || [])
    .map((query) => `${query.id}:${query.query}`)
    .join("|");

  useEffect(() => {
    setSelectedPointId(null);
    setHiddenLayers(new Set());
  }, [searchSetKey]);

  const queryIndexById = useMemo(
    () => new Map((data?.queries || []).map((query, index) => [query.id, index])),
    [data],
  );

  const activeQueries = useMemo(() => {
    if (!data || mapView === PROFILE_ONLY) return [];
    if (mapView === ALL_SEARCHES) return data.queries;
    return data.queries.filter((query) => query.id === mapView);
  }, [data, mapView]);

  function toggleLayer(layerId: string) {
    setHiddenLayers((current) => {
      const next = new Set(current);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }

  function layerVisible(layerId: string) {
    return !hiddenLayers.has(layerId);
  }

  const traces = useMemo(() => {
    if (!data) return [];
    const pointById = new Map(data.points.map((point) => [point.id, point]));
    const plotTraces: any[] = [];
    if (!hiddenLayers.has("profile")) plotTraces.push({
        x: data.points.map((point) => point.x),
        y: data.points.map((point) => point.y),
        text: data.points.map(pointHover),
        customdata: data.points.map((point) => point.id),
        mode: "markers",
        type: "scatter",
        name: "Profile knowledge",
        marker: { size: 8, color: "#94a3b8", opacity: 0.55 },
        hovertemplate: "%{text}<extra></extra>",
        showlegend: false,
      });

    activeQueries.forEach((query) => {
      const queryIndex = queryIndexById.get(query.id) ?? 0;
      const color = COLORS[queryIndex % COLORS.length];
      const hitPoints = query.hitIds
        .map((id) => pointById.get(id))
        .filter(Boolean) as CorpusPoint[];
      const area = searchArea(query, hitPoints);

      if (!hiddenLayers.has(`${query.id}:area`)) plotTraces.push({
        x: area.x,
        y: area.y,
        mode: "lines",
        type: "scatter",
        name: `${query.label} search area`,
        line: { color, width: 1.5, dash: "dot" },
        fill: "toself",
        fillcolor: colorWithAlpha(color, 0.08),
        hoverinfo: "skip",
        showlegend: false,
      });
      if (!hiddenLayers.has(`${query.id}:results`)) plotTraces.push({
        x: hitPoints.map((point) => point.x),
        y: hitPoints.map((point) => point.y),
        text: hitPoints.map(pointHover),
        customdata: hitPoints.map((point) => point.id),
        mode: "markers",
        type: "scatter",
        name: `${query.label} results`,
        marker: { size: 14, color, opacity: 0.78, line: { color: "white", width: 1 } },
        hovertemplate: "%{text}<extra></extra>",
        showlegend: false,
      });
      if (!hiddenLayers.has(`${query.id}:search`)) plotTraces.push({
        x: [query.point[0]],
        y: [query.point[1]],
        text: [queryHover(query)],
        customdata: [null],
        mode: "markers",
        type: "scatter",
        name: query.label,
        marker: { size: 20, color, symbol: "star", line: { color: "white", width: 2 } },
        hovertemplate: "%{text}<extra></extra>",
        showlegend: false,
      });
    });
    return plotTraces;
  }, [activeQueries, data, hiddenLayers, queryIndexById]);

  const selectedPoint: CorpusPoint | null = useMemo(() => {
    if (!data || !selectedPointId) return null;
    return data.points.find((point) => point.id === selectedPointId) || null;
  }, [data, selectedPointId]);

  if (!data) {
    return (
      <div className={`flex h-full min-h-[470px] items-center justify-center rounded-2xl border p-8 text-center text-sm shadow-sm ${darkTheme ? "border-blue-800 bg-[#091b32] text-blue-100/70" : "border-slate-200 bg-white/80 text-slate-500"}`}>
        The stable profile map will appear when the v2 backend is ready.
      </div>
    );
  }

  return (
    <section className={`flex min-h-[470px] self-start flex-col rounded-2xl border p-5 shadow-sm ${darkTheme ? "border-blue-800/80 bg-[#091b32]/90" : "border-slate-200 bg-white/90"}`}>
      <div className="mb-3">
        <h2 className={`mt-1 text-xl font-semibold ${darkTheme ? "text-white" : "text-slate-950"}`}>RAG Embedding Space Visualization</h2>
        <p className={`mt-1 text-sm ${darkTheme ? "text-blue-100/75" : "text-slate-600"}`}>
          Real-time 2D PCA visualization of your question and similar embeddings.
        </p>
      </div>

      {data.queries.length > 0 && (
        <label className={`mb-2 block text-xs font-medium ${darkTheme ? "text-blue-100" : "text-slate-700"}`}>
          Search shown on map
          <select
            value={mapView}
            onChange={(event) => onMapViewChange(event.target.value)}
            className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${darkTheme ? "border-blue-700 bg-[#061426] text-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-900" : "border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
          >
            <option value={ALL_SEARCHES}>Compare all agent searches</option>
            <option value={PROFILE_ONLY}>Profile embeddings only</option>
            {data.queries.map((query, index) => (
              <option key={query.id} value={query.id}>
                Search {index + 1}: {query.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="h-[360px] flex-none">
        <Plot
          data={traces}
          layout={{
            autosize: true,
            height: 360,
            margin: { l: 35, r: 15, t: 15, b: 40 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: darkTheme ? "rgba(4,16,30,0.8)" : "rgba(248,250,252,0.7)",
            font: { color: darkTheme ? "#cbd5e1" : "#334155" },
            xaxis: { title: "PCA 1", gridcolor: darkTheme ? "#1e3a5f" : "#e2e8f0", zeroline: false },
            yaxis: {
              title: "PCA 2",
              gridcolor: darkTheme ? "#1e3a5f" : "#e2e8f0",
              zeroline: false,
              scaleanchor: "x",
              scaleratio: 1,
            },
            hovermode: "closest",
            hoverlabel: {
              align: "left",
              bgcolor: darkTheme ? "#0b1d33" : "#ffffff",
              bordercolor: darkTheme ? "#2563eb" : "#cbd5e1",
              font: { color: darkTheme ? "#eff6ff" : "#334155", family: "ui-sans-serif, system-ui", size: 12 },
            },
            showlegend: false,
            uirevision: data.projectionVersion,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%", height: "100%" }}
          onClick={(event: any) => {
            const id = event?.points?.[0]?.customdata;
            if (typeof id === "string") setSelectedPointId(id);
          }}
        />
      </div>
      <div className={`mt-2 space-y-2 rounded-xl border px-3 py-2.5 text-xs ${darkTheme ? "border-blue-800 bg-[#061426] text-blue-100/80" : "border-slate-200 bg-white text-slate-600"}`} aria-label="Retrieval map legend">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={layerVisible("profile")} onChange={() => toggleLayer("profile")} className="h-3.5 w-3.5 accent-slate-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400 opacity-60" aria-hidden="true" />
          <span className="font-medium">Profile knowledge</span>
        </label>
        {activeQueries.map((query) => {
          const queryIndex = queryIndexById.get(query.id) ?? 0;
          const color = COLORS[queryIndex % COLORS.length];
          return (
            <div key={query.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 ${darkTheme ? "border-blue-900" : "border-slate-100"}`}>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={layerVisible(`${query.id}:search`)} onChange={() => toggleLayer(`${query.id}:search`)} className="h-3.5 w-3.5" />
                <span className="text-base leading-none" style={{ color }} aria-hidden="true">★</span>
                <span><span className={`font-medium ${darkTheme ? "text-white" : "text-slate-800"}`}>{query.label}</span> search</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={layerVisible(`${query.id}:results`)} onChange={() => toggleLayer(`${query.id}:results`)} className="h-3.5 w-3.5" />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                <span>Retrieved results</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={layerVisible(`${query.id}:area`)} onChange={() => toggleLayer(`${query.id}:area`)} className="h-3.5 w-3.5" />
                <span className="h-3 w-3 rounded-full border border-dashed" style={{ borderColor: color, backgroundColor: colorWithAlpha(color, 0.08) }} aria-hidden="true" />
                <span>2D search area</span>
              </label>
            </div>
          );
        })}
      </div>
      <div className={`mt-3 rounded-xl border p-4 ${darkTheme ? "border-blue-800 bg-[#061426]" : "border-slate-200 bg-slate-50"}`}>
        {selectedPoint ? (
          <PointDetails point={selectedPoint} darkTheme={darkTheme} />
        ) : (
          <p className={`text-sm ${darkTheme ? "text-blue-100/65" : "text-slate-500"}`}>
            Hover for a preview, or select a point to explore the matching details, related topics, and public links or images.
          </p>
        )}
      </div>
    </section>
  );
}

function PointDetails({ point, darkTheme }: { point: CorpusPoint; darkTheme: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${darkTheme ? "text-blue-300" : "text-blue-600"}`}>{point.category}</p>
          <h3 className={`mt-1 font-semibold ${darkTheme ? "text-white" : "text-slate-950"}`}>{point.title}</h3>
        </div>
        <code className={`rounded px-2 py-1 text-[11px] ${darkTheme ? "bg-blue-950 text-blue-100/70" : "bg-white text-slate-500"}`}>
          ({point.x.toFixed(6)}, {point.y.toFixed(6)})
        </code>
      </div>
      <p className={`whitespace-pre-wrap text-sm leading-6 ${darkTheme ? "text-blue-50/90" : "text-slate-700"}`}>{point.text}</p>
      {((point.entities || []).length > 0 || (point.themes || []).length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {[...(point.entities || []), ...(point.themes || [])].map((item) => (
            <span key={item} className={`rounded-full border px-2 py-1 text-[11px] ${darkTheme ? "border-blue-800 bg-blue-950 text-blue-100/80" : "border-slate-200 bg-white text-slate-600"}`}>
              {item}
            </span>
          ))}
        </div>
      )}
      {(point.relatedIds || []).length > 0 && (
        <p className={`text-xs ${darkTheme ? "text-blue-100/60" : "text-slate-500"}`}>Related records: {(point.relatedIds || []).join(", ")}</p>
      )}
      {(point.media || []).some((item) => item.type === "image") && (
        <div className="grid gap-2 sm:grid-cols-2">
          {(point.media || []).filter((item) => item.type === "image").map((item) => (
            <figure key={item.url} className={`overflow-hidden rounded-lg border ${darkTheme ? "border-blue-800 bg-blue-950" : "border-slate-200 bg-white"}`}>
              <img src={item.url} alt={item.alt || item.label} className="h-40 w-full object-cover" />
              <figcaption className={`px-3 py-2 text-xs ${darkTheme ? "text-blue-100/70" : "text-slate-500"}`}>{item.caption || item.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-xs">
        {(point.media || []).filter((item) => item.type !== "image").map((item) => (
          <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className={`font-medium underline ${darkTheme ? "text-blue-300" : "text-blue-700"}`}>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
