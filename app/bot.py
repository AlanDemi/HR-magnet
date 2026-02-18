"""Telegram bot handlers (Aiogram 3.x).

Handlers:
  /start         — welcome card with [Open Mini App] button
  File upload    — accept PDF/DOCX, parse via Ollama, reply with matched jobs
  /export        — dump candidates table to Excel and send file
"""

import io
import json
import logging
import os
import tempfile
import uuid
import shutil
from pathlib import Path

import pandas as pd
from aiogram import Bot, Dispatcher, F, Router, types
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import (
    BufferedInputFile,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
)
from sqlalchemy import select

from app.config import BOT_TOKEN, WEBAPP_URL
from app.database import async_session_factory
from app.models import Candidate, SourceType, Vacancy, Settings
from app.services.ai_service import parse_resume, parse_resume_image
from app.services.matcher import match_jobs
from app.services.text_extractor import extract_text, render_pdf_to_image

logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()
router = Router()
dp.include_router(router)

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

async def get_setting(key: str, default: str = "") -> str:
    """Fetch a configuration setting from DB."""
    try:
        async with async_session_factory() as session:
            result = await session.execute(select(Settings).where(Settings.key == key))
            setting = result.scalar_one_or_none()
            return setting.value if setting else default
    except Exception as e:
        logger.warning("Error fetching setting %s: %s", key, e)
        return default

# ──────────────────────────────────────────────
# /start
# ──────────────────────────────────────────────

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    """Отправляет приветственное сообщение с кнопкой Mini App."""
    buttons = []

    # Показывать кнопку только если настроен URL
    if WEBAPP_URL and WEBAPP_URL.startswith("https://") and "YOUR_DOMAIN" not in WEBAPP_URL:
        buttons.append([InlineKeyboardButton(
            text="📋 Открыть Mini App",
            web_app=WebAppInfo(url=WEBAPP_URL),
        )])

    buttons.append([InlineKeyboardButton(
        text="📄 Загрузить резюме (PDF/DOCX/Фото)",
        callback_data="hint_upload",
    )])

    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)

    webapp_hint = ""
    if not (buttons and buttons[0][0].web_app):
        webapp_hint = "\n⚙️ <i>Mini App будет доступен после развертывания фронтенда.</i>\n"

    # Fetch custom welcome message from settings
    welcome_text = await get_setting("welcome_message")
    if not welcome_text:
        welcome_text = (
            "<b>👋 Добро пожаловать в HR-Magnet!</b>\n\n"
            "Я помогу вам найти идеальную работу на этой ярмарке.\n\n"
            "🔹 <b>Вариант 1:</b> Нажмите кнопку ниже, чтобы заполнить анкету вручную.\n"
            "🔹 <b>Вариант 2:</b> Отправьте мне файл вашего резюме (<b>PDF/DOCX</b>) или его <b>фото</b>."
        )

    await message.answer(
        f"{welcome_text}\n\n"
        f"{webapp_hint}"
        "Давайте начнем! 🚀",
        reply_markup=keyboard,
    )


@router.callback_query(F.data == "hint_upload")
async def hint_upload(callback: types.CallbackQuery):
    await callback.answer()
    await callback.message.answer(  # type: ignore[union-attr]
        "📎 Просто прикрепите файл вашего резюме или отправьте <b>фотографию</b> прямо в этот чат!"
    )


# ──────────────────────────────────────────────
# File handler (PDF / DOCX)
# ──────────────────────────────────────────────

