import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ComboService } from '../../services/ComboService';
import ComboCard from './ComboCard';
import { J, T } from './comboTheme';

// Home-page rail: up to 3 non-sold-out combos. Renders nothing when there are none,
// so it's safe to drop into Home without affecting the rest of the page.
export default function FeaturedCombosRail() {
  const { data: combos = [] } = useQuery({
    queryKey: ['combos', 'featured'],
    queryFn: () => ComboService.getCombos({ featured: 1 }),
    staleTime: 60_000,
  });

  const featured = combos.filter((c) => c.availability !== 'oos').slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <section style={{ background: J.page, padding: '104px 0', borderTop: `1px solid ${J.hair}` }}>
      <style>{`.combos-rail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
        @media (max-width:900px){.combos-rail-grid{grid-template-columns:1fr;gap:32px}}`}</style>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 18, height: 1, background: J.gold }} />
              <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold }}>Curated bundles</span>
            </div>
            <h2 style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: J.deep, margin: 0 }}>Featured Combos</h2>
            <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, color: J.text2, marginTop: 12, maxWidth: '46ch' }}>
              Complete builds and themed sets — one price, one cart action, one flat shipping fee.
            </p>
          </div>
          <Link to="/combos" style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: J.deep, borderBottom: `1px solid ${J.deep}`, paddingBottom: 4, textDecoration: 'none' }}>All combos →</Link>
        </div>
        <div className="combos-rail-grid">
          {featured.map((c) => <ComboCard key={c.id} combo={c} onRail />)}
        </div>
      </div>
    </section>
  );
}
