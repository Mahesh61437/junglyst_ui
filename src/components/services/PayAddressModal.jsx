import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, MapPin, Plus } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRegion } from '../../context/RegionContext';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { launchGatewayPayment } from '../../utils/paymentGateway';
import { formatINR } from '../../utils/workshops';
import { normalisePhone, validateName, validatePincode } from '../../utils/serviceQuotes';
import DeliveryAreaNote from './DeliveryAreaNote';

const PINCODE_LENGTH = 6;
const MAX_SAVED_ADDRESSES = 5; // the address book's own limit
const NEW_ADDRESS = 'new';

function Field({ id, label, error, children }) {
  return (
    <div className="sv-field">
      <label className="sv-label" htmlFor={id}>{label}<span className="sv-req" aria-hidden="true"> *</span></label>
      {children}
      {error && <span className="sv-error" id={`${id}-error`} role="alert">{error}</span>}
    </div>
  );
}

// Saved addresses store the state as free text ("Karnataka", "KA"); map it to our state code.
function stateCodeFor(states, value) {
  const needle = String(value || '').trim().toLowerCase();
  return states.find(s => s.code.toLowerCase() === needle || s.name.toLowerCase() === needle)?.code || '';
}

const formFromSaved = (address, states) => ({
  full_name: address.full_name || '', phone: address.phone || '', address_line1: address.address_line1 || '',
  address_line2: address.address_line2 || '', city: address.city || '', state: stateCodeFor(states, address.state),
  pincode: String(address.pincode || ''),
});

// Delivery address + payment for an accepted quote. Saved addresses are offered
// first; the amount is never sent, the server charges the quote the admin finalised.
export default function PayAddressModal({ quote, onClose, onPaid }) {
  const { user } = useAuth();
  const { states: allStates, stateCode: regionStateCode } = useRegion();
  // Only the states this service delivers to (empty list = all of India).
  const deliveryStates = quote.delivery_states;
  const states = useMemo(
    () => (deliveryStates?.length ? allStates.filter(s => deliveryStates.includes(s.code)) : allStates),
    [allStates, deliveryStates],
  );
  const stateCode = states.some(s => s.code === regionStateCode) ? regionStateCode : '';
  const deliversTo = useCallback(
    (address) => !deliveryStates?.length || deliveryStates.includes(stateCodeFor(allStates, address.state)),
    [allStates, deliveryStates],
  );
  const blankForm = useMemo(() => ({
    full_name: user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' '),
    phone: user?.phone || '', address_line1: '', address_line2: '', city: '', state: stateCode || '', pincode: '',
  }), [user, stateCode]);

  const [savedAddresses, setSavedAddresses] = useState(null); // null while loading
  const [selected, setSelected] = useState(NEW_ADDRESS);
  const [form, setForm] = useState(blankForm);
  const [saveAddress, setSaveAddress] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pincodeCheck, setPincodeCheck] = useState({ pincode: '', note: null });
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // Load the address book and pre-select the default address.
  useEffect(() => {
    const controller = new AbortController();
    api.get('/shipping/addresses/', { signal: controller.signal })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setSavedAddresses(list);
        const usable = list.filter(deliversTo);
        const preferred = usable.find(a => a.is_default) || usable[0];
        if (preferred) {
          setSelected(String(preferred.id));
          setForm(formFromSaved(preferred, allStates));
          setShowForm(false);
        }
      })
      .catch(err => { if (err.name !== 'CanceledError') setSavedAddresses([]); });
    return () => controller.abort();
  }, [allStates, deliversTo]);

  // Live deliverability hint; the server re-checks everything on submit.
  useEffect(() => {
    if (form.pincode.length !== PINCODE_LENGTH || validatePincode(form.pincode)) return undefined;
    const controller = new AbortController();
    api.get(`/shipping/pincode-check/?pincode=${form.pincode}`, { signal: controller.signal })
      .then(res => setPincodeCheck({ pincode: form.pincode, note: res.data.deliverable ? null : (res.data.message || "We can't deliver to this pincode yet.") }))
      .catch(() => {});
    return () => controller.abort();
  }, [form.pincode]);
  const pincodeNote = pincodeCheck.pincode === form.pincode ? pincodeCheck.note : null;

  const set = (key) => (event) => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const chooseAddress = (value) => {
    setSelected(value);
    setErrors({});
    setBanner(null);
    if (value === NEW_ADDRESS) {
      setForm(blankForm);
      setShowForm(true);
      return;
    }
    const address = savedAddresses.find(a => String(a.id) === value);
    setForm(formFromSaved(address, allStates));
    setShowForm(false);
  };

  const validate = () => {
    const next = {};
    const nameError = validateName(form.full_name);
    if (nameError) next.full_name = nameError;
    if (!normalisePhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number.';
    if (form.address_line1.trim().length < 5) next.address_line1 = 'Enter your house / street address.';
    if (form.city.trim().length < 2) next.city = 'Enter your city.';
    if (!form.state) next.state = 'Select your state.';
    const pincodeError = validatePincode(form.pincode);
    if (pincodeError) next.pincode = pincodeError;
    else if (pincodeNote) next.pincode = pincodeNote;
    return next;
  };

  const showErrors = (errorMap) => {
    setErrors(errorMap);
    if (!Object.keys(errorMap).length) return;
    setShowForm(true); // a saved address can be out of date; let the customer fix it here
    setTimeout(() => dialogRef.current?.querySelector(`#pay-${Object.keys(errorMap)[0]}`)?.focus(), 0);
  };

  const rememberAddress = (address) => {
    const stateName = states.find(s => s.code === address.state)?.name || address.state;
    api.post('/shipping/addresses/', { ...address, state: stateName, email: user?.email, is_default: !savedAddresses?.length })
      .catch(() => {}); // saving is a convenience; never block the payment on it
  };

  const handlePay = async (event) => {
    event.preventDefault();
    setBanner(null);
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    const address = {
      ...form, full_name: form.full_name.trim(), address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim(), city: form.city.trim(),
    };
    try {
      const response = await ServiceQuoteService.my.pay(quote.reference, address);
      if (selected === NEW_ADDRESS && saveAddress && (savedAddresses?.length || 0) < MAX_SAVED_ADDRESSES) rememberAddress(address);
      const result = await launchGatewayPayment(response, {
        description: `Custom order ${quote.reference}`,
        prefill: { name: address.full_name, email: user?.email, contact: address.phone },
        onVerifying: () => setVerifying(true),
      });
      setVerifying(false);
      if (result.status === 'success') {
        onPaid();
        return;
      }
      setBanner(result.message);
    } catch (err) {
      setVerifying(false);
      const fieldErrors = {};
      Object.entries(err.response?.data || {}).forEach(([key, value]) => {
        if (key in form) fieldErrors[key] = [].concat(value).join(' ');
      });
      showErrors(fieldErrors);
      setBanner(Object.keys(fieldErrors).length ? 'Please fix the highlighted fields.' : (err.response?.data?.error || err.userMessage || err.message));
    } finally {
      setBusy(false);
    }
  };

  const total = quote.quote?.total_amount;
  const canSaveMore = (savedAddresses?.length || 0) < MAX_SAVED_ADDRESSES;

  return (
    <div className="sv-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="sv-modal" role="dialog" aria-modal="true" aria-labelledby="pay-title" tabIndex={-1} ref={dialogRef} onSubmit={handlePay} noValidate>
        <div className="sv-modal-head">
          <h2 id="pay-title">Delivery address &amp; payment</h2>
          <button type="button" className="sv-close" aria-label="Close" onClick={onClose} disabled={busy}>×</button>
        </div>
        <p className="sv-form-sub" style={{ margin: 0 }}>{quote.offering_name} · {quote.reference}</p>

        <DeliveryAreaNote stateNames={quote.delivery_state_names} />

        {banner && <div className="sv-banner sv-banner--error" role="alert"><AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />{banner}</div>}

        {savedAddresses === null ? (
          <div className="sv-skeleton" style={{ height: 120 }} aria-busy="true" aria-label="Loading saved addresses" />
        ) : savedAddresses.length > 0 && (
          <fieldset className="sv-fieldset">
            <legend>Deliver to</legend>
            <div className="sv-address-list" role="radiogroup">
              {savedAddresses.map(address => {
                const usable = deliversTo(address);
                return (
                <label key={address.id} className={`sv-address${usable ? '' : ' sv-address--disabled'}`}>
                  <input type="radio" name="pay-address" value={String(address.id)} checked={selected === String(address.id)} disabled={!usable} onChange={() => chooseAddress(String(address.id))} />
                  <span>
                    <strong>{address.full_name}</strong>{address.is_default && <span className="sv-pill" style={{ background: '#dcfce7', color: '#166534', marginLeft: 6 }}>Default</span>}
                    <span className="sv-address-lines">{[address.address_line1, address.address_line2, address.city, address.state].filter(Boolean).join(', ')} – {address.pincode}</span>
                    <span className="sv-address-lines">{address.phone}</span>
                    {!usable && <span className="sv-address-lines" style={{ color: '#b45309', fontWeight: 700 }}>Outside our delivery area</span>}
                  </span>
                </label>
                );
              })}
              <label className="sv-address">
                <input type="radio" name="pay-address" value={NEW_ADDRESS} checked={selected === NEW_ADDRESS} onChange={() => chooseAddress(NEW_ADDRESS)} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={15} aria-hidden="true" /> Use a new address</span>
              </label>
            </div>
            {!showForm && (
              <button type="button" className="sv-link-btn" onClick={() => setShowForm(true)}>
                <MapPin size={14} aria-hidden="true" /> Edit this address for this order
              </button>
            )}
          </fieldset>
        )}

        {showForm && (
          <>
            <Field id="pay-full_name" label="Full name" error={errors.full_name}>
              <input id="pay-full_name" className="sv-input" autoComplete="name" value={form.full_name} onChange={set('full_name')} aria-invalid={Boolean(errors.full_name)} />
            </Field>
            <Field id="pay-phone" label="Mobile number" error={errors.phone}>
              <input id="pay-phone" className="sv-input" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} aria-invalid={Boolean(errors.phone)} />
            </Field>
            <Field id="pay-address_line1" label="House / street" error={errors.address_line1}>
              <input id="pay-address_line1" className="sv-input" autoComplete="address-line1" value={form.address_line1} onChange={set('address_line1')} aria-invalid={Boolean(errors.address_line1)} maxLength={200} />
            </Field>
            <div className="sv-field">
              <label className="sv-label" htmlFor="pay-address_line2">Area / landmark (optional)</label>
              <input id="pay-address_line2" className="sv-input" autoComplete="address-line2" value={form.address_line2} onChange={set('address_line2')} maxLength={200} />
            </div>
            <div className="sv-row sv-row--2">
              <Field id="pay-city" label="City" error={errors.city}>
                <input id="pay-city" className="sv-input" autoComplete="address-level2" value={form.city} onChange={set('city')} aria-invalid={Boolean(errors.city)} maxLength={80} />
              </Field>
              <Field id="pay-pincode" label="Pincode" error={errors.pincode || pincodeNote}>
                <input id="pay-pincode" className="sv-input" inputMode="numeric" autoComplete="postal-code" maxLength={PINCODE_LENGTH} value={form.pincode} onChange={(event) => setForm(prev => ({ ...prev, pincode: event.target.value.replace(/\D/g, '') }))} aria-invalid={Boolean(errors.pincode || pincodeNote)} />
              </Field>
            </div>
            <Field id="pay-state" label="State" error={errors.state}>
              <select id="pay-state" className="sv-select" autoComplete="address-level1" value={form.state} onChange={set('state')} aria-invalid={Boolean(errors.state)}>
                <option value="">Select state…</option>
                {states.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </Field>
            {selected === NEW_ADDRESS && canSaveMore && (
              <label className="sv-check" style={{ justifySelf: 'start' }}>
                <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} /> Save this address for next time
              </label>
            )}
          </>
        )}

        <button className="sv-submit" type="submit" disabled={busy || savedAddresses === null}>
          {verifying ? 'Confirming payment…' : busy ? 'Please wait…' : `Pay ${formatINR(total, { decimals: 2 })}`}
        </button>
        <p className="sv-help" style={{ textAlign: 'center', margin: 0 }}>Secure payment. The amount is the quote our team finalised for you.</p>
      </form>
    </div>
  );
}
