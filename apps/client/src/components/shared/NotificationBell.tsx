import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Megaphone, Info, AlertTriangle, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { getNotifications, getUnreadCount, markRead, markAllRead } from '../../services/notification.service'
import { useClickOutside } from '../../hooks/useClickOutside'
import { EmptyState } from '../ui/EmptyState'
import { parseMarkdownBasic } from '../../lib/utils'
import { useSocket } from '../../providers/SocketProvider'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread')
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: count } = useQuery({
    queryKey: ['notif-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: open
  })

  const readMut = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notif-count'] })
    }
  })

  const readAllMut = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notif-count'] })
      setActiveTab('all')
    }
  })

  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notif-count'] })
    }

    socket.on('notification:read', handleUpdate)
    socket.on('notification:unread_count', handleUpdate)
    socket.on('notification:new', handleUpdate)

    return () => {
      socket.off('notification:read', handleUpdate)
      socket.off('notification:unread_count', handleUpdate)
      socket.off('notification:new', handleUpdate)
    }
  }, [socket, queryClient])

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      readMut.mutate(n.id)
    }
    if (n.targetUrl) {
      setOpen(false)
      navigate(n.targetUrl)
    }
  }

  const unread = count?.unread || 0

  const filteredNotifications = useMemo(() => {
    if (!notifications) return []
    if (activeTab === 'unread') return notifications.filter(n => !n.isRead)
    return notifications
  }, [notifications, activeTab])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 grid place-items-center rounded-[var(--rad-btn)] text-muted hover:bg-surface2 hover:text-fg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold grid place-items-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-[82px] bg-card border border-line rounded-card shadow-pop z-50 animate-fade-in flex flex-col overflow-hidden max-h-[calc(100dvh-96px)] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[340px] sm:max-h-[85vh]">
          <div className="p-4 border-b border-line flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[15px] text-fg min-w-0">Notifications</span>
              <div className="flex items-center gap-2 shrink-0">
                {unread > 0 && (
                  <button onClick={() => readAllMut.mutate()} className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1 whitespace-nowrap">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted hover:text-fg"><X size={16}/></button>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('unread')} 
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${activeTab === 'unread' ? 'bg-primary text-primary-fg' : 'bg-surface hover:bg-surface2 text-muted'}`}
              >
                Unread {unread > 0 && `(${unread})`}
              </button>
              <button 
                onClick={() => setActiveTab('all')} 
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${activeTab === 'all' ? 'bg-primary text-primary-fg' : 'bg-surface hover:bg-surface2 text-muted'}`}
              >
                All
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 bg-canvas/30">
            {filteredNotifications.length === 0 ? (
              <div className="py-10">
                <EmptyState icon={Bell} title={activeTab === 'unread' ? "You're all caught up!" : "No notifications"} />
              </div>
            ) : (
              <div className="divide-y divide-line">
                {filteredNotifications.map((n) => {
                  const Icon = n.priority === 'Urgent' ? AlertTriangle : n.priority === 'High' ? Megaphone : Info
                  const isAnnouncement = n.type === 'announcement'
                  
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-4 transition-colors relative cursor-pointer ${
                        !n.isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface2'
                      }`}
                    >
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          n.priority === 'Urgent' ? 'bg-red-500/10 text-red-500' :
                          n.priority === 'High' ? 'bg-amber-500/10 text-amber-500' :
                          isAnnouncement ? 'bg-primary/10 text-primary' :
                          'bg-surface2 text-muted'
                        }`}>
                          <Icon size={14} strokeWidth={2.5} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-[14px] font-bold truncate ${!n.isRead ? 'text-fg' : 'text-fg/80'}`}>
                              {n.title}
                            </p>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider shrink-0 whitespace-nowrap mt-0.5 max-w-[120px] text-right">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                          </div>

                          <div 
                            className={`text-[13px] leading-relaxed break-words markdown-content ${!n.isRead ? 'text-fg/90' : 'text-muted'}`}
                            dangerouslySetInnerHTML={{ __html: parseMarkdownBasic(n.message) }}
                          />

                          {n.actionLabel && n.actionUrl && (
                            <div className="mt-3">
                              <Link
                                to={n.actionUrl}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!n.isRead) readMut.mutate(n.id)
                                  setOpen(false)
                                }}
                                className="inline-block px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-[12px] font-bold rounded-[var(--rad-btn)] transition-colors"
                              >
                                {n.actionLabel}
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
