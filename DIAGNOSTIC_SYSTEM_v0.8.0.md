# 🔍 Enhanced Diagnostic System - v0.8.0

## Overview

This document explains the comprehensive diagnostic logging system that has been implemented to help diagnose why keyboard and mouse inputs aren't changing game state. Phase 1 of the diagnostic plan is now complete and deployed.

---

## What Was Implemented (Phase 1)

### ✅ Enhanced Validation Logging

Every input action and validation failure now logs detailed information about:
- **What was attempted** (move, rotate, place, fire)
- **Why it failed** (specific validation check that failed)
- **State before/after** (position changes, tile changes)
- **Contextual details** (grid bounds, tile types, available resources)

### Files Modified

1. **`game/systems/BuildPhaseSystem.ts`**
   - ✅ Movement logging (success + failures with reasons)
   - ✅ Rotation logging (success + failures with reasons)
   - ✅ Placement logging (tile-by-tile state changes)
   - ✅ New method: `getValidationFailureReason()` - Returns detailed failure info

2. **`game/systems/DeployPhaseSystem.ts`**
   - ✅ Cannon placement logging (success + failures with reasons)
   - ✅ New method: `getCannonValidationFailureReason()` - Returns detailed failure info

3. **`game/systems/CombatPhaseSystem.ts`**
   - ✅ Cannon fire logging (success + failures)
   - ✅ Logs when cannon not found

4. **`game/core/MainScene.ts`**
   - ✅ Mouse click logging (all clicks logged, not just successful ones)
   - ✅ Debounced click logging (logs when clicks are ignored)
   - ✅ Phase mismatch logging (logs when input received in wrong phase)
   - ✅ Fire attempt logging (logs when no cannons available)

---

## How to Use the Diagnostic System

### Step 1: Deploy and Open Browser Console

1. Deploy v0.8.0 to Vercel
2. Open the game in your browser
3. Open DevTools (F12)
4. Go to **Console** tab
5. Press **ESC** to restart the game

### Step 2: Test BUILD Phase (Arrow Keys, R, Space)

**What to do:**
1. Wait for BUILD phase to start (or press ESC)
2. Press **arrow keys** to move piece
3. Press **R** to rotate piece
4. Press **Space** to place piece

**What to look for in console:**

✅ **If movement WORKS:**
```
[BuildPhaseSystem] Piece moved successfully {
  piece: "L-piece",
  from: {x: 12, y: 0},
  to: {x: 13, y: 0},
  direction: {dx: 1, dy: 0}
}
```

❌ **If movement FAILS:**
```
[BuildPhaseSystem] Move blocked {
  piece: "L-piece",
  attemptedPosition: {x: 23, y: 0},
  direction: {dx: 1, dy: 0},
  reason: "Out of bounds (right edge)",
  details: {
    tile: {x: 24, y: 0},
    bounds: {maxX: 23}
  }
}
```

This tells you EXACTLY why the move was blocked!

### Step 3: Test DEPLOY Phase (Mouse Clicks)

**What to do:**
1. Wait for DEPLOY phase (30 seconds after BUILD)
2. **Left-click** to place cannons
3. **Right-click** to remove cannons

**What to look for in console:**

✅ **If click is received:**
```
[MainScene] Mouse click received {
  phase: "DEPLOY",
  screenPos: {x: 456, y: 389},
  gridPos: {x: 12, y: 8},
  button: "LEFT"
}
```

✅ **If cannon placement WORKS:**
```
[DeployPhaseSystem] CannonPlaced {
  cannonId: "cannon_1234567890_0.123",
  position: {x: 12, y: 8},
  totalCannons: 1,
  remaining: 2
}
```

❌ **If cannon placement FAILS:**
```
[DeployPhaseSystem] Cannot place cannon: invalid position {
  pos: {x: 12, y: 8},
  reason: "Position not in enclosed territory",
  details: {
    pos: {x: 12, y: 8},
    totalEnclosedTiles: 0
  }
}
```

