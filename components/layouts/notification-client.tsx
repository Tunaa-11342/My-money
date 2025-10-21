'use client'

import { useEffect, useState } from 'react'
import { NotificationBell } from './main-nav'

export function NotificationClient() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchNoti = async () => {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifications(await res.json())
    }
    fetchNoti()
    const interval = setInterval(fetchNoti, 30000)
    return () => clearInterval(interval)
  }, [])

  return <NotificationBell notifications={notifications} />
}
