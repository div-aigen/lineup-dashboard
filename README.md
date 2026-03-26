# Lineup Admin Dashboard

Admin dashboard for the Lineup Sports platform. Provides analytics, session management, and download tracking for the mobile app.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 3, shadcn/ui (New York style)
- **State Management**: Zustand
- **Charts**: Recharts
- **HTTP**: Axios
- **Build**: CRA + Craco (for path aliases)
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install --legacy-peer-deps
```

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

| Variable | Description | Required |
|---|---|---|
| `REACT_APP_BACKEND_URL` | Backend API base URL (no trailing slash) | Yes |

### Development

```bash
npm start
```

Runs on [http://localhost:3000](http://localhost:3000).

### Testing

```bash
npm test
```

### Production Build

```bash
npm run build
```

## Project Structure

```
frontend/src/
  components/         # React components
    ui/               # shadcn/ui primitives (Button, Badge, Table, Input, etc.)
    Dashboard.jsx     # Main dashboard layout
    KPICards.jsx       # KPI metric cards
    UserGrowthChart.jsx
    SessionsTrendChart.jsx
    SportDistribution.jsx
    SessionStatus.jsx
    VenuePopularity.jsx
    RecentSessions.jsx
    DownloadsWidget.jsx
    ParticipantsStats.jsx
    DateRangeFilter.jsx
    ExportButtons.jsx
    Sidebar.jsx
    Login.jsx
    ErrorBoundary.jsx
    ChartTooltip.jsx
    Skeleton.jsx
  store/
    dashboardStore.js  # Zustand store for dashboard state
  lib/
    api.js             # API service layer (analytics, settings, export)
    utils.js           # Shared utilities (formatting, cn)
  __tests__/           # Test files
```

## Design System

### Colors (Brand Palette)

| Token | Hex | Usage |
|---|---|---|
| `brand-bg` | `#020617` | Page background |
| `brand-surface` | `#0F172A` | Card/panel backgrounds |
| `brand-surface-hi` | `#1E293B` | Hover/elevated surfaces |
| `brand-primary` | `#D9F99D` | Primary accent (lime) |
| `brand-primary-fg` | `#0F172A` | Text on primary |
| `brand-secondary` | `#3B82F6` | Secondary accent (blue) |
| `brand-accent` | `#22D3EE` | Tertiary accent (cyan) |
| `brand-danger` | `#EF4444` | Error/destructive |
| `brand-success` | `#22C55E` | Success states |
| `brand-text` | `#F8FAFC` | Primary text |
| `brand-muted` | `#94A3B8` | Muted/secondary text |

### Fonts

- **Body**: Inter
- **Headings**: Barlow Condensed (uppercase, bold, tracking-tight)

### Custom CSS Classes

- `.glass-panel` — Glassmorphism card with blur and semi-transparent background
- `.grid-bg` — Tactical grid background pattern
- `.neon-glow` — Lime-green glow effect
- `.animate-fade-in` — Fade-in from below animation
- `.stagger-children` — Stagger child animations with increasing delay
