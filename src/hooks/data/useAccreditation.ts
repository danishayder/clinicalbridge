import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { useAuth } from '../useAuth'

export function useStandards() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.standards(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standards')
        .select(`
          *,
          mappings (*, courses:course_id (code, name), assessments:assessment_id (name))
        `)
        .eq('program_id', orgId)
        .eq('is_active', true)
        .order('code')

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useCourses() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.courses(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          assessments (*)
        `)
        .eq('program_id', orgId)
        .order('code')

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useUpdateMapping() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('mappings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.standards(orgId || '') })
      queryClient.invalidateQueries({ queryKey: queryKeys.mappings(orgId || '') })
    },
  })
}
