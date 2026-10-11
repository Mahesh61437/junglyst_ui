import { cloneElement, useEffect, useId, useMemo, useState } from 'react';
import {
  X, Plus, Trash2, Copy, ImagePlus, ArrowLeft, ArrowRight, CheckCircle2, CalendarDays,
  MapPin, ListChecks, Image as ImageIcon, IndianRupee, Settings2, Loader2, AlertCircle, Users, Scale,
} from 'lucide-react';
import { WorkshopService } from '../../services/WorkshopService';
import {
  SKILL_LEVELS, WORKSHOP_CATEGORIES, evenShares, formatINR, fromLocalInput, linesToList, listToLines,
  sharesTotal, splitAcrossCohosts, termsSignature, toLocalInput,
} from '../../utils/workshops';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 12;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const DEFAULT_COMMISSION = '20';
const emptyOrganiser = (share = '100') => ({ key: crypto.randomUUID(), seller: '', share_percent: share, commission_percent: DEFAULT_COMMISSION });
const timingOf = (session) => `${session.date}|${session.start_time?.slice(0, 5)}|${session.end_time?.slice(0, 5)}`;

const emptyOption = () => ({ key: crypto.randomUUID(), name: '', shape: '', size: '', price: '', is_active: true });
const emptySession = (copyFrom) => ({
  key: crypto.randomUUID(),
  date: copyFrom?.date || '',
  start_time: copyFrom?.start_time?.slice(0, 5) || '10:00',
  end_time: copyFrom?.end_time?.slice(0, 5) || '12:00',
  capacity: copyFrom?.capacity || 12,
  note: '',
  is_active: true,
});

function formFromWorkshop(w) {
  if (!w) {
    return {
      title: '', tagline: '', category: 'terrarium', status: 'draft', is_featured: false,
      organisers: [emptyOrganiser()],
      description: '', highlightsText: '', whatToBringText: '', images: [],
      registration_opens_at: '', registration_closes_at: '',
      venue_name: '', address: '', city: '', map_url: '',
      duration_minutes: 120, skill_level: 'all_levels', min_age: '', max_seats_per_booking: 6,
      cancellation_policy: 'Full refund if cancelled 48 hours before the session. No refunds after that, but you may transfer your seat to a friend.',
      options: [emptyOption()],
      sessions: [emptySession()],
    };
  }
  return {
    ...w,
    organisers: (w.organisers || []).map(o => ({
      key: crypto.randomUUID(), seller: String(o.seller),
      share_percent: String(Number(o.share_percent)), commission_percent: String(Number(o.commission_percent)),
    })),
    highlightsText: listToLines(w.highlights),
    whatToBringText: listToLines(w.what_to_bring),
    registration_opens_at: toLocalInput(w.registration_opens_at),
    registration_closes_at: toLocalInput(w.registration_closes_at),
    min_age: w.min_age ?? '',
    options: (w.options || []).map(o => ({ ...o, key: String(o.id) })),
    sessions: (w.sessions || []).map(s => ({
      ...s, key: String(s.id), start_time: s.start_time?.slice(0, 5), end_time: s.end_time?.slice(0, 5),
    })),
  };
}

function payloadFromForm(form) {
  const strip = ({ key, seats_booked, seats_taken, ...rest }) => rest; // eslint-disable-line no-unused-vars
  return {
    title: form.title.trim(), tagline: form.tagline.trim(), category: form.category,
    organisers: form.organisers.map(({ seller, share_percent, commission_percent }) => ({ seller, share_percent, commission_percent })),
    status: form.status, is_featured: form.is_featured, description: form.description,
    highlights: linesToList(form.highlightsText), what_to_bring: linesToList(form.whatToBringText),
    images: form.images,
    registration_opens_at: fromLocalInput(form.registration_opens_at),
    registration_closes_at: fromLocalInput(form.registration_closes_at),
    venue_name: form.venue_name, address: form.address, city: form.city.trim(), map_url: form.map_url.trim(),
    duration_minutes: Number(form.duration_minutes) || 0, skill_level: form.skill_level,
    min_age: form.min_age === '' ? null : Number(form.min_age),
    max_seats_per_booking: Number(form.max_seats_per_booking) || 1,
    cancellation_policy: form.cancellation_policy,
    // Workshop-level default commission = the lead co-host's rate.
    commission_percent: form.organisers[0]?.commission_percent ?? DEFAULT_COMMISSION,
    options: form.options.map((o, i) => ({ ...strip(o), sort_order: i })),
    session_inputs: form.sessions.map(strip),
  };
}

