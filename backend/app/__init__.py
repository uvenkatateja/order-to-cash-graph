# pyre-strict
"""App package — creates and configures the FastAPI application."""

from fastapi import FastAPI  # pyre-ignore[21]
from fastapi.middleware.cors import CORSMiddleware  # pyre-ignore[21]

from .routes import register_routes  # pyre-ignore[21]

app: FastAPI = FastAPI(
    title="O2C Graph API",
    description="Graph-based data modeling and query system for SAP Order-to-Cash",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

register_routes(app)
