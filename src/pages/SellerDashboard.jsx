import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import {
  LayoutDashboard, Package, ShoppingBag, Settings, LogOut,
  TrendingUp, PackageCheck, AlertCircle, Plus, Box, X,
  Camera, CheckCircle2, Pencil, Archive, Trash2,
  ChevronRight, Menu, ExternalLink, Store, ShieldCheck,
  Save, Info, Image as ImageIcon, Palette, Upload, Loader2,
  Leaf, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, ArrowLeft, Download, ChevronDown, ChevronUp, FileText, Calendar, IndianRupee,
  Truck, CheckSquare, Square, ImagePlus, Eye
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import NaturalLogo from '../components/NaturalLogo';
import ItemizedInvoiceModal from '../components/ItemizedInvoiceModal';
import { ProductService } from '../services/ProductService';
import { OrderService } from '../services/OrderService';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

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
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('sellerActiveTab') || 'dashboard';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('sellerActiveTab', tabId);
  };
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '', scientific_name: '', category_id: '', sub_category_id: '', tagline: '', origin: '', description: '',
    care_level: 'Easy', care_level_max: 'Easy',
    light_requirements: 'Low', light_requirements_max: 'Medium',
    growth_rate: 'Moderate', growth_rate_max: 'Moderate',
    is_rare: false,
    variants: [{
      name: '', variant_type: 'Plant', base_price: '', gst_rate: '0',
      commission_rate: '10.0', price: '', stock: '',
      item_category: 'light', packed_weight_grams: '', length: '10', width: '10', height: '10'
    }],
    images: [{ image_url: '', is_primary: true }]
  });
  const [uploadingImages, setUploadingImages] = useState({});
  const [inlineStocks, setInlineStocks] = useState({});

  // GST State
  const [gstData, setGstData] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState(null);
  const [selectedGstMonth, setSelectedGstMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showItemizedInvoice, setShowItemizedInvoice] = useState(false);

  const handleGenerateGst = async () => {
    setGstLoading(true);
    setGstError(null);
    try {
      const response = await api.get(`/analytics/seller/gst-invoice/?month=${selectedGstMonth}`);
      setGstData(response.data.data);
    } catch (err) {
      setGstError(err.response?.data?.error || err.message);
    } finally {
      setGstLoading(false);
    }
  };

  useEffect(() => {
    const updatedVariants = newProduct.variants.map(v => {
      const base = parseFloat(v.base_price) || 0;
      // Seller price is GST-inclusive. Junglyst adds 10% commission on top.
      const comm = 10.0;
      const finalPrice = (base * (1 + comm / 100)).toFixed(2);

      if (v.price !== finalPrice) {
        return { ...v, price: finalPrice, gst_rate: '0', commission_rate: String(comm) };
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
    icon_url: '',
    banner_url: '',
    brand_color: '#0A3029',
    location_city: 'Karnataka, India'
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Account configuration state
  const [accountForm, setAccountForm] = useState({ email: '', phone: '' });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(null);
  const [accountError, setAccountError] = useState(null);

  // Payout / bank details state
  const [bankForm, setBankForm] = useState({ payout_type: 'upi', payout_account: '', ifsc_code: '', account_holder_name: '' });
  const [bankMasked, setBankMasked] = useState({ payout_account_masked: '', ifsc_code_masked: '', has_bank_details: false });
  const [bankEditing, setBankEditing] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSuccess, setBankSuccess] = useState(null);
  const [bankError, setBankError] = useState(null);
  const [metrics, setMetrics] = useState({
    total_revenue: 0,
    total_orders: 0,
    pending_orders: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    low_stock_variants: 0
  });

  const [uploading, setUploading] = useState(null);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(10);
  const [productTotal, setProductTotal] = useState(0);

  // Product status tabs & bulk selection
  const [productStatusTab, setProductStatusTab] = useState('published'); // 'published' | 'drafts' | 'archived'
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkActing, setBulkActing] = useState(false);

  // Fulfillment state
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [bulkShipping, setBulkShipping] = useState(false);
  const [packageUploading, setPackageUploading] = useState({});
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'shipped' | 'delivered'

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
    if (user) {
      fetchData();
      setAccountForm({ email: user.email || '', phone: user.phone || '' });
    }
    const handleResize = () => {
      setIsMobileView(prevMobile => {
        const wide = window.innerWidth > 1024;
        const newMobile = !wide;
        if (prevMobile !== newMobile) {
          // Only force the sidebar state when crossing the 1024px boundary
          setIsSidebarOpen(wide);
        }
        return newMobile;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user]);

  useEffect(() => {
    api.get('/core/categories/').then(res => {
      const cats = res.data?.results || res.data || [];
      setCategories(cats);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (success || formError) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setFormError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, formError]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch all seller products (all statuses) — backend filters nothing when seller= is passed without is_active
      const prodsData = await ProductService.getProducts({
        seller: user.id,
        page: productPage,
        page_size: productPageSize,
        no_pagination: undefined,
      });
      if (prodsData && typeof prodsData === 'object' && 'results' in prodsData) {
        setProducts(prodsData.results || []);
        setProductTotal(prodsData.count || 0);
      } else {
        const prodsArray = Array.isArray(prodsData) ? prodsData : [];
        setProducts(prodsArray);
        setProductTotal(prodsArray.length);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'products') {
      fetchProducts();
    }
  }, [user, productPage, productPageSize, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Products are loaded by their own useEffect (keyed on productPage/productPageSize/activeTab).
      // fetchData only fetches the non-product data to avoid duplicate product API calls.
      if (activeTab !== 'products') {
        const prodsData = await ProductService.getProducts({ seller: user.id, page: 1, page_size: 10 });
        if (prodsData && typeof prodsData === 'object' && 'results' in prodsData) {
          setProducts(prodsData.results || []);
          setProductTotal(prodsData.count || 0);
        } else {
          const prodsArray = Array.isArray(prodsData) ? prodsData : [];
          setProducts(prodsArray);
          setProductTotal(prodsArray.length);
        }
      }

      // ── Background path: orders, profile metrics, categories (lazy) ──
      const [ordsData, profileData, catsData, bankData] = await Promise.all([
        api.get('/orders/seller/sub-orders/?no_pagination=true').catch(err => {
          console.error("Failed to fetch seller sub-orders:", err);
          return { data: [] };
        }),
        api.get('/sellers/dashboard/').catch(() => ({ data: null })),
        categories.length === 0
          ? api.get('/core/categories/').catch(() => ({ data: { results: [] } }))
          : Promise.resolve({ data: { results: categories } }),  // use cached
        api.get('/sellers/bank-details/').catch(() => ({ data: null })),
      ]);

      const ordsArray = Array.isArray(ordsData.data?.results) ? ordsData.data.results : (Array.isArray(ordsData.data) ? ordsData.data : []);
      setOrders(ordsArray);

      if (categories.length === 0) {
        const catsArray = Array.isArray(catsData.data?.results) ? catsData.data.results : (Array.isArray(catsData.data) ? catsData.data : []);
        setCategories(catsArray);
      }

      if (profileData?.data) {
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

      if (bankData?.data) {
        const bd = bankData.data;
        setBankForm(prev => ({ ...prev, payout_type: bd.payout_type || 'upi', account_holder_name: bd.account_holder_name || '' }));
        setBankMasked({ payout_account_masked: bd.payout_account_masked || '', ifsc_code_masked: bd.ifsc_code_masked || '', has_bank_details: bd.has_bank_details || false });
      }
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
      setError("The botanical archives are currently inaccessible. Please refresh or check your sanctuary credentials.");
    } finally {
      setLoading(false);
    }
  };


  const handleAccountSave = async (e) => {
    e.preventDefault();
    setAccountSaving(true);
    setAccountError(null);
    setAccountSuccess(null);
    try {
      await api.patch('/core/me/', { email: accountForm.email.trim(), phone: accountForm.phone.trim() || null });
      setAccountSuccess('Account details updated successfully.');
      setTimeout(() => setAccountSuccess(null), 4000);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.email?.[0] || data?.phone?.[0] || data?.detail || 'Failed to update account details.';
      setAccountError(msg);
    } finally {
      setAccountSaving(false);
    }
  };

  const handleBankSave = async (e) => {
    e.preventDefault();
    setBankSaving(true);
    setBankError(null);
    setBankSuccess(null);
    try {
      const res = await api.post('/sellers/bank-details/', bankForm);
      setBankMasked({ payout_account_masked: res.data.payout_account_masked, ifsc_code_masked: res.data.ifsc_code_masked, has_bank_details: true });
      setBankForm(prev => ({ ...prev, payout_account: '', ifsc_code: '' }));
      setBankEditing(false);
      setBankSuccess('Payout details saved securely.');
      setTimeout(() => setBankSuccess(null), 4000);
    } catch (err) {
      setBankError(err.response?.data?.error || 'Failed to save payout details. Please try again.');
    } finally {
      setBankSaving(false);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset target value so selecting the same file again triggers onChange
    e.target.value = '';

    const nameKey = { logo: 'logoName', icon: 'iconName', banner: 'bannerName' }[type] || 'logoName';
    const urlKey = { logo: 'logo_url', icon: 'icon_url', banner: 'banner_url' }[type] || 'logo_url';
    setSpotlight(prev => ({ ...prev, [nameKey]: file.name }));
    setUploading(type);
    try {
      const url = await ProductService.uploadImage(file, type);
      setSpotlight(prev => ({ ...prev, [urlKey]: url }));
    } catch (error) {
      setFormError("Failed to upload image. Please check your connection.");
      setSpotlight(prev => ({ ...prev, [nameKey]: '' }));
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

  const handleBulkStockUpdate = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(inlineStocks).map(([productId, newStock]) => {
        const product = products.find(p => p.id === productId);
        if (!product || !product.variants || !product.variants.length) return Promise.resolve();
        const variantId = product.variants[0].id;
        return ProductService.patchProduct(productId, {
          variants: [{ id: variantId, stock: parseInt(newStock) || 0 }]
        });
      });
      await Promise.all(promises);
      setSuccess("Stock quantities updated successfully");
      setInlineStocks({});
      fetchData();
    } catch (err) {
      setFormError("Failed to update some stocks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e, addAnother = false, isDraft = false) => {
    if (e) e.preventDefault();

    // Client-side Validation — skip strict validation for drafts
    const errors = {};
    if (!newProduct.name?.trim()) errors.name = "Specimen name is required";
    else if (newProduct.name.trim().length < 2) errors.name = "Must be at least 2 characters";
    else if (newProduct.name.trim().length > 200) errors.name = "Must be under 200 characters";

    if (newProduct.tagline && newProduct.tagline.length > 200) errors.tagline = "Max 200 characters";

    if (!isDraft) {
      if (!newProduct.category_id) errors.category_id = "Please select a category";
      if (!newProduct.description?.trim()) errors.description = "Botanical description is required";
      else if (newProduct.description.trim().length < 20) errors.description = "Must be at least 20 characters";

      newProduct.variants.forEach((v, idx) => {
        const price = parseFloat(v.base_price);
        if (!v.base_price && v.base_price !== 0) errors[`variant_${idx}_base_price`] = "Price required";
        else if (isNaN(price) || price <= 0) errors[`variant_${idx}_base_price`] = "Must be a positive number";
        else if (price > 1000000) errors[`variant_${idx}_base_price`] = "Price seems too high";

        const stock = parseInt(v.stock);
        if (v.stock === '' || v.stock === undefined || v.stock === null) errors[`variant_${idx}_stock`] = "Stock required";
        else if (isNaN(stock) || stock < 0) errors[`variant_${idx}_stock`] = "Must be 0 or more";
        else if (!Number.isInteger(Number(v.stock))) errors[`variant_${idx}_stock`] = "Must be a whole number";

        if (!v.packed_weight_grams) errors[`variant_${idx}_packed_weight_grams`] = "Packed weight required";
        else if (parseInt(v.packed_weight_grams) < 1 || parseInt(v.packed_weight_grams) > 30000) errors[`variant_${idx}_packed_weight_grams`] = "Must be 1–30,000g";

        const dims = ['length', 'width', 'height'];
        dims.forEach(dim => {
          const val = parseFloat(v[dim]);
          if (!v[dim]) errors[`variant_${idx}_${dim}`] = "Required";
          else if (isNaN(val) || val <= 0) errors[`variant_${idx}_${dim}`] = "Must be > 0";
        });
      });

      if (newProduct.images.every(img => !img.image_url?.trim())) {
        errors.images = "At least one product image is required";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please correct the highlighted botanical errors.");
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const payload = { ...newProduct };

      // Draft flag — only set on create. Editing preserves existing draft/published state.
      if (!editingProduct) {
        payload.is_draft = isDraft;
        if (isDraft) payload.is_active = false;
      }

      // Merge botanical range fields into single string, e.g. "Easy to Medium" or "Easy"
      const mergeRange = (min, max) => (min === max || !max) ? min : `${min} to ${max}`;
      payload.care_level = mergeRange(payload.care_level, payload.care_level_max);
      payload.light_requirements = mergeRange(payload.light_requirements, payload.light_requirements_max);
      payload.growth_rate = mergeRange(payload.growth_rate, payload.growth_rate_max);
      // Strip UI-only range fields before sending to backend
      delete payload.care_level_max;
      delete payload.light_requirements_max;
      delete payload.growth_rate_max;

      // Auto-build variant name from type + optional label (e.g. "Rhizome — Small")
      payload.variants = payload.variants
        .filter(v => v.base_price !== '' && v.stock !== '')
        .map(v => ({
          ...v,
          name: v.name?.trim()
            ? `${v.variant_type} — ${v.name.trim()}`
            : v.variant_type,
        }));
      payload.images = payload.images.filter(img => img.image_url.trim() !== '');

      if (editingProduct) await ProductService.updateProduct(editingProduct.id, payload);
      else await ProductService.createProduct(payload);

      setSuccess(isDraft ? "Draft saved — complete it anytime from your Collection" : (editingProduct ? "Specimen updated successfully" : "New specimen listed successfully"));

      if (addAnother) {
        setNewProduct({
          name: '', scientific_name: '', category_id: '', sub_category_id: '', tagline: '', origin: '', description: '',
          care_level: 'Easy', care_level_max: 'Easy',
          light_requirements: 'Low', light_requirements_max: 'Medium',
          growth_rate: 'Moderate', growth_rate_max: 'Moderate',
          is_rare: false,
          variants: [{
            name: '', variant_type: 'Plant', base_price: '', gst_rate: '0',
            commission_rate: '10.0', stock: '',
            item_category: 'light', packed_weight_grams: '', length: '10', width: '10', height: '10'
          }],
          images: [{ image_url: '', is_primary: true }]
        });
        const scrollContainer = document.getElementById('specimen-modal-content');
        if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setIsModalOpen(false);
        setEditingProduct(null);
        setActiveTab('products');
        setProductStatusTab(isDraft ? 'drafts' : 'published');
        await fetchData();   // refresh product list with updated data
      }
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
      care_level: 'Easy', care_level_max: 'Medium',
      light_requirements: 'Low', light_requirements_max: 'Medium',
      growth_rate: 'Moderate', growth_rate_max: 'Moderate',
      is_rare: Math.random() > 0.7,
      variants: [{
        name: 'Standard',
        variant_type: 'Pot',
        base_price: '1200',
        gst_rate: '0',
        commission_rate: '10.0',
        stock: '15',
        item_category: 'light',
        packed_weight_grams: '800',
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
          await ProductService.patchProduct(editingProduct.id, { is_active: false });
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

  const handleBulkProductAction = async (action) => {
    const ids = [...selectedProducts];
    if (!ids.length) return;
    setBulkActing(true);
    try {
      await api.post('/core/products/bulk-action/', { action, ids });
      const labels = { publish: 'published', archive: 'archived', unarchive: 'restored', delete: 'deleted' };
      setSuccess(`${ids.length} specimen${ids.length > 1 ? 's' : ''} ${labels[action]} successfully`);
      setSelectedProducts(new Set());
      if (action === 'publish') setProductStatusTab('published');
      else if (action === 'archive') setProductStatusTab('archived');
      await fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Bulk action failed');
    } finally {
      setBulkActing(false);
    }
  };

  const handleUnarchiveProduct = async () => {
    if (!editingProduct) return;

    setConfirmDialog({
      title: "Unarchive Specimen",
      message: "Restore this specimen to the sanctuary? It will become visible to buyers again.",
      confirmLabel: "RESTORE SPECIMEN",
      onConfirm: async () => {
        setSaving(true);
        try {
          await ProductService.patchProduct(editingProduct.id, { is_active: true });
          setSuccess("Specimen restored and now visible to buyers");
          setIsModalOpen(false);
          setEditingProduct(null);
          setActiveTab('products');
          fetchData();
        } catch (error) {
          setFormError("Failed to restore specimen");
        } finally {
          setSaving(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const [shipmentDims, setShipmentDims] = useState({});  // { [subOrderId]: { weight, length, breadth, height } }
  const [dimsSubmitting, setDimsSubmitting] = useState({});

  const handleSaveShipmentDetails = async (subOrderId) => {
    const dims = shipmentDims[subOrderId] || {};
    if (!dims.weight || !dims.length || !dims.breadth || !dims.height) {
      setFormError('Please fill in all shipment fields: weight, length, breadth, and height.');
      return;
    }
    setDimsSubmitting(prev => ({ ...prev, [subOrderId]: true }));
    try {
      const res = await api.patch(`/orders/seller/sub-orders/${subOrderId}/shipment-details/`, {
        actual_weight_grams: parseInt(dims.weight),
        actual_length_cm: parseInt(dims.length),
        actual_breadth_cm: parseInt(dims.breadth),
        actual_height_cm: parseInt(dims.height),
      });
      setOrders(prev => prev.map(o => o.id === subOrderId ? res.data : o));
      setSuccess('Shipment details saved.');
    } catch (e) {
      const errs = e.response?.data;
      if (errs && typeof errs === 'object') {
        setFormError(Object.values(errs).flat().join(' '));
      } else {
        setFormError('Failed to save shipment details.');
      }
    } finally {
      setDimsSubmitting(prev => ({ ...prev, [subOrderId]: false }));
    }
  };

  const handleConfirmSubOrder = async (subOrderId) => {
    try {
      const res = await api.post(`/orders/seller/sub-orders/${subOrderId}/confirm/`);
      setOrders(prev => prev.map(o => o.id === subOrderId ? res.data : o));
      setSuccess('Order confirmed — 48h dispatch clock started.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to confirm order.');
    }
  };

  const handleShipNow = async (subOrderIds) => {
    if (!subOrderIds || subOrderIds.length === 0) return;
    setBulkShipping(true);
    setFormError('');
    setSuccess('');
    let successCount = 0;
    const errorMessages = [];
    for (const id of subOrderIds) {
      try {
        const res = await api.post(`/orders/seller/sub-orders/${id}/ship/`);
        setOrders(prev => prev.map(o => o.id === id ? res.data : o));
        successCount++;
      } catch (err) {
        const msg = err.response?.data?.error || 'Shipment initiation failed.';
        errorMessages.push(msg);
      }
    }
    setBulkShipping(false);
    setSelectedOrders(new Set());
    if (successCount > 0) setSuccess(`${successCount} shipment${successCount > 1 ? 's' : ''} initiated — labels will be ready shortly.`);
    if (errorMessages.length > 0) setFormError(errorMessages.join(' | '));
  };

  const handlePackageImageUpload = async (subOrderId, file) => {
    if (!file) return;
    setPackageUploading(prev => ({ ...prev, [subOrderId]: true }));
    try {
      const imageUrl = await ProductService.uploadImage(file, 'package');
      const res = await api.post(`/orders/seller/sub-orders/${subOrderId}/upload-photo/`, { photo_url: imageUrl });
      setOrders(prev => prev.map(o =>
        o.id === subOrderId ? { ...o, packaging_photos: res.data.packaging_photos, status: res.data.status } : o
      ));
      setSuccess('Package photo saved successfully.');
    } catch (err) {
      setFormError('Failed to upload package photo. Please try again.');
    } finally {
      setPackageUploading(prev => ({ ...prev, [subOrderId]: false }));
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_staff || (user.role !== 'grower' && user.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  const handleEditProduct = async (liteProduct) => {
    setLoading(true);
    try {
      const p = await ProductService.getProduct(liteProduct.id);

      setEditingProduct(p);

      // Sanitize variants — strip backend-only fields that cause PUT validation errors
      const cleanVariants = p.variants?.length > 0
        ? p.variants.map(v => ({
          id: v.id,
          name: v.name || '',
          variant_type: v.variant_type || 'Plant',
          base_price: v.base_price ?? '',
          gst_rate: '0',
          commission_rate: '10.0',
          stock: v.stock ?? '',
          item_category: v.item_category ?? 'light',
          packed_weight_grams: v.packed_weight_grams ?? '',
          length: v.length ?? '10',
          width: v.width ?? '10',
          height: v.height ?? '10',
        }))
        : [{ name: '', variant_type: 'Plant', base_price: '', gst_rate: '0', commission_rate: '10.0', stock: '', item_category: 'light', packed_weight_grams: '', length: '10', width: '10', height: '10' }];

      // Sanitize images — strip backend-only fields
      const cleanImages = p.images?.length > 0
        ? p.images.map(img => ({
          id: img.id,
          image_url: img.image_url || '',
          is_primary: img.is_primary ?? false,
          alt_text: img.alt_text || '',
          variant_id: img.variant || '',
        }))
        : [{ image_url: '', is_primary: true }];

      setNewProduct({
        name: p.name || '',
        scientific_name: p.scientific_name || '',
        category_id: p.categories?.[0]?.id || '',
        sub_category_id: p.sub_category?.id || '',
        tagline: p.tagline || '',
        origin: p.origin || '',
        description: p.description || '',
        care_level: p.care_level?.split(' to ')[0] || 'Easy',
        care_level_max: p.care_level?.split(' to ')[1] || p.care_level?.split(' to ')[0] || 'Easy',
        light_requirements: p.light_requirements?.split(' to ')[0] || 'Low',
        light_requirements_max: p.light_requirements?.split(' to ')[1] || p.light_requirements?.split(' to ')[0] || 'Medium',
        growth_rate: p.growth_rate?.split(' to ')[0] || 'Moderate',
        growth_rate_max: p.growth_rate?.split(' to ')[1] || p.growth_rate?.split(' to ')[0] || 'Moderate',
        is_rare: p.is_rare || false,
        variants: cleanVariants,
        images: cleanImages,
      });
      setIsModalOpen(true);
    } catch (err) {
      setFormError('Failed to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const sidebarItems = [
      { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
      { id: 'products', label: 'Collection', icon: <Package size={20} /> },
      { id: 'orders', label: 'Fulfillment', icon: <ShoppingBag size={20} /> },
      { id: 'bulk-upload', label: 'Bulk Upload', icon: <Upload size={20} /> },
      { id: 'gst', label: 'GST Invoices', icon: <FileText size={20} /> },
      { id: 'spotlight', label: 'Studio Identity', icon: <Palette size={20} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
    ];

    const isMobile = isMobileView;

    return (
      <DashboardErrorBoundary>
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8faf9', overflow: 'hidden' }}>

          {/* ── Floating Toast Notification ── */}
          {(success || formError) && (
            <div style={{
              position: 'fixed',
              top: '1.5rem',
              right: '1.5rem',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              backgroundColor: success ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${success ? '#bbf7d0' : '#fecaca'}`,
              color: success ? '#166534' : '#b91c1c',
              fontWeight: 700,
              fontSize: '0.875rem',
              maxWidth: '380px',
              animation: 'slideInRight 0.25s ease',
            }}>
              {success
                ? <CheckCircle2 size={20} color="#22c55e" style={{ flexShrink: 0 }} />
                : <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
              }
              <span>{success || formError}</span>
              <button
                onClick={() => { setSuccess(null); setFormError(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 'auto', padding: '0.25rem', lineHeight: 1, fontSize: '1rem' }}
              >✕</button>
            </div>
          )}

          {/* Mobile sidebar overlay backdrop */}
          {isMobile && isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                zIndex: 1000, backdropFilter: 'blur(2px)'
              }}
            />
          )}

          {/* Sidebar */}
          <aside style={{
            width: '280px',
            backgroundColor: '#1b2d2a',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            position: isMobile ? 'fixed' : 'sticky',
            top: 0,
            left: isMobile ? (isSidebarOpen ? '0px' : '-280px') : '0px',
            height: '100vh',
            zIndex: 1001,
            transition: isMobile
              ? 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'none',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '3rem 2rem', minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: isMobile ? 'pointer' : 'default' }}
                  onClick={() => { if (isMobile) setIsSidebarOpen(false); }}
                >
                  <div style={{ backgroundColor: spotlight.brand_color || '#E5C48B', padding: '0.6rem', borderRadius: '12px', transition: 'background-color 0.3s' }}>
                    <Leaf size={24} color="white" />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif', margin: 0 }}>Junglyst</h2>
                </div>
                {isMobile && (
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0.5rem' }}
                  >
                    <X size={24} />
                  </button>
                )}
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sidebarItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleTabChange(item.id);
                      if (isMobile) setIsSidebarOpen(false); // auto-close on mobile
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.5rem',
                      borderRadius: '16px', border: 'none',
                      backgroundColor: activeTab === item.id ? spotlight.brand_color || 'rgba(255,255,255,0.1)' : 'transparent',
                      color: activeTab === item.id ? (isLight(spotlight.brand_color) ? '#1b2d2a' : 'white') : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === item.id ? 700 : 500, transition: 'all 0.2s',
                      boxShadow: activeTab === item.id ? `0 4px 15px ${spotlight.brand_color}40` : 'none'
                    }}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </nav>

              <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  to="/"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.5rem',
                    borderRadius: '16px', textDecoration: 'none', color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                >
                  <ChevronRight size={18} /> Go to Store
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.5rem',
                    borderRadius: '16px', border: 'none', background: 'transparent',
                    color: '#f87171', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.2s', textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#f87171'}
                >
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ flexGrow: 1, padding: isMobile ? '1.5rem 1rem' : '4rem 5rem', maxWidth: '1600px', minWidth: 0, overflowX: 'hidden' }}>
            <header style={{ marginBottom: isMobile ? '1.5rem' : '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                {/* Hamburger and Mobile Logo */}
                {isMobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b2d2a', flexShrink: 0, padding: '0.5rem', borderRadius: '10px', position: 'relative', zIndex: 900, pointerEvents: 'auto' }}
                    >
                      <Menu size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <NaturalLogo size={32} />
                    </div>
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: spotlight.brand_color || '#E5C48B', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>Grower Workspace</p>
                  <h1 style={{ fontSize: isMobile ? '1.5rem' : '3rem', textTransform: 'capitalize', fontFamily: 'serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeTab}</h1>
                </div>
              </div>
              {activeTab === 'products' && (
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      name: '', scientific_name: '', category_id: '', sub_category_id: '', description: '',
                      tagline: '', origin: '',
                      care_level: 'Easy', care_level_max: 'Easy',
                      light_requirements: 'Low', light_requirements_max: 'Medium',
                      growth_rate: 'Moderate', growth_rate_max: 'Moderate',
                      is_rare: false,
                      variants: [{
                        name: '', variant_type: 'Plant', base_price: '', gst_rate: '0',
                        commission_rate: '10.0', price: '', stock: '',
                        item_category: 'light', packed_weight_grams: '', length: '10', width: '10', height: '10'
                      }],
                      images: [{ image_url: '', is_primary: true }]
                    });
                    setIsModalOpen(true);
                  }}
                  style={{ backgroundColor: spotlight.brand_color || '#1b2d2a', color: isLight(spotlight.brand_color) ? '#1b2d2a' : 'white', border: 'none', padding: isMobile ? '0.75rem 1rem' : '1rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: `0 4px 15px ${(spotlight.brand_color || '#1b2d2a')}30`, flexShrink: 0, fontSize: isMobile ? '0.75rem' : '1rem', whiteSpace: 'nowrap' }}
                >
                  <Plus size={isMobile ? 16 : 20} /> {isMobile ? 'Add' : 'List New Specimen'}
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
                {activeTab === 'gst' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                      <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          Your GST Invoices
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Settled payments and tax deductions for the selected month</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                          <Calendar size={18} color="var(--text-secondary)" />
                          <input
                            type="month"
                            value={selectedGstMonth}
                            onChange={(e) => {
                              setSelectedGstMonth(e.target.value);
                              setGstData(null);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                          />
                        </div>
                        <button
                          onClick={handleGenerateGst}
                          disabled={gstLoading}
                          style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: gstLoading ? 'not-allowed' : 'pointer' }}
                        >
                          Generate
                        </button>
                      </div>
                    </div>

                    {gstLoading ? (
                      <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                        <p style={{ color: 'var(--text-secondary)' }}>Compiling invoices...</p>
                      </div>
                    ) : gstError ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '16px' }}>
                        <p style={{ fontWeight: 700 }}>Failed to load GST data</p>
                        <p>{gstError}</p>
                      </div>
                    ) : !gstData ? (
                      <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                        <Calendar size={48} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Select a month and click Generate to view your GST invoice.</p>
                      </div>
                    ) : gstData.total_orders === 0 ? (
                      <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                        <FileText size={48} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No settled orders found for the selected month.</p>
                      </div>
                    ) : (
                      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                              <Store size={16} color="var(--brand-gold)" />
                              {gstData.store_name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{gstData.seller_email}</div>
                          </div>
                          <div style={{ backgroundColor: '#e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                            {gstData.total_orders} Orders
                          </div>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '0.25rem' }}>Gross Sales (Inc. GST)</p>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                              <IndianRupee size={32} /> {gstData.gross_sales.toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Taxable Value</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{gstData.taxable_value.toLocaleString()}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Total GST ({gstData.gst_percentage}%)</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{gstData.total_gst.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <span>CGST</span>
                              <span>₹{gstData.cgst.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                              <span>SGST</span>
                              <span>₹{gstData.sgst.toLocaleString()}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Platform Fee</span>
                              <span style={{ fontWeight: 700, color: '#ef4444' }}>-₹{gstData.platform_fee.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>GST on Platform Fee (18%)</span>
                              <span style={{ fontWeight: 700, color: '#ef4444' }}>-₹{gstData.platform_fee_gst.toLocaleString()}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
                              <span style={{ fontWeight: 600 }}>TCS (1% under GST)</span>
                              <span style={{ fontWeight: 800 }}>-₹{gstData.tcs_deducted.toLocaleString()}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400e', paddingBottom: '1rem', borderBottom: '1px dashed var(--border-subtle)' }}>
                              <span style={{ fontWeight: 600 }}>TDS (1% u/s 194-O)</span>
                              <span style={{ fontWeight: 800 }}>-₹{gstData.tds_deducted.toLocaleString()}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-gold)', paddingTop: '0.5rem' }}>
                              <span style={{ fontWeight: 800 }}>Net Settlement</span>
                              <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>₹{gstData.net_settlement.toLocaleString()}</span>
                            </div>

                            <button
                              onClick={() => setShowItemizedInvoice(true)}
                              style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: '#334155', transition: 'background-color 0.2s' }}
                            >
                              <FileText size={16} /> View Itemized Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

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
                        <img src={getImageUrl(spotlight.banner_url)} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                              <img src={getImageUrl(spotlight.logo_url)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }} />
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
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '2rem' }}>
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
                                  <stop offset="5%" stopColor={spotlight.brand_color || '#1b2d2a'} stopOpacity={0.1} />
                                  <stop offset="95%" stopColor={spotlight.brand_color || '#1b2d2a'} stopOpacity={0} />
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
                                <Legend verticalAlign="bottom" height={36} />
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
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
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
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#1b2d2a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>#{idx + 1}</div>
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
                  <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #edf2ed', padding: isMobile ? '1.5rem 1.25rem' : '4rem', maxWidth: '1000px' }}>
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
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
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
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button
                              type="button"
                              onClick={() => setSpotlight({
                                ...spotlight,
                                store_name: "The Obsidian Fern",
                                expertise: "Primitive Botanicals & Rare Lithophytes",
                                bio: "Welcome to The Obsidian Fern. We specialize in specimens that thrive in the shadows of the forest floor. Our nursery in the Western Ghats focuses on long-term health and spectral stability for advanced collectors.",
                                brand_color: "#1b2d2a",
                                logo_url: "https://images.unsplash.com/photo-1512428559083-a401c469b60d?auto=format&fit=crop&q=80&w=200",
                                banner_url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=2000"
                              })}
                              style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8faf9', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', color: '#1b2d2a' }}
                            >
                              INFUSE SAMPLE IDENTITY
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Custom Theme Color <span style={{ color: '#ef4444' }}>*</span></label>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input type="color" value={spotlight.brand_color} onChange={e => setSpotlight({ ...spotlight, brand_color: e.target.value })} style={{ width: '56px', height: '56px', flexShrink: 0, border: 'none', borderRadius: '12px', cursor: 'pointer' }} />
                                <input type="text" value={spotlight.brand_color} onChange={e => setSpotlight({ ...spotlight, brand_color: e.target.value })} style={{ minWidth: 0, flexGrow: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }} />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                              {[
                                { type: 'logo', label: 'Brand Logo', hint: 'Full logo (rect/square)', urlKey: 'logo_url', nameKey: 'logoName', required: true },
                                { type: 'icon', label: 'Store Icon', hint: 'Small square mark / app icon', urlKey: 'icon_url', nameKey: 'iconName', required: false },
                                { type: 'banner', label: 'Store Banner', hint: 'Wide header image', urlKey: 'banner_url', nameKey: 'bannerName', required: false },
                              ].map(({ type, label, hint, urlKey, nameKey, required }) => (
                                <div key={type}>
                                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
                                  </label>
                                  <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0 0 0.6rem' }}>{hint}</p>
                                  <input type="file" accept="image/*" id={`${type}-upload`} style={{ display: 'none' }} onChange={e => handleImageUpload(e, type)} />
                                  <label htmlFor={`${type}-upload`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '130px', border: uploading === type ? '2px solid #E5C48B' : spotlight[urlKey] ? '2px solid #10b981' : '2px dashed #e2e8f0', borderRadius: '16px', cursor: 'pointer', backgroundColor: '#fcfdfc', transition: 'all 0.3s' }}>
                                    {uploading === type ? <Loader2 className="animate-spin" color="#E5C48B" /> : spotlight[urlKey] ? <CheckCircle2 size={22} color="#10b981" /> : <Upload size={22} color="#94a3b8" />}
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: spotlight[urlKey] ? '#10b981' : '#94a3b8', textAlign: 'center', padding: '0 0.5rem' }}>
                                      {uploading === type ? 'Uploading…' : spotlight[nameKey] || `Select ${label}`}
                                    </span>
                                    {spotlight[urlKey] && <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 700 }}>UPLOADED ✓</span>}
                                  </label>
                                </div>
                              ))}
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
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: fieldErrors.store_name ? '#ef4444' : 'inherit' }}>Studio Name <span style={{ color: '#ef4444' }}>*</span> {fieldErrors.store_name && `— ${fieldErrors.store_name}`}</label>
                              <input value={spotlight.store_name} onChange={e => { setSpotlight({ ...spotlight, store_name: e.target.value }); setFieldErrors({ ...fieldErrors, store_name: null }); }} className={fieldErrors.store_name ? 'form-error-input' : ''} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Signature Tagline</label>
                              <input value={spotlight.expertise} onChange={e => setSpotlight({ ...spotlight, expertise: e.target.value })} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                            </div>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Botanical Mandate / Bio <span style={{ color: '#ef4444' }}>*</span></label>
                            <textarea rows="5" value={spotlight.bio} onChange={e => setSpotlight({ ...spotlight, bio: e.target.value })} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Dispatch Days</label>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>Select the weekdays you ship orders. Buyers see the next available dispatch date on product pages.</p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, idx) => {
                                const active = (spotlight.shipping_days || []).includes(idx);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                      const current = spotlight.shipping_days || [];
                                      const updated = active ? current.filter(d => d !== idx) : [...current, idx].sort((a,b)=>a-b);
                                      setSpotlight({ ...spotlight, shipping_days: updated });
                                    }}
                                    style={{
                                      padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: '2px solid',
                                      backgroundColor: active ? (spotlight.brand_color || '#0A3029') : 'white',
                                      color: active ? 'white' : '#64748b',
                                      borderColor: active ? (spotlight.brand_color || '#0A3029') : '#e2e8f0',
                                    }}
                                  >{day}</button>
                                );
                              })}
                            </div>
                            {(spotlight.shipping_days || []).length === 0 && (
                              <p style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.5rem', fontWeight: 600 }}>No dispatch days set — buyers won't see a shipment window for your products.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <button type="submit" disabled={savingProfile} style={{ backgroundColor: spotlight.brand_color, color: 'white', border: 'none', padding: '1.25rem 3rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', alignSelf: 'flex-start', transition: 'background-color 0.3s' }}>
                        {savingProfile ? 'SYNCING...' : <><Save size={20} /> SAVE STUDIO IDENTITY</>}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'products' && (() => {
                  // Categorise products into tabs
                  const published = products.filter(p => p.is_active && !p.is_draft);
                  const drafts = products.filter(p => p.is_draft);
                  const archived = products.filter(p => !p.is_active && !p.is_draft);
                  const tabList = [
                    { key: 'published', label: 'Published', count: published.length, color: '#22c55e' },
                    { key: 'drafts', label: 'Drafts', count: drafts.length, color: '#f59e0b' },
                    { key: 'archived', label: 'Archived', count: archived.length, color: '#9ca3af' },
                  ];
                  const visibleProducts = productStatusTab === 'published' ? published : productStatusTab === 'drafts' ? drafts : archived;
                  const allSelected = visibleProducts.length > 0 && visibleProducts.every(p => selectedProducts.has(p.id));

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Status tabs */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {tabList.map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => { setProductStatusTab(tab.key); setSelectedProducts(new Set()); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.5rem',
                              padding: '0.55rem 1.1rem', borderRadius: '10px',
                              border: productStatusTab === tab.key ? `2px solid ${tab.color}` : '1.5px solid #e2e8f0',
                              backgroundColor: productStatusTab === tab.key ? `${tab.color}18` : 'white',
                              color: productStatusTab === tab.key ? '#1b2d2a' : '#6b7280',
                              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.18s',
                            }}
                          >
                            {tab.label}
                            <span style={{ backgroundColor: tab.color, color: 'white', borderRadius: '50px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 800 }}>{tab.count}</span>
                          </button>
                        ))}
                      </div>

                      {/* Bulk selection toolbar */}
                      {selectedProducts.size > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.875rem 1.25rem', backgroundColor: '#1b2d2a', borderRadius: '14px', color: 'white' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{selectedProducts.size} selected</span>
                          {productStatusTab === 'drafts' && (
                            <button onClick={() => handleBulkProductAction('publish')} disabled={bulkActing} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '8px', backgroundColor: '#22c55e', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                              <Eye size={13} /> Publish
                            </button>
                          )}
                          {productStatusTab === 'published' && (
                            <button onClick={() => handleBulkProductAction('archive')} disabled={bulkActing} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '8px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                              <Archive size={13} /> Archive
                            </button>
                          )}
                          {productStatusTab === 'archived' && (
                            <>
                              <button onClick={() => handleBulkProductAction('unarchive')} disabled={bulkActing} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '8px', backgroundColor: '#22c55e', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                <Eye size={13} /> Restore
                              </button>
                            </>
                          )}
                          <button onClick={() => handleBulkProductAction('delete')} disabled={bulkActing} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                            <Trash2 size={13} /> Delete
                          </button>
                          <button onClick={() => setSelectedProducts(new Set())} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>Clear</button>
                        </div>
                      )}

                      {/* Stock update banner */}
                      {Object.keys(inlineStocks).length > 0 && (
                        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>{Object.keys(inlineStocks).length} unsaved stock update{Object.keys(inlineStocks).length > 1 ? 's' : ''}</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setInlineStocks({})} style={{ padding: '0.4rem 1rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Cancel</button>
                            <button onClick={handleBulkStockUpdate} disabled={loading} style={{ padding: '0.4rem 1.25rem', backgroundColor: '#1b2d2a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                              Update All Stock
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Product table */}
                      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #edf2ed', overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: isMobile ? '100%' : '800px', borderCollapse: 'collapse' }}>
                          <thead style={{ backgroundColor: '#fcfdfc', textAlign: 'left' }}>
                            <tr>
                              <th style={{ padding: '1.25rem 1rem 1.25rem 1.5rem', width: '40px' }}>
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  onChange={e => setSelectedProducts(e.target.checked ? new Set(visibleProducts.map(p => p.id)) : new Set())}
                                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#1b2d2a' }}
                                />
                              </th>
                              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>Specimen</th>
                              {!isMobile && (
                                <>
                                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>Seller Payout</th>
                                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>Buyer Price</th>
                                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>Stock</th>
                                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', textAlign: 'right' }}>Actions</th>
                                </>
                              )}
                              {isMobile && <th style={{ padding: '1.25rem 1.5rem', width: '60px' }}></th>}
                            </tr>
                          </thead>
                          <tbody>
                            {visibleProducts.length === 0 ? (
                              <tr>
                                <td colSpan="6" style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
                                  <Package size={48} style={{ opacity: 0.2, marginBottom: '1.5rem', display: 'block', margin: '0 auto 1.5rem' }} />
                                  <p>{productStatusTab === 'drafts' ? 'No drafts saved yet.' : productStatusTab === 'archived' ? 'No archived specimens.' : 'No specimens listed yet. Add your first specimen above.'}</p>
                                </td>
                              </tr>
                            ) : visibleProducts.map(p => (
                              <React.Fragment key={p.id}>
                                <tr style={{ borderBottom: '1px solid #edf2ed', opacity: p.is_active || p.is_draft ? 1 : 0.65, transition: 'opacity 0.2s', cursor: isMobile ? 'pointer' : 'default' }} onClick={() => isMobile && setExpandedProductId(prev => prev === p.id ? null : p.id)}>
                                  <td style={{ padding: '1.25rem 1rem 1.25rem 1.5rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedProducts.has(p.id)}
                                      onChange={e => {
                                        setSelectedProducts(prev => {
                                          const next = new Set(prev);
                                          e.target.checked ? next.add(p.id) : next.delete(p.id);
                                          return next;
                                        });
                                      }}
                                      onClick={e => e.stopPropagation()}
                                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#1b2d2a' }}
                                    />
                                  </td>
                                  <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <div
                                      onClick={() => !p.is_draft && window.open(`/product/${p.slug || p.id}`, '_blank')}
                                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: p.is_draft ? 'default' : 'pointer' }}
                                    >
                                      <img
                                        src={p.image_url || p.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect width="50" height="50" fill="%23edf2ed" rx="8"/%3E%3C/svg%3E'}
                                        style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #edf2ed', flexShrink: 0 }}
                                        alt={p.name}
                                      />
                                      <div>
                                        <span style={{ fontWeight: 700, display: 'block', color: '#1b2d2a' }}>{p.name || p.title}</span>
                                        {p.scientific_name && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>{p.scientific_name}</span>}
                                        {p.is_draft && <span style={{ display: 'inline-block', marginTop: '0.2rem', padding: '0.1rem 0.5rem', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 800, backgroundColor: '#fef3c7', color: '#92400e' }}>DRAFT</span>}
                                      </div>
                                    </div>
                                  </td>
                                  {!isMobile && (
                                    <>
                                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#10b981' }}>₹{p.base_price || '—'}</td>
                                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700 }}>₹{p.price || '—'}</td>
                                      <td style={{ padding: '1.25rem 1.5rem' }}>
                                        {p.is_draft ? (
                                          <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>—</span>
                                        ) : (
                                          <input
                                            type="number"
                                            min="0"
                                            value={inlineStocks[p.id] !== undefined ? inlineStocks[p.id] : p.stock}
                                            onChange={(e) => setInlineStocks(prev => ({ ...prev, [p.id]: e.target.value }))}
                                            onClick={e => e.stopPropagation()}
                                            style={{ width: '70px', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}
                                          />
                                        )}
                                      </td>
                                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <button onClick={(e) => { e.stopPropagation(); handleEditProduct(p); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} title="Edit specimen">
                                          <Pencil size={18} />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                  {isMobile && (
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', color: '#94a3b8' }}>
                                      {expandedProductId === p.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </td>
                                  )}
                                </tr>
                                {isMobile && expandedProductId === p.id && (
                                  <tr style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid #edf2ed' }}>
                                    <td colSpan="3" style={{ padding: '1.5rem 2rem' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div>
                                          <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Seller Payout</p>
                                          <p style={{ fontWeight: 700, color: '#10b981' }}>₹{p.base_price || '—'}</p>
                                        </div>
                                        <div>
                                          <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Buyer Price</p>
                                          <p style={{ fontWeight: 700 }}>₹{p.price || '—'}</p>
                                        </div>
                                        {!p.is_draft && (
                                          <div>
                                            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Stock</p>
                                            <input
                                              type="number"
                                              min="0"
                                              value={inlineStocks[p.id] !== undefined ? inlineStocks[p.id] : p.stock}
                                              onChange={(e) => setInlineStocks(prev => ({ ...prev, [p.id]: e.target.value }))}
                                              style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <button onClick={() => handleEditProduct(p)} style={{ width: '100%', backgroundColor: '#1b2d2a', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Pencil size={16} /> {p.is_draft ? 'Continue Editing' : 'Edit Specimen'}
                                      </button>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                        {productTotal > 0 && (
                          <Pagination
                            page={productPage}
                            totalPages={Math.max(1, Math.ceil(productTotal / productPageSize))}
                            totalItems={productTotal}
                            pageSize={productPageSize}
                            onPageChange={setProductPage}
                            onPageSizeChange={(s) => { setProductPageSize(s); setProductPage(1); }}
                            pageSizeOptions={[10, 20, 50]}
                            onScrollTop={() => {}}
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}

                {activeTab === 'orders' && (() => {
                  const PENDING_STATUSES   = ['placed', 'confirmed', 'packing'];
                  const SHIPPED_STATUSES   = ['shipped', 'in_transit', 'out_for_delivery'];
                  const DELIVERED_STATUSES = ['delivered'];
                  const FAILED_STATUSES    = ['delivery_failed', 'doa_raised', 'cancelled'];

                  const pendingCount   = orders.filter(o => PENDING_STATUSES.includes(o.status)).length;
                  const shippedCount   = orders.filter(o => SHIPPED_STATUSES.includes(o.status)).length;
                  const deliveredCount = orders.filter(o => DELIVERED_STATUSES.includes(o.status)).length;
                  const failedCount    = orders.filter(o => FAILED_STATUSES.includes(o.status)).length;

                  let filteredOrders = [...orders];
                  if (orderFilter === 'pending')   filteredOrders = filteredOrders.filter(o => PENDING_STATUSES.includes(o.status));
                  if (orderFilter === 'shipped')   filteredOrders = filteredOrders.filter(o => SHIPPED_STATUSES.includes(o.status));
                  if (orderFilter === 'delivered') filteredOrders = filteredOrders.filter(o => DELIVERED_STATUSES.includes(o.status));
                  if (orderFilter === 'failed')    filteredOrders = filteredOrders.filter(o => FAILED_STATUSES.includes(o.status));
                  // Sort desc by placed time
                  filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                  // Group by calendar date
                  const groups = {};
                  filteredOrders.forEach(o => {
                    const d = new Date(o.created_at);
                    const key = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(o);
                  });
                  const groupedByDate = Object.entries(groups).sort((a, b) => new Date(b[1][0].created_at) - new Date(a[1][0].created_at));

                  const filterTabs = [
                    { key: 'all',       label: 'All Orders', count: orders.length,  color: '#6366f1' },
                    { key: 'pending',   label: 'Pending',    count: pendingCount,   color: '#f59e0b' },
                    { key: 'shipped',   label: 'Shipped',    count: shippedCount,   color: '#3b82f6' },
                    { key: 'delivered', label: 'Delivered',  count: deliveredCount, color: '#10b981' },
                    ...(failedCount > 0 ? [{ key: 'failed', label: 'Failed / Issues', count: failedCount, color: '#ef4444' }] : []),
                  ];

                  const statusColors = {
                    placed:           { bg: '#dbeafe', fg: '#1d4ed8' },
                    confirmed:        { bg: '#fef9c3', fg: '#854d0e' },
                    packing:          { bg: '#fff7ed', fg: '#c2410c' },
                    shipped:          { bg: '#d1fae5', fg: '#065f46' },
                    in_transit:       { bg: '#d1fae5', fg: '#065f46' },
                    out_for_delivery: { bg: '#dcfce7', fg: '#14532d' },
                    delivered:        { bg: '#dcfce7', fg: '#14532d' },
                    delivery_failed:  { bg: '#fee2e2', fg: '#991b1b' },
                    doa_raised:       { bg: '#fce7f3', fg: '#9d174d' },
                    cancelled:        { bg: '#fee2e2', fg: '#991b1b' },
                  };

                  return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* ── Status filter tabs ── */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {filterTabs.map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setOrderFilter(tab.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.55rem 1.1rem', borderRadius: '10px',
                            border: orderFilter === tab.key ? `2px solid ${tab.color}` : '1.5px solid #e2e8f0',
                            backgroundColor: orderFilter === tab.key ? `${tab.color}18` : 'white',
                            color: orderFilter === tab.key ? '#1b2d2a' : '#6b7280',
                            fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.18s',
                          }}
                        >
                          {tab.label}
                          <span style={{ backgroundColor: tab.color, color: 'white', borderRadius: '50px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 800 }}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* ── Bulk ship toolbar ── */}
                    {selectedOrders.size > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', backgroundColor: '#1b2d2a', borderRadius: '16px', color: 'white' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedOrders.size} sub-order{selectedOrders.size > 1 ? 's' : ''} selected</span>
                        <button
                          onClick={() => handleShipNow([...selectedOrders])}
                          disabled={bulkShipping}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '10px', backgroundColor: '#4ade80', color: '#14532d', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          {bulkShipping ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Truck size={14} />}
                          Ship Now ({selectedOrders.size})
                        </button>
                        <button onClick={() => setSelectedOrders(new Set())} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>
                          Clear
                        </button>
                      </div>
                    )}

                    {/* ── Date-grouped orders ── */}
                    {groupedByDate.length === 0 ? (
                      <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #edf2ed', padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
                        <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1.5rem', display: 'block', margin: '0 auto 1.5rem' }} />
                        <p>No {orderFilter !== 'all' ? orderFilter : ''} orders found.</p>
                      </div>
                    ) : groupedByDate.map(([dateLabel, dayOrders]) => (
                      <div key={dateLabel}>
                        {/* Date separator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#f1f5f9', borderRadius: '50px', padding: '0.3rem 0.85rem' }}>
                            <Calendar size={12} color="#64748b" />
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {dateLabel}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                            {dayOrders.length} order{dayOrders.length > 1 ? 's' : ''}
                          </span>
                          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                        </div>

                        <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #edf2ed', overflow: 'hidden', marginBottom: '0.5rem' }}>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: isMobile ? '100%' : '860px', borderCollapse: 'collapse' }}>
                              <thead style={{ backgroundColor: '#fcfdfc', textAlign: 'left' }}>
                                <tr>
                                  <th style={{ padding: '0.875rem 0.75rem 0.875rem 1.25rem', width: '40px' }}>
                                    <input
                                      type="checkbox"
                                      checked={dayOrders.some(o => {
                                        const cs = ['confirmed','packing'].includes(o.status) && (o.packaging_photos||[]).length > 0 && o.actual_weight_grams && o.actual_length_cm && o.actual_breadth_cm && o.actual_height_cm;
                                        return cs;
                                      }) && dayOrders.filter(o => ['confirmed','packing'].includes(o.status) && (o.packaging_photos||[]).length > 0 && o.actual_weight_grams && o.actual_length_cm && o.actual_breadth_cm && o.actual_height_cm).every(o => selectedOrders.has(o.id))}
                                      onChange={e => {
                                        const shippable = dayOrders.filter(o => ['confirmed','packing'].includes(o.status) && (o.packaging_photos||[]).length > 0 && o.actual_weight_grams && o.actual_length_cm && o.actual_breadth_cm && o.actual_height_cm);
                                        setSelectedOrders(prev => { const next = new Set(prev); shippable.forEach(o => e.target.checked ? next.add(o.id) : next.delete(o.id)); return next; });
                                      }}
                                      style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#1b2d2a' }}
                                    />
                                  </th>
                                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Sub-Order</th>
                                  {!isMobile && ['Status', 'Dispatch', 'Items', 'Amount', 'Buyer', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '0.875rem 1.25rem', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>{h}</th>
                                  ))}
                                  {isMobile && <th style={{ padding: '0.875rem 1.25rem', width: '40px' }}></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {dayOrders.map(o => {
                                  const shipment = o.shipment;
                                  const isExpanded = expandedOrderId === o.id;
                                  const canConfirm = o.status === 'placed';
                                  const hasPhotos = (o.packaging_photos || []).length > 0;
                                  const hasDims = o.actual_weight_grams && o.actual_length_cm && o.actual_breadth_cm && o.actual_height_cm;
                                  const canShip = ['confirmed', 'packing'].includes(o.status) && hasPhotos && hasDims;
                                  const isShipped = ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(o.status);
                              const sc = statusColors[o.status] || { bg: '#f3f4f6', fg: '#4b5563' };
                              const dispatchUrgent = o.dispatch_hours_remaining !== null && o.dispatch_hours_remaining <= 12;
                              return (
                                <React.Fragment key={o.id}>
                                  <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #edf2ed', backgroundColor: isExpanded ? '#f8faf8' : 'white' }}>
                                    <td style={{ padding: '1.25rem 1rem 1.25rem 1.5rem' }}>
                                      {canShip && (
                                        <input
                                          type="checkbox"
                                          checked={selectedOrders.has(o.id)}
                                          onChange={e => {
                                            setSelectedOrders(prev => {
                                              const next = new Set(prev);
                                              e.target.checked ? next.add(o.id) : next.delete(o.id);
                                              return next;
                                            });
                                          }}
                                          onClick={e => e.stopPropagation()}
                                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#1b2d2a' }}
                                        />
                                      )}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', cursor: 'pointer' }} onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}>
                                      <p style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>{o.sub_order_number}</p>
                                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>{new Date(o.created_at).toLocaleDateString()}</p>
                                      {isMobile && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', backgroundColor: sc.bg, color: sc.fg }}>
                                            {o.status.replace(/_/g, ' ')}
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                    {!isMobile && (
                                      <>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                          <span style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', backgroundColor: sc.bg, color: sc.fg }}>
                                            {o.status.replace(/_/g, ' ')}
                                          </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem' }}>
                                          {o.dispatch_hours_remaining !== null && !isShipped ? (
                                            <span style={{ fontWeight: 700, color: dispatchUrgent ? '#dc2626' : '#64748b' }}>
                                              {o.dispatch_hours_remaining > 0 ? `${o.dispatch_hours_remaining}h left` : 'Overdue'}
                                            </span>
                                          ) : <span style={{ color: '#94a3b8' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
                                          {(o.items || []).length} Specimens
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
                                          ₹{parseFloat(o.seller_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                                          <span style={{ display: 'block', fontWeight: 600 }}>{o.buyer_first_name || '—'}</span>
                                          <span style={{ fontSize: '0.7rem' }}>{o.buyer_pincode || '—'}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            {canConfirm && (
                                              <button
                                                onClick={() => handleConfirmSubOrder(o.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                              >
                                                Confirm
                                              </button>
                                            )}
                                            {canShip && (
                                              <button
                                                onClick={() => handleShipNow([o.id])}
                                                disabled={bulkShipping}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '8px', backgroundColor: '#1b2d2a', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                              >
                                                <Truck size={12} /> Ship
                                              </button>
                                            )}
                                            {shipment?.label_url && (
                                              <a href={shipment.label_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid #edf2ed', color: '#1b2d2a', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 700 }}>
                                                <Download size={12} /> Label
                                              </a>
                                            )}
                                            <button
                                              onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.45rem' }}
                                            >
                                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                    {isMobile && (
                                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}>
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                      </td>
                                    )}
                                  </tr>

                                  {/* Expanded row — items + packaging photos */}
                                  {isExpanded && (
                                    <tr style={{ borderBottom: '1px solid #edf2ed' }}>
                                      <td colSpan={isMobile ? 3 : 8} style={{ padding: isMobile ? '1rem' : '0 1.5rem 1.5rem 4rem', backgroundColor: '#f8faf8' }}>
                                        {isMobile && (
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                                            <div>
                                              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Dispatch</p>
                                              {o.dispatch_hours_remaining !== null && !isShipped ? (
                                                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: dispatchUrgent ? '#dc2626' : '#64748b' }}>
                                                  {o.dispatch_hours_remaining > 0 ? `${o.dispatch_hours_remaining}h left` : 'Overdue'}
                                                </span>
                                              ) : <span style={{ color: '#94a3b8' }}>—</span>}
                                            </div>
                                            <div>
                                              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Amount</p>
                                              <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>₹{parseFloat(o.seller_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Buyer</p>
                                              <span style={{ fontWeight: 600, fontSize: '0.85rem', marginRight: '0.5rem' }}>{o.buyer_first_name || '—'}</span>
                                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.buyer_pincode || '—'}</span>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                              {canConfirm && (
                                                <button onClick={() => handleConfirmSubOrder(o.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                                                  Confirm Order
                                                </button>
                                              )}
                                              {canShip && (
                                                <button onClick={() => handleShipNow([o.id])} disabled={bulkShipping} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '8px', backgroundColor: '#1b2d2a', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                                                  <Truck size={14} /> Ship Now
                                                </button>
                                              )}
                                              {shipment?.label_url && (
                                                <a href={shipment.label_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #edf2ed', color: '#1b2d2a', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, flex: 1, justifyContent: 'center', backgroundColor: 'white' }}>
                                                  <Download size={14} /> Label
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                          {/* Items list */}
                                          <div style={{ flex: '1', minWidth: '280px' }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem' }}>Items in This Sub-Order</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                              {(o.items || []).map(item => (
                                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #edf2ed' }}>
                                                  {item.product_image && (
                                                    <img onClick={() => item.product ? window.open(`/product/${item.product}`, '_blank') : null} src={item.product_image} alt={item.product_name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', cursor: item.product ? 'pointer' : 'default' }} />
                                                  )}
                                                  <div style={{ flex: 1 }}>
                                                    <p onClick={() => item.product ? window.open(`/product/${item.product}`, '_blank') : null} style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', cursor: item.product ? 'pointer' : 'default', color: item.product ? '#1b2d2a' : 'inherit' }}>{item.product_name}</p>
                                                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>{item.variant_name} × {item.quantity}</p>
                                                  </div>
                                                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>₹{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-IN')}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Right panel: package details + photos */}
                                          <div style={{ minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                            {/* Package weight + dimensions */}
                                            {!isShipped && (
                                              <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '12px', border: hasDims ? '1px solid #d1fae5' : '1px solid #fde68a' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem' }}>
                                                  Package Weight & Dimensions {!hasDims && <span style={{ color: '#d97706' }}>*required before shipping</span>}
                                                </p>
                                                {hasDims ? (
                                                  <div style={{ fontSize: '0.8rem', color: '#1b2d2a' }}>
                                                    <p style={{ margin: 0, fontWeight: 700 }}>
                                                      {o.actual_weight_grams}g &nbsp;·&nbsp; {o.actual_length_cm}×{o.actual_breadth_cm}×{o.actual_height_cm} cm
                                                    </p>
                                                    <button onClick={() => setShipmentDims(prev => ({ ...prev, [o.id]: { weight: o.actual_weight_grams, length: o.actual_length_cm, breadth: o.actual_breadth_cm, height: o.actual_height_cm } }))}
                                                      style={{ marginTop: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem', padding: 0 }}>
                                                      Edit
                                                    </button>
                                                  </div>
                                                ) : null}
                                                {(!hasDims || shipmentDims[o.id]) && (
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {[
                                                      { key: 'weight', label: 'Weight (g)', placeholder: 'e.g. 850' },
                                                      { key: 'length', label: 'Length (cm)', placeholder: 'e.g. 30' },
                                                      { key: 'breadth', label: 'Breadth (cm)', placeholder: 'e.g. 20' },
                                                      { key: 'height', label: 'Height (cm)', placeholder: 'e.g. 15' },
                                                    ].map(({ key, label, placeholder }) => (
                                                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <label style={{ width: '95px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', flexShrink: 0 }}>{label}</label>
                                                        <input
                                                          type="number" min="1" placeholder={placeholder}
                                                          value={shipmentDims[o.id]?.[key] || ''}
                                                          onChange={e => setShipmentDims(prev => ({ ...prev, [o.id]: { ...(prev[o.id] || {}), [key]: e.target.value } }))}
                                                          style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }}
                                                        />
                                                      </div>
                                                    ))}
                                                    <button
                                                      onClick={() => handleSaveShipmentDetails(o.id)}
                                                      disabled={dimsSubmitting[o.id]}
                                                      style={{ marginTop: '0.25rem', padding: '0.45rem 1rem', borderRadius: '8px', backgroundColor: '#1b2d2a', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}
                                                    >
                                                      {dimsSubmitting[o.id] ? 'Saving…' : 'Save Details'}
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {/* Packaging photos */}
                                            <div>
                                              <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                                Packaging Photos {!isShipped && !hasPhotos && <span style={{ color: '#ef4444' }}>*required</span>}
                                              </p>
                                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {(o.packaging_photos || []).map((url, i) => (
                                                  <img key={i} src={url} alt={`Package ${i + 1}`} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #edf2ed' }} />
                                                ))}
                                                {!isShipped && (o.packaging_photos || []).length < 3 && (
                                                  <label style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    gap: '0.25rem', width: '72px', height: '72px', borderRadius: '8px', border: '2px dashed #d1fae5',
                                                    backgroundColor: 'white', cursor: 'pointer', color: '#64748b', fontSize: '0.65rem', textAlign: 'center'
                                                  }}>
                                                    {packageUploading[o.id] ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#1b2d2a' }} /> : <ImagePlus size={18} style={{ color: '#4ade80' }} />}
                                                    <span>{packageUploading[o.id] ? '...' : 'Add'}</span>
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={packageUploading[o.id]} onChange={e => handlePackageImageUpload(o.id, e.target.files[0])} />
                                                  </label>
                                                )}
                                              </div>
                                            </div>

                                            {/* Shipment info */}
                                            {(o.awb_number || shipment) && (
                                              <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #edf2ed', fontSize: '0.75rem' }}>
                                                <p style={{ margin: 0, fontWeight: 700, marginBottom: '0.5rem' }}>Shipment Details</p>
                                                {(o.awb_number || shipment?.awb_number) && <p style={{ margin: '0.25rem 0', color: '#64748b' }}>AWB: <strong style={{ color: '#1b2d2a' }}>{o.awb_number || shipment?.awb_number}</strong></p>}
                                                {(o.courier_name || shipment?.courier_name) && <p style={{ margin: '0.25rem 0', color: '#64748b' }}>Courier: <strong style={{ color: '#1b2d2a' }}>{o.courier_name || shipment?.courier_name}</strong></p>}
                                                {shipment?.label_url && (
                                                  <a href={shipment.label_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem', color: '#1b2d2a', fontWeight: 700, textDecoration: 'none' }}>
                                                    <FileText size={12} /> Shipping Label
                                                  </a>
                                                )}
                                              </div>
                                            )}

                                            {/* Pre-ship checklist summary */}
                                            {!isShipped && ['confirmed', 'packing'].includes(o.status) && (
                                              <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: canShip ? '#f0fdf4' : '#fefce8', border: `1px solid ${canShip ? '#bbf7d0' : '#fde68a'}`, fontSize: '0.75rem' }}>
                                                <p style={{ margin: '0 0 0.4rem', fontWeight: 700, color: canShip ? '#15803d' : '#92400e' }}>{canShip ? '✓ Ready to ship' : 'Complete before shipping:'}</p>
                                                {!hasPhotos && <p style={{ margin: '0.2rem 0', color: '#dc2626' }}>• Upload at least 1 packaging photo</p>}
                                                {!hasDims && <p style={{ margin: '0.2rem 0', color: '#dc2626' }}>• Enter actual package weight and dimensions</p>}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  );
                })()}

                {activeTab === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
                    {/* Account Configuration */}
                    <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #edf2ed', padding: isMobile ? '2rem 1.5rem' : '4rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '0.5rem' }}>Account Configuration</h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 0, marginBottom: '2rem' }}>Changes apply immediately to your login credentials.</p>
                      {accountSuccess && (
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={16} /> {accountSuccess}
                        </div>
                      )}
                      {accountError && (
                        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={16} /> {accountError}
                        </div>
                      )}
                      <form onSubmit={handleAccountSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Email Address</label>
                          <input
                            type="email"
                            value={accountForm.email}
                            disabled
                            style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Phone Number <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>(optional)</span></label>
                          <input
                            type="tel"
                            value={accountForm.phone}
                            onChange={e => setAccountForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="+91 98765 43210"
                            style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="submit"
                            disabled={accountSaving}
                            style={{ padding: '0.9rem 1.75rem', borderRadius: '12px', border: 'none', backgroundColor: '#1b2d2a', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: accountSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: accountSaving ? 0.7 : 1 }}
                          >
                            {accountSaving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={15} /> Save Changes</>}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Payout Details */}
                    <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #edf2ed', padding: isMobile ? '2rem 1.5rem' : '4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', margin: 0 }}>Payout Details</h3>
                          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem', marginBottom: 0 }}>Stored end-to-end encrypted. Only the last 4 digits are visible.</p>
                        </div>
                        {!bankEditing && (
                          <button
                            onClick={() => { setBankEditing(true); setBankError(null); setBankSuccess(null); }}
                            style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', border: '1.5px solid #1b2d2a', backgroundColor: 'white', color: '#1b2d2a', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <Pencil size={14} /> {bankMasked.has_bank_details ? 'Update' : 'Add'}
                          </button>
                        )}
                      </div>

                      {bankSuccess && (
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={16} /> {bankSuccess}
                        </div>
                      )}
                      {bankError && (
                        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={16} /> {bankError}
                        </div>
                      )}

                      {!bankEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {bankMasked.has_bank_details ? (
                            <>
                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fcfdfc' }}>
                                  <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 0.4rem' }}>Payout Method</p>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#1b2d2a' }}>{bankForm.payout_type === 'bank' ? 'Bank Account' : 'UPI'}</p>
                                </div>
                                <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fcfdfc' }}>
                                  <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 0.4rem' }}>{bankForm.payout_type === 'bank' ? 'Account Number' : 'UPI ID'}</p>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#1b2d2a', fontFamily: 'monospace' }}>{bankMasked.payout_account_masked}</p>
                                </div>
                                {bankForm.payout_type === 'bank' && (
                                  <>
                                    <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fcfdfc' }}>
                                      <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 0.4rem' }}>IFSC Code</p>
                                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#1b2d2a', fontFamily: 'monospace' }}>{bankMasked.ifsc_code_masked}</p>
                                    </div>
                                    <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fcfdfc' }}>
                                      <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 0.4rem' }}>Account Holder</p>
                                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#1b2d2a' }}>{bankForm.account_holder_name || '—'}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                                <ShieldCheck size={15} color="#16a34a" />
                                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Details encrypted at rest with AES-256</span>
                              </div>
                            </>
                          ) : (
                            <div style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                              <IndianRupee size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                              <p style={{ margin: 0, fontSize: '0.9rem' }}>No payout details saved yet.</p>
                              <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem' }}>Add your UPI ID or bank account to receive payouts.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleBankSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {/* Payout type toggle */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: '#64748b' }}>Payout Method</label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              {[{ value: 'upi', label: 'UPI' }, { value: 'bank', label: 'Bank Account' }].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setBankForm(f => ({ ...f, payout_type: opt.value, payout_account: '', ifsc_code: '', account_holder_name: '' }))}
                                  style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: bankForm.payout_type === opt.value ? '2px solid #1b2d2a' : '1.5px solid #e2e8f0', backgroundColor: bankForm.payout_type === opt.value ? '#1b2d2a' : 'white', color: bankForm.payout_type === opt.value ? 'white' : '#64748b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {bankForm.payout_type === 'upi' ? (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: '#64748b' }}>UPI ID <span style={{ color: '#ef4444' }}>*</span></label>
                              <input
                                type="text"
                                value={bankForm.payout_account}
                                onChange={e => setBankForm(f => ({ ...f, payout_account: e.target.value }))}
                                placeholder="yourname@upi"
                                required
                                style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                              />
                            </div>
                          ) : (
                            <>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: '#64748b' }}>Account Holder Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                  type="text"
                                  value={bankForm.account_holder_name}
                                  onChange={e => setBankForm(f => ({ ...f, account_holder_name: e.target.value }))}
                                  placeholder="As printed on bank passbook"
                                  required
                                  style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                                />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '1rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: '#64748b' }}>Account Number <span style={{ color: '#ef4444' }}>*</span></label>
                                  <input
                                    type="text"
                                    value={bankForm.payout_account}
                                    onChange={e => setBankForm(f => ({ ...f, payout_account: e.target.value.replace(/\D/g, '') }))}
                                    placeholder="Enter account number"
                                    required
                                    style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontFamily: 'monospace' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: '#64748b' }}>IFSC Code <span style={{ color: '#ef4444' }}>*</span></label>
                                  <input
                                    type="text"
                                    value={bankForm.ifsc_code}
                                    onChange={e => setBankForm(f => ({ ...f, ifsc_code: e.target.value.toUpperCase() }))}
                                    placeholder="e.g. SBIN0001234"
                                    maxLength={11}
                                    required
                                    style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontFamily: 'monospace' }}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#fffbeb', borderRadius: '10px', border: '1px solid #fef3c7' }}>
                            <ShieldCheck size={15} color="#d97706" />
                            <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>Your details are encrypted with AES-256 before being stored. Junglyst staff cannot view raw account numbers.</span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => { setBankEditing(false); setBankError(null); setBankForm(f => ({ ...f, payout_account: '', ifsc_code: '' })); }}
                              style={{ padding: '0.9rem 1.75rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={bankSaving}
                              style={{ padding: '0.9rem 1.75rem', borderRadius: '12px', border: 'none', backgroundColor: '#1b2d2a', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: bankSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: bankSaving ? 0.7 : 1 }}
                            >
                              {bankSaving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={15} /> Save Securely</>}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Danger Zone */}
                    <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #fee2e2', padding: isMobile ? '2rem 1.5rem' : '4rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontFamily: 'serif', marginBottom: '1rem', color: '#ef4444' }}>Danger Zone</h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem', marginTop: 0 }}>Permanently deactivate your grower status and archive all listings.</p>
                      <button style={{ backgroundColor: 'white', color: '#ef4444', border: '1px solid #fee2e2', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        Deactivate Sanctuary
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'bulk-upload' && (() => {
                  const VARIANT_TYPES = ['Plant','Rhizome','Pot','Clump','Tissue Culture','Cutting','Bunch','Mat','Cup','Emersed','Submerged','Seedling','Bulb','Corm','Dry Start','Colony','Pair','Trio','Other'];
                  const WEIGHT_CATS = ['light','heavy'];
                  const MAX_IMAGES = 5;
                  const emptyRow = () => ({
                    product_name: '', scientific_name: '', origin: '',
                    category_id: '', sub_category_id: '',
                    variant_type: 'Plant', variant_name: 'Standard',
                    base_price: '', stock: '',
                    item_category: 'light', packed_weight_grams: '',
                    box_length: '10', box_width: '10', box_height: '10',
                    sku: '',
                    images: [], // [{ file, preview, name }]
                  });

                  const DRAFT_KEY = 'junglyst_bulk_upload_draft';

                  const BulkUpload = () => {
                    const [rows, setRows] = useState(() => {
                      try {
                        const saved = localStorage.getItem(DRAFT_KEY);
                        if (saved) {
                          const { rows: r } = JSON.parse(saved);
                          // Restore text fields; images can't survive page reload (File/blob refs die)
                          return r.map(row => ({ ...emptyRow(), ...row, images: [] }));
                        }
                      } catch {}
                      return [emptyRow(), emptyRow()];
                    });
                    const [subcatMap, setSubcatMap] = useState({});
                    const [downloading, setDownloading] = useState(false);
                    const [openImageRow, setOpenImageRow] = useState(null);
                    const [dragOverRow, setDragOverRow] = useState(null);
                    const [lastSaved, setLastSaved] = useState(() => {
                      try {
                        const saved = localStorage.getItem(DRAFT_KEY);
                        if (saved) return JSON.parse(saved).savedAt || null;
                      } catch {}
                      return null;
                    });
                    const [draftRestored, setDraftRestored] = useState(() => !!localStorage.getItem(DRAFT_KEY));
                    const [showResetConfirm, setShowResetConfirm] = useState(false);
                    const [saveFlash, setSaveFlash] = useState(false);

                    // Auto-save to localStorage whenever rows change (1.2s debounce)
                    useEffect(() => {
                      const timer = setTimeout(() => {
                        const payload = {
                          rows: rows.map(r => ({
                            ...r,
                            images: [],
                            _imageNames: r.images.map(i => i.name),
                          })),
                          savedAt: new Date().toISOString(),
                        };
                        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
                        setLastSaved(payload.savedAt);
                      }, 1200);
                      return () => clearTimeout(timer);
                    }, [rows]);

                    useEffect(() => {
                      const map = {};
                      categories.forEach(cat => {
                        if (cat.subcategories && cat.subcategories.length) map[cat.id] = cat.subcategories;
                      });
                      if (Object.keys(map).length === 0 && categories.length > 0) {
                        Promise.all(
                          categories.map(cat =>
                            api.get(`/core/subcategories/?category=${cat.id}`)
                              .then(r => ({ catId: cat.id, subs: r.data?.results || r.data || [] }))
                              .catch(() => ({ catId: cat.id, subs: [] }))
                          )
                        ).then(results => {
                          const m = {};
                          results.forEach(({ catId, subs }) => { m[catId] = subs; });
                          setSubcatMap(m);
                        });
                      } else {
                        setSubcatMap(map);
                      }
                    }, []);

                    const updateRow = (idx, field, value) => {
                      setRows(prev => {
                        const next = prev.map((r, i) => i === idx ? { ...r, [field]: value } : r);
                        if (field === 'category_id') next[idx].sub_category_id = '';
                        return next;
                      });
                    };

                    const addImages = (idx, files) => {
                      const valid = Array.from(files)
                        .filter(f => f.type.startsWith('image/'))
                        .slice(0, MAX_IMAGES - (rows[idx]?.images?.length || 0));
                      if (!valid.length) return;
                      const newImgs = valid.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }));
                      setRows(prev => prev.map((r, i) => i === idx ? { ...r, images: [...r.images, ...newImgs].slice(0, MAX_IMAGES) } : r));
                    };

                    const removeImage = (rowIdx, imgIdx) => {
                      setRows(prev => prev.map((r, i) => {
                        if (i !== rowIdx) return r;
                        URL.revokeObjectURL(r.images[imgIdx]?.preview);
                        return { ...r, images: r.images.filter((_, j) => j !== imgIdx) };
                      }));
                    };

                    const toggleImageRow = idx => setOpenImageRow(prev => prev === idx ? null : idx);

                    const addRow = () => setRows(prev => [...prev, emptyRow()]);
                    const removeRow = idx => {
                      if (openImageRow === idx) setOpenImageRow(null);
                      rows[idx]?.images?.forEach(img => URL.revokeObjectURL(img.preview));
                      setRows(prev => prev.filter((_, i) => i !== idx));
                    };
                    const duplicateRow = idx => setRows(prev => {
                      const copy = [...prev];
                      copy.splice(idx + 1, 0, { ...prev[idx], images: [] });
                      return copy;
                    });

                    const saveDraftNow = () => {
                      const payload = {
                        rows: rows.map(r => ({ ...r, images: [], _imageNames: r.images.map(i => i.name) })),
                        savedAt: new Date().toISOString(),
                      };
                      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
                      setLastSaved(payload.savedAt);
                      setSaveFlash(true);
                      setTimeout(() => setSaveFlash(false), 2000);
                    };

                    const resetAll = () => {
                      rows.forEach(r => r.images.forEach(img => URL.revokeObjectURL(img.preview)));
                      localStorage.removeItem(DRAFT_KEY);
                      setRows([emptyRow(), emptyRow()]);
                      setLastSaved(null);
                      setDraftRestored(false);
                      setOpenImageRow(null);
                      setShowResetConfirm(false);
                    };

                    const formatSavedAt = iso => {
                      if (!iso) return '';
                      const d = new Date(iso);
                      const now = new Date();
                      const diffMin = Math.round((now - d) / 60000);
                      if (diffMin < 1) return 'just now';
                      if (diffMin < 60) return `${diffMin}m ago`;
                      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    };

                    const downloadExcel = () => {
                      setDownloading(true);
                      try {
                        const headers = [
                          'Product Name', 'Scientific Name (optional)', 'Origin (optional)',
                          'Category', 'Sub-Category', 'Variant Type', 'Variant Name',
                          'Base Price (₹)', 'Stock Qty',
                          'Weight Category (light/heavy)', 'Packed Weight (grams)',
                          'Box Length (cm)', 'Box Width (cm)', 'Box Height (cm)',
                          'GST %', 'Images (filenames)', 'SKU (optional)',
                        ];
                        const data = rows.map(row => {
                          const cat = categories.find(c => String(c.id) === String(row.category_id));
                          const subs = subcatMap[row.category_id] || [];
                          const sub = subs.find(s => String(s.id) === String(row.sub_category_id));
                          return [
                            row.product_name, row.scientific_name, row.origin,
                            cat?.name || '', sub?.name || '',
                            row.variant_type, row.variant_name,
                            row.base_price, row.stock,
                            row.item_category, row.packed_weight_grams,
                            row.box_length, row.box_width, row.box_height,
                            cat?.gst_percentage ?? '',
                            row.images.map(img => img.name).join(', '),
                            row.sku,
                          ];
                        });
                        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
                        ws['!cols'] = headers.map(() => ({ wch: 22 }));
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Products');
                        XLSX.writeFile(wb, 'Junglyst_Product_Upload.xlsx');
                      } finally {
                        setDownloading(false);
                      }
                    };

                    const inputStyle = {
                      width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #e2e8f0',
                      borderRadius: '8px', fontSize: '0.8rem', backgroundColor: 'white',
                      outline: 'none', boxSizing: 'border-box',
                    };
                    const selectStyle = { ...inputStyle, cursor: 'pointer' };
                    const colHead = (label, note) => (
                      <th style={{ padding: '0.75rem 0.6rem', backgroundColor: '#1b2d2a', color: 'white', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                        {label}{note && <span style={{ display: 'block', fontWeight: 400, opacity: 0.6, textTransform: 'none', fontSize: '0.6rem' }}>{note}</span>}
                      </th>
                    );
                    const TOTAL_COLS = 19; // for colspan on image panel row

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Draft restored banner */}
                        {draftRestored && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px' }}>
                            <Save size={16} color="#d97706" style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, fontSize: '0.82rem', color: '#92400e' }}>
                              <strong>Draft restored</strong> — your previous session was recovered.
                              {lastSaved && <span style={{ opacity: 0.7 }}> Last saved {formatSavedAt(lastSaved)}.</span>}
                              {' '}<span style={{ opacity: 0.7 }}>Photos need to be re-attached (they can't be stored locally).</span>
                            </div>
                            <button onClick={() => setDraftRestored(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d97706', fontSize: '1rem', lineHeight: 1, padding: '0.25rem' }}>✕</button>
                          </div>
                        )}

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', margin: 0 }}>Bulk Product Upload</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Fill details and attach photos row by row, then download as Excel or submit.</p>
                              {lastSaved && (
                                <span style={{ fontSize: '0.72rem', color: saveFlash ? '#166534' : '#94a3b8', fontWeight: saveFlash ? 700 : 400, transition: 'color 0.3s', whiteSpace: 'nowrap' }}>
                                  {saveFlash ? '✓ Saved' : `Auto-saved ${formatSavedAt(lastSaved)}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                              <Plus size={15} /> Add Row
                            </button>
                            <button onClick={saveDraftNow} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', backgroundColor: saveFlash ? '#f0fdf4' : 'white', color: saveFlash ? '#166534' : '#475569', border: `1px solid ${saveFlash ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.3s' }}>
                              <Save size={15} /> {saveFlash ? 'Saved!' : 'Save Draft'}
                            </button>
                            <button onClick={() => setShowResetConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', backgroundColor: 'white', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                              <Trash2 size={15} /> Start Fresh
                            </button>
                            <button onClick={downloadExcel} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', backgroundColor: '#1b2d2a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                              <Download size={15} /> {downloading ? 'Preparing…' : 'Download Excel'}
                            </button>
                          </div>
                        </div>

                        {/* Reset confirmation */}
                        {showResetConfirm && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', flexWrap: 'wrap' }}>
                            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: '0.82rem', color: '#b91c1c', fontWeight: 600 }}>This will clear all rows and delete the saved draft. Are you sure?</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={resetAll} style={{ padding: '0.45rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Yes, clear everything</button>
                              <button onClick={() => setShowResetConfirm(false)} style={{ padding: '0.45rem 1rem', backgroundColor: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Table */}
                        <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #edf2ed', overflow: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1800px' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.75rem 0.6rem', backgroundColor: '#1b2d2a', color: 'white', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', width: '36px', position: 'sticky', top: 0, zIndex: 1 }}>#</th>
                                {colHead('Product Name')}
                                {colHead('Scientific Name', 'optional')}
                                {colHead('Origin', 'optional')}
                                {colHead('Category')}
                                {colHead('Sub-Category')}
                                {colHead('Variant Type')}
                                {colHead('Variant Name')}
                                {colHead('Base Price ₹')}
                                {colHead('Stock')}
                                {colHead('Weight Cat.', 'light / heavy')}
                                {colHead('Packed Wt', 'grams')}
                                {colHead('Box L', 'cm')}
                                {colHead('Box W', 'cm')}
                                {colHead('Box H', 'cm')}
                                {colHead('GST %', 'auto')}
                                {colHead('Photos', `max ${MAX_IMAGES}`)}
                                {colHead('SKU', 'optional')}
                                <th style={{ padding: '0.75rem 0.6rem', backgroundColor: '#1b2d2a', color: 'white', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', width: '80px', position: 'sticky', top: 0, zIndex: 1 }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row, idx) => {
                                const cat = categories.find(c => String(c.id) === String(row.category_id));
                                const subcats = subcatMap[row.category_id] || (cat?.subcategories) || [];
                                const gstVal = cat ? cat.gst_percentage : '—';
                                const rowBg = idx % 2 === 0 ? 'white' : '#fafbfa';
                                const imgOpen = openImageRow === idx;
                                const imgCount = row.images.length;
                                const canAddMore = imgCount < MAX_IMAGES;
                                const td = (children, opts = {}) => (
                                  <td style={{ padding: '0.5rem 0.4rem', borderBottom: imgOpen ? 'none' : '1px solid #f1f5f4', verticalAlign: 'middle', backgroundColor: rowBg, ...opts.style }}>{children}</td>
                                );
                                return (
                                  <React.Fragment key={idx}>
                                    <tr>
                                      {td(<span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, paddingLeft: '0.25rem' }}>{idx + 1}</span>)}
                                      {td(<input style={inputStyle} placeholder="e.g. Anubias Nana" value={row.product_name} onChange={e => updateRow(idx, 'product_name', e.target.value)} />)}
                                      {td(<input style={{ ...inputStyle, color: '#94a3b8' }} placeholder="Anubias barteri" value={row.scientific_name} onChange={e => updateRow(idx, 'scientific_name', e.target.value)} />)}
                                      {td(<input style={{ ...inputStyle, color: '#94a3b8' }} placeholder="West Africa" value={row.origin} onChange={e => updateRow(idx, 'origin', e.target.value)} />)}
                                      {td(
                                        <select style={selectStyle} value={row.category_id} onChange={e => updateRow(idx, 'category_id', e.target.value)}>
                                          <option value="">Select…</option>
                                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                      )}
                                      {td(
                                        <select style={selectStyle} value={row.sub_category_id} onChange={e => updateRow(idx, 'sub_category_id', e.target.value)} disabled={!row.category_id}>
                                          <option value="">{row.category_id ? 'Select…' : '← Pick category'}</option>
                                          {subcats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                      )}
                                      {td(
                                        <select style={selectStyle} value={row.variant_type} onChange={e => updateRow(idx, 'variant_type', e.target.value)}>
                                          {VARIANT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                      )}
                                      {td(<input style={inputStyle} placeholder="Standard" value={row.variant_name} onChange={e => updateRow(idx, 'variant_name', e.target.value)} />)}
                                      {td(<input style={inputStyle} type="number" min="0" placeholder="299" value={row.base_price} onChange={e => updateRow(idx, 'base_price', e.target.value)} />)}
                                      {td(<input style={inputStyle} type="number" min="0" placeholder="10" value={row.stock} onChange={e => updateRow(idx, 'stock', e.target.value)} />)}
                                      {td(
                                        <select style={selectStyle} value={row.item_category} onChange={e => updateRow(idx, 'item_category', e.target.value)}>
                                          {WEIGHT_CATS.map(w => <option key={w} value={w}>{w}</option>)}
                                        </select>
                                      )}
                                      {td(<input style={inputStyle} type="number" min="1" max="30000" placeholder="250" value={row.packed_weight_grams} onChange={e => updateRow(idx, 'packed_weight_grams', e.target.value)} />)}
                                      {td(<input style={{ ...inputStyle, width: '60px' }} type="number" min="1" placeholder="10" value={row.box_length} onChange={e => updateRow(idx, 'box_length', e.target.value)} />)}
                                      {td(<input style={{ ...inputStyle, width: '60px' }} type="number" min="1" placeholder="10" value={row.box_width} onChange={e => updateRow(idx, 'box_width', e.target.value)} />)}
                                      {td(<input style={{ ...inputStyle, width: '60px' }} type="number" min="1" placeholder="10" value={row.box_height} onChange={e => updateRow(idx, 'box_height', e.target.value)} />)}
                                      {td(
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: cat ? '#166534' : '#94a3b8', backgroundColor: cat ? '#f0fdf4' : '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                          {cat ? `${gstVal}%` : '—'}
                                        </span>
                                      )}
                                      {td(
                                        <button
                                          onClick={() => toggleImageRow(idx)}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            padding: '0.4rem 0.65rem',
                                            backgroundColor: imgOpen ? '#1b2d2a' : imgCount > 0 ? '#f0fdf4' : '#f8fafc',
                                            color: imgOpen ? 'white' : imgCount > 0 ? '#166534' : '#94a3b8',
                                            border: `1px solid ${imgOpen ? '#1b2d2a' : imgCount > 0 ? '#bbf7d0' : '#e2e8f0'}`,
                                            borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                                            whiteSpace: 'nowrap', transition: 'all 0.15s',
                                          }}
                                        >
                                          <Camera size={13} />
                                          {imgCount > 0 ? `${imgCount} photo${imgCount > 1 ? 's' : ''}` : 'Add photos'}
                                          {imgCount > 0 && !imgOpen && (
                                            <div style={{ display: 'flex', gap: '2px', marginLeft: '2px' }}>
                                              {row.images.slice(0, 3).map((img, i) => (
                                                <img key={i} src={img.preview} alt="" style={{ width: '18px', height: '18px', borderRadius: '3px', objectFit: 'cover', border: '1px solid #bbf7d0' }} />
                                              ))}
                                            </div>
                                          )}
                                        </button>
                                      )}
                                      {td(<input style={{ ...inputStyle, color: '#94a3b8' }} placeholder="optional" value={row.sku} onChange={e => updateRow(idx, 'sku', e.target.value)} />)}
                                      {td(
                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                          <button title="Duplicate row" onClick={() => duplicateRow(idx)} style={{ padding: '0.35rem 0.45rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', cursor: 'pointer', color: '#0369a1', fontSize: '0.65rem', fontWeight: 700 }}>+</button>
                                          {rows.length > 1 && (
                                            <button title="Remove row" onClick={() => removeRow(idx)} style={{ padding: '0.35rem 0.45rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', fontSize: '0.65rem', fontWeight: 700 }}>✕</button>
                                          )}
                                        </div>
                                      )}
                                    </tr>

                                    {/* Inline image panel */}
                                    {imgOpen && (
                                      <tr>
                                        <td colSpan={TOTAL_COLS} style={{ padding: '0', borderBottom: '1px solid #f1f5f4', backgroundColor: rowBg }}>
                                          <div
                                            style={{ margin: '0 0.75rem 0.75rem', padding: '1.25rem', backgroundColor: '#f8faf9', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                            onDragOver={e => { e.preventDefault(); setDragOverRow(idx); }}
                                            onDragLeave={() => setDragOverRow(null)}
                                            onDrop={e => { e.preventDefault(); setDragOverRow(null); addImages(idx, e.dataTransfer.files); }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                              {/* Thumbnails */}
                                              {row.images.map((img, imgIdx) => (
                                                <div key={imgIdx} style={{ position: 'relative', flexShrink: 0 }}>
                                                  <img
                                                    src={img.preview}
                                                    alt={img.name}
                                                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #bbf7d0', display: 'block' }}
                                                  />
                                                  {imgIdx === 0 && (
                                                    <span style={{ position: 'absolute', bottom: '3px', left: '3px', backgroundColor: '#1b2d2a', color: 'white', fontSize: '0.5rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>Cover</span>
                                                  )}
                                                  <button
                                                    onClick={() => removeImage(idx, imgIdx)}
                                                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '10px', lineHeight: 1 }}
                                                  >✕</button>
                                                </div>
                                              ))}

                                              {/* Drop / browse zone */}
                                              {canAddMore && (
                                                <label
                                                  style={{
                                                    width: '72px', height: '72px', borderRadius: '10px', flexShrink: 0,
                                                    border: `2px dashed ${dragOverRow === idx ? '#1b2d2a' : '#cbd5e1'}`,
                                                    backgroundColor: dragOverRow === idx ? '#f0fdf4' : 'white',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', transition: 'all 0.15s', gap: '4px',
                                                  }}
                                                >
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    style={{ display: 'none' }}
                                                    onChange={e => { addImages(idx, e.target.files); e.target.value = ''; }}
                                                  />
                                                  <ImagePlus size={20} color={dragOverRow === idx ? '#1b2d2a' : '#94a3b8'} />
                                                  <span style={{ fontSize: '0.55rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
                                                    {row.images.length === 0 ? 'Drop or click' : `Add more`}
                                                  </span>
                                                </label>
                                              )}

                                              {/* Hints */}
                                              <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6, textAlign: 'right' }}>
                                                <div>{imgCount}/{MAX_IMAGES} photos</div>
                                                {imgCount === 0 && <div style={{ color: '#cbd5e1' }}>First photo = cover image</div>}
                                                <div style={{ color: '#cbd5e1' }}>JPG / PNG / WEBP</div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Footer tips */}
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
                          <div style={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.7 }}>
                            <strong>Tips:</strong> Click <em>Add photos</em> on any row to attach up to 5 images — the first one becomes the cover. GST fills automatically once you pick a category. Sub-category unlocks after category is selected. Duplicate a row to list another variant of the same plant (photos won't carry over). Download Excel exports filenames for your records.
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return <BulkUpload key="bulk-upload" />;
                })()}

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
                  {/* Close button — top right corner */}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{ position: 'absolute', top: isMobile ? '0.6rem' : '1rem', right: isMobile ? '0.6rem' : '1rem', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    <X size={18} />
                  </button>

                  {/* Full-Screen Header */}
                  <div style={{ padding: isMobile ? '0.75rem 3rem 0.75rem 1rem' : '2rem 5rem', borderBottom: '1px solid #edf2ed', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? '0.75rem' : '2rem', backgroundColor: '#fcfdfc', flexShrink: 0 }}>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b2d2a', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: isMobile ? '0.75rem' : '0.9rem', padding: 0, flexShrink: 0 }}
                    >
                      <ArrowLeft size={isMobile ? 16 : 20} /> {isMobile ? 'BACK' : 'EXIT TO DASHBOARD'}
                    </button>
                    {!isMobile && <div style={{ width: '1px', height: '24px', backgroundColor: '#edf2ed', flexShrink: 0 }} />}
                    <h2 style={{ fontSize: isMobile ? '1rem' : '1.5rem', fontFamily: 'serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{editingProduct ? 'Refine Specimen' : 'Onboard New Specimen'}</h2>
                    {editingProduct && (
                      editingProduct.is_active ? (
                        <button onClick={handleArchiveProduct} disabled={saving} style={{ padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid #fee2e2', backgroundColor: 'white', color: '#ef4444', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', flexShrink: 0 }}>
                          <Trash2 size={13} /> {!isMobile && 'ARCHIVE'}
                        </button>
                      ) : (
                        <button onClick={handleUnarchiveProduct} disabled={saving} style={{ padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid #d1fae5', backgroundColor: '#ecfdf5', color: '#065f46', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', flexShrink: 0 }}>
                          <CheckCircle2 size={13} /> {!isMobile && 'UNARCHIVE'}
                        </button>
                      )
                    )}
                    {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                      <button onClick={fillDummyData} style={{ padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid #1b2d2a', backgroundColor: '#1b2d2a', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0 }}>
                        {isMobile ? 'FILL' : 'AUTO-FILL (DEV)'}
                      </button>
                    )}
                  </div>

                  {/* Full-Screen Content (Centered) */}
                  <div id="specimen-modal-content" style={{ flexGrow: 1, overflowY: 'auto', backgroundColor: '#f8faf9' }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '1.25rem 0.75rem' : '5rem 2rem' }}>
                      {formError && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '1.5rem', borderRadius: '16px', marginBottom: '3rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <AlertCircle size={20} /> {formError}
                        </motion.div>
                      )}
                      {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '1.5rem', borderRadius: '16px', marginBottom: '3rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <CheckCircle2 size={20} /> {success}
                        </motion.div>
                      )}
                      <form id="product-form" onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                        {/* Section 1: Basic Identity */}
                        {/* Section 1: Specimen Identity (Merged & Dense) */}
                        <div style={{ backgroundColor: 'white', padding: isMobile ? '2rem 1.5rem' : '3.5rem', borderRadius: '32px', border: '1px solid #edf2ed', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1b2d2a', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                              <Leaf size={18} color="#10b981" /> Specimen Identity
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1.25rem', backgroundColor: '#f8faf9', borderRadius: '12px', border: '1px solid #edf2ed' }}>
                              <input type="checkbox" checked={newProduct.is_rare} onChange={e => setNewProduct({ ...newProduct, is_rare: e.target.checked })} id="is_rare_top" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                              <label htmlFor="is_rare_top" style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1b2d2a', cursor: 'pointer', textTransform: 'uppercase' }}>Rare / Collector</label>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: isMobile ? '2rem' : '4rem' }}>
                            {/* Primary Information */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: fieldErrors.name ? '#ef4444' : '#64748b', letterSpacing: '0.05em' }}>Specimen Name <span style={{ color: '#ef4444' }}>*</span> {fieldErrors.name && `— ${fieldErrors.name}`}</label>
                                  <input value={newProduct.name} onChange={e => { setNewProduct({ ...newProduct, name: e.target.value }); setFieldErrors({ ...fieldErrors, name: null }); }} placeholder="e.g. Alocasia Azlanii" className={fieldErrors.name ? 'form-error-input' : ''} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 500 }} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: '#64748b', letterSpacing: '0.05em' }}>Scientific Name</label>
                                  <input value={newProduct.scientific_name} onChange={e => setNewProduct({ ...newProduct, scientific_name: e.target.value })} placeholder="e.g. Alocasia azlanii" style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontStyle: 'italic', fontSize: '0.9rem' }} />
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: '#64748b', letterSpacing: '0.05em' }}>Short Summary / Tagline</label>
                                <input value={newProduct.tagline} onChange={e => setNewProduct({ ...newProduct, tagline: e.target.value })} placeholder="e.g. Rare jewel alocasia with deep metallic purple leaves" style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: fieldErrors.category_id ? '#ef4444' : '#64748b', letterSpacing: '0.05em' }}>Marketplace Category <span style={{ color: '#ef4444' }}>*</span> {fieldErrors.category_id && `— ${fieldErrors.category_id}`}</label>
                                  <div style={{ position: 'relative' }}>
                                    <input
                                      type="text"
                                      value={categorySearch}
                                      onChange={e => setCategorySearch(e.target.value)}
                                      placeholder="Search categories…"
                                      style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                    <select
                                      value={newProduct.category_id}
                                      onChange={e => {
                                        const catId = e.target.value;
                                        setNewProduct({ ...newProduct, category_id: catId, sub_category_id: '' });
                                        setFieldErrors({ ...fieldErrors, category_id: null });
                                        setCategorySearch('');
                                      }}
                                      className={fieldErrors.category_id ? 'form-error-input' : ''}
                                      size={Math.min(6, categories.filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())).length + 1)}
                                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0 0 10px 10px', border: '1px solid #e2e8f0', borderTop: 'none', backgroundColor: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                    >
                                      <option value="">Select Category</option>
                                      {categories
                                        .filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                        .map(cat => (
                                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))
                                      }
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: '#64748b', letterSpacing: '0.05em' }}>Sub Category <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>(optional)</span></label>
                                  <select
                                    value={newProduct.sub_category_id}
                                    onChange={e => setNewProduct({ ...newProduct, sub_category_id: e.target.value })}
                                    disabled={!newProduct.category_id}
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: newProduct.category_id ? 'white' : '#f8fafc', fontSize: '0.9rem', color: newProduct.category_id ? '#1b2d2a' : '#94a3b8', cursor: newProduct.category_id ? 'pointer' : 'not-allowed' }}
                                  >
                                    <option value="">{newProduct.category_id ? 'Select Sub Category' : 'Select a category first'}</option>
                                    {categories.find(c => String(c.id) === String(newProduct.category_id))?.subcategories?.map(sub => (
                                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.85rem', color: '#64748b', letterSpacing: '0.05em' }}>Region of Origin</label>
                                  <input value={newProduct.origin} onChange={e => setNewProduct({ ...newProduct, origin: e.target.value })} placeholder="e.g. Southeast Asia" style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                                </div>
                              </div>
                            </div>

                            {/* Botanical Mandate Sidebar — range selectors */}
                            <div style={{ padding: '2.5rem', backgroundColor: '#fcfdfc', borderRadius: '24px', border: '1px solid #edf2ed', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.4rem', color: '#1b2d2a', letterSpacing: '0.05em' }}>Botanical Mandate</label>
                                <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '1.25rem', marginTop: 0 }}>Set a range if the plant suits multiple levels (e.g. Easy → Medium)</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                                  {/* Care Level */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Care Level</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
                                      <select value={newProduct.care_level} onChange={e => setNewProduct({ ...newProduct, care_level: e.target.value })} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', backgroundColor: 'white' }}>
                                        <option>Easy</option><option>Medium</option><option>Advanced</option>
                                      </select>
                                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>→</span>
                                      <select value={newProduct.care_level_max} onChange={e => setNewProduct({ ...newProduct, care_level_max: e.target.value })} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', backgroundColor: 'white' }}>
                                        <option>Easy</option><option>Medium</option><option>Advanced</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Light Intensity */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Light Intensity</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
                                      <select value={newProduct.light_requirements} onChange={e => setNewProduct({ ...newProduct, light_requirements: e.target.value })} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', backgroundColor: 'white' }}>
                                        <option>Low</option><option>Medium</option><option>High</option>
                                      </select>
                                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>→</span>
                                      <select value={newProduct.light_requirements_max} onChange={e => setNewProduct({ ...newProduct, light_requirements_max: e.target.value })} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', backgroundColor: 'white' }}>
                                        <option>Low</option><option>Medium</option><option>High</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Growth Rate */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Growth Rate</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
                                      <select value={newProduct.growth_rate} onChange={e => setNewProduct({ ...newProduct, growth_rate: e.target.value })} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', backgroundColor: 'white' }}>
                                        <option>Slow</option><option>Moderate</option><option>Fast</option>
                                      </select>
                                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>→</span>
                                      <select value={newProduct.growth_rate_max} onChange={e => setNewProduct({ ...newProduct, growth_rate_max: e.target.value })} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', backgroundColor: 'white' }}>
                                        <option>Slow</option><option>Moderate</option><option>Fast</option>
                                      </select>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Variant Options */}
                        <div style={{ backgroundColor: 'white', padding: isMobile ? '2rem 1.5rem' : '3rem', borderRadius: '32px', border: '1px solid #edf2ed', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', color: '#1b2d2a', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                              <Box size={18} color="#10b981" /> Inventory Variants
                            </h4>
                            <button
                              type="button"
                              onClick={() => setNewProduct(prev => ({ ...prev, variants: [...prev.variants, { name: '', variant_type: 'Plant', base_price: '', gst_rate: '0', commission_rate: '10.0', price: '', stock: '', item_category: 'light', packed_weight_grams: '', length: '10', width: '10', height: '10' }] }))}
                              style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#fcfdfc', border: '1px solid #edf2ed', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1b2d2a' }}
                            >
                              <Plus size={16} /> ADD VARIATION
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            {newProduct.variants.map((v, idx) => (
                              <div key={idx} style={{ padding: isMobile ? '1.5rem' : '2.5rem', backgroundColor: '#fcfdfc', borderRadius: '24px', border: '1px solid #edf2ed', position: 'relative' }}>
                                {newProduct.variants.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setNewProduct(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))}
                                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', fontWeight: 900 }}
                                  >
                                    <X size={14} /> REMOVE
                                  </button>
                                )}

                                {/* Variant type + name + stock */}
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                  {/* Variant Type */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.75rem', color: '#64748b' }}>Variant Type <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select
                                      value={v.variant_type}
                                      onChange={e => {
                                        const updated = [...newProduct.variants];
                                        updated[idx].variant_type = e.target.value;
                                        setNewProduct({ ...newProduct, variants: updated });
                                      }}
                                      style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', backgroundColor: 'white' }}
                                    >
                                      {['Plant', 'Rhizome', 'Pot', 'Clump', 'Tissue Culture', 'Cutting', 'Bunch', 'Mat', 'Cup', 'Emersed', 'Submerged', 'Seedling', 'Bulb', 'Corm', 'Dry Start', 'Colony', 'Pair', 'Trio', 'Other'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                      ))}
                                    </select>
                                  </div>
                                  {/* Variant Label (optional size/descriptor) */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.75rem', color: fieldErrors[`variant_${idx}_name`] ? '#ef4444' : '#64748b' }}>
                                      Size / Label <span style={{ color: '#94a3b8', fontWeight: 600, textTransform: 'none' }}>(optional)</span>
                                    </label>
                                    <input
                                      value={v.name}
                                      onChange={e => {
                                        const updated = [...newProduct.variants];
                                        updated[idx].name = e.target.value;
                                        setNewProduct({ ...newProduct, variants: updated });
                                      }}
                                      placeholder="e.g. Small / 5cm / XL"
                                      style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                    />
                                  </div>
                                  {/* Stock */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.75rem', color: fieldErrors[`variant_${idx}_stock`] ? '#ef4444' : '#64748b' }}>Stock <span style={{ color: '#ef4444' }}>*</span> {fieldErrors[`variant_${idx}_stock`] && `— ${fieldErrors[`variant_${idx}_stock`]}`}</label>
                                    <input
                                      type="number"
                                      value={v.stock}
                                      onChange={e => {
                                        const updated = [...newProduct.variants];
                                        updated[idx].stock = e.target.value;
                                        setNewProduct({ ...newProduct, variants: updated });
                                        setFieldErrors({ ...fieldErrors, [`variant_${idx}_stock`]: null });
                                      }}
                                      placeholder="0"
                                      className={fieldErrors[`variant_${idx}_stock`] ? 'form-error-input' : ''}
                                      style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                    />
                                  </div>
                                </div>

                                {/* Pricing — seller enters their price, we show payout after commission */}
                                <div style={{ padding: isMobile ? '1.25rem' : '2rem', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #edf2ed', marginBottom: '2.5rem' }}>
                                  <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem', color: fieldErrors[`variant_${idx}_base_price`] ? '#ef4444' : '#64748b' }}>
                                    Your Listed Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                                    {fieldErrors[`variant_${idx}_base_price`] && ` — ${fieldErrors[`variant_${idx}_base_price`]}`}
                                  </label>
                                  <p style={{ fontSize: '0.6rem', color: '#94a3b8', margin: '0 0 0.6rem', fontWeight: 500 }}>Set the price you want your product listed at.</p>
                                  <input
                                    type="number"
                                    value={v.base_price}
                                    onChange={e => {
                                      const updated = [...newProduct.variants];
                                      updated[idx].base_price = e.target.value;
                                      setNewProduct({ ...newProduct, variants: updated });
                                      setFieldErrors({ ...fieldErrors, [`variant_${idx}_base_price`]: null });
                                    }}
                                    placeholder="e.g. 450"
                                    className={fieldErrors[`variant_${idx}_base_price`] ? 'form-error-input' : ''}
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', marginBottom: '1.25rem' }}
                                  />

                                  {/* Payout breakdown */}
                                  {parseFloat(v.base_price) > 0 && (() => {
                                    const listed = parseFloat(v.base_price) || 0;
                                    const commission = listed * 0.10;
                                    const payout = listed - commission;
                                    return (
                                      <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px dashed #e2e8f0' }}>
                                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Listed price</span>
                                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1b2d2a' }}>₹{listed.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px dashed #e2e8f0' }}>
                                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Platform fee (10%)</span>
                                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>−₹{commission.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', backgroundColor: '#f0fdf4' }}>
                                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>You receive</span>
                                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>₹{payout.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Shipping fields */}
                                <div style={{ borderTop: '1px dashed #edf2ed', paddingTop: '1.5rem' }}>
                                  <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '1.25rem' }}>Shipping Details</p>

                                  {/* Item category */}
                                  <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, marginBottom: '0.6rem', color: '#94a3b8' }}>ITEM CATEGORY <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select
                                      value={v.item_category}
                                      onChange={e => {
                                        const updated = [...newProduct.variants];
                                        updated[idx].item_category = e.target.value;
                                        setNewProduct({ ...newProduct, variants: updated });
                                      }}
                                      style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', backgroundColor: 'white' }}
                                    >
                                      <option value="light">Light Item — Plants, Moss, Tissue Cultures, Isopods, Accessories</option>
                                      <option value="heavy">Heavy Item — Rocks, Substrate, Driftwood, Hardscape, Soil Bags</option>
                                    </select>
                                  </div>

                                  {/* Packed weight + box dims */}
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '1.5rem' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, marginBottom: '0.6rem', color: fieldErrors[`variant_${idx}_packed_weight_grams`] ? '#ef4444' : '#94a3b8' }}>
                                        PACKED WEIGHT (g) <span style={{ color: '#ef4444' }}>*</span>
                                        {fieldErrors[`variant_${idx}_packed_weight_grams`] && ` — ${fieldErrors[`variant_${idx}_packed_weight_grams`]}`}
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="30000"
                                        step="1"
                                        placeholder="e.g. 350"
                                        value={v.packed_weight_grams}
                                        onChange={e => {
                                          const updated = [...newProduct.variants];
                                          updated[idx].packed_weight_grams = e.target.value;
                                          setNewProduct({ ...newProduct, variants: updated });
                                          setFieldErrors({ ...fieldErrors, [`variant_${idx}_packed_weight_grams`]: null });
                                        }}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: `1px solid ${fieldErrors[`variant_${idx}_packed_weight_grams`] ? '#ef4444' : '#e2e8f0'}`, fontSize: '0.9rem' }}
                                      />
                                    </div>
                                    {[
                                      { label: 'BOX LENGTH (CM)', key: 'length' },
                                      { label: 'BOX BREADTH (CM)', key: 'width' },
                                      { label: 'BOX HEIGHT (CM)', key: 'height' },
                                    ].map(field => (
                                      <div key={field.key}>
                                        <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, marginBottom: '0.6rem', color: fieldErrors[`variant_${idx}_${field.key}`] ? '#ef4444' : '#94a3b8' }}>{field.label} <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                          type="number"
                                          min="1"
                                          step="1"
                                          value={v[field.key]}
                                          onChange={e => {
                                            const updated = [...newProduct.variants];
                                            updated[idx][field.key] = e.target.value;
                                            setNewProduct({ ...newProduct, variants: updated });
                                            setFieldErrors({ ...fieldErrors, [`variant_${idx}_${field.key}`]: null });
                                          }}
                                          className={fieldErrors[`variant_${idx}_${field.key}`] ? 'form-error-input' : ''}
                                          style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: `1px solid ${fieldErrors[`variant_${idx}_${field.key}`] ? '#ef4444' : '#e2e8f0'}`, fontSize: '0.9rem' }}
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  {/* Chargeable weight preview */}
                                  {v.packed_weight_grams && (
                                    <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                                      Volumetric weight:{' '}
                                      <strong>
                                        {Math.round((parseFloat(v.length || 10) * parseFloat(v.width || 10) * parseFloat(v.height || 10) / 5000) * 1000)}g
                                      </strong>
                                      {' · '}Chargeable weight:{' '}
                                      <strong style={{ color: '#1b2d2a' }}>
                                        {Math.max(parseInt(v.packed_weight_grams) || 0, Math.round((parseFloat(v.length || 10) * parseFloat(v.width || 10) * parseFloat(v.height || 10) / 5000) * 1000))}g
                                      </strong>
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>


                        {/* Section 4: Imagery & Content */}
                        <div style={{ backgroundColor: 'white', padding: isMobile ? '2rem 1.5rem' : '3rem', borderRadius: '32px', border: '1px solid #edf2ed', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: fieldErrors.images ? '1rem' : '2.5rem', color: '#1b2d2a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Camera size={18} color="#10b981" /> Imagery & Content <span style={{ color: '#ef4444' }}>*</span>
                          </h4>
                          {fieldErrors.images && (
                            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <AlertCircle size={14} /> {fieldErrors.images}
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.25rem', color: fieldErrors.description ? '#ef4444' : '#64748b', letterSpacing: '0.05em' }}>Specimen Description <span style={{ color: '#ef4444' }}>*</span> {fieldErrors.description && `— ${fieldErrors.description}`}</label>
                              <textarea rows="6" value={newProduct.description} onChange={e => { setNewProduct({ ...newProduct, description: e.target.value }); setFieldErrors({ ...fieldErrors, description: null }); }} placeholder="Detail the specimen's health, coloration, and acclimation history..." className={fieldErrors.description ? 'form-error-input' : ''} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', resize: 'none', fontSize: '0.95rem', lineHeight: '1.5', color: '#1b2d2a' }} />
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

                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                                {newProduct.images.map((img, idx) => (
                                  <div key={idx} style={{ padding: isMobile ? '1.5rem' : '2rem', borderRadius: '28px', border: '1px solid #edf2ed', backgroundColor: '#fcfdfc', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1.5rem' : '2rem', position: 'relative', transition: 'all 0.2s' }}>
                                    <div style={{ width: '140px', height: '140px', borderRadius: '20px', border: '2px dashed #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                      {img.image_url ? (
                                        <img src={getImageUrl(img.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                            <option key={i} value={v.id || i}>{v.name || `Variant ${i + 1}`}</option>
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
                  <div style={{ padding: isMobile ? '0.6rem 0.75rem' : '1rem 3rem', borderTop: '1px solid #edf2ed', backgroundColor: 'white', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {!isMobile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: editingProduct ? '#10b981' : '#3b82f6' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                          {editingProduct ? 'EDITING' : 'NEW SPECIMEN'}
                        </span>
                      </div>
                    )}

                    {/* All action buttons in one compact row */}
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', flex: isMobile ? 1 : 'none' }}>
                      {/* Discard */}
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        style={{ padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1.1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#94a3b8', fontSize: isMobile ? '0.7rem' : '0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        Discard
                      </button>

                      {/* Draft — only for new products */}
                      {!editingProduct && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleAddProduct(null, false, true)}
                          style={{ padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1.1rem', background: '#fffbeb', border: '1.5px solid #f59e0b', color: '#92400e', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1, fontSize: isMobile ? '0.7rem' : '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          <FileText size={13} /> Draft
                        </button>
                      )}

                      {/* Save & Add Another — desktop only */}
                      {!editingProduct && !isMobile && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleAddProduct(null, true)}
                          style={{ padding: '0.7rem 1.1rem', background: '#f8faf9', border: '1px solid #1b2d2a', color: '#1b2d2a', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          + Add Another
                        </button>
                      )}

                      {/* Primary action */}
                      <button
                        type="submit"
                        form="product-form"
                        disabled={saving}
                        style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1.75rem', backgroundColor: '#1b2d2a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(27,45,42,0.2)', fontSize: isMobile ? '0.75rem' : '0.8rem', whiteSpace: 'nowrap' }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Launch'}
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

        <ItemizedInvoiceModal
          isOpen={showItemizedInvoice}
          onClose={() => setShowItemizedInvoice(false)}
          data={gstData}
          month={selectedGstMonth}
        />
      </DashboardErrorBoundary>
    );
  }
