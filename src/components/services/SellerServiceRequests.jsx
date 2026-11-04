import { useCallback, useEffect, useRef, useState } from 'react';
import { PackageCheck } from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { formatINR } from '../../utils/workshops';
import { QuoteStatusPill } from './MyQuotes';
import QuoteDetailsForm from './QuoteDetailsForm';
import AdditionalChargesPanel from './AdditionalChargesPanel';
import QuoteRequestList from './QuoteRequestList';
import QuoteSectionTabs from './QuoteSectionTabs';
import { QUOTE_SECTIONS } from '../../utils/serviceQuotes';

const SELLER_SECTIONS = QUOTE_SECTIONS.filter(section => section.id !== 'closed');
import '../../pages/Services.css';
import '../../pages/SuperAdminWorkshops.css';

const EDITABLE_STATUSES = ['submitted', 'in_review'];
const formatAnswer = (value) => (Array.isArray(value) ? value.join(', ') : String(value));

function RequestModal({ requestId, onClose, onChanged }) {
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    ServiceQuoteService.seller.get(requestId).then(setRequest).catch(() => setError('Could not load this request.'));
  }, [requestId]);
  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const applyUpdate = (updated) => {
    setRequest(updated);
    onChanged();
  };

  const save = async (payload) => applyUpdate(await ServiceQuoteService.seller.update(requestId, payload));

  return (
    <div className="sv-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="sv-modal sv-modal--wide" role="dialog" aria-modal="true" aria-labelledby="sr-title" tabIndex={-1} ref={dialogRef}>
        <div className="sv-modal-head">
          <h2 id="sr-title">{request ? `${request.reference} · ${request.offering_name}` : 'Request'}</h2>
          <button type="button" className="sv-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        {error && <div className="sv-banner sv-banner--error" role="alert">{error}</div>}
        {!request && !error && <div className="sv-skeleton" style={{ height: 300 }} aria-busy="true" />}
        {request && (
          <div className="sv-detail-grid">
            <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
              <QuoteStatusPill status={request.status} />
              <dl className="sv-kv">
                <dt>Customer</dt><dd>{request.contact_name}</dd>
                <dt>State</dt><dd>{request.state}</dd>
                <dt>Budget</dt><dd><strong>{formatINR(request.budget_min)} – {formatINR(request.budget_max)}</strong></dd>
                {request.answer_rows.map(row => (<span key={row.label} style={{ display: 'contents' }}><dt>{row.label}</dt><dd>{formatAnswer(row.value)}</dd></span>))}
                {request.customer_notes && (<><dt>Notes</dt><dd style={{ whiteSpace: 'pre-line' }}>{request.customer_notes}</dd></>)}
              </dl>
              {request.status === 'paid' && (
                <div className="sv-banner sv-banner--ok" role="status">
                  <PackageCheck size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  Paid{request.order_number ? ` (order ${request.order_number})` : ''}. Prepare it and ship it from the Fulfillment tab.
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Quote</h3>
              <p className="sv-help" style={{ margin: 0 }}>Fill in the price, shipping, size and what is included. Our team reviews it and sends the pay request to the customer.</p>
              <QuoteDetailsForm key={request.status} request={request} editable={EDITABLE_STATUSES.includes(request.status)} isAdmin={false} onSave={save} budgetMax={request.budget_max} />
              <AdditionalChargesPanel
                request={request}
                onRequest={(payload) => ServiceQuoteService.seller.requestCharge(requestId, payload).then(applyUpdate)}
                onCancel={(chargeId) => ServiceQuoteService.seller.cancelCharge(requestId, chargeId).then(applyUpdate)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Seller dashboard tab: custom orders the admin assigned to this seller.
export default function SellerServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [section, setSection] = useState('active');

  const load = useCallback(() => ServiceQuoteService.seller.list({ section })
    .then(data => { setRequests(Array.isArray(data) ? data : data.results || []); setError(null); })
    .catch(() => setError('Could not load your custom orders.'))
    .finally(() => setLoading(false)), [section]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.25rem' }}>Custom orders</h2>
      <p className="wa-sub" style={{ marginBottom: '1.25rem' }}>Made-to-order requests the Junglyst team has assigned to you.</p>
      <QuoteSectionTabs sections={SELLER_SECTIONS} value={section} onChange={(next) => { setLoading(true); setSection(next); }} />
      {error && <div className="sv-banner sv-banner--error" role="alert">{error}</div>}
      {loading ? (
        <div style={{ display: 'grid', gap: '0.6rem' }} aria-busy="true">{[0, 1, 2].map(i => <div key={i} className="sv-skeleton" style={{ height: 76 }} />)}</div>
      ) : !error && requests.length === 0 ? (
        <div className="wa-card wa-empty" style={{ padding: '3rem 1.5rem' }}>
          <h3>{section === 'active' ? 'No open custom orders' : 'Nothing delivered yet'}</h3>
          <p>{section === 'active'
            ? 'When the admin assigns you a request, it will appear here so you can add the quote details.'
            : 'Orders move here once they are delivered.'}</p>
        </div>
      ) : (
        <QuoteRequestList items={requests} onOpen={setOpenId} showSeller={false} />
      )}
      {openId && <RequestModal requestId={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}
