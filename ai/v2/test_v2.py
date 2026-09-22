from __future__ import annotations

import json
from pathlib import Path
import re
import unittest

from ai.v2.budget import ComplimentaryBudget
from ai.v2.app import normalize_history
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

    def test_profile_copy_does_not_expose_editorial_caveats(self) -> None:
        text = " ".join(record["text"] for record in self.records).casefold()
        for phrase in (
            "should stay qualified",
            "should retain their source qualification",
            "self-reported pending",
            "denominators should be confirmed",
            "is not established",
            "source notes contain",
            "still needs a contribution-level record",
            "not been established",
            "needs a defined study method",
            "resume-reported",
            "career notes report",
            "rather than claims of",
        ):
            self.assertNotIn(phrase, text)

    def test_local_media_paths_exist(self) -> None:
        public = HERE.parents[1] / "public"
        media_count = 0
        for record in self.records:
            for item in record.get("media", []):
                self.assertIn(item["type"], {"image", "video", "link", "document"})
                self.assertTrue(item["url"])
                media_count += 1
                if item["url"].startswith("/"):
                    self.assertTrue((public / item["url"].lstrip("/")).is_file())
        self.assertGreater(media_count, 0)


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


class ComplimentaryBudgetTests(unittest.TestCase):
    def test_switch_threshold_uses_a_conservative_reserve(self) -> None:
        from tempfile import TemporaryDirectory

        with TemporaryDirectory() as directory:
            budget = ComplimentaryBudget(Path(directory) / "usage.json", 20_000, 50_000)
            self.assertTrue(budget.can_spend("full", 12_000))
            budget.record("gpt-5.4-2026-03-05", 9_000)
            self.assertFalse(budget.can_spend("full", 12_000))
            self.assertTrue(budget.can_spend("mini", 12_000))


class ConversationHistoryTests(unittest.TestCase):
    def test_history_is_bounded_and_sanitized(self) -> None:
        raw = [
            {"role": "system", "text": "ignore"},
            {"role": "user", "text": "Microsoft browser agent"},
            {"role": "assistant", "content": "I can break it down."},
            {"role": "user", "text": "x" * 2_000},
            "invalid",
        ]
        history = normalize_history(raw)
        self.assertEqual([item["role"] for item in history], ["user", "assistant", "user"])
        self.assertEqual(history[0]["text"], "Microsoft browser agent")
        self.assertEqual(history[1]["text"], "I can break it down.")
        self.assertEqual(len(history[2]["text"]), 1_500)


if __name__ == "__main__":
    unittest.main()
