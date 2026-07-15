// src/hooks/useKanban.js

import { useReducer, useEffect, useCallback,useState } from 'react';
import { TaskStepsApi } from '@/api';

// ── الـ Reducer لإدارة حالة الكانبان ──
const kanbanReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isSaving: action.payload };

    case 'SET_STEPS':
      return { ...state, data: action.payload, isSaving: false };

    // ── إضافة خطوة ──
    case 'ADD_STEP': {
      const newStep = action.payload;
      if (!newStep?.id) return state;

      const status = newStep.status || 'pending';
      const newSteps = { ...state.data };
      
      if (!Array.isArray(newSteps[status])) {
        newSteps[status] = [];
      }
      
      // إضافة البطاقة في نهاية العمود
      newSteps[status] = [...newSteps[status], newStep];
      return { ...state, data: newSteps };
    }

    // ── تحديث خطوة ──
    case 'UPDATE_STEP': {
      const updatedStepData = action.payload;
      if (!updatedStepData?.id) return state;

      const newSteps = { ...state.data };
      let stepFound = false;

      for (const statusKey in newSteps) {
        const column = newSteps[statusKey];
        const stepIndex = column.findIndex(s => s.id === updatedStepData.id);
        
        if (stepIndex !== -1) {
          const oldStep = column[stepIndex];
          
          // إذا تغيرت الحالة، انقل البطاقة للعمود الجديد
          if (oldStep.status !== updatedStepData.status) {
            column.splice(stepIndex, 1);
            const destStatus = updatedStepData.status;
            if (!Array.isArray(newSteps[destStatus])) newSteps[destStatus] = [];
            // إضافة في نهاية العمود الجديد
            newSteps[destStatus] = [...newSteps[destStatus], updatedStepData];
          } else {
            // تحديث البيانات في نفس المكان
            column[stepIndex] = { ...oldStep, ...updatedStepData };
          }
          
          stepFound = true;
          break;
        }
      }

      if (!stepFound) return state;
      return { ...state, data: newSteps };
    }

    // ── نقل خطوة (بين الأعمدة أو داخل نفس العمود) ──
    case 'MOVE_STEP': {
      const { stepId, sourceStatus, destStatus, stepOrder } = action.payload;
      const newSteps = { ...state.data };

      // التحقق من وجود المفاتيح
      if (!Array.isArray(newSteps[sourceStatus]) || !Array.isArray(newSteps[destStatus])) {
        console.warn('Invalid status keys in MOVE_STEP', { sourceStatus, destStatus });
        return state;
      }

      // نسخ العمود المصدر
      const sourceCol = [...newSteps[sourceStatus]];
      const stepIndex = sourceCol.findIndex(s => Number(s.id) === Number(stepId));
      if (stepIndex === -1) return state;

      // إزالة البطاقة من المصدر
      const [step] = sourceCol.splice(stepIndex, 1);
      const updatedStep = { ...step, status: destStatus, step_order: stepOrder };

      if (sourceStatus === destStatus) {
        // ── النقل داخل نفس العمود (إعادة الترتيب) ──
        // إدراج البطاقة في الموقع المحدد (stepOrder - 1)
        const insertIndex = stepOrder - 1;
        const newCol = [...sourceCol];
        newCol.splice(insertIndex, 0, updatedStep);
        newSteps[sourceStatus] = newCol;
      } else {
        // ── النقل بين أعمدة مختلفة ──
        newSteps[sourceStatus] = sourceCol;
        // إضافة في نهاية العمود الوجهة (أو حسب الترتيب المطلوب)
        const destCol = [...newSteps[destStatus]];
        // إذا كان stepOrder محدداً، نضعه في المكان المناسب
        if (stepOrder && stepOrder <= destCol.length + 1) {
          destCol.splice(stepOrder - 1, 0, updatedStep);
        } else {
          destCol.push(updatedStep);
        }
        newSteps[destStatus] = destCol;
      }

      return { ...state, data: newSteps };
    }

    // ── حذف خطوة ──
    case 'DELETE_STEP': {
      const { stepId } = action.payload;
      if (!stepId) return state;

      const newSteps = { ...state.data };
      let deleted = false;

      for (const statusKey in newSteps) {
        const column = newSteps[statusKey];
        const stepIndex = column.findIndex(s => s.id === stepId);
        if (stepIndex !== -1) {
          column.splice(stepIndex, 1);
          deleted = true;
          break;
        }
      }

      if (!deleted) return state;
      return { ...state, data: newSteps };
    }

    default:
      return state;
  }
};

