# Rampart Remake - Gameplay Summary & Creative Direction

## Document Purpose
This document summarizes the current gameplay state and explores creative directions for multi-device asymmetric multiplayer. Intended for circulation among the creative team.

---

# PART 1: Current Gameplay Summary

## Game Overview
**Rampart Remake** is a tower defense game based on the classic 1990 arcade game. Players defend a medieval castle on an island by building walls, placing cannons, and destroying enemy ships before they can breach the fortifications.

## Core Gameplay Loop
The game follows a **4-phase cycle** that repeats each round:

### Phase 1: BUILD (20 seconds)
**Goal:** Enclose your castles with walls to maintain territory

- Player receives 3 Tetris-style wall pieces (random shapes)
- Move piece with mouse cursor, place with left-click
- Rotate piece with right-click (clockwise)
- Walls must form complete enclosures around castles to "claim" territory
- Walls repair damage from previous combat
- **If no castles are enclosed: GAME OVER**

**Wall Piece Shapes:**
- L-shapes, T-shapes, long bars, small squares, zigzags
- Each piece is 3-5 tiles in size

### Phase 2: DEPLOY (10 seconds)
**Goal:** Place cannons inside your enclosed territories

- Player can place cannons on any land tile inside enclosed walls
- Number of available cannons = number of enclosed territories
- Cannons cannot overlap or be placed outside walls
- Left-click to place, continue until time runs out or all placed

### Phase 3: COMBAT (30 seconds or until all ships destroyed)
**Goal:** Destroy enemy ships before they destroy your defenses

- Enemy ships spawn from the water and sail toward your island
- **Player controls:** Click anywhere to fire the nearest available cannon at that target
- Cannons have cooldown between shots
- Ships fire back at your walls, cannons, and castles
- **Ship hits create craters** (permanent terrain damage)
- **Wall hits destroy wall tiles**
- Phase ends when: all ships destroyed OR timer expires

**Combat Feedback:**
- Critical hits: +25 bonus points, 2x damage, special visual/audio
- Accuracy tracking: shots fired vs. hits displayed at end
- Explosion effects scale by ship type

### Phase 4: SCORING (Brief)
**Goal:** Award points and prepare for next round

- **Ships destroyed:** 75-500 points per ship (varies by type)
- **Territories held:** 50 points per enclosed castle
- **Level bonus:** 100 points × level number
- Display breakdown, then return to BUILD phase

## Progression System

### Levels
- Game progresses through levels 1-10+
- Each level = one complete BUILD → DEPLOY → COMBAT → SCORE cycle
- Map changes every level (small island → large island → archipelago)

### Difficulty Scaling
| Level | Ship Count | Ship Speed | Ship Mix |
|-------|-----------|------------|----------|
| 1-2   | 5-7 ships | 100%       | Scouts + Frigates |
| 3-4   | 7-10 ships| 110-115%   | + Destroyers (25%) |
| 5+    | 10-15 ships| 120%+     | Heavy Destroyers (35%) |
| Every 5th | +1 Boss | -         | 15 HP, 3-shot spread |

### Lives System
- Player starts with **3 lives**
- Lose a life if you fail to enclose at least one castle during BUILD
- **Game Over** when lives reach 0
- **Victory** at level 10 (configurable)

## Enemy Ship Types

| Type | HP | Speed | Damage | Points | Visual | Behavior |
|------|-----|-------|--------|--------|--------|----------|
| Scout | 2 | Fast (1.0) | 1 | 75 | Small, yellow sail | Targets cannons |
| Frigate | 3 | Medium (0.5) | 1 | 100 | Standard, white sail | Balanced targeting |
| Destroyer | 5 | Slow (0.3) | 2 | 150 | Large, red sail | Prioritizes castles |
| Boss | 15 | Very Slow (0.2) | 3 | 500 | Huge, dark hull | Fires 3 projectiles |

## Ship AI Behavior
- Ships sail from water toward land targets
- **Smart targeting (70%):** Prioritize cannons > walls > castles
- **Random targeting (30%):** Unpredictable for variety
- **Destroyers** specifically target castles 60% of the time
- Ships avoid heavily cratered areas
- Ships spread out to attack from multiple angles

## Map Structure
- **48×36 tile grid** (768×576 pixels at 16px/tile)
- **Water:** Surrounds the island, ships spawn here
- **Land:** Green terrain, can place walls and cannons
- **Castles:** Gray structures, must be enclosed to survive
- **Walls:** Brown stone, built by player
- **Craters:** Permanent damage from ship attacks

## Current Controls (Desktop Mouse-First)

| Action | BUILD Phase | DEPLOY Phase | COMBAT Phase |
|--------|-------------|--------------|--------------|
| Mouse Move | Preview piece position | Preview cannon position | - |
| Left Click | Place wall piece | Place cannon | Fire nearest cannon |
| Right Click | Rotate piece | Remove cannon | - |
| R Key | Rotate piece | - | - |
| ESC | Restart game | Restart game | Restart game |

## Audio & Visual Polish
- **Procedural audio:** All sounds generated via Web Audio API
- **Particle effects:** Explosions, splashes, fire, debris
- **Screen shake:** Subtle on cannon fire, strong on explosions
- **Phase transitions:** Rising tone, color-coded phase banner

---

# PART 2: Creative Brainstorming - Multi-Device Vision

