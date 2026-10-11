import { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import api from '../services/api';
import { useRegion } from '../context/RegionContext';
import { getApiErrorMessage } from '../utils/apiError';
import { REGION_LABELS } from '../utils/deliveryRegion';

const MAX_REGION_FEE = 5000;

const REGIONS = [
  { code: 'south', shipsField: 'ships_to_south', feeField: 'delivery_fee_south' },
  { code: 'north', shipsField: 'ships_to_north', feeField: 'delivery_fee_north' },
  { code: 'north_east', shipsField: 'ships_to_north_east', feeField: 'delivery_fee_north_east' },
];

const toFormState = (data) => ({
  ...Object.fromEntries(REGIONS.flatMap(r => [
    [r.shipsField, data[r.shipsField] ?? true],
    [r.feeField, data[r.feeField] == null ? '' : String(Number(data[r.feeField]))],
  ])),
  excluded_states: data.excluded_states || [],
});

function validate(form, statesByRegion) {
  if (!REGIONS.some(r => form[r.shipsField])) return 'Select at least one region you deliver to.';
  const deliverable = REGIONS
    .filter(r => form[r.shipsField])
    .flatMap(r => statesByRegion[r.code] || [])
    .filter(state => !form.excluded_states.includes(state.code));
  if (statesByRegion.loaded && deliverable.length === 0) return 'Keep at least one state you deliver to.';
  for (const r of REGIONS) {
    const raw = form[r.feeField];
    if (raw === '') continue;
    const fee = Number(raw);
    if (!Number.isInteger(fee) || fee < 0 || fee > MAX_REGION_FEE) {
      return `${REGION_LABELS[r.code]} delivery fee must be a whole number of rupees between ₹0 and ₹${MAX_REGION_FEE}.`;
    }
  }
  return null;
}

/**
 * Seller self-serve: which regions they deliver to, states inside those
 * regions they don't deliver to, and an optional flat delivery fee per region
 * (blank → the standard slab-based fee applies). Has its own save button, and
 * exposes `saveIfChanged()` through `ref` so the surrounding Studio Identity
 * save can persist it too — otherwise edits here are easy to lose.
 */
export default function DeliveryRegionsPanel({ brandColor, ref }) {
  const { states, catalogLoading } = useRegion();
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState(null); // last state the server confirmed
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [openStateLists, setOpenStateLists] = useState({});

  const statesByRegion = useMemo(() => {
    const grouped = { loaded: states.length > 0 };
    for (const region of REGIONS) {
      grouped[region.code] = states
        .filter(s => s.region === region.code)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return grouped;
  }, [states]);

  useEffect(() => {
    let cancelled = false;
    api.get('/sellers/delivery-regions/')
      .then(res => {
        if (cancelled) return;
        const loaded = toFormState(res.data);
        setForm(loaded);
        setSavedForm(loaded);
      })
      .catch(err => { if (!cancelled) setLoadError(getApiErrorMessage(err, 'Could not load your delivery regions.')); });
    return () => { cancelled = true; };
  }, []);

  const applyChange = (changes) => {
    setForm(prev => ({ ...prev, ...changes }));
    setSaved(false);
    setError(null);
  };

  const toggleState = (stateCode, delivers) => {
    const excluded = new Set(form.excluded_states);
    if (delivers) excluded.delete(stateCode);
    else excluded.add(stateCode);
    applyChange({ excluded_states: [...excluded].sort() });
  };

  const allIndia = form
    ? REGIONS.every(r => form[r.shipsField]) && form.excluded_states.length === 0
    : false;
  const setAllIndia = () => applyChange({
    ...Object.fromEntries(REGIONS.map(r => [r.shipsField, true])),
    excluded_states: [],
  });

  const hasUnsavedChanges = !!form && JSON.stringify(form) !== JSON.stringify(savedForm);

  // Returns true when there is nothing left unsaved, false on validation/API error.
  const save = async () => {
    const validationError = validate(form, statesByRegion);
    if (validationError) { setError(validationError); return false; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...Object.fromEntries(REGIONS.flatMap(r => [
          [r.shipsField, form[r.shipsField]],
          [r.feeField, form[r.feeField] === '' ? null : form[r.feeField]],
        ])),
        excluded_states: form.excluded_states,
      };
      const res = await api.patch('/sellers/delivery-regions/', payload);
      const confirmed = toFormState(res.data);
      setForm(confirmed);
      setSavedForm(confirmed);
      setSaved(true);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save delivery regions.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveIfChanged: () => (hasUnsavedChanges ? save() : Promise.resolve(true)),
  }));

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Delivery Regions & Fees</label>
      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
        Buyers only see your products when you deliver to their state. Untick any states inside a region you can't deliver to. Set a flat delivery fee per region, or leave it blank to use the standard shipping slabs.
      </p>

      {loadError && (
        <div role="alert" style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', borderRadius: '6px' }}>{loadError}</div>
      )}

      {!form && !loadError && (
        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loading delivery regions…</p>
      )}

      {form && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={setAllIndia}
            aria-pressed={allIndia}
            style={{
              alignSelf: 'flex-start', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer', border: '2px solid',
              backgroundColor: allIndia ? brandColor : 'white',
              color: allIndia ? 'white' : '#64748b',
              borderColor: allIndia ? brandColor : '#e2e8f0',
            }}
          >All over India</button>

          {REGIONS.map(region => {
            const enabled = form[region.shipsField];
            const regionStates = statesByRegion[region.code];
            const deliverableCount = regionStates.filter(s => !form.excluded_states.includes(s.code)).length;
            const listOpen = !!openStateLists[region.code];
            const checkboxId = `ships-${region.code}`;
            const feeId = `fee-${region.code}`;
            const listId = `states-${region.code}`;
            return (
              <div key={region.code} style={{
                padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0',
                backgroundColor: enabled ? 'white' : '#f8fafc',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                  <label htmlFor={checkboxId} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', minHeight: '44px', cursor: 'pointer', flex: '1 1 220px' }}>
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={enabled}
                      onChange={e => applyChange({ [region.shipsField]: e.target.checked })}
                      style={{ accentColor: brandColor, width: '16px', height: '16px' }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#1b2d2a' }}>
                      <MapPin size={13} /> {REGION_LABELS[region.code]}
                    </span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <label htmlFor={feeId} style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>Delivery fee (₹)</label>
                    <input
                      id={feeId}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={MAX_REGION_FEE}
                      step="1"
                      placeholder="Standard slab"
                      value={form[region.feeField]}
                      disabled={!enabled}
                      onChange={e => applyChange({ [region.feeField]: e.target.value })}
                      style={{ width: '140px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {enabled && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => setOpenStateLists(prev => ({ ...prev, [region.code]: !prev[region.code] }))}
                      aria-expanded={listOpen}
                      aria-controls={listId}
                      disabled={catalogLoading || regionStates.length === 0}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minHeight: '44px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: deliverableCount < regionStates.length ? '#b45309' : '#64748b' }}
                    >
                      {catalogLoading
                        ? 'Loading states…'
                        : `Delivering to ${deliverableCount} of ${regionStates.length} states · Choose states`}
                      <ChevronDown size={14} style={{ transform: listOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {listOpen && (
                      <fieldset id={listId} style={{ border: 'none', margin: '0.6rem 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.4rem 0.75rem' }}>
                        <legend style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.35rem' }}>
                          Untick states in {REGION_LABELS[region.code]} you don't deliver to
                        </legend>
                        {regionStates.map(state => {
                          const stateId = `deliver-${state.code}`;
                          return (
                            <label key={state.code} htmlFor={stateId} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minHeight: '44px', fontSize: '0.78rem', color: '#1b2d2a', cursor: 'pointer' }}>
                              <input
                                id={stateId}
                                type="checkbox"
                                checked={!form.excluded_states.includes(state.code)}
                                onChange={e => toggleState(state.code, e.target.checked)}
                                style={{ accentColor: brandColor, width: '15px', height: '15px' }}
                              />
                              {state.name}
                            </label>
                          );
                        })}
                      </fieldset>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {error && (
            <div role="alert" style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', borderRadius: '6px' }}>{error}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: brandColor, color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save Delivery Regions'}
            </button>
            {hasUnsavedChanges
              ? <span role="status" style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>Unsaved changes</span>
              : saved && <span role="status" style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}
