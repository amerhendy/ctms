import { useReducer, useEffect } from 'react';
import { TaskStepsApi } from '@/api';

const kanbanReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isSaving: action.payload };
    case 'SET_STEPS':
      return { ...state, data: action.payload, isSaving: false };
    case 'MOVE_STEP': {
      const { stepId, sourceStatus, destStatus,stepOrder } = action.payload; // تأكد من استقبال sourceStatus
      const newSteps = { ...state.data };
      
      // إيجاد العنصر وحذفه
      const sourceCol = [...newSteps[sourceStatus]];
      const stepIndex = sourceCol.findIndex(s => s.id === stepId);
      const [step] = sourceCol.splice(stepIndex, 1);
      
      // تحديث الحالة وإضافته للمكان الجديد
      const updatedStep = { ...step, status: destStatus ,step_order:stepOrder};
      newSteps[sourceStatus] = sourceCol;
      newSteps[destStatus] = [...newSteps[destStatus], updatedStep];
  
      
      return { ...state, data: newSteps };
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

export const useKanban = (taskId) => {
  const [state, dispatch] = useReducer(kanbanReducer, { 
          data: { pending: [], in_progress: [], completed: [], skipped: [] },
          isSaving: false 
        });

  // جلب البيانات
  const fetchAll = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { data } = await TaskStepsApi.listSteps(taskId, { limit: 100 });
    const organized = { pending: [], in_progress: [], completed: [], skipped: [] };
    
    data.forEach(s => organized[s.status]?.push(s));
    dispatch({ type: 'SET_STEPS', payload: organized });
  };

  useEffect(() => { fetchAll(); }, [taskId]);

  // دالة النقل (Drag & Drop)
  const moveStep = async (stepId, sourceStatus, destStatus,stepOrder) => {
    // أ. التحديث الفوري (Optimistic)
    dispatch({ type: 'MOVE_STEP', payload: { stepId, sourceStatus, destStatus,stepOrder } });
    
    // ب. الاتصال بالـ API
    try {
        await TaskStepsApi.updateStep(taskId, stepId, { status: destStatus,step_order:stepOrder });
    } catch (err) {
        console.log("حدث خطأ أثناء التحديث، سيتم التراجع");
        await fetchAll(); // إعادة الجلب عند الخطأ
    } finally {
      await fetchAll();
        //dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return { steps: state.data,isSaving: state.isSaving, moveStep, dispatch };
};