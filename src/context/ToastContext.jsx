import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

let _id = 0;

const STYLES = {
  success: { bg: '#1b2d2a', color: '#fff', icon: '✓' },
  error:   { bg: '#fef2f2', color: '#dc2626', icon: '✕' },
  warning: { bg: '#fffbeb', color: '#92400e', icon: '!' },
  info:    { bg: '#f0f9ff', color: '#075985', icon: 'i' },
};

function ToastItem({ toast, dismiss }) {
  const s = STYLES[toast.type] || STYLES.info;
  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1rem 0.875rem 1.125rem',
        borderRadius: '14px',
        backgroundColor: s.bg,
        color: s.color,
        fontSize: '0.875rem', fontWeight: 700,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        maxWidth: '360px', minWidth: '220px',
        animation: 'toast-slide-in 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <span style={{
        width: '20px', height: '20px', borderRadius: '50%',
        backgroundColor: toast.type === 'success' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', flexShrink: 0, fontWeight: 900,
      }}>
        {s.icon}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => dismiss(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '0 0 0 0.25rem', color: 'inherit', fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '1.5rem',
          display: 'flex', flexDirection: 'column-reverse', gap: '0.625rem',
          zIndex: 9999, pointerEvents: 'none',
        }}>
          {toasts.map(t => <ToastItem key={t.id} toast={t} dismiss={dismiss} />)}
        </div>
      )}
    </ToastContext.Provider>
  );
};
