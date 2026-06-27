export const queryKeys = {
  // Auth
  profile: (userId: string) => ['profile', userId],

  // Organizations
  org: (orgId: string) => ['org', orgId],
  orgs: ['orgs'],

  // Students
  students: (orgId: string) => ['students', orgId],
  student: (id: string) => ['student', id],

  // Sites
  sites: (orgId: string) => ['sites', orgId],
  site: (id: string) => ['site', id],
  siteCapacities: (siteId: string) => ['siteCapacities', siteId],

  // Placements
  placements: (orgId: string) => ['placements', orgId],
  placement: (id: string) => ['placement', id],
  studentPlacements: (studentId: string) => ['studentPlacements', studentId],

  // Timecards
  timecards: (orgId: string) => ['timecards', orgId],
  studentTimecards: (studentId: string) => ['studentTimecards', studentId],
  pendingAttestations: (ciId: string) => ['pendingAttestations', ciId],

  // Compliance
  complianceDocs: (orgId: string) => ['complianceDocs', orgId],
  studentCompliance: (studentId: string) => ['studentCompliance', studentId],
  requirementTemplates: (orgId: string) => ['requirementTemplates', orgId],

  // Evaluations
  evaluations: (orgId: string) => ['evaluations', orgId],
  studentEvaluations: (studentId: string) => ['studentEvaluations', studentId],
  evalTemplates: (orgId: string) => ['evalTemplates', orgId],
  remediationPlans: (orgId: string) => ['remediationPlans', orgId],

  // Accreditation
  standards: (orgId: string) => ['standards', orgId],
  courses: (orgId: string) => ['courses', orgId],
  mappings: (orgId: string) => ['mappings', orgId],

  // Notifications
  notifications: (userId: string) => ['notifications', userId],

  // Audit
  auditLogs: (orgId: string) => ['auditLogs', orgId],
} as const
