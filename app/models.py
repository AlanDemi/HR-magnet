"""Database models for HR-Magnet Offline."""

from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import BigInteger, DateTime, Enum, Index, Integer, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base for all models."""
    pass


class SourceType(str, PyEnum):
    """How the candidate was registered."""
    FILE = "file"
    MANUAL = "manual"


class CandidateStatus(str, PyEnum):
    """Status of the candidate in the admin pipeline."""
    NEW = "NEW"
    VIEWED = "VIEWED"
    INVITED = "INVITED"
    INTERVIEW = "INTERVIEW"
    TEST_TASK = "TEST_TASK"
    OFFER = "OFFER"
    HIRED = "HIRED"
    REJECTED = "REJECTED"
    ARCHIVE = "ARCHIVE"


class Candidate(Base):
    """A job-fair attendee whose profile is captured by the system."""

    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(
        Enum(SourceType, values_callable=lambda e: [m.value for m in e]),
        default=SourceType.MANUAL.value,
    )
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    skills_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    matched_vacancy_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resume_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    admin_status: Mapped[str] = mapped_column(
        Enum(CandidateStatus, values_callable=lambda e: [m.value for m in e]),
        default=CandidateStatus.NEW.value,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    quiz_results: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_candidates_telegram_id", "telegram_id"),
    )

    def __repr__(self) -> str:
        return f"<Candidate id={self.id} name={self.full_name!r} status={self.admin_status}>"


class Vacancy(Base):
    """A job opening available for matching."""
    __tablename__ = "vacancies"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    tags_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<Vacancy id={self.id} title={self.title!r}>"
