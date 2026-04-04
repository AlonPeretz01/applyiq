import { useQuery } from '@tanstack/react-query'
import { getCredits } from '../api/credits.js'

export function useCredits() {
  return useQuery({
    queryKey: ['credits'],
    queryFn:  getCredits,
    staleTime: 60 * 1000, // 1 minute
  })
}
