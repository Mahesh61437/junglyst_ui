import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, ShoppingBag, ShieldCheck, Leaf, ChevronRight, Bookmark, Info, Star, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUtils';

export default function Cart() {
  const { cart, loading, updateItemQuantity, removeItem } = useCart();
  const { addToWishlist } = useWishlist();
  const navigate = useNavigate();

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
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)' }}>Your Sanctuary is Empty</h1>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '100px' }}>Explore Gallery</Link>
        </div>
      </div>
    );
  }

  const sellerGroups = cart.seller_groups || {};

  return (
    <div className="container" style={{ padding: '3rem 1rem 10rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>

        {/* Main Cart Content */}
        <div className="slide-up">
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>Shopping Cart</h1>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{cart.total_items} specimens</span>
            </div>

            {/* Seller Grouping */}
            {Object.entries(sellerGroups).map(([sellerId, group]) => (
              <div key={sellerId} style={{ marginBottom: '3.5rem' }}>
                {/* Seller Header */}
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', backgroundColor: '#fcfdfc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: 'var(--brand-gold)', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Studio: {group.seller?.seller_profile?.store_name || "Botanical Studio"}</span>
                    <div style={{ height: '12px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.7rem', fontWeight: 800 }}>
                      <ShieldCheck size={12} /> Verified Grower
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Studio Subtotal: ₹{group.subtotal.toLocaleString()}</span>
                </div>

                {/* Items in this group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {group.items.map((item, idx) => {
                    const product = item.product || {};
                    const variant = item.variant || {};
                    const stock = variant.stock || 0;
                    return (
                      <div key={item.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 1fr 120px',
                        gap: '2rem',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        backgroundColor: '#fff',
                        border: '1px solid #f8fafc',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ width: '140px', height: '140px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8fafc', flexShrink: 0 }}>
                          <img src={getImageUrl(variant.image_url || product.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--bg-deep)' }}>{product.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fff9eb', color: '#c45500', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                              <Star size={10} fill="#c45500" /> {product.rating || '4.8'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                              <span style={{ fontWeight: 800, color: 'var(--bg-deep)' }}>Specimen:</span> {variant.name || 'Standard'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                              <span style={{ fontWeight: 800, color: 'var(--bg-deep)' }}>Weight:</span> {variant.weight || 0.5}kg
                            </div>
                            {stock > 0 && stock < 10 && (
                              <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 800 }}>
                                Only {stock} specimens remaining
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                            <Package size={14} /> Ready for Botanical Packaging
                          </div>

                          {/* Controls Row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.15rem' }}>
                              <button onClick={() => updateItemQuantity(cart.items.indexOf(item), -1)} style={{ padding: '0.2rem 0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}>-</button>
                              <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => updateItemQuantity(cart.items.indexOf(item), 1)} style={{ padding: '0.2rem 0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}>+</button>
                            </div>
                            <button onClick={() => removeItem(cart.items.indexOf(item))} style={{ background: 'none', border: 'none', color: '#007185', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                            <button onClick={() => addToWishlist(product.id)} style={{ background: 'none', border: 'none', color: '#007185', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Save for later</button>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
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
              </div>
            ))}

            <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Discovery Gallery
            </Link>
          </div>
        </div>

        {/* Tactical Sidebar */}
        <aside style={{ position: 'sticky', top: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', fontFamily: 'var(--font-serif)' }}>Order Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                <span>Subtotal <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(GST Incl.)</span></span>
                <span style={{ fontWeight: 700, color: 'var(--bg-deep)' }}>₹{cart.subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                <span>Logistics Fee</span>
                <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? '#10b981' : 'var(--bg-deep)' }}>
                  {cart.shipping_total === 0 ? 'COMPLIMENTARY' : `₹${cart.shipping_total.toLocaleString()}`}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', paddingTop: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Total Investment</span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--bg-deep)' }}>₹{cart.grand_total.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={() => navigate('/checkout')} style={{
              width: '100%',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-deep)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 30px rgba(10, 48, 41, 0.15)'
            }}>
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
