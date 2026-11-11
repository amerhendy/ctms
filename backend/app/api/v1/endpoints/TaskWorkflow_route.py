# app/api/v1/endpoints/TaskWorkflow_route.py
from fastapi import APIRouter, Depends, HTTPException, status

from app.models import User
from app.services.TaskWorkflow_service import TaskWorkflowService
from sqlalchemy.ext.asyncio import AsyncSession

# ─── استيراد الـ Schemas (القديم والجديد) ──────────────────────
from app.schemas.TaskWorkflow_schema import WorkflowOut, WorkflowCreate, WorkflowDiagramUpdate
from app.schemas.workflow_diagram import WorkflowDiagramResponse

from app.db.session import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/workflow", tags=["Workflow"])


# ─── ١. Endpoint موجود (تم تصحيحه) ──────────────────────────────
@router.get("/{task_id}", response_model=WorkflowOut)
async def get_workflow_by_task_id(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """جلب هيكل الـ Workflow كـ Steps (القائمة القديمة)"""
    return await TaskWorkflowService.get_workflow_by_task_id(db, task_id, current_user)


# ─── ٢. Endpoint موجود (تم تصحيح السطور الزائدة) ──────────────
@router.post("/tasks/{task_id}", response_model=WorkflowOut, status_code=201)
async def create_task_workflow(
    task_id: int,
    data: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إنشاء Workflow لمهمة — من قالب أو خطوات مخصصة.
    (تم إزالة الـ return الزائد عشان الـ commit يشتغل صح)
    """
    # تنفيذ الخدمة (هي بترفع Exception لو فيه مشكلة)
    workflow = await TaskWorkflowService.create_workflow(db, task_id, data, current_user)
    
    # حفظ التغييرات في قاعدة البيانات
    await db.commit()
    
    # تحديث الكائن بالبيانات الجديدة (زي الـ steps المرتبطة)
    await db.refresh(workflow, ["steps"])
    
    return workflow


# ─── ٣. 🆕 الـ Endpoint الجديد للمهمة 1.4 ──────────────────────
@router.get("/{task_id}/diagram", response_model=WorkflowDiagramResponse)
async def get_workflow_diagram(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    🆕 جلب الـ Workflow الخاص بمهمة معينة بصيغة ReactFlow (Nodes + Edges).
    هذه الصيغة تستخدم لعرض الـ Workflow كـ رسم بياني تفاعلي في الواجهة الأمامية.
    """
    return await TaskWorkflowService.get_workflow_diagram(db, task_id, current_user)

# ─── ٤. 🆕🆕 Endpoint جديد: تحديث الـ Diagram (المهمة 2.3) ──────
@router.put("/{task_id}/diagram", response_model=WorkflowDiagramResponse)
async def update_workflow_diagram(
    task_id: int,
    diagram_data: WorkflowDiagramUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    🆕 تحديث الـ Workflow بالكامل بناءً على تعديلات المستخدم في ReactFlow.
    - يستقبل Nodes و Edges جديدة.
    - يقوم بحذف وإعادة إنشاء الخطوات والاعتماديات.
    - يُرجع الـ Diagram المحدث بعد الحفظ.
    """
    
    # 2. تنفيذ التحديث باستخدام الخدمة
    return await TaskWorkflowService.update_workflow_from_diagram(
        db=db,
        task_id=task_id,
        diagram_data=diagram_data,
        current_user=current_user,
    )

    # 3. حفظ التغييرات في قاعدة البيانات
    await db.commit()

    # 4. إعادة الـ Diagram المحدث للـ Frontend
    return await TaskWorkflowService.get_workflow_diagram(db, task_id, current_user)
