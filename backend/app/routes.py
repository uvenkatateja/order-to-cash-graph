# pyre-strict
"""FastAPI route definitions for the O2C Graph API."""

import traceback
from typing import Any

from fastapi import FastAPI  # pyre-ignore[21]
from pydantic import BaseModel  # pyre-ignore[21]

from .graph import build_graph  # pyre-ignore[21]
from .llm import process_query  # pyre-ignore[21]


# ─── Request models ──────────────────────────────────────────────────────────


class QueryRequest(BaseModel):  # pyre-ignore[11]
    question: str
    history: list[dict[str, str]] = []


# ─── Route registration ──────────────────────────────────────────────────────


def register_routes(app: FastAPI) -> None:
    """Register all API routes on the FastAPI app instance."""

    @app.get("/api/graph")
    def get_graph() -> dict[str, Any]:
        """Return the full O2C graph with nodes and edges."""
        return build_graph()

    @app.post("/api/query")
    def query_endpoint(req: QueryRequest) -> dict[str, Any]:
        """Process a natural language query against the O2C dataset."""
        try:
            return process_query(req.question, req.history)
        except Exception as e:
            error_detail = traceback.format_exc()
            print(f"Query endpoint error: {error_detail}")
            return {"answer": f"Server error: {str(e)}", "sql": "", "data": []}

    @app.get("/api/health")
    def health() -> dict[str, str]:
        """Health check endpoint."""
        return {"status": "ok"}
