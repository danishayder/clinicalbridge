import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { useAuth } from '../useAuth'

export function useStudents() {
  const { user, orgId } = useAuth()

  return useQuery({
    queryKey: queryKeys.students(orgId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles:user_id (first_name, last_name, email),
          cohorts:cohort_id (name, program_id)
        `)
        .eq('cohorts.programs.org_id', orgId)

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: queryKeys.student(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles:user_id (*),
          cohorts:cohort_id (*)
        `)
        .eq('id', studentId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!studentId,
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const { orgId } = useAuth()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students(orgId || '') })
    },
  })
}
