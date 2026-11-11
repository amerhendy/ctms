"""
توليد تقرير PDF تفصيلي لشامل أسئلة وإجابات المتقدم.
"""

from datetime import datetime
import re

from reportlab.lib import colors
from reportlab.lib.units import cm
from sqlalchemy.ext.asyncio import AsyncSession

from helpers.pdf_helpers import MARGIN, PAGE_HEIGHT, PAGE_WIDTH, RIGHT_X, NumberedCanvas, ar, get_registered_fonts
from services.exam_service import ExamService


def clean_text(text: str) -> str:
    """تنظيف النص من وسوم HTML والأكواد للعرض في التقرير."""
    if not text:
        return ""
    clean = re.compile('<.*?>')
    cleaned = re.sub(clean, '', text).strip()
    return cleaned.replace('\n', ' ')


def parse_user_answer(item: dict) -> str:
    """استخراج وترجمة إجابة المتقدم من هيكل الـ JSON حسب نوع السؤال."""
    ans = item.get("answer") if isinstance(item, dict) else getattr(item, "answer", None)
    q_type = item.get("q_type") if isinstance(item, dict) else getattr(item, "q_type", None)

    if ans is None:
        return "لم يقم بالإجابة"

    if isinstance(ans, dict):
        if "selected_index" in ans:
            val = ans["selected_index"]
            if isinstance(val, list):
                return f"الخيارات المحددة: {', '.join(map(str, val))}"
            return f"الخيار رقم: {val}"

        if "text" in ans:
            return ans["text"]

        if "ordered_items" in ans and isinstance(ans["ordered_items"], list):
            items_str = " -> ".join([str(x).strip() for x in ans["ordered_items"]])
            return f"الترتيب: {items_str}"

        if q_type == "inline_dropdown":
            selections = [f"[{k}]: {v}" for k, v in ans.items()]
            return " | ".join(selections)

        if "choice" in ans:
            choice_str = "صحيح" if ans["choice"] else "خاطئ"
            justification = ans.get("justification", "")
            if justification:
                return f"الاختيار: {choice_str} (السبب: {justification})"
            return f"الاختيار: {choice_str}"

        return str(ans)

    return str(ans)