This tells you EXACTLY why the cannon couldn't be placed!

### Step 4: Test COMBAT Phase (Mouse Clicks to Fire)

**What to do:**
1. Wait for COMBAT phase (30 seconds after DEPLOY)
2. **Left-click** to fire cannons

**What to look for in console:**

✅ **If firing WORKS:**
```
[MainScene] Firing nearest cannon {
  cannonId: "cannon_1234567890_0.123",
  cannonPosition: {x: 12, y: 8},
  target: {x: 18, y: 12},
  distance: "7.21"
}

[CombatPhaseSystem] CannonFired {
  projectileId: "proj_player_1234567890_0.456",
  cannonId: "cannon_1234567890_0.123",
  cannonPosition: {x: 12, y: 8},
  target: {x: 18, y: 12},
  distance: "7.21",
  velocity: {x: 6.66, y: 4.43}
}
```

❌ **If firing FAILS:**
```
[MainScene] Fire attempt failed: No cannons available {
  targetPos: {x: 18, y: 12},
  currentPhase: "COMBAT"
}
```

### Step 5: Check for Debounced Clicks

**What to do:**
1. Click rapidly (faster than 200ms between clicks)

**What to look for:**
```
[MainScene] Mouse click debounced (too rapid) {
  timeSinceLastClick: "87ms",
  debounceThreshold: "200ms"
}
```

This tells you if your clicks are being ignored due to debouncing!

### Step 6: Check for Phase Mismatches

**What to do:**
1. Try pressing arrow keys during DEPLOY or COMBAT phase

**What to look for:**
```
[MainScene] Mouse click ignored - wrong phase for mouse input {
  currentPhase: "BUILD",
  clickPosition: {x: 12, y: 8}
}
```

This tells you if inputs are being ignored because you're in the wrong phase!

---

## Common Scenarios and What They Mean

### Scenario 1: Arrow Keys Pressed But Nothing Happens

**Check console for:**

1. **"No current piece available"**
   - Piece didn't spawn at all
   - BUG in BuildPhaseSystem.startBuildPhase()

2. **"Move blocked: Out of bounds"**
   - Piece is at edge of map
   - EXPECTED BEHAVIOR

3. **"Move blocked: Cannot place on water/wall/castle"**
   - Piece would collide with obstacle
   - EXPECTED BEHAVIOR

4. **NO LOGS AT ALL**
   - Keyboard events not reaching MainScene
   - BUG in input system or phase detection

### Scenario 2: Mouse Clicks Don't Place Cannons

**Check console for:**

1. **"Mouse click debounced"**
   - Clicking too fast
   - EXPECTED BEHAVIOR (wait 200ms between clicks)

2. **"Cannot place cannon: no cannons available"**
   - Already placed all available cannons
   - EXPECTED BEHAVIOR

3. **"Cannot place cannon: Position not in enclosed territory"**
   - Clicking outside walls
   - EXPECTED BEHAVIOR (must place inside enclosed area)

4. **"Cannot place cannon: Invalid tile type"**
   - Clicking on water, wall, castle, etc.
   - EXPECTED BEHAVIOR

5. **"Cannot place cannon: Cannon already exists at this position"**
   - Already have cannon there
   - EXPECTED BEHAVIOR

6. **"Mouse click ignored - wrong phase"**
   - Not in DEPLOY phase
   - EXPECTED BEHAVIOR

7. **NO LOGS AT ALL**
   - Phase is not DEPLOY
   - OR input system not working

### Scenario 3: Clicking Doesn't Fire Cannons

**Check console for:**

1. **"Fire attempt failed: No cannons available"**
   - Didn't place any cannons in DEPLOY phase
   - EXPECTED BEHAVIOR

2. **"Fire cannon failed: Cannon not found"**
   - Cannon ID mismatch
   - BUG in cannon management

3. **"Mouse click ignored - wrong phase"**
   - Not in COMBAT phase
   - EXPECTED BEHAVIOR

