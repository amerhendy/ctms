// src/pages/tasks/TaskDetail/TaskModels/TaskStepCard.jsx

import { useState } from 'react';
import clsx from 'clsx';
import { formatDateTime } from '@/utils/helpers';
import { Avatar,Modal } from '@/components/common';
import { 
  Info, GripVertical, Pencil, Trash2, MoreVertical,
   ChevronDown, ChevronLeft, GitBranch, Rows2 
  } from 'lucide-react';
import InlineEditForm from './InlineEditForm';      
import MoreActionsMenu from './MoreActionsMenu';    
import StepBadge from './StepBadge';                
/**
 * بطاقة الخطوة في لوحة كانبان
 * تعرض بيانات الخطوة مع إمكانية التعديل المضمن، السحب، وعرض الوصف عند hover، وعرض الأبناء تفرعياً
 */
export default function TaskStepCard({
  step,
  onEdit,          // دالة لتعديل البيانات (تستقبل stepId, updatedData)
  onDelete,        // دالة لحذف الخطوة (تستقبل stepId)
  onMove,          // دالة لنقل الخطوة (تستقبل stepId, newStatus, newOrder) – تستخدم للسحب والإفلات
  onAddSubStep,    // دالة لإضافة خطوة فرعية (تستقبل parentStepId)
  onOpenEditModal,
  onOpenInfoModal,
  taskId,
  isDraggable = true,
  index,           // الترتيب الحالي في العمود (للعرض)
  totalSteps,      // إجمالي عدد الخطوات في العمود (لحساب التأخير)
  nextStep,        // الخطوة التالية (لحساب التأخير)
  isChild = false, // ميزة مميزة لمعرفة ما إذا كانت معروضة كابن بالأسفل
  allSteps = {} // 💡 أضف هذا المتغير لاستقبال كافة الخطوات كـ Object أو Map لسهولة الفحص
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [showChildren, setShowChildren] = useState(false); // حالة التحكم في إظهار/إخفاء الأبناء
  const [activeStepForModal, setActiveStepForModal] = useState(null);
  
  // حساب ما إذا كانت الخطوة متأخرة
  const isOverdue = step.started_at && new Date(step.started_at) < new Date() && nextStep?.started_at;
  
  
  // 💡 البحث الصحيح عن الخطوات المعتمد عليها داخل المصفوفة Array
  const dependencies = (step.dependency_ids || [])
    .map(depId => {
      // إذا كانت allSteps مصفوفة، سنبحث عن الخطوة التي تمتلك نفس الـ id
      if (Array.isArray(allSteps)) {
        return allSteps.find(s => s.id === depId);
      }
      // أما إذا كانت كائن مفاتيح (Map) فسنأخذها مباشرة لحمايتها في الحالتين
      return allSteps[depId];
    })
    .filter(Boolean); // حذف أي عناصر لم يتم العثور عليها
  
  // حساب القفل الإجمالي بناءً على الأبناء والاعتماديات
  const hasUnfinishedDependencies = dependencies.some(
    dep => dep.status !== 'completed' && dep.status !== 'cancelled'
  );
  const hasUnfinishedChildren = step.children && step.children.length > 0 && 
    step.children.some(child => child.status !== 'completed' && child.status !== 'cancelled');

  
  // الخطوة مغلقة تماماً عن الإكمال إذا تحقق أي من الشرطين
  const isLockedFromCompletion = hasUnfinishedDependencies || hasUnfinishedChildren;
  
  // الخطوة تكون مقفلة🔒 إذا كانت هناك اعتمادية واحدة على الأقل لم تكتمل (ليست completed وليست cancelled)
  const isLocked = dependencies.some(dep => dep.status !== 'completed' && dep.status !== 'cancelled');

  // بدء السحب
  const handleDragStart = (e) => {
    if (!isDraggable) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('stepId', String(step.id));
    e.dataTransfer.setData('sourceStatus', step.status);
    e.dataTransfer.setData('stepOrder', String(step.step_order));
  };

  const handleSaveEdit = async (updatedData) => {
    await onEdit(step.id, updatedData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => setIsEditing(false);
  const toggleMoreActions = () => setMoreActionsOpen((prev) => !prev);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* جسم البطاقة الأساسي */}
      <div
        className={clsx(
          'group relative flex flex-col rounded-lg border bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md',
          isChild 
            ? 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 mr-4' // شكل مميز للأبناء (شريط متقطع وإزاحة)
            : 'border-slate-200 dark:border-slate-700',
          isOverdue && 'border-l-4 border-l-red-500' 
        )}
        draggable={isDraggable && !isChild}
        onDragStart={handleDragStart}
      >
        <StepBadge step={step} nextStep={nextStep} />

         <>
            <div className="flex items-start gap-2 pt-3 pr-1 relative">
              {/* مقبض السحب (يخفي للأبناء الملتصقين بالداخل للتنظيم البصري) */}
              {!isChild && (
                <div className="flex-shrink-0 pt-0.5 cursor-grab transition-opacity">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                </div>
              )}

              {/* العنوان والترتيب */}
              <div className={clsx('min-w-0 flex-1 relative', isChild && 'pr-3')} onClick={() => setActiveStepForModal(step)}>
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 flex-shrink-0">
                    #{step.step_order}
                  </span>
                  {isChild && <GitBranch className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 transform rotate-180" />}
                  {isLocked && (
                    <span className="text-amber-500 text-xs flex-shrink-0" title="مغلقة: بانتظار متطلبات سابقة لم تنتهِ">
                      🔒
                    </span>
                  )}
                  <span className={clsx(
                    "text-sm font-medium truncate flex-1",
                    isLocked ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800 dark:text-slate-200"
                  )}>
                    {step.title}
                  </span>
                  {/* 🔀 شارة عمل متوازي */}
                  {step.is_parallel && (
                    <span className="text-[9px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                      <Rows2 className="w-4 h-4 text-emerald-500" /> موازية
                    </span>
                  )}
                </div>
              </div>
              

              {/* الأيقونات الإدارية (تعديل/حذف) */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 shadow-sm"
              >
                <button
                  onClick={() => 
                    
                    //setIsEditing(true)
                    onOpenEditModal(step)
                  }
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors"
                  title="تعديل"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDelete(step.id)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (onOpenInfoModal) onOpenInfoModal(step);
                  }}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-500 transition-colors"
                  title="عرض الخطوة"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                <div className="relative">
                  <button
                    onClick={toggleMoreActions}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                    title="المزيد"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {moreActionsOpen && (
                    <MoreActionsMenu
                      step={step}
                      onClose={() => setMoreActionsOpen(false)}
                      onChangeStatus={(newStatus) => onMove(step.id, step.status, newStatus, step.step_order)}
                      onAddSubStep={() => onAddSubStep(step.id)}
                      onEdit={() => 
                        //setIsEditing(true)
                        onOpenEditModal(step)
                      }
                      onDelete={() => onDelete(step.id)}
                      isLockedFromCompletion={isLockedFromCompletion}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* تذييل البطاقة */}
            <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-0 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                {step.assignee ? (
                  <Avatar name={step.assignee.full_name || ''} src={step.assignee.avatar_url} size="sm" />
                ) : step.department ? (
                  <Avatar name={step.department.name || ''} size="sm" className="bg-amber-100 text-amber-700" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-400 text-[10px]">
                    <span>?</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                    {step.assignee?.full_name || step.department?.name || 'غير محدد'}
                  </span>
                  {step.started_at && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {formatDateTime(step.started_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* 💡 3. شريط عرض التبعيات الزمنية (أسفل البطاقة مباشرة وفوق الأبناء الهيكليين) */}
            {dependencies.length > 0 && (
              <div className="px-3 py-1.5 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-400 font-medium">المتطلبات السابقة:</span>
                {dependencies.map(dep => (
                  <span
                    key={dep.id}
                    className={clsx(
                      "text-[9px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1",
                      dep.status === 'completed' || dep.status === 'cancelled'
                        ? "bg-green-50 text-green-700 border-green-200/60 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40"
                        : "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40"
                    )}
                  >
                    {dep.title}
                    <span>{dep.status === 'completed' ? '✓' : '⏳'}</span>
                  </span>
                ))}
              </div>
            )}
            {/* زر إظهار الأبناء تفرعياً (يظهر فقط إن وجد أبناء) */}
              {step.children && step.children.length > 0 && (
                <button
                  onClick={() => setShowChildren(!showChildren)}
                  className="flex items-center gap-0.5 ml-2 p-1 rounded-md text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 transition-all shadow-sm border border-blue-200/50"
                  title="عرض الخطوات التابعة"
                >
                  <span className="text-[10px] px-0.5">{step.children.length}</span>
                  {showChildren ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
              )}
          </>
      </div>

      {/* منطقة عرض الأبناء (Recursive Rendering) */}
      {showChildren && step.children && step.children.length > 0 && (
        <div className="relative flex flex-col gap-2 pr-2 border-r-2 border-dotted border-slate-300 dark:border-slate-600 mr-2 transition-all animate-in fade-in slide-in-from-top-1 duration-200">
          {step.children.map((childStep) => (
            <TaskStepCard
              key={childStep.id}
              step={childStep}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onAddSubStep={onAddSubStep}
              onOpenEditModal={onOpenEditModal}
              onOpenInfoModal={onOpenInfoModal}
              
              taskId={taskId}
              isDraggable={false} // لمنع لخبطة سحب الأبناء تفرعياً خارج مكانهم المخصص
              isChild={true}      // يمرر كـ true ليعطيه الاستايل المنقط والإزاحة
              allSteps={allSteps} // 💡 مررها للأحفاد هنا أيضاً
            />
          ))}
        </div>
      )}
    </div>
  );
}
