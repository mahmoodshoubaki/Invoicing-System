'use client';

import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  Bell,
  Mail,
  CheckCheck,
  AlertTriangle,
  FileCheck,
  FileX,
  GitBranch,
  FolderOpen,
  AlertCircle,
  Clock,
  Circle,
} from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import { mockNotifications, NOTIFICATION_TYPES, NOTIFICATION_TRIGGERS } from '@/mock/notifications';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/utils/formatters';

const TRIGGER_ICONS = {
  [NOTIFICATION_TRIGGERS.INVOICE_SUBMITTED]: FileCheck,
  [NOTIFICATION_TRIGGERS.INVOICE_APPROVED]: FileCheck,
  [NOTIFICATION_TRIGGERS.INVOICE_REJECTED]: FileX,
  [NOTIFICATION_TRIGGERS.BOQ_APPROVED]: FileCheck,
  [NOTIFICATION_TRIGGERS.BOQ_REVISION_REQUESTED]: AlertCircle,
  [NOTIFICATION_TRIGGERS.SLA_WARNING]: Clock,
  [NOTIFICATION_TRIGGERS.SLA_BREACH]: AlertTriangle,
  [NOTIFICATION_TRIGGERS.PROJECT_CREATED]: FolderOpen,
  [NOTIFICATION_TRIGGERS.WORKFLOW_STEP_ASSIGNED]: GitBranch,
  [NOTIFICATION_TRIGGERS.SYSTEM_ALERT]: Bell,
};

const TRIGGER_COLORS = {
  [NOTIFICATION_TRIGGERS.INVOICE_SUBMITTED]: 'bg-blue-50 text-blue-600',
  [NOTIFICATION_TRIGGERS.INVOICE_APPROVED]: 'bg-green-50 text-green-600',
  [NOTIFICATION_TRIGGERS.INVOICE_REJECTED]: 'bg-red-50 text-red-600',
  [NOTIFICATION_TRIGGERS.BOQ_APPROVED]: 'bg-green-50 text-green-600',
  [NOTIFICATION_TRIGGERS.BOQ_REVISION_REQUESTED]: 'bg-yellow-50 text-yellow-600',
  [NOTIFICATION_TRIGGERS.SLA_WARNING]: 'bg-orange-50 text-orange-600',
  [NOTIFICATION_TRIGGERS.SLA_BREACH]: 'bg-red-50 text-red-600',
  [NOTIFICATION_TRIGGERS.PROJECT_CREATED]: 'bg-purple-50 text-purple-600',
  [NOTIFICATION_TRIGGERS.WORKFLOW_STEP_ASSIGNED]: 'bg-blue-50 text-blue-600',
  [NOTIFICATION_TRIGGERS.SYSTEM_ALERT]: 'bg-gray-50 text-gray-600',
};

const TABS = ['All', 'Unread', 'System', 'Email'];

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${diffMonths}mo ago`;
}

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const [notifications, setNotifications] = useState(() =>
    [...mockNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
  const [activeTab, setActiveTab] = useState('All');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'Unread':
        return notifications.filter((n) => !n.read);
      case 'System':
        return notifications.filter((n) => n.type === NOTIFICATION_TYPES.SYSTEM);
      case 'Email':
        return notifications.filter((n) => n.type === NOTIFICATION_TYPES.EMAIL);
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  function markAsRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    dispatch(addToast({ type: 'success', title: 'All read', message: 'All notifications have been marked as read.' }));
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All notifications are read'}
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          <Button
            variant="outline"
            icon={CheckCheck}
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
        }
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-100">
        {TABS.map((tab) => {
          const count =
            tab === 'All' ? notifications.length :
            tab === 'Unread' ? notifications.filter((n) => !n.read).length :
            tab === 'System' ? notifications.filter((n) => n.type === NOTIFICATION_TYPES.SYSTEM).length :
            notifications.filter((n) => n.type === NOTIFICATION_TYPES.EMAIL).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          message={activeTab === 'Unread' ? 'You are all caught up! No unread notifications.' : 'No notifications in this category.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const Icon = TRIGGER_ICONS[notif.trigger] || Bell;
            const iconColor = TRIGGER_COLORS[notif.trigger] || 'bg-gray-50 text-gray-500';

            return (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
                  !notif.read
                    ? 'bg-white border-gray-200 shadow-sm'
                    : 'bg-gray-50/50 border-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                    <Icon size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {notif.title}
                        </p>
                        <Badge
                          variant={notif.type === NOTIFICATION_TYPES.EMAIL ? 'info' : 'default'}
                          size="sm"
                        >
                          {notif.type === NOTIFICATION_TYPES.EMAIL ? (
                            <><Mail size={10} /> Email</>
                          ) : (
                            <><Bell size={10} /> System</>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{formatRelativeTime(notif.createdAt)}</span>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" title="Unread" />
                        )}
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${notif.read ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {formatDateTime(notif.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
