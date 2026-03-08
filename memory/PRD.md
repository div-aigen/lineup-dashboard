# Lineup Admin Dashboard - PRD

## Original Problem Statement
User has a sports session management app ("Lineup") hosted at lineup-sports.in with a GitHub repo at github.com/div-aigen/my-sports-app. They want a standalone admin dashboard to track: number of downloads, sessions created, and other relevant metrics. The production app uses Node.js + Express + PostgreSQL on Railway.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Recharts (Emergent platform)
- **Backend**: FastAPI (Python) with psycopg2 for PostgreSQL read-only analytics
- **Data Sources**: 
  - PostgreSQL on Railway (production data: users, sessions, participants, venues, fields)
  - MongoDB local (admin auth, downloads tracker)
- **Auth**: JWT-based admin login (bcrypt password hashing)

## User Personas
- **App Owner/Admin**: Needs to monitor app growth, session activity, user engagement, and manually track download counts before Play Store goes live

## Core Requirements
- [x] Protected admin login
- [x] KPI summary cards (total users, sessions, downloads, active sessions, venues, avg participants, verified users)
- [x] User growth trend chart
- [x] Sessions over time chart
- [x] Sport type distribution (pie chart)
- [x] Session status breakdown (open/completed/cancelled)
- [x] Venue popularity ranking
- [x] Recent sessions table with full details
- [x] Downloads tracker with manual update (Android/iOS)
- [x] Participant stats (top users, session fill rates)
- [x] Refresh functionality
- [x] Logout

## Iteration 2 Features (March 8, 2026)
- [x] Date range filters for all analytics (presets: Today, Last 7 Days, Last 30 Days, This Month, All Time + custom range)
- [x] CSV export for Users, Sessions, and Participants data (with date filter support)
- [x] Responsive mobile sidebar with hamburger menu toggle

## What's Been Implemented (March 8, 2026)
- Full standalone admin dashboard with all above features
- Real-time data from production PostgreSQL database
- Dark theme with Barlow Condensed headings, glass-morphism panels, tactical grid background
- Admin credentials: admin@lineup-sports.in / LineupAdmin2026!
- Click-outside detection for dropdowns (useRef pattern)
- Mobile-first responsive design with proper stacking contexts

## Testing
- Iteration 1: 100% backend + frontend pass
- Iteration 2: 100% backend, 95% frontend (all core flows verified)

## Backlog
- P2: Email notifications for milestones (e.g. 100 users)
- P2: Revenue tracking (total cost from sessions)
- P3: Comparative period analytics (week-over-week growth)
