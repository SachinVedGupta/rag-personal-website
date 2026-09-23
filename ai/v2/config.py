from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os

from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env")


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@dataclass(frozen=True)
class Settings:
    pinecone_api_key: str
    pinecone_index_name: str
    hugging_face_key: str
    openai_api_key: str
    planner_model: str
    answer_model: str
    fallback_model: str
    max_searches: int
    top_k: int
    full_daily_token_budget: int
    mini_daily_token_budget: int
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    namespace: str = "public-profile-v2"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            pinecone_api_key=_required("PINECONE_API_KEY"),
            pinecone_index_name=_required("PINECONE_V2_INDEX_NAME"),
            hugging_face_key=_required("HUGGING_FACE_KEY"),
            openai_api_key=_required("OPENAI_API_KEY"),
            planner_model=os.getenv(
                "OPENAI_PLANNER_MODEL", "gpt-5.4-mini-2026-03-17"
            ),
            answer_model=os.getenv(
                "OPENAI_ANSWER_MODEL", "gpt-5.4-2026-03-05"
            ),
            fallback_model=os.getenv(
                "OPENAI_FALLBACK_MODEL", "gpt-5.4-mini-2026-03-17"
            ),
            max_searches=max(1, min(10, int(os.getenv("RAG_V2_MAX_SEARCHES", "10")))),
            top_k=max(2, min(12, int(os.getenv("RAG_V2_TOP_K", "8")))),
            full_daily_token_budget=max(
                10_000, int(os.getenv("OPENAI_FULL_DAILY_TOKEN_BUDGET", "200000"))
            ),
            mini_daily_token_budget=max(
                50_000, int(os.getenv("OPENAI_MINI_DAILY_TOKEN_BUDGET", "2000000"))
            ),
        )
