import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinancials, MAX_ITEM_QUANTITY, MAX_SELLERS } from './cartFinancials.js';

const SLABS = { tier1_max: 999, tier1_fee: 99, tier2_max: 1999, tier2_fee: 49, show_nudge_products: false };

function item(id, sellerId, { price = 300, quantity = 1, stock = 10, category = 'light' } = {}) {
  return {
    id,
    quantity,
    product: { id: `p-${id}`, name: `Plant ${id}`, seller: { id: sellerId, store_name: `Store ${sellerId}` } },
    variant: { id: `v-${id}`, price, stock, item_category: category },
  };
}

function sellerConfig({ regions = ['south', 'north', 'north_east'], excluded = [], fees = {} } = {}) {
  return {
    light: SLABS,
    delivery: {
      service_regions: regions,
      excluded_states: excluded,
      region_fees: { south: null, north: null, north_east: null, ...fees },
    },
  };
}

const KERALA = { region: 'south', stateCode: 'KL', stateName: 'Kerala' };
const TAMIL_NADU = { region: 'south', stateCode: 'TN', stateName: 'Tamil Nadu' };
const HIMACHAL = { region: 'north', stateCode: 'HP', stateName: 'Himachal Pradesh' };

describe('delivery area rules', () => {
  test('flags items from a seller who does not serve the region and leaves them out of totals', () => {
    const configs = { s1: sellerConfig({ regions: ['south'] }), s2: sellerConfig() };
    const cart = calculateFinancials([item(1, 's1'), item(2, 's2')], null, configs, HIMACHAL);

    assert.equal(cart.unavailable_items.length, 1);
    const [blocked] = cart.unavailable_items;
    assert.equal(blocked.id, 1);
    assert.equal(blocked.area_blocked, true);
    assert.equal(blocked.area_label, 'North India');
    assert.equal(blocked.note, "Doesn't deliver to North India");
    assert.deepEqual(Object.keys(cart.seller_groups), ['s2']);
    assert.equal(cart.subtotal, 300);
    assert.equal(cart.total_items, 1);
  });

  test('flags items when the seller excluded the buyer state inside a served region', () => {
    const configs = { s1: sellerConfig({ regions: ['south'], excluded: ['KL'] }) };

    const inKerala = calculateFinancials([item(1, 's1')], null, configs, KERALA);
    assert.equal(inKerala.unavailable_items[0]?.area_label, 'Kerala');

    const inTamilNadu = calculateFinancials([item(1, 's1')], null, configs, TAMIL_NADU);
    assert.equal(inTamilNadu.unavailable_items.length, 0);
  });

  test('re-derives flags so an item becomes orderable again when the area changes', () => {
    const configs = { s1: sellerConfig({ regions: ['south'] }) };
    const blocked = calculateFinancials([item(1, 's1')], null, configs, HIMACHAL);
    const stillFlaggedItems = blocked.items; // what gets persisted to localStorage

    const reopened = calculateFinancials(stillFlaggedItems, null, configs, TAMIL_NADU);
    assert.equal(reopened.unavailable_items.length, 0);
    assert.equal(reopened.items[0].area_blocked, undefined);
    assert.equal(reopened.total_items, 1);
  });

  test('never blocks when delivery info or buyer area is missing', () => {
    const noDeliveryInfo = calculateFinancials([item(1, 's1')], null, { s1: { light: SLABS } }, HIMACHAL);
    assert.equal(noDeliveryInfo.unavailable_items.length, 0);

    const noArea = calculateFinancials([item(1, 's1')], null, { s1: sellerConfig({ regions: ['south'] }) }, null);
    assert.equal(noArea.unavailable_items.length, 0);
  });

  test('area block wins over a stock problem on the same item', () => {
    const configs = { s1: sellerConfig({ regions: ['south'] }) };
    const cart = calculateFinancials([item(1, 's1', { quantity: 5, stock: 2 })], null, configs, HIMACHAL);
    assert.equal(cart.unavailable_items[0].area_blocked, true);
    assert.equal(cart.unavailable_items[0].available_stock, undefined);
  });
});

