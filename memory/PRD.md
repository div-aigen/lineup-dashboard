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

## What's Been Implemented (March 8, 2026)
- Full standalone admin dashboard with all above features
- Real-time data from production PostgreSQL database
- Dark theme with Barlow Condensed headings, glass-morphism panels, tactical grid background
- Admin credentials: admin@lineup-sports.in / LineupAdmin2026!

## Testing
- 100% backend pass (13/13 endpoints)
- 100% frontend pass (all components and interactions)

## Backlog
- P1: Date range filter for charts
- P1: Export data to CSV
- P2: Email notifications for milestones (e.g. 100 users)
- P2: Revenue tracking (total cost from sessions)
- P3: Mobile responsive sidebar (hamburger menu)
