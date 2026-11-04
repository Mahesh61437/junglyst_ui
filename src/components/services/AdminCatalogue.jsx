import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink, FolderPlus, Home, IndianRupee, Layers, ListChecks, MapPin, Pencil, Percent, Plus,
} from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import { slugify } from '../../utils/serviceQuotes';
import { useRegion } from '../../context/RegionContext';
import OfferingEditor, { ImageField } from './OfferingEditor';
import '../../pages/Services.css';
import '../../pages/SuperAdminWorkshops.css';

function GroupEditor({ group, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: group?.name || '', slug: group?.slug || '', description: group?.description || '', image_url: group?.image_url || '',
    is_active: group?.is_active ?? true, show_on_home: group?.show_on_home ?? true, home_sort_order: group?.home_sort_order ?? 0,
    allowed_states: group?.allowed_states || [],
  });
  const { states } = useRegion();
  const toggleState = (code) => setForm(prev => ({
    ...prev, allowed_states: prev.allowed_states.includes(code) ? prev.allowed_states.filter(c => c !== code) : [...prev.allowed_states, code],
  }));
  const [slugTouched, setSlugTouched] = useState(Boolean(group));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  const handleSave = async (event) => {
    event.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('Give the group a name.');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setError('The web address can only have lowercase letters, numbers and hyphens.');
    setSaving(true);
    try {
      onSaved(await ServiceQuoteService.admin.saveGroup(group?.id, { ...form, name: form.name.trim(), home_sort_order: Number(form.home_sort_order) || 0 }));
    } catch (err) {
      setError(err.userMessage || 'Could not save this group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sv-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <form className="sv-modal" role="dialog" aria-modal="true" aria-labelledby="ge-title" tabIndex={-1} ref={dialogRef} onSubmit={handleSave} noValidate>
        <div className="sv-modal-head">
          <h2 id="ge-title">{group ? `Edit ${group.name}` : 'New group'}</h2>
          <button type="button" className="sv-close" aria-label="Close" onClick={onClose} disabled={saving}>×</button>
        </div>
        {error && <div className="sv-banner sv-banner--error" role="alert">{error}</div>}
        <div className="sv-field"><label className="sv-label" htmlFor="ge-name">Group name</label>
          <input id="ge-name" className="sv-input" maxLength={120} value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) }))} /></div>
        <div className="sv-field"><label className="sv-label" htmlFor="ge-slug">Web address</label>
          <input id="ge-slug" className="sv-input" maxLength={140} value={form.slug} onChange={(e) => { setSlugTouched(true); setForm(prev => ({ ...prev, slug: e.target.value })); }} /></div>
        <div className="sv-field"><label className="sv-label" htmlFor="ge-desc">Description</label>
          <textarea id="ge-desc" className="sv-textarea" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} /></div>
        <ImageField label="Photo" value={form.image_url} onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))} />
        <div className="sv-checks">
          <label className="sv-check"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))} /> Active</label>
          <label className="sv-check"><input type="checkbox" checked={form.show_on_home} onChange={(e) => setForm(prev => ({ ...prev, show_on_home: e.target.checked }))} /> Show on home page</label>
        </div>
        <div className="sv-field"><label className="sv-label" htmlFor="ge-order">Home page order</label>
          <input id="ge-order" className="sv-input" type="number" min="0" value={form.home_sort_order} onChange={(e) => setForm(prev => ({ ...prev, home_sort_order: e.target.value }))} /></div>
        <fieldset className="sv-fieldset">
          <legend>Delivery states (leave empty for all of India)</legend>
          <p className="sv-help" style={{ margin: 0 }}>Customers see these as a note, can only pick these states, and can only pay with an address in them. A service can narrow this further.</p>
          <div className="sv-state-grid">
            {states.map(state => (
              <label key={state.code}><input type="checkbox" checked={form.allowed_states.includes(state.code)} onChange={() => toggleState(state.code)} /> {state.name}</label>
            ))}
          </div>
        </fieldset>
        <button className="sv-submit" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save group'}</button>
      </form>
    </div>
  );
}

function StatusDot({ on, children }) {
  return <span className={`svc-status${on ? ' svc-status--on' : ''}`}><span aria-hidden="true" />{children}</span>;
}

