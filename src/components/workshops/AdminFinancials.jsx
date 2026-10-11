import { useCallback, useEffect, useState } from 'react';
import { X, IndianRupee, Trash2, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';
import { WorkshopService } from '../../services/WorkshopService';
import { formatDate, formatINR, formatTime } from '../../utils/workshops';

const sum = (rows, key) => rows.reduce((total, row) => total + (parseFloat(row[key]) || 0), 0);
const money = (value) => formatINR(value, { decimals: 2 });
const plural = (count, word) => `${count} ${word}${Number(count) === 1 ? '' : 's'}`;

// A payout recorded before sessions happen leaves a negative balance: that's an advance, not a debt.
// Paid to sellers beyond what their held sessions have earned so far.
function advancePaid(detail) {
  return (detail.sellers || []).reduce((sum, sel) => sum + Math.max(0, -(parseFloat(sel.balance_due) || 0)), 0);
}

function dueLabel(balance) {
  const value = parseFloat(balance) || 0;
  return value < 0
    ? { value: money(0), hint: `${money(-value)} paid in advance` }
    : { value: money(value), hint: null };
}

function Kpi({ label, value, hint }) {
  return (
    <div className="wa-card wa-kpi">
      <div className="wa-kpi-label">{label}</div>
      <div className="wa-kpi-value">{value}</div>
      {hint && <div className="wa-kpi-hint">{hint}</div>}
    </div>
  );
}

// Default to the co-host owed the most; switching seller pre-fills what they're owed.
function PayoutForm({ workshopId, sellers, onRecorded }) {
  const today = new Date().toISOString().slice(0, 10);
  const dueOf = (seller) => Math.max(0, parseFloat(seller?.balance_due) || 0);
  const amountFor = (seller) => (dueOf(seller) > 0 ? dueOf(seller).toFixed(2) : '');
  const initial = [...sellers].sort((a, b) => dueOf(b) - dueOf(a))[0];
  const [form, setForm] = useState({ seller: initial ? String(initial.seller) : '', amount: amountFor(initial), paid_on: today, reference: '', notes: '' });
  const pickSeller = (e) => {
    const chosen = sellers.find(sel => String(sel.seller) === e.target.value);
    setForm(prev => ({ ...prev, seller: e.target.value, amount: amountFor(chosen) }));
  };
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.seller) { setError('Choose which seller was paid.'); return; }
    if (!(parseFloat(form.amount) > 0)) { setError('Enter the amount transferred.'); return; }
    setSaving(true);
    setError(null);
    try {
      await WorkshopService.admin.recordPayout({ ...form, workshop: workshopId });
      onRecorded();
      setForm(prev => ({ ...prev, amount: '', reference: '', notes: '' }));
    } catch (err) {
      const data = err.response?.data || {};
      setError(Object.values(data).flat().join(' ') || 'Could not record the payout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="wa-calc" style={{ marginTop: '0.75rem' }}>
      <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={15} /> Record a settlement transfer</strong>
      <div className="wa-grid wa-grid--4" style={{ marginTop: '0.6rem' }}>
        <div className="wa-span-all"><label className="wa-label" htmlFor="wa-po-seller">Paid to</label>
          <select id="wa-po-seller" className="wa-input" value={form.seller} onChange={pickSeller}>
            {sellers.map(sel => (
              <option key={sel.seller} value={sel.seller}>{sel.name} · due {money(dueOf(sel))}</option>
            ))}
          </select>
        </div>
        <div><label className="wa-label" htmlFor="wa-po-amount">Amount (₹)</label><input id="wa-po-amount" className="wa-input" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} /></div>
        <div><label className="wa-label" htmlFor="wa-po-date">Paid on</label><input id="wa-po-date" className="wa-input" type="date" value={form.paid_on} onChange={set('paid_on')} /></div>
        <div><label className="wa-label" htmlFor="wa-po-ref">UTR / reference</label><input id="wa-po-ref" className="wa-input" value={form.reference} maxLength={100} onChange={set('reference')} /></div>
        <div><label className="wa-label" htmlFor="wa-po-notes">Notes</label><input id="wa-po-notes" className="wa-input" value={form.notes} onChange={set('notes')} /></div>
      </div>
      {error && <div className="wa-error">{error}</div>}
      <button type="submit" className="wa-btn wa-btn--primary wa-btn--sm" style={{ marginTop: '0.6rem' }} disabled={saving}>{saving ? 'Saving…' : 'Record payout'}</button>
    </form>
  );
}

