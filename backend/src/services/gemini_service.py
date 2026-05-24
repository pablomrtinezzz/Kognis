from google import genai
from google.genai import types
from pydantic import BaseModel

from src.core.config import settings

# ── Pydantic output schema ────────────────────────────────────────────────────


class Flashcard(BaseModel):
    front: str
    back: str


class DocumentAnalysis(BaseModel):
    summary: str
    flashcards: list[Flashcard]


# ── Prompt ────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """
You are an expert cognitive learning assistant specializing in active recall and spaced repetition.

Given a passage of educational text, your job is to:
1. Write a concise, cohesive SUMMARY (3-5 sentences) that captures the core ideas and their relationships.
2. Generate HIGH-YIELD FLASHCARDS that test deep understanding — not trivia.

Flashcard rules:
- Each card tests exactly ONE concept, fact, or mechanism.
- The "front" must be a clear, specific question.
- The "back" must be a precise, self-contained answer (1-3 sentences max).
- Prefer "why" and "how" questions over "what" questions when possible.
- Aim for 5-15 flashcards per passage depending on density.

Return ONLY valid JSON — no markdown fences, no extra keys — matching this exact schema:
{
  "summary": "<string>",
  "flashcards": [
    {"front": "<string>", "back": "<string>"}
  ]
}
""".strip()


# ── Client singleton ──────────────────────────────────────────────────────────

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not set in the environment.")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# ── Public API ────────────────────────────────────────────────────────────────


async def analyze_chunk(chunk: str) -> DocumentAnalysis:
    """Send a text chunk to Gemini and return a structured DocumentAnalysis."""
    client = _get_client()
    response = await client.aio.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=chunk,
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.4,
        ),
    )
    return DocumentAnalysis.model_validate_json(response.text)