// DRF errors → flat {field: message}; nested list errors are summarised by row.
function flattenErrors(data) {
  if (!data || typeof data !== 'object') return { _general: 'Could not save the workshop.' };
  const out = {};
  Object.entries(data).forEach(([field, value]) => {
    if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
      value.forEach((row, i) => {
        if (row && Object.keys(row).length) {
          out[field] = `Row ${i + 1}: ${Object.entries(row).map(([k, v]) => `${k} – ${[].concat(v).join(' ')}`).join('; ')}`;
        }
      });
    } else {
      out[field === 'non_field_errors' || field === 'detail' || field === 'error' ? '_general' : field] = [].concat(value).join(' ');
    }
  });
  return out;
}

// Ties the label, help and error text to the single control passed as children.
function Field({ label, error, help, children, className = '' }) {
  const id = useId();
  const noteId = `${id}-note`;
  const control = cloneElement(children, {
    id,
    'aria-describedby': error || help ? noteId : undefined,
    'aria-invalid': error ? true : undefined,
  });
  return (
    <div className={className}>
      <label className="wa-label" htmlFor={id}>{label}</label>
      {control}
      {error ? <div className="wa-error" id={noteId}>{error}</div> : help ? <div className="wa-help" id={noteId}>{help}</div> : null}
    </div>
  );
}

function Section({ icon, title, sub, children }) {
  return (
    <section className="wa-section">
      <h3 className="wa-section-title">{icon}{title}</h3>
      {sub && <p className="wa-section-sub">{sub}</p>}
      {children}
    </section>
  );
}

