import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Package, Star, ArrowLeft, Leaf, Heart, ShoppingCart, Info, Award, Calendar, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { ProductService } from '../services/ProductService';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import TrustBadges from '../components/TrustBadges';
import { motion, AnimatePresence } from 'framer-motion';

const isLight = (color) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

export default function SellerStore() {
  const { sellerName } = useParams(); // This is the slug
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [sellerInfo, setSellerInfo] = useState({
    name: '',
    tagline: 'Rare Botanical Specimens & Collector Rarities',
    expertise: 'Curating life with precision and passion.',
    location: 'India',
    heroImage: '/assets/default-banner.jpg',
    logoUrl: '/assets/default-logo.jpg',
    brandColor: '#1b2d2a',
    rating: 5.0,
    reviews: 0,
    founded: 2024,
    badges: ['Verified Sanctuary', 'Master Grower', 'Eco-Pioneer']
  });
  const [profileFound, setProfileFound] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      setLoading(true);
      try {
        // Fetch public profile info
        const profileRes = await api.get(`/sellers/store/${sellerName}/`).catch(() => null);
        if (profileRes && profileRes.data) {
          const profile = profileRes.data;
          setSellerInfo({
            name: profile.store_name,
            tagline: profile.tagline || 'Rare Botanical Specimens & Collector Rarities',
            expertise: profile.bio || 'Sharing rare specimens from our private sanctuary.',
            location: profile.location_city || 'India',
            heroImage: getImageUrl(profile.banner_url) || '/assets/default-banner.jpg',
            logoUrl: getImageUrl(profile.logo_url) || '/assets/default-logo.jpg',
            brandColor: profile.brand_color || '#1b2d2a',
            rating: parseFloat(profile.rating) || 5.0,
            reviews: parseInt(profile.total_sales) || 0,
            founded: new Date(profile.created_at).getFullYear(),
            badges: profile.identity_verified ? ['Identity Verified', 'Verified Sanctuary', 'Master Grower'] : ['Verified Sanctuary', 'Purity Verified', 'Premium Logistics'],
            expertise_tags: profile.expertise_tags || [],
            infrastructure: profile.infrastructure_details || '',
            experience: profile.experience_years || 0,
            isVerified: profile.identity_verified
          });
          setProfileFound(true);
          
          // Now fetch products using the seller's slug
          const data = await ProductService.getProducts({ seller_slug: sellerName });
          const results = data.results || data || [];
          setProducts(results.filter((p) => p?.is_active !== false));
        } else {
          setProfileFound(false);
        }
      } catch (error) {
        console.error("Failed to fetch seller data:", error);
        setProfileFound(false);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
    window.scrollTo(0, 0);
  }, [sellerName]);

  const textColor = isLight(sellerInfo.brandColor) ? 'var(--text-primary)' : 'white';
  const accentColor = isLight(sellerInfo.brandColor) ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)';

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: '40px', height: '40px', border: '3px solid var(--bg-secondary)', borderTopColor: sellerInfo.brandColor, borderRadius: '50%', marginBottom: '2rem' }}
        />
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Revealing the Sanctuary...</p>
      </div>
    );
  }

  if (!profileFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '2rem', textAlign: 'center' }}>
        <Leaf size={64} color="var(--brand-gold)" style={{ marginBottom: '2rem' }} />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', marginBottom: '1rem' }}>Sanctuary Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 3rem', fontSize: '1.1rem' }}>This studio may have relocated or changed its identity.</p>
        <Link to="/shop" className="btn btn-primary">Return to Marketplace</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f9f8f4', minHeight: '100vh', paddingBottom: '6rem', fontFamily: 'Inter, sans-serif', color: '#1a1a1a' }}>
      
      {/* 1. Fashion Editorial Hero */}
      <section className="seller-hero" style={{ position: 'relative', backgroundColor: '#f3f4f1' }}>
        {/* Hero Image (top on mobile, right on desktop) */}
        <div className="seller-hero-image" style={{ position: 'relative', overflow: 'hidden' }}>
          <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2 }}
            style={{ width: '100%', height: '100%' }}
          >
            <img
              src={sellerInfo.heroImage}
              alt="Studio View"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #f3f4f1 100%)' }} />
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="seller-hero-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/sellers" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b',
              textDecoration: 'none', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.2em', marginBottom: '2rem'
            }}>
              <ArrowLeft size={14} /> All Sanctuaries
            </Link>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {sellerInfo.badges.map(badge => (
                <span key={badge} style={{
                  fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: '#10b981',
                  borderBottom: '1px solid #10b981', paddingBottom: '0.2rem'
                }}>
                  {badge}
                </span>
              ))}
            </div>

            {/* Logo + Store name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px', height: '64px', flexShrink: 0,
                backgroundColor: 'white', borderRadius: '50%',
                padding: '0.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <img
                  src={sellerInfo.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sellerInfo.name}&backgroundColor=1b2d2a`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                  alt="Logo"
                />
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9ca3af', margin: 0 }}>Studio Profile</p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', margin: 0, lineHeight: 1.1 }}>{sellerInfo.name}</h2>
              </div>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontFamily: 'var(--font-serif)', lineHeight: 1,
              letterSpacing: '-0.03em', margin: '0 0 1.25rem 0'
            }}>
              {sellerInfo.name.split(' ')[0]}
              {sellerInfo.name.split(' ').length > 1 && (
                <><br /><span style={{ fontStyle: 'italic', color: '#64748b' }}>& </span>{sellerInfo.name.split(' ').slice(1).join(' ')}</>
              )}
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#4b5563',
              maxWidth: '480px', fontWeight: 400, margin: 0, lineHeight: 1.5,
              fontFamily: 'var(--font-serif)', fontStyle: 'italic'
            }}>
              "{sellerInfo.tagline}"
            </p>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '3rem' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{sellerInfo.rating}</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.1em' }}>Curator Rating</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{sellerInfo.experience}y</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.1em' }}>Mastery Tenure</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{products.length}</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.1em' }}>Specimens</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Studio Ethos & Expertise */}
      <section style={{ padding: 'clamp(4rem, 8vw, 10rem) 0' }}>
        <div className="container">
          <div className="seller-ethos-grid">
            <div>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#10b981', marginBottom: '1.5rem' }}>The Botanical Mandate</h3>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontFamily: 'var(--font-serif)', lineHeight: 1.1, marginBottom: '1.5rem' }}>Philosophy of Cultivation</h2>
              <div style={{ width: '48px', height: '2px', backgroundColor: '#1a1a1a' }} />
            </div>
            <div>
              <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#4b5563', lineHeight: 1.8, marginBottom: '2.5rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                "{sellerInfo.expertise}"
              </p>
              <div className="seller-pillars-grid">
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Infrastructure</h4>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>{sellerInfo.infrastructure || 'Advanced climate-controlled propagation systems with custom light spectrum optimization.'}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Studio Pillars</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(sellerInfo.expertise_tags?.length > 0 ? sellerInfo.expertise_tags : ['Sustainability', 'Purity', 'Rare Stock']).map(tag => (
                      <span key={tag} style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '100px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Seasonal Selections */}
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 6rem)' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>Seasonal Selections</h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af' }}>LATEST {products.length} SPECIMENS FROM THE SANCTUARY</p>
        </div>

        {products.length > 0 ? (
          <div className="grid-responsive" style={{ display: 'grid' }}>
            {paginatedProducts.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name || product.title}
                price={product.price}
                image={product.image_url || product.image}
                seller={product.seller}
                brandColor={sellerInfo.brandColor}
                reviews={product.rating}
                stock={product.stock}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: 'clamp(4rem, 8vw, 8rem) 2rem', textAlign: 'center', backgroundColor: 'white', border: '1px solid #f3f4f6', borderRadius: '24px' }}>
            <Leaf size={44} color="#e5e7eb" style={{ marginBottom: '1.5rem' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>Collection Dormant</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>This grower is currently nurturing their next batch of rare specimens.</p>
          </div>
        )}
      </div>

      {/* 4. Verified Excellence / Commitment */}
      <div className="container" style={{ marginTop: '12rem', marginBottom: '4rem' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ 
            backgroundColor: 'var(--bg-deep, #1b2d2a)', 
            borderRadius: '40px', 
            padding: '6rem 4rem', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1.2fr', 
            gap: '6rem',
            alignItems: 'center',
            color: 'white', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: '0 40px 100px -20px rgba(27, 45, 42, 0.4)'
          }}
        >
          {/* Decorative background elements */}
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.03, transform: 'rotate(15deg)' }}><Leaf size={400} /></div>
          <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '50%', background: 'linear-gradient(to top, rgba(16, 185, 129, 0.05), transparent)' }} />
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '50px', height: '1px', backgroundColor: 'var(--brand-gold, #c5a059)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--brand-gold, #c5a059)' }}>The Standard</span>
            </div>
            
            <h2 style={{ fontSize: '4rem', fontFamily: 'serif', lineHeight: 1.1, marginBottom: '2rem', color: 'white' }}>Verified<br/>Excellence</h2>
            
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '3rem', fontFamily: 'serif', fontStyle: 'italic' }}>
              Every specimen from {sellerInfo.name} has passed our rigorous botanical screening process. We guarantee health, purity, and sustainable cultivation practices from farm to display.
            </p>
            
            <div style={{ display: 'flex', gap: '2rem', padding: '2rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>100%</p>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>Purity Guarantee</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>0</p>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>Harmful Chemicals</p>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
             {/* We use a custom layout for TrustBadges here to make it look dense and premium */}
             <div style={{ 
               display: 'grid', 
               gridTemplateColumns: 'repeat(2, 1fr)', 
               gap: '1.5rem',
               backgroundColor: 'rgba(255,255,255,0.03)',
               padding: '3rem',
               borderRadius: '24px',
               border: '1px solid rgba(255,255,255,0.05)',
               backdropFilter: 'blur(10px)'
             }}>
                {[
                  { title: 'Farm-Direct Dispatch', icon: <ShieldCheck size={20} /> },
                  { title: 'Pathogen-Free Guarantee', icon: <Leaf size={20} /> },
                  { title: 'Eco-Friendly Packaging', icon: <Package size={20} /> },
                  { title: 'Species-Specific Guarantee', icon: <Award size={20} /> },
                  { title: 'Sustainably Cultivated', icon: <Heart size={20} /> },
                  { title: 'Expert Horticultural Support', icon: <Sparkles size={20} /> }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '14px', 
                      backgroundColor: 'rgba(197, 160, 89, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--brand-gold, #c5a059)'
                    }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{item.title}</span>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Hero: desktop = side by side, mobile = stacked */
        .seller-hero {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          min-height: 85vh;
        }
        .seller-hero-image {
          order: 2;
        }
        .seller-hero-content {
          order: 1;
          padding: 5% 8%;
        }

        /* Ethos grid */
        .seller-ethos-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 6rem;
          align-items: flex-start;
        }
        .seller-pillars-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .seller-hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .seller-hero-image {
            order: 1;
            height: 55vw;
            max-height: 420px;
          }
          .seller-hero-content {
            order: 2;
            padding: 2.5rem 2rem 3rem;
          }
          .seller-ethos-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .seller-hero-image {
            height: 56vw;
            max-height: 280px;
          }
          .seller-hero-content {
            padding: 1.5rem 1rem 2.5rem;
          }
          .seller-pillars-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}


