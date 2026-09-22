from __future__ import annotations

from dataclasses import dataclass
import json
import time
from typing import Any

from pinecone import Pinecone, ServerlessSpec
from pinecone.exceptions import NotFoundException


@dataclass(frozen=True)
class SearchHit:
    id: str
    score: float
    text: str
    metadata: dict[str, Any]

    def public(self) -> dict[str, Any]:
        raw_media = self.metadata.get("media_json", "[]")
        try:
            media = json.loads(str(raw_media))
        except (TypeError, ValueError, json.JSONDecodeError):
            media = []
        return {
            "id": self.id,
            "score": round(self.score, 6),
            "title": self.metadata.get("title", self.id),
            "category": self.metadata.get("category", "Profile"),
            "source": self.metadata.get("source_name", "Profile corpus"),
            "sourceUrl": self.metadata.get("source_url", ""),
            "text": self.text,
            "snippet": self.text[:420],
            "entities": list(self.metadata.get("entities", [])),
            "themes": list(self.metadata.get("themes", [])),
            "relatedIds": list(self.metadata.get("related_to", [])),
            "media": media if isinstance(media, list) else [],
        }


class VectorStore:
    def __init__(self, api_key: str, index_name: str, namespace: str) -> None:
        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        self.namespace = namespace

    def ensure_index(self, dimension: int, *, create: bool = False) -> None:
        names = self.pc.list_indexes().names()
        if self.index_name not in names:
            if not create:
                raise RuntimeError(
                    f"Pinecone v2 index '{self.index_name}' does not exist; run ingest.py"
                )
            self.pc.create_index(
                name=self.index_name,
                dimension=dimension,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            deadline = time.time() + 120
            while time.time() < deadline:
                if self.pc.describe_index(self.index_name).status.get("ready"):
                    break
                time.sleep(1)
            else:
                raise RuntimeError("Timed out waiting for Pinecone index")
        description = self.pc.describe_index(self.index_name)
        if int(description.dimension) != dimension:
            raise RuntimeError(
                f"Index dimension {description.dimension} does not match {dimension}"
            )

    @property
    def index(self):
        return self.pc.Index(self.index_name)

    def replace(self, records: list[dict[str, Any]]) -> None:
        index = self.index
        try:
            index.delete(delete_all=True, namespace=self.namespace)
        except NotFoundException:
            # A brand-new index has no namespace to clear yet.
            pass
        for start in range(0, len(records), 100):
            index.upsert(vectors=records[start : start + 100], namespace=self.namespace)

    def search(self, vector: list[float], top_k: int) -> list[SearchHit]:
        response = self.index.query(
            namespace=self.namespace,
            vector=vector,
            top_k=top_k,
            include_metadata=True,
            include_values=False,
        )
        hits: list[SearchHit] = []
        for match in response.matches:
            metadata = dict(match.metadata or {})
            hits.append(
                SearchHit(
                    id=match.id,
                    score=float(match.score),
                    text=str(metadata.get("text", "")),
                    metadata=metadata,
                )
            )
        return hits
