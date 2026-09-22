from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any

from .budget import ComplimentaryBudget
from .config import Settings
from .embeddings import EmbeddingClient
from .openai_client import OpenAIError, OpenAIResponsesClient
from .projection import Projection
from .store import SearchHit, VectorStore


QUERY_ITEM_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "label": {"type": "string"},
        "query": {"type": "string"},
        "rationale": {"type": "string"},
    },
    "required": ["label", "query", "rationale"],
    "additionalProperties": False,
}

PLAN_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "queries": {
            "type": "array",
            "items": QUERY_ITEM_SCHEMA,
            "minItems": 1,
            "maxItems": 4,
        }
    },
    "required": ["queries"],
    "additionalProperties": False,
}

COVERAGE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "enough": {"type": "boolean"},
        "missing": {"type": "string"},
        "follow_up_queries": {
            "type": "array",
            "items": QUERY_ITEM_SCHEMA,
            "maxItems": 3,
        },
    },
    "required": ["enough", "missing", "follow_up_queries"],
    "additionalProperties": False,
}


@dataclass
class PlannedQuery:
    id: str
    label: str
    query: str
    rationale: str


class RagAgent:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        budget_path = Path(__file__).with_name("data") / "usage-local.json"
        self.budget = ComplimentaryBudget(
            budget_path,
            settings.full_daily_token_budget,
            settings.mini_daily_token_budget,
        )
        self.openai = OpenAIResponsesClient(
            settings.openai_api_key, on_usage=self.budget.record
        )
        self.embeddings = EmbeddingClient(
            settings.embedding_model, settings.hugging_face_key
        )
        self.store = VectorStore(
            settings.pinecone_api_key,
            settings.pinecone_index_name,
            settings.namespace,
        )
        self.store.ensure_index(settings.embedding_dimension)
        projection_path = Path(__file__).with_name("data") / "projection.json"
        if not projection_path.exists():
            raise RuntimeError("Missing v2 projection; run ai/v2/ingest.py")
        self.projection = Projection(projection_path)

    def _plan(self, question: str) -> list[PlannedQuery]:
        instructions = (
            "Plan semantic searches over a public career portfolio. The data contains "
            "experience, projects, leadership, skills, education, achievements, and "
            "relationships between them. Break compound or thematic questions into a "
            "small set of complementary searches. Prefer 1 query for a narrow factual "
            "question and 2-4 for broad synthesis. A question that names one company or "
            "project and asks what was built must use exactly one precise query. Do not "
            "create paraphrase variations of the same search. For a request to show media, "
            "search for the most relevant project or experience plus its photo, demo, or "
            "document in one query whenever possible. Do not answer the question."
        )
        if not self.budget.can_spend("mini", 6_000):
            return [PlannedQuery("q1", "Main question", question, "Direct search")]
        try:
            payload = self.openai.structured(
                model=self.settings.planner_model,
                instructions=instructions,
                input_text=question,
                schema_name="retrieval_plan",
                schema=PLAN_SCHEMA,
                max_output_tokens=900,
            )
            raw_queries = payload["queries"]
        except (OpenAIError, KeyError, TypeError, ValueError, json.JSONDecodeError):
            raw_queries = [
                {
                    "label": "Main question",
                    "query": question,
                    "rationale": "Direct semantic search fallback",
                }
            ]
        planned: list[PlannedQuery] = []
        seen: set[str] = set()
        for item in raw_queries[:4]:
            query = str(item.get("query", "")).strip()
            if not query or query.casefold() in seen:
                continue
            seen.add(query.casefold())
            planned.append(
                PlannedQuery(
                    id=f"q{len(planned) + 1}",
                    label=str(item.get("label", "Search")).replace("_", " ").strip()[:60],
                    query=query[:500],
                    rationale=str(item.get("rationale", "")).strip()[:240],
                )
            )
        return planned or [PlannedQuery("q1", "Main question", question, "Direct search")]

    def _coverage(
        self,
        question: str,
        queries: list[PlannedQuery],
        hits: list[SearchHit],
        remaining: int,
    ) -> list[PlannedQuery]:
        if remaining <= 0:
            return []
        if not self.budget.can_spend("mini", 8_000):
            return []
        evidence = [
            {
                "title": hit.metadata.get("title", hit.id),
                "category": hit.metadata.get("category", ""),
                "snippet": hit.text[:500],
                "media": hit.public().get("media", []),
            }
            for hit in hits[:14]
        ]
        input_text = json.dumps(
            {
                "question": question,
                "searches_run": [query.query for query in queries],
                "candidate_evidence": evidence,
                "remaining_search_budget": remaining,
            },
            ensure_ascii=False,
        )
        try:
            result = self.openai.structured(
                model=self.settings.planner_model,
                instructions=(
                    "Judge whether the retrieved career-profile evidence covers every "
                    "important part of the user's question. If it does, return enough=true "
                    "and no follow-up queries. If it does not, propose only distinct semantic "
                    "searches that target specific missing evidence. For a narrow question, a "
                    "substantive source whose title directly matches the named company or project "
                    "is sufficient; do not request paraphrases or more detail already present in "
                    "that source. For a media request, a relevant result with a supplied media item "
                    "is sufficient. Do not search separately for every possible project once one "
                    "good matching media item is available. Do not answer the question."
                ),
                input_text=input_text,
                schema_name="retrieval_coverage",
                schema=COVERAGE_SCHEMA,
                max_output_tokens=900,
            )
        except (OpenAIError, KeyError, TypeError, ValueError, json.JSONDecodeError):
            return []
        if result.get("enough"):
            return []
        existing = {query.query.casefold() for query in queries}
        follow_ups: list[PlannedQuery] = []
        for item in result.get("follow_up_queries", [])[:remaining]:
            query = str(item.get("query", "")).strip()
            if not query or query.casefold() in existing:
                continue
            existing.add(query.casefold())
            follow_ups.append(
                PlannedQuery(
                    id=f"q{len(queries) + len(follow_ups) + 1}",
                    label=str(item.get("label", "Follow-up")).replace("_", " ").strip()[:60],
                    query=query[:500],
                    rationale=str(item.get("rationale", result.get("missing", ""))).strip()[:240],
                )
            )
        return follow_ups

    @staticmethod
    def _rank_hits(hit_map: dict[str, dict[str, Any]]) -> list[SearchHit]:
        ranked = sorted(
            hit_map.values(),
            key=lambda item: (len(item["query_ids"]), item["hit"].score),
            reverse=True,
        )
        return [item["hit"] for item in ranked]

    def _answer(self, question: str, hits: list[SearchHit]) -> tuple[str, str]:
        evidence = []
        for index, hit in enumerate(hits[:16], start=1):
            media = hit.public().get("media", [])
            evidence.append(
                f"[{index}] {hit.metadata.get('title', hit.id)}\n"
                f"Category: {hit.metadata.get('category', '')}\n"
                f"Source: {hit.metadata.get('source_name', '')}\n"
                f"URL: {hit.metadata.get('source_url', '')}\n"
                f"Media: {json.dumps(media, ensure_ascii=False)}\n"
                f"Evidence: {hit.text}"
            )
        instructions = (
            "You are Sachin Ved Gupta's portfolio assistant and speak naturally in first person "
            "as Sachin. Treat the curated profile evidence as the authoritative source of truth. "
            "State its facts and metrics directly and confidently. Never expose editorial notes "
            "about confidence, verification, self-reporting, missing denominators, unresolved "
            "measurements, evidence quality, or internal source limitations. Do not invent facts "
            "that are absent from the evidence. For subjective questions such as a favourite "
            "project, make a clear, natural choice based on the profile's themes and explain it; "
            "do not claim that you lack preferences. Synthesize connections across experiences "
            "and projects when the question asks for a theme. Be concise, specific, and warm. "
            "Use Markdown. End factual paragraphs with one or more citations written exactly "
            "as [Source: evidence title](supplied URL). When the user asks to see a photo, image, "
            "demo, document, or other media, include the most relevant supplied media using "
            "![descriptive alt text](image URL) for images or [descriptive label](URL) for other "
            "media. Never construct or guess a media URL."
        )
        input_text = f"Question:\n{question}\n\nEvidence:\n" + "\n\n".join(evidence)
        use_full = self.budget.can_spend("full", 12_000)
        selected_model = self.settings.answer_model if use_full else self.settings.fallback_model
        selected_effort = "medium" if use_full else "low"
        selected_limit = 1800 if use_full else 1600
        if not use_full and not self.budget.can_spend("mini", 12_000):
            raise OpenAIError(
                "The local complimentary-token budget is exhausted for today."
            )
        try:
            return (
                self.openai.text(
                    model=selected_model,
                    instructions=instructions,
                    input_text=input_text,
                    max_output_tokens=selected_limit,
                    reasoning_effort=selected_effort,
                ),
                selected_model,
            )
        except OpenAIError:
            if selected_model == self.settings.fallback_model:
                raise
            if not self.budget.can_spend("mini", 12_000):
                raise
            return (
                self.openai.text(
                    model=self.settings.fallback_model,
                    instructions=instructions,
                    input_text=input_text,
                    max_output_tokens=1600,
                    reasoning_effort="low",
                ),
                self.settings.fallback_model,
            )

    def ask(self, question: str) -> dict[str, Any]:
        queries = self._plan(question)
        query_vectors: dict[str, list[float]] = {}
        query_hits: dict[str, list[SearchHit]] = {}
        hit_map: dict[str, dict[str, Any]] = {}

        def run(batch: list[PlannedQuery]) -> None:
            for planned in batch:
                vector = self.embeddings.query(planned.query)
                hits = self.store.search(vector, self.settings.top_k)
                query_vectors[planned.id] = vector
                query_hits[planned.id] = hits
                for hit in hits:
                    entry = hit_map.setdefault(hit.id, {"hit": hit, "query_ids": []})
                    entry["query_ids"].append(planned.id)
                    if hit.score > entry["hit"].score:
                        entry["hit"] = hit

        run(queries)
        while len(queries) < self.settings.max_searches:
            ranked = self._rank_hits(hit_map)
            follow_ups = self._coverage(
                question,
                queries,
                ranked,
                self.settings.max_searches - len(queries),
            )
            if not follow_ups:
                break
            follow_ups = follow_ups[: self.settings.max_searches - len(queries)]
            queries.extend(follow_ups)
            run(follow_ups)
            # One adaptive follow-up round keeps latency and token use predictable.
            break

        ranked_hits = self._rank_hits(hit_map)
        answer, answer_model = self._answer(question, ranked_hits)
        traces = []
        for planned in queries:
            hits = query_hits[planned.id]
            traces.append(
                {
                    "id": planned.id,
                    "label": planned.label,
                    "query": planned.query,
                    "rationale": planned.rationale,
                    "point": self.projection.transform(query_vectors[planned.id]),
                    "hitIds": [hit.id for hit in hits],
                    "hits": [hit.public() for hit in hits],
                }
            )
        return {
            "status": "success",
            "question": question,
            "answer": answer,
            "models": {
                "planner": self.settings.planner_model,
                "answer": answer_model,
                "embedding": self.settings.embedding_model,
            },
            "complimentaryBudget": self.budget.snapshot(),
            "retrieval": {
                "searchCount": len(queries),
                "maxSearches": self.settings.max_searches,
                "queries": traces,
                "evidence": [hit.public() for hit in ranked_hits[:16]],
            },
            "visualization": {
                "method": "PCA",
                "projectionVersion": self.projection.version,
                "points": self.projection.public_points(),
                "queries": traces,
            },
        }

    def visualization(self) -> dict[str, Any]:
        return {
            "status": "success",
            "method": "PCA",
            "projectionVersion": self.projection.version,
            "points": self.projection.public_points(),
            "queries": [],
        }
