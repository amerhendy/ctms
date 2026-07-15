import { useState,useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, MessageSquare, Link, Save, Shield, UserCheck, Mail, Globe, Hash, Monitor } from 'lucide-react';
import { usersApi } from '@/api';
import toast from 'react-hot-toast';
import {ToggleSwitch,Spinner,PageLoader,EmptyState,PriorityBadge,StatusBadge,UrgencyBadge,ProgressBar,ConfirmDialog,FormField,Select} from '@/components/common'
import { theme } from '@/constants/theme';
import clsx from 'clsx'
const AVAILABLE_CHANNELS = [
  { key: 'email', label: 'البريد الإلكتروني للإشعارات', isContact: false, icon: <Mail /> },
  { key: 'sms', label: 'الهاتف (SMS)', isContact: true, contactKey: 'phone_number', icon: <Phone /> },
  { key: 'whatsapp', label: 'واتساب', isContact: true, contactKey: 'whatsapp_number', icon: <MessageSquare /> },
  { key: 'telegram', label: 'تليجرام', isContact: true, contactKey: 'telegram_username', icon: <Link /> },
  { key: 'google', label: 'خدمات جوجل', isContact: false, icon: <Globe /> },
  { key: 'browser', label: 'إشعارات المتصفح', isContact: false, icon: <Monitor /> },
  { key: 'extension', label: 'الرقم الداخلي', isContact: true, contactKey: 'extension_number', icon: <Hash /> },
];

export default function ProfileContactsManager({ user }) {
  const qc = useQueryClient();
  const [contacts, setContacts] = useState(user.contacts || {});
  const [notifications, setNotifications] = useState(user.notification_settings || {});
  
  const [visibleChannels, setVisibleChannels] = useState(
    AVAILABLE_CHANNELS.filter(ch => 
      user.notification_settings?.[ch.key] || user.contacts?.[ch.contactKey] || ch.key === 'email'
    )
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      await usersApi.updateContract(user.id, contacts);
      await usersApi.updatenotification(user.id, notifications);
    },
    onSuccess: () => {
      qc.invalidateQueries(['live-user-profile']);
      toast.success('تم حفظ التغييرات');
    },
    onError: () => toast.error('فشل الحفظ')
  });

  const handleToggle = async (key) => {
  if (key === 'browser') {
    const currentPermission = Notification.permission;

    if (currentPermission === 'granted') {
      // إذا كان مسموحاً بالفعل، ببساطة قم بالتبديل
      setNotifications(prev => ({ ...prev, browser: !prev.browser }));
    } 
    else if (currentPermission === 'default') {
      // هنا ستظهر شاشة المتصفح للمستخدم ليختار (Allow/Block)
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifications(prev => ({ ...prev, browser: true }));
        toast.success('تم تفعيل إشعارات المتصفح بنجاح');
      } else {
        toast.error('تم رفض الإذن. لن تستقبل إشعارات متصفح.');
      }
    } 
    else if (currentPermission === 'denied') {
      // إذا كان المستخدم قد حظرها سابقاً، لا يمكننا إظهار النافذة برمجياً
      // يجب توجيهه يدوياً
      toast.error(
        "لقد قمت بحظر الإشعارات سابقاً. يرجى الضغط على أيقونة القفل بجانب رابط الموقع في المتصفح وتغيير إعداد الإشعارات إلى 'سماح/Allow' ثم تحديث الصفحة.",
        { duration: 8000 }
      );
    }
  } else {
    // لبقية القنوات (واتساب، تليجرام، إلخ)
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  }
};
  
  useEffect(() => {
    if ("Notification" in window) {
        // إذا كانت الصلاحية "denied" في المتصفح، يجب إجبار زر الإشعار على أن يكون false
        if (Notification.permission === "denied" && notifications.browser) {
        setNotifications(prev => ({ ...prev, browser: false }));
        // يمكنك هنا أيضاً إرسال طلب تحديث للسيرفر لإلغاء التفعيل هناك
        // usersApi.updatenotification(user.id, { browser: false });
        }
    }
    }, [notifications.browser]);

  const addChannel = (key) => {
    if (!visibleChannels.find(v => v.key === key)) {
      setVisibleChannels([...visibleChannels, AVAILABLE_CHANNELS.find(c => c.key === key)]);
    }
  };

  return (
    <div className={clsx(theme.card.base, "p-6 space-y-6")}>
      <div className="flex justify-between items-center">
        <h3 className={clsx(
          "font-semibold text-lg flex items-center gap-2",
          // نستخدم لون النص الأساسي من الثيم
          theme.text.primary
        )}>
          <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
          إدارة قنوات الاتصال والإشعارات
        </h3>
        <select 
          onChange={(e) => addChannel(e.target.value)} 
          className={clsx(
            "text-sm p-2 rounded-lg border cursor-pointer transition-colors outline-none",
            // الألوان للوضع النهاري والليلي
            "bg-gray-50 dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700",
            "text-gray-700 dark:text-gray-200",
            // تأثير التركيز ليعطي طابعاً احترافياً
            "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          )}
        >
          <option value="">+ إضافة قناة جديدة</option>
          {AVAILABLE_CHANNELS.filter(ch => !visibleChannels.find(v => v.key === ch.key)).map(ch => (
            <option key={ch.key} value={ch.key}>{ch.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {visibleChannels.map((ch) => (
          <div 
              key={ch.key} 
              className={clsx(
                "flex items-center gap-4 p-3 border rounded-lg transition-colors",
                // هنا ندمج كلاسات الثيم بدلاً من الخلفية الثابتة
                "bg-gray-50 dark:bg-gray-800/30",
                "border-gray-200 dark:border-gray-700"
              )}
            >
            <div className="text-gray-500 dark:text-gray-400">
              {ch.icon}
            </div>
            
            {ch.key === 'email' ? (
              <div className="flex-1 text-sm">
                <span className={clsx(
                  "text-[10px] block uppercase tracking-wider", 
                  theme.text.muted // استخدمنا muted ليكون الرمادي خفيفاً ومناسباً للوضع الليلي
                )}>
                  البريد الأساسي
                </span>
                <span className={theme.text.primary}>
                  {user.email}
                </span>
              </div>
            ) : ch.isContact ? (
              <div className="flex-1">
                <input 
                  type="text"
                  placeholder={ch.label}
                  value={contacts[ch.contactKey] || ''}
                  onChange={(e) => setContacts(prev => ({ ...prev, [ch.contactKey]: e.target.value }))}
                  className={clsx(
                    "w-full bg-transparent outline-none text-sm transition-colors duration-200",
                    // الألوان للوضع النهاري والوضع الليلي
                    "border-b border-gray-300 dark:border-gray-600",
                    "text-gray-900 dark:text-gray-100",
                    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                    // إضافة تأثير التركيز (Focus) ليعطي انطباعاً بالجودة
                    "focus:border-indigo-500 dark:focus:border-indigo-400"
                  )}
                />
              </div>
            ) : <div className={clsx("flex-1 text-sm", theme.text.secondary)}>
  {ch.label}
</div>}

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">تنبيه</span>
              <ToggleSwitch 
                checked={notifications[ch.key] || false} 
                onChange={() => handleToggle(ch.key)} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <Shield className="w-4 h-4" /> خصوصية البيانات
          <input type="checkbox" checked={contacts.is_private || false} onChange={(e) => setContacts(prev => ({ ...prev, is_private: e.target.checked }))} />
        </label>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="px-6 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2">
          <Save className="w-4 h-4" /> {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </div>
  );
}