import { Link } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { J, T, inr } from './comboTheme';
import ComboPlate from './ComboPlate';

// Reusable combo card — listing grid + Home "Featured Combos" rail (onRail).
// Mirrors the Shop product card: stacked-plate bundle cue, type chip, serif name,
// italic tagline, hairline footer with price + "{items} · {growers}".
export default function ComboCard({ combo, onRail }) {
  const soldOut = combo.availability === 'oos';
  const growers = combo.seller_count || 0;
  const heroH = onRail ? 240 : 300;

  return (
    <Link to={`/combos/${combo.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.25s', opacity: soldOut ? 0.78 : 1 }}
        onMouseEnter={(e) => { if (!soldOut) e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
      >
        {/* Stacked-card bundle cue */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'translate(10px, 10px)', background: J.bone, zIndex: 0 }} />
          <div style={{ position: 'absolute', inset: 0, transform: 'translate(5px, 5px)', background: J.border, zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <ComboPlate src={combo.image_url} alt={combo.name} h={heroH} images={combo.item_images} />
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(6,32,27,0.82)', backdropFilter: 'blur(6px)', padding: '6px 11px' }}>
              <Boxes size={12} color={J.gold} />
              <span style={{ color: J.gold, fontFamily: T.sans, fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {combo.type} · {combo.item_count} items
              </span>
            </div>
            {soldOut && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(6,32,27,0.55)' }}>
                <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', color: J.page, border: '1px solid rgba(250,250,247,0.6)', padding: '10px 18px' }}>Sold out</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '22px 0 0' }}>
          <h3 style={{ fontFamily: T.serif, fontSize: 23, fontWeight: 500, color: J.deep, margin: '0 0 6px', lineHeight: 1.12 }}>{combo.name}</h3>
          <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.5, color: J.text2, margin: '0 0 16px', minHeight: 42, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{combo.tagline}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${J.hair}`, paddingTop: 14 }}>
            <div>
              <span style={{ fontFamily: T.serif, fontSize: 22, color: J.deep }}>{inr(combo.effective_price)}</span>
              <div style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: J.text2, marginTop: 4 }}>
                {combo.item_count} items · {growers} {growers === 1 ? 'grower' : 'growers'}
              </div>
            </div>
            <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: soldOut ? J.text3 : J.gold }}>
              {soldOut ? 'Notify →' : 'View combo →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
