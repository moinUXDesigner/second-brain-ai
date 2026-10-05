import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import type { DailyState } from '@/types';

export function dailyStateFormValues(state?: DailyState | null) {
  return {
    energy: state?.energy ?? 5,
    mood: state?.mood ?? 5,
    focus: state?.focus ?? 5,
    availableTime: state?.availableTime ?? 120,
    activityPreference: state?.activityPreference ?? 'Any',
    notes: state?.notes ?? '',
    updatedAt: state?.updatedAt ?? '',
  };
}

export function useDailyState(date: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.dailyState(date),
    queryFn: async ({ signal }) => (await dailyStateService.get(date, signal)).data,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useSaveDailyState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<DailyState, 'id'>) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.dailyState(payload.date) });
      return dailyStateService.save(payload);
    },
    onSuccess: (response, payload) => {
      queryClient.setQueryData(QUERY_KEYS.dailyState(payload.date), response.data);
    },
  });
}
