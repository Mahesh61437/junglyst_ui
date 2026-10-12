import { useCallback, useEffect, useState } from 'react';

const EMPTY_PAGE = { results: [], count: 0, next: null };

/**
 * Paginated fetch keyed on a params object. Changing params jumps back to
 * page 1; loading/error are derived from which request the data belongs to,
 * so no state is reset synchronously inside the effect.
 *
 * `fetchPage` must be stable (module-level or memoised).
 */
export function usePagedFetch(fetchPage, params) {
  const paramsKey = JSON.stringify(params);
  const [pageState, setPageState] = useState({ key: paramsKey, page: 1 });
  const page = pageState.key === paramsKey ? pageState.page : 1;
  const requestKey = `${paramsKey}|${page}`;
  const [result, setResult] = useState({ key: null, data: EMPTY_PAGE, failed: false });

  useEffect(() => {
    let active = true;
    fetchPage({ ...JSON.parse(paramsKey), page })
      .then(data => { if (active) setResult({ key: requestKey, data, failed: false }); })
      .catch(() => { if (active) setResult(prev => ({ key: requestKey, data: prev.data, failed: true })); });
    return () => { active = false; };
  }, [fetchPage, paramsKey, page, requestKey]);

  const setPage = useCallback((next) => setPageState({ key: paramsKey, page: next }), [paramsKey]);
  const replaceRow = useCallback((row) => setResult(prev => ({
    ...prev, data: { ...prev.data, results: prev.data.results.map(r => (r.id === row.id ? row : r)) },
  })), []);

  return {
    data: result.data,
    loading: result.key !== requestKey,
    failed: result.key === requestKey && result.failed,
    page,
    setPage,
    replaceRow,
  };
}
