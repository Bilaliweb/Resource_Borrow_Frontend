'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Search, ChevronDown, CheckCircle2, XCircle, Clock, ArrowRight, CheckCheck } from 'lucide-react';
import { Badge, Spin } from 'antd';
import { useAppSelector } from '@/store/hooks';
import { notificationService } from '@/services/notification.service.ts';
import type { Notification } from '@/services/notification.service.ts';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const NOTIFICATION_ICONS: Record<string, typeof CheckCircle2> = {
  request_submitted: Clock,
  approval_needed: Clock,
  approval_progress: ArrowRight,
  request_approved: CheckCircle2,
  request_rejected: XCircle,
  request_active: CheckCircle2,
  request_completed: CheckCircle2,
  request_cancelled: XCircle,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  request_submitted: '#3B82F6',
  approval_needed: '#F59E0B',
  approval_progress: '#4F46E5',
  request_approved: '#10B981',
  request_rejected: '#EF4444',
  request_active: '#10B981',
  request_completed: '#3B82F6',
  request_cancelled: '#9CA3AF',
};

const NOTIFICATION_LABELS: Record<string, string> = {
  request_submitted: 'New Request',
  approval_needed: 'Approval Required',
  approval_progress: 'Approval Progress',
  request_approved: 'Request Approved',
  request_rejected: 'Request Rejected',
  request_active: 'Request Activated',
  request_completed: 'Request Completed',
  request_cancelled: 'Request Cancelled',
};

export default function TopBar() {
  const { user } = useAppSelector((s) => s.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const roleName = user?.roles?.[0] ?? 'employee';
  const displayRole = roleName.replace(/_/g, ' ');

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifs(true);
      const result = await notificationService.getNotifications({ page: 1, pageSize: 10 });
      setNotifications(result.data);
    } catch {
      // silent
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    // Poll every 30s
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen]);

  const handleBellClick = () => {
    if (!panelOpen) {
      fetchNotifications();
    }
    setPanelOpen((prev) => !prev);
  };

  const handleMarkRead = async (notifId: string) => {
    await notificationService.markRead(notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
    );
    fetchUnreadCount();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetchUnreadCount();
  };

  // Derive the borrow request link from notification payload
  const getNotifLink = (notif: Notification): string | null => {
    const borrowRequestId = notif.payload?.borrowRequestId as string | undefined;
    if (borrowRequestId) return `/dashboard/borrow-requests/${borrowRequestId}`;
    return null;
  };

  return (
    <header
      className="h-[60px] bg-white border-b flex items-center justify-between px-6 sticky top-0 z-20"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Search */}
      <div className="relative w-[400px] max-w-[50%]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Search employees, projects, tickets..."
          className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border outline-none transition-shadow duration-200"
          style={{
            backgroundColor: 'var(--color-canvas)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification Bell + Dropdown */}
        <div className="relative" ref={panelRef}>
          <Badge count={unreadCount} size="small">
            <button
              onClick={handleBellClick}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Bell className="w-[18px] h-[18px]" />
            </button>
          </Badge>

          {/* Notification Panel */}
          {panelOpen && (
            <div
              className="absolute right-0 top-[44px] w-[380px] bg-white rounded-xl shadow-xl border z-50 overflow-hidden"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {/* Panel Header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Notifications
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-12">
                    <Spin />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <Bell className="w-8 h-8 mb-2" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                    const color = NOTIFICATION_COLORS[notif.type] || '#6B7280';
                    const label = NOTIFICATION_LABELS[notif.type] || notif.type;
                    const link = getNotifLink(notif);

                    const content = (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 flex gap-3 transition-colors cursor-pointer ${
                          notif.isRead ? 'bg-white' : ''
                        }`}
                        style={{
                          backgroundColor: notif.isRead ? 'white' : '#F9FAFB',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                        onClick={() => {
                          if (!notif.isRead) handleMarkRead(notif.id);
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="text-[13px] font-medium leading-tight"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {label}
                            </p>
                            {!notif.isRead && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0 mt-1"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                              />
                            )}
                          </div>
                          <p
                            className="text-xs mt-0.5 leading-snug"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {notif.payload?.requestCode && (
                              <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                                {notif.payload.requestCode}
                              </span>
                            )}
                            {notif.payload?.requestCode && ' — '}
                            {notif.type === 'approval_needed' && 'requires your approval'}
                            {notif.type === 'approval_progress' &&
                              `Step ${notif.payload.stepOrder || ''} approved`}
                            {notif.type === 'request_approved' && 'has been fully approved'}
                            {notif.type === 'request_rejected' && 'has been rejected'}
                            {notif.type === 'request_active' && 'is now active'}
                            {notif.type === 'request_completed' && 'has been completed'}
                            {notif.type === 'request_cancelled' && 'has been cancelled'}
                            {notif.type === 'request_submitted' && 'submitted for approval'}
                          </p>
                          <p
                            className="text-[11px] mt-1"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {dayjs(notif.createdAt).fromNow()}
                          </p>
                        </div>
                      </div>
                    );

                    if (link) {
                      return (
                        <Link
                          key={notif.id}
                          to={link}
                          onClick={() => {
                            if (!notif.isRead) handleMarkRead(notif.id);
                            setPanelOpen(false);
                          }}
                          style={{ textDecoration: 'none' }}
                        >
                          {content}
                        </Link>
                      );
                    }

                    return <div key={notif.id}>{content}</div>;
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar + info */}
        <div className="flex items-center gap-3 ml-2 cursor-pointer">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-medium leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {user?.fullName ?? 'User'}
            </p>
            <p className="text-[11px] leading-tight capitalize" style={{ color: 'var(--color-text-muted)' }}>
              {displayRole}
            </p>
          </div>
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      </div>
    </header>
  );
}
