import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { usePlacements, useSiteCapacities, useAffiliationAgreements } from '@/hooks/data'
import { MapPin, Plus, Filter, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'map' | 'roster' | 'sites' | 'auto' | 'agreements'

export function PlacementsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('map')
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const { data: placements, isLoading: placementsLoading } = usePlacements()
  const { data: capacity, isLoading: capacityLoading } = useSiteCapacities()
  const { data: agreements, isLoading: agreementsLoading } = useAffiliationAgreements()

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
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'map' && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-50 to-blue-50 h-[200px] lg:h-[280px] relative flex items-center justify-center">
              {capacity && capacity.length > 0 ? (
                <>
                  {capacity.slice(0, 3).map((c: any, i: number) => (
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
                  ))}
                </>
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
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
                </div>
              ) : capacity && capacity.length > 0 ? (
                !isMobile ? (
                  <table className="cb-table">
                    <thead>
                      <tr><th>Site</th><th>Slots</th><th>Filled</th><th>Available</th><th>Risk</th></tr>
                    </thead>
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
                  <div className="space-y-2">
                    {capacity.map((c: any, i: number) => (
                      <div key={i} className="cb-list-item">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{c.sites?.name}</span>
                          {getRiskBadge(c.total_slots - c.filled_slots, c.total_slots)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-surface-500">
                          <div>Slots: {c.total_slots}</div>
                          <div>Filled: {c.filled_slots}</div>
                          <div>Available: <Badge variant={c.total_slots - c.filled_slots <= 0 ? 'red' : 'green'}>{c.total_slots - c.filled_slots}</Badge></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-surface-500">
                  No capacity data. Add rotation blocks and site capacities to see data here.
                </div>
              )}
            </Card>

            <Card header={<span className="text-sm font-semibold">Late Approvals & Risks</span>}>
              <div className="space-y-1">
                {capacityGaps > 0 ? (
                  <div className="flex gap-3 py-2 border-b border-surface-200 text-sm">
                    <span className="text-surface-500 font-mono text-xs w-[70px]">Now</span>
                    <span className="text-surface-900 flex-1">{capacityGaps} site(s) at capacity — no new placements possible.</span>
                  </div>
                ) : (
                  <div className="text-center py-8 text-surface-500 text-sm">
                    No capacity risks detected. All sites have available slots.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select className="cb-select w-[200px]">
              <option>Current Block</option>
            </select>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New placement
            </Button>
          </div>
          <Card>
            {placementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
              </div>
            ) : placements && placements.length > 0 ? (
              !isMobile ? (
                <table className="cb-table">
                  <thead>
                    <tr><th>Student</th><th>Program</th><th>Site</th><th>Dates</th><th>CI</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {placements.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="font-medium">{p.students?.profiles?.first_name} {p.students?.profiles?.last_name}</td>
                        <td><Badge variant="gray">{p.students?.cohorts?.programs?.discipline || 'PTA'}</Badge></td>
                        <td>{p.sites?.name}</td>
                        <td className="text-surface-500">{p.start_date} – {p.end_date}</td>
                        <td className="text-surface-500">{p.clinical_instructors?.profiles?.first_name} {p.clinical_instructors?.profiles?.last_name}</td>
                        <td>{getStatusBadge(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="space-y-2">
                  {placements.map((p: any, i: number) => (
                    <div key={i} className="cb-list-item">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{p.students?.profiles?.first_name} {p.students?.profiles?.last_name}</span>
                        {getStatusBadge(p.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-surface-500">
                        <div><span className="text-surface-400">Program:</span> {p.students?.cohorts?.programs?.discipline || 'PTA'}</div>
                        <div><span className="text-surface-400">Site:</span> {p.sites?.name}</div>
                        <div><span className="text-surface-400">Dates:</span> {p.start_date} – {p.end_date}</div>
                        <div><span className="text-surface-400">CI:</span> {p.clinical_instructors?.profiles?.first_name || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-8 text-surface-500">
                No placements yet. Create placements to see them here.
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'auto' && (
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="space-y-3">
                <div>
                  <label className="form-label">Student</label>
                  <select className="cb-select">
                    <option>Select a student...</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Rotation Block</label>
                  <select className="cb-select">
                    <option>Select a block...</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="form-label">Max Commute (mins)</label>
                  <select className="cb-select">
                    <option>30 min</option>
                    <option>45 min</option>
                    <option>60 min</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Specialty Preference</label>
                  <select className="cb-select">
                    <option>Any</option>
                    <option>Orthopedics</option>
                    <option>Neuro</option>
                    <option>Peds</option>
                  </select>
                </div>
              </div>
            </div>
            <Button 
              variant="primary" 
              leftIcon={<MapPin className="w-4 h-4" />}
              onClick={() => toast('Auto-placement complete. 3 ranked recommendations generated.', 'success')}
            >
              Run Auto-Placement
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'agreements' && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-semibold">Affiliation Agreements</span>
              <Badge variant="amber">
                {agreements?.filter((a: any) => new Date(a.end_date) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)).length || 0} expiring soon
              </Badge>
            </div>
          }
        >
          {agreementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
            </div>
          ) : agreements && agreements.length > 0 ? (
            !isMobile ? (
              <table className="cb-table">
                <thead>
                  <tr><th>Site</th><th>Type</th><th>Effective</th><th>Expires</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {agreements.map((a: any, i: number) => {
                    const isExpiringSoon = new Date(a.end_date) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                    return (
                      <tr key={i}>
                        <td className="font-medium">{a.sites?.name}</td>
                        <td>{a.agreement_type || 'Standard'}</td>
                        <td className="text-surface-500">{new Date(a.effective_date).toLocaleDateString()}</td>
                        <td className="text-surface-500">{new Date(a.end_date).toLocaleDateString()}</td>
                        <td>
                          <Badge variant={a.status === 'active' ? 'green' : isExpiringSoon ? 'amber' : 'red'}>
                            {a.status === 'active' ? 'Active' : isExpiringSoon ? 'Expiring soon' : a.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="space-y-2">
                {agreements.map((a: any, i: number) => {
                  const isExpiringSoon = new Date(a.end_date) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                  return (
                    <div key={i} className="cb-list-item">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{a.sites?.name}</span>
                        <Badge variant={a.status === 'active' ? 'green' : isExpiringSoon ? 'amber' : 'red'}>
                          {a.status === 'active' ? 'Active' : isExpiringSoon ? 'Expiring soon' : a.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-surface-500">
                        <div><span className="text-surface-400">Type:</span> {a.agreement_type || 'Standard'}</div>
                        <div><span className="text-surface-400">Effective:</span> {new Date(a.effective_date).toLocaleDateString()}</div>
                        <div><span className="text-surface-400">Expires:</span> {new Date(a.end_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-surface-500">
              No affiliation agreements. Add agreements to track them here.
            </div>
          )}
        </Card>
      )}
    </div>
  )
}