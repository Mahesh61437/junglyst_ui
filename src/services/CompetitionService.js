import { useEffect, useState } from 'react';
import api from './api';

export const DEFAULT_LAUNCH_DATE = new Date('2026-06-01T00:00:00+05:30');

// Always render competition dates in IST so the value matches whatever the
// admin entered in settings, regardless of the viewer's locale.
export function formatAnnouncementDate(raw) {
  if (!raw) return null;
  // Backend normalizes to 'YYYY-MM-DD'. Anchor at IST midnight so the day
  // doesn't shift in other timezones.
  const d = new Date(`${raw}T00:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

let cachedStatus = null;
let inflight = null;
const listeners = new Set();

function fetchStatus() {
  if (inflight) return inflight;
  inflight = api.get('/competition/status/')
    .then(r => {
      cachedStatus = r.data || null;
      listeners.forEach(fn => fn(cachedStatus));
      return cachedStatus;
    })
    .catch(() => {
      cachedStatus = cachedStatus || {};
      return cachedStatus;
    })
    .finally(() => { inflight = null; });
  return inflight;
}

export function useCompetitionStatus() {
  const [status, setStatus] = useState(cachedStatus);

  useEffect(() => {
    listeners.add(setStatus);
    if (cachedStatus == null) fetchStatus();
    return () => { listeners.delete(setStatus); };
  }, []);

  return status;
}

export function getLaunchDate(status) {
  const raw = status?.launch_date;
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return DEFAULT_LAUNCH_DATE;
}

// ── Entries / Voting / Winners ──────────────────────────────────────────────

// Short client-side cache so re-opening the gallery (or toggling sorts back and
// forth) is instant and doesn't re-hit the API — the images stay warm in the
// browser HTTP cache too. In-flight requests are de-duped per sort key.
const ENTRIES_CACHE_TTL_MS = 20000;
const entriesCache = new Map();   // sort -> { data, ts }
const entriesInflight = new Map(); // sort -> Promise

export function clearEntriesCache() {
  entriesCache.clear();
}

export async function fetchEntries({ sort = 'top', limit = 200, force = false } = {}) {
  const now = Date.now();
  if (!force) {
    const hit = entriesCache.get(sort);
    if (hit && now - hit.ts < ENTRIES_CACHE_TTL_MS) return hit.data;
    if (entriesInflight.has(sort)) return entriesInflight.get(sort);
  }
  const p = api.get('/competition/entries/', { params: { sort, limit } })
    .then((r) => { entriesCache.set(sort, { data: r.data, ts: Date.now() }); return r.data; })
    .finally(() => entriesInflight.delete(sort));
  entriesInflight.set(sort, p);
  return p;
}

export async function toggleVote(entryId) {
  const { data } = await api.post(`/competition/entries/${entryId}/vote/`);
  // The cached entries lists now hold a stale has_voted/vote_count for this user
  // — drop them so the next fresh load reflects the vote.
  clearEntriesCache();
  return data; // { voted, vote_count, entry_id }
}

export async function fetchWinners() {
  const { data } = await api.get('/competition/winners/');
  return data;
}

export const PRIZE_LABELS = {
  first: '1st Place',
  second: '2nd Place',
  third: '3rd Place',
  consolation: '4th — Consolation',
  mystery: 'Mystery Box',
};

export const PRIZE_COLORS = {
  first: '#c9972b',
  second: '#cbd5e1',
  third: '#b87333',
  consolation: '#94a3b8',
  mystery: '#a855f7',
};