@router.message(F.document)
async def handle_document(message: types.Message):
    """Accept a PDF/DOCX/IMAGE resume, parse it, match jobs, reply."""
    doc = message.document
    if doc is None:
        return

    file_name = (doc.file_name or "resume").lower()
    is_image = any(file_name.endswith(ext) for ext in [".jpg", ".jpeg", ".png"])
    is_doc = any(file_name.endswith(ext) for ext in [".pdf", ".docx"])

    if not (is_image or is_doc):
        await message.answer("⚠️ Пожалуйста, отправьте файл в формате <b>.pdf</b>, <b>.docx</b> или <b>изображение</b>.")
        return

    status_msg = await message.answer(f"⏳ Загружаю ваш{'е' if is_image else ''} { 'фото' if is_image else 'резюме' }…")

    # Download file to temp directory
    tmp_dir = tempfile.mkdtemp(prefix="hr_magnet_")
    local_path = os.path.join(tmp_dir, doc.file_name or "resume")

    file = await bot.get_file(doc.file_id)
    await bot.download_file(file.file_path, local_path)  # type: ignore[arg-type]

    ext = os.path.splitext(local_path)[1].lower()

    try:
        if ext in [".jpg", ".jpeg", ".png", ".webp"]:
            await status_msg.edit_text("👁‍🗨 Анализирую фото с помощью AI Vision…")
            parsed = await parse_resume_image(local_path)
            raw_text = parsed.get("summary", "")

        elif ext == ".pdf":
            # Hybrid approach: Try Text first (Fast), Fallback to Vision (Accurate)
            await status_msg.edit_text("🧠 Извлекаю текст из резюме…")
            raw_text = extract_text(local_path)
            
            should_use_vision = False
            
            # 1. Check if text is garbage or empty
            if not raw_text.strip() or len(raw_text) < 150:
                should_use_vision = True
                logger.info("PDF Text extraction yielded very little content (%d chars).", len(raw_text))

            if not should_use_vision:
                await status_msg.edit_text("🤖 Анализирую структуру текста…")
                parsed = await parse_resume(raw_text)
                
                # 2. Check for "bad columns" (long skills) or missing critical data
                summary = parsed.get("summary", "")
                skills_list = parsed.get("skills", [])
                suspicious_skills = any(len(s) > 60 for s in skills_list)
                
                if (not parsed.get("full_name") or len(str(summary)) < 100 or len(skills_list) < 2 or suspicious_skills):
                    should_use_vision = True
                    logger.info("Text parse poor (name=%s, susp_skills=%s). Retrying with Vision...", 
                                parsed.get("full_name"), suspicious_skills)

            if should_use_vision:
                await status_msg.edit_text("👁‍🗨 Сложная верстка (колонки)? Использую Vision AI…")
                image_path = render_pdf_to_image(local_path)
                if image_path:
                    parsed = await parse_resume_image(image_path)
                    raw_text = parsed.get("summary", "") # store visual summary
                    try: os.remove(image_path)
                    except: pass
                else:
                    # Fallback to whatever text we had if render fails
                    if 'parsed' not in locals():
                        parsed = await parse_resume(raw_text)

        else: # Covers .docx and other text-based formats
            # DOCX, TXT -> Classic Text Extraction
            await status_msg.edit_text("🧠 Извлекаю текст из резюме…")
            raw_text = extract_text(local_path)
            parsed = await parse_resume(raw_text)

        # Match jobs
        skills = parsed.get("skills", [])
        async with async_session_factory() as session:
            v_res = await session.execute(select(Vacancy).where(Vacancy.is_active == 1))
            vacancies_list = [
                {"id": v.id, "title": v.title, "tags_json": v.tags_json} 
                for v in v_res.scalars().all()
            ]
        matches = match_jobs(skills, vacancies_list)

        # Prepare persistent storage
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "resumes")
        os.makedirs(uploads_dir, exist_ok=True)
        
        safe_name = f"{uuid.uuid4().hex[:8]}_{doc.file_name or 'resume' + os.path.splitext(local_path)[1]}"
        persistent_path = os.path.join(uploads_dir, safe_name)
        
        # Move from temp to uploads
        shutil.copy2(local_path, persistent_path)
        logger.info("Bot saved file to: %s", persistent_path)

        # Save to DB
        top_match_id = matches[0]["id"] if matches else None
        
        # Last safety check for summary format
        summary_val = parsed.get("summary", "")
        if isinstance(summary_val, (dict, list)):
            summary_val = json.dumps(summary_val, ensure_ascii=False)

        async with async_session_factory() as session:
            candidate = Candidate(
                telegram_id=message.from_user.id if message.from_user else None,
                full_name=parsed.get("full_name", ""),
                phone=parsed.get("phone", ""),
                email=parsed.get("email", ""),
                source=SourceType.FILE.value,
                raw_text=raw_text[:5000],  # cap stored text
                summary=summary_val,
                skills_json=skills,
                experience_years=parsed.get("years_experience", 0),
                matched_vacancy_id=top_match_id,
                resume_path=safe_name,
                source_platform="Telegram Bot",
                file_type=ext.lstrip('.'),
            )
            session.add(candidate)
            await session.commit()
    finally:
        # Clean up temp directory
        try:
            shutil.rmtree(tmp_dir)
        except Exception as e:
            logger.warning("Failed to delete temp dir %s: %s", tmp_dir, e)

    # Build response
    name = parsed.get("full_name") or "кандидат"
    lines = [f"<b>✅ Готово, {name}!</b>\n"]

    if skills:
        lines.append(f"🔧 <b>Найденные навыки:</b> {', '.join(skills)}\n")

    if matches:
        lines.append("<b>🎯 Подходящие вакансии:</b>\n")
        for i, m in enumerate(matches[:5], 1):
            bar = "🟩" * (m["match_pct"] // 20) + "⬜" * (5 - m["match_pct"] // 20)
            lines.append(f"  {i}. <b>{m['title']}</b>  {bar} {m['match_pct']}%")
    else:
        lines.append("Подходящих вакансий пока не найдено — но всё равно заходите к нам на стенд! 😊")

    await status_msg.edit_text("\n".join(lines))


@router.message(F.photo)
async def handle_photo(message: types.Message):
    """Обработка прямых фотографий резюме."""
    photo = message.photo[-1]  # Самое большое разрешение
    
    status_msg = await message.answer("⏳ Обрабатываю фото с помощью AI Vision…")
    
    tmp_dir = tempfile.mkdtemp(prefix="hr_magnet_photo_")
    local_path = os.path.join(tmp_dir, f"photo_{photo.file_id}.jpg")
    
    file = await bot.get_file(photo.file_id)
    await bot.download_file(file.file_path, local_path)
    
    try:
        logger.info("Calling parse_resume_image for photo...")
        parsed = await parse_resume_image(local_path)
        logger.info("Parse complete: %s", parsed.get("full_name"))
        
        # Match jobs
        skills = parsed.get("skills", [])
        async with async_session_factory() as session:
            v_res = await session.execute(select(Vacancy).where(Vacancy.is_active == 1))
            vacancies_list = [
                {"id": v.id, "title": v.title, "tags_json": v.tags_json} 
                for v in v_res.scalars().all()
            ]
        matches = match_jobs(skills, vacancies_list)
        
        # Prepare persistent storage
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "resumes")
        os.makedirs(uploads_dir, exist_ok=True)
        
        safe_name = f"{uuid.uuid4().hex[:8]}_photo_{photo.file_id}.jpg"
        persistent_path = os.path.join(uploads_dir, safe_name)
        
        # Move from temp to uploads
        shutil.copy2(local_path, persistent_path)
        logger.info("Bot saved photo to: %s", persistent_path)

        # Save to DB
        top_match_id = matches[0]["id"] if matches else None
        async with async_session_factory() as session:
            candidate = Candidate(
                telegram_id=message.from_user.id if message.from_user else None,
                full_name=parsed.get("full_name", ""),
                phone=parsed.get("phone", ""),
                email=parsed.get("email", ""),
                source=SourceType.FILE.value,
                raw_text=parsed.get("summary", ""),
                summary=parsed.get("summary", ""),
                skills_json=skills,
                experience_years=parsed.get("years_experience", 0),
                matched_vacancy_id=top_match_id,
                resume_path=safe_name,
                source_platform="Telegram Bot",
                file_type="jpg",
            )
            session.add(candidate)
            await session.commit()
    finally:
        # Clean up temp directory
        try:
            shutil.rmtree(tmp_dir)
        except Exception as e:
            logger.warning("Failed to delete temp dir %s: %s", tmp_dir, e)
    
    name = parsed.get("full_name") or "кандидат"
    lines = [f"<b>✅ Распознано, {name}!</b>\n"]
    if skills:
        lines.append(f"🔧 <b>Найденные навыки:</b> {', '.join(skills)}\n")
    if matches:
        lines.append("<b>🎯 Подходящие вакансии:</b>\n")
        for i, m in enumerate(matches[:5], 1):
            bar = "🟩" * (m["match_pct"] // 20) + "⬜" * (5 - m["match_pct"] // 20)
            lines.append(f"  {i}. <b>{m['title']}</b>  {bar} {m['match_pct']}%")

    await status_msg.edit_text("\n".join(lines))


# ──────────────────────────────────────────────
# /export (admin)
# ──────────────────────────────────────────────

@router.message(Command("export"))
async def cmd_export(message: types.Message):
    """Dump all candidates to Excel and send the file."""
    async with async_session_factory() as session:
        result = await session.execute(select(Candidate))
        candidates = result.scalars().all()

    if not candidates:
        await message.answer("📭 В базе данных пока нет кандидатов.")
        return

    rows = []
    for c in candidates:
        rows.append({
            "ID": c.id,
            "ID Telegram": c.telegram_id,
            "ФИО": c.full_name,
            "Телефон": c.phone,
            "Email": c.email,
            "Опыт (лет)": c.experience_years,
            "Источник": c.source,
            "Статус": c.admin_status,
            "Навыки": ", ".join(c.skills_json) if c.skills_json else "",
            "Подходящая вакансия": c.matched_vacancy_id,
            "Дата регистрации": str(c.created_at),
        })

    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    df.to_excel(buf, index=False, engine="openpyxl")
    buf.seek(0)

    doc = BufferedInputFile(buf.read(), filename="candidates_export.xlsx")
    await message.answer_document(doc, caption=f"📊 Экспортировано {len(rows)} кандадат(ов).")
