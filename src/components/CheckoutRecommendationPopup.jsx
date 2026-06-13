import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { CartService } from '../services/CartService';
import { useCart } from '../context/CartContext';

export default function CheckoutRecommendationPopup({ isOpen, onProceed }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Map());
  const [adding, setAdding] = useState(false);
  const { addItemToCart } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSelected(new Map());
    CartService.getCheckoutNudge()
      .then(data => setItems(data.recommendations || []))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Close on backdrop click or Escape
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onProceed();
  }, [onProceed]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onProceed(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onProceed]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // selected maps variantId → productId
  function toggleItem(variantId, productId) {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.set(variantId, productId);
      return next;
    });
  }

  async function handleAddAndProceed() {
    if (selected.size === 0) { onProceed(); return; }
    setAdding(true);
    try {
      await Promise.all(
        [...selected.entries()].map(([variantId, productId]) =>
          addItemToCart(productId, 1, variantId)
        )
      );
    } finally {
      setAdding(false);
      onProceed();
    }
  }

  if (!isOpen) return null;

  // Group products by source_category_name, preserving insertion order
  const categoryGroups = items.reduce((acc, p) => {
    const key = p.source_category_name || 'Recommendations';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        width: '100%',
        maxHeight: '88vh',
        background: 'var(--bg-surface, #fff)',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
        className="checkout-nudge-sheet"
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.25rem 0.75rem',
          borderBottom: '1px solid var(--border-subtle, #e5e7eb)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.125rem',
              fontFamily: 'var(--font-serif)',
              color: 'var(--bg-deep, #1a1a1a)',
              letterSpacing: '-0.01em',
            }}>
              Complete Your Setup
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)' }}>
              Add essentials before you pay
            </p>
          </div>
          <button
            onClick={onProceed}
            aria-label="Skip and proceed"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--text-muted, #6b7280)',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #6b7280)', fontSize: '0.875rem' }}>
              Finding recommendations…
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #6b7280)', fontSize: '0.875rem' }}>
              No add-ons available right now.
            </div>
          ) : (
            Object.entries(categoryGroups).map(([categoryName, products]) => (
              <ProductGroup
                key={categoryName}
                label={categoryName}
                products={products}
                selected={selected}
                onToggle={toggleItem}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-subtle, #e5e7eb)',
          display: 'flex',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <button
            onClick={onProceed}
            disabled={adding}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid var(--border-subtle, #d1d5db)',
              borderRadius: '8px',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--text-muted, #6b7280)',
              fontWeight: 500,
            }}
          >
            Skip &amp; Pay
          </button>
          <button
            onClick={handleAddAndProceed}
            disabled={adding}
            style={{
              flex: 2,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--brand-gold, #b5932a)',
              color: '#fff',
              cursor: adding ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: adding ? 0.7 : 1,
            }}
          >
            <ShoppingCart size={16} />
            {adding
              ? 'Adding…'
              : selected.size > 0
                ? `Add ${selected.size} Item${selected.size > 1 ? 's' : ''} & Pay`
                : 'Proceed to Pay'}
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .checkout-nudge-sheet {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: min(580px, 92vw) !important;
            max-height: 80vh !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

function ProductGroup({ label, products, selected, onToggle }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <p style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--text-muted, #6b7280)',
          margin: '0 0 0.5rem',
        }}>
          {label}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {products.map(product => (
          <NudgeProductCard
            key={product.id}
            product={product}
            isSelected={selected.has(product.variant_id)}
            onToggle={() => onToggle(product.variant_id, product.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NudgeProductCard({ product, isSelected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(); } }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: '10px',
        border: `1.5px solid ${isSelected ? 'var(--brand-gold, #b5932a)' : 'var(--border-subtle, #e5e7eb)'}`,
        background: isSelected ? 'var(--brand-gold-soft, rgba(181,147,42,0.06))' : 'transparent',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        userSelect: 'none',
      }}
    >
      {/* Product image */}
      <div style={{
        width: '3.5rem', height: '3.5rem',
        borderRadius: '8px',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'var(--bg-muted, #f3f4f6)',
      }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-muted, #f3f4f6)' }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          to={`/product/${product.slug}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--bg-deep, #1a1a1a)',
            textDecoration: 'none',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.name}
        </Link>
        <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
          {product.seller_name}
        </p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--bg-deep, #1a1a1a)' }}>
          ₹{Number(product.price).toLocaleString('en-IN')}
        </p>
      </div>

      {/* Checkbox indicator */}
      <div style={{
        width: '1.375rem', height: '1.375rem',
        borderRadius: '50%',
        border: `2px solid ${isSelected ? 'var(--brand-gold, #b5932a)' : 'var(--border-subtle, #d1d5db)'}`,
        background: isSelected ? 'var(--brand-gold, #b5932a)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s',
      }}>
        {isSelected && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
      </div>
    </div>
  );
}
