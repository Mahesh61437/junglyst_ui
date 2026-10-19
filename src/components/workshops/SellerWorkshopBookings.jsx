import { useEffect, useState } from 'react';
import { CalendarDays, Phone, Mail, Users, Sparkles, AlertCircle } from 'lucide-react';
import { WorkshopService } from '../../services/WorkshopService';
import { formatDate, formatINR, formatTime } from '../../utils/workshops';
import BookingStatusPill from './BookingStatusPill';
import { usePagedFetch } from './usePagedFetch';
import '../../pages/Workshops.css';
import '../../pages/SuperAdminWorkshops.css';

const PAGE_SIZE = 20;
const money = (v) => formatINR(v, { decimals: 2 });
const fetchSellerBookingsPage = (params) => WorkshopService.sellerBookings({ ...params, page_size: PAGE_SIZE });

export default function SellerWorkshopBookings() {
  const [summary, setSummary] = useState(null);
  const [when, setWhen] = useState('upcoming');
  const [workshopFilter, setWorkshopFilter] = useState('');
  const [summaryFailed, setSummaryFailed] = useState(false);

  useEffect(() => {
    WorkshopService.sellerSummary().then(setSummary).catch(() => setSummaryFailed(true));
  }, []);

  const { data: bookings, loading, failed, page, setPage } = usePagedFetch(
    fetchSellerBookingsPage, { when, ...(workshopFilter ? { workshop: workshopFilter } : {}) },
  );
  const error = summaryFailed ? 'Could not load your workshops.' : failed ? 'Could not load bookings.' : null;

  if (summary && summary.length === 0) {
    return (
      <div className="wa-card wa-empty" style={{ padding: '3rem 1.5rem' }}>
        <Sparkles size={32} color="#105c44" />
        <h3>Host a workshop with Junglyst</h3>
        <p style={{ maxWidth: 480, margin: '0 auto' }}>
          Run terrarium or aquarium workshops and we'll handle listing, bookings and payments. Write to admin@junglyst.com to partner on your first session.
        </p>
      </div>
    );
  }

  const totals = (summary || []).reduce((acc, w) => ({
    gross: acc.gross + parseFloat(w.gross), payout: acc.payout + parseFloat(w.seller_payout),
    paid: acc.paid + parseFloat(w.paid_out), due: acc.due + Math.max(0, parseFloat(w.balance_due)), seats: acc.seats + w.seats_sold,
  }), { gross: 0, payout: 0, paid: 0, due: 0, seats: 0 });
  const totalPages = Math.max(1, Math.ceil(bookings.count / PAGE_SIZE));
  // Until the summary arrives show a dash, never a misleading ₹0.
  const show = (value) => (summary === null ? '—' : value);

  return (
    <div>
      {error && <div className="wa-banner wa-banner--error" role="alert"><AlertCircle size={16} />{error}</div>}

      <div className="wa-kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="wa-card wa-kpi"><div className="wa-kpi-label">Seats sold</div><div className="wa-kpi-value">{show(totals.seats)}</div></div>
        <div className="wa-card wa-kpi"><div className="wa-kpi-label">Your share of sales</div><div className="wa-kpi-value">{show(formatINR(totals.gross))}</div><div className="wa-kpi-hint">Before platform commission</div></div>
        <div className="wa-card wa-kpi"><div className="wa-kpi-label">Your payout</div><div className="wa-kpi-value">{show(formatINR(totals.payout))}</div><div className="wa-kpi-hint">After platform commission</div></div>
        <div className="wa-card wa-kpi"><div className="wa-kpi-label">Received</div><div className="wa-kpi-value">{show(formatINR(totals.paid))}</div></div>
        <div className="wa-card wa-kpi"><div className="wa-kpi-label">Due to you</div><div className="wa-kpi-value" style={{ color: totals.due > 0 ? '#b45309' : undefined }}>{show(formatINR(totals.due))}</div><div className="wa-kpi-hint">For sessions already held</div></div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <div className="wa-tabs" role="tablist" style={{ marginBottom: 0, flex: '0 1 320px' }}>
          {[['upcoming', 'Upcoming'], ['past', 'Past'], ['', 'All']].map(([id, label]) => (
            <button key={id || 'all'} type="button" role="tab" className="wa-tab" aria-selected={when === id} onClick={() => setWhen(id)}>{label}</button>
          ))}
        </div>
        <select className="wa-input" style={{ maxWidth: 300 }} value={workshopFilter} onChange={e => setWorkshopFilter(e.target.value)} aria-label="Filter by workshop">
          <option value="">All my workshops</option>
          {(summary || []).map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
        </select>
      </div>

      <div className="wa-card">
        <div className="wa-table-wrap">
          <table className="wa-table" style={{ minWidth: 760 }}>
            <thead><tr><th>Session</th><th>Attendee</th><th>Workshop</th><th className="num">Seats</th><th className="num">Your payout</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="wa-empty">Loading…</td></tr>
              ) : bookings.results.length === 0 ? (
                <tr><td colSpan={6}><div className="wa-empty"><CalendarDays size={28} /><h3>No {when || ''} bookings</h3><p>Paid bookings for your workshops will show up here.</p></div></td></tr>
              ) : bookings.results.map(b => (
                <tr key={b.id}>
                  <td><div className="wa-strong">{formatDate(b.session_date)}</div><div className="wa-muted">{formatTime(b.session_start)} – {formatTime(b.session_end)}</div></td>
                  <td>
                    <div className="wa-strong">{b.attendee_name}</div>
                    <a className="wa-link" href={`tel:${b.attendee_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{b.attendee_phone}</a>
                    <div className="wa-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{b.attendee_email}</div>
                    {b.notes && <div className="wa-muted" style={{ marginTop: 4 }}>“{b.notes}”</div>}
                  </td>
                  <td>
                    <div className="wa-strong">{b.workshop_title}</div>
                    <div className="wa-muted">{b.option_name} · Ref {b.reference}</div>
                    {b.share_percent && Number(b.share_percent) < 100 && (
                      <div className="wa-muted">Co-hosted · your share {Number(b.share_percent)}% · {Number(b.commission_percent)}% commission</div>
                    )}
                  </td>
                  <td className="num wa-strong"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={12} />{b.participants}</span>
                    {b.builds < b.participants && <div className="wa-muted">{b.builds} shared terrarium{b.builds === 1 ? '' : 's'}</div>}</td>
                  <td className="num"><div className="wa-strong">{money(b.seller_payout)}</div><div className="wa-muted">of {money(b.gross_share ?? b.total_amount)}</div></td>
                  <td><BookingStatusPill status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="wa-pager">
          <span>{bookings.count} booking{bookings.count === 1 ? '' : 's'}</span>
          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button type="button" className="wa-btn wa-btn--ghost wa-btn--sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            {page} / {totalPages}
            <button type="button" className="wa-btn wa-btn--ghost wa-btn--sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </span>
        </div>
      </div>
    </div>
  );
}
