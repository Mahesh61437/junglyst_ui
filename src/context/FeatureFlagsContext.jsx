import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Feature flags fetched at app boot from /api/core/features/.
 *
 * Defaults to all-OFF until the network call completes — this is the safer
 * direction for in-progress modules (a flash of nothing is better than a
 * flash of half-built UI we then yank away).
 *
 * Build-time fallback: VITE_FEATURE_COMMUNITY_ENABLED=true forces the
 * community flag on locally without needing a backend running.
 */
const DEFAULT_FLAGS = {
  community: import.meta.env.VITE_FEATURE_COMMUNITY_ENABLED === 'true',
};

const FeatureFlagsContext = createContext({
  flags: DEFAULT_FLAGS,
  loaded: false,
});

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/core/features/')
      .then((res) => {
        if (cancelled) return;
        // Merge so missing keys keep their defaults instead of going undefined.
        setFlags((prev) => ({ ...prev, ...(res.data || {}) }));
      })
      .catch(() => {
        // Network errors leave the defaults in place — fail closed.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loaded }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function useFeatureFlag(name) {
  const { flags } = useFeatureFlags();
  return !!flags[name];
}
