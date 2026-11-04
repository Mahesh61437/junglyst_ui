import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Clock } from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/workshops';
import { QUOTE_STATUS, SUPPORT_PHONE, payByInfo } from '../../utils/serviceQuotes';
import { launchGatewayPayment } from '../../utils/paymentGateway';
import PayAddressModal from './PayAddressModal';
import CancelOrderModal from './CancelOrderModal';
import '../../pages/Services.css';

const money = (value) => formatINR(value, { decimals: 2 });

export function QuoteStatusPill({ status }) {
  const meta = QUOTE_STATUS[status] || QUOTE_STATUS.submitted;
  return <span className="sv-pill" style={{ background: meta.bg, color: meta.fg }}>{meta.label}</span>;
}

function QuoteSizeLine({ quote }) {
  const dimensions = [quote.length_cm, quote.width_cm, quote.height_cm].filter(Boolean).map(Number).join(' × ');
  const parts = [quote.shape, dimensions && `${dimensions} cm`].filter(Boolean);
  return parts.length ? <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}><strong>Size:</strong> {parts.join(', ')}</p> : null;
}

// Extra payments the seller or admin asked for after the first payment.
function ChargeList({ request, payingId, onPayCharge }) {
  const charges = (request.additional_charges || []).filter(charge => charge.status !== 'cancelled');
  if (!charges.length) return null;
  return (
    <div className="sv-charges">
      <strong style={{ fontSize: '0.8rem' }}>Additional payments</strong>
      {charges.map(charge => (
        <div key={charge.id} className={`sv-charge${charge.status === 'paid' ? ' sv-charge--done' : ''}`}>
          <div className="sv-charge-text">
            <strong>{charge.description}</strong>
            {charge.status === 'paid' ? 'Paid' : 'Your delivery address stays the same.'}
          </div>
          {charge.status === 'requested' ? (
            <button type="button" className="sv-pay" disabled={Boolean(payingId)} onClick={() => onPayCharge(request, charge)}>
              {payingId === charge.id ? 'Opening payment…' : `Pay ${money(charge.amount)}`}
            </button>
          ) : <strong>{money(charge.amount)}</strong>}
        </div>
      ))}
    </div>
  );
}

function PayByNote({ payBy }) {
  const info = payByInfo(payBy);
  if (!info || info.overdue) return null;
  return (
    <p className={`sv-payby${info.urgent ? ' sv-payby--urgent' : ''}`}>
      <Clock size={14} aria-hidden="true" /> Pay by <strong>{info.when}</strong> · {info.left}
    </p>
  );
}

