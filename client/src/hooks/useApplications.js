import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '../api/applications.js'

export const APPLICATION_KEYS = {
  all: ['applications'],
  list: (filters) => ['applications', 'list', filters],
  detail: (id) => ['applications', 'detail', id],
}

export function useApplications(filters) {
  return useQuery({
    queryKey: APPLICATION_KEYS.list(filters),
    queryFn: async () => {
      const res = await applicationsApi.getAll(filters)
      return res.data
    },
  })
}

export function useApplication(id) {
  return useQuery({
    queryKey: APPLICATION_KEYS.detail(id),
    queryFn: async () => {
      const res = await applicationsApi.getById(id)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: APPLICATION_KEYS.all }),
  })
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, note }) => applicationsApi.updateStatus(id, status, note),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: APPLICATION_KEYS.all })
      const key = APPLICATION_KEYS.list(undefined)
      const previous = qc.getQueryData(key)
      qc.setQueryData(key, (old) =>
        old?.map(app => app.id === id ? { ...app, status } : app)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(APPLICATION_KEYS.list(undefined), context.previous)
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: APPLICATION_KEYS.all }),
  })
}

export function useDeleteApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: applicationsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: APPLICATION_KEYS.all }),
  })
}
