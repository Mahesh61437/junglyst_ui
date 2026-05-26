import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export function useScrollRestoration(isReady = true) {
  const location = useLocation();
  const navType = useNavigationType();
  const key = `scroll:${location.key}`;

  // Continuously save scroll position as the user scrolls.
  // Using an event listener (not a React cleanup) avoids React StrictMode's
  // double-invoke writing scrollY=0 and overwriting the real saved position.
  useEffect(() => {
    const save = () => {
      sessionStorage.setItem(key, String(Math.round(window.scrollY)));
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [key]);

  // Restore scroll position after content is ready, only on back/forward nav.
  useEffect(() => {
    if (navType !== 'POP' || !isReady) return;
    const saved = sessionStorage.getItem(key);
    if (!saved) return;
    const y = parseInt(saved, 10);
    if (!Number.isFinite(y) || y <= 0) return;

    // Retry loop: keeps attempting until scrollY matches or page content settles.
    // Two RAFs first to let React commit layout and images shift page height.
    let attempts = 0;
    const tryScroll = () => {
      window.scrollTo({ top: y, behavior: 'instant' });
      if (Math.round(window.scrollY) !== y && attempts < 8) {
        attempts++;
        requestAnimationFrame(tryScroll);
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(tryScroll));
  }, [navType, isReady, key]);
}