export default function WorkshopEditor({ workshopId, organisers, onClose, onSaved }) {
  const [form, setForm] = useState(() => formFromWorkshop(null));
  const [loading, setLoading] = useState(Boolean(workshopId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  // As loaded from the server: co-host terms, session timings and booking counts.
  const [loaded, setLoaded] = useState(null);
  const [savePrompt, setSavePrompt] = useState(null); // { statusOverride } while asking

  useEffect(() => {
    if (!workshopId) return undefined;
    let active = true;
    WorkshopService.admin.get(workshopId)
      .then(w => {
        if (!active) return;
        setForm(formFromWorkshop(w));
        setLoaded({
          termsSignature: termsSignature(w.organisers || []),
          timings: Object.fromEntries((w.sessions || []).map(sess => [String(sess.id), timingOf(sess)])),
          paidBookings: w.paid_booking_count || 0,
          recalculable: w.recalculable_booking_count || 0,
        });
      })
      .catch(() => { if (active) setErrors({ _general: 'Could not load this workshop.' }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workshopId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose, saving]);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };
  const updateRow = (listKey, key, field, value) => setForm(prev => ({
    ...prev, [listKey]: prev[listKey].map(row => (row.key === key ? { ...row, [field]: value } : row)),
  }));
  const removeRow = (listKey, key) => setForm(prev => ({ ...prev, [listKey]: prev[listKey].filter(r => r.key !== key) }));

  const highlights = useMemo(() => linesToList(form.highlightsText), [form.highlightsText]);
  const activeOptions = form.options.filter(o => o.is_active && Number(o.price) > 0);
  const [calcOptionKey, setCalcOptionKey] = useState('');
  const calcOption = activeOptions.find(o => o.key === calcOptionKey) || activeOptions[0];
  const totalCapacity = form.sessions.filter(s => s.is_active).reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const shareTotal = sharesTotal(form.organisers);
  const sellerName = (id) => organisers.find(o => String(o.id) === String(id))?.store_name || 'Choose seller';
  const price = Number(calcOption?.price) || 0;
  const perSeatSplit = splitAcrossCohosts(price, form.organisers);
  const fullSplit = splitAcrossCohosts(price * totalCapacity, form.organisers);
  const sumOf = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
  const termsChanged = Boolean(loaded) && termsSignature(form.organisers) !== loaded.termsSignature;

  const addOrganiser = () => setForm(prev => {
    const used = sharesTotal(prev.organisers);
    return { ...prev, organisers: [...prev.organisers, emptyOrganiser(String(Math.max(0, Math.round((100 - used) * 100) / 100)))] };
  });
  const splitEvenly = () => setForm(prev => {
    const shares = evenShares(prev.organisers.length);
    return { ...prev, organisers: prev.organisers.map((o, i) => ({ ...o, share_percent: String(shares[i]) })) };
  });

  const handleImages = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const invalid = files.find(f => !ACCEPTED_IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_BYTES);
    if (invalid) { setErrors(prev => ({ ...prev, images: 'Use JPG, PNG or WebP images under 5 MB.' })); return; }
    if (form.images.length + files.length > MAX_IMAGES) { setErrors(prev => ({ ...prev, images: `Up to ${MAX_IMAGES} images.` })); return; }
    setUploading(true);
    setErrors(prev => ({ ...prev, images: undefined }));
    try {
      const uploaded = await Promise.all(files.map(f => WorkshopService.admin.uploadImage(f)));
      setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded.map(u => u.url)] }));
    } catch {
      setErrors(prev => ({ ...prev, images: 'Image upload failed. Please try again.' }));
    } finally {
      setUploading(false);
    }
  };
  const moveImage = (index, delta) => setForm(prev => {
    const images = [...prev.images];
    const target = index + delta;
    if (target < 0 || target >= images.length) return prev;
    [images[index], images[target]] = [images[target], images[index]];
    return { ...prev, images };
  });

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    const sellers = form.organisers.map(o => o.seller);
    if (!form.organisers.length || sellers.some(id => !id)) next.organisers = 'Choose a seller for every co-host row.';
    else if (new Set(sellers).size !== sellers.length) next.organisers = 'Each seller can be added only once.';
    else if (form.organisers.some(o => !(Number(o.share_percent) > 0))) next.organisers = 'Every co-host needs a revenue share above 0%.';
    else if (shareTotal !== 100) next.organisers = `Revenue shares must add up to 100% (currently ${shareTotal}%).`;
    else if (form.organisers.some(o => !(Number(o.commission_percent) >= 0 && Number(o.commission_percent) <= 100))) {
      next.organisers = 'Commission must be between 0% and 100%.';
    }
    if (form.options.some(o => !o.name.trim() || !(Number(o.price) > 0))) next.options = 'Every option needs a name and a price.';
    if (form.sessions.some(s => !s.date || !s.start_time || !s.end_time || !(Number(s.capacity) > 0))) next.session_inputs = 'Every session needs a date, times and seats.';
    else if (form.sessions.some(s => s.end_time <= s.start_time)) next.session_inputs = 'Session end time must be after the start time.';
    if (form.registration_opens_at && form.registration_closes_at && form.registration_closes_at <= form.registration_opens_at) {
      next.registration_closes_at = 'Registration must close after it opens.';
    }
    if (form.map_url && !/^https?:\/\//i.test(form.map_url.trim())) next.map_url = 'Paste a full link starting with https://';
    return next;
  };

  // Co-host terms changed on a workshop with paid bookings: ask how to apply
  // them before saving. Otherwise save straight away.
  const requestSave = (statusOverride) => {
    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;
    if (termsChanged && loaded.paidBookings > 0) {
      setSavePrompt({ statusOverride });
      return;
    }
    save(statusOverride, false);
  };

  const save = async (statusOverride, recalculateUnsettled) => {
    setSavePrompt(null);
    const draft = statusOverride ? { ...form, status: statusOverride } : form;
    setSaving(true);
    try {
      const payload = { ...payloadFromForm(draft), recalculate_unsettled: recalculateUnsettled };
      const saved = workshopId
        ? await WorkshopService.admin.update(workshopId, payload)
        : await WorkshopService.admin.create(payload);
      onSaved(saved);
    } catch (err) {
      setErrors(flattenErrors(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="wa-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wa-editor-title">
      <div className="wa-modal">
        <div className="wa-modal-head">
          <div>
            <h2 id="wa-editor-title" style={{ fontSize: '1.15rem', fontFamily: 'var(--font-sans)', fontWeight: 800 }}>
              {workshopId ? 'Edit workshop' : 'New workshop'}
            </h2>
            <p className="wa-sub">Everything buyers see on the workshop page and booking form.</p>
          </div>
          <button type="button" className="wa-icon-btn" onClick={onClose} aria-label="Close editor" disabled={saving}><X size={18} /></button>
        </div>

        <div className="wa-modal-body">
          {loading ? (
            <div className="wa-empty"><Loader2 size={24} /> Loading…</div>
          ) : (
            <>
              {errorCount > 0 && (
                <div className="wa-banner wa-banner--error" role="alert">
                  <AlertCircle size={16} />
                  {errors._general || `Please fix ${errorCount} field${errorCount > 1 ? 's' : ''} below.`}
                </div>
              )}

              <Section icon={<Settings2 size={16} />} title="Basics">
                <div className="wa-grid wa-grid--2">
                  <Field label="Workshop title *" error={errors.title} className="wa-span-all">
                    <input className="wa-input" value={form.title} onChange={set('title')} maxLength={160} placeholder="e.g. Closed Terrarium Masterclass" />
                  </Field>
                  <Field label="Tagline" help="One line shown on cards." error={errors.tagline} className="wa-span-all">
                    <input className="wa-input" value={form.tagline} onChange={set('tagline')} maxLength={200} placeholder="Build a self-sustaining ecosystem in a jar" />
                  </Field>
                  <Field label="Type" error={errors.category}>
                    <select className="wa-input" value={form.category} onChange={set('category')}>
                      {WORKSHOP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Status" error={errors.status}>
                    <select className="wa-input" value={form.status} onChange={set('status')}>
                      <option value="draft">Draft (hidden)</option>
                      <option value="published">Published</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled (hidden)</option>
                    </select>
                  </Field>
                  <label className="wa-check" style={{ alignSelf: 'end' }}>
                    <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} /> Feature at the top of the workshops page
                  </label>
                </div>
              </Section>

              <Section icon={<Users size={16} />} title="Organisers & commission" sub="Sellers co-hosting this workshop. Each booking is split by revenue share; Junglyst keeps each seller's commission % of their share.">
                <div className="wa-rows">
                  {form.organisers.map((o, index) => (
                    <div key={o.key} className="wa-row wa-row--cohost">
                      <Field label={index === 0 ? 'Lead organiser' : 'Co-host'}>
                        <select className="wa-input" value={o.seller} onChange={e => updateRow('organisers', o.key, 'seller', e.target.value)}>
                          <option value="">Select a verified seller…</option>
                          {organisers.map(opt => (
                            <option key={opt.id} value={opt.id}
                              disabled={String(opt.id) !== o.seller && form.organisers.some(other => other.seller === String(opt.id))}>
                              {opt.store_name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Revenue share (%)"><input className="wa-input" type="number" inputMode="decimal" min="0.01" max="100" step="0.01" value={o.share_percent} onChange={e => updateRow('organisers', o.key, 'share_percent', e.target.value)} /></Field>
                      <Field label="Junglyst commission (%)"><input className="wa-input" type="number" inputMode="decimal" min="0" max="100" step="0.5" value={o.commission_percent} onChange={e => updateRow('organisers', o.key, 'commission_percent', e.target.value)} /></Field>
                      <div className="wa-row-actions">
                        <button type="button" className="wa-icon-btn wa-icon-btn--danger" aria-label="Remove co-host" onClick={() => removeRow('organisers', o.key)} disabled={form.organisers.length === 1}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '0.6rem' }}>
                  <button type="button" className="wa-btn wa-btn--ghost wa-btn--sm" onClick={addOrganiser} disabled={form.organisers.length >= organisers.length}><Plus size={14} /> Add co-host</button>
                  {form.organisers.length > 1 && <button type="button" className="wa-btn wa-btn--ghost wa-btn--sm" onClick={splitEvenly}><Scale size={14} /> Split equally</button>}
                  <span className="ws-pill" style={{ background: shareTotal === 100 ? '#dcfce7' : '#fee2e2', color: shareTotal === 100 ? '#166534' : '#991b1b' }}>
                    Shares total {shareTotal}%
                  </span>
                </div>
                {errors.organisers && <div className="wa-error" role="alert">{errors.organisers}</div>}
                {termsChanged && loaded.paidBookings > 0 && (
                  <div className="wa-banner wa-banner--warn" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                    <AlertCircle size={16} />
                    This workshop has {loaded.paidBookings} paid booking{loaded.paidBookings === 1 ? '' : 's'}. When you save, you'll choose whether these changes apply to new bookings only or also to unsettled ones.
                  </div>
                )}
              </Section>

              <Section icon={<ListChecks size={16} />} title="What's included" sub="One feature per line. Shown as a checklist, e.g. 3 inch round bowl · Welcome drink · Take home your art.">
                <div className="wa-grid wa-grid--2">
                  <Field label="Highlights / specs" error={errors.highlights}>
                    <textarea className="wa-input" rows={6} value={form.highlightsText} onChange={set('highlightsText')} placeholder={'3 inch round glass bowl\nAll plants, moss & substrate\n1 welcome drink\nTake home your art'} />
                  </Field>
                  <div>
                    <span className="wa-label">Preview</span>
                    {highlights.length ? (
                      <ul className="wa-preview-list">
                        {highlights.map(h => <li key={h}><CheckCircle2 size={14} color="#105c44" style={{ flexShrink: 0, marginTop: 2 }} />{h}</li>)}
                      </ul>
                    ) : <p className="wa-help">Highlights you add appear here.</p>}
                  </div>
                  <Field label="Description" className="wa-span-all" error={errors.description}>
                    <textarea className="wa-input" rows={5} value={form.description} onChange={set('description')} placeholder="What attendees will learn and do, step by step." />
                  </Field>
                  <Field label="What to bring (one per line)" error={errors.what_to_bring}>
                    <textarea className="wa-input" rows={3} value={form.whatToBringText} onChange={set('whatToBringText')} placeholder={'Apron (optional)\nYour curiosity'} />
                  </Field>
                  <Field label="Cancellation policy" error={errors.cancellation_policy}>
                    <textarea className="wa-input" rows={3} value={form.cancellation_policy} onChange={set('cancellation_policy')} />
                  </Field>
                </div>
              </Section>

              <Section icon={<ImageIcon size={16} />} title="Images" sub="First image is the cover. JPG, PNG or WebP, up to 5 MB each.">
                <div className="wa-images">
                  {form.images.map((url, i) => (
                    <div className="wa-image" key={url}>
                      <img src={url} alt={`Workshop image ${i + 1}`} />
                      {i === 0 && <span className="wa-image-cover">Cover</span>}
                      <div className="wa-image-tools">
                        {i > 0 && <button type="button" onClick={() => moveImage(i, -1)} aria-label="Move image left"><ArrowLeft size={13} /></button>}
                        {i < form.images.length - 1 && <button type="button" onClick={() => moveImage(i, 1)} aria-label="Move image right"><ArrowRight size={13} /></button>}
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter(u => u !== url) }))} aria-label="Remove image"><Trash2 size={13} color="#b91c1c" /></button>
                      </div>
                    </div>
                  ))}
                  {form.images.length < MAX_IMAGES && (
                    <label className="wa-upload">
                      {uploading ? <Loader2 size={18} /> : <ImagePlus size={18} />}
                      {uploading ? 'Uploading…' : 'Add images'}
                      <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple hidden disabled={uploading}
                        onChange={e => { handleImages(e.target.files); e.target.value = ''; }} />
                    </label>
                  )}
                </div>
                {errors.images && <div className="wa-error">{errors.images}</div>}
              </Section>

              <Section icon={<IndianRupee size={16} />} title="Options & prices" sub="Sizes / shapes attendees can choose. Price is per person and includes taxes.">
                <div className="wa-rows">
                  {form.options.map(o => (
                    <div key={o.key} className={`wa-row wa-row--option ${o.is_active ? '' : 'wa-row--inactive'}`}>
                      <Field label="Option name"><input className="wa-input" value={o.name} maxLength={120} onChange={e => updateRow('options', o.key, 'name', e.target.value)} placeholder="Round bowl · 3 inch" /></Field>
                      <Field label="Shape"><input className="wa-input" value={o.shape} maxLength={60} onChange={e => updateRow('options', o.key, 'shape', e.target.value)} placeholder="Round" /></Field>
                      <Field label="Size"><input className="wa-input" value={o.size} maxLength={60} onChange={e => updateRow('options', o.key, 'size', e.target.value)} placeholder="3 inch" /></Field>
                      <Field label="Price (₹)"><input className="wa-input" type="number" inputMode="decimal" min="1" step="1" value={o.price} onChange={e => updateRow('options', o.key, 'price', e.target.value)} /></Field>
                      <label className="wa-check"><input type="checkbox" checked={o.is_active} onChange={e => updateRow('options', o.key, 'is_active', e.target.checked)} /> Active</label>
                      <div className="wa-row-actions">
                        <button type="button" className="wa-icon-btn wa-icon-btn--danger" aria-label="Remove option" onClick={() => removeRow('options', o.key)} disabled={form.options.length === 1}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.options && <div className="wa-error">{errors.options}</div>}
                <button type="button" className="wa-btn wa-btn--ghost wa-btn--sm" style={{ marginTop: '0.6rem' }} onClick={() => setForm(prev => ({ ...prev, options: [...prev.options, emptyOption()] }))}>
                  <Plus size={14} /> Add option
                </button>
              </Section>

              <Section icon={<CalendarDays size={16} />} title="Sessions & seats" sub="Each session is one date and time slot with its own seat limit. Booked sessions are deactivated instead of deleted.">
                <div className="wa-rows">
                  {form.sessions.map(s => (
                    <div key={s.key} className={`wa-row wa-row--session ${s.is_active ? '' : 'wa-row--inactive'}`}>
                      <Field label="Date"><input className="wa-input" type="date" value={s.date} onChange={e => updateRow('sessions', s.key, 'date', e.target.value)} /></Field>
                      <Field label="Starts"><input className="wa-input" type="time" value={s.start_time} onChange={e => updateRow('sessions', s.key, 'start_time', e.target.value)} /></Field>
                      <Field label="Ends"><input className="wa-input" type="time" value={s.end_time} onChange={e => updateRow('sessions', s.key, 'end_time', e.target.value)} /></Field>
                      <Field label="Seats"><input className="wa-input" type="number" inputMode="numeric" min={Math.max(1, s.seats_booked || 0)} value={s.capacity} onChange={e => updateRow('sessions', s.key, 'capacity', e.target.value)} /></Field>
                      <Field label="Note (optional)"><input className="wa-input" value={s.note} maxLength={200} onChange={e => updateRow('sessions', s.key, 'note', e.target.value)} placeholder="Weekend batch" /></Field>
                      <label className="wa-check"><input type="checkbox" checked={s.is_active} onChange={e => updateRow('sessions', s.key, 'is_active', e.target.checked)} /> Active</label>
                      <div className="wa-row-actions">
                        <button type="button" className="wa-icon-btn" aria-label="Duplicate session" title="Duplicate" onClick={() => setForm(prev => ({ ...prev, sessions: [...prev.sessions, emptySession(s)] }))}><Copy size={15} /></button>
                        <button type="button" className="wa-icon-btn wa-icon-btn--danger" aria-label="Remove session" onClick={() => removeRow('sessions', s.key)}><Trash2 size={15} /></button>
                      </div>
                      {s.seats_booked > 0 && (
                        <div className="wa-row-meta">
                          {s.seats_booked} of {s.capacity} seats booked · seats can't go below {s.seats_booked}
                          {loaded?.timings[s.key] && loaded.timings[s.key] !== timingOf(s) && (
                            <strong style={{ color: '#b45309' }}> · New timing: booked attendees will be emailed when you save.</strong>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {errors.session_inputs && <div className="wa-error">{errors.session_inputs}</div>}
                <button type="button" className="wa-btn wa-btn--ghost wa-btn--sm" style={{ marginTop: '0.6rem' }} onClick={() => setForm(prev => ({ ...prev, sessions: [...prev.sessions, emptySession(prev.sessions[prev.sessions.length - 1])] }))}>
                  <Plus size={14} /> Add session
                </button>
              </Section>

              <Section icon={<CalendarDays size={16} />} title="Registration window" sub="Leave empty to keep registrations open until each session starts.">
                <div className="wa-grid wa-grid--2">
                  <Field label="Registration opens" error={errors.registration_opens_at}>
                    <input className="wa-input" type="datetime-local" value={form.registration_opens_at} onChange={set('registration_opens_at')} />
                  </Field>
                  <Field label="Registration closes" error={errors.registration_closes_at}>
                    <input className="wa-input" type="datetime-local" value={form.registration_closes_at} onChange={set('registration_closes_at')} />
                  </Field>
                </div>
              </Section>

              <Section icon={<MapPin size={16} />} title="Venue & logistics">
                <div className="wa-grid wa-grid--3">
                  <Field label="Venue name" error={errors.venue_name}><input className="wa-input" value={form.venue_name} onChange={set('venue_name')} placeholder="Moss Lab Studio" /></Field>
                  <Field label="City" error={errors.city}><input className="wa-input" value={form.city} onChange={set('city')} placeholder="Kochi" /></Field>
                  <Field label="Google Maps link" error={errors.map_url}><input className="wa-input" type="url" inputMode="url" value={form.map_url} onChange={set('map_url')} placeholder="https://maps.app.goo.gl/…" /></Field>
                  <Field label="Full address" className="wa-span-all" error={errors.address}><textarea className="wa-input" rows={2} value={form.address} onChange={set('address')} /></Field>
                  <Field label="Duration (minutes)" error={errors.duration_minutes}><input className="wa-input" type="number" inputMode="numeric" min="15" step="15" value={form.duration_minutes} onChange={set('duration_minutes')} /></Field>
                  <Field label="Skill level"><select className="wa-input" value={form.skill_level} onChange={set('skill_level')}>{SKILL_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select></Field>
                  <Field label="Minimum age" help="Leave empty for all ages." error={errors.min_age}><input className="wa-input" type="number" inputMode="numeric" min="0" value={form.min_age} onChange={set('min_age')} /></Field>
                  <Field label="Max seats per booking" error={errors.max_seats_per_booking}><input className="wa-input" type="number" inputMode="numeric" min="1" max="50" value={form.max_seats_per_booking} onChange={set('max_seats_per_booking')} /></Field>
                </div>
              </Section>

              <Section icon={<IndianRupee size={16} />} title="Revenue calculator" sub="How one seat, and a full house, split between Junglyst and each co-host on the terms above.">
                <div className="wa-grid wa-grid--2">
                  <Field label="Calculate for option">
                    <select className="wa-input" value={calcOption?.key || ''} onChange={e => setCalcOptionKey(e.target.value)} disabled={!activeOptions.length}>
                      {activeOptions.length ? activeOptions.map(o => <option key={o.key} value={o.key}>{o.name || 'Untitled'} · {formatINR(o.price)}</option>) : <option>Add a priced option</option>}
                    </select>
                  </Field>
                  <div className="wa-calc wa-span-all">
                    <div className="wa-table-wrap">
                      <table className="wa-table" style={{ minWidth: 520, background: 'transparent' }}>
                        <thead>
                          <tr><th>Co-host</th><th className="num">Share of a seat</th><th className="num">Junglyst</th><th className="num">Payout / seat</th><th className="num">Payout, all {totalCapacity} seats</th></tr>
                        </thead>
                        <tbody>
                          {form.organisers.map((o, i) => (
                            <tr key={o.key}>
                              <td className="wa-strong">{sellerName(o.seller)}<div className="wa-muted">{o.share_percent || 0}% share · {o.commission_percent || 0}% commission</div></td>
                              <td className="num">{formatINR(perSeatSplit[i]?.gross, { decimals: 2 })}</td>
                              <td className="num">{formatINR(perSeatSplit[i]?.commission, { decimals: 2 })}</td>
                              <td className="num wa-strong">{formatINR(perSeatSplit[i]?.payout, { decimals: 2 })}</td>
                              <td className="num">{formatINR(fullSplit[i]?.payout)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td className="wa-strong">Total</td>
                            <td className="num wa-strong">{formatINR(price, { decimals: 2 })}</td>
                            <td className="num wa-strong">{formatINR(sumOf(perSeatSplit, 'commission'), { decimals: 2 })}</td>
                            <td className="num wa-strong">{formatINR(sumOf(perSeatSplit, 'payout'), { decimals: 2 })}</td>
                            <td className="num wa-strong">{formatINR(price * totalCapacity)} gross · Junglyst {formatINR(sumOf(fullSplit, 'commission'))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>

        <div className="wa-modal-foot">
          <button type="button" className="wa-btn wa-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
          {form.status !== 'published' && (
            <button type="button" className="wa-btn wa-btn--ghost" onClick={() => requestSave()} disabled={saving || loading || uploading}>
              {saving ? 'Saving…' : 'Save as ' + (form.status === 'draft' ? 'draft' : form.status)}
            </button>
          )}
          <button type="button" className="wa-btn wa-btn--primary" onClick={() => requestSave('published')} disabled={saving || loading || uploading}>
            {saving ? 'Saving…' : form.status === 'published' ? 'Save changes' : 'Save & publish'}
          </button>
        </div>
      </div>

      {savePrompt && (
        <div className="wa-modal-backdrop" style={{ alignItems: 'center', zIndex: 1100 }} role="alertdialog" aria-modal="true" aria-labelledby="wa-apply-title">
          <div className="wa-modal" style={{ maxWidth: 520, borderRadius: 18, height: 'auto', maxHeight: 'calc(100dvh - 2rem)', margin: '1rem' }}>
            <div className="wa-modal-body">
              <h3 id="wa-apply-title" style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                Apply the new organiser terms to existing bookings?
              </h3>
              <p className="wa-sub" style={{ marginBottom: '1rem' }}>
                {loaded.paidBookings} paid booking{loaded.paidBookings === 1 ? ' was' : 's were'} split on the old shares / commission.
                What buyers paid never changes. Only how it's divided between Junglyst and the co-hosts.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button type="button" className="wa-btn wa-btn--ghost" style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', padding: '0.75rem 1rem' }} onClick={() => save(savePrompt.statusOverride, false)}>
                  <span><strong>New bookings only</strong><br /><span className="wa-muted">Existing bookings keep the split they were sold with.</span></span>
                </button>
                <button type="button" className="wa-btn wa-btn--primary" style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', padding: '0.75rem 1rem' }} onClick={() => save(savePrompt.statusOverride, true)} disabled={!loaded.recalculable}>
                  <span><strong>Also recalculate {loaded.recalculable} unsettled booking{loaded.recalculable === 1 ? '' : 's'}</strong><br />
                    <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                      {loaded.recalculable ? 'Bookings no settlement has been recorded against are re-split on the new terms.' : 'Nothing to recalculate: every paid booking is already in settled sessions.'}
                    </span>
                  </span>
                </button>
                <button type="button" className="wa-btn wa-btn--ghost" onClick={() => setSavePrompt(null)}>Back to editing</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
