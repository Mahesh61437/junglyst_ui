import { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { formatINR } from '../../utils/workshops';
import { payByInfo } from '../../utils/serviceQuotes';
import { QuoteStatusPill } from './MyQuotes';
import QuoteDetailsForm from './QuoteDetailsForm';
import AdditionalChargesPanel from './AdditionalChargesPanel';
import '../../pages/Services.css';
import '../../pages/SuperAdminWorkshops.css';

const EDITABLE_STATUSES = ['submitted', 'in_review'];
const ACTION_LABELS = {
  quote_edited: 'edited the quote', seller_assigned: 'assigned a seller', pay_request_sent: 'sent the pay request',
  declined: 'declined the request', paid: 'payment received', payment_failed: 'a payment attempt failed',
  additional_requested: 'requested an additional payment', additional_cancelled: 'cancelled an additional payment',
  additional_paid: 'additional payment received', delivered: 'marked delivered',
  expired: 'payment window expired', pay_request_renewed: 'renewed the pay request (3 more days)', cancelled: 'cancelled the order',
};

const formatAnswer = (value) => (Array.isArray(value) ? value.join(', ') : String(value));

export default function AdminQuoteModal({ requestId, sellers, onClose, onChanged }) {
  const [request, setRequest] = useState(null);
  const [sellerId, setSellerId] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(null); // null | 'decline' | 'cancel'
  const [reason, setReason] = useState('');
  const dialogRef = useRef(null);

  const load = useCallback(() => ServiceQuoteService.admin.request(requestId)
    .then(data => { setRequest(data); setSellerId(data.assigned_seller?.id || ''); })
    .catch(() => setError('Could not load this request.')), [requestId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      if (updated?.id) { setRequest(updated); setSellerId(updated.assigned_seller?.id || ''); }
      onChanged();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.seller_id?.[0] || err.userMessage || 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const saveQuote = async (payload) => {
    const updated = await ServiceQuoteService.admin.updateRequest(requestId, payload);
    setRequest(updated);
    onChanged();
  };

  const applyUpdate = (updated) => {
    setRequest(updated);
    onChanged();
  };

  const sendPayRequest = () => {
    if (!window.confirm(`Send the pay request for ${formatINR(request.quote.total_amount, { decimals: 2 })} to ${request.contact_name}? The seller can no longer edit the quote.`)) return;
    run(() => ServiceQuoteService.admin.sendPayRequest(requestId));
  };

  const editable = request && (EDITABLE_STATUSES.includes(request.status)
    || (request.status === 'awaiting_payment' && !request.order_number));
  const open = request && ['submitted', 'in_review', 'awaiting_payment'].includes(request.status) && !request.order_number;
  const readyToSend = request && EDITABLE_STATUSES.includes(request.status);
  // What the customer has paid so far: refunded by hand if the order is cancelled.
  const refundDue = request && request.status === 'paid'
    ? Number(request.quote?.total_amount || 0) + (request.additional_charges || []).filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0)
    : 0;

  return (
    <div className="sv-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div className="sv-modal sv-modal--wide" role="dialog" aria-modal="true" aria-labelledby="aq-title" tabIndex={-1} ref={dialogRef}>
        <div className="sv-modal-head">
          <h2 id="aq-title">{request ? `${request.reference} · ${request.offering_name}` : 'Request'}</h2>
          <button type="button" className="sv-close" aria-label="Close" onClick={onClose}>×</button>
        </div>

        {error && <div className="sv-banner sv-banner--error" role="alert">{error}</div>}
        {!request && !error && <div className="sv-skeleton" style={{ height: 320 }} aria-busy="true" />}

        {request && (
          <div className="sv-detail-grid">
            <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
              <div><QuoteStatusPill status={request.status} /> {request.order_number && <span className="sv-help">Order {request.order_number}</span>}</div>
              <dl className="sv-kv">
                <dt>Customer</dt><dd>{request.contact_name}</dd>
                <dt>Phone</dt><dd><a href={`tel:${request.contact_phone}`}><Phone size={12} aria-hidden="true" /> {request.contact_phone}</a></dd>
                <dt>Email</dt><dd><a href={`mailto:${request.contact_email}`}><Mail size={12} aria-hidden="true" /> {request.contact_email}</a></dd>
                <dt>State</dt><dd>{request.state}</dd>
                <dt>Budget</dt><dd><strong>{formatINR(request.budget_min)} – {formatINR(request.budget_max)}</strong></dd>
                {request.pay_by && ['awaiting_payment', 'expired'].includes(request.status) && (
                  <><dt>Pay by</dt><dd style={{ color: request.status === 'expired' ? '#b91c1c' : undefined, fontWeight: 700 }}>{payByInfo(request.pay_by).when} · {payByInfo(request.pay_by).left}</dd></>
                )}
                {request.cancel_reason && (<><dt>Cancelled</dt><dd>{request.cancel_reason}</dd></>)}
                {request.answer_rows.map(row => (<span key={row.label} style={{ display: 'contents' }}><dt>{row.label}</dt><dd>{formatAnswer(row.value)}</dd></span>))}
                {request.customer_notes && (<><dt>Notes</dt><dd style={{ whiteSpace: 'pre-line' }}>{request.customer_notes}</dd></>)}
                {request.reference_images?.length > 0 && (<><dt>Images</dt><dd><span className="sv-photos">{request.reference_images.map((url, i) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="sv-photo" aria-label={`Open reference photo ${i + 1}`}><img src={url} alt="" /></a>)}</span></dd></>)}
              </dl>

              <div>
                <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem' }}>Seller</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label className="sv-label" htmlFor="aq-seller" style={{ position: 'absolute', left: -9999 }}>Assign seller</label>
                  <select id="aq-seller" className="sv-select" style={{ flex: '1 1 180px' }} value={sellerId} onChange={(e) => setSellerId(e.target.value)} disabled={!open || busy}>
                    <option value="">Choose a seller…</option>
                    {sellers.map(seller => <option key={seller.id} value={seller.id}>{seller.store_name}</option>)}
                  </select>
                  <button type="button" className="wa-btn wa-btn--ghost" style={{ minHeight: 46 }} disabled={!open || busy || !sellerId || sellerId === request.assigned_seller?.id} onClick={() => run(() => ServiceQuoteService.admin.assign(requestId, sellerId))}>
                    {request.assigned_seller ? 'Reassign' : 'Assign'}
                  </button>
                </div>
              </div>

              {request.events?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem' }}>History</h3>
                  <ul className="sv-history">
                    {request.events.map((event, index) => (
                      <li key={index}><strong>{event.actor_name}</strong> {ACTION_LABELS[event.action] || event.action} · {new Date(event.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Quote</h3>
              <QuoteDetailsForm key={request.status === 'awaiting_payment' ? 'sent' : 'open'} request={request} editable={editable} isAdmin onSave={saveQuote} budgetMax={request.budget_max} />

              {readyToSend && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  {readyToSend && (
                    <button type="button" className="wa-btn wa-btn--primary" style={{ minHeight: 48, flex: '1 1 200px' }} disabled={busy || !request.assigned_seller || !request.quote.item_price} onClick={sendPayRequest}>
                      Send pay request
                    </button>
                  )}
                  {readyToSend && (
                    <button type="button" className="wa-btn wa-btn--danger" style={{ minHeight: 48 }} disabled={busy} onClick={() => setClosing(prev => (prev === 'decline' ? null : 'decline'))}>Decline request</button>
                  )}
                  {readyToSend && (!request.assigned_seller || !request.quote.item_price) && (
                    <p className="sv-help" style={{ flexBasis: '100%', margin: 0 }}>Assign a seller and save an item price before sending the pay request.</p>
                  )}
                </div>
              )}
              {(request.status === 'expired' || request.status === 'awaiting_payment') && (
                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  <button type="button" className="wa-btn wa-btn--ghost" style={{ minHeight: 48 }} disabled={busy}
                    onClick={() => run(() => ServiceQuoteService.admin.renew(requestId))}>
                    {request.status === 'expired' ? 'Reopen for 3 more days' : 'Extend pay-by by 3 days'}
                  </button>
                </div>
              )}
              {['awaiting_payment', 'expired', 'paid'].includes(request.status) && (
                <button type="button" className="wa-btn wa-btn--danger" style={{ minHeight: 48 }} disabled={busy} onClick={() => setClosing(prev => (prev === 'cancel' ? null : 'cancel'))}>
                  Cancel order
                </button>
              )}
              {closing && (
                <div className="sv-field">
                  {closing === 'cancel' && refundDue > 0 && (
                    <div className="sv-banner sv-banner--error" role="note">
                      Refund {formatINR(refundDue, { decimals: 2 })} to the customer yourself from the payment dashboard. The seller is told not to ship.
                    </div>
                  )}
                  <label className="sv-label" htmlFor="aq-reason">{closing === 'cancel' ? 'Reason (shown to the customer)' : 'Reason (kept in the history)'}</label>
                  <textarea id="aq-reason" className="sv-textarea" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <button type="button" className="wa-btn wa-btn--danger" style={{ minHeight: 44 }} disabled={busy}
                    onClick={() => run(() => (closing === 'cancel' ? ServiceQuoteService.admin.cancel(requestId, reason) : ServiceQuoteService.admin.decline(requestId, reason))).then(() => setClosing(null))}>
                    {closing === 'cancel' ? 'Confirm cancellation' : 'Confirm decline'}
                  </button>
                </div>
              )}
              {request.status === 'paid' && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'grid', gap: '0.4rem' }}>
                  <button type="button" className="wa-btn wa-btn--primary" style={{ minHeight: 48 }} disabled={busy}
                    onClick={() => window.confirm(`Mark ${request.reference} as delivered? The seller's payout becomes due.`) && run(() => ServiceQuoteService.admin.markDelivered(requestId))}>
                    Mark as delivered
                  </button>
                  <p className="sv-help" style={{ margin: 0 }}>Use this for hand deliveries. Courier deliveries update automatically.</p>
                </div>
              )}
              <AdditionalChargesPanel
                request={request}
                onRequest={(payload) => ServiceQuoteService.admin.requestCharge(requestId, payload).then(applyUpdate)}
                onCancel={(chargeId) => ServiceQuoteService.admin.cancelCharge(requestId, chargeId).then(applyUpdate)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
