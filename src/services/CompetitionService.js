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

export async function fetchEntries({ sort = 'top', limit = 200 } = {}) {
  const { data } = await api.get('/competition/entries/', { params: { sort, limit } });
  return data;
}

export async function toggleVote(entryId) {
  const { data } = await api.post(`/competition/entries/${entryId}/vote/`);
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

