"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { VisualizationData } from "./types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];

export default function RagV2Visualizer({ data }: { data: VisualizationData | null }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

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
        text: data.points.map((point) => `${point.title}<br>${point.category}`),
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
        text: hitPoints.map((point) => point.title),
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
        mode: "markers",
        type: "scatter",
        name: query.label,
        marker: { size: 20, color, symbol: "star", line: { color: "white", width: 2 } },
        hovertemplate: `<b>${query.label}</b><br>%{text}<extra></extra>`,
      });
    });
    return plotTraces;
  }, [activeQueries, data]);

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
          One fixed PCA map, with every agent search overlaid for comparison.
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
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Projection {data.projectionVersion}</p>
    </section>
  );
}
