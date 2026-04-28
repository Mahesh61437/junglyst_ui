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
    <div className="product-card product-card-layout" style={{
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
      <div className="product-card-img-wrapper" style={{ position: 'relative', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
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
      <div className="product-card-content" style={{ flexGrow: 1 }}>
        <div className="product-card-seller" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <Link
            to={`/store/${sellerSlug}`}
            style={{
              color: brandColor || sellerInfo.brand_color || 'var(--brand-gold)',
              fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.15em', textDecoration: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {sellerName}
          </Link>
          {origin && (
            <span className="mobile-hide" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {origin}
            </span>
          )}
        </div>

        <Link to={`/product/${id}`} className="product-card-title" style={{
          color: 'var(--text-primary)',
          textDecoration: 'none',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {name}
        </Link>

        {scientific_name && (
          <p className="product-card-scientific mobile-hide" style={{
            fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)',
            marginBottom: '1rem', fontFamily: 'var(--font-serif)', opacity: 0.8
          }}>
            {scientific_name}
          </p>
        )}

        {/* Technical Attributes */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {growth_rate && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.5rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>Growth</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{growth_rate}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.5rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>Status</span>
            {isLowStock ? (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444' }}>
                only {stockCount} left
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: computedStockStatus === 'Sold Out' ? '#ef4444' : '#10b981' }}>
                {computedStockStatus}
              </span>
            )}
          </div>
        </div>

        {/* Rating & Pricing Anchor */}
        <div className="product-card-footer" style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.04)', gap: '0.75rem', justifyContent: 'space-between' }}>
          <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Star size={12} fill={brandColor || "var(--brand-gold)"} color={brandColor || "var(--brand-gold)"} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{reviews || '4.8'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
            {originalPrice && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>₹{originalPrice}</span>
            )}
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--bg-deep)' }}>₹{price}</span>
          </div>
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
