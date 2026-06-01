import re

_PARAGRAPH_SEP = re.compile(r"\n{2,}")
_SENTENCE_SEP = re.compile(r"(?<=[.!?])\s+")


def _sentence_chunks(text: str, max_chars: int) -> list[str]:
    sentences = _SENTENCE_SEP.split(text.strip())
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for sentence in sentences:
        slen = len(sentence)
        if current_len + slen > max_chars and current:
            chunks.append(" ".join(current))
            current = [sentence]
            current_len = slen
        else:
            current.append(sentence)
            current_len += slen + 1

    if current:
        chunks.append(" ".join(current))

    return chunks


def chunk_text(text: str, max_chars: int = 6000) -> list[str]:
    """
    Semantic chunker: accumulates logical paragraphs up to max_chars.
    Paragraphs that individually exceed max_chars are split at sentence
    boundaries. Single sentences longer than max_chars are kept whole
    rather than truncated.
    """
    paragraphs = [p.strip() for p in _PARAGRAPH_SEP.split(text.strip()) if p.strip()]

    chunks: list[str] = []
    current_parts: list[str] = []
    current_len = 0

    for para in paragraphs:
        if len(para) > max_chars:
            if current_parts:
                chunks.append("\n\n".join(current_parts))
                current_parts = []
                current_len = 0
            chunks.extend(_sentence_chunks(para, max_chars))
            continue

        para_len = len(para)
        if current_len + para_len > max_chars and current_parts:
            chunks.append("\n\n".join(current_parts))
            current_parts = [para]
            current_len = para_len
        else:
            current_parts.append(para)
            current_len += para_len + 2  # "\n\n" separator

    if current_parts:
        chunks.append("\n\n".join(current_parts))

    return chunks
