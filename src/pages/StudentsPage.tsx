import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { useToast } from '@/hooks/useToast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Loader2, User, Mail, GraduationCap } from 'lucide-react'

interface Student {
  id: string
  student_id: string
  user_id: string
  cohort_id: string
  org_id: string
  created_at: string
  profiles?: { first_name: string; last_name: string; email: string; is_active: boolean }
  cohorts?: { name: string; programs?: { name: string; discipline: string } }
}

// ============================================================
// SIMPLIFIED: Get current user's org_id
// ============================================================

async function getCurrentOrgId() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ No user logged in')
      return null
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ Profile error:', error)
      return null
    }

    console.log('✅ Org ID found:', profile?.org_id)
    return profile?.org_id || null
  } catch (err) {
    console.error('❌ Error getting org ID:', err)
    return null
  }
}

// ============================================================
// SIMPLIFIED: Students Hook - DIRECT QUERY
// ============================================================

function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      console.log('🔍 Querying students for org:', orgId)

      if (!orgId) {
        console.warn('⚠️ No orgId, returning empty')
        return []
      }

      // DIRECT QUERY - no nested joins that might fail
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (studentsError) {
        console.error('❌ Students error:', studentsError)
        throw studentsError
      }

      console.log('✅ Raw students:', studentsData?.length)

      if (!studentsData || studentsData.length === 0) {
        return []
      }

      // Get profiles for each student
      const userIds = studentsData.map(s => s.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)

      if (profilesError) {
        console.error('❌ Profiles error:', profilesError)
        // Continue without profiles
      }

      // Get cohorts for each student
      const cohortIds = studentsData.map(s => s.cohort_id)
      const { data: cohortsData, error: cohortsError } = await supabase
        .from('cohorts')
        .select('*')
        .in('id', cohortIds)

      if (cohortsError) {
        console.error('❌ Cohorts error:', cohortsError)
        // Continue without cohorts
      }

      // Merge data
      const merged = studentsData.map(student => ({
        ...student,
        profiles: profilesData?.find(p => p.user_id === student.user_id),
        cohorts: cohortsData?.find(c => c.id === student.cohort_id),
      }))

      console.log('✅ Merged students:', merged.length)
      return merged as Student[]
    },
    staleTime: 0,
    refetchOnMount: true,
    retry: 1,
  })
}

function useCohorts() {
  return useQuery({
    queryKey: ['cohorts'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId()
      if (!orgId) return []

      const { data, error } = await supabase
        .from('cohorts')
        .select(`id, name, programs(name, discipline)`)
        .eq('org_id', orgId)
        .eq('status', 'active')

      if (error) throw error
      return data || []
    },
  })
}

function useCreateStudent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ firstName, lastName, email, password, studentId, cohortId, orgId }: any) => {
      console.log('📝 Creating student...')

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      console.log('✅ Auth user created:', authData.user.id)

      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'student',
        org_id: orgId,
        is_active: true,
      })
      if (profileError) throw profileError

      console.log('✅ Profile created')

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          student_id: studentId,
          user_id: authData.user.id,
          cohort_id: cohortId,
          org_id: orgId,
        })
        .select()
        .single()

      if (studentError) throw studentError

      console.log('✅ Student created:', studentData)
      return studentData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
      toast('Student created successfully!', 'success')
    },
    onError: (err: any) => {
      console.error('❌ Error:', err)
      toast(err.message || 'Failed to create student', 'error')
    },
  })
}

function useDeleteStudent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
      toast('Student deleted', 'info')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to delete student', 'error')
    },
  })
}

// ============================================================
// ADD STUDENT MODAL
// ============================================================

function AddStudentModal({ onClose, orgId }: { onClose: () => void; orgId: string }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [cohortId, setCohortId] = useState('')
  const [password, setPassword] = useState('')
  const { data: cohorts } = useCohorts()
  const createStudent = useCreateStudent()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createStudent.mutateAsync({
      firstName,
      lastName,
      email,
      password,
      studentId,
      cohortId,
      orgId,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Add New Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="cb-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="cb-input"
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cb-input"
              placeholder="student@school.edu"
              required
            />
          </div>
          <div>
            <label className="form-label">Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="cb-input"
              placeholder="e.g., S001"
              required
            />
          </div>
          <div>
            <label className="form-label">Cohort</label>
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="cb-select"
              required
            >
              <option value="">Select a cohort...</option>
              {cohorts?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.programs?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Temporary Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cb-input"
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
            <p className="text-xs text-surface-500 mt-1">
              Student will use this to log in. They can change it later.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={createStudent.isPending}>
              Create Student
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

export function StudentsPage() {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [orgId, setOrgId] = useState('')
  const { toast } = useToast()
  const { data: students, isLoading, refetch } = useStudents()
  const deleteStudent = useDeleteStudent()

  // Get org_id once on load
  useEffect(() => {
    async function loadOrgId() {
      const id = await getCurrentOrgId()
      setOrgId(id || '')
    }
    loadOrgId()
  }, [])

  // Refetch when page loads
  useEffect(() => {
    refetch()
  }, [])

  const filteredStudents = students?.filter((s) =>
    s.profiles?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.profiles?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? <Badge variant="green">Active</Badge> : <Badge variant="red">Inactive</Badge>
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Students</h1>
          <p className="text-sm text-surface-500">Manage students, compliance, and placements</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Add Student
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Students" value={String(students?.length || 0)} color="blue" />
        <MetricCard label="Active" value={String(students?.filter(s => s.profiles?.is_active).length || 0)} color="green" />
        <MetricCard label="Cleared" value="0" color="green" />
        <MetricCard label="Pending Compliance" value="0" color="amber" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search students by name, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="cb-input pl-10 w-full"
        />
      </div>

      <Card>
        {students && students.length > 0 ? (
          <div className="divide-y divide-surface-200">
            {filteredStudents?.map((student) => (
              <div key={student.id} className="flex items-center justify-between py-4 px-4 hover:bg-surface-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900">
                      {student.profiles?.first_name} {student.profiles?.last_name}
                    </div>
                    <div className="text-sm text-surface-500 flex items-center gap-2">
                      <Badge variant="gray">{student.student_id}</Badge>
                      <span>·</span>
                      <Mail className="w-3 h-3" />
                      <span>{student.profiles?.email}</span>
                      <span>·</span>
                      <GraduationCap className="w-3 h-3" />
                      <span>{student.cohorts?.name || 'No Cohort'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(student.profiles?.is_active || false)}
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger-500" />}
                    onClick={() => {
                      if (confirm('Delete this student?')) deleteStudent.mutate(student.id)
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
            <User className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">No students found</p>
            <p className="text-sm text-surface-400 mt-1">
              {searchQuery ? 'Try different search' : 'Add your first student'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowModal(true)}
              >
                Add Student
              </Button>
            )}
          </div>
        )}
      </Card>

      {showModal && <AddStudentModal onClose={() => setShowModal(false)} orgId={orgId} />}
    </div>
  )
}