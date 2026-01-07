# SHIPLOG - Rampart Remake

  Suggested Roadmap for v0.9.0+

  🎯 High Priority (Core Gameplay)

  | Feature               | Description                                                    | Complexity |
  |-----------------------|----------------------------------------------------------------|------------|
  | Ship AI Improvements  | Smarter targeting (walls, cannons, castles), varied ship types | Medium     |
  | Level Progression     | Increasing difficulty (more ships, faster, tougher)            | Low        |
  | Wall Repair Mechanics | Craters can be filled, damaged walls rebuilt                   | Medium     |

  🔊 Polish & Feel

  | Feature        | Description                                                  | Complexity |
  |----------------|--------------------------------------------------------------|------------|
  | Sound Effects  | Cannon fire, explosions, placement sounds, phase transitions | Medium     |
  | Music          | Background music, victory/defeat jingles                     | Low        |
  | Visual Effects | Explosions, smoke, water splashes, screen shake              | Medium     |
  | Score Display  | End-of-round breakdown, high score table                     | Low        |

  🎮 Advanced Features

  | Feature          | Description                                                 | Complexity |
  |------------------|-------------------------------------------------------------|------------|
  | Multiplayer      | 2-player local or networked play (original Rampart feature) | High       |
  | Multiple Islands | Different map layouts, themed islands                       | Medium     |
  | Power-ups        | Special cannons, faster build, extra time                   | Medium     |
  | Mobile Support   | Touch controls for BUILD/DEPLOY/COMBAT                      | Medium     |


## v0.9.0 - Ship AI & Repairs (2026-01-07)

### New Features

#### 1. Ship Type Variety
**Three distinct ship classes with unique stats:**

| Type | Health | Speed | Fire Rate | Damage | Visual |
|------|--------|-------|-----------|--------|--------|
| Scout | 2 HP | Fast (0.8) | High | 1 | Small, light brown, yellow sail |
| Frigate | 3 HP | Medium (0.5) | Medium | 1 | Medium, brown, white sail |
| Destroyer | 5 HP | Slow (0.3) | Low | 2 | Large, dark, red sail |

**Spawn Distribution:** 40% Scouts, 35% Frigates, 25% Destroyers

#### 2. Smart Ship AI
**Ships now use prioritized targeting instead of random fire:**
- 70% chance to use smart targeting
- **Priority 1:** Cannons (50% chance) - disarm player defenses
- **Priority 2:** Walls (40% chance) - break enclosures
- **Priority 3:** Castles (30% chance) - strategic targets
- **Fallback:** Random land tiles for unpredictability
- Ships target the closest object in each priority category

#### 3. Wall Repair Mechanics
**Craters and debris can now be repaired during BUILD phase:**
- Place wall pieces directly over **craters** to fill them
- Place wall pieces over **debris** to clear destroyed cannons
- Repair tiles show as **green** (valid placement)
- Allows rebuilding defenses after combat damage

---

### Files Changed
- `game/types/index.ts` - Added ShipType, fireRate, damage to Ship interface
- `game/systems/CombatPhaseSystem.ts` - Ship types, smart targeting AI
- `game/systems/ShipRenderer.ts` - Type-specific ship visuals
- `game/systems/BuildPhaseSystem.ts` - Wall repair mechanics

---

## v0.8.1 - Combat Polish (2026-01-07)

### New Features

#### 1. Viewport Scale Fix
**Problem:** Ships were firing before being visible - map was larger than viewport.

**Solution:**
- Reduced `TILE_SIZE` from 32px to 16px
- Map (48×36 tiles) now fits within 1024×768 canvas

#### 2. Cannon Damage System
**Problem:** Ship cannonballs only destroyed walls, not player cannons.

**Solution:**
- Cannons now have **3 health points**
- Enemy projectiles check for cannon hits before terrain
- 3 hits destroys a cannon (leaves debris)

#### 3. Smart Cannon Firing
**Problem:** Only nearest cannon fired, even if it was reloading.

**Solution:**
- Click fires **closest available cannon**
- If closest has projectile in flight → tries next closest
- Continues until one fires or all are busy

#### 4. Lofted 3D Cannonball Arc
**Problem:** Cannonballs looked flat, no sense of trajectory.

**Solution:**
- Projectiles track start, target, and progress (0→1)
- Ball **scales up** on rise (3px → 7px radius at apex)
- Ball **scales down** on fall (7px → 3px at impact)
- Ball rises **12px** at apex then falls
- Shadow on ground fades as ball rises

#### 5. Custom Combat Crosshair
**Problem:** Default cursor didn't feel tactical.

**Solution:**
- **X-shaped crosshair** during COMBAT phase
- Normal: 16px wide, orange, 80% opacity
- On click: **narrows to 8px**, thicker, 100% opacity
- Default cursor hidden during combat

#### 6. Target Markers
**Problem:** No indication of where shots were aimed.

**Solution:**
- Faint **X marker + circle** at each target location
- Markers persist until projectile lands
- Auto-cleanup when projectiles deactivate

---

