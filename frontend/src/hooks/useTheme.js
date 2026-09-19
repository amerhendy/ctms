// src/hooks/useTheme.js
import { useState, useEffect } from 'react';

export const useTheme = () => {
  // الحالة المخزنة محلياً، إذا لم يوجد شيء نعتمد 'system' (الوضع التلقائي)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (mode) => {
      // المنطق الزمني: من 7 مساءً إلى 7 صباحاً يعتبر ليلاً
      const hour = new Date().getHours();
      const isNight = hour >= 19 || hour < 7;
      
      // تحديد هل نطبق الداكن أم لا
      const shouldBeDark = mode === 'dark' || (mode === 'system' && isNight);
      
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, setTheme];
};