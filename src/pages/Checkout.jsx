import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { OrderService } from '../services/OrderService';
import { ShieldCheck, Truck, ArrowLeft, MapPin, CreditCard, ShoppingBag, Info } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', address: '', city: '', zip: '', phone: '', email: ''
  });
  const [loading, setLoading] = useState(false);

  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const checkoutData = {
        cart_id: cart.id,
        guest_info: {
          email: shipping.email,
          phone: shipping.phone,
          address: shipping
        }
      };
      
      const response = await OrderService.checkout(checkoutData);
      await clearCart();
      // Redirect to success page with order info
      navigate('/checkout/success', { state: { order: response.order } });
    } catch (err) {
      console.error("Checkout failed:", err);
      navigate('/checkout/failure', { state: { error: err.response?.data?.error } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem 10rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
           <ArrowLeft size={14} /> Back to Collection
        </Link>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '4rem', alignItems: 'start' }}>
        {/* Acquisition Flow (Left) */}
        <div className="slide-up">
          <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Identity & Delivery */}
            <section style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-deep)', fontSize: '0.8rem', fontWeight: 900 }}>1</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Logistics & Identity</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Email Contact</label>
                  <input required type="email" placeholder="collector@email.com" value={shipping.email} onChange={e => setShipping({...shipping, email: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Mobile Secure</label>
                  <input required type="tel" placeholder="+91 XXXXX XXXXX" value={shipping.phone} onChange={e => setShipping({...shipping, phone: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>First Name</label>
                  <input required value={shipping.firstName} onChange={e => setShipping({...shipping, firstName: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Last Name</label>
                  <input required value={shipping.lastName} onChange={e => setShipping({...shipping, lastName: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>Field Address</label>
                <input required placeholder="Street address, landmark, suite" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>City</label>
                  <input required value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>PIN Code</label>
                  <input required placeholder="6XXXXX" value={shipping.zip} onChange={e => setShipping({...shipping, zip: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-deep)', fontSize: '0.8rem', fontWeight: 900 }}>2</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Payment Vault</h3>
              </div>

              <div style={{ border: '2px solid var(--brand-gold)', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fffdf9' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '5px solid var(--brand-gold)', backgroundColor: 'white' }}></div>
                <div style={{ flexGrow: 1 }}>
                  <span style={{ fontWeight: 800, color: 'var(--bg-deep)', display: 'block', fontSize: '0.95rem' }}>Secure Botanical Checkout</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Cards, UPI, NetBanking • PayU Secured</span>
                </div>
                <ShieldCheck size={20} color="var(--brand-gold)" />
              </div>
            </section>
          </form>
        </div>

        {/* Tactical Summary (Right) */}
        <aside style={{ position: 'sticky', top: '8rem' }} className="slide-up">
          <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>Order Summary</h3>
               <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', backgroundColor: '#ecfdf5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Secure</span>
            </div>
            
            {/* Compact Item List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '2rem', paddingRight: '0.5rem' }}>
              {cart.items.map(item => {
                const product = item.product || {};
                const variant = item.variant || {};
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f8fafc' }}>
                      <img src={getImageUrl(variant.image_url || product.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--bg-deep)' }}>{product.name}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Qty: {item.quantity} • {variant.name || 'Standard'}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>₹{((variant.price || product.price || 0) * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.5rem 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Subtotal <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>(GST Incl.)</span></span>
                  <span style={{ fontWeight: 700, color: 'var(--bg-deep)' }}>₹{cart.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Priority Packaging</span>
                  <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? '#10b981' : 'var(--bg-deep)' }}>
                    {cart.shipping_total === 0 ? 'COMPLIMENTARY' : `₹${cart.shipping_total}`}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', paddingTop: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Acquisition</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--bg-deep)' }}>₹{cart.grand_total.toLocaleString()}</span>
              </div>
            </div>

            <button type="submit" form="checkout-form" disabled={loading} style={{ 
              width: '100%', 
              padding: '1.25rem', 
              backgroundColor: 'var(--bg-deep)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '14px', 
              fontWeight: 800, 
              fontSize: '1rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'opacity 0.2s ease'
            }}>
              {loading ? 'Validating Specimens...' : `COMPLETE ACQUISITION`}
            </button>

            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.7rem' }}>
              <Info size={14} />
              <span>By clicking, you agree to our Botanical Care and Shipping protocols.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
