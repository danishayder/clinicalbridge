import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { useToast } from '@/hooks/useToast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Loader2, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
interface Cohort {
  id: string
  name: string
  code?: string
  start_date: string
  end_date: string
  status: string
  program_id: string
  org_id: string
  created_at: string
  programs?: { name: string; discipline: string }
}

// --- Helper ---
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

// --- Hooks ---
function useCohorts() {
  return useQuery({
    queryKey: ['cohorts'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      // ✅ FIXED: Get cohorts with a simpler query
      const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .eq('org_id', orgId)
        .order('start_date', { ascending: false })

      if (error) {
        console.error('❌ Cohorts error:', error)
        throw error
      }

      // Get programs separately
      if (data && data.length > 0) {
        const programIds = data.map(c => c.program_id)
        const { data: programs, error: programsError } = await supabase
          .from('programs')
          .select('id, name, discipline')
          .in('id', programIds)

        if (!programsError) {
          // Merge programs into cohorts
          const merged = data.map(cohort => ({
            ...cohort,
            programs: programs?.find(p => p.id === cohort.program_id)
          }))
          return merged
        }
      }

      return data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })
}

function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('programs')
        .select('id, name, discipline')
        .eq('org_id', orgId)

      if (error) throw error
      return data || []
    },
  })
}

function useCreateCohort() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (cohort: any) => {
      const { data, error } = await supabase
        .from('cohorts')
        .insert(cohort)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] })
      toast('Cohort created successfully', 'success')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to create cohort', 'error')
    },
  })
}

function useDeleteCohort() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cohorts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] })
    },
  })
}

// --- Add Cohort Modal ---
function AddCohortModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [programId, setProgramId] = useState('')
  const { data: programs } = usePrograms()
  const createCohort = useCreateCohort()
  const [orgId, setOrgId] = useState('')

  // Get org_id
  useState(() => {
    getCurrentOrgId().then(id => setOrgId(id || ''))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCohort.mutateAsync({
      name,
      code,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      program_id: programId,
      org_id: orgId,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Add New Cohort</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Cohort Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cb-input"
              placeholder="e.g., Fall 2026"
              required
            />
          </div>
          <div>
            <label className="form-label">Cohort Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="cb-input"
              placeholder="e.g., PTA-F26"
            />
          </div>
          <div>
            <label className="form-label">Program</label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="cb-select"
              required
            >
              <option value="">Select a program...</option>
              {programs?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.discipline})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="cb-input"
                required
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="cb-input"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={createCohort.isPending}>
              Create Cohort
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// --- Main Page ---
export function CohortsPage() {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: cohorts, isLoading } = useCohorts()
  const deleteCohort = useDeleteCohort()

  const filteredCohorts = cohorts?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.programs?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="green">Active</Badge>
      case 'completed': return <Badge variant="blue">Completed</Badge>
      case 'upcoming': return <Badge variant="amber">Upcoming</Badge>
      default: return <Badge variant="gray">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Cohorts</h1>
          <p className="text-sm text-surface-500">Manage student cohorts and rotation blocks</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Add Cohort
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Cohorts" value={String(cohorts?.length || 0)} color="blue" />
        <MetricCard label="Active" value={String(cohorts?.filter(c => c.status === 'active').length || 0)} color="green" />
        <MetricCard label="Upcoming" value={String(cohorts?.filter(c => c.status === 'upcoming').length || 0)} color="amber" />
        <MetricCard label="Completed" value={String(cohorts?.filter(c => c.status === 'completed').length || 0)} color="blue" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search cohorts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="cb-input pl-10 w-full"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : filteredCohorts && filteredCohorts.length > 0 ? (
          <div className="divide-y divide-surface-200">
            {filteredCohorts.map((cohort) => (
              <div key={cohort.id} className="flex items-center justify-between py-4 px-4 hover:bg-surface-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900">{cohort.name}</div>
                    <div className="text-sm text-surface-500 flex items-center gap-2">
                      <Badge variant="gray">{cohort.code || '—'}</Badge>
                      <span>·</span>
                      <span>{cohort.programs?.name}</span>
                      <span>·</span>
                      <Calendar className="w-3 h-3 inline" />
                      <span>{new Date(cohort.start_date).toLocaleDateString()} – {new Date(cohort.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(cohort.status)}
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger-500" />}
                    onClick={() => {
                      if (confirm('Delete this cohort?')) deleteCohort.mutate(cohort.id)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">No cohorts found</p>
            <p className="text-sm text-surface-400 mt-1">
              {searchQuery ? 'Try different search' : 'Create your first cohort'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowModal(true)}
              >
                Add Cohort
              </Button>
            )}
          </div>
        )}
      </Card>

      {showModal && <AddCohortModal onClose={() => setShowModal(false)} />}
    </div>
  )
}