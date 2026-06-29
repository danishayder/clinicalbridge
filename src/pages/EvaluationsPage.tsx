import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { MobileCardList } from '@/components/modules/MobileCardList'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useEvaluations, useEvalTemplates, useRemediationPlans, useEvaluationStats } from '@/hooks/data'
import { ClipboardList, Plus, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EvaluationsPage() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<'list' | 'templates' | 'remediation' | 'trends'>('list')

  const { data: evaluations, isLoading: evalsLoading } = useEvaluations()
  const { data: templates } = useEvalTemplates()
  const { data: remediationPlans } = useRemediationPlans()
  const { data: stats } = useEvaluationStats()

  const activeEvals = stats?.activeEvals || 0
  const completed = stats?.completed || 0
  const pendingSign = stats?.pendingSign || 0
  const remediationCount = stats?.remediationCount || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Complete': return <Badge variant="green">Complete</Badge>
      case 'Pending sign': return <Badge variant="amber">Pending Sign</Badge>
      case 'In progress': return <Badge variant="blue">In Progress</Badge>
      case 'Remediation': return <Badge variant="red">Remediation</Badge>
      default: return <Badge variant="gray">{status}</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-success-500'
    if (score >= 3) return 'text-warning-500'
    return 'text-danger-500'
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Active Evals" value={String(activeEvals)} color="blue" />
        <MetricCard label="Completed" value={String(completed)} color="green" />
        <MetricCard label="Pending Sign" value={String(pendingSign)} color="amber" />
        <MetricCard label="Remediation" value={String(remediationCount)} color="red" />
      </div>

      <div className="cb-tabs">
        {(['list', 'templates', 'remediation', 'trends'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('cb-tab', activeTab === tab && 'cb-tab-active')}
          >
            {tab === 'list' && 'Evaluations'}
            {tab === 'templates' && 'Templates'}
            {tab === 'remediation' && 'Remediation Plans'}
            {tab === 'trends' && 'Cohort Trends'}
          </button>
        ))}
      </div>

      {/* Evaluations List */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select className="cb-select w-[150px]">
              <option>All Types</option>
              <option>Midterm</option>
              <option>Final</option>
            </select>
            <select className="cb-select w-[150px]">
              <option>All Statuses</option>
              <option>In Progress</option>
              <option>Pending Sign</option>
              <option>Complete</option>
            </select>
            {isAdmin && (
              <Button variant="primary" size="sm" className="ml-auto" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                New Evaluation
              </Button>
            )}
          </div>

          <Card>
            {evalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
              </div>
            ) : evaluations && evaluations.length > 0 ? (
              !isMobile ? (
                <table className="cb-table">
                  <thead>
                    <tr><th>Student</th><th>Type</th><th>CI</th><th>Period</th><th>Score</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {evaluations.map((e: any, i: number) => (
                      <tr key={i}>
                        <td className="font-medium">{e.students?.profiles?.first_name} {e.students?.profiles?.last_name}</td>
                        <td><Badge variant="gray">{e.evaluation_templates?.type}</Badge></td>
                        <td className="text-surface-500">{e.clinical_instructors?.profiles?.first_name} {e.clinical_instructors?.profiles?.last_name}</td>
                        <td className="text-surface-500">{e.placements?.start_date} – {e.placements?.end_date}</td>
                        <td className={cn('font-semibold', getScoreColor(e.total_score || 0))}>
                          {e.total_score}/5.0
                        </td>
                        <td>{getStatusBadge(e.status)}</td>
                        <td>
                          <Button variant="ghost" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
                            Open
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <MobileCardList>
                  {evaluations.map((e: any, i: number) => (
                    <div key={i} className="cb-list-item">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{e.students?.profiles?.first_name} {e.students?.profiles?.last_name}</span>
                        {getStatusBadge(e.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-surface-500 mb-2">
                        <div><span className="text-surface-400">Type:</span> {e.evaluation_templates?.type}</div>
                        <div><span className="text-surface-400">CI:</span> {e.clinical_instructors?.profiles?.first_name}</div>
                        <div><span className="text-surface-400">Score:</span> <span className={getScoreColor(e.total_score || 0)}>{e.total_score}/5.0</span></div>
                      </div>
                    </div>
                  ))}
                </MobileCardList>
              )
            ) : (
              <div className="text-center py-8 text-surface-500">
                No evaluations yet. Create evaluations to see them here.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold">Evaluation Templates</span>
                {isAdmin && <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>New Template</Button>}
              </div>
            }
          >
            <div className="space-y-2">
              {templates && templates.length > 0 ? (
                templates.map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-surface-200 last:border-0">
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-surface-500">{t.type} · {t.programs?.name}</div>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-surface-500">
                  No templates yet. Create evaluation templates to see them here.
                </div>
              )}
            </div>
          </Card>

          <Card header={<span className="text-sm font-semibold">Template Preview — PTA Midterm</span>}>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Competency Areas</div>
              {['Patient examination (1–5)', 'Intervention planning (1–5)', 'Documentation quality (1–5)', 'Communication & professionalism (1–5)', 'Safety & clinical reasoning (1–5)'].map((area, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-surface-200">
                  <span className="text-sm">{area}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="w-3.5 h-3.5 rounded bg-brand-500 cursor-pointer hover:opacity-70" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Remediation */}
      {activeTab === 'remediation' && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-semibold">Active Remediation Plans</span>
              <Badge variant="red">{remediationCount} active</Badge>
            </div>
          }
        >
          {remediationPlans && remediationPlans.length > 0 ? (
            !isMobile ? (
              <table className="cb-table">
                <thead>
                  <tr><th>Student</th><th>Triggered By</th><th>Area</th><th>Due Date</th><th>Evidence</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {remediationPlans.map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="font-medium">{r.evaluation_instances?.students?.profiles?.first_name} {r.evaluation_instances?.students?.profiles?.last_name}</td>
                      <td className="text-surface-500 text-xs">Score: {r.evaluation_instances?.total_score}</td>
                      <td><Badge variant="red">{r.tasks?.[0]?.area || 'General'}</Badge></td>
                      <td className="text-surface-500">{new Date(r.deadline).toLocaleDateString()}</td>
                      <td><Badge variant={r.completed_at ? 'green' : 'amber'}>{r.completed_at ? 'Complete' : 'In Progress'}</Badge></td>
                      <td><Badge variant={r.status === 'active' ? 'red' : 'green'}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <MobileCardList>
                {remediationPlans.map((r: any, i: number) => (
                  <div key={i} className="cb-list-item">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{r.evaluation_instances?.students?.profiles?.first_name} {r.evaluation_instances?.students?.profiles?.last_name}</span>
                      <Badge variant="red">{r.status}</Badge>
                    </div>
                    <div className="text-xs text-surface-500">
                      <div>Due: {new Date(r.deadline).toLocaleDateString()}</div>
                      <div>Score: {r.evaluation_instances?.total_score}</div>
                    </div>
                  </div>
                ))}
              </MobileCardList>
            )
          ) : (
            <div className="text-center py-8 text-surface-500">
              No active remediation plans. Students meeting expectations.
            </div>
          )}
        </Card>
      )}

      {/* Trends */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card header={<span className="text-sm font-semibold">Cohort Score Distribution</span>}>
            <div className="p-4 space-y-3">
              {evaluations && evaluations.length > 0 ? (
                <>
                  {[
                    { label: '1.0–2.0', count: evaluations.filter((e: any) => (e.total_score || 0) <= 2).length, color: 'bg-danger-500' },
                    { label: '2.1–3.0', count: evaluations.filter((e: any) => (e.total_score || 0) > 2 && (e.total_score || 0) <= 3).length, color: 'bg-warning-500' },
                    { label: '3.1–4.0', count: evaluations.filter((e: any) => (e.total_score || 0) > 3 && (e.total_score || 0) <= 4).length, color: 'bg-brand-500' },
                    { label: '4.1–5.0', count: evaluations.filter((e: any) => (e.total_score || 0) > 4).length, color: 'bg-success-500' },
                  ].map((bar, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-surface-500 w-16">{bar.label}</span>
                      <div className="flex-1 h-5 bg-surface-200 rounded-md overflow-hidden">
                        <div className={cn('h-full rounded-md', bar.color)} style={{ width: `${evaluations.length > 0 ? (bar.count / evaluations.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-surface-500 w-6">{bar.count}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-surface-500">
                  No evaluation data for trends. Complete evaluations to see score distribution.
                </div>
              )}
            </div>
          </Card>

          <Card header={<span className="text-sm font-semibold">Site Quality Ratings</span>}>
            <table className="cb-table">
              <thead>
                <tr><th>Site</th><th>Avg Score</th><th>Evals</th><th>Trend</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center py-8 text-surface-500">
                    Site quality ratings will appear once evaluations are completed.
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}