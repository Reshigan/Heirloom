'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title?: string;
  body?: string;
  actionUrl?: string;
  metadata?: any;
  priority: number;
  createdAt: string;
  seenAt?: string;
  readAt?: string;
  expiresAt?: string;
  dedupeKey?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsSeen: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    try {
      const url = lastEventIdRef.current
        ? `${API_BASE_URL}/notifications?sinceId=${lastEventIdRef.current}`
        : `${API_BASE_URL}/notifications`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        if (data.nextSinceId) {
          lastEventIdRef.current = data.nextSinceId;
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthenticated, token, API_BASE_URL]);

  const connectSSE = useCallback(() => {
    if (!isAuthenticated || !token || eventSourceRef.current) return;

    try {
      const url = `${API_BASE_URL}/notifications/stream`;
      const eventSource = new EventSource(url, { withCredentials: true } as any);

      eventSource.onopen = () => {
        console.log('SSE connection established');
        setIsConnected(true);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          lastEventIdRef.current = notification.id;
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;
        
        if (!pollingIntervalRef.current) {
          console.log('Falling back to polling');
          pollingIntervalRef.current = setInterval(fetchNotifications, 30000);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      setIsConnected(false);
      
      if (!pollingIntervalRef.current) {
        console.log('Falling back to polling');
        pollingIntervalRef.current = setInterval(fetchNotifications, 30000);
      }
    }
  }, [isAuthenticated, token, API_BASE_URL, fetchNotifications]);

  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const markAsRead = useCallback(async (ids: string[]) => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - ids.length));
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }, [isAuthenticated, token, API_BASE_URL]);

  const markAllAsSeen = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-seen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, seenAt: n.seenAt || new Date().toISOString() }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as seen:', error);
    }
  }, [isAuthenticated, token, API_BASE_URL]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications();
      
      const timer = setTimeout(() => {
        connectSSE();
      }, 1000);

      return () => {
        clearTimeout(timer);
        disconnectSSE();
      };
    } else {
      disconnectSSE();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token, fetchNotifications, connectSSE, disconnectSSE]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsSeen,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
