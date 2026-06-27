# Clinical Bridge - Deployment Guide

## Prerequisites
- Node.js 18+
- Supabase project (with schema from schema_clean.sql applied)
- Vercel/Netlify/Firebase Hosting account (optional)

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
copy .env.example .env
# Edit .env with your Supabase credentials

# 3. Start dev server
npm run dev
# App runs at http://localhost:5173
```

## Connect to Supabase

1. Create a new Supabase project at https://supabase.com
2. Run the SQL from `schema_clean.sql` in the SQL Editor
3. Go to Project Settings > API
4. Copy the URL and anon key into your `.env` file:

```env
VITE_SUPABASE_URL=https://abcdefgh12345678.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

5. Enable Email auth in Authentication > Providers

## Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

The `dist/` folder will contain your static files ready for deployment.

## Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## Deploy to Netlify

1. Run `npm run build`
2. Drag `dist/` folder to Netlify deploy dropzone
3. Or connect GitHub repo for auto-deploys

## Role-Based Features

| Role | Access |
|------|--------|
| system_admin | Full access |
| program_admin | Full access except system settings |
| faculty | Compliance, Placements, Evaluations, Timecards |
| clinical_instructor | Timecards (attest), Evaluations, Placements |
| site_admin | Compliance, Placements |
| student | Timecards (clock in/out), Evaluations (view) |
| accreditation_lead | Accreditation, Reports |

## Data Flow

1. User logs in → Supabase Auth validates
2. Profile fetched with org_id → Org-scoped data
3. All queries filtered by org_id via RLS policies
4. Real-time updates via Supabase subscriptions (optional)

## Security

- RLS policies enforce org isolation
- JWT tokens auto-refresh
- Audit logs track all changes
- File uploads go to Supabase Storage (configure buckets)
