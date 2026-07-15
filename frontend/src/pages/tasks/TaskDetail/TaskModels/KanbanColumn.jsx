// src/pages/tasks/TaskDetail/TaskModels/KanbanColumn.jsx

import { useState, useRef } from 'react';
import clsx from 'clsx';
import { theme } from '@/constants/theme';
import TaskStepCard from './TaskStepCard';
import KanbanDropZone from './KanbanDropZone';
import InlineEditForm from './InlineEditForm';
import {Step_STATUS_CONFIG} from '@/utils/helpers'

/**
 * عمود كانبان يعرض قائمة الخطوات حسب حالتها
 * يدعم السحب والإفلات، الإضافة المضمنة، وإعادة الترتيب
 */
export default function KanbanColumn({
  status,
  items = [],
  taskId,
  onAdd,          // دالة لإضافة خطوة (تستقبل payload)
  onEdit,         // دالة لتعديل خطوة (تستقبل stepId, updatedData)
  onDelete,       // دالة لحذف خطوة (تستقبل stepId)
  onMove,         // دالة لنقل خطوة (تستقبل stepId, sourceStatus, destStatus, stepOrder)
  onOpenEditModal, // (اختياري) فتح مودال التعديل المتقدم
  onOpenAddModal,  // (اختياري) فتح مودال الإضافة
  onOpenInfoModal,
  canEdit = true,
  isSubmitting = false,
  allData=[],
}) {
  // ── حالات السحب والإضافة ──
  const [dragOverIndex, setDragOverIndex] = useState(null); // null أو رقم (index of drop zone)
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingSubmitting, setIsAddingSubmitting] = useState(false);

  // ── مرجع للعمود (للسحب والإفلات) ──
  const columnRef = useRef(null);
  const allStepsMap = {};
  
  // فرضاً أن مصفوفة الخطوات القادمة من الباك اند اسمها items
  allData.forEach(step => {
    allStepsMap[step.id] = step;
    
    // إذا كانت الخطوة تحتوي على خطوات فرعية بالداخل، نضيفها أيضاً للقاموس
    if (step.children && step.children.length > 0) {
      step.children.forEach(child => {
        allStepsMap[child.id] = child;
      });
    }
  });
  
  // ── معالج الإفلات العام (على العمود نفسه) ──
  const handleColumnDrop = (e) => {
    e.preventDefault();
    const stepId = e.dataTransfer.getData('stepId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    if (stepId && sourceStatus && sourceStatus !== status) {
      // إفلات في نهاية العمود (آخر ترتيب)
      const newOrder = items.length + 1;
      onMove(stepId, sourceStatus, status, newOrder);
    }
    setDragOverIndex(null);
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // ── معالج الإفلات من DropZone ──
  const handleDrop = (stepId, sourceStatus, stepOrder) => {
    if (stepId && sourceStatus) {
      onMove(stepId, sourceStatus, status, stepOrder);
    }
    setDragOverIndex(null);
  };

  // ── معالج إضافة خطوة جديدة (من InlineEditForm) ──
  const handleAddSubmit = async (payload) => {
    setIsAddingSubmitting(true);
    try {
      // تعيين الحالة الحالية للعمود
      const dataToSend = {
        ...payload,
        status: status,
        step_order: items.length + 1,
      };
      await onAdd(dataToSend);
      setIsAdding(false);
    } catch (error) {
      // الخطأ معالج بالفعل في onAdd (toast)
      console.error('فشل إضافة الخطوة:', error);
    } finally {
      setIsAddingSubmitting(false);
    }
  };

  // ── إلغاء الإضافة ──
  const handleAddCancel = () => {
    setIsAdding(false);
  };
  // ── عنوان العمود مع العدد ──
  const statusLabels = {};
  const statusColors = {};

  Object.entries(Step_STATUS_CONFIG).forEach(([key, { label, color }]) => {
    statusLabels[key] = label;
    statusColors[key] = color; // أو يمكنك تحويلها إلى border حسب رغبتك
  });


  return (
    <div
      ref={columnRef}
      className={clsx(
        'flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-xl border',
        statusColors[status] || 'border-slate-200 dark:border-slate-700',
        'transition-colors duration-200'
      )}
      onDrop={handleColumnDrop}
      onDragOver={handleColumnDragOver}
    >
      {/* ─── رأس العمود ─── */}
      <div
        className={clsx(
          'flex items-center justify-between px-4 py-3 border-b rounded-xl border',
          statusColors[status] || 'border-slate-200 dark:border-slate-700'
        )}
      >
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {statusLabels[status] || status}
          </h4>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {items.length}
          </span>
        </div>
        {canEdit && status == "pending" && (
          <button
          onClick={() => {
            if (onOpenAddModal) onOpenAddModal(null); // تمرير null صراحة لتعني خطوة رئيسية
          }}
          disabled={isSubmitting}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
        >
            + إضافة
          </button>
        )}
        
      </div>

      {/* ─── قائمة البطاقات ─── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[100px]">
        {/* منطقة إفلات قبل أول بطاقة */}
        <KanbanDropZone
          isDragOver={dragOverIndex === 0}
          onDrop={handleDrop}
          stepOrder={1}
        />
        

        {/* ─── فورم الإضافة المضمنة (في الأسفل) ─── */}
        {isAdding && (
          <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-primary-200 dark:border-primary-800 shadow-sm">
            <InlineEditForm
              initialData={{}}
              onSave={handleAddSubmit}
              onCancel={handleAddCancel}
              taskId={taskId}
              isSubmitting={isAddingSubmitting}
              isAdding={true}
            />
          </div>
        )}  

        {items.map((step, index) => {
          // الترتيب الفعلي = index + 1
          const stepOrder = index + 1;
          const nextStep = items[index + 1] || null;
          const zoneIndex = stepOrder; 
          return (
            <div key={step.id} className="relative">
              {/* البطاقة */}
              <TaskStepCard
                step={step}
                taskId={taskId}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                onAddSubStep={() => {
                  if (onOpenAddModal) {
                    // فتح المودال مع تمرير parent_step_id
                    // سنقوم بتعديل AddStepModal لاستقبال parent_step_id
                    onOpenAddModal(step.id);
                  }
                }}
                onOpenEditModal={onOpenEditModal}
                onOpenInfoModal={onOpenInfoModal}
                index={index}
                totalSteps={items.length}
                nextStep={nextStep}
                isDraggable={canEdit}
                allSteps={allStepsMap}
              />

              {/* منطقة إفلات بين البطاقات (بعد كل بطاقة) */}
              <KanbanDropZone
                isDragOver={dragOverIndex === zoneIndex}
                onDrop={handleDrop}
                stepOrder={stepOrder + 1}
                zoneIndex={zoneIndex}
                setDragOverIndex={setDragOverIndex}
              />
            </div>
          );
        })}

        {/* ─── رسالة عند عدم وجود خطوات ─── */}
        {items.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
            <p className="text-sm">لا توجد خطوات</p>
            {canEdit && (
              <button
                onClick={() => setIsAdding(true)}
                className="mt-2 text-xs text-primary-500 hover:text-primary-600 transition-colors"
              >
                + أضف أول خطوة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}