function WorkshopFinancialsDrawer({ row, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    WorkshopService.admin.workshopFinancials(row.id)
      .then(setDetail)
      .catch(() => setError('Could not load the settlement details.'));
  }, [row.id]);
  useEffect(load, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const refresh = () => { load(); onChanged(); };
  const deletePayout = async (payout) => {
    if (!window.confirm(`Delete the ₹${payout.amount} payout recorded on ${payout.paid_on}?`)) return;
    await WorkshopService.admin.deletePayout(payout.id);
    refresh();
  };

  return (
    <div className="wa-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wa-fin-title" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wa-modal" style={{ maxWidth: 900 }}>
        <div className="wa-modal-head">
          <div>
            <h2 id="wa-fin-title" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 800 }}>{row.title}</h2>
            <p className="wa-sub">Organisers: {row.organiser_name}</p>
          </div>
          <button type="button" className="wa-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="wa-modal-body">
          {error && <div className="wa-banner wa-banner--error"><AlertCircle size={16} />{error}</div>}
          {!detail ? <div className="wa-empty">Loading…</div> : (
            <>
              <div className="wa-kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <Kpi label="Gross collected" value={money(detail.totals.gross)} hint={`${plural(detail.totals.bookings, 'booking')} · ${plural(detail.totals.seats, 'seat')}`} />
                <Kpi label="Junglyst commission" value={money(detail.totals.commission)} />
                <Kpi label="Organisers' share" value={money(detail.totals.seller_payout)} hint={`${detail.occupancy_percent}% of ${detail.capacity} seats sold`} />
                <Kpi label="Earned (past sessions)" value={money(detail.earned.seller_payout)} hint="Eligible for settlement" />
                <Kpi label="Settled" value={money(detail.paid_out)} hint={advancePaid(detail) > 0 ? `${money(advancePaid(detail))} of it paid in advance` : null} />
                <Kpi label="Balance due now" value={money(Math.max(0, parseFloat(detail.balance_due)))}
                  hint={advancePaid(detail) > 0 ? 'Covered by the advance until sessions are held' : 'For sessions already held'} />
                <Kpi label="Still to settle" value={money(Math.max(0, parseFloat(detail.pending_settlement)))}
                  hint={parseFloat(detail.pending_settlement) < 0 ? `Overpaid by ${money(-parseFloat(detail.pending_settlement))}` : 'All paid bookings, incl. upcoming sessions'} />
              </div>

              <h3 className="wa-section-title" style={{ marginTop: '0.5rem' }}>Per seller</h3>
              <div className="wa-card wa-table-wrap" style={{ marginBottom: '1.25rem' }}>
                <table className="wa-table" style={{ minWidth: 760 }}>
                  <thead>
                    <tr><th>Seller</th><th className="num">Gross share</th><th className="num">Junglyst</th><th className="num">Payout</th>
                      <th className="num">Earned</th><th className="num">Settled</th><th className="num">Due now</th></tr>
                  </thead>
                  <tbody>
                    {detail.sellers.length === 0 ? (
                      <tr><td colSpan={7} className="wa-muted">No co-hosts yet.</td></tr>
                    ) : detail.sellers.map(sel => (
                      <tr key={sel.seller}>
                        <td>
                          <div className="wa-strong">{sel.name}</div>
                          <div className="wa-muted">
                            {sel.is_current_organiser ? `${Number(sel.share_percent)}% share · ${Number(sel.commission_percent)}% commission` : 'Former co-host'}
                          </div>
                        </td>
                        <td className="num">{money(sel.gross)}</td>
                        <td className="num">{money(sel.commission)}</td>
                        <td className="num wa-strong">{money(sel.seller_payout)}</td>
                        <td className="num">{money(sel.earned)}</td>
                        <td className="num">{money(sel.paid_out)}</td>
                        <td className="num" style={{ fontWeight: 800, color: parseFloat(sel.balance_due) > 0 ? '#b45309' : '#15803d' }}>
                          {dueLabel(sel.balance_due).value}
                          {dueLabel(sel.balance_due).hint && <div className="wa-muted" style={{ fontWeight: 500 }}>{dueLabel(sel.balance_due).hint}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="wa-section-title">Sessions</h3>
              <div className="wa-card wa-table-wrap" style={{ marginBottom: '1.25rem' }}>
                <table className="wa-table" style={{ minWidth: 560 }}>
                  <thead><tr><th>Session</th><th className="num">Booked / seats</th><th className="num">Gross</th><th className="num">Organiser</th></tr></thead>
                  <tbody>
                    {detail.sessions.map(s => (
                      <tr key={s.id} style={s.is_active ? undefined : { opacity: 0.55 }}>
                        <td>{formatDate(s.date)} · {formatTime(s.start_time)}{s.is_active ? '' : ' (inactive)'}</td>
                        <td className="num">{s.seats_booked} / {s.capacity}</td>
                        <td className="num">{money(s.gross)}</td>
                        <td className="num">{money(s.seller_payout)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="wa-section-title">Settlement transfers</h3>
              {detail.payouts.length === 0 ? (
                <p className="wa-help" style={{ marginBottom: '0.5rem' }}>No transfers recorded yet.</p>
              ) : (
                <div className="wa-card wa-table-wrap">
                  <table className="wa-table" style={{ minWidth: 600 }}>
                    <thead><tr><th>Paid on</th><th>Paid to</th><th>Reference</th><th>Notes</th><th className="num">Amount</th><th /></tr></thead>
                    <tbody>
                      {detail.payouts.map(p => (
                        <tr key={p.id}>
                          <td>{formatDate(p.paid_on)}</td>
                          <td>{p.seller_name || '—'}</td>
                          <td style={{ fontFamily: 'monospace' }}>{p.reference || '—'}</td>
                          <td>{p.notes || '—'}</td>
                          <td className="num wa-strong">{money(p.amount)}</td>
                          <td className="num"><button type="button" className="wa-icon-btn wa-icon-btn--danger" aria-label="Delete payout" onClick={() => deletePayout(p)}><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {parseFloat(detail.balance_due) <= 0 && parseFloat(detail.earned.seller_payout) > 0 && (
                <div className="wa-banner wa-banner--ok" style={{ marginTop: '0.75rem' }}><CheckCircle2 size={16} />Fully settled for all completed sessions.</div>
              )}
              {detail.sellers.length > 0 && (
                <PayoutForm key={detail.payouts.length} workshopId={row.id} sellers={detail.sellers} onRecorded={refresh} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminFinancials() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    WorkshopService.admin.financials()
      .then(setRows)
      .catch(() => setError('Could not load revenue figures.'));
  }, []);
  useEffect(load, [load]);

  if (error) return <div className="wa-banner wa-banner--error"><AlertCircle size={16} />{error}</div>;
  if (!rows) return <div className="wa-empty">Loading revenue…</div>;

  return (
    <div>
      <div className="wa-kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <Kpi label="Gross collected" value={formatINR(sum(rows, 'gross'))} hint={`${sum(rows, 'seats_sold')} seats sold`} />
        <Kpi label="Junglyst commission" value={formatINR(sum(rows, 'commission'))} />
        <Kpi label="Organiser share" value={formatINR(sum(rows, 'seller_payout'))} />
        <Kpi label="Settled to organisers" value={formatINR(sum(rows, 'paid_out'))} />
        <Kpi label="Balance due now" value={formatINR(rows.reduce((total, r) => total + Math.max(0, parseFloat(r.balance_due) || 0), 0))} hint="For sessions already held" />
        <Kpi label="Still to settle" value={formatINR(rows.reduce((total, r) => total + Math.max(0, parseFloat(r.pending_settlement) || 0), 0))} hint="Incl. upcoming sessions" />
      </div>

      <div className="wa-card">
        <div className="wa-table-wrap">
          <table className="wa-table">
            <thead>
              <tr>
                <th>Workshop</th><th>Organiser</th><th className="num">Bookings</th><th className="num">Seats</th>
                <th className="num">Gross</th><th className="num">Commission</th><th className="num">Organiser share</th>
                <th className="num">Settled</th><th className="num">Due now</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9}><div className="wa-empty"><IndianRupee size={28} /><h3>No revenue yet</h3><p>Figures appear once the first booking is paid.</p></div></td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="wa-row-click" tabIndex={0} onClick={() => setSelected(r)} onKeyDown={e => { if (e.key === 'Enter') setSelected(r); }}>
                  <td><div className="wa-strong">{r.title}</div><div className="wa-muted" style={{ textTransform: 'capitalize' }}>{r.status}</div></td>
                  <td>{r.organiser_name}</td>
                  <td className="num">{r.paid_bookings}</td>
                  <td className="num">{r.seats_sold}</td>
                  <td className="num wa-strong">{money(r.gross)}</td>
                  <td className="num">{money(r.commission)}</td>
                  <td className="num">{money(r.seller_payout)}</td>
                  <td className="num">{money(r.paid_out)}</td>
                  <td className="num" style={{ color: parseFloat(r.balance_due) > 0 ? '#b45309' : '#15803d', fontWeight: 800 }}>
                    {dueLabel(r.balance_due).value}
                    {dueLabel(r.balance_due).hint && <div className="wa-muted" style={{ fontWeight: 500 }}>{dueLabel(r.balance_due).hint}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="wa-help" style={{ marginTop: '0.6rem' }}>Click a workshop for the session breakdown and to record settlement transfers. Cancelled and unpaid bookings are excluded.</p>

      {selected && <WorkshopFinancialsDrawer row={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </div>
  );
}
