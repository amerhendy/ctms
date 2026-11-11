// src/hooks/useStepNotifications.js

import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '@/api';
import { getApiError } from '@/utils/helpers';
import toast from 'react-hot-toast';

/**
 * هوك لإدارة إشعارات الخطوات
 * يجلب الإشعارات من الباك إند، ويوفر دوال للتفاعل معها (قراءة، حذف، تحديث)
 * 
 * @param {Object} options
 * @param {number} options.taskId - (اختياري) تصفية الإشعارات حسب المهمة
 * @param {number} options.stepId - (اختياري) تصفية الإشعارات حسب الخطوة
 * @param {number} options.limit - عدد الإشعارات لكل صفحة (افتراضي 20)
 * @param {boolean} options.autoFetch - جلب الإشعارات تلقائياً عند تغيير المعايير (افتراضي true)
 * @param {string} options.type - نوع الإشعار (مثل 'step_overdue', 'step_assigned'، إلخ)
 * 
 * @returns {Object} {
 *   notifications: Array,          // قائمة الإشعارات
 *   unreadCount: number,          // عدد الإشعارات غير المقروءة
 *   isLoading: boolean,
 *   error: string | null,
 *   fetchNotifications: function, // دالة لجلب الإشعارات يدوياً (مع بارامترات)
 *   markAsRead: function,         // دالة لتحديد إشعار كمقروء (id)
 *   markAllRead: function,        // دالة لتحديد الكل كمقروء
 *   deleteNotification: function, // دالة لحذف إشعار
 *   clearAllRead: function,       // دالة لحذف جميع الإشعارات المقروءة
 *   refetch: function,            // إعادة جلب الإشعارات بنفس البارامترات
 * }
 */
export default function useStepNotifications({
  taskId,
  stepId,
  limit = 20,
  autoFetch = true,
  type = null,
} = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({ limit, type, task_id: taskId, step_id: stepId });

  // ── جلب الإشعارات ──
  const fetchNotifications = useCallback(async (customParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      // دمج البارامترات الافتراضية مع المخصصة
      const mergedParams = {
        ...params,
        ...customParams,
        limit: customParams.limit || limit,
      };

      // إزالة أي قيم غير محددة (undefined أو null)
      Object.keys(mergedParams).forEach((key) => {
        if (mergedParams[key] === undefined || mergedParams[key] === null) {
          delete mergedParams[key];
        }
      });

      const { data } = await notificationsApi.list(mergedParams);

      // البيانات المتوقعة: { items: [], total, unread_count, ... }
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);

      // تحديث البارامترات الحالية لتتطابق مع آخر جلب
      setParams(mergedParams);

      return data;
    } catch (err) {
      const errorMsg = getApiError(err) || 'حدث خطأ أثناء جلب الإشعارات';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [params, limit]);

  // ── جلب تلقائي عند تغيير المعايير ──
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [taskId, stepId, type, limit, autoFetch, fetchNotifications]);

  // ── تحديد إشعار كمقروء ──
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsApi.markRead(notificationId);
      
      // تحديث القائمة محلياً (تحسين الأداء)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      toast.success('تم تحديد الإشعار كمقروء');
    } catch (err) {
      toast.error(getApiError(err) || 'فشل تحديث حالة الإشعار');
    }
  }, []);

  // ── تحديد الكل كمقروء ──
  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      
      // تحديث القائمة محلياً
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    } catch (err) {
      toast.error(getApiError(err) || 'فشل تحديث الإشعارات');
    }
  }, []);

  // ── حذف إشعار ──
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsApi.delete(notificationId);
      
      // إزالة من القائمة
      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      
      // إذا كان الإشعار غير مقروء، نخفض العدد
      if (deleted && !deleted.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      
      toast.success('تم حذف الإشعار');
    } catch (err) {
      toast.error(getApiError(err) || 'فشل حذف الإشعار');
    }
  }, [notifications]);

  // ── حذف جميع الإشعارات المقروءة ──
  const clearAllRead = useCallback(async () => {
    try {
      await notificationsApi.clearAllRead();
      
      // إزالة جميع الإشعارات المقروءة من القائمة
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      
      toast.success('تم حذف جميع الإشعارات المقروءة');
    } catch (err) {
      toast.error(getApiError(err) || 'فشل حذف الإشعارات المقروءة');
    }
  }, []);

  // ── إعادة الجلب بنفس البارامترات ──
  const refetch = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  // ── دالة مساعدة للحصول على إشعارات الخطوات فقط (إذا كان نوع الإشعار محدداً) ──
  const getStepNotifications = useCallback(() => {
    return notifications.filter((n) => n.entity_type === 'step' || n.type?.includes('step'));
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearAllRead,
    refetch,
    getStepNotifications,
    // معلومات إضافية
    hasUnread: unreadCount > 0,
    total: notifications.length,
  };
}