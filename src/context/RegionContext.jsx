import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { REGION_LABELS, loadSavedRegion, saveRegion } from '../utils/deliveryRegion';

/**
 * The buyer's delivery region (south / north / north_east), picked once and
 * remembered across sessions. Product feeds only show sellers who ship there.
 *
 * selection: { stateCode, stateName, region, source: 'location' | 'manual' } | null
 */
const RegionContext = createContext(null);

const fetchRegionCatalog = async () => {
  const { data } = await api.get('/shipping/regions/');
  return data;
};

export function RegionProvider({ children }) {
  const [selection, setSelection] = useState(loadSavedRegion);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { data: catalog, isLoading: catalogLoading, isError: catalogError, refetch: refetchCatalog } = useQuery({
    queryKey: ['delivery-regions'],
    queryFn: fetchRegionCatalog,
    staleTime: Infinity,
  });

  const selectState = useCallback((state, source = 'manual') => {
    const next = { stateCode: state.code, stateName: state.name, region: state.region, source };
    saveRegion(next);
    setSelection(next);
    setIsPickerOpen(false);
  }, []);

  const openPicker = useCallback(() => setIsPickerOpen(true), []);
  const closePicker = useCallback(() => setIsPickerOpen(false), []);

  // Stable object for query params / keys; null until the buyer picks a state.
  const deliveryArea = useMemo(
    () => (selection ? { region: selection.region, stateCode: selection.stateCode, stateName: selection.stateName } : null),
    [selection],
  );

  const value = useMemo(() => ({
    region: selection?.region || null,
    stateCode: selection?.stateCode || null,
    deliveryArea,
    regionLabel: selection ? REGION_LABELS[selection.region] : null,
    stateName: selection?.stateName || null,
    hasSelection: !!selection,
    states: catalog?.states || [],
    catalogLoading,
    catalogError,
    refetchCatalog,
    selectState,
    isPickerOpen,
    openPicker,
    closePicker,
  }), [selection, deliveryArea, catalog, catalogLoading, catalogError, refetchCatalog, selectState, isPickerOpen, openPicker, closePicker]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) throw new Error('useRegion must be used within a RegionProvider');
  return context;
}
