import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Trash2, CheckCircle, XCircle, Loader2, Plus, RefreshCw, Play } from 'lucide-react';
import clsx from 'clsx';
import { theme } from '@/constants/theme';
import { recurringService } from '@/api/recurringService';
import TemplateFormModal from '@/components/Recurring/TemplateFormModal';
import PageHeader from '@/components/common/pageheader';
import useAuthStore from '@/stores/authStore';
import { PageLoader } from '@/components/common';
import PaginationProvider from '@/components/common/PaginationProvider';

// Custom Hook للـ Debounce لحماية السيرفر من الكويريات المتكررة عند البحث
function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// دالة مساعدة لترجمة نمط التكرار
const translatePattern = (pattern) => {
  const map = {
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري'
  };
  return map[pattern] || pattern;
};

// ==========================================
// 1. مكون جدول القوالب النشطة (Active Templates)
// ==========================================
function ActiveTemplatesTab({ onEdit }) {
  const queryClient = useQueryClient();

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => recurringService.updateTemplate(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates', 'active'] });
    },
    onError: () => alert('فشل تغيير حالة القالب')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => recurringService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-templates', 'trash'] });
    },
    onError: () => alert('فشل نقل القالب إلى سلة المهملات')
  });

  return (
    <PaginationProvider storageKey="recurring_active">
      {({ currentParams, handleSort }) => {
        const debouncedSearch = useDebounce(currentParams.search, 400);

        const { data: apiResponse, isLoading } = useQuery({
          queryKey: ['recurring-templates', 'active', currentParams.page, currentParams.page_size, debouncedSearch, currentParams.sort_by, currentParams.sort_order],
          queryFn: () => {
            const cleanParams = {
              page: currentParams.page,
              page_size: currentParams.page_size,
              sort_by: currentParams.sort_by || 'created_at',
              sort_order: currentParams.sort_order || 'desc'
            };
            if (debouncedSearch && debouncedSearch.trim() !== '') {
              cleanParams.search = debouncedSearch.trim();
            }
            return recurringService.getTemplates(cleanParams);
          }
        });

        const templates = apiResponse?.items || [];
        const totalPages = apiResponse?.pages || 1;
        PaginationProvider.totalPages = totalPages;

        return (
          <div className="space-y-4">
            {isLoading ? (
              <div className={clsx(theme.emptyState.base, "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 py-20")}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                <span className={theme.text.helper}>جاري جلب القوالب النشطة...</span>
              </div>
            ) : (
              <div className={clsx(theme.card.base, "overflow-hidden p-0")}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                      <tr>
                        <th 
                          onClick={() => handleSort('title')} 
                          className="px-6 py-3.5 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          عنوان المهمة {currentParams.sort_by === 'title' ? (currentParams.sort_order === 'asc' ? ' 🔼' : ' 🔽') : ''}
                        </th>
                        <th className="px-6 py-3.5 font-bold">دورية التكرار</th>
                        <th className="px-6 py-3.5 font-bold">الفاصل الزمني</th>
                        <th 
                          onClick={() => handleSort('next_run_date')} 
                          className="px-6 py-3.5 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          تاريخ النشر القادم {currentParams.sort_by === 'next_run_date' ? (currentParams.sort_order === 'asc' ? ' 🔼' : ' 🔽') : ''}
                        </th>
                        <th className="px-6 py-3.5 font-bold">حالة الأتمتة</th>
                        <th className="px-6 py-3.5 font-bold text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {templates.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{t.title}</td>
                          <td className="px-6 py-4">
                            <span className={clsx(theme.badge.base, theme.badge.info, "font-bold")}>
                              {translatePattern(t.recurrence_pattern)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            كل {t.interval_value} {t.recurrence_pattern === 'daily' ? 'يوم' : t.recurrence_pattern === 'weekly' ? 'أسبوع' : 'شهر'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{t.next_run_date} ({t.run_time?.substring(0, 5)})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleActiveMutation.mutate({ id: t.id, is_active: !t.is_active })}
                              disabled={toggleActiveMutation.isPending}
                              className={clsx(
                                theme.badge.base,
                                "font-bold transition-colors cursor-pointer border-0",
                                t.is_active ? theme.badge.success : theme.badge.danger
                              )}
                            >
                              {t.is_active ? <CheckCircle className="w-3 h-3 ml-1 inline" /> : <XCircle className="w-3 h-3 ml-1 inline" />}
                              {t.is_active ? 'نشط ويولّد مهام' : 'موقوف مؤقتاً'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button 
                                onClick={() => onEdit(t.id)} 
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-xs font-bold transition-colors"
                              >
                                تعديل
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm('هل أنت متأكد من نقل هذا القالب إلى سلة المهملات؟')) {
                                    deleteMutation.mutate(t.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {templates.length === 0 && (
                        <tr>
                          <td colSpan="6" className={clsx(theme.emptyState.base, "py-12 text-center")}>
                            <span className={theme.emptyState.text}>لا توجد قوالب مهام متكررة نشطة حالياً.</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </PaginationProvider>
  );
}

// ==========================================
// 2. مكون جدول سلة المهملات (Trash Templates)
// ==========================================
function TrashTemplatesTab() {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: (id) => recurringService.restoreTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates', 'trash'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-templates', 'active'] });
    },
    onError: () => alert('فشل استرجاع القالب')
  });

  return (
    <PaginationProvider storageKey="recurring_trash">
      {({ currentParams, handleSort }) => {
        const debouncedSearch = useDebounce(currentParams.search, 400);

        const { data: apiResponse, isLoading } = useQuery({
          queryKey: ['recurring-templates', 'trash', currentParams.page, currentParams.page_size, debouncedSearch, currentParams.sort_by, currentParams.sort_order],
          queryFn: () => {
            const cleanParams = {
              page: currentParams.page,
              page_size: currentParams.page_size,
              sort_by: currentParams.sort_by || 'updated_at',
              sort_order: currentParams.sort_order || 'desc'
            };
            if (debouncedSearch && debouncedSearch.trim() !== '') {
              cleanParams.search = debouncedSearch.trim();
            }
            return recurringService.getTrashTemplates(cleanParams);
          }
        });

        const templates = apiResponse?.items || [];
        const totalPages = apiResponse?.pages || 1;
        PaginationProvider.totalPages = totalPages;

        return (
          <div className="space-y-4">
            {isLoading ? (
              <div className={clsx(theme.emptyState.base, "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 py-20")}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                <span className={theme.text.helper}>جاري جلب سلة المهملات...</span>
              </div>
            ) : (
              <div className={clsx(theme.card.base, "overflow-hidden p-0")}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                      <tr>
                        <th 
                          onClick={() => handleSort('title')} 
                          className="px-6 py-3.5 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          عنوان المهمة {currentParams.sort_by === 'title' ? (currentParams.sort_order === 'asc' ? ' 🔼' : ' 🔽') : ''}
                        </th>
                        <th className="px-6 py-3.5 font-bold">دورية التكرار</th>
                        <th className="px-6 py-3.5 font-bold text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {templates.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{t.title}</td>
                          <td className="px-6 py-4">
                            <span className={clsx(theme.badge.base, theme.badge.info, "font-bold")}>
                              {translatePattern(t.recurrence_pattern)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => restoreMutation.mutate(t.id)}
                              disabled={restoreMutation.isPending}
                              className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1 font-bold"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>استرجاع</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {templates.length === 0 && (
                        <tr>
                          <td colSpan="3" className={clsx(theme.emptyState.base, "py-12 text-center")}>
                            <span className={theme.emptyState.text}>سلة المهملات فارغة.</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </PaginationProvider>
  );
}

// ==========================================
// 3. مكون جدول سجل التنفيذ (Execution Logs)
// ==========================================
function ExecutionLogsTab() {
  return (
    <PaginationProvider storageKey="recurring_logs">
      {({ currentParams, handleSort }) => {
        const debouncedSearch = useDebounce(currentParams.search, 400);

        const { data: apiResponse, isLoading } = useQuery({
          queryKey: ['recurring-templates', 'logs', currentParams.page, currentParams.page_size, debouncedSearch, currentParams.sort_by, currentParams.sort_order],
          queryFn: () => {
            const cleanParams = {
              page: currentParams.page,
              page_size: currentParams.page_size,
              sort_by: currentParams.sort_by || 'run_at',
              sort_order: currentParams.sort_order || 'desc'
            };
            if (debouncedSearch && debouncedSearch.trim() !== '') {
              cleanParams.search = debouncedSearch.trim();
            }
            return recurringService.getLogs(cleanParams);
          }
        });

        const logs = apiResponse?.items || [];
        const totalPages = apiResponse?.pages || 1;
        PaginationProvider.totalPages = totalPages;

        return (
          <div className="space-y-4">
            {isLoading ? (
              <div className={clsx(theme.emptyState.base, "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 py-20")}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                <span className={theme.text.helper}>جاري جلب سجلات التنفيذ...</span>
              </div>
            ) : (
              <div className={clsx(theme.card.base, "overflow-hidden p-0")}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                      <tr>
                        <th className="px-6 py-3.5 font-bold">عنوان القالب</th>
                        <th className="px-6 py-3.5 font-bold">الحالة</th>
                        <th 
                          onClick={() => handleSort('run_at')} 
                          className="px-6 py-3.5 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          تاريخ التشغيل {currentParams.sort_by === 'run_at' ? (currentParams.sort_order === 'asc' ? ' 🔼' : ' 🔽') : ''}
                        </th>
                        <th className="px-6 py-3.5 font-bold">المهمة الناتجة</th>
                        <th className="px-6 py-3.5 font-bold">تفاصيل / رسالة الخطأ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{log.template_title || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              theme.badge.base,
                              "font-bold",
                              log.status === 'success' ? theme.badge.success : theme.badge.danger
                            )}>
                              {log.status === 'success' ? 'ناجح' : 'فاشل'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">
                            {log.run_at ? new Date(log.run_at).toLocaleString('ar-EG') : '-'}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {log.generated_task_id ? (
                              <a 
                                href={`/tasks/${log.generated_task_id}`}
                                className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                              >
                                عرض المهمة #{log.generated_task_id}
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-xs text-red-500 font-mono">
                            {log.error_message || '-'}
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan="5" className={clsx(theme.emptyState.base, "py-12 text-center")}>
                            <span className={theme.emptyState.text}>لا توجد سجلات تنفيذ مسجلة حتى الآن.</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </PaginationProvider>
  );
}

// ==========================================
// 4. المكون الرئيسي لصفحة المهام المتكررة
// ==========================================
export default function RecurringTasksPage() {
  const { isAdmin } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'trash' | 'logs'
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const triggerAutomationMutation = useMutation({
    mutationFn: () => recurringService.triggerAutomation(),
    onSuccess: (res) => {
      alert(`تم تشغيل المحرك بنجاح: تم توليد ${res.tasks_generated || 0} مهمة.`);
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] });
    },
    onError: () => alert('حدث خطأ أثناء تشغيل الأتمتة اليدوية')
  });

  const handleEditClick = (id) => {
    setSelectedTemplateId(id);
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedTemplateId(null);
    setModalOpen(true);
  };

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['recurring-templates', 'active'] });
  };

  return (
    <div className="container mx-auto px-4 py-6 text-right recurring-page-container">
      {/* الهيدر الأكبر للصفحة */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <PageHeader title="أتمتة المهام المتكررة" icon={Calendar}>
            <p className={theme.text.helper}>
              إنشاء وجدولة قوالب المهام التشغيلية والدورية لإصدارها تلقائياً للأقسام.
            </p>
          </PageHeader>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin() && activeTab === 'templates' && (
            <button 
              onClick={handleCreateClick}
              className="btn-primary w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قالب جديد</span>
            </button>
          )}

          {isAdmin() && activeTab === 'logs' && (
            <button 
              onClick={() => triggerAutomationMutation.mutate()}
              disabled={triggerAutomationMutation.isPending}
              className="btn-primary w-full sm:w-auto justify-center"
            >
              <Play className="w-4 h-4" />
              <span>{triggerAutomationMutation.isPending ? 'جاري التشغيل...' : 'تشغيل الأتمتة الآن'}</span>
            </button>
          )}
        </div>
      </div>

      {/* شريط التبويبات العلوي */}
      <div className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { label: 'القوالب النشطة', value: 'templates' },
          { label: 'سلة المهملات', value: 'trash' },
          { label: 'سجل التنفيذ', value: 'logs' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={clsx(
              "px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-150 whitespace-nowrap",
              activeTab === tab.value 
                ? "border-primary-600 text-primary-600 dark:text-primary-400 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* محتوى التبويب المختار */}
      {activeTab === 'templates' && <ActiveTemplatesTab onEdit={handleEditClick} />}
      {activeTab === 'trash' && <TrashTemplatesTab />}
      {activeTab === 'logs' && <ExecutionLogsTab />}

      {/* المودال الموحد للإنشاء والتعديل */}
      <TemplateFormModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        templateId={selectedTemplateId} 
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}