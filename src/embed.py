"""
Chunks entries and generates embeddings for any entry that is new or changed
since the last run. Re-running this is safe and cheap — ingest.py already
marked which entries actually need re-embedding.
"""
import numpy as np
from src.config import EMBEDDING_PROVIDER, LOCAL_EMBEDDING_MODEL, CHUNK_WORD_THRESHOLD
from src.db import get_connection, insert_chunk

_local_model = None  # lazy-loaded so `ask.py` alone doesn't pay the load cost twice


def _get_local_model():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        _local_model = SentenceTransformer(LOCAL_EMBEDDING_MODEL)
    return _local_model


def chunk_text(text: str) -> list[str]:
    """Whole entry if short; split by blank-line paragraphs if long."""
    word_count = len(text.split())
    if word_count <= CHUNK_WORD_THRESHOLD:
        return [text]

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    return paragraphs if paragraphs else [text]


def embed_texts(texts: list[str]) -> np.ndarray:
    """Returns an (N, dim) array of embeddings for the given texts."""
    if EMBEDDING_PROVIDER == "local":
        model = _get_local_model()
        return np.array(model.encode(texts, normalize_embeddings=True))

    elif EMBEDDING_PROVIDER == "openai":
        from openai import OpenAI
        from src.config import OPENAI_API_KEY, OPENAI_EMBEDDING_MODEL
        client = OpenAI(api_key=OPENAI_API_KEY)
        resp = client.embeddings.create(model=OPENAI_EMBEDDING_MODEL, input=texts)
        return np.array([d.embedding for d in resp.data])

    else:
        raise ValueError(f"Unknown EMBEDDING_PROVIDER: {EMBEDDING_PROVIDER}")


def embed_new_entries(entry_ids: list[int]):
    """Chunk + embed the given entry ids (typically the output of ingest_all())."""
    if not entry_ids:
        print("No new or changed entries to embed.")
        return

    conn = get_connection()
    placeholders = ",".join("?" for _ in entry_ids)
    rows = conn.execute(
        f"SELECT id, raw_text FROM entries WHERE id IN ({placeholders})", entry_ids
    ).fetchall()
    conn.close()

    total_chunks = 0
    for row in rows:
        chunks = chunk_text(row["raw_text"])
        embeddings = embed_texts(chunks)
        for chunk, embedding in zip(chunks, embeddings):
            insert_chunk(row["id"], chunk, embedding)
        total_chunks += len(chunks)

    print(f"Embedded {len(rows)} entries into {total_chunks} chunks.")


if __name__ == "__main__":
    # Standalone run: embed every entry that has no chunks yet
    conn = get_connection()
    rows = conn.execute(
        "SELECT id FROM entries WHERE id NOT IN (SELECT DISTINCT entry_id FROM chunks)"
    ).fetchall()
    conn.close()
    embed_new_entries([r["id"] for r in rows])
