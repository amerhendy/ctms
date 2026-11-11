// src/components/shared/UserContactPopover.jsx
import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Spinner, Avatar } from '@/components/common';
import { Phone, MessageSquare, Send, Hash, Mail, User, ShieldAlert, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function UserContactPopover({ user, taskId, taskTitle, children }) {
  const [copiedField, setCopiedField] = useState(null)

  // استخراج بيانات الاتصال القادمة مع كائن المستخدم
  const contact = user?.contact || user?.contacts || {};
  const hasContactData = contact.phone_number || contact.whatsapp_number || contact.telegram_username || contact.extension_number
 
  // دالة نسخ النصوص السريعة
  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // تجهيز نص رسالة الواتساب التلقائية بالسياق الإداري
  const whatsappMessage = encodeURIComponent(
    `السلام عليكم زميلي الفاضل، أتواصل معك بخصوص المهمة: "${taskTitle || 'المهمة المشتركة'}" (رقم #${taskId || ''}).`
  )

  return (
    <Popover.Root>
      {/* 🌟 هنا السحر: asChild تجعل الـ Avatar الموجود عندك هو الـ Trigger الفعلي بدون إضافة أزرار زايدة */}
      <Popover.Trigger asChild>
        <div className="cursor-pointer inline-block focus:outline-none transition-transform active:scale-95">
          {children}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={8}
          className="w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
          dir="rtl"
        >
          {/* ترويسة البطاقة المنبثقة */}
          <div className="flex items-start gap-3 border-b border-gray-50 pb-3 mb-3">
              <Avatar 
                  src={user.avatar_url || user?.avatar_url} 
                  name={user?.name || user?.full_name || ''} 
                  size="sm" 
                  className="flex-shrink-0 border border-gray-100 dark:border-gray-700 cursor-pointer" 
                  />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-gray-950 truncate">{user?.name || user?.full_name || 'اسم الموظف'}</h4>
              <p className="text-[11px] text-gray-400 font-medium truncate">{user?.role_label || user?.position || 'عضو الفريق'}</p>
            </div>
          </div>
          {/* قنوات الاتصال بناءً على حالة الخصوصية */}
          {contact.is_private   ? (
            <div className="py-2 px-3 bg-amber-50/60 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-800">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-[11px] font-medium leading-relaxed">
                قام الزميل بتفعيل خيار الخصوصية. يمكنك التواصل معه رسمياً عبر نظام التعليقات الداخلي للمهمة فقط.
              </p>
            </div>
          ) : !hasContactData ? (
            <div className="text-center py-4 text-xs font-medium text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              لم يقم الزميل بإضافة بيانات اتصال إلى ملفه الشخصي حتى الآن.
            </div>
          ) : (
            <div className="space-y-2">
              
              {/* 1. الاتصال الهاتفي */}
              {contact.phone_number && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-gray-700">
                  <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold leading-none mb-0.5">اتصال هاتفى</span>
                    <a
                      href={`tel:${contact.phone_number}`}
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-all text-gray-700 group"
                    >
                    <span className="text-xs font-mono font-bold text-purple-700 tracking-wider">{contact.phone_number}</span>
                    </a>
                  </div>
                  </div>
                  <button
                  onClick={() => handleCopy(contact.phone_number, 'phone_number')}
                  className="p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                  {copiedField === 'phone_number' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* 2. الواتساب الفوري */}
              {contact.whatsapp_number && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-gray-700">
                  <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold leading-none mb-0.5">واتساب</span>
                    <a
                      href={`https://wa.me/${contact.whatsapp_number}?text=${whatsappMessage}`}
                      target="_blank"
                          rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-all text-green-600 group"
                    >
                    <span className="text-xs font-mono font-bold text-green-600 tracking-wider">{contact.whatsapp_number}</span>
                    </a>
                  </div>
                  </div>
                  <button
                  onClick={() => handleCopy(contact.whatsapp_number, 'whatsapp_number')}
                  className="p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                  {copiedField === 'whatsapp_number' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* 3. التليجرام */}
              {contact.telegram_username && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-gray-700 group">
                  <a
                    href={`https://t.me/${contact.telegram_username.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 flex-1 hover:text-sky-600"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium truncate">@{contact.telegram_username.replace('@', '')}</span>
                  </a>
                  <button
                    onClick={() => handleCopy(`@${contact.telegram_username.replace('@', '')}`, 'tg')}
                    className="p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copiedField === 'tg' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* 4. التحويلة الداخلية للمكتب */}
              {contact.extension_number && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold leading-none mb-0.5">التحويلة الداخلية</span>
                      <span className="text-xs font-mono font-bold text-purple-700 tracking-wider">{contact.extension_number}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(contact.extension_number, 'ext')}
                    className="p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copiedField === 'ext' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* البريد الإلكتروني (متاح للجميع دائماً) */}
          {user?.email && (
            <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-gray-500">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-gray-450" />
                <span className="text-[11px] font-medium truncate select-all">{user.email}</span>
              </div>
              <button
                onClick={() => handleCopy(user.email, 'email')}
                className="p-1 hover:bg-gray-150 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
              >
                {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}