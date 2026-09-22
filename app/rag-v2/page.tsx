"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import RagV2Visualizer, { ALL_SEARCHES } from "./RagV2Visualizer";
import SafeMarkdown from "./SafeMarkdown";
import type { AskResponse, VisualizationData } from "./types";

type ChatMessage = { role: "user" | "assistant"; text: string };
const CHAT_STORAGE_KEY = "rag-v2-chat-history-v3";
const RESULT_STORAGE_KEY = "rag-v2-latest-result-v3";

const SUGGESTED_PROMPTS = [
  "What did I build at Microsoft?",
  "How does my AI-agent experience connect across internships and projects?",
  "What's my favourite project and why?",
  "Show me a photo from a winning project.",
];

export default function RagV2Page({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);
  const [mapView, setMapView] = useState(ALL_SEARCHES);
  const freshProjectionVersion = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/v2/vector-data", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("The assistant is temporarily unavailable.");
        return response.json();
      })
      .then((data) => {
        freshProjectionVersion.current = data.projectionVersion;
        setVisualization(data);
        setResult((current) =>
          current?.visualization.projectionVersion === data.projectionVersion ? current : null,
        );
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "The assistant is temporarily unavailable."));
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(
            parsed
              .filter(
                (item): item is ChatMessage =>
                  item &&
                  (item.role === "user" || item.role === "assistant") &&
                  typeof item.text === "string",
              )
              .slice(-24),
          );
        }
      }
      const savedResult = window.localStorage.getItem(RESULT_STORAGE_KEY);
      if (savedResult) {
        const parsedResult = JSON.parse(savedResult) as AskResponse;
        if (
          parsedResult?.status === "success" &&
          parsedResult.visualization &&
          (!freshProjectionVersion.current ||
            parsedResult.visualization.projectionVersion === freshProjectionVersion.current)
        ) {
          setResult(parsedResult);
          setVisualization(parsedResult.visualization);
        }
      }
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      window.localStorage.removeItem(RESULT_STORAGE_KEY);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-24)));
  }, [historyLoaded, messages]);

  useEffect(() => {
    if (!historyLoaded) return;
    if (result) {
      window.localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
    } else {
      window.localStorage.removeItem(RESULT_STORAGE_KEY);
    }
  }, [historyLoaded, result]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    const history = messages.slice(-12);
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);
    setError("");
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
      setError(reason instanceof Error ? reason.message : "The question could not be answered.");
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setResult(null);
    setQuestion("");
    setError("");
    setMapView(ALL_SEARCHES);
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
    window.localStorage.removeItem(RESULT_STORAGE_KEY);
  }

  return (
    <div className={embedded ? "text-slate-900" : "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8 text-slate-900"}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">AI portfolio assistant</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Ask about my work</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Ask about my experience, projects, or the ideas that connect them. I’ll find the relevant details and share public links when available.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="flex min-h-[570px] flex-col rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-semibold">Chat with me</h2>
                <p className="mt-1 text-xs text-slate-500">Ask about my experience, projects, and interests.</p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={loading}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
                >
                  New chat
                </button>
              )}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-600">Try a factual, cross-experience, personal, or media question:</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setQuestion(prompt)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
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
                        : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <SafeMarkdown text={message.text} />
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
              {loading && <p className="text-sm text-blue-600">Finding the most relevant details…</p>}
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </div>
            <form onSubmit={submit} className="border-t border-slate-200 p-4">
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  disabled={loading}
                  placeholder="Ask about my experience, projects, or skills…"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
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
            />
            {result && (
              <details className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:hidden">
                  <span>Search details <span className="ml-1 text-xs font-normal text-slate-500">{result.retrieval.queries.length} searches · {result.retrieval.queries.reduce((total, query) => total + query.hits.length, 0)} results</span></span>
                  <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                {result.contextUsed &&
                  result.resolvedQuestion &&
                  result.resolvedQuestion.trim().toLocaleLowerCase() !== result.question.trim().toLocaleLowerCase() && (
                    <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">
                      Understood your follow-up as: {result.resolvedQuestion}
                    </p>
                  )}
                <div className="mt-3 space-y-3">
                  {result.retrieval.queries.map((query, queryIndex) => (
                    <details
                      key={query.id}
                      className="group rounded-xl border border-slate-200 bg-slate-50 open:border-blue-200 open:bg-blue-50/40"
                      onToggle={(event) => {
                        if (event.currentTarget.open) setMapView(query.id);
                      }}
                    >
                      <summary className="cursor-pointer list-none p-3 marker:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                              Search {queryIndex + 1} · {query.label}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{query.query}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500">
                              {query.hits.length} results
                            </span>
                            <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500 group-open:hidden">
                          Open to inspect this search and focus it on the map
                        </p>
                      </summary>
                      <div className="border-t border-blue-100 px-3 pb-3 pt-3">
                        <p className="text-xs leading-5 text-slate-600">{query.rationale}</p>
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
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                          >
                            Compare all searches
                          </button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {query.hits.map((hit, rank) => (
                            <details key={hit.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                              <summary className="cursor-pointer text-xs text-slate-700">
                                <span className="font-semibold text-slate-900">{rank + 1}. {hit.title}</span>
                                <span className="ml-2 text-[10px] text-slate-400">score {hit.score.toFixed(4)}</span>
                              </summary>
                              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{hit.text || hit.snippet}</p>
                              {(hit.media || []).filter((item) => item.type !== "image").map((item) => (
                                <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 mr-3 inline-block text-xs font-medium text-blue-700 underline">
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
