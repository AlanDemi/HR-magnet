"""Admin API routes for managing candidates and vacancies."""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func, desc, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Candidate, CandidateStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CandidateListResponse(BaseModel):
    id: int
    full_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    admin_status: str
    matched_vacancy_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateDetailResponse(BaseModel):
    id: int
    telegram_id: Optional[int]
    full_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    source: str
    summary: Optional[str]
    skills_json: Optional[List[str]]
    experience_years: Optional[int] = 0
    matched_vacancy_id: Optional[str]
    resume_path: Optional[str]
    admin_status: str
    admin_notes: Optional[str]
    quiz_results: Optional[dict]
    created_at: datetime

    @field_validator("experience_years", mode="before")
    @classmethod
    def parse_experience_years(cls, v):
        """Handle cases where AI stored a string like '4 года' instead of int."""
        if v is None:
            return 0
        if isinstance(v, (int, float)):
            return int(v)
        if isinstance(v, str):
            import re
            match = re.search(r'\d+', v)
            return int(match.group()) if match else 0
        return 0

    @field_validator("skills_json", mode="before")
    @classmethod
    def parse_skills(cls, v):
        """Handle cases where AI stored a dict or string instead of a list."""
        if v is None:
            return []
        if isinstance(v, list):
            return [str(s) for s in v]
        if isinstance(v, dict):
            return [str(k) for k in v.keys()]
        if isinstance(v, str):
            try:
                import json
                data = json.loads(v)
                if isinstance(data, list): return [str(s) for s in data]
                if isinstance(data, dict): return [str(k) for k in data.keys()]
            except Exception:
                if "," in v:
                    return [s.strip() for s in v.split(",") if s.strip()]
                return [v]
        return []

    class Config:
        from_attributes = True


class CandidateUpdate(BaseModel):
    admin_status: Optional[CandidateStatus] = None
    admin_notes: Optional[str] = None


class PaginatedCandidates(BaseModel):
    total: int
    items: List[CandidateListResponse]


class VacancyCreate(BaseModel):
    id: str
    title: str
    tags_json: List[str]

class VacancyResponse(BaseModel):
    id: str
    title: str
    tags_json: List[str]
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True

class VacancyUpdate(BaseModel):
    title: Optional[str] = None
    tags_json: Optional[List[str]] = None
    is_active: Optional[int] = None


# ---------------------------------------------------------------------------
# Vacancy CRUD (database-first, no JSON sync)
# ---------------------------------------------------------------------------

@router.get("/vacancies", response_model=List[VacancyResponse])
async def list_vacancies_admin(db: AsyncSession = Depends(get_db)):
    """List all vacancies for management."""
    from app.models import Vacancy
    result = await db.execute(select(Vacancy).order_by(desc(Vacancy.created_at)))
    return result.scalars().all()

@router.post("/vacancies", response_model=VacancyResponse)
async def create_vacancy(body: VacancyCreate, db: AsyncSession = Depends(get_db)):
    """Create a new vacancy."""
    from app.models import Vacancy
    existing = await db.get(Vacancy, body.id)
    if existing:
        raise HTTPException(status_code=400, detail="Вакансия с таким ID уже существует")
    
    vacancy = Vacancy(
        id=body.id,
        title=body.title,
        tags_json=body.tags_json,
        is_active=1
    )
    db.add(vacancy)
    await db.flush()
    await db.refresh(vacancy)
    return vacancy

