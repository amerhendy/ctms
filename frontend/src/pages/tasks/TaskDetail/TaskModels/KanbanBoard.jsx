import clsx from 'clsx'
import { useEffect, useReducer, useState } from 'react';
import { useKanban } from '@/hooks/useKanban'; // الهوك الذي بنيناه
import KanbanColumn from './KanbanColumn';
import AddStepModal from './AddStepModal';
import { TaskStepsApi } from '@/api';
import { tasksApi } from '@/api'
import { theme, resolveFieldState } from '@/constants/theme';
// 1. تعريف الـ Reducer لإدارة حالة المهام
/*
const kanbanReducers = (state, action) => {
  switch (action.type) {
    case 'SET_STEPS':
      return action.payload;

    case 'MOVE_STEP': {
      const { stepId, sourceStatus, destStatus,stepOrder } = action.payload; // تأكد من استقبال sourceStatus
      const newSteps = { ...state };
      console.log(newSteps);
      
      // إيجاد العنصر وحذفه
      const sourceCol = [...newSteps[sourceStatus]];
      const stepIndex = sourceCol.findIndex(s => s.id === stepId);
      const [step] = sourceCol.splice(stepIndex, 1);
      
      // تحديث الحالة وإضافته للمكان الجديد
      const updatedStep = { ...step, status: destStatus ,step_order:stepOrder};
      newSteps[sourceStatus] = sourceCol;
      newSteps[destStatus] = [...newSteps[destStatus], updatedStep];
  
      
      return newSteps;
    }

    case 'ADD_STEP':
      const { stepId, sourceStatus, destStatus } = action.payload;
  
        // 1. نسخ الحالات الحالية
        const newSteps = { ...state };
        
        // 2. إيجاد العنصر
        const sourceCol = [...newSteps[sourceStatus]];
        const stepIndex = sourceCol.findIndex(s => s.id === stepId);
        const [step] = sourceCol.splice(stepIndex, 1);
        
        // 3. تحديث الحالة في العنصر ونقله
        const updatedStep = { ...step, status: destStatus };
        newSteps[sourceStatus] = sourceCol;
        newSteps[destStatus] = [...newSteps[destStatus], updatedStep];
        return newSteps; // إرجاع كائن جديد تماماً (هذا يضمن الـ Re-render)

    default:
      return state;
  }
};
*/
export default function KanbanBoard({ taskId }) {
    const { steps, isSaving,moveStep, dispatch, } = useKanban(taskId);
    //const [steps, dispatch] = useReducer(kanbanReducer, { pending: [], in_progress: [], completed: [], skipped: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStep, setEditingStep] = useState(null);

 
const handleEditClick = (step) => {
    setEditingStep(step); // نخزن بيانات الخطوة
    setIsModalOpen(true); // نفتح المودال
  };
  // 3. دالة الحفظ التي ستمرر للـ Modal
  const handleSaveStep = async (tId, payload) => {
    const { data } = await TaskStepsApi.addStep(tId, payload);
    dispatch({ type: 'ADD_STEP', payload: data });
  };
  const handleDrop = async (stepId, sourceStatus, destStatus,stepOrder) => {
    if (!destStatus) return;

    // 2. منع السحب أثناء وجود عملية حفظ جارية (باستخدام الـ state التي أضفناها)
    if (isSaving) {
        console.warn("جاري معالجة عملية سابقة، يرجى الانتظار...");
        return;
    }

    // 3. استدعاء دالة moveStep
    // هنا نمرر البيانات التي يحتاجها الـ reducer
    await moveStep(
        stepId,          // stepId
        sourceStatus,   // sourceStatus
        destStatus, // destStatus
        stepOrder
    );
  };
    
  return (
    <div className="flex flex-col h-full p-4 bg-slate-50 dark:bg-slate-950">
      {isSaving ? (
        <div className="loading-overlay">جاري الحفظ...</div>
      ):(
        <>
        {/* رأس اللوحة */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">لوحة المهام (Kanban)</h2>
          <p className="text-sm text-slate-500">إدارة ومتابعة مراحل سير العمل</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)} 
          className={clsx(theme.button.base, theme.button.primary, "px-3 py-1.5")}
        >
          إضافة خطوة جديدة
        </button>
      </div>

      {/* منطقة الأعمدة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
        {Object.entries(steps).map(([status, items]) => (
          <div key={status} className={clsx(
        theme.kanban.column.container,
        theme.kanban.column.containerBorder[status]
      )}>
            <KanbanColumn 
              status={status} 
              items={items} 
              taskId={taskId}
              onDrop={(stepId, sourceStatus,stepOrder) => handleDrop(stepId, sourceStatus, status,stepOrder)}
              onEdit={(step) => {
                      setEditingStep(step);
                      setIsModalOpen(true);
                    }}
            />
          </div>
        ))}
      </div></>
      )}
      

      {/* المودال */}
      <AddStepModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskId={taskId}
        stepData={editingStep}
        onSave={handleSaveStep}
      />
    </div>
  );
}