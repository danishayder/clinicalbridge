import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { useAuth } from '../useAuth'

export function useEvaluations() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.evaluations(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluation_instances')
        .select(`
          *,
          students:student_id (profiles:user_id (first_name, last_name)),
          sites:site_id (name),
          clinical_instructors:ci_id (profiles:user_id (first_name, last_name)),
          evaluation_templates:template_id (name, type),
          placements:placement_id (start_date, end_date)
        `)
        .eq('sites.org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useEvalTemplates() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.evalTemplates(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluation_templates')
        .select('*')
        .eq('program_id', orgId)
        .eq('is_active', true)

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async (evalData: any) => {
      const { data, error } = await supabase
        .from('evaluation_instances')
        .insert(evalData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluations(orgId || '') })
    },
  })
}

export function useRemediationPlans() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.remediationPlans(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('remediation_plans')
        .select(`
          *,
          evaluation_instances:evaluation_id (
            total_score,
            students:student_id (profiles:user_id (first_name, last_name))
          )
        `)
        .eq('evaluation_instances.sites.org_id', orgId)

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}
