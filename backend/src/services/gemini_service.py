import asyncio
import logging

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel

from src.core.config import settings

logger = logging.getLogger(__name__)

# ── Pydantic output schema ────────────────────────────────────────────────────


class Flashcard(BaseModel):
    front: str
    back: str


class DocumentAnalysis(BaseModel):
    summary: str
    flashcards: list[Flashcard]


# ── Prompt ────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """
You are an expert cognitive learning assistant specialising in
active recall and spaced repetition.

Given a passage of educational text, produce TWO outputs:

1. COMPREHENSIVE SUMMARY
Write a rich, structured summary a student can study from
WITHOUT re-reading the original document.

Requirements:
- Minimum 4-6 paragraphs (or equivalent structured content).
- Plain-text structure (no markdown fences):
  Lines starting with "## " are section headers.
  Lines starting with "- " are bullet points.
  Normal lines are prose paragraphs.
- Cover ALL major topics, concepts, definitions, mechanisms,
  and key relationships in the passage.
- Include concrete examples, numbers, or formulas when present.
- End with a "## Conclusiones clave" section: 3-5 takeaways.

2. HIGH-YIELD FLASHCARDS
Generate flashcards that test deep understanding, not trivial recall.

Rules:
- Each card tests exactly ONE concept, fact, or mechanism.
- "front": a clear, specific question.
- "back": a precise, self-contained answer (1-3 sentences max).
- Prefer "why" and "how" questions over "what".
- Aim for 8-20 flashcards per passage depending on density.

Return ONLY valid JSON — no markdown fences, no extra keys:
{
  "summary": "<structured string as described above>",
  "flashcards": [
    {"front": "<string>", "back": "<string>"}
  ]
}
""".strip()


# ── Client singleton ──────────────────────────────────────────────────────────

_client: genai.Client | None = None

# Sequential (1 slot) — free-tier Gemini 2.5 Flash allows only 5 RPM.
# Parallel calls would saturate that instantly; sequential + natural response
# latency (~5-8 s per call) keeps us safely under the limit.
_GEMINI_SEMAPHORE = asyncio.Semaphore(1)

# On 429 RESOURCE_EXHAUSTED: wait 20 s then 45 s before giving up.
_RETRY_DELAYS = [20.0, 45.0]


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not set in the environment.")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def _is_rate_limit(exc: Exception) -> bool:
    """True when Gemini returned 429 / RESOURCE_EXHAUSTED."""
    if isinstance(exc, genai_errors.APIError):
        return exc.code == 429
    # Fallback for any SDK version change
    return "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc)


# ── Public API ────────────────────────────────────────────────────────────────


async def analyze_chunk(chunk: str) -> DocumentAnalysis:
    """
    Send a text chunk to Gemini and return a structured DocumentAnalysis.

    Concurrency is capped at 2 simultaneous requests (_GEMINI_SEMAPHORE).
    On 429, retries after 20 s and then 45 s before raising.
    """
    client = _get_client()

    async with _GEMINI_SEMAPHORE:
        last_exc: Exception | None = None

        for attempt, delay in enumerate([0.0] + _RETRY_DELAYS):
            if delay:
                logger.warning(
                    "Gemini 429 — waiting %.0f s before retry %d/%d",
                    delay,
                    attempt,
                    len(_RETRY_DELAYS),
                )
                await asyncio.sleep(delay)

            try:
                response = await client.aio.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=chunk,
                    config=types.GenerateContentConfig(
                        system_instruction=_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        temperature=0.4,
                    ),
                )
                return DocumentAnalysis.model_validate_json(response.text)

            except Exception as exc:
                if _is_rate_limit(exc):
                    last_exc = exc
                    continue  # try next delay slot
                raise  # non-rate-limit error — propagate immediately

        # All retry slots exhausted
        raise last_exc  # type: ignore[misc]
