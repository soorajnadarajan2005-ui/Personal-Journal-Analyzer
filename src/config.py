"""
Central configuration. Every other module reads settings from here
instead of touching os.environ or hardcoding values directly.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load variables from .env into the process environment
load_dotenv()

# --- Paths ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENTRIES_DIR = PROJECT_ROOT / "data" / "entries"
DB_PATH = PROJECT_ROOT / "data" / "journal.db"

# --- API keys ---
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Embedding settings ---
# "local"  -> sentence-transformers, runs on your machine, no data leaves it, free
# "openai" -> OpenAI's embedding API, higher quality, requires OPENAI_API_KEY
EMBEDDING_PROVIDER = "local"
LOCAL_EMBEDDING_MODEL = "all-MiniLM-L6-v2"   # small, fast, good enough for this use case
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"

# --- LLM settings (used to answer questions grounded in retrieved entries) ---
ANSWER_PROVIDER = "local"  # "local" or "anthropic"
ANSWER_MODEL = "claude-sonnet-4-6"
LOCAL_ANSWER_MODEL = "google/flan-t5-small"
MAX_ANSWER_TOKENS = 250

# --- Chunking / retrieval ---
# Entries under this many words are embedded whole; longer ones are split by paragraph.
CHUNK_WORD_THRESHOLD = 400
TOP_K = 5  # how many chunks to retrieve per question
