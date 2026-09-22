import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Tag, Plus, Pencil, Trash2, X, Check, Loader2, Search } from 'lucide-react';

const labelStyle = {
  display: 'block', fontSize: '0.65rem', fontWeight: 800,
  textTransform: 'uppercase', color: '#64748b', marginBottom: '0.3rem',
};
const inputStyle = {
  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
  boxSizing: 'border-box', backgroundColor: 'white',
};

// datetime-local wants "YYYY-MM-DDTHH:MM" in local time; the API speaks ISO/UTC.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

function emptyForm() {
  return {
    code: '', name: '', description: '',
    discount_type: 'percent', discount_value: '', max_discount_amount: '',
    funded_by: 'platform', seller: '', categories: [], min_cart_value: '0',
    valid_from: toLocalInput(new Date().toISOString()), valid_until: '',
    is_active: true, usage_limit_total: '', usage_limit_per_user: '',
  };
}

function formFromCoupon(c) {
  return {
    ...emptyForm(),
    ...c,
    seller: c.seller ? String(c.seller) : '',
    categories: (c.categories || []).map(String),
    max_discount_amount: c.max_discount_amount ?? '',
    usage_limit_total: c.usage_limit_total ?? '',
    usage_limit_per_user: c.usage_limit_per_user ?? '',
    valid_from: toLocalInput(c.valid_from),
    valid_until: toLocalInput(c.valid_until),
  };
}

const loadAll = () => Promise.all([
  api.get('/coupons/admin/'),
  api.get('/sellers/profiles/'),
  api.get('/core/categories/'),
]);

function StatusPill({ coupon }) {
  const now = new Date();
  let label = 'Live', bg = '#ecfdf5', fg = '#047857';
  if (!coupon.is_active) { label = 'Inactive'; bg = '#f1f5f9'; fg = '#64748b'; }
  else if (coupon.valid_until && new Date(coupon.valid_until) <= now) { label = 'Expired'; bg = '#fef2f2'; fg = '#b91c1c'; }
  else if (new Date(coupon.valid_from) > now) { label = 'Scheduled'; bg = '#fffbeb'; fg = '#b45309'; }
  else if (coupon.usage_limit_total != null && coupon.times_used >= coupon.usage_limit_total) { label = 'Exhausted'; bg = '#fef2f2'; fg = '#b91c1c'; }
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.2rem 0.5rem', borderRadius: '999px', backgroundColor: bg, color: fg }}>
      {label}
    </span>
  );
}

export default function SuperAdminCoupons() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modal, setModal] = useState(null);          // null | { mode: 'create'|'edit', coupon }
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const applyData = ([couponRes, sellerRes, catRes]) => {
    setCoupons(couponRes.data || []);
    setSellers(sellerRes.data || []);
    setCategories(catRes.data?.results || catRes.data || []);
  };
  const refresh = () => loadAll().then(applyData).catch(e => console.error('Failed to load coupons', e));

  useEffect(() => {
    if (authLoading) return;
    if (!user || (!user.is_staff && !user.is_superuser)) {
      navigate('/');
      return;
    }
    loadAll()
      .then(applyData)
      .catch(e => console.error('Failed to load coupons', e))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const filtered = coupons.filter(c => {
    const q = searchTerm.toLowerCase();
    return !q || c.code.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
      || (c.seller_name || '').toLowerCase().includes(q);
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const openCreate = () => { setForm(emptyForm()); setFormError(''); setModal({ mode: 'create' }); };
  const openEdit = (c) => { setForm(formFromCoupon(c)); setFormError(''); setModal({ mode: 'edit', coupon: c }); };
  const closeModal = () => { setModal(null); setForm(emptyForm()); setFormError(''); };

  const toggleCategory = (id) => setForm(f => {
    const sid = String(id);
    const has = f.categories.includes(sid);
    return { ...f, categories: has ? f.categories.filter(x => x !== sid) : [...f.categories, sid] };
  });

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || form.discount_value === '') {
      setFormError('Code, name and discount value are required.');
      return;
    }
    if (form.funded_by === 'seller' && !form.seller) {
      setFormError('A seller-funded coupon must be scoped to a seller.');
      return;
    }
    setSaving(true);
    setFormError('');
    const numOrNull = v => (v === '' || v == null ? null : parseFloat(v));
    const intOrNull = v => (v === '' || v == null ? null : parseInt(v, 10));
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description || '',
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      max_discount_amount: numOrNull(form.max_discount_amount),
      funded_by: form.funded_by,
      seller: form.seller || null,
      categories: form.categories.map(Number),
      min_cart_value: numOrNull(form.min_cart_value) ?? 0,
      valid_from: fromLocalInput(form.valid_from) || new Date().toISOString(),
      valid_until: fromLocalInput(form.valid_until),
      is_active: !!form.is_active,
      usage_limit_total: intOrNull(form.usage_limit_total),
      usage_limit_per_user: intOrNull(form.usage_limit_per_user),
    };
    try {
      if (modal.mode === 'create') await api.post('/coupons/admin/', payload);
      else await api.patch(`/coupons/admin/${modal.coupon.id}/`, payload);
      closeModal();
      refresh();
    } catch (e) {
      const d = e.response?.data;
      const msg = typeof d === 'string' ? d
        : d?.error || d?.detail
        || (d && Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · '))
        || 'Failed to save coupon.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c) => {
    setTogglingId(c.id);
    try {
      await api.patch(`/coupons/admin/${c.id}/`, { is_active: !c.is_active });
      setCoupons(list => list.map(x => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)));
    } catch (e) {
      console.error('Failed to toggle coupon', e);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/coupons/admin/${id}/`);
      setCoupons(list => list.filter(c => c.id !== id));
    } catch (e) {
      console.error('Failed to delete coupon', e);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} /> Loading coupons…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-sans)', paddingBottom: '4rem' }}>

      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '1.25rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => navigate('/super-admin')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <Tag size={20} color="var(--brand-gold)" />
            <h1 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Coupons</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
              {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={openCreate}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--brand-gold)', color: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <Plus size={13} /> New coupon
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>

        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.5 }}>
          <strong>How eligibility works:</strong> the whole cart must reach <strong>Min cart value</strong>, and at least <strong>one</strong> line must match the coupon's seller and category scope (leave either blank for "any").
          The discount is applied to the matching lines only. <strong>Seller-funded</strong> coupons reduce that seller's payout; <strong>platform-funded</strong> ones don't.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.5rem 1rem', marginBottom: '1.5rem', maxWidth: '380px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by code, name or seller…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '0.9rem', flex: 1, backgroundColor: 'transparent' }}
          />
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Code</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Discount</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Scope</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Min cart</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Validity</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Used</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                    {coupons.length === 0 ? 'No coupons yet. Create your first one.' : 'No coupons match your search.'}
                  </td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9', fontSize: '0.88rem', opacity: c.is_active ? 1 : 0.6 }}>
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800, color: '#1b2d2a', letterSpacing: '0.04em', fontFamily: 'monospace', fontSize: '0.95rem' }}>{c.code}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{c.name}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700 }}>{c.discount_label}</div>
                      <div style={{ fontSize: '0.7rem', color: c.funded_by === 'seller' ? '#b45309' : '#6366f1', fontWeight: 700, marginTop: '0.15rem' }}>
                        {c.funded_by === 'seller' ? 'Seller-funded' : 'Platform-funded'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      <div><span style={{ color: '#94a3b8' }}>Seller:</span> {c.seller_name || <em>Any</em>}</div>
                      <div><span style={{ color: '#94a3b8' }}>Category:</span> {c.category_names?.length ? c.category_names.join(', ') : <em>Any</em>}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top' }}>₹{parseFloat(c.min_cart_value).toLocaleString()}</td>
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                      <div>{new Date(c.valid_from).toLocaleDateString()}</div>
                      <div>→ {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'no expiry'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top' }}>
                      {c.times_used}{c.usage_limit_total != null ? ` / ${c.usage_limit_total}` : ''}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top' }}><StatusPill coupon={c} /></td>
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleToggleActive(c)} disabled={togglingId === c.id} title={c.is_active ? 'Deactivate' : 'Activate'}
                        style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, color: c.is_active ? '#64748b' : '#047857', marginRight: '0.4rem' }}>
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => openEdit(c)} title="Edit" style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', marginRight: '0.4rem', color: '#1b2d2a' }}>
                        <Pencil size={13} />
                      </button>
                      {deletingId === c.id ? (
                        <span style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          <button onClick={() => handleDelete(c.id)} style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}><Check size={12} /></button>
                          <button onClick={() => setDeletingId(null)} style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}><X size={12} /></button>
                        </span>
                      ) : (
                        <button onClick={() => setDeletingId(c.id)} title="Delete" style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', cursor: 'pointer', color: '#b91c1c' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create / edit modal */}
      {modal && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-serif)' }}>{modal.mode === 'create' ? 'New coupon' : `Edit ${modal.coupon.code}`}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Code *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. PLANTS10" style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.05em' }} />
              </div>
              <div>
                <label style={labelStyle}>Name *</label>
                <input value={form.name} onChange={set('name')} placeholder="Shown to buyers" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <input value={form.description} onChange={set('description')} placeholder="Optional" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Discount type</label>
                <select value={form.discount_type} onChange={set('discount_type')} style={inputStyle}>
                  <option value="percent">Percentage off</option>
                  <option value="fixed">Fixed amount off (₹)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{form.discount_type === 'percent' ? 'Percent *' : 'Amount (₹) *'}</label>
                <input type="number" min="0" step="0.01" value={form.discount_value} onChange={set('discount_value')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Max discount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.max_discount_amount} onChange={set('max_discount_amount')} placeholder="No cap" style={inputStyle} disabled={form.discount_type === 'fixed'} />
              </div>
              <div>
                <label style={labelStyle}>Funded by</label>
                <select value={form.funded_by} onChange={set('funded_by')} style={inputStyle}>
                  <option value="platform">Platform (seller payout unchanged)</option>
                  <option value="seller">Seller (deducted from payout)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Seller scope</label>
                <select value={form.seller} onChange={set('seller')} style={inputStyle}>
                  <option value="">Any seller</option>
                  {sellers.map(s => <option key={s.id} value={String(s.user)}>{s.store_name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Min cart value (₹)</label>
                <input type="number" min="0" step="0.01" value={form.min_cart_value} onChange={set('min_cart_value')} style={inputStyle} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Category scope <span style={{ fontWeight: 500, textTransform: 'none' }}>(none selected = any category)</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {categories.map(cat => {
                    const on = form.categories.includes(String(cat.id));
                    return (
                      <button type="button" key={cat.id} onClick={() => toggleCategory(cat.id)}
                        style={{ padding: '0.35rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: `1px solid ${on ? '#1b2d2a' : '#e2e8f0'}`, backgroundColor: on ? '#1b2d2a' : 'white', color: on ? 'white' : '#475569' }}>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Valid from</label>
                <input type="datetime-local" value={form.valid_from} onChange={set('valid_from')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valid until</label>
                <input type="datetime-local" value={form.valid_until} onChange={set('valid_until')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Total usage limit</label>
                <input type="number" min="0" step="1" value={form.usage_limit_total} onChange={set('usage_limit_total')} placeholder="Unlimited" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Per-user limit</label>
                <input type="number" min="0" step="1" value={form.usage_limit_per_user} onChange={set('usage_limit_per_user')} placeholder="Unlimited" style={inputStyle} />
              </div>

              <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Active
              </label>

              {formError && (
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}>{formError}</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={closeModal} style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--brand-gold)', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                {modal.mode === 'create' ? 'Create coupon' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