### Files Changed
- `game/core/GameConfig.ts` - TILE_SIZE 32→16
- `game/core/MainScene.ts` - Crosshair, target markers, cursor hiding
- `game/systems/CombatPhaseSystem.ts` - Cannon damage, arc tracking
- `game/systems/ProjectileRenderer.ts` - 3D arc rendering
- `game/systems/DeployPhaseSystem.ts` - Cannon health initialization
- `game/types/index.ts` - Cannon health, projectile arc fields

---

## v0.8.0 - Input & Map Overhaul (2026-01-07)

### Major Breakthroughs

#### 1. Keyboard Input System Fixed
**Problem:** Keyboard controls weren't working to move wall pieces during BUILD phase.

**Root Cause:** Triple input handler conflict - keyboard events were being processed by:
1. Phaser keyboard event listener
2. Global window event listener (fallback)
3. Update loop using `JustDown()` polling

Additionally, pieces were spawning at `y=0` (top edge) which was an invalid position, causing all movement validation to fail.

**Solution:**
- Consolidated to single Phaser keyboard event listener
- Removed redundant global window listener and update loop handler
- Changed piece spawn position from `y=0` to center of grid

#### 2. Mouse Controls for BUILD Phase
**Problem:** Mouse couldn't be used to move or place wall pieces.

**Solution:**
- Wall piece now **follows the mouse cursor** continuously via `pointermove` listener
- **Left-click** places the piece
- **Right-click** rotates the piece
- Browser context menu disabled to prevent interference

#### 3. Wall Piece Validation Overhaul
**Problem:** Players couldn't move pieces over invalid tiles (water, walls, etc.) which made positioning frustrating.

**Solution:**
- Movement now only blocked by **grid bounds** (edges of map)
- Pieces can freely move over invalid tiles
- **Visual feedback**: Valid tiles render **green**, invalid tiles render **red with X pattern**
- Placement still validates - can only place on valid land tiles

#### 4. Territory Visualization
**Problem:** No visual feedback when player successfully enclosed a castle.

**Solution:**
- Enclosed territory tiles get a **green semi-transparent overlay**
- Enclosing walls get a **yellow inner border** (facing territory)
- Enclosing walls get a **gold outer border** (facing outside)
- Territory calculated using flood-fill from each castle

#### 5. Cannon Allocation Fixed
**Problem:** Players weren't receiving any cannons in DEPLOY phase.

**Root Cause:** Territory validation only happened during SCORING phase (after COMBAT), but DEPLOY phase needed it to calculate cannon count.

**Solution:**
- Territory validation now runs when entering DEPLOY phase
- Cannon allocation: 2 for home castle, 1 per regular castle
- **Bonus cannon** (+1) for enclosing multiple castles

#### 6. Procedural Map Generation
**Problem:** Static 24x18 map was small and repetitive.

**Solution:**
- Map size **doubled** to 48x36 (4x the area)
- **Procedural island generation** using polar coordinates with random radius offsets
- **Irregular coastlines** with inlets and bays
- **Random castle placement** (4-6 castles per map)
- Home castle placed near center, others spread with minimum 8-tile spacing
- Seeded random number generator for reproducible maps

#### 7. One Cannonball Per Cannon/Ship
**Problem:** Cannons and ships could spam fire multiple projectiles.

**Solution:**
- Added `sourceId` to Projectile type to track origin
- Each cannon can only have **one projectile in flight** at a time
- Each ship can only have **one projectile in flight** at a time
- Must wait for projectile to land before firing again

---

### Files Changed

#### Core Systems
- `game/core/MainScene.ts` - Input handling, territory rendering, phase transitions
- `game/systems/BuildPhaseSystem.ts` - Movement validation, territory calculation
- `game/systems/DeployPhaseSystem.ts` - Bonus cannon logic
- `game/systems/CombatPhaseSystem.ts` - One projectile per source
- `game/systems/PieceRenderer.ts` - Invalid tile visualization

#### Map & Grid
- `game/grid/MapData.ts` - Procedural map generation
- `game/grid/TileRenderer.ts` - Territory overlay rendering

#### Types
- `game/types/index.ts` - Added `sourceId` to Projectile

#### Removed
- `InputDebugDisplay` - No longer needed after input fix

---

### Controls Reference

#### BUILD Phase
| Input | Action |
|-------|--------|
| Mouse move | Piece follows cursor |
| Left-click | Place piece |
| Right-click | Rotate piece |
| Arrow keys / WASD | Move piece (1 tile) |
| R / E | Rotate piece |
| Space / Enter | Place piece |
| ESC | Restart game |

#### DEPLOY Phase
| Input | Action |
|-------|--------|
| Left-click | Place cannon (in enclosed territory) |
| Right-click | Remove cannon |

#### COMBAT Phase
| Input | Action |
|-------|--------|
| Left-click | Fire nearest cannon at click position |

---

### Game Mechanics

#### Cannon Allocation
- Home castle enclosed: **2 cannons**
- Each regular castle enclosed: **1 cannon**
- Multiple castles enclosed bonus: **+1 cannon**

#### Territory Rules
- Walls must fully enclose a castle (no path to map edge)
- Only walls connected to enclosed castles count
- Green overlay shows claimed territory
- Yellow/gold border shows wall perimeter

---

### Known Issues
- None currently blocking gameplay

---

### Next Steps (Potential)
- Ship AI improvements
- Sound effects
- Score display improvements
- Level progression
- Wall damage/repair mechanics
