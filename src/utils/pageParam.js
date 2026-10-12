// Listing pages keep their current page in the URL (?page=N) so that back
// navigation, refresh and shared links land on the same page. Page 1 is the
// clean URL with no param.

export const PAGE_PARAM = 'page';

/** Parse a ?page= value into a page number >= 1 (anything invalid → 1). */
export function parsePageParam(value) {
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}

/** Return a copy of `searchParams` pointing at `page`; page 1 drops the param. */
export function withPageParam(searchParams, page) {
  const next = new URLSearchParams(searchParams);
  if (page > 1) next.set(PAGE_PARAM, String(page));
  else next.delete(PAGE_PARAM);
  return next;
}
