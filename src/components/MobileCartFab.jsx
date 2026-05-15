import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const HIDDEN_PREFIXES = ['/cart', '/checkout', '/orders'];

export default function MobileCartFab() {
  const { cart } = useCart();
  const location = useLocation();

  const hidden = HIDDEN_PREFIXES.some(p => location.pathname.startsWith(p));
  if (hidden) return null;

  const count = cart?.total_items || 0;

  return (
    <div className="mobile-only" style={{ position: 'fixed', bottom: '24px', right: '20px', zIndex: 1500 }}>
      <Link
        to="/cart"
        style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: 'var(--bg-deep)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
          position: 'relative', textDecoration: 'none',
          transition: 'transform 0.18s, box-shadow 0.18s',
        }}
        onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.93)'; }}
        onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <ShoppingCart size={22} strokeWidth={1.5} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: '-3px', right: '-3px',
            backgroundColor: 'var(--brand-gold)', color: 'white',
            fontSize: '0.58rem', fontWeight: 800,
            borderRadius: '50%', minWidth: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </div>
  );
}
