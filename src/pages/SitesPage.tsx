import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { useToast } from '@/hooks/useToast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Loader2, MapPin, Phone, Mail } from 'lucide-react'

// --- Types ---
interface Site {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone?: string
  email?: string
  specialties: string[]
  setting_types: string[]
  is_active: boolean
  org_id: string
  created_at: string
}

// --- Hooks ---
function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return (data || []) as Site[]
    },
  })
}

function useCreateSite() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (site: any) => {
      const { data, error } = await supabase.from('sites').insert(site).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast('Site created successfully', 'success')
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to create site', 'error')
    },
  })
}

function useDeleteSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sites').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}

// --- Add Site Modal ---
function AddSiteModal({ onClose, orgId }: { onClose: () => void; orgId: string }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [specialties, setSpecialties] = useState('')
  const [settingType, setSettingType] = useState('Hospital')
  const createSite = useCreateSite()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createSite.mutateAsync({
      name,
      address,
      city,
      state,
      zip_code: zipCode,
      phone: phone || null,
      email: email || null,
      specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
      setting_types: [settingType],
      is_active: true,
      org_id: orgId,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Add Clinical Site</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Site Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="cb-input" placeholder="e.g., City Medical Center" required />
          </div>
          <div>
            <label className="form-label">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="cb-input" placeholder="Street address" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="cb-input" required />
            </div>
            <div>
              <label className="form-label">State</label>
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="cb-input" required />
            </div>
            <div>
              <label className="form-label">ZIP</label>
              <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="cb-input" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="cb-input" placeholder="555-0100" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="cb-input" placeholder="contact@site.com" />
            </div>
          </div>
          <div>
            <label className="form-label">Setting Type</label>
            <select value={settingType} onChange={(e) => setSettingType(e.target.value)} className="cb-select">
              <option value="Hospital">Hospital</option>
              <option value="Outpatient Clinic">Outpatient Clinic</option>
              <option value="SNF">SNF</option>
              <option value="Home Health">Home Health</option>
              <option value="School">School</option>
            </select>
          </div>
          <div>
            <label className="form-label">Specialties (comma-separated)</label>
            <input type="text" value={specialties} onChange={(e) => setSpecialties(e.target.value)} className="cb-input" placeholder="Orthopedics, Neuro, Pediatrics" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={createSite.isPending}>Create Site</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// --- Main Page ---
export function SitesPage() {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: sites, isLoading } = useSites()
  const deleteSite = useDeleteSite()

  const orgId = sites?.[0]?.org_id || ''

  const filteredSites = sites?.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.specialties?.some(sp => sp.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Clinical Sites</h1>
          <p className="text-sm text-surface-500">Manage affiliation sites and capacity</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Add Site
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Sites" value={String(sites?.length || 0)} color="blue" />
        <MetricCard label="Active" value={String(sites?.filter(s => s.is_active).length || 0)} color="green" />
        <MetricCard label="Hospitals" value={String(sites?.filter(s => s.setting_types?.includes('Hospital')).length || 0)} color="blue" />
        <MetricCard label="Outpatient" value={String(sites?.filter(s => s.setting_types?.includes('Outpatient Clinic')).length || 0)} color="amber" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input type="text" placeholder="Search sites by name, city, or specialty..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="cb-input pl-10 w-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : filteredSites && filteredSites.length > 0 ? (
          filteredSites.map((site) => (
            <Card key={site.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900">{site.name}</div>
                    <div className="text-sm text-surface-500">{site.address}, {site.city}, {site.state} {site.zip_code}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {site.specialties?.map((sp, i) => (
                        <Badge key={i} variant="blue" className="text-xs">{sp}</Badge>
                      ))}
                      {site.setting_types?.map((st, i) => (
                        <Badge key={i} variant="gray" className="text-xs">{st}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                      {site.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{site.phone}</span>}
                      {site.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{site.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={site.is_active ? 'green' : 'red'}>{site.is_active ? 'Active' : 'Inactive'}</Badge>
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>Edit</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger-500" />} onClick={() => { if (confirm('Delete this site?')) deleteSite.mutate(site.id) }}>Delete</Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <MapPin className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">No sites found</p>
            <p className="text-sm text-surface-400 mt-1">{searchQuery ? 'Try different search' : 'Add your first clinical site'}</p>
            {!searchQuery && <Button variant="primary" size="sm" className="mt-4" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowModal(true)}>Add Site</Button>}
          </div>
        )}
      </div>

      {showModal && <AddSiteModal onClose={() => setShowModal(false)} orgId={orgId} />}
    </div>
  )
}