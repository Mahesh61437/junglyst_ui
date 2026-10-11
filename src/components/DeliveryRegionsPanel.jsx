import { useEffect, useId, useImperativeHandle, useMemo, useState } from 'react';
import { ChevronDown, MapPin, Tags } from 'lucide-react';
import api from '../services/api';
import { useRegion } from '../context/RegionContext';
import { getApiErrorMessage } from '../utils/apiError';
import { REGION_LABELS } from '../utils/deliveryRegion';

const MAX_REGION_FEE = 5000;

const REGIONS = [
  { code: 'south', shipsField: 'ships_to_south', feeField: 'delivery_fee_south', shortLabel: 'South' },
  { code: 'north', shipsField: 'ships_to_north', feeField: 'delivery_fee_north', shortLabel: 'North' },
  { code: 'north_east', shipsField: 'ships_to_north_east', feeField: 'delivery_fee_north_east', shortLabel: 'North East' },
];
const ALL_REGION_CODES = REGIONS.map(r => r.code);

const toFormState = (data) => ({
  ...Object.fromEntries(REGIONS.flatMap(r => [
    [r.shipsField, data[r.shipsField] ?? true],
    [r.feeField, data[r.feeField] == null ? '' : String(Number(data[r.feeField]))],
  ])),
  excluded_states: data.excluded_states || [],
  // { [categoryId]: regions[] } — only categories narrowed below "all regions"
  category_regions: Object.fromEntries((data.category_regions || []).map(rule => [rule.category_id, rule.regions])),
});

