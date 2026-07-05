import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, ChevronDown, Flag } from 'lucide-react';
import { J, T, inr } from './comboTheme';
import ComboPlate from './ComboPlate';

// One combo as a single expandable cart line, grouped by seller. Styled to
// harmonize with the existing (rounded) Cart page while carrying combo semantics:
// one flat shipping fee, qty scales every component.
export default function CartComboLine({ line, onQty, onRemove }) {
  const [open, setOpen] = useState(true);
  const sellers = line.sellers || [];
  const growerById = Object.fromEntries(sellers.map((s) => [s.seller_id, s]));
  const sellerOrder = [...new Set(line.items.map((it) => it.seller_id))];
  const lineTotal = line.unit_price * line.qty;

  return (
    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', marginBottom: '1.5rem', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '1.25rem', padding: '1.5rem', alignItems: 'center' }}>
        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
          <ComboPlate src={line.image_url} alt={line.name} h={96} />
        </div>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: J.deep, padding: '4px 10px', borderRadius: 6, marginBottom: 8 }}>
            <Boxes size={11} color={J.gold} />
            <span style={{ color: J.gold, fontFamily: T.sans, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Combo · {line.items.length} items · {line.grower_count} {line.grower_count === 1 ? 'grower' : 'growers'}
            </span>
          </div>
          <h3 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: J.deep, margin: '0 0 6px' }}>{line.name}</h3>
          <button onClick={() => setOpen((o) => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: J.text2, padding: 0 }}>
            {open ? 'Hide items' : `Show ${line.items.length} items`}
            <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.serif, fontSize: 22, color: J.deep }}>{inr(lineTotal)}</div>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: J.text2, marginTop: 4 }}>{inr(line.unit_price)} / combo</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 1.5rem 1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${J.border}`, borderRadius: 10 }}>
            <button onClick={() => onQty(-1)} style={{ width: 36, height: 36, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: J.text }}>−</button>
            <span style={{ width: 34, textAlign: 'center', fontFamily: T.serif, fontSize: 16, color: J.deep }}>{line.qty}</span>
            <button onClick={() => onQty(1)} style={{ width: 36, height: 36, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: J.text }}>+</button>
          </div>
          <span style={{ fontFamily: T.sans, fontSize: 11, color: J.text2 }}>Qty changes every item in the combo</span>
        </div>
        <button onClick={onRemove} style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'transparent', border: 'none', color: J.text2, cursor: 'pointer' }}>Remove combo</button>
      </div>

      {/* Multi-seller / flat-shipping note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 1.5rem', background: J.cream, borderTop: `1px solid ${J.hair}` }}>
        <Flag size={13} color={J.gold} />
        <span style={{ fontFamily: T.sans, fontSize: 11.5, color: J.text2 }}>
          Ships from <strong style={{ color: J.deep }}>{line.grower_count} {line.grower_count === 1 ? 'grower' : 'growers'}</strong> · may arrive in separate shipments · one flat {inr(line.shipping_fee)} shipping
        </span>
      </div>

      {/* Expanded per-seller breakdown */}
      {open && (
        <div style={{ padding: '8px 1.5rem 1.5rem', borderTop: `1px solid ${J.hair}` }}>
          {sellerOrder.map((sid) => {
            const g = growerById[sid] || {};
            const groupItems = line.items.filter((it) => it.seller_id === sid);
            return (
              <div key={sid} style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: `1px solid ${J.hair}` }}>
                  <div style={{ width: 26, height: 26, background: g.brand || J.deep, color: J.page, display: 'grid', placeItems: 'center', fontFamily: T.serif, fontSize: 12, borderRadius: 4 }}>{g.initial || '·'}</div>
                  <span style={{ fontFamily: T.sans, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: J.gold, whiteSpace: 'nowrap' }}>{g.name || 'Grower'}</span>
                  {g.ships && <span style={{ fontFamily: T.sans, fontSize: 10.5, color: J.text2 }}>· {g.ships}</span>}
                </div>
                {groupItems.map((it, i) => (
                  <div key={it.variant_id} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 14, padding: '14px 0', borderBottom: i < groupItems.length - 1 ? `1px solid ${J.borderS}` : 'none', alignItems: 'center' }}>
                    <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                      <ComboPlate src={it.image_url} alt={it.product_name} h={52} />
                    </div>
                    <div>
                      <div style={{ fontFamily: T.serif, fontSize: 15, color: J.deep }}>
                        {it.product_slug
                          ? <Link to={`/product/${it.product_slug}`} style={{ color: J.deep, textDecoration: 'none' }}>{it.product_name}</Link>
                          : it.product_name}
                      </div>
                      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: J.text2, marginTop: 2 }}>{it.variant_name} · ×{it.quantity * line.qty}</div>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 12.5, color: J.text2 }}>{inr(it.line_total * line.qty)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
