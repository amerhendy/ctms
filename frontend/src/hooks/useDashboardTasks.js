import { useQuery } from '@tanstack/react-query';
import { tasksApi,transfersApi,notificationsApi } from '@/api';
import useDashboardStore from '@/stores/dashboardStore';

export const useDashboardTasks = (params = {}) => {
  //console.log(params)
  const { selectedNode } = useDashboardStore();

  return useQuery({
    queryKey: ['dashboardTasks', selectedNode?.type, selectedNode?.id, params],
    queryFn: async () => {
      
      // بناء الـ queryParams بناءً على نوع العقدة
      const queryParams = { ...params };
      
      if (selectedNode?.type === 'department') {
        queryParams.department_id = selectedNode.id;
      } else if (selectedNode?.type === 'employee') {
        queryParams.assignee_id = selectedNode.id;
      }
      response=tasksApi.list(queryParams).then(r => r.data);
      console.log(params);
      
      return tasksApi.list(queryParams).then(r => r.data);
    },
    staleTime: 30000, // تحديث المهام كل 30 ثانية
    refetchOnWindowFocus: false,
  });
};
export const useDashboardPendingTransfareTasks = (params = {}) => {
  const { selectedNode } = useDashboardStore();

  return useQuery({
    queryKey: ['dashboardTasks', selectedNode?.type, selectedNode?.id, params],
    queryFn: async () => {
      // بناء الـ queryParams بناءً على نوع العقدة
      const queryParams = { ...params };
      
      if (selectedNode?.type === 'department') {
        queryParams.department_id = selectedNode.id;
      } else if (selectedNode?.type === 'employee') {
        queryParams.assignee_id = selectedNode.id;
      }

      return transfersApi.pending(queryParams).then(r => r.data);
    },
    staleTime: 30000, // تحديث المهام كل 30 ثانية
    refetchOnWindowFocus: false,
  });
};
export const useDashboardUnRead = (params = {}) => {
  const { selectedNode } = useDashboardStore();

  return useQuery({
    queryKey: ['dashboardTasks', selectedNode?.type, selectedNode?.id, params],
    queryFn: async () => {
      // بناء الـ queryParams بناءً على نوع العقدة
      const queryParams = { ...params };
      
      if (selectedNode?.type === 'department') {
        queryParams.department_id = selectedNode.id;
      } else if (selectedNode?.type === 'employee') {
        queryParams.assignee_id = selectedNode.id;
      }

      return notificationsApi.unreadCount(queryParams).then(r => r.data);
    },
    staleTime: 30000, // تحديث المهام كل 30 ثانية
    refetchOnWindowFocus: false,
  });
};