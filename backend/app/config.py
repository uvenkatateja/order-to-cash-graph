# pyre-strict
"""Application configuration loaded from environment variables."""

import os
from typing import Any

from dotenv import load_dotenv  # pyre-ignore[21]

load_dotenv()

# ─── Database ─────────────────────────────────────────────────────────────────
DB_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "o2c.db")

# ─── LLM ──────────────────────────────────────────────────────────────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ─── Graph limits ─────────────────────────────────────────────────────────────
GRAPH_NODE_LIMIT: int = int(os.getenv("GRAPH_NODE_LIMIT", "60"))
GRAPH_ITEM_LIMIT: int = int(os.getenv("GRAPH_ITEM_LIMIT", "100"))

# ─── LLM settings ────────────────────────────────────────────────────────────
LLM_MAX_HISTORY: int = 6
LLM_MAX_RESULTS: int = 50
LLM_MAX_DISPLAY: int = 20
