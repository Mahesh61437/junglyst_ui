import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Package, Star, ArrowLeft, Leaf, Heart, ShoppingCart, Info, Award, Calendar, ExternalLink } from 'lucide-react';
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
            badges: ['Verified Sanctuary', 'Purity Certified', 'Premium Logistics']
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
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '10rem', fontFamily: 'var(--font-sans)' }}>
      
      {/* 1. Immersive Editorial Banner */}
      <section style={{ position: 'relative', height: '70vh', minHeight: '600px', backgroundColor: sellerInfo.brandColor }}>
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
        >
          <img 
            src={sellerInfo.heroImage} 
            alt={sellerInfo.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
          />
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, ${sellerInfo.brandColor}BF 50%, ${sellerInfo.brandColor} 100%)` 
          }} />
        </motion.div>

        <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '6rem', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/shop" style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)', 
              textDecoration: 'none', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', 
              letterSpacing: '0.15em', marginBottom: '3rem', width: 'fit-content'
            }}>
              <ArrowLeft size={16} /> RETURN TO WILD
            </Link>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2.5rem' }}>
              {sellerInfo.badges.map((badge, idx) => (
                <motion.span 
                  key={badge}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + (idx * 0.1) }}
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', 
                    border: '1px solid rgba(255,255,255,0.2)', color: 'white', 
                    padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.6rem', 
                    fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' 
                  }}
                >
                  {badge}
                </motion.span>
              ))}
            </div>

            <h1 style={{ 
              fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontFamily: 'var(--font-serif)', color: 'white', 
              lineHeight: 0.85, letterSpacing: '-0.04em', margin: 0, marginBottom: '2rem',
              textShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              {sellerInfo.name}
            </h1>
            <p style={{ 
              fontSize: '1.75rem', color: 'rgba(255,255,255,0.9)', maxWidth: '750px', 
              fontWeight: 400, fontStyle: 'italic', margin: 0, lineHeight: 1.3,
              fontFamily: 'var(--font-serif)'
            }}>
              {sellerInfo.tagline}
            </p>
          </motion.div>
        </div>
      </section>


      {/* 2. Studio Identity Card (Overlapping) */}
      <div className="container" style={{ position: 'relative', zIndex: 20 }}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ 
            marginTop: '-6rem', backgroundColor: 'var(--bg-primary)', borderRadius: '32px', 
            padding: '4.5rem', boxShadow: 'var(--shadow-lg)',
            display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '6rem', alignItems: 'center',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {/* Identity & Bio */}
          <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'center' }}>
            <div style={{ 
              width: '180px', height: '180px', minWidth: '180px', borderRadius: '32px', 
              overflow: 'hidden', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)',
              padding: '10px', boxShadow: 'var(--shadow-sm)'
            }}>
              <img 
                src={sellerInfo.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sellerInfo.name}&backgroundColor=1b2d2a&fontFamily=serif&fontSize=40&fontWeight=700`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px' }} 
                alt="Logo"
                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${sellerInfo.name}&backgroundColor=1b2d2a&fontFamily=serif&fontSize=40&fontWeight=700` }}
              />
            </div>
            <div>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--brand-gold)', marginBottom: '1.25rem' }}>Botanical Mandate</h2>
              <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
                "{sellerInfo.expertise}"
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', marginTop: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
                  <div style={{ padding: '0.6rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <MapPin size={18} color="var(--brand-green)" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Origin</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{sellerInfo.location}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
                  <div style={{ padding: '0.6rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <Calendar size={18} color="var(--brand-green)" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Established</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{sellerInfo.founded}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Studio Metrics */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', 
            paddingLeft: '5rem', borderLeft: '1px solid var(--border-subtle)' 
          }}>
            <div style={{ padding: '2.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Star fill="var(--brand-gold)" color="var(--brand-gold)" size={14} />
                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Trust Score</span>
              </div>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{sellerInfo.rating}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 600 }}>Pure Satisfaction</p>
            </div>
            <div style={{ padding: '2.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Package color="var(--brand-green)" size={14} />
                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Shipments</span>
              </div>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{sellerInfo.reviews}+</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 600 }}>Botanical Relocations</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. The Collection */}
      <div className="container" style={{ marginTop: '10rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6rem' }}>
          <div>
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}
            >
              The Sanctuary Collection
            </motion.h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em' }}>REVEALING {products.length} BOTANICAL SPECIMENS</p>
          </div>
        </div>

        {products.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.1 }}
            className="grid-responsive"
            style={{ gap: '3rem' }}
          >
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
          </motion.div>
        ) : (
          <div style={{ padding: '12rem 2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '40px', border: '1px solid var(--border-subtle)' }}>
            <Leaf size={64} color="var(--border-subtle)" style={{ marginBottom: '2.5rem' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Collection Currently Dormant</h4>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>This grower is currently nurturing their next batch of rare specimens. Please subscribe to alerts for this sanctuary.</p>
          </div>
        )}
      </div>

      {/* 4. Commitment Row */}
      <div className="container" style={{ marginTop: '12rem' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ 
            backgroundColor: 'var(--bg-deep)', borderRadius: '56px', padding: '8rem 5rem', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            backgroundImage: 'radial-gradient(circle at top right, rgba(197, 160, 89, 0.15), transparent)',
            color: 'white', position: 'relative', overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: '10%', right: '5%', opacity: 0.05 }}><Leaf size={240} /></div>
          
          <Award size={48} color="var(--brand-gold)" style={{ marginBottom: '2.5rem' }} />
          <h2 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', color: 'white' }}>Verified Excellence</h2>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.7)', maxWidth: '750px', lineHeight: 1.7, marginBottom: '5rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            Every specimen from this sanctuary has passed our rigorous botanical screening process. 
            We guarantee health, purity, and sustainable cultivation practices.
          </p>
          <div style={{ width: '100%', maxWidth: '1000px' }}>
            <TrustBadges brandColor="var(--brand-gold)" darkMode={true} />
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}


