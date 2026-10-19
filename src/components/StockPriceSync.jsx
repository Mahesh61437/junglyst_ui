import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import {
  applyMessage,
  buildPreviewPayload,
  buyerPrice,
  importMessage,
  initialNewProductSelection,
  isStockEstimated,
  isValidEmail,
  POLL_FIRST_CHECK_MS,
  POLL_INTERVAL_MS,
  requestErrorMessage,
  selectAll,
  selectedKeys,
  skippedNotice,
  SYNC_SOURCES,
  syncNotices,
  toPercent,
} from '../utils/stockSync';

const SYNC_API = '/analytics/super-admin/stock-sync';
const TOUCH_TARGET = '44px';

const initialCommission = () =>
  Object.fromEntries(SYNC_SOURCES.map(({ key, defaults }) => [key, { ...defaults }]));
const initialEmails = () => Object.fromEntries(SYNC_SOURCES.map(({ key, sellerEmail }) => [key, sellerEmail]));

const smallButton = {
  fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '7px',
  border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', minHeight: '32px',
};
const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' };
const hintStyle = { fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0' };
const headCell = { padding: '0.6rem 0.75rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' };

function Banner({ tone, role, children }) {
  const tones = {
    error: { backgroundColor: '#fee2e2', color: '#b91c1c' },
    info: { backgroundColor: '#f0f9ff', color: '#0369a1' },
    warning: { backgroundColor: '#fffbeb', color: '#92400e' },
    success: { backgroundColor: '#f0fdf4', color: '#166534' },
  };
  return (
    <div role={role} style={{ padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, ...tones[tone] }}>
      {children}
    </div>
  );
}

// 44px tap area around the small checkbox so rows are usable on a phone.
function RowCheckbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET, cursor: 'pointer' }}>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
    </label>
  );
}

function SelectionButtons({ onSelectAll, onClear }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button type="button" onClick={onSelectAll} style={smallButton}>Select all</button>
      <button type="button" onClick={onClear} style={smallButton}>Clear all</button>
    </div>
  );
}

