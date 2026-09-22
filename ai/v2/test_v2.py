from __future__ import annotations

import json
from pathlib import Path
import re
import unittest

from ai.v2.ingest import retrieval_text
from ai.v2.openai_client import OpenAIError, OpenAIResponsesClient
from ai.v2.projection import Projection


HERE = Path(__file__).resolve().parent


class CorpusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.records = json.loads((HERE / "corpus" / "public_profile.json").read_text())

    def test_ids_and_relationships_are_consistent(self) -> None:
        ids = [record["id"] for record in self.records]
        self.assertEqual(len(ids), len(set(ids)))
        known = set(ids)
        for record in self.records:
            self.assertTrue(set(record["related_to"]).issubset(known))

    def test_public_corpus_does_not_contain_credentials_or_contact_details(self) -> None:
        text = json.dumps(self.records)
        self.assertIsNone(re.search(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}", text))
        self.assertIsNone(re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", text))
        self.assertNotIn("street address", text.casefold())
        self.assertNotIn("birthday", text.casefold())

    def test_retrieval_text_contains_relationship_context(self) -> None:
        text = retrieval_text(self.records[0])
        self.assertIn("Entities:", text)
        self.assertIn("Themes:", text)
        self.assertIn("Related records:", text)


class ProjectionTests(unittest.TestCase):
    def test_projection_matches_the_corpus(self) -> None:
        projection = Projection(HERE / "data" / "projection.json")
        records = json.loads((HERE / "corpus" / "public_profile.json").read_text())
        self.assertEqual({point["id"] for point in projection.points}, {r["id"] for r in records})
        self.assertEqual(projection.components.shape, (2, 384))
        self.assertEqual(projection.mean.shape, (384,))


class OpenAIResponseParsingTests(unittest.TestCase):
    def test_extracts_nested_output_text(self) -> None:
        response = {
            "output": [
                {"content": [{"type": "output_text", "text": "grounded answer"}]}
            ]
        }
        self.assertEqual(OpenAIResponsesClient._output_text(response), "grounded answer")

    def test_missing_output_is_an_error(self) -> None:
        with self.assertRaises(OpenAIError):
            OpenAIResponsesClient._output_text({"output": []})


if __name__ == "__main__":
    unittest.main()
