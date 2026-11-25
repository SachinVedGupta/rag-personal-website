from __future__ import annotations

from functools import lru_cache
import os
from pathlib import Path
from threading import Lock

from flask import Flask, jsonify, request
from flask_cors import CORS

from .agent import RagAgent
from .config import Settings
from .projection import Projection


app = Flask(__name__)
CORS(app)

_agent: RagAgent | None = None
_agent_lock = Lock()


def normalize_history(value: object) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []
    normalized: list[dict[str, str]] = []
    remaining_chars = 10_000
    for item in reversed(value[-12:]):
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        text = item.get("text", item.get("content", ""))
        if role not in {"user", "assistant"} or not isinstance(text, str):
            continue
        text = text.strip()
        if not text or remaining_chars <= 0:
            continue
        text = text[: min(1_500, remaining_chars)]
        remaining_chars -= len(text)
        normalized.append({"role": role, "text": text})
    normalized.reverse()
    return normalized


def get_agent() -> RagAgent:
    global _agent
    if _agent is None:
        with _agent_lock:
            if _agent is None:
                _agent = RagAgent(Settings.from_env())
    return _agent


@app.get("/v2/health")
def health():
    try:
        settings = get_agent().settings
        return jsonify(
            {
                "status": "ok",
                "service": "rag-v2",
                "index": settings.pinecone_index_name,
                "plannerModel": settings.planner_model,
                "answerModel": settings.answer_model,
            }
        )
    except Exception:
        app.logger.exception("RAG v2 could not initialize")
        return jsonify({"status": "error", "message": "The assistant is temporarily unavailable."}), 503


@app.post("/v2/ask")
def ask():
    payload = request.get_json(silent=True)
    raw_question = payload.get("question") if isinstance(payload, dict) else None
    question = raw_question.strip() if isinstance(raw_question, str) else ""
    if not question:
        return jsonify({"status": "error", "message": "Question required"}), 400
    if len(question) > 2000:
        return jsonify({"status": "error", "message": "Question is too long"}), 400
    history = normalize_history(payload.get("history"))
    try:
        return jsonify(get_agent().ask(question, history))
    except Exception:
        app.logger.exception("RAG v2 request failed")
        return jsonify({"status": "error", "message": "The assistant is temporarily unavailable. Please try again shortly."}), 502


@lru_cache(maxsize=1)
def profile_projection() -> Projection:
    return Projection(Path(__file__).with_name("data") / "projection.json")


@app.get("/v2/vector-data")
def vector_data():
    try:
        projection = profile_projection()
        return jsonify(
            status="success",
            method="PCA",
            projectionVersion=projection.version,
            points=projection.public_points(),
            queries=[],
        )
    except Exception:
        app.logger.exception("RAG v2 visualization failed")
        return jsonify({"status": "error", "message": "The visualization is temporarily unavailable."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("RAG_V2_PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=False)