@router.patch("/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def update_vacancy(vacancy_id: str, body: VacancyUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing vacancy."""
    from app.models import Vacancy
    vacancy = await db.get(Vacancy, vacancy_id)
    if not vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    
    if body.title is not None:
        vacancy.title = body.title
    if body.tags_json is not None:
        vacancy.tags_json = body.tags_json
    if body.is_active is not None:
        vacancy.is_active = body.is_active
    
    await db.flush()
    await db.refresh(vacancy)
    return vacancy

@router.delete("/vacancies/{vacancy_id}")
async def delete_vacancy(vacancy_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a vacancy."""
    from app.models import Vacancy
    vacancy = await db.get(Vacancy, vacancy_id)
    if not vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
    
    await db.delete(vacancy)
    await db.flush()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Candidates with search, sort, and filters
# ---------------------------------------------------------------------------

@router.get("/candidates", response_model=PaginatedCandidates)
async def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[CandidateStatus] = None,
    vacancy_id: Optional[str] = None,
    search: Optional[str] = Query(None, description="Search by name, email, or skills"),
    sort_by: Optional[str] = Query("date", description="Sort: 'date' or 'name'"),
    db: AsyncSession = Depends(get_db),
):
    """List candidates with pagination, filters, search, and sorting."""
    query = select(Candidate)
    
    if status:
        query = query.where(Candidate.admin_status == status.value)
    if vacancy_id:
        query = query.where(Candidate.matched_vacancy_id == vacancy_id)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Candidate.full_name.ilike(search_term),
                Candidate.email.ilike(search_term),
                Candidate.phone.ilike(search_term),
                cast(Candidate.skills_json, String).ilike(search_term),
            )
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Sorting
    if sort_by == "name":
        query = query.order_by(Candidate.full_name)
    else:
        query = query.order_by(desc(Candidate.created_at))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    candidates = result.scalars().all()
    
    return PaginatedCandidates(
        total=total,
        items=[CandidateListResponse.model_validate(c) for c in candidates]
    )


@router.get("/candidates/{candidate_id}", response_model=CandidateDetailResponse)
async def get_candidate(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed candidate profile."""
    candidate = await db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return CandidateDetailResponse.model_validate(candidate)


@router.patch("/candidates/{candidate_id}", response_model=CandidateDetailResponse)
async def update_candidate(
    candidate_id: int,
    body: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update candidate status or notes."""
    candidate = await db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if body.admin_status is not None:
        candidate.admin_status = body.admin_status.value
    if body.admin_notes is not None:
        candidate.admin_notes = body.admin_notes
    
    await db.flush()
    await db.refresh(candidate)
    
    return CandidateDetailResponse.model_validate(candidate)


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard metrics."""
    total = await db.scalar(select(func.count(Candidate.id))) or 0
    
    status_query = select(Candidate.admin_status, func.count(Candidate.id)).group_by(Candidate.admin_status)
    status_result = await db.execute(status_query)
    status_counts = {status: count for status, count in status_result.all()}
    
    source_query = select(Candidate.source, func.count(Candidate.id)).group_by(Candidate.source)
    source_result = await db.execute(source_query)
    source_counts = {source: count for source, count in source_result.all()}
    
    return {
        "total_candidates": total,
        "status_breakdown": status_counts,
        "source_breakdown": source_counts,
    }


@router.get("/export")
async def export_candidates(db: AsyncSession = Depends(get_db)):
    """Export all candidates as an Excel file."""
    import io
    import pandas as pd
    from fastapi.responses import StreamingResponse

    result = await db.execute(
        select(Candidate).order_by(desc(Candidate.created_at))
    )
    candidates = result.scalars().all()

    rows = []
    for c in candidates:
        rows.append({
            "ID": c.id,
            "ФИО": c.full_name or "",
            "Email": c.email or "",
            "Телефон": c.phone or "",
            "Навыки": ", ".join(c.skills_json) if c.skills_json else "",
            "Опыт (лет)": c.experience_years or 0,
            "Описание": c.summary or "",
            "Вакансия": c.matched_vacancy_id or "",
            "Источник": c.source or "",
            "Статус": c.admin_status or "",
            "Заметки": c.admin_notes or "",
            "Дата": c.created_at.strftime("%d.%m.%Y %H:%M") if c.created_at else "",
        })

    df = pd.DataFrame(rows)
    buffer = io.BytesIO()
    df.to_excel(buffer, index=False, engine="openpyxl", sheet_name="Кандидаты")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=hr_magnet_candidates.xlsx"},
    )


@router.get("/resume/{filename}")
async def download_resume(filename: str):
    """Download an uploaded resume file."""
    import os
    from fastapi.responses import FileResponse

    safe_filename = os.path.basename(filename)
    uploads_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "uploads", "resumes",
    )
    file_path = os.path.join(uploads_dir, safe_filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Файл не найден")

    ext = os.path.splitext(safe_filename)[1].lower()
    content_types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }
    media_type = content_types.get(ext, "application/octet-stream")

    import urllib.parse
    clean_filename = safe_filename.replace(safe_filename.split('_')[0] + '_', '', 1) if '_' in safe_filename else safe_filename
    encoded_filename = urllib.parse.quote(clean_filename)

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename*=utf-8''{encoded_filename}"
        },
    )
