import { useState,useEffect } from 'react';
import { Modal,FormField,ToggleSwitch } from '@/components/common'; // المسار الخاص بمكون المودال الجاهز
import clsx from 'clsx';
import { theme } from '@/constants/theme'; // سنستخدم ثيماتك لتوحيد الشكل
import SidebarTree from '../SidebarTree'
import {formatForInput} from '@/utils/helpers'
export default function AddStepModal({ open, onClose, taskId, onSave,stepData }) {
  const isEditing = !!stepData;
  const [loading, setLoading] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [assignedTo, setAssignedTo] = useState({ type: null, id: null, name: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_parallel: false,
    started_at: '',
    assignee: null // سيحتوي على { id, type }
  });
  useEffect(() => {
    if (stepData) {
      //format assignedTo
      //assigned_department_id
      console.log(stepData.assigned_department_id);
      setAssignedTo({ type: null, id: null, name: '' })
      if(stepData.assigned_department_id !== null){
        setAssignedTo({ type: 'depatment', id: stepData?.assigned_department_id, name: stepData?.department?.name })
      }else{
        setAssignedTo({ type: 'employee', id: stepData?.assigned_user_id, name:  stepData?.assignee.full_name })
      }
      //console.log(assignedTo);
      
      const rawDate = stepData.started_at ? stepData.started_at.substring(0, 16) : '';
      setFormData({
        title: stepData.title || '',
        description:stepData.description || '',
        started_at:rawDate,
        status: stepData.status || 'pending',
        is_parallel: stepData.is_parallel || null
      });
    } else {
      // تنظيف الحقول عند الإضافة
      setFormData({ title: '', status: 'pending', started_at: '' });
    }
  }, [stepData]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(assignedTo.id == null) return;
    formData['assignee']=assignedTo
    
    if (!formData.title || !formData.assignee) return;

    setLoading(true);
    
    // تجهيز البيانات وفقاً للقيد chk_step_assignee
    const payload = {
      title: formData.title,
      description: formData.description,
      is_parallel: formData.is_parallel,
      status: 'pending',
      started_at: formData.started_at,
      ...(formData.assignee.type === 'user' 
          ? { assigned_user_id: formData.assignee.id } 
          : { assigned_department_id: formData.assignee.id })
    };

    try {
      await onSave(taskId, payload);
      onClose();
      // إعادة تعيين الحقول
      setFormData({ title: '', description: '', is_parallel: false, started_at: '', assignee: null });
    } catch (error) {
      console.error("Failed to add step:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "تعديل الخطوة" : "إضافة خطوة جديدة"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* العنوان */}
        <FormField label="العنوان">
          <input
            required
            className={theme.input.base}
            placeholder="أدخل عنوان الخطوة..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </FormField>

        {/* الوصف */}
        <FormField label="الوصف">
          <textarea
            className={clsx(theme.input.base, "min-h-[100px] resize-none")}
            placeholder="شرح تفصيلي للخطوة..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </FormField>
        {/* اختيار المسؤول */}
        <FormField label="المسؤول عن التنفيذ">
          <div className="flex gap-2">
            <div className={clsx(
              "flex-1 h-10 flex items-center px-3 text-sm rounded-lg border",
              "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700",
              assignedTo.id ? "text-slate-900 dark:text-white" : "text-slate-400"
            )}>
              {assignedTo.id ? assignedTo.name : "لم يتم تحديد مسؤول بعد..."}
            </div>
            <button 
              type="button"
              onClick={() => setShowPickerModal(true)} 
              className={theme.button.secondary}
            >
              اختيار
            </button>
          </div>
        </FormField>
    {showPickerModal &&(
        <Modal 
          open={showPickerModal} 
          onClose={() => setShowPickerModal(false)} 
          title="اختر المسؤول عن هذه الخطوة"
          size="md"
        >
          <div className="h-[400px] overflow-y-auto">
            <SidebarTree 
              onSelectNode={(node) => {
                // إذا كان المود يحتوي على خاصية full_name فهو موظف، وإلا فهو قسم
                const type = node.full_name ? 'employee' : 'department';
                console.log(node);
                
                setAssignedTo({
                  type: type,
                  id: node.id,
                  name: node.full_name || node.name
                });
                setShowPickerModal(false);
              }} 
            />
          </div>
        </Modal>
    )}

        {/* تاريخ البدء */}
        <FormField label="تاريخ البدء">
          <input
            type="datetime-local"
            className={theme.input.base}
            value={formData.started_at}
            onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
          />
        </FormField>

        

        {/* التوازي (سويتش عصري) */}
        {/* التوازي (سويتش عصري) */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">توازي في التنفيذ</span>
            <span className="text-[11px] text-slate-400">تفعيل التنفيذ المتوازي للخطوات</span>
          </div>
          
          <ToggleSwitch 
            checked={formData.is_parallel} 
            onChange={() => setFormData({ ...formData, is_parallel: !formData.is_parallel })} 
          />
        </div>

        {/* الأزرار الموحدة */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            إلغاء
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary flex-1 justify-center"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الخطوة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}