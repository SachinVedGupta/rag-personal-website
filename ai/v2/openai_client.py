from __future__ import annotations

import json
import time
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class OpenAIError(RuntimeError):
    pass


class OpenAIResponsesClient:
    """Small Responses API client so v2 adds no production dependency."""

    def __init__(
        self,
        api_key: str,
        timeout: int = 90,
        on_usage: Callable[[str, int], None] | None = None,
    ) -> None:
        self.api_key = api_key
        self.timeout = timeout
        self.on_usage = on_usage

    def _request(self, payload: dict[str, Any]) -> dict[str, Any]:
        request = Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    result = json.loads(response.read().decode("utf-8"))
                    usage = result.get("usage") or {}
                    if self.on_usage:
                        self.on_usage(
                            str(payload.get("model", "")),
                            int(usage.get("total_tokens", 0) or 0),
                        )
                    return result
            except HTTPError as exc:
                detail = exc.read().decode("utf-8", "replace")[:800]
                last_error = OpenAIError(f"OpenAI returned HTTP {exc.code}: {detail}")
                if exc.code not in {408, 409, 429, 500, 502, 503, 504}:
                    break
            except (URLError, TimeoutError) as exc:
                last_error = exc
            time.sleep(0.75 * (2**attempt))
        raise OpenAIError(str(last_error or "OpenAI request failed"))

    @staticmethod
    def _output_text(response: dict[str, Any]) -> str:
        direct = response.get("output_text")
        if isinstance(direct, str) and direct.strip():
            return direct.strip()
        pieces: list[str] = []
        for item in response.get("output", []):
            for content in item.get("content", []):
                if content.get("type") == "output_text" and content.get("text"):
                    pieces.append(content["text"])
        if not pieces:
            raise OpenAIError("OpenAI response did not contain output text")
        return "\n".join(pieces).strip()

    def text(
        self,
        *,
        model: str,
        instructions: str,
        input_text: str,
        max_output_tokens: int,
        reasoning_effort: str = "low",
    ) -> str:
        response = self._request(
            {
                "model": model,
                "instructions": instructions,
                "input": input_text,
                "reasoning": {"effort": reasoning_effort},
                "text": {"verbosity": "low"},
                "max_output_tokens": max_output_tokens,
                "store": False,
            }
        )
        return self._output_text(response)

    def structured(
        self,
        *,
        model: str,
        instructions: str,
        input_text: str,
        schema_name: str,
        schema: dict[str, Any],
        max_output_tokens: int = 1000,
    ) -> dict[str, Any]:
        response = self._request(
            {
                "model": model,
                "instructions": instructions,
                "input": input_text,
                "reasoning": {"effort": "low"},
                "text": {
                    "verbosity": "low",
                    "format": {
                        "type": "json_schema",
                        "name": schema_name,
                        "schema": schema,
                        "strict": True,
                    },
                },
                "max_output_tokens": max_output_tokens,
                "store": False,
            }
        )
        return json.loads(self._output_text(response))