function QuoteCard({ request, onPay, payingChargeId, onPayCharge, onCancel }) {
  const { quote } = request;
  return (
    <article className="sv-quote" aria-label={`Custom order ${request.reference}`}>
      <div className="sv-quote-top">
        <div>
          <div className="sv-quote-title">{request.offering_name}</div>
          <div className="sv-quote-meta">{request.reference} · {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
        <QuoteStatusPill status={request.status} />
      </div>

      {request.status === 'submitted' || request.status === 'in_review' ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
          Our team is preparing your quote. Your budget: {formatINR(request.budget_min)} – {formatINR(request.budget_max)}.
        </p>
      ) : null}

      {quote && request.status === 'awaiting_payment' && (
        <>
          <div className="sv-figures">
            <div className="sv-figure"><span>Item</span><strong>{money(quote.item_price)}</strong></div>
            <div className="sv-figure"><span>Shipping</span><strong>{money(quote.shipping_fee)}</strong></div>
            <div className="sv-figure"><span>Total</span><strong>{money(quote.total_amount)}</strong></div>
          </div>
          <QuoteSizeLine quote={quote} />
          {quote.inclusions?.length > 0 && (
            <div>
              <strong style={{ fontSize: '0.8rem' }}>Included</strong>
              <ul className="sv-list">
                {quote.inclusions.map((item, index) => (
                  <li key={`${item.label}-${index}`}>{item.label}{item.amount ? ` (${money(item.amount)})` : ''}</li>
                ))}
              </ul>
            </div>
          )}
          {quote.notes && <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-line' }}>{quote.notes}</p>}
          <PayByNote payBy={request.pay_by} />
          <button type="button" className="sv-pay" onClick={() => onPay(request)}>Pay {money(quote.total_amount)}</button>
        </>
      )}

      {request.status === 'paid' && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
          Paid{request.order_number ? ` · Order ${request.order_number}` : ''}. Your seller is preparing it. Track it in the orders below.
        </p>
      )}
      <ChargeList request={request} payingId={payingChargeId} onPayCharge={onPayCharge} />
      {request.cancel_requested_at && (
        <p className="sv-quote-note sv-quote-note--warn">
          You asked to cancel this order. Our team will look at it and contact you soon.
        </p>
      )}
      {request.can_cancel && (
        <button type="button" className="sv-link-btn sv-cancel-link" onClick={() => onCancel(request)}>
          {request.status === 'paid' ? 'Request cancellation' : 'Cancel this request'}
        </button>
      )}
      {request.status === 'delivered' && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#3730a3' }}>
          Delivered{request.order_number ? ` · Order ${request.order_number}` : ''}. We hope you love it!
        </p>
      )}
      {request.status === 'expired' && (
        <p className="sv-quote-note sv-quote-note--warn">
          The payment window for this quote has closed. <a href={`tel:${SUPPORT_PHONE.tel}`}>Call {SUPPORT_PHONE.display}</a> and we can reopen it.
        </p>
      )}
      {request.status === 'cancelled' && (
        <p className="sv-quote-note sv-quote-note--warn">
          This order was cancelled{request.cancel_reason ? `: ${request.cancel_reason}` : '.'}{request.paid_at ? ' Your payment will be refunded to your original payment method.' : ''}
        </p>
      )}
      {request.status === 'declined' && <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>We could not take this request on. Please call us if you would like to adjust it.</p>}
    </article>
  );
}

// "Custom order quotes" block shown above the order history. Renders nothing
// until the customer has made a request.
export default function MyQuotes({ onPaid }) {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [paying, setPaying] = useState(null);
  const [payingChargeId, setPayingChargeId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(() => {
    ServiceQuoteService.my.list()
      .then(data => setRequests(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!requests.length) return null;

  const handlePaid = () => {
    setPaying(null);
    showToast('Payment received. Your custom order is confirmed.', 'success');
    load();
    onPaid?.();
  };

  // An extra payment reuses the first order's address, so it goes straight to the gateway.
  const handlePayCharge = async (request, charge) => {
    setPayingChargeId(charge.id);
    try {
      const response = await ServiceQuoteService.my.payCharge(request.reference, charge.id);
      const result = await launchGatewayPayment(response, { description: `${request.reference}: ${charge.description}` });
      if (result.status === 'success') {
        showToast('Additional payment received. Thank you!', 'success');
        load();
        onPaid?.();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.userMessage || 'Could not start the payment. Please try again.', 'error');
    } finally {
      setPayingChargeId(null);
    }
  };

  return (
    <section className="sv-quotes" aria-labelledby="my-quotes-title">
      <div className="sv-quotes-head">
        <ClipboardList size={20} aria-hidden="true" />
        <h2 id="my-quotes-title">Custom order quotes</h2>
      </div>
      {requests.map(request => (
        <QuoteCard key={request.id} request={request} onPay={setPaying} payingChargeId={payingChargeId} onPayCharge={handlePayCharge} onCancel={setCancelling} />
      ))}
      {cancelling && (
        <CancelOrderModal
          request={cancelling}
          onClose={() => setCancelling(null)}
          onDone={(outcome) => {
            setCancelling(null);
            showToast(outcome === 'requested' ? 'Cancellation request sent. We will contact you.' : 'Your request was cancelled.', 'success');
            load();
          }}
        />
      )}
      {paying && <PayAddressModal quote={paying} onClose={() => setPaying(null)} onPaid={handlePaid} />}
    </section>
  );
}
