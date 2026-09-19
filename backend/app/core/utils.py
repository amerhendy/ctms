# app/core/utils.py
from datetime import datetime, timezone
import logging
import sys
def normalize_arabic(text: str) -> str:
    """
    تحويل النصوص العربية لصيغة قياسية لمنع التكرار الناجم عن اختلاف الحروف.
    تستبدل الهمزات، الياء، والتاء المربوطة بما يعادلها.
    """
    if not text:
        return text
        
    text = text.strip()
    replacements = {
        'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
        'ة': 'ه',
        'ى': 'ي',
        'ؤ': 'و', 'ئ': 'ي',
        'ذ': 'د', 'ز': 'ر', # يمكن تعديلها حسب معايير عملك
    }
    
    # تطبيق الاستبدالات
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    return text

def get_utc_now() -> datetime:
    """
    تُرجع التوقيت الحالي بتنسيق UTC مع معلومات المنطقة الزمنية (Aware).
    مثالية للتخزين في قواعد البيانات (مثل PostgreSQL) لضمان الدقة.
    """
    return datetime.now(timezone.utc)

def get_utc_now_naive() -> datetime:
    """
    تُرجع التوقيت الحالي بتنسيق UTC بدون معلومات المنطقة الزمنية (Naive).
    مثالية للمقارنات البرمجية البسيطة أو عند التعامل مع واجهات (Front-end) لا تدعم المناطق الزمنية.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)

def make_naive(dt: datetime) -> datetime:
    if dt and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

def setup_logger():
    # إنشاء Logger
    logger = logging.getLogger("app_logger")
    logger.setLevel(logging.DEBUG)

    # إنشاء Handler لإخراج الـ Logs إلى الـ Console
    handler = logging.StreamHandler(sys.stdout)
    
    # التنسيق العام الذي تريده (مع اسم الملف ورقم السطر)
    formatter = logging.Formatter(
        '%(asctime)s - %(filename)s:%(lineno)d - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    
    # إضافة الـ Handler للـ Logger إذا لم يكن موجوداً مسبقاً
    if not logger.handlers:
        logger.addHandler(handler)
        
    return logger

# إنشاء نسخة عامة (Singleton) ليتم استيرادها
logger = setup_logger()