"""API routes for the Mini App frontend."""

import logging
import os
import tempfile
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Candidate, SourceType, Vacancy
from app.services.ai_service import parse_resume, parse_resume_image, standardize_skills
from app.services.matcher import match_jobs
from app.services.text_extractor import extract_text, render_pdf_to_image
from sqlalchemy import select

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["api"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ProfileSubmission(BaseModel):
    """Payload sent by the Mini App wizard form (manual or after verify)."""
    full_name: str
    phone: str
    email: Optional[str] = None
    skills: list[str]
    experience_years: Optional[int] = 0
    about: str = ""
    telegram_id: int | None = None
    resume_filename: Optional[str] = None   # set if came from file upload


class MatchedJob(BaseModel):
    id: str
    title: str
    match_pct: int
    matched_tags: list[str]


class ProfileResponse(BaseModel):
    candidate_id: int
    full_name: str
    matched_jobs: list[MatchedJob]


class ParsedPreviewResponse(BaseModel):
    """Returned by /parse-resume-preview — NOT saved to DB yet."""
    full_name: str
    phone: str
    email: str
    skills: list[str]
    experience_years: int
    summary: str
    resume_filename: str           # saved filename for later reference


class ApplyRequest(BaseModel):
    candidate_id: int
    vacancy_id: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fallback_skill_extraction(text: str) -> list[str]:
    """Simple keyword-based skill extraction when AI is unavailable."""
    known_skills = [
        "python", "javascript", "react", "django", "fastapi",
        "sql", "docker", "css", "figma", "redux",
        "photoshop", "ux", "ui", "node.js", "git",
        "typescript", "java", "c++", "machine learning", "data analysis",
        "postgresql", "redis", "celery", "kubernetes", "aws",
        "linux", "html", "angular", "vue", "flask",
        "mongodb", "graphql", "rest", "ci/cd", "agile",
        "scrum", "jira", "confluence", "nginx", "terraform",
    ]
    text_lower = text.lower()
    found = [skill for skill in known_skills if skill in text_lower]
    return found


async def _parse_file(tmp_path: str, ext: str, filename: str):
    """Extract structured data from a resume file.  Returns (parsed_dict, raw_text)."""
    raw_text = ""
    rendered_image_path = None

    is_image = ext in {".jpg", ".jpeg", ".png"}
    is_document = ext in {".pdf", ".docx"}

    parsed = {
        "full_name": "",
        "phone": "",
        "email": "",
        "years_experience": 0,
        "skills": [],
        "summary": "",
    }

    try:
        if is_document:
            raw_text = extract_text(tmp_path)
            if len(raw_text.strip()) > 100:
                logger.info("Extracted %d chars from %s. Sending to LLM.", len(raw_text), filename)
                parsed = await parse_resume(raw_text)
            else:
                logger.warning("Too little text (%d chars). Trying Vision AI.", len(raw_text))
                if ext == ".pdf":
                    rendered_image_path = render_pdf_to_image(tmp_path)
                    if rendered_image_path:
                        parsed = await parse_resume_image(rendered_image_path)
                    else:
                        parsed = await parse_resume_image(tmp_path)
                else:
                    parsed = await parse_resume_image(tmp_path)

        elif is_image:
            parsed = await parse_resume_image(tmp_path)
            logger.info("Vision parsed: name=%s, skills=%s", parsed.get("full_name"), parsed.get("skills"))

        # Fallback skill extraction
        candidate_skills = parsed.get("skills", [])
        if not candidate_skills and is_document:
            raw_text = raw_text or extract_text(tmp_path)
            candidate_skills = _fallback_skill_extraction(raw_text)
            parsed["skills"] = candidate_skills

    finally:
        for path_to_clean in [rendered_image_path]:
            if path_to_clean:
                try:
                    os.unlink(path_to_clean)
                except OSError:
                    pass

    return parsed, raw_text


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/jobs")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    """Return all available vacancies."""
    result = await db.execute(select(Vacancy).where(Vacancy.is_active == 1))
    vacancies = result.scalars().all()
    return [{"id": v.id, "title": v.title, "tags": v.tags_json} for v in vacancies]


@router.post("/parse-resume")
async def parse_resume_endpoint(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Parse a resume file, matching jobs, and SAVE to DB in one go."""
    # Validate file type
    allowed_extensions = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат файла: {ext}. Допустимые: PDF, DOCX, JPG, PNG",
        )

    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    # Persist a permanent copy
    import uuid
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "resumes")
    os.makedirs(uploads_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    permanent_path = os.path.join(uploads_dir, safe_name)
    with open(permanent_path, "wb") as f:
        f.write(content)

    logger.info("Uploaded file %s (%d bytes) -> saved=%s", filename, len(content), permanent_path)

    try:
        parsed, _ = await _parse_file(tmp_path, ext, filename)

        # Standardize skills
        raw_skills = parsed.get("skills", [])
        if raw_skills:
            standardized = await standardize_skills(raw_skills)
        else:
            standardized = []

        # Get vacancies from DB for matching
        v_result = await db.execute(select(Vacancy).where(Vacancy.is_active == 1))
        all_vacancies = v_result.scalars().all()
        vacancies_data = [
            {"id": v.id, "title": v.title, "tags_json": v.tags_json}
            for v in all_vacancies
        ]

        # Run matcher
        matches = match_jobs(standardized, vacancies_data)
        top_match_id = matches[0]["id"] if matches else None

        # Save to DB
        candidate = Candidate(
            full_name=parsed.get("full_name") or "Кандидат",
            phone=parsed.get("phone", ""),
            email=parsed.get("email", ""),
            source=SourceType.FILE.value,
            raw_text=parsed.get("summary", ""),
            skills_json=standardized or raw_skills,
            experience_years=int(parsed.get("years_experience") or 0),
            matched_vacancy_id=top_match_id,
            resume_path=safe_name,
        )
        db.add(candidate)
        await db.flush()
        await db.refresh(candidate)

        logger.info("Auto-saved candidate from file: %s (id=%d)", candidate.full_name, candidate.id)

        return {
            "profile": {
                "full_name": candidate.full_name,
                "phone": candidate.phone,
                "email": candidate.email,
                "skills": candidate.skills_json,
                "about": candidate.raw_text,
            },
            "matched_jobs": matches
        }
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@router.post("/candidates", response_model=ProfileResponse)
async def submit_profile(
    body: ProfileSubmission,
    db: AsyncSession = Depends(get_db),
):
    """Save a profile (manual submission), run matching, save to DB."""
    # Standardize skills
    standardized = await standardize_skills(body.skills)

    # Get vacancies from DB
    v_result = await db.execute(select(Vacancy).where(Vacancy.is_active == 1))
    all_vacancies = v_result.scalars().all()
    vacancies_data = [
        {"id": v.id, "title": v.title, "tags_json": v.tags_json}
        for v in all_vacancies
    ]

    # Run matcher
    matches = match_jobs(standardized, vacancies_data)

    # Persist candidate
    top_match_id = matches[0]["id"] if matches else None
    
    # Use explicit source if provided in frontend or fallback
    source = SourceType.FILE.value if body.resume_filename else SourceType.MANUAL.value

    candidate = Candidate(
        telegram_id=body.telegram_id,
        full_name=body.full_name,
        phone=body.phone,
        email=body.email,
        source=source,
        raw_text=body.about,
        skills_json=standardized,
        experience_years=body.experience_years,
        matched_vacancy_id=top_match_id,
        resume_path=body.resume_filename,
    )
    db.add(candidate)
    await db.flush()
    await db.refresh(candidate)

    logger.info("Saved candidate %s (id=%d), top match: %s", body.full_name, candidate.id, top_match_id)

    return ProfileResponse(
        candidate_id=candidate.id,
        full_name=candidate.full_name,
        matched_jobs=[MatchedJob(**m) for m in matches],
    )


@router.post("/apply")
async def apply_for_job(
    body: ApplyRequest,
    db: AsyncSession = Depends(get_db),
):
    """Record which vacancy a candidate chose."""
    candidate = await db.get(Candidate, body.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate.matched_vacancy_id = body.vacancy_id
    await db.flush()
    return {"ok": True, "vacancy_id": body.vacancy_id}