// ── الهوك الرئيسي ──
export const useKanban = (taskId) => {
  const [sourceData,setSourceData]=useState()
  const [state, dispatch] = useReducer(kanbanReducer, {
    data: { pending: [], in_progress: [], completed: [], cancelled: [] },
    isSaving: false,
  });
  
  // ── جلب البيانات من الـ API ──
  const fetchAll = useCallback(async () => {
    if (!taskId) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await TaskStepsApi.listSteps(taskId, { limit: 100 });
      setSourceData(data)
      
      const organized = { pending: [], in_progress: [], completed: [], cancelled: [] };
      
      data.forEach((step) => {
        if (organized[step.status]) {
          organized[step.status].push(step);
        } else {
          // لو status غير متوقع، نضعه في pending
          organized.pending.push(step);
        }
      });
      
      dispatch({ type: 'SET_STEPS', payload: organized });
    } catch (error) {
      console.error('فشل جلب خطوات المهمة:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [taskId]);

  // ── جلب تلقائي عند تغيير taskId ──
  useEffect(() => {
    if (taskId) {
      fetchAll();
    }
  }, [taskId, fetchAll]);

  // ── إعادة الجلب (للاستخدام الخارجي) ──
  const refetch = useCallback(() => {
    return fetchAll();
  }, [fetchAll]);

  // ── نقل خطوة ──
  const moveStep = useCallback(async (stepId, sourceStatus, destStatus, stepOrder) => {
    //console.log(stepId, sourceStatus, destStatus, stepOrder);
    if(stepOrder == 0){
      stepOrder=1
    }
    
    // التحقق من صحة المعطيات
    if (!stepId || !sourceStatus || !destStatus) {
      console.warn('moveStep: missing required parameters');
      return;
    }

    // التحديث المتفائل (Optimistic)
    dispatch({
      type: 'MOVE_STEP',
      payload: { stepId, sourceStatus, destStatus, stepOrder },
    });

    // استدعاء API
    try {
      await TaskStepsApi.updateStep(taskId, stepId, {
        status: destStatus,
        step_order: stepOrder,
      });
    } catch (err) {
      console.error('فشل تحديث ترتيب الخطوة:', err);
      // في حالة الفشل، نعيد جلب البيانات لاستعادة الحالة الصحيحة
      await fetchAll();
    }
  }, [taskId, fetchAll]);

  // ── إضافة خطوة ──
  const addStep = useCallback(async (payload) => {
    if (!taskId) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await TaskStepsApi.addStep(taskId, payload);
      // تحديث الحالة محلياً
      dispatch({ type: 'ADD_STEP', payload: data });
      return data;
    } catch (err) {
      console.error('فشل إضافة الخطوة:', err);
      // في حالة الفشل، نعيد جلب البيانات
      await fetchAll();
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [taskId, fetchAll]);

  // ── تعديل خطوة ──
  const updateStep = useCallback(async (stepId, updatedData) => {
    if (!taskId || !stepId) return;

    // التحديث المتفائل (Optimistic) - نمرر البيانات كاملة
    dispatch({
      type: 'UPDATE_STEP',
      payload: { id: stepId, ...updatedData },
    });

    try {
      await TaskStepsApi.updateStep(taskId, stepId, updatedData);
    } catch (err) {
      console.error('فشل تحديث الخطوة:', err);
      // في حالة الفشل، نعيد جلب البيانات لاستعادة الحالة الصحيحة
      await fetchAll();
      throw err;
    }
  }, [taskId, fetchAll]);

  // ── حذف خطوة ──
  const deleteStep = useCallback(async (stepId) => {
    if (!taskId || !stepId) return;

    // التحديث المتفائل (حذف من الـ UI فوراً)
    dispatch({ type: 'DELETE_STEP', payload: { stepId } });

    try {
      await TaskStepsApi.deleteStep(taskId, stepId);
      // بعد نجاح الحذف، نعيد جلب البيانات لتحديث الترتيب من الباك إند
      await fetchAll();
    } catch (err) {
      console.error('فشل حذف الخطوة:', err);
      // في حالة الفشل، نعيد جلب البيانات لاستعادة الحالة الصحيحة
      await fetchAll();
      throw err;
    }
  }, [taskId, fetchAll]);

  // ── إعادة ترتيب الخطوات (للحالات التي تحتاج تحديث جماعي) ──
  const reorderSteps = useCallback(async (stepsOrderList) => {
    if (!taskId) return;
    try {
      await TaskStepsApi.reorderSteps(taskId, stepsOrderList);
      await fetchAll(); // نعيد الجلب بعد إعادة الترتيب
    } catch (err) {
      console.error('فشل إعادة ترتيب الخطوات:', err);
      await fetchAll();
    }
  }, [taskId, fetchAll]);

  return {
    steps: state.data,
    isSaving: state.isSaving,
    sourceData,
    dispatch,          // للمزيد من التحكم (إذا لزم)
    fetchAll,          // جلب البيانات
    refetch,           // إعادة الجلب
    moveStep,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
  };
};