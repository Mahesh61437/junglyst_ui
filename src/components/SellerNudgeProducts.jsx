import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUtils';
import { ShoppingCart, Loader2 } from 'lucide-react';

/**
 * Shown below a seller's nudge banner when show_nudge_products is true.
 * Fetches up to 6 products from that seller not already in the cart
 * and displays them as compact add-to-cart cards.
 */
export default function SellerNudgeProducts({ sellerId, sellerName, sellerSlug }) {
  const { addItemToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    setLoading(true);
    api.get(`/cart/nudge-products/?seller_id=${sellerId}`)
      .then(res => { if (!cancelled) setProducts(res.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sellerId]);

  if (loading) {
    return (
      <div style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
        <Loader2 size={12} className="animate-spin" /> Loading suggestions from {sellerName}…
      </div>
    );
  }

  if (!products.length) return null;

  const handleAdd = async (product) => {
    setAdding(product.variant_id);
    await addItemToCart(product.id, 1, product.variant_id);
    setAdding(null);
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div className="nudge-header">
        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: 0 }}>
          Add more from {sellerName}
        </p>
        {sellerSlug && (
          <Link to={`/store/${sellerSlug}`} className="explore-store-btn" style={{ 
            fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)', 
            textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em',
            padding: '0.5rem 1rem', backgroundColor: '#fffbeb', borderRadius: '8px', 
            border: '1px solid #fde68a', display: 'inline-block'
          }}>
            Explore Store →
          </Link>
        )}
      </div>
      <style>{`
        .nudge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        @media (max-width: 640px) {
          .nudge-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .explore-store-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {products.map(p => (
          <div
            key={p.id}
            style={{
              flexShrink: 0,
              width: '110px',
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              backgroundColor: 'white',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Link to={`/product/${p.slug || p.id}`} style={{ display: 'block', height: '80px', backgroundColor: '#f8fafc' }}>
              <img
                src={getImageUrl(p.image_url)}
                alt={p.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.onerror = null; e.target.src = '/assets/default-product.jpg'; }}
              />
            </Link>
            <div style={{ padding: '0.4rem 0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1b2d2a', margin: 0, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {p.name}
              </p>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--bg-deep)', margin: 0 }}>₹{p.price}</p>
              <button
                onClick={() => handleAdd(p)}
                disabled={adding === p.variant_id}
                style={{
                  marginTop: 'auto',
                  padding: '0.3rem',
                  backgroundColor: adding === p.variant_id ? '#e2e8f0' : '#1b2d2a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: adding === p.variant_id ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}
              >
                {adding === p.variant_id
                  ? <Loader2 size={10} className="animate-spin" />
                  : <><ShoppingCart size={10} /> Add</>
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
