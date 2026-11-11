"""
أدوات مساعدة مشتركة لتوليد تقارير PDF بدعم كامل للغة العربية: تسجيل الخط
العربي (Noto Naskh Arabic إن وُجد)، تشكيل النص وضبط اتجاهه (RTL)، وكلاس
مخصص لترقيم الصفحات تلقائياً بصيغة "صفحة X من Y".
"""

import os

import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from core.config import settings

FONT_REGULAR_PATH = os.path.join(settings.FONTS_DIR, "NotoNaskhArabic-Regular.ttf")
FONT_BOLD_PATH = os.path.join(settings.FONTS_DIR, "NotoNaskhArabic-Bold.ttf")

_REGULAR_FONT_NAME = "Helvetica"
_BOLD_FONT_NAME = "Helvetica-Bold"
_fonts_registered = False

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 2 * cm
RIGHT_X = PAGE_WIDTH - MARGIN


def get_registered_fonts():
    """تسجيل الخط العربي مرة واحدة فقط، مع الرجوع لـ Helvetica إن لم يوجد ملف الخط."""
    global _fonts_registered, _REGULAR_FONT_NAME, _BOLD_FONT_NAME
    if _fonts_registered:
        return _REGULAR_FONT_NAME, _BOLD_FONT_NAME

    if os.path.exists(FONT_REGULAR_PATH):
        pdfmetrics.registerFont(TTFont("ArabicFont", FONT_REGULAR_PATH))
        _REGULAR_FONT_NAME = "ArabicFont"

    if os.path.exists(FONT_BOLD_PATH):
        pdfmetrics.registerFont(TTFont("ArabicFont-Bold", FONT_BOLD_PATH))
        _BOLD_FONT_NAME = "ArabicFont-Bold"
    elif os.path.exists(FONT_REGULAR_PATH):
        _BOLD_FONT_NAME = "ArabicFont"

    _fonts_registered = True
    return _REGULAR_FONT_NAME, _BOLD_FONT_NAME


def ar(text) -> str:
    """تشكيل النص العربي وضبط اتجاهه ليظهر بشكل صحيح داخل ملف PDF."""
    if text is None:
        return ""
    reshaped = arabic_reshaper.reshape(str(text))
    return get_display(reshaped)


class NumberedCanvas(canvas.Canvas):
    """كلاس وارث من canvas.Canvas يضيف ترقيم صفحات تلقائي 'صفحة X من Y'."""

    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_page_number(self, total_pages):
        regular_font, _ = get_registered_fonts()
        self.setFont(regular_font, 9)
        self.setFillColor(colors.HexColor("#666666"))
        text = ar(f"صفحة {self._pageNumber} من {total_pages}")
        self.drawCentredString(PAGE_WIDTH / 2, 1.2 * cm, text)
        self.setStrokeColor(colors.HexColor("#cccccc"))
        self.line(2 * cm, 1.6 * cm, PAGE_WIDTH - 2 * cm, 1.6 * cm)
