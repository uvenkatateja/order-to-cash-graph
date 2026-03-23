# pyre-strict
"""
Entry point for the O2C Graph API.

Run with:
  python main.py
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from app import app  # pyre-ignore[21]

if __name__ == "__main__":
    import uvicorn  # pyre-ignore[21]
    uvicorn.run(app, host="0.0.0.0", port=8000)
