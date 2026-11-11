"""
منطق تصحيح الاختبارات وحساب النتائج النهائية واسترجاعها.
"""

import json
from datetime import datetime,timezone
import random
from typing import Any, Dict, List
from collections import defaultdict

from fastapi import Depends,HTTPException,Response
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import get_db
from core.config import settings

from helpers.grading_helpers import normalize_text
from repositories.applicant_repository import ApplicantRepository
from repositories.job_model_repository import JobModelRepository
from repositories.question_repository import QuestionRepository
from repositories.response_repository import ResponseRepository
from repositories.violation_repository import ViolationRepository
from schemas.exam import ExamLoginRequest
from services.auth_service import AuthService

class ExamService:
    @staticmethod
    def _select_balanced_questions_by_score(
        all_questions: List[Any], 
        target_score: float = 100.0,
        max_attempts: int = 500
    ) -> List[Any]:
        """
        خوارزمية سحب وتوليد نموذج اختبار بمجموع درجات ثابت ومحدد (target_score).
        
        1. تجميع الأسئلة حسب النوع لضمان التنوع.
        2. محاولة اختيار توليفة عشوائية يحقق مجموع نقاطها target_score بدقة.
        3. الترتيب النهائي للأسئلة حسب النوع (q_type).
        """
        if not all_questions:
            return []

        # حساب إجمالي نقاط بنك الأسئلة المتاحة
        total_pool_score = sum(q.points for q in all_questions)
        
        # إذا كان بنك الأسئلة بالكامل أصغر من أو يساوي المجموع المطلوب، نعيد كل الأسئلة
        if total_pool_score <= target_score:
            selected = all_questions.copy()
            selected.sort(key=lambda q: q.q_type)
            return selected

        # المحاولة العشوائية للوصول لمجموع محدد بدقة
        for _ in range(max_attempts):
            shuffled = all_questions.copy()
            random.shuffle(shuffled)
            
            current_questions = []
            current_score = 0.0
            
            # محاولة ضمان سؤال من كل نوع أولاً
            grouped = defaultdict(list)
            for q in shuffled:
                grouped[q.q_type].append(q)
            
            # سحب سؤال مبدئي من كل نوع
            for q_type, q_list in grouped.items():
                first_q = q_list[0]
                if current_score + first_q.points <= target_score:
                    current_questions.append(first_q)
                    current_score += first_q.points
            
            # استكمال الباقي عشوائياً حتى استيفاء target_score
            remaining_pool = [q for q in shuffled if q not in current_questions]
            for q in remaining_pool:
                if current_score + q.points <= target_score:
                    current_questions.append(q)
                    current_score += q.points
                if current_score == target_score:
                    current_questions.sort(key=lambda q: q.q_type)
                    return current_questions

        # Fallback (في حال عدم التمكن من الوصول لـ target_score بدقة بسبب أوزان غير متوافقة):
        # نختار التوليفة الأقرب دون تجاوز المجموع الهدف
        best_combination = []
        best_score = 0.0
        for _ in range(100):
            shuffled = all_questions.copy()
            random.shuffle(shuffled)
            temp_list = []
            temp_score = 0.0
            for q in shuffled:
                if temp_score + q.points <= target_score:
                    temp_list.append(q)
                    temp_score += q.points
            if temp_score > best_score:
                best_score = temp_score
                best_combination = temp_list

        best_combination.sort(key=lambda q: q.q_type)
        return best_combination
    
    @staticmethod
    async def _get_and_validate_applicant(access_code: str, db: AsyncSession):
        clean_code = access_code.strip().upper()
        applicant = await ApplicantRepository.get_by_identifier(clean_code, db=db)
        
        if not applicant:
            raise HTTPException(status_code=404, detail="كود الدخول غير صحيح")
        if applicant.status == "finished":
            raise HTTPException(status_code=403, detail="لقد قمت بتأدية هذا الاختبار من قبل")
            
        return applicant

    @staticmethod
    async def _start_applicant_exam(applicant, db: AsyncSession):
        if applicant.status == "pending":
            applicant.status = "in_progress"
        if not applicant.exam_started_at:
            applicant.exam_started_at = datetime.now(timezone.utc)
            
        await db.commit()
        await db.refresh(applicant)
        return applicant
    
    @staticmethod
    def _set_session_cookie(response: Response, token: str):
        response.set_cookie(
            key="applicant_session",
            value=token,
            httponly=True,
            samesite="lax",
            max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        )
    ####################################
    @staticmethod
    def _group_questions_by_type(
        all_questions: List[Any],
    ) -> Dict[str, List[Any]]:
        """تجميع الأسئلة في قاموس حسب نوع السؤال q_type."""
        grouped = defaultdict(list)
        for q in all_questions:
            grouped[q.q_type].append(q)
        return grouped

    @staticmethod
    def _select_balanced_questions(
        all_questions: List[Any], target_count: int
    ) -> List[Any]:
        """تطبيق خوارزمية اختيار الأسئلة:

        1. سؤال من كل نوع.
        2. استكمال العدد المتبقي عشوائياً.
        3. فرز ورص الأسئلة المتشابهة خلف بعضها.
        """
        if not all_questions:
            return []

        grouped = ExamService._group_questions_by_type(all_questions)

        chosen_questions = []
        remaining_pool = []

        # 1. سحب سؤال واحد عشوائي من كل نوع لضمان التنوع
        for q_type, q_list in grouped.items():
            shuffled = q_list.copy()
            random.shuffle(shuffled)

            chosen_questions.append(shuffled[0])

            if len(shuffled) > 1:
                remaining_pool.extend(shuffled[1:])

        # 2. الضبط للوصول للعدد المطلوب (target_count)
        if len(chosen_questions) > target_count:
            selected = random.sample(chosen_questions, target_count)
        elif len(chosen_questions) < target_count:
            needed_count = target_count - len(chosen_questions)
            extra_sample_size = min(needed_count, len(remaining_pool))

            extra_questions = (
                random.sample(remaining_pool, extra_sample_size)
                if extra_sample_size > 0
                else []
            )
            selected = chosen_questions + extra_questions
        else:
            selected = chosen_questions

        # 3. تجميع الأسئلة المتشابهة في النوع وراء بعضها متتالية
        selected.sort(key=lambda q: q.q_type)
        return selected

    @staticmethod
    def _format_question_payload(
        q: Any, saved_responses_map: Dict[str, Any]
    ) -> Dict[str, Any]:
        """تنظيف وتنسيق بيانات السؤال المفرد وإخفاء الإجابات الصحيحة قبل إرسالها

        للواجهة.
        """
        data = (
            json.loads(q.question_data)
            if isinstance(q.question_data, str)
            else q.question_data
        )

        # إزالة إجابات الأسئلة من البيانات الحساسة قبل الإرسال
        sensitive_keys = ("correct_index", "answer_keywords", "correct_indices")
        safe_data = {k: v for k, v in data.items() if k not in sensitive_keys}

        saved = saved_responses_map.get(q.id)
        saved_answer = None
        if saved and saved.answer_data:
            saved_answer = (
                json.loads(saved.answer_data)
                if isinstance(saved.answer_data, str)
                else saved.answer_data
            )

        return {
            "id": q.id,
            "q_type": q.q_type,
            "question_text": q.question_text,
            "question_data": safe_data,
            "image_path": q.image_path,
            "points": q.points,
            "saved_answer": saved_answer,
        }

  # -------------------------------------------------------------
  # الدالة الرئيسية
  # -------------------------------------------------------------
    @staticmethod
    @staticmethod
    async def _prepare_questions_payload(
        applicant_id: str, job_model, db: AsyncSession
    ):
        job_model_id = job_model.id

        # 1. جلب السجلات المحفوظة للعميل إن وجدت
        existing_responses = await ResponseRepository.list_by_user(
            user_id=applicant_id, db=db
        )
        saved_responses_map = {r.question_id: r for r in existing_responses}

        if existing_responses:
            # حالة 1: الأسئلة محفوظة ومثبتة مسبقاً لهذا المتقدم
            assigned_q_ids = [r.question_id for r in existing_responses]
            all_questions = await QuestionRepository.get_questions_by_job_model(
                db=db, job_model_id=job_model_id
            )
            selected_questions = [q for q in all_questions if q.id in assigned_q_ids]
        else:
            # حالة 2: دخول لأول مرة -> تطبيق السحب الموزون بناءً على المجموع الهدف
            all_questions = await QuestionRepository.get_questions_by_job_model(
                db=db, job_model_id=job_model_id
            )
            
            # المجموع الهدف (يمكنك افتراض 100 أو قراءته من موديل الوظيفة إن وجد)
            target_score = getattr(job_model, "target_score", 100.0) or 100.0

            # استخدام خوارزمية السحب بالنقاط
            selected_questions = ExamService._select_balanced_questions_by_score(
                all_questions=all_questions, 
                target_score=target_score
            )

            # حفظ التوزيع فوراً لضمان الثبات للمستخدم عند إعادة تحميل الصفحة
            selected_ids = [q.id for q in selected_questions]
            if selected_ids:
                await ResponseRepository.create_initial_questions_for_user(
                    user_id=applicant_id, question_ids=selected_ids, db=db
                )

        # 2. بناء الـ Payload النهائي عبر الدالة المخصصة
        return [
            ExamService._format_question_payload(q, saved_responses_map)
            for q in selected_questions
        ]
    ####################################
    @staticmethod
    async def _prepare_questions_payloads(applicant_id: str, job_model, db: AsyncSession):
        job_model_id = job_model.id
        
        # 1. جلب السجلات المحفوظة الخاصة بالعميل
        existing_responses = await ResponseRepository.list_by_user(user_id=applicant_id, db=db)
        saved_responses_map = {r.question_id: r for r in existing_responses}

        if existing_responses:
            # حالة 1: الأسئلة محفوظة ومثبتة مسبقاً لهذا المستخدم
            assigned_q_ids = [r.question_id for r in existing_responses]
            
            # جلب كائنات الأسئلة المخصصة فقط بناءً على الـ IDs المحفوظة
            all_questions = await QuestionRepository.get_questions_by_job_model(db=db, job_model_id=job_model_id)
            selected_questions = [q for q in all_questions if q.id in assigned_q_ids]
        else:
            # حالة 2: دخول لأول مرة -> اختيار عشوائي وتثبيت بالجدول
            all_questions = await QuestionRepository.get_questions_by_job_model(db=db, job_model_id=job_model_id)
            target_count = getattr(job_model, 'count_questions', len(all_questions)) or len(all_questions)
            
            sample_size = min(target_count, len(all_questions))
            selected_questions = random.sample(all_questions, sample_size) if sample_size > 0 else []

            # حفظ الأسئلة المختارة فوراً في جدول Response لضمان التثبيت للمستخدم
            selected_ids = [q.id for q in selected_questions]
            if selected_ids:
                await ResponseRepository.create_initial_questions_for_user(
                    user_id=applicant_id,
                    question_ids=selected_ids,
                    db=db
                )

        # 2. بناء الـ Payload النهائي المعاد للعميل
        questions_payload = []
        for q in selected_questions:
            data = json.loads(q.question_data) if isinstance(q.question_data, str) else q.question_data
            safe_data = {k: v for k, v in data.items() if k not in ("correct_index", "answer_keywords")}
            
            saved = saved_responses_map.get(q.id)
            saved_answer = None
            if saved and saved.answer_data:
                saved_answer = json.loads(saved.answer_data) if isinstance(saved.answer_data, str) else saved.answer_data

            questions_payload.append({
                "id": q.id,
                "q_type": q.q_type,
                "question_text": q.question_text,
                "question_data": safe_data,
                "image_path": q.image_path,
                "points": q.points,
                "saved_answer": saved_answer,
            })
            
        return questions_payload
    
    @staticmethod
    async def login_exam(payload:ExamLoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
        # Step 1: Validate
        applicant=await ExamService._get_and_validate_applicant(payload.access_code,db)
        # Step 2: Update Exam Status
        applicant = await ExamService._start_applicant_exam(applicant, db)
        # Step 3: Fetch Job Model
        job_model = await JobModelRepository.get_by_id(job_model_id=applicant.job_model_id, db=db)
        #print(job_model.count_questions)
        # Step 4: Session & Cookie
        token = await AuthService.create_applicant_session(applicant_id=applicant.id, db=db)
        ExamService._set_session_cookie(response, token)
        # Step 5: Questions Payload
        questions_payload = await ExamService._prepare_questions_payload(
            applicant_id=applicant.id, 
            job_model=job_model, 
            db=db
        )
        # Step 6: Final Response Format
        return {
            "token": token,
            "user": {
                "id": applicant.id,
                "full_name": applicant.full_name,
                "job_model_name": job_model.name if job_model else "",
                "job_model_count_questions":job_model.count_questions,
                "duration_minutes": job_model.duration_minutes if job_model else 60,
                "exam_started_at": applicant.exam_started_at,
            },
            "questions": questions_payload,
        }

    @staticmethod
    async def grade_answer(question, answer_data, db: AsyncSession = Depends(get_db)):
        q_data = json.loads(question.question_data)
        points = question.points

        if question.q_type == "mcq":
            selected = answer_data.get("selected_index") if answer_data else None
            correct = q_data.get("correct_index")
            try:
                is_correct = selected is not None and int(selected) == int(correct)
            except (TypeError, ValueError):
                is_correct = False
            return is_correct, (points if is_correct else 0)

        if question.q_type in ("excel_formula", "code_correction", "language_check"):
            raw_answer = answer_data.get("text", "") if answer_data else ""
            normalized_answer = normalize_text(raw_answer)
            keywords = q_data.get("answer_keywords", [])
            is_correct = any(
                normalize_text(kw) and normalize_text(kw) in normalized_answer for kw in keywords
            )
            return is_correct, (points if is_correct else 0)

        return False, 0

    @staticmethod
    async def save_and_grade(user_id: str, question_id: str, answer_data, db: AsyncSession):
        question = await QuestionRepository.get_question(db, question_id)
        if not question:
            raise ValueError("السؤال غير موجود")

        is_correct, score = await ExamService.grade_answer(question, answer_data, db)
        stored_answer = json.dumps(answer_data, ensure_ascii=False) if answer_data is not None else None
        await ResponseRepository.upsert(user_id, question_id, stored_answer, is_correct, score, db=db)
        return {"is_correct": is_correct, "score": score}

    @staticmethod
    async def finalize_exam(user_id: str, db: AsyncSession = Depends(get_db)):
        applicant = await ApplicantRepository.get(user_id,db)
        if not applicant:
            raise ValueError("المتقدم غير موجود")
        
        questions = await QuestionRepository.get_questions_by_job_model(db,applicant.job_model_id)
        responses = {r.question_id: r for r in await ResponseRepository.list_by_user(user_id,db)}

        total_score = 0.0
        max_score = 0.0
        details = []
        for q in responses.values():
            resp=q
            resp_id=resp.id
            ques_id=q.question_id
            question = next((quest for quest in questions if quest.id == ques_id), None)
            max_score += question.points
            score = resp.score if resp else 0
            is_correct = bool(resp.is_correct) if resp else False
            total_score += score
            details.append({
                "question_id": question.id,
                "question_text": question.question_text,
                "q_type": question.q_type,
                "points": question.points,
                "score": score,
                "is_correct": is_correct,
                "answer": json.loads(resp.answer_data) if resp and resp.answer_data else None,
            })
        applicant.status = "finished"
        applicant.exam_finished_at = datetime.now(timezone.utc)
        applicant.total_score = total_score
        applicant.max_score = max_score
        await db.commit()

        return {"total_score": total_score, "max_score": max_score, "details": details}

    @staticmethod
    async def get_result(user_id: str, db: AsyncSession = Depends(get_db)):
        applicant = await ApplicantRepository.get(user_id, db)
        if not applicant:
            raise ValueError("المتقدم غير موجود")

        job_model = await JobModelRepository.get_by_id(applicant.job_model_id, db=db)
        
        # 1. جلب إجابات المستخدم
        user_responses = await ResponseRepository.list_by_user(user_id, db)
        
        # 2. جلب جميع الأسئلة وتحويلها إلى Dictionary بـ question_id ليسهل الوصول إليها
        questions = await QuestionRepository.get_questions_by_job_model(db, applicant.job_model_id)
        questions_map = {q.id: q for q in questions}

        details = []
        # 3. الاعتماد الأساسي والدوران يكون على إجابات المستخدم فقط
        for resp in user_responses:
            q = questions_map.get(resp.question_id)
            if not q:
                continue  # في حال كان السؤال غير موجود أو محذوف
                
            details.append({
                "question_id": q.id,
                "question_text": q.question_text,
                "question_data": json.loads(q.question_data) if isinstance(q.question_data, str) else q.question_data,
                "image_path": q.image_path if q.image_path else None,
                "q_type": q.q_type,
                "points": q.points,
                "score": resp.score if resp else 0,
                "is_correct": bool(resp.is_correct) if resp else False,
                "answer": json.loads(resp.answer_data) if resp and resp.answer_data else None,
            })

        violations = await ViolationRepository.list_by_user(user_id, db=db)
        return {
            "applicant": applicant,
            "job_model_name": job_model.name if job_model else "",
            "details": details,
            "violations": violations,
        }
    
    @staticmethod
    async def reset_exam(user_id: str, db: AsyncSession = Depends(get_db)):
        applicant = await ApplicantRepository.get(user_id, db)
        if not applicant:
            raise ValueError("المتقدم غير موجود")

        # إعادة تعيين حالة الاختبار
        applicant.status = "pending"
        applicant.exam_started_at = None
        applicant.exam_finished_at = None
        applicant.total_score = 0
        applicant.max_score = 0

        # حذف جميع الإجابات السابقة
        await ResponseRepository.delete_by_user(user_id, db)
        await ViolationRepository.delete_by_user(user_id, db)

        await db.commit()