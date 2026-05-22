import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Truck, Plus, Pencil, Trash2, X, Check, Loader2, Search } from 'lucide-react';

const CATEGORIES = ['light', 'heavy'];

const labelStyle = {
  display: 'block', fontSize: '0.65rem', fontWeight: 800,
  textTransform: 'uppercase', color: '#64748b', marginBottom: '0.3rem',
};
const inputStyle = {
  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
  boxSizing: 'border-box',
};

function emptyForm(sellerId, category, defaults = {}) {
  const cat = category || 'light';
  const d = defaults[cat] || {};
  return {
    seller_id: sellerId || '',
    item_category: cat,
    tier1_max: d.tier1_max ?? '',
    tier1_fee: d.tier1_fee ?? '',
    tier2_max: d.tier2_max ?? '',
    tier2_fee: d.tier2_fee ?? '',
    show_nudge_products: false,
  };
}

function TierSummary({ cfg }) {
  if (!cfg) return <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>;
  return (
    <div style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
      <div>Below ₹{cfg.tier1_max} → <strong>₹{cfg.tier1_fee}</strong></div>
      <div>₹{cfg.tier1_max}–₹{cfg.tier2_max} → <strong>₹{cfg.tier2_fee}</strong></div>
      <div style={{ color: '#10b981', fontWeight: 700 }}>≥ ₹{cfg.tier2_max} → Free</div>
      {cfg.show_nudge_products && (
        <div style={{ marginTop: '0.2rem', fontSize: '0.65rem', color: '#6366f1', fontWeight: 700 }}>✓ Shows nudge products</div>
      )}
    </div>
  );
}

