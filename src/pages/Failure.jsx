import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, MessageSquare, ArrowLeft } from 'lucide-react';

export default function Failure() {
  const location = useLocation();
  const navigate = useNavigate();
  const error = location.state?.error || "We encountered a synchronization error with the payment vault.";

  return (
    <div className="container" style={{ padding: '6rem 1rem 10rem' }}>
      <div className="slide-up" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '50%' }}>
            <AlertCircle size={60} strokeWidth={1.5} />
          </div>
        </div>
        
        <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>Acquisition Failed</h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.8, marginBottom: '4rem' }}>
          {error}
        </p>

        <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '24px', marginBottom: '4rem', textAlign: 'left' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--bg-deep)' }}>Protocol Suggestions:</h4>
          <ul style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1.25rem' }}>
            <li>Verify your payment method has sufficient botanical credits.</li>
            <li>Ensure your internet connection is stable.</li>
            <li>Retry the acquisition in a few moments.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <button onClick={() => navigate('/checkout')} className="btn btn-primary" style={{ padding: '1.25rem', borderRadius: '100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <RefreshCw size={18} /> Retry Acquisition
          </button>
          <Link to="/cart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Return to Collection
          </Link>
        </div>

        <div style={{ marginTop: '5rem', borderTop: '1px solid #f1f5f9', paddingTop: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--brand-gold)', fontWeight: 800, fontSize: '0.85rem' }}>
            <MessageSquare size={18} /> Need Assistance? Contact our Botanical Concierge
          </div>
        </div>
      </div>
    </div>
  );
}
