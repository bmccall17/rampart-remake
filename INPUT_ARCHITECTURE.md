# 🎮 Input Architecture - Rampart Remake

## Where Inputs Are Received

This document explains exactly where keyboard and mouse inputs are handled in the architecture.

## Input Flow Diagram

```
User Input (Keyboard/Mouse)
    ↓
Browser DOM Event
    ↓
Phaser Input System (scene.input)
    ↓
MainScene Event Listeners
    ↓
Phase-Specific Input Handlers
    ↓
Game Systems (BuildPhaseSystem, DeployPhaseSystem, CombatPhaseSystem)
    ↓
Visual Feedback & Game State Updates
```

## Detailed Input Architecture

### 1. Input Initialization: `MainScene.ts:150-184`

**File**: `game/core/MainScene.ts`
**Method**: `setupControls()`

```typescript
private setupControls(): void {
  // KEYBOARD SETUP (Lines 152-154)
  this.cursors = this.input.keyboard!.createCursorKeys();
  this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

  // MOUSE SETUP (Lines 156-181)
  this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    // Mouse click handling
  });
}
```

**What happens here:**
- Phaser's input manager (`this.input.keyboard`) creates key objects for arrow keys, spacebar, and R key
- Event listener registered for mouse clicks (`pointerdown`)
- All input goes through Phaser's input system first

---

### 2. Keyboard Input Processing: `MainScene.ts:436-473`

**File**: `game/core/MainScene.ts`
**Method**: `handleBuildPhaseInput()`

This method is called **every frame** during BUILD phase from `update()` loop (line 406).

```typescript
private handleBuildPhaseInput(): void {
  // Line 441-443: LEFT ARROW
  if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
    this.buildSystem.movePiece(-1, 0);
  }

  // Line 446-448: RIGHT ARROW
  if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
    this.buildSystem.movePiece(1, 0);
  }

  // Line 451-453: UP ARROW
  if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
    this.buildSystem.movePiece(0, -1);
  }

  // Line 456-458: DOWN ARROW
  if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
    this.buildSystem.movePiece(0, 1);
  }

  // Line 461-463: R KEY (Rotate)
  if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
    this.buildSystem.rotatePiece(true);
  }

  // Line 466-472: SPACEBAR (Place)
  if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
    if (this.buildSystem.placePiece()) {
      this.tileRenderer.clear();
      this.renderMap();
    }
  }
}
```

**Key Concept**: `Phaser.Input.Keyboard.JustDown(key)`
- This checks if a key was JUST pressed this frame (prevents holding)
- Returns `true` only on the frame the key was pressed
- Returns `false` on all other frames

---

### 3. Mouse Input Processing: `MainScene.ts:157-181`

**File**: `game/core/MainScene.ts`
**Method**: Event listener in `setupControls()`

```typescript
this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
  const currentPhase = this.phaseManager.getCurrentPhase();

  // Line 160-162: DEBOUNCE (prevent rapid clicks)
  const now = this.time.now;
  if (now - this.lastClickTime < 200) return;
  this.lastClickTime = now;

  // Line 164-165: Convert screen coordinates to grid coordinates
  const gridX = Math.floor((pointer.x - this.mapOffsetX) / TILE_SIZE);
  const gridY = Math.floor((pointer.y - this.mapOffsetY) / TILE_SIZE);

  // Line 167-174: DEPLOY PHASE - Place/Remove Cannons
  if (currentPhase === GamePhase.DEPLOY) {
    if (pointer.leftButtonDown()) {
      this.deploySystem.placeCannon({ x: gridX, y: gridY });
    } else if (pointer.rightButtonDown()) {
      this.deploySystem.removeCannon({ x: gridX, y: gridY });
    }
  }

  // Line 175-180: COMBAT PHASE - Fire Cannons
  else if (currentPhase === GamePhase.COMBAT) {
    if (pointer.leftButtonDown()) {
      this.fireNearestCannon({ x: gridX, y: gridY });
    }
  }
});
```

**Key Concepts:**
- **Event-based**: Fires only when mouse is clicked (not every frame)
- **Debouncing**: 200ms delay between clicks to prevent double-clicks
- **Phase-specific**: Different behavior based on current game phase
- **Coordinate conversion**: Screen pixels → Grid tiles

---

### 4. Main Update Loop: `MainScene.ts:395-434`

**File**: `game/core/MainScene.ts`
**Method**: `update(time: number, delta: number)`

This is called **every frame** by Phaser (60 times per second).

```typescript
update(time: number, delta: number) {
  // Line 397: Update phase manager
  this.phaseManager.update(time);

  // Line 400-402: Get current phase data
  const currentPhase = this.phaseManager.getCurrentPhase();

  // Line 405-411: PHASE-SPECIFIC INPUT HANDLING
  if (currentPhase === GamePhase.BUILD) {
    this.handleBuildPhaseInput();  // Keyboard input (arrows, R, space)
  } else if (currentPhase === GamePhase.DEPLOY) {
    this.handleDeployPhaseInput(); // (Currently empty, mouse handled via events)
  } else if (currentPhase === GamePhase.COMBAT) {
    this.combatSystem.update(delta); // Combat physics
  }

  // Line 414-416: Render current state
  this.renderCurrentPiece();
  this.renderCannons();
  this.renderCombat();

  // Line 419-433: Update HUD
  this.hud.update({ ... }, progress);
}
```

**Key Concept**: The update loop is where keyboard inputs are checked each frame.

---

## Input Debug Display

### New File: `game/ui/InputDebugDisplay.ts`

This new component shows all input events in real-time on-screen:

