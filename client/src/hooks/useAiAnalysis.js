import { useMutation } from '@tanstack/react-query'
import api from '../api/client.js'

export function useAiAnalysis() {
  return useMutation({
    mutationFn: async (jobId) => {
      const res = await api.post('/ai/full-analysis', { job_id: jobId })
      return res.data
    },
  })
}

export async function getSavedAnalysis(jobId) {
  const res = await api.get(`/ai/analysis/${jobId}?t=${Date.now()}`)
  console.log('[getSavedAnalysis] raw res.data:', res.data)
  const result = res.data ?? null
  console.log('[getSavedAnalysis] returning:', result)
  return result
}
