import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Leaf,
  MapPin,
  CreditCard,
  Globe,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
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
  const [isApproved, setIsApproved] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(null);

  const defaultFormData = {
    storeName: '',
    tagline: '',
    description: '',
    location: 'Karnataka, India',
    brandColor: '#0A3029',
    logoUrl: '',
    iconUrl: '',
    bannerUrl: '',
    taxId: '',
    payoutType: 'upi',
    payoutBank: '',
    ifscCode: '',
    logoName: '',
    iconName: '',
    bannerName: ''
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);

  // 1. Auth & Approval Protection — load user-scoped draft after user is confirmed
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/login?redirect=/seller/onboarding');
        return;
      }

      try {
        const res = await api.get('/sellers/check-approval/');
        if (!res.data.is_approved) {
          navigate('/');
          return;
        }
        setIsApproved(true);
        setCheckedEmail(res.data.email_checked);

        // Load this user's saved draft (keyed by user id so sellers don't share drafts)
        const draftKey = `junglyst_onboarding_draft_${user.id}`;
        const stepKey = `junglyst_onboarding_step_${user.id}`;
        try {
          const saved = localStorage.getItem(draftKey);
          if (saved && saved !== 'undefined' && saved !== 'null') {
            setFormData(JSON.parse(saved));
          }
        } catch (e) {
          console.error('Failed to parse onboarding draft', e);
        }
        const savedStep = parseInt(localStorage.getItem(stepKey), 10);
        if (!isNaN(savedStep) && savedStep > 0) setCurrentStep(savedStep);
      } catch (error) {
        navigate('/');
      }
    };
    checkAccess();
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !isApproved) return;
    const draftKey = `junglyst_onboarding_draft_${user.id}`;
    const stepKey = `junglyst_onboarding_step_${user.id}`;
    localStorage.setItem(draftKey, JSON.stringify(formData));
    localStorage.setItem(stepKey, currentStep.toString());
  }, [formData, currentStep, user, isApproved]);

  if (!isApproved) {
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
      case 5: {
        const taxOk = formData.taxId.trim().length >= 5;
        const payoutOk = formData.payoutBank.trim().length >= 5;
        const ifscOk = formData.payoutType === 'bank' ? formData.ifscCode.trim().length === 11 : true;
        return taxOk && payoutOk && ifscOk;
      }
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setError(null);
      setCurrentStep(prev => Math.min(prev + 1, 5));
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
      const response = await api.post('/sellers/dashboard/', {
        store_name: formData.storeName,
        expertise: formData.tagline,
        bio: formData.description,
        location_city: formData.location,
        brand_color: formData.brandColor,
        logo_url: formData.logoUrl,
        icon_url: formData.iconUrl,
        banner_url: formData.bannerUrl,
        tax_id: formData.taxId,
        payout_type: formData.payoutType,
        payout_account: formData.payoutBank,
        ifsc_code: formData.payoutType === 'bank' ? formData.ifscCode : '',
      });

      if (response.data.user) {
        updateUser(response.data.user);
      }

      localStorage.removeItem(`junglyst_onboarding_draft_${user.id}`);
      localStorage.removeItem(`junglyst_onboarding_step_${user.id}`);

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
      <header className="onboarding-header" style={{
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
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E5C48B', fontWeight: 700 }}>Seller Onboarding</span>
          </div>
        </div>

        <div className="onboarding-steps" style={{ display: 'flex', gap: '2rem' }}>
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
              <span className="onboarding-step-label" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1a2f1a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.title}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content Layout */}
      <main style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: currentStep > 1 ? 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' : '1fr', gap: 'clamp(2rem,4vw,4rem)', padding: 'clamp(1.5rem,4vw,4rem)' }}>

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
                Cultivate Your <br /><i style={{ fontWeight: 400 }}>Digital Storefront</i>.
              </h2>
              <p style={{ fontSize: '1.25rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '3rem' }}>
                Join the most exclusive community of botanical artisans. We provide the tools; you provide the beauty.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
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
              <div className="branding-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #edf2ed' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '1.25rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Theme Color <span style={{ color: '#ef4444' }}>*</span></label>

                  {/* Presets Grid */}
                  <div className="color-presets-grid">
                    {presets.map(p => (
                      <button
                        key={p.color}
                        onClick={() => setFormData(prev => ({ ...prev, brandColor: p.color }))}
                        title={p.name}
                        className="color-swatch"
                        style={{
                          backgroundColor: p.color,
                          border: formData.brandColor === p.color ? '3px solid #E5C48B' : '1px solid rgba(0,0,0,0.05)',
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

                <div className="upload-grid">
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
                      <label htmlFor={`${type}-upload`} className="upload-box" style={{ border: uploading === type ? '2px solid #E5C48B' : formData[urlKey] ? '2px solid #10b981' : '2px dashed #e2e8f0' }}>
                        {uploading === type ? <Loader2 className="animate-spin" color="#E5C48B" /> : formData[urlKey] ? <CheckCircle2 size={22} color="#10b981" /> : <Upload size={20} color="#94a3b8" />}
                        <span className="upload-box-filename" style={{ color: formData[urlKey] ? '#10b981' : '#94a3b8' }}>
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
                <p style={{ color: '#6b7280' }}>Finalize your business verification.</p>
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
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Payout Account <span style={{ color: '#ef4444' }}>*</span>
                  </label>

                  {/* UPI / Bank toggle */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[{ value: 'upi', label: 'UPI ID' }, { value: 'bank', label: 'Bank Account' }].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, payoutType: opt.value, payoutBank: '', ifscCode: '' }))}
                        style={{
                          padding: '0.6rem 1.25rem',
                          borderRadius: '10px',
                          border: formData.payoutType === opt.value ? `2px solid #0A3029` : '2px solid #e2e8f0',
                          backgroundColor: formData.payoutType === opt.value ? '#0A3029' : 'white',
                          color: formData.payoutType === opt.value ? 'white' : '#6b7280',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* UPI field */}
                  {formData.payoutType === 'upi' && (
                    <div style={{ position: 'relative' }}>
                      <CreditCard size={18} style={{ position: 'absolute', left: '1.125rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        name="payoutBank"
                        value={formData.payoutBank}
                        onChange={handleInputChange}
                        placeholder="e.g. seller@upi"
                        style={{ width: '100%', padding: '1.125rem 1.125rem 1.125rem 3.5rem', borderRadius: '12px', border: formData.payoutBank.trim().length > 0 && formData.payoutBank.trim().length < 5 ? '1px solid #fecaca' : '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                      />
                    </div>
                  )}

                  {/* Bank Account + IFSC fields */}
                  {formData.payoutType === 'bank' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ position: 'relative' }}>
                        <CreditCard size={18} style={{ position: 'absolute', left: '1.125rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          name="payoutBank"
                          value={formData.payoutBank}
                          onChange={handleInputChange}
                          placeholder="Bank account number"
                          style={{ width: '100%', padding: '1.125rem 1.125rem 1.125rem 3.5rem', borderRadius: '12px', border: formData.payoutBank.trim().length > 0 && formData.payoutBank.trim().length < 5 ? '1px solid #fecaca' : '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          <span>IFSC Code <span style={{ color: '#ef4444' }}>*</span></span>
                          <span style={{ fontSize: '0.7rem', color: formData.ifscCode.trim().length === 0 ? '#94a3b8' : formData.ifscCode.trim().length === 11 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                            {formData.ifscCode.trim().length}/11
                          </span>
                        </label>
                        <input
                          name="ifscCode"
                          value={formData.ifscCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                          placeholder="e.g. SBIN0001234"
                          maxLength={11}
                          style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: formData.ifscCode.trim().length > 0 && formData.ifscCode.trim().length !== 11 ? '1px solid #fecaca' : '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                        />
                        {formData.ifscCode.trim().length > 0 && formData.ifscCode.trim().length !== 11 && (
                          <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.4rem', fontWeight: 600 }}>IFSC code must be exactly 11 characters.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
              {currentStep < 5 ? (
                <button onClick={nextStep} style={{ backgroundColor: formData.brandColor, color: 'white', border: 'none', borderRadius: '12px', padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background-color 0.3s' }}>
                  CONTINUE <ArrowRight size={18} />
                </button>
              ) : (
                <button onClick={handleCompleteOnboarding} disabled={loading} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', padding: '1rem 3rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                  {loading ? 'PLANTING...' : 'LAUNCH STORE'} <CheckCircle2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        {currentStep > 1 && (
          <div style={{ position: 'sticky', top: '8rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E5C48B' }}>Live Store Preview</span>
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

        /* Responsive header */
        .onboarding-header {
          padding: 1.5rem 4rem;
        }
        @media (max-width: 640px) {
          .onboarding-header {
            padding: 1rem 1.25rem;
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          .onboarding-steps {
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .onboarding-step-label {
            display: none;
          }
        }

        /* Branding card responsive padding */
        .branding-card {
          padding: 3rem;
        }
        @media (max-width: 640px) {
          .branding-card {
            padding: 1.25rem;
            border-radius: 20px;
          }
        }

        /* Color presets: wrap naturally, keep circles 36px */
        .color-presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 40px);
          gap: 0.75rem;
          margin-bottom: 2.5rem;
        }
        .color-swatch {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        /* Image upload grid: 3-col on desktop, 1-col on mobile */
        .upload-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 640px) {
          .upload-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Upload box: flexible height, long filenames wrap */
        .upload-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100px;
          border-radius: 16px;
          cursor: pointer;
          background: #fcfdfc;
          transition: all 0.3s;
          gap: 0.4rem;
          padding: 0.75rem 0.5rem;
        }
        .upload-box-filename {
          font-size: 0.68rem;
          font-weight: 600;
          text-align: center;
          padding: 0 0.5rem;
          word-break: break-all;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
