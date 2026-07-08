import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Boxes, MapPin, Clock, Check, X, Heart } from 'lucide-react';
import SEO from '../components/SEO';
import { ComboService } from '../services/ComboService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ComboPlate from '../components/combos/ComboPlate';
import { J, T, inr, comboAvailability } from '../components/combos/comboTheme';

export default function ComboDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addComboToCart } = useCart();
  const { showToast } = useToast();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const { data: combo, isLoading, isError } = useQuery({
    queryKey: ['combo', slug],
    queryFn: () => ComboService.getCombo(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <main style={{ background: J.page, minHeight: '70vh' }}>
        <div className="container" style={{ padding: '120px 0', textAlign: 'center', fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, color: J.text2 }}>
          Loading combo…
        </div>
      </main>
    );
  }
  if (isError || !combo) {
    return (
      <main style={{ background: J.page, minHeight: '70vh' }}>
        <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
          <h1 style={{ fontFamily: T.serif, fontStyle: 'italic', color: J.deep }}>Combo not found.</h1>
          <Link to="/combos" style={{ color: J.gold, fontFamily: T.sans, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 12 }}>← Back to all combos</Link>
        </div>
      </main>
    );
  }

  const items = combo.items || [];
  const sellers = combo.sellers || [];
  const growerById = Object.fromEntries(sellers.map((s) => [s.seller_id, s]));
  const availability = comboAvailability(combo);
  const partial = availability === 'partial';
  const oos = availability === 'oos';

  const available = items.filter((it) => it.in_stock);
  const unitTotal = available.reduce((s, it) => s + Number(it.line_total), 0);
  const fullTotal = Number(combo.original_price);
  const totalNow = unitTotal * qty;
  const shipping = Number(combo.shipping_fee || 0);

  const sellerOrder = [...new Set(items.map((it) => it.seller_id))];
  const growerCount = sellerOrder.length;

  async function handleAdd() {
    if (oos || adding) return;
    setAdding(true);
    try {
      const ok = await addComboToCart(combo, qty);
      if (ok) {
        showToast('Combo added to your cart.', 'success');
        navigate('/cart');
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <main style={{ background: J.page }}>
      <SEO title={`${combo.name} — Combos — Junglyst`} description={combo.tagline || ''} />
      <style>{`.combo-detail-grid{display:grid;grid-template-columns:1fr 460px;gap:64px;align-items:flex-start}
        .combo-thumbs{display:grid;grid-template-columns:repeat(${Math.max(items.length, 1)},1fr);gap:8px;margin-top:12px}
        .combo-item-row{display:grid;grid-template-columns:88px 1fr auto;gap:24px}
        @media (max-width:900px){.combo-detail-grid{grid-template-columns:1fr;gap:32px}.combo-sticky{position:static!important}}
        @media (max-width:640px){.combo-item-row{grid-template-columns:64px 1fr;gap:14px}}`}</style>

      {/* Breadcrumb */}
      <div className="container">
        <div style={{ padding: '24px 0', fontFamily: T.sans, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: J.text2 }}>
          <Link to="/combos" style={{ color: J.text2, textDecoration: 'none' }}>Combos</Link>
          <span style={{ margin: '0 12px', color: J.text3 }}>·</span>
          <span style={{ color: J.deep, fontWeight: 700 }}>{combo.name}</span>
        </div>
      </div>

      {/* Hero: gallery + sticky panel */}
      <section style={{ paddingBottom: 80 }}>
        <div className="container">
          <div className="combo-detail-grid">
            {/* Gallery */}
            <div>
              <div style={{ position: 'relative' }}>
                <ComboPlate src={combo.image_url} alt={combo.name} h={560} images={items.map((it) => it.image_url)} />
                <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(6,32,27,0.82)', backdropFilter: 'blur(6px)', padding: '8px 14px' }}>
                  <Boxes size={13} color={J.gold} />
                  <span style={{ color: J.gold, fontFamily: T.sans, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {combo.type} · {combo.item_count} items · {growerCount} {growerCount === 1 ? 'grower' : 'growers'}
                  </span>
                </div>
                {oos && (
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(6,32,27,0.5)' }}>
                    <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', color: J.page, border: '1px solid rgba(250,250,247,0.6)', padding: '12px 22px' }}>Sold out</span>
                  </div>
                )}
              </div>
              {items.length > 0 && (
                <div className="combo-thumbs">
                  {items.map((it, i) => (
                    <div key={it.id} style={{ position: 'relative', border: i === 0 ? `2px solid ${J.deep}` : `1px solid ${J.hair}`, opacity: it.in_stock ? 1 : 0.4 }}>
                      <ComboPlate src={it.image_url} alt={it.product_name} h={72} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky panel */}
            <aside className="combo-sticky" style={{ position: 'sticky', top: 100 }}>
              <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold }}>Curated bundle</span>
              <h1 style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: J.deep, margin: '12px 0 0' }}>{combo.name}</h1>
              {combo.description && (
                <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, lineHeight: 1.55, color: J.text2, marginTop: 16, maxWidth: '46ch' }}>{combo.description}</p>
              )}

              {/* Multi-seller line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
                <div style={{ display: 'flex' }}>
                  {sellerOrder.map((sid, i) => {
                    const g = growerById[sid] || {};
                    return (
                      <div key={sid} title={g.name} style={{ width: 30, height: 30, borderRadius: '50%', background: g.brand || J.deep, color: J.page, display: 'grid', placeItems: 'center', fontFamily: T.serif, fontSize: 13, border: `2px solid ${J.page}`, marginLeft: i ? -8 : 0 }}>{g.initial || '·'}</div>
                    );
                  })}
                </div>
                <span style={{ fontFamily: T.sans, fontSize: 11.5, color: J.text2, letterSpacing: '0.04em' }}>
                  Ships from <strong style={{ color: J.deep }}>{growerCount} {growerCount === 1 ? 'grower' : 'growers'}</strong> · may arrive in separate shipments
                </span>
              </div>

              <div style={{ height: 1, background: J.hair, margin: '28px 0' }} />

              {/* PRICE BLOCK — PRICE_SLOT: a "Save ₹X" line drops in here when discounts go live */}
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontFamily: T.sans, fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: J.text2 }}>
                  {partial ? 'Available items · combo price' : 'Combo price'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 6, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: T.serif, fontSize: 44, color: J.deep, letterSpacing: '-0.02em' }}>{inr(unitTotal)}</div>
                  {partial && <div style={{ fontFamily: T.serif, fontSize: 22, color: J.text3, textDecoration: 'line-through' }}>{inr(fullTotal)}</div>}
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 11.5, color: J.text2, marginTop: 6 }}>
                  {partial
                    ? `${available.length} of ${items.length} items in stock · some are temporarily unavailable`
                    : 'Equal to buying each item separately · one cart action'}
                </div>
              </div>

              {/* State banners */}
              {partial && (
                <div style={{ padding: '16px 18px', background: 'rgba(168,116,44,0.08)', border: '1px solid rgba(168,116,44,0.3)', marginBottom: 20, display: 'flex', gap: 12 }}>
                  <Clock size={16} color={J.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: T.sans, fontSize: 12.5, lineHeight: 1.55, color: J.text }}>
                    <strong style={{ color: J.deep }}>{items.length - available.length} item{items.length - available.length === 1 ? ' is' : 's are'} currently unavailable.</strong> Add the rest now — we'll notify you when they're back so you can complete the build.
                  </div>
                </div>
              )}
              {oos && (
                <div style={{ padding: '16px 18px', background: 'rgba(168,54,44,0.07)', border: '1px solid rgba(168,54,44,0.3)', marginBottom: 20, display: 'flex', gap: 12 }}>
                  <X size={16} color={J.red} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: T.sans, fontSize: 12.5, lineHeight: 1.55, color: J.text }}>
                    <strong style={{ color: J.deep }}>This combo is sold out.</strong> A combo is only buyable when its core components are in stock. We'll restock as growers replenish.
                  </div>
                </div>
              )}

              {/* Qty + CTA */}
              {!oos && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', height: 58, border: `1px solid ${J.border}`, padding: '0 8px' }}>
                    <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 28, height: 28, background: 'transparent', border: 'none', color: J.text, fontSize: 18, cursor: 'pointer' }}>−</button>
                    <span style={{ minWidth: 32, textAlign: 'center', fontFamily: T.serif, fontSize: 19, color: J.deep }}>{qty}</span>
                    <button onClick={() => setQty(qty + 1)} style={{ width: 28, height: 28, background: 'transparent', border: 'none', color: J.text, fontSize: 18, cursor: 'pointer' }}>+</button>
                  </div>
                  <button onClick={handleAdd} disabled={adding} style={{ flex: 1, height: 58, background: J.deep, color: J.page, border: 'none', fontFamily: T.sans, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: adding ? 'wait' : 'pointer' }}>
                    {partial ? `Add available · ${inr(totalNow)}` : `Add combo · ${inr(totalNow)}`}
                  </button>
                </div>
              )}
              {oos && (
                <button style={{ width: '100%', height: 58, background: 'transparent', color: J.deep, border: `1px solid ${J.deep}`, fontFamily: T.sans, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Heart size={15} /> Notify me when restocked
                </button>
              )}

              {/* Shipping promise — ONE flat fee */}
              <div style={{ marginTop: 28, padding: 22, background: J.cream }}>
                {[
                  ['One flat shipping fee', `${inr(shipping)} total — however many growers ship your combo.`],
                  ['Buy the whole build at once', 'No hunting across listings — one price, one checkout.'],
                  ['Vitality guarantee', 'Pest-free arrival on every plant, or a full refund.'],
                ].map(([t, b], i) => (
                  <div key={i} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < 2 ? `1px solid ${J.borderS}` : 'none', display: 'flex', gap: 10 }}>
                    <Check size={15} color={J.ok} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 800, color: J.deep }}>{t}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 12, color: J.text2, marginTop: 4 }}>{b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED — grouped by seller */}
      <section style={{ background: J.cream, padding: '100px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: J.green }}>What's included</span>
              <h2 style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: J.deep, margin: '12px 0 0' }}>
                {combo.item_count} pieces, {growerCount} {growerCount === 1 ? 'grower' : 'growers'}.
              </h2>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: J.text2 }}>
              Each ships from its grower
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {sellerOrder.map((sid) => {
              const g = growerById[sid] || {};
              const groupItems = items.filter((it) => it.seller_id === sid);
              return (
                <div key={sid}>
                  {/* Seller header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: `1px solid ${J.deep}`, borderBottom: `1px solid ${J.hair}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, background: g.brand || J.deep, color: J.page, display: 'grid', placeItems: 'center', fontFamily: T.serif, fontSize: 18 }}>{g.initial || '·'}</div>
                      <div>
                        <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold, whiteSpace: 'nowrap' }}>{g.name || 'Grower'}</div>
                        <div style={{ fontFamily: T.sans, fontSize: 11, color: J.text2, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          {g.city && <><MapPin size={11} /> {g.city}</>}{g.city && g.ships ? ' · ' : ''}{g.ships}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: J.text3 }}>
                      {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Item rows */}
                  {groupItems.map((it) => {
                    const gone = !it.in_stock;
                    return (
                      <div key={it.id} className="combo-item-row" style={{ padding: '20px 0', borderBottom: `1px solid ${J.hair}`, alignItems: 'center', opacity: gone ? 0.55 : 1 }}>
                        <div style={{ position: 'relative' }}>
                          <ComboPlate src={it.image_url} alt={it.product_name} h={80} />
                          {it.quantity > 1 && <div style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: J.deep, color: J.gold, display: 'grid', placeItems: 'center', fontFamily: T.sans, fontSize: 11, fontWeight: 800 }}>×{it.quantity}</div>}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <h4 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: J.deep, margin: 0 }}>{it.product_name}</h4>
                            {gone && <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: J.red }}>Currently unavailable</span>}
                          </div>
                          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13.5, color: J.text2, marginTop: 4 }}>{it.variant_name}</div>
                          {it.product_slug && (
                            <Link to={`/product/${it.product_slug}`} style={{ display: 'inline-block', marginTop: 10, fontFamily: T.sans, fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: J.gold, borderBottom: `1px solid ${J.gold}`, paddingBottom: 3, textDecoration: 'none' }}>
                              View product →
                            </Link>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: T.serif, fontSize: 19, color: gone ? J.text3 : J.deep, textDecoration: gone ? 'line-through' : 'none' }}>{inr(it.line_total)}</div>
                          <div style={{ fontFamily: T.sans, fontSize: 11, color: J.text2, marginTop: 4 }}>{it.quantity} × {inr(it.unit_price)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Totals strip */}
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingTop: 24, borderTop: `2px solid ${J.deep}` }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, color: J.text2, maxWidth: '46ch' }}>
              {partial
                ? 'Unavailable items are held back — you only pay for what ships, plus the flat combo shipping.'
                : 'One combo price, one flat shipping fee, however many growers are involved.'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: J.text2 }}>Combo price + {inr(shipping)} shipping</div>
              <div style={{ fontFamily: T.serif, fontSize: 34, color: J.deep, marginTop: 4 }}>{inr(unitTotal + shipping)}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
