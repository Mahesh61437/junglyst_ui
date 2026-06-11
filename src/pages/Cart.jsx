import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trackCheckoutInitiated } from '../utils/analytics';
import { ArrowLeft, ShoppingBag, ShieldCheck, ChevronRight, Star, Package, MapPin, AlertTriangle, CheckCircle, Loader2, Calendar, Truck, Leaf } from 'lucide-react';
import SellerNudgeProducts from '../components/SellerNudgeProducts';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUtils';

export default function Cart() {
  const {
    cart, loading,
    updateItemQuantity, removeItem,
    checkPincode, pincodeChecking, pincodeResult,
  } = useCart();
  const { addToWishlist } = useWishlist();
  const navigate = useNavigate();

  const [pincodeInput, setPincodeInput] = useState('');

  if (loading) {
    return (
      <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
        <div className="fade-in" style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 800 }}>Analyzing Logistics...</div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '8rem 1.5rem', textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ backgroundColor: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#cbd5e1' }}>
            <ShoppingBag size={32} strokeWidth={1} />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)' }}>Your Cart is Empty</h1>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '100px' }}>Explore Gallery</Link>
        </div>
      </div>
    );
  }

  const sellerGroups = cart.seller_groups || {};
  const hasMultipleSellers = Object.keys(sellerGroups).length > 1;

  const handlePincodeCheck = async () => {
    if (pincodeInput.length !== 6) return;
    await checkPincode(pincodeInput);
  };

  const outOfStockItems = cart.items.filter(item => item.quantity > (item.variant?.stock ?? Infinity));

  const handleCheckout = () => {
    trackCheckoutInitiated({ value: cart.grand_total, numItems: cart.total_items });
    navigate('/checkout');
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 10rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'clamp(1.5rem, 3vw, 3rem)', alignItems: 'start' }}>

        {/* ── Main Cart Content ── */}
        <div className="slide-up">

          {/* Pincode Check */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <MapPin size={16} color="#10b981" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1b2d2a' }}>Check Delivery</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit pincode"
                value={pincodeInput}
                onChange={e => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handlePincodeCheck()}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
              />
              <button
                onClick={handlePincodeCheck}
                disabled={pincodeInput.length !== 6 || pincodeChecking}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#1b2d2a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: pincodeInput.length === 6 ? 'pointer' : 'not-allowed', opacity: pincodeInput.length === 6 ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {pincodeChecking ? <Loader2 size={14} className="animate-spin" /> : null}
                Check
              </button>
            </div>
            {pincodeResult && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: pincodeResult.deliverable ? '#10b981' : '#ef4444' }}>
                {pincodeResult.deliverable
                  ? <><CheckCircle size={14} /> {pincodeResult.message}</>
                  : <><AlertTriangle size={14} /> {pincodeResult.message}</>
                }
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Shopping Cart</h1>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{cart.total_items} specimens · {Object.keys(sellerGroups).length} seller{Object.keys(sellerGroups).length !== 1 ? 's' : ''}</span>
            </div>

            {/* Seller Groups */}
            {Object.entries(sellerGroups).map(([sellerId, group]) => {
              const storeName = group.seller?.store_name || group.seller?.seller_profile?.store_name || group.seller?.full_name || 'Botanical Studio';

              return (
                <div key={sellerId} style={{ marginBottom: '3.5rem' }}>
                  {/* Seller Header */}
                  <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fcfdfc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--brand-gold)', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Studio: {storeName}</span>
                      <div style={{ height: '12px', width: '1px', backgroundColor: '#e2e8f0' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.7rem', fontWeight: 800 }}>
                        <ShieldCheck size={12} /> Verified Grower
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                      Studio Subtotal: ₹{group.subtotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Shipping nudge — primary + secondary tier messages */}
                  {group.nudge && (
                    <div style={{
                      backgroundColor: group.nudge.type === 'free' ? '#ecfdf5' : '#f0f9ff',
                      border: `1px solid ${group.nudge.type === 'free' ? '#6ee7b7' : '#bae6fd'}`,
                      borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.75rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {group.nudge.type === 'free'
                          ? <CheckCircle size={14} color="#10b981" />
                          : <Package size={14} color="#0284c7" />
                        }
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: group.nudge.type === 'free' ? '#065f46' : '#075985' }}>
                          {group.nudge.message}
                        </span>
                      </div>
                      {group.nudge.secondary_message && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                          <Package size={14} color="#0284c7" style={{ opacity: 0.6 }} />
                          <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#0369a1' }}>
                            {group.nudge.secondary_message}
                          </span>
                        </div>
                      )}
                      {/* Seller product suggestions */}
                      {group.nudge.show_products && group.nudge.type !== 'free' && (
                        <SellerNudgeProducts sellerId={sellerId} sellerName={storeName} sellerSlug={group.seller?.slug || group.seller?.seller_profile?.slug} />
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {group.items.map((item) => {
                      const product = item.product || {};
                      const variant = item.variant || {};
                      const stock = variant.stock || 0;
                      const itemIndex = cart.items.findIndex(i => i.id === item.id);

                      return (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'clamp(90px,20vw,140px) 1fr', gap: 'clamp(0.75rem,2vw,2rem)', padding: 'clamp(0.75rem,2vw,1.5rem)', borderRadius: '16px', backgroundColor: '#fff', border: '1px solid #f8fafc', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                          <Link to={`/product/${product.slug || product.id}`} style={{ display: 'block', width: 'clamp(90px,20vw,140px)', height: 'clamp(90px,20vw,140px)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8fafc', flexShrink: 0 }}>
                            <img src={getImageUrl(product.images?.find(img => img.variant === variant.id)?.image_url || product.image || product.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.04)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'} onError={e => { e.target.onerror = null; e.target.src = '/assets/default-product.jpg'; }} alt={product.name} />
                          </Link>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <Link to={`/product/${product.slug || product.id}`} style={{ textDecoration: 'none' }}>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--bg-deep)' }}>{product.name}</h3>
                              </Link>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fff9eb', color: '#c45500', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                                <Star size={10} fill="#c45500" /> {product.rating || '4.8'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}><b>Specimen:</b> {variant.name || 'Standard'}</span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}><b>Type:</b> {variant.item_category || 'light'} item</span>
                              {variant.stock != null && stock === 0 && (
                                <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 800 }}>Out of stock — remove to checkout</span>
                              )}
                              {stock > 0 && stock < 10 && (
                                <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 800 }}>Only {stock} remaining</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                              <Package size={14} /> Ready for Botanical Packaging
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: 'auto' }}>
                              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.15rem' }}>
                                <button onClick={() => updateItemQuantity(itemIndex, -1)} style={{ padding: '0.2rem 0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}>-</button>
                                <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                <button onClick={() => updateItemQuantity(itemIndex, 1)} style={{ padding: '0.2rem 0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}>+</button>
                              </div>
                              <button onClick={() => removeItem(itemIndex)} style={{ background: 'none', border: 'none', color: '#007185', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                              <button onClick={() => addToWishlist(product.id)} style={{ background: 'none', border: 'none', color: '#007185', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Save for later</button>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', gridColumn: '1 / -1' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--bg-deep)', marginBottom: '0.25rem' }}>
                              ₹{((variant.price || product.price || 0) * item.quantity).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                              ₹{(variant.price || product.price || 0).toLocaleString()} / unit
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Per-seller shipping line + next dispatch window */}
                  <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', backgroundColor: '#f8faf9', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Shipping from {storeName}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: group.shipping_fee === 0 ? '#10b981' : '#1b2d2a' }}>
                        {group.shipping_fee === 0 ? 'FREE' : `₹${group.shipping_fee}`}
                      </span>
                    </div>
                    {group.shipping_window && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                          <Calendar size={12} color="#64748b" />
                          Ships: <strong style={{ color: '#1b2d2a' }}>{group.shipping_window.ships_on}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                          <Truck size={12} color="#64748b" />
                          Est. delivery: <strong style={{ color: '#1b2d2a' }}>{group.shipping_window.estimated_delivery}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Discovery Gallery
            </Link>
          </div>
        </div>

        {/* ── Order Summary Sidebar ── */}
        <aside style={{ position: 'sticky', top: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', fontFamily: 'var(--font-serif)' }}>Order Summary</h3>

            {/* Per-seller breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {Object.entries(sellerGroups).map(([id, group]) => {
                const storeName = group.seller?.store_name || group.seller?.seller_profile?.store_name || group.seller?.full_name || 'Botanical Studio';
                return (
                  <div key={id} style={{ borderBottom: '1px dashed #f1f5f9', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, color: '#1b2d2a', fontSize: '0.8rem' }}>{storeName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
                      <span>Items subtotal</span>
                      <span style={{ fontWeight: 700, color: '#1b2d2a' }}>₹{group.subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginTop: '0.3rem' }}>
                      <span>Shipping</span>
                      <span style={{ fontWeight: 700, color: group.shipping_fee === 0 ? '#10b981' : '#1b2d2a' }}>
                        {group.shipping_fee === 0 ? 'FREE' : `₹${group.shipping_fee}`}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b', marginTop: '0.25rem' }}>
                <span>Total Shipping</span>
                <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? '#10b981' : 'var(--bg-deep)' }}>
                  {cart.shipping_total === 0 ? 'COMPLIMENTARY' : `₹${cart.shipping_total}`}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', paddingTop: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Total Investment</span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--bg-deep)' }}>
                  ₹{cart.grand_total.toLocaleString()}
                </span>
              </div>
            </div>

            {outOfStockItems.length > 0 && (
              <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                {outOfStockItems.map(item => (
                  <div key={item.id}>{item.product?.name} ({item.variant?.name}) is out of stock. Remove it to proceed.</div>
                ))}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={outOfStockItems.length > 0}
              style={{
                width: '100%', padding: '1.25rem',
                backgroundColor: outOfStockItems.length > 0 ? '#94a3b8' : 'var(--bg-deep)',
                color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '1rem',
                cursor: outOfStockItems.length > 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 30px rgba(10, 48, 41, 0.15)',
              }}
            >
              SECURE CHECKOUT <ChevronRight size={20} />
            </button>

            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Thermal-Locked Shipping</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Leaf size={18} color="#10b981" />
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Vitality Guaranteed</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
