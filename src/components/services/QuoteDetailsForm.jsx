import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatINR } from '../../utils/workshops';
import { quoteTotal } from '../../utils/serviceQuotes';
import '../../pages/Services.css';
import '../../pages/SuperAdminWorkshops.css';

const MAX_PRICE = 10000000;
const MAX_DIMENSION_CM = 1000;
const MAX_INCLUSIONS = 30;

const toForm = (request) => {
  const quote = request.quote || {};
  return {
    item_price: quote.item_price ?? '', shipping_fee: quote.shipping_fee ?? '0', shape: quote.shape || '',
    length_cm: quote.length_cm ?? '', width_cm: quote.width_cm ?? '', height_cm: quote.height_cm ?? '',
    quote_notes: quote.notes || '', admin_notes: request.admin_notes || '',
    inclusions: (quote.inclusions || []).map(item => ({ label: item.label, amount: item.amount ?? '' })),
  };
};

function validate(form) {
  const errors = {};
  const price = Number(form.item_price);
  if (form.item_price === '' || Number.isNaN(price) || price <= 0) errors.item_price = 'Enter the item price.';
  else if (price > MAX_PRICE) errors.item_price = 'Price is too high.';
  else if (!/^\d+(\.\d{1,2})?$/.test(String(form.item_price))) errors.item_price = 'Use at most 2 decimals.';
  const shipping = Number(form.shipping_fee || 0);
  if (Number.isNaN(shipping) || shipping < 0 || shipping > MAX_PRICE) errors.shipping_fee = 'Enter a valid shipping amount.';
  else if (form.shipping_fee !== '' && !/^\d+(\.\d{1,2})?$/.test(String(form.shipping_fee))) errors.shipping_fee = 'Use at most 2 decimals.';
  ['length_cm', 'width_cm', 'height_cm'].forEach(key => {
    if (form[key] === '') return;
    const value = Number(form[key]);
    if (Number.isNaN(value) || value <= 0 || value > MAX_DIMENSION_CM) errors[key] = `0–${MAX_DIMENSION_CM} cm`;
  });
  if (form.inclusions.some(item => !item.label.trim())) errors.inclusions = 'Every inclusion needs a name.';
  else if (form.inclusions.some(item => item.amount !== '' && (Number.isNaN(Number(item.amount)) || Number(item.amount) < 0))) {
    errors.inclusions = 'Inclusion amounts must be 0 or more.';
  }
  return errors;
}

const payloadFrom = (form, isAdmin) => ({
  item_price: form.item_price, shipping_fee: form.shipping_fee === '' ? '0' : form.shipping_fee,
  shape: form.shape, quote_notes: form.quote_notes,
  length_cm: form.length_cm === '' ? null : form.length_cm,
  width_cm: form.width_cm === '' ? null : form.width_cm,
  height_cm: form.height_cm === '' ? null : form.height_cm,
  inclusions: form.inclusions.map(item => ({ label: item.label.trim(), amount: item.amount === '' ? null : item.amount })),
  ...(isAdmin ? { admin_notes: form.admin_notes } : {}),
});

/**
 * The quote figures: price, shipping, size and what is included. Used by the
 * super admin and by the assigned seller. `onSave(payload)` returns the saved request.
 */
