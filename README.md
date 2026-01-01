# Shiaijo - Kendo Tournament Manager

A full-featured kendo tournament management application built for Renbu Dojo's monthly shiai. Features dual portals for admins and scorekeepers, real-time synchronization, and a mobile-first design.

## Features

### Admin Portal

#### Member Management
- Add individual members or bulk import via CSV
- Automatic grouping by last name (A-E, F-J, K-O, P-T, U-Z)
- Toggle participation status for each member
- First name display mode for privacy
- Guest registry for recurring visitors from other dojos

#### Group Management
- Create custom groups with drag-and-drop reordering
- Non-bogu (Hantei) mode for groups without armor
- Edit mode to show/hide edit and delete buttons
- Court assignment based on group position (odd = Court A, even = Court B)

#### Tournament Management
- Round-robin tournament generation with optimized rest time
- Configurable timer options (1:00 - 5:00)
- Sanbon (first to 2) or Ippon (first to 1) match types
- Per-group and per-match settings
- Refresh participants without losing completed match results
- Match history and results archive

### Courtkeeper Portal

#### Live Scoring Interface
- Score buttons for Men (M), Kote (K), Do (D), Tsuki (T)
- Hansoku tracking with automatic point conversion (2 hansoku = 1 point)
- Real-time score display with AKA (red) and SHIRO (white) sides
- Undo functionality for score corrections

#### Timer
- Configurable duration with visual progress bar
- Start/Pause/Reset controls
- Visual alert when time expires

#### Match Queue
- Collapsible Group Queue for reordering
- Match Queue with LIVE and NEXT indicators
- Select upcoming matches manually
- Move matches between courts

#### UI Features
- "Up Next" card showing the next scheduled match
- Court A (amber) and Court B (blue) color coding
- Mobile-optimized compact layout
- Slide-out menu for queue access

### Technical Features
- Real-time sync across devices using shared storage API
- LocalStorage fallback for offline usage
- Mobile-responsive design
- Dark mode interface

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Sonner

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Deployment

Deploy to Vercel, Netlify, or any static hosting:

```bash
pnpm build
# Upload the 'dist' folder
```

## License

MIT
