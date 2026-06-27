# Clinical Bridge

Clinical Education Management Platform — connecting academic programs to clinical practice.

## Features

- **Compliance & Clearance** — Document tracking, approval workflows, audit trails
- **Site & Placement Management** — Auto-placement engine, capacity tracking, affiliation agreements
- **Timecards** — GPS clock in/out, CI attestation, deficit alerts
- **Clinical Evaluation Engine** — Form-based evaluations, remediation plans, cohort trends
- **Accreditation & Outcomes** — Standards mapping, gap analysis, evidence export

## Tech Stack

- React 18 + TypeScript
- Vite + Tailwind CSS
- React Router + TanStack Query
- Zustand (state management)
- Supabase (backend)
- Framer Motion (animations)
- Lucide React (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Responsive Design

- **Desktop (≥1024px)**: Full sidebar navigation, data tables
- **Tablet (768–1023px)**: Icon-only sidebar, compact tables
- **Mobile (<768px)**: Bottom navigation, card-based lists, full-screen modals

## Design System

The "Bridge" visual metaphor uses:
- **Blue** (`#1A5FA8`) — Education, trust, clinical authority
- **Teal** (`#148A9A`) — Practice, growth, transition
- **Warm neutrals** — `#F5F4F0` background, `#1C1B18` text

## Project Structure

```
src/
  components/
    layout/       # Sidebar, BottomNav, Header, AppShell
    ui/           # Button, Badge, Card, Progress, Toast, etc.
    modules/      # MetricCard, ActivityFeed, MobileCardList
  pages/          # Dashboard, Compliance, Placements, etc.
  hooks/          # useMediaQuery, useToast, useAuth
  lib/            # utils (cn helper)
  types/          # TypeScript interfaces
```
