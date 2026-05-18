import { useState } from 'react';

/**
 * Reusable pagination bar.
 *
 * Props:
 *   page          – current page (1-based)
 *   totalPages    – total number of pages
 *   totalItems    – total item count (for "Showing X–Y of Z")
 *   pageSize      – items per page
 *   onPageChange  – (newPage: number) => void
 *   onPageSizeChange – optional (newSize: number) => void
 *   pageSizeOptions  – optional array of numbers, e.g. [10, 20, 50]
 *   onScrollTop   – optional () => void called after page change (default scrolls to 0)
 */
export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  onScrollTop,
}) {
  const [jumpInput, setJumpInput] = useState('');

  if (totalPages <= 1 && !onPageSizeChange) return null;

  const scrollTop = onScrollTop ?? (() => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const go = (p) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped !== page) {
      onPageChange(clamped);
      scrollTop();
    }
  };

  const handleJump = (e) => {
    e.preventDefault();
    const n = parseInt(jumpInput, 10);
    if (Number.isFinite(n)) go(n);
    setJumpInput('');
  };

  // Build page number array with ellipsis
  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, page]);
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.add(i);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
      result.push(p);
    });
    return result;
  })();

  const from = totalItems != null ? Math.min((page - 1) * pageSize + 1, totalItems) : null;
  const to = totalItems != null ? Math.min(page * pageSize, totalItems) : null;

  const btnBase = {
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.12s',
    fontFamily: 'var(--font-sans)',
    lineHeight: 1,
  };
  const btnDisabled = { ...btnBase, opacity: 0.35, cursor: 'not-allowed' };
  const btnActive = { ...btnBase, backgroundColor: '#1b2d2a', color: 'white', border: '1px solid #1b2d2a' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 0', marginTop: '1rem' }}>

      {/* Left: count info + per-page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {totalItems != null && from != null && (
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Showing {from}–{to} of {totalItems}
          </span>
        )}
        {onPageSizeChange && pageSizeOptions && (
          <select
            value={pageSize}
            onChange={e => { onPageSizeChange(Number(e.target.value)); go(1); }}
            style={{ padding: '0.35rem 0.5rem', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#475569', cursor: 'pointer', outline: 'none', backgroundColor: 'white' }}
          >
            {pageSizeOptions.map(s => <option key={s} value={s}>{s} per page</option>)}
          </select>
        )}
      </div>

      {/* Center: page buttons */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
          <button style={page === 1 ? btnDisabled : btnBase} disabled={page === 1} onClick={() => go(page - 1)}>← Prev</button>

          {pageNumbers.map((num, idx) =>
            num === '…' ? (
              <span key={`ellipsis-${idx}`} style={{ padding: '0 0.2rem', color: '#94a3b8', fontSize: '0.85rem', userSelect: 'none' }}>…</span>
            ) : (
              <button
                key={num}
                onClick={() => go(num)}
                style={page === num ? btnActive : btnBase}
              >
                {num}
              </button>
            )
          )}

          <button style={page === totalPages ? btnDisabled : btnBase} disabled={page === totalPages} onClick={() => go(page + 1)}>Next →</button>
        </div>
      )}

      {/* Right: go-to-page input */}
      {totalPages > 4 && (
        <form onSubmit={handleJump} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>Go to</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpInput}
            onChange={e => setJumpInput(e.target.value)}
            placeholder={String(page)}
            style={{ width: '52px', padding: '0.4rem 0.5rem', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.78rem', textAlign: 'center', outline: 'none' }}
          />
          <button type="submit" style={{ ...btnBase, padding: '0.4rem 0.65rem' }}>Go</button>
        </form>
      )}
    </div>
  );
}
