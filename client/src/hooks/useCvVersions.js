import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cvVersionsApi } from '../api/cvVersions.js'

export const CV_KEYS = {
  all: ['cv-versions'],
  list: () => ['cv-versions', 'list'],
}

export function useCvVersions() {
  return useQuery({
    queryKey: CV_KEYS.list(),
    queryFn: async () => {
      const res = await cvVersionsApi.getAll()
      return res.data
    },
  })
}

export function useCreateCvVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cvVersionsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: CV_KEYS.all }),
  })
}

export function useUpdateCvVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => cvVersionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CV_KEYS.all }),
  })
}

export function useDeleteCvVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cvVersionsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: CV_KEYS.all }),
  })
}
