import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProgramsPage } from '@/pages/ProgramsPage'
import { CohortsPage } from '@/pages/CohortsPage'
import { StudentsPage } from '@/pages/StudentsPage'
import { CompliancePage } from '@/pages/CompliancePage'
import { SitesPage } from '@/pages/SitesPage'
import { PlacementsPage } from '@/pages/PlacementsPage'
import { TimecardsPage } from '@/pages/TimecardsPage'
import { EvaluationsPage } from '@/pages/EvaluationsPage'
import { AccreditationPage } from '@/pages/AccreditationPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppShell />}>
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        {/* EDUCATION */}
        <Route path="/programs" element={
          <ProtectedRoute allowedRoles={['system_admin', 'program_admin', 'faculty']}>
            <ProgramsPage />
          </ProtectedRoute>
        } />

        <Route path="/cohorts" element={
          <ProtectedRoute allowedRoles={['system_admin', 'program_admin', 'faculty']}>
            <CohortsPage />
          </ProtectedRoute>
        } />

        <Route path="/students" element={
          <ProtectedRoute allowedRoles={['system_admin', 'program_admin', 'faculty', 'clinical_instructor']}>
            <StudentsPage />
          </ProtectedRoute>
        } />

        <Route path="/evaluations" element={
          <ProtectedRoute allowedRoles={['system_admin', 'program_admin', 'faculty', 'clinical_instructor']}>
            <EvaluationsPage />
          </ProtectedRoute>
        } />

        <Route path="/accreditation" element={
          <ProtectedRoute allowedRoles={['system_admin', 'program_admin', 'accreditation_lead']}>
            <AccreditationPage />
          </ProtectedRoute>
        } />

        {/* CLINICAL OPS */}
        <Route path="/compliance" element={
          <ProtectedRoute allowedRoles={['system_admin', 'program_admin', 'faculty', 'clinical_instructor', 'site_admin']}>
            <CompliancePage />
          </ProtectedRoute>
        } />

        <Route path="/sites" element={
          <ProtectedRoute allowedRoles={['system_admin', 'program_admin', 'faculty', 'site_admin']}>
            <SitesPage />
          </ProtectedRoute>
        } />

        <Route path="/placements" element={
          <ProtectedRoute allowedRoles={['system_admin', 'program_admin', 'faculty', 'clinical_instructor', 'site_admin']}>
            <PlacementsPage />
          </ProtectedRoute>
        } />

        <Route path="/timecards" element={
          <ProtectedRoute>
            <TimecardsPage />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="p-8 text-center text-surface-500">Settings — Coming soon</div>
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App