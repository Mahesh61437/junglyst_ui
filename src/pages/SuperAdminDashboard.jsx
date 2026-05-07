import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package, Users, IndianRupee, Truck, CheckCircle, Clock,
  LayoutDashboard, Store, Mail, Phone, ChevronDown, ChevronUp,
  User, Search, Star, Edit2, X, Plus, Image, Copy,
} from 'lucide-react';

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
  const selectedCat = categories.find(c => String(c.id) === String(form.category_id));
  const subCats = selectedCat?.subcategories || [];

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

      {/* Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={form.category_id || ''}
            onChange={e => setForm(f => ({ ...f, category_id: e.target.value, sub_category_id: '' }))}
            style={selectStyle}
          >
            <option value="">— none —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Subcategory</label>
          <select
            value={form.sub_category_id || ''}
            onChange={e => setForm(f => ({ ...f, sub_category_id: e.target.value }))}
            style={selectStyle}
            disabled={!subCats.length}
          >
            <option value="">— none —</option>
            {subCats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
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

  const openEditSeller = (profile) => {
    setEditingSeller(profile);
    setEditSellerForm({
      store_name: profile.store_name || '',
      bio: profile.bio || '',
      tagline: profile.tagline || '',
      brand_color: profile.brand_color || '#0A3029',
      location_city: profile.location_city || '',
      logo_url: profile.logo_url || '',
      banner_url: profile.banner_url || '',
      expertise_tags: (profile.expertise_tags || []).join(', '),
    });
    setEditSellerError('');
    loadSellerProducts(profile.user);
  };

  const uploadSellerImage = async (file, field) => {
    const key = field === 'logo_url' ? 'logo' : 'banner';
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
      setEditSellerError(e.response?.data?.store_name?.[0] || e.response?.data?.error || 'Save failed.');
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
      category_id: product.categories?.[0]?.id || '',
      sub_category_id: product.sub_category?.id || '',
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
      if (editProductForm.category_id) payload.category_id = Number(editProductForm.category_id);
      if (editProductForm.sub_category_id) payload.sub_category_id = Number(editProductForm.sub_category_id);

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
      setEditProductError(e.response?.data?.name?.[0] || e.response?.data?.detail || e.response?.data?.error || 'Save failed.');
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
      category_id: '',
      sub_category_id: '',
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
      if (payload.category_id) payload.category_id = Number(payload.category_id);
      if (payload.sub_category_id) payload.sub_category_id = Number(payload.sub_category_id);
      delete payload.category_id_empty;

      const res = await api.post('/core/products/admin-create/', payload);

      if (editingSeller && String(res.data.seller?.id) === String(editingSeller.user)) {
        setSellerProducts(prev => [res.data, ...prev]);
      }
      setCreatingProduct(false);
    } catch (e) {
      setCreateProductError(
        e.response?.data?.name?.[0] ||
        e.response?.data?.error ||
        e.response?.data?.detail ||
        JSON.stringify(e.response?.data) ||
        'Create failed.'
      );
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

  useEffect(() => {
    api.get('/core/categories/').then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

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
    fetchPromoSellers();
  }, [user, authLoading, navigate]);

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

  const { overall_analytics, sellers, orders } = data;

  const filteredSellers = sellers.filter(s =>
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
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.full_name || user?.username}</span>
            <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
              EXIT
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

        {/* Analytics Summary */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Monthly Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: 'Revenue (Month)', value: `₹${overall_analytics.revenue_this_month.toLocaleString()}`, icon: <IndianRupee size={24} />, color: 'var(--brand-gold)' },
              { title: 'Orders (Month)', value: overall_analytics.orders_this_month, icon: <Package size={24} />, color: 'var(--brand-green)' },
              { title: 'Active Sellers', value: overall_analytics.total_sellers, icon: <Store size={24} />, color: '#3b82f6' },
              { title: 'Total Collectors', value: overall_analytics.total_users, icon: <Users size={24} />, color: '#8b5cf6' },
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

        {/* Sellers Directory */}
        <section>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', margin: 0 }}>Sellers Directory</h2>
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                          {seller.is_verified ? (
                            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>Verified</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>Pending</span>
                              <button onClick={(e) => { e.stopPropagation(); authorizeSeller(seller.id); }} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Authorize</button>
                              <button onClick={(e) => { e.stopPropagation(); rejectSeller(seller.id); }} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Reject</button>
                            </div>
                          )}
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
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Status</th>
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
                          {seller.is_verified ? (
                            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>Verified</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>Pending</span>
                              <button onClick={(e) => { e.stopPropagation(); authorizeSeller(seller.id); }} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Authorize</button>
                              <button onClick={(e) => { e.stopPropagation(); rejectSeller(seller.id); }} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Reject</button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 600 }}>{seller.total_orders}</td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 700, color: 'var(--brand-green)' }}>₹{seller.total_revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredSellers.length === 0 && (
                      <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No sellers found.</td></tr>
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
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No seller profiles found.</div>
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
                  {profile.logo_url && (
                    <img src={profile.logo_url} alt="" style={{ position: 'absolute', bottom: '-20px', left: '1rem', width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', objectFit: 'cover', backgroundColor: 'white' }} />
                  )}
                </div>
                <div style={{ padding: '1.5rem 1.25rem 1rem', paddingTop: profile.logo_url ? '1.75rem' : '1.25rem' }}>
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

          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {orders[activeTab].map(order => (
                  <div key={order.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedOrder === order.id ? '#f8fafc' : 'white' }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>#{order.order_number}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <span style={{ backgroundColor: activeTab === 'pending' ? '#fef3c7' : activeTab === 'transit' ? '#e0f2fe' : '#dcfce7', color: activeTab === 'pending' ? '#92400e' : activeTab === 'transit' ? '#0369a1' : '#166534', padding: '0.2rem 0.5rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            {order.status}
                          </span>
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
                          <User size={14} /> <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{order.user__phone || order.guest_phone || order.user__email || order.guest_email || 'Unknown'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Store size={14} /> <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>Seller: {order.seller_name} ({order.seller_contact})</span>
                        </div>
                        <button onClick={() => navigate(`/orders/${order.id}`)} style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--brand-gold)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {orders[activeTab].length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders in this category.</div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Order ID</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Customer</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Seller</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Seller Contact</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '1.25rem', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders[activeTab].map(order => (
                      <tr key={order.id} style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => navigate(`/orders/${order.id}`)}>
                        <td style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>#{order.order_number}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.user__phone || order.guest_phone || order.user__email || order.guest_email || 'Unknown'}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.seller_name}</td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{order.seller_contact}</td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ backgroundColor: activeTab === 'pending' ? '#fef3c7' : activeTab === 'transit' ? '#e0f2fe' : '#dcfce7', color: activeTab === 'pending' ? '#92400e' : activeTab === 'transit' ? '#0369a1' : '#166534', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(order.total_amount).toLocaleString()}</td>
                      </tr>
                    ))}
                    {orders[activeTab].length === 0 && (
                      <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders in this category.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {[
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

    </div>
  );
}
