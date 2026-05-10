import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Calendar, ArrowRight, UserPlus, Mail, Copy, Check } from 'lucide-react';
import { trackPurchase } from '../utils/metaPixel';
import { useAuth } from '../context/AuthContext';

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (order) {
      trackPurchase({ orderId: order.order_number, value: order.total_amount ?? order.grand_total });
    }
  }, [order]);

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      <div className="slide-up" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>

        {/* Success icon */}
        <div style={{ color: '#10b981', marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '50%' }}>
            <CheckCircle size={60} strokeWidth={1.5} />
          </div>
        </div>

        <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
          Acquisition Secured
        </h1>

        {/* Alert for guest users - NOT SIGNED IN */}
        {!user && (
          <div style={{
            backgroundColor: '#fef08a',
            border: '2px solid #eab308',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <div style={{ color: '#ca8a04', fontSize: '1.5rem', marginTop: '0.25rem' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#854d0e', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                You are not signed in
              </p>
              <p style={{ fontSize: '0.85rem', color: '#78350f', margin: 0, lineHeight: 1.6 }}>
                Please save your Order ID below to track this order in the future. Without signing in, you'll need this ID to access your order.
              </p>
            </div>
          </div>
        )}

        {/* Order ID Section - Prominent for Guests */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem 2rem',
          borderRadius: '16px',
          marginBottom: '3rem',
          border: '2px solid var(--brand-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>Your Order ID</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--bg-deep)', margin: 0 }}>
              #{order.order_number}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: 0 }}>Items</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--bg-deep)', margin: '0.25rem 0 0 0' }}>
                {order.total_quantity}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: 0 }}>Total</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-gold)', margin: '0.25rem 0 0 0' }}>
                ₹{order.total_amount?.toLocaleString('en-IN') || order.total_amount}
              </p>
            </div>
          </div>

          <button
            onClick={copyOrderId}
            style={{
              backgroundColor: copied ? '#10b981' : 'var(--brand-gold)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '50px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minWidth: '150px',
              justifyContent: 'center'
            }}
          >
            {copied ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Save ID
              </>
            )}
          </button>
        </div>

        <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.8, marginBottom: '4rem' }}>
          Your specimen collection has been successfully registered. We are now entering the preservation and logistics protocol.
        </p>

        {/* Timeline */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem',
          marginBottom: '4rem', backgroundColor: 'white', padding: '2rem',
          borderRadius: '32px', border: '1px solid #f1f5f9'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--brand-gold)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Package size={24} />
            </div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Preparation</h4>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Quarantine & Health Check</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Truck size={24} />
            </div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Transit</h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Climate-Controlled Transit</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Calendar size={24} />
            </div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Delivery</h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Arrival at Sanctuary</p>
          </div>
        </div>

        {/* Guest nudge — prominent CTA to create account */}
        {!user && (
          <div style={{
            backgroundColor: '#1b2d2a', borderRadius: '28px', padding: '3rem 3.5rem',
            marginBottom: '3.5rem', textAlign: 'left', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(229,196,139,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserPlus size={20} color="var(--brand-gold)" />
                </div>
                <div>
                  <p style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Next Steps</p>
                  <h3 style={{ color: 'white', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', margin: 0, marginTop: '0.2rem' }}>
                    Create an account or track as guest
                  </h3>
                </div>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '2rem', maxWidth: '520px', fontWeight: 500 }}>
                <strong style={{ color: 'var(--brand-gold)' }}>Save your Order ID: #{order.order_number}</strong> to track this order anytime.
              </p>

              <div style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '1.2rem',
                marginBottom: '1.5rem',
                borderLeft: '4px solid var(--brand-gold)'
              }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
                  <strong style={{ color: 'white' }}>📋 Your Order ID:</strong> You can track this order anytime using your Order ID <strong style={{ color: 'var(--brand-gold)' }}>#{order.order_number}</strong>. Save it for future reference!
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <Mail size={15} color="rgba(255,255,255,0.5)" />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
                  A confirmation email with your order details has been sent.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to="/signup"
                  state={{ orderNumber: order.order_number }}
                  style={{
                    backgroundColor: 'var(--brand-gold)', color: 'white',
                    padding: '0.9rem 2rem', borderRadius: '50px',
                    fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}
                >
                  <UserPlus size={16} /> Create Free Account
                </Link>
                <Link
                  to="/login"
                  style={{
                    color: 'rgba(255,255,255,0.7)', padding: '0.9rem 1.5rem',
                    borderRadius: '50px', border: '1px solid rgba(255,255,255,0.2)',
                    fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
            <div style={{ position: 'absolute', right: '-20px', bottom: '-30px', fontSize: '12rem', opacity: 0.04, pointerEvents: 'none' }}>🌿</div>
          </div>
        )}

        {/* CTAs for logged-in users */}
        {user && (
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            <button onClick={() => navigate('/shop')} className="btn btn-primary" style={{ padding: '1.25rem 3.5rem', borderRadius: '100px' }}>
              Continue Discovery
            </button>
            <Link to={`/orders/${order.id}`} className="btn btn-outline" style={{ padding: '1.25rem 3.5rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Track Specimen <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {/* Guest CTA to continue shopping */}
        {!user && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            <button onClick={() => navigate('/shop')} className="btn btn-outline" style={{ padding: '1rem 3rem', borderRadius: '100px' }}>
              Continue Browsing
            </button>
          </div>
        )}

        <div style={{ marginTop: '3.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            A confirmation email with tracking details has been sent to your registered address.
          </p>
        </div>
      </div>
    </div>
  );
}
