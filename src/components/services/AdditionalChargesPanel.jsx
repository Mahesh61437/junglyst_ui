import { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatINR } from '../../utils/workshops';
import '../../pages/Services.css';
import '../../pages/SuperAdminWorkshops.css';

const MAX_AMOUNT = 10000000;
const money = (value) => formatINR(value, { decimals: 2 });
const STATUS_STYLE = {
  requested: { bg: '#ffedd5', fg: '#9a3412' },
  paid: { bg: '#dcfce7', fg: '#166534' },
  cancelled: { bg: '#f1f5f9', fg: '#475569' },
};

function validate(description, amount) {
  if (description.trim().length < 3) return 'Describe what the extra payment is for.';
  const value = Number(amount);
  if (!amount || Number.isNaN(value) || value <= 0) return 'Enter an amount above zero.';
  if (value > MAX_AMOUNT) return 'Amount is too high.';
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) return 'Use at most 2 decimals.';
  return null;
}

/**
 * After the first payment, the super admin or the assigned seller can ask the
 * customer for more (an upgrade, extra plants...). `onRequest` / `onCancel`
 * call the caller's own endpoint and resolve with the refreshed request.
 */
export default function AdditionalChargesPanel({ request, onRequest, onCancel, onPayoutDone }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const charges = request.additional_charges || [];

  if (request.status !== 'paid' && !charges.length) return null;

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(err.response?.data?.error || err.userMessage || 'That did not work. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    const problem = validate(description, amount);
    if (problem) { setError(problem); return; }
    if (!window.confirm(`Ask ${request.contact_name} to pay ${money(amount)} for "${description.trim()}"?`)) return;
    if (await run(() => onRequest({ description: description.trim(), amount }))) {
      setDescription('');
      setAmount('');
      setOpen(false);
    }
  };

  return (
    <section className="sv-charges" aria-labelledby={`charges-${request.id}`} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
      <h3 id={`charges-${request.id}`} style={{ fontSize: '1rem', margin: 0 }}>Additional payments</h3>
      {charges.length === 0 && <p className="sv-help" style={{ margin: 0 }}>Added something after the customer paid? Ask for the extra amount here.</p>}
      {charges.map(charge => {
        const style = STATUS_STYLE[charge.status] || STATUS_STYLE.requested;
        return (
          <div key={charge.id} className={`sv-charge${charge.status === 'requested' ? '' : ' sv-charge--done'}`}>
            <div className="sv-charge-text">
              <strong>{charge.description}</strong>
              {money(charge.amount)} · <span className="sv-pill" style={{ background: style.bg, color: style.fg }}>{charge.status_label}</span>
            </div>
            {charge.payout_status === 'manual_due' && (
              <div className="sv-banner sv-banner--error" style={{ flexBasis: '100%' }} role="note">
                <span>The seller was already paid out. Pay them {money(charge.seller_payout)} yourself, then record it.</span>
                {onPayoutDone && (
                  <button type="button" className="wa-btn wa-btn--primary wa-btn--sm" style={{ minHeight: 44, marginLeft: 'auto' }} disabled={busy}
                    onClick={() => window.confirm(`Mark the ${money(charge.seller_payout)} seller payout as paid?`) && run(() => onPayoutDone(charge.id))}>
                    Mark seller paid
                  </button>
                )}
              </div>
            )}
            {charge.payout_status === 'manual_done' && <span className="sv-help" style={{ flexBasis: '100%' }}>Seller payout of {money(charge.seller_payout)} recorded.</span>}
            {charge.status === 'requested' && (
              <button type="button" className="wa-btn wa-btn--danger wa-btn--sm" style={{ minHeight: 44 }} disabled={busy}
                onClick={() => window.confirm(`Cancel the request for ${money(charge.amount)}?`) && run(() => onCancel(charge.id))}>
                Cancel request
              </button>
            )}
          </div>
        );
      })}

      {request.status === 'paid' && (open ? (
        <form onSubmit={handleRequest} noValidate className="sv-fieldset" aria-label="Request an additional payment">
          <div className="sv-field">
            <label className="sv-label" htmlFor={`charge-desc-${request.id}`}>What is it for?</label>
            <input id={`charge-desc-${request.id}`} className="sv-input" maxLength={200} placeholder="e.g. Upgrade to a 40 cm glass cube" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="sv-field">
            <label className="sv-label" htmlFor={`charge-amount-${request.id}`}>Amount (₹)</label>
            <input id={`charge-amount-${request.id}`} className="sv-input" type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="wa-btn wa-btn--primary" style={{ minHeight: 46, flex: '1 1 180px' }} disabled={busy}>{busy ? 'Sending…' : 'Send payment request'}</button>
            <button type="button" className="wa-btn wa-btn--ghost" style={{ minHeight: 46 }} onClick={() => { setOpen(false); setError(null); }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className="wa-btn wa-btn--ghost" style={{ minHeight: 44, justifySelf: 'start' }} onClick={() => setOpen(true)}>
          <Plus size={14} /> Request additional payment
        </button>
      ))}
      {error && <div className="sv-banner sv-banner--error" role="alert">{error}</div>}
    </section>
  );
}
