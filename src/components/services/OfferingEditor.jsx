import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';
import { useRegion } from '../../context/RegionContext';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { FIELD_TYPES, fieldKeyFrom, slugify } from '../../utils/serviceQuotes';
import '../../pages/Services.css';
import '../../pages/SuperAdminWorkshops.css';

const CHOICE_TYPES = ['select', 'multiselect'];
const MAX_QUESTIONS = 30;

export function ImageField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await ServiceQuoteService.admin.uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.userMessage || 'Upload failed. Paste an image link instead.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="sv-field">
      <label className="sv-label" htmlFor={`img-${label}`}>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input id={`img-${label}`} className="sv-input" type="url" inputMode="url" placeholder="https://…" value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="wa-btn wa-btn--ghost" style={{ minHeight: 46 }} onClick={() => inputRef.current?.click()} disabled={uploading}><Upload size={14} /> {uploading ? '…' : 'Upload'}</button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />
      </div>
      {error && <span className="sv-error" role="alert">{error}</span>}
      {value && <img src={value} alt="" style={{ maxHeight: 90, borderRadius: 10, objectFit: 'cover', alignSelf: 'flex-start' }} />}
    </div>
  );
}

const blankQuestion = () => ({ key: '', label: '', field_type: 'text', required: false, choicesText: '', min_value: '', max_value: '', max_length: '', help_text: '', keyTouched: false });

const toQuestion = (field) => ({
  key: field.key, label: field.label, field_type: field.field_type, required: field.required,
  choicesText: (field.choices || []).join('\n'), min_value: field.min_value ?? '', max_value: field.max_value ?? '',
  max_length: field.max_length ?? '', help_text: field.help_text || '', keyTouched: true,
});

const fromQuestion = (question, index) => ({
  key: question.key, label: question.label.trim(), field_type: question.field_type, required: question.required,
  choices: CHOICE_TYPES.includes(question.field_type) ? question.choicesText.split('\n').map(c => c.trim()).filter(Boolean) : [],
  min_value: question.field_type === 'number' && question.min_value !== '' ? question.min_value : null,
  max_value: question.field_type === 'number' && question.max_value !== '' ? question.max_value : null,
  max_length: ['text', 'textarea'].includes(question.field_type) && question.max_length !== '' ? Number(question.max_length) : null,
  help_text: question.help_text.trim(), sort_order: index,
});

function validateQuestions(questions) {
  const keys = new Set();
  for (const [index, q] of questions.entries()) {
    const position = `Question ${index + 1}`;
    if (!q.label.trim()) return `${position} needs a label.`;
    if (!/^[a-z][a-z0-9_-]*$/.test(q.key)) return `${position} has an invalid key. Use lowercase letters, numbers and underscores.`;
    if (keys.has(q.key)) return `${position} repeats the key "${q.key}".`;
    keys.add(q.key);
    if (CHOICE_TYPES.includes(q.field_type)) {
      const choices = q.choicesText.split('\n').map(c => c.trim()).filter(Boolean);
      if (!choices.length) return `${position} needs at least one choice.`;
      if (new Set(choices).size !== choices.length) return `${position} has repeated choices.`;
    }
    if (q.field_type === 'number' && q.min_value !== '' && q.max_value !== '' && Number(q.min_value) > Number(q.max_value)) {
      return `${position}: the minimum is above the maximum.`;
    }
  }
  return null;
}

