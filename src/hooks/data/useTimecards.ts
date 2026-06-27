import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { useAuth } from '../useAuth'

export function useTimecards() {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.timecards(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timecards')
        .select(`
          *,
          students:student_id (profiles:user_id (first_name, last_name)),
          sites:site_id (name),
          clinical_instructors:ci_id (profiles:user_id (first_name, last_name))
        `)
        .eq('sites.org_id', orgId)
        .order('clock_in_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useStudentTimecards(studentId: string) {
  return useQuery({
    queryKey: queryKeys.studentTimecards(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timecards')
        .select(`
          *,
          sites:site_id (name)
        `)
        .eq('student_id', studentId)
        .order('clock_in_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!studentId,
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async (timecardData: any) => {
      const { data, error } = await supabase
        .from('timecards')
        .insert(timecardData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timecards(orgId || '') })
    },
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async ({ id, clockOutData }: { id: string; clockOutData: any }) => {
      const { data, error } = await supabase
        .from('timecards')
        .update(clockOutData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timecards(orgId || '') })
    },
  })
}

export function useAttestTimecard() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async ({ id, ciId }: { id: string; ciId: string }) => {
      const { data, error } = await supabase
        .from('timecards')
        .update({
          status: 'CI_ATTESTED',
          ci_attested_at: new Date().toISOString(),
          ci_attested_by: ciId,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timecards(orgId || '') })
    },
  })
}

export function usePendingAttestations(ciId: string) {
  return useQuery({
    queryKey: queryKeys.pendingAttestations(ciId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timecards')
        .select(`
          *,
          students:student_id (profiles:user_id (first_name, last_name)),
          sites:site_id (name)
        `)
        .eq('ci_id', ciId)
        .eq('status', 'SUBMITTED')
        .order('clock_in_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!ciId,
  })
}
