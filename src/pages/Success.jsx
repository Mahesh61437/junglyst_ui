import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Calendar, ShoppingBag, ArrowRight } from 'lucide-react';

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

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
        <div style={{ color: '#10b981', marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '50%' }}>
            <CheckCircle size={60} strokeWidth={1.5} />
          </div>
        </div>
        
        <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>Acquisition Secured</h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b', lineHeight: 1.8, marginBottom: '4rem' }}>
          Your specimen collection <strong style={{ color: 'var(--bg-deep)' }}>#{order.order_number}</strong> has been successfully registered. 
          We are now entering the preservation and logistics protocol.
        </p>

        {/* Tactical Timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '5rem', backgroundColor: 'white', padding: '3rem', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
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

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <button onClick={() => navigate('/shop')} className="btn btn-primary" style={{ padding: '1.25rem 3.5rem', borderRadius: '100px' }}>
            Continue Discovery
          </button>
          <Link to={`/orders/${order.id}`} className="btn btn-outline" style={{ padding: '1.25rem 3.5rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Track Specimen <ArrowRight size={18} />
          </Link>
        </div>

        <div style={{ marginTop: '5rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            A detailed confirmation and tracking link has been sent to your registered email.
          </p>
        </div>
      </div>
    </div>
  );
}
