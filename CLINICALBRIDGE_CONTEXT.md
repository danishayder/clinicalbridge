# ClinicalBridge - Project Status & Context

## Project Overview
ClinicalBridge is a SaaS platform for clinical education management (PTA, DPT, OTA, Nursing programs). Manages students, clinical placements, compliance, timecards, evaluations, and accreditation.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **State:** TanStack Query + Zustand
- **Hosting:** Render.com
- **Repo:** https://github.com/danishayder/clinicalbridge
- **Live URL:** https://clinicalbridge.onrender.com

## Current Status
✅ Working: Login, Dashboard, Students, Compliance, Placements, Timecards, Evaluations, Cohorts, Rotation Blocks, Sites, Agreements
⚠️ Needs polish: Accreditation (some features incomplete), Mobile responsiveness
⏳ Planned: Auto-placement V2, Talent Pipeline, Mobile App

## Key Files Modified/Added
- `src/pages/RotationBlocksPage.tsx` - New page
- `src/pages/PlacementsPage.tsx` - Fixed, added status dropdown
- `src/pages/EvaluationsPage.tsx` - Fixed with modals
- `src/components/layout/Sidebar.tsx` - Added Rotation Blocks link
- `src/App.tsx` - Added Rotation Blocks route
- `src/hooks/data.ts` - Simplified queries with org_id
- `src/hooks/useAuth.ts` - Added orgId to return

## Database
- **Org ID:** `30f9b97d-78a9-4cea-a2a0-0037e735bdef`
- **Supabase URL:** `https://agtwjohobtqyeebgmxbc.supabase.co`
- **Key Tables:** students, placements, timecards, compliance_documents, evaluation_instances, cohorts, rotation_blocks, sites

## Key Decisions
1. Multi-tenancy via `org_id` column on all tables
2. RLS policies enforce tenant isolation
3. Simplified queries (avoiding complex joins) for reliability
4. Status dropdown for placements

## Known Issues
1. Accreditation page needs data
2. Some mobile views need polish
3. Auto-placement is V1 (basic)

## Next Steps
1. Gather feedback from Program Director
2. Fix any critical issues
3. Plan next feature set
4. Consider deployment to production

## Demo Credentials
- Email: test123@demo.com
- Password: [your password]