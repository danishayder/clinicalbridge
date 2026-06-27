import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { MetricCard } from '@/components/modules/MetricCard'
import { MobileCardList } from '@/components/modules/MobileCardList'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Download, Eye, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UploadDocumentModal } from '@/components/ui/UploadDocumentModal'

type TabType = 'students' | 'documents' | 'audit'

// ============================================================
// HELPER: Get current user's org_id
// ============================================================

async function getCurrentOrgId() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ Profile error:', error)
      return null
    }

    return profile?.org_id || null
  } catch (err) {
    console.error('❌ Error getting org ID:', err)
    return null
  }
}

// ============================================================
// COMPLIANCE HOOKS (Simplified)
// ============================================================

function useComplianceStudents() {
  return useQuery({
    queryKey: ['complianceStudents'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('org_id', orgId)

      if (studentsError) {
        console.error('❌ Students error:', studentsError)
        throw studentsError
      }

      if (!students || students.length === 0) return []

      const userIds = students.map(s => s.user_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)

      if (profilesError) {
        console.error('❌ Profiles error:', profilesError)
      }

      const cohortIds = students.map(s => s.cohort_id)
      const { data: cohorts, error: cohortsError } = await supabase
        .from('cohorts')
        .select('*, programs(name, discipline)')
        .in('id', cohortIds)

      if (cohortsError) {
        console.error('❌ Cohorts error:', cohortsError)
      }

      const studentIds = students.map(s => s.id)
      const { data: docs, error: docsError } = await supabase
        .from('compliance_documents')
        .select('*')
        .in('student_id', studentIds)

      if (docsError) {
        console.error('❌ Documents error:', docsError)
      }

      const merged = students.map(student => {
        const profile = profiles?.find(p => p.user_id === student.user_id)
        const cohort = cohorts?.find(c => c.id === student.cohort_id)
        const studentDocs = docs?.filter(d => d.student_id === student.id) || []

        const total = studentDocs.length
        const approved = studentDocs.filter(d => d.status === 'APPROVED').length
        const isCleared = total > 0 && approved === total

        return {
          ...student,
          profiles: profile,
          cohorts: cohort,
          compliance_documents: studentDocs,
          complianceStatus: isCleared ? 'Cleared' : total === 0 ? 'Incomplete' : 'Pending',
          complianceProgress: total > 0 ? Math.round((approved / total) * 100) : 0,
        }
      })

      return merged
    },
    staleTime: 0,
    refetchOnMount: true,
  })
}

function usePendingComplianceDocs() {
  return useQuery({
    queryKey: ['pendingComplianceDocs'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data: docs, error: docsError } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('status', 'PENDING')

      if (docsError) {
        console.error('❌ Docs error:', docsError)
        throw docsError
      }

      if (!docs || docs.length === 0) return []

      const studentIds = docs.map(d => d.student_id)
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

      if (studentsError) {
        console.error('❌ Students error:', studentsError)
      }

      const userIds = students?.map(s => s.user_id) || []
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)

      if (profilesError) {
        console.error('❌ Profiles error:', profilesError)
      }

      const templateIds = docs.map(d => d.template_id)
      const { data: templates, error: templatesError } = await supabase
        .from('requirement_templates')
        .select('*')
        .in('id', templateIds)

      if (templatesError) {
        console.error('❌ Templates error:', templatesError)
      }

      const merged = docs.map(doc => {
        const student = students?.find(s => s.id === doc.student_id)
        const profile = profiles?.find(p => p.user_id === student?.user_id)
        const template = templates?.find(t => t.id === doc.template_id)

        return {
          ...doc,
          students: student ? { ...student, profiles: profile } : null,
          requirement_templates: template,
        }
      })

      return merged
    },
    staleTime: 0,
    refetchOnMount: true,
  })
}

function useComplianceAuditLogs(limit = 20) {
  return useQuery({
    queryKey: ['complianceAuditLogs', limit],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Audit logs error:', error)
        throw error
      }

      return data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })
}

// ============================================================
// MUTATIONS
// ============================================================

function useApproveDocument() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ documentId, studentName, docType }: { documentId: string; studentName: string; docType: string }) => {
      console.log(`✅ Approving document ${documentId} for ${studentName}`)

      const { error } = await supabase
        .from('compliance_documents')
        .update({
          status: 'APPROVED',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (error) throw error

      return { studentName, docType }
    },
    onSuccess: ({ studentName, docType }) => {
      queryClient.invalidateQueries({ queryKey: ['pendingComplianceDocs'] })
      queryClient.invalidateQueries({ queryKey: ['complianceStudents'] })
      toast(`${docType} approved for ${studentName}. Clearance updated.`, 'success')
    },
    onError: (err: any) => {
      console.error('❌ Approve error:', err)
      toast(err.message || 'Failed to approve document', 'error')
    },
  })
}

function useRejectDocument() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ documentId, studentName, docType }: { documentId: string; studentName: string; docType: string }) => {
      console.log(`❌ Rejecting document ${documentId} for ${studentName}`)

      const { error } = await supabase
        .from('compliance_documents')
        .update({
          status: 'REJECTED',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (error) throw error

      return { studentName, docType }
    },
    onSuccess: ({ studentName, docType }) => {
      queryClient.invalidateQueries({ queryKey: ['pendingComplianceDocs'] })
      queryClient.invalidateQueries({ queryKey: ['complianceStudents'] })
      toast(`${docType} rejected for ${studentName}. Student needs to re-upload.`, 'warning')
    },
    onError: (err: any) => {
      console.error('❌ Reject error:', err)
      toast(err.message || 'Failed to reject document', 'error')
    },
  })
}

// ============================================================
// MAIN PAGE
// ============================================================

export function CompliancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('students')
  const [filter, setFilter] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [orgId, setOrgId] = useState('')
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const { data: students, isLoading: studentsLoading, refetch: refetchStudents } = useComplianceStudents()
  const { data: pendingDocs, isLoading: docsLoading, refetch: refetchDocs } = usePendingComplianceDocs()
  const { data: auditLogs, isLoading: auditLoading, refetch: refetchAudit } = useComplianceAuditLogs(20)

  const approveMutation = useApproveDocument()
  const rejectMutation = useRejectDocument()

  // Get org_id
  useEffect(() => {
    async function loadOrgId() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .single()
      if (profile) setOrgId(profile.org_id)
    }
    loadOrgId()
  }, [])

  // Refetch when tab changes
  useEffect(() => {
    if (activeTab === 'students') refetchStudents()
    if (activeTab === 'documents') refetchDocs()
    if (activeTab === 'audit') refetchAudit()
  }, [activeTab])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Cleared': return <Badge variant="green">Cleared</Badge>
      case 'Pending': return <Badge variant="amber">Pending</Badge>
      case 'Incomplete': return <Badge variant="red">Incomplete</Badge>
      default: return <Badge variant="gray">{status}</Badge>
    }
  }

  const getProgressColor = (pct: number) => {
    if (pct === 100) return 'bg-success-500'
    if (pct >= 75) return 'bg-warning-500'
    return 'bg-danger-500'
  }

  const filteredStudents = students?.filter((s: any) => {
    if (filter === 'all') return true
    return s.complianceStatus === filter
  })

  const totalStudents = students?.length || 0
  const clearedCount = students?.filter((s: any) => s.complianceStatus === 'Cleared').length || 0
  const pendingCount = pendingDocs?.length || 0

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Students" value={String(totalStudents)} color="blue" />
        <MetricCard label="Fully Cleared" value={String(clearedCount)} color="green" />
        <MetricCard label="Pending Review" value={String(pendingCount)} color="amber" />
        <MetricCard label="Expiring ≤30d" value="0" color="red" />
      </div>

      {/* Tabs */}
      <div className="cb-tabs">
        {(['students', 'documents', 'audit'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('cb-tab', activeTab === tab && 'cb-tab-active')}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'documents' && pendingCount > 0 && (
              <span className="ml-1.5 text-warning-500 font-bold">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="cb-select w-[140px]"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="Cleared">Cleared</option>
              <option value="Pending">Pending</option>
              <option value="Incomplete">Incomplete</option>
            </select>
            <select className="cb-select w-[130px]">
              <option>All programs</option>
              <option>PTA</option>
              <option>DPT</option>
              <option>OTA</option>
            </select>
            <Button 
              variant="secondary" 
              size="sm" 
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => setShowUploadModal(true)}
            >
              Upload
            </Button>
            <Button variant="primary" size="sm" className="ml-auto" leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export
            </Button>
          </div>

          {/* Desktop Table */}
          {!isMobile && (
            <Card>
              {studentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
                </div>
              ) : filteredStudents && filteredStudents.length > 0 ? (
                <table className="cb-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Program</th>
                      <th>Site</th>
                      <th>Compliance</th>
                      <th>Clearance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s: any) => (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar name={`${s.profiles?.first_name || ''} ${s.profiles?.last_name || ''}`} size="sm" />
                            <span className="font-medium">{s.profiles?.first_name} {s.profiles?.last_name}</span>
                          </div>
                        </td>
                        <td>
                          <Badge variant="gray">{s.cohorts?.programs?.discipline || 'PTA'}</Badge>
                        </td>
                        <td className="text-surface-500">—</td>
                        <td>
                          <Progress value={s.complianceProgress || 0} max={100} color={getProgressColor(s.complianceProgress || 0)} showLabel />
                        </td>
                        <td>{getStatusBadge(s.complianceStatus)}</td>
                        <td>
                          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-surface-500">
                  No students found. Add students to see them here.
                </div>
              )}
            </Card>
          )}

          {/* Mobile Cards */}
          {isMobile && (
            <MobileCardList>
              {filteredStudents?.map((s: any) => (
                <div key={s.id} className="cb-list-item">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={`${s.profiles?.first_name || ''} ${s.profiles?.last_name || ''}`} size="sm" />
                      <span className="font-medium text-sm">{s.profiles?.first_name} {s.profiles?.last_name}</span>
                    </div>
                    {getStatusBadge(s.complianceStatus)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-surface-500 mb-2">
                    <div><span className="text-surface-400">Program:</span> {s.cohorts?.programs?.discipline || 'PTA'}</div>
                    <div><span className="text-surface-400">ID:</span> {s.student_id}</div>
                  </div>
                  <Progress value={s.complianceProgress || 0} max={100} color={getProgressColor(s.complianceProgress || 0)} showLabel />
                </div>
              ))}
            </MobileCardList>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-semibold">Pending Document Reviews</span>
              <Badge variant="amber">{pendingCount} awaiting</Badge>
            </div>
          }
        >
          {docsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
            </div>
          ) : pendingDocs && pendingDocs.length > 0 ? (
            !isMobile ? (
              <table className="cb-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Document Type</th>
                    <th>Submitted</th>
                    <th>Expiry</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDocs.map((d: any, i: number) => {
                    const studentName = `${d.students?.profiles?.first_name || ''} ${d.students?.profiles?.last_name || ''}`.trim() || 'Unknown'
                    const docType = d.requirement_templates?.name || 'Unknown'
                    const isLoading = approveMutation.isPending || rejectMutation.isPending

                    return (
                      <tr key={i}>
                        <td className="font-medium">
                          {studentName}
                        </td>
                        <td>
                          <Badge variant="blue">{docType}</Badge>
                        </td>
                        <td className="text-surface-500">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="text-surface-500">
                          {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => approveMutation.mutate({
                                documentId: d.id,
                                studentName,
                                docType,
                              })}
                              leftIcon={<Check className="w-3.5 h-3.5" />}
                              disabled={isLoading}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => rejectMutation.mutate({
                                documentId: d.id,
                                studentName,
                                docType,
                              })}
                              leftIcon={<X className="w-3.5 h-3.5" />}
                              disabled={isLoading}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="space-y-2">
                {pendingDocs.map((d: any, i: number) => {
                  const studentName = `${d.students?.profiles?.first_name || ''} ${d.students?.profiles?.last_name || ''}`.trim() || 'Unknown'
                  const docType = d.requirement_templates?.name || 'Unknown'
                  const isLoading = approveMutation.isPending || rejectMutation.isPending

                  return (
                    <div key={i} className="cb-list-item">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{studentName}</span>
                        <Badge variant="blue">{docType}</Badge>
                      </div>
                      <div className="text-xs text-surface-500 mb-3">
                        <div>Submitted: {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</div>
                        <div>Expires: {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : '—'}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          className="flex-1"
                          onClick={() => approveMutation.mutate({
                            documentId: d.id,
                            studentName,
                            docType,
                          })}
                          disabled={isLoading}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1"
                          onClick={() => rejectMutation.mutate({
                            documentId: d.id,
                            studentName,
                            docType,
                          })}
                          disabled={isLoading}
                          leftIcon={<X className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-surface-500">
              No pending documents. All compliance documents have been reviewed.
            </div>
          )}
        </Card>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-semibold">Compliance Audit Log</span>
              <Badge variant="blue">Immutable</Badge>
            </div>
          }
        >
          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
            </div>
          ) : auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-1">
              {auditLogs.map((log: any, i: number) => (
                <div key={i} className="flex gap-3 py-2 border-b border-surface-200 last:border-0 text-sm">
                  <span className="text-surface-500 font-mono text-xs w-[80px] flex-shrink-0">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                  <span className="text-surface-700 font-medium w-[140px] flex-shrink-0 hidden sm:block">
                    {log.created_by || 'System'}
                  </span>
                  <span className="text-surface-900 flex-1">{log.action} on {log.entity_type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-500">
              No audit logs yet. Changes to compliance will be tracked here.
            </div>
          )}
        </Card>
      )}

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          refetchStudents()
          refetchDocs()
          toast('Documents refreshed!', 'info')
        }}
        orgId={orgId}
      />
    </div>
  )
}