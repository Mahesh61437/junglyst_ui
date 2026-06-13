import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, CheckCircle, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUtils';
import { trackAddToCart, trackAddToWishlist } from '../utils/analytics';

export default function ProductCard({ id, slug, name, scientific_name, care_level, origin, growth_rate, price, originalPrice, image, trending, reviews, stockStatus, seller, brandColor, variants, stock, category, categories, category_name }) {
  const productPath = `/product/${slug || id}`;
  const { addItemToCart, updateItemQuantity, removeItem, cart } = useCart();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const sellerInfo = seller?.seller_profile || {};

  let calculatedStock = null;
  if (variants && variants.length > 0) {
    const availableStocks = variants
      .map(v => typeof v.stock === 'number' ? v.stock : parseInt(v.stock || '0', 10))
      .filter(s => !isNaN(s) && s > 0);
    
    if (availableStocks.length > 0) {
      calculatedStock = Math.min(...availableStocks);
    } else {
      calculatedStock = 0;
    }
  } else if (stock !== undefined && stock !== null) {
    calculatedStock = typeof stock === 'number' ? stock : parseInt(stock, 10);
  } else {
    calculatedStock = 0;
  }

  const stockLimit = Number.isFinite(calculatedStock) ? calculatedStock : null;
  const isSoldOut = stockLimit !== null && stockLimit <= 0;
  const isLowStock = stockLimit !== null && stockLimit > 0 && stockLimit < 10;
  const isInStock = stockLimit !== null && stockLimit >= 10;

  const parentCategoryName = (
    (typeof category === 'string' ? category : category?.name) ||
    categories?.[0]?.name ||
    ''
  ).toLowerCase();
  const subCategoryName = (category_name || '').toLowerCase();
  // Care-level rating only makes sense for aquatic plants — gate on the
  // parent category (e.g. "Aquatic Plants") OR a subcategory tagged aquatic
  // (e.g. "Aquatic Ferns") so mistagged-by-parent items still show correctly.
  const isAquaticPlant =
    parentCategoryName.includes('aquatic') || subCategoryName.includes('aquatic');

  const sellerName = sellerInfo.store_name || seller?.full_name || 'Junglyst';
  const sellerSlug = sellerInfo.slug || encodeURIComponent(sellerName);
  const accentColor = brandColor || sellerInfo.brand_color || 'var(--brand-gold)';
  const isSaved = isInWishlist(id);
  const finalImage = getImageUrl(image);

  const prices = variants?.length > 0 ? variants.map(v => parseFloat(v.price)) : [parseFloat(price)];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const cartItemIndex = cart.items.findIndex(item => item.product.id === id);
  const cartItem = cartItemIndex >= 0 ? cart.items[cartItemIndex] : null;
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  
  const baseVariant = variants?.find(v => parseFloat(v.price) === minPrice) || variants?.[0];
  const variantId = baseVariant ? baseVariant.id : null;

  const productData = { id, name, slug, image, seller, price };
  const variantData = baseVariant ?? null;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;
    addItemToCart(id, 1, variantId, productData, variantData);
    trackAddToCart({ productId: id, name, price, quantity: 1 });
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItemIndex < 0) return;
    if (quantityInCart <= 1) removeItem(cartItemIndex); // fully remove when qty hits 0
    else updateItemQuantity(cartItemIndex, -1);
  };

  return (
    <div
      className="product-card"
      onClick={() => navigate(productPath)}
      style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
    >
      {/* ── Image ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', backgroundColor: '#f0f4f0', flexShrink: 0, overflow: 'hidden', aspectRatio: '1 / 1' }}>
        <img
          src={finalImage || '/assets/default-product.jpg'}
          alt={name}
          loading="lazy"
          onError={e => { e.target.src = '/assets/default-product.jpg'; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: 'block' }}
          className="pc-img"
        />

        {/* Top-left badges */}
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {trending && (
            <span style={{ backgroundColor: '#FF5722', color: 'white', fontSize: '0.58rem', fontWeight: 900, padding: '0.25rem 0.6rem', borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trending</span>
          )}
          {care_level && isAquaticPlant && (
            <span style={{ backgroundColor: 'rgba(10,48,41,0.82)', backdropFilter: 'blur(6px)', color: 'white', fontSize: '0.55rem', fontWeight: 800, padding: '0.25rem 0.55rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{care_level}</span>
          )}
          {isSoldOut && (
            <span style={{ backgroundColor: 'rgba(239,68,68,0.9)', color: 'white', fontSize: '0.58rem', fontWeight: 900, padding: '0.25rem 0.6rem', borderRadius: '50px', textTransform: 'uppercase' }}>Sold Out</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWishlist({ id, name, price, image, seller }); if (!isSaved) trackAddToWishlist({ productId: id, name, price }); }}
          style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', color: isSaved ? accentColor : '#94a3b8', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Heart size={15} fill={isSaved ? accentColor : 'none'} strokeWidth={2} />
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '0.9rem 1rem 1rem' }}>

        {/* Seller */}
        <Link to={`/store/${sellerSlug}`} onClick={e => e.stopPropagation()}
          style={{ color: accentColor, fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', textDecoration: 'none', marginBottom: '0.3rem', display: 'block' }}>
          {sellerName}
        </Link>

        {/* Name */}
        <Link to={productPath} onClick={e => e.stopPropagation()}
          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: 'clamp(0.85rem,1.5vw,0.95rem)', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {name}
        </Link>

        {scientific_name && (
          <p style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-secondary)', margin: '0 0 0.65rem', opacity: 0.75, fontFamily: 'var(--font-serif)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{scientific_name}</p>
        )}

        {/* Attributes row */}
        {(growth_rate || origin) && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {growth_rate && (
              <div>
                <div style={{ fontSize: '0.5rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.06em' }}>Growth</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)' }}>{growth_rate}</div>
              </div>
            )}
            {origin && (
              <div>
                <div style={{ fontSize: '0.5rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.06em' }}>Origin</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)' }}>{origin}</div>
              </div>
            )}
          </div>
        )}

        {/* Spacer pushes footer to bottom */}
        <div style={{ flexGrow: 1 }} />

        {/* Stock status banner — sits right above the buy action */}
        {isInStock && !isSoldOut && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
            color: '#16a34a', fontSize: '0.68rem', fontWeight: 800,
            letterSpacing: '0.02em', padding: '0.4rem 0.6rem',
            borderRadius: '8px', marginBottom: '0.6rem'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
            In Stock
          </div>
        )}
        {isLowStock && !isSoldOut && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
            color: '#c2410c', fontSize: '0.68rem', fontWeight: 800,
            letterSpacing: '0.02em', padding: '0.4rem 0.6rem',
            borderRadius: '8px', marginBottom: '0.6rem'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ea580c', flexShrink: 0, animation: 'pc-pulse 1.6s ease-in-out infinite' }} />
            Only {stockLimit} left in stock
          </div>
        )}

        {/* ── Footer: price + cart action ──────────────────────────────── */}
        <div className="product-card-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>

          {/* Price */}
          {(() => {
            const discountPct = originalPrice && minPrice === maxPrice
              ? Math.round((1 - minPrice / originalPrice) * 100)
              : 0;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0, flex: '1 1 0%' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                  {minPrice !== maxPrice && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>from</span>
                  )}
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--bg-deep)' }}>
                    ₹{minPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {originalPrice && minPrice === maxPrice ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                      ₹{parseFloat(originalPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                    {discountPct > 0 && (
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#65a30d', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.05rem 0.3rem', letterSpacing: '0.02em' }}>
                        −{discountPct}%
                      </span>
                    )}
                  </div>
                ) : minPrice !== maxPrice && variants?.length > 1 ? (
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.03em' }}>
                    {variants.length} variants available
                  </span>
                ) : null}
              </div>
            );
          })()}

          {/* Cart action — always visible, never overlaid on image */}
          {isSoldOut ? (
            <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sold Out</span>
          ) : quantityInCart > 0 ? (
            // Quantity stepper — gold border, deep green buttons, matches brand
            <div className="cart-stepper" onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, minWidth: 0 }}>
              <button onClick={handleRemove}
                style={{ width: '32px', height: '32px', border: 'none', backgroundColor: 'var(--brand-gold)', color: 'var(--bg-deep)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', minWidth: 0 }}>
                <Minus size={11} strokeWidth={3} />
              </button>
              <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, color: 'var(--bg-deep)', backgroundColor: 'white', lineHeight: '32px' }}>
                {quantityInCart}
              </span>
              <button onClick={handleAdd}
                style={{ width: '32px', height: '32px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'var(--brand-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, minWidth: 0 }}>
                <Plus size={11} strokeWidth={3} />
              </button>
            </div>
          ) : (
            // Add to cart — pill button, deep green bg, gold text
            <button className="add-to-cart-btn" onClick={handleAdd}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.9rem', borderRadius: '10px', backgroundColor: 'var(--bg-deep)', color: 'var(--brand-gold)', border: '1.5px solid var(--bg-deep)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0, letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background-color 0.18s, color 0.18s, transform 0.15s', whiteSpace: 'nowrap', minWidth: 0 }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--bg-deep)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--bg-deep)'; e.currentTarget.style.color = 'var(--brand-gold)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <ShoppingCart size={12} />
              Add
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(0,0,0,0.09); }
        .product-card:hover .pc-img { transform: scale(1.06); }
        @media (max-width: 640px) {
          .product-card:hover { transform: none; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        }
        @media (max-width: 420px) {
          .product-card-footer {
            flex-wrap: wrap !important;
            justify-content: space-between !important;
          }
          .product-card-footer > div,
          .product-card-footer > button,
          .product-card-footer > .cart-stepper {
            min-width: 0 !important;
            flex: 1 1 auto !important;
          }
          .add-to-cart-btn {
            padding: 0.45rem 0.65rem !important;
            font-size: 0.72rem !important;
          }
          .cart-stepper button {
            width: 28px !important;
            height: 28px !important;
          }
          .cart-stepper span {
            min-width: 24px !important;
            line-height: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
