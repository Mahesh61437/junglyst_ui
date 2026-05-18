import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Saves scroll position when leaving a page and restores it when coming back
 * via browser back/forward (POP navigation).
 *
 * @param {boolean} isReady - Set to true once async content has loaded so the
 *   page has its full height before we try to scroll.
 */
export function useScrollRestoration(isReady = true) {
  const location = useLocation();
  const navType = useNavigationType();
  const key = `scroll:${location.key}`;

  // Save current scroll Y when navigating away from this page
  useEffect(() => {
    return () => {
      sessionStorage.setItem(key, String(Math.round(window.scrollY)));
    };
  }, [key]);

  // Restore scroll position after content is ready, only on back/forward nav
  useEffect(() => {
    if (navType !== 'POP' || !isReady) return;
    const saved = sessionStorage.getItem(key);
    if (!saved) return;
    const y = parseInt(saved, 10);
    if (!Number.isFinite(y) || y <= 0) return;
    // Two RAFs: first ensures layout is committed, second ensures images/fonts
    // have shifted the page height before we jump.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: 'instant' });
      });
    });
  }, [navType, isReady, key]);
}
