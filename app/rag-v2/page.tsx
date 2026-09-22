"use client";

import { FormEvent, useEffect, useState } from "react";
import RagV2Visualizer from "./RagV2Visualizer";
import SafeMarkdown from "./SafeMarkdown";
import type { AskResponse, VisualizationData } from "./types";

type ChatMessage = { role: "user" | "assistant"; text: string };
const CHAT_STORAGE_KEY = "rag-v2-chat-history";

const SUGGESTED_PROMPTS = [
  "What did I build at Microsoft?",
  "How does my AI-agent experience connect across internships and projects?",
  "What's my favourite project and why?",
  "Show me a photo from a winning project.",
];

export default function RagV2Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);

  useEffect(() => {
    fetch("/api/v2/vector-data", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("RAG v2 is not ready yet.");
        return response.json();
      })
      .then((data) => setVisualization(data))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "RAG v2 is unavailable."));
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
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-24)));
  }, [historyLoaded, messages]);

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
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Private preview · RAG v2</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Ask across the full story</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              An adaptive agent searches experience, projects, leadership, and skills from several angles, then answers from the combined evidence.
            </p>
          </div>
          {result && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
              {result.retrieval.searchCount} of {result.retrieval.maxSearches} searches used
              <br />Answer: {result.models.answer}
              <br />Full-model local budget: {result.complimentaryBudget.fullUsed.toLocaleString()} / {result.complimentaryBudget.fullLimit.toLocaleString()}
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="flex min-h-[570px] flex-col rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-semibold">AI portfolio conversation</h2>
                <p className="mt-1 text-xs text-slate-500">Grounded in a public-safe, source-labelled profile corpus.</p>
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
              {loading && <p className="text-sm text-blue-600">Planning searches and checking evidence…</p>}
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </div>
            <form onSubmit={submit} className="border-t border-slate-200 p-4">
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  disabled={loading}
                  placeholder="Ask about Sachin's work, skills, or projects…"
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
            <RagV2Visualizer data={visualization} />
            {result && (
              <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h2 className="font-semibold">What the agent searched</h2>
                {result.contextUsed &&
                  result.resolvedQuestion &&
                  result.resolvedQuestion.trim().toLocaleLowerCase() !== result.question.trim().toLocaleLowerCase() && (
                    <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">
                      Understood your follow-up as: {result.resolvedQuestion}
                    </p>
                  )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {result.retrieval.queries.map((query) => (
                    <article key={query.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{query.label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{query.query}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{query.rationale}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Query PCA: ({query.point[0].toFixed(6)}, {query.point[1].toFixed(6)})
                      </p>
                      <details className="mt-3 rounded-lg border border-slate-200 bg-white p-2">
                        <summary className="cursor-pointer text-xs font-medium text-slate-700">
                          Inspect {query.hits.length} retrieved chunks
                        </summary>
                        <div className="mt-3 space-y-3">
                          {query.hits.map((hit, rank) => (
                            <article key={hit.id} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-900">{rank + 1}. {hit.title}</p>
                                <code className="text-[10px] text-slate-400">score {hit.score.toFixed(4)}</code>
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{hit.text || hit.snippet}</p>
                              {hit.sourceUrl && (
                                <a href={hit.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-700 underline">
                                  {hit.source}
                                </a>
                              )}
                            </article>
                          ))}
                        </div>
                      </details>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
