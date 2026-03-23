# pyre-strict
"""LLM integration with Groq for natural language query processing."""

import json
import re
from typing import Any

from groq import Groq  # pyre-ignore[21]

from .config import (  # pyre-ignore[21]
    GROQ_API_KEY,
    GROQ_MODEL,
    LLM_MAX_HISTORY,
    LLM_MAX_RESULTS,
    LLM_MAX_DISPLAY,
)
from .db import query  # pyre-ignore[21]
from .prompts import SYSTEM_PROMPT, GUARDRAIL_RESPONSE, ANSWER_TEMPLATE  # pyre-ignore[21]
from .utils import trunc  # pyre-ignore[21]


def process_query(question: str, history: list[dict[str, str]]) -> dict[str, Any]:
    """Process a natural language question and return an answer with data."""
    if not GROQ_API_KEY:
        return {
            "answer": "GROQ_API_KEY not configured. Please add it to backend/.env file.",
            "sql": "",
            "data": [],
        }

    client = Groq(api_key=GROQ_API_KEY)

    # Build conversation messages
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    history_window: list[dict[str, str]] = list(history[-LLM_MAX_HISTORY:])  # pyre-ignore[16]
    for h in history_window:
        messages.append(h)
    messages.append({"role": "user", "content": question})

    # Step 1: Ask LLM to generate SQL
    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0,
            max_tokens=1000,
        )
    except Exception as e:
        return {"answer": f"Groq API error: {str(e)}", "sql": "", "data": []}

    raw_content = resp.choices[0].message.content
    raw: str = str(raw_content).strip() if raw_content else ""

    # Guardrail: off-topic check
    if "designed to answer questions related to the provided" in raw:
        return {"answer": GUARDRAIL_RESPONSE, "sql": "", "data": []}

    # Parse LLM response
    parsed = _parse_response(raw)
    sql: str = parsed.get("sql", "").strip()
    data: list[dict[str, Any]] = []

    if sql:
        try:
            data = query(sql)
        except Exception as e:
            return {"answer": f"Query error: {str(e)}", "sql": sql, "data": []}

    # Step 2: Generate natural language answer from results
    answer: str = ""
    if data:
        answer = _generate_answer(client, question, sql, data)
    else:
        answer = str(parsed.get("explanation", raw))

    results: list[dict[str, Any]] = list(data[0:LLM_MAX_RESULTS])  # pyre-ignore[16]
    return {"answer": answer, "sql": sql, "data": results}


# ─── Private helpers ──────────────────────────────────────────────────────────


def _parse_response(raw: str) -> dict[str, Any]:
    """Parse the LLM JSON response, with fallback for raw SQL."""
    try:
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except (json.JSONDecodeError, ValueError):
        sql_match = re.search(r"SELECT.+?;", raw, re.DOTALL | re.IGNORECASE)
        return {
            "sql": sql_match.group(0) if sql_match else "",
            "explanation": trunc(raw, 200),
            "needs_data": bool(sql_match),
        }


def _generate_answer(
    client: Any, question: str, sql: str, data: list[dict[str, Any]]
) -> str:
    """Feed query results back to LLM for a human-readable answer."""
    data_preview: list[dict[str, Any]] = list(data[0:LLM_MAX_DISPLAY])  # pyre-ignore[16]
    data_str = json.dumps(data_preview, indent=2)

    prompt_content: str = ANSWER_TEMPLATE.format(
        question=question,
        sql=sql,
        row_count=len(data),
        display_limit=LLM_MAX_DISPLAY,
        data_str=data_str,
    )

    follow_up: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt_content},
    ]

    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=follow_up,
        temperature=0.2,
        max_tokens=800,
    )
    raw_content = resp.choices[0].message.content
    return str(raw_content).strip() if raw_content else ""
