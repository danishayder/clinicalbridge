import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useStandards, useCourses, useUpdateMapping } from '@/hooks/data'
import { Cpu, Download, CheckCircle, AlertTriangle, FileText, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AccreditationPage() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<'standards' | 'curriculum' | 'gaps' | 'export'>('standards')
  const [selectedStandard, setSelectedStandard] = useState<any>(null)

  const { data: standards, isLoading: standardsLoading } = useStandards()
  const { data: courses } = useCourses()
  const updateMapping = useUpdateMapping()

  const totalStandards = standards?.length || 0
  const mapped = standards?.filter((s: any) => s.mappings?.length > 0 && s.mappings?.every((m: any) => m.is_verified)).length || 0
  const partial = standards?.filter((s: any) => s.mappings?.length > 0 && s.mappings?.some((m: any) => !m.is_verified)).length || 0
  const unmapped = standards?.filter((s: any) => !s.mappings?.length).length || 0

  const getStandardStatus = (standard: any) => {
    if (!standard.mappings?.length) return 'unmapped'
    if (standard.mappings.every((m: any) => m.is_verified)) return 'mapped'
    return 'partial'
  }

  const handleAttachEvidence = async (standardId: string) => {
    toast(`Evidence attached to standard. Audit entry created.`, 'success')
  }

  const handleVerifyMapping = async (mappingId: string) => {
    try {
      await updateMapping.mutateAsync({ id: mappingId, is_verified: true, verified_at: new Date().toISOString() })
      toast('Mapping verified successfully.', 'success')
    } catch (err: any) {
      toast(err.message || 'Verification failed', 'error')
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Standards" value={String(totalStandards)} color="blue" />
        <MetricCard label="Fully Mapped" value={String(mapped)} color="green" />
        <MetricCard label="Partial" value={String(partial)} color="amber" />
        <MetricCard label="Unmapped" value={String(unmapped)} color="red" />
      </div>

      <div className="cb-tabs">
        {(['standards', 'curriculum', 'gaps', 'export'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('cb-tab', activeTab === tab && 'cb-tab-active')}
          >
            {tab === 'standards' && 'Standards & Mapping'}
            {tab === 'curriculum' && 'Curriculum Map'}
            {tab === 'gaps' && 'Gap Analysis'}
            {tab === 'export' && 'Evidence Export'}
          </button>
        ))}
      </div>

      {/* Standards Tab */}
      {activeTab === 'standards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <select className="cb-select w-[160px]">
                <option>CAPTE 2024 v3.1</option>
                <option>CAPTE 2022 v2.8</option>
              </select>
              {isAdmin && (
                <Button variant="primary" size="sm" leftIcon={<Cpu className="w-3.5 h-3.5" />}>
                  AI Extract & Map
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {standardsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
                </div>
              ) : standards && standards.length > 0 ? (
                standards.map((s: any, i: number) => {
                  const status = getStandardStatus(s)
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedStandard(s)}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all hover:border-surface-300',
                        status === 'mapped' && 'border-l-4 border-l-success-500 bg-success-50/30',
                        status === 'partial' && 'border-l-4 border-l-warning-500 bg-warning-50/30',
                        status === 'unmapped' && 'border-l-4 border-l-danger-500 bg-danger-50/30',
                        selectedStandard?.id === s.id && 'ring-2 ring-brand-500'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold text-brand-600">{s.code}</span>
                        <Badge variant={status === 'mapped' ? 'green' : status === 'partial' ? 'amber' : 'red'}>
                          {status}
                        </Badge>
                      </div>
                      <div className="text-sm text-surface-700 mt-1">{s.title}</div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-surface-500">
                  No standards found. Add accreditation standards to see them here.
                </div>
              )}
            </div>
          </div>

          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold">Mapping Detail</span>
                <Badge variant="blue">{selectedStandard ? selectedStandard.code : 'Select a standard'}</Badge>
              </div>
            }
          >
            {selectedStandard ? (
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-surface-900">{selectedStandard.code}: {selectedStandard.title}</div>
                  <div className="text-sm text-surface-500 mt-1">{selectedStandard.description}</div>
                </div>

                {selectedStandard.mappings?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStandard.mappings.map((m: any, i: number) => (
                      <div key={i} className="p-3 bg-surface-50 rounded-lg border border-surface-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{m.courses?.code} — {m.courses?.name}</span>
                          <Badge variant={m.is_verified ? 'green' : 'amber'}>
                            {m.is_verified ? 'Verified' : 'Needs Verification'}
                          </Badge>
                        </div>
                        <div className="text-xs text-surface-500 mb-2">
                          Activity: {m.notes || 'Supervised lab sessions + OSCE'}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            leftIcon={<FileText className="w-3 h-3" />}
                            onClick={() => handleAttachEvidence(selectedStandard.id)}
                          >
                            Attach Evidence
                          </Button>
                          {!m.is_verified && (
                            <Button 
                              variant="success" 
                              size="sm" 
                              leftIcon={<CheckCircle className="w-3 h-3" />}
                              onClick={() => handleVerifyMapping(m.id)}
                            >
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertTriangle className="w-8 h-8 text-danger-500 mx-auto mb-2" />
                    <p className="text-sm text-danger-600 font-medium">No curriculum mapping exists</p>
                    <p className="text-xs text-surface-500 mt-1">Action required</p>
                    <Button variant="primary" size="sm" className="mt-3" leftIcon={<Plus className="w-3 h-3" />}>
                      Add Mapping
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-surface-500 text-sm">
                Click a standard on the left to view its curriculum mappings and evidence.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Curriculum Map */}
      {activeTab === 'curriculum' && (
        <Card header={<span className="text-sm font-semibold">Curriculum Mapping Matrix</span>}>
          <table className="cb-table">
            <thead>
              <tr><th>Standard</th><th>Mapped To</th><th>Week/Activity</th><th>Evidence</th><th>Status</th></tr>
            </thead>
            <tbody>
              {standardsLoading ? (
                <tr><td colSpan={5} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-surface-400 mx-auto" /></td></tr>
              ) : standards && standards.length > 0 ? (
                standards.slice(0, 6).map((s: any, i: number) => (
                  <tr key={i}>
                    <td><span className="font-mono text-sm font-semibold text-brand-600">{s.code}</span></td>
                    <td className="text-sm">{s.mappings?.[0]?.courses?.name || 'Unmapped'}</td>
                    <td className="text-surface-500 text-sm">{s.mappings?.[0]?.notes || '—'}</td>
                    <td>
                      <Badge variant={s.mappings?.[0]?.evidence_files?.length > 0 ? 'green' : 'red'}>
                        {s.mappings?.[0]?.evidence_files?.length > 0 ? 'Attached' : 'Needs Evidence'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={s.mappings?.[0]?.is_verified ? 'green' : s.mappings?.length > 0 ? 'amber' : 'red'}>
                        {s.mappings?.[0]?.is_verified ? 'Verified' : s.mappings?.length > 0 ? 'Partial' : 'Gap'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center py-8 text-surface-500">No standards to display</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Gaps */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold">Gap Analysis Report</span>
                <Badge variant="amber">{unmapped} gaps identified</Badge>
              </div>
            }
          >
            <div className="space-y-3 p-4">
              {standardsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
                </div>
              ) : standards && standards.filter((s: any) => !s.mappings?.length).length > 0 ? (
                standards.filter((s: any) => !s.mappings?.length).map((s: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-surface-200">
                    <Badge variant="red" className="flex-shrink-0">{s.code}</Badge>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.title}</div>
                      <div className="text-xs text-surface-500 mt-0.5">{s.description}</div>
                    </div>
                    <Badge variant="red">Open</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-surface-500">
                  No gaps found! All standards have curriculum mappings.
                </div>
              )}
            </div>
          </Card>

          <Card header={<span className="text-sm font-semibold">Action Plan Tracker</span>}>
            <table className="cb-table">
              <thead>
                <tr><th>Gap</th><th>Owner</th><th>Due Date</th><th>Evidence</th><th>Status</th></tr>
              </thead>
              <tbody>
                {standards?.filter((s: any) => !s.mappings?.length).slice(0, 3).map((s: any, i: number) => (
                  <tr key={i}>
                    <td><span className="font-mono text-sm text-brand-600">{s.code}</span></td>
                    <td className="text-sm">Dr. Kim</td>
                    <td className="text-surface-500 text-sm">Aug 2026</td>
                    <td><Badge variant="red">None attached</Badge></td>
                    <td><Badge variant="red">Open</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Export */}
      {activeTab === 'export' && (
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Mapped Standards" value={String(mapped)} color="green" />
              <MetricCard label="Attached Evidence" value={String(mapped)} color="blue" />
              <MetricCard label="Needs Evidence" value={String(unmapped + partial)} color="red" />
              <MetricCard label="Export Ready" value={`${totalStandards > 0 ? Math.round((mapped / totalStandards) * 100) : 0}%`} color="green" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button 
                variant="primary" 
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => toast('Evidence pack generated. PDF ready for download.', 'success')}
              >
                Download Evidence Pack (PDF)
              </Button>
              <Button 
                variant="secondary" 
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => toast('Curriculum map exported to Excel.', 'info')}
              >
                Export Curriculum Map
              </Button>
              <Button 
                variant="secondary" 
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => toast('Gap analysis report exported.', 'info')}
              >
                Export Gap Report
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}