import { useMutation } from '@tanstack/react-query'
import api from '../api/client.js'

export function useAiAnalysis() {
  return useMutation({
    mutationFn: async (jobId) => {
      const res = await api.post('/ai/full-analysis', { job_id: jobId })
      // res is the server envelope { data, error, message }
      return res.data
    },
  })
}
