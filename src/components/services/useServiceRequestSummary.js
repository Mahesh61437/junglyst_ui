import { useQuery } from '@tanstack/react-query';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';

const REFRESH_MS = 60_000;

/** Counts of custom-order requests that need the super admin (refreshed every minute). */
export function useServiceRequestSummary(enabled = true) {
  const { data } = useQuery({
    queryKey: ['service-summary'],
    queryFn: ServiceQuoteService.admin.summary,
    enabled,
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS / 2,
  });
  return data;
}
