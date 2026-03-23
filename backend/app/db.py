# pyre-strict
"""SQLite database connection and query helpers."""

import sqlite3
from typing import Any

from .config import DB_PATH  # pyre-ignore[21]


def get_connection() -> sqlite3.Connection:
    """Create a new database connection with Row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def query(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:  # pyre-ignore[3]
    """Execute a SQL query and return results as list of dicts."""
    conn = get_connection()
    try:
        cur = conn.execute(sql, params)
        rows: list[dict[str, Any]] = [dict(r) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()
