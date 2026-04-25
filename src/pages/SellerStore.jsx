import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Package, Star, ArrowLeft, ChevronLeft, ChevronRight, Globe, Award, Leaf, Heart, ShoppingCart } from 'lucide-react';
import { ProductService } from '../services/ProductService';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import TrustBadges from '../components/TrustBadges';

export default function SellerStore() {
  const { sellerName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [sellerInfo, setSellerInfo] = useState({
    name: decodeURIComponent(sellerName),
    tagline: 'Rare Botanical Specimens & Aquatic Artistry',
    expertise: 'Specializing in high-health, sustainably grown aquatic flora.',
    location: 'Kerala, India',
    heroImage: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=1600&q=80',
    logoUrl: '',
    brandColor: '#0A3029',
    rating: 4.9,
    reviews: 1284,
    founded: 2012,
    badges: ['Verified Grower', 'Eco-Packaging', 'Top Rated']
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
            tagline: profile.expertise || 'Rare Botanical Specimens',
            expertise: profile.bio || 'Specializing in high-health specimens.',
            location: profile.location_city || 'India',
            heroImage: profile.banner_url || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=1600&q=80',
            logoUrl: profile.logo_url,
            brandColor: profile.brand_color || '#0A3029',
            rating: profile.rating || 5.0,
            reviews: profile.total_sales || 0,
            founded: new Date(profile.created_at).getFullYear(),
            badges: ['Verified Sanctuary', 'Purity Certified', 'Master Grower']
          });
        }

        // Fetch products for this seller
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

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfdfc' }}>
        <p style={{ fontFamily: 'serif', fontSize: '1.5rem', color: '#0A3029' }}>Revealing the Sanctuary...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fcfdfc', minHeight: '100vh', paddingBottom: '10rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Immersive Dynamic Hero */}
      <section style={{ position: 'relative', height: '80vh', minHeight: '600px', overflow: 'hidden' }}>
        <img 
          src={sellerInfo.heroImage} 
          alt={sellerInfo.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, ${sellerInfo.brandColor}E6 100%)`,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 5% 5rem', color: 'white'
        }}>
          <div className="container">
            <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '3rem', fontWeight: 700 }}>
              <ArrowLeft size={18} /> BACK TO COLLECTION
            </Link>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
              {sellerInfo.badges.map(badge => (
                <span key={badge} style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', color: 'white', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {badge}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginBottom: '2rem' }}>
               {sellerInfo.logoUrl && (
                 <img src={sellerInfo.logoUrl} style={{ width: '120px', height: '120px', borderRadius: '24px', objectFit: 'cover', border: '4px solid white', backgroundColor: 'white' }} />
               )}
               <h1 style={{ fontSize: '5rem', fontFamily: 'serif', lineHeight: 0.9, letterSpacing: '-0.02em' }}>
                  {sellerInfo.name}
               </h1>
            </div>

            <p style={{ fontSize: '1.75rem', color: sellerInfo.brandColor || '#E5C48B', maxWidth: '800px', fontWeight: 500, lineHeight: 1.3, marginBottom: '4rem' }}>
              {sellerInfo.tagline}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '4rem', width: 'fit-content' }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: sellerInfo.brandColor || '#E5C48B', marginBottom: '0.5rem' }}>Sanctuary Rating</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star fill="white" color="white" size={20} />
                  <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{sellerInfo.rating}</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: sellerInfo.brandColor || '#E5C48B', marginBottom: '0.5rem' }}>Acquisitions</p>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{sellerInfo.reviews}</span>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: sellerInfo.brandColor || '#E5C48B', marginBottom: '0.5rem' }}>Since</p>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{sellerInfo.founded}</span>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: sellerInfo.brandColor || '#E5C48B', marginBottom: '0.5rem' }}>Origin</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin color="white" size={20} />
                  <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{sellerInfo.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '8rem' }}>
        {/* Mandate Row */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8rem', alignItems: 'center', marginBottom: '10rem' }}>
          <div>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: sellerInfo.brandColor, marginBottom: '2rem' }}>The Botanical Mandate</h2>
            <p style={{ fontSize: '2.5rem', fontFamily: 'serif', color: '#1a2f1a', lineHeight: 1.2 }}>
               "{sellerInfo.expertise}"
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '4rem', borderRadius: '48px', border: '1px solid #edf2ed' }}>
            <TrustBadges brandColor={sellerInfo.brandColor} showTitle={true} />
          </div>
        </section>

        {/* Collection */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', borderBottom: '1px solid #edf2ed', paddingBottom: '2rem' }}>
            <h3 style={{ fontSize: '3rem', fontFamily: 'serif' }}>The Sanctuary Collection</h3>
            <p style={{ fontWeight: 700, color: '#6b7280' }}>REVEALING {products.length} SPECIMENS</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
            {paginatedProducts.map(product => (
              <ProductCard 
                key={product.id}
                id={product.id}
                name={product.name || product.title}
                price={product.price}
                image={product.image_url || product.image}
                seller={{ name: sellerInfo.name }}
                brandColor={sellerInfo.brandColor}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
