"""
Entry point for Crime X FastAPI backend.

Local dev:  uvicorn run:app --reload --port 8000
Catalyst:   python run.py   (reads X_ZOHO_CATALYST_LISTEN_PORT)
"""
import os
import uvicorn
from app.main import app  # noqa: F401


if __name__ == "__main__":
    # Zoho Catalyst AppSail injects the listen port via this env var.
    # Fallback to 8000 for local development.
    port = int(os.getenv("X_ZOHO_CATALYST_LISTEN_PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
