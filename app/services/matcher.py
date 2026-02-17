"""Smart job matching engine with hybrid keyword + semantic search.

Uses sentence-transformers (all-MiniLM-L6-v2) to compute cosine similarity
between candidate skills and vacancy tags for fuzzy/semantic matching.
Falls back to pure keyword matching if the model is unavailable.
"""

import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Sentence-Transformers model (loaded lazily) ─────────────────────────────
_model = None
_vacancy_cache: dict[str, dict] = {}   # vacancy_id → {title, tags, embedding}

SEMANTIC_THRESHOLD = 0.35   # minimum cosine similarity to count a tag as matched
KEYWORD_WEIGHT = 0.6        # weight for keyword score in hybrid result
SEMANTIC_WEIGHT = 0.4       # weight for semantic score in hybrid result


def _get_model():
    """Lazily load the SentenceTransformer model (once per process)."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning("Could not load SentenceTransformer: %s.  Falling back to keyword-only matching.", e)
    return _model


def _embed(texts: list[str]) -> Optional[np.ndarray]:
    """Return embeddings for a list of texts, or None if model unavailable."""
    model = _get_model()
    if model is None:
        return None
    return model.encode(texts, normalize_embeddings=True, show_progress_bar=False)


def warm_cache(vacancies: list[dict]) -> None:
    """Pre-compute embeddings for all vacancy tag sets and cache them.

    Called once at startup from main.py lifespan hook.
    """
    global _vacancy_cache
    _vacancy_cache = {}

    model = _get_model()
    if model is None:
        # Even without embeddings we store raw tags for keyword matching
        for v in vacancies:
            raw_tags = v.get("tags") or v.get("tags_json") or []
            _vacancy_cache[v["id"]] = {
                "title": v["title"],
                "tags": [t.lower().strip() for t in raw_tags],
                "embedding": None,
            }
        return

    for v in vacancies:
        raw_tags = v.get("tags") or v.get("tags_json") or []
        tags = [t.lower().strip() for t in raw_tags]
        if tags:
            # Combine all tags into one string to get a single representative embedding
            combined_text = ", ".join(tags) + " – " + v["title"]
            emb = model.encode([combined_text], normalize_embeddings=True, show_progress_bar=False)[0]
        else:
            emb = None
        _vacancy_cache[v["id"]] = {
            "title": v["title"],
            "tags": tags,
            "embedding": emb,
        }

    logger.info("Vacancy embedding cache warmed: %d entries.", len(_vacancy_cache))


def _keyword_score(candidate_skills: list[str], vacancy_tags: list[str]) -> tuple[float, list[str]]:
    """Classic keyword / substring matching.  Returns (score 0-1, matched_tags)."""
    if not vacancy_tags:
        return 0.0, []

    matched_tags: list[str] = []
    for tag in vacancy_tags:
        if tag in candidate_skills:
            matched_tags.append(tag)
            continue
        for skill in candidate_skills:
            if tag in skill or skill in tag:
                matched_tags.append(tag)
                break

    unique = list(set(matched_tags))
    score = len(unique) / len(vacancy_tags) if vacancy_tags else 0.0
    return score, unique


def _semantic_score(candidate_embedding: Optional[np.ndarray], vacancy_embedding: Optional[np.ndarray]) -> float:
    """Cosine similarity between two L2-normalised embeddings."""
    if candidate_embedding is None or vacancy_embedding is None:
        return 0.0
    sim = float(np.dot(candidate_embedding, vacancy_embedding))
    return max(0.0, sim)


def match_jobs(candidate_skills: list[str], vacancies: list[dict]) -> list[dict]:
    """Match a candidate's skills against a list of vacancies.

    Uses a hybrid approach: keyword match + semantic (embedding) similarity.

    Args:
        candidate_skills: List of skill strings.
        vacancies: List of vacancy dicts with 'id', 'title', and 'tags'/'tags_json'.

    Returns:
        Sorted list of dicts with id, title, match_pct, matched_tags.
    """
    if not candidate_skills:
        return []

    candidate_skills_lower = [s.lower().strip() for s in candidate_skills]

    # Build candidate embedding once
    candidate_text = ", ".join(candidate_skills_lower)
    candidate_emb = _embed([candidate_text])
    candidate_embedding = candidate_emb[0] if candidate_emb is not None else None

    results: list[dict] = []

    for job in vacancies:
        job_id = job["id"]
        job_title = job["title"]

        # Try cached data first, fall back to raw dict
        cached = _vacancy_cache.get(job_id)
        if cached:
            tags = cached["tags"]
            vacancy_embedding = cached["embedding"]
        else:
            raw_tags = job.get("tags") or job.get("tags_json") or []
            tags = [t.lower().strip() for t in raw_tags]
            # Compute embedding on-the-fly if not cached
            if tags:
                emb = _embed([", ".join(tags) + " – " + job_title])
                vacancy_embedding = emb[0] if emb is not None else None
            else:
                vacancy_embedding = None

        if not tags:
            continue

        # Keyword score
        kw_score, matched_tags = _keyword_score(candidate_skills_lower, tags)

        # Semantic score
        sem_score = _semantic_score(candidate_embedding, vacancy_embedding)

        # Hybrid percentage
        if candidate_embedding is not None and vacancy_embedding is not None:
            combined = kw_score * KEYWORD_WEIGHT + sem_score * SEMANTIC_WEIGHT
        else:
            combined = kw_score  # pure keyword if model unavailable

        match_pct = round(combined * 100)

        # If semantic score is high, add "⭐ semantic" to matched_tags to help debugging
        # but only if there were no keyword matches at all
        if sem_score > SEMANTIC_THRESHOLD and not matched_tags:
            matched_tags = [f"~{t}" for t in tags[:3]]  # approximate matches indicator

        results.append({
            "id": job_id,
            "title": job_title,
            "match_pct": match_pct,
            "matched_tags": sorted(matched_tags),
        })

    results.sort(key=lambda r: r["match_pct"], reverse=True)
    return results
