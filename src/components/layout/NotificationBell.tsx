import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCheckReminders,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import type { AppNotification } from '@/types';

function formatNotificationTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const checkReminders = useCheckReminders();

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const openTask = (notification: AppNotification) => {
    if (!notification.readAt) {
      markRead.mutate(notification.id);
    }
    setOpen(false);
    navigate('/tasks');
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-md p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Notifications"
        title="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-lg border shadow-xl" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Notifications</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{unreadCount} unread</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => checkReminders.mutate()}
                className="text-xs font-medium"
                style={{ color: 'var(--primary-600)' }}
              >
                Check
              </button>
              <button
                onClick={() => markAllRead.mutate()}
                disabled={unreadCount === 0}
                className="text-xs font-medium disabled:opacity-50"
                style={{ color: 'var(--primary-600)' }}
              >
                Mark all read
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No notifications yet.
              </div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => openTask(notification)}
                  className="block w-full border-b px-4 py-3 text-left transition-colors hover:bg-black/[.025] dark:hover:bg-white/[.035]"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: notification.readAt ? 'transparent' : 'var(--primary-600)' }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {notification.data.title || 'Reminder'}
                      </span>
                      <span className="mt-1 block text-xs leading-5" style={{ color: 'var(--color-text-secondary)' }}>
                        {notification.data.message || notification.data.taskTitle || 'Task reminder'}
                      </span>
                      <span className="mt-1 block text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