---

## Log Format Reference

### Log Levels

- **`[Context] info:`** - Normal operation
- **`[Context] warn:`** - Failed action (usually expected, like validation failure)
- **`[Context] error:`** - Unexpected error (should never happen)
- **`📊 [Context] event:`** - Important game event (piece placed, cannon fired)

### Contexts

- **`[MainScene]`** - Main game scene, input handling
- **`[BuildPhaseSystem]`** - Wall piece placement logic
- **`[DeployPhaseSystem]`** - Cannon placement logic
- **`[CombatPhaseSystem]`** - Combat and firing logic
- **`[PhaseManager]`** - Phase transitions
- **`[GameStateManager]`** - Lives, score, game state

---

## What This Diagnostic System Tells You

### ✅ Input Reception
- Are keyboard events reaching the game? (Yes if you see logs)
- Are mouse clicks being detected? (Yes if you see logs)
- Are clicks being debounced? (Yes if you see debounce logs)

### ✅ Validation Failures
- WHY a piece can't move (out of bounds? collision?)
- WHY a cannon can't be placed (no territory? wrong tile? no cannons left?)
- WHY a cannon can't fire (no cannons? cannon not found?)

### ✅ State Changes
- What tiles changed when piece was placed
- How many cannons are placed/remaining
- Where projectiles are created

### ✅ Phase Detection
- Is the game in the correct phase for the input type?
- Are inputs being ignored due to phase mismatch?

---

## Next Steps (Future Phases)

This is **Phase 1** of the diagnostic plan. Future enhancements will include:

### Phase 2: Session Log File System
- Unique session ID for each play session
- Persistent logs (surveyive page refresh)
- Download logs as JSON file
- Server-side log storage (Vercel KV or database)

### Phase 3: State Change Tracking
- Before/after snapshots for every state change
- Grid tile change history
- Cannon array change history
- Visual diff of state changes

### Phase 4: Visual State Inspector
- On-screen panel showing current game state
- Real-time validation failure display
- Last 5 state changes with diffs
- Toggle with Tab key

---

## Troubleshooting Guide

### Problem: No logs appearing at all

**Possible causes:**
1. Console filtering is hiding logs → Check console filter settings
2. Logger not initialized → Should see "Controls initialized" on game start
3. Phase not active → Check HUD banner for current phase

### Problem: Logs appear but actions don't happen

**This is the KEY diagnostic scenario!**

If you see logs like:
```
[BuildPhaseSystem] Piece moved successfully
```

But the piece doesn't actually move on screen, then:
1. **Input system is working** ✅
2. **State is being updated** ✅
3. **Rendering is broken** ❌

Look for:
- `[MainScene] Rendering piece:` logs
- `Drawing piece tile at (x, y)` logs from PieceRenderer

If these logs appear, rendering code is executing but visual output isn't showing.

### Problem: Validation always fails with "Out of bounds"

**Possible causes:**
1. Piece spawning at wrong position
2. Grid dimensions incorrect
3. Map offset calculations wrong

Check console for:
```
[BuildPhaseSystem] New piece spawned {
  current: "L-piece",
  position: {x: 12, y: 0}  // Should be near center-top
}
```

---

## Build Information

- **Version**: v0.8.0
- **Build Date**: 2025-11-16
- **Phase**: Phase 1 - Enhanced Validation Logging
- **Status**: ✅ Build Successful
- **Deployment**: Ready for Vercel

---

## Summary

The Enhanced Diagnostic System provides complete visibility into:
- ✅ Every input attempt (not just successes)
- ✅ Every validation failure with detailed reasons
- ✅ Debounced/ignored inputs
- ✅ Phase mismatches
- ✅ State changes (tile changes, cannon placement, projectiles)

**Deploy this build and check your browser console.** You will now see EXACTLY what's happening (or not happening) when you interact with the game, making it trivial to diagnose the input issues.
