import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Truck, ArrowLeft, ShoppingBag, ShieldCheck, Leaf, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUtils';

export default function Cart() {
  const { cart, loading, updateItemQuantity, removeItem, SHIPPING_THRESHOLD } = useCart();
  const navigate = useNavigate();

  if (loading) {
     return (
       <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
         <div className="fade-in" style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 800 }}>Establishing Connection...</div>
       </div>
     );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '8rem 1rem', textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ backgroundColor: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#cbd5e1' }}>
            <ShoppingBag size={32} strokeWidth={1} />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)' }}>Your Collection is Empty</h1>
          <p style={{ color: '#64748b', marginBottom: '3rem', fontSize: '1rem', maxWidth: '400px', margin: '0 auto 3rem', lineHeight: 1.6 }}>Discover our latest rare specimens and start building your sanctuary today.</p>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '100px' }}>Explore the Gallery</Link>
        </div>
      </div>
    );
  }

  const remainingForFreeShipping = Math.max(0, SHIPPING_THRESHOLD - cart.subtotal);

  return (
    <div className="container" style={{ padding: '4rem 1rem 10rem' }}>
      {/* Header */}
      <div className="slide-up" style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>My Collection</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
             {cart.total_items} Specimens Reserved
          </div>
        </div>
        <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Continue Discovery
        </Link>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '4rem', alignItems: 'start' }}>
        {/* Item List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.items.map((item, index) => {
            const product = item.product || {};
            const variant = item.variant || {};
            const image = getImageUrl(variant.image_url || product.image_url || product.image);
            
            return (
              <div key={item.id} className="slide-up" style={{ 
                display: 'grid',
                gridTemplateColumns: '120px 1fr 150px',
                gap: '2rem',
                alignItems: 'center',
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                transition: 'border-color 0.2s ease'
              }}>
                {/* Image Section */}
                <div style={{ height: '120px', width: '120px', backgroundColor: '#f8fafc', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} />
                </div>

                {/* Content Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ color: 'var(--brand-gold)', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    {product.seller?.seller_profile?.store_name || "Botanical Studio"}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--bg-deep)', margin: 0 }}>
                    <Link to={`/product/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.name}</Link>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                     <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Specimen: {variant.name || 'Standard'}</span>
                     {item.note && (
                       <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase' }}>• {item.note}</span>
                     )}
                  </div>
                  
                  {/* Inline Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '100px', padding: '0.25rem 0.75rem' }}>
                      <button 
                          onClick={() => updateItemQuantity(index, -1)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', padding: '0.25rem' }}
                      >-</button>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                          onClick={() => updateItemQuantity(index, 1)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bg-deep)', fontSize: '1rem', padding: '0.25rem' }}
                      >+</button>
                    </div>
                    <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>

                {/* Price Section */}
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--bg-deep)' }}>
                     ₹{((variant.price || product.price || 0) * item.quantity).toLocaleString()}
                   </div>
                   <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>₹{(variant.price || product.price || 0).toLocaleString()} / unit</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Concierge (Right) */}
        <aside style={{ position: 'sticky', top: '8rem' }} className="slide-up">
          <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', fontFamily: 'var(--font-serif)' }}>Concierge Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b' }}>
                <span>Collection Subtotal</span>
                <span style={{ fontWeight: 700, color: 'var(--bg-deep)' }}>₹{cart.subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b' }}>
                <span>Botanical Tax (GST)</span>
                <span style={{ fontWeight: 700, color: 'var(--bg-deep)' }}>₹{cart.tax_total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b' }}>
                <span>Thermal Packaging</span>
                <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? '#10b981' : 'var(--bg-deep)' }}>
                   {cart.shipping_total === 0 ? 'COMPLIMENTARY' : `₹${cart.shipping_total}`}
                </span>
              </div>
            </div>

            {/* Packaging Progress */}
            {remainingForFreeShipping > 0 && (
              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Complimentary Packaging</span>
                  <span>₹{remainingForFreeShipping} left</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (cart.subtotal / SHIPPING_THRESHOLD) * 100)}%`, backgroundColor: 'var(--brand-gold)', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                </div>
              </div>
            )}
            
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '2rem 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', fontWeight: 900, fontSize: '1.75rem', color: 'var(--bg-deep)' }}>
              <span>Total</span>
              <span>₹{cart.grand_total.toLocaleString()}</span>
            </div>

            <button onClick={() => navigate('/checkout')} style={{ 
              width: '100%', 
              padding: '1.25rem', 
              backgroundColor: 'var(--bg-deep)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '14px', 
              fontWeight: 800, 
              fontSize: '0.95rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 30px rgba(10, 48, 41, 0.15)'
            }}>
              PROCEED TO ACQUISITION <ChevronRight size={18} />
            </button>
            
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={16} color="#0A3029" />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Secure Thermal-Locked Shipping</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Leaf size={16} color="#0A3029" />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Specimen Health Guarantee</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
