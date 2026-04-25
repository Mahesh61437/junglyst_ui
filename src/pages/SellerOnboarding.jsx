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
  Loader2
} from 'lucide-react';
import api from '../services/api';
import { ProductService } from '../services/ProductService';
import SellerOnboardingPreview from '../components/SellerOnboardingPreview';
import { useAuth } from '../context/AuthContext';

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('junglyst_onboarding_draft');
    return saved ? JSON.parse(saved) : {
      storeName: '',
      tagline: '',
      description: '',
      location: 'Karnataka, India',
      brandColor: '#0A3029',
      logoUrl: '',
      bannerUrl: '',
      taxId: '',
      payoutBank: '',
      firstProductName: '',
      firstProductPrice: '',
      firstProductStock: '',
      firstProductWeight: '',
      logoName: '',
      bannerName: ''
    };
  });

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('junglyst_onboarding_step');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(null);

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

  useEffect(() => {
    localStorage.setItem('junglyst_onboarding_draft', JSON.stringify(formData));
    localStorage.setItem('junglyst_onboarding_step', currentStep.toString());
  }, [formData, currentStep]);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, [type === 'logo' ? 'logoName' : 'bannerName']: file.name }));
    setUploading(type);
    try {
      const url = await ProductService.uploadImage(file, type);
      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logoUrl' : 'bannerUrl']: url }));
    } catch (error) {
      alert("Failed to upload image. Please try again.");
      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logoName' : 'bannerName']: '' }));
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
          category_id: 1 // Fixed field name
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
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Name</label>
                  <input name="storeName" value={formData.storeName} onChange={handleInputChange} placeholder="e.g. Rare Greens Nursery" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
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
                  <label style={{ display: 'block', marginBottom: '1.25rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sanctuary Theme Color</label>
                  
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
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Logo</label>
                    <div style={{ position: 'relative' }}>
                      <input type="file" accept="image/*" id="logo-upload" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'logo')} />
                      <label htmlFor="logo-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', border: uploading === 'logo' ? '2px solid #E5C48B' : '2px dashed #e2e8f0', borderRadius: '16px', cursor: 'pointer', backgroundColor: '#fcfdfc', transition: 'all 0.3s' }}>
                        {uploading === 'logo' ? <Loader2 className="animate-spin" color="#E5C48B" /> : (formData.logoUrl ? <CheckCircle2 color="#10b981" /> : <Upload size={20} color="#94a3b8" />)}
                        <span style={{ fontSize: '0.7rem', marginTop: '0.5rem', fontWeight: 600, color: formData.logoUrl ? '#10b981' : '#94a3b8' }}>
                          {uploading === 'logo' ? 'Uploading...' : (formData.logoName || 'Select Logo')}
                        </span>
                        {formData.logoUrl && <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700, marginTop: '0.25rem' }}>SUCCESSFULLY SECURED</span>}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Banner</label>
                    <div style={{ position: 'relative' }}>
                      <input type="file" accept="image/*" id="banner-upload" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'banner')} />
                      <label htmlFor="banner-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', border: uploading === 'banner' ? '2px solid #E5C48B' : '2px dashed #e2e8f0', borderRadius: '16px', cursor: 'pointer', backgroundColor: '#fcfdfc', transition: 'all 0.3s' }}>
                        {uploading === 'banner' ? <Loader2 className="animate-spin" color="#E5C48B" /> : (formData.bannerUrl ? <CheckCircle2 color="#10b981" /> : <Upload size={20} color="#94a3b8" />)}
                        <span style={{ fontSize: '0.7rem', marginTop: '0.5rem', fontWeight: 600, color: formData.bannerUrl ? '#10b981' : '#94a3b8' }}>
                          {uploading === 'banner' ? 'Uploading...' : (formData.bannerName || 'Select Banner')}
                        </span>
                        {formData.bannerUrl && <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700, marginTop: '0.25rem' }}>SUCCESSFULLY SECURED</span>}
                      </label>
                    </div>
                  </div>
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
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Philosophy</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Describe your cultivation methods and commitment to specimen purity..." style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', resize: 'none' }} />
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
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tax Identification (GST/PAN)</label>
                  <input name="taxId" value={formData.taxId} onChange={handleInputChange} placeholder="Enter your business tax ID" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payout Account</label>
                  <div style={{ position: 'relative' }}>
                    <CreditCard size={18} style={{ position: 'absolute', left: '1.125rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input name="payoutBank" value={formData.payoutBank} onChange={handleInputChange} placeholder="UPI ID or Bank Account" style={{ width: '100%', padding: '1.125rem 1.125rem 1.125rem 3.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
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
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specimen Name</label>
                  <input name="firstProductName" value={formData.firstProductName} onChange={handleInputChange} placeholder="e.g. Monstera Albo Variegata" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Launch Price (₹)</label>
                    <input name="firstProductPrice" type="number" value={formData.firstProductPrice} onChange={handleInputChange} placeholder="4999" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</label>
                    <input name="firstProductStock" type="number" value={formData.firstProductStock} onChange={handleInputChange} placeholder="5" style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} />
                  </div>
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
