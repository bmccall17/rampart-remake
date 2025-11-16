# Quick Start Guide

## Phase 1 Setup Complete! 🎉

All foundation files have been created. Here's how to get your game running:

## Step 1: Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14.2.0
- React 18.3.0
- Phaser.js 3.80.1
- TypeScript 5.0.0
- ESLint and other dev tools

## Step 2: Run Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

You should see:
- ✅ "RAMPART REMAKE" title
- ✅ Colored grid with sample tiles
- ✅ Animated red square bouncing around
- ✅ Version info at bottom

## Step 3: Check the Console

Open your browser's developer console (F12). You should see logging output like:

```
[PhaserGame] Initializing Phaser game
📊 [PhaserGame] GameInitialized {"config":"MainScene"}
[MainScene] MainScene created
📊 [MainScene] SceneCreated {"scene":"MainScene"}
📊 [MainScene] GridRendered {"width":1024,"height":768,"tileSize":32}
```

## Step 4: Verify Server-Side Logging

Check your terminal where `npm run dev` is running. You should see server logs when the game initializes:

```
LOG_EVENT {
  "timestamp": "2025-11-16T...",
  "level": "event",
  "context": "PhaserGame",
  "message": "GameInitialized",
  ...
}
```

## Step 5: Deploy to Vercel

### First Time Setup

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **rampart-remake**
- In which directory is your code located? **./
- Want to override settings? **N**

### Subsequent Deployments

```bash
vercel          # Deploy to preview
vercel --prod   # Deploy to production
```

### Alternative: Deploy via GitHub

1. Push to GitHub:
```bash
git add .
git commit -m "Complete Phase 1 setup"
git push
```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects Next.js and deploys

## What You Have Now

✅ **Working Game Loop** - Phaser is rendering and updating at 60fps
✅ **Logging System** - Both client and server-side logging working
✅ **Clean Architecture** - Game logic separated from React/Next.js
✅ **Type Safety** - Full TypeScript setup
✅ **Deployment Ready** - Configured for Vercel

## File Structure Created

```
rampart-remake/
├── app/
│   ├── api/log/route.ts      ✅ Server-side logging API
│   ├── layout.tsx            ✅ Root layout
│   ├── page.tsx              ✅ Main page
│   └── globals.css           ✅ Global styles
├── components/
│   └── PhaserGame.tsx        ✅ Phaser wrapper component
├── game/
│   ├── core/
│   │   ├── GameConfig.ts     ✅ Phaser configuration
│   │   └── MainScene.ts      ✅ Demo scene with grid
│   ├── grid/
│   │   └── Grid.ts           ✅ Grid system (ready for Phase 2)
│   ├── logging/
│   │   └── Logger.ts         ✅ Logger class
│   ├── systems/
│   │   └── .gitkeep          ✅ Ready for game systems
│   └── types/
│       └── index.ts          ✅ TypeScript definitions
├── docs/                      ✅ Game design documents
├── package.json              ✅ Dependencies configured
├── tsconfig.json             ✅ TypeScript config
├── next.config.js            ✅ Next.js config
└── vercel.json               ✅ Vercel deployment config
```

## Next Steps (Phase 2)

Once you verify everything works:

1. **Grid System** - Implement proper tile rendering with different types
2. **Map Data** - Create hardcoded Level 1 map
3. **Visual Differentiation** - Add colors/sprites for land, water, castles

## Troubleshooting

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Phaser canvas not showing
- Check browser console for errors
- Make sure `window` is available (client-side only)
- Verify canvas element in DOM inspector

## Need Help?

Check the full README.md for more details or review the GDD in `/docs`.

Happy building! 🏰⚔️
