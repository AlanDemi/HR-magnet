import json
import logging
import base64
import httpx
import re
import io
import os
from PIL import Image
from app.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_VISION_MODEL

logger = logging.getLogger(__name__)

def _safe_int_years(value) -> int:
    if isinstance(value, int): return value
    if isinstance(value, float): return int(value)
    if isinstance(value, str):
        match = re.search(r'\d+', value)
        if match: return int(match.group())
    return 0

def _safe_list_skills(value) -> list[str]:
    if isinstance(value, list): return [str(s).strip() for s in value if s]
    if isinstance(value, dict): return [str(k).strip() for k in value.keys()]
    if isinstance(value, str):
        if "," in value: return [s.strip() for s in value.split(",") if s.strip()]
        return [value.strip()]
    return []

# ── Positive, simple prompts ──────────────────────────────────────
# Small models follow positive instructions much better than negative ones

# ── FINAL ACCURACY-FOCUSED PROMPTS ──────────────────────────────────────
TEXT_PROMPT = (
    "Проанализируй текст резюме. Извлеки данные и верни JSON. "
    "Поля: full_name (имя и фамилия кандидата. Ищи в самом верху текста. "
    "ВАЖНО: Не перепутай с названием компании или должности! Если имени нет - верни пустую строку). "
    "email, phone, years_experience (число), skills (список строк). "
    "summary (строка): напиши краткий обзор кандидата. "
    "ИСПОЛЬЗУЙ ПЕРЕНОСЫ СТРОК (\\n) для разделения разделов (Опыт, Образование, Инфо)."
)

VISION_PROMPT = (
    "Извлеки данные из этого фото резюме. "
    "СТРАТЕГИЯ: "
    "1. FULL_NAME: самый крупный текст вверху. Пиши буква-в-букву БЕЗ ОПЕЧАТОК. "
    "2. SUMMARY: краткий структурированный обзор. Разделяй блоки символом переноса строки (\\n). "
    "ПРАВИЛО: Не выдумывай данные. Если почты или телефона на фото нет - оставь пустую строку. "
    "ВАЖНО: НЕ ПОВТОРЯЙ ОДИН И ТОТ ЖЕ ТЕКСТ. Пиши сжато и по делу."
    "Верни JSON: {full_name, email, phone, years_experience, skills: [], summary}"
)


def _normalize(parsed: dict) -> dict:
    """Normalize parsed AI response and filter common hallucinations."""
    email = (parsed.get("email") or "").lower().strip()
    # Filter out common LLM placeholders
    if "example.com" in email or "user@email" in email:
        email = ""
    
    phone = parsed.get("phone", "").strip()
    if "999-999" in phone or "000-000" in phone:
        phone = ""
    
    full_name = parsed.get("full_name", "").strip()
    # Anti-hallucination for names
    if "john doe" in full_name.lower() or "ivan ivanov" in full_name.lower():
        full_name = ""

    # Ensure summary is a string (SQLite Text column)
    summary = parsed.get("summary", "")
    if isinstance(summary, (dict, list)):
        summary = json.dumps(summary, ensure_ascii=False)

    return {
        "full_name": full_name,
        "phone": phone,
        "email": email,
        "years_experience": _safe_int_years(parsed.get("years_experience", 0)),
        "skills": _safe_list_skills(parsed.get("skills", [])),
        "summary": summary,
    }


async def parse_resume(text: str) -> dict:
    """Parse text resume via Ollama LLM."""
    logger.info("Parsing text resume (%d chars)...", len(text))
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"{TEXT_PROMPT}\n\nТекст резюме:\n{text}",
        "stream": False,
        "format": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()

        raw = resp.json().get("response", "{}")
        logger.info("Raw AI response: %s", raw[:500])
        parsed = json.loads(raw)
        return _normalize(parsed)

    except Exception as exc:
        logger.error("Text parse failed: %s", exc)
        return _normalize({})

async def parse_resume_image(image_path: str) -> dict:
    """Parse image resume via Ollama Vision model."""
    if not os.path.exists(image_path):
        return _normalize({})

    try:
        logger.info("Opening image for analysis: %s", image_path)
        img = Image.open(image_path)
        
        # 720px: Good balance for speed vs text readability
        MAX_SIZE = 720
        if max(img.size) > MAX_SIZE:
            img.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.BICUBIC)

        if img.mode != "RGB":
            img = img.convert("RGB")

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=80)
        img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        payload = {
            "model": OLLAMA_VISION_MODEL,
            "prompt": VISION_PROMPT,
            "images": [img_b64],
            "stream": False,
            "format": "json",
        }

        logger.info("Sending to Ollama Vision (%s)...", OLLAMA_VISION_MODEL)

        async with httpx.AsyncClient(timeout=150.0) as client:
            resp = await client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()

        raw = resp.json().get("response", "{}")
        logger.info("Raw Vision response: %s", raw[:500])
        parsed = json.loads(raw)
        return _normalize(parsed)

    except Exception as exc:
        logger.error("Vision parse failed: %s", exc)
        return _normalize({})


async def standardize_skills(skills: list[str]) -> list[str]:
    """Use AI to normalize verbose skills into clean tech keywords."""
    if not skills:
        return []
    
    logger.info("Standardizing %d skills...", len(skills))
    prompt = (
        "Преобразуй список навыков в стандартные IT-теги. "
        "Удали подробности в скобках, оставь только названия технологий. "
        "Пример: 'Python (Data Ingestion)' -> 'Python', 'React.js (Hooks)' -> 'React'. "
        "Верни JSON: { \"skills\": [\"название\", \"название\"] }"
    )
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"{prompt}\n\nНавыки: {', '.join(skills)}",
        "stream": False,
        "format": "json",
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()
            
        raw = resp.json().get("response", "{}")
        parsed = json.loads(raw)
        standardized = _safe_list_skills(parsed.get("skills", []))
        
        if not standardized:
            return [s.lower() for s in skills]
        return standardized
        
    except Exception as exc:
        logger.error("Standardization failed: %s", exc)
        return [s.lower() for s in skills]
