// Pure helpers for the Stock & Price Sync panel in the super admin dashboard.

export const SYNC_SOURCES = [
  { key: 'petkadai', label: 'Pet Kadai', defaults: { markup: '0', seller: '10', buyer: '0' } },
  { key: 'himadri', label: 'Himadri', defaults: { markup: '14', seller: '10', buyer: '0' } },
];

export const POLL_FIRST_CHECK_MS = 2000;
export const POLL_INTERVAL_MS = 3000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => EMAIL_PATTERN.test((value || '').trim());

// Commission fields are free text; anything unparseable counts as 0 and the
// value is held inside 0–100 so a typo can't produce a negative or >100% price.
export const toPercent = (value) => {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
};

export const buildPreviewPayload = (source, sellerEmail, commission) => ({
  source,
  seller_email: (sellerEmail || '').trim(),
  source_markup: toPercent(commission.markup),
  seller_commission: toPercent(commission.seller),
  buyer_commission: toPercent(commission.buyer),
});

export const buyerPrice = (newBase, sellerCommission) =>
  Math.round(newBase * (1 + toPercent(sellerCommission) / 100));

export const selectedKeys = (selection) =>
  Object.entries(selection).filter(([, isSelected]) => isSelected).map(([key]) => key);

export const selectAll = (items, keyOf) =>
  Object.fromEntries(items.map((item) => [keyOf(item), true]));

// Warnings the backend attaches when it declined to zero stock, or could not
// read part of the source site. delist_skipped already names incomplete
// categories, so scrape_incomplete is only shown on its own when it is not.
export const syncNotices = (result) => {
  if (!result) return [];
  if (result.delist_skipped) return [result.delist_skipped];
  if (result.scrape_incomplete?.length) {
    return [
      `Part of the source site could not be read (${result.scrape_incomplete.join(', ')}). `
      + 'Some products may be missing from this preview.',
    ];
  }
  return [];
};

export const applyMessage = (response) => ({
  ok: !response.errors?.length,
  text: `Applied ${response.applied} price update(s).`
    + (response.errors?.length ? ` Errors: ${response.errors.join(', ')}` : ''),
});

export const importMessage = (response) => ({
  ok: !response.errors?.length,
  text: `Imported ${response.imported} new product(s).`
    + (response.errors?.length ? ` Errors: ${response.errors.join(', ')}` : ''),
});

export const requestErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;
