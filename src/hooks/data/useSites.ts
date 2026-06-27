import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { useAuth } from '../useAuth'

export function useSites() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.sites(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select(`
          *,
          site_locations (*),
          site_capacities (*)
        `)
        .eq('org_id', orgId)
        .eq('is_active', true)

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useSite(siteId: string) {
  return useQuery({
    queryKey: queryKeys.site(siteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select(`
          *,
          site_locations (*),
          site_capacities (*),
          affiliation_agreements (*),
          clinical_instructors (*)
        `)
        .eq('id', siteId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!siteId,
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async (siteData: any) => {
      const { data, error } = await supabase
        .from('sites')
        .insert({ ...siteData, org_id: orgId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites(orgId || '') })
    },
  })
}
