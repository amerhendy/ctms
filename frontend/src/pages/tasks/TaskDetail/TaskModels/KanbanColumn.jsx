import { TaskStepsApi } from '@/api';
import { GripVertical,Pencil } from 'lucide-react';
import clsx from 'clsx'
import { theme, resolveFieldState } from '@/constants/theme';
import { Avatar } from '@/components/common'
import { useState } from 'react';
import {formatDateTime} from '@/utils/helpers'
export function TaskCard({ step, onEdit,status }) { // أضفنا onEdit كـ Prop
  const columnTheme = theme.kanban.column[status] || theme.kanban.column.backlog;
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("stepId", step.id.toString());
    e.dataTransfer.setData("sourceStatus", step.status);
    e.dataTransfer.setData("stepOrder", step.step_order);
    
  };
  console.log(step);
  
  return (
    <div 
      draggable="true"
      onDragStart={handleDragStart}
      className={clsx(
        "flex items-center justify-between shadow-slate-500/50"
      )}
    >
      <div className="flex items-center justify-between w-full ">
          <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors" />
          {step?.department ? (
              <Avatar name={step?.department?.name || ''} size="sm" />
            ) : step?.assignee ? (
              <Avatar 
                name={step?.assignee?.full_name || ''} 
                src={step?.assignee?.avatar_url || null} 
                size="sm" 
              />
            ) : (
              <div className="placeholder">لا يوجد مستلم</div>
            )}
          <div className="flex flex-col overflow-hidden">
            
            <p className={"text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight line-clamp-2"}>{step.title}</p>
            {step.started_at && (
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{formatDateTime(step.started_at)}</span>
            )}
            
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter ">#{step.step_order}</span>

        {/* زر التعديل */}
        <button
          onClick={() => onEdit(step)} // استدعاء دالة التعديل
          className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
export default function KanbanColumn({ status, items, onDrop,onEdit, taskId,stepsCount }) {
  let totalSlots = 30;
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    const position = i + 1;
    // نبحث عن الخطوة التي لها نفس الترتيب (index)
    return items.find(item => item.step_order === position) || null;
  });
  
  const [isDraggingOver]=useState(true)
  const handleDragOver = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); // أضف هذه لضمان عدم تداخل الأحداث
    e.dataTransfer.dropEffect = "move";
    };

  const handleDrop = (e,step_order) => {
    e.preventDefault();
    e.stopPropagation();
    
    const stepId = e.dataTransfer.getData("stepId");
    const sourceStatus = e.dataTransfer.getData("sourceStatus");
    
    // إضافة حماية: التأكد من وجود الدالة قبل استدعائها
    if (typeof onDrop === 'function') {
      if (sourceStatus !== status) {
        onDrop(stepId, sourceStatus);
      }
    } else {
      console.error("خطأ: onDrop غير معرفة في هذا العمود!");
    }
  };
    const [editingStep, setEditingStep] = useState(null);

      // دالة تفتح المودال وتعطيها بيانات الخطوة
  const handleEditClick = (step) => {
    setEditingStep(step);
    setIsModalOpen(true);
  };
  const taskborder=theme.kanban.column[status]
  return (
    <div 
      className={clsx("flex flex-col overflow-hidden",
        isDraggingOver
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 className={clsx(theme.kanban.column.header,theme.kanban.column.headerText[status])}>
        {status.replace('_', ' ')}
        <span className="ml-2 px-2 py-0.5  rounded-full text-[10px]">
          {items.length}
        </span>
      </h3>
      
      <div className={theme.kanban.column.list}>
        {slots.map((step, index) => (
          <div
            key={index}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const stepId = e.dataTransfer.getData("stepId");
              onDrop(stepId, status, index+1); 
            }}
            className={clsx(
              "group flex flex-col gap-1.5 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg  hover:shadow-md transition-all",
              taskborder.border
            )}
          >
            {step ? (
              <TaskCard status={status} step={step} onEdit={() => onEdit(step)} />
              
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter ">
                  #{index+1}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
