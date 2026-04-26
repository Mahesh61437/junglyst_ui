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
    heroImage: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=2000',
    logoUrl: '',
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
            heroImage: getImageUrl(profile.banner_url) || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=2000',
            logoUrl: getImageUrl(profile.logo_url),
            brandColor: profile.brand_color || '#1b2d2a',
            rating: parseFloat(profile.rating) || 5.0,
            reviews: parseInt(profile.total_sales) || 0,
            founded: new Date(profile.created_at).getFullYear(),
            badges: profile.identity_verified ? ['Identity Verified', 'Verified Sanctuary', 'Master Grower'] : ['Verified Sanctuary', 'Purity Certified', 'Premium Logistics'],
            expertise_tags: profile.expertise_tags || [],
            infrastructure: profile.infrastructure_details || '',
            experience: profile.experience_years || 0,
            isVerified: profile.identity_verified
          });
          setProfileFound(true);
          
          // Now fetch products using the seller's slug
          const data = await ProductService.getProducts({ seller_slug: sellerName });
          setProducts(data.results || data || []);
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
    <div style={{ backgroundColor: '#f9f8f4', minHeight: '100vh', paddingBottom: '10rem', fontFamily: 'Inter, sans-serif', color: '#1a1a1a' }}>
      
      {/* 1. Fashion Editorial Hero */}
      <section style={{ position: 'relative', height: '85vh', display: 'grid', gridTemplateColumns: '1.2fr 1fr', backgroundColor: '#f3f4f1' }}>
        {/* Left: Store Narrative */}
        <div style={{ padding: '0 10%', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/sellers" style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', 
              textDecoration: 'none', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', 
              letterSpacing: '0.2em', marginBottom: '4rem'
            }}>
              <ArrowLeft size={16} /> All Sanctuaries
            </Link>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
              {sellerInfo.badges.map((badge, idx) => (
                <span key={badge} style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#10b981', borderBottom: '1px solid #10b981', paddingBottom: '0.2rem' }}>
                  {badge}
                </span>
              ))}
            </div>

            <h1 style={{ 
              fontSize: 'clamp(4rem, 8vw, 6rem)', fontFamily: 'serif', lineHeight: 0.9, 
              letterSpacing: '-0.03em', margin: 0, marginBottom: '2.5rem'
            }}>
              {sellerInfo.name.split(' ')[0]} <br/> 
              <span style={{ fontStyle: 'italic', color: '#64748b' }}>&</span> {sellerInfo.name.split(' ').slice(1).join(' ')}
            </h1>
            
            <p style={{ 
              fontSize: '1.5rem', color: '#4b5563', maxWidth: '500px', 
              fontWeight: 400, margin: 0, lineHeight: 1.4, fontFamily: 'serif'
            }}>
              "{sellerInfo.tagline}"
            </p>

            <div style={{ marginTop: '4rem', display: 'flex', gap: '4rem' }}>
               <div>
                 <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{sellerInfo.rating}</p>
                 <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.1em' }}>Curator Rating</p>
               </div>
               <div>
                 <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{sellerInfo.experience}y</p>
                 <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.1em' }}>Mastery Tenure</p>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Studio/Farm Vision */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{ width: '100%', height: '100%', clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
          >
            <img 
              src={sellerInfo.heroImage} 
              alt="Studio View" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, backgroundColor: `${sellerInfo.brandColor}1A` }} />
          </motion.div>
          
          {/* Circular Branding Logo Overlay */}
          <motion.div 
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            style={{ 
              position: 'absolute', bottom: '10%', left: '0', 
              width: '180px', height: '180px', backgroundColor: 'white', 
              borderRadius: '50%', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 20
            }}
          >
            <img 
              src={sellerInfo.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sellerInfo.name}&backgroundColor=1b2d2a`} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
              alt="Logo"
            />
          </motion.div>
        </div>
      </section>

      {/* 2. Studio Ethos & Expertise */}
      <section style={{ padding: '12rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8rem', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#10b981', marginBottom: '2.5rem' }}>The Botanical Mandate</h3>
              <h2 style={{ fontSize: '3.5rem', fontFamily: 'serif', lineHeight: 1.1, marginBottom: '3rem' }}>Philosophy of Cultivation</h2>
              <div style={{ width: '60px', height: '2px', backgroundColor: '#1a1a1a' }} />
            </div>
            <div>
              <p style={{ fontSize: '1.4rem', color: '#4b5563', lineHeight: 1.8, marginBottom: '4rem', fontFamily: 'serif', fontStyle: 'italic' }}>
                "{sellerInfo.expertise}"
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Infrastructure</h4>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6 }}>{sellerInfo.infrastructure || 'Advanced climate-controlled propagation systems with custom light spectrum optimization.'}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Studio Pillars</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(sellerInfo.expertise_tags?.length > 0 ? sellerInfo.expertise_tags : ['Sustainability', 'Purity', 'Rare Stock']).map(tag => (
                      <span key={tag} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '100px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Newest Arrivals (Fashion Grid Style) */}
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
          <h2 style={{ fontSize: '4.5rem', fontFamily: 'serif', marginBottom: '1rem' }}>Seasonal Selections</h2>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af' }}>LATEST {products.length} SPECIMENS FROM THE SANCTUARY</p>
        </div>

        {products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '4rem' }}>
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
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: '10rem 2rem', textAlign: 'center', backgroundColor: 'white', border: '1px solid #f3f4f6' }}>
            <Leaf size={48} color="#e5e7eb" style={{ marginBottom: '2rem' }} />
            <h4 style={{ fontFamily: 'serif', fontSize: '2rem', marginBottom: '1rem' }}>Collection Dormant</h4>
            <p style={{ color: '#94a3b8' }}>This grower is currently nurturing their next batch of rare specimens.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .container { max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
      `}</style>
    </div>
  );
}


