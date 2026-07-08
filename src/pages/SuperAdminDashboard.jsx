import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package, Users, IndianRupee, Truck, CheckCircle, Clock,
  LayoutDashboard, Store, Mail, Phone, ChevronDown, ChevronUp,
  User, Search, Star, Edit2, X, Plus, Image, Copy,
  Tag, Layers, Percent, Weight, Trash2, RefreshCw, Sliders, ExternalLink,
} from 'lucide-react';
import { loadCombosConfig, saveCombosConfig, resetCombosConfig, DEFAULT_COMBOS } from '../config/combosConfig';

// ─── shared label style ──────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: '0.65rem', fontWeight: 800,
  textTransform: 'uppercase', color: '#64748b', marginBottom: '0.35rem',
};
const inputStyle = {
  width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none',
  boxSizing: 'border-box',
};
const selectStyle = { ...inputStyle, backgroundColor: 'white', cursor: 'pointer' };

// ─── ProductForm ─────────────────────────────────────────────────────────────
// Shared form body used inside both Create and Edit product modals.
function ProductForm({ form, setForm, categories, sellers, mode }) {
  const selectedCategoryIds = form.category_ids || [];
  const selectedSubCategoryIds = form.sub_category_ids || [];
  const selectedCats = selectedCategoryIds
    .map(id => categories.find(c => String(c.id) === String(id)))
    .filter(Boolean);
  const subCatOptions = selectedCats.flatMap(c => (c.subcategories || []).map(s => ({ ...s, _parent: c.name })));

  const toggle = (key, id) => {
    setForm(f => {
      const current = (f[key] || []).map(String);
      const sid = String(id);
      const next = current.includes(sid) ? current.filter(x => x !== sid) : [...current, sid];
      if (key === 'category_ids') {
        const allowedSubs = new Set(
          next.flatMap(cid => {
            const c = categories.find(x => String(x.id) === String(cid));
            return (c?.subcategories || []).map(s => String(s.id));
          })
        );
        const filteredSubs = (f.sub_category_ids || []).filter(s => allowedSubs.has(String(s)));
        return { ...f, category_ids: next, sub_category_ids: filteredSubs };
      }
      return { ...f, [key]: next };
    });
  };

  const field = (key, label, type = 'text', opts = {}) => (
    <div key={key}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={form[key] ?? ''}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? e.target.value : e.target.value }))}
        style={inputStyle}
        {...opts}
      />
    </div>
  );

  const sel = (key, label, options) => (
    <div key={key}>
      <label style={labelStyle}>{label}</label>
      <select value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={selectStyle}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Seller */}
      <div>
        <label style={labelStyle}>Seller {mode === 'create' ? '(required)' : '(reassign)'}</label>
        <select
          value={form.seller_id || ''}
          onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}
          style={selectStyle}
        >
          <option value="">— select seller —</option>
          {sellers.map(s => (
            <option key={s.user} value={s.user}>{s.store_name}</option>
          ))}
        </select>
      </div>

      {/* Basic info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {field('name', 'Name *')}
        {field('tagline', 'Tagline')}
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={form.description || ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Plant details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {field('scientific_name', 'Scientific Name')}
        {field('origin', 'Origin')}
        {sel('care_level', 'Care Level', [
          { value: 'Easy', label: 'Easy' },
          { value: 'Medium', label: 'Medium' },
          { value: 'Advanced', label: 'Advanced' },
        ])}
        {sel('light_requirements', 'Light Requirements', [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
        ])}
        {sel('growth_rate', 'Growth Rate', [
          { value: 'Slow', label: 'Slow' },
          { value: 'Moderate', label: 'Moderate' },
          { value: 'Fast', label: 'Fast' },
        ])}
        {sel('co2_requirement', 'CO₂ Requirement', [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
        ])}
      </div>

      {/* Categories — multi-select */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Categories <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>(multi)</span></label>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '170px', overflowY: 'auto', backgroundColor: 'white' }}>
            {categories.length === 0 ? (
              <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.78rem', color: '#94a3b8' }}>No categories.</div>
            ) : categories.map(c => {
              const checked = selectedCategoryIds.some(x => String(x) === String(c.id));
              return (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.65rem', fontSize: '0.82rem', cursor: 'pointer', backgroundColor: checked ? '#f0fdf4' : 'white', borderBottom: '1px solid #f8faf9' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle('category_ids', c.id)} />
                  <span>{c.name}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Subcategories <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>(multi)</span></label>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '170px', overflowY: 'auto', backgroundColor: subCatOptions.length ? 'white' : '#f8fafc' }}>
            {selectedCategoryIds.length === 0 ? (
              <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.78rem', color: '#94a3b8' }}>Pick a category first.</div>
            ) : subCatOptions.length === 0 ? (
              <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.78rem', color: '#94a3b8' }}>No subcategories available.</div>
            ) : subCatOptions.map(s => {
              const checked = selectedSubCategoryIds.some(x => String(x) === String(s.id));
              return (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.65rem', fontSize: '0.82rem', cursor: 'pointer', backgroundColor: checked ? '#f0fdf4' : 'white', borderBottom: '1px solid #f8faf9' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle('sub_category_ids', s.id)} />
                  <span>{s.name} <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>· {s._parent}</span></span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.75rem' }}>
          Pricing &amp; Stock (first variant)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {field('base_price', 'Base Price (₹)', 'number')}
          {field('gst_rate', 'GST %', 'number')}
          {field('commission_rate', 'Commission %', 'number')}
          {field('stock', 'Stock', 'number')}
        </div>
        {form.base_price && (
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Calculated buyer price: ₹{(
              parseFloat(form.base_price || 0) *
              (1 + parseFloat(form.gst_rate || 0) / 100 + parseFloat(form.commission_rate || 0) / 100)
            ).toFixed(2)}
          </p>
        )}
      </div>

      {/* Flags */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
          <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
          Active
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
          <input type="checkbox" checked={!!form.is_rare} onChange={e => setForm(f => ({ ...f, is_rare: e.target.checked }))} />
          Rare
        </label>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function StatChip({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: '0 0 0.15rem' }}>{label}</p>
      <p style={{ fontSize: '0.85rem', fontWeight: 800, color, margin: 0 }}>{value}</p>
    </div>
  );
}

function IconBtn({ icon, onClick, danger, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ padding: '0.35rem', borderRadius: '6px', border: `1px solid ${danger ? '#fecaca' : '#e2e8f0'}`, background: danger ? '#fef2f2' : '#f8fafc', color: danger ? '#dc2626' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', lineHeight: 1 }}
    >{icon}</button>
  );
}

function CatField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>{label}</label>
      {type === 'textarea'
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
      }
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
// ─── CombosManager ────────────────────────────────────────────────────────────
function CombosManager() {
  const [combos, setCombos] = React.useState(() => loadCombosConfig());
  const [saved, setSaved] = React.useState(false);

  const updateCombo = (idx, field, value) =>
    setCombos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  const updateKeywords = (idx, raw) =>
    updateCombo(idx, 'keywords', raw.split(',').map(s => s.trim()).filter(Boolean));

  const updateFilterTag = (comboIdx, tagIdx, field, value) =>
    setCombos(prev => prev.map((c, i) => {
      if (i !== comboIdx) return c;
      const tags = c.filterTags.map((t, j) =>
        j !== tagIdx ? t : {
          ...t,
          [field]: field === 'match'
            ? value.split(',').map(s => s.trim()).filter(Boolean)
            : value,
        }
      );
      return { ...c, filterTags: tags };
    }));

  const addFilterTag = (comboIdx) =>
    setCombos(prev => prev.map((c, i) =>
      i !== comboIdx ? c : {
        ...c,
        filterTags: [...c.filterTags, { key: `tag_${Date.now()}`, label: '', match: [] }],
      }
    ));

  const removeFilterTag = (comboIdx, tagIdx) =>
    setCombos(prev => prev.map((c, i) =>
      i !== comboIdx ? c : { ...c, filterTags: c.filterTags.filter((_, j) => j !== tagIdx) }
    ));

  const handleSave = () => {
    saveCombosConfig(combos);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (!window.confirm('Reset all combos to factory defaults?')) return;
    resetCombosConfig();
    setCombos(DEFAULT_COMBOS);
  };

  const accentColor = '#00c2e0';

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Combos Configuration</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Edit the product-matching keywords and filter chips for each combo tile on the home page.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleReset}
            style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>
            Reset to Defaults
          </button>
          <button onClick={handleSave}
            style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: saved ? '#22c55e' : 'var(--brand-gold, #d4a843)', color: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s' }}>
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {combos.map((combo, ci) => (
          <div key={combo.id} style={{
            background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {/* Header bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.9rem 1.25rem',
              background: combo.bgGrad || '#f8fafc',
              borderBottom: `3px solid ${combo.accent}`,
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: combo.accent, flexShrink: 0,
              }} />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>{combo.label}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginLeft: '0.25rem' }}>{combo.tagline}</span>
              <span style={{
                marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700,
                padding: '0.2rem 0.6rem', borderRadius: '999px',
                background: 'rgba(255,255,255,0.15)', color: 'white',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{combo.type}</span>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Label & Tagline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Display Label</label>
                  <input value={combo.label} onChange={e => updateCombo(ci, 'label', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tagline</label>
                  <input value={combo.tagline} onChange={e => updateCombo(ci, 'tagline', e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Product keywords */}
              <div>
                <label style={labelStyle}>Product Matching Keywords <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>(comma-separated — used to find products for this combo)</span></label>
                <input
                  value={combo.keywords.join(', ')}
                  onChange={e => updateKeywords(ci, e.target.value)}
                  style={inputStyle}
                  placeholder="e.g. aquatic, moss, co2, fertilizer"
                />
                <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {combo.keywords.map(kw => (
                    <span key={kw} style={{
                      padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.7rem',
                      background: `${combo.accent}22`, color: combo.accent, fontWeight: 700,
                    }}>{kw}</span>
                  ))}
                </div>
              </div>

              {/* Filter tags */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Filter Chips (Panel)</label>
                  <button onClick={() => addFilterTag(ci)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '6px', border: `1px solid ${combo.accent}`, background: 'white', color: combo.accent, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={12} /> Add Filter
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {combo.filterTags.map((tag, ti) => (
                    <div key={ti} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto',
                      gap: '0.6rem', alignItems: 'center',
                      padding: '0.6rem 0.75rem', borderRadius: '8px',
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                    }}>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '0.2rem' }}>Key</label>
                        <input value={tag.key} onChange={e => updateFilterTag(ci, ti, 'key', e.target.value)}
                          style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                          disabled={tag.key === 'all'} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '0.2rem' }}>Label</label>
                        <input value={tag.label} onChange={e => updateFilterTag(ci, ti, 'label', e.target.value)}
                          style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                          disabled={tag.key === 'all'} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '0.2rem' }}>Match Keywords (comma-separated)</label>
                        <input
                          value={tag.key === 'all' ? '— matches everything —' : (tag.match || []).join(', ')}
                          onChange={e => updateFilterTag(ci, ti, 'match', e.target.value)}
                          style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                          disabled={tag.key === 'all'}
                          placeholder="e.g. moss, fern, aquatic"
                        />
                      </div>
                      <button
                        onClick={() => removeFilterTag(ci, ti)}
                        disabled={tag.key === 'all'}
                        style={{
                          alignSelf: 'flex-end', marginBottom: '1px',
                          padding: '0.4rem', borderRadius: '6px', border: 'none',
                          background: tag.key === 'all' ? '#f1f5f9' : '#fee2e2',
                          color: tag.key === 'all' ? '#cbd5e1' : '#ef4444',
                          cursor: tag.key === 'all' ? 'not-allowed' : 'pointer',
                        }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SuperAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [activePage, setActivePage] = useState('overview');
  const [expandedSeller, setExpandedSeller] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sellerSearchTerm, setSellerSearchTerm] = useState('');
  const [isSellerTableMinimized, setIsSellerTableMinimized] = useState(false);

  // Promotion state
  const [promoSellers, setPromoSellers] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSaving, setPromoSaving] = useState({});

  // Seller management state
  const [editingSeller, setEditingSeller] = useState(null);
  const [editSellerForm, setEditSellerForm] = useState({});
  const [editSellerSaving, setEditSellerSaving] = useState(false);
  const [editSellerError, setEditSellerError] = useState('');
  const [imageUploading, setImageUploading] = useState({ logo: false, banner: false });
  const [sellerProducts, setSellerProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({});
  const [editProductSaving, setEditProductSaving] = useState(false);
  const [editProductError, setEditProductError] = useState('');

  // Create product modal state
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createProductForm, setCreateProductForm] = useState({});
  const [createProductSaving, setCreateProductSaving] = useState(false);
  const [createProductError, setCreateProductError] = useState('');

  // Misc
  const [categories, setCategories] = useState([]);
  const [copyingProducts, setCopyingProducts] = useState({});
  
  // Bug Reports
  const [bugReports, setBugReports] = useState([]);
  const [bugReportsLoading, setBugReportsLoading] = useState(false);

  // Settlements
  const [settlements, setSettlements] = useState([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [settlingIds, setSettlingIds] = useState(new Set()); // ids being marked
  const [settleConfirm, setSettleConfirm] = useState(null); // { type: 'single'|'week', args, label, amount }
  const [settlementsLoaded, setSettlementsLoaded] = useState(false);

  // Status Manager
  const [smOrders, setSmOrders] = useState([]);
  const [smLoading, setSmLoading] = useState(false);
  const [smLoaded, setSmLoaded] = useState(false);
  const [smSearch, setSmSearch] = useState('');
  const [smStatusFilter, setSmStatusFilter] = useState('');
  const [smUpdating, setSmUpdating] = useState({}); // sub_order_id → bool
  const [statusConfirm, setStatusConfirm] = useState(null); // { subOrderId, newStatus, orderNumber, currentStatus }

  // ── Category management state ─────────────────────────────────────────────
  const [catExpanded, setCatExpanded] = useState({});
  const [catModal, setCatModal] = useState(null);      // null | 'create-cat' | 'edit-cat' | 'create-sub' | 'edit-sub' | 'create-rate' | 'edit-rate'
  const [catModalData, setCatModalData] = useState({}); // pre-fills for edit
  const [catModalParent, setCatModalParent] = useState(null); // parent category id when creating sub/rate
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState('');
  const [catImageUploading, setCatImageUploading] = useState({}); // catId → bool

  // Grower access management state
  const [growerSearchQuery, setGrowerSearchQuery] = useState('');
  const [growerSearchResults, setGrowerSearchResults] = useState([]);
  const [growerSearchLoading, setGrowerSearchLoading] = useState(false);
  const [growerActionLoading, setGrowerActionLoading] = useState({});
  const [growerActionMsg, setGrowerActionMsg] = useState('');

  // Cache management
  const [cacheClearing, setCacheClearing] = useState(false);
  const [cacheClearMsg, setCacheClearMsg] = useState('');

  const handleClearCache = async () => {
    if (!window.confirm('Clear all server cache? This will briefly slow down the next few requests while caches rebuild.')) return;
    setCacheClearing(true);
    setCacheClearMsg('');
    try {
      await api.post('/analytics/super-admin/clear-cache/');
      setCacheClearMsg('Cache cleared.');
    } catch {
      setCacheClearMsg('Failed to clear cache.');
    } finally {
      setCacheClearing(false);
      setTimeout(() => setCacheClearMsg(''), 4000);
    }
  };

  // Payment gateway toggle
  const [paymentGateway, setPaymentGateway] = useState('cashfree');
  const [paymentGatewaySaving, setPaymentGatewaySaving] = useState(false);
  const [paymentConfirm, setPaymentConfirm] = useState(null); // { id, label } of gateway pending confirmation

  // Logistics provider toggle
  const [logisticsProvider, setLogisticsProvider] = useState('nimbuspost');
  const [logisticsProviderSaving, setLogisticsProviderSaving] = useState(false);
  const [shippingConfirm, setShippingConfirm] = useState(null); // { id, label } of provider pending confirmation

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchPromoSellers = async () => {
    setPromoLoading(true);
    try {
      const res = await api.get('/sellers/profiles/');
      setPromoSellers(res.data || []);
    } catch (e) {
      console.error('Failed to load seller profiles', e);
    } finally {
      setPromoLoading(false);
    }
  };

  const loadSellerProducts = (sellerUserId) => {
    if (!sellerUserId) return;
    setProductsLoading(true);
    api.get(`/core/products/?seller=${sellerUserId}&is_active=all`)
      .then(res => setSellerProducts(res.data.results || res.data || []))
      .catch(() => setSellerProducts([]))
      .finally(() => setProductsLoading(false));
  };

  // ── Seller promotions ────────────────────────────────────────────────────────

  const toggleFeatured = async (profile) => {
    setPromoSaving(prev => ({ ...prev, [profile.id]: true }));
    try {
      const res = await api.patch(`/sellers/profiles/${profile.id}/promote/`, {
        is_featured: !profile.is_featured,
      });
      setPromoSellers(prev => prev.map(s => s.id === profile.id ? res.data : s));
    } catch (e) {
      console.error('Toggle featured failed', e);
    } finally {
      setPromoSaving(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  const updateSortOrder = async (profile, newOrder) => {
    const parsed = parseInt(newOrder, 10);
    if (isNaN(parsed)) return;
    setPromoSaving(prev => ({ ...prev, [profile.id]: true }));
    try {
      const res = await api.patch(`/sellers/profiles/${profile.id}/promote/`, { sort_order: parsed });
      setPromoSellers(prev => prev.map(s => s.id === profile.id ? res.data : s));
    } catch (e) {
      console.error('Sort order update failed', e);
    } finally {
      setPromoSaving(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  // ── Seller profile editing ───────────────────────────────────────────────────

  const openEditSeller = async (profile) => {
    setEditingSeller(profile);
    setEditSellerError('');
    loadSellerProducts(profile.user);
    // Hydrate from the admin-edit endpoint so the commission fields (which live
    // on the linked User and are only exposed via AdminSellerProfileSerializer)
    // come down with current values.
    let adminData = profile;
    try {
      const res = await api.get(`/sellers/profiles/${profile.id}/admin-edit/`);
      adminData = res.data || profile;
    } catch (e) {
      // Fall back to the cached profile if the admin fetch fails.
    }
    setEditSellerForm({
      store_name: adminData.store_name || '',
      bio: adminData.bio || '',
      tagline: adminData.tagline || '',
      brand_color: adminData.brand_color || '#0A3029',
      location_city: adminData.location_city || '',
      location_pincode: adminData.location_pincode || '',
      gst_number: adminData.gst_number || '',
      is_active: adminData.is_active !== false,
      identity_verified: adminData.identity_verified || false,
      logo_url: adminData.logo_url || '',
      icon_url: adminData.icon_url || '',
      banner_url: adminData.banner_url || '',
      expertise_tags: (adminData.expertise_tags || []).join(', '),
      seller_commission_rate: adminData.seller_commission_rate ?? '10.00',
      buyer_commission_rate: adminData.buyer_commission_rate ?? '10.00',
      price_is_buyer_final: !!adminData.price_is_buyer_final,
    });
  };

  const uploadSellerImage = async (file, field) => {
    const key = field === 'icon_url' ? 'icon' : field === 'logo_url' ? 'logo' : 'banner';
    setImageUploading(prev => ({ ...prev, [key]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'curators');
      const res = await api.post('/core/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditSellerForm(f => ({ ...f, [field]: res.data.url }));
    } catch (e) {
      setEditSellerError('Image upload failed. Please try again.');
    } finally {
      setImageUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const saveSellerProfile = async () => {
    setEditSellerSaving(true);
    setEditSellerError('');
    try {
      const payload = {
        ...editSellerForm,
        expertise_tags: editSellerForm.expertise_tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const res = await api.patch(`/sellers/profiles/${editingSeller.id}/admin-edit/`, payload);
      setPromoSellers(prev => prev.map(s => s.id === editingSeller.id ? { ...s, ...res.data } : s));
      setEditingSeller(null);
    } catch (e) {
      setEditSellerError(e.userMessage || 'Save failed.');
    } finally {
      setEditSellerSaving(false);
    }
  };

  // ── Product editing ──────────────────────────────────────────────────────────

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setEditProductError('');
    setEditProductForm({
      name: product.name || '',
      tagline: product.tagline || '',
      description: product.description || '',
      scientific_name: product.scientific_name || '',
      origin: product.origin || '',
      care_level: product.care_level || 'Easy',
      light_requirements: product.light_requirements || 'Medium',
      growth_rate: product.growth_rate || 'Moderate',
      co2_requirement: product.co2_requirement || 'Low',
      is_rare: product.is_rare || false,
      is_active: product.is_active !== false,
      seller_id: product.seller?.id || '',
      category_ids: (product.categories || []).map(c => String(c.id)),
      sub_category_ids: (product.sub_categories && product.sub_categories.length > 0)
        ? product.sub_categories.map(s => String(s.id))
        : (product.sub_category?.id ? [String(product.sub_category.id)] : []),
      base_price: product.base_price || '',
      gst_rate: product.gst_rate || 0,
      commission_rate: product.commission_rate || 10,
      stock: product.stock || 0,
    });
  };

  const saveProduct = async () => {
    setEditProductSaving(true);
    setEditProductError('');
    try {
      const payload = {
        name: editProductForm.name,
        tagline: editProductForm.tagline,
        description: editProductForm.description,
        scientific_name: editProductForm.scientific_name,
        origin: editProductForm.origin,
        care_level: editProductForm.care_level,
        light_requirements: editProductForm.light_requirements,
        growth_rate: editProductForm.growth_rate,
        co2_requirement: editProductForm.co2_requirement,
        is_rare: editProductForm.is_rare,
        is_active: editProductForm.is_active,
      };
      if (editProductForm.seller_id) payload.seller_id = editProductForm.seller_id;
      payload.category_ids = (editProductForm.category_ids || []).map(Number).filter(Boolean);
      payload.sub_category_ids = (editProductForm.sub_category_ids || []).map(Number).filter(Boolean);

      // Update first variant pricing if provided
      if (editingProduct.variants?.length > 0 && editProductForm.base_price !== '') {
        payload.variants = editingProduct.variants.map((v, idx) =>
          idx === 0
            ? {
                ...v,
                base_price: editProductForm.base_price,
                gst_rate: editProductForm.gst_rate,
                commission_rate: editProductForm.commission_rate,
                stock: editProductForm.stock,
              }
            : v
        );
      }

      const res = await api.patch(`/core/products/id/${editingProduct.id}/`, payload);

      const newSellerId = res.data.seller?.id;
      const originalSellerId = editingProduct.seller?.id;
      if (newSellerId && String(newSellerId) !== String(originalSellerId)) {
        setSellerProducts(prev => prev.filter(p => p.id !== editingProduct.id));
      } else {
        setSellerProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...res.data } : p));
      }
      setEditingProduct(null);
    } catch (e) {
      setEditProductError(e.userMessage || 'Save failed.');
    } finally {
      setEditProductSaving(false);
    }
  };

  // ── Product creation ─────────────────────────────────────────────────────────

  const openCreateProduct = (sellerProfile = null) => {
    setCreateProductForm({
      seller_id: sellerProfile?.user || '',
      name: '',
      tagline: '',
      description: '',
      scientific_name: '',
      origin: '',
      care_level: 'Easy',
      light_requirements: 'Medium',
      growth_rate: 'Moderate',
      co2_requirement: 'Low',
      is_rare: false,
      is_active: true,
      category_ids: [],
      sub_category_ids: [],
      base_price: '',
      gst_rate: 0,
      commission_rate: 10,
      stock: 0,
    });
    setCreateProductError('');
    setCreatingProduct(true);
  };

  const saveNewProduct = async () => {
    if (!createProductForm.seller_id) {
      setCreateProductError('Please select a seller.');
      return;
    }
    if (!createProductForm.name?.trim()) {
      setCreateProductError('Product name is required.');
      return;
    }
    setCreateProductSaving(true);
    setCreateProductError('');
    try {
      const { base_price, gst_rate, commission_rate, stock, ...productFields } = createProductForm;
      const payload = {
        ...productFields,
        description: productFields.description || '.',
        variants: [{
          name: 'Standard',
          base_price: base_price || 0,
          gst_rate: gst_rate || 0,
          commission_rate: commission_rate || 10,
          stock: stock || 0,
          weight: 0.5,
          length: 10,
          width: 10,
          height: 10,
        }],
      };
      payload.category_ids = (payload.category_ids || []).map(Number).filter(Boolean);
      payload.sub_category_ids = (payload.sub_category_ids || []).map(Number).filter(Boolean);

      const res = await api.post('/core/products/admin-create/', payload);

      if (editingSeller && String(res.data.seller?.id) === String(editingSeller.user)) {
        setSellerProducts(prev => [res.data, ...prev]);
      }
      setCreatingProduct(false);
    } catch (e) {
      setCreateProductError(e.userMessage || 'Create failed.');
    } finally {
      setCreateProductSaving(false);
    }
  };

  // ── Product copy ─────────────────────────────────────────────────────────────

  const copyProduct = async (product) => {
    setCopyingProducts(prev => ({ ...prev, [product.id]: true }));
    try {
      const res = await api.post(`/core/products/id/${product.id}/copy/`, {});
      setSellerProducts(prev => [res.data, ...prev]);
    } catch (e) {
      console.error('Copy failed', e);
    } finally {
      setCopyingProducts(prev => ({ ...prev, [product.id]: false }));
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshCategories = () => {
    api.get('/core/categories/').then(res => setCategories(res.data.results || res.data || [])).catch(() => {});
  };

  const fetchBugReports = async () => {
    setBugReportsLoading(true);
    try {
      const res = await api.get('/core/bug-reports/');
      setBugReports(res.data.results || res.data || []);
    } catch (e) {
      console.error('Failed to load bug reports', e);
    } finally {
      setBugReportsLoading(false);
    }
  };

  const resolveBugReport = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'resolved' ? 'unresolved' : 'resolved';
      const res = await api.patch(`/core/bug-reports/${id}/`, { status: newStatus });
      setBugReports(prev => prev.map(bug => bug.id === id ? res.data : bug));
    } catch (e) {
      alert('Failed to update bug report status');
    }
  };

  // categories fetched on demand (user clicks "Load" in the Categories tab)

  const fetchSettlements = async () => {
    setSettlementsLoading(true);
    try {
      const res = await api.get('/orders/settlements/');
      setSettlements(res.data);
      setSettlementsLoaded(true);
    } catch (e) {
      console.error('Failed to load settlements', e);
    } finally {
      setSettlementsLoading(false);
    }
  };

  const _doMarkSettled = async (settlementId, sellerId, weekKey) => {
    setSettlingIds(prev => new Set([...prev, settlementId]));
    try {
      await api.post(`/orders/settlements/${settlementId}/settle/`);
      setSettlements(prev => prev.map(seller => {
        if (seller.seller_id !== sellerId) return seller;
        const weeks = seller.weeks.map(w => {
          if (w.week_key !== weekKey) return w;
          const orders = w.orders.filter(o => o.settlement_id !== settlementId);
          return { ...w, orders, week_total: orders.reduce((s, o) => s + parseFloat(o.amount), 0) };
        }).filter(w => w.orders.length > 0);
        const total_pending = weeks.reduce((s, w) => s + w.week_total, 0);
        return { ...seller, weeks, total_pending };
      }).filter(s => s.weeks.length > 0));
    } catch (e) {
      alert('Failed to mark as settled');
    } finally {
      setSettlingIds(prev => { const n = new Set(prev); n.delete(settlementId); return n; });
    }
  };

  const _doMarkWeekSettled = async (sellerId, weekKey, orderIds) => {
    setSettlingIds(prev => new Set([...prev, ...orderIds]));
    try {
      await api.post('/orders/settlements/bulk-settle/', { ids: orderIds });
      setSettlements(prev => prev.map(seller => {
        if (seller.seller_id !== sellerId) return seller;
        const weeks = seller.weeks.filter(w => w.week_key !== weekKey);
        const total_pending = weeks.reduce((s, w) => s + w.week_total, 0);
        return { ...seller, weeks, total_pending };
      }).filter(s => s.weeks.length > 0));
    } catch (e) {
      alert('Failed to mark week as settled');
    } finally {
      setSettlingIds(prev => { const n = new Set(prev); orderIds.forEach(id => n.delete(id)); return n; });
    }
  };

  const SUB_ORDER_STATUSES = [
    { value: 'pending',           label: 'Pending' },
    { value: 'placed',            label: 'Placed' },
    { value: 'confirmed',         label: 'Confirmed' },
    { value: 'packing',           label: 'Packing' },
    { value: 'booked',            label: 'Courier Booked' },
    { value: 'booking_failed',    label: 'Booking Failed' },
    { value: 'shipped',           label: 'Shipped' },
    { value: 'in_transit',        label: 'In Transit' },
    { value: 'out_for_delivery',  label: 'Out for Delivery' },
    { value: 'delivered',         label: 'Delivered' },
    { value: 'delivery_failed',   label: 'Delivery Failed' },
    { value: 'doa_raised',        label: 'DOA Raised' },
    { value: 'cancelled',         label: 'Cancelled' },
  ];

  const fetchSmOrders = async () => {
    setSmLoading(true);
    try {
      const params = new URLSearchParams();
      if (smSearch) params.set('search', smSearch);
      if (smStatusFilter) params.set('status', smStatusFilter);
      const res = await api.get(`/orders/admin/sub-orders/?${params}`);
      setSmOrders(res.data);
      setSmLoaded(true);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setSmLoading(false);
    }
  };

  const _doUpdateSubOrderStatus = async (subOrderId, newStatus) => {
    if (!subOrderId) { alert('Sub-order ID not available for this order.'); return; }
    setSmUpdating(prev => ({ ...prev, [subOrderId]: true }));
    try {
      await api.patch(`/orders/admin/sub-orders/${subOrderId}/status/`, { status: newStatus });
      setData(prev => {
        if (!prev) return prev;
        const updateList = list => list.map(o =>
          String(o.sub_order_id) === String(subOrderId) ? { ...o, status: newStatus } : o
        );
        return {
          ...prev,
          orders: {
            pending: updateList(prev.orders?.pending || []),
            transit: updateList(prev.orders?.transit || []),
            delivered: updateList(prev.orders?.delivered || []),
          },
        };
      });
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setSmUpdating(prev => ({ ...prev, [subOrderId]: false }));
    }
  };

  const updateSubOrderStatus = (subOrderId, newStatus, orderNumber, currentStatus) => {
    setStatusConfirm({ subOrderId, newStatus, orderNumber, currentStatus });
  };

  const confirmStatusChange = () => {
    if (!statusConfirm) return;
    _doUpdateSubOrderStatus(statusConfirm.subOrderId, statusConfirm.newStatus);
    setStatusConfirm(null);
  };

  const markSettled = (settlementId, sellerId, weekKey, orderNumber, amount) => {
    setSettleConfirm({
      type: 'single',
      args: [settlementId, sellerId, weekKey],
      label: `Mark order #${orderNumber} as settled?`,
      amount: `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    });
  };

  const markWeekSettled = (sellerId, weekKey, orderIds, weekLabel, weekTotal) => {
    setSettleConfirm({
      type: 'week',
      args: [sellerId, weekKey, orderIds],
      label: `Settle all ${orderIds.length} orders for week ${weekLabel}?`,
      amount: `₹${weekTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    });
  };

  const confirmSettle = () => {
    if (!settleConfirm) return;
    if (settleConfirm.type === 'single') _doMarkSettled(...settleConfirm.args);
    else _doMarkWeekSettled(...settleConfirm.args);
    setSettleConfirm(null);
  };

  // Category modal save handler
  const saveCatModal = async () => {
    setCatSaving(true); setCatError('');
    try {
      const d = catModalData;
      if (catModal === 'create-cat') {
        await api.post('/core/categories/', { name: d.name, description: d.description || '', gst_percentage: d.gst_percentage || '0', commission_rate: d.commission_rate || '0', shipping_type: d.shipping_type || 'plant' });
      } else if (catModal === 'edit-cat') {
        await api.patch(`/core/categories/${d.id}/`, { name: d.name, description: d.description, gst_percentage: d.gst_percentage, commission_rate: d.commission_rate, shipping_type: d.shipping_type });
      } else if (catModal === 'create-sub') {
        await api.post('/core/subcategories/', { category: catModalParent, name: d.name, description: d.description || '', gst_percentage: d.gst_percentage || null, commission_rate: d.commission_rate || null });
      } else if (catModal === 'edit-sub') {
        await api.patch(`/core/subcategories/${d.id}/`, { name: d.name, description: d.description, gst_percentage: d.gst_percentage || null, commission_rate: d.commission_rate || null });
      } else if (catModal === 'create-rate') {
        await api.post('/core/shipping-rates/', { category: catModalParent?.catId || null, sub_category: catModalParent?.subId || null, min_weight_grams: d.min_weight_grams || 0, max_weight_grams: d.max_weight_grams || null, rate: d.rate, free_above_order_value: d.free_above_order_value || null });
      } else if (catModal === 'edit-rate') {
        await api.patch(`/core/shipping-rates/${d.id}/`, { min_weight_grams: d.min_weight_grams, max_weight_grams: d.max_weight_grams || null, rate: d.rate, free_above_order_value: d.free_above_order_value || null });
      }
      setCatModal(null); setCatModalData({}); refreshCategories();
    } catch (e) {
      setCatError(e.response?.data ? JSON.stringify(e.response.data) : 'Save failed');
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCatItem = async (type, id) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      if (type === 'cat') await api.delete(`/core/categories/${id}/`);
      else if (type === 'sub') await api.delete(`/core/subcategories/${id}/`);
      else if (type === 'rate') await api.delete(`/core/shipping-rates/${id}/`);
      refreshCategories();
    } catch { alert('Delete failed'); }
  };

  const uploadCatImage = async (catId, file) => {
    if (!file) return;
    setCatImageUploading(prev => ({ ...prev, [catId]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'categories');
      const { data: uploadData } = await api.post('/core/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await api.patch(`/core/categories/${catId}/`, { image_url: uploadData.url });
      refreshCategories();
    } catch {
      alert('Image upload failed.');
    } finally {
      setCatImageUploading(prev => ({ ...prev, [catId]: false }));
    }
  };

  const removeCatImage = async (catId) => {
    try {
      await api.patch(`/core/categories/${catId}/`, { image_url: '' });
      refreshCategories();
    } catch {
      alert('Failed to remove image.');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || (!user.is_staff && !user.is_superuser && user.role !== 'admin')) {
      navigate('/');
      return;
    }
    const fetchData = async () => {
      try {
        const response = await api.get('/analytics/super-admin/dashboard/');
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    api.get('/payments/gateway-settings/')
      .then(res => setPaymentGateway(res.data.active_gateway || 'cashfree'))
      .catch(() => setPaymentGateway('cashfree'));

    api.get('/shipping/provider-settings/')
      .then(res => setLogisticsProvider(res.data.active_provider || 'nimbuspost'))
      .catch(() => setLogisticsProvider('nimbuspost'));
  }, [user, authLoading, navigate]);

  const confirmAndSetGateway = async () => {
    if (!paymentConfirm) return;
    setPaymentGatewaySaving(true);
    try {
      const res = await api.patch('/payments/gateway-settings/', { active_gateway: paymentConfirm.id });
      setPaymentGateway(res.data.active_gateway);
    } catch (e) {
      alert('Failed to update payment gateway. Please try again.');
    } finally {
      setPaymentGatewaySaving(false);
      setPaymentConfirm(null);
    }
  };

  const confirmAndSetLogistics = async () => {
    if (!shippingConfirm) return;
    setLogisticsProviderSaving(true);
    try {
      const res = await api.patch('/shipping/provider-settings/', { active_provider: shippingConfirm.id });
      setLogisticsProvider(res.data.active_provider);
    } catch (e) {
      alert('Failed to update logistics provider. Please try again.');
    } finally {
      setLogisticsProviderSaving(false);
      setShippingConfirm(null);
    }
  };

  const authorizeSeller = async (sellerId) => {
    try {
      await api.post(`/analytics/super-admin/authorize-grower/${sellerId}/`);
      setData(prev => ({ ...prev, sellers: prev.sellers.map(s => s.id === sellerId ? { ...s, is_verified: true } : s) }));
    } catch (err) {
      alert("Failed to authorize seller. Please try again.");
    }
  };

  const rejectSeller = async (sellerId) => {
    if (!window.confirm("Are you sure you want to reject this grower application?")) return;
    try {
      await api.post(`/analytics/super-admin/reject-grower/${sellerId}/`);
      setData(prev => ({ ...prev, sellers: prev.sellers.filter(s => s.id !== sellerId) }));
    } catch (err) {
      alert("Failed to reject seller. Please try again.");
    }
  };

  const searchGrowerUsers = async (q) => {
    setGrowerSearchQuery(q);
    if (q.length < 2) { setGrowerSearchResults([]); return; }
    setGrowerSearchLoading(true);
    try {
      const res = await api.get(`/analytics/super-admin/user-search/?q=${encodeURIComponent(q)}`);
      setGrowerSearchResults(res.data || []);
    } catch { setGrowerSearchResults([]); }
    finally { setGrowerSearchLoading(false); }
  };

  const setGrowerAccess = async (userId, action) => {
    setGrowerActionLoading(prev => ({ ...prev, [userId]: true }));
    setGrowerActionMsg('');
    try {
      const res = await api.post(`/analytics/super-admin/set-grower/${userId}/`, { action });
      setGrowerActionMsg(res.data.message);
      setGrowerSearchResults(prev => prev.map(u =>
        u.id === userId ? { ...u, role: res.data.role, is_allowed: action === 'grant' } : u
      ));
    } catch (e) {
      setGrowerActionMsg(e.userMessage || 'Action failed');
    } finally {
      setGrowerActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h2>No Data Available</h2>
        <p>Failed to load dashboard data. Please refresh the page.</p>
      </div>
    );
  }

  const { 
    overall_analytics = {
      revenue_this_month: 0,
      orders_this_month: 0,
      total_sellers: 0,
      total_users: 0,
    },
    sellers = [], 
    orders = {
      pending: [],
      transit: [],
      delivered: []
    }
  } = data;

  // Only show sellers awaiting authorization in the verification section
  const pendingSellers = sellers.filter(s => !s.is_verified);
  const filteredSellers = pendingSellers.filter(s =>
    (s.store_name?.toLowerCase() || '').includes(sellerSearchTerm.toLowerCase()) ||
    (s.name?.toLowerCase() || '').includes(sellerSearchTerm.toLowerCase()) ||
    (s.email?.toLowerCase() || '').includes(sellerSearchTerm.toLowerCase()) ||
    (s.phone || '').includes(sellerSearchTerm)
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-sans)', paddingBottom: '4rem' }}>

      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-deep)', color: 'white', padding: '1.5rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LayoutDashboard size={24} color="var(--brand-gold)" />
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Super Admin Portal</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/super-admin/gst')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
              GST INVOICES
            </button>
            <button onClick={() => navigate('/super-admin/shipping-fees')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
              SHIPPING FEES
            </button>
            <button onClick={() => navigate('/super-admin/settings')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#475569', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
              SETTINGS
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handleClearCache}
                disabled={cacheClearing}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: cacheClearing ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.15)', color: cacheClearing ? 'rgba(255,255,255,0.4)' : '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', cursor: cacheClearing ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                {cacheClearing ? 'CLEARING…' : 'CLEAR CACHE'}
              </button>
              {cacheClearMsg && <span style={{ fontSize: '0.75rem', color: cacheClearMsg.startsWith('Failed') ? '#fca5a5' : '#86efac', fontWeight: 600 }}>{cacheClearMsg}</span>}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.full_name || user?.username}</span>
            <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
              EXIT
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: '73px', zIndex: 9 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', gap: '0', overflowX: 'auto' }}>
          {[
            { id: 'overview',     label: 'Overview',     icon: <LayoutDashboard size={15} /> },
            { id: 'sellers',      label: 'Sellers',      icon: <Store size={15} /> },
            { id: 'orders',       label: 'Orders',       icon: <Package size={15} /> },
            { id: 'settlements',  label: 'Settlements',  icon: <IndianRupee size={15} /> },
            { id: 'categories',   label: 'Categories',   icon: <Layers size={15} /> },
            { id: 'combos',       label: 'Combos',       icon: <Sliders size={15} /> },
            { id: 'bugs',         label: 'Bug Reports',  icon: <Tag size={15} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '1rem 1.25rem',
                border: 'none', borderBottom: activePage === tab.id ? '2.5px solid var(--brand-gold)' : '2.5px solid transparent',
                background: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: activePage === tab.id ? 800 : 600,
                color: activePage === tab.id ? 'var(--bg-deep)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap', transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

        {activePage === 'overview' && <>

        {/* Grower Access Management */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Grower Access Management
          </h2>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 1rem' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search user by email, name, or username..."
                value={growerSearchQuery}
                onChange={e => searchGrowerUsers(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', backgroundColor: 'transparent' }}
              />
              {growerSearchLoading && <div style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#1b2d2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
            </div>

            {growerActionMsg && (
              <div style={{ padding: '0.6rem 1rem', borderRadius: '8px', backgroundColor: growerActionMsg.includes('failed') || growerActionMsg.includes('error') ? '#fee2e2' : '#f0fdf4', color: growerActionMsg.includes('failed') || growerActionMsg.includes('error') ? '#b91c1c' : '#166534', fontSize: '0.82rem', fontWeight: 600 }}>
                {growerActionMsg}
              </div>
            )}

            {growerSearchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {growerSearchResults.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--bg-deep)' }}>{u.full_name || u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{u.email}</div>
                      {u.store_name && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>Store: {u.store_name}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                        backgroundColor: u.role === 'grower' ? '#dcfce7' : u.role === 'admin' ? '#dbeafe' : '#f1f5f9',
                        color: u.role === 'grower' ? '#166534' : u.role === 'admin' ? '#1e40af' : '#64748b',
                      }}>{u.role}</span>
                      {u.role !== 'admin' && (
                        u.role === 'grower' || u.is_allowed ? (
                          <button
                            onClick={() => setGrowerAccess(u.id, 'revoke')}
                            disabled={growerActionLoading[u.id]}
                            style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, cursor: growerActionLoading[u.id] ? 'not-allowed' : 'pointer', opacity: growerActionLoading[u.id] ? 0.6 : 1 }}
                          >
                            {growerActionLoading[u.id] ? '...' : 'Revoke Grower'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setGrowerAccess(u.id, 'grant')}
                            disabled={growerActionLoading[u.id]}
                            style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: growerActionLoading[u.id] ? 'not-allowed' : 'pointer', opacity: growerActionLoading[u.id] ? 0.6 : 1 }}
                          >
                            {growerActionLoading[u.id] ? '...' : 'Make Grower'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {growerSearchQuery.length >= 2 && !growerSearchLoading && growerSearchResults.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>No users found matching "{growerSearchQuery}"</p>
            )}
          </div>
        </section>

        {/* Payment Gateway Control */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Payment Gateway
          </h2>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '1.25rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 900, color: 'var(--bg-deep)', marginBottom: '0.25rem' }}>
                Active gateway: {paymentGateway === 'razorpay' ? 'Razorpay' : 'Cashfree'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                This controls which payment mode customers see on Checkout.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {[
                { id: 'cashfree', label: 'Cashfree (UPI/QR)' },
                { id: 'razorpay', label: 'Razorpay' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { if (paymentGateway !== opt.id) setPaymentConfirm(opt); }}
                  disabled={paymentGatewaySaving || paymentGateway === opt.id}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    border: paymentGateway === opt.id ? '2px solid var(--bg-deep)' : '1px solid #e2e8f0',
                    backgroundColor: paymentGateway === opt.id ? '#f0fdf4' : 'white',
                    cursor: (paymentGatewaySaving || paymentGateway === opt.id) ? 'default' : 'pointer',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    opacity: paymentGatewaySaving ? 0.6 : 1
                  }}
                >
                  {opt.label} {paymentGateway === opt.id && '✓'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Logistics Provider Control */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Logistics Provider
          </h2>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '1.25rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 900, color: 'var(--bg-deep)', marginBottom: '0.25rem' }}>
                Active provider: {logisticsProvider === 'shiprocket' ? 'Shiprocket' : 'NimbusPost'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                This controls which courier aggregator is used for all new shipments.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {[
                { id: 'nimbuspost', label: 'NimbusPost' },
                { id: 'shiprocket', label: 'Shiprocket' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { if (logisticsProvider !== opt.id) setShippingConfirm(opt); }}
                  disabled={logisticsProviderSaving || logisticsProvider === opt.id}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    border: logisticsProvider === opt.id ? '2px solid var(--bg-deep)' : '1px solid #e2e8f0',
                    backgroundColor: logisticsProvider === opt.id ? '#f0fdf4' : 'white',
                    cursor: (logisticsProviderSaving || logisticsProvider === opt.id) ? 'default' : 'pointer',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    opacity: logisticsProviderSaving ? 0.6 : 1,
                  }}
                >
                  {opt.label} {logisticsProvider === opt.id && '✓'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Analytics Summary */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Monthly Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: 'Revenue (Month)', value: `₹${(overall_analytics.revenue_this_month || 0).toLocaleString()}`, icon: <IndianRupee size={24} />, color: 'var(--brand-gold)' },
              { title: 'Orders (Month)', value: overall_analytics.orders_this_month || 0, icon: <Package size={24} />, color: 'var(--brand-green)' },
              { title: 'Active Sellers', value: overall_analytics.total_sellers || 0, icon: <Store size={24} />, color: '#3b82f6' },
              { title: 'Total Collectors', value: overall_analytics.total_users || 0, icon: <Users size={24} />, color: '#8b5cf6' },
            ].map((stat, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0' }}>{stat.title}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--bg-deep)', margin: 0 }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        </>}
        {activePage === 'sellers' && <>

        {/* Pending Seller Authorizations */}
        <section>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Pending Seller Authorizations</h2>
              {pendingSellers.length > 0 && (
                <span style={{ padding: '0.15rem 0.6rem', borderRadius: '50px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: 800 }}>
                  {pendingSellers.length} pending
                </span>
              )}
              <button
                onClick={() => setIsSellerTableMinimized(!isSellerTableMinimized)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
              >
                {isSellerTableMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            </div>
            {!isSellerTableMinimized && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input 
                  type="text" 
                  placeholder="Search sellers..." 
                  value={sellerSearchTerm}
                  onChange={(e) => setSellerSearchTerm(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: isMobile ? '100%' : '250px', fontSize: '0.9rem' }}
                />
              </div>
            )}
          </div>
          
          {!isSellerTableMinimized && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredSellers.map(seller => (
                  <div key={seller.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div
                      onClick={() => setExpandedSeller(expandedSeller === seller.id ? null : seller.id)}
                      style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedSeller === seller.id ? '#f8fafc' : 'white' }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{seller.store_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>{seller.total_orders}</span> orders • <span style={{ fontWeight: 700, color: 'var(--brand-green)' }}>₹{seller.total_revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {expandedSeller === seller.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                    {expandedSeller === seller.id && (
                      <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button onClick={(e) => { e.stopPropagation(); authorizeSeller(seller.id); }} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Authorize</button>
                          <button onClick={(e) => { e.stopPropagation(); rejectSeller(seller.id); }} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Reject</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <User size={14} /> <span style={{ color: 'var(--text-primary)' }}>{seller.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Mail size={14} /> <span style={{ color: 'var(--text-primary)' }}>{seller.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Phone size={14} /> <span style={{ color: 'var(--text-primary)' }}>{seller.phone || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredSellers.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No sellers found matching "{sellerSearchTerm}".</div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Seller / Store</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Contact</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Action</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700, textAlign: 'right' }}>Total Orders</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700, textAlign: 'right' }}>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSellers.map(seller => (
                      <tr key={seller.id} style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seller.store_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{seller.name}</div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}><Mail size={12} /> {seller.email}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}><Phone size={12} /> {seller.phone || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={(e) => { e.stopPropagation(); authorizeSeller(seller.id); }} style={{ padding: '0.35rem 0.9rem', borderRadius: '6px', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Authorize</button>
                            <button onClick={(e) => { e.stopPropagation(); rejectSeller(seller.id); }} style={{ padding: '0.35rem 0.9rem', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Reject</button>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 600 }}>{seller.total_orders}</td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 700, color: 'var(--brand-green)' }}>₹{seller.total_revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredSellers.length === 0 && (
                      <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{pendingSellers.length === 0 ? 'No pending seller applications.' : 'No sellers match your search.'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}
        </section>

        {/* Seller Promotions */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Seller Promotions</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Toggle Featured to promote sellers on Home &amp; Verified Sellers pages. Sort order controls display priority (lower = first).
              </p>
            </div>
            <button onClick={fetchPromoSellers} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              Refresh
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {promoLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading seller profiles…</div>
            ) : promoSellers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <span>Sellers not loaded yet.</span>
                <button onClick={fetchPromoSellers} style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Load Sellers</button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Store</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Location</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700, textAlign: 'center' }}>Featured</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>Sort Order</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...promoSellers].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)).map(profile => (
                      <tr key={profile.id} style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem', backgroundColor: profile.is_featured ? '#fffbeb' : 'transparent' }}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{profile.store_name}</div>
                          {profile.tagline && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{profile.tagline}</div>}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{profile.location_city || '—'}</td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleFeatured(profile)}
                            disabled={promoSaving[profile.id]}
                            style={{ width: '52px', height: '28px', borderRadius: '14px', border: 'none', backgroundColor: profile.is_featured ? 'var(--brand-gold)' : '#e2e8f0', cursor: promoSaving[profile.id] ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 0.2s', opacity: promoSaving[profile.id] ? 0.6 : 1 }}
                          >
                            <span style={{ position: 'absolute', top: '3px', left: profile.is_featured ? '26px' : '3px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s', display: 'block' }} />
                          </button>
                          {profile.is_featured && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
                              <Star size={11} fill="var(--brand-gold)" color="var(--brand-gold)" />
                              <span style={{ fontSize: '0.65rem', color: 'var(--brand-gold)', fontWeight: 800 }}>FEATURED</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <input
                            type="number" min="0" defaultValue={profile.sort_order ?? 0} key={profile.sort_order}
                            onBlur={e => updateSortOrder(profile, e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') updateSortOrder(profile, e.target.value); }}
                            disabled={promoSaving[profile.id]}
                            style={{ width: '64px', padding: '0.35rem 0.5rem', textAlign: 'center', border: '1.5px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, outline: 'none', opacity: promoSaving[profile.id] ? 0.5 : 1 }}
                          />
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: profile.is_active ? '#dcfce7' : '#fee2e2', color: profile.is_active ? '#166534' : '#991b1b' }}>
                            {profile.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Seller Management */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Seller Management</h2>
            <button
              onClick={() => openCreateProduct(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
            >
              <Plus size={14} /> New Product
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}>
            {promoSellers.map(profile => (
              <div key={profile.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ height: '80px', backgroundColor: profile.brand_color || 'var(--bg-deep)', backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  {profile.icon_url && (
                    <img src={profile.icon_url} alt={`${profile.store_name} icon`} style={{ position: 'absolute', bottom: '-20px', left: '1rem', width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', objectFit: 'cover', backgroundColor: 'white' }} />
                  )}
                </div>
                <div style={{ padding: '1.5rem 1.25rem 1rem', paddingTop: profile.icon_url ? '1.75rem' : '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--bg-deep)', margin: '0 0 0.15rem' }}>{profile.store_name}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>{profile.user_email || ''}</p>
                    </div>
                    <button
                      onClick={() => openEditSeller(profile)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: 'var(--bg-deep)' }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  </div>
                  {profile.tagline && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>{profile.tagline}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {profile.location_city && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>{profile.location_city}</span>}
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', backgroundColor: profile.is_featured ? '#fef9ec' : '#f1f5f9', borderRadius: '4px', color: profile.is_featured ? '#b45309' : '#64748b' }}>
                      {profile.is_featured ? '★ Featured' : 'Not Featured'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        </>}
        {activePage === 'orders' && <>

        {/* Orders Management */}
        <section>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Orders Management</h2>
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', overflowX: 'auto', width: isMobile ? '100%' : 'auto' }}>
              {[
                { id: 'pending', label: 'Pending', icon: <Clock size={14} />, count: orders.pending.length },
                { id: 'transit', label: 'In Transit', icon: <Truck size={14} />, count: orders.transit.length },
                { id: 'delivered', label: 'Delivered', icon: <CheckCircle size={14} />, count: orders.delivered.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? 'var(--bg-deep)' : 'var(--text-secondary)', boxShadow: activeTab === tab.id ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                  {tab.icon} {tab.label} <span style={{ backgroundColor: activeTab === tab.id ? 'var(--bg-secondary)' : '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.7rem' }}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            const grouped = orders[activeTab].reduce((acc, o) => {
              const key = fmt(o.created_at);
              if (!acc[key]) acc[key] = [];
              acc[key].push(o);
              return acc;
            }, {});
            const dateGroups = Object.entries(grouped);
            const statusBg = { pending: '#fef3c7', transit: '#e0f2fe', delivered: '#dcfce7' };
            const statusColor = { pending: '#92400e', transit: '#0369a1', delivered: '#166534' };
            return (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {orders[activeTab].length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders in this category.</div>
            ) : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dateGroups.map(([date, dayOrders]) => (
                  <div key={date}>
                    <div style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', borderTop: '1px solid var(--border-subtle)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {date}
                    </div>
                    {dayOrders.map(order => (
                      <div key={order.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedOrder === order.id ? '#f8fafc' : 'white' }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>#{order.order_number}</div>
                              <Link
                                to={`/orders/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in new tab"
                                onClick={e => e.stopPropagation()}
                                style={{ display: 'inline-flex', color: 'var(--text-secondary)', opacity: 0.6 }}
                              ><ExternalLink size={14} /></Link>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{parseFloat(order.total_amount).toLocaleString()}</span>
                            </div>
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                        {expandedOrder === order.id && (
                          <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                              <Clock size={14} /> <span style={{ color: 'var(--text-primary)' }}>{new Date(order.created_at).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                              <IndianRupee size={14} /> <span style={{ color: 'var(--text-primary)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Paid via: {order.payment_gateway || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                              <User size={14} /> <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{order.user__phone || order.guest_phone || order.user__email || order.guest_email || 'Unknown'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                              <Store size={14} /> <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>Seller: {order.seller_name} ({order.seller_contact})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <select
                                value={order.status}
                                disabled={!!smUpdating[order.sub_order_id]}
                                onClick={e => e.stopPropagation()}
                                onChange={e => { e.stopPropagation(); updateSubOrderStatus(order.sub_order_id, e.target.value, order.order_number, order.status); }}
                                style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '7px', border: '1.5px solid var(--border-subtle)', fontSize: '0.8rem', backgroundColor: 'white', cursor: 'pointer', fontWeight: 700, color: 'var(--bg-deep)' }}
                              >
                                {SUB_ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                              {smUpdating[order.sub_order_id] && <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Saving…</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button onClick={() => navigate(`/orders/${order.id}`)} style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                                View Details
                              </button>
                              <Link
                                to={`/orders/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in new tab"
                                onClick={e => e.stopPropagation()}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.75rem', border: '1.5px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-secondary)', textDecoration: 'none' }}
                              ><ExternalLink size={16} /></Link>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Order ID</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Time</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Customer</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Seller</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Seller Contact</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Payment Via</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateGroups.map(([date, dayOrders]) => (
                      <>
                        <tr key={`hdr-${date}`}>
                          <td colSpan="8" style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {date} <span style={{ fontWeight: 500, opacity: 0.7 }}>— {dayOrders.length} order{dayOrders.length !== 1 ? 's' : ''}</span>
                          </td>
                        </tr>
                        {dayOrders.map(order => (
                          <tr key={order.id} style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Link
                                  to={`/orders/${order.id}`}
                                  title="Open order (right-click or ⌘/Ctrl-click to open in a new tab)"
                                  style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                                >#{order.order_number}</Link>
                                <Link
                                  to={`/orders/${order.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open in new tab"
                                  onClick={e => e.stopPropagation()}
                                  style={{ display: 'inline-flex', color: 'var(--text-secondary)', opacity: 0.55 }}
                                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                                  onMouseLeave={e => { e.currentTarget.style.opacity = 0.55; }}
                                ><ExternalLink size={14} /></Link>
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.user__phone || order.guest_phone || order.user__email || order.guest_email || 'Unknown'}</td>
                            <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.seller_name}</td>
                            <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.seller_contact}</td>
                            <td style={{ padding: '1.25rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                              {order.payment_gateway || '—'}
                            </td>
                            <td style={{ padding: '0.75rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <select
                                  value={order.status}
                                  disabled={!!smUpdating[order.sub_order_id]}
                                  onChange={e => updateSubOrderStatus(order.sub_order_id, e.target.value, order.order_number, order.status)}
                                  style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1.5px solid var(--border-subtle)', fontSize: '0.78rem', backgroundColor: 'white', cursor: smUpdating[order.sub_order_id] ? 'not-allowed' : 'pointer', fontWeight: 700, color: 'var(--bg-deep)', opacity: smUpdating[order.sub_order_id] ? 0.6 : 1 }}
                                >
                                  {SUB_ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                {smUpdating[order.sub_order_id] && <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>…</span>}
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(order.total_amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            );
          })()}
        </section>

        </>}
        {activePage === 'settlements' && <>

        {/* ── Seller Settlements ──────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Pending Settlements</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Unsettled seller payouts grouped by seller and delivery week.
              </p>
            </div>
            <button onClick={fetchSettlements} disabled={settlementsLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', color: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', cursor: settlementsLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
              <RefreshCw size={14} /> {settlementsLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {settlementsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading settlements…</div>
          ) : !settlementsLoaded ? (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <IndianRupee size={32} color="#e2e8f0" />
              <span>Click below to load pending settlements.</span>
              <button onClick={fetchSettlements} style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Load Settlements</button>
            </div>
          ) : settlements.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <IndianRupee size={32} color="#e2e8f0" />
              <span>All payments are settled — no pending settlements.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {settlements.map(seller => (
                <div key={seller.seller_id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  {/* Seller header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--bg-deep)', margin: 0 }}>{seller.seller_name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                        {seller.payout_type?.toUpperCase() || 'N/A'}
                        {seller.payout_account ? ` · ${seller.payout_account}` : ''}
                        {seller.ifsc_code ? ` · ${seller.ifsc_code}` : ''}
                        {seller.account_holder_name ? ` · ${seller.account_holder_name}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--bg-deep)' }}>
                        ₹{seller.total_pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginLeft: '0.3rem' }}>total pending</span>
                      </span>
                    </div>
                  </div>

                  {/* Week groups */}
                  {seller.weeks.map(week => (
                    <div key={week.week_key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Week header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1.25rem', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {week.week_label} &nbsp;·&nbsp; {week.orders.length} order{week.orders.length !== 1 ? 's' : ''}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                            ₹{week.week_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => markWeekSettled(seller.seller_id, week.week_key, week.orders.map(o => o.settlement_id), week.week_label, week.week_total)}
                            disabled={week.orders.some(o => settlingIds.has(o.settlement_id))}
                            style={{ padding: '0.3rem 0.85rem', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Settle All
                          </button>
                        </div>
                      </div>

                      {/* Order rows */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <tbody>
                          {week.orders.map(order => (
                            <tr key={order.settlement_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-secondary)', width: '1%', whiteSpace: 'nowrap' }}>
                                {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--bg-deep)', whiteSpace: 'nowrap' }}>
                                #{order.order_number}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                {order.sub_order_number}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                  {order.sub_order_status}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--bg-deep)', textAlign: 'right' }}>
                                ₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                                <button
                                  onClick={() => markSettled(order.settlement_id, seller.seller_id, week.week_key, order.order_number, order.amount)}
                                  disabled={settlingIds.has(order.settlement_id)}
                                  style={{ padding: '0.3rem 0.85rem', borderRadius: '6px', backgroundColor: settlingIds.has(order.settlement_id) ? '#f1f5f9' : 'var(--bg-deep)', color: settlingIds.has(order.settlement_id) ? '#94a3b8' : 'white', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: settlingIds.has(order.settlement_id) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                                >
                                  {settlingIds.has(order.settlement_id) ? 'Settling…' : 'Mark Settled'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        </>}
        {activePage === 'bugs' && <>

        {/* ── Bug Reports Management ──────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Bug Reports</h2>
            <button onClick={fetchBugReports} disabled={bugReportsLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', color: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', cursor: bugReportsLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
              Refresh
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {bugReportsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading bug reports…</div>
            ) : bugReports.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <span>Bug reports not loaded yet.</span>
                <button onClick={fetchBugReports} style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Load Bug Reports</button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Reported By</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700, width: '40%' }}>Description & Images</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bugReports.map(bug => (
                      <tr key={bug.id} style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem', backgroundColor: bug.status === 'resolved' ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                          {new Date(bug.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          {bug.user ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{bug.user.full_name || bug.user.username}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bug.user.email}</span>
                            </div>
                          ) : (
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{bug.contact_info || 'Guest'}</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{bug.description}</p>
                          {bug.images && bug.images.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {bug.images.map((img, i) => (
                                <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                  <img src={img} alt="Bug screenshot" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <button
                            onClick={() => resolveBugReport(bug.id, bug.status)}
                            style={{
                              padding: '0.4rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: 'none',
                              backgroundColor: bug.status === 'resolved' ? '#dcfce7' : '#fee2e2',
                              color: bug.status === 'resolved' ? '#166534' : '#991b1b',
                            }}
                          >
                            {bug.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        </>}
        {activePage === 'categories' && <>

        {/* ── Categories & Subcategories Management ──────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Categories & Shipping Rates</h2>
            <button onClick={() => { setCatModal('create-cat'); setCatModalData({}); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
              <Plus size={14} /> Add Category
            </button>
          </div>

          {categories.length === 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <span>Categories not loaded yet.</span>
              <button onClick={refreshCategories} style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Load Categories</button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {/* Category header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setCatExpanded(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}>

                  {/* Circle image preview */}
                  <div style={{ position: 'relative', flexShrink: 0, width: '48px', height: '48px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      overflow: 'hidden', border: '2px solid #e2e8f0',
                      background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8',
                    }}>
                      {cat.image_url
                        ? <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : cat.name[0]}
                    </div>
                    {cat.image_url && (
                      <button
                        onClick={e => { e.stopPropagation(); removeCatImage(cat.id); }}
                        title="Remove image"
                        style={{
                          position: 'absolute', top: '-4px', right: '-4px',
                          width: '16px', height: '16px', borderRadius: '50%',
                          background: '#ef4444', border: '1.5px solid white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0,
                        }}
                      >
                        <X size={9} color="white" strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  {/* Upload image button — always visible */}
                  <label
                    onClick={e => e.stopPropagation()}
                    title="Upload category image"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.3rem 0.7rem', borderRadius: '6px',
                      border: '1.5px dashed #cbd5e1',
                      background: catImageUploading[cat.id] ? '#f8fafc' : 'white',
                      color: '#64748b', fontSize: '0.72rem', fontWeight: 600,
                      cursor: catImageUploading[cat.id] ? 'wait' : 'pointer',
                      flexShrink: 0, whiteSpace: 'nowrap',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#334155'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <Image size={13} />
                    {catImageUploading[cat.id] ? 'Uploading…' : (cat.image_url ? 'Change Image' : 'Upload Image')}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => uploadCatImage(cat.id, e.target.files[0])}
                    />
                  </label>

                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--bg-deep)', margin: '0 0 0.2rem' }}>{cat.name}</p>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
                      {cat.shipping_type?.toUpperCase()} &nbsp;·&nbsp; {(cat.subcategories || []).length} subcategories &nbsp;·&nbsp; {(cat.shipping_rates || []).length} rate tiers
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <StatChip label="GST" value={`${cat.gst_percentage}%`} color="#f59e0b" />
                    <StatChip label="Commission" value={`${cat.commission_rate}%`} color="#3b82f6" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    <IconBtn icon={<Edit2 size={13} />} onClick={e => { e.stopPropagation(); setCatModal('edit-cat'); setCatModalData({ ...cat }); }} title="Edit category" />
                    <IconBtn icon={<Trash2 size={13} />} danger onClick={e => { e.stopPropagation(); deleteCatItem('cat', cat.id); }} title="Delete category" />
                    {catExpanded[cat.id] ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </div>
                </div>

                {catExpanded[cat.id] && (
                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem' }}>

                    {/* Subcategories */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', margin: 0 }}>Subcategories</p>
                        <button onClick={() => { setCatModal('create-sub'); setCatModalData({}); setCatModalParent(cat.id); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--bg-deep)', background: 'transparent', color: 'var(--bg-deep)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                          <Plus size={11} /> Add Subcategory
                        </button>
                      </div>
                      {(cat.subcategories || []).length === 0
                        ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No subcategories yet.</p>
                        : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.75rem' }}>
                            {cat.subcategories.map(sub => (
                              <div key={sub.id} style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: '0 0 0.2rem', color: 'var(--bg-deep)' }}>{sub.name}</p>
                                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>
                                    GST: <strong>{sub.gst_percentage != null ? `${sub.gst_percentage}%` : `↑ ${cat.gst_percentage}%`}</strong>
                                    &nbsp;·&nbsp;Comm: <strong>{sub.commission_rate != null ? `${sub.commission_rate}%` : `↑ ${cat.commission_rate}%`}</strong>
                                  </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                  <IconBtn icon={<Edit2 size={12} />} onClick={() => { setCatModal('edit-sub'); setCatModalData({ ...sub }); }} title="Edit" />
                                  <IconBtn icon={<Trash2 size={12} />} danger onClick={() => deleteCatItem('sub', sub.id)} title="Delete" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Category-level shipping rates */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', margin: 0 }}>Weight-Based Shipping Rates</p>
                        <button onClick={() => { setCatModal('create-rate'); setCatModalData({}); setCatModalParent({ catId: cat.id, subId: null }); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                          <Plus size={11} /> Add Rate Tier
                        </button>
                      </div>
                      {(cat.shipping_rates || []).length === 0
                        ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No custom tiers — platform default (light/heavy) applies.</p>
                        : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9' }}>
                                {['Min Weight', 'Max Weight', 'Rate (₹)', 'Free Above (₹)', ''].map(h => (
                                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {cat.shipping_rates.map(rate => (
                                <tr key={rate.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.5rem 0.75rem' }}>{rate.min_weight_grams}g</td>
                                  <td style={{ padding: '0.5rem 0.75rem' }}>{rate.max_weight_grams ? `${rate.max_weight_grams}g` : '∞'}</td>
                                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#1b2d2a' }}>₹{rate.rate}</td>
                                  <td style={{ padding: '0.5rem 0.75rem', color: '#16a34a' }}>{rate.free_above_order_value ? `₹${rate.free_above_order_value}` : '—'}</td>
                                  <td style={{ padding: '0.5rem 0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                      <IconBtn icon={<Edit2 size={12} />} onClick={() => { setCatModal('edit-rate'); setCatModalData({ ...rate }); }} title="Edit" />
                                      <IconBtn icon={<Trash2 size={12} />} danger onClick={() => deleteCatItem('rate', rate.id)} title="Delete" />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        </>}

        {activePage === 'combos' && <CombosManager />}

      </main>

      {/* ── Order Status Confirmation Modal ────────────────────────────────────── */}
      {statusConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={20} color="#0369a1" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 800, color: 'var(--bg-deep)' }}>Change Order Status</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Order <strong>#{statusConfirm.orderNumber}</strong>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '50px', backgroundColor: '#f1f5f9', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {statusConfirm.currentStatus}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>→</span>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '50px', backgroundColor: '#dbeafe', fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
                    {statusConfirm.newStatus}
                  </span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              This will immediately update the sub-order status. Changing to <strong>delivered</strong> will also create a pending settlement for the seller.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStatusConfirm(null)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'white', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#0369a1', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Yes, Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settlement Confirmation Modal ──────────────────────────────────────── */}
      {settleConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IndianRupee size={20} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 800, color: 'var(--bg-deep)' }}>Confirm Settlement</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{settleConfirm.label}</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>{settleConfirm.amount}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              This marks the payment as transferred to the seller. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSettleConfirm(null)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'white', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSettle}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Yes, Mark Settled
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category / Subcategory / Shipping Rate Modal ──────────────────────── */}
      {catModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', margin: 0, color: 'var(--bg-deep)' }}>
                {({'create-cat':'New Category','edit-cat':'Edit Category','create-sub':'New Subcategory','edit-sub':'Edit Subcategory','create-rate':'New Shipping Rate Tier','edit-rate':'Edit Shipping Rate Tier'})[catModal]}
              </h3>
              <button onClick={() => { setCatModal(null); setCatModalData({}); setCatError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            {catError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>{catError}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(catModal === 'create-cat' || catModal === 'edit-cat') && <>
                <CatField label="Name *" value={catModalData.name || ''} onChange={v => setCatModalData(p => ({ ...p, name: v }))} />
                <CatField label="Description" value={catModalData.description || ''} onChange={v => setCatModalData(p => ({ ...p, description: v }))} type="textarea" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <CatField label="GST %" value={catModalData.gst_percentage ?? ''} onChange={v => setCatModalData(p => ({ ...p, gst_percentage: v }))} type="number" placeholder="e.g. 12" />
                  <CatField label="Commission %" value={catModalData.commission_rate ?? ''} onChange={v => setCatModalData(p => ({ ...p, commission_rate: v }))} type="number" placeholder="e.g. 15" />
                </div>
                <div>
                  <label style={labelStyle}>Shipping Type</label>
                  <select value={catModalData.shipping_type || 'plant'} onChange={e => setCatModalData(p => ({ ...p, shipping_type: e.target.value }))} style={selectStyle}>
                    {[['plant','Plant / Live Specimen'],['accessory','Accessory / Tool'],['heavy','Heavy Item (>3kg)'],['flat','Flat Rate']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </>}

              {(catModal === 'create-sub' || catModal === 'edit-sub') && <>
                <CatField label="Name *" value={catModalData.name || ''} onChange={v => setCatModalData(p => ({ ...p, name: v }))} />
                <CatField label="Description" value={catModalData.description || ''} onChange={v => setCatModalData(p => ({ ...p, description: v }))} type="textarea" />
                <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.78rem', color: '#0369a1' }}>
                  Leave GST / Commission blank to inherit from the parent category.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <CatField label="Override GST %" value={catModalData.gst_percentage ?? ''} onChange={v => setCatModalData(p => ({ ...p, gst_percentage: v || null }))} type="number" placeholder="inherit" />
                  <CatField label="Override Commission %" value={catModalData.commission_rate ?? ''} onChange={v => setCatModalData(p => ({ ...p, commission_rate: v || null }))} type="number" placeholder="inherit" />
                </div>
              </>}

              {(catModal === 'create-rate' || catModal === 'edit-rate') && <>
                <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.78rem', color: '#166534' }}>
                  Define one tier per weight range. Leave "Max Weight" blank for the top tier (above all others). Shipping fee is charged per seller sub-order.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <CatField label="Min Weight (grams) *" value={catModalData.min_weight_grams ?? ''} onChange={v => setCatModalData(p => ({ ...p, min_weight_grams: v }))} type="number" placeholder="0" />
                  <CatField label="Max Weight (grams)" value={catModalData.max_weight_grams ?? ''} onChange={v => setCatModalData(p => ({ ...p, max_weight_grams: v || null }))} type="number" placeholder="blank = no limit" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <CatField label="Shipping Rate (₹) *" value={catModalData.rate ?? ''} onChange={v => setCatModalData(p => ({ ...p, rate: v }))} type="number" placeholder="e.g. 99" />
                  <CatField label="Free Shipping Above (₹)" value={catModalData.free_above_order_value ?? ''} onChange={v => setCatModalData(p => ({ ...p, free_above_order_value: v || null }))} type="number" placeholder="e.g. 699" />
                </div>
              </>}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => { setCatModal(null); setCatModalData({}); setCatError(''); }} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Cancel</button>
              <button onClick={saveCatModal} disabled={catSaving} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'white', cursor: catSaving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem', opacity: catSaving ? 0.6 : 1 }}>
                {catSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Seller Modal ──────────────────────────────────────────────────── */}
      {editingSeller && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem 1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Edit: {editingSeller.store_name}</h3>
              <button onClick={() => setEditingSeller(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            {editSellerError && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{editSellerError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {[
                { label: 'Store Name', key: 'store_name' },
                { label: 'Location City', key: 'location_city' },
                { label: 'Tagline', key: 'tagline' },
                { label: 'Location Pincode', key: 'location_pincode' },
                { label: 'GST Number', key: 'gst_number' },
                { label: 'Brand Color (hex)', key: 'brand_color' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    value={editSellerForm[key] || ''}
                    onChange={e => setEditSellerForm(f => ({ ...f, [key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>

            {/* Logo & Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {[
                { label: 'Icon (profile pic)', field: 'icon_url', uploadKey: 'icon' },
                { label: 'Logo', field: 'logo_url', uploadKey: 'logo' },
                { label: 'Banner', field: 'banner_url', uploadKey: 'banner' },
              ].map(({ label, field, uploadKey }) => (
                <div key={field}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ width: '100%', height: uploadKey === 'logo' ? '80px' : '60px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', overflow: 'hidden', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editSellerForm[field]
                      ? <img src={editSellerForm[field]} alt={label} style={{ width: '100%', height: '100%', objectFit: uploadKey === 'logo' ? 'contain' : 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                      : <Image size={20} color="#cbd5e1" />}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem', borderRadius: '7px', border: '1px dashed #94a3b8', backgroundColor: imageUploading[uploadKey] ? '#f1f5f9' : 'white', cursor: imageUploading[uploadKey] ? 'default' : 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', width: '100%', boxSizing: 'border-box' }}>
                    {imageUploading[uploadKey] ? 'Uploading...' : <><Image size={12} /> Upload file</>}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={imageUploading[uploadKey]} onChange={e => { if (e.target.files[0]) uploadSellerImage(e.target.files[0], field); e.target.value = ''; }} />
                  </label>
                  <input value={editSellerForm[field] || ''} onChange={e => setEditSellerForm(f => ({ ...f, [field]: e.target.value }))} placeholder="or paste URL" style={{ ...inputStyle, fontSize: '0.75rem', color: '#64748b' }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Bio</label>
              <textarea value={editSellerForm.bio || ''} onChange={e => setEditSellerForm(f => ({ ...f, bio: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Expertise Tags (comma separated)</label>
              <input value={editSellerForm.expertise_tags || ''} onChange={e => setEditSellerForm(f => ({ ...f, expertise_tags: e.target.value }))} placeholder="Bucephalandra, Rare Aroids, Aquatic Plants" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Store Active', key: 'is_active' },
                { label: 'Identity Verified', key: 'identity_verified' },
              ].map(({ label, key }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={!!editSellerForm[key]}
                    onChange={e => setEditSellerForm(f => ({ ...f, [key]: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Admin-only: commission config for this seller. Never shown to the seller themselves. */}
            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', borderRadius: '12px', backgroundColor: '#fef9c3', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#854d0e', margin: '0 0 0.25rem' }}>Commission &amp; Pricing</p>
              <p style={{ fontSize: '0.7rem', color: '#854d0e', margin: '0 0 1rem' }}>
                Admin-only. Toggle OFF: buyer pays L × (1 + seller_rate%); payout = L × (1 − buyer_rate%).
                Toggle ON: buyer pays L exactly; payout = L × (1 − (seller_rate + buyer_rate)%).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.3rem', color: '#854d0e' }}>Seller commission rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editSellerForm.seller_commission_rate ?? ''}
                    onChange={e => setEditSellerForm(f => ({ ...f, seller_commission_rate: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.3rem', color: '#854d0e' }}>Buyer commission rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editSellerForm.buyer_commission_rate ?? ''}
                    onChange={e => setEditSellerForm(f => ({ ...f, buyer_commission_rate: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#854d0e' }}>
                <input
                  type="checkbox"
                  checked={!!editSellerForm.price_is_buyer_final}
                  onChange={e => setEditSellerForm(f => ({ ...f, price_is_buyer_final: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Price is buyer-final (seller's typed price IS what buyer pays)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '2rem' }}>
              <button onClick={() => setEditingSeller(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Cancel</button>
              <button onClick={saveSellerProfile} disabled={editSellerSaving} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', opacity: editSellerSaving ? 0.6 : 1 }}>
                {editSellerSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Products for this seller */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', margin: 0 }}>
                  Products ({sellerProducts.length})
                </h4>
                <button
                  onClick={() => openCreateProduct(editingSeller)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-deep)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  <Plus size={12} /> Add Product
                </button>
              </div>
              {productsLoading ? (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Loading products...</p>
              ) : sellerProducts.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No products found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto' }}>
                  {sellerProducts.map(product => (
                    <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e8ede9', flexShrink: 0 }}>
                        {product.image && <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
                        <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>
                          ₹{product.price} • {product.is_active ? 'Active' : 'Inactive'}
                          {product.is_rare && <span style={{ marginLeft: '0.4rem', color: '#b45309' }}>★ Rare</span>}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          onClick={() => openEditProduct(product)}
                          title="Edit product"
                          style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, color: 'var(--bg-deep)' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => copyProduct(product)}
                          disabled={copyingProducts[product.id]}
                          title="Copy product"
                          style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: copyingProducts[product.id] ? 'not-allowed' : 'pointer', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', opacity: copyingProducts[product.id] ? 0.5 : 1 }}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ─────────────────────────────────────────────────── */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem 1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.2rem' }}>Edit Product</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{editingProduct.name}</p>
              </div>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            {editProductError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {editProductError}
              </div>
            )}

            <ProductForm
              form={editProductForm}
              setForm={setEditProductForm}
              categories={categories}
              sellers={promoSellers}
              mode="edit"
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setEditingProduct(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Cancel</button>
              <button onClick={saveProduct} disabled={editProductSaving} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', opacity: editProductSaving ? 0.6 : 1 }}>
                {editProductSaving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Product Modal ───────────────────────────────────────────────── */}
      {creatingProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem 1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>New Product</h3>
              <button onClick={() => setCreatingProduct(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            {createProductError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {createProductError}
              </div>
            )}

            <ProductForm
              form={createProductForm}
              setForm={setCreateProductForm}
              categories={categories}
              sellers={promoSellers}
              mode="create"
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setCreatingProduct(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Cancel</button>
              <button onClick={saveNewProduct} disabled={createProductSaving} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', opacity: createProductSaving ? 0.6 : 1 }}>
                {createProductSaving ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Confirmation Modal */}
      {paymentConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div onClick={() => setPaymentConfirm(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,20,18,0.55)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', backgroundColor: 'white', borderRadius: '20px', padding: '2.5rem', maxWidth: '420px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <IndianRupee size={26} color="#92400e" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--bg-deep)', marginBottom: '0.75rem' }}>Switch Payment Gateway?</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              You are switching to <strong style={{ color: 'var(--bg-deep)' }}>{paymentConfirm.label}</strong>.
            </p>
            <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, marginBottom: '2rem' }}>
              This will immediately affect all active checkout sessions.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setPaymentConfirm(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>
                Cancel
              </button>
              <button
                onClick={confirmAndSetGateway}
                disabled={paymentGatewaySaving}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', opacity: paymentGatewaySaving ? 0.6 : 1 }}
              >
                {paymentGatewaySaving ? 'Switching…' : 'Yes, Switch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Provider Confirmation Modal */}
      {shippingConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div onClick={() => setShippingConfirm(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,20,18,0.55)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', backgroundColor: 'white', borderRadius: '20px', padding: '2.5rem', maxWidth: '420px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Truck size={26} color="#1d4ed8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--bg-deep)', marginBottom: '0.75rem' }}>Switch Logistics Provider?</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              You are switching to <strong style={{ color: 'var(--bg-deep)' }}>{shippingConfirm.label}</strong>.
            </p>
            <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, marginBottom: '2rem' }}>
              All new shipment bookings will use this provider from this point forward.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShippingConfirm(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>
                Cancel
              </button>
              <button
                onClick={confirmAndSetLogistics}
                disabled={logisticsProviderSaving}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', opacity: logisticsProviderSaving ? 0.6 : 1 }}
              >
                {logisticsProviderSaving ? 'Switching…' : 'Yes, Switch'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
