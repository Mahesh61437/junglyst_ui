import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

const STORAGE_KEY = 'junglyst_wishlist';

function isLoggedIn() {
  return !!localStorage.getItem('junglyst_token');
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist on mount — from API if logged in, else localStorage
  useEffect(() => {
    if (isLoggedIn()) {
      api.get('/core/wishlist/')
        .then(res => {
          setWishlist(res.data || []);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data || []));
        })
        .catch(() => {
          // Fall back to localStorage on API failure
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setWishlist(JSON.parse(saved));
          } catch {}
        });
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setWishlist(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const toggleWishlist = useCallback(async (product) => {
    const productId = product.id;

    if (isLoggedIn()) {
      try {
        const res = await api.post('/core/wishlist/', { product_id: productId });
        if (res.data.status === 'removed') {
          setWishlist(prev => {
            const updated = prev.filter(item => item.id !== productId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
        } else {
          // Re-fetch to get full product data
          const listRes = await api.get('/core/wishlist/');
          setWishlist(listRes.data || []);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(listRes.data || []));
        }
      } catch (err) {
        console.error('Wishlist toggle failed:', err);
      }
    } else {
      setWishlist(prev => {
        const exists = prev.find(item => item.id === productId);
        const updated = exists
          ? prev.filter(item => item.id !== productId)
          : [...prev, product];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => item.id === productId);
  }, [wishlist]);

  // Called after login to sync localStorage wishlist to backend
  const syncAfterLogin = useCallback(async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const localItems = saved ? JSON.parse(saved) : [];

      // Push each local item to backend (backend is idempotent — duplicate adds are ignored)
      await Promise.all(
        localItems.map(item =>
          api.post('/core/wishlist/', { product_id: item.id }).catch(() => null)
        )
      );

      // Fetch fresh list from backend
      const res = await api.get('/core/wishlist/');
      setWishlist(res.data || []);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data || []));
    } catch (err) {
      console.error('Wishlist sync failed:', err);
    }
  }, []);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, syncAfterLogin }}>
      {children}
    </WishlistContext.Provider>
  );
}
