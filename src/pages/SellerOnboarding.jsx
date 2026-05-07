import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Leaf,
  MapPin,
  CreditCard,
  PackagePlus,
  Globe,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Camera,
  Store,
  Palette,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { ProductService } from '../services/ProductService';
import SellerOnboardingPreview from '../components/SellerOnboardingPreview';
import { useAuth } from '../context/AuthContext';

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const [isApproved, setIsApproved] = useState(null);
  const [checkedEmail, setCheckedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(null);

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('junglyst_onboarding_draft');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse onboarding draft', e);
    }
    return {
      storeName: '',
      tagline: '',
      description: '',
      location: 'Karnataka, India',
      brandColor: '#0A3029',
      logoUrl: '',
      iconUrl: '',
      bannerUrl: '',
      taxId: '',
      payoutBank: '',
      firstProductName: '',
      firstProductPrice: '',
      firstProductStock: '',
      firstProductWeight: '',
      firstProductCategoryId: '',
      firstProductSubCategoryId: '',
      logoName: '',
      iconName: '',
      bannerName: ''
    };
  });

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('junglyst_onboarding_step');
    const parsed = parseInt(saved, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 1;
  });

  // 1. Auth & Approval Protection
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/login?redirect=/seller/onboarding');
        return;
      }

      try {
        const res = await api.get('/sellers/check-approval/');
        setIsApproved(res.data.is_approved);
        setCheckedEmail(res.data.email_checked);
        console.log("Approval check result:", res.data);
      } catch (error) {
        setIsApproved(false);
      }
    };
    checkAccess();
  }, [user, navigate]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await ProductService.getCategories();
        setCategories(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    localStorage.setItem('junglyst_onboarding_draft', JSON.stringify(formData));
    localStorage.setItem('junglyst_onboarding_step', currentStep.toString());
  }, [formData, currentStep]);

  if (isApproved === false) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfdfc', padding: '2rem' }}>
        <div style={{ maxWidth: '500px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
          <div style={{ backgroundColor: '#fff5f5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: '#ef4444' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'serif', marginBottom: '1.5rem' }}>Access Denied</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            The account <strong>{checkedEmail || user?.email}</strong> is not in our master curator registry.
          </p>
          <p style={{ color: '#64748b', marginBottom: '3rem', fontSize: '0.9rem' }}>
            We currently only onboard growers who have been pre-screened for botanical excellence. Please contact the administrator to have this email whitelisted.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/')} style={{ padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer' }}>Back to Shop</button>
            <button onClick={() => window.location.reload()} style={{ padding: '1rem 2rem', borderRadius: '12px', background: '#0A3029', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Retry Check</button>
          </div>
        </div>
      </div>
    );
  }

  if (isApproved === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #edf2ed', borderTopColor: '#0A3029', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const presets = [
    // Botanical Greens
    { name: 'Deep Forest', color: '#0A3029' },
    { name: 'Moss Green', color: '#4E6B4E' },
    { name: 'Emerald', color: '#065F46' },
    { name: 'Sage', color: '#8BA18E' },
    { name: 'Olive', color: '#556B2F' },
    // Earthy Tones
    { name: 'Terracotta', color: '#A45D41' },
    { name: 'Clay', color: '#7E5A50' },
    { name: 'Burnt Sienna', color: '#9B4722' },
    { name: 'Silt', color: '#4A3728' },
    { name: 'Sandstone', color: '#C2B280' },
    // Exotic Florals
    { name: 'Dusk Purple', color: '#4A3B4E' },
    { name: 'Orchid', color: '#9D6B81' },
    { name: 'Hibiscus', color: '#B91C1C' },
    { name: 'Saffron', color: '#EAB308' },
    { name: 'Golden Sands', color: '#D4A373' },
    // Aquatic & Sky
    { name: 'Ocean Depth', color: '#1B2D3A' },
    { name: 'Teal', color: '#134E4A' },
    { name: 'Morning Mist', color: '#94A3B8' },
    { name: 'Deep Sea', color: '#0F172A' },
    { name: 'Midnight', color: '#1E293B' },
    // Neutrals
    { name: 'Charcoal', color: '#374151' },
    { name: 'Slate', color: '#475569' },
    { name: 'Cocoa', color: '#3F2E2E' },
    { name: 'Ink', color: '#020617' }
  ];

  const validateStep = () => {
    switch (currentStep) {
      case 2:
        return formData.storeName.trim().length >= 3;
      case 3:
        return formData.brandColor && formData.logoUrl;
      case 4:
        return formData.description.trim().length >= 10;
      case 5:
        return formData.taxId.trim().length >= 5 && formData.payoutBank.trim().length >= 5;
      case 6:
        return formData.firstProductName && formData.firstProductPrice > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setError(null);
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else {
      setError("Please complete all required fields for this step before continuing.");
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'firstProductCategoryId') {
      setFormData(prev => ({ ...prev, [name]: value, firstProductSubCategoryId: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset target value so selecting the same file again triggers onChange
    e.target.value = '';

    const nameKey = { logo: 'logoName', icon: 'iconName', banner: 'bannerName' }[type] || 'logoName';
    const urlKey  = { logo: 'logoUrl',  icon: 'iconUrl',  banner: 'bannerUrl'  }[type] || 'logoUrl';
    setFormData(prev => ({ ...prev, [nameKey]: file.name }));
    setUploading(type);
    try {
      const url = await ProductService.uploadImage(file, type);
      setFormData(prev => ({ ...prev, [urlKey]: url }));
      setError(null);
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      setFormData(prev => ({ ...prev, [nameKey]: '' }));
    } finally {
      setUploading(null);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Create/Update the seller profile
      const response = await api.post('/sellers/dashboard/', {
        store_name: formData.storeName,
        expertise: formData.tagline,
        bio: formData.description,
        location_city: formData.location,
        brand_color: formData.brandColor,
        logo_url: formData.logoUrl,
        icon_url: formData.iconUrl,
        banner_url: formData.bannerUrl
      });

      // Update global user state with new role (returned from backend)
      if (response.data.user) {
        updateUser(response.data.user);
      }

      // 2. Create the first product if name is provided
      if (formData.firstProductName) {
        await ProductService.createProduct({
          name: formData.firstProductName,
          price: formData.firstProductPrice,
          stock: formData.firstProductStock,
          weight: formData.firstProductWeight || 0.5,
          description: "Initial specimen listing during onboarding.",
          category_id: formData.firstProductCategoryId,
          sub_category_id: formData.firstProductSubCategoryId
        });
      }

      // 3. Clear drafts after success
      localStorage.removeItem('junglyst_onboarding_draft');
      localStorage.removeItem('junglyst_onboarding_step');

      navigate('/seller/dashboard');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Failed to complete onboarding. Please check your details.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Welcome', icon: <Leaf size={16} /> },
    { id: 2, title: 'Identity', icon: <Store size={16} /> },
    { id: 3, title: 'Branding', icon: <Palette size={16} /> },
    { id: 4, title: 'Logistics', icon: <MapPin size={16} /> },
    { id: 5, title: 'Compliance', icon: <ShieldCheck size={16} /> },
    { id: 6, title: 'First Listing', icon: <PackagePlus size={16} /> }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fcfdfc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* Dynamic Header */}
      <header style={{
        padding: '1.5rem 4rem',
        borderBottom: '1px solid #edf2ed',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: formData.brandColor, padding: '0.5rem', borderRadius: '8px', color: 'white', transition: 'background-color 0.3s' }}>
            <Leaf size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontFamily: 'serif', color: '#0A3029', margin: 0 }}>Junglyst</h1>
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E5C48B', fontWeight: 700 }}>Grower Sanctuary</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          {steps.map(step => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep >= step.id ? 1 : 0.3, transition: 'opacity 0.3s' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                backgroundColor: currentStep >= step.id ? formData.brandColor : '#e5e7eb',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                transition: 'background-color 0.3s'
              }}>
                {currentStep > step.id ? <CheckCircle2 size={14} /> : step.id}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1a2f1a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.title}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content Layout */}
      <main style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: currentStep > 1 ? '1.2fr 1fr' : '1fr', gap: '4rem', padding: '4rem' }}>

        {/* Form Column */}
        <div style={{ maxWidth: '700px', justifySelf: 'center', width: '100%' }}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '1.25rem',
              borderRadius: '16px',
              fontSize: '0.9rem',
              marginBottom: '2.5rem',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <h2 style={{ fontSize: '3.5rem', fontFamily: 'serif', color: '#0A3029', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                Cultivate Your <br /><i style={{ fontWeight: 400 }}>Digital Sanctuary</i>.
              </h2>
              <p style={{ fontSize: '1.25rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '3rem' }}>
                Join the most exclusive community of botanical artisans. We provide the tools; you provide the beauty.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '4rem' }}>
                <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #edf2ed' }}>
                  <Globe size={24} color="#E5C48B" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pan-India Logistics</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Integrated Nimbuspost fulfillment for all your specimens.</p>
                </div>
                <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #edf2ed' }}>
                  <ShieldCheck size={24} color="#E5C48B" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Verified Status</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Command premium prices with the Junglyst Seal of Purity.</p>
                </div>
              </div>
              <button onClick={nextStep} style={{ backgroundColor: '#0A3029', color: 'white', border: 'none', borderRadius: '12px', padding: '1.25rem 3rem', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                Begin My Onboarding <ArrowRight size={20} />
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'serif', color: '#0A3029', marginBottom: '0.5rem' }}>Identity</h2>
                <p style={{ color: '#6b7280' }}>How should the community know your botanical studio?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Studio Name <span style={{ color: '#ef4444' }}>*</span></span>
                    <span style={{ color: formData.storeName.trim().length < 3 ? '#ef4444' : '#10b981', fontSize: '0.7rem' }}>
                      {formData.storeName.trim().length}/3 min
                    </span>
                  </label>
                  <input name="storeName" value={formData.storeName} onChange={handleInputChange} placeholder="e.g. Rare Greens Nursery" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: formData.storeName.trim().length > 0 && formData.storeName.trim().length < 3 ? '1px solid #fecaca' : '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                  {formData.storeName.trim().length > 0 && formData.storeName.trim().length < 3 && (
                    <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.5rem', fontWeight: 600 }}>Name must be at least 3 characters.</p>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signature Tagline</label>
                  <input name="tagline" value={formData.tagline} onChange={handleInputChange} placeholder="e.g. Master Growers of Rare Araceae" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'serif', color: '#0A3029', marginBottom: '0.5rem' }}>Branding</h2>
                <p style={{ color: '#6b7280' }}>Customize the visual aesthetic of your studio.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '1.25rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sanctuary Theme Color <span style={{ color: '#ef4444' }}>*</span></label>

                  {/* Presets Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                    {presets.map(p => (
                      <button
                        key={p.color}
                        onClick={() => setFormData(prev => ({ ...prev, brandColor: p.color }))}
                        title={p.name}
                        style={{
                          height: '40px',
                          width: '40px',
                          backgroundColor: p.color,
                          border: formData.brandColor === p.color ? '3px solid #E5C48B' : '1px solid rgba(0,0,0,0.05)',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          transform: formData.brandColor === p.color ? 'scale(1.15)' : 'scale(1)',
                          boxShadow: formData.brandColor === p.color ? '0 8px 16px rgba(0,0,0,0.2)' : 'none'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      <input
                        type="color"
                        name="brandColor"
                        value={formData.brandColor}
                        onChange={handleInputChange}
                        style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px', cursor: 'pointer', position: 'absolute', inset: 0, opacity: 0 }}
                      />
                      <div style={{ width: '100%', height: '100%', backgroundColor: formData.brandColor, borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Palette size={20} color="white" style={{ mixBlendMode: 'difference' }} />
                      </div>
                    </div>
                    <div style={{ flexGrow: 1, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' }}>#</span>
                      <input
                        type="text"
                        name="brandColor"
                        value={formData.brandColor.replace('#', '')}
                        onChange={(e) => setFormData(prev => ({ ...prev, brandColor: '#' + e.target.value }))}
                        style={{ width: '100%', padding: '1.125rem 1.125rem 1.125rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', fontFamily: 'monospace', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                  {[
                    { type: 'logo',   label: 'Brand Logo',    hint: 'Full logo (rect/square)',  required: true,  urlKey: 'logoUrl',   nameKey: 'logoName'  },
                    { type: 'icon',   label: 'Store Icon',    hint: 'Small square mark / app icon', required: false, urlKey: 'iconUrl',   nameKey: 'iconName'  },
                    { type: 'banner', label: 'Store Banner',  hint: 'Wide header image',        required: false, urlKey: 'bannerUrl', nameKey: 'bannerName' },
                  ].map(({ type, label, hint, required, urlKey, nameKey }) => (
                    <div key={type}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <span>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</span>
                        {required && !formData[urlKey] && <span style={{ color: '#ef4444', fontSize: '0.65rem', fontWeight: 600 }}>Required</span>}
                      </label>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0 0 0.6rem', lineHeight: 1.4 }}>{hint}</p>
                      <input type="file" accept="image/*" id={`${type}-upload`} style={{ display: 'none' }} onChange={e => handleImageUpload(e, type)} />
                      <label htmlFor={`${type}-upload`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '110px', border: uploading === type ? '2px solid #E5C48B' : formData[urlKey] ? '2px solid #10b981' : '2px dashed #e2e8f0', borderRadius: '16px', cursor: 'pointer', backgroundColor: '#fcfdfc', transition: 'all 0.3s', gap: '0.4rem' }}>
                        {uploading === type ? <Loader2 className="animate-spin" color="#E5C48B" /> : formData[urlKey] ? <CheckCircle2 size={22} color="#10b981" /> : <Upload size={20} color="#94a3b8" />}
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: formData[urlKey] ? '#10b981' : '#94a3b8', textAlign: 'center', padding: '0 0.5rem' }}>
                          {uploading === type ? 'Uploading…' : formData[nameKey] || `Select ${label}`}
                        </span>
                        {formData[urlKey] && <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>UPLOADED ✓</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'serif', color: '#0A3029', marginBottom: '0.5rem' }}>Logistics</h2>
                <p style={{ color: '#6b7280' }}>Where will you ship your masterpieces from?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatch Origin</label>
                  <select name="location" value={formData.location} onChange={handleInputChange} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', appearance: 'none', backgroundColor: 'white' }}>
                    <option>Karnataka, India</option>
                    <option>Kerala, India</option>
                    <option>Maharashtra, India</option>
                    <option>Tamil Nadu, India</option>
                    <option>West Bengal, India</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Studio Philosophy <span style={{ color: '#ef4444' }}>*</span></span>
                    <span style={{ color: formData.description.length < 10 ? '#ef4444' : '#10b981', fontSize: '0.7rem' }}>
                      {formData.description.length}/10 min
                    </span>
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    rows="4" 
                    placeholder="Describe your cultivation methods and commitment to specimen purity..." 
                    style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: formData.description.length > 0 && formData.description.length < 10 ? '1px solid #fecaca' : '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', resize: 'none', backgroundColor: formData.description.length > 0 && formData.description.length < 10 ? '#fffefc' : 'white' }} 
                  />
                  {formData.description.length > 0 && formData.description.length < 10 && (
                    <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.5rem', fontWeight: 600 }}>Please share a bit more about your studio (at least 10 characters).</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'serif', color: '#0A3029', marginBottom: '0.5rem' }}>Compliance</h2>
                <p style={{ color: '#6b7280' }}>Finalize your business verification for the sanctuary.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax Identification (GST/PAN) <span style={{ color: '#ef4444' }}>*</span></span>
                    <span style={{ color: formData.taxId.trim().length < 5 ? '#ef4444' : '#10b981', fontSize: '0.7rem' }}>
                      {formData.taxId.trim().length}/5 min
                    </span>
                  </label>
                  <input name="taxId" value={formData.taxId} onChange={handleInputChange} placeholder="Enter your business tax ID" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: formData.taxId.trim().length > 0 && formData.taxId.trim().length < 5 ? '1px solid #fecaca' : '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Payout Account <span style={{ color: '#ef4444' }}>*</span></span>
                    <span style={{ color: formData.payoutBank.trim().length < 5 ? '#ef4444' : '#10b981', fontSize: '0.7rem' }}>
                      {formData.payoutBank.trim().length}/5 min
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <CreditCard size={18} style={{ position: 'absolute', left: '1.125rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input name="payoutBank" value={formData.payoutBank} onChange={handleInputChange} placeholder="UPI ID or Bank Account" style={{ width: '100%', padding: '1.125rem 1.125rem 1.125rem 3.5rem', borderRadius: '12px', border: formData.payoutBank.trim().length > 0 && formData.payoutBank.trim().length < 5 ? '1px solid #fecaca' : '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'serif', color: '#0A3029', marginBottom: '0.5rem' }}>Launch Specimen</h2>
                <p style={{ color: '#6b7280' }}>Ready to list your first masterpiece?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Specimen Name <span style={{ color: '#ef4444' }}>*</span></span>
                    {!formData.firstProductName && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Required</span>}
                  </label>
                  <input name="firstProductName" value={formData.firstProductName} onChange={handleInputChange} placeholder="e.g. Monstera Albo Variegata" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: !formData.firstProductName ? '1px solid #e2e8f0' : '1px solid #10b981', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Launch Price (₹) <span style={{ color: '#ef4444' }}>*</span></span>
                      {(!formData.firstProductPrice || formData.firstProductPrice <= 0) && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Must be {'>'} 0</span>}
                    </label>
                    <input name="firstProductPrice" type="number" value={formData.firstProductPrice} onChange={handleInputChange} placeholder="4999" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: (!formData.firstProductPrice || formData.firstProductPrice <= 0) ? '1px solid #e2e8f0' : '1px solid #10b981', fontSize: '1rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</label>
                    <input name="firstProductStock" type="number" value={formData.firstProductStock} onChange={handleInputChange} placeholder="5" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marketplace Category</label>
                  <select name="firstProductCategoryId" value={formData.firstProductCategoryId} onChange={handleInputChange} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', appearance: 'none', backgroundColor: 'white' }}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {formData.firstProductCategoryId && (
                  <div style={{ animation: 'slideDown 0.3s ease' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sub Category</label>
                    <select name="firstProductSubCategoryId" value={formData.firstProductSubCategoryId} onChange={handleInputChange} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', appearance: 'none', backgroundColor: 'white' }}>
                      <option value="">Select Sub Category (Optional)</option>
                      {categories.find(c => String(c.id) === String(formData.firstProductCategoryId))?.subcategories?.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nav Controls */}
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {currentStep > 1 ? (
              <button onClick={prevStep} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700 }}>
                <ArrowLeft size={18} /> BACK
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '1rem' }}>
              {currentStep < 6 ? (
                <button onClick={nextStep} style={{ backgroundColor: formData.brandColor, color: 'white', border: 'none', borderRadius: '12px', padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background-color 0.3s' }}>
                  CONTINUE <ArrowRight size={18} />
                </button>
              ) : (
                <button onClick={handleCompleteOnboarding} disabled={loading} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', padding: '1rem 3rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                  {loading ? 'PLANTING...' : 'LAUNCH SANCTUARY'} <CheckCircle2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        {currentStep > 1 && (
          <div style={{ position: 'sticky', top: '8rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E5C48B' }}>Live Sanctuary Preview</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              </div>
            </div>
            <div style={{ height: '600px', width: '100%' }}>
              <SellerOnboardingPreview formData={formData} />
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
              This is how your studio will appear to collectors.
            </p>
          </div>
        )}

      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
