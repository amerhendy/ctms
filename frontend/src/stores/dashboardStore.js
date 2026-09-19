import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  // الحالة: العقدة المختارة (قسم أو موظف)
  selectedNode: null,
  
  // دالة لتحديث العقدة
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  // دالة لمسح التحديد (العودة للداشبورد العامة)
  clearSelectedNode: () => set({ selectedNode: null }),
}));

export default useDashboardStore;