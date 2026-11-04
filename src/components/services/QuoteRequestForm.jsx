import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRegion } from '../../context/RegionContext';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { formatINR } from '../../utils/workshops';
import DeliveryAreaNote from './DeliveryAreaNote';
import ReferencePhotos from './ReferencePhotos';
import {
  SUPPORT_PHONE, budgetPresets, compactAnswers, normalisePhone, validateAnswers, validateBudget, validateEmail,
  validateName,
} from '../../utils/serviceQuotes';

const FIELD_ID_PREFIX = 'sv-q-';
const MAX_CHIP_CHOICES = 8; // longer choice lists fall back to a dropdown
const STEPS = [
  { title: 'Your design', hint: 'Tell us what you have in mind' },
  { title: 'Budget & location', hint: 'So we can suggest what fits' },
  { title: 'Your details', hint: 'Where we send your quote' },
];
const CONTACT_KEYS = ['contact_name', 'contact_phone', 'contact_email'];
const BUDGET_KEYS = ['budget_min', 'budget_max', 'state'];

function FieldShell({ id, label, required, help, error, children, as = 'div' }) {
  const Wrapper = as;
  return (
    <Wrapper className="sv-field">
      <label className="sv-label" htmlFor={id}>{label}{required && <span className="sv-req" aria-hidden="true"> *</span>}</label>
      {children}
      {help && !error && <span className="sv-help" id={`${id}-help`}>{help}</span>}
      {error && <span className="sv-error" id={`${id}-error`} role="alert">{error}</span>}
    </Wrapper>
  );
}

function describedBy(id, help, error) {
  if (error) return `${id}-error`;
  return help ? `${id}-help` : undefined;
}

// Short choice lists render as tappable chips; long ones as a dropdown.
function ChoiceChips({ field, value, onChange, multiple, error }) {
  const id = `${FIELD_ID_PREFIX}${field.key}`;
  const selected = multiple ? (value || []) : value;
  const toggle = (choice) => {
    if (!multiple) return onChange(choice);
    return onChange(selected.includes(choice) ? selected.filter(item => item !== choice) : [...selected, choice]);
  };
  return (
    <fieldset className="sv-fieldset sv-choice-set" aria-describedby={describedBy(id, field.help_text, error)}>
      <legend className="sv-label sv-choice-legend">
        {field.label}{field.required && <span className="sv-req" aria-hidden="true"> *</span>}
        {multiple && <span className="sv-choice-hint">Pick any</span>}
      </legend>
      <div className="sv-choices" id={id} tabIndex={-1}>
        {field.choices.map(choice => {
          const checked = multiple ? selected.includes(choice) : selected === choice;
          return (
            <label key={choice} className={`sv-choice${checked ? ' sv-choice--on' : ''}`}>
              <input type={multiple ? 'checkbox' : 'radio'} name={id} checked={checked} onChange={() => toggle(choice)} />
              <span className="sv-choice-tick" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
              {choice}
            </label>
          );
        })}
      </div>
      {field.help_text && !error && <span className="sv-help" id={`${id}-help`}>{field.help_text}</span>}
      {error && <span className="sv-error" id={`${id}-error`} role="alert">{error}</span>}
    </fieldset>
  );
}

