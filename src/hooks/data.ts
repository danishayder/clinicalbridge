import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type AnyObject = Record<string, any>

// ============================================================
// HELPER: Get current user's org_id
// ============================================================

async function getCurrentOrgId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .single() as any
  return profile?.org_id || null
}

// ============================================================
// DASHBOARD HOOKS
// ============================================================

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return null

      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      const { count: placementsCount } = await supabase
        .from('placements')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      const { count: pendingEvals } = await supabase
        .from('evaluation_instances')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'draft')

      const { data: standards } = await supabase
        .from('standards')
        .select('id')
        .eq('org_id', orgId)

      const { data: mappings } = await supabase
        .from('mappings')
        .select('id')
        .eq('org_id', orgId)
        .eq('is_verified', true)

      const totalStandards = standards?.length || 0
      const mappedStandards = mappings?.length || 0
      const accreditationPct = totalStandards > 0 ? Math.round((mappedStandards / totalStandards) * 100) : 0

      const clearedCount = studentsCount || 0

      return {
        students: studentsCount || 0,
        cleared: clearedCount,
        placements: placementsCount || 0,
        pendingEvaluations: pendingEvals || 0,
        accreditationPct,
      }
    },
  })
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['recentActivity', limit],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    },
  })
}

export function useActionItems() {
  return useQuery({
    queryKey: ['actionItems'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const items: AnyObject[] = []

      const { data: capacityData } = await supabase
        .from('site_capacities')
        .select(`
          *,
          sites(name)
        `)
        .eq('org_id', orgId)

      const atCapacity = capacityData?.filter((c: any) => c.total_slots <= c.filled_slots) || []

      if (atCapacity.length > 0) {
        items.push({
          severity: 'danger',
          text: `${atCapacity.length} site(s) at capacity — need reassignment`,
        })
      }

      const { count: pendingDocs } = await supabase
        .from('compliance_documents')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'PENDING')

      if (pendingDocs && pendingDocs > 0) {
        items.push({
          severity: 'warning',
          text: `${pendingDocs} compliance document(s) awaiting review`,
        })
      }

      const { count: pendingAttestations } = await supabase
        .from('timecards')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'SUBMITTED')

      if (pendingAttestations && pendingAttestations > 0) {
        items.push({
          severity: 'warning',
          text: `${pendingAttestations} timecard(s) pending CI attestation`,
        })
      }

      return items
    },
  })
}

// ============================================================
// STUDENT HOOKS
// ============================================================

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles(first_name, last_name, email, is_active),
          cohorts(name, programs(name, discipline))
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

// ============================================================
// COMPLIANCE HOOKS
// ============================================================

