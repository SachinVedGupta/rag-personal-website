from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.decomposition import PCA


class Projection:
    def __init__(self, path: Path) -> None:
        self.path = path
        payload = json.loads(path.read_text())
        self.mean = np.asarray(payload["mean"], dtype=float)
        self.components = np.asarray(payload["components"], dtype=float)
        self.points = payload["points"]
        self.version = payload["version"]

    def transform(self, vector: list[float]) -> list[float]:
        result = (np.asarray(vector, dtype=float) - self.mean) @ self.components.T
        return [round(float(result[0]), 8), round(float(result[1]), 8)]

    def public_points(self) -> list[dict[str, Any]]:
        return self.points


def build_projection(
    *,
    records: list[dict[str, Any]],
    vectors: list[list[float]],
    path: Path,
    version: str,
) -> None:
    matrix = np.asarray(vectors, dtype=float)
    pca = PCA(n_components=2, random_state=42)
    reduced = pca.fit_transform(matrix)
    points = []
    for record, point in zip(records, reduced):
        metadata = record["metadata"]
        try:
            media = json.loads(str(metadata.get("media_json", "[]")))
        except (TypeError, ValueError, json.JSONDecodeError):
            media = []
        points.append(
            {
                "id": record["id"],
                "title": metadata["title"],
                "category": metadata["category"],
                "text": metadata["text"],
                "source": metadata["source_name"],
                "sourceUrl": metadata["source_url"],
                "entities": list(metadata.get("entities", [])),
                "themes": list(metadata.get("themes", [])),
                "relatedIds": list(metadata.get("related_to", [])),
                "media": media if isinstance(media, list) else [],
                "x": round(float(point[0]), 8),
                "y": round(float(point[1]), 8),
            }
        )
    payload = {
        "version": version,
        "mean": pca.mean_.tolist(),
        "components": pca.components_.tolist(),
        "points": points,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":")))