function FormBuilder({ questions, onChange }) {
  const update = (index, patch) => onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  const move = (index, delta) => {
    const next = [...questions];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {questions.map((q, index) => (
        <div key={index} className="sv-builder-item">
          <div className="sv-row sv-row--2">
            <div className="sv-field">
              <label className="sv-label" htmlFor={`fb-label-${index}`}>Question</label>
              <input id={`fb-label-${index}`} className="sv-input" maxLength={160} value={q.label} onChange={(e) => update(index, { label: e.target.value, ...(q.keyTouched ? {} : { key: fieldKeyFrom(e.target.value) }) })} placeholder="e.g. Preferred size" />
            </div>
            <div className="sv-field">
              <label className="sv-label" htmlFor={`fb-type-${index}`}>Answer type</label>
              <select id={`fb-type-${index}`} className="sv-select" value={q.field_type} onChange={(e) => update(index, { field_type: e.target.value })}>
                {FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {CHOICE_TYPES.includes(q.field_type) && (
            <div className="sv-field">
              <label className="sv-label" htmlFor={`fb-choices-${index}`}>Choices (one per line)</label>
              <textarea id={`fb-choices-${index}`} className="sv-textarea" style={{ minHeight: 80 }} value={q.choicesText} onChange={(e) => update(index, { choicesText: e.target.value })} />
            </div>
          )}
          {q.field_type === 'number' && (
            <div className="sv-row sv-row--2">
              <div className="sv-field"><label className="sv-label" htmlFor={`fb-min-${index}`}>Minimum</label><input id={`fb-min-${index}`} className="sv-input" type="number" inputMode="decimal" value={q.min_value} onChange={(e) => update(index, { min_value: e.target.value })} /></div>
              <div className="sv-field"><label className="sv-label" htmlFor={`fb-max-${index}`}>Maximum</label><input id={`fb-max-${index}`} className="sv-input" type="number" inputMode="decimal" value={q.max_value} onChange={(e) => update(index, { max_value: e.target.value })} /></div>
            </div>
          )}
          <div className="sv-field">
            <label className="sv-label" htmlFor={`fb-help-${index}`}>Hint for the customer (optional)</label>
            <input id={`fb-help-${index}`} className="sv-input" maxLength={240} value={q.help_text} onChange={(e) => update(index, { help_text: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
            <label className="sv-check" style={{ background: '#fff' }}>
              <input type="checkbox" checked={q.required} onChange={(e) => update(index, { required: e.target.checked })} /> Required
            </label>
            <span className="sv-help">Key: <code>{q.key || '—'}</code></span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button type="button" className="wa-icon-btn" style={{ width: 44, height: 44 }} aria-label={`Move question ${index + 1} up`} onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp size={15} /></button>
              <button type="button" className="wa-icon-btn" style={{ width: 44, height: 44 }} aria-label={`Move question ${index + 1} down`} onClick={() => move(index, 1)} disabled={index === questions.length - 1}><ArrowDown size={15} /></button>
              <button type="button" className="wa-icon-btn wa-icon-btn--danger" style={{ width: 44, height: 44 }} aria-label={`Remove question ${index + 1}`} onClick={() => onChange(questions.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}
      {questions.length < MAX_QUESTIONS && (
        <button type="button" className="wa-btn wa-btn--ghost" style={{ minHeight: 44, justifySelf: 'start' }} onClick={() => onChange([...questions, blankQuestion()])}><Plus size={14} /> Add a question</button>
      )}
    </div>
  );
}

export default function OfferingEditor({ offering, groups, defaultGroupId, onClose, onSaved }) {
  const { states } = useRegion();
  const [form, setForm] = useState(() => ({
    group: offering?.group ?? defaultGroupId ?? groups[0]?.id ?? '', name: offering?.name || '', slug: offering?.slug || '',
    description: offering?.description || '', image_url: offering?.image_url || '', is_active: offering?.is_active ?? true,
    sort_order: offering?.sort_order ?? 0, allowed_states: offering?.allowed_states || [],
    suggested_min_budget: offering?.suggested_min_budget ?? '', commission_percent: offering?.commission_percent ?? '15',
  }));
  const [slugTouched, setSlugTouched] = useState(Boolean(offering));
  const [questions, setQuestions] = useState(() => (offering?.form_fields || []).map(toQuestion));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  const set = (key) => (event) => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const toggleState = (code) => setForm(prev => ({
    ...prev, allowed_states: prev.allowed_states.includes(code) ? prev.allowed_states.filter(c => c !== code) : [...prev.allowed_states, code],
  }));

  const handleSave = async (event) => {
    event.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('Give the service a name.');
    if (!form.group) return setError('Choose a group.');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setError('The web address can only have lowercase letters, numbers and hyphens.');
    const commission = Number(form.commission_percent);
    if (Number.isNaN(commission) || commission < 0 || commission > 100) return setError('Commission must be between 0 and 100.');
    const questionError = validateQuestions(questions);
    if (questionError) return setError(questionError);

    setSaving(true);
    try {
      const saved = await ServiceQuoteService.admin.saveOffering(offering?.id, {
        ...form, name: form.name.trim(), group: Number(form.group),
        suggested_min_budget: form.suggested_min_budget === '' ? null : form.suggested_min_budget,
        form_fields: questions.map(fromQuestion),
      });
      onSaved(saved);
    } catch (err) {
      setError(err.userMessage || 'Could not save this service.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sv-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <form className="sv-modal sv-modal--wide" role="dialog" aria-modal="true" aria-labelledby="oe-title" tabIndex={-1} ref={dialogRef} onSubmit={handleSave} noValidate>
        <div className="sv-modal-head">
          <h2 id="oe-title">{offering ? `Edit ${offering.name}` : 'New service'}</h2>
          <button type="button" className="sv-close" aria-label="Close" onClick={onClose} disabled={saving}>×</button>
        </div>
        {error && <div className="sv-banner sv-banner--error" role="alert">{error}</div>}

        <div className="sv-row sv-row--2">
          <div className="sv-field"><label className="sv-label" htmlFor="oe-name">Name</label>
            <input id="oe-name" className="sv-input" maxLength={160} value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) }))} /></div>
          <div className="sv-field"><label className="sv-label" htmlFor="oe-group">Group</label>
            <select id="oe-group" className="sv-select" value={form.group} onChange={set('group')}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select></div>
        </div>
        <div className="sv-field"><label className="sv-label" htmlFor="oe-slug">Web address</label>
          <input id="oe-slug" className="sv-input" maxLength={180} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug')(e); }} />
          <span className="sv-help">/services/…/{form.slug || 'your-service'}</span></div>
        <div className="sv-field"><label className="sv-label" htmlFor="oe-desc">Description</label>
          <textarea id="oe-desc" className="sv-textarea" value={form.description} onChange={set('description')} /></div>
        <ImageField label="Photo" value={form.image_url} onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))} />

        <div className="sv-row sv-row--2">
          <div className="sv-field"><label className="sv-label" htmlFor="oe-budget">Usual starting price (₹, optional)</label>
            <input id="oe-budget" className="sv-input" type="number" inputMode="decimal" min="0" value={form.suggested_min_budget} onChange={set('suggested_min_budget')} />
            <span className="sv-help">Shown as a hint on the form. It never blocks a request.</span></div>
          <div className="sv-field"><label className="sv-label" htmlFor="oe-commission">Platform commission (%)</label>
            <input id="oe-commission" className="sv-input" type="number" inputMode="decimal" min="0" max="100" step="0.5" value={form.commission_percent} onChange={set('commission_percent')} />
            <span className="sv-help">Taken from the item price. Shipping goes to the seller.</span></div>
        </div>
        <div className="sv-row sv-row--2">
          <div className="sv-field"><label className="sv-label" htmlFor="oe-order">Display order</label>
            <input id="oe-order" className="sv-input" type="number" min="0" value={form.sort_order} onChange={set('sort_order')} /></div>
          <label className="sv-check" style={{ alignSelf: 'end' }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))} /> Visible on the site
          </label>
        </div>

        <fieldset className="sv-fieldset">
          <legend>Delivery states for this service (leave empty to use the group's)</legend>
          <div className="sv-state-grid">
            {states.map(state => (
              <label key={state.code}><input type="checkbox" checked={form.allowed_states.includes(state.code)} onChange={() => toggleState(state.code)} /> {state.name}</label>
            ))}
          </div>
        </fieldset>

        <fieldset className="sv-fieldset">
          <legend>Questions the customer answers</legend>
          <FormBuilder questions={questions} onChange={setQuestions} />
        </fieldset>

        <button className="sv-submit" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save service'}</button>
      </form>
    </div>
  );
}
