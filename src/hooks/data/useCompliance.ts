import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { useAuth } from '../useAuth'

export function useComplianceDocuments() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.complianceDocs(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .select(`
          *,
          students:student_id (student_id, profiles:user_id (first_name, last_name)),
          requirement_templates:template_id (name, category, is_required)
        `)
        .eq('students.cohorts.programs.org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useApproveDocument() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: string; reviewNotes?: string }) => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .update({
          status: 'APPROVED',
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complianceDocs(orgId || '') })
    },
  })
}

export function useRejectDocument() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: string; reviewNotes: string }) => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .update({
          status: 'REJECTED',
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complianceDocs(orgId || '') })
    },
  })
}
