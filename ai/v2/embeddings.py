from __future__ import annotations

from langchain_huggingface import HuggingFaceEndpointEmbeddings


class EmbeddingClient:
    def __init__(self, model: str, api_key: str) -> None:
        self.client = HuggingFaceEndpointEmbeddings(
            model=model,
            task="feature-extraction",
            huggingfacehub_api_token=api_key,
        )

    def query(self, text: str) -> list[float]:
        return list(self.client.embed_query(text))

    def documents(self, texts: list[str]) -> list[list[float]]:
        return [list(vector) for vector in self.client.embed_documents(texts)]