def _new_page_header(c, title, regular_font, bold_font):
    c.setFillColor(colors.HexColor("#1a3c6e"))
    c.rect(0, PAGE_HEIGHT - 2.4 * cm, PAGE_WIDTH, 2.4 * cm, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont(bold_font, 16)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 1.5 * cm, ar(title))
    c.setFont(regular_font, 9)
    c.drawCentredString(
        PAGE_WIDTH / 2, PAGE_HEIGHT - 2.1 * cm,
        ar(f"تاريخ الإصدار: {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
    )
    return PAGE_HEIGHT - 3.2 * cm


def _draw_field_row(c, y, label, value, regular_font, bold_font):
    c.setFont(bold_font, 11)
    c.setFillColor(colors.HexColor("#1a3c6e"))
    c.drawRightString(RIGHT_X, y, ar(f"{label}:"))
    c.setFont(regular_font, 11)
    c.setFillColor(colors.black)
    c.drawRightString(RIGHT_X - 4.5 * cm, y, ar(str(value) if value else "-"))
    return y - 0.75 * cm

def draw_user_information(c, y, applicant, result, regular_font, bold_font):
    y -= 0.3 * cm
    c.setFont(bold_font, 12)
    c.setFillColor(colors.HexColor("#1a3c6e"))
    c.drawRightString(RIGHT_X, y, ar("بيانات المتقدم"))
    y -= 0.9 * cm

    full_name = getattr(applicant, "full_name", None) or (applicant.get("full_name") if isinstance(applicant, dict) else "-")
    national_id = getattr(applicant, "national_id", None) or (applicant.get("national_id") if isinstance(applicant, dict) else "-")
    access_code = getattr(applicant, "access_code", None) or (applicant.get("access_code") if isinstance(applicant, dict) else "-")
    
    finished_raw = getattr(applicant, "exam_finished_at", None) or (applicant.get("exam_finished_at") if isinstance(applicant, dict) else None)
    finished = str(finished_raw).split('.')[0].replace('T', ' ') if finished_raw else "-"

    y = _draw_field_row(c, y, "الاسم الكامل", full_name, regular_font, bold_font)
    y = _draw_field_row(c, y, "الرقم القومي", national_id, regular_font, bold_font)
    y = _draw_field_row(c, y, "كود الدخول", access_code, regular_font, bold_font)
    y = _draw_field_row(c, y, "الوظيفة المتقدم لها", result.get("job_model_name", "-"), regular_font, bold_font)
    y = _draw_field_row(c, y, "وقت انتهاء الاختبار", finished, regular_font, bold_font)

    return y

def draw_total_score(c, y, applicant, regular_font, bold_font):
    total_score = getattr(applicant, "total_score", 0) if not isinstance(applicant, dict) else applicant.get("total_score", 0)
    max_score = getattr(applicant, "max_score", 0) if not isinstance(applicant, dict) else applicant.get("max_score", 0)
    total_score = total_score or 0
    max_score = max_score or 0
    percentage = (total_score / max_score * 100) if max_score else 0

    y -= 0.3 * cm
    c.setFillColor(colors.HexColor("#f0f4f8"))
    c.roundRect(MARGIN, y - 1.6 * cm, PAGE_WIDTH - 2 * MARGIN, 1.6 * cm, 6, fill=True, stroke=False)
    c.setFillColor(colors.HexColor("#1a3c6e"))
    c.setFont(bold_font, 13)
    verdict = "ناجح" if percentage >= 60 else "غير مجتاز للحد الأدنى المطلوب"
    if total_score is None or total_score == 0:
        total_score = "______"
        verdict = "______________"
    if max_score is None or max_score == 0:
        max_score = "______"
    c.drawCentredString(
        PAGE_WIDTH / 2, y - 0.7 * cm,
        ar(f"النتيجة النهائية: {total_score} من {max_score} ({percentage:.1f}%)"),
    )
    c.setFont(regular_font, 10)
    
    c.drawCentredString(PAGE_WIDTH / 2, y - 1.3 * cm, ar(f"التقييم العام: {verdict}"))
    return y - 2.2 * cm

from collections import Counter

def parse_violation_type(v) -> str:
    """تحويل كود أو نص المخالفة إلى اسم عربي واضح."""
    v_type = v.get("violation_type") if isinstance(v, dict) else getattr(v, "violation_type", None)
    v_text = v.get("violation_text") if isinstance(v, dict) else getattr(v, "violation_text", "")
    
    val = v_type or v_text or "مخالفة غير محددة"
    
    # ترجمة وتحسين المسميات الشائعة
    if "window_blur" in val or "التركيز" in val:
        return "مغادرة شاشة الاختبار / التنقل بين التبويبات"
    elif "copy_paste" in val or "النسخ" in val:
        return "محاولة النسخ واللصق"
    elif "multiple_faces" in val:
        return "ظهور أكثر من شخص أمام الكاميرا"
    elif "no_face" in val:
        return "عدم التواجد أمام الكاميرا"
        
    return clean_text(val)


def draw_violations(c, y, violations, regular_font, bold_font):
    if not violations:
        return y

    # 1. تجميع المخالفات وعد التكرارات لكل نوع
    violation_counts = Counter()
    for v in violations:
        v_name = parse_violation_type(v)
        violation_counts[v_name] += 1

    # 2. حساب الارتفاع المطلوبة للجدول
    total_violations = len(violations)
    unique_types = list(violation_counts.items())
    
    # ارتفاع الهيدر + صفوف المخالفات + الحواف
    row_height = 0.75 * cm
    header_height = 1.0 * cm
    box_height = header_height + (len(unique_types) * row_height) + 0.4 * cm

    # التحقق من وجود مساحة كافية في الصفحة
    if y - box_height < 3.0 * cm:
        c.showPage()
        y = _new_page_header(c, "تقرير تفصيلي لنتيجة اختبار التوظيف", regular_font, bold_font)

    # 3. رسم الصندوق الخارجي للمخالفات
    c.setFillColor(colors.HexColor("#fff5f5"))
    c.setStrokeColor(colors.HexColor("#feb2b2"))
    c.roundRect(MARGIN, y - box_height, PAGE_WIDTH - 2 * MARGIN, box_height, 6, fill=True, stroke=True)

    # 4. عنوان الصندوق
    c.setFillColor(colors.HexColor("#9b1c1c"))
    c.setFont(bold_font, 11)
    c.drawRightString(RIGHT_X - 0.5 * cm, y - 0.7 * cm, ar(f"سجل المخالفات المكتشفة (إجمالي {total_violations} مخالفة):"))

    # 5. طباعة قائمة المخالفات المجمعة
    current_y = y - 1.4 * cm
    for v_name, count in unique_types:
        # اسم المخالفة (جهة اليمين)
        c.setFont(regular_font, 10)
        c.setFillColor(colors.HexColor("#1f2937"))
        c.drawRightString(RIGHT_X - 0.8 * cm, current_y, ar(f"• {v_name}"))

        # عدد المرات (جهة اليسار)
        c.setFont(bold_font, 10)
        c.setFillColor(colors.HexColor("#c81e1e"))
        c.drawString(MARGIN + 0.8 * cm, current_y, ar(f"تكررت {count} مرة/مرات"))

        current_y -= row_height

    return y - box_height - 0.6 * cm

async def generate_result_pdf(db: AsyncSession, user_id: str, output_path: str) -> str:
    result = await ExamService.get_result(user_id, db)
    return result
    applicant = result["applicant"]
    details = result["details"]
    violations = result["violations"]

    regular_font, bold_font = get_registered_fonts()

    c = NumberedCanvas(output_path, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    y = _new_page_header(c, "تقرير تفصيلي لنتيجة اختبار التوظيف", regular_font, bold_font)

    # بيانات المتقدم (تم تعديل الوصول للخصائص لتناسب كائن SQLAlchemy)
    y= draw_user_information(c, y, applicant, result, regular_font, bold_font)

    

    # النتيجة النهائية
    y = draw_total_score(c, y, applicant, regular_font, bold_font)
    #المخالفات
    y=draw_violations(c, y, violations, regular_font, bold_font)
    

    # عرض الأسئلة بالكامل مع الإجابات
    y -= 0.3 * cm
    c.setFillColor(colors.HexColor("#1a3c6e"))
    c.setFont(bold_font, 12)
    c.drawRightString(RIGHT_X, y, ar("تفاصيل الأسئلة وإجابات المتقدم"))
    y -= 0.8 * cm

    for idx, item in enumerate(details, start=1):
        y=draw_questions_by_type(c, y, [item], regular_font, bold_font)

    # التوقيعات
    if y < 4 * cm:
        c.showPage()
        y = _new_page_header(c, "تقرير تفصيلي لنتيجة اختبار التوظيف", regular_font, bold_font)

    y -= 1.2 * cm
    c.setStrokeColor(colors.HexColor("#999999"))
    c.setFont(regular_font, 10)
    c.setFillColor(colors.black)
    c.line(MARGIN, y, MARGIN + 5 * cm, y)
    c.line(PAGE_WIDTH - MARGIN - 5 * cm, y, PAGE_WIDTH - MARGIN, y)
    y -= 0.5 * cm
    c.drawString(MARGIN, y, ar("توقيع لجنة التصحيح"))
    c.drawRightString(PAGE_WIDTH - MARGIN, y, ar("توقيع مسؤول الموارد البشرية"))

    c.showPage()
    c.save()
    return output_path

def get_q_type_label(q_type: str) -> str:
    """ترجمة أنواع الأسئلة لأسماء أقسام عربية واضحة."""
    labels = {
        "single_choice": "أسئلة الاختيار من متعدد (إجابة واحدة)",
        "multiple_choice": "أسئلة الاختيار من متعدد (إجابات متعددة)",
        "select_all": "أسئلة تحديد الكل",
        "proofreading": "أسئلة التدقيق والتصحيح اللغوي",
        "inline_dropdown": "أسئلة القوائم المنسدلة",
        "ordering": "أسئلة ترتيب العناصر",
        "matching": "أسئلة التوصيل والمطابقة",
        "sjt": "أسئلة المواقف السلوكية (SJT)",
        "excel_grid": "أسئلة مهارات Excel والجداول",
        "image_to_excel": "أسئلة تحويل الصور إلى Excel",
        "summarize_word": "أسئلة تلخيص وصياغة النصوص",
        "true_false_justify": "أسئلة الصواب والخطأ مع التعليل"
    }
    return labels.get(q_type, f"أسئلة قسم ({q_type})")

from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT

def draw_questions_by_type(c, y, details, regular_font, bold_font):
    if not details:
        return y

    # 1. تعريف أنماط النصوص للأسئلة والإجابات لدعم الأسطر المتعددة (Word Wrap)
    style_question = ParagraphStyle(
        'QuestionStyle',
        fontName=bold_font,
        fontSize=10,
        leading=14,  # المسافة بين الأسطر
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#1a3c6e")
    )

    style_user_ans = ParagraphStyle(
        'UserAnsStyle',
        fontName=regular_font,
        fontSize=9.5,
        leading=13,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#000000")
    )

    style_correct_ans = ParagraphStyle(
        'CorrectAnsStyle',
        fontName=regular_font,
        fontSize=9.5,
        leading=13,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#166534")
    )

    grouped_questions = {}
    for item in details:
        q_type = item.get("q_type") if isinstance(item, dict) else getattr(item, "q_type", "other")
        if q_type not in grouped_questions:
            grouped_questions[q_type] = []
        grouped_questions[q_type].append(item)

    global_question_idx = 1
    content_width = PAGE_WIDTH - (2 * MARGIN) - (0.6 * cm) # العرض المتاح للنص داخل الكارت

    for q_type, questions in grouped_questions.items():
        section_title = get_q_type_label(q_type)

        if y < 5.0 * cm:
            c.showPage()
            y = _new_page_header(c, "تقرير تفصيلي لنتيجة اختبار التوظيف", regular_font, bold_font)

        # رسم شريط عنوان القسم
        y -= 0.2 * cm
        c.setFillColor(colors.HexColor("#e2e8f0"))
        c.roundRect(MARGIN, y - 0.9 * cm, PAGE_WIDTH - 2 * MARGIN, 0.9 * cm, 4, fill=True, stroke=False)
        c.setFillColor(colors.HexColor("#0f172a"))
        c.setFont(bold_font, 11)
        c.drawRightString(RIGHT_X - 0.4 * cm, y - 0.65 * cm, ar(f"■ {section_title} ({len(questions)} أسئلة)"))
        y -= 1.3 * cm

        for item in questions:
            q_text_val = item.get("question_text") if isinstance(item, dict) else getattr(item, "question_text", "")
            q_raw_text = clean_text(q_text_val)
            print(q_raw_text)
            user_ans_text = parse_user_answer(item)
            correct_ans_text = parse_correct_answer(item)

            score_val = item.get("score", 0) if isinstance(item, dict) else getattr(item, "score", 0)
            points_val = item.get("points", 0) if isinstance(item, dict) else getattr(item, "points", 0)
            is_correct = item.get("is_correct", False) if isinstance(item, dict) else getattr(item, "is_correct", False)

            if score_val == 0:
                score_val = "0"
            score_info = f"{score_val} / {points_val}"

            # 2. إنشاء فقرات النصوص وتحديد أبعادها ديناميكياً
            p_q = Paragraph(ar(f"سؤال {global_question_idx}: {q_raw_text}"), style_question)
            p_user = Paragraph(ar(f"<b>إجابة المتقدم:</b> {user_ans_text}"), style_user_ans)
            p_correct = Paragraph(ar(f"<b>الإجابة الصحيحة:</b> {correct_ans_text}"), style_correct_ans)

            # حساب الارتفاع المباشر لكل جزء
            _, h_q = p_q.wrap(content_width, PAGE_HEIGHT)
            _, h_user = p_user.wrap(content_width - 2.0 * cm, PAGE_HEIGHT)
            _, h_correct = p_correct.wrap(content_width - 2.0 * cm, PAGE_HEIGHT)

            # حساب الارتفاع الإجمالي للكارت ديناميكياً (حسب طول السؤال والإجابات)
            card_height = h_q + h_user + h_correct + 1.8 * cm

            # التحقق مما إذا كانت الصفحة تتسع للكارت
            if y - card_height < 2.5 * cm:
                c.showPage()
                y = _new_page_header(c, "تقرير تفصيلي لنتيجة اختبار التوظيف", regular_font, bold_font)

            card_bg = colors.HexColor("#fcfcfc")
            border_color = colors.HexColor("#1c7c37") if is_correct else colors.HexColor("#dc2626")
            status_text = "إجابة صحيحة" if is_correct else ("لم يقم بالإجابة" if user_ans_text == "لم يقم بالإجابة" else "إجابة خاطئة")
            status_color = colors.HexColor("#1c7c37") if is_correct else colors.HexColor("#b02a2a")

            # 3. رسم خلفية الكارت بالارتفاع المحسوب
            c.setFillColor(card_bg)
            c.setStrokeColor(border_color)
            c.roundRect(MARGIN, y - card_height, PAGE_WIDTH - 2 * MARGIN, card_height, 4, fill=True, stroke=True)

            # 4. طباعة السؤال كاملاً
            curr_draw_y = y - 0.4 * cm - h_q
            p_q.drawOn(c, MARGIN + 0.3 * cm, curr_draw_y)

            # 5. طباعة إجابة المتقدم كاملة
            curr_draw_y -= (h_user + 0.2 * cm)
            p_user.drawOn(c, MARGIN + 0.3 * cm, curr_draw_y)

            # 6. طباعة الإجابة الصحيحة كاملة
            curr_draw_y -= (h_correct + 0.2 * cm)
            p_correct.drawOn(c, MARGIN + 0.3 * cm, curr_draw_y)

            # 7. طباعة شريط الدرجة والحالة السفلي
            footer_y = y - card_height + 0.35 * cm
            c.setFont(bold_font, 9)
            c.setFillColor(colors.HexColor("#475569"))
            c.drawRightString(RIGHT_X - 0.3 * cm, footer_y, ar(f"الدرجة المستحقة: {score_info}"))

            c.setFillColor(status_color)
            c.drawString(MARGIN + 0.5 * cm, footer_y, ar(f"الحالة: {status_text}"))

            # الانتقال للسؤال التالي
            y -= (card_height + 0.4 * cm)
            global_question_idx += 1

    return y


def parse_correct_answer(item: dict) -> str:
    """استخراج وترجمة الإجابة الصحيحة/النموذجية حسب نوع السؤال."""
    correct = item.get("correct_answer") if isinstance(item, dict) else getattr(item, "correct_answer", None)
    options = item.get("options") if isinstance(item, dict) else getattr(item, "options", [])
    q_type = item.get("q_type") if isinstance(item, dict) else getattr(item, "q_type", None)

    if correct is None:
        return "غير محددة"

    # 1. أسئلة الاختيار من متعدد (إذا كانت الإجابة عبارة عن Index)
    if isinstance(correct, int) and options and correct < len(options):
        return f"{options[correct]} (خيار {correct + 1})"
    
    if isinstance(correct, list):
        # إذا كانت قائمة أرقام خيارات
        if options and all(isinstance(i, int) for i in correct):
            selected_opts = [options[i] for i in correct if i < len(options)]
            return f"الخيارات الصحيحة: {', '.join(selected_opts)}"
        return " | ".join(map(str, correct))

    if isinstance(correct, dict):
        if q_type == "inline_dropdown":
            selections = [f"[{k}]: {v}" for k, v in correct.items()]
            return " | ".join(selections)
        if "choice" in correct:
            choice_str = "صحيح" if correct["choice"] else "خاطئ"
            justification = correct.get("justification", "")
            return f"{choice_str} - التعليل: {justification}" if justification else choice_str

    return str(correct)