import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Calendar, ArrowRight, UserPlus, Mail, Copy, Check, MapPin, Phone, Clock, AlertCircle, ShoppingBag, CreditCard, Leaf } from 'lucide-react';
import { trackPurchase } from '../utils/metaPixel';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUtils';

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clearCart();
    if (order) {
      trackPurchase({ orderId: order.order_number, value: order.total_amount ?? order.grand_total });
    }
  }, []);

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate estimated delivery (3-5 business days)
  const getEstimatedDelivery = () => {
    const today = new Date();
    const delivery = new Date(today.setDate(today.getDate() + 4));
    return delivery.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!order) {
    return (
      <div className="container" style={{ padding: '10rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Acquisition Confirmed</h2>
        <p style={{ color: '#64748b', margin: '2rem 0' }}>Your botanical specimens are being prepared.</p>
        <Link to="/shop" className="btn btn-primary">Return to Gallery</Link>
      </div>
    );
  }

  const shippingAddress = order.shipping_address || {};

  return (
    <div className="container" style={{ padding: '4rem 1rem 8rem' }}>
      <div className="slide-up" style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ color: '#10b981', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '50%' }}>
              <CheckCircle size={60} strokeWidth={1.5} />
            </div>
          </div>
          <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem', color: '#1b2d2a' }}>
            Acquisition Secured
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.8 }}>
            Your specimen collection has been successfully registered.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>

          {/* Left: Order Summary */}
          <div>
            {/* Order ID Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              border: '2px solid var(--brand-gold)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: '0 0 0.75rem 0' }}>Order ID</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'monospace', color: '#1b2d2a', margin: '0 0 1.5rem 0' }}>
                #{order.order_number}
              </p>
              <button
                onClick={copyOrderId}
                style={{
                  backgroundColor: copied ? '#10b981' : 'var(--brand-gold)',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '50px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Save ID
                  </>
                )}
              </button>
            </div>

            {/* Order Details */}
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: '#1b2d2a', marginBottom: '1.5rem', margin: 0 }}>Order Details</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Subtotal (Incl. GST)</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1b2d2a' }}>₹{order.subtotal?.toLocaleString() || 0}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Shipping</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: order.shipping_fee === 0 ? '#10b981' : '#1b2d2a' }}>
                  {order.shipping_fee === 0 ? 'COMPLIMENTARY' : `₹${order.shipping_fee}`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '2px solid #1b2d2a', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1b2d2a' }}>Total Amount</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-gold)' }}>₹{order.total_amount?.toLocaleString() || order.grand_total?.toLocaleString()}</span>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <CreditCard size={16} color="#10b981" />
                <span style={{ fontSize: '0.8rem', color: '#166534' }}>Payment Received & Confirmed</span>
              </div>
            </div>

            {/* Delivery Timeline */}
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: '#1b2d2a', marginBottom: '1.5rem', margin: 0 }}>Estimated Delivery</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <Calendar size={20} color="#d97706" />
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', margin: 0 }}>Expected Arrival</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1b2d2a', margin: '0.25rem 0 0 0' }}>{getEstimatedDelivery()}</p>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem', lineHeight: 1.6 }}>
                <Leaf size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Typical delivery: 3-5 business days from preparation. Climate-controlled transit ensures specimen vitality.
              </p>
            </div>
          </div>

          {/* Right: Delivery & Items */}
          <div>
            {/* Delivery Address */}
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: '#1b2d2a', marginBottom: '1.5rem', margin: 0 }}>Delivery Address</h3>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <MapPin size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1b2d2a', margin: '0 0 0.5rem 0' }}>
                    {shippingAddress.full_name}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.25rem 0', lineHeight: 1.5 }}>
                    {shippingAddress.address_line1}
                    {shippingAddress.address_line2 && <>, {shippingAddress.address_line2}</>}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Phone size={16} color="#64748b" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Contact</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1b2d2a', margin: 0 }}>{shippingAddress.phone}</p>
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #f1f5f9', maxHeight: '350px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <ShoppingBag size={18} color="#1b2d2a" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: '#1b2d2a', margin: 0 }}>Items ({order.items?.length || 0})</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: idx !== order.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      {item.product_image && (
                        <img 
                          src={getImageUrl(item.product_image)} 
                          alt={item.product_name}
                          style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#f8fafc' }}
                          onError={e => { e.target.src = '/assets/default-product.jpg'; }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1b2d2a', margin: '0 0 0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.product_name}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.25rem 0' }}>{item.variant_name}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: <strong>{item.quantity}</strong></span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1b2d2a' }}>₹{(parseFloat(item.unit_price) * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No items to display</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: '#1b2d2a', marginBottom: '2rem', margin: 0 }}>What Happens Next</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: Package, title: 'Preparation', desc: 'Quarantine & health screening', status: 'in-progress', color: 'var(--brand-gold)' },
              { icon: Clock, title: 'Processing', desc: 'Thermal packaging setup', status: 'pending', color: '#94a3b8' },
              { icon: Truck, title: 'Dispatch', desc: 'Climate-controlled transit', status: 'pending', color: '#94a3b8' },
              { icon: Leaf, title: 'Delivery', desc: 'Arrival at sanctuary', status: 'pending', color: '#94a3b8' },
            ].map((step, idx) => (
              <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: step.status === 'in-progress' ? '#fff8e6' : '#f8fafc', border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <step.icon size={24} color={step.color} />
                  </div>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1b2d2a', margin: '0 0 0.5rem 0' }}>{step.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.75rem 0 0 0', textTransform: 'uppercase', fontWeight: 700 }}>
                  {step.status === 'in-progress' ? '⏳ In Progress' : '⏳ Pending'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Guest Alert */}
        {!user && (
          <div style={{
            backgroundColor: '#1b2d2a', borderRadius: '16px', padding: '2.5rem',
            marginBottom: '3rem', textAlign: 'left', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <AlertCircle size={24} color="var(--brand-gold)" />
                <h3 style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
                  Save Your Order
                </h3>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                Create a free account to track this order anytime and access exclusive member benefits.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to="/signup"
                  state={{ orderNumber: order.order_number }}
                  style={{
                    backgroundColor: 'var(--brand-gold)', color: '#1b2d2a',
                    padding: '0.85rem 2rem', borderRadius: '50px',
                    fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}
                >
                  <UserPlus size={16} /> Create Free Account
                </Link>
                <Link
                  to="/login"
                  style={{
                    color: 'rgba(255,255,255,0.8)', padding: '0.85rem 1.5rem',
                    borderRadius: '50px', border: '1px solid rgba(255,255,255,0.3)',
                    fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => { e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; }}
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          {user ? (
            <>
              <button 
                onClick={() => navigate('/shop')} 
                style={{
                  backgroundColor: '#1b2d2a', color: 'white',
                  padding: '1rem 2.5rem', borderRadius: '50px', border: 'none',
                  fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                Continue Browsing
              </button>
              <Link 
                to={`/orders/${order.id}`} 
                style={{
                  backgroundColor: 'white', color: '#1b2d2a',
                  padding: '1rem 2.5rem', borderRadius: '50px', border: '2px solid #1b2d2a',
                  fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                Track Order <ArrowRight size={18} />
              </Link>
            </>
          ) : (
            <button 
              onClick={() => navigate('/shop')} 
              style={{
                backgroundColor: '#1b2d2a', color: 'white',
                padding: '1rem 2.5rem', borderRadius: '50px', border: 'none',
                fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              Continue Browsing
            </button>
          )}
        </div>

        {/* Footer Info */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
              <Mail size={16} />
              Confirmation sent to email
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
              <Phone size={16} />
              Support: +91 1234-567-890
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
              <AlertCircle size={16} />
              Help: support@junglyst.com
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
            Thank you for your purchase! We're committed to delivering the finest botanical specimens with care and expertise.
          </p>
        </div>
      </div>
    </div>
  );
}
