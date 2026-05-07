import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Package, Truck, CheckCircle, XCircle, ShoppingBag, Info, ExternalLink } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

// ── Icon mapping by keywords in title ────────────────────────────────────────
function NotifIcon({ title = '' }) {
  const t = title.toLowerCase();
  const size = 15;
  if (t.includes('placed') || t.includes('order'))   return <ShoppingBag size={size} color="#1d4ed8" />;
  if (t.includes('confirmed'))                        return <CheckCircle  size={size} color="#d97706" />;
  if (t.includes('packing') || t.includes('packed'))  return <Package      size={size} color="#c2410c" />;
  if (t.includes('shipped') || t.includes('way'))     return <Truck        size={size} color="#065f46" />;
  if (t.includes('delivered'))                        return <CheckCircle  size={size} color="#14532d" />;
  if (t.includes('cancelled') || t.includes('failed'))return <XCircle     size={size} color="#991b1b" />;
  return <Info size={size} color="#64748b" />;
}

// ── Time-ago helper ───────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { unreadCount, notifications, listLoaded, fetchNotifications, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Fetch list when dropdown first opens
  useEffect(() => {
    if (open && !listLoaded) fetchNotifications();
  }, [open, listLoaded, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const preview = notifications.slice(0, 8);

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Bell trigger ────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', padding: '4px', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-6px',
            backgroundColor: '#ef4444', color: 'white',
            fontSize: '0.6rem', fontWeight: 800,
            borderRadius: '50%', minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          width: '360px', backgroundColor: 'white',
          borderRadius: '20px', border: '1px solid #f1f5f9',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          zIndex: 3000, overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.25rem 1.5rem 1rem',
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bell size={16} color="var(--bg-deep)" />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--bg-deep)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  backgroundColor: '#fee2e2', color: '#dc2626',
                  fontSize: '0.65rem', fontWeight: 800,
                  padding: '2px 7px', borderRadius: '20px',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-gold)',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {!listLoaded ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                Loading...
              </div>
            ) : preview.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <Bell size={32} color="#e2e8f0" style={{ marginBottom: '0.75rem' }} />
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              preview.map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.is_read) markRead(n.id); }}
                  style={{
                    display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                    padding: '1rem 1.5rem',
                    backgroundColor: n.is_read ? 'white' : '#fafffe',
                    borderBottom: '1px solid #f8fafc',
                    cursor: n.is_read ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'white' : '#fafffe'; }}
                >
                  {/* Icon circle */}
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: '#f0f4f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <NotifIcon title={n.title} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <p style={{
                        margin: 0, fontSize: '0.82rem', fontWeight: n.is_read ? 600 : 800,
                        color: 'var(--bg-deep)', lineHeight: 1.3,
                      }}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          backgroundColor: '#ef4444', flexShrink: 0, marginTop: '4px',
                        }} />
                      )}
                    </div>
                    <p style={{
                      margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b',
                      lineHeight: 1.4, overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {n.message}
                    </p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.68rem', color: '#94a3b8' }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <Link
              to="/profile"
              state={{ tab: 'notifications' }}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                fontSize: '0.78rem', fontWeight: 700, color: 'var(--bg-deep)',
                textDecoration: 'none',
              }}
            >
              View all notifications <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
