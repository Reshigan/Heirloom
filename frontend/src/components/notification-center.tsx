'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, CheckCheck, Clock, AlertCircle, Info } from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { LuxuryIconButton } from '@/components/ui/luxury-components';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsSeen } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      markAllAsSeen();
    }
  }, [isOpen, markAllAsSeen]);

  const handleMarkAsRead = (id: string) => {
    markAsRead([id]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'check_in_reminder':
        return <Clock className="w-5 h-5 text-gold-400" />;
      case 'unlock_pending':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'recipient_change':
        return <Info className="w-5 h-5 text-blue-400" />;
      case 'upload_success':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'upload_failure':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'storage_alert':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell className="w-5 h-5 text-gold-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none"
      >
        <motion.div 
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="pointer-events-auto w-full max-w-md mt-16 mr-4"
        >
          <div className="bg-charcoal/95 backdrop-blur-2xl border border-gold-500/20 rounded-2xl shadow-2xl overflow-hidden" data-testid="notification-center">
            <div className="flex items-center justify-between p-4 border-b border-gold-500/10">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gold-400" />
                <h2 className="text-lg font-serif font-light text-pearl tracking-wide">Notifications</h2>
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 text-xs font-medium bg-gold-500/20 text-gold-400 rounded-full"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </div>
              <LuxuryIconButton
                icon={X}
                onClick={onClose}
                size="sm"
              />
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {notifications.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 px-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bell className="w-12 h-12 text-gold-400/30 mb-3" />
                  </motion.div>
                  <p className="text-pearl/60 text-center font-light">No notifications yet</p>
                  <p className="text-pearl/40 text-sm text-center mt-1 font-light">
                    We'll notify you about important updates
                  </p>
                </motion.div>
              ) : (
                <div className="divide-y divide-gold-500/10">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <NotificationItem
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        getIcon={getNotificationIcon}
                        formatTime={formatTimestamp}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
  formatTime: (timestamp: string) => string;
}

function NotificationItem({ notification, onMarkAsRead, getIcon, formatTime }: NotificationItemProps) {
  const isUnread = !notification.readAt;

  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(212, 175, 55, 0.05)' }}
      className={`p-4 transition-colors cursor-pointer ${
        isUnread ? 'bg-gold-500/5' : ''
      }`}
      onClick={() => {
        if (isUnread) {
          onMarkAsRead(notification.id);
        }
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      }}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-pearl line-clamp-2 font-light">
              {notification.title || 'Notification'}
            </h3>
            {isUnread && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0 w-2 h-2 bg-gold-400 rounded-full mt-1" 
              />
            )}
          </div>
          {notification.body && (
            <p className="text-sm text-pearl/70 mt-1 line-clamp-2 font-light">{notification.body}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-pearl/50 font-light">{formatTime(notification.createdAt)}</span>
            {!isUnread && (
              <CheckCheck className="w-3 h-3 text-gold-400/50" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
