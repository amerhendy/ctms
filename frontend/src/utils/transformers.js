//utils/transformers.js
// نقوم بتعريف القيم الافتراضية لمنع أي خطأ
export const transformStatsData = (data) => {
  if (!data) return null;

  return {
    activeTasksCount: data.active_tasks_count ??0,
    activeFavorites:data.active_favorites ?? [],
    alerts:data.alerts ?? [],
    avgRelativeSpeed: data.avg_relative_speed ?? 0,
    commentsCount: data.comments_count ?? 0,
    commitmentRate: data.commitment_rate ?? 0,
    completedTasksCount: data.completed_tasks_count ?? 0,
    completedThisWeek: data.completed_this_week ??0,
    department_distribution:data.department_distribution ?? [],
    favoritesCount: data.favorites_count ?? 0,
    overdueTasksCount: data.overdue_tasks_count ??0,
    quick_actions:data.quick_actions ?? [],
    totalHours: data.total_hours ?? 0,
    totalTasks: data.total_tasks ?? 0,
  };
};