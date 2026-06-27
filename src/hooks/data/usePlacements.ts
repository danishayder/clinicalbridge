import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { useAuth } from '../useAuth'

export function usePlacements() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.placements(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('placements')
        .select(`
          *,
          students:student_id (student_id, profiles:user_id (first_name, last_name)),
          sites:site_id (name, city, state),
          rotation_blocks:block_id (name, start_date, end_date),
          clinical_instructors:ci_id (credentials, profiles:user_id (first_name, last_name))
        `)
        .eq('sites.org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useCreatePlacement() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async (placementData: any) => {
      const { data, error } = await supabase
        .from('placements')
        .insert(placementData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.placements(orgId || '') })
      queryClient.invalidateQueries({ queryKey: queryKeys.sites(orgId || '') })
    },
  })
}

export function useUpdatePlacementStatus() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async ({ id, status, ...updates }: { id: string; status: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('placements')
        .update({ status, ...updates })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.placements(orgId || '') })
    },
  })
}
