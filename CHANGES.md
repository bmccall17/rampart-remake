# Change Log

## Version 0.9.1 - Combat Polish (2026-01-07)

### Fixes & Improvements
- **Real-time Wall Damage**: Walls visibly turn to craters during combat
- **Pixel-Precise Target Markers**: Markers appear at exact click position, not tile centers
- **Ships Visible During DEPLOY**: Ships spawn early so players can see the threat while placing cannons
- **Lofted Enemy Cannonball Arcs**: Enemy projectiles arc over terrain, only impacting at target (progress >= 95%)

### Files Changed
- `game/core/MainScene.ts` - Real-time map rendering, pixel markers, ship preview during DEPLOY
- `game/systems/CombatPhaseSystem.ts` - Progress-based collision, spawnShipsForPreview()

---

## Version 0.9.0 - Ship AI & Repairs (2026-01-07)

### New Features
- **Ship Type Variety**: Three distinct ship classes with unique stats
  - Scout: 2 HP, fast (0.8 speed), high fire rate, small/light visuals
  - Frigate: 3 HP, medium (0.5 speed), standard fire rate, medium/brown visuals
  - Destroyer: 5 HP, slow (0.3 speed), low fire rate, large/dark visuals with red sail
  - Spawn distribution: 40% Scouts, 35% Frigates, 25% Destroyers
- **Smart Ship AI**: Prioritized targeting instead of random fire
  - 70% chance to use smart targeting
  - Priority 1: Cannons (50%) - disarm player defenses
  - Priority 2: Walls (40%) - break enclosures
  - Priority 3: Castles (30%) - strategic targets
  - Fallback: Random land tiles for unpredictability
- **Wall Repair Mechanics**: Craters and debris can be repaired during BUILD phase
  - Place wall pieces directly over craters to fill them
  - Place wall pieces over debris to clear destroyed cannons
  - Repair tiles show as green (valid placement)

### Files Changed
- `game/types/index.ts` - Added ShipType, fireRate, damage to Ship interface
- `game/systems/CombatPhaseSystem.ts` - Ship types, smart targeting AI
- `game/systems/ShipRenderer.ts` - Type-specific ship visuals
- `game/systems/BuildPhaseSystem.ts` - Wall repair mechanics

---

## Version 0.8.1 - Combat Polish (2026-01-07)

### New Features
- **Viewport Scale Fix**: Reduced TILE_SIZE from 32px to 16px so full map is visible
- **Cannon Damage System**: Cannons have 3 HP, destroyed by enemy fire (leaves debris)
- **Smart Cannon Firing**: Fires closest available cannon, skips those reloading
- **Lofted 3D Cannonball Arc**: Projectiles scale up/down with arc, shadow fades as ball rises
- **Custom Combat Crosshair**: X-shaped crosshair that narrows on click, cursor hidden in combat
- **Target Markers**: Faint markers show where shots are aimed until projectile lands

### Files Changed
- `game/core/GameConfig.ts` - TILE_SIZE 32→16
- `game/core/MainScene.ts` - Crosshair, target markers, cursor management
- `game/systems/CombatPhaseSystem.ts` - Cannon damage, arc tracking
- `game/systems/ProjectileRenderer.ts` - 3D arc rendering with shadow
- `game/systems/DeployPhaseSystem.ts` - Cannon health initialization
- `game/types/index.ts` - Cannon health/maxHealth, projectile arc fields

---

## Version 0.8.0 - Input & Map Overhaul (2026-01-07)

### New Features
- **Keyboard Input System Fixed**: Consolidated to single Phaser event listener, removed triple handler conflict
- **Mouse Controls for BUILD Phase**: Piece follows cursor, left-click places, right-click rotates
- **Wall Piece Validation Overhaul**: Movement only blocked by grid bounds, visual feedback (green=valid, red=invalid)
- **Territory Visualization**: Green overlay for enclosed territory, yellow/gold borders on enclosing walls
- **Cannon Allocation Fixed**: Territory validation runs when entering DEPLOY phase
- **Procedural Map Generation**: Map doubled to 48x36, random island shapes, irregular coastlines, 4-6 random castles
- **Bonus Cannon System**: +1 cannon for enclosing multiple castles
- **One Cannonball Per Source**: Cannons and ships limited to one projectile in flight at a time

