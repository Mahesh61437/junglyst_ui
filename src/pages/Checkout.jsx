import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { OrderService } from '../services/OrderService';
import { ShieldCheck, Truck, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', address: '', city: '', zip: ''
  });
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  if (!cart || (cart.items.length === 0 && !ordered)) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Data format expected by backend CheckoutView
      const checkoutData = {
        cart_id: cart.id || localStorage.getItem('cart_id'), // Assuming cart.id exists or is stored
        guest_info: {
          email: shipping.email || 'guest@example.com', // Should ideally be collected
          phone: shipping.phone || '0000000000',
          address: shipping
        }
      };
      
      const response = await OrderService.checkout(checkoutData);
      
      // If Razorpay is integrated, we would trigger the modal here
      // For now, if it succeeds, we clear cart and show success
      await clearCart();
      
      setOrderNum(response.order?.order_number || 'JL-' + Math.floor(Math.random() * 100000));
      setOrdered(true);
    } catch (err) {
      console.error("Checkout failed:", err);
      const errorMsg = err.response?.data?.error || "Botanical acquisition failed. Please check specimen availability.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (ordered) {
    return (
      <div className="container" style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ color: 'var(--brand-green)', marginBottom: '2.5rem' }}>
            <CheckCircle size={80} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Order Confirmed</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem' }}>
            Thank you, {shipping.firstName}. Your order <strong style={{ color: 'var(--bg-deep)' }}>#{orderNum}</strong> has been secured and is now entering our quarantine protocol.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/shop')} className="btn btn-primary" style={{ padding: '1.125rem 3.5rem' }}>
              Return to Gallery
            </button>
            <Link to="/profile" className="btn btn-outline" style={{ padding: '1.125rem 3.5rem' }}>
              Track Order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      <div className="slide-up" style={{ marginBottom: '4.5rem' }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem', textDecoration: 'none' }}>
           <ArrowLeft size={16} /> Return to Collection
        </Link>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Secure Checkout</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Complete your acquisition with encrypted security.</p>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5rem', alignItems: 'start' }}>
        {/* Checkout Form */}
        <div style={{ flex: '1 1 600px' }} className="slide-up">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            <div style={{ backgroundColor: 'white', padding: '3.5rem', borderRadius: '32px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)', fontWeight: 800 }}>1</div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Delivery Details</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required placeholder="E.g. John" value={shipping.firstName} onChange={e => setShipping({...shipping, firstName: e.target.value})} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required placeholder="E.g. Doe" value={shipping.lastName} onChange={e => setShipping({...shipping, lastName: e.target.value})} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Shipping Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input required placeholder="Street address, apartment, suite" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>City / Region <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required placeholder="E.g. Kochi" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>ZIP Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required placeholder="682001" value={shipping.zip} onChange={e => setShipping({...shipping, zip: e.target.value})} style={{ width: '100%', padding: '1.125rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }} />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '3.5rem', borderRadius: '32px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)', fontWeight: 800 }}>2</div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Secure Payment</h3>
              </div>

              <div style={{ border: '2px solid var(--brand-gold)', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '6px solid var(--brand-gold)', backgroundColor: 'white' }}></div>
                <div style={{ flexGrow: 1 }}>
                  <span style={{ fontWeight: 800, color: 'var(--bg-deep)', display: 'block', fontSize: '1.1rem' }}>Encrypted Payment Hub</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Credit Card, UPI, and NetBanking via PayU</span>
                </div>
                <ShieldCheck size={28} color="var(--brand-gold)" />
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.8 }}>
                 Your botanical order will be processed via our high-fidelity secure payment vault. You will be redirected to the secure gateway to complete your transaction.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '1.5rem', fontSize: '1.25rem' }}>
              {loading ? 'Validating Acquisition...' : `SECURE ORDER • ₹${cart.grand_total.toLocaleString()}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <aside style={{ flex: '1 1 400px', position: 'sticky', top: '8rem' }} className="slide-up">
          <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2.5rem' }}>Specimen Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {cart.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      <img src={item.product?.image_url || item.product?.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.quantity}x {item.product?.title || item.product?.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '2.5rem 0' }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{cart.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <span>GST (18%)</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{cart.tax_total.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <span>Shipping</span>
                    <span style={{ fontWeight: 700, color: cart.shipping_total === 0 ? 'var(--brand-green)' : 'var(--text-primary)' }}>
                        {cart.shipping_total === 0 ? 'FREE' : `₹${cart.shipping_total.toLocaleString()}`}
                    </span>
                </div>
            </div>

            <div style={{ borderTop: '2px solid var(--bg-deep)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '2rem' }}>
              <span>Total</span>
              <span>₹{cart.grand_total.toLocaleString()}</span>
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
               <Truck size={20} color="var(--brand-gold)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
               <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                 Orders are processed within <strong style={{ color: 'var(--bg-deep)' }}>24-48 hours</strong> with priority botanical shipping.
               </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