export default function StockPriceSync() {
  const [lastSynced, setLastSynced] = useState({});
  const [commission, setCommission] = useState(initialCommission);
  const [sellerEmail, setSellerEmail] = useState(initialEmails);

  const [activeSource, setActiveSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [approvedPrices, setApprovedPrices] = useState({});
  const [applying, setApplying] = useState(false);
  const [applyNote, setApplyNote] = useState(null);

  const [approvedNew, setApprovedNew] = useState({});
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState(null);

  // Bumped whenever a new sync starts or the panel unmounts, so a stale poll
  // loop can never write over a newer preview.
  const runId = useRef(0);
  const pollTimer = useRef(null);

  useEffect(() => {
    api.get(`${SYNC_API}/status/`)
      .then((res) => setLastSynced(res.data || {}))
      .catch(() => { /* non-critical */ });
    return () => {
      runId.current += 1;
      clearTimeout(pollTimer.current);
    };
  }, []);

  const startSync = async (source) => {
    runId.current += 1;
    const myRun = runId.current;
    clearTimeout(pollTimer.current);
    setActiveSource(source);
    setLoading(true);
    setResult(null);
    setApprovedPrices({});
    setApprovedNew({});
    setApplyNote(null);
    setImportNote(null);

    const poll = async (jobId) => {
      if (myRun !== runId.current) return;
      try {
        const { data: job } = await api.get(`${SYNC_API}/job/${jobId}/`);
        if (myRun !== runId.current) return;
        setResult(job); // live progress while pending / scraping
        if (job.status === 'done') {
          setLoading(false);
          setLastSynced((previous) => ({ ...previous, [source]: job.last_synced }));
          setApprovedPrices(selectAll(job.price_changes || [], (change) => change.id));
          setApprovedNew(initialNewProductSelection());
        } else if (job.status === 'error') {
          setLoading(false);
        } else {
          pollTimer.current = setTimeout(() => poll(jobId), POLL_INTERVAL_MS);
        }
      } catch {
        if (myRun !== runId.current) return;
        setResult({ status: 'error', error: 'Failed to poll job status.' });
        setLoading(false);
      }
    };

    try {
      const { data } = await api.post(
        `${SYNC_API}/preview/`,
        buildPreviewPayload(source, sellerEmail[source], commission[source]),
      );
      pollTimer.current = setTimeout(() => poll(data.job_id), POLL_FIRST_CHECK_MS);
    } catch (error) {
      if (myRun !== runId.current) return;
      setResult({ status: 'error', error: requestErrorMessage(error, 'Sync failed') });
      setLoading(false);
    }
  };

  const applyPrices = async () => {
    const approvedIds = selectedKeys(approvedPrices);
    if (!result?.session_key) return;
    if (!approvedIds.length) { setApplyNote({ ok: false, text: 'No changes selected.' }); return; }
    setApplying(true);
    setApplyNote(null);
    try {
      const { data } = await api.post(`${SYNC_API}/apply/`, { session_key: result.session_key, approved_ids: approvedIds });
      setApplyNote(applyMessage(data));
      setResult((previous) => ({ ...previous, price_changes: [] }));
      setApprovedPrices({});
    } catch (error) {
      setApplyNote({ ok: false, text: requestErrorMessage(error, 'Apply failed.') });
    } finally {
      setApplying(false);
    }
  };

  const importProducts = async () => {
    const approvedSkus = selectedKeys(approvedNew);
    if (!result?.session_key) return;
    if (!approvedSkus.length) { setImportNote({ ok: false, text: 'No products selected.' }); return; }
    setImporting(true);
    setImportNote(null);
    const source = activeSource;
    try {
      const { data } = await api.post(`${SYNC_API}/import/`, {
        session_key: result.session_key,
        approved_skus: approvedSkus,
        seller_email: sellerEmail[source].trim(),
        seller_commission: toPercent(commission[source].seller),
      });
      setImportNote(importMessage(data));
      setResult((previous) => ({
        ...previous,
        new_products: previous.new_products.filter((product) => !approvedSkus.includes(product.sku)),
      }));
      setApprovedNew({});
    } catch (error) {
      setImportNote({ ok: false, text: requestErrorMessage(error, 'Import failed.') });
    } finally {
      setImporting(false);
    }
  };

  const done = result?.status === 'done';
  const priceChanges = result?.price_changes || [];
  const newProducts = result?.new_products || [];
  const notices = done ? syncNotices(result) : [];
  const skipped = done ? skippedNotice(result) : null;
  const noteColor = (note) => (note.ok ? '#166534' : '#b91c1c');

  return (
    <section aria-labelledby="stock-sync-heading">
      <h2 id="stock-sync-heading" style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Stock &amp; Price Sync
      </h2>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {SYNC_SOURCES.map(({ key, label }) => {
          const isRunning = activeSource === key && loading;
          const emailOk = isValidEmail(sellerEmail[key]);
          return (
            <div key={key} style={{ padding: '1rem 1.25rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--bg-deep)' }}>{label}</span>
                  {lastSynced[key] && (
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                      Last synced: {lastSynced[key]}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => startSync(key)}
                  disabled={loading || !emailOk}
                  aria-busy={isRunning}
                  style={{ padding: '0.5rem 1.25rem', minHeight: TOUCH_TARGET, borderRadius: '9px', border: 'none', backgroundColor: isRunning ? '#e2e8f0' : 'var(--bg-deep)', color: isRunning ? '#64748b' : 'white', fontWeight: 700, fontSize: '0.82rem', cursor: loading || !emailOk ? 'not-allowed' : 'pointer', opacity: (loading && !isRunning) || !emailOk ? 0.5 : 1 }}
                >
                  {isRunning ? 'Syncing…' : `Sync ${label}`}
                </button>
              </div>

              <div>
                <label htmlFor={`sync-${key}-email`} style={labelStyle}>Seller email</label>
                <input
                  id={`sync-${key}-email`}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder="seller account email"
                  value={sellerEmail[key]}
                  onChange={(event) => setSellerEmail((previous) => ({ ...previous, [key]: event.target.value }))}
                  style={{ width: '100%', minHeight: '40px', padding: '0.45rem 0.65rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                />
                <p style={hintStyle}>
                  The seller account these products belong to. Required — products of this seller that are missing from the scrape can have their stock zeroed (Pet Kadai only).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { field: 'markup', text: 'Sourcing markup %', hint: 'Applied to scraped price → base price' },
                  { field: 'seller', text: 'Seller commission %', hint: 'Applied on base price → buyer price' },
                  { field: 'buyer', text: 'Buyer commission %', hint: 'Platform cut (informational)' },
                ].map(({ field, text, hint }) => (
                  <div key={field} style={{ flex: '1 1 180px' }}>
                    <label htmlFor={`sync-${key}-${field}`} style={labelStyle}>{text}</label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                      <input
                        id={`sync-${key}-${field}`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commission[key][field]}
                        onChange={(event) => setCommission((previous) => ({ ...previous, [key]: { ...previous[key], [field]: event.target.value } }))}
                        style={{ flex: 1, minWidth: 0, minHeight: '40px', padding: '0.45rem 0.65rem', border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 700, backgroundColor: 'transparent' }}
                      />
                      <span aria-hidden="true" style={{ padding: '0 0.65rem', fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>%</span>
                    </div>
                    <p style={hintStyle}>{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {result?.status === 'error' && <Banner tone="error" role="alert">{result.error}</Banner>}

        {loading && result?.progress && <Banner tone="info" role="status">{result.progress}</Banner>}

        {notices.map((notice) => <Banner key={notice} tone="warning" role="alert">{notice}</Banner>)}

        {skipped && <Banner tone="info" role="status">{skipped}</Banner>}

        {done && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Stock updated', value: result.stock_updated, color: '#166534', bg: '#f0fdf4' },
              { label: 'Stock unchanged', value: result.stock_unchanged, color: '#64748b', bg: '#f8fafc' },
              { label: 'Delisted (→0)', value: result.delisted ?? 0, color: '#991b1b', bg: '#fef2f2' },
              { label: 'Not in DB', value: result.not_found, color: '#92400e', bg: '#fffbeb' },
              { label: 'Price changes', value: priceChanges.length, color: '#1d4ed8', bg: '#eff6ff' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ flex: '1 1 120px', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: bg, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginTop: '0.15rem' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {priceChanges.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--bg-deep)', margin: 0 }}>
                Price Changes — review &amp; approve
              </p>
              <SelectionButtons
                onSelectAll={() => setApprovedPrices(selectAll(priceChanges, (change) => change.id))}
                onClear={() => setApprovedPrices({})}
              />
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th scope="col" style={{ ...headCell, textAlign: 'left' }}>Approve</th>
                    <th scope="col" style={{ ...headCell, textAlign: 'left' }}>Product</th>
                    {['Old base', 'New base', 'Old price', 'New price', 'Change'].map((heading) => (
                      <th key={heading} scope="col" style={{ ...headCell, textAlign: 'right' }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priceChanges.map((change) => {
                    const isApproved = !!approvedPrices[change.id];
                    const up = change.change_pct > 0;
                    return (
                      <tr key={change.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isApproved ? 'white' : '#f8fafc', opacity: isApproved ? 1 : 0.5 }}>
                        <td style={{ padding: 0 }}>
                          <RowCheckbox
                            label={`Approve price change for ${change.name}`}
                            checked={isApproved}
                            onChange={(isChecked) => setApprovedPrices((previous) => ({ ...previous, [change.id]: isChecked }))}
                          />
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600, color: 'var(--bg-deep)', maxWidth: '260px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{change.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{change.sku}</div>
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: '#64748b' }}>₹{change.old_base.toFixed(2)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>₹{change.new_base.toFixed(2)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: '#64748b' }}>₹{change.old_price.toFixed(2)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>₹{change.new_price.toFixed(2)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: up ? '#fef9c3' : '#fee2e2', color: up ? '#854d0e' : '#b91c1c' }}>
                            {up ? '▲' : '▼'} {Math.abs(change.change_pct).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={applyPrices}
                disabled={applying || selectedKeys(approvedPrices).length === 0}
                style={{ padding: '0.6rem 1.5rem', minHeight: TOUCH_TARGET, borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-deep)', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: applying ? 'not-allowed' : 'pointer', opacity: applying || selectedKeys(approvedPrices).length === 0 ? 0.6 : 1 }}
              >
                {applying ? 'Applying…' : `Apply ${selectedKeys(approvedPrices).length} Selected`}
              </button>
              {applyNote && <span role="status" style={{ fontSize: '0.82rem', fontWeight: 600, color: noteColor(applyNote) }}>{applyNote.text}</span>}
            </div>
          </div>
        )}

        {done && priceChanges.length === 0 && newProducts.length === 0 && (
          <Banner tone="success" role="status">{applyNote?.text || importNote?.text || 'Stock updated. No price changes pending.'}</Banner>
        )}

        {done && newProducts.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>
                New Products — not in DB ({newProducts.length})
              </h3>
              <SelectionButtons
                onSelectAll={() => setApprovedNew(selectAll(newProducts, (product) => product.sku))}
                onClear={() => setApprovedNew({})}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Import', 'Product', 'SKU', 'Base price', 'Final price', 'Stock'].map((heading) => (
                      <th key={heading} scope="col" style={{ ...headCell, color: '#475569', textAlign: heading === 'Import' ? 'center' : 'left' }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {newProducts.map((product) => (
                    <tr key={product.sku} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 0 }}>
                        <RowCheckbox
                          label={`Import ${product.name}`}
                          checked={!!approvedNew[product.sku]}
                          onChange={(isChecked) => setApprovedNew((previous) => ({ ...previous, [product.sku]: isChecked }))}
                        />
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, maxWidth: '280px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.78rem' }}>{product.sku}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>₹{product.new_base}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--bg-deep)' }}>
                        ₹{buyerPrice(product.new_base, commission[activeSource]?.seller)}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                        {product.new_stock > 0 ? product.new_stock : <span style={{ color: '#ef4444', fontWeight: 600 }}>Out of stock</span>}
                        {isStockEstimated(product) && <span title="In stock at the source, but no quantity is shown" style={{ marginLeft: '0.35rem', fontSize: '0.68rem', color: '#92400e', fontWeight: 600 }}>count unknown</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={importProducts}
                disabled={importing || selectedKeys(approvedNew).length === 0}
                style={{ padding: '0.6rem 1.5rem', minHeight: TOUCH_TARGET, borderRadius: '10px', border: 'none', backgroundColor: '#166534', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: importing ? 'not-allowed' : 'pointer', opacity: importing || selectedKeys(approvedNew).length === 0 ? 0.6 : 1 }}
              >
                {importing ? 'Importing…' : `Import ${selectedKeys(approvedNew).length} Selected`}
              </button>
              {importNote && <span role="status" style={{ fontSize: '0.82rem', fontWeight: 600, color: noteColor(importNote) }}>{importNote.text}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
