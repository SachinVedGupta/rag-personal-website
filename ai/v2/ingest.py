from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

from .config import Settings
from .embeddings import EmbeddingClient
from .projection import build_projection
from .store import VectorStore


HERE = Path(__file__).resolve().parent


def retrieval_text(record: dict) -> str:
    return "\n".join(
        [
            f"Title: {record['title']}",
            f"Category: {record['category']}",
            f"Facts: {record['text']}",
            f"Entities: {', '.join(record['entities'])}",
            f"Themes: {', '.join(record['themes'])}",
            f"Related records: {', '.join(record['related_to'])}",
        ]
    )


def main() -> None:
    settings = Settings.from_env()
    source_path = HERE / "corpus" / "public_profile.json"
    records = json.loads(source_path.read_text())
    texts = [retrieval_text(record) for record in records]
    embeddings = EmbeddingClient(settings.embedding_model, settings.hugging_face_key)
    vectors = embeddings.documents(texts)
    if any(len(vector) != settings.embedding_dimension for vector in vectors):
        raise RuntimeError("Embedding model returned an unexpected dimension")

    corpus_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()[:12]
    version = f"{datetime.now(timezone.utc).date().isoformat()}-{corpus_hash}"
    pinecone_records = []
    for record, text, vector in zip(records, texts, vectors):
        metadata = {
            "text": text,
            "title": record["title"],
            "category": record["category"],
            "source_name": record["source_name"],
            "source_url": record["source_url"],
            "entities": record["entities"],
            "themes": record["themes"],
            "related_to": record["related_to"],
            "media_json": json.dumps(record.get("media", []), separators=(",", ":")),
            "corpus_version": version,
        }
        pinecone_records.append(
            {"id": record["id"], "values": vector, "metadata": metadata}
        )

    store = VectorStore(
        settings.pinecone_api_key,
        settings.pinecone_index_name,
        settings.namespace,
    )
    store.ensure_index(settings.embedding_dimension, create=True)
    store.replace(pinecone_records)
    build_projection(
        records=pinecone_records,
        vectors=vectors,
        path=HERE / "data" / "projection.json",
        version=version,
    )
    print(
        json.dumps(
            {
                "status": "success",
                "index": settings.pinecone_index_name,
                "namespace": settings.namespace,
                "records": len(records),
                "projectionVersion": version,
            }
        )
    )


if __name__ == "__main__":
    main()