## User's Vision Summary
> "I want two players to play on different devices... non-destructive to mouse-first desktop... a coop mode where there MUST be one desktop player who has all the controls and then phone players can target the cannons... once walls are built there is active and ongoing combat."

## Creative Concept: "Commander & Gunners"

### The Core Idea
**Asymmetric roles** where devices determine capabilities:
- **Desktop = Commander:** Full strategic control (walls, cannons, overall coordination)
- **Mobile = Gunners:** Real-time tactical targeting (aim and fire individual cannons)

### How It Could Work

#### Desktop Player (Commander)
- Full mouse control during BUILD and DEPLOY phases
- Sees the entire battlefield
- Places walls, places cannons, manages resources
- During COMBAT: Can still fire cannons, but benefits from phone gunners
- Voice chat / text commands to coordinate

#### Phone Players (Gunners)
- Join mid-game via room code / QR scan
- Each gunner "claims" or is assigned specific cannons
- During COMBAT: Tap screen to fire their assigned cannon
- See a zoomed view of their cannon's firing arc
- Simple UI: just a firing button + target reticle
- Could have cooldown indicator, ammo count, etc.

### Phase Flow with Multi-Device

```
PHASE          DESKTOP              PHONE PLAYERS
─────────────────────────────────────────────────
BUILD          Places walls         Watch / Chat
               (full control)       (spectator view)

DEPLOY         Places cannons       Cannons assigned
               (full control)       to gunners

COMBAT         Fires OR coordinates Phone gunners fire
               Can override/assist  their cannons

SCORING        Views breakdown      Views their stats
                                    (accuracy, kills)
```

### Alternative Concept: "Continuous Siege"

Instead of discrete phases, consider a **real-time hybrid**:

1. **Walls regenerate slowly** over time (no BUILD phase)
2. **Ships arrive in waves** continuously
3. Desktop player **drags and drops** wall repairs as needed
4. Phone players **fire cannons** non-stop
5. Difficulty increases until players are overwhelmed
6. Score = survival time + ships destroyed

### Technical Considerations

**What Already Exists:**
- Touch input enabled in Phaser config (`touch: true`)
- Phase system supports pause/resume
- Callback architecture for combat events
- Score breakdown per-round

**What Would Need Building:**
- WebSocket or WebRTC for real-time sync
- Room/lobby system for device pairing
- Cannon assignment/claiming logic
- Mobile-optimized UI (portrait, large tap targets)
- Role-based input routing (Commander vs Gunner)

### Questions for Creative Team

1. **Should phone players see the full map or just their cannon's view?**
   - Full map: Better coordination, might be too small on phone
   - Zoomed view: More immersive, less awareness

2. **How do cannons get assigned to phone players?**
   - Desktop commander assigns
   - First-come-first-serve claiming
   - Automatic round-robin distribution

3. **What happens if a gunner's cannon is destroyed?**
   - Auto-reassign to another cannon
   - Wait for Desktop to place new cannon
   - Become "repair assistant" role

4. **Should phone players have ANY build capabilities?**
   - Pure gunner (simple, focused)
   - Can place one wall piece (lite building)
   - Can vote on wall placement locations

5. **Should combat be continuous or wave-based?**
   - Wave-based: Strategic pauses, current design
   - Continuous: More action-packed, harder to coordinate

6. **How important is competitive vs cooperative?**
   - Pure co-op against AI ships
   - Competitive: Teams of Commander+Gunners
   - Solo phone play against desktop player

---

# PART 3: Mobile-First Considerations

## Portrait Mode UI Concept

```
┌──────────────────┐
│  [≡] LEVEL 3 [⏸] │  <- Header: menu, level, pause
├──────────────────┤
│                  │
│                  │
│    GAME VIEW     │  <- Scrollable/pannable map
│    (zoomed)      │
│                  │
│                  │
├──────────────────┤
│ 🎯 TAP TO FIRE   │  <- Big tap zone
│                  │
│  [🔄] [COOLDOWN] │  <- Rotate piece / fire status
└──────────────────┘
```

## Touch Control Mapping

| Desktop Action | Mobile Equivalent |
|----------------|-------------------|
| Mouse move | Drag finger / tap position |
| Left click | Single tap |
| Right click (rotate) | Long-press OR dedicated button |
| Right click (remove) | Long-press OR swipe away |

## Dyslexia Support
- **OpenDyslexic font** as toggle option
- Increased letter spacing (0.12em)
- High contrast text on backgrounds
- Audio cues supplement visual text

---

# PART 4: Technical Architecture Options

## Option A: Peer-to-Peer (WebRTC)
- Desktop hosts, phones connect directly
- Low latency, no server needed
- Limited by NAT traversal issues
- Good for: Same-network play

## Option B: Server-Relayed (WebSocket)
- Central server relays commands
- More reliable connections
- Requires hosting infrastructure
- Good for: Internet play, room codes

## Option C: Hybrid Local
- Desktop broadcasts game state via local network
- Phones discover and connect
- No internet required
- Good for: Party/couch co-op

---

# Summary: Next Steps

1. **Circulate this document** to creative team
2. **Decide on core multiplayer model:**
   - Symmetric (both devices equal)
   - Asymmetric Commander+Gunners
   - Something else entirely
3. **Decide on combat flow:**
   - Keep phase-based
   - Move to continuous
4. **Prototype mobile controls** first (non-destructive to desktop)
5. **Then add networking** for multi-device

---

**Document Version:** 1.0
**Date:** 2026-01-11
**Status:** Ready for creative team review
