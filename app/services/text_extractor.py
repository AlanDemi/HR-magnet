"""Extract plain text from PDF and DOCX files.
Handles rotated PDFs by analyzing text span orientation and auto-rotating images.
"""

import logging
import re
import os
import uuid
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

_fitz = None
try:
    import fitz as _fitz
except ImportError:
    try:
        import pymupdf as _fitz
    except ImportError:
        logger.warning("PyMuPDF is NOT installed")

MIN_QUALITY_SCORE = 0.45
MIN_TEXT_LENGTH = 100

def extract_text(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()
    try:
        if suffix == ".pdf":
            return _extract_pdf_smart(path)
        elif suffix == ".docx":
            return _extract_docx(path)
        return ""
    except Exception as exc:
        logger.error("Extraction failed: %s", exc)
        return ""

def _extract_pdf_smart(path: Path) -> str:
    best_text = ""
    best_score = 0.0

    # Strategy 1: PyMuPDF (much better at rotation)
    if _fitz:
        try:
            text = _extract_with_fitz(path)
            score = _text_quality_score(text)
            if score >= MIN_QUALITY_SCORE:
                logger.info("fitz extraction success (quality=%.2f)", score)
                return text
            best_score, best_text = score, text
        except Exception as exc:
            logger.debug("fitz failed: %s", exc)

    # Strategy 2: pypdf fallback
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        for rotation in [0, 90, 180, 270]:
            try:
                text = _extract_with_rotation_pypdf(reader, rotation)
                score = _text_quality_score(text)
                if score > best_score:
                    best_score, best_text = score, text
            except: continue
    except: pass

    if best_score >= MIN_QUALITY_SCORE:
        return best_text
    
    return ""

def _extract_with_rotation_pypdf(reader, rotation: int) -> str:
    text = ""
    for page in reader.pages:
        if rotation != 0: page.rotate(rotation)
        text += (page.extract_text() or "") + "\n"
        if rotation != 0: page.rotate(-rotation)
    return text.strip()

def _extract_with_fitz(path: Path) -> str:
    doc = _fitz.open(str(path))
    all_text = []
    for page in doc:
        # Detect orientation from text blocks
        blocks = page.get_text("dict")["blocks"]
        # Try to find dominant rotation
        rotations = [0, 90, 180, 270]
        rotation_scores = {r: 0 for r in rotations}
        
        for b in blocks:
            if "lines" in b:
                for l in b["lines"]:
                    # dir is vector (cos(a), sin(a))
                    dir = l["dir"]
                    if dir == (1, 0): rotation_scores[0] += 1
                    elif dir == (0, 1): rotation_scores[90] += 1
                    elif dir == (-1, 0): rotation_scores[180] += 1
                    elif dir == (0, -1): rotation_scores[270] += 1

        best_rot = max(rotation_scores, key=rotation_scores.get)
        if best_rot != 0:
            logger.info("Detected dominant text rotation: %d°", best_rot)
            # We don't rotate the page object here to avoid modifying doc, 
            # instead we'll rely on quality score in the caller or image rotation.
            
        all_text.append(page.get_text("text"))
    doc.close()
    return "\n".join(all_text).strip()

def render_pdf_to_image(file_path: str) -> str | None:
    """Render PDF to image with AUTO-ROTATION detection."""
    if not _fitz: return None
    try:
        doc = _fitz.open(file_path)
        page = doc[0]
        
        # 1. Detect dominant rotation angle from text spans
        text_dict = page.get_text("dict")
        scores = {0: 0, 90: 0, 180: 0, 270: 0}
        for b in text_dict["blocks"]:
            if "lines" in b:
                for l in b["lines"]:
                    d = l["dir"]
                    if d == (1, 0): scores[0] += 1
                    elif d == (0, 1): scores[90] += 1
                    elif d == (-1, 0): scores[180] += 1
                    elif d == (0, -1): scores[270] += 1
        
        # If the PDF is a pure scan, scores will be all 0. 
        # In that case, we can't auto-detect without OCR, so we stay at 0.
        best_angle = max(scores, key=scores.get)
        if best_angle != 0:
            logger.info("Auto-rotating image by -%d° to make it upright", best_angle)

        # 2. Render with rotation fix
        # Matrix for 2.5x scale (~180 DPI) for better Vision AI reading
        mat = _fitz.Matrix(2.5, 2.5)
        # Apply the inverse rotation to the pixmap to make text horizontal
        if best_angle != 0:
            # Note: fitz rotation is clockwise
            page.set_rotation(360 - best_angle if best_angle != 0 else 0)
            
        pix = page.get_pixmap(matrix=mat)
        
        temp_dir = tempfile.gettempdir()
        tmp_path = os.path.join(temp_dir, f"hr_fix_{uuid.uuid4().hex}.png")
        pix.save(tmp_path)
        doc.close()
        return tmp_path
    except Exception as exc:
        logger.error("Render failed: %s", exc)
        return None

def _text_quality_score(text: str) -> float:
    if not text or len(text.strip()) < 10: return 0.0
    tokens = text.split()
    if not tokens: return 0.0
    word_pattern = re.compile(r'^[a-zA-Zа-яА-ЯёЁ\-]{2,}[.,;:!?]?$')
    real_words = sum(1 for t in tokens if word_pattern.match(t))
    word_ratio = real_words / len(tokens)
    alnum_ratio = sum(1 for c in text if c.isalnum()) / len(text)
    return min((word_ratio * 0.7) + (alnum_ratio * 0.3), 1.0)

def _extract_docx(path: Path) -> str:
    import docx
    doc = docx.Document(str(path))
    full_text = []

    # 1. Extract Headers (often contain Name/Contacts)
    for section in doc.sections:
        for header in [section.header, section.first_page_header, section.even_page_header]:
            if header:
                for p in header.paragraphs:
                    if p.text.strip():
                        full_text.append(p.text.strip())

    # 2. Extract Body Paragraphs
    for p in doc.paragraphs:
        if p.text.strip():
            full_text.append(p.text.strip())

    # 3. Extract Tables (often used for layout)
    for table in doc.tables:
        for row in table.rows:
            row_text = []
            for cell in row.cells:
                if cell.text.strip():
                    row_text.append(cell.text.strip())
            if row_text:
                full_text.append(" | ".join(row_text))

    return "\n".join(full_text).strip()
