"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import RagV2Visualizer, { ALL_SEARCHES } from "./RagV2Visualizer";
import SafeMarkdown from "./SafeMarkdown";
import type { AskResponse, VisualizationData } from "./types";

type ChatMessage = { role: "user" | "assistant"; text: string };
const SUGGESTED_PROMPTS = [
  "What did I build at Microsoft?",
  "How does my AI-agent experience connect across internships and projects?",
  "What's my favourite project and why?",
  "Show me a photo of my McMaster Rocketry payload project.",
];

export default function RagV2Page({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);
  const [mapView, setMapView] = useState(ALL_SEARCHES);
  const profileVisualization = useRef<VisualizationData | null>(null);
  const hasActiveSearch = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.removeItem("rag-v2-chat-history-v3");
      window.localStorage.removeItem("rag-v2-latest-result-v3");
    } catch {
      // The chat starts fresh in memory even when browser storage is unavailable.
    }
    fetch("/api/v2/vector-data", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("The assistant is temporarily unavailable.");
        return response.json();
      })
      .then((data) => {
        profileVisualization.current = data;
        if (!hasActiveSearch.current) setVisualization(data);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "The assistant is temporarily unavailable."));
  }, []);

  async function sendQuestion(value: string) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    const history = messages.slice(-12);
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);
    setError("");
    setResult(null);
    hasActiveSearch.current = true;
    setVisualization(profileVisualization.current);
    setMapView(ALL_SEARCHES);
    try {
      const response = await fetch("/api/v2/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history }),
      });
      const data = (await response.json()) as AskResponse;
      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "The question could not be answered.");
      }
      setResult(data);
      setVisualization(data.visualization);
      setMapView(ALL_SEARCHES);
      setMessages((current) => [...current, { role: "assistant", text: data.answer }]);
    } catch (reason) {
      hasActiveSearch.current = false;
      setVisualization(profileVisualization.current);
      setError(reason instanceof Error ? reason.message : "The question could not be answered.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendQuestion(question);
  }

  function startNewChat() {
    setMessages([]);
    setResult(null);
    setQuestion("");
    setError("");
    setMapView(ALL_SEARCHES);
    hasActiveSearch.current = false;
    setVisualization(profileVisualization.current);
  }

  return (
    <div className={embedded ? "text-slate-100" : "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8 text-slate-900"}>
      <div className="mx-auto max-w-7xl">
        {!embedded && (
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Ask about my work
            </h1>
          </header>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className={`flex h-[min(78vh,760px)] min-h-[560px] flex-col overflow-hidden rounded-2xl border shadow-sm ${embedded ? "border-blue-800/80 bg-[#091b32]/90" : "border-slate-200 bg-white/90"}`}>
            <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${embedded ? "border-blue-800/80" : "border-slate-200"}`}>
              <div>
                <h2 className={`font-semibold ${embedded ? "text-white" : "text-slate-900"}`}>AI Persona</h2>
                <p className={`mt-1 text-sm ${embedded ? "text-blue-100/80" : "text-slate-500"}`}>
                  Ask me anything about my{" "}
                  <button type="button" onClick={() => setQuestion("Tell me about my experience")} className={`font-semibold underline decoration-blue-400/70 underline-offset-2 ${embedded ? "text-blue-300 hover:text-white" : "text-blue-700 hover:text-blue-900"}`}>experience</button>,{" "}
                  <button type="button" onClick={() => setQuestion("What are my skills?")} className={`font-semibold underline decoration-blue-400/70 underline-offset-2 ${embedded ? "text-blue-300 hover:text-white" : "text-blue-700 hover:text-blue-900"}`}>skills</button>, or{" "}
                  <button type="button" onClick={() => setQuestion("What are my favourite projects?")} className={`font-semibold underline decoration-blue-400/70 underline-offset-2 ${embedded ? "text-blue-300 hover:text-white" : "text-blue-700 hover:text-blue-900"}`}>projects</button>
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={loading}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${embedded ? "border-blue-700 bg-blue-950 text-blue-100 hover:border-blue-400 hover:text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}
                >
                  New chat
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
              {messages.length === 0 && (
                <div className={`rounded-xl p-4 ${embedded ? "bg-blue-950/60" : "bg-slate-50"}`}>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendQuestion(prompt)}
                        className={`rounded-full border px-3 py-1.5 text-left text-xs transition ${embedded ? "border-blue-800 bg-[#0c2747] text-blue-100 hover:border-blue-400 hover:text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"}`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : embedded ? "border border-blue-800 bg-blue-950/70 text-blue-50" : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <SafeMarkdown text={message.text} darkTheme={embedded} />
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
              {loading && <p className={`text-sm ${embedded ? "text-blue-200" : "text-blue-600"}`}>Finding the most relevant details…</p>}
              {error && <p className={`rounded-xl p-3 text-sm ${embedded ? "bg-red-950/70 text-red-200" : "bg-red-50 text-red-700"}`}>{error}</p>}
            </div>
            <form onSubmit={submit} className={`border-t p-4 ${embedded ? "border-blue-800/80" : "border-slate-200"}`}>
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  disabled={loading}
                  placeholder="Ask me anything about my portfolio…"
                  className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition disabled:opacity-60 ${embedded ? "border-blue-700 bg-[#061426] text-white placeholder:text-blue-200/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-900" : "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ask
                </button>
              </div>
            </form>
          </section>

          <div className="space-y-4">
              <RagV2Visualizer
                data={visualization}
                mapView={mapView}
                onMapViewChange={setMapView}
                darkTheme={embedded}
              />
            {result && (
              <details className={`group rounded-2xl border p-5 shadow-sm ${embedded ? "border-blue-800/80 bg-[#091b32]/90" : "border-slate-200 bg-white/90"}`}>
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:hidden ${embedded ? "text-white" : "text-slate-900"}`}>
                  <span>Search details <span className={`ml-1 text-xs font-normal ${embedded ? "text-blue-200/70" : "text-slate-500"}`}>{result.retrieval.queries.length} searches · {result.retrieval.queries.reduce((total, query) => total + query.hits.length, 0)} results</span></span>
                  <span aria-hidden="true" className={`transition-transform group-open:rotate-180 ${embedded ? "text-blue-200/70" : "text-slate-400"}`}>⌄</span>
                </summary>
                {result.contextUsed &&
                  result.resolvedQuestion &&
                  result.resolvedQuestion.trim().toLocaleLowerCase() !== result.question.trim().toLocaleLowerCase() && (
                    <p className={`mt-2 rounded-lg border px-3 py-2 text-xs leading-5 ${embedded ? "border-blue-800 bg-blue-950 text-blue-100" : "border-blue-100 bg-blue-50 text-blue-900"}`}>
                      Understood your follow-up as: {result.resolvedQuestion}
                    </p>
                  )}
                <div className="mt-3 space-y-3">
                  {result.retrieval.queries.map((query, queryIndex) => (
                    <details
                      key={query.id}
                      className={`group rounded-xl border ${embedded ? "border-blue-900 bg-[#07182c] open:border-blue-500 open:bg-blue-950/70" : "border-slate-200 bg-slate-50 open:border-blue-200 open:bg-blue-50/40"}`}
                      onToggle={(event) => {
                        if (event.currentTarget.open) setMapView(query.id);
                      }}
                    >
                      <summary className="cursor-pointer list-none p-3 marker:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                              Search {queryIndex + 1} · {query.label}
                            </p>
                            <p className={`mt-1 text-sm font-medium ${embedded ? "text-blue-50" : "text-slate-900"}`}>{query.query}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full border px-2 py-1 text-[11px] ${embedded ? "border-blue-800 bg-blue-950 text-blue-100/70" : "border-slate-200 bg-white text-slate-500"}`}>
                              {query.hits.length} results
                            </span>
                          <span aria-hidden="true" className={`transition-transform group-open:rotate-180 ${embedded ? "text-blue-200/70" : "text-slate-400"}`}>⌄</span>
                          </div>
                        </div>
                        <p className={`mt-2 text-[11px] group-open:hidden ${embedded ? "text-blue-200/60" : "text-slate-500"}`}>
                          Open to inspect this search and focus it on the map
                        </p>
                      </summary>
                      <div className={`border-t px-3 pb-3 pt-3 ${embedded ? "border-blue-800" : "border-blue-100"}`}>
                        <p className={`text-xs leading-5 ${embedded ? "text-blue-100/80" : "text-slate-600"}`}>{query.rationale}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          Query PCA: ({query.point[0].toFixed(6)}, {query.point[1].toFixed(6)})
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setMapView(query.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                          >
                            Show this search on map
                          </button>
                          <button
                            type="button"
                            onClick={() => setMapView(ALL_SEARCHES)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${embedded ? "border-blue-700 bg-[#0b2341] text-blue-100 hover:border-blue-400 hover:text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}
                          >
                            Compare all searches
                          </button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {query.hits.map((hit, rank) => (
                          <details key={hit.id} className={`rounded-lg border p-2.5 ${embedded ? "border-blue-800 bg-[#0a2039]" : "border-slate-200 bg-white"}`}>
                              <summary className={`cursor-pointer text-xs ${embedded ? "text-blue-100" : "text-slate-700"}`}>
                                <span className={`font-semibold ${embedded ? "text-white" : "text-slate-900"}`}>{rank + 1}. {hit.title}</span>
                                <span className={`ml-2 text-[10px] ${embedded ? "text-blue-200/85" : "text-slate-600"}`}>score {hit.score.toFixed(4)}</span>
                              </summary>
                              <p className={`mt-2 whitespace-pre-wrap text-xs leading-5 ${embedded ? "text-blue-50/95" : "text-slate-700"}`}>{hit.text || hit.snippet}</p>
                              {(hit.media || []).filter((item) => item.type !== "image").map((item) => (
                                <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className={`mt-2 mr-2 inline-flex rounded-md border px-2 py-1 text-xs font-semibold underline underline-offset-2 transition ${embedded ? "border-blue-600/70 bg-blue-900/50 text-sky-200 hover:border-blue-300 hover:bg-blue-800/70 hover:text-white" : "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-400 hover:bg-blue-100"}`}>
                                  {item.label}
                                </a>
                              ))}
                            </details>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
