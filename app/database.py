"""Async SQLite database utilities."""

from pathlib import Path
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base

# Database file lives next to the project root.
DB_PATH = Path(__file__).resolve().parent.parent / "hr_magnet.db"
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    """Create all tables if they don't exist yet and seed vacancies from jobs.json."""
    from app.models import Vacancy
    import json
    import os
    import logging

    logger = logging.getLogger(__name__)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed vacancies from jobs.json → DB (only missing ones)
    async with async_session_factory() as session:
        async with session.begin():
            jobs_json_path = Path(__file__).resolve().parent.parent / "data" / "jobs.json"
            if os.path.exists(jobs_json_path):
                try:
                    with open(jobs_json_path, encoding="utf-8") as f:
                        jobs = json.load(f)
                        count = 0
                        for j in jobs:
                            existing = await session.get(Vacancy, j["id"])
                            if not existing:
                                v = Vacancy(
                                    id=j["id"],
                                    title=j["title"],
                                    tags_json=j.get("tags", []),
                                    is_active=1
                                )
                                session.add(v)
                                count += 1
                        if count:
                            logger.info("Seeded %d new vacancies from jobs.json.", count)
                except Exception as e:
                    logger.error("Vacancy seeding failed: %s", e)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a session and commits/rolls back."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
