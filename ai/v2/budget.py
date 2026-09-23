from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from threading import Lock


class ComplimentaryBudget:
    """Conservative per-process guardrail for the two complimentary model groups."""

    def __init__(self, path: Path, full_limit: int, mini_limit: int) -> None:
        self.path = path
        self.limits = {"full": full_limit, "mini": mini_limit}
        self.lock = Lock()

    @staticmethod
    def _today() -> str:
        return datetime.now(timezone.utc).date().isoformat()

    def _read(self) -> dict:
        if not self.path.exists():
            return {"date": self._today(), "full": 0, "mini": 0}
        try:
            payload = json.loads(self.path.read_text())
        except (json.JSONDecodeError, OSError):
            return {"date": self._today(), "full": 0, "mini": 0}
        if payload.get("date") != self._today():
            return {"date": self._today(), "full": 0, "mini": 0}
        return {
            "date": self._today(),
            "full": max(0, int(payload.get("full", 0))),
            "mini": max(0, int(payload.get("mini", 0))),
        }

    def can_spend(self, group: str, reserve: int) -> bool:
        with self.lock:
            usage = self._read()
            return usage[group] + reserve <= self.limits[group]

    def record(self, model: str, tokens: int) -> None:
        group = "mini" if "mini" in model or "nano" in model else "full"
        with self.lock:
            usage = self._read()
            usage[group] += max(0, int(tokens))
            self.path.parent.mkdir(parents=True, exist_ok=True)
            temporary = self.path.with_suffix(".tmp")
            temporary.write_text(json.dumps(usage, separators=(",", ":")))
            temporary.replace(self.path)

    def snapshot(self) -> dict:
        with self.lock:
            usage = self._read()
            return {
                "date": usage["date"],
                "fullUsed": usage["full"],
                "fullLimit": self.limits["full"],
                "miniUsed": usage["mini"],
                "miniLimit": self.limits["mini"],
            }
