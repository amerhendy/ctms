# app/services/task_step_service.py
from fastapi import HTTPException, status,BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.TaskStep import TaskStep
from app.repositories.task_step_repo import TaskStepRepository
from app.schemas.task_steps import TaskStepCreate, TaskStepUpdate, StepReorderItem,TaskStepOut
from app.repositories.TaskStepDependency_repo import TaskStepDependencyRepository
from app.db.enums import StepStatus
from app.core.permissions import get_task_permissions
from datetime import datetime
from app.services.notification_service import NotificationService
from app.core.utils import logger
class TaskStepService:

    @staticmethod
    def get_icomingParentsAndParents(data):
        parent_ids = data.parent_step_ids or []
        incoming_parent_id = data.parent_id
        incoming_step_depancies=data.parent_step_ids or None
        return[incoming_parent_id,incoming_step_depancies]


    @staticmethod
    async def create_check_incomingParentId(db: AsyncSession, task_id: int,data):
        [incoming_parent_id,incoming_step_depancies]=TaskStepService.get_icomingParentsAndParents(data)
        if incoming_parent_id:
            # جلب الخطوة الأب المقترحة لمعاينتها
            parent_step = await TaskStepRepository.get_by_id(db, incoming_parent_id,task_id)
            if not parent_step:
                raise HTTPException(status_code=404, detail="الخطوة الأب المحددة غير موجودة")
            
            # القاعدة 1: منع التداخل اللانهائي (مسموح بأب وابن فقط)
            if parent_step.parent_id is not None:
                raise HTTPException(
                    status_code=400, 
                    detail="لا يمكن إنشاء خطوة فرعية داخل خطوة فرعية أخرى. مسموح بمستوى تداخل واحد فقط."
                )
                
            # القاعدة 2: الخطوة الفرعية لا يمكن أن تعتمد على خطوات أخرى في جدول التبعيات التدفقية
            if incoming_step_depancies:
                raise HTTPException(
                    status_code=400, 
                    detail="الخطوات الفرعية لا يمكنها امتلاك روابط تبعية زمنية مستقلة؛ تتبع جدول أبنائها فقط."
                )
            return parent_step
    
    @staticmethod
    async def create(db: AsyncSession, task_id: int, data: TaskStepCreate, current_user, background_tasks: BackgroundTasks):
        # 1. التحقق من المهمة والصلاحيات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_add_step:
            raise HTTPException(status_code=403, detail="غير مصرح بإضافة خطوات لهذه المهمة")
        [incoming_parent_id,incoming_step_depancies]=TaskStepService.get_icomingParentsAndParents(data)
        
        # حارس البوابة (Guardrail) للخطوات الفرعية:
        await TaskStepService.create_check_incomingParentId(db=db,task_id=task_id,data=data)
        
        
        
        # تفريغ البيانات مع استبعاد التبعيات المتقاطعة
        #نعزل التبعية عن الداتا المرسلة
        step_dict = data.model_dump(exclude={"parent_step_ids"})

        # 3. تحديد الترتيب تلقائياً إن لم يرسل
        if step_dict.get("step_order") is None:
            # تعديل دالة get_max_order لتقبل الـ parent_id ليكون حساب الترتيب ذكياً ومحلياً
            max_order = await TaskStepRepository.get_max_order(db, task_id, parent_id=incoming_parent_id)
            step_dict["step_order"] = max_order + 1
            
        # 4. حفظ الخطوة في قاعدة البيانات (سواء كانت رئيسية أو فرعية عبر الـ parent_id المتواجد بداخل الـ step_dict)
        db_step = TaskStep(task_id=task_id, **step_dict)
        db_step = await TaskStepRepository.create(db, db_step)

        # 5. حفظ علاقات التبعية في الجدول الوسيط (للخطوات الرئيسية فقط)
        saved_parent_ids = []
        if not incoming_parent_id:  # التبعيات الزمنية للخطوات الكبار فقط
            for p_id in incoming_step_depancies:
                # منع التبعية الذاتية
                if p_id == db_step.id:
                    raise HTTPException(status_code=400, detail="لا يمكن للخطوة أن تعتمد على نفسها")
                
                # منع الاعتماد على خطوة فرعية (الخطوات الكبار تعتمد على كبار مثلها فقط)
                p_step = await TaskStepRepository.get_by_id(db, p_id)
                if p_step and p_step.parent_id is not None:
                    raise HTTPException(status_code=400, detail="لا يمكن لخطوة رئيسية أن تنتظر اكتمال خطوة فرعية")
                
                # حفظ العلاقة الزهرية في جدول العلاقات الوسيط
                await TaskStepDependencyRepository.create_dependency(db, child_step_id=db_step.id, parent_step_id=p_id)
                saved_parent_ids.append(p_id)

        target_user_ids = await TaskService.get_task_staff(db, task)
        await db.commit()
        
        # 6. إرسال الإشعارات بعد نجاح الحفظ
        target_user_ids = await TaskService.get_task_staff(db, task)
        step_type_str = "فرعية" if incoming_parent_id else "رئيسية"
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_created",
                user_id=user_id,
                title=f"تم إضافة خطوة {step_type_str} جديدة",
                body=f"تم إضافة الخطوة '{db_step.title}' في المهمة '{task.title}'",
                related_task_id=task_id
            )
            
        return await TaskStepService.get_task_steps_tree(db, task_id=task_id, current_user=current_user)

    @staticmethod
    async def update_OrderStep(db,DBStep,dataStep,task_id,current_parent_id):
        old_order = DBStep.step_order
        new_order = dataStep.step_order
        if new_order and new_order != old_order:
            # جلب الخطوات الإخوة فقط (التي لها نفس الـ parent_id ونفس الـ task_id وليست محذوفة)
            # ستحتاج لتحديث دالة get_steps_by_task في الـ Repo لتستقبل parent_id اختياري
            all_siblings = await TaskStepRepository.get_steps_by_task(db, task_id, parent_id=current_parent_id)
            if new_order < old_order:
                # الحركة للأعلى: الخطوات الإخوة بين new_order و old_order يتم زيادة ترتيبهم بـ 1
                for s in all_siblings:
                    if new_order <= s.step_order < old_order:
                        await TaskStepRepository.update(db, s.id, {"step_order": s.step_order + 1})
            else:
                # الحركة للأسفل: الخطوات الإخوة بين old_order و new_order يتم تقليل ترتيبهم بـ 1
                for s in all_siblings:
                    if old_order < s.step_order <= new_order:
                        await TaskStepRepository.update(db, s.id, {"step_order": s.step_order - 1})

    @staticmethod
    async def update_StopCompleteStatus(db,data,step_to_update,step_id):
        # 💡 [حماية أمنية جديدة]: منع تحويل الخطوة إلى مكتملة إذا لم تكتمل شروطها
        if data.status == "completed":
            # أولاً: فحص الخطوات الفرعية بالداخل (التبعية الهيكلية)
            if step_to_update.children:
                for child in step_to_update.children:
                    if child.deleted_at is None and child.status not in ["completed", "cancelled"]:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"لا يمكن إنهاء هذه الخطوة لوجود خطوات فرعية غير مكتملة بالداخل مثل: ({child.title})"
                        )
            parent_ids = await TaskStepDependencyRepository.get_parent_step_ids(db, child_step_id=step_id)
            if parent_ids:
                parent_steps = await TaskStepRepository.getStepByparent_ids(db,parent_ids)
                for p_step in parent_steps:
                    if p_step.deleted_at is None and p_step.status not in ["completed", "cancelled"]:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"لا يمكن إكمال هذه الخطوة، يجب إنهاء المتطلب السابق أولاً: ({p_step.title})"
                        )
    @staticmethod
    async def update_DepenciesSteps(db: AsyncSession, step_id: int, recived_data: dict):
        if "dependency_ids" in recived_data:
            raw_dependency_ids = recived_data.pop("dependency_ids")
            
            # 1. تحويل القيمة إلى مصفوفة (List) وتجنب الـ None/Null
            if raw_dependency_ids is None:
                dependency_ids = []
            elif not isinstance(raw_dependency_ids, list):
                dependency_ids = [raw_dependency_ids]
            else:
                dependency_ids = raw_dependency_ids
            
            # 2. تنظيف المصفوفة وتحويل العناصر إلى أرقام صحيحة (Integers)
            dependency_ids = [int(x) for x in dependency_ids if x is not None]
            
            # التحقق 1: منع جعل الخطوة تعتمد على نفسها (الاعتماد الذاتي)
            if step_id in dependency_ids:
                raise HTTPException(
                    status_code=400, 
                    detail="لا يمكن للخطوة أن تعتمد على نفسها كشرط مسبق."
                )
                
            # 3. تحديث جدول العلاقات الوسيط للاعتماديات وفحص التبعية الدائرية
            # نقوم هنا بتمرير الكائن/المعرف الصحيح لقاعدة البيانات
            await TaskStepService.update_step_dependencies(db, step_id, dependency_ids)
            
            # حفظ الاعتماديات في البيانات المعادة للتأكيد والتوثيق فقط
            recived_data['dependency_ids'] = dependency_ids

        return recived_data
    
    @staticmethod
    async def update_step_dependencies(db: AsyncSession, step_id: int, dependency_ids: list[int]):
        """
        تحديث الخطوات التي تعتمد عليها الخطوة الحالية مع ضمان الذرية الكاملة (Atomicity)
        """
        from sqlalchemy import select, delete, insert
        from app.models.TaskStepDependency_Model import TaskStepDependency
        # استخدام block لضمان التراجع التلقائي في حال حدوث أي خطأ
        async with db.begin_nested():  # nested transaction (Savepoint) لعدم تخريب الـ transaction الرئيسية
            
            # جلب خطوة الحالية للتأكد من وجودها ومعرفة الـ task_id الخاص بها
            step_result = await db.execute(select(TaskStep).where(TaskStep.id == step_id))
            step = step_result.scalar_one_or_none()
            if not step:
                raise HTTPException(status_code=404, detail="الخطوة الحالية غير موجودة.")

            # 1. جلب كائنات الخطوات المطلوب الاعتماد عليها لضمان وجودها وتتبعها لنفس المهمة
            if dependency_ids:
                stmt = select(TaskStep).where(
                    TaskStep.id.in_(dependency_ids), 
                    TaskStep.task_id == step.task_id
                )
                result = await db.execute(stmt)
                valid_dependencies = result.scalars().all()
                
                if len(valid_dependencies) != len(dependency_ids):
                    raise HTTPException(
                        status_code=400, 
                        detail="بعض خطوات الاعتمادية المرسلة غير موجودة أو لا تنتمي لنفس المهمة."
                    )

                # 2. فحص ومنع الاعتماد الدائري (Cycle Detection)
                for dep_id in dependency_ids:
                    visited = set()
                    to_visit = [dep_id]
                    
                    while to_visit:
                        curr = to_visit.pop()
                        if curr == step_id:
                            raise HTTPException(
                                status_code=400,
                                detail="حدث تضارب: تم كشف اعتمادية دائرية مغلقة (Circular Dependency)!"
                            )
                        if curr not in visited:
                            visited.add(curr)
                            dep_stmt = select(TaskStepDependency.parent_step_id).where(
                                TaskStepDependency.child_step_id == curr
                            )
                            dep_res = await db.execute(dep_stmt)
                            parents = dep_res.scalars().all()
                            to_visit.extend(parents)

            # 3. تحديث العلاقات في الجدول الوسيط
            # أولاً: حذف الاعتماديات القديمة للخطوة الحالية
            await db.execute(
                delete(TaskStepDependency).where(TaskStepDependency.child_step_id == step_id)
            )

            # ثانياً: إدخال السجلات الجديدة في الجدول الوسيط
            if dependency_ids:
                new_dependencies = [
                    {"child_step_id": step_id, "parent_step_id": dep_id}
                    for dep_id in dependency_ids
                ]
                await db.execute(insert(TaskStepDependency), new_dependencies)

            # يتم عمل flush تلقائي للمرحلة الحالية بنجاح عند الخروج من الـ nested block

    @staticmethod
    async def update(db: AsyncSession, task_id: int, step_id: int, data: TaskStepUpdate, current_user, background_tasks: BackgroundTasks):
        # 1. التحقق من المهمة والصلاحيات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_edit_step:
            raise HTTPException(status_code=403, detail="غير مصرح بتعديل خطوات لهذه المهمة")
        
        # 2. جلب الخطوة الحالية من قاعدة البيانات والتحقق من وجودها وعدم حذفها
        step_to_update = await TaskStepRepository.get_by_id(db, step_id)
        stepFromDB=step_to_update
        if not stepFromDB or stepFromDB.deleted_at is not None:
            raise HTTPException(status_code=404, detail="الخطوة غير موجودة أو تم حذفها")
        
        #عمل order
        old_order = stepFromDB.step_order
        new_order = data.step_order
        current_parent_id = stepFromDB.parent_id # الاحتفاظ بـ parent_id الحالي لعزل عملية الترتيب
        # 3. منطق إعادة الترتيب المعزول (إذا كان هناك تغيير في الترتيب الممرر)
        await TaskStepService.update_OrderStep(db,stepFromDB,data,task_id,current_parent_id)
        await TaskStepService.update_StopCompleteStatus(db,data,stepFromDB,step_id)
        
        # 4. تحديث البيانات الأصلية (بما فيها الـ step_order الجديد)
        recived_data = data.model_dump(exclude_unset=True)
        # حماية إضافية: منع تغيير الـ parent_id عبر دالة التحديث العادية لمنع كسر الهيكلية بالخطأ
        recived_data = await TaskStepService.update_DepenciesSteps(db,step_id,recived_data)
        # 3. تحديث بقية الحقول العادية
        for key, value in recived_data.items():
            setattr(stepFromDB, key, value)
        
        await db.commit()
        await db.refresh(step_to_update)
        # 5. إرسال الإشعارات بعد الحفظ الناجح
        target_user_ids = await TaskService.get_task_staff(db, task)
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_updated",
                user_id=user_id,
                title="تم تعديل خطوة",
                body=f"تم تعديل تفاصيل الخطوة '{step_to_update.title}' في المهمة '{task.title}'",
                related_task_id=task_id
            )
        
        # جلب البيانات المحدثة لإرجاعها
        return await TaskStepRepository.get_by_id(db, step_id)

        logger.debug(data)
        logger.debug(recived_data)
        return 
    
    @staticmethod
    async def change_status(db: AsyncSession, task_id: int, step_id: int, status: StepStatus, current_user, background_tasks: BackgroundTasks):
        # 1. التحقق من وجود المهمة وصلاحيات المستخدم
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_edit_step:
            raise HTTPException(status_code=403, detail="غير مصرح بتعديل حالة الخطوات في هذه المهمة")

        # 2. جلب الخطوة المعنية والتحقق منها ومن عدم حذفها soft-deleted
        step = await TaskStepRepository.get_by_id(db, step_id)
        if not step or step.deleted_at is not None:
            raise HTTPException(status_code=404, detail="الخطوة غير موجودة أو تم حذفها")

        # 3. [قاعدة الأبناء] إذا كان المستخدم يحاول إغلاق خطوة رئيسية (Completed)
        if status == StepStatus.completed:
            # إذا كانت هذه الخطوة هي خطوة رئيسية (ليس لها parent_id)
            if step.parent_id is None:
                # جلب كافة أبنائها النشطين (غير المحذوفين)
                from sqlalchemy import select
                from app.models.TaskStep import TaskStep
                stmt = select(TaskStep).where(TaskStep.parent_id == step.id, TaskStep.deleted_at.is_(None))
                result = await db.execute(stmt)
                active_children = result.scalars().all()
                
                # التحقق: إذا كان هناك أي ابن غير مكتمل، نمنع إغلاق الخطوة الأب فوراً
                for child in active_children:
                    if child.status != StepStatus.completed:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"لا يمكن إغلاق الخطوة الرئيسية لأن الخطوة الفرعية '{child.title}' لا تزال غير مكتملة."
                        )

        # 4. [قاعدة التبعيات] التحقق من التبعيات التدفقية (للخطوات الرئيسية فقط)
        # الخطوة الفرعية (التي تمتلك parent_id) لا يتم حظرها بتبعيات خارجية
        if status in [StepStatus.in_progress, StepStatus.completed] and step.parent_id is None:
            # جلب الخطوات التي يجب أن تنتهي أولاً (الآباء في جدول التبعيات)
            parent_dependencies = await TaskStepDependencyRepository.get_parents_by_child(db, child_step_id=step_id)
            for dep in parent_dependencies:
                # جلب كائن الخطوة الأب في التبعية للتأكد من حالتها الحالية
                p_step = await TaskStepRepository.get_by_id(db, dep.parent_step_id)
                if p_step and p_step.deleted_at is None and p_step.status != StepStatus.completed:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"لا يمكن بدء أو إغلاق هذه الخطوة حتى تكتمل الخطوة الرئيسية السابقة: '{p_step.title}'"
                    )

        # 5. تحديث الحقول الزمنية والبيانات بناءً على الحالة الجديدة
        update_data = {"status": status}
        if status == StepStatus.in_progress and not step.started_at:
            update_data["started_at"] = datetime.now()
        elif status == StepStatus.completed:
            update_data["completed_at"] = datetime.now()
            update_data["completed_by"] = current_user.id
        elif status == StepStatus.pending:
            # إعادة التصفير إذا تراجعت الحالة لـ pending
            update_data["started_at"] = None
            update_data["completed_at"] = None
            update_data["completed_by"] = None

        # تطبيق التحديث في قاعدة البيانات
        await TaskStepRepository.update(db, step_id, update_data)
        await db.commit()

        # 6. إرسال الإشعارات للخلفية لإعلام الفريق بتغير الحالة
        target_user_ids = await TaskService.get_task_staff(db, task)
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_status_changed",
                user_id=user_id,
                title="تحديث في حالة الخطوة",
                body=f"تغيرت حالة الخطوة '{step.title}' إلى ({status.value}) في المهمة '{task.title}'",
                related_task_id=task_id
            )

        return await TaskStepRepository.get_by_id(db, step_id)

    @staticmethod
    async def delete(db: AsyncSession, task_id: int, step_id: int, current_user):
        # 1. التحقق من وجود المهمة وصلاحيات المستخدم للحذف
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_delete_step:
            raise HTTPException(status_code=403, detail="غير مصرح بحذف خطوات في هذه المهمة")

        # 2. جلب الخطوة المراد حذفها والتحقق من وجودها
        step_to_delete = await TaskStepRepository.get_by_id(db, step_id)
        if not step_to_delete or step_to_delete.deleted_at is not None:
            raise HTTPException(status_code=404, detail="الخطوة غير موجودة أو تم حذفها بالفعل")

        current_parent_id = step_to_delete.parent_id
        now_time = datetime.now()

        # 3. [الحذف المتتالي للأبناء] إذا كانت الخطوة المحذوفة رئيسية (أب)
        if step_to_delete.parent_id is None:
            from sqlalchemy import update
            from app.models.TaskStep import TaskStep
            
            # عمل Soft Delete جماعي لكل الأبناء التابعين لهذه الخطوة
            stmt_children = (
                update(TaskStep)
                .where(TaskStep.parent_id == step_id, TaskStep.deleted_at.is_(None))
                .values(deleted_at=now_time)
            )
            await db.execute(stmt_children)

        # 4. عمل Soft Delete للخطوة الأساسية المطلوبة
        await TaskStepRepository.delete(db, step_id) # ستقوم الدالة في الـ Repo بتحديث الـ deleted_at للخطوة وتنظيف الـ Dependencies

        # 5. إعادة ترقيم الخطوات الإخوة فقط (Reindexing) لملء الفراغ في الترتيب
        # إذا كانت الخطوة المحذوفة فرعية، نعيد ترقيم الفروع داخل نفس الأب، وإذا كانت رئيسية، نعيد ترقيم رئيسيات المهمة
        all_siblings = await TaskStepRepository.get_steps_by_task(db, task_id, parent_id=current_parent_id)
        for index, sibling in enumerate(all_siblings):
            sibling.step_order = index + 1

        await db.commit()

        # 6. إرجاع الشجرة المحدثة بالكامل بعد الحذف والترتيب الجديد
        return await TaskStepService.get_task_steps_tree(db, task_id=task_id, current_user=current_user)

    @staticmethod
    async def reorder(db: AsyncSession, task_id: int, steps: list[StepReorderItem], current_user, background_tasks: BackgroundTasks):
        # 1. التحقق من المهمة والصلاحيات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_edit_step:
            raise HTTPException(status_code=403, detail="غير مصرح بتعديل ترتيب الخطوات")
        
        if not steps:
            return {"message": "المصفوفة فارغة، لم يتم تعديل شيء"}

        # 2. معرفة نطاق الترتيب (هل الترتيب يتم لخطوات رئيسية أم لخطوات فرعية تابعة لأب؟)
        # نأخذ أول خطوة مرسلة لنفحص الـ parent_id الخاص بها في قاعدة البيانات
        first_step_id = steps[0].id
        first_step_db = await TaskStepRepository.get_by_id(db, first_step_id)
        
        if not first_step_db or first_step_db.deleted_at is not None:
            raise HTTPException(status_code=404, detail="إحدى الخطوات المراد ترتيبها غير موجودة أو محذوفة")
            
        target_parent_id = first_step_db.parent_id

        # 3. تنفيذ التحديث الجماعي للترتيب المرسل من الفرونت إند
        await TaskStepRepository.bulk_update_order(db, steps)
        
        # 4. إعادة الترقيم (Reindex) المعزول والمحمى:
        # نقوم بتمرير الـ target_parent_id لكي يعيد الـ Repo ترقيم الإخوة فقط دون المساس بباقي شجرة الخطوات
        await TaskStepRepository.reindex_all(db, task_id, parent_id=target_parent_id)
        await db.commit()
        
        # 5. إرسال إشعار للفريق بأن الترتيب قد تغير
        target_user_ids = await TaskService.get_task_staff(db, task)
        step_level_str = "الفرعية" if target_parent_id else "الرئيسية"
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_reordered",
                user_id=user_id,
                title=f"تم تغيير ترتيب الخطوات {step_level_str}",
                body=f"قام {current_user.full_name} بتغيير ترتيب الخطوات {step_level_str} في المهمة '{task.title}'",
                related_task_id=task_id
            )
            
        return {"message": f"تم إعادة ترتيب الخطوات {step_level_str} بنجاح وعزل تسلسلها"}
    
    @staticmethod
    async def get_steps_by_task(db: AsyncSession, task_id: int, current_user):
        # 1. التحقق من المهمة والصلاحيات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_view: # تأكد من اسم الصلاحية المناسب لديك
             raise HTTPException(status_code=403, detail="غير مصرح بعرض خطوات هذه المهمة")

        return await TaskStepService.get_task_steps_tree(db,task_id=task_id,current_user=current_user)
        # 2. بناء الاستعلام من الـ Repository
        steps = await TaskStepRepository.get_steps_by_task(db, task_id)
        # تحويل الكائنات مع استخراج الـ parent_step_ids دون وقوع مشكلة الأداء N+1
        result = []
        for step in steps:
            out = TaskStepOut.model_validate(step)
            out.parent_step_ids = [dep.parent_step_id for dep in step.dependencies]
            result.append(out)
        return result
    
    @staticmethod
    async def get_step_parents_ids(db: AsyncSession, step_id: int) -> list[int]:
        """دالة جلب معرفات الآباء المباشرين لخطوة معينة"""
        return await TaskStepDependencyRepository.get_parent_step_ids(db, child_step_id=step_id)

    @staticmethod
    async def get_parent_details(db: AsyncSession, step_id: int) -> list[TaskStep]:
        """دالة جلب كائنات وتفاصيل خطوات الآباء بالكامل للتحقق من حالاتهم"""
        parent_ids = await TaskStepDependencyRepository.get_parent_step_ids(db, child_step_id=step_id)
        parents = []
        for p_id in parent_ids:
            # هنا نفترض وجود دالة جلب حسب المعرف في المستودع
            from app.repositories.task_step_repo import TaskStepRepository
            # جلب مبسط
            stmt = select(TaskStep).where(TaskStep.id == p_id)
            res = await db.execute(stmt)
            p_step = res.scalar_or_none()
            if p_step:
                parents.append(p_step)
        return parents


    @staticmethod
    async def get_task_steps_tree(db: AsyncSession, task_id: int, current_user):
        # 1. التحقق من المهمة والصلاحيات لعرض الخطوات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_view:
            raise HTTPException(status_code=403, detail="غير مصرح لك بعرض خطوات هذه المهمة")

        # 2. جلب *كل* الخطوات (الرئيسية والفرعية معاً) بضربة واحدة من قاعدة البيانات بكفاءة عالية
        steps = await TaskStepRepository.get_steps_by_task(db, task_id, fetch_all_for_tree=True)
        
        # 3. بناء قاموس التخزين المفرود (Flat Nodes Dictionary) لعمل الـ Mapping السريع
        nodes = {}
        for step in steps:
            out = TaskStepOut.model_validate(step)
            # تعبئة مصفوفة التبعيات التدفقية للخطوات الرئيسية
            out.dependency_ids = [dep.parent_step_id for dep in step.dependencies]
            nodes[step.id] = {
                **out.model_dump(),
                "children": [] # تجهيز مصفوفة استقبال الخطوات الفرعية
            }
            
        roots = []
        
        # 4. الممر الأحادي الذكي (Single-pass): بناء الهيكل الشجري بناءً على الـ parent_id الجديد
        for step in steps:
            current_node = nodes[step.id]
            
            if step.parent_id is None:
                # إذا لم يكن لها parent_id، فهي خطوة رئيسية تظهر في جذر المصفوفة (Root Level)
                roots.append(current_node)
            else:
                # إذا كان لها parent_id، نقوم بحقنها فوراً داخل قائمة children الخاصة بأبيها المباشر في الذاكرة
                if step.parent_id in nodes:
                    nodes[step.parent_id]["children"].append(current_node)
                    
        # 5. إعادة الشجرة مرتبة ومنظمة بالكامل للفرونت إند
        return roots