describe('shipping fees', () => {
  test('uses the slab fee when no regional fee is set', () => {
    const cart = calculateFinancials([item(1, 's1')], null, { s1: sellerConfig() }, TAMIL_NADU);
    assert.equal(cart.seller_groups.s1.shipping_fee, 99);
    assert.equal(cart.grand_total, 300 + 99);
    assert.match(cart.seller_groups.s1.nudge.message, /drop shipping/);
  });

  test('a regional fee replaces the slab fee for buyers in that region only', () => {
    const configs = { s1: sellerConfig({ fees: { south: 40 } }) };

    const south = calculateFinancials([item(1, 's1')], null, configs, TAMIL_NADU);
    assert.equal(south.seller_groups.s1.shipping_fee, 40);
    assert.equal(south.seller_groups.s1.nudge, null);

    const north = calculateFinancials([item(1, 's1')], null, configs, HIMACHAL);
    assert.equal(north.seller_groups.s1.shipping_fee, 99);
  });

  test('a zero regional fee shows free shipping', () => {
    const cart = calculateFinancials([item(1, 's1')], null, { s1: sellerConfig({ fees: { south: 0 } }) }, TAMIL_NADU);
    assert.equal(cart.seller_groups.s1.shipping_fee, 0);
    assert.equal(cart.seller_groups.s1.nudge.type, 'free');
  });

  test('sums per-seller fees across sellers', () => {
    const configs = { s1: sellerConfig({ fees: { south: 40 } }), s2: sellerConfig() };
    const cart = calculateFinancials([item(1, 's1'), item(2, 's2')], null, configs, TAMIL_NADU);
    assert.equal(cart.shipping_total, 40 + 99);
    assert.equal(cart.grand_total, 600 + 139);
  });

  test('an undeliverable pincode zone charges nothing and marks delivery blocked', () => {
    const cart = calculateFinancials([item(1, 's1')], 'E', { s1: sellerConfig({ fees: { south: 40 } }) }, TAMIL_NADU);
    assert.equal(cart.shipping_total, 0);
    assert.equal(cart.delivery_blocked, true);
  });
});

describe('existing cart rules still hold', () => {
  test('flags stock shortfalls with the available quantity', () => {
    const cart = calculateFinancials([item(1, 's1', { quantity: 5, stock: 2 })], null, { s1: sellerConfig() }, TAMIL_NADU);
    assert.equal(cart.unavailable_items[0].available_stock, 2);
    assert.equal(cart.unavailable_items[0].area_blocked, undefined);
  });

  test('clamps quantities above the per-item maximum', () => {
    const cart = calculateFinancials([item(1, 's1', { quantity: MAX_ITEM_QUANTITY + 5, stock: 99 })], null, {}, null);
    assert.equal(cart.items[0].quantity, MAX_ITEM_QUANTITY);
  });

  test('reports the seller limit', () => {
    const items = Array.from({ length: MAX_SELLERS }, (_, i) => item(i, `s${i}`));
    assert.equal(calculateFinancials(items, null, {}, null).sellers_at_limit, true);
  });

  test('handles empty and invalid input', () => {
    assert.equal(calculateFinancials([], null, {}, null).total_items, 0);
    assert.equal(calculateFinancials(undefined, null, {}, null).total_items, 0);
    assert.equal(calculateFinancials('nope', null, {}, null).total_items, 0);
  });
});

describe('category-restricted products', () => {
  test('a product limited to the south is blocked in the north while the seller\'s other products are not', () => {
    const configs = { s1: sellerConfig() };
    configs.s1.delivery.product_regions = { 'p-1': ['south'] };

    const cart = calculateFinancials([item(1, 's1'), item(2, 's1')], null, configs, HIMACHAL);

    assert.deepEqual(cart.unavailable_items.map(i => i.id), [1]);
    assert.equal(cart.unavailable_items[0].area_label, 'North India');
    assert.equal(cart.total_items, 1);
  });

  test('the restricted product is orderable inside its regions', () => {
    const configs = { s1: sellerConfig() };
    configs.s1.delivery.product_regions = { 'p-1': ['south'] };

    const cart = calculateFinancials([item(1, 's1')], null, configs, TAMIL_NADU);

    assert.equal(cart.unavailable_items.length, 0);
  });

  test('state exclusions still apply to category-restricted products', () => {
    const configs = { s1: sellerConfig({ excluded: ['KL'] }) };
    configs.s1.delivery.product_regions = { 'p-1': ['south'] };

    const cart = calculateFinancials([item(1, 's1')], null, configs, KERALA);

    assert.equal(cart.unavailable_items[0]?.area_label, 'Kerala');
  });
});
