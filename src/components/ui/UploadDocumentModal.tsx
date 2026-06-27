import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { X, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  orgId: string
}

export function UploadDocumentModal({ isOpen, onClose, onSuccess, orgId }: UploadDocumentModalProps) {
  const [studentId, setStudentId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!isOpen) return

    async function fetchData() {
      setIsFetching(true)
      try {
        console.log('🔍 Fetching students for org:', orgId)

        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('org_id', orgId)

        if (studentsError) throw studentsError

        console.log('✅ Students found:', studentsData?.length)

        if (studentsData && studentsData.length > 0) {
          const userIds = studentsData.map(s => s.user_id)
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', userIds)

          if (profilesError) {
            console.error('❌ Profiles error:', profilesError)
          } else {
            const merged = studentsData.map(student => ({
              ...student,
              profiles: profilesData?.find(p => p.user_id === student.user_id)
            }))
            setStudents(merged)
          }
        } else {
          setStudents([])
        }

        const { data: templatesData, error: templatesError } = await supabase
          .from('requirement_templates')
          .select('*')
          .eq('org_id', orgId)

        if (templatesError) throw templatesError

        console.log('✅ Templates found:', templatesData?.length)
        setTemplates(templatesData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast('Failed to load data. Please refresh.', 'error')
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [isOpen, orgId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentId || !templateId || !file) {
      toast('Please fill in all required fields', 'error')
      return
    }

    setIsLoading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${studentId}/${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      console.log('📤 Uploading to:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('compliance-docs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        throw uploadError
      }

      console.log('✅ Upload successful')

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('compliance-docs')
        .getPublicUrl(filePath)

      console.log('📎 Public URL:', urlData.publicUrl)

      // Create compliance document record
      const { error: docError } = await supabase
        .from('compliance_documents')
        .insert({
          student_id: studentId,
          template_id: templateId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          expiry_date: expiryDate || null,
          status: 'PENDING',
          org_id: orgId,
        })

      if (docError) {
        console.error('❌ Document error:', docError)
        throw docError
      }

      toast('Document uploaded successfully!', 'success')
      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast(error.message || 'Failed to upload document', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStudentId('')
    setTemplateId('')
    setExpiryDate('')
    setFile(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900">Upload Document</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : (
            <>
              <div>
                <label className="form-label">Student *</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="cb-select"
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.profiles?.first_name} {s.profiles?.last_name} ({s.student_id})
                    </option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p className="text-xs text-surface-500 mt-1">
                    No students found. Please add students first.
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Document Type *</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="cb-select"
                  required
                >
                  <option value="">Select document type...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.severity === 'required' ? '(Required)' : '(Optional)'}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-surface-500 mt-1">
                    No document templates found. Please add requirement templates first.
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="cb-input"
                />
              </div>

              <div>
                <label className="form-label">File *</label>
                <div
                  className={cn(
                    'border-2 border-dashed border-surface-300 rounded-lg p-6 text-center cursor-pointer',
                    'hover:border-brand-500 transition-colors',
                    file && 'border-success-500 bg-success-50/10'
                  )}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0])
                      }
                    }}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  />
                  {file ? (
                    <div>
                      <div className="text-success-600 text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-surface-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                      <p className="text-sm text-surface-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-surface-500 mt-1">PDF, PNG, JPG, DOC (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4 border-t border-surface-200">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isLoading}
              disabled={isFetching || !studentId || !templateId || !file}
            >
              Upload Document
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}