export default function SuperAdminShippingFees() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [sellers, setSellers] = useState([]);
  const [configs, setConfigs] = useState([]);        // flat list of SellerShippingConfig
  const [shippingDefaults, setShippingDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modal, setModal] = useState(null);          // null | { mode: 'create'|'edit', cfg }
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (!user.is_staff && !user.is_superuser)) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sellerRes, configRes, defaultsRes] = await Promise.all([
        api.get('/sellers/profiles/'),
        api.get('/sellers/shipping-configs/'),
        api.get('/sellers/shipping-configs/defaults/'),
      ]);
      setSellers(sellerRes.data || []);
      setConfigs(configRes.data || []);
      setShippingDefaults(defaultsRes.data || {});
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Build a lookup: sellerId → { light: cfg, heavy: cfg }
  const configMap = {};
  for (const cfg of configs) {
    if (!configMap[cfg.seller_id]) configMap[cfg.seller_id] = {};
    configMap[cfg.seller_id][cfg.item_category] = cfg;
  }

  const filteredSellers = sellers.filter(s =>
    (s.store_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (s.user?.toString() || '').includes(searchTerm)
  );

  const openCreate = (seller, category) => {
    setForm(emptyForm(String(seller.user), category, shippingDefaults));
    setFormError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (cfg) => {
    setForm({ ...cfg, seller_id: String(cfg.seller_id) });
    setFormError('');
    setModal({ mode: 'edit', cfg });
  };

  const closeModal = () => { setModal(null); setForm(emptyForm()); setFormError(''); };

  const handleSave = async () => {
    const { seller_id, item_category, tier1_max, tier1_fee, tier2_max, tier2_fee } = form;
    if (!seller_id || !item_category || tier1_max === '' || tier1_fee === '' || tier2_max === '' || tier2_fee === '') {
      setFormError('All tier fields are required.');
      return;
    }
    if (parseFloat(tier2_max) <= parseFloat(tier1_max)) {
      setFormError('Tier 2 max must be greater than Tier 1 max.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        seller_id,
        item_category,
        tier1_max: parseFloat(tier1_max),
        tier1_fee: parseFloat(tier1_fee),
        tier2_max: parseFloat(tier2_max),
        tier2_fee: parseFloat(tier2_fee),
        show_nudge_products: form.show_nudge_products,
      };

      let saved;
      if (modal.mode === 'edit') {
        const res = await api.patch(`/sellers/shipping-configs/${modal.cfg.id}/`, payload);
        saved = res.data;
        setConfigs(prev => prev.map(c => c.id === saved.id ? saved : c));
      } else {
        const res = await api.post('/sellers/shipping-configs/', payload);
        saved = res.data;
        // upsert: remove any existing entry for same seller+category then add new
        setConfigs(prev => [
          ...prev.filter(c => !(c.seller_id === saved.seller_id && c.item_category === saved.item_category)),
          saved,
        ]);
      }
      closeModal();
    } catch (e) {
      setFormError(e.response?.data?.error || JSON.stringify(e.response?.data) || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cfgId) => {
    setDeletingId(cfgId);
    try {
      await api.delete(`/sellers/shipping-configs/${cfgId}/`);
      setConfigs(prev => prev.filter(c => c.id !== cfgId));
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#1b2d2a' }} />
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
            <Truck size={20} color="var(--brand-gold)" />
            <h1 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Seller Shipping Fee Tiers</h1>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {configs.length} config{configs.length !== 1 ? 's' : ''} across {sellers.length} sellers
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>

        {/* Info banner */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Fee logic per seller:</strong> subtotal &lt; Tier 1 Max → Tier 1 Fee · Tier 1 Max ≤ subtotal &lt; Tier 2 Max → Tier 2 Fee · ≥ Tier 2 Max → <strong>Free</strong>.
          Sellers without a config get <strong>free shipping</strong> by default. Light and Heavy categories are configured independently.
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.5rem 1rem', marginBottom: '1.5rem', maxWidth: '380px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search sellers…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '0.9rem', flex: 1, backgroundColor: 'transparent' }}
          />
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Store</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Light Tier</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 800 }}>Heavy Tier</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map(seller => {
                  const sellerCfgs = configMap[String(seller.user)] || {};
                  return (
                    <tr key={seller.id} style={{ borderTop: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                      <td style={{ padding: '1.1rem 1.25rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: '#1b2d2a' }}>{seller.store_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>ID: {seller.user}</div>
                      </td>
                      {CATEGORIES.map(cat => {
                        const cfg = sellerCfgs[cat];
                        return (
                          <td key={cat} style={{ padding: '1.1rem 1.25rem', verticalAlign: 'top' }}>
                            {cfg ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <TierSummary cfg={cfg} />
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                                  <button
                                    onClick={() => openEdit(cfg)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#1b2d2a' }}
                                  >
                                    <Pencil size={11} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(cfg.id)}
                                    disabled={deletingId === cfg.id}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', opacity: deletingId === cfg.id ? 0.5 : 1 }}
                                  >
                                    {deletingId === cfg.id ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={11} />}
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCreate(seller, cat)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}
                              >
                                <Plus size={12} /> Add {cat}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {filteredSellers.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {sellers.length === 0 ? 'No sellers found.' : 'No sellers match your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit / Create Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1b2d2a' }}>
                {modal.mode === 'create' ? 'Add Shipping Tier' : 'Edit Shipping Tier'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Category (read-only in edit mode) */}
              <div>
                <label style={labelStyle}>Item Category</label>
                {modal.mode === 'edit' ? (
                  <div style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', textTransform: 'capitalize' }}>
                    {form.item_category}
                  </div>
                ) : (
                  <select
                    value={form.item_category}
                    onChange={e => setForm(f => ({ ...emptyForm(f.seller_id, e.target.value, shippingDefaults) }))}
                    style={{ ...inputStyle, backgroundColor: 'white', cursor: 'pointer' }}
                  >
                    <option value="light">Light (plants, moss, isopods)</option>
                    <option value="heavy">Heavy (rocks, substrate, hardscape)</option>
                  </select>
                )}
              </div>

              {/* Tier 1 */}
              <div style={{ backgroundColor: '#fef9ec', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#92400e', letterSpacing: '0.06em' }}>Tier 1 — Highest Fee (smallest orders)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Subtotal &lt; (₹)</label>
                    <input type="number" min="0" value={form.tier1_max} onChange={e => setForm(f => ({ ...f, tier1_max: e.target.value }))} style={inputStyle} placeholder={`e.g. ${shippingDefaults[form.item_category]?.tier1_max ?? ''}`} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fee (₹)</label>
                    <input type="number" min="0" value={form.tier1_fee} onChange={e => setForm(f => ({ ...f, tier1_fee: e.target.value }))} style={inputStyle} placeholder="e.g. 99" />
                  </div>
                </div>
              </div>

              {/* Tier 2 */}
              <div style={{ backgroundColor: '#f0f9ff', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.06em' }}>Tier 2 — Lower Fee (medium orders)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Subtotal &lt; (₹)</label>
                    <input type="number" min="0" value={form.tier2_max} onChange={e => setForm(f => ({ ...f, tier2_max: e.target.value }))} style={inputStyle} placeholder={`e.g. ${shippingDefaults[form.item_category]?.tier2_max ?? ''}`} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fee (₹)</label>
                    <input type="number" min="0" value={form.tier2_fee} onChange={e => setForm(f => ({ ...f, tier2_fee: e.target.value }))} style={inputStyle} placeholder="e.g. 49" />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                  Orders ≥ ₹{form.tier2_max || '?'} → <strong>Free shipping</strong>
                </div>
              </div>

              {/* Nudge products toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div
                  onClick={() => setForm(f => ({ ...f, show_nudge_products: !f.show_nudge_products }))}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: form.show_nudge_products ? '#6366f1' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                >
                  <span style={{ position: 'absolute', top: '2px', left: form.show_nudge_products ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s', display: 'block' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1b2d2a' }}>Show nudge products</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Display this seller's products in the cart nudge banner</div>
                </div>
              </label>

              {formError && (
                <div style={{ padding: '0.6rem 0.9rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: saving ? '#94a3b8' : '#1b2d2a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                  {saving ? 'Saving…' : 'Save Tier Config'}
                </button>
                <button onClick={closeModal} style={{ padding: '0.75rem 1.25rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', color: '#64748b' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
