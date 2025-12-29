# Renbu Monthly Shiai - Kendo Tournament Manager

A full-featured kendo tournament management application with dual portals for admins and courtkeepers, real-time synchronization, and mobile-responsive design.

## Features

### Admin Portal
- **Member Management**: Add individual members, bulk import via CSV, or register guests
- **Auto-grouping**: Members are automatically assigned to groups (A-E, F-J, K-O, P-T, U-Z) based on last name
- **Guest Registry**: Persistent registry for recurring guests from other dojos
- **Tournament Generation**: Round-robin tournament with optimized match ordering for maximum rest time
- **Live Dashboard**: View participant counts, match schedules, and tournament progress

### Courtkeeper Portal
- **Live Timer**: Configurable match duration with start/pause/reset controls
- **Dual Scoreboard**: Track scores for both players with Men, Kote, Do, Tsuki, and Hansoku
- **Score Undo**: Remove the last scored point for either player
- **Match Queue**: Visual match queue with status indicators
- **Auto-advance**: Automatically moves to the next match upon completion

### Technical Features
- **Real-time Sync**: Uses shared storage API with 1-second polling for cross-device sync
- **Mobile Responsive**: Automatic device detection with optimized layouts
- **Offline Support**: LocalStorage fallback when storage API is unavailable

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Notifications**: Sonner (toasts)

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

\`\`\`bash
# Clone or download the project
cd renbu-shiai

# Install dependencies
pnpm install

# Start development server
pnpm dev
\`\`\`

The app will be available at \`http://localhost:5173\`

### Production Build

\`\`\`bash
pnpm build
\`\`\`

Built files will be in the \`dist\` directory.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in [Vercel](https://vercel.com)
3. Vercel will auto-detect Vite and configure everything
4. Click Deploy

Or use the CLI:
\`\`\`bash
npx vercel
\`\`\`

### Firebase Hosting
\`\`\`bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize (select Hosting, use 'dist' as public directory)
firebase init hosting

# Deploy
pnpm build
firebase deploy
\`\`\`

### Netlify
1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in [Netlify](https://netlify.com)
3. Build settings are auto-configured via \`netlify.toml\`
4. Click Deploy

Or drag-and-drop the \`dist\` folder to [Netlify Drop](https://app.netlify.com/drop)

## Usage

### Tournament Setup Flow
1. **Add Members**: Use the Members tab to add participants
2. **Select Participants**: Check members participating today
3. **Generate Tournament**: Creates optimized round-robin schedule
4. **Start Tournament**: Begin the competition
5. **Switch to Courtkeeper**: Run matches on another device

### CSV Import Format

\`\`\`csv
FirstName,LastName
John,Smith
Jane,Doe
\`\`\`

Or with group:
\`\`\`csv
FirstName,LastName,Group
John,Smith,A
Jane,Doe,B
\`\`\`

## License

MIT
