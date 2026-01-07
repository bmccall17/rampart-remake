# SHIPLOG - Rampart Remake

## v0.0.7 - Input & Map Overhaul (2026-01-07)

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
