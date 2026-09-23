import { NextResponse } from "next/server";

export const maxDuration = 60;

const backendUrl = (process.env.RAG_V2_BACKEND_URL || "http://127.0.0.1:5001/").replace(
  /\/?$/,
  "/"
);

export async function GET() {
  try {
    const response = await fetch(`${backendUrl}v2/vector-data`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("RAG v2 vector proxy failed", error);
    return NextResponse.json(
      { status: "error", message: "The RAG v2 backend is unavailable." },
      { status: 502 }
    );
  }
}
