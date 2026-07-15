// src/pages/tasks/TaskDetail/TaskModels/KanbanBoard.jsx

import clsx from 'clsx';
import { useState, useCallback } from 'react';
import { useKanban } from '@/hooks/useKanban';
import KanbanColumn from './KanbanColumn';
import AddStepModal from './AddStepModal';
import { TaskStepsApi } from '@/api';
import { theme } from '@/constants/theme';
import toast from 'react-hot-toast';
import { getApiError } from '@/utils/helpers';
import {ConfirmDialog} from '@/components/common'
import { StepInfoModal } from './StepInfoModal';
/**
 * لوحة كانبان لعرض وإدارة خطوات المهمة
 * تدعم الإضافة، التعديل، الحذف، النقل بين الأعمدة، وإعادة الترتيب
 */
export default function KanbanBoard({ taskId, taskPermissions }) {
  // ── استخدام هوك الكانبان ──
  const { sourceData,steps, isSaving, moveStep, updateStep, deleteStep, addStep, dispatch, refetch } =
    useKanban(taskId);

  // ── حالات المودال والإضافة ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [parentStepId, setParentStepId] = useState(null);

  const [isDeleteDiaglogOpen, setIsDeleteDiaglogOpen] = useState(false);
  const [stepIdToDelete, setStepIdToDelete] = useState(null);

  const [infoStepData, setInfoStepData] = useState(null);
  const openInfoModal = useCallback((step) => {
    setInfoStepData(step);
  }, []);
  const closeInfoModal = useCallback(() => {
    setInfoStepData(null);
  }, []);
  // ── صلاحيات المستخدم ──
  const canEdit = taskPermissions?.can_edit_task ?? false;

  // ── دوال العمليات ──

  // إضافة خطوة (من المودال أو من العمود)
  const handleAddStep = useCallback(
    async (payload) => {
      if (!taskId) return;
      setIsSubmitting(true);
      try {
        const { data } = await TaskStepsApi.addStep(taskId, payload);
        // تحديث الحالة عبر dispatch (يضيف الخطوة في العمود المناسب)
        dispatch({ type: 'ADD_STEP', payload: data });
        toast.success('تم إضافة الخطوة بنجاح');
        return data;
      } catch (err) {
        toast.error(getApiError(err) || 'فشل إضافة الخطوة');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [taskId, dispatch]
  );

  // تعديل خطوة (من المودال أو من البطاقة)
  const handleUpdateStep = useCallback(
    async (stepId, updatedData) => {
      if (!taskId || !stepId) return;
      setIsSubmitting(true);
      try {
        // تحديث محلي (Optimistic) عبر updateStep من الهوك
        await updateStep(stepId, updatedData);
        toast.success('تم تحديث الخطوة بنجاح');
      } catch (err) {
        toast.error(getApiError(err) || 'فشل تحديث الخطوة');
        // updateStep في الهوك تقوم بالتراجع في حالة الفشل
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [taskId, updateStep]
  );

  // حذف خطوة
  const handleDeleteStep = useCallback(
    async (stepId) => {
      if (!taskId || !stepId) return;
      setIsSubmitting(true);
      try {
        await TaskStepsApi.deleteStep(taskId, stepId);
        dispatch({ type: 'DELETE_STEP', payload: { stepId } });
        await refetch();
        toast.success('تم حذف الخطوة بنجاح');
      } catch (err) {
        toast.error(getApiError(err) || 'فشل حذف الخطوة');
        await refetch();
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [taskId, dispatch, refetch]
  );
  const triggerDeleteConfirm = useCallback((stepId) => {
    setStepIdToDelete(stepId);
    setIsDeleteDiaglogOpen(true);
  }, []);

  // 3. دالة التعامل مع إلغاء الحذف وتفريغ الـ State
  const handleDeleteCancel = () => {
    setIsDeleteDiaglogOpen(false);
    setStepIdToDelete(null);
  };

  // نقل خطوة (السحب والإفلات أو تغيير الحالة من القائمة)
  const handleMoveStep = useCallback(
    async (stepId, sourceStatus, destStatus, stepOrder) => {
      if (!taskId) return;
      
      try {
        await moveStep(stepId, sourceStatus, destStatus, stepOrder);
        // moveStep في الهوك تقوم بالتحديث المتفائل وإعادة الجلب عند الفشل
        // لا حاجة لإعادة جلب هنا إلا إذا أردنا تحديث إضافي
      } catch (err) {
        toast.error(getApiError(err) || 'فشل نقل الخطوة');
        throw err;
      }
    },
    [taskId, moveStep]
  );

  // ── دوال التعامل مع المودال ──
  const openAddModal = (parentId = null) => {
    // إذا مررت بطاقة المهمة true كنوع من الـ Boolean أو لم تمرر شيء، نعتبرها خطوة رئيسية (null)
    if (parentId === true || !parentId) {
      setParentStepId(null);
      
    } else {
      setParentStepId(parentId);
    }
    setEditingStep(null); // التأكد من أنها عملية إضافة وليست تعديل
    setIsModalOpen(true);
  };
  const openEditModal = (step) => {
    setEditingStep(step);
    setParentStepId(step.parent_id || null); // لو كانت الخطوة المراد تعديلها فرعية بالأساس
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStep(null);
  };

  // ── حفظ من المودال (للتعديل والإضافة) ──
  const handleModalSave = async (taskID,payload) => {
    if (editingStep) {
      // تعديل
      await handleUpdateStep(editingStep.id, payload);
    } else {
      // إضافة
      console.trace(payload);
      
      await handleAddStep(payload);
    }
    closeModal();
  };

  // ── حالة التحميل ──
  if (isSaving) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* ─── رأس اللوحة ─── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">لوحة الكانبان</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            إدارة خطوات المهمة بالسحب والإفلات
          </p>
        </div>
        <span className='text-red-500'>
          صلاحيات تعديل الخطوة لمنشئ الخطوة
          وتحويل الخطوة من الى لمنشئ الخطوة والمختص بها
        </span>
        {canEdit && (
          <button
            onClick={openAddModal}
            className={clsx(theme.button.primary, 'px-4 py-2 text-sm')}
          >
            + إضافة خطوة
          </button>
        )}
      </div>

      {/* ─── الأعمدة ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {Object.entries(steps).map(([status, items]) => (
          <KanbanColumn
            key={status}
            status={status}
            items={items}
            taskId={taskId}
            onAdd={handleAddStep}                 // إضافة خطوة (من العمود)
            onEdit={handleUpdateStep}             // تعديل خطوة (من البطاقة)
            onDelete={triggerDeleteConfirm}           // حذف خطوة (من البطاقة)
            onMove={handleMoveStep}               // نقل خطوة (من السحب أو القائمة)
            onOpenEditModal={openEditModal}       // فتح مودال التعديل (للحالات المتقدمة)
            onOpenAddModal={(step)=>{
              openAddModal(step);
              
            }}
            canEdit={canEdit}
            isSubmitting={isSubmitting}
            onOpenInfoModal={openInfoModal}
            allData={sourceData}
          />
        ))}
      </div>

      {/* ─── مودال الإضافة/التعديل (للحالات المتقدمة) ─── */}
      <AddStepModal
        open={isModalOpen}
        onClose={closeModal}
        parent_id={parentStepId}
        taskId={taskId}
        stepData={editingStep}
        onSave={handleModalSave}
        isSubmitting={isSubmitting}
        steps={sourceData}
      />

      {/* 3. إدراج مودال عرض البيانات وتمرير الـ State له */}
      <StepInfoModal 
        step={infoStepData} 
        onClose={closeInfoModal} 
      />

      {/* 4. إدراج مكون الـ ConfirmDialog داخل الـ Render */}
      <ConfirmDialog
        open={isDeleteDiaglogOpen}
        onClose={handleDeleteCancel}
        onConfirm={() => {
          if (stepIdToDelete) {
            handleDeleteStep(stepIdToDelete);
          }
        }}
        title="حذف الخطوة"
        message="هل أنت متأكد من رغبتك في حذف هذه الخطوة؟ سيؤدي هذا الإجراء إلى حذف كافة الخطوات الفرعية المرتبطة بها أيضاً ولا يمكن التراجع عنه."
        danger={true}
      />
    </div>
  );
}