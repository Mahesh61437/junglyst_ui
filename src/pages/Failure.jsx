import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, MessageSquare, ArrowLeft, Clock, ShoppingBag } from 'lucide-react';

export default function Failure() {
  const location = useLocation();
  const navigate = useNavigate();
  const error = location.state?.error || 'An unexpected error occurred during checkout.';

  const isPending = error.toLowerCase().includes('longer than expected') || error.toLowerCase().includes('check my orders');

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      <div className="slide-up" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>

        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            padding: '1.5rem',
            backgroundColor: isPending ? '#fffbeb' : '#fef2f2',
            borderRadius: '50%',
            color: isPending ? '#d97706' : '#ef4444',
          }}>
            {isPending ? <Clock size={60} strokeWidth={1.5} /> : <AlertCircle size={60} strokeWidth={1.5} />}
          </div>
        </div>

        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem', color: '#1b2d2a' }}>
          {isPending ? 'Payment Pending' : 'Payment Failed'}
        </h1>

        <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.8, marginBottom: '2.5rem' }}>
          {error}
        </p>

        {isPending ? (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem', textAlign: 'left' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400e', marginBottom: '0.75rem', textTransform: 'uppercase' }}>What to do:</p>
            <ul style={{ fontSize: '0.88rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '1.25rem', margin: 0 }}>
              <li>Check <strong>My Orders</strong> — your order may have been placed successfully.</li>
              <li>If money was deducted, it will be refunded within 5–7 business days.</li>
              <li>Contact support with your payment reference if needed.</li>
            </ul>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem', textAlign: 'left' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1b2d2a', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Suggestions:</p>
            <ul style={{ fontSize: '0.88rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '1.25rem', margin: 0 }}>
              <li>Ensure your payment method has sufficient balance.</li>
              <li>Check that your internet connection is stable.</li>
              <li>Try a different UPI app or payment method.</li>
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isPending && (
            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary"
              style={{ padding: '1.1rem', borderRadius: '100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 800 }}
            >
              <RefreshCw size={18} /> Retry Payment
            </button>
          )}
          <Link
            to="/orders"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#1b2d2a', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', padding: '1.1rem', borderRadius: '100px', border: '2px solid #1b2d2a' }}
          >
            <ShoppingBag size={16} /> Check My Orders
          </Link>
          <Link
            to="/cart"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Return to Cart
          </Link>
        </div>

        <div style={{ marginTop: '4rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.85rem' }}>
            <MessageSquare size={16} /> Need help? admin@junglyst.com
          </div>
        </div>
      </div>
    </div>
  );
}
