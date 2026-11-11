//pages/tasks/TaskStepsManager.jsx
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, Loader2, Trash2, ArrowUp, ArrowDown, X, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ToggleSwitch } from '@/components/common'
import { TaskStepsApi } from '@/api'
import { getApiError, formatDate } from '@/utils/helpers'
import clsx from 'clsx'

export default function TaskStepsManager({ 
  taskId, 
  taskPermissions, 
  initialSteps = [], 
  onStepsChange, 
  mode = 'edit' 
}) {
    const queryClient = useQueryClient()
    const isCreateMode = mode === 'create'
    const canEditStep = taskPermissions?.can_edit_step ?? true
    const canAddStep = taskPermissions?.can_add_step ?? true

    const [allSteps, setAllSteps] = useState(initialSteps)

    const [showAddStep, setShowAddStep] = useState(false)
    const [addStepText, setAddStepText] = useState('')

    const [editingStepId, setEditingStepId] = useState(null)
    const [editingText, setEditingText] = useState('')

    useEffect(() => {
        setAllSteps(initialSteps)
    }, [initialSteps])

    const handleToggleStep = (stepId, isCompleted) => {
        if (!isCreateMode) {
        setAllSteps(prev => prev.map(s => s.id === stepId ? { ...s, is_completed: !isCompleted } : s))
        stepMutation.mutate({ stepId, data: { is_completed: !isCompleted } })
        } else {
        updateState(allSteps.map(s => s.id === stepId ? { ...s, is_completed: !isCompleted } : s))
        }
    }

    const handleAddStep = () => {
        if (!addStepText.trim()) return
            const newStep = { 
            id: Date.now(), // ID مؤقت للإنشاء
            description: addStepText.trim(), 
            is_completed: false,
            step_order: allSteps.length + 1
        }
        updateState([...allSteps, newStep])
        if (!isCreateMode) addStepMutation.mutate({ description: addStepText.trim(), task_id: taskId })
            setAddStepText('')
            setShowAddStep(false)
    }

    const startEditing = (step) => {
        setEditingStepId(step.id)
        setEditingText(step.description)
    }

    const handleMoveStep = (index, direction) => {
        // direction يمكن أن تكون 'up' أو 'down'
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // التحقق من الحدود
        if (targetIndex < 0 || targetIndex >= allSteps.length) return;

        const newSteps = [...allSteps];
        
        // تبديل العنصر
        const [movedItem] = newSteps.splice(index, 1);
        newSteps.splice(targetIndex, 0, movedItem);

        // إعادة تعيين step_order بناءً على الترتيب الجديد
        const reorderedSteps = newSteps.map((step, idx) => ({
        ...step,
        step_order: idx + 1 // الترتيب يبدأ من 1
        }));

        // تحديث الحالة
        updateState(reorderedSteps);
    };

    const updateState = (newSteps) => {
        setAllSteps(newSteps)
        if (isCreateMode && onStepsChange) {
        onStepsChange(newSteps)
        }
    }

    const saveEditing = (stepId) => {
        const updatedSteps = allSteps.map(s => 
        s.id === stepId ? { ...s, description: editingText.trim() } : s
        )
        updateState(updatedSteps)
        setEditingStepId(null)
    }

    const handleDeleteStep = (stepId) => {
        if (!isCreateMode) deleteStepMutation.mutate(stepId)
        else updateState(allSteps.filter(s => s.id !== stepId))
    }

    // Mutations
    const stepMutation = useMutation({
        mutationFn: ({ stepId, data }) => TaskStepsApi.updateStep(taskId, stepId, data),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task-steps', parseInt(taskId)] })
        setEditingStepId(null)
        }
    })

    const addStepMutation = useMutation({
        mutationFn: (data) => TaskStepsApi.addStep(taskId, data),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task-steps', parseInt(taskId)] })
        setAddStepText('')
        setShowAddStep(false)
        }
    })

    const deleteStepMutation = useMutation({
        mutationFn: (stepId) => TaskStepsApi.deleteStep(taskId, stepId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-steps', parseInt(taskId)] })
    })

return (
    <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold">الخطوات الفرعية ({allSteps.length})</h3>
            {canAddStep && (
            <button onClick={(e) => {
                    e.preventDefault(); // منع أي سلوك افتراضي
                    e.stopPropagation(); // منع وصول الحدث للأب
                    setShowAddStep(!showAddStep);
                }}
                className="text-xs text-primary-600 font-bold">
                <Plus className="w-4 h-4 inline" /> إضافة خطوة
            </button>
            )}
        </div>
        {showAddStep && (
            <div className="flex gap-2">
                <input className="input flex-1 h-8 px-2 text-xs border rounded-lg" value={addStepText} onChange={(e) => setAddStepText(e.target.value)} />
                <button onClick={handleAddStep} className="btn-primary text-xs h-8 px-3">إضافة</button>
            </div>
        )}

        <div className="space-y-2">
            {
                allSteps.map(
                    (step, index) => (
                        <div key={step.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                            <div className="flex flex-col">
                            <button 
                                disabled={index === 0} 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleMoveStep(index, 'up');
                                }}
                                className="disabled:opacity-30"
                            >
                                <ArrowUp className="w-3 h-3" />
                            </button>
                            <button 
                                disabled={index === allSteps.length - 1} 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleMoveStep(index, 'down');
                                }}
                                className="disabled:opacity-30"
                            >
                                <ArrowDown className="w-3 h-3" />
                            </button>
                            </div>
                            <ToggleSwitch 
                                checked={step.is_completed}
                                onChange={() => handleToggleStep(step.id, step.is_completed)}
                                disabled={isCreateMode}
                            />
                            {editingStepId === step.id ? (
                                <div className="flex flex-1 gap-2">
                                    <input 
                                    value={editingText} 
                                    onChange={(e) => setEditingText(e.target.value)} 
                                    className="flex-1 input h-8 px-2"
                                    />
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            saveEditing(step.id);
                                        }}
                                        className="text-green-600"
                                    >حفظ</button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setEditingStepId(null);
                                        }}
                                        className="text-gray-400">X</button>
                                </div>
                            ):(
                                <div className="flex flex-1 items-center gap-2">
                                    <span className="flex-1">{step.description}</span>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            startEditing(step);
                                        }}
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <button onClick={() => handleDeleteStep(step.id)} className="text-red-400 hover:text-red-600 mr-auto">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )
                )
            }
        </div>
    </div>
)
}