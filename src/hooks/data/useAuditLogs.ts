import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { useAuth } from '../useAuth'

export function useAuditLogs(limit: number = 50) {
  const { orgId } = useAuth()

  return useQuery({
    queryKey: [...queryKeys.auditLogs(orgId || ''), limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:created_by (first_name, last_name)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}
