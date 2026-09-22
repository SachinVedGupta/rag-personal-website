import { NextRequest, NextResponse } from "next/server";

const backendUrl = (process.env.RAG_V2_BACKEND_URL || "http://127.0.0.1:5001/").replace(
  /\/?$/,
  "/"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${backendUrl}v2/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: body.question, history: body.history }),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("RAG v2 ask proxy failed", error);
    return NextResponse.json(
      { status: "error", message: "The RAG v2 backend is unavailable." },
      { status: 502 }
    );
  }
}
