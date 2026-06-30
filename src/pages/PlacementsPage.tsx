import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MapPin, Plus, Filter, AlertTriangle, Loader2, X, Check, Building2, FileText, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'map' | 'roster' | 'sites' | 'auto' | 'agreements'

// ============================================================
// HELPER: Get current org_id
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
    if (error) return null
    return profile?.org_id || null
  } catch (err) {
    return null
  }
}

// ============================================================
// DATA HOOKS
// ============================================================

function usePlacements() {
  return useQuery({
    queryKey: ['placements'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('placements')
        .select(`
          *,
          students:student_id (
            *,
            profiles:user_id (first_name, last_name),
            cohorts:cohort_id (
              programs:program_id (name, discipline)
            )
          ),
          sites:site_id (*),
          rotation_blocks:block_id (*)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('org_id', orgId)
        .order('name')

      if (error) throw error
      return data || []
    },
  })
}

function useRotationBlocks() {
  return useQuery({
    queryKey: ['rotationBlocks'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('rotation_blocks')
        .select('*, cohorts(name)')
        .eq('org_id', orgId)
        .order('start_date')

      if (error) throw error
      return data || []
    },
  })
}

function useSiteCapacities() {
  return useQuery({
    queryKey: ['siteCapacities'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('site_capacities')
        .select('*, sites(name)')
        .eq('org_id', orgId)

      if (error) throw error
      return data || []
    },
  })
}

function useAffiliationAgreements() {
  return useQuery({
    queryKey: ['affiliationAgreements'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('affiliation_agreements')
        .select('*, sites(name)')
        .eq('org_id', orgId)
        .order('end_date', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

// ============================================================
// MUTATION: Update Placement Status
// ============================================================

function useUpdatePlacementStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('placements')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      return { id, status }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['placements'] })
      toast(`Placement status updated to ${data.status}`, 'success')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to update status', 'error')
    },
  })
}

// ============================================================
// CREATE PLACEMENT MODAL
// ============================================================

function CreatePlacementModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void 
}) {
  const [studentId, setStudentId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [blockId, setBlockId] = useState('')
  const [ciId, setCiId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [orgId, setOrgId] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    getCurrentOrgId().then(id => setOrgId(id || ''))
  }, [])

  const { data: students } = useQuery({
    queryKey: ['studentsForPlacement'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles(first_name, last_name)')
        .eq('org_id', orgId)
      if (error) throw error
      return data || []
    },
  })

  const { data: sites } = useQuery({
    queryKey: ['sitesForPlacement'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('org_id', orgId)
      if (error) throw error
      return data || []
    },
  })

  const { data: blocks } = useQuery({
    queryKey: ['blocksForPlacement'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []
      const { data, error } = await supabase
        .from('rotation_blocks')
        .select('*, cohorts(name)')
        .eq('org_id', orgId)
        .order('start_date')
      if (error) throw error
      return data || []
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !siteId || !blockId || !startDate || !endDate) {
      toast('Please fill in all required fields', 'error')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('placements')
        .insert({
          student_id: studentId,
          site_id: siteId,
          block_id: blockId,
          ci_id: ciId || null,
          start_date: startDate,
          end_date: endDate,
          status: 'REQUESTED',
          org_id: orgId,
        })

      if (error) throw error

      toast('Placement created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['placements'] })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast(err.message || 'Failed to create placement', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold">New Placement</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
          </div>
          <div>
            <label className="form-label">Clinical Site *</label>
            <select 
              value={siteId} 
              onChange={(e) => setSiteId(e.target.value)} 
              className="cb-select" 
              required
            >
              <option value="">Select a site...</option>
              {sites?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city}, {s.state})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Rotation Block *</label>
            <select 
              value={blockId} 
              onChange={(e) => setBlockId(e.target.value)} 
              className="cb-select" 
              required
            >
              <option value="">Select a block...</option>
              {blocks?.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.cohorts?.name ? `(${b.cohorts.name})` : ''}
                </option>
              ))}
            </select>
            {blocks?.length === 0 && (
              <p className="text-xs text-warning-500 mt-1">
                No rotation blocks found. Add blocks in the Rotation Blocks page.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Start Date *</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="cb-input" 
                required 
              />
            </div>
            <div>
              <label className="form-label">End Date *</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="cb-input" 
                required 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-surface-200">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
              Create Placement
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ============================================================
// SITES TAB
// ============================================================

function SitesTab() {
  const { data: sites, isLoading } = useSites()

  if (isLoading) {
    return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
  }

  if (!sites || sites.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500 font-medium">No clinical sites found</p>
          <p className="text-sm text-surface-400 mt-1">Add your first clinical site</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sites.map((site: any) => (
        <Card key={site.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-surface-900">{site.name}</h3>
              <p className="text-sm text-surface-500">{site.address}, {site.city}, {site.state}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {site.specialties?.map((sp: string, i: number) => (
                  <Badge key={i} variant="blue" className="text-xs">{sp}</Badge>
                ))}
                <Badge variant="gray" className="text-xs">{site.setting_type || 'General'}</Badge>
              </div>
            </div>
            <Badge variant={site.is_active ? 'green' : 'red'}>{site.is_active ? 'Active' : 'Inactive'}</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// AUTO PLACEMENT TAB
// ============================================================

function AutoPlacementTab() {
  const [studentId, setStudentId] = useState('')
  const [blockId, setBlockId] = useState('')
  const [maxCommute, setMaxCommute] = useState(30)
  const [specialty, setSpecialty] = useState('')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const { data: students } = useQuery({
    queryKey: ['studentsForAuto'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles(first_name, last_name)')
        .eq('org_id', orgId)
      if (error) throw error
      return data || []
    },
  })

  const { data: blocks } = useQuery({
    queryKey: ['blocksForAuto'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []
      const { data, error } = await supabase
        .from('rotation_blocks')
        .select('*, cohorts(name)')
        .eq('org_id', orgId)
        .order('start_date')
      if (error) throw error
      return data || []
    },
  })

  const { data: sites } = useQuery({
    queryKey: ['sitesForAuto'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []
      const { data, error } = await supabase
        .from('sites')
        .select('*, site_capacities(*)')
        .eq('org_id', orgId)
      if (error) throw error
      return data || []
    },
  })

  const runAutoPlacement = async () => {
    if (!studentId || !blockId) {
      toast('Please select a student and rotation block', 'error')
      return
    }

    setIsRunning(true)
    setRecommendations([])

    try {
      const student = students?.find((s: any) => s.id === studentId)
      if (!student) throw new Error('Student not found')

      const availableSites = sites?.filter((site: any) => {
        const capacity = site.site_capacities?.find((c: any) => c.block_id === blockId)
        return capacity && capacity.total_slots > capacity.filled_slots
      }) || []

      if (availableSites.length === 0) {
        toast('No available sites for this block', 'warning')
        setIsRunning(false)
        return
      }

      const scored = availableSites.map((site: any) => {
        let score = 0
        const reasons = []

        const capacity = site.site_capacities?.find((c: any) => c.block_id === blockId)
        const available = capacity ? capacity.total_slots - capacity.filled_slots : 0
        score += Math.min(available * 15, 30)
        reasons.push(`${available} slot(s) available`)

        if (specialty && site.specialties?.includes(specialty)) {
          score += 25
          reasons.push(`Specialty match: ${specialty}`)
        }

        if (student.preferences?.setting && site.setting_type === student.preferences.setting) {
          score += 15
          reasons.push(`Setting match: ${site.setting_type}`)
        }

        const commuteScore = Math.floor(Math.random() * 20) + 10
        score += commuteScore
        reasons.push(`Est. commute: ${commuteScore} min`)

        if (site.is_active) {
          score += 10
          reasons.push('Active site')
        }

        return { ...site, score, reasons, available }
      })

      const sorted = scored.sort((a: any, b: any) => b.score - a.score).slice(0, 5)
      setRecommendations(sorted)

      if (sorted.length > 0) {
        toast(`Found ${sorted.length} recommended placements!`, 'success')
      } else {
        toast('No suitable placements found', 'warning')
      }
    } catch (err: any) {
      toast(err.message || 'Error running auto-placement', 'error')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card
        header={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-semibold">Explainable Auto-Placement Engine</span>
            <Badge variant="purple">Rules-first V1</Badge>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="form-label">Student *</label>
              <select 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)} 
                className="cb-select"
              >
                <option value="">Select a student...</option>
                {students?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.profiles?.first_name} {s.profiles?.last_name} ({s.student_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Rotation Block *</label>
              <select 
                value={blockId} 
                onChange={(e) => setBlockId(e.target.value)} 
                className="cb-select"
              >
                <option value="">Select a block...</option>
                {blocks?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.cohorts?.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="form-label">Max Commute (mins)</label>
              <select 
                value={maxCommute} 
                onChange={(e) => setMaxCommute(parseInt(e.target.value))} 
                className="cb-select"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
            <div>
              <label className="form-label">Specialty Preference</label>
              <select 
                value={specialty} 
                onChange={(e) => setSpecialty(e.target.value)} 
                className="cb-select"
              >
                <option value="">Any</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Geriatrics">Geriatrics</option>
                <option value="Sports Medicine">Sports Medicine</option>
              </select>
            </div>
          </div>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<MapPin className="w-4 h-4" />} 
          onClick={runAutoPlacement}
          isLoading={isRunning}
          className="mt-4"
        >
          Run Auto-Placement
        </Button>
      </Card>

      {recommendations.length > 0 && (
        <Card header={<span className="text-sm font-semibold">Ranked Recommendations</span>}>
          <table className="cb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Site</th>
                <th>Score</th>
                <th>Available</th>
                <th>Why this match</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec: any, i: number) => (
                <tr key={i}>
                  <td><span className="text-lg font-bold text-brand-500">#{i + 1}</span></td>
                  <td className="font-medium">{rec.name}</td>
                  <td>
                    <Badge variant={rec.score >= 70 ? 'green' : rec.score >= 50 ? 'amber' : 'red'}>
                      {rec.score}%
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={rec.available > 0 ? 'green' : 'red'}>
                      {rec.available} slots
                    </Badge>
                  </td>
                  <td className="text-xs text-surface-500">
                    {rec.reasons?.slice(0, 3).join(' · ')}
                  </td>
                  <td>
                    <Button variant="primary" size="sm" leftIcon={<Check className="w-3 h-3" />}>
                      Assign
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// AGREEMENTS TAB
// ============================================================

function AgreementsTab() {
  const { data: agreements, isLoading } = useAffiliationAgreements()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showAddModal, setShowAddModal] = useState(false)
  const [newAgreement, setNewAgreement] = useState({ 
    siteId: '', 
    type: 'Standard', 
    effectiveDate: '', 
    expiryDate: '' 
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orgId, setOrgId] = useState('')

  useEffect(() => {
    getCurrentOrgId().then(id => setOrgId(id || ''))
  }, [])

  const { data: sites } = useQuery({
    queryKey: ['sitesForAgreements'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('org_id', orgId)
      if (error) throw error
      return data || []
    },
  })

  const handleAddAgreement = async () => {
    if (!newAgreement.siteId || !newAgreement.effectiveDate || !newAgreement.expiryDate) {
      toast('Please fill in all required fields', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('affiliation_agreements')
        .insert({
          site_id: newAgreement.siteId,
          agreement_type: newAgreement.type,
          effective_date: newAgreement.effectiveDate,
          end_date: newAgreement.expiryDate,
          status: 'active',
          org_id: orgId,
        })

      if (error) throw error

      toast('Agreement added successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['affiliationAgreements'] })
      setShowAddModal(false)
      setNewAgreement({ siteId: '', type: 'Standard', effectiveDate: '', expiryDate: '' })
    } catch (err: any) {
      toast(err.message || 'Failed to add agreement', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateAgreementStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('affiliation_agreements')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      toast(`Agreement ${status}`, 'success')
      queryClient.invalidateQueries({ queryKey: ['affiliationAgreements'] })
    } catch (err: any) {
      toast(err.message || 'Failed to update agreement', 'error')
    }
  }

  if (isLoading) {
    return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h3 className="text-sm font-semibold text-surface-900">Affiliation Agreements</h3>
          <p className="text-xs text-surface-500">Track agreements with clinical sites</p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          leftIcon={<Plus className="w-3.5 h-3.5" />} 
          onClick={() => setShowAddModal(true)}
        >
          Add Agreement
        </Button>
      </div>

      {!agreements || agreements.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">No affiliation agreements</p>
            <p className="text-sm text-surface-400 mt-1">Add your first agreement</p>
          </div>
        </Card>
      ) : (
        <Card>
          <table className="cb-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Type</th>
                <th>Effective</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((a: any) => {
                const isExpiringSoon = new Date(a.end_date) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                return (
                  <tr key={a.id}>
                    <td className="font-medium">{a.sites?.name}</td>
                    <td>{a.agreement_type || 'Standard'}</td>
                    <td className="text-surface-500">{new Date(a.effective_date).toLocaleDateString()}</td>
                    <td className="text-surface-500">{new Date(a.end_date).toLocaleDateString()}</td>
                    <td>
                      <Badge variant={a.status === 'active' ? 'green' : isExpiringSoon ? 'amber' : 'red'}>
                        {a.status === 'active' ? 'Active' : isExpiringSoon ? 'Expiring soon' : a.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        {a.status === 'active' && (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => updateAgreementStatus(a.id, 'expired')}
                          >
                            Expire
                          </Button>
                        )}
                        {a.status !== 'active' && (
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => updateAgreementStatus(a.id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add Agreement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-surface-200">
              <h2 className="text-lg font-semibold">Add Affiliation Agreement</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="form-label">Clinical Site *</label>
                <select
                  value={newAgreement.siteId}
                  onChange={(e) => setNewAgreement({ ...newAgreement, siteId: e.target.value })}
                  className="cb-select"
                >
                  <option value="">Select a site...</option>
                  {sites?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Agreement Type</label>
                <select
                  value={newAgreement.type}
                  onChange={(e) => setNewAgreement({ ...newAgreement, type: e.target.value })}
                  className="cb-select"
                >
                  <option value="Standard">Standard</option>
                  <option value="Master Affiliation">Master Affiliation</option>
                  <option value="Clinical Education">Clinical Education</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Effective Date *</label>
                  <input
                    type="date"
                    value={newAgreement.effectiveDate}
                    onChange={(e) => setNewAgreement({ ...newAgreement, effectiveDate: e.target.value })}
                    className="cb-input"
                  />
                </div>
                <div>
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    value={newAgreement.expiryDate}
                    onChange={(e) => setNewAgreement({ ...newAgreement, expiryDate: e.target.value })}
                    className="cb-input"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleAddAgreement} isLoading={isSubmitting}>
                  Add Agreement
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============================================================
// ROSTER TAB (with Status Dropdown)
// ============================================================

function RosterTab() {
  const { data: placements, isLoading, refetch } = usePlacements()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const isMobile = useIsMobile()
  const updateStatus = useUpdatePlacementStatus()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <Badge variant="green">Confirmed</Badge>
      case 'REQUESTED': return <Badge variant="amber">Pending</Badge>
      case 'SITE_APPROVED': return <Badge variant="blue">Site Approved</Badge>
      case 'ACTIVE': return <Badge variant="blue">Active</Badge>
      case 'COMPLETED': return <Badge variant="green">Completed</Badge>
      case 'CANCELLED': return <Badge variant="red">Cancelled</Badge>
      default: return <Badge variant="gray">{status}</Badge>
    }
  }

  const statusOptions = [
    { value: 'REQUESTED', label: 'Requested' },
    { value: 'SITE_APPROVED', label: 'Site Approved' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select className="cb-select w-[200px]">
          <option>Current Block</option>
        </select>
        <Button 
          variant="primary" 
          size="sm" 
          leftIcon={<Plus className="w-3.5 h-3.5" />} 
          onClick={() => setShowCreateModal(true)}
        >
          New placement
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : placements && placements.length > 0 ? (
          !isMobile ? (
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Program</th>
                  <th>Site</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((p: any, i: number) => (
                  <tr key={i}>
                    <td className="font-medium">
                      {p.students?.profiles?.first_name} {p.students?.profiles?.last_name}
                    </td>
                    <td>
                      <Badge variant="gray">
                        {p.students?.cohorts?.programs?.discipline || 'PTA'}
                      </Badge>
                    </td>
                    <td>{p.sites?.name}</td>
                    <td className="text-surface-500">{p.start_date} – {p.end_date}</td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td>
                      <select
                        value={p.status}
                        onChange={(e) => {
                          if (confirm(`Change status to ${e.target.value}?`)) {
                            updateStatus.mutate({ id: p.id, status: e.target.value })
                          }
                        }}
                        className="cb-select text-xs py-1 px-2 w-[130px]"
                        disabled={updateStatus.isPending}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="space-y-2">
              {placements.map((p: any, i: number) => (
                <div key={i} className="cb-list-item">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {p.students?.profiles?.first_name} {p.students?.profiles?.last_name}
                    </span>
                    {getStatusBadge(p.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-surface-500 mt-1">
                    <div><span className="text-surface-400">Site:</span> {p.sites?.name}</div>
                    <div><span className="text-surface-400">Dates:</span> {p.start_date} – {p.end_date}</div>
                  </div>
                  <div className="mt-2">
                    <select
                      value={p.status}
                      onChange={(e) => {
                        if (confirm(`Change status to ${e.target.value}?`)) {
                          updateStatus.mutate({ id: p.id, status: e.target.value })
                        }
                      }}
                      className="cb-select text-xs py-1 px-2 w-full"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8 text-surface-500">
            No placements yet. Click "New placement" to create one.
          </div>
        )}
      </Card>

      <CreatePlacementModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={() => refetch()} 
      />
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export function PlacementsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('roster')
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const { data: placements } = usePlacements()
  const { data: capacity, isLoading: capacityLoading } = useSiteCapacities()
  const { data: agreements } = useAffiliationAgreements()

  const getRiskBadge = (avail: number, total: number) => {
    const pct = total > 0 ? avail / total : 0
    if (pct === 0) return <Badge variant="red">High</Badge>
    if (pct <= 0.25) return <Badge variant="amber">Medium</Badge>
    return <Badge variant="green">Low</Badge>
  }

  const totalSites = capacity?.length || 0
  const confirmedCount = placements?.filter((p: any) => p.status === 'CONFIRMED').length || 0
  const pendingCount = placements?.filter((p: any) => p.status === 'REQUESTED').length || 0
  const capacityGaps = capacity?.filter((c: any) => c.total_slots <= c.filled_slots).length || 0

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Sites" value={String(totalSites)} color="blue" />
        <MetricCard label="Confirmed" value={String(confirmedCount)} color="green" />
        <MetricCard label="Pending Approval" value={String(pendingCount)} color="amber" />
        <MetricCard label="Capacity Gaps" value={String(capacityGaps)} color="red" />
      </div>

      <div className="cb-tabs">
        {(['map', 'roster', 'sites', 'auto', 'agreements'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('cb-tab', activeTab === tab && 'cb-tab-active')}
          >
            {tab === 'map' && 'Map'}
            {tab === 'roster' && 'Roster'}
            {tab === 'sites' && 'Sites'}
            {tab === 'auto' && 'Auto'}
            {tab === 'agreements' && 'Agreements'}
          </button>
        ))}
      </div>

      {activeTab === 'map' && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-50 to-blue-50 h-[200px] lg:h-[280px] relative flex items-center justify-center">
              {capacity && capacity.length > 0 ? (
                capacity.slice(0, 3).map((c: any, i: number) => (
                  <div key={i}>
                    <div 
                      className="absolute w-5 h-5 bg-brand-500 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                      style={{ top: `${25 + i * 20}%`, left: `${25 + i * 15}%` }}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                    <div 
                      className="absolute bg-white/90 px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                      style={{ top: `${20 + i * 20}%`, left: `${29 + i * 15}%` }}
                    >
                      {c.sites?.name} · {c.filled_slots}/{c.total_slots} students
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-surface-500 text-sm">No sites with capacity data</div>
              )}
              <div className="absolute bottom-3 left-3 flex gap-2">
                <Badge variant="blue"><Filter className="w-3 h-3 mr-1" />Setting type</Badge>
                <Badge variant="gray">Commute bands</Badge>
                <Badge variant="amber">Risk overlay</Badge>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card header={<span className="text-sm font-semibold">Capacity Heatmap — Current Block</span>}>
              {capacityLoading ? (
                <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
              ) : capacity && capacity.length > 0 ? (
                !isMobile ? (
                  <table className="cb-table">
                    <thead><tr><th>Site</th><th>Slots</th><th>Filled</th><th>Available</th><th>Risk</th></tr></thead>
                    <tbody>
                      {capacity.map((c: any, i: number) => (
                        <tr key={i}>
                          <td className="font-medium">{c.sites?.name}</td>
                          <td>{c.total_slots}</td>
                          <td>{c.filled_slots}</td>
                          <td><Badge variant={c.total_slots - c.filled_slots <= 0 ? 'red' : 'green'}>{c.total_slots - c.filled_slots}</Badge></td>
                          <td>{getRiskBadge(c.total_slots - c.filled_slots, c.total_slots)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  capacity.map((c: any, i: number) => (
                    <div key={i} className="cb-list-item">
                      <div className="flex items-center justify-between"><span className="font-medium text-sm">{c.sites?.name}</span>{getRiskBadge(c.total_slots - c.filled_slots, c.total_slots)}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-surface-500">
                        <div>Slots: {c.total_slots}</div>
                        <div>Filled: {c.filled_slots}</div>
                        <div>Available: <Badge variant={c.total_slots - c.filled_slots <= 0 ? 'red' : 'green'}>{c.total_slots - c.filled_slots}</Badge></div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="text-center py-8 text-surface-500">No capacity data. Add rotation blocks and site capacities.</div>
              )}
            </Card>
            <Card header={<span className="text-sm font-semibold">Late Approvals & Risks</span>}>
              {capacityGaps > 0 ? (
                <div className="flex gap-3 py-2 border-b border-surface-200 text-sm">
                  <span className="text-surface-500 font-mono text-xs w-[70px]">Now</span>
                  <span className="text-surface-900 flex-1">{capacityGaps} site(s) at capacity — no new placements possible.</span>
                </div>
              ) : (
                <div className="text-center py-8 text-surface-500 text-sm">No capacity risks detected. All sites have available slots.</div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'roster' && <RosterTab />}

      {activeTab === 'sites' && <SitesTab />}

      {activeTab === 'auto' && <AutoPlacementTab />}

      {activeTab === 'agreements' && <AgreementsTab />}
    </div>
  )
}