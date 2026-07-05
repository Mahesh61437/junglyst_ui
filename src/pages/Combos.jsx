import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SEO from '../components/SEO';
import { ComboService } from '../services/ComboService';
import ComboCard from '../components/combos/ComboCard';
import { J, T, COMBO_TYPES } from '../components/combos/comboTheme';

// Scoped styles: responsive grid + shimmer. Kept local so we don't touch global CSS.
const SCOPED_CSS = `
@keyframes cmbShine { 0% { background-position: -360px 0 } 100% { background-position: 360px 0 } }
.cmb-shimmer { background: linear-gradient(90deg, ${J.cream} 0%, ${J.sage} 20%, ${J.cream} 40%); background-size: 720px 100%; animation: cmbShine 1.3s infinite linear; }
.combos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
@media (max-width: 900px) { .combos-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .combos-grid { grid-template-columns: 1fr; gap: 32px; } }
@media (prefers-reduced-motion: reduce) { .cmb-shimmer { animation: none; } }
`;

function Header() {
  return (
    <section style={{ padding: '88px 0 40px' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: J.gold }}>Curated by Junglyst</span>
            <h1 style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(40px, 5.5vw, 80px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: J.deep, margin: '16px 0 0' }}>Combos.</h1>
            <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 17, color: J.text2, marginTop: 14, maxWidth: '52ch', lineHeight: 1.5 }}>
              Complete builds and themed sets — many sourced across multiple growers,
              bought in a single action and shipped together under one flat fee.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyPanel({ onClear }) {
  return (
    <div style={{ textAlign: 'center', padding: '72px 0 96px', border: `1px dashed ${J.border}`, background: J.cream }}>
      <h2 style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(26px, 3vw, 40px)', color: J.deep, margin: 0 }}>No combos in this set yet.</h2>
      <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, color: J.text2, marginTop: 12, maxWidth: '40ch', marginInline: 'auto' }}>
        We're still curating bundles for this category. Try another, or browse the full collection.
      </p>
      <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onClear} style={{ height: 48, padding: '0 28px', background: J.deep, color: J.page, border: 'none', fontFamily: T.sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>View all combos</button>
        <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 28px', background: 'transparent', color: J.deep, border: `1px solid ${J.deep}`, fontFamily: T.sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>Browse the shop →</Link>
      </div>
    </div>
  );
}

function LoadingGrid() {
  const Bar = ({ w, h = 14, mt = 0 }) => <div className="cmb-shimmer" style={{ width: w, height: h, marginTop: mt }} />;
  return (
    <div className="combos-grid" style={{ marginTop: 32 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="cmb-shimmer" style={{ width: '100%', height: 300 }} />
          <Bar w="70%" h={20} mt={22} />
          <Bar w="95%" h={13} mt={14} />
          <Bar w="60%" h={13} mt={8} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, borderTop: `1px solid ${J.hair}`, paddingTop: 14 }}>
            <Bar w={80} h={18} />
            <Bar w={64} h={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Combos() {
  const [type, setType] = useState('All');

  const { data: combos = [], isLoading, isError } = useQuery({
    queryKey: ['combos'],
    queryFn: () => ComboService.getCombos(),
    staleTime: 60_000,
  });

  const list = type === 'All' ? combos : combos.filter((c) => c.type === type);

  return (
    <main style={{ background: J.page, minHeight: '70vh' }}>
      <SEO title="Combos — Junglyst" description="Curated bundles of plants, hardscape and equipment — one price, one cart action, one flat shipping fee." />
      <style>{SCOPED_CSS}</style>
      <Header />

      <div className="container">
        {/* Type filter chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {COMBO_TYPES.map((t) => {
            const on = t.value === type;
            return (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                style={{
                  padding: '10px 18px', cursor: 'pointer',
                  background: on ? J.deep : 'transparent',
                  color: on ? J.page : J.text, border: `1px solid ${on ? J.deep : J.border}`,
                  fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >{t.label}</button>
            );
          })}
        </div>

        <div style={{ padding: '32px 0 120px' }}>
          {isLoading ? (
            <LoadingGrid />
          ) : isError ? (
            <div style={{ padding: '80px 0', textAlign: 'center', fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, color: J.text2 }}>
              We couldn't load combos right now. Please try again shortly.
            </div>
          ) : (
            <>
              <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: J.text2, marginBottom: 32 }}>
                {list.length} {list.length === 1 ? 'combo' : 'combos'}{type !== 'All' ? ` · ${type}` : ''}
              </div>
              {list.length === 0 ? (
                <EmptyPanel onClear={() => setType('All')} />
              ) : (
                <div className="combos-grid">
                  {list.map((c) => <ComboCard key={c.id} combo={c} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