export function useComplianceStudents() {
  return useQuery({
    queryKey: ['complianceStudents'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          user_id,
          profiles(first_name, last_name),
          cohorts(name),
          compliance_documents(status, expiry_date)
        `)
        .eq('org_id', orgId)

      if (error) throw error
      return data || []
    },
  })
}

export function usePendingComplianceDocs() {
  return useQuery({
    queryKey: ['pendingComplianceDocs'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('compliance_documents')
        .select(`
          *,
          students(student_id, profiles(first_name, last_name)),
          requirement_templates(name, category)
        `)
        .eq('org_id', orgId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useComplianceAuditLogs(limit = 20) {
  return useQuery({
    queryKey: ['complianceAuditLogs', limit],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('org_id', orgId)
        .in('entity_type', ['compliance_document', 'clearance_status'])
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    },
  })
}

// ============================================================
// PLACEMENT HOOKS
// ============================================================

export function usePlacements() {
  return useQuery({
    queryKey: ['placements'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('placements')
        .select(`
          *,
          students(student_id, profiles(first_name, last_name)),
          sites(name),
          rotation_blocks(name, start_date, end_date),
          clinical_instructors(profiles(first_name, last_name))
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useSiteCapacities() {
  return useQuery({
    queryKey: ['siteCapacities'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('site_capacities')
        .select(`
          *,
          sites(name),
          rotation_blocks(name)
        `)
        .eq('org_id', orgId)

      if (error) throw error
      return data || []
    },
  })
}

export function useAffiliationAgreements() {
  return useQuery({
    queryKey: ['affiliationAgreements'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('affiliation_agreements')
        .select(`
          *,
          sites(name)
        `)
        .eq('org_id', orgId)
        .order('end_date', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

// ============================================================
// TIMECARD HOOKS
// ============================================================

export function useTimecards() {
  return useQuery({
    queryKey: ['timecards'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('timecards')
        .select(`
          *,
          students(profiles(first_name, last_name)),
          sites(name)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useTimecardStats() {
  return useQuery({
    queryKey: ['timecardStats'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return { activeShifts: 0, totalHours: 0, deficitAlerts: 0, pendingAttestations: 0 }

      const { count: activeShifts } = await supabase
        .from('timecards')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'ACTIVE')

      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const { data: weekTimecards } = await supabase
        .from('timecards')
        .select('total_minutes')
        .eq('org_id', orgId)
        .gte('clock_in_at', weekStart.toISOString())

      const totalHours = (weekTimecards?.reduce((acc: number, t: any) => acc + (t.total_minutes || 0), 0) || 0) / 60

      const { count: pendingAttestations } = await supabase
        .from('timecards')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'SUBMITTED')

      return {
        activeShifts: activeShifts || 0,
        totalHours: Math.round(totalHours * 10) / 10,
        deficitAlerts: 0,
        pendingAttestations: pendingAttestations || 0,
      }
    },
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('timecards')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timecards'] })
      queryClient.invalidateQueries({ queryKey: ['timecardStats'] })
    },
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()
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
      queryClient.invalidateQueries({ queryKey: ['timecards'] })
      queryClient.invalidateQueries({ queryKey: ['timecardStats'] })
    },
  })
}

export function useAttestTimecard() {
  const queryClient = useQueryClient()
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
      queryClient.invalidateQueries({ queryKey: ['timecards'] })
      queryClient.invalidateQueries({ queryKey: ['timecardStats'] })
    },
  })
}

export function usePendingAttestations(ciId: string) {
  return useQuery({
    queryKey: ['pendingAttestations', ciId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timecards')
        .select(`
          *,
          students(profiles(first_name, last_name)),
          sites(name)
        `)
        .eq('status', 'SUBMITTED')
        .eq('ci_id', ciId)

      if (error) throw error
      return data || []
    },
  })
}

// ============================================================
// EVALUATION HOOKS
// ============================================================

export function useEvaluations() {
  return useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('evaluation_instances')
        .select(`
          *,
          students(profiles(first_name, last_name)),
          evaluation_templates(name, type),
          clinical_instructors(profiles(first_name, last_name)),
          placements(start_date, end_date)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useEvalTemplates() {
  return useQuery({
    queryKey: ['evalTemplates'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('evaluation_templates')
        .select(`
          *,
          programs(name)
        `)
        .eq('org_id', orgId)

      if (error) throw error
      return data || []
    },
  })
}

export function useRemediationPlans() {
  return useQuery({
    queryKey: ['remediationPlans'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('remediation_plans')
        .select(`
          *,
          evaluation_instances(
            total_score,
            students(profiles(first_name, last_name))
          )
        `)
        .eq('org_id', orgId)

      if (error) throw error
      return data || []
    },
  })
}

export function useEvaluationStats() {
  return useQuery({
    queryKey: ['evaluationStats'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return { activeEvals: 0, completed: 0, pendingSign: 0, remediationCount: 0 }

      const { count: activeEvals } = await supabase
        .from('evaluation_instances')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)

      const { count: completed } = await supabase
        .from('evaluation_instances')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'Complete')

      const { count: pendingSign } = await supabase
        .from('evaluation_instances')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'Pending sign')

      const { count: remediationCount } = await supabase
        .from('remediation_plans')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'active')

      return {
        activeEvals: activeEvals || 0,
        completed: completed || 0,
        pendingSign: pendingSign || 0,
        remediationCount: remediationCount || 0,
      }
    },
  })
}

// ============================================================
// ACCREDITATION HOOKS
// ============================================================

export function useStandards() {
  return useQuery({
    queryKey: ['standards'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('standards')
        .select(`
          *,
          mappings(*, courses(code, name))
        `)
        .eq('org_id', orgId)
        .order('code', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('org_id', orgId)

      if (error) throw error
      return data || []
    },
  })
}

export function useUpdateMapping() {
  const queryClient = useQueryClient()
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
      queryClient.invalidateQueries({ queryKey: ['standards'] })
    },
  })
}