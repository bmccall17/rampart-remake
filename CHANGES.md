# Change Log

## Version 0.2.0 - Phase 2: Grid System & Map Rendering (2025-11-16)

### 🎨 New Features
- **Complete Tile Rendering System**: 8 distinct tile types with unique visual styles
- **Level 1 Map**: "First Island" - 24×18 grid with land, water, and irregular coastline
- **Castle System**: Home castle (red) + 2 claimable castles (gray) with visual differentiation
- **Visual Legend**: On-screen guide showing tile types and colors
- **Map Loading**: Dynamic map loading system supporting multiple levels

### 📁 New Files
- `game/grid/TileRenderer.ts` - Handles all tile rendering with graphics
- `game/grid/MapData.ts` - Map definitions and level data

### 🔧 Updated Files
- `game/grid/Grid.ts` - Added `loadMap()` method for map loading
- `game/core/MainScene.ts` - Complete rewrite to use map system

### 🎮 Visual Improvements
- Land tiles with texture dots and borders
- Water tiles with wave effects
- Wall tiles with brick patterns
- Castle tiles with turrets and battlements
- Crater tiles with circular impacts
- Debris tiles with scattered chunks

### 📊 Technical Details
- Grid: 24×18 tiles (432 total)
- Tile size: 32×32 pixels
- Canvas: 1024×768 pixels
- Rendering: Static (one-time render in create)
- Logging: Comprehensive MapLoaded events

### 🐛 Bug Fixes
- Removed demo animated square from Phase 1
- Fixed centering calculation for maps
- Improved visual clarity with better color scheme

---

## Version 0.1.0 - Phase 1: Foundation (2025-11-16)

### 🎉 Initial Release
- Next.js 14 + TypeScript + Phaser.js 3.80.1 setup
- Basic Phaser scene with demo grid
- Logger implementation (client + server)
- Server-side logging API route
- Vercel deployment configuration
- Complete documentation (README, QUICKSTART)

### 📁 Initial Files
- Complete Next.js app structure
- Phaser game configuration
- TypeScript type definitions
- Game folder architecture
- Deployment configs

---

## Upcoming

### Version 0.3.0 - Phase 3: Phase State Machine (Planned)
- GamePhase implementation (BUILD, DEPLOY, COMBAT, SCORING)
- Phase timer system
- HUD with phase display
- Automatic phase cycling
- Visual feedback for phases

### Version 0.4.0 - Phase 4: Build Phase (Planned)
- Tetris-like wall pieces
- Piece placement mechanics
- Territory validation
- Collision detection
- Build timer

### Future Versions
- Phase 5: Cannon deployment
- Phase 6: Combat with ships
- Phase 7: Complete game loop
- Phase 8: Polish & effects
