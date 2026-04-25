import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUtils';

const isLight = (color) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

export default function ProductCard({ id, name, price, originalPrice, image, trending, reviews, stockStatus, seller, brandColor }) {
  const { addItemToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const sellerName = seller?.name || 'Aqueous Exotica';
  const isSaved = isInWishlist(id);
  
  const finalImage = getImageUrl(image);

  return (
    <div className="product-card" style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderRadius: '24px',
      overflow: 'hidden',
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
      border: '1px solid rgba(0,0,0,0.04)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      height: '100%'
    }}>
      {/* Visual Area */}
      <div style={{ position: 'relative', backgroundColor: '#f8fafc', aspectRatio: '1/1', overflow: 'hidden' }}>
        <Link to={`/product/${id}`} style={{ display: 'block', height: '100%' }}>
          <img 
            src={finalImage} 
            alt={name} 
            loading="lazy"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }} 
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        </Link>

        {/* Priority Save (Heart) */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({ id, name, price, image, seller });
          }}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            color: isSaved ? (brandColor || 'var(--brand-gold)') : 'var(--text-secondary)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Heart size={20} fill={isSaved ? (brandColor || "var(--brand-gold)") : "none"} strokeWidth={2} />
        </button>
        
        {/* Boutique Overlay Actions (Glassmorphic) */}
        <div className="card-actions" style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          right: '1rem',
          display: 'flex',
          gap: '0.6rem',
          opacity: 0,
          transform: 'translateY(15px)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none'
        }}>
          <button 
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               addItemToCart(id, 1);
               alert(`${name} secured in Box.`);
             }}
             style={{ 
                backgroundColor: brandColor || 'rgba(10, 48, 41, 0.95)', 
                backdropFilter: 'blur(10px)',
                color: (brandColor && isLight(brandColor)) ? '#1a2f1a' : 'white',
                border: 'none',
                borderRadius: '50px',
                height: '44px',
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                cursor: 'pointer',
                pointerEvents: 'auto',
                boxShadow: `0 10px 20px ${(brandColor || '#0a3029')}30`
             }}
          >
            <ShoppingCart size={14} /> Acquisition
          </button>
        </div>

        {/* Curator Note Badge */}
        {trending && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            color: brandColor || 'var(--bg-deep)',
            fontSize: '0.6rem',
            fontWeight: 900,
            padding: '0.4rem 0.75rem',
            borderRadius: '50px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}>
            Specimen Focus
          </div>
        )}
        </div>

      {/* Editorial Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ marginBottom: '0.25rem' }}>
          <Link 
            to={`/store/${encodeURIComponent(sellerName)}`} 
            style={{ 
              color: brandColor || 'var(--brand-gold)', 
              fontSize: '0.65rem', 
              fontWeight: 900, 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em',
              textDecoration: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
             {sellerName}
          </Link>
        </div>

        <Link to={`/product/${id}`} style={{ 
          fontWeight: 600, 
          fontSize: '1.25rem', 
          fontFamily: 'var(--font-serif)', 
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          textDecoration: 'none',
          marginBottom: '0.75rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.8rem',
          letterSpacing: '-0.015em'
        }}>
          {name}
        </Link>

        {/* Rating & Pricing Anchor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Star size={12} fill={brandColor || "var(--brand-gold)"} color={brandColor || "var(--brand-gold)"} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{reviews || '4.8'}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            {originalPrice && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>₹{originalPrice}</span>
            )}
            <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--bg-deep)' }}>₹{price}</span>
          </div>
        </div>
      </div>

      <style>{`
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px -12px rgba(0,0,0,0.1);
          border-color: ${brandColor || 'rgba(10, 48, 41, 0.1)'};
        }
        .product-card:hover .card-actions {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
