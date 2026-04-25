import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Package, Star, ArrowLeft, Leaf, Heart, ShoppingCart, Info, Award, Calendar, ExternalLink } from 'lucide-react';
import { ProductService } from '../services/ProductService';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import TrustBadges from '../components/TrustBadges';
import { motion } from 'framer-motion';

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
    name: 'Loading Sanctuary...',
    tagline: 'Authentic Botanical Specimens',
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
            heroImage: profile.banner_url || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=2000',
            logoUrl: profile.logo_url,
            brandColor: profile.brand_color || '#1b2d2a',
            rating: parseFloat(profile.rating) || 5.0,
            reviews: parseInt(profile.total_sales) || 0,
            founded: new Date(profile.created_at).getFullYear(),
            badges: ['Verified Sanctuary', 'Purity Certified', 'Premium Logistics']
          });
        }

        // Fetch products for this seller (the backend filter handles slug or ID)
        const data = await ProductService.getProducts({ seller: sellerName });
        setProducts(data.results || data || []);
      } catch (error) {
        console.error("Failed to fetch seller products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
    window.scrollTo(0, 0);
  }, [sellerName]);

  const textColor = isLight(sellerInfo.brandColor) ? '#1b2d2a' : 'white';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfdfc' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #edf2ed', borderTopColor: '#1b2d2a', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '2rem' }}></div>
        <p style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#1b2d2a' }}>Revealing the Sanctuary...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fcfdfc', minHeight: '100vh', paddingBottom: '10rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. Immersive Editorial Banner */}
      <section style={{ position: 'relative', height: '60vh', minHeight: '500px', backgroundColor: sellerInfo.brandColor }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <img 
            src={sellerInfo.heroImage} 
            alt={sellerInfo.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
          />
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, ${sellerInfo.brandColor}F2 100%)` 
          }} />
        </div>

        <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '4rem', zIndex: 10 }}>
          <Link to="/shop" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', 
            textDecoration: 'none', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', 
            letterSpacing: '0.15em', marginBottom: '3rem', width: 'fit-content'
          }}>
            <ArrowLeft size={16} /> RETURN TO WILD
          </Link>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2.5rem' }}>
            {sellerInfo.badges.map(badge => (
              <span key={badge} style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255,255,255,0.2)', color: 'white', 
                padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.6rem', 
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' 
              }}>
                {badge}
              </span>
            ))}
          </div>

          <h1 style={{ 
            fontSize: 'clamp(3rem, 8vw, 6rem)', fontFamily: 'serif', color: 'white', 
            lineHeight: 0.9, letterSpacing: '-0.03em', margin: 0, marginBottom: '1.5rem' 
          }}>
            {sellerInfo.name}
          </h1>
          <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.85)', maxWidth: '800px', fontWeight: 400, fontStyle: 'italic', margin: 0 }}>
            {sellerInfo.tagline}
          </p>
        </div>
      </section>

      {/* 2. Studio Identity Card (Overlapping) */}
      <div className="container" style={{ position: 'relative', zIndex: 20 }}>
        <div style={{ 
          marginTop: '-5rem', backgroundColor: 'white', borderRadius: '32px', 
          padding: '4rem', boxShadow: '0 30px 60px rgba(0,0,0,0.06)',
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6rem', alignItems: 'center',
          border: '1px solid #edf2ed'
        }}>
          {/* Identity & Bio */}
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
            <div style={{ 
              width: '160px', height: '160px', minWidth: '160px', borderRadius: '24px', 
              overflow: 'hidden', border: '1px solid #edf2ed', backgroundColor: '#fcfdfc',
              padding: '8px'
            }}>
              <img 
                src={sellerInfo.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sellerInfo.name}&backgroundColor=1b2d2a&fontFamily=serif&fontSize=40&fontWeight=700`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} 
                alt="Logo"
              />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'serif', color: '#1b2d2a', marginBottom: '1rem' }}>The Grower's Mandate</h2>
              <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {sellerInfo.expertise}
              </p>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1b2d2a' }}>
                  <MapPin size={18} color={sellerInfo.brandColor} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{sellerInfo.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1b2d2a' }}>
                  <Calendar size={18} color={sellerInfo.brandColor} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Curating since {sellerInfo.founded}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Studio Metrics */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', 
            paddingLeft: '4rem', borderLeft: '1px solid #edf2ed' 
          }}>
            <div style={{ padding: '2rem', backgroundColor: '#fcfdfc', borderRadius: '24px', border: '1px solid #edf2ed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Star fill={sellerInfo.brandColor} color={sellerInfo.brandColor} size={16} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Trust Score</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#1b2d2a' }}>{sellerInfo.rating}</p>
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Verified Experience</p>
            </div>
            <div style={{ padding: '2rem', backgroundColor: '#fcfdfc', borderRadius: '24px', border: '1px solid #edf2ed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Package color={sellerInfo.brandColor} size={16} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Relocations</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#1b2d2a' }}>{sellerInfo.reviews}+</p>
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Successful Shipments</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Collection */}
      <div className="container" style={{ marginTop: '8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5rem' }}>
          <div>
            <h3 style={{ fontSize: '3rem', fontFamily: 'serif', color: '#1b2d2a', margin: 0, marginBottom: '0.5rem' }}>The Sanctuary Collection</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>REVEALING {products.length} BOTANICAL SPECIMENS</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             {/* Filter placeholders if needed */}
          </div>
        </div>

        {products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.5rem' }}>
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
          <div style={{ padding: '10rem 2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #edf2ed' }}>
            <Leaf size={48} color="#edf2ed" style={{ marginBottom: '2rem' }} />
            <h4 style={{ fontFamily: 'serif', fontSize: '1.5rem', color: '#1b2d2a' }}>Collection Currently Dormant</h4>
            <p style={{ color: '#64748b', maxWidth: '400px', margin: '1rem auto' }}>This grower is currently nurturing their next batch of specimens. Please check back soon.</p>
          </div>
        )}
      </div>

      {/* 4. Commitment Row */}
      <div className="container" style={{ marginTop: '10rem' }}>
        <div style={{ 
          backgroundColor: '#1b2d2a', borderRadius: '48px', padding: '6rem 4rem', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          backgroundImage: 'radial-gradient(circle at top right, rgba(229, 196, 139, 0.1), transparent)',
          color: 'white'
        }}>
          <Award size={40} color="#E5C48B" style={{ marginBottom: '2rem' }} />
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'serif', marginBottom: '1.5rem' }}>Verified Grower Excellence</h2>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)', maxWidth: '700px', lineHeight: 1.6, marginBottom: '4rem' }}>
            Every specimen from this sanctuary has passed our rigorous botanical screening process. 
            We guarantee health, purity, and sustainable cultivation practices.
          </p>
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <TrustBadges brandColor="#E5C48B" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

