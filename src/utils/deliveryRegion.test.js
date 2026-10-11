import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  REGION_STORAGE_KEY, LocationLookupError, findState, loadSavedRegion, saveRegion,
  detectStateFromLocation, withDeliveryArea, undeliverableAreaLabel, deliveryForProduct,
} from './deliveryRegion.js';

const STATES = [
  { code: 'AP', name: 'Andhra Pradesh', region: 'south', aliases: [] },
  { code: 'TS', name: 'Telangana', region: 'south', aliases: ['TG'] },
  { code: 'KL', name: 'Kerala', region: 'south', aliases: [] },
  { code: 'HP', name: 'Himachal Pradesh', region: 'north', aliases: [] },
  { code: 'DL', name: 'Delhi', region: 'north', aliases: ['NCT of Delhi'] },
  { code: 'AS', name: 'Assam', region: 'north_east', aliases: [] },
];

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
  };
}

describe('findState', () => {
  test('matches by name, code, alias and ISO subdivision code, ignoring case and punctuation', () => {
    assert.equal(findState(STATES, 'Andhra Pradesh').code, 'AP');
    assert.equal(findState(STATES, 'a.p').code, 'AP');
    assert.equal(findState(STATES, 'tg').code, 'TS');
    assert.equal(findState(STATES, 'IN-KL').code, 'KL');
    assert.equal(findState(STATES, 'nct of delhi').code, 'DL');
  });

  test('returns null for empty or unknown input', () => {
    for (const query of [undefined, null, '', '   ', 'Atlantis']) {
      assert.equal(findState(STATES, query), null, String(query));
    }
  });
});

describe('saved region', () => {
  let originalStorage;
  beforeEach(() => { originalStorage = globalThis.localStorage; globalThis.localStorage = memoryStorage(); });
  afterEach(() => { globalThis.localStorage = originalStorage; });

  test('round-trips a selection', () => {
    const selection = { stateCode: 'KL', stateName: 'Kerala', region: 'south', source: 'manual' };
    saveRegion(selection);
    assert.deepEqual(loadSavedRegion(), selection);
  });

  test('ignores corrupt or incomplete stored values', () => {
    for (const raw of ['not json', '{"region":"mars","stateName":"X"}', '{"region":"south"}']) {
      localStorage.setItem(REGION_STORAGE_KEY, raw);
      assert.equal(loadSavedRegion(), null, raw);
    }
  });

  test('survives storage that throws (private mode)', () => {
    globalThis.localStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    assert.equal(loadSavedRegion(), null);
    assert.doesNotThrow(() => saveRegion({ region: 'south', stateName: 'Kerala' }));
  });
});

describe('withDeliveryArea', () => {
  test('adds region and state when known', () => {
    assert.deepEqual(withDeliveryArea({ page: 1 }, { region: 'south', stateCode: 'KL' }), { page: 1, region: 'south', state: 'KL' });
  });

  test('adds region only when the state is unknown', () => {
    assert.deepEqual(withDeliveryArea({ page: 1 }, { region: 'north' }), { page: 1, region: 'north' });
  });

  test('leaves params untouched without a delivery area', () => {
    const params = { page: 2 };
    assert.equal(withDeliveryArea(params, null), params);
    assert.equal(withDeliveryArea(params, {}), params);
  });
});

describe('undeliverableAreaLabel', () => {
  const southExceptKerala = { service_regions: ['south'], excluded_states: ['KL'] };

  test('labels the region when the seller does not serve it', () => {
    assert.equal(undeliverableAreaLabel(southExceptKerala, { region: 'north', stateCode: 'HP' }), 'North India');
  });

  test('labels the state when the seller excluded it', () => {
    assert.equal(
      undeliverableAreaLabel(southExceptKerala, { region: 'south', stateCode: 'KL', stateName: 'Kerala' }),
      'Kerala',
    );
  });

  test('null when the seller delivers there', () => {
    assert.equal(undeliverableAreaLabel(southExceptKerala, { region: 'south', stateCode: 'AP' }), null);
  });

  test('null when delivery info or buyer area is unknown (never blocks on missing data)', () => {
    assert.equal(undeliverableAreaLabel(undefined, { region: 'north' }), null);
    assert.equal(undeliverableAreaLabel({}, { region: 'north' }), null);
    assert.equal(undeliverableAreaLabel(southExceptKerala, null), null);
    assert.equal(undeliverableAreaLabel({ service_regions: ['south'] }, { region: 'south', stateCode: 'KL' }), null);
  });
});

describe('detectStateFromLocation', () => {
  let originalNavigator;
  let originalFetch;
  beforeEach(() => {
    originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    globalThis.fetch = originalFetch;
  });

  function stubLocation({ position, error, place, fetchFails = false }) {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        geolocation: {
          getCurrentPosition: (onSuccess, onError) => (error ? onError(error) : onSuccess(position)),
        },
      },
    });
    globalThis.fetch = async () => {
      if (fetchFails) throw new Error('offline');
      return { ok: true, json: async () => place };
    };
  }

  const coords = { coords: { latitude: 12.97, longitude: 77.59 } };

  test('resolves the state from the reverse-geocoded subdivision name', async () => {
    stubLocation({ position: coords, place: { countryCode: 'IN', principalSubdivision: 'Kerala' } });
    assert.equal((await detectStateFromLocation(STATES)).code, 'KL');
  });

  test('falls back to the ISO subdivision code', async () => {
    stubLocation({ position: coords, place: { countryCode: 'IN', principalSubdivision: '?', principalSubdivisionCode: 'IN-AS' } });
    assert.equal((await detectStateFromLocation(STATES)).code, 'AS');
  });

  const failureCases = [
    ['denied', { error: { code: 1 } }],
    ['unavailable', { error: { code: 2 } }],
    ['unavailable', { position: coords, fetchFails: true }],
    ['outside', { position: coords, place: { countryCode: 'GB', principalSubdivision: 'England' } }],
    ['unavailable', { position: coords, place: { countryCode: 'IN', principalSubdivision: 'Nowhere' } }],
  ];
  for (const [reason, setup] of failureCases) {
    test(`reports "${reason}" (${JSON.stringify(setup).slice(0, 60)})`, async () => {
      stubLocation(setup);
      await assert.rejects(detectStateFromLocation(STATES), err => err instanceof LocationLookupError && err.reason === reason);
    });
  }

  test('reports "unavailable" when the browser has no geolocation', async () => {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
    await assert.rejects(detectStateFromLocation(STATES), err => err.reason === 'unavailable');
  });
});

describe('deliveryForProduct', () => {
  const sellerDelivery = { service_regions: ['south', 'north'], excluded_states: ['KL'], product_regions: { p1: ['south'] } };

  test('narrows regions for a category-restricted product and keeps state exclusions', () => {
    assert.deepEqual(deliveryForProduct(sellerDelivery, 'p1'), { ...sellerDelivery, service_regions: ['south'] });
  });

  test('falls back to the seller settings for other products or missing data', () => {
    assert.equal(deliveryForProduct(sellerDelivery, 'p2'), sellerDelivery);
    assert.equal(deliveryForProduct(undefined, 'p1'), undefined);
  });
});
