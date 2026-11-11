// src/hooks/useAdminWebSocket.js
import { useEffect, useState, useRef } from 'react';
import { db } from '../hooks/db';

export function useAdminWebSocket() { // 🟢 إزالة async من هنا
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    let ws = null;

    // دالة داخلية التعامل مع الـ async لقراءة التوكن والاتصال
    const connectWS = async () => {
      try {
        // 1. جلب التوكن من DB
        const tokenItem = await db.store.get('access_token');
        const token = tokenItem?.value;

        if (!token) {
          console.error('❌ No access token found');
          return;
        }

        // 2. تحويل HTTP/HTTPS إلى WS/WSS تلقائياً
        const envBaseURL = import.meta.env.VITE_API_BASE_URL;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        
        // استبدال http/https بـ ws/wss أو بناء الرابط
        const formattedBaseURL = envBaseURL.replace(/^http(s)?:\/\//, `${wsProtocol}//`);
        const wsUrl = `${formattedBaseURL}/ws?token=${token}`;

        // 3. إنشاء الاتصال
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log('✅ Connected to Admin WS');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'new_violation') {
                // 🟢 إضافة التنبيه الجديد في البداية لتظهر الأحدث أعلى القائمة
                setNotifications((prev) => [data, ...prev]);
                }
            } catch (err) {
                console.log('Received raw message:', event.data);
            }
            };

        ws.onclose = () => {
          console.log('🔌 WS Disconnected');
          setIsConnected(false);
        };

        ws.onerror = (error) => {
          console.error('❌ WS Error:', error);
        };

      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    };

    connectWS();

    // Cleanup: إغلاق الاتصال عند الخروج من الصفحات
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return { isConnected, notifications, setNotifications };
}