import asyncio
import logging

import httpx
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


class AbcTest(BaseModel):
    question: str
    options: list[str]  # exactly 4 items
    correct_index: int  # 0–3


class DocumentAnalysis(BaseModel):
    summary: str
    flashcards: list[Flashcard]
    abc_tests: list[AbcTest]


# ── Prompt ────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """
You are an expert cognitive learning assistant specialising in
active recall and spaced repetition.

Given a passage of educational text, produce THREE outputs:

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
- Generate between 6 and 12 flashcards per passage. Never exceed 12.

3. MULTIPLE-CHOICE TESTS (ABC TESTS)
Generate multiple-choice questions that reinforce active recall.

Rules:
- Each question tests exactly ONE concept, fact, or mechanism.
- "question": a clear, specific question.
- "options": a list of EXACTLY 4 strings — one correct answer and
  three plausible distractors that reflect common misconceptions.
- "correct_index": the 0-based index of the correct option (0, 1, 2, or 3).
- Prefer "why" and "how" questions over "what".
- Generate between 4 and 12 ABC tests per passage. Never exceed 12.

Return ONLY valid JSON — no markdown fences, no extra keys:
{
  "summary": "<structured string as described above>",
  "flashcards": [
    {"front": "<string>", "back": "<string>"}
  ],
  "abc_tests": [
    {"question": "<string>", "options": ["<A>","<B>","<C>","<D>"],
     "correct_index": 0}
  ]
}
""".strip()


# ── Client singleton ──────────────────────────────────────────────────────────

_client: genai.Client | None = None

# Generation: 1 concurrent slot — free-tier Gemini 2.5 Flash is 5 RPM.
_GENERATION_SEMAPHORE = asyncio.Semaphore(1)

# Embedding: 3 concurrent slots — text-embedding-004 has a higher quota.
_EMBEDDING_SEMAPHORE = asyncio.Semaphore(3)

# On 429 RESOURCE_EXHAUSTED: wait 20 s then 45 s before giving up.
_RETRY_DELAYS = [20.0, 45.0]

# google-genai SDK ≥1.x routes embed_content to batchEmbedContents, which
# text-embedding-004 does not serve. We call embedContent directly instead.
_EMBED_URL = (
    "https://generativelanguage.googleapis.com"
    "/v1beta/models/gemini-embedding-001:embedContent"
)
_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=30.0)
    return _http_client


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not set in the environment.")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def _is_rate_limit(exc: Exception) -> bool:
    if isinstance(exc, genai_errors.APIError):
        return exc.code == 429
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code == 429
    return "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc)


# ── Public API ────────────────────────────────────────────────────────────────


async def embed_text(text: str) -> list[float]:
    """
    Return the text-embedding-004 embedding vector for a text string.

    Calls the embedContent REST endpoint directly — the google-genai SDK
    ≥1.x routes embed_content() to batchEmbedContents, which this model
    does not expose.
    """
    http = _get_http_client()

    async with _EMBEDDING_SEMAPHORE:
        last_exc: Exception | None = None

        for attempt, delay in enumerate([0.0] + _RETRY_DELAYS):
            if delay:
                logger.warning(
                    "Gemini embedding 429 — waiting %.0f s before retry %d/%d",
                    delay,
                    attempt,
                    len(_RETRY_DELAYS),
                )
                await asyncio.sleep(delay)

            try:
                r = await http.post(
                    _EMBED_URL,
                    headers={"x-goog-api-key": settings.GEMINI_API_KEY},
                    json={
                        "model": "models/gemini-embedding-001",
                        "content": {"parts": [{"text": text}]},
                        # Matryoshka truncation to 768 dims — stays within
                        # pgvector's 2000-dim HNSW index limit.
                        "outputDimensionality": 768,
                    },
                )
                if r.status_code == 429:
                    last_exc = httpx.HTTPStatusError(
                        "429 RESOURCE_EXHAUSTED", request=r.request, response=r
                    )
                    continue
                if not r.is_success:
                    logger.error(
                        "embedContent %s — body: %s", r.status_code, r.text[:400]
                    )
                r.raise_for_status()
                return r.json()["embedding"]["values"]

            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 429:
                    last_exc = exc
                    continue
                raise

        raise last_exc  # type: ignore[misc]


async def analyze_chunk(chunk: str) -> DocumentAnalysis:
    """
    Send a text chunk to Gemini and return a structured DocumentAnalysis.

    Concurrency is capped to 1 simultaneous request (_GENERATION_SEMAPHORE).
    On 429, retries after 20 s and then 45 s before raising.
    """
    client = _get_client()

    async with _GENERATION_SEMAPHORE:
        last_exc: Exception | None = None

        for attempt, delay in enumerate([0.0] + _RETRY_DELAYS):
            if delay:
                logger.warning(
                    "Gemini generation 429 — waiting %.0f s before retry %d/%d",
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
                    continue
                raise

        raise last_exc  # type: ignore[misc]
