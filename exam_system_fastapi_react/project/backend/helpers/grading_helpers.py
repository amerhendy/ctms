"""
دوال مساعدة لتصحيح إجابات الأسئلة النصية (معادلات إكسل، تصحيح أكواد،
تدقيق لغوي) عبر توحيد شكل النص العربي/الإنجليزي قبل المقارنة.
"""

import re


def normalize_text(text) -> str:
    if text is None:
        return ""
    text = str(text).strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ى", "ي").replace("ة", "ه")
    return text.lower()
