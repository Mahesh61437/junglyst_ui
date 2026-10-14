import { useEffect, useState } from 'react';
import { Search, Download, Phone, Mail, Users, AlertCircle } from 'lucide-react';
import { WorkshopService } from '../../services/WorkshopService';
import { formatDate, formatINR, formatTime, toCsv } from '../../utils/workshops';
import BookingStatusPill from './BookingStatusPill';
import { usePagedFetch } from './usePagedFetch';

const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 350;
const STATUS_FILTERS = [
  { id: 'paid', label: 'Paid (all)' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'attended', label: 'Attended' },
  { id: 'no_show', label: 'No-show' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'pending_payment', label: 'Awaiting payment' },
  { id: 'payment_failed', label: 'Payment failed' },
  { id: '', label: 'Everything' },
];
// Statuses an admin can still move between (cancelling is final).
const EDITABLE_STATUSES = ['confirmed', 'attended', 'no_show'];

const CSV_COLUMNS = [
  { label: 'Reference', value: b => b.reference },
  { label: 'Status', value: b => b.status_label },
  { label: 'Workshop', value: b => b.workshop_title },
  { label: 'Option', value: b => b.option_name },
  { label: 'Session date', value: b => b.session_date },
  { label: 'Start', value: b => b.session_start },
  { label: 'End', value: b => b.session_end },
  { label: 'Attendee', value: b => b.attendee_name },
  { label: 'Phone', value: b => b.attendee_phone },
  { label: 'Email', value: b => b.attendee_email },
  { label: 'Seats', value: b => b.participants },
  { label: 'Organiser', value: b => b.organiser_name },
  { label: 'Amount', value: b => b.total_amount },
  { label: 'Commission', value: b => b.commission_amount },
  { label: 'Organiser payout', value: b => b.seller_payout },
  { label: 'Notes', value: b => b.notes },
  { label: 'Booked at', value: b => b.created_at },
];

const fetchBookingsPage = (params) => WorkshopService.admin.bookings({ ...params, page_size: PAGE_SIZE });

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminBookings({ workshops }) {
  const [filters, setFilters] = useState({ workshop: '', status: 'paid', from: '', to: '' });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const [exporting, setExporting] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const params = Object.fromEntries(Object.entries({ ...filters, search }).filter(([, v]) => v));
  const { data, loading, failed, page, setPage, replaceRow } = usePagedFetch(fetchBookingsPage, params);
  const error = actionError || (failed ? 'Could not load bookings.' : null);

  const setFilter = (field) => (e) => setFilters(prev => ({ ...prev, [field]: e.target.value }));

  const updateStatus = async (booking, status) => {
    let adminNote;
    if (status === 'cancelled') {
      adminNote = window.prompt('Reason for cancelling (refund reference etc.)', booking.admin_note || '');
      if (adminNote === null) return;
    }
    setSavingId(booking.id);
    try {
      const updated = await WorkshopService.admin.updateBooking(booking.id, adminNote === undefined ? { status } : { status, admin_note: adminNote });
      replaceRow(updated);
      setActionError(null);
    } catch (err) {
      setActionError(err.response?.data?.status?.[0] || 'Could not update the booking.');
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = [];
      for (let p = 1; ; p += 1) {
        const res = await WorkshopService.admin.bookings({ ...params, page: p, page_size: EXPORT_PAGE_SIZE });
        rows.push(...res.results);
        if (!res.next) break;
      }
      const blob = new Blob([toCsv(rows, CSV_COLUMNS)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workshop-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setActionError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  const pageSeats = data.results.reduce((sum, b) => sum + b.participants, 0);

  return (
    <div>
      <div className="wa-card wa-filters">
        <div>
          <label className="wa-label" htmlFor="wa-bk-search">Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input id="wa-bk-search" className="wa-input" style={{ paddingLeft: 32 }} placeholder="Name, phone, email or booking ref" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="wa-label" htmlFor="wa-bk-workshop">Workshop</label>
          <select id="wa-bk-workshop" className="wa-input" value={filters.workshop} onChange={setFilter('workshop')}>
            <option value="">All workshops</option>
            {workshops.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        </div>
        <div>
          <label className="wa-label" htmlFor="wa-bk-status">Status</label>
          <select id="wa-bk-status" className="wa-input" value={filters.status} onChange={setFilter('status')}>
            {STATUS_FILTERS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="wa-label" htmlFor="wa-bk-from">Session from</label>
          <input id="wa-bk-from" className="wa-input" type="date" value={filters.from} onChange={setFilter('from')} />
        </div>
        <div>
          <label className="wa-label" htmlFor="wa-bk-to">Session to</label>
          <input id="wa-bk-to" className="wa-input" type="date" value={filters.to} onChange={setFilter('to')} />
        </div>
        <button type="button" className="wa-btn wa-btn--ghost" onClick={exportCsv} disabled={exporting || !data.count}>
          <Download size={15} /> {exporting ? 'Exporting…' : 'CSV'}
        </button>
      </div>

      {error && <div className="wa-banner wa-banner--error" role="alert"><AlertCircle size={16} />{error}</div>}

      <div className="wa-card">
        <div className="wa-table-wrap">
          <table className="wa-table">
            <thead>
              <tr>
                <th>Booking</th><th>Attendee</th><th>Workshop & session</th><th>Organiser</th>
                <th className="num">Seats</th><th className="num">Amount</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="wa-empty">Loading bookings…</td></tr>
              ) : data.results.length === 0 ? (
                <tr><td colSpan={7}><div className="wa-empty"><Users size={28} /><h3>No bookings match</h3><p>Try a different status or clear the filters.</p></div></td></tr>
              ) : data.results.map(b => (
                <tr key={b.id}>
                  <td>
                    <div className="wa-strong" style={{ fontFamily: 'monospace' }}>{b.reference}</div>
                    <div className="wa-muted">{new Date(b.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div>
                  </td>
                  <td>
                    <div className="wa-strong">{b.attendee_name}</div>
                    <a className="wa-link" href={`tel:${b.attendee_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{b.attendee_phone}</a>
                    <div className="wa-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{b.attendee_email}</div>
                    {b.notes && <div className="wa-muted" style={{ marginTop: 4, maxWidth: 220 }}>“{b.notes}”</div>}
                  </td>
                  <td>
                    <div className="wa-strong">{b.workshop_title}</div>
                    <div className="wa-muted">{b.option_name}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{formatDate(b.session_date)} · {formatTime(b.session_start)}–{formatTime(b.session_end)}</div>
                  </td>
                  <td>{b.organiser_name}</td>
                  <td className="num wa-strong">{b.participants}</td>
                  <td className="num">
                    <div className="wa-strong">{formatINR(b.total_amount, { decimals: 2 })}</div>
                    <div className="wa-muted">Org {formatINR(b.seller_payout, { decimals: 2 })}</div>
                  </td>
                  <td>
                    {EDITABLE_STATUSES.includes(b.status) ? (
                      <select
                        className="wa-input" style={{ minWidth: 130, padding: '0.4rem 0.5rem' }} value={b.status}
                        disabled={savingId === b.id} aria-label={`Status for ${b.reference}`}
                        onChange={e => updateStatus(b, e.target.value)}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="attended">Attended</option>
                        <option value="no_show">No-show</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : <BookingStatusPill status={b.status} />}
                    {b.admin_note && <div className="wa-muted" style={{ marginTop: 4, maxWidth: 180 }}>{b.admin_note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="wa-pager">
          <span>{data.count} booking{data.count === 1 ? '' : 's'} · {pageSeats} seat{pageSeats === 1 ? '' : 's'} on this page</span>
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
