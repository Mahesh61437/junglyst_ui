import { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../services/api';

const OrderContext = createContext(null);
export const useOrders = () => useContext(OrderContext);

export function OrderProvider({ children }) {
  const [orderList, setOrderList] = useState([]);
  const [orderCount, setOrderCount] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  // Keyed by order UUID — avoids re-fetching details on every navigation
  const detailCache = useRef({});

  const fetchOrders = useCallback(async (page = 1) => {
    setListLoading(true);
    try {
      const res = await api.get(`/orders/?page=${page}`);
      const data = res.data;
      if (data && 'results' in data) {
        setOrderList(data.results);
        setOrderCount(data.count || 0);
        return data;
      }
      const arr = Array.isArray(data) ? data : [];
      setOrderList(arr);
      setOrderCount(arr.length);
      return { results: arr, count: arr.length };
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchOrder = useCallback(async (id, { force = false } = {}) => {
    if (!force && detailCache.current[id]) return detailCache.current[id];
    const res = await api.get(`/orders/${id}/`);
    detailCache.current[id] = res.data;
    return res.data;
  }, []);

  // Remove one or all entries from the detail cache (call after status change)
  const invalidateOrder = useCallback((id) => {
    if (id) {
      delete detailCache.current[id];
    } else {
      detailCache.current = {};
    }
  }, []);

  // Patch a cached order and update the list row simultaneously
  const patchOrder = useCallback((id, patch) => {
    if (detailCache.current[id]) {
      detailCache.current[id] = { ...detailCache.current[id], ...patch };
    }
    setOrderList(prev =>
      prev.map(o => o.id === id ? { ...o, ...patch } : o)
    );
  }, []);

  return (
    <OrderContext.Provider value={{
      orderList,
      orderCount,
      listLoading,
      fetchOrders,
      fetchOrder,
      invalidateOrder,
      patchOrder,
    }}>
      {children}
    </OrderContext.Provider>
  );
}
