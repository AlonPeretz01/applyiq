import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs.js'

export const JOB_KEYS = {
  all: ['jobs'],
  list: () => ['jobs', 'list'],
  detail: (id) => ['jobs', 'detail', id],
}

export function useJobs() {
  return useQuery({
    queryKey: JOB_KEYS.list(),
    queryFn: async () => {
      const res = await jobsApi.getAll()
      return res.data
    },
  })
}

export function useJob(id) {
  return useQuery({
    queryKey: JOB_KEYS.detail(id),
    queryFn: async () => {
      const res = await jobsApi.getById(id)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: jobsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: JOB_KEYS.all }),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => jobsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: JOB_KEYS.all }),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: jobsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: JOB_KEYS.all }),
  })
}
