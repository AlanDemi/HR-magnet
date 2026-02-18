"""Application entry-point: runs FastAPI + Telegram Bot together.

Usage:
    python -m app.main
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.bot import bot, dp
from app.config import API_HOST, API_PORT
from app.database import init_db
from app.routers.api import router as api_router
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router

import colorlog

def setup_logging():
    handler = colorlog.StreamHandler()
    handler.setFormatter(colorlog.ColoredFormatter(
        "%(log_color)s%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        log_colors={
            'DEBUG':    'cyan',
            'INFO':     'green',
            'WARNING':  'yellow',
            'ERROR':    'red',
            'CRITICAL': 'red,bg_white',
        },
        secondary_log_colors={},
        style='%'
    ))

    logger = colorlog.getLogger()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger

logger = setup_logging()


# ──────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Initialising database …")
    await init_db()

    # Pre-warm semantic matcher cache
    try:
        from app.services.matcher import warm_cache
        from app.database import async_session_factory
        from app.models import Vacancy
        from sqlalchemy import select

        async with async_session_factory() as session:
            result = await session.execute(select(Vacancy).where(Vacancy.is_active == 1))
            vacancies = result.scalars().all()
            vacancies_data = [
                {"id": v.id, "title": v.title, "tags_json": v.tags_json}
                for v in vacancies
            ]
            warm_cache(vacancies_data)
            logger.info("Matcher cache warmed with %d vacancies.", len(vacancies_data))
    except Exception as e:
        logger.warning("Could not warm matcher cache: %s", e)

    logger.info("Database ready.")
    yield
    logger.info("Shutting down FastAPI.")


app = FastAPI(
    title="HR-Magnet",
    description="Job Fair companion — AI-powered resume matching.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(api_router)
app.include_router(admin_router)
app.include_router(auth_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# ──────────────────────────────────────────────
# Combined runner
# ──────────────────────────────────────────────

async def run_bot():
    """Start Aiogram polling."""
    logger.info("Starting Telegram bot polling …")
    await dp.start_polling(bot)


async def run_api():
    """Start Uvicorn programmatically."""
    config = uvicorn.Config(
        app,
        host=API_HOST,
        port=API_PORT,
        log_level="info",
    )
    server = uvicorn.Server(config)
    logger.info("Starting API server on %s:%s …", API_HOST, API_PORT)
    await server.serve()


async def main():
    """Run both the API server and the Telegram bot concurrently."""
    try:
        await init_db()
        await asyncio.gather(
            run_api(),
            run_bot(),
        )
    except asyncio.CancelledError:
        logger.info("Tasks were cancelled.")


# ──────────────────────────────────────────────
# Frontend Static Serving
# ──────────────────────────────────────────────

@app.get("/")
async def serve_index():
    """Explicitly serve index.html for the root path."""
    index_path = os.path.join("frontend", "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "ok", "message": "Frontend not built yet"}

# Mount assets folder for compiled CSS/JS
assets_path = os.path.join("frontend", "dist", "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """Catch-all for SPA routing: serve index.html or files if they exist."""
    if full_path.startswith("api/"):
        return {"error": "Not found"}

    file_path = os.path.join("frontend", "dist", full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    # Fallback to index.html for SPA routes
    index_path = os.path.join("frontend", "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"status": "ok", "message": "Path not found"}


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Application stopped by user.")
    except Exception as e:
        logger.critical("Unexpected error: %s", e)
