import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

const POLL_INTERVAL = 60_000; // 60 s — stays warm in cache window

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [listLoaded, setListLoaded] = useState(false);
  const timerRef = useRef(null);

  // ── Fire-and-forget unread count poll ──────────────────────────────────────
  const fetchUnreadCount = useCallback(() => {
    if (!user) return;
    api.get('/notifications/unread-count/')
      .then(res => setUnreadCount(res.data.count ?? 0))
      .catch(() => {}); // never block UI
  }, [user]);

  // ── Fetch full list (on demand when dropdown opens) ────────────────────────
  const fetchNotifications = useCallback(() => {
    if (!user) return;
    api.get('/notifications/')
      .then(res => {
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data.results ?? []);
        setNotifications(list);
        setListLoaded(true);
        setUnreadCount(list.filter(n => !n.is_read).length);
      })
      .catch(() => {});
  }, [user]);

  // ── Mark one notification as read ──────────────────────────────────────────
  const markRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    api.post('/notifications/mark-read/', { id }).catch(() => {});
  }, []);

  // ── Mark all as read ───────────────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    api.post('/notifications/mark-read/').catch(() => {});
  }, []);

  // ── Start / stop polling when auth changes ─────────────────────────────────
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setListLoaded(false);
      clearInterval(timerRef.current);
      return;
    }
    fetchUnreadCount();
    timerRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      notifications,
      listLoaded,
      fetchNotifications,
      markRead,
      markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
