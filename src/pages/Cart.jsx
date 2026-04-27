import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Truck, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, loading, updateItemQuantity, removeItem } = useCart();
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
          <div style={{ backgroundColor: 'var(--bg-secondary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: 'var(--brand-gold)' }}>
            <ShoppingBag size={32} />
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Your Collection</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '3.5rem', fontSize: '1.125rem', maxWidth: '500px', margin: '0 auto 3.5rem' }}>Your boutique collection is currently empty. Discover rare specimens in our seasonal gallery.</p>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1.125rem 3.5rem' }}>Explore Gallery</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      <div className="slide-up" style={{ marginBottom: '4.5rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>The Collection</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Your curated selections awaiting fulfillment.</p>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5rem', alignItems: 'start' }}>
        {/* Cart Items */}
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="slide-up">
          {cart.items.map((item, index) => (
            (() => {
              const stockLimitRaw = item?.variant?.stock ?? item?.product?.stock ?? null;
              const stockLimit = typeof stockLimitRaw === 'number' ? stockLimitRaw : parseInt(stockLimitRaw ?? '', 10);
              const hasStockLimit = Number.isFinite(stockLimit);
              const canDecrement = (item.quantity || 0) > 0;
              const canIncrement = !hasStockLimit || (item.quantity || 0) < stockLimit;
              const lowStock = hasStockLimit && stockLimit > 0 && stockLimit < 10;
              return (
            <div key={item.id} style={{ 
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '24px',
              border: '1px solid var(--border-subtle)',
              display: 'flex', 
              gap: '2rem',
              flexWrap: 'wrap',
              transition: 'all 0.3s ease',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ width: '140px', height: '140px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <img src={item.product?.image_url || item.product?.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.product?.name} />
              </div>
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                     <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        <Link to={`/product/${item.product?.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{item.product?.name || item.product?.title}</Link>
                     </h3>
                     <p style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
                        {item.product?.category || 'Rare Specimen'}
                     </p>
                     {lowStock && (
                       <p style={{ marginTop: '0.4rem', color: '#ef4444', fontWeight: 800, fontSize: '0.8rem' }}>
                         only {stockLimit} left
                       </p>
                     )}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--bg-deep)' }}>₹{item.product?.price}</div>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '100px', padding: '0.35rem' }}>
                    <button
                      onClick={() => updateItemQuantity(index, -1)}
                      disabled={!canDecrement}
                      style={{
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'white', borderRadius: '50%', border: '1px solid var(--border-subtle)',
                        cursor: canDecrement ? 'pointer' : 'not-allowed', fontWeight: 700, opacity: canDecrement ? 1 : 0.4
                      }}
                    >-</button>
                    <span style={{ padding: '0 1.25rem', fontWeight: 800, fontSize: '0.95rem', minWidth: '40px', textAlign: 'center' }}>{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(index, 1)}
                      disabled={!canIncrement}
                      style={{
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'white', borderRadius: '50%', border: '1px solid var(--border-subtle)',
                        cursor: canIncrement ? 'pointer' : 'not-allowed', fontWeight: 700, opacity: canIncrement ? 1 : 0.4
                      }}
                    >+</button>
                  </div>
                  <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            </div>
              );
            })()
          ))}

          <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <ArrowLeft size={18} /> Continue Discovery
          </Link>
        </div>

        {/* Order Summary */}
        <aside style={{ flex: '1 1 380px', position: 'sticky', top: '8rem' }} className="slide-up">
          <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2.5rem' }}>Concierge Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{cart.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                <span>GST (18%)</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{cart.tax_total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? 'var(--brand-green)' : 'var(--text-primary)' }}>
                   {cart.shipping_total === 0 ? 'FREE' : `₹${cart.shipping_total.toFixed(2)}`}
                </span>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '2.5rem 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', fontWeight: 800, fontSize: '1.75rem' }}>
              <span>Total</span>
              <span>₹{cart.grand_total.toFixed(2)}</span>
            </div>

            <button onClick={() => navigate('/checkout')} className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem' }}>
              SECURE CHECKOUT
            </button>
            
            <div style={{ marginTop: '2.5rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <Truck size={20} color="var(--brand-gold)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--bg-deep)' }}>Premium Live Packaging</strong>. Each specimen is thermal-locked for safe delivery to your collection.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

