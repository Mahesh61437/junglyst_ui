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

export default function ProductCard({ id, name, scientific_name, care_level, origin, growth_rate, price, originalPrice, image, trending, reviews, stockStatus, seller, brandColor, variants }) {
  const { addItemToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const sellerInfo = seller?.seller_profile || {};
  const sellerName = sellerInfo.store_name || seller?.full_name || 'Aqueous Exotica';
  const sellerSlug = sellerInfo.slug || encodeURIComponent(sellerName);
  const isSaved = isInWishlist(id);
  
  const finalImage = getImageUrl(image);

  // Calculate Price Range
  const prices = variants?.length > 0 ? variants.map(v => parseFloat(v.price)) : [parseFloat(price)];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasPriceRange = minPrice !== maxPrice;

  // Check Cart Quantity
  const cartItem = cart.items.find(item => item.product.id === id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

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
      height: '100%',
      cursor: 'pointer'
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
            className="card-image"
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
            top: '1rem',
            right: '1rem',
            width: '36px',
            height: '36px',
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
          <Heart size={18} fill={isSaved ? (brandColor || "var(--brand-gold)") : "none"} strokeWidth={2} />
        </button>
        
        {/* Quick Add Overlay (Aquatic Exotica Style) */}
        <div className="card-hover-overlay">
          <button 
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               const vid = variants?.length > 0 ? variants[0].id : null;
               addItemToCart(id, 1, vid);
             }}
             className="quick-add-btn"
          >
            {quantityInCart > 0 ? (
              <><ShieldCheck size={14} color="#10b981" /> {quantityInCart} In Box</>
            ) : (
              <><ShoppingCart size={14} /> Add to Cart</>
            )}
          </button>
        </div>

        {/* Attribute Badges */}
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {trending && (
            <div style={{
              backgroundColor: '#FF5722', color: 'white',
              fontSize: '0.6rem', fontWeight: 900, padding: '0.3rem 0.7rem', borderRadius: '50px',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              TRENDING
            </div>
          )}
          {care_level && (
            <div style={{
              backgroundColor: 'rgba(10, 48, 41, 0.8)', backdropFilter: 'blur(8px)', color: 'white',
              fontSize: '0.55rem', fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '4px',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {care_level}
            </div>
          )}
        </div>
      </div>

      {/* Editorial Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ color: 'var(--brand-gold)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
             {sellerName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
             {[...Array(5)].map((_, i) => (
               <Star key={i} size={10} fill={i < 4 ? "var(--brand-gold)" : "none"} color="var(--brand-gold)" />
             ))}
          </div>
        </div>

        <h3 style={{ 
          fontWeight: 600, fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)',
          lineHeight: 1.2, marginBottom: '0.3rem', letterSpacing: '-0.01em'
        }}>
          {name}
        </h3>
        
        {/* Technical Stack */}
        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.45rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800 }}>Growth</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{growth_rate || 'Moderate'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f1f5f9', paddingLeft: '0.8rem' }}>
            <span style={{ fontSize: '0.45rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800 }}>Status</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: quantityInCart > 0 ? '#10b981' : (stockStatus === 'Out of Stock' ? '#ef4444' : '#f59e0b') }}>
              {stockStatus || 'In Stock'}
            </span>
          </div>
        </div>

        {/* Pricing Anchor */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#E67E22' }}>
            ₹{minPrice.toLocaleString()}
            {hasPriceRange && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}> - ₹{maxPrice.toLocaleString()}</span>}
          </span>
          {originalPrice && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{originalPrice}</span>
          )}
        </div>
      </div>

      <style>{`
        .card-hover-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          opacity: 0;
          transform: translateY(100%);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          background: linear-gradient(to top, rgba(255,255,255,0.9), transparent);
          z-index: 5;
        }
        .quick-add-btn {
          width: 100%;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.8rem;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }
        .product-card:hover .card-image {
          transform: scale(1.1);
        }
        .product-card:hover .card-hover-overlay {
          opacity: 1;
          transform: translateY(0);
        }
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
}
