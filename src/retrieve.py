"""
Given a natural-language question, returns the top-k most relevant journal
chunks by cosine similarity. Plain numpy is fine at journal-entry scale
(hundreds to low thousands of chunks) — no vector DB needed yet. If this
ever grows past ~50k chunks, swap this file's internals for Chroma/LanceDB
without touching anything downstream.
"""
import numpy as np
from src.config import TOP_K
from src.db import get_all_chunks
from src.embed import embed_texts


def cosine_similarity(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    query_norm = query_vec / (np.linalg.norm(query_vec) + 1e-8)
    matrix_norms = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-8)
    return matrix_norms @ query_norm


def retrieve(query: str, top_k: int = TOP_K) -> list[dict]:
    chunks = get_all_chunks()
    if not chunks:
        return []

    query_vec = embed_texts([query])[0]
    matrix = np.stack([c["embedding"] for c in chunks])
    scores = cosine_similarity(query_vec, matrix)

    ranked_idx = np.argsort(scores)[::-1][:top_k]
    results = []
    for i in ranked_idx:
        results.append({
            "date": chunks[i]["date"],
            "filename": chunks[i]["filename"],
            "chunk_text": chunks[i]["chunk_text"],
            "score": float(scores[i]),
        })
    return results
