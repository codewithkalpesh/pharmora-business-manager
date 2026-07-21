// src/pages/notifications/Notifications.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BellOff, CheckCheck, Trash2, Calendar, RefreshCw,
  AlertTriangle, AlertCircle, Info, ExternalLink, Sparkles
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { notificationApi } from '../../api/notification.api';
import { formatDate } from '../../lib/utils';

export function Notifications() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(''); // '' (All), 'UNREAD', 'READ', 'DISMISSED'
  const [page, setPage] = useState(1);

  // Fetch notifications query
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['notifications', { status, page }],
    queryFn: () => notificationApi.getNotifications({ status, page, limit: 20 }).then((r) => r.data.data),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  // Actions mutations
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread-count']);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread-count']);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => notificationApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread-count']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread-count']);
    },
  });

  const generateRemindersMutation = useMutation({
    mutationFn: () => notificationApi.generateReminders(),
    onSuccess: (res) => {
      alert(res.data?.message || 'Reminders checked & generated.');
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread-count']);
    },
  });

  const handleMarkRead = (id) => markReadMutation.mutate(id);
  const handleMarkAllRead = () => {
    if (window.confirm('Mark all unread notifications as read?')) {
      markAllReadMutation.mutate();
    }
  };
  const handleDismiss = (id) => dismissMutation.mutate(id);
  const handleDelete = (id) => {
    if (window.confirm('Delete this notification?')) {
      deleteMutation.mutate(id);
    }
  };
  const handleGenerate = () => generateRemindersMutation.mutate();

  const notifications = data?.notifications || [];
  const pagination = data?.pagination || {};
  const unreadCount = data?.unreadCount || 0;

  const notifIcon = (type) => {
    switch (type) {
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'SUCCESS':
        return <CheckCheck className="h-5 w-5 text-emerald-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Notification Center"
        subtitle="Manage alerts, upcoming recurring payment reminders, and transaction triggers"
        actions={
          <div className="flex gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleGenerate}
              disabled={generateRemindersMutation.isLoading}
            >
              <Sparkles className={`h-4 w-4 text-amber-400 ${generateRemindersMutation.isLoading ? 'animate-pulse' : ''}`} />
              Run Reminder Scan
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                className="btn btn-primary btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-slate-950 font-semibold"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </button>
            )}
          </div>
        }
      />

      {/* Tabs / Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
        <div className="flex gap-2">
          {[
            { label: 'All Alerts', value: '' },
            { label: 'Unread', value: 'UNREAD', count: unreadCount },
            { label: 'Read', value: 'READ' },
            { label: 'Dismissed', value: 'DISMISSED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                status === tab.value
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
                  status === tab.value ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/10 text-emerald-450'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-450 space-y-3 bg-slate-900/20 rounded-2xl border border-slate-800">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            <span>Retrieving notifications...</span>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                notif.status === 'UNREAD'
                  ? 'bg-slate-900/60 border-slate-700/60 shadow-lg glow'
                  : 'bg-slate-900/20 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="mt-1 shrink-0">{notifIcon(notif.type)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-100 truncate">{notif.title}</h4>
                  <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(notif.createdAt)}
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1.5">{notif.message}</p>
                {notif.link && (
                  <a
                    href={notif.link}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold hover:text-emerald-300 mt-3 transition-colors"
                  >
                    View Details <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                {notif.status === 'UNREAD' && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                {notif.status !== 'DISMISSED' && (
                  <button
                    onClick={() => handleDismiss(notif.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                    title="Dismiss alert"
                  >
                    <BellOff className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="rounded-lg p-1.5 text-slate-450 hover:bg-slate-800 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3 bg-slate-900/20 rounded-2xl border border-slate-800">
            <Bell className="h-10 w-10 text-slate-650" />
            <h4 className="text-slate-350 font-semibold">All quiet for now</h4>
            <p className="text-xs">No notifications match the selected filter status.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-450 bg-slate-900/20 p-4 rounded-xl border border-slate-800">
          <span>Showing page {page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 hover:bg-slate-900 transition-colors disabled:opacity-50 font-bold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 hover:bg-slate-900 transition-colors disabled:opacity-50 font-bold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
