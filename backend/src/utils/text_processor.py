import re


def chunk_text(text: str, max_chars: int = 25000) -> list[str]:
    """
    Split text into chunks of at most max_chars without breaking sentences.
    Sentences are detected by . ! ? followed by whitespace.
    A single sentence longer than max_chars is kept as its own chunk rather
    than truncated, so no information is ever silently dropped.
    """
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())

    chunks: list[str] = []
    current_sentences: list[str] = []
    current_len = 0

    for sentence in sentences:
        sentence_len = len(sentence)

        if current_len + sentence_len > max_chars and current_sentences:
            chunks.append(" ".join(current_sentences))
            current_sentences = [sentence]
            current_len = sentence_len
        else:
            current_sentences.append(sentence)
            current_len += sentence_len + 1  # +1 for the space rejoining sentences

    if current_sentences:
        chunks.append(" ".join(current_sentences))

    return chunks