### Files Changed
- `game/core/MainScene.ts` - Input handling, territory rendering, phase transitions
- `game/systems/BuildPhaseSystem.ts` - Movement validation, territory calculation
- `game/systems/DeployPhaseSystem.ts` - Bonus cannon logic
- `game/systems/CombatPhaseSystem.ts` - One projectile per source
- `game/systems/PieceRenderer.ts` - Invalid tile visualization
- `game/grid/MapData.ts` - Procedural map generation
- `game/grid/TileRenderer.ts` - Territory overlay rendering
- `game/types/index.ts` - Added `sourceId` to Projectile

---

## Version 0.7.0 - Game Loop Integration & Polish (2025-11-16)

### New Features
- **Lives System**: 3 starting lives, lose life when no enclosed castles
- **Score System**: Points for territories, ships destroyed, level completion
- **Level Progression**: Advance through increasingly difficult levels
- **Game State Management**: PLAYING, GAME_OVER, LEVEL_COMPLETE, VICTORY states

### New Files
- `game/core/GameStateManager.ts` - Lives, score, level, game state tracking
- `game/ui/GameOverScreen.ts` - Game over modal with stats and restart
- `game/ui/LevelCompleteScreen.ts` - Level complete celebration screen

---

## Version 0.6.0 - Combat Phase (2025-11-16)

### New Features
- **Ship Spawning**: Ships spawn along coastlines
- **Ship Movement**: Pathfinding towards island center
- **Projectile System**: Player cannons and enemy ships fire cannonballs
- **Hit Detection**: Ships take damage, walls create craters
- **Interactive Combat**: Click to fire nearest cannon at target

### New Files
- `game/systems/CombatPhaseSystem.ts` - Ship spawning, projectiles, combat logic
- `game/systems/ShipRenderer.ts` - Ship sprites with health bars
- `game/systems/ProjectileRenderer.ts` - Cannonball rendering with trails

---

## Version 0.5.0 - Deploy Phase (2025-11-16)

### New Features
- **Cannon Allocation**: Cannons awarded based on enclosed castles (2 for home, 1 for others)
- **Territory Calculation**: Flood-fill algorithm determines enclosed areas
- **Cannon Placement**: Mouse-based placement within enclosed territory
- **Visual Feedback**: Green/red preview for valid/invalid placement

### New Files
- `game/systems/DeployPhaseSystem.ts` - Cannon allocation and placement logic
- `game/systems/CannonRenderer.ts` - Cannon sprite rendering

---

## Version 0.4.0 - Build Phase (2025-11-16)

### New Features
- **14 Tetris-like Pieces**: L, J, T, S, Z, O, I shapes and variants
- **Piece Rotation**: 4 orientations per piece
- **Collision Detection**: Pieces can't overlap walls/water/castles
- **Territory Validation**: Flood-fill determines if castles are enclosed
- **Win/Lose Conditions**: Must enclose at least one castle

### New Files
- `game/systems/WallPiece.ts` - Piece definitions and rotation
- `game/systems/BuildPhaseSystem.ts` - Build phase logic
- `game/systems/PieceRenderer.ts` - Piece rendering with ghost preview

---

## Version 0.3.0 - Phase State Machine (2025-11-16)

### New Features
- **Phase Manager**: BUILD → DEPLOY → COMBAT → SCORING cycle
- **Configurable Timers**: Per-phase time limits
- **Automatic Transitions**: Phases advance automatically
- **HUD System**: Phase banner, countdown timer, stats panel

### New Files
- `game/core/PhaseManager.ts` - State machine for game phases
- `game/core/HUD.ts` - Dynamic UI with phase info and stats

---

## Version 0.2.0 - Grid System & Map Rendering (2025-11-16)

### New Features
- **Complete Tile Rendering System**: 8 distinct tile types with unique visual styles
- **Level 1 Map**: "First Island" - 24x18 grid with land, water, and irregular coastline
- **Castle System**: Home castle (red) + claimable castles (gray)
- **Visual Legend**: On-screen guide showing tile types and colors

### New Files
- `game/grid/TileRenderer.ts` - Handles all tile rendering
- `game/grid/MapData.ts` - Map definitions and level data

---

## Version 0.1.0 - Foundation (2025-11-16)

### Initial Release
- Next.js 14 + TypeScript + Phaser.js 3.80.1 setup
- Basic Phaser scene with demo grid
- Logger implementation (client + server)
- Server-side logging API route
- Vercel deployment configuration
- Complete documentation (README, QUICKSTART)

### Files
- Complete Next.js app structure
- Phaser game configuration
- TypeScript type definitions
- Game folder architecture
