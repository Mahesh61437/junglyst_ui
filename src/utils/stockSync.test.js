import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyMessage,
  buildPreviewPayload,
  buyerPrice,
  importMessage,
  initialNewProductSelection,
  isStockEstimated,
  isValidEmail,
  requestErrorMessage,
  selectAll,
  selectedKeys,
  skippedNotice,
  SYNC_SOURCES,
  syncNotices,
  toPercent,
} from './stockSync.js';

test('sources default to a 14% markup for Himadri only', () => {
  const byKey = Object.fromEntries(SYNC_SOURCES.map((s) => [s.key, s.defaults]));
  assert.equal(byKey.himadri.markup, '14');
  assert.equal(byKey.petkadai.markup, '0');
  assert.equal(byKey.petkadai.seller, '10');
});

test('every source is pre-filled with a valid seller email', () => {
  const emails = Object.fromEntries(SYNC_SOURCES.map((s) => [s.key, s.sellerEmail]));
  assert.equal(emails.petkadai, 'Support@petkadai.com');
  assert.equal(emails.himadri, 'himadriaquatics@gmail.com');
  SYNC_SOURCES.forEach((s) => assert.equal(isValidEmail(s.sellerEmail), true, s.key));
});

test('isValidEmail accepts normal addresses and rejects blanks and junk', () => {
  assert.equal(isValidEmail('Support@petkadai.com'), true);
  assert.equal(isValidEmail('  himadriaquatics@gmail.com '), true);
  for (const bad of ['', '   ', null, undefined, 'no-at-sign', 'a@b', 'a b@c.com']) {
    assert.equal(isValidEmail(bad), false, String(bad));
  }
});

test('toPercent parses, defaults to 0 and stays within 0-100', () => {
  assert.equal(toPercent('12.5'), 12.5);
  assert.equal(toPercent(''), 0);
  assert.equal(toPercent('abc'), 0);
  assert.equal(toPercent('-5'), 0);
  assert.equal(toPercent('250'), 100);
});

test('buildPreviewPayload trims the email and normalises commissions', () => {
  assert.deepEqual(
    buildPreviewPayload('himadri', ' a@b.com ', { markup: '14', seller: '10', buyer: 'x' }),
    { source: 'himadri', seller_email: 'a@b.com', source_markup: 14, seller_commission: 10, buyer_commission: 0 },
  );
});

test('buyerPrice applies the seller commission and rounds', () => {
  assert.equal(buyerPrice(100, '10'), 110);
  assert.equal(buyerPrice(99, '10'), 109);
  assert.equal(buyerPrice(100, 'oops'), 100);
});

test('selection helpers', () => {
  assert.deepEqual(selectAll([{ id: 'a' }, { id: 'b' }], (i) => i.id), { a: true, b: true });
  assert.deepEqual(selectedKeys({ a: true, b: false, c: true }), ['a', 'c']);
  assert.deepEqual(selectedKeys({}), []);
});

test('syncNotices shows the delist reason, else incomplete pages, else nothing', () => {
  assert.deepEqual(syncNotices(null), []);
  assert.deepEqual(syncNotices({ delisted: 3 }), []);
  assert.deepEqual(syncNotices({ delist_skipped: 'Scrape was incomplete (Fish Food).', scrape_incomplete: ['Fish Food'] }),
    ['Scrape was incomplete (Fish Food).']);
  const [message] = syncNotices({ delist_skipped: null, scrape_incomplete: ['1 product page(s)'] });
  assert.match(message, /1 product page\(s\)/);
});

test('new products start unselected so one click cannot import everything', () => {
  assert.deepEqual(initialNewProductSelection(), {});
  assert.deepEqual(selectedKeys(initialNewProductSelection()), []);
});

test('skippedNotice reports products left out for being out of stock, with correct grammar', () => {
  assert.equal(skippedNotice(null), null);
  assert.equal(skippedNotice({ skipped_out_of_stock: 0 }), null);
  assert.equal(skippedNotice({}), null);
  assert.match(skippedNotice({ skipped_out_of_stock: 1 }), /^1 new product was left out because it is out of stock/);
  assert.match(skippedNotice({ skipped_out_of_stock: 546 }), /^546 new products were left out because they are out of stock/);
});

test('isStockEstimated is true only when the source gave no quantity', () => {
  assert.equal(isStockEstimated({ stock_known: false }), true);
  assert.equal(isStockEstimated({ stock_known: true }), false);
  assert.equal(isStockEstimated({}), false); // older previews have no flag
});

test('apply and import messages flag backend errors', () => {
  assert.deepEqual(applyMessage({ applied: 4, errors: [] }), { ok: true, text: 'Applied 4 price update(s).' });
  const failed = importMessage({ imported: 1, errors: ['SKU X: bad'] });
  assert.equal(failed.ok, false);
  assert.match(failed.text, /Imported 1 new product\(s\)\. Errors: SKU X: bad/);
});

test('requestErrorMessage prefers the API error text', () => {
  assert.equal(requestErrorMessage({ response: { data: { error: 'seller_email is required.' } } }, 'fallback'),
    'seller_email is required.');
  assert.equal(requestErrorMessage(new Error('network'), 'Sync failed'), 'Sync failed');
});
