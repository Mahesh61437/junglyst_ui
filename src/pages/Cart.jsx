import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Truck, ArrowLeft, ShoppingBag, ShieldCheck, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUtils';

export default function Cart() {
  const { cart, loading, updateItemQuantity, removeItem, SHIPPING_THRESHOLD } = useCart();
  const navigate = useNavigate();

  if (loading) {
     return (
       <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
         <div className="fade-in" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>Assembling your collection...</div>
       </div>
     );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ backgroundColor: '#f0f4f0', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: 'var(--bg-deep)' }}>
            <ShoppingBag size={40} strokeWidth={1} />
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Empty Sanctuary</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '3.5rem', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 3.5rem', lineHeight: 1.8 }}>Your curated gallery is currently empty. Explore our seasonal specimens to start your collection.</p>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1.25rem 4rem', borderRadius: '100px' }}>Discovery Gallery</Link>
        </div>
      </div>
    );
  }

  const shippingProgress = Math.min(100, (cart.subtotal / SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = SHIPPING_THRESHOLD - cart.subtotal;

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      <div className="slide-up" style={{ marginBottom: '5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '3rem' }}>
        <h1 style={{ fontSize: '4.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>Your Collection</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
           <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>{cart.total_items} specimens ready for acquisition</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '6rem', alignItems: 'start' }}>
        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {cart.items.map((item, index) => {
            const product = item.product || {};
            const variant = item.variant || {};
            const image = getImageUrl(variant.image_url || product.image_url || product.image);
            
            return (
              <div key={item.id} style={{ 
                display: 'grid',
                gridTemplateColumns: '180px 1fr 120px',
                gap: '2.5rem',
                alignItems: 'center',
                paddingBottom: '3rem',
                borderBottom: '1px solid #f8fafc'
              }}>
                {/* Product Image */}
                <div style={{ position: 'relative', height: '220px', backgroundColor: '#fcfdfc', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} />
                  {product.is_rare && (
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '0.5rem', fontWeight: 900, padding: '0.35rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Focus</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--brand-gold)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    {product.seller?.seller_profile?.store_name || "Botanical Studio"}
                  </span>
                  <h3 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)', margin: 0 }}>
                    <Link to={`/product/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.name}</Link>
                  </h3>
                  {variant.name && (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Specimen: {variant.name}</span>
                  )}
                  {item.note && (
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={12} /> {item.note}
                    </div>
                  )}
                  
                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '100px', padding: '0.5rem 1rem' }}>
                      <button 
                          onClick={() => updateItemQuantity(index, -1)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.25rem' }}
                          disabled={item.quantity <= 1}
                      >-</button>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                          onClick={() => updateItemQuantity(index, 1)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bg-deep)', fontSize: '1.25rem' }}
                      >+</button>
                    </div>
                    <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                      Remove Item
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.5rem', color: 'var(--bg-deep)' }}>
                  ₹{((variant.price || product.price || 0) * item.quantity).toLocaleString()}
                </div>
              </div>
            );
          })}

          <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem', fontSize: '0.8rem', color: 'var(--brand-gold)', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            <ArrowLeft size={16} /> Continue discovery
          </Link>
        </div>

        {/* Order Summary */}
        <aside style={{ position: 'sticky', top: '8rem' }}>
          <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2.5rem', fontFamily: 'var(--font-serif)' }}>Concierge Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700, color: 'var(--bg-deep)' }}>₹{cart.subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                <span>Botanical Tax (GST)</span>
                <span style={{ fontWeight: 700, color: 'var(--bg-deep)' }}>₹{cart.tax_total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                <span>Thermal Packaging</span>
                <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? '#10b981' : 'var(--bg-deep)' }}>
                   {cart.shipping_total === 0 ? 'COMPLIMENTARY' : `₹${cart.shipping_total}`}
                </span>
              </div>
            </div>

            {/* Shipping Progress */}
            {cart.shipping_total > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--brand-gold)' }}>
                  <span>Complimentary Packaging</span>
                  <span>₹{remainingForFreeShipping} remaining</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${shippingProgress}%`, backgroundColor: 'var(--brand-gold)', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
            )}
            
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '2.5rem 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', fontWeight: 800, fontSize: '2rem', color: 'var(--bg-deep)' }}>
              <span>Total</span>
              <span>₹{cart.grand_total.toLocaleString()}</span>
            </div>

            <button onClick={() => navigate('/checkout')} style={{ 
              width: '100%', 
              padding: '1.5rem', 
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
              boxShadow: '0 10px 30px rgba(10, 48, 41, 0.2)'
            }}>
              <ShieldCheck size={20} /> SECURE CHECKOUT
            </button>
            
            <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={18} color="#0A3029" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Thermal-Locked Shipping</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>Climate-controlled packaging ensured for live specimens.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Leaf size={18} color="#0A3029" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Health Guaranteed</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>All specimens verified for vitality before being box-sealed.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

