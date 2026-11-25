import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const backendUrl = (process.env.RAG_V2_BACKEND_URL || "http://127.0.0.1:5001/").replace(
  /\/?$/,
  "/"
);
const unavailable = "The assistant is temporarily unavailable. Please try again shortly.";

async function waitForBackend() {
  // Retry the readiness probe, so a sleeping instance never receives duplicate chat POSTs.
  const deadline = Date.now() + 16_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${backendUrl}v2/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(Math.min(5_000, Math.max(1, deadline - Date.now()))),
      });
      if (response.ok && (await response.json()).status === "ok") return;
      await response.body?.cancel().catch(() => undefined);
    } catch {
      // Koyeb may still be waking or replacing the instance.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("RAG backend did not become ready");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 2_000) {
    return NextResponse.json(
      { status: "error", message: question ? "Question is too long" : "Question required" },
      { status: 400 }
    );
  }

  try {
    await waitForBackend();
    const response = await fetch(`${backendUrl}v2/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history: body.history }),
      cache: "no-store",
      signal: AbortSignal.timeout(41_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`RAG backend returned HTTP ${response.status}`);
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("RAG v2 ask proxy failed", error);
    return NextResponse.json({ status: "error", message: unavailable }, { status: 502 });
  }
}
