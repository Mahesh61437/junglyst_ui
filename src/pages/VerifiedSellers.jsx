import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Star, MapPin, ExternalLink, Leaf, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';

export default function VerifiedSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await api.get('/sellers/profiles/');
        setSellers(response.data.results || response.data || []);
      } catch (error) {
        console.error('Error fetching sellers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  return (
    <div className="container" style={{ padding: '6rem 1rem', minHeight: '80vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f0fdf4', color: '#166534', padding: '0.6rem 1.25rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2rem' }}>
          <ShieldCheck size={16} /> Certified Sanctuary Partners
        </div>
        <h1 style={{ fontSize: '4.5rem', fontWeight: 300, fontFamily: 'serif', color: '#0A3029', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Verified Excellence
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
          Meet the master growers and botanical curators who maintain the highest standards of specimen care and ethical distribution.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Discovering master growers...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2.5rem' }}>
          {sellers.map(seller => (
            <Link 
              key={seller.id} 
              to={`/store/${seller.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ 
                backgroundColor: 'white', borderRadius: '32px', padding: '2.5rem', 
                border: '1px solid rgba(0,0,0,0.04)', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(10, 48, 41, 0.12)';
                e.currentTarget.style.borderColor = seller.brand_color || '#10b981';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
              }}
              >
                {/* Brand Color Accent */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px', 
                  backgroundColor: seller.brand_color || '#10b981' 
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ 
                    width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden', 
                    border: '1px solid #f1f5f9', flexShrink: 0 
                  }}>
                    <img 
                      src={getImageUrl(seller.logo_url) || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.store_name}&backgroundColor=1b2d2a`} 
                      alt={seller.store_name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif', color: '#0A3029', marginBottom: '0.25rem' }}>
                      {seller.store_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      <MapPin size={14} /> {seller.location_city || 'India'}
                    </div>
                  </div>
                </div>

                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2.5rem', flexGrow: 1 }}>
                  {seller.bio || 'Curating rare botanical specimens and high-fidelity aquascape essentials with a focus on sustainable growth.'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', color: '#E5C48B' }}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A3029' }}>Elite Curator</span>
                  </div>
                  <div style={{ color: seller.brand_color || '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Enter Studio <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