export default function QuoteDetailsForm({ request, editable, isAdmin, onSave, budgetMax }) {
  // Once paid, the figure that matters is what was actually paid (quote plus paid extras).
  const paidTotal = request.final_amount ? Number(request.final_amount) : null;
  const [form, setForm] = useState(() => toForm(request));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (key) => (event) => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const setInclusion = (index, key, value) => setForm(prev => ({
    ...prev, inclusions: prev.inclusions.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
  }));

  const total = quoteTotal(form.item_price, form.shipping_fee);
  const overBudget = total && budgetMax && total > Number(budgetMax);

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage(null);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await onSave(payloadFrom(form, isAdmin));
      setMessage({ ok: true, text: 'Quote saved.' });
    } catch (err) {
      const data = err.response?.data || {};
      setErrors(Object.fromEntries(Object.entries(data).map(([key, value]) => [key, [].concat(value).join(' ')])));
      setMessage({ ok: false, text: data.error || 'Could not save. Check the highlighted fields.' });
    } finally {
      setSaving(false);
    }
  };

  const locked = !editable;

  return (
    <form onSubmit={handleSave} noValidate className="sv-fieldset" aria-label="Quote details">
      <div className="sv-row sv-row--2">
        <div className="sv-field">
          <label className="sv-label" htmlFor="qd-item">Item price (₹)</label>
          <input id="qd-item" className="sv-input" type="number" inputMode="decimal" min="0" step="0.01" value={form.item_price} onChange={set('item_price')} disabled={locked} aria-invalid={Boolean(errors.item_price)} />
          {errors.item_price && <span className="sv-error" role="alert">{errors.item_price}</span>}
        </div>
        <div className="sv-field">
          <label className="sv-label" htmlFor="qd-ship">Shipping (₹)</label>
          <input id="qd-ship" className="sv-input" type="number" inputMode="decimal" min="0" step="0.01" value={form.shipping_fee} onChange={set('shipping_fee')} disabled={locked} aria-invalid={Boolean(errors.shipping_fee)} />
          {errors.shipping_fee && <span className="sv-error" role="alert">{errors.shipping_fee}</span>}
        </div>
      </div>
      <div className="sv-figures">
        <div className="sv-figure"><span>{paidTotal ? 'Total paid' : 'Customer pays'}</span><strong>{paidTotal || total ? formatINR(paidTotal || total, { decimals: 2 }) : '—'}</strong></div>
        {budgetMax && <div className="sv-figure"><span>Their budget up to</span><strong>{formatINR(budgetMax)}</strong></div>}
      </div>
      {overBudget && <div className="sv-banner sv-banner--error" role="status">This total is above the customer's maximum budget.</div>}
      {request.status === 'awaiting_payment' && editable && (
        <div className="sv-banner sv-banner--ok" role="note">This quote was already sent. If you change the price, the customer is told and gets 3 fresh days to pay.</div>
      )}

      <div className="sv-row sv-row--2">
        <div className="sv-field">
          <label className="sv-label" htmlFor="qd-shape">Shape (if it applies)</label>
          <input id="qd-shape" className="sv-input" maxLength={60} placeholder="e.g. Cube, Bowl, Hexagon" value={form.shape} onChange={set('shape')} disabled={locked} />
        </div>
        <div className="sv-field">
          <span className="sv-label" id="qd-size-label">Size, L × W × H (cm)</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }} role="group" aria-labelledby="qd-size-label">
            {[['length_cm', 'Length'], ['width_cm', 'Width'], ['height_cm', 'Height']].map(([key, label]) => (
              <input key={key} className="sv-input" type="number" inputMode="decimal" min="0" step="0.1" aria-label={label} placeholder={label} value={form[key]} onChange={set(key)} disabled={locked} aria-invalid={Boolean(errors[key])} />
            ))}
          </div>
          {(errors.length_cm || errors.width_cm || errors.height_cm) && <span className="sv-error" role="alert">Sizes must be between 0 and {MAX_DIMENSION_CM} cm.</span>}
        </div>
      </div>

      <div className="sv-field">
        <span className="sv-label">What's included</span>
        {form.inclusions.map((item, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 110px 44px', gap: '0.5rem' }}>
            <input className="sv-input" aria-label={`Inclusion ${index + 1} name`} placeholder="e.g. Glass container" maxLength={120} value={item.label} onChange={(e) => setInclusion(index, 'label', e.target.value)} disabled={locked} />
            <input className="sv-input" type="number" inputMode="decimal" min="0" step="0.01" aria-label={`Inclusion ${index + 1} amount`} placeholder="₹ (optional)" value={item.amount} onChange={(e) => setInclusion(index, 'amount', e.target.value)} disabled={locked} />
            <button type="button" className="wa-icon-btn" style={{ width: 44, height: 46 }} aria-label={`Remove inclusion ${index + 1}`} onClick={() => setForm(prev => ({ ...prev, inclusions: prev.inclusions.filter((_, i) => i !== index) }))} disabled={locked}><Trash2 size={15} /></button>
          </div>
        ))}
        {errors.inclusions && <span className="sv-error" role="alert">{errors.inclusions}</span>}
        {!locked && form.inclusions.length < MAX_INCLUSIONS && (
          <button type="button" className="wa-btn wa-btn--ghost wa-btn--sm" style={{ alignSelf: 'flex-start', minHeight: 44 }} onClick={() => setForm(prev => ({ ...prev, inclusions: [...prev.inclusions, { label: '', amount: '' }] }))}><Plus size={14} /> Add inclusion</button>
        )}
      </div>

      <div className="sv-field">
        <label className="sv-label" htmlFor="qd-notes">Note for the customer</label>
        <textarea id="qd-notes" className="sv-textarea" maxLength={2000} value={form.quote_notes} onChange={set('quote_notes')} disabled={locked} />
      </div>
      {isAdmin && (
        <div className="sv-field">
          <label className="sv-label" htmlFor="qd-admin-notes">Private notes (never shown to customer or seller)</label>
          <textarea id="qd-admin-notes" className="sv-textarea" maxLength={2000} value={form.admin_notes} onChange={set('admin_notes')} disabled={locked} />
        </div>
      )}

      {message && <div className={`sv-banner ${message.ok ? 'sv-banner--ok' : 'sv-banner--error'}`} role="status">{message.text}</div>}
      {editable ? (
        <button type="submit" className="wa-btn wa-btn--primary" style={{ minHeight: 48 }} disabled={saving}>{saving ? 'Saving…' : 'Save quote'}</button>
      ) : (
        <p className="sv-help" style={{ margin: 0 }}>The quote is locked because the pay request has been sent.</p>
      )}
    </form>
  );
}
