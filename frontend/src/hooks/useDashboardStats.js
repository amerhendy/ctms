// src/hooks/useDashboardStats.js
import { useQuery } from '@tanstack/react-query';
import { statsApi, orgApi } from '@/api';
import useDashboardStore from '@/stores/dashboardStore';
export const useDashboardStats = () => {
  const { selectedNode } = useDashboardStore();

  return useQuery({
    // إضافة الـ id والـ type للـ key يضمن إعادة الجلب تلقائياً عند التغيير
    queryKey: ['dashboardSummary', selectedNode?.type, selectedNode?.id],
    
    
    queryFn: async () => {
      // إذا لم يتم اختيار شيء، نجلب بيانات المستخدم الحالي
      if (!selectedNode) {
        let response= await statsApi.getme().then(r => r.data);
        return response
        
      }
      
      // بناءً على نوع العقدة، نحدد الـ API المطلوب
      if (selectedNode.type === 'department') {
        return statsApi.getdepartment(selectedNode.id).then(r => r.data);
      }
      
      if (selectedNode.type === 'employee') {
        return statsApi.getuser(selectedNode.id).then(r => r.data);
      }
    },
    
    // التحديث التلقائي لا يزال فعالاً
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
};