"""
Ties retrieval + LLM together: given a question, pulls the most relevant
journal chunks and answers using only that context, citing dates.
"""
from typing import Any

from src.config import (
    ANTHROPIC_API_KEY,
    ANSWER_MODEL,
    ANSWER_PROVIDER,
    LOCAL_ANSWER_MODEL,
    MAX_ANSWER_TOKENS,
)
from src.retrieve import retrieve

SYSTEM_PROMPT = """You are a thoughtful assistant answering questions about someone's \
personal journal. You will be given excerpts from their journal entries, each labeled \
with a date. Answer the question using ONLY the information in these excerpts.

Rules:
- If the excerpts don't contain enough information to answer, say so honestly rather \
than guessing or using outside knowledge.
- Cite the date(s) of entries you draw on, e.g. "(March 3, 2026)".
- Be warm but factual — reflect what was written, don't invent details.
- Keep the answer concise unless the question asks for depth."""

_local_answer_pipeline = None


def build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "(No journal entries found.)"
    blocks = [f"[{c['date']}]\n{c['chunk_text']}" for c in chunks]
    return "\n\n---\n\n".join(blocks)


def _get_local_answer_pipeline():
    global _local_answer_pipeline
    if _local_answer_pipeline is None:
        from transformers import pipeline

        _local_answer_pipeline = pipeline(
            "text2text-generation",
            model=LOCAL_ANSWER_MODEL,
            tokenizer=LOCAL_ANSWER_MODEL,
            device=-1,
        )
    return _local_answer_pipeline


def _answer_with_local_model(question: str, context: str) -> str:
    prompt = (
        f"{SYSTEM_PROMPT}\n\nJournal excerpts:\n\n{context}\n\nQuestion: {question}\n\n"
        "Answer using only the excerpts above. Cite dates in the answer."
    )
    pipe = _get_local_answer_pipeline()
    response = pipe(
        prompt,
        max_new_tokens=MAX_ANSWER_TOKENS,
        do_sample=False,
    )
    return response[0]["generated_text"].replace(prompt, "").strip()


def _answer_with_anthropic(question: str, context: str) -> str:
    from anthropic import Anthropic

    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is missing. Add it to your .env or set ANSWER_PROVIDER=\"local\".")

    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=ANSWER_MODEL,
        max_tokens=MAX_ANSWER_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"Journal excerpts:\n\n{context}\n\nQuestion: {question}",
        }],
    )
    return "".join(block.text for block in response.content if getattr(block, "type", None) == "text")


def ask(question: str) -> dict:
    chunks = retrieve(question)
    context = build_context(chunks)

    if ANSWER_PROVIDER == "local":
        answer_text = _answer_with_local_model(question, context)
    elif ANSWER_PROVIDER == "anthropic":
        answer_text = _answer_with_anthropic(question, context)
    else:
        raise ValueError(f"Unsupported ANSWER_PROVIDER: {ANSWER_PROVIDER}")

    return {
        "question": question,
        "answer": answer_text,
        "sources": [{"date": c["date"], "filename": c["filename"]} for c in chunks],
    }


if __name__ == "__main__":
    import sys
    q = " ".join(sys.argv[1:]) or "What have I been feeling lately?"
    result = ask(q)
    print(f"\nQ: {result['question']}\n")
    print(result["answer"])
    print("\nSources:", ", ".join(s["date"] for s in result["sources"]) or "none")
