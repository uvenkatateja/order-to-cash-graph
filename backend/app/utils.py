# pyre-strict
"""Shared utility functions."""

from typing import Any


def trunc(value: Any, length: int = 10) -> str:
    """Safely convert a value to string and truncate to given length."""
    text: str = str(value) if value else ""
    return text[0:length]  # pyre-ignore[16]
