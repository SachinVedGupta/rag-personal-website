"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { CorpusPoint, QueryTrace, VisualizationData } from "./types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];

export const ALL_SEARCHES = "__all_searches__";
export const PROFILE_ONLY = "__profile_only__";

interface RagV2VisualizerProps {
  data: VisualizationData | null;
  mapView: string;
  onMapViewChange: (value: string) => void;
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

export default function RagV2Visualizer({ data, mapView, onMapViewChange }: RagV2VisualizerProps) {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const queryIndexById = useMemo(
    () => new Map((data?.queries || []).map((query, index) => [query.id, index])),
    [data],
  );

  const activeQueries = useMemo(() => {
    if (!data || mapView === PROFILE_ONLY) return [];
    if (mapView === ALL_SEARCHES) return data.queries;
    return data.queries.filter((query) => query.id === mapView);
  }, [data, mapView]);

  const traces = useMemo(() => {
    if (!data) return [];
    const pointById = new Map(data.points.map((point) => [point.id, point]));
    const plotTraces: any[] = [
      {
        x: data.points.map((point) => point.x),
        y: data.points.map((point) => point.y),
        text: data.points.map(pointHover),
        customdata: data.points.map((point) => point.id),
        mode: "markers",
        type: "scatter",
        name: "Profile knowledge",
        marker: { size: 8, color: "#94a3b8", opacity: 0.55 },
        hovertemplate: "%{text}<extra></extra>",
      },
    ];

    activeQueries.forEach((query) => {
      const queryIndex = queryIndexById.get(query.id) ?? 0;
      const color = COLORS[queryIndex % COLORS.length];
      const hitPoints = query.hitIds
        .map((id) => pointById.get(id))
        .filter(Boolean) as CorpusPoint[];

      plotTraces.push({
        x: hitPoints.map((point) => point.x),
        y: hitPoints.map((point) => point.y),
        text: hitPoints.map(pointHover),
        customdata: hitPoints.map((point) => point.id),
        mode: "markers",
        type: "scatter",
        name: `${query.label} results`,
        marker: { size: 14, color, opacity: 0.78, line: { color: "white", width: 1 } },
        hovertemplate: "%{text}<extra></extra>",
      });
      plotTraces.push({
        x: [query.point[0]],
        y: [query.point[1]],
        text: [queryHover(query)],
        customdata: [null],
        mode: "markers",
        type: "scatter",
        name: query.label,
        marker: { size: 20, color, symbol: "star", line: { color: "white", width: 2 } },
        hovertemplate: "%{text}<extra></extra>",
      });
    });
    return plotTraces;
  }, [activeQueries, data, queryIndexById]);

  const selectedPoint: CorpusPoint | null = useMemo(() => {
    if (!data || !selectedPointId) return null;
    return data.points.find((point) => point.id === selectedPointId) || null;
  }, [data, selectedPointId]);

  if (!data) {
    return (
      <div className="flex h-full min-h-[470px] items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500 shadow-sm">
        The stable profile map will appear when the v2 backend is ready.
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-[470px] flex-col rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Retrieval map</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">Embedding search space</h2>
        <p className="mt-1 text-sm text-slate-600">
          Real 384-dimensional MiniLM embeddings reduced onto one fixed PCA map. Choose a search to see its query star and retrieved chunks.
        </p>
      </div>

      {data.queries.length > 0 && (
        <label className="mb-2 block text-xs font-medium text-slate-700">
          Search shown on map
          <select
            value={mapView}
            onChange={(event) => onMapViewChange(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

      {activeQueries.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-2" aria-label="Visible searches">
          {activeQueries.map((query) => {
            const queryIndex = queryIndexById.get(query.id) ?? 0;
            return (
              <span key={query.id} className="flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[queryIndex % COLORS.length] }} />
                {query.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="min-h-[340px] flex-1">
        <Plot
          data={traces}
          layout={{
            autosize: true,
            height: 390,
            margin: { l: 35, r: 15, t: 15, b: 35 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(248,250,252,0.7)",
            xaxis: { title: "PCA 1", gridcolor: "#e2e8f0", zeroline: false },
            yaxis: { title: "PCA 2", gridcolor: "#e2e8f0", zeroline: false },
            hovermode: "closest",
            hoverlabel: {
              align: "left",
              bgcolor: "#ffffff",
              bordercolor: "#cbd5e1",
              font: { color: "#334155", family: "ui-sans-serif, system-ui", size: 12 },
            },
            legend: { orientation: "h", y: -0.22 },
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
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {selectedPoint ? (
          <PointDetails point={selectedPoint} />
        ) : (
          <p className="text-sm text-slate-500">
            Hover for a short preview. Click any profile or result point to inspect its complete indexed text, coordinates, relationships, source, and media.
          </p>
        )}
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Projection {data.projectionVersion}</p>
    </section>
  );
}

function PointDetails({ point }: { point: CorpusPoint }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{point.category}</p>
          <h3 className="mt-1 font-semibold text-slate-950">{point.title}</h3>
        </div>
        <code className="rounded bg-white px-2 py-1 text-[11px] text-slate-500">
          ({point.x.toFixed(6)}, {point.y.toFixed(6)})
        </code>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{point.text}</p>
      {((point.entities || []).length > 0 || (point.themes || []).length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {[...(point.entities || []), ...(point.themes || [])].map((item) => (
            <span key={item} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600">
              {item}
            </span>
          ))}
        </div>
      )}
      {(point.relatedIds || []).length > 0 && (
        <p className="text-xs text-slate-500">Related records: {(point.relatedIds || []).join(", ")}</p>
      )}
      {(point.media || []).some((item) => item.type === "image") && (
        <div className="grid gap-2 sm:grid-cols-2">
          {(point.media || []).filter((item) => item.type === "image").map((item) => (
            <figure key={item.url} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={item.url} alt={item.alt || item.label} className="h-40 w-full object-cover" />
              <figcaption className="px-3 py-2 text-xs text-slate-500">{item.caption || item.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-xs">
        {point.sourceUrl && (
          <a href={point.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline">
            {point.source}
          </a>
        )}
        {(point.media || []).filter((item) => item.type !== "image").map((item) => (
          <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline">
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
