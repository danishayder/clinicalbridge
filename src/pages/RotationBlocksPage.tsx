import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Loader2, Calendar, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
// ADD BLOCK MODAL
// ============================================================

function AddBlockModal({ 
  onClose, 
  onSave, 
  cohorts 
}: { 
  onClose: () => void; 
  onSave: (data: any) => void; 
  cohorts: any[] 
}) {
  const [name, setName] = useState('')
  const [cohortId, setCohortId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expectedHours, setExpectedHours] = useState(160)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !cohortId || !startDate || !endDate) {
      toast('Please fill in all fields', 'error')
      return
    }
    setIsLoading(true)
    await onSave({ 
      name, 
      cohort_id: cohortId, 
      start_date: startDate, 
      end_date: endDate, 
      expected_hours: expectedHours 
    })
    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold">Add Rotation Block</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="form-label">Block Name *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="cb-input" 
              placeholder="e.g., Block 1: Acute Care" 
              required 
            />
          </div>
          <div>
            <label className="form-label">Cohort *</label>
            <select 
              value={cohortId} 
              onChange={(e) => setCohortId(e.target.value)} 
              className="cb-select" 
              required
            >
              <option value="">Select a cohort...</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
          <div>
            <label className="form-label">Expected Hours</label>
            <input 
              type="number" 
              value={expectedHours} 
              onChange={(e) => setExpectedHours(parseInt(e.target.value))} 
              className="cb-input" 
              min={1} 
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
              Add Block
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

export function RotationBlocksPage() {
  const [blocks, setBlocks] = useState<any[]>([])
  const [cohorts, setCohorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [orgId, setOrgId] = useState('')
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

  // Load org_id on mount
  useEffect(() => {
    getCurrentOrgId().then(id => setOrgId(id || ''))
  }, [])

  // Load data when orgId is available
  useEffect(() => {
    if (!orgId) return
    loadData()
  }, [orgId])

  async function loadData() {
    setLoading(true)
    try {
      const [blocksRes, cohortsRes] = await Promise.all([
        supabase
          .from('rotation_blocks')
          .select('*, cohorts(name)')
          .eq('org_id', orgId)
          .order('start_date'),
        supabase
          .from('cohorts')
          .select('id, name')
          .eq('org_id', orgId)
          .eq('status', 'active'),
      ])

      if (blocksRes.error) throw blocksRes.error
      if (cohortsRes.error) throw cohortsRes.error

      setBlocks(blocksRes.data || [])
      setCohorts(cohortsRes.data || [])
    } catch (err: any) {
      toast(err.message || 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddBlock(data: any) {
    const { error } = await supabase
      .from('rotation_blocks')
      .insert({ 
        ...data, 
        org_id: orgId, 
        status: 'active',
        created_at: new Date().toISOString(),
      })

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Rotation block added!', 'success')
      setShowAddModal(false)
      loadData()
      queryClient.invalidateQueries({ queryKey: ['rotationBlocks'] })
    }
  }

  async function handleDeleteBlock(id: string) {
    if (!confirm('Delete this rotation block?')) return
    const { error } = await supabase
      .from('rotation_blocks')
      .delete()
      .eq('id', id)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Block deleted', 'info')
      loadData()
      queryClient.invalidateQueries({ queryKey: ['rotationBlocks'] })
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('rotation_blocks')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast(`Block ${status}`, 'success')
      loadData()
      queryClient.invalidateQueries({ queryKey: ['rotationBlocks'] })
    }
  }

  const filteredBlocks = blocks.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.cohorts?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = blocks.filter(b => b.status === 'active').length
  const upcomingCount = blocks.filter(b => new Date(b.start_date) > new Date()).length
  const completedCount = blocks.filter(b => new Date(b.end_date) < new Date()).length

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Rotation Blocks</h1>
          <p className="text-sm text-surface-500">Manage clinical rotation blocks for cohorts</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus className="w-4 h-4" />} 
          onClick={() => setShowAddModal(true)}
        >
          Add Block
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Blocks" value={String(blocks.length)} color="blue" />
        <MetricCard label="Active" value={String(activeCount)} color="green" />
        <MetricCard label="Upcoming" value={String(upcomingCount)} color="amber" />
        <MetricCard label="Completed" value={String(completedCount)} color="gray" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input 
          type="text" 
          placeholder="Search blocks by name or cohort..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="cb-input pl-10 w-full" 
        />
      </div>

      {/* Blocks List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">No rotation blocks found</p>
            <p className="text-sm text-surface-400 mt-1">
              {searchQuery ? 'Try different search' : 'Add your first rotation block'}
            </p>
            {!searchQuery && (
              <Button 
                variant="primary" 
                size="sm" 
                className="mt-4" 
                leftIcon={<Plus className="w-3.5 h-3.5" />} 
                onClick={() => setShowAddModal(true)}
              >
                Add Block
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface-200">
            {filteredBlocks.map((block) => {
              const isActive = block.status === 'active'
              const isUpcoming = new Date(block.start_date) > new Date() && !isActive
              const isCompleted = new Date(block.end_date) < new Date()

              let statusVariant: 'green' | 'amber' | 'gray' = 'gray'
              if (isActive) statusVariant = 'green'
              else if (isUpcoming) statusVariant = 'amber'
              else if (isCompleted) statusVariant = 'gray'

              return (
                <div key={block.id} className="flex items-center justify-between py-4 px-4 hover:bg-surface-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="font-medium text-surface-900">{block.name}</div>
                      <div className="text-sm text-surface-500 flex flex-wrap items-center gap-2">
                        <Badge variant="gray">{block.cohorts?.name}</Badge>
                        <span>·</span>
                        <span>{new Date(block.start_date).toLocaleDateString()} – {new Date(block.end_date).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{block.expected_hours}h</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant}>
                      {block.status}
                    </Badge>
                    {isAdmin && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        {block.status !== 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUpdateStatus(block.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger-500" />} 
                          onClick={() => handleDeleteBlock(block.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <AddBlockModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddBlock} 
          cohorts={cohorts} 
        />
      )}
    </div>
  )
}