// Every category can carry a rule; `sellsIn` marks the ones the seller lists products in.
const toCategoryOptions = (data) => {
  const sellsIn = new Set((data.seller_categories || []).map(c => c.id));
  const byId = new Map([...(data.all_categories || []), ...(data.seller_categories || [])].map(c => [c.id, c.name]));
  for (const rule of data.category_regions || []) byId.set(rule.category_id, rule.category_name);
  return [...byId]
    .map(([id, name]) => ({ id, name, sellsIn: sellsIn.has(id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

function validate(form, statesByRegion, categoryOptions) {
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
  const emptyCategory = categoryOptions.find(c => form.category_regions[c.id]?.length === 0);
  if (emptyCategory) return `Choose at least one region for ${emptyCategory.name}.`;
  return null;
}

function toPayload(form) {
  return {
    ...Object.fromEntries(REGIONS.flatMap(r => [
      [r.shipsField, form[r.shipsField]],
      [r.feeField, form[r.feeField] === '' ? null : form[r.feeField]],
    ])),
    excluded_states: form.excluded_states,
    category_regions: Object.entries(form.category_regions)
      .filter(([, regions]) => regions.length < ALL_REGION_CODES.length)
      .map(([categoryId, regions]) => ({ category_id: Number(categoryId), regions })),
  };
}

/**
 * Delivery settings for one seller: regions they deliver to, states inside those
 * regions they don't, per-category region restrictions (e.g. plants to South
 * India only) and an optional flat fee per region (blank → standard slabs).
 *
 * Used by the seller (own profile) and, with `sellerProfileId`, by superadmins.
 * Has its own save button and exposes `saveIfChanged()` through `ref` so a
 * surrounding form's save can persist it too.
 */
export default function DeliveryRegionsPanel({ brandColor, ref, sellerProfileId = null }) {
  const endpoint = sellerProfileId
    ? `/sellers/profiles/${sellerProfileId}/delivery-regions/`
    : '/sellers/delivery-regions/';
  const idPrefix = useId();
  const { states, catalogLoading } = useRegion();
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState(null); // last state the server confirmed
  const [categoryOptions, setCategoryOptions] = useState([]);
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

  const applyServerData = (data) => {
    const confirmed = toFormState(data);
    setForm(confirmed);
    setSavedForm(confirmed);
    setCategoryOptions(toCategoryOptions(data));
  };

  useEffect(() => {
    let cancelled = false;
    api.get(endpoint)
      .then(res => { if (!cancelled) applyServerData(res.data); })
      .catch(err => { if (!cancelled) setLoadError(getApiErrorMessage(err, 'Could not load delivery regions.')); });
    return () => { cancelled = true; };
  }, [endpoint]);

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

  const toggleCategoryRegion = (categoryId, regionCode) => {
    const current = form.category_regions[categoryId] || ALL_REGION_CODES;
    const next = current.includes(regionCode)
      ? current.filter(code => code !== regionCode)
      : ALL_REGION_CODES.filter(code => code === regionCode || current.includes(code));
    const categoryRegions = { ...form.category_regions };
    if (next.length === ALL_REGION_CODES.length) delete categoryRegions[categoryId];
    else categoryRegions[categoryId] = next;
    applyChange({ category_regions: categoryRegions });
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
    const validationError = validate(form, statesByRegion, categoryOptions);
    if (validationError) { setError(validationError); return false; }
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch(endpoint, toPayload(form));
      applyServerData(res.data);
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
        Buyers only see products that can be delivered to their state. Untick any states inside a region you can't deliver to. Set a flat delivery fee per region, or leave it blank to use the standard shipping slabs.
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
              alignSelf: 'flex-start', minHeight: '44px', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
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
            const checkboxId = `${idPrefix}-ships-${region.code}`;
            const feeId = `${idPrefix}-fee-${region.code}`;
            const listId = `${idPrefix}-states-${region.code}`;
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
                          const stateId = `${idPrefix}-deliver-${state.code}`;
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

          <CategoryRestrictions
            brandColor={brandColor}
            categories={categoryOptions}
            categoryRegions={form.category_regions}
            storeRegions={REGIONS.filter(r => form[r.shipsField]).map(r => r.code)}
            onToggle={toggleCategoryRegion}
          />

          {error && (
            <div role="alert" style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', borderRadius: '6px' }}>{error}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{ minHeight: '44px', padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: brandColor, color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: saving ? 'not-allowed' : 'pointer' }}
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

/** Per-category region chips: all on = follows the store; fewer = restricted. */
function CategoryRestrictions({ brandColor, categories, categoryRegions, storeRegions, onToggle }) {
  const [showOthers, setShowOthers] = useState(false);
  // Categories the seller sells in, or that already carry a rule, are always shown;
  // the rest sit behind a toggle so the list stays short on phones.
  const isPrimary = category => category.sellsIn || !!categoryRegions[category.id];
  const primary = categories.filter(isPrimary);
  const others = categories.filter(category => !isPrimary(category));
  const visible = showOthers ? [...primary, ...others] : primary;

  return (
    <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#1b2d2a' }}>
        <Tags size={13} /> Category restrictions
      </div>
      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0.3rem 0 0.6rem' }}>
        Limit any category to fewer regions — for example, plants to South India only. A category can't go beyond the regions ticked above. Rules apply to products added later too.
      </p>

      {categories.length === 0 ? (
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
          No categories available yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {visible.map(category => {
            const selected = categoryRegions[category.id] || ALL_REGION_CODES;
            const restricted = selected.length < ALL_REGION_CODES.length;
            return (
              <div
                key={category.id}
                role="group"
                aria-label={`Delivery regions for ${category.name}`}
                style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.5rem 0', borderTop: '1px solid #f1f5f9' }}
              >
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1b2d2a' }}>{category.name}</div>
                  <div style={{ fontSize: '0.68rem', color: restricted ? '#b45309' : '#64748b' }}>
                    {restricted
                      ? `Only ${selected.map(code => REGION_LABELS[code]).join(', ')}`
                      : 'Follows the store regions'}
                    {!category.sellsIn && ' · No products yet'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {REGIONS.map(region => {
                    const on = selected.includes(region.code);
                    const storeServes = storeRegions.includes(region.code);
                    return (
                      <button
                        key={region.code}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onToggle(category.id, region.code)}
                        title={storeServes ? undefined : 'The store doesn’t deliver here — tick the region above first'}
                        style={{
                          minHeight: '44px', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                          cursor: 'pointer', border: '1.5px solid',
                          backgroundColor: on ? brandColor : 'white',
                          color: on ? 'white' : '#64748b',
                          borderColor: on ? brandColor : '#e2e8f0',
                          opacity: storeServes ? 1 : 0.45,
                          textDecoration: storeServes ? 'none' : 'line-through',
                        }}
                      >
                        {region.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {others.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOthers(open => !open)}
              aria-expanded={showOthers}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minHeight: '44px', marginTop: '0.25rem', background: 'none', border: 'none', borderTop: '1px solid #f1f5f9', padding: 0, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}
            >
              {showOthers ? 'Hide other categories' : `Show other categories (${others.length})`}
              <ChevronDown size={14} style={{ transform: showOthers ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
