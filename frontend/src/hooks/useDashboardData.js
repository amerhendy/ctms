// src/hooks/useDashboardData.js
import { useQuery } from '@tanstack/react-query';
import useDashboardStore from '@/stores/dashboardStore';
import { orgApi, statsApi, tasksApi } from '@/api';

export const useDashboardData = () => {
  const { selectedNode } = useDashboardStore();

  return useQuery({
    queryKey: ['dashboardData', selectedNode?.type, selectedNode?.id],
    queryFn: async () => {
      // الحالة الافتراضية: لو لا يوجد اختيار، نجلب بيانات المستخدم نفسه
      if (!selectedNode) {
        response=await statsApi.get('me').then(r => r.data);
        return response
        
      }
      
      // المنطق الديناميكي لاختيار الـ API
      if (selectedNode.type === 'department') {
        return orgApi.getDeptStats(selectedNode.id); // أو الميثود المناسبة
      }
      if (selectedNode.type === 'employee') {
        return orgApi.getUserStats(selectedNode.id);
      }
    },
    enabled: true // يمكننا لاحقاً التحكم بالـ Caching هنا
  });
};