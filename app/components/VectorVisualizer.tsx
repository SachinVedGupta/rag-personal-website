"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Type declaration for react-plotly.js
declare module "react-plotly.js" {
  import { Component } from "react";
  interface PlotProps {
    data: any[];
    layout: any;
    config?: any;
    style?: any;
  }
  export default class Plot extends Component<PlotProps> {}
}

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

interface VectorData {
  vectors: number[][];
  texts: string[];
  question?: string;
  questionVector?: number[];
  similarVectors?: number[][];
  similarTexts?: string[];
}

interface VectorVisualizerProps {
  question?: string;
  onQuestionChange?: (question: string) => void;
}

export default function VectorVisualizer({
  question,
  onQuestionChange,
}: VectorVisualizerProps) {
  const [vectorData, setVectorData] = useState<VectorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVectorData = async (inputQuestion?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vector-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: inputQuestion,
          reductionMethod: "PCA",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch vector data");
      }

      const data = await response.json();
      setVectorData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vector data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVectorData(question);
  }, [question]);

  const createVisualization = () => {
    if (!vectorData) return null;

    const {
      vectors,
      texts,
      question: q,
      questionVector,
      similarVectors,
      similarTexts,
    } = vectorData;

    // Create scatter plot for all vectors
    const allVectorsTrace = {
      x: vectors.map((v) => v[0]),
      y: vectors.map((v) => v[1]),
      mode: "markers" as const,
      type: "scatter" as const,
      marker: {
        size: 6,
        color: "#6366f1", // Modern indigo
        opacity: 0.6,
      },
      name: "All Vectors",
      text: texts.map((text) => text.substring(0, 50) + "..."),
      hovertemplate:
        "<b>All Vectors</b><br>" +
        "<b>Text:</b> %{text}<br>" +
        "<b>Position:</b> (%{x:.3f}, %{y:.3f})<extra></extra>",
    };

    const traces: any[] = [allVectorsTrace];

    // Add question vector and search area if available
    if (questionVector && q) {
      // Add search area circle around question vector
      const searchRadius = 0.5; // Adjust based on your vector space scale
      const angles = Array.from(
        { length: 100 },
        (_, i) => (i * 2 * Math.PI) / 100
      );
      const searchAreaX = angles.map(
        (angle) => questionVector[0] + searchRadius * Math.cos(angle)
      );
      const searchAreaY = angles.map(
        (angle) => questionVector[1] + searchRadius * Math.sin(angle)
      );

      traces.push({
        x: searchAreaX,
        y: searchAreaY,
        mode: "lines" as const,
        type: "scatter" as const,
        line: {
          color: "rgba(255, 0, 0, 0.3)",
          width: 2,
        },
        fill: "tonexty",
        fillcolor: "rgba(255, 0, 0, 0.1)",
        name: "Search Area",
        showlegend: true,
        hoverinfo: "skip",
      });

      // Add question vector
      traces.push({
        x: [questionVector[0]],
        y: [questionVector[1]],
        mode: "markers" as const,
        type: "scatter" as const,
        marker: {
          size: 20,
          color: "red",
          symbol: "star" as any,
          line: {
            color: "white",
            width: 2,
          },
        },
        name: "Question",
        text: [q],
        hovertemplate:
          "<b>Question</b><br>" +
          "<b>Text:</b> %{text}<br>" +
          "<b>Position:</b> (%{x:.3f}, %{y:.3f})<extra></extra>",
      });

      // Add similar vectors with enhanced styling
      if (similarVectors && similarTexts) {
        traces.push({
          x: similarVectors.map((v) => v[0]),
          y: similarVectors.map((v) => v[1]),
          mode: "markers" as const,
          type: "scatter" as const,
          marker: {
            size: 12,
            color: "orange",
            symbol: "circle" as any,
            line: {
              color: "white",
              width: 1,
            },
          },
          name: "Similar Embeddings<br>(RAG Results)",
          text: similarTexts.map(
            (text, i) => `(#${i + 1}) ${text.substring(0, 50)}...`
          ),
          hovertemplate:
            "<b>Similar Embeddings (RAG Results)</b><br>" +
            "<b>Text:</b> %{text}<br>" +
            "<b>Position:</b> (%{x:.3f}, %{y:.3f})<extra></extra>",
        });

        // Add connection lines from question to similar vectors
        similarVectors.forEach((similarVector, i) => {
          traces.push({
            x: [questionVector[0], similarVector[0]],
            y: [questionVector[1], similarVector[1]],
            mode: "lines" as const,
            type: "scatter" as const,
            line: {
              color: "rgba(255, 165, 0, 0.6)",
              width: 2,
              dash: "dot",
            },
            showlegend: false,
            hoverinfo: "skip",
          });
        });
      }

      // Add closest vectors in 2D space for comparison
      if (vectors.length > 0) {
        const questionPoint = [questionVector[0], questionVector[1]];
        const distances = vectors.map((vector, i) => ({
          index: i,
          distance: Math.sqrt(
            Math.pow(vector[0] - questionPoint[0], 2) +
              Math.pow(vector[1] - questionPoint[1], 2)
          ),
          text: texts[i],
        }));

        // Get the 5 closest vectors in 2D space
        const closest2D = distances
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);

        traces.push({
          x: closest2D.map((item) => vectors[item.index][0]),
          y: closest2D.map((item) => vectors[item.index][1]),
          mode: "markers" as const,
          type: "scatter" as const,
          marker: {
            size: 10,
            color: "green",
            symbol: "diamond" as any,
            line: {
              color: "white",
              width: 1,
            },
          },
          name: "Closest in 2D",
          text: closest2D.map((item) => `${item.text.substring(0, 50)}...`),
          hovertemplate:
            "<b>Closest in 2D</b><br>" +
            "<b>Text:</b> %{text}<br>" +
            "<b>Position:</b> (%{x:.3f}, %{y:.3f})<extra></extra>",
        });
      }
    }

    return (
      <Plot
        data={traces}
        layout={{
          title: "Vector Space (PCA)",
          xaxis: { title: "PCA 1" },
          yaxis: { title: "PCA 2" },
          height: 400,        // Keep height fixed if you want
          autosize: true,     // Let Plotly resize width automatically
          showlegend: true,
          hovermode: "closest",
          margin: { l: 50, r: 50, t: 50, b: 50 }
        }}
        config={{
          displayModeBar: false,
          responsive: true,   // Key to making it adapt to parent
        }}
        style={{ width: "100%", height: "100%" }}  // Let height be controlled by layout
      />
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Embedding Space Visualization
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Real-time 2D PCA visualization of your question and similar embeddings
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            Loading embedding data...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visualization */}
      {!loading && !error && vectorData && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          {createVisualization()}
        </div>
      )}
    </div>
  );
}
