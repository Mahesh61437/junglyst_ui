import test from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetPresets, compactAnswers, payByInfo, deliveryAreaText, fieldKeyFrom, groupByDay, normalisePhone, quoteTotal, validateAnswers, validateBudget, validateEmail,
  validateName, validatePincode,
} from './serviceQuotes.js';

test('normalisePhone accepts Indian mobiles in common formats', () => {
  for (const raw of ['9876543210', '+91 98765-43210', '09876543210', '919876543210']) {
    assert.equal(normalisePhone(raw), '9876543210');
  }
  for (const raw of ['12345', '5876543210', '', 'abcdefghij']) assert.equal(normalisePhone(raw), null);
});

test('validateName / validateEmail / validatePincode', () => {
  assert.equal(validateName('Asha Rao'), null);
  for (const bad of ['', 'A', '12345', '<b>']) assert.ok(validateName(bad));
  assert.equal(validateEmail('a@b.co'), null);
  assert.ok(validateEmail('nope'));
  assert.equal(validatePincode('560001'), null);
  for (const bad of ['56001', '056001', 'abcdef', '']) assert.ok(validatePincode(bad));
});

test('validateBudget enforces order, positivity and ceiling', () => {
  assert.equal(validateBudget('3000', '6000'), null);
  assert.equal(validateBudget('5000', '5000'), null);
  assert.ok(validateBudget('', '100'));
  assert.ok(validateBudget('0', '100'));
  assert.ok(validateBudget('500', '100'));
  assert.ok(validateBudget('100', '99999999'));
});

test('validateAnswers checks required, number ranges and dates', () => {
  const fields = [
    { key: 'size', field_type: 'select', required: true },
    { key: 'depth', field_type: 'number', min_value: '10', max_value: '100' },
    { key: 'when', field_type: 'date' },
  ];
  assert.deepEqual(validateAnswers(fields, { size: 'M', depth: '30' }), {});
  assert.equal(validateAnswers(fields, {}).size, 'This is required.');
  assert.ok(validateAnswers(fields, { size: 'M', depth: '5' }).depth);
  assert.ok(validateAnswers(fields, { size: 'M', depth: '500' }).depth);
  assert.ok(validateAnswers(fields, { size: 'M', depth: 'x' }).depth);
  assert.ok(validateAnswers(fields, { size: 'M', when: '2000-01-01' }).when);
});

test('compactAnswers drops blanks but keeps zero', () => {
  assert.deepEqual(compactAnswers({ a: '', b: [], c: 'x', d: 0, e: null }), { c: 'x', d: 0 });
});

test('quoteTotal adds shipping and ignores a missing price', () => {
  assert.equal(quoteTotal('5000', '200'), 5200);
  assert.equal(quoteTotal('5000', ''), 5000);
  assert.equal(quoteTotal('', '200'), null);
});

test('fieldKeyFrom makes backend-valid keys', () => {
  assert.equal(fieldKeyFrom('Tank size (L)'), 'tank_size_l');
  assert.equal(fieldKeyFrom('3D style'), 'q_3d_style');
});

test('groupByDay groups consecutive items by local day and keeps order', () => {
  const at = (y, m, d, h) => new Date(y, m - 1, d, h).toISOString();
  const groups = groupByDay([
    { id: 1, created_at: at(2026, 10, 25, 18) }, { id: 2, created_at: at(2026, 10, 25, 9) },
    { id: 3, created_at: at(2026, 10, 24, 23) },
  ]);
  assert.deepEqual(groups.map(g => g.items.map(i => i.id)), [[1, 2], [3]]);
  assert.equal(groups[0].key, '2026-10-25');
  assert.deepEqual(groupByDay([]), []);
});

test('deliveryAreaText lists states and shortens long lists', () => {
  assert.equal(deliveryAreaText([]), null);
  assert.equal(deliveryAreaText(undefined), null);
  assert.equal(deliveryAreaText(['Karnataka', 'Tamil Nadu']), 'Karnataka, Tamil Nadu');
  assert.equal(deliveryAreaText(['A', 'B', 'C', 'D', 'E'], { short: true }), 'A, B, C +2 more');
  assert.equal(deliveryAreaText(['A', 'B', 'C', 'D', 'E']), 'A, B, C, D, E');
});

test('budgetPresets builds rounded, increasing ranges from the starting price', () => {
  assert.deepEqual(budgetPresets('2500'), [{ min: 2500, max: 5000 }, { min: 5000, max: 10000 }, { min: 10000, max: 20000 }]);
  assert.deepEqual(budgetPresets(null)[0], { min: 2000, max: 4000 });
  for (const preset of budgetPresets('3333')) assert.ok(preset.max > preset.min);
});

test('payByInfo describes time left and urgency', () => {
  const now = new Date('2026-10-25T10:00:00Z');
  assert.equal(payByInfo(null, now), null);
  assert.equal(payByInfo('2026-10-28T10:00:00Z', now).left, '3 days left');
  assert.equal(payByInfo('2026-10-28T10:00:00Z', now).urgent, false);
  assert.equal(payByInfo('2026-10-28T09:55:00Z', now).left, '3 days left');
  const soon = payByInfo('2026-10-25T15:30:00Z', now);
  assert.equal(soon.left, '5 hours left');
  assert.equal(soon.urgent, true);
  assert.equal(payByInfo('2026-10-25T10:20:00Z', now).left, 'less than an hour left');
  assert.equal(payByInfo('2026-10-25T09:00:00Z', now).overdue, true);
});