function Thumb({ image, name, size = 'md' }) {
  return (
    <span className={`svc-thumb svc-thumb--${size}`} aria-hidden="true">
      {image ? <img src={image} alt="" /> : (name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

function OfferingRow({ offering, onEdit }) {
  const questions = offering.form_fields.length;
  return (
    <li className="svc-row">
      <Thumb image={offering.image_url} name={offering.name} size="sm" />
      <div className="svc-row-main">
        <div className="svc-row-title">
          <strong>{offering.name}</strong>
          <StatusDot on={offering.is_active}>{offering.is_active ? 'Visible' : 'Hidden'}</StatusDot>
        </div>
        {offering.description && <p className="svc-row-desc">{offering.description}</p>}
        <div className="svc-meta">
          <span><ListChecks size={13} aria-hidden="true" /> {questions} question{questions === 1 ? '' : 's'}</span>
          <span><MapPin size={13} aria-hidden="true" /> {offering.allowed_states.length ? offering.allowed_states.join(', ') : 'Group states'}</span>
          <span><Percent size={13} aria-hidden="true" /> {Number(offering.commission_percent)}% commission</span>
          {offering.suggested_min_budget && <span><IndianRupee size={13} aria-hidden="true" /> from {Number(offering.suggested_min_budget).toLocaleString('en-IN')}</span>}
        </div>
      </div>
      <button type="button" className="wa-btn wa-btn--ghost svc-row-edit" onClick={onEdit} aria-label={`Edit ${offering.name}`}><Pencil size={14} /> Edit</button>
    </li>
  );
}

export default function AdminCatalogue({ groups, offerings, onChanged }) {
  const [editingGroup, setEditingGroup] = useState(null); // null | 'new' | group
  const [editingOffering, setEditingOffering] = useState(null); // null | { offering?, groupId? }

  const handleSaved = () => { setEditingGroup(null); setEditingOffering(null); onChanged(); };
  const onHome = groups.filter(group => group.is_active && group.show_on_home).length;

  return (
    <div className="svc">
      <div className="svc-toolbar">
        <dl className="svc-stats">
          <div><dt>Groups</dt><dd>{groups.length}</dd></div>
          <div><dt>Services</dt><dd>{offerings.length}</dd></div>
          <div><dt>On home page</dt><dd>{onHome}</dd></div>
        </dl>
        <div className="svc-toolbar-actions">
          <button type="button" className="wa-btn wa-btn--ghost" onClick={() => setEditingGroup('new')}><FolderPlus size={15} /> New group</button>
          <button type="button" className="wa-btn wa-btn--primary" disabled={!groups.length} onClick={() => setEditingOffering({})}><Plus size={15} /> New service</button>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="wa-card wa-empty">
          <h3>No service groups yet</h3>
          <p style={{ marginBottom: '1rem' }}>A group is a section on the home page, for example Terrariums. Create one, then add the services inside it.</p>
          <button type="button" className="wa-btn wa-btn--primary" onClick={() => setEditingGroup('new')}><Plus size={16} /> New group</button>
        </div>
      )}

      {groups.map(group => {
        const items = offerings.filter(o => o.group === group.id);
        return (
          <section key={group.id} className="svc-group" aria-labelledby={`cg-${group.id}`}>
            <header className="svc-group-head">
              <Thumb image={group.image_url} name={group.name} />
              <div className="svc-group-info">
                <h2 id={`cg-${group.id}`}>{group.name}</h2>
                <div className="svc-group-flags">
                  <StatusDot on={group.is_active}>{group.is_active ? 'Active' : 'Hidden'}</StatusDot>
                  <span className="svc-flag"><Home size={13} aria-hidden="true" /> {group.show_on_home ? `Home page · position ${group.home_sort_order}` : 'Not on home page'}</span>
                  <span className="svc-flag"><MapPin size={13} aria-hidden="true" /> {group.allowed_states.length ? group.allowed_states.join(', ') : 'All India'}</span>
                  <span className="svc-flag"><Layers size={13} aria-hidden="true" /> {items.length} service{items.length === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="svc-group-actions">
                <a className="wa-btn wa-btn--ghost" href={`/services/${group.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${group.name} on the site`}><ExternalLink size={14} /> <span className="svc-hide-sm">View</span></a>
                <button type="button" className="wa-btn wa-btn--ghost" onClick={() => setEditingGroup(group)}><Pencil size={14} /> Edit group</button>
              </div>
            </header>

            {items.length > 0 && (
              <ul className="svc-rows">
                {items.map(offering => <OfferingRow key={offering.id} offering={offering} onEdit={() => setEditingOffering({ offering })} />)}
              </ul>
            )}
            <button type="button" className="svc-add" onClick={() => setEditingOffering({ groupId: group.id })}>
              <Plus size={16} aria-hidden="true" /> {items.length ? `Add another service to ${group.name}` : `Add the first service to ${group.name}`}
            </button>
          </section>
        );
      })}

      {editingGroup && <GroupEditor group={editingGroup === 'new' ? null : editingGroup} onClose={() => setEditingGroup(null)} onSaved={handleSaved} />}
      {editingOffering && (
        <OfferingEditor offering={editingOffering.offering} groups={groups} defaultGroupId={editingOffering.groupId} onClose={() => setEditingOffering(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
