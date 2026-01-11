# Rampart Remake

A modern remake of the classic 1990 Atari Rampart arcade game built with Next.js, TypeScript, and Phaser.js.

## Game Overview

Rampart is a hybrid strategy/action game where players defend territory by building walls, placing cannons, and engaging in timed combat. The game features three repeating phases:

1. **Build Phase** - Patch breaches or expand territory using Tetris-like blocks
2. **Deploy Phase** - Place cannons inside fully walled areas
3. **Combat Phase** - Fire cannons at ships (single-player) or enemy walls (multiplayer)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Game Engine**: Phaser.js 3.x
- **Hosting**: Vercel
- **Logging**: Server-side API routes + client-side console

## Project Structure

```
rampart-remake/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── log/          # Server-side logging endpoint
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page
│   └── globals.css       # Global styles
├── components/            # React components
│   └── PhaserGame.tsx    # Phaser game wrapper
├── game/                  # Game logic (pure TypeScript)
│   ├── core/             # Game loop, scenes, config
│   ├── grid/             # Tile system, maps
│   ├── systems/          # Build, combat, territory, AI
│   ├── types/            # TypeScript interfaces/enums
│   └── logging/          # Logger implementation
├── public/               # Static assets
└── docs/                 # Design documents
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bmccall17/rampart-remake.git
cd rampart-remake
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your `rampart-remake` repository
5. Vercel will auto-detect Next.js and deploy

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production:
```bash
vercel --prod
```

### Environment Variables

No environment variables are required for Phase 1. Future phases may require:
- Database connection strings
- API keys for multiplayer services
- Analytics tokens

## Development Phases

### ✅ Phase 1: Foundation (Complete)
- Next.js project setup, Phaser.js integration, logging, Vercel deployment

### ✅ Phase 2: Grid System (Complete)
- Tile rendering, map data structure, visual differentiation

### ✅ Phase 3: Phase State Machine (Complete)
- Game phase management (BUILD/DEPLOY/COMBAT/SCORING)

### ✅ Phase 4: Build Phase (Complete)
- Tetris-style wall placement with rotation

### ✅ Phase 5: Deploy Phase (Complete)
- Cannon placement in enclosed territories

### ✅ Phase 6: Combat Phase (Complete)
- Ships, shooting, projectiles, hit detection, crater creation

### ✅ Phase 7: Game Loop Integration (Complete)
- Lives system, scoring, game over/victory screens, restart/continue

### ✅ Phase 8: Polish & Advanced Features (Complete)
- Sound effects (Web Audio API), visual effects (particles)
- Screen shake, level progression, multiple map presets
- Phase speedup when objectives complete

### 🔄 Phase 9: Ship Variety & Combat AI (Current)
- Differentiated ship types (Scout/Frigate/Destroyer)
- Wave composition system with level scaling
- Smarter ship AI targeting
- Boss ship encounters
- Enhanced combat statistics

### 📋 Future Phases
- Phase 10: Local Multiplayer
- Phase 11: Power-ups & Special Abilities
- Phase 12: Mobile & Accessibility
- Phase 13: Online Features (Leaderboards, Achievements)

## Game Design Documents

Comprehensive game design documentation is available in the `/docs` folder:
- `GDD_Rampart__based_off_the_90s_arcade_game..pdf` - Complete game design spec
- `Deployment_Approach_(today-friendly).pdf` - Technical implementation plan

## Contributing

This is a personal project remake. Feel free to fork and create your own version!

## License

ISC

## Credits

Based on the original Rampart arcade game by Atari (1990).
