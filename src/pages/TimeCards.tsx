import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/modules/MetricCard'
import { MobileCardList } from '@/components/modules/MobileCardList'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { 
  useTimecards, useTimecardStats, useClockIn, useClockOut, useAttestTimecard, usePendingAttestations 
} from '@/hooks/data'
import { 
  Play, Square, AlertTriangle, MapPin, CheckCircle, Loader2 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function TimecardsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<'clock' | 'roster' | 'attest' | 'audit'>('clock')
  const [clockedIn, setClockedIn] = useState(false)
  const [activeTimecardId, setActiveTimecardId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  const { data: timecards, isLoading: timecardsLoading } = useTimecards()
  const { data: stats } = useTimecardStats()
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()
  const attestMutation = useAttestTimecard()
  const { data: pendingAttestations, isLoading: attestationsLoading } = usePendingAttestations(user?.id || '')

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleClockIn = async () => {
    try {
      let lat = null, lng = null
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      }

      const { data } = await clockInMutation.mutateAsync({
        student_id: user?.id,
        site_id: 'placeholder-site-id',
        block_id: 'placeholder-block-id',
        placement_id: 'placeholder-placement-id',
        clock_in_at: new Date().toISOString(),
        clock_in_lat: lat,
        clock_in_lng: lng,
        status: 'ACTIVE',
      })

      setClockedIn(true)
      setActiveTimecardId(data.id)
      toast('Clocked in successfully. Location captured.', 'success')
    } catch (err: any) {
      toast(err.message || 'Clock in failed', 'error')
    }
  }

  const handleClockOut = async () => {
    if (!activeTimecardId) return

    try {
      let lat = null, lng = null
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      }

      await clockOutMutation.mutateAsync({
        id: activeTimecardId,
        clockOutData: {
          clock_out_at: new Date().toISOString(),
          clock_out_lat: lat,
          clock_out_lng: lng,
          status: 'SUBMITTED',
        },
      })

      setClockedIn(false)
      setActiveTimecardId(null)
      toast('Clocked out. Timecard submitted for attestation.', 'success')
    } catch (err: any) {
      toast(err.message || 'Clock out failed', 'error')
    }
  }

  const handleAttest = async (timecardId: string) => {
    try {
      await attestMutation.mutateAsync({ id: timecardId, ciId: user?.id || '' })
      toast('Timecard attested and locked. Immutable record created.', 'success')
    } catch (err: any) {
      toast(err.message || 'Attestation failed', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="blue">Active</Badge>
      case 'SUBMITTED': return <Badge variant="amber">Submitted</Badge>
      case 'CI_ATTESTED': return <Badge variant="green">Attested</Badge>
      case 'APPROVED': return <Badge variant="green">Approved</Badge>
      case 'REJECTED': return <Badge variant="red">Rejected</Badge>
      default: return <Badge variant="gray">{status}</Badge>
    }
  }

  const activeShifts = stats?.activeShifts || 0
  const totalHours = stats?.totalHours || 0
  const deficitAlerts = stats?.deficitAlerts || 0
  const pendingCount = stats?.pendingAttestations || 0

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Active Shifts" value={String(activeShifts)} color="green" />
        <MetricCard label="Hours This Week" value={totalHours.toFixed(1)} color="blue" />
        <MetricCard label="Deficit Alerts" value={String(deficitAlerts)} color="red" />
        <MetricCard label="Pending Attestation" value={String(pendingCount)} color="amber" />
      </div>

      <div className="cb-tabs">
        {(['clock', 'roster', 'attest', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('cb-tab', activeTab === tab && 'cb-tab-active')}
          >
            {tab === 'clock' && 'Clock In/Out'}
            {tab === 'roster' && 'Roster'}
            {tab === 'attest' && 'CI Attestation'}
            {tab === 'audit' && 'Audit Log'}
          </button>
        ))}
      </div>

      {/* Clock In/Out Tab */}
      {activeTab === 'clock' && (
        <div className="max-w-md mx-auto">
          <Card className="text-center p-8">
            <div className="mb-6">
              <div className="text-5xl font-bold tracking-tight font-mono text-surface-900">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-surface-500 mt-2">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6',
              clockedIn ? 'bg-success-50 text-success-700' : 'bg-surface-100 text-surface-500'
            )}>
              <span className={cn('w-2 h-2 rounded-full', clockedIn ? 'bg-success-500 animate-pulse' : 'bg-surface-400')} />
              {clockedIn ? 'Clocked In' : 'Clocked Out'}
            </div>

            <div className="flex gap-3 justify-center">
              {!clockedIn ? (
                <Button variant="primary" size="lg" leftIcon={<Play className="w-5 h-5" />} onClick={handleClockIn}>
                  Clock In
                </Button>
              ) : (
                <Button variant="danger" size="lg" leftIcon={<Square className="w-5 h-5" />} onClick={handleClockOut}>
                  Clock Out
                </Button>
              )}
              <Button variant="secondary" size="lg" leftIcon={<AlertTriangle className="w-5 h-5" />}>
                Missed Punch
              </Button>
            </div>

            {clockedIn && (
              <div className="mt-4 text-xs text-surface-500">
                <MapPin className="w-3 h-3 inline mr-1" />
                GPS location being tracked
              </div>
            )}
          </Card>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <MetricCard label="Today" value="0.0h" color="blue" />
            <MetricCard label="This Week" value={`${totalHours.toFixed(1)}h`} color="blue" />
            <MetricCard label="Block" value="0/160h" color="green" />
          </div>
        </div>
      )}

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <Card header={<span className="text-sm font-semibold">Timecard Roster</span>}>
          {timecardsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
            </div>
          ) : timecards && timecards.length > 0 ? (
            !isMobile ? (
              <table className="cb-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Site</th>
                    <th>Week Hrs</th>
                    <th>Block Total</th>
                    <th>Required</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timecards.map((t: any, i: number) => (
                    <tr key={i}>
                      <td className="font-medium">{t.students?.profiles?.first_name} {t.students?.profiles?.last_name}</td>
                      <td className="text-surface-500">{t.sites?.name}</td>
                      <td>{((t.total_minutes || 0) / 60).toFixed(1)}h</td>
                      <td>{((t.total_minutes || 0) / 60).toFixed(1)}h</td>
                      <td className="text-surface-500">160h</td>
                      <td>{getStatusBadge(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <MobileCardList>
                {timecards.map((t: any, i: number) => (
                  <div key={i} className="cb-list-item">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{t.students?.profiles?.first_name} {t.students?.profiles?.last_name}</span>
                      {getStatusBadge(t.status)}
                    </div>
                    <div className="text-xs text-surface-500">
                      <div>Site: {t.sites?.name}</div>
                      <div>Hours: {((t.total_minutes || 0) / 60).toFixed(1)}h / 160h</div>
                    </div>
                  </div>
                ))}
              </MobileCardList>
            )
          ) : (
            <div className="text-center py-8 text-surface-500">
              No timecards yet. Students can clock in to create timecards.
            </div>
          )}
        </Card>
      )}

      {/* Attestation Tab */}
      {activeTab === 'attest' && (
        <div className="space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold">Pending CI Attestations</span>
                <Badge variant="amber">{pendingCount} pending</Badge>
              </div>
            }
          >
            {attestationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
              </div>
            ) : pendingAttestations && pendingAttestations.length > 0 ? (
              !isMobile ? (
                <table className="cb-table">
                  <thead>
                    <tr><th>Student</th><th>Week Ending</th><th>Hours</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {pendingAttestations.map((t: any, i: number) => (
                      <tr key={i}>
                        <td className="font-medium">{t.students?.profiles?.first_name} {t.students?.profiles?.last_name}</td>
                        <td className="text-surface-500">{new Date(t.clock_in_at).toLocaleDateString()}</td>
                        <td>{((t.total_minutes || 0) / 60).toFixed(1)}h</td>
                        <td>
                          <Button 
                            variant="success" 
                            size="sm" 
                            leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleAttest(t.id)}
                          >
                            Attest & Sign
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <MobileCardList>
                  {pendingAttestations.map((t: any, i: number) => (
                    <div key={i} className="cb-list-item">
                      <div className="font-medium text-sm mb-1">{t.students?.profiles?.first_name} {t.students?.profiles?.last_name}</div>
                      <div className="text-xs text-surface-500 mb-2">
                        <div>Week: {new Date(t.clock_in_at).toLocaleDateString()}</div>
                        <div>Hours: {((t.total_minutes || 0) / 60).toFixed(1)}h</div>
                      </div>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="w-full"
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleAttest(t.id)}
                      >
                        Attest & Sign
                      </Button>
                    </div>
                  ))}
                </MobileCardList>
              )
            ) : (
              <div className="text-center py-8 text-surface-500">
                No pending attestations. All timecards have been reviewed.
              </div>
            )}
          </Card>

          <Card header={<span className="text-sm font-semibold">Attested & Locked</span>}>
            <div className="p-4 text-sm text-surface-500">
              <CheckCircle className="w-4 h-4 inline mr-2 text-success-500" />
              Immutable records are stored with audit trail. No modifications allowed after attestation.
            </div>
          </Card>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <Card header={<span className="text-sm font-semibold">Timecard Audit Log</span>}>
          <div className="space-y-1 p-4">
            <div className="text-center py-8 text-surface-500 text-sm">
              Audit log entries for timecard changes will appear here.
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}