// One admin-defined question. The offering's field list drives what renders.
function DynamicField({ field, value, error, onChange }) {
  const id = `${FIELD_ID_PREFIX}${field.key}`;
  const isChoice = field.field_type === 'select' || field.field_type === 'multiselect';
  if (isChoice && field.choices.length <= MAX_CHIP_CHOICES) {
    return <ChoiceChips field={field} value={value} onChange={onChange} multiple={field.field_type === 'multiselect'} error={error} />;
  }
  const common = { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy(id, field.help_text, error), 'aria-required': field.required };

  let control;
  if (field.field_type === 'textarea') {
    control = <textarea className="sv-textarea" {...common} maxLength={field.max_length || 2000} value={value || ''} onChange={e => onChange(e.target.value)} />;
  } else if (field.field_type === 'number') {
    control = <input className="sv-input" {...common} type="number" inputMode="decimal" min={field.min_value ?? undefined} max={field.max_value ?? undefined} value={value ?? ''} onChange={e => onChange(e.target.value)} />;
  } else if (field.field_type === 'date') {
    control = <input className="sv-input" {...common} type="date" min={new Date().toISOString().slice(0, 10)} value={value || ''} onChange={e => onChange(e.target.value)} />;
  } else if (field.field_type === 'select') {
    control = (
      <select className="sv-select" {...common} value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">Select…</option>
        {field.choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
      </select>
    );
  } else if (field.field_type === 'multiselect') {
    const selected = value || [];
    control = (
      <select className="sv-select" {...common} multiple value={selected} onChange={e => onChange([...e.target.selectedOptions].map(o => o.value))} style={{ minHeight: 120 }}>
        {field.choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
      </select>
    );
  } else {
    control = <input className="sv-input" {...common} type="text" maxLength={field.max_length || 200} value={value || ''} onChange={e => onChange(e.target.value)} />;
  }

  return <FieldShell id={id} label={field.label} required={field.required} help={field.help_text} error={error}>{control}</FieldShell>;
}

function Progress({ step }) {
  return (
    <ol className="sv-steps" aria-label="Progress">
      {STEPS.map((item, index) => {
        const state = index < step ? 'done' : index === step ? 'current' : 'todo';
        return (
          <li key={item.title} className={`sv-step sv-step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="sv-step-dot" aria-hidden="true">{state === 'done' ? <Check size={14} strokeWidth={3} /> : index + 1}</span>
            <span className="sv-step-label">{item.title}</span>
          </li>
        );
      })}
    </ol>
  );
}

const formatAnswer = (value) => (Array.isArray(value) ? value.join(', ') : String(value));

/**
 * Quote request form for one offering. Customers get a three-step flow (design,
 * budget & location, contact) with a review before sending; staff recording a
 * phone call (`staffMode`) see every section on one page. Contact details, state
 * and budget are always asked; the rest comes from the admin-built questions.
 */
export default function QuoteRequestForm({ offering, onSubmit, onSubmitted, submitLabel = 'Send my request', staffMode = false }) {
  const { user } = useAuth();
  const { states, stateCode } = useRegion();
  const stateOptions = useMemo(
    () => (offering.delivery_states?.length ? states.filter(s => offering.delivery_states.includes(s.code)) : states),
    [states, offering.delivery_states],
  );
  const presets = useMemo(() => budgetPresets(offering.suggested_min_budget), [offering.suggested_min_budget]);
  // Staff record someone else's request, so nothing is pre-filled from the signed-in admin.
  const prefillUser = staffMode ? null : user;
  const fullName = prefillUser ? (prefillUser.full_name || [prefillUser.first_name, prefillUser.last_name].filter(Boolean).join(' ')) : '';
  const defaultState = !staffMode && stateOptions.some(s => s.code === stateCode) ? stateCode : '';

  const [form, setForm] = useState({
    contact_name: fullName, contact_phone: prefillUser?.phone || '', contact_email: prefillUser?.email || '',
    state: defaultState, budget_min: '', budget_max: '', customer_notes: '', website: '',
  });
  const [answers, setAnswers] = useState({});
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [step, setStep] = useState(0);
  const formRef = useRef(null);

  const setField = (key) => (event) => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const setAnswer = (key) => (value) => setAnswers(prev => ({ ...prev, [key]: value }));
  const pickPreset = (preset) => setForm(prev => ({ ...prev, budget_min: String(preset.min), budget_max: String(preset.max) }));

  const stepOf = (key) => {
    if (CONTACT_KEYS.includes(key)) return 2;
    if (BUDGET_KEYS.includes(key)) return 1;
    return 0;
  };

  const validate = () => {
    const next = {};
    const answerErrors = validateAnswers(offering.form_fields, answers);
    Object.entries(answerErrors).forEach(([key, message]) => { next[`${FIELD_ID_PREFIX}${key}`] = message; });
    const budgetError = validateBudget(form.budget_min, form.budget_max);
    if (budgetError) next.budget_max = budgetError;
    if (!form.state) next.state = 'Select your state.';
    const nameError = validateName(form.contact_name);
    if (nameError) next.contact_name = nameError;
    if (!normalisePhone(form.contact_phone)) next.contact_phone = 'Enter a valid 10-digit mobile number.';
    const emailError = validateEmail(form.contact_email);
    if (emailError) next.contact_email = emailError;
    return next;
  };

  const focusFirstError = (errorMap) => {
    const firstId = Object.keys(errorMap)[0];
    if (!firstId) return;
    const selector = `#${CSS.escape(firstId.startsWith(FIELD_ID_PREFIX) ? firstId : `sv-${firstId}`)}`;
    // Wait a tick so the step holding the field has rendered.
    setTimeout(() => {
      const target = formRef.current?.querySelector(selector);
      target?.focus();
      target?.scrollIntoView?.({ block: 'center' });
    }, 0);
  };

  const showErrors = (errorMap) => {
    setErrors(errorMap);
    const keys = Object.keys(errorMap);
    if (!keys.length) return;
    if (!staffMode) setStep(Math.min(...keys.map(stepOf)));
    focusFirstError(errorMap);
  };

  const goNext = () => {
    setBanner(null);
    const stepErrors = Object.fromEntries(Object.entries(validate()).filter(([key]) => stepOf(key) === step));
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      focusFirstError(stepErrors);
      return;
    }
    setStep(current => current + 1);
    formRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!staffMode && step < STEPS.length - 1) {
      goNext();
      return;
    }
    setBanner(null);
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        contact_name: form.contact_name.trim(), contact_phone: form.contact_phone.trim(),
        contact_email: form.contact_email.trim(), state: form.state,
        budget_min: form.budget_min, budget_max: form.budget_max,
        answers: compactAnswers(answers), customer_notes: form.customer_notes.trim(), website: form.website,
        reference_images: photos,
      };
      const result = await (onSubmit ? onSubmit(payload) : ServiceQuoteService.requestQuote(offering.slug, payload));
      setDone(result);
      onSubmitted?.(result);
    } catch (err) {
      const data = err.response?.data || {};
      const serverErrors = {};
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'answers' && value && typeof value === 'object') {
          Object.entries(value).forEach(([answerKey, message]) => { serverErrors[`${FIELD_ID_PREFIX}${answerKey}`] = String(message); });
        } else if ([...CONTACT_KEYS, ...BUDGET_KEYS].includes(key)) {
          serverErrors[key] = [].concat(value).join(' ');
        }
      });
      showErrors(serverErrors);
      setBanner(err.response?.status === 429
        ? 'You have sent several requests recently. Please wait a little or call us.'
        : (Object.keys(serverErrors).length ? 'Please fix the highlighted fields.' : (err.userMessage || 'Could not send your request. Please try again.')));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    if (staffMode) {
      return (
        <div className="sv-form">
          <div className="sv-success" role="status">
            <CheckCircle2 size={44} color="#16a34a" />
            <h2>Saved to the queue</h2>
            <span className="sv-ref">{done.reference}</span>
            <p style={{ color: '#475569', margin: 0 }}>The customer has been emailed this reference.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="sv-form sv-done" role="status">
        <span className="sv-done-icon"><CheckCircle2 size={34} /></span>
        <h2>Your request is in!</h2>
        <p className="sv-form-sub" style={{ margin: 0 }}>Keep this reference handy. We have also emailed it to {form.contact_email}.</p>
        <span className="sv-ref">{done.reference}</span>
        <ol className="sv-next">
          <li className="sv-next--done"><strong>Request received</strong><span>Our team and a grower look at your idea.</span></li>
          <li><strong>Your quote arrives</strong><span>Price, size and what is included, by email{user ? ' and in My Orders' : ''}.</span></li>
          <li><strong>Pay when you are happy</strong><span>We build it and deliver it ready to display.</span></li>
        </ol>
        <div className="sv-done-actions">
          {user ? <Link to="/orders" className="svh-btn svh-btn--dark">Track in My Orders</Link> : <Link to="/login" className="svh-btn svh-btn--dark">Sign in to track it</Link>}
          <Link to="/services" className="svh-btn svh-btn--outline">Browse more services</Link>
        </div>
        <a className="sv-help" href={`tel:${SUPPORT_PHONE.tel}`} style={{ color: '#105c44', fontWeight: 700 }}>Questions? Call {SUPPORT_PHONE.display}</a>
      </div>
    );
  }

  const showStep = (index) => staffMode || step === index;
  const isLastStep = staffMode || step === STEPS.length - 1;
  const budgetHint = offering.suggested_min_budget
    ? `Usually starts around ${formatINR(offering.suggested_min_budget)}. A lower budget is fine, we will tell you what is possible.`
    : 'A rough range is enough. We will tell you what is possible.';
  const answered = offering.form_fields.filter(field => answers[field.key] !== undefined && answers[field.key] !== '' && !(Array.isArray(answers[field.key]) && !answers[field.key].length));
  const stateName = stateOptions.find(s => s.code === form.state)?.name;

  return (
    <form className="sv-form sv-form--wizard" ref={formRef} onSubmit={handleSubmit} noValidate aria-label={`Quote request for ${offering.name}`}>
      {staffMode ? (
        <>
          <h2>Caller&apos;s request</h2>
          <p className="sv-form-sub">Enter the customer&apos;s details and answers. Their email gets the confirmation.</p>
        </>
      ) : (
        <>
          <Progress step={step} />
          <div>
            <h2>{STEPS[step].title}</h2>
            <p className="sv-form-sub" style={{ marginTop: '0.2rem' }}>Step {step + 1} of {STEPS.length} · {STEPS[step].hint}</p>
          </div>
        </>
      )}

      {banner && <div className="sv-banner sv-banner--error" role="alert"><AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />{banner}</div>}

      {showStep(0) && (
        <div className="sv-step-body">
          {offering.form_fields.map(field => (
            <DynamicField key={field.key} field={field} value={answers[field.key]} error={errors[`${FIELD_ID_PREFIX}${field.key}`]} onChange={setAnswer(field.key)} />
          ))}
          <FieldShell id="sv-customer_notes" label={offering.form_fields.length ? 'Anything else we should know?' : 'Describe what you would like'} help="Colours, plants you love, where it will sit, a photo idea…">
            <textarea id="sv-customer_notes" className="sv-textarea" maxLength={2000} value={form.customer_notes} onChange={setField('customer_notes')} aria-describedby="sv-customer_notes-help" />
          </FieldShell>
          <ReferencePhotos value={photos} onChange={setPhotos} />
        </div>
      )}

      {showStep(1) && (
        <div className="sv-step-body">
          <fieldset className="sv-fieldset">
            <legend className="sv-label sv-choice-legend">Your budget<span className="sv-req" aria-hidden="true"> *</span></legend>
            <div className="sv-choices sv-choices--budget">
              {presets.map(preset => {
                const on = form.budget_min === String(preset.min) && form.budget_max === String(preset.max);
                return (
                  <button key={preset.min} type="button" className={`sv-choice sv-choice--budget${on ? ' sv-choice--on' : ''}`} aria-pressed={on} onClick={() => pickPreset(preset)}>
                    {formatINR(preset.min)} – {formatINR(preset.max)}
                  </button>
                );
              })}
            </div>
            <div className="sv-row sv-row--2">
              <FieldShell id="sv-budget_min" label="From (₹)" error={errors.budget_min}>
                <input id="sv-budget_min" className="sv-input" type="number" inputMode="numeric" min="1" step="1" placeholder="Or type your own" value={form.budget_min} onChange={setField('budget_min')} aria-invalid={Boolean(errors.budget_min)} />
              </FieldShell>
              <FieldShell id="sv-budget_max" label="To (₹)" error={errors.budget_max}>
                <input id="sv-budget_max" className="sv-input" type="number" inputMode="numeric" min="1" step="1" value={form.budget_max} onChange={setField('budget_max')} aria-invalid={Boolean(errors.budget_max)} aria-describedby={describedBy('sv-budget_max', null, errors.budget_max)} />
              </FieldShell>
            </div>
            <span className="sv-help">{budgetHint}</span>
          </fieldset>
          <DeliveryAreaNote stateNames={offering.delivery_state_names} />
          <FieldShell id="sv-state" label="Your state" required error={errors.state} help={offering.delivery_state_names?.length ? 'Only states we deliver to are listed.' : null}>
            <select id="sv-state" className="sv-select" autoComplete="address-level1" value={form.state} onChange={setField('state')} aria-invalid={Boolean(errors.state)} aria-describedby={describedBy('sv-state', offering.delivery_state_names?.length, errors.state)}>
              <option value="">Select state…</option>
              {stateOptions.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </FieldShell>
        </div>
      )}

      {showStep(2) && (
        <div className="sv-step-body">
          <div className="sv-row sv-row--2">
            <FieldShell id="sv-contact_name" label="Full name" required error={errors.contact_name}>
              <input id="sv-contact_name" className="sv-input" autoComplete="name" value={form.contact_name} onChange={setField('contact_name')} aria-invalid={Boolean(errors.contact_name)} aria-describedby={describedBy('sv-contact_name', null, errors.contact_name)} maxLength={120} />
            </FieldShell>
            <FieldShell id="sv-contact_phone" label="Mobile number" required error={errors.contact_phone}>
              <input id="sv-contact_phone" className="sv-input" type="tel" inputMode="tel" autoComplete="tel" value={form.contact_phone} onChange={setField('contact_phone')} aria-invalid={Boolean(errors.contact_phone)} aria-describedby={describedBy('sv-contact_phone', null, errors.contact_phone)} placeholder="98765 43210" />
            </FieldShell>
          </div>
          <FieldShell id="sv-contact_email" label="Email" required error={errors.contact_email} help={staffMode ? null : 'Your quote is sent here.'}>
            <input id="sv-contact_email" className="sv-input" type="email" inputMode="email" autoComplete="email" value={form.contact_email} onChange={setField('contact_email')} aria-invalid={Boolean(errors.contact_email)} aria-describedby={describedBy('sv-contact_email', staffMode ? null : 'help', errors.contact_email)} />
          </FieldShell>

          {!staffMode && (
            <div className="sv-review" aria-label="Your request">
              <div className="sv-review-head"><strong>Your request</strong><button type="button" className="sv-link-btn" onClick={() => setStep(0)}>Edit</button></div>
              <dl className="sv-kv">
                <dt>Service</dt><dd>{offering.name}</dd>
                {answered.map(field => (<span key={field.key} style={{ display: 'contents' }}><dt>{field.label}</dt><dd>{formatAnswer(answers[field.key])}</dd></span>))}
                <dt>Budget</dt><dd>{formatINR(form.budget_min)} – {formatINR(form.budget_max)}</dd>
                {stateName && (<><dt>State</dt><dd>{stateName}</dd></>)}
                {form.customer_notes.trim() && (<><dt>Notes</dt><dd style={{ whiteSpace: 'pre-line' }}>{form.customer_notes.trim()}</dd></>)}
                {photos.length > 0 && (<><dt>Photos</dt><dd>{photos.length} attached</dd></>)}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div className="sv-honey" aria-hidden="true">
        <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={setField('website')} /></label>
      </div>

      <div className="sv-wizard-nav">
        {!staffMode && step > 0 && (
          <button type="button" className="svh-btn svh-btn--outline" onClick={() => { setErrors({}); setStep(current => current - 1); }}>
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>
        )}
        <button className="sv-submit" type="submit" disabled={submitting}>
          {isLastStep
            ? (submitting ? 'Sending…' : (staffMode ? submitLabel : <>{submitLabel} <ArrowRight size={16} aria-hidden="true" /></>))
            : <>Continue <ArrowRight size={16} aria-hidden="true" /></>}
        </button>
      </div>
      {!staffMode && (
        <p className="sv-assure"><ShieldCheck size={15} aria-hidden="true" /> Free and no obligation. You only pay if you accept the quote.</p>
      )}
      {!staffMode && (
        <a className="sv-help sv-call-link" href={`tel:${SUPPORT_PHONE.tel}`}>
          <Phone size={14} aria-hidden="true" /> Prefer to talk? Call {SUPPORT_PHONE.display}
        </a>
      )}
    </form>
  );
}
