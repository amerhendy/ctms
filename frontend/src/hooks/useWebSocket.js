// hooks/useWebSocket/js
import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import useAuthStore from '@/stores/authStore'
import { NotificationToast } from '@/components/NotificationToast'
import React from 'react';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1/notifications/ws'

export function useWebSocket() {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const queryClient = useQueryClient()
  const { accessToken, isAuthenticated } = useAuthStore()

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_URL}?token=${accessToken}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('🔌 WebSocket connected')
      clearInterval(reconnectTimer.current)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.event === 'notification') {
          const n = msg.data
          
          // 🚀 استدعاء المكون بدلاً من كتابة JSX مباشرة
          toast.custom((t) => (
            React.createElement(NotificationToast, { t, n, icon: getNotifIcon(n.type) })
          ), { duration: 6000 })
          queryClient.invalidateQueries(['notifications'])
          queryClient.invalidateQueries(['notifications', 'unread-count'])
          if ("Notification" in window && Notification.permission === "granted") {
            const systemNotif = new Notification(n.title, {
              body: n.body,
              icon: '/logo.png', // حط مسار لوجو السيستم بتاعك هنا
              dir: 'rtl',
              tag: n.id // يمنع تكرار نفس الإشعار
            });

            // لما يضغط على إشعار الويندوز يفتح الموقع
            systemNotif.onclick = () => {
              window.focus();
              if (n.related_task_id) {
                window.location.href = `/tasks/${n.related_task_id}`;
              }
            };
          }
        }
      } catch (e) {
        console.warn('WS error', e)
      }
    }

/*
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.event === 'notification') {
          const n = msg.data
          // Show toast
          toast(n.title + '\n' + n.body, {
            icon: getNotifIcon(n.type),
            duration: 5000,
          })
          // Invalidate notification count
          queryClient.invalidateQueries(['notifications', 'unread-count'])
          queryClient.invalidateQueries(['notifications'])
          // Invalidate tasks if related
          if (n.related_task_id) {
            queryClient.invalidateQueries(['tasks'])
            queryClient.invalidateQueries(['task', n.related_task_id])
          }
        }
        if (msg.event === 'pong') {
          // keep-alive ack
        }
      } catch (e) {
        console.warn('WS message parse error', e)
      }
    }*/
   
    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected, reconnecting...')
      reconnectTimer.current = setTimeout(connect, 5000)
    }

    ws.onerror = (e) => {
      console.error('WS error', e)
      ws.close()
    }

    // Keep-alive ping every 30s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping')
    }, 30_000)

    ws._pingInterval = pingInterval
  }, [isAuthenticated, accessToken, queryClient])

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        clearInterval(wsRef.current._pingInterval)
        wsRef.current.close()
      }
    }
  }, [connect])

  return wsRef
}

function getNotifIcon(type) {
  const icons = {
    transfer_request: '📨',
    transfer_accepted: '✅',
    transfer_rejected: '❌',
    urgent_request: '🚨',
    urgent_approved: '⚡',
    urgent_rejected: '🚫',
    task_assigned: '📋',
    share_granted: '🔗',
    delegation_granted: '🤝',
    reminder: '⏰',
  }
  return icons[type] || '🔔'
}
