import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Loader2, BookOpen } from 'lucide-react'

// --- Types ---
interface Program {
  id: string
  name: string
  discipline: string
  standards_set: string
  org_id: string
  created_at: string
}

// --- Hooks ---
function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Program[]
    },
  })
}

function useCreateProgram() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (program: any) => {
      const { data, error } = await supabase
        .from('programs')
        .insert(program)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      toast('Program created successfully', 'success')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to create program', 'error')
    },
  })
}

function useDeleteProgram() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      toast('Program deleted', 'info')
    },
  })
}

// --- Add Program Modal ---
function AddProgramModal({ onClose, orgId }: { onClose: () => void; orgId: string }) {
  const [name, setName] = useState('')
  const [discipline, setDiscipline] = useState('PTA')
  const [standardsSet, setStandardsSet] = useState('CAPTE_2024')
  const createProgram = useCreateProgram()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProgram.mutateAsync({
      name,
      discipline,
      standards_set: standardsSet,
      org_id: orgId,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Add New Program</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Program Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cb-input"
              placeholder="e.g., Physical Therapist Assistant"
              required
            />
          </div>
          <div>
            <label className="form-label">Discipline</label>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="cb-select">
              <option value="PTA">PTA</option>
              <option value="DPT">DPT</option>
              <option value="OTA">OTA</option>
              <option value="NURSING">Nursing</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Accreditation Standard</label>
            <input
              type="text"
              value={standardsSet}
              onChange={(e) => setStandardsSet(e.target.value)}
              className="cb-input"
              placeholder="e.g., CAPTE_2024"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={createProgram.isPending}>
              Create Program
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// --- Main Page ---
export function ProgramsPage() {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const { data: programs, isLoading } = usePrograms()
  const deleteProgram = useDeleteProgram()

  // Get org_id from first program or use a default
  const orgId = programs?.[0]?.org_id || ''

  const filteredPrograms = programs?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.discipline.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDisciplineBadge = (d: string) => {
    const colors: Record<string, string> = {
      PTA: 'blue',
      DPT: 'purple',
      OTA: 'amber',
      NURSING: 'green',
      OTHER: 'gray',
    }
    return <Badge variant={colors[d] || 'gray'}>{d}</Badge>
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Programs</h1>
          <p className="text-sm text-surface-500">Manage academic programs and disciplines</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Add Program
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Programs" value={String(programs?.length || 0)} color="blue" />
        <MetricCard label="PTA Programs" value={String(programs?.filter(p => p.discipline === 'PTA').length || 0)} color="blue" />
        <MetricCard label="DPT Programs" value={String(programs?.filter(p => p.discipline === 'DPT').length || 0)} color="purple" />
        <MetricCard label="OTA Programs" value={String(programs?.filter(p => p.discipline === 'OTA').length || 0)} color="amber" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search programs by name or discipline..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="cb-input pl-10 w-full"
        />
      </div>

      {/* Programs List */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : filteredPrograms && filteredPrograms.length > 0 ? (
          <div className="divide-y divide-surface-200">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="flex items-center justify-between py-4 px-4 hover:bg-surface-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900">{program.name}</div>
                    <div className="text-sm text-surface-500 flex items-center gap-2">
                      {getDisciplineBadge(program.discipline)}
                      <span>·</span>
                      <span>{program.standards_set}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger-500" />}
                    onClick={() => {
                      if (confirm('Delete this program?')) deleteProgram.mutate(program.id)
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
            <BookOpen className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">No programs found</p>
            <p className="text-sm text-surface-400 mt-1">
              {searchQuery ? 'Try a different search term' : 'Create your first program to get started'}
            </p>
            {!searchQuery && (
              <Button variant="primary" size="sm" className="mt-4" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowModal(true)}>
                Add Program
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && <AddProgramModal onClose={() => setShowModal(false)} orgId={orgId} />}
    </div>
  )
}