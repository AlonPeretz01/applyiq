import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics.js'

export const ANALYTICS_KEYS = {
  all:      ['analytics'],
  overview: () => ['analytics', 'overview'],
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.overview(),
    queryFn: async () => {
      const res = await analyticsApi.getOverview()
      return res.data
    },
  })
}
