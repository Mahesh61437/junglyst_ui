import { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Calendar, ArrowRight, UserPlus, Mail } from 'lucide-react';
import { trackPurchase } from '../utils/metaPixel';
import { useAuth } from '../context/AuthContext';

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;
  const { user } = useAuth();

  useEffect(() => {
    if (order) {
      trackPurchase({ orderId: order.order_number, value: order.total_amount ?? order.grand_total });
    }
  }, [order]);

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

        <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>
          Acquisition Secured
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b', lineHeight: 1.8, marginBottom: '4rem' }}>
          Your specimen collection <strong style={{ color: 'var(--bg-deep)' }}>#{order.order_number}</strong> has been
          successfully registered. We are now entering the preservation and logistics protocol.
        </p>

        {/* Timeline */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem',
          marginBottom: '4rem', backgroundColor: 'white', padding: '3rem',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(229,196,139,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserPlus size={20} color="var(--brand-gold)" />
                </div>
                <div>
                  <p style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>One more step</p>
                  <h3 style={{ color: 'white', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', margin: 0, marginTop: '0.2rem' }}>
                    Create an account to track your order
                  </h3>
                </div>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '480px' }}>
                Your order <strong style={{ color: 'white' }}>#{order.order_number}</strong> is confirmed.
                Create a free account to track its journey, view your order history, and save your delivery address for next time.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
          <button onClick={() => navigate('/shop')} className="btn btn-outline" style={{ padding: '1rem 3rem', borderRadius: '100px' }}>
            Continue Browsing
          </button>
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
