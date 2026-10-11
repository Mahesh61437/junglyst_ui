// Buyer delivery region helpers. The state → region mapping itself lives on the
// backend (GET /shipping/regions/) so it has a single source of truth.

export const REGION_STORAGE_KEY = 'junglyst_delivery_region';

export const REGION_LABELS = {
  south: 'South India',
  north: 'North India',
  north_east: 'North East India',
};

const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const GEOLOCATION_TIMEOUT_MS = 10000;
// A coarse fix is plenty to identify a state, and is faster / cheaper on battery.
const GEOLOCATION_MAX_AGE_MS = 30 * 60 * 1000;

export class LocationLookupError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason; // 'denied' | 'unavailable' | 'outside'
  }
}

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Find a state by its name, code, or alias (e.g. "A.P", "Tamil Nadu", "IN-KA"). */
export function findState(states, query) {
  const key = normalize(String(query || '').replace(/^IN-/i, ''));
  if (!key) return null;
  return states.find(state =>
    [state.code, state.name, ...(state.aliases || [])].some(candidate => normalize(candidate) === key)
  ) || null;
}

/** Saved selection from a previous session, or null. Tolerates blocked/corrupt storage. */
export function loadSavedRegion() {
  try {
    const saved = JSON.parse(localStorage.getItem(REGION_STORAGE_KEY) || 'null');
    if (saved && REGION_LABELS[saved.region] && saved.stateName) return saved;
  } catch {
    // Storage unavailable (private mode) or malformed — treat as no selection.
  }
  return null;
}

export function saveRegion(selection) {
  try {
    localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // Selection still applies for this session; it just won't persist.
  }
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: GEOLOCATION_MAX_AGE_MS,
    });
  });
}

/**
 * Ask the browser for the buyer's location and resolve it to one of `states`.
 * Throws LocationLookupError so the UI can fall
 * back to manual selection with a helpful message.
 */
export async function detectStateFromLocation(states) {
  let position;
  try {
    position = await getBrowserPosition();
  } catch (error) {
    throw new LocationLookupError(error?.code === 1 ? 'denied' : 'unavailable');
  }

  const { latitude, longitude } = position.coords;
  const params = new URLSearchParams({ latitude, longitude, localityLanguage: 'en' });
  let place;
  try {
    const response = await fetch(`${REVERSE_GEOCODE_URL}?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    place = await response.json();
  } catch {
    throw new LocationLookupError('unavailable');
  }

  if (place.countryCode && place.countryCode !== 'IN') throw new LocationLookupError('outside');
  const state = findState(states, place.principalSubdivision) || findState(states, place.principalSubdivisionCode);
  if (!state) throw new LocationLookupError('unavailable');
  return state;
}

/** Add the buyer's delivery area ({ region, stateCode }) to product-list query params. */
export function withDeliveryArea(params, area) {
  if (!area?.region) return params;
  return area.stateCode ? { ...params, region: area.region, state: area.stateCode } : { ...params, region: area.region };
}

/**
 * Label of the buyer's area a seller can't deliver to — their region, or an
 * excluded state inside it — or null when they can (or we don't know yet).
 * `delivery` is any { service_regions, excluded_states } shape (cart configs, seller profile).
 */
export function undeliverableAreaLabel(delivery, area) {
  if (!Array.isArray(delivery?.service_regions) || !area?.region) return null;
  if (!delivery.service_regions.includes(area.region)) return REGION_LABELS[area.region];
  if (area.stateCode && (delivery.excluded_states || []).includes(area.stateCode)) {
    return area.stateName || area.stateCode;
  }
  return null;
}
