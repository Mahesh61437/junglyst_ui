/**
 * Session-scoped address cache.
 *
 * Why sessionStorage (not localStorage):
 *   - Addresses can change mid-session (user adds/deletes one in Profile then
 *     goes to Checkout). sessionStorage scopes the cache to the tab, so a hard
 *     reload always starts fresh and multi-tab edits don't bleed into each other.
 *   - Keyed by user ID so switching accounts on the same device never serves
 *     another user's addresses.
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CACHE_KEY = (userId) => `junglyst_addresses_${userId}`;

function readCache(userId) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(userId, addresses) {
  try {
    sessionStorage.setItem(CACHE_KEY(userId), JSON.stringify(addresses));
  } catch {
    // sessionStorage full or unavailable — silently skip
  }
}

function clearCache(userId) {
  try {
    sessionStorage.removeItem(CACHE_KEY(userId));
  } catch {
    // ignore
  }
}

/**
 * useAddresses(user)
 *
 * Returns:
 *   addresses   — array of saved addresses ([] while loading)
 *   loading     — true on the first fetch only
 *   invalidate  — call after any mutation (POST/PUT/DELETE) to bust cache + refetch
 */
export function useAddresses(user) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAndCache = useCallback(async (userId) => {
    setLoading(true);
    try {
      const res = await api.get('/shipping/addresses/');
      const list = res.data.results ?? (Array.isArray(res.data) ? res.data : []);
      writeCache(userId, list);
      setAddresses(list);
      return list;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setAddresses([]);
      return;
    }
    const cached = readCache(user.id);
    if (cached) {
      setAddresses(cached);
    } else {
      fetchAndCache(user.id);
    }
  }, [user?.id, fetchAndCache]);

  const invalidate = useCallback(() => {
    if (!user?.id) return;
    clearCache(user.id);
    fetchAndCache(user.id);
  }, [user?.id, fetchAndCache]);

  return { addresses, loading, invalidate };
}
