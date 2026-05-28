import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Settings, Plus, Pencil, Trash2, Save, Loader2, AlertCircle } from 'lucide-react';

const labelStyle = {
  display: 'block', fontSize: '0.65rem', fontWeight: 800,
  textTransform: 'uppercase', color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.08em',
};
const inputStyle = {
  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

// Friendly suggestions surfaced when creating a new config.
const SUGGESTED_KEYS = [
  { name: 'competition_settings', example: '{\n  "launch_date": "01-06-2026",\n  "result_announcement_date": "15-06-2026"\n}' },
  { name: 'payment_gateway', example: '{\n  "active": "razorpay"\n}' },
  { name: 'shipment_platform', example: '{\n  "active": "shiprocket"\n}' },
];

function prettyJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

export default function SuperAdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', original?: item }
  const [name, setName] = useState('');
  const [jsonText, setJsonText] = useState('{}');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingName, setDeletingName] = useState(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/core/config/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setItems(list);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (!user.is_staff && !user.is_superuser)) {
      navigate('/');
      return;
    }
    fetchConfigs();
  }, [user, authLoading, navigate, fetchConfigs]);

  const openCreate = () => {
    setName('');
    setJsonText('{}');
    setError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (item) => {
    setName(item.name);
    setJsonText(prettyJson(item.data));
    setError('');
    setModal({ mode: 'edit', original: item });
  };

  const closeModal = () => {
    setModal(null);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    let parsed;
    try {
      parsed = jsonText.trim() === '' ? {} : JSON.parse(jsonText);
    } catch {
      setError('Value is not valid JSON.');
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Key is required.');
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        await api.put(`/core/config/${encodeURIComponent(modal.original.name)}/`, {
          name: trimmedName,
          data: parsed,
        });
      } else {
        await api.post('/core/config/', { name: trimmedName, data: parsed });
      }
      await fetchConfigs();
      closeModal();
    } catch (e) {
      const d = e?.response?.data;
      if (typeof d === 'string') setError(d);
      else if (d?.detail) setError(d.detail);
      else if (d?.name) setError(`Key: ${[].concat(d.name).join(', ')}`);
      else if (d?.data) setError(`Value: ${[].concat(d.data).join(', ')}`);
      else setError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    setDeletingName(item.name);
    try {
      await api.delete(`/core/config/${encodeURIComponent(item.name)}/`);
      await fetchConfigs();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Delete failed.');
    } finally {
      setDeletingName(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-sans)' }}>
      <header style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '1.25rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/super-admin')}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <Settings size={20} color="var(--brand-gold)" />
            <h1 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Platform Settings</h1>
          </div>
          <button
            onClick={openCreate}
            style={{ backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}
          >
            <Plus size={14} /> New Setting
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Generic key/value store for platform-wide settings. Each entry has a unique <strong>key</strong> (string) and a <strong>value</strong> (any JSON). Used for things like the competition launch date and result-announcement date, active payment gateway, shipping platform, feature flags, etc. Dates use <code>DD-MM-YYYY</code> format and are interpreted as IST.
        </p>

        {error && !modal && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <Loader2 size={20} className="spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No settings yet. Click <strong>New Setting</strong> to add one.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {items.map((item, i) => (
              <div
                key={item.id || item.name}
                style={{
                  padding: '1rem 1.25rem',
                  borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                    {item.name}
                  </div>
                  <pre style={{
                    margin: 0, padding: '0.65rem 0.75rem', background: '#f8fafc',
                    border: '1px solid #e2e8f0', borderRadius: '6px',
                    fontSize: '0.75rem', lineHeight: 1.5,
                    color: '#334155', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {prettyJson(item.data)}
                  </pre>
                  {item.updated_at && (
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                      Updated {new Date(item.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(item)}
                    style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '0.4rem 0.7rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete setting "${item.name}"? This cannot be undone.`)) {
                        handleDelete(item);
                      }
                    }}
                    disabled={deletingName === item.name}
                    style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.4rem 0.7rem', borderRadius: '6px', cursor: deletingName === item.name ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modal && (
        <div
          onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-serif)' }}>
                {modal.mode === 'edit' ? 'Edit Setting' : 'New Setting'}
              </h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Key</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. competition_settings"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                  disabled={modal.mode === 'edit'}
                />
                {modal.mode === 'create' && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {SUGGESTED_KEYS.map(s => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => { setName(s.name); setJsonText(s.example); }}
                        style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.25rem 0.55rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'monospace' }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Value (JSON)</label>
                <textarea
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  style={{ ...inputStyle, fontFamily: 'monospace', minHeight: '180px', resize: 'vertical' }}
                />
              </div>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  onClick={closeModal}
                  disabled={saving}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ background: 'var(--brand-gold)', color: 'white', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', cursor: saving ? 'wait' : 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
