import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LayoutDashboard, Package, ShoppingBag, Settings, LogOut, 
  TrendingUp, PackageCheck, AlertCircle, Plus, Box, X, 
  Camera, CheckCircle2, Pencil, Archive, Trash2, 
  ChevronRight, Menu, ExternalLink, Store, ShieldCheck, 
  Save, Info, Image as ImageIcon, Palette, Upload, Loader2,
  Leaf, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, ArrowLeft, Download
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import NaturalLogo from '../components/NaturalLogo';
import { ProductService } from '../services/ProductService';
import { OrderService } from '../services/OrderService';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';

// Error Boundary for the Dashboard
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Dashboard Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '10rem 2rem', textAlign: 'center', backgroundColor: '#fff5f5', minHeight: '100vh' }}>
          <h1 style={{ color: '#c53030', marginBottom: '1rem' }}>Sanctuary Integrity Compromised</h1>
          <p style={{ color: '#742a2a', marginBottom: '2rem' }}>A botanical error has occurred: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '1rem 2rem', backgroundColor: '#c53030', color: 'white', border: 'none', borderRadius: '8px' }}>Repair Access</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const isLight = (color) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

export default function SellerDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ 
    name: '', scientific_name: '', category_id: '', sub_category_id: '', tagline: '', origin: '', description: '',
    care_level: 'Easy', light_requirements: 'Medium', growth_rate: 'Moderate',
    is_rare: false,
    variants: [{ 
      name: 'Standard', base_price: '', gst_rate: '0', 
      commission_rate: '10.0', price: '', stock: '', 
      weight: '0.5', length: '10', width: '10', height: '10'
    }],
    images: [{ image_url: '', is_primary: true }]
  });
  const [uploadingImages, setUploadingImages] = useState({});

  useEffect(() => {
    const updatedVariants = newProduct.variants.map(v => {
      const base = parseFloat(v.base_price) || 0;
      const gst = parseFloat(v.gst_rate) || 0;
      const comm = parseFloat(v.commission_rate) || 10.0;
      
      const gstAmt = base * (gst / 100);
      const commAmt = base * (comm / 100);
      const finalPrice = (base + gstAmt + commAmt).toFixed(2);
      
      if (v.price !== finalPrice) {
        return { ...v, price: finalPrice };
      }
      return v;
    });

    const hasChanged = updatedVariants.some((v, i) => v.price !== newProduct.variants[i].price);
    
    if (hasChanged) {
      setNewProduct(prev => ({ ...prev, variants: updatedVariants }));
    }
  }, [newProduct.variants]);

  const [spotlight, setSpotlight] = useState({
    id: null,
    store_name: 'My Botanical Studio',
    expertise: 'Master Grower',
    bio: 'Sharing rare specimens from my private sanctuary.',
    logo_url: '',
    banner_url: '',
    brand_color: '#0A3029',
    location_city: 'Karnataka, India'
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState({
    total_revenue: 0,
    total_orders: 0,
    pending_orders: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    low_stock_variants: 0
  });

  const [uploading, setUploading] = useState(null);

  const presets = [
    // Botanical Greens
    { name: 'Deep Forest', color: '#0A3029' },
    { name: 'Moss Green', color: '#4E6B4E' },
    { name: 'Emerald', color: '#065F46' },
    { name: 'Sage', color: '#8BA18E' },
    { name: 'Olive', color: '#556B2F' },
    { name: 'Tropical Fern', color: '#2D5A27' },
    
    // Earthy Tones
    { name: 'Terracotta', color: '#A45D41' },
    { name: 'Clay', color: '#7E5A50' },
    { name: 'Burnt Sienna', color: '#9B4722' },
    { name: 'Silt', color: '#4A3728' },
    { name: 'Sandstone', color: '#C2B280' },
    { name: 'Raw Umber', color: '#826644' },

    // Exotic Florals
    { name: 'Dusk Purple', color: '#4A3B4E' },
    { name: 'Orchid', color: '#9D6B81' },
    { name: 'Hibiscus', color: '#B91C1C' },
    { name: 'Saffron', color: '#EAB308' },
    { name: 'Golden Sands', color: '#D4A373' },
    { name: 'Marigold', color: '#F59E0B' },

    // Aquatic & Sky
    { name: 'Midnight', color: '#0F172A' },
    { name: 'Oceanic', color: '#1E293B' },
    { name: 'Storm', color: '#334155' },
    { name: 'Deep Sea', color: '#1E3A8A' },
    { name: 'Cloudless', color: '#94A3B8' },
    { name: 'River Bed', color: '#020617' }
  ];

  useEffect(() => {
    console.log("Dashboard mount. User:", user?.email, "AuthLoading:", authLoading);
    if (user) {
      fetchData();
    }
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user]);

  useEffect(() => {
    if (success || formError) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setFormError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, formError]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsData, ordsData, profileData, catsData] = await Promise.all([
        ProductService.getProducts({ seller: user.id }),
        OrderService.getOrders(),
        api.get('/sellers/dashboard/').catch(() => ({ data: null })),
        api.get('/core/categories/').catch(() => ({ data: { results: [] } }))
      ]);
      
      const prodsArray = Array.isArray(prodsData.results) ? prodsData.results : (Array.isArray(prodsData) ? prodsData : []);
      const ordsArray = Array.isArray(ordsData.results) ? ordsData.results : (Array.isArray(ordsData) ? ordsData : []);
      const catsArray = Array.isArray(catsData.data?.results) ? catsData.data.results : (Array.isArray(catsData.data) ? catsData.data : []);
      
      setProducts(prodsArray);
      setOrders(ordsArray);
      setCategories(catsArray);
      console.log("Dashboard data processed:", { prodsCount: prodsArray.length, ordsCount: ordsArray.length });
      
      if (profileData && profileData.data) {
        if (profileData.data.profile) {
          setSpotlight(prev => ({
            ...prev,
            ...profileData.data.profile,
            logoName: '',
            bannerName: ''
          }));
        }
        if (profileData.data.metrics) {
          setMetrics(profileData.data.metrics);
        }
      }
      console.log("Dashboard data fetched successfully", { prodsCount: prodsData.results?.length, hasProfile: !!profileData.data });
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
      setError("The botanical archives are currently inaccessible. Please refresh or check your sanctuary credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset target value so selecting the same file again triggers onChange
    e.target.value = '';

    setSpotlight(prev => ({ ...prev, [type === 'logo' ? 'logoName' : 'bannerName']: file.name }));
    setUploading(type);
    try {
      const url = await ProductService.uploadImage(file, type);
      setSpotlight(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'banner_url']: url }));
    } catch (error) {
      setFormError("Failed to upload image. Please check your connection.");
      setSpotlight(prev => ({ ...prev, [type === 'logo' ? 'logoName' : 'bannerName']: '' }));
    } finally {
      setUploading(null);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!spotlight.store_name) {
      setFieldErrors({ store_name: "Studio Name is required" });
      setFormError("Please provide a name for your sanctuary.");
      return;
    }

    setSavingProfile(true);
    setFieldErrors({});
    try {
      await api.post('/sellers/dashboard/', spotlight);
      setSuccess("Studio Identity updated successfully");
      setActiveTab('dashboard');
      fetchData();
    } catch (error) {
      console.error("Failed to save profile:", error);
      setFormError(error.response?.data?.error || "Failed to save studio details");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGalleryImageUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset target value so selecting the same file again triggers onChange
    e.target.value = '';

    setUploadingImages(prev => ({ ...prev, [idx]: true }));
    try {
      const url = await ProductService.uploadImage(file, 'product');
      const updated = [...newProduct.images];
      updated[idx].image_url = url;
      setNewProduct({ ...newProduct, images: updated });
    } catch (error) {
      setFormError("Failed to upload specimen image. Please check your connection.");
    } finally {
      setUploadingImages(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleAddProduct = async (e, addAnother = false) => {
    if (e) e.preventDefault();
    
    // Client-side Validation
    const errors = {};
    if (!newProduct.name) errors.name = "Specimen name is required";
    if (!newProduct.category_id) errors.category_id = "Please select a category";
    if (!newProduct.description) errors.description = "Botanical description is required";
    
    newProduct.variants.forEach((v, idx) => {
      if (!v.name) errors[`variant_${idx}_name`] = "Variant name required";
      if (!v.base_price) errors[`variant_${idx}_base_price`] = "Price required";
      if (!v.stock && v.stock !== 0) errors[`variant_${idx}_stock`] = "Stock required";
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please correct the highlighted botanical errors.");
      return;
    }

    setSaving(true);
    setFieldErrors({});
    
    try {
      const payload = { ...newProduct };
      
      // Filter out invalid/empty variants (already validated above but keeping as safety)
      payload.variants = payload.variants.filter(v => v.name && v.base_price !== '' && v.stock !== '');
      payload.images = payload.images.filter(img => img.image_url.trim() !== '');

      if (editingProduct) await ProductService.updateProduct(editingProduct.id, payload);
      else await ProductService.createProduct(payload);
      
      setSuccess(editingProduct ? "Specimen updated successfully" : "New specimen listed successfully");
      fetchData();
      
      if (addAnother) {
        setNewProduct({ 
          name: '', scientific_name: '', category_id: '', sub_category_id: '', tagline: '', origin: '', description: '',
          care_level: 'Easy', light_requirements: 'Medium', growth_rate: 'Moderate',
          is_rare: false,
          variants: [{ 
            name: 'Standard', base_price: '', gst_rate: '0', 
            commission_rate: '10.0', stock: '', 
            weight: '0.5', length: '10', width: '10', height: '10'
          }],
          images: [{ image_url: '', is_primary: true }]
        });
        const scrollContainer = document.getElementById('specimen-modal-content');
        if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setIsModalOpen(false);
        setActiveTab('dashboard');
      }
      setEditingProduct(null);
    } catch (error) {
      setFormError(error.response?.data?.error || "Failed to save specimen. Please verify all fields.");
    } finally {
      setSaving(false);
    }
  };

  const fillDummyData = () => {
    const randomId = Math.floor(Math.random() * 1000);
    const cat = categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)] : { id: '1', commission_rate: '20.0', gst_percentage: '12.0' };
    
    setNewProduct({
      name: `Exotic Specimen #${randomId}`,
      scientific_name: `Plantae exotica v.${randomId}`,
      category_id: String(cat.id),
      tagline: "A rare and beautiful specimen for your botanical sanctuary.",
      origin: "Southeast Asia",
      description: "This specimen has been meticulously acclimated in our private greenhouse. It exhibits vibrant coloration and robust root growth. Perfect for advanced collectors seeking a centerpiece for their display.",
      care_level: ['Easy', 'Medium', 'Advanced'][Math.floor(Math.random() * 3)],
      light_requirements: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      growth_rate: ['Slow', 'Moderate', 'Fast'][Math.floor(Math.random() * 3)],
      is_rare: Math.random() > 0.7,
      variants: [{
        name: 'Standard Pot',
        base_price: '1200',
        gst_rate: String(cat.gst_percentage || 12),
        commission_rate: String(cat.commission_rate || 20),
        stock: '15',
        weight: '0.8',
        length: '15',
        width: '15',
        height: '20'
      }],
      images: [
        { image_url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&q=80&w=1000', is_primary: true }
      ]
    });
    setFieldErrors({});
    setSuccess("Dummy data infused into form.");
  };

  const handleArchiveProduct = async () => {
    if (!editingProduct) return;
    
    setConfirmDialog({
      title: "Archive Specimen",
      message: "Are you sure you want to archive this specimen? It will no longer be visible to buyers in the sanctuary.",
      confirmLabel: "ARCHIVE SPECIMEN",
      onConfirm: async () => {
        setSaving(true);
        try {
          await ProductService.updateProduct(editingProduct.id, { is_active: false });
          setSuccess("Specimen archived successfully");
          setIsModalOpen(false);
          setEditingProduct(null);
          setActiveTab('products');
          fetchData();
        } catch (error) {
          setFormError("Failed to archive specimen");
        } finally {
          setSaving(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleCreateShipment = async (orderId) => {
    setSaving(true);
    try {
      await api.post('/shipping/logistics/create-shipment/', { order_id: orderId });
      setSuccess("Sanctuary shipment initiated via Nimbuspost");
      fetchData();
    } catch (error) {
      setFormError("Failed to initiate shipment");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #edf2ed', borderTopColor: '#1b2d2a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
        <p style={{ fontFamily: 'serif', color: '#64748b' }}>Authenticating your sanctuary access...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'grower' && user.role !== 'admin')) {
    return (
      <div className="container" style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ backgroundColor: 'var(--bg-secondary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: '#ef4444' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', fontFamily: 'serif' }}>Grower Access Required</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '3.5rem', fontSize: '1.125rem', maxWidth: '500px', margin: '0 auto 3.5rem' }}>This sanctuary is reserved for verified growers. Please sign in with an authorized account or complete your onboarding.</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '1.125rem 3.5rem' }}>Sign In</Link>
            <Link to="/seller/onboarding" className="btn btn-outline" style={{ padding: '1.125rem 3.5rem' }}>Join as Grower</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleEditProduct = (p) => {
    setEditingProduct(p);
    setNewProduct({
      name: p.name || '',
      scientific_name: p.scientific_name || '',
      category_id: p.categories?.[0]?.id || '',
      sub_category_id: p.sub_category?.id || '',
      tagline: p.tagline || '',
      origin: p.origin || '',
      description: p.description || '',
      care_level: p.care_level || 'Easy',
      light_requirements: p.light_requirements || 'Medium',
      growth_rate: p.growth_rate || 'Moderate',
      is_rare: p.is_rare || false,
      variants: p.variants?.length > 0 ? p.variants : [{ 
        name: 'Standard', base_price: '', gst_rate: '0', 
        commission_rate: '10.0', stock: '', 
        weight: '0.5', length: '10', width: '10', height: '10'
      }],
      images: p.images?.length > 0 ? p.images : [{ image_url: '', is_primary: true }]
    });
    setIsModalOpen(true);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'products', label: 'Collection', icon: <Package size={20} /> },
    { id: 'orders', label: 'Fulfillment', icon: <ShoppingBag size={20} /> },
    { id: 'spotlight', label: 'Studio Identity', icon: <Palette size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ];

  return (
    <DashboardErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8faf9' }}>
      
      {/* Sidebar */}
      <aside style={{ 
        width: isSidebarOpen ? '280px' : '0', 
        backgroundColor: '#1b2d2a', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: window.innerWidth <= 1024 ? 'fixed' : 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 1001,
        transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '3rem 2rem', minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
            <div style={{ backgroundColor: spotlight.brand_color || '#E5C48B', padding: '0.6rem', borderRadius: '12px', transition: 'background-color 0.3s' }}>
              <Leaf size={24} color="white" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif' }}>Junglyst</h2>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sidebarItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                 style={{ 
                  display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem', borderRadius: '16px', border: 'none', 
                  backgroundColor: activeTab === item.id ? spotlight.brand_color || 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTab === item.id ? (isLight(spotlight.brand_color) ? '#1b2d2a' : 'white') : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === item.id ? 700 : 500, transition: 'all 0.2s',
                  boxShadow: activeTab === item.id ? `0 4px 15px ${spotlight.brand_color}40` : 'none'
                }}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '4rem 5rem', maxWidth: '1600px' }}>
        <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ color: spotlight.brand_color || '#E5C48B', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>Grower Workspace</p>
            <h1 style={{ fontSize: '3rem', textTransform: 'capitalize', fontFamily: 'serif' }}>{activeTab}</h1>
          </div>
          {activeTab === 'products' && (
            <button 
              onClick={() => { 
                setEditingProduct(null); 
                setNewProduct({ 
                  name: '', scientific_name: '', category_id: '', sub_category_id: '', description: '', 
                  tagline: '', origin: '', care_level: 'Easy', light_requirements: 'Medium', growth_rate: 'Moderate', is_rare: false,
                  variants: [{ 
                    name: 'Standard', base_price: '', gst_rate: '0', 
                    commission_rate: '10.0', price: '', stock: '', 
                    weight: '0.5', length: '10', width: '10', height: '10'
                  }],
                  images: [{ image_url: '', is_primary: true }]
                }); 
                setIsModalOpen(true); 
              }} 
               style={{ backgroundColor: spotlight.brand_color || '#1b2d2a', color: isLight(spotlight.brand_color) ? '#1b2d2a' : 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: `0 4px 15px ${(spotlight.brand_color || '#1b2d2a')}30` }}
            >
              <Plus size={20} /> List New Specimen
            </button>
          )}
        </header>

        {loading ? (
          <div style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #edf2ed', borderTopColor: '#1b2d2a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
            <p style={{ fontFamily: 'serif', color: '#64748b' }}>Revealing your sanctuary...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
             <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '2rem' }} />
             <h2 style={{ fontFamily: 'serif', marginBottom: '1rem' }}>Vault Connection Interrupted</h2>
             <p style={{ color: '#64748b', marginBottom: '3rem' }}>{error}</p>
             <button onClick={fetchData} className="btn btn-primary" style={{ padding: '1rem 3rem' }}>Try Reconnecting</button>
          </div>
        ) : (
          <div>
            {activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
              >
                {/* Hero Banner Section */}
                <div style={{ 
                  width: '100%', 
                  height: '200px', 
                  borderRadius: '32px', 
                  overflow: 'hidden', 
                  position: 'relative',
                  marginBottom: '1rem',
                  backgroundColor: spotlight.brand_color || '#1b2d2a',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}>
                  {spotlight.banner_url ? (
                    <img src={spotlight.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Leaf size={60} color="rgba(255,255,255,0.2)" />
                    </div>
                  )}
                  <div style={{ 
                    position: 'absolute', inset: 0, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                    display: 'flex', alignItems: 'flex-end', padding: '2rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ 
                        width: '80px', height: '80px', backgroundColor: 'white', borderRadius: '20px', 
                        padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                      }}>
                        {spotlight.logo_url ? (
                          <img src={spotlight.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }} />
                        ) : (
                          <Leaf size={40} color={spotlight.brand_color || '#1b2d2a'} />
                        )}
                      </div>
                      <div style={{ color: 'white' }}>
                        <h2 style={{ fontSize: '2rem', fontFamily: 'serif', margin: 0 }}>{spotlight.store_name}</h2>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0' }}>{spotlight.expertise || 'Collector Sanctuary'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metric Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  {[
                    { label: 'Total Revenue', value: `₹${metrics?.total_revenue?.toLocaleString() || '0'}`, icon: <TrendingUp size={20} />, trend: '+12.5%', trendColor: '#10b981' },
                    { label: 'Total Sales', value: metrics?.total_items_sold || '0', icon: <ShoppingBag size={20} />, trend: '+8.2%', trendColor: '#10b981' },
                    { label: 'Avg Order Value', value: `₹${metrics?.total_orders > 0 ? Math.round(metrics.total_revenue / metrics.total_orders).toLocaleString() : '0'}`, icon: <BarChart3 size={20} />, trend: '-2.1%', trendColor: '#ef4444' },
                    { label: 'Pending Orders', value: metrics?.pending_orders || '0', icon: <Package size={20} />, subtext: 'Awaiting fulfillment' }
                  ].map((stat, idx) => (
                    <div key={idx} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #edf2ed', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: spotlight.brand_color || '#1b2d2a' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.75rem', backgroundColor: `${spotlight.brand_color}10` || '#fcfdfc', borderRadius: '12px', border: `1px solid ${spotlight.brand_color}20` || '#edf2ed', color: spotlight.brand_color || '#1b2d2a' }}>{stat.icon}</div>
                        {stat.trend && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: stat.trendColor, fontSize: '0.75rem', fontWeight: 700 }}>
                            {stat.trendColor === '#10b981' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {stat.trend}
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
                      <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'serif', marginTop: '0.5rem', color: '#1b2d2a' }}>{stat.value}</p>
                      {stat.subtext && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>{stat.subtext}</p>}
                    </div>
                  ))}
                </div>

                {/* Main Analytics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                  {/* Sales Chart */}
                  <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif' }}>Revenue Performance</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #edf2ed', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#fcfdfc' }}>Last 14 Days</button>
                      </div>
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={metrics?.sales_chart || []}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={spotlight.brand_color || '#1b2d2a'} stopOpacity={0.1}/>
                              <stop offset="95%" stopColor={spotlight.brand_color || '#1b2d2a'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '1rem' }}
                            itemStyle={{ color: '#1b2d2a', fontWeight: 700 }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke={spotlight.brand_color || '#1b2d2a'} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Inventory Health */}
                  <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #edf2ed', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '2.5rem' }}>Inventory Status</h3>
                    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ height: '240px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Healthy', value: metrics?.inventory_distribution?.healthy || 0 },
                                { name: 'Low Stock', value: metrics?.inventory_distribution?.low_stock || 0 },
                                { name: 'Out of Stock', value: metrics?.inventory_distribution?.out_of_stock || 0 }
                              ]}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#fcfdfc', borderRadius: '16px', border: '1px solid #edf2ed' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock Health Score</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>Great</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#edf2ed', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '85%', height: '100%', backgroundColor: '#10b981' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Recent Activity & Top Products */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Recent Activity */}
                  <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif' }}>Recent Activity</h3>
                      <button style={{ color: '#1b2d2a', fontSize: '0.75rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {metrics?.recent_activity?.length > 0 ? metrics.recent_activity.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fcfdfc', border: '1px solid #edf2ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingBag size={18} color="#1b2d2a" />
                          </div>
                          <div style={{ flexGrow: 1 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>New sale: {item.product__name}</p>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Order {item.order__order_number} • {new Date(item.order__created_at).toLocaleDateString()}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>+{item.quantity}</span>
                          </div>
                        </div>
                      )) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No recent activity to report.</p>
                      )}
                    </div>
                  </div>

                  {/* Top Products */}
                  <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif' }}>Star Specimens</h3>
                      <button style={{ color: '#1b2d2a', fontSize: '0.75rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Analytics</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {metrics?.top_products?.length > 0 ? metrics.top_products.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#1b2d2a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>#{idx+1}</div>
                          <div style={{ flexGrow: 1 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.product__name}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.total_qty} sales</span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>₹{p.total_rev?.toLocaleString()} revenue</span>
                            </div>
                          </div>
                          <ChevronRight size={16} color="#cbd5e1" />
                        </div>
                      )) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Awaiting your first star specimen.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'spotlight' && (
              <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #edf2ed', padding: '4rem', maxWidth: '1000px' }}>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                  
                  {/* Theme Section */}
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Palette size={20} color={spotlight.brand_color || '#E5C48B'} /> Studio Branding
                    </h3>

                    {/* Quick Preview Banner */}
                    <div style={{ 
                      width: '100%', 
                      height: '120px', 
                      borderRadius: '16px', 
                      backgroundColor: spotlight.brand_color || '#1b2d2a',
                      marginBottom: '2rem',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      {spotlight.banner_url && <img src={spotlight.banner_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />}
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
                        <div style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {spotlight.logo_url ? <img src={spotlight.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Leaf size={24} color={spotlight.brand_color} />}
                        </div>
                        <div style={{ marginLeft: '1rem', color: 'white' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{spotlight.store_name}</h4>
                          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>{spotlight.expertise}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.25rem' }}>Sanctuary Theme Presets</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0.75rem' }}>
                          {presets.map(p => (
                            <button 
                              key={p.color}
                              type="button"
                              onClick={() => setSpotlight(prev => ({ ...prev, brand_color: p.color }))}
                              title={p.name}
                              style={{ 
                                height: '32px', 
                                width: '32px',
                                backgroundColor: p.color, 
                                border: spotlight.brand_color === p.color ? `3px solid ${spotlight.brand_color}` : '1px solid rgba(0,0,0,0.05)',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                transform: spotlight.brand_color === p.color ? 'scale(1.1)' : 'scale(1)'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Custom Theme Color <span style={{ color: '#ef4444' }}>*</span></label>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <input type="color" value={spotlight.brand_color} onChange={e => setSpotlight({...spotlight, brand_color: e.target.value})} style={{ width: '60px', height: '60px', border: 'none', borderRadius: '12px', cursor: 'pointer' }} />
                            <input type="text" value={spotlight.brand_color} onChange={e => setSpotlight({...spotlight, brand_color: e.target.value})} style={{ flexGrow: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Logo <span style={{ color: '#ef4444' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                              <input type="file" accept="image/*" id="logo-upload" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'logo')} />
                              <label htmlFor="logo-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', border: uploading === 'logo' ? '2px solid #E5C48B' : '2px dashed #e2e8f0', borderRadius: '16px', cursor: 'pointer', backgroundColor: '#fcfdfc', transition: 'all 0.3s' }}>
                                {uploading === 'logo' ? <Loader2 className="animate-spin" color="#E5C48B" /> : (spotlight.logo_url ? <CheckCircle2 color="#10b981" /> : <Upload size={24} color="#94a3b8" />)}
                                <span style={{ fontSize: '0.75rem', marginTop: '0.75rem', fontWeight: 600, color: spotlight.logo_url ? '#10b981' : '#94a3b8' }}>
                                  {uploading === 'logo' ? 'Uploading...' : (spotlight.logoName || 'Select Logo')}
                                </span>
                                {spotlight.logo_url && <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, marginTop: '0.25rem' }}>SUCCESSFULLY SECURED</span>}
                              </label>
                            </div>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Banner</label>
                            <div style={{ position: 'relative' }}>
                              <input type="file" accept="image/*" id="banner-upload" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'banner')} />
                              <label htmlFor="banner-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', border: uploading === 'banner' ? '2px solid #E5C48B' : '2px dashed #e2e8f0', borderRadius: '16px', cursor: 'pointer', backgroundColor: '#fcfdfc', transition: 'all 0.3s' }}>
                                {uploading === 'banner' ? <Loader2 className="animate-spin" color="#E5C48B" /> : (spotlight.banner_url ? <CheckCircle2 color="#10b981" /> : <Upload size={24} color="#94a3b8" />)}
                                <span style={{ fontSize: '0.75rem', marginTop: '0.75rem', fontWeight: 600, color: spotlight.banner_url ? '#10b981' : '#94a3b8' }}>
                                  {uploading === 'banner' ? 'Uploading...' : (spotlight.bannerName || 'Select Banner')}
                                </span>
                                {spotlight.banner_url && <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, marginTop: '0.25rem' }}>SUCCESSFULLY SECURED</span>}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Identity Section */}
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Store size={20} color={spotlight.brand_color || '#E5C48B'} /> Identity Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: fieldErrors.store_name ? '#ef4444' : 'inherit' }}>Studio Name <span style={{ color: '#ef4444' }}>*</span> {fieldErrors.store_name && `— ${fieldErrors.store_name}`}</label>
                          <input value={spotlight.store_name} onChange={e => { setSpotlight({...spotlight, store_name: e.target.value}); setFieldErrors({...fieldErrors, store_name: null}); }} className={fieldErrors.store_name ? 'form-error-input' : ''} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Signature Tagline</label>
                          <input value={spotlight.expertise} onChange={e => setSpotlight({...spotlight, expertise: e.target.value})} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Botanical Mandate / Bio <span style={{ color: '#ef4444' }}>*</span></label>
                        <textarea rows="5" value={spotlight.bio} onChange={e => setSpotlight({...spotlight, bio: e.target.value})} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }} />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={savingProfile} style={{ backgroundColor: spotlight.brand_color, color: 'white', border: 'none', padding: '1.25rem 3rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', alignSelf: 'flex-start', transition: 'background-color 0.3s' }}>
                    {savingProfile ? 'SYNCING...' : <><Save size={20} /> SAVE STUDIO IDENTITY</>}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'products' && (
              <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #edf2ed', overflow: 'hidden' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#fcfdfc', textAlign: 'left' }}>
                       <tr>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem' }}>SPECIMEN</th>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem' }}>SELLER PAYOUT</th>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem' }}>BUYER PRICE</th>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem' }}>STOCK</th>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', textAlign: 'right' }}>ACTIONS</th>
                       </tr>
                    </thead>
                    <tbody>
                       {products.map(p => (
                         <tr key={p.id} style={{ borderBottom: '1px solid #edf2ed' }}>
                            <td style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                               <img src={p.image_url || p.image} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                               <span style={{ fontWeight: 700 }}>{p.name || p.title}</span>
                            </td>
                            <td style={{ padding: '1.5rem 2rem', fontWeight: 700, color: '#10b981' }}>₹{p.base_price}</td>
                            <td style={{ padding: '1.5rem 2rem', fontWeight: 700 }}>₹{p.price}</td>
                            <td style={{ padding: '1.5rem 2rem', fontWeight: 700 }}>{p.stock}</td>
                            <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                               <button onClick={() => handleEditProduct(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Pencil size={18} /></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            )}

            {activeTab === 'orders' && (
              <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #edf2ed', overflow: 'hidden' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#fcfdfc', textAlign: 'left' }}>
                       <tr>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Order</th>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Status</th>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Items</th>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Amount</th>
                          <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Destination</th>
                           <th style={{ padding: '1.5rem 2rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Logistics</th>
                       </tr>
                    </thead>
                    <tbody>
                       {orders.length > 0 ? orders.map(o => (
                         <tr key={o.id} style={{ borderBottom: '1px solid #edf2ed' }}>
                            <td style={{ padding: '1.5rem 2rem' }}>
                               <p style={{ fontWeight: 700, margin: 0 }}>{o.order_number}</p>
                               <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>{new Date(o.created_at).toLocaleDateString()}</p>
                            </td>
                            <td style={{ padding: '1.5rem 2rem' }}>
                               <span style={{ 
                                 padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                                 backgroundColor: o.status === 'placed' ? '#e0f2fe' : o.status === 'shipped' ? '#fef3c7' : '#f3f4f6',
                                 color: o.status === 'placed' ? '#0369a1' : o.status === 'shipped' ? '#92400e' : '#4b5563'
                               }}>
                                 {o.status}
                               </span>
                            </td>
                            <td style={{ padding: '1.5rem 2rem', fontWeight: 700 }}>
                               {o.items?.filter(i => i.seller?.id === user.id).length} Specimens
                            </td>
                            <td style={{ padding: '1.5rem 2rem', fontWeight: 700 }}>
                               ₹{o.items?.filter(i => i.seller?.id === user.id).reduce((acc, i) => acc + (parseFloat(i.unit_price) * i.quantity), 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '1.5rem 2rem', color: '#64748b', fontSize: '0.85rem' }}>
                               {o.shipping_address?.city || 'Local Pickup'}
                             </td>
                             <td style={{ padding: '1.5rem 2rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                   {o.status === 'placed' && !o.shipments?.some(s => s.seller === user.id) && (
                                     <button 
                                       onClick={() => handleCreateShipment(o.id)}
                                       style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#1b2d2a', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                     >
                                       Ship Now
                                     </button>
                                   )}
                                   {o.shipments?.find(s => s.seller === user.id)?.label_url && (
                                     <a 
                                       href={o.shipments.find(s => s.seller === user.id).label_url} 
                                       target="_blank" 
                                       rel="noreferrer"
                                       style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #edf2ed', color: '#1b2d2a', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 700 }}
                                     >
                                       <Download size={14} /> Label
                                     </a>
                                   )}
                                   {o.shipments?.find(s => s.seller === user.id) && !o.shipments?.find(s => s.seller === user.id)?.label_url && (
                                     <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>In Transit...</span>
                                   )}
                                </div>
                            </td>
                         </tr>
                       )) : (
                         <tr>
                           <td colSpan="5" style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
                             <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                             <p>No fulfillments pending in your sanctuary.</p>
                           </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #edf2ed', padding: '4rem', maxWidth: '800px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <div>
                       <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '2rem' }}>Account Configuration</h3>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div>
                             <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Email Address</label>
                             <input disabled value={user.email} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fcfdfc', color: '#94a3b8' }} />
                          </div>
                          <div>
                             <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Phone Number</label>
                             <input value={user.phone || ''} disabled style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fcfdfc', color: '#94a3b8' }} />
                          </div>
                       </div>
                    </div>
                    
                    <div style={{ borderTop: '1px solid #edf2ed', paddingTop: '3rem' }}>
                       <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '1rem', color: '#ef4444' }}>Danger Zone</h3>
                       <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' }}>Permanently deactivate your grower status and archive all listings.</p>
                       <button style={{ backgroundColor: 'white', color: '#ef4444', border: '1px solid #fee2e2', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                          Deactivate Sanctuary
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Product Drawer (Slide-over) */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100vh', 
                backgroundColor: 'white', 
                display: 'flex',
                flexDirection: 'column',
                zIndex: 2001
              }}
            >
              {/* Full-Screen Header */}
              <div style={{ padding: '2rem 5rem', borderBottom: '1px solid #edf2ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fcfdfc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b2d2a', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    <ArrowLeft size={20} /> EXIT TO DASHBOARD
                  </button>
                  <div style={{ width: '1px', height: '24px', backgroundColor: '#edf2ed' }} />
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif' }}>{editingProduct ? 'Refine Specimen' : 'Onboard New Specimen'}</h2>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {editingProduct && (
                    <button 
                      onClick={handleArchiveProduct}
                      disabled={saving}
                      style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #fee2e2', backgroundColor: 'white', color: '#ef4444', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Trash2 size={18} /> ARCHIVE
                    </button>
                  )}
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                  >
                    CLOSE
                  </button>
                  {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                    <button 
                      onClick={fillDummyData}
                      style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #1b2d2a', backgroundColor: '#1b2d2a', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      AUTO-FILL (DEV)
                    </button>
                  )}
                </div>
              </div>

              {/* Full-Screen Content (Centered) */}
              <div id="specimen-modal-content" style={{ flexGrow: 1, overflowY: 'auto', backgroundColor: '#f8faf9' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '5rem 2rem' }}>
                  {formError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '1.5rem', borderRadius: '16px', marginBottom: '3rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AlertCircle size={20} /> {formError}
                    </motion.div>
                  )}
                  {success && !isModalOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '1.5rem', borderRadius: '16px', marginBottom: '3rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle2 size={20} /> {success}
                    </motion.div>
                  )}
                  <form id="product-form" onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                     {/* Section 1: Basic Identity */}
                     {/* Section 1: Specimen Identity (Merged & Dense) */}
                    <div style={{ backgroundColor: 'white', padding: '3.5rem', borderRadius: '32px', border: '1px solid #edf2ed', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1b2d2a', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                          <Leaf size={18} color="#10b981" /> Specimen Identity
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1.25rem', backgroundColor: '#f8faf9', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                          <input type="checkbox" checked={newProduct.is_rare} onChange={e => setNewProduct({...newProduct, is_rare: e.target.checked})} id="is_rare_top" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                          <label htmlFor="is_rare_top" style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1b2d2a', cursor: 'pointer', textTransform: 'uppercase' }}>Rare / Collector</label>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem' }}>
                        {/* Primary Information */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: fieldErrors.name ? '#ef4444' : '#64748b', letterSpacing: '0.05em' }}>Specimen Name <span style={{ color: '#ef4444' }}>*</span> {fieldErrors.name && `— ${fieldErrors.name}`}</label>
                              <input value={newProduct.name} onChange={e => { setNewProduct({...newProduct, name: e.target.value}); setFieldErrors({...fieldErrors, name: null}); }} placeholder="e.g. Alocasia Azlanii" className={fieldErrors.name ? 'form-error-input' : ''} style={{ width: '100%', padding: '1.125rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '1.125rem', fontWeight: 500 }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: '#64748b', letterSpacing: '0.05em' }}>Scientific Name</label>
                              <input value={newProduct.scientific_name} onChange={e => setNewProduct({...newProduct, scientific_name: e.target.value})} placeholder="e.g. Alocasia azlanii" style={{ width: '100%', padding: '1.125rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontStyle: 'italic', fontSize: '1.125rem' }} />
                            </div>
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: '#64748b', letterSpacing: '0.05em' }}>Short Summary / Tagline</label>
                            <input value={newProduct.tagline} onChange={e => setNewProduct({...newProduct, tagline: e.target.value})} placeholder="e.g. Rare jewel alocasia with deep metallic purple leaves" style={{ width: '100%', padding: '1.125rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '1rem' }} />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: fieldErrors.category_id ? '#ef4444' : '#64748b', letterSpacing: '0.05em' }}>Marketplace Category <span style={{ color: '#ef4444' }}>*</span> {fieldErrors.category_id && `— ${fieldErrors.category_id}`}</label>
                              <select value={newProduct.category_id} onChange={e => { 
                                const catId = e.target.value;
                                const selectedCat = categories.find(c => String(c.id) === String(catId));
                                const commRate = selectedCat ? selectedCat.commission_rate : '20.0';
                                const gstRate = selectedCat ? selectedCat.gst_percentage : '0';
                                
                                const updatedVariants = newProduct.variants.map(v => ({
                                  ...v,
                                  commission_rate: commRate,
                                  gst_rate: gstRate || v.gst_rate
                                }));

                                setNewProduct({
                                  ...newProduct, 
                                  category_id: catId,
                                  sub_category_id: '', // Reset subcategory when category changes
                                  variants: updatedVariants
                                }); 
                                setFieldErrors({...fieldErrors, category_id: null}); 
                              }} className={fieldErrors.category_id ? 'form-error-input' : ''} style={{ width: '100%', padding: '1.125rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '1rem' }}>
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>

                            {newProduct.category_id && (
                              <div className="fade-in">
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: '#64748b', letterSpacing: '0.05em' }}>Sub Category</label>
                                <select 
                                  value={newProduct.sub_category_id} 
                                  onChange={e => setNewProduct({...newProduct, sub_category_id: e.target.value})}
                                  style={{ width: '100%', padding: '1.125rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '1rem' }}
                                >
                                  <option value="">Select Sub Category (Optional)</option>
                                  {categories.find(c => String(c.id) === String(newProduct.category_id))?.subcategories?.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div>
                              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: '#64748b', letterSpacing: '0.05em' }}>Region of Origin</label>
                              <input value={newProduct.origin} onChange={e => setNewProduct({...newProduct, origin: e.target.value})} placeholder="e.g. Southeast Asia" style={{ width: '100%', padding: '1.125rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '1rem' }} />
                            </div>
                          </div>
                        </div>

                        {/* Botanical Mandate Sidebar */}
                        <div style={{ padding: '2.5rem', backgroundColor: '#fcfdfc', borderRadius: '24px', border: '1px solid #edf2ed', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', color: '#1b2d2a', letterSpacing: '0.05em' }}>Botanical Mandate</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Care Level</label>
                                <select value={newProduct.care_level} onChange={e => setNewProduct({...newProduct, care_level: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', backgroundColor: 'white' }}>
                                  <option>Easy</option>
                                  <option>Medium</option>
                                  <option>Advanced</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Light Intensity</label>
                                <select value={newProduct.light_requirements} onChange={e => setNewProduct({...newProduct, light_requirements: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', backgroundColor: 'white' }}>
                                  <option>Low</option>
                                  <option>Medium</option>
                                  <option>High</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Growth Rate</label>
                                <select value={newProduct.growth_rate} onChange={e => setNewProduct({...newProduct, growth_rate: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', backgroundColor: 'white' }}>
                                  <option>Slow</option>
                                  <option>Moderate</option>
                                  <option>Fast</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Variant Options */}
                    <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #edf2ed', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', color: '#1b2d2a', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                          <Box size={18} color="#10b981" /> Inventory Variants
                        </h4>
                        <button 
                          type="button" 
                          onClick={() => setNewProduct(prev => ({ ...prev, variants: [...prev.variants, { name: '', base_price: '', gst_rate: '0', commission_rate: '10.0', price: '', stock: '', weight: '0.5', length: '10', width: '10', height: '10' }] }))}
                          style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#fcfdfc', border: '1px solid #edf2ed', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1b2d2a' }}
                        >
                          <Plus size={16} /> ADD VARIATION
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {newProduct.variants.map((v, idx) => (
                          <div key={idx} style={{ padding: '2.5rem', backgroundColor: '#fcfdfc', borderRadius: '24px', border: '1px solid #edf2ed', position: 'relative' }}>
                            {newProduct.variants.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => setNewProduct(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))}
                                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', fontWeight: 900 }}
                              >
                                <X size={14} /> REMOVE
                              </button>
                            )}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.75rem', color: fieldErrors[`variant_${idx}_name`] ? '#ef4444' : '#64748b' }}>Variant Name <span style={{ color: '#ef4444' }}>*</span> {fieldErrors[`variant_${idx}_name`] && `— ${fieldErrors[`variant_${idx}_name`]}`}</label>
                                <input 
                                  value={v.name} 
                                  onChange={e => {
                                    const updated = [...newProduct.variants];
                                    updated[idx].name = e.target.value;
                                    setNewProduct({ ...newProduct, variants: updated });
                                    setFieldErrors({...fieldErrors, [`variant_${idx}_name`]: null});
                                  }} 
                                  placeholder="e.g. Small / 5cm / Submerged" 
                                  className={fieldErrors[`variant_${idx}_name`] ? 'form-error-input' : ''}
                                  style={{ width: '100%', padding: '1.1rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '1rem' }} 
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.75rem', color: fieldErrors[`variant_${idx}_stock`] ? '#ef4444' : '#64748b' }}>Current Stock <span style={{ color: '#ef4444' }}>*</span> {fieldErrors[`variant_${idx}_stock`] && `— ${fieldErrors[`variant_${idx}_stock`]}`}</label>
                                <input 
                                  type="number" 
                                  value={v.stock} 
                                  onChange={e => {
                                    const updated = [...newProduct.variants];
                                    updated[idx].stock = e.target.value;
                                    setNewProduct({ ...newProduct, variants: updated });
                                    setFieldErrors({...fieldErrors, [`variant_${idx}_stock`]: null});
                                  }} 
                                  placeholder="0" 
                                  className={fieldErrors[`variant_${idx}_stock`] ? 'form-error-input' : ''}
                                  style={{ width: '100%', padding: '1.1rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '1rem' }} 
                                />
                              </div>
                            </div>


                            <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #edf2ed', marginBottom: '2.5rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: fieldErrors[`variant_${idx}_base_price`] ? '#ef4444' : '#64748b' }}>Base Payout (₹) <span style={{ color: '#ef4444' }}>*</span> {fieldErrors[`variant_${idx}_base_price`] && `— ${fieldErrors[`variant_${idx}_base_price`]}`}</label>
                                  <input 
                                    type="number" 
                                    value={v.base_price} 
                                    onChange={e => {
                                      const updated = [...newProduct.variants];
                                      updated[idx].base_price = e.target.value;
                                      setNewProduct({ ...newProduct, variants: updated });
                                      setFieldErrors({...fieldErrors, [`variant_${idx}_base_price`]: null});
                                    }} 
                                    placeholder="0" 
                                    className={fieldErrors[`variant_${idx}_base_price`] ? 'form-error-input' : ''}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: '#64748b' }}>GST (%)</label>
                                  <select 
                                    value={v.gst_rate} 
                                    onChange={e => {
                                      const updated = [...newProduct.variants];
                                      updated[idx].gst_rate = e.target.value;
                                      setNewProduct({ ...newProduct, variants: updated });
                                    }} 
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                  >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: '#94a3b8' }}>Commission (%)</label>
                                  <input 
                                    readOnly
                                    value={v.commission_rate} 
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #edf2ed', backgroundColor: '#f8faf9', color: '#64748b', cursor: 'not-allowed' }} 
                                  />
                                  <p style={{ fontSize: '0.5rem', color: '#94a3b8', marginTop: '0.4rem', fontWeight: 600 }}>Precalculated by category</p>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px dashed #edf2ed' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1b2d2a', margin: 0 }}>Estimated Buyer Price</p>
                                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b2d2a' }}>
                                  ₹{(parseFloat(v.base_price || 0) * (1 + parseFloat(v.gst_rate || 0)/100 + parseFloat(v.commission_rate || 0)/100)).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                              {[
                                { label: 'Weight (KG)', key: 'weight', step: '0.001' },
                                { label: 'Length (CM)', key: 'length' },
                                { label: 'Width (CM)', key: 'width' },
                                { label: 'Height (CM)', key: 'height' }
                              ].map(field => (
                                <div key={field.key}>
                                  <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, marginBottom: '0.6rem', color: '#94a3b8' }}>{field.label}</label>
                                  <input 
                                    type="number" 
                                    step={field.step || '1'} 
                                    value={v[field.key]} 
                                    onChange={e => {
                                      const updated = [...newProduct.variants];
                                      updated[idx][field.key] = e.target.value;
                                      setNewProduct({ ...newProduct, variants: updated });
                                    }} 
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} 
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>


                     {/* Section 4: Imagery & Content */}
                    <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #edf2ed', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2.5rem', color: '#1b2d2a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Camera size={18} color="#10b981" /> Imagery & Content <span style={{ color: '#ef4444' }}>*</span>
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.25rem', color: fieldErrors.description ? '#ef4444' : '#64748b', letterSpacing: '0.05em' }}>Specimen Description <span style={{ color: '#ef4444' }}>*</span> {fieldErrors.description && `— ${fieldErrors.description}`}</label>
                          <textarea rows="6" value={newProduct.description} onChange={e => { setNewProduct({...newProduct, description: e.target.value}); setFieldErrors({...fieldErrors, description: null}); }} placeholder="Detail the specimen's health, coloration, and acclimation history..." className={fieldErrors.description ? 'form-error-input' : ''} style={{ width: '100%', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', resize: 'none', fontSize: '1.1rem', lineHeight: '1.7', color: '#1b2d2a' }} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: spotlight.brand_color || '#E5C48B', letterSpacing: '0.05em' }}>Visual Gallery</label>
                            <button 
                              type="button" 
                              onClick={() => setNewProduct(prev => ({ ...prev, images: [...prev.images, { image_url: '', is_primary: false }] }))}
                              style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1b2d2a', background: 'white', border: '1px solid #edf2ed', borderRadius: '10px', padding: '0.65rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              <Plus size={16} /> ADD ANOTHER IMAGE
                            </button>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {newProduct.images.map((img, idx) => (
                              <div key={idx} style={{ padding: '2rem', borderRadius: '28px', border: '1px solid #edf2ed', backgroundColor: '#fcfdfc', display: 'flex', gap: '2rem', position: 'relative', transition: 'all 0.2s' }}>
                                <div style={{ width: '140px', height: '140px', borderRadius: '20px', border: '2px dashed #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                  {img.image_url ? (
                                    <img src={img.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                      <Camera size={28} color="#cbd5e1" />
                                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8' }}>PREVIEW</span>
                                    </div>
                                  )}
                                  
                                  {uploadingImages[idx] && (
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Loader2 className="animate-spin" size={24} color="#10b981" />
                                    </div>
                                  )}
                                </div>

                                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, marginBottom: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Specimen Photograph</label>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                      <input 
                                        type="file" 
                                        id={`upload-${idx}`} 
                                        hidden 
                                        accept="image/*" 
                                        onChange={e => handleGalleryImageUpload(e, idx)} 
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => document.getElementById(`upload-${idx}`).click()}
                                        disabled={uploadingImages[idx]}
                                        style={{ flexGrow: 1, padding: '0.85rem', borderRadius: '12px', border: '1px solid #10b981', backgroundColor: '#f0fdf4', color: '#166534', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                      >
                                        <Upload size={14} /> {img.image_url ? 'REPLACE IMAGE' : 'UPLOAD PHOTO'}
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, marginBottom: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Variant Specific?</label>
                                    <select 
                                      value={img.variant_id || ''}
                                      onChange={e => {
                                        const updated = [...newProduct.images];
                                        updated[idx].variant_id = e.target.value;
                                        setNewProduct({ ...newProduct, images: updated });
                                      }}
                                      style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '0.85rem', fontWeight: 500 }}
                                    >
                                      <option value="">General Specimen Image</option>
                                      {newProduct.variants.map((v, i) => (
                                        <option key={i} value={v.id || i}>{v.name || `Variant ${i+1}`}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {newProduct.images.length > 1 && (
                                  <button 
                                    type="button"
                                    onClick={() => setNewProduct(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'white', border: '1px solid #fee2e2', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Full-Screen Footer (Sticky) */}
              <div style={{ padding: '2rem 5rem', borderTop: '1px solid #edf2ed', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: editingProduct ? '#10b981' : '#3b82f6' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                        {editingProduct ? 'SYNCING TO LIVE SANCTUARY' : 'DRAFTING NEW SPECIMEN'}
                      </span>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    style={{ padding: '1.25rem 2.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}
                  >
                    DISCARD CHANGES
                  </button>
                  
                  {!editingProduct && (
                    <button 
                      type="button" 
                      disabled={saving}
                      onClick={() => handleAddProduct(null, true)}
                      style={{ padding: '1.25rem 2.5rem', background: '#fcfdfc', border: '1px solid #1b2d2a', color: '#1b2d2a', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
                    >
                      SAVE & ADD ANOTHER
                    </button>
                  )}

                  <button 
                    type="submit" 
                    form="product-form"
                    disabled={saving}
                    style={{ padding: '1.25rem 4rem', backgroundColor: '#1b2d2a', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 30px rgba(27,45,42,0.2)', minWidth: '240px' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {saving ? 'PROCESSING...' : editingProduct ? 'SYNC UPDATES' : 'LAUNCH SPECIMEN'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDialog(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: 'relative', backgroundColor: 'white', padding: '3.5rem', borderRadius: '32px', maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
               <div style={{ width: '64px', height: '64px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#ef4444' }}>
                 <AlertCircle size={32} />
               </div>
               <h3 style={{ fontSize: '1.5rem', fontFamily: 'serif', marginBottom: '1rem' }}>{confirmDialog.title}</h3>
               <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '3rem' }}>{confirmDialog.message}</p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <button onClick={confirmDialog.onConfirm} style={{ padding: '1.25rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, cursor: 'pointer' }}>
                   {confirmDialog.confirmLabel}
                 </button>
                 <button onClick={() => setConfirmDialog(null)} style={{ padding: '1.25rem', backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 700, cursor: 'pointer' }}>
                   CANCEL
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .form-error-input { border-color: #ef4444 !important; background-color: #fef2f2 !important; }
      `}</style>
      </div>
    </DashboardErrorBoundary>
  );
}
