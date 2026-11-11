// src/pages/tasks/TaskDetail/TaskModels/KanbanDropZone.jsx

import clsx from 'clsx';

export default function KanbanDropZone({
  isDragOver,
  onDrop,
  stepOrder,
  zoneIndex,
  setDragOverIndex,
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    // تحديث المؤشر عند الدخول
    if (setDragOverIndex && zoneIndex !== undefined) {
      setDragOverIndex(zoneIndex);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (setDragOverIndex && zoneIndex !== undefined) {
      setDragOverIndex(zoneIndex);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // إلغاء التحديد عند الخروج، ولكن يجب التحقق من أننا لا نزال داخل المنطقة
    // نتحقق من أن العنصر الذي غادرناه هو المنطقة نفسها وليس عنصراً داخلياً
    const related = e.relatedTarget;
    if (!related || !e.currentTarget.contains(related)) {
      if (setDragOverIndex && zoneIndex !== undefined) {
        setDragOverIndex(null);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const stepId = e.dataTransfer.getData('stepId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    if (stepId && onDrop) {
      onDrop(stepId, sourceStatus, stepOrder);
    }
    if (setDragOverIndex) {
      setDragOverIndex(null);
    }
  };

  return (
    <div
      className={clsx(
        'relative w-full transition-all duration-150 ease-out',
        isDragOver ? 'h-6' : 'h-1'
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-step-order={stepOrder}
      data-zone-index={zoneIndex}
    >
      <div
        className={clsx(
          'absolute inset-0 flex items-center transition-opacity duration-150',
          isDragOver ? 'opacity-100 pointer-events-none' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex-1 h-0.5 bg-blue-500 rounded-full shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 ml-[-2px] shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
        <div className="w-6 h-0.5 bg-blue-500/30 rounded-full flex-shrink-0" />
      </div>
    </div>
  );
}