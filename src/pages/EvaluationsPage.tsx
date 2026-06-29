import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { MobileCardList } from '@/components/modules/MobileCardList'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { useEvaluations, useEvalTemplates, useRemediationPlans, useEvaluationStats } from '@/hooks/data'
import { Plus, FileText, Loader2, X, ClipboardList, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// ============================================================
// HELPER: Get current org_id
// ============================================================

async function getCurrentOrgId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .single()
  return profile?.org_id || null
}

// ============================================================
// CREATE EVALUATION MODAL (FIXED)
// ============================================================

interface CreateEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function CreateEvaluationModal({ isOpen, onClose, onSuccess }: CreateEvaluationModalProps) {
  const [studentId, setStudentId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [placementId, setPlacementId] = useState('')
  const [ciId, setCiId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [orgId, setOrgId] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get org_id on mount
  useEffect(() => {
    getCurrentOrgId().then(id => setOrgId(id || ''))
  }, [])

  // Fetch students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles(first_name, last_name)')
        .eq('org_id', orgId)
      if (error) throw error
      return data || []
    },
    enabled: !!orgId,
  })

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['evalTemplates', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const { data, error } = await supabase
        .from('evaluation_templates')
        .select('*')
        .eq('org_id', orgId)
      if (error) throw error
      return data || []
    },
    enabled: !!orgId,
  })

  // Fetch placements for selected student
  const { data: placements, isLoading: placementsLoading } = useQuery({
    queryKey: ['studentPlacements', studentId],
    queryFn: async () => {
      if (!studentId) return []
      const { data, error } = await supabase
        .from('placements')
        .select('*, sites(name)')
        .eq('student_id', studentId)
        .in('status', ['CONFIRMED', 'ACTIVE', 'SITE_APPROVED'])
      if (error) throw error
      return data || []
    },
    enabled: !!studentId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !templateId || !placementId) {
      toast('Please fill in all required fields', 'error')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('evaluation_instances')
        .insert({
          student_id: studentId,
          template_id: templateId,
          placement_id: placementId,
          ci_id: ciId || null,
          status: 'draft',
          scores: {},
          org_id: orgId,
        })

      if (error) throw error

      toast('Evaluation created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast(err.message || 'Failed to create evaluation', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900">New Evaluation</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Student */}
          <div>
            <label className="form-label">Student *</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="cb-select"
              required
            >
              <option value="">Select a student...</option>
              {students?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.profiles?.first_name} {s.profiles?.last_name} ({s.student_id})
                </option>
              ))}
            </select>
            {students?.length === 0 && (
              <p className="text-xs text-surface-500 mt-1">No students found. Please add students first.</p>
            )}
          </div>

          {/* Placement */}
          <div>
            <label className="form-label">Placement *</label>
            <select
              value={placementId}
              onChange={(e) => setPlacementId(e.target.value)}
              className="cb-select"
              required
            >
              <option value="">Select a placement...</option>
              {placements?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.sites?.name} ({p.start_date} – {p.end_date})
                </option>
              ))}
            </select>
            {placements?.length === 0 && studentId && (
              <p className="text-xs text-surface-500 mt-1">No confirmed placements for this student.</p>
            )}
          </div>

          {/* Template */}
          <div>
            <label className="form-label">Template *</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="cb-select"
              required
            >
              <option value="">Select a template...</option>
              {templates?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
            {templates?.length === 0 && (
              <p className="text-xs text-surface-500 mt-1">No templates found. Please create templates first.</p>
            )}
          </div>

          {/* CI (Optional) */}
          <div>
            <label className="form-label">Clinical Instructor (Optional)</label>
            <input
              type="text"
              value={ciId}
              onChange={(e) => setCiId(e.target.value)}
              className="cb-input"
              placeholder="CI ID or name"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-surface-200">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
              Create Evaluation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ============================================================
// CREATE TEMPLATE MODAL
// ============================================================

function CreateTemplateModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('midterm')
  const [competencies, setCompetencies] = useState([{ name: '', max_score: 5, description: '', required_narrative: false }])
  const [isLoading, setIsLoading] = useState(false)
  const [orgId, setOrgId] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    getCurrentOrgId().then(id => setOrgId(id || ''))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || competencies.some(c => !c.name)) {
      toast('Please fill in all required fields', 'error')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('evaluation_templates')
        .insert({
          name,
          type,
          competencies,
          is_active: true,
          org_id: orgId,
        })

      if (error) throw error

      toast('Template created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['evalTemplates'] })
      onSuccess()
      onClose()
      setName('')
      setType('midterm')
      setCompetencies([{ name: '', max_score: 5, description: '', required_narrative: false }])
    } catch (err: any) {
      toast(err.message || 'Failed to create template', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const addCompetency = () => {
    setCompetencies([...competencies, { name: '', max_score: 5, description: '', required_narrative: false }])
  }

  const removeCompetency = (index: number) => {
    setCompetencies(competencies.filter((_, i) => i !== index))
  }

  const updateCompetency = (index: number, field: string, value: any) => {
    const updated = [...competencies]
    updated[index] = { ...updated[index], [field]: value }
    setCompetencies(updated)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900">New Evaluation Template</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="form-label">Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cb-input"
              placeholder="e.g., PTA Midterm Evaluation"
              required
            />
          </div>

          <div>
            <label className="form-label">Type *</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="cb-select">
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="summative">Summative</option>
            </select>
          </div>

          <div>
            <label className="form-label font-semibold">Competencies</label>
            {competencies.map((comp, index) => (
              <div key={index} className="p-3 bg-surface-50 rounded-lg border border-surface-200 mb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) => updateCompetency(index, 'name', e.target.value)}
                    className="cb-input flex-1"
                    placeholder="Competency name"
                  />
                  <button
                    type="button"
                    onClick={() => removeCompetency(index)}
                    className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={comp.description}
                  onChange={(e) => updateCompetency(index, 'description', e.target.value)}
                  className="cb-input mt-2"
                  placeholder="Description (optional)"
                />
                <div className="flex gap-2 mt-2">
                  <select
                    value={comp.max_score}
                    onChange={(e) => updateCompetency(index, 'max_score', parseInt(e.target.value))}
                    className="cb-select flex-1"
                  >
                    <option value={3}>3-point scale</option>
                    <option value={5}>5-point scale</option>
                    <option value={10}>10-point scale</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-surface-600">
                    <input
                      type="checkbox"
                      checked={comp.required_narrative}
                      onChange={(e) => updateCompetency(index, 'required_narrative', e.target.checked)}
                    />
                    Requires narrative
                  </label>
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addCompetency} className="mt-2">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Competency
            </Button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-surface-200">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
              Create Template
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ============================================================
// CREATE REMEDIATION MODAL
// ============================================================

function CreateRemediationModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [evaluationId, setEvaluationId] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tasks, setTasks] = useState([{ description: '', deadline: '', status: 'pending', evidence: '' }])
  const [isLoading, setIsLoading] = useState(false)
  const [orgId, setOrgId] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    getCurrentOrgId().then(id => setOrgId(id || ''))
  }, [])

  // Fetch evaluations with low scores
  const { data: evaluations } = useQuery({
    queryKey: ['evaluationsForRemediation'],
    queryFn: async () => {
      if (!orgId) return []
      const { data, error } = await supabase
        .from('evaluation_instances')
        .select('*, students(profiles(first_name, last_name))')
        .eq('org_id', orgId)
        .lt('total_score', 3)
        .neq('status', 'remediation')
      if (error) throw error
      return data || []
    },
    enabled: !!orgId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evaluationId || !description || !dueDate) {
      toast('Please fill in all required fields', 'error')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('remediation_plans')
        .insert({
          evaluation_id: evaluationId,
          description,
          deadline: dueDate,
          tasks: tasks.filter(t => t.description.trim()),
          status: 'active',
          org_id: orgId,
        })

      if (error) throw error

      // Update evaluation status
      await supabase
        .from('evaluation_instances')
        .update({ status: 'remediation' })
        .eq('id', evaluationId)

      toast('Remediation plan created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['remediationPlans'] })
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast(err.message || 'Failed to create remediation plan', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const addTask = () => {
    setTasks([...tasks, { description: '', deadline: '', status: 'pending', evidence: '' }])
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const updateTask = (index: number, field: string, value: string) => {
    const updated = [...tasks]
    updated[index] = { ...updated[index], [field]: value }
    setTasks(updated)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900">New Remediation Plan</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="form-label">Evaluation *</label>
            <select
              value={evaluationId}
              onChange={(e) => setEvaluationId(e.target.value)}
              className="cb-select"
              required
            >
              <option value="">Select an evaluation...</option>
              {evaluations?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.students?.profiles?.first_name} {e.students?.profiles?.last_name} - Score: {e.total_score}/5
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="cb-textarea"
              placeholder="Describe the remediation plan..."
              rows={2}
            />
          </div>

          <div>
            <label className="form-label">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="cb-input"
              required
            />
          </div>

          <div>
            <label className="form-label font-semibold">Tasks</label>
            {tasks.map((task, index) => (
              <div key={index} className="p-3 bg-surface-50 rounded-lg border border-surface-200 mb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={task.description}
                    onChange={(e) => updateTask(index, 'description', e.target.value)}
                    className="cb-input flex-1"
                    placeholder="Task description"
                  />
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="date"
                  value={task.deadline}
                  onChange={(e) => updateTask(index, 'deadline', e.target.value)}
                  className="cb-input mt-2"
                />
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addTask} className="mt-2">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
            </Button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-surface-200">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
              Create Remediation Plan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export function EvaluationsPage() {
  const { isAdmin } = useAuth()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<'list' | 'templates' | 'remediation' | 'trends'>('list')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showRemediationModal, setShowRemediationModal] = useState(false)

  const { data: evaluations, isLoading: evalsLoading, refetch } = useEvaluations()
  const { data: templates, refetch: refetchTemplates } = useEvalTemplates()
  const { data: remediationPlans, refetch: refetchRemediation } = useRemediationPlans()
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
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Active Evals" value={String(activeEvals)} color="blue" />
        <MetricCard label="Completed" value={String(completed)} color="green" />
        <MetricCard label="Pending Sign" value={String(pendingSign)} color="amber" />
        <MetricCard label="Remediation" value={String(remediationCount)} color="red" />
      </div>

      {/* Tabs */}
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
              <Button 
                variant="primary" 
                size="sm" 
                className="ml-auto" 
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowCreateModal(true)}
              >
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
                {isAdmin && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setShowTemplateModal(true)}
                  >
                    New Template
                  </Button>
                )}
              </div>
            }
          >
            <div className="space-y-2">
              {templates && templates.length > 0 ? (
                templates.map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-surface-200 last:border-0">
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-surface-500">{t.type} · {t.competencies?.length || 0} competencies</div>
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

          <Card header={<span className="text-sm font-semibold">Template Preview</span>}>
            {templates && templates.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Competency Areas</div>
                {templates[0]?.competencies?.map((comp: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-surface-200">
                    <span className="text-sm">{comp.name}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: comp.max_score || 5 }, (_, n) => (
                        <div key={n} className="w-3.5 h-3.5 rounded bg-brand-500 cursor-pointer hover:opacity-70" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-surface-500 text-sm">
                Create a template to see a preview here.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Remediation */}
      {activeTab === 'remediation' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <Button 
                variant="primary" 
                size="sm" 
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowRemediationModal(true)}
              >
                New Remediation Plan
              </Button>
            </div>
          )}
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
                No active remediation plans. All students meeting expectations.
              </div>
            )}
          </Card>
        </div>
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
                  <div className="text-xs text-surface-500 mt-2 text-center">
                    Based on {evaluations.length} evaluation(s)
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-surface-500">
                  No evaluation data for trends. Complete evaluations to see score distribution.
                </div>
              )}
            </div>
          </Card>

          <Card header={<span className="text-sm font-semibold">Site Quality Ratings</span>}>
            {evaluations && evaluations.length > 0 ? (
              <table className="cb-table">
                <thead>
                  <tr><th>Site</th><th>Avg Score</th><th>Evals</th><th>Trend</th></tr>
                </thead>
                <tbody>
                  {(() => {
                    const siteData = evaluations.reduce((acc: any, e: any) => {
                      const siteName = e.sites?.name || 'Unknown'
                      if (!acc[siteName]) acc[siteName] = { total: 0, count: 0 }
                      acc[siteName].total += e.total_score || 0
                      acc[siteName].count += 1
                      return acc
                    }, {})
                    return Object.entries(siteData).map(([site, data]: [string, any]) => (
                      <tr key={site}>
                        <td className="font-medium">{site}</td>
                        <td>{(data.total / data.count).toFixed(1)}</td>
                        <td>{data.count}</td>
                        <td>↑</td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-surface-500">
                Site quality ratings will appear once evaluations are completed.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modals */}
      <CreateEvaluationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />

      <CreateTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSuccess={() => refetchTemplates()}
      />

      <CreateRemediationModal
        isOpen={showRemediationModal}
        onClose={() => setShowRemediationModal(false)}
        onSuccess={() => {
          refetch()
          refetchRemediation()
        }}
      />
    </div>
  )
}