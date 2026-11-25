from __future__ import annotations

import numpy as np

from .model_assets import model_directory


class EmbeddingClient:
    """CPU MiniLM in the same embedding space as the Pinecone index."""

    def __init__(self) -> None:
        from onnxruntime import InferenceSession, SessionOptions
        from tokenizers import Tokenizer

        directory = model_directory()
        self.tokenizer = Tokenizer.from_file(str(directory / "tokenizer.json"))
        self.tokenizer.enable_truncation(max_length=256)
        options = SessionOptions()
        options.intra_op_num_threads = 1
        options.inter_op_num_threads = 1
        self.session = InferenceSession(
            str(directory / "model.onnx"), options, providers=["CPUExecutionProvider"]
        )

    def query(self, text: str) -> list[float]:
        encoded = self.tokenizer.encode(text)
        inputs = {
            "input_ids": np.asarray([encoded.ids], dtype=np.int64),
            "attention_mask": np.asarray([encoded.attention_mask], dtype=np.int64),
            "token_type_ids": np.asarray([encoded.type_ids], dtype=np.int64),
        }
        tokens = self.session.run(["last_hidden_state"], inputs)[0][0]
        pooled = np.average(tokens, axis=0, weights=encoded.attention_mask)
        return (pooled / np.linalg.norm(pooled)).tolist()

    def documents(self, texts: list[str]) -> list[list[float]]:
        return [self.query(text) for text in texts]
