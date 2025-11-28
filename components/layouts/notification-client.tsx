'use client'

import { useEffect, useState, useCallback } from 'react'
import { NotificationBell } from './main-nav'

export function NotificationClient() {
  const [notifications, setNotifications] = useState<any[]>([])

  const fetchNoti = useCallback(async () => {
    const res = await fetch('/api/notifications', {
      credentials: 'include',
      headers: { 'cache-control': 'no-store' },
    })
    if (res.ok) setNotifications(await res.json())
  }, [])

  const markAllAsRead = useCallback(async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      credentials: 'include',
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  useEffect(() => {
    fetchNoti()
    const interval = setInterval(fetchNoti, 30000)
    const listener = () => fetchNoti()
    window.addEventListener('new-notification', listener)
    return () => {
      clearInterval(interval)
      window.removeEventListener('new-notification', listener)
    }
  }, [fetchNoti])

  return <NotificationBell notifications={notifications} markAllAsRead={markAllAsRead} />
}