**Features:**
- Shows keyboard events: `⌨️ KeyDown: ArrowLeft (ArrowLeft)`
- Shows mouse clicks: `🖱️ Mouse: LEFT at (256, 384)`
- Displays last 10 input events with timestamps
- Logs to browser console for debugging
- Always visible in top-left corner

**Where it's created**: `MainScene.ts:92-94`

```typescript
this.inputDebugDisplay = new InputDebugDisplay(this);
this.inputDebugDisplay.setVisible(true);
```

**How it works:**
- Attaches its own event listeners to `this.scene.input.keyboard` and `this.scene.input`
- Logs ALL keyboard and mouse events (keydown, keyup, pointerdown, pointermove)
- Updates on-screen display with event history
- Also logs to browser console for detailed debugging

---

## Phase-Specific Input Behavior

### BUILD Phase (GamePhase.BUILD)
- **Active inputs**: Arrow keys, R, Spacebar
- **Handler**: `handleBuildPhaseInput()` called every frame
- **System**: `BuildPhaseSystem`
- **Actions**:
  - Arrows: Move current wall piece
  - R: Rotate piece
  - Space: Place piece

### DEPLOY Phase (GamePhase.DEPLOY)
- **Active inputs**: Mouse clicks
- **Handler**: `pointerdown` event listener
- **System**: `DeployPhaseSystem`
- **Actions**:
  - Left click: Place cannon
  - Right click: Remove cannon

### COMBAT Phase (GamePhase.COMBAT)
- **Active inputs**: Mouse clicks
- **Handler**: `pointerdown` event listener
- **System**: `CombatPhaseSystem`
- **Actions**:
  - Left click: Fire nearest cannon at target

### SCORING Phase (GamePhase.SCORING)
- **Active inputs**: None (auto-progresses)
- **Handler**: None
- **System**: `GameStateManager`
- **Duration**: 3 seconds

---

## Troubleshooting Input Issues

### Problem: Inputs not working on deployed site

**Potential causes:**

1. **Canvas focus issue**
   - Browser may not be focusing the Phaser canvas
   - Check: Click on the canvas before trying inputs
   - Fix: Added `autoFocus: true` in `game/components/PhaserGame.tsx`

2. **Keyboard events not reaching Phaser**
   - Browser console will show events via InputDebugDisplay
   - Check browser console for "KeyDown Event:" logs
   - If no logs appear, browser is blocking keyboard events

3. **Wrong phase**
   - Keyboard only works during BUILD phase
   - Check HUD to see current phase
   - Wait for BUILD phase banner to appear

4. **JustDown not triggering**
   - `JustDown()` only returns true for ONE frame
   - If update loop isn't running, inputs won't be detected
   - Check browser console for "GameLoop" logs

5. **Input display shows events but game doesn't respond**
   - This means Phaser IS receiving events
   - Problem is in the game logic, not input system
   - Check which phase is active in HUD
   - Check browser console for system errors

---

## Browser Console Logging

When you open browser DevTools console, you should see:

```
Input listeners attached to scene: MainScene
INPUT DEBUG: Keyboard initialized
KeyDown Event: ArrowLeft ArrowLeft [KeyboardEvent object]
INPUT DEBUG: ⌨️ KeyDown: ArrowLeft (ArrowLeft)
```

**If you DON'T see these logs:**
- Phaser isn't initializing properly
- Canvas isn't loading
- Check for JavaScript errors in console

**If you DO see these logs but game doesn't respond:**
- Input is reaching Phaser correctly
- Problem is in game logic (phase handling, system state)
- Check phase manager state

---

## Quick Reference

| Input | Phase | File | Line | Method | System |
|-------|-------|------|------|--------|--------|
| Arrow Keys | BUILD | MainScene.ts | 441-458 | handleBuildPhaseInput() | BuildPhaseSystem |
| R Key | BUILD | MainScene.ts | 461-463 | handleBuildPhaseInput() | BuildPhaseSystem |
| Spacebar | BUILD | MainScene.ts | 466-472 | handleBuildPhaseInput() | BuildPhaseSystem |
| Mouse Click | DEPLOY | MainScene.ts | 167-174 | pointerdown event | DeployPhaseSystem |
| Mouse Click | COMBAT | MainScene.ts | 175-180 | pointerdown event | CombatPhaseSystem |

---

## Testing Input System

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Click on game canvas** to focus it
4. **Press any key** - should see:
   - Console log: `KeyDown Event: ...`
   - On-screen display update
5. **Click on game** - should see:
   - Console log: `Pointer Down: ...`
   - On-screen display update
6. **During BUILD phase specifically**:
   - Press arrow keys: piece should move
   - Press R: piece should rotate
   - Press Space: piece should place

If you see console logs but game doesn't respond, the issue is in game logic, not input system.

If you DON'T see console logs, the issue is with Phaser initialization or browser event handling.

---

## Files Modified for Input Debug

1. **New file**: `game/ui/InputDebugDisplay.ts`
   - Self-contained input debug display component
   - Shows real-time input events on screen
   - Logs all events to console

2. **Modified**: `game/core/MainScene.ts`
   - Line 20: Import InputDebugDisplay
   - Line 39: Add inputDebugDisplay property
   - Lines 92-94: Initialize and show debug display
   - Line 109: Update version to v0.7.1

---

## Next Steps for Debugging

1. Deploy to Vercel
2. Open deployed site
3. Open browser console (F12)
4. Look at INPUT DEBUG panel on screen
5. Check console logs
6. Report what you see:
   - Do events appear in INPUT DEBUG panel?
   - Do events appear in console logs?
   - What phase is the game in (check HUD)?
   - Does the debug display say "Keyboard initialized"?
