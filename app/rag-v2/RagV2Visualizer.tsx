"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { CorpusPoint, VisualizationData } from "./types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];

export default function RagV2Visualizer({ data }: { data: VisualizationData | null }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const activeQueries = useMemo(() => {
    if (!data) return [];
    return data.queries.filter((query) => selected[query.id] !== false);
  }, [data, selected]);

  const traces = useMemo(() => {
    if (!data) return [];
    const pointById = new Map(data.points.map((point) => [point.id, point]));
    const plotTraces: any[] = [
      {
        x: data.points.map((point) => point.x),
        y: data.points.map((point) => point.y),
        text: data.points.map(
          (point) =>
            `<b>${point.title}</b><br>${point.category}<br>PCA: (${point.x.toFixed(4)}, ${point.y.toFixed(4)})<br>${(point.text || "").slice(0, 180)}…`,
        ),
        customdata: data.points.map((point) => point.id),
        mode: "markers",
        type: "scatter",
        name: "Profile knowledge",
        marker: { size: 8, color: "#94a3b8", opacity: 0.55 },
        hovertemplate: "%{text}<extra></extra>",
      },
    ];

    activeQueries.forEach((query, index) => {
      const color = COLORS[index % COLORS.length];
      const hitPoints = query.hitIds
        .map((id) => pointById.get(id))
        .filter(Boolean) as NonNullable<ReturnType<typeof pointById.get>>[];
      plotTraces.push({
        x: hitPoints.map((point) => point.x),
        y: hitPoints.map((point) => point.y),
        text: hitPoints.map(
          (point) =>
            `<b>${point.title}</b><br>PCA: (${point.x.toFixed(4)}, ${point.y.toFixed(4)})<br>${(point.text || "").slice(0, 180)}…`,
        ),
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
        text: [query.query],
        customdata: [null],
        mode: "markers",
        type: "scatter",
        name: query.label,
        marker: { size: 20, color, symbol: "star", line: { color: "white", width: 2 } },
        hovertemplate: `<b>${query.label}</b><br>%{text}<extra></extra>`,
      });
    });
    return plotTraces;
  }, [activeQueries, data]);

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
          Real 384-dimensional MiniLM embeddings reduced onto one fixed PCA map. Hover for a preview or click a point to inspect its complete indexed chunk.
        </p>
      </div>

      {data.queries.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {data.queries.map((query, index) => {
            const checked = selected[query.id] !== false;
            return (
              <label
                key={query.id}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    setSelected((current) => ({ ...current, [query.id]: event.target.checked }))
                  }
                  className="h-3.5 w-3.5"
                />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                {query.label}
              </label>
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
            legend: { orientation: "h", y: -0.22 },
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
            Click any profile or result point to inspect its exact indexed text, PCA coordinates, entities, relationships, source, and media.
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
