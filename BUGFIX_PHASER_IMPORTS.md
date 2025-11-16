# Bug Fix: Phaser Import Errors

## Issue

Build failed with error:
```
Attempted import error: 'phaser' does not contain a default export (imported as 'Phaser').
```

And TypeScript error:
```
Type error: Argument of type 'PhaseChangeEvent' is not assignable to parameter of type 'LogEventPayload'.
```

## Root Cause

1. **Phaser Import Issue**: Phaser 3.x doesn't export a default export. The correct import style is:
   ```typescript
   import * as Phaser from "phaser";  // ✅ Correct
   import Phaser from "phaser";       // ❌ Wrong
   ```

2. **Logger Type Issue**: The `PhaseChangeEvent` object doesn't have the index signature required by `LogEventPayload`, so it couldn't be passed directly to `logger.info()`.

## Files Fixed

### 1. Updated Phaser Imports (5 files)

Changed from `import Phaser from "phaser"` to `import * as Phaser from "phaser"`:

- ✅ `game/core/GameConfig.ts`
- ✅ `game/core/MainScene.ts`
- ✅ `game/core/HUD.ts`
- ✅ `game/grid/TileRenderer.ts`
- ✅ `components/PhaserGame.tsx`

### 2. Fixed Logger Type Error

**File**: `game/core/MainScene.ts:73`

**Before**:
```typescript
logger.info("Phase transition", event);
```

**After**:
```typescript
logger.info("Phase transition", {
  fromPhase: event.fromPhase || "none",
  toPhase: event.toPhase,
  timestamp: event.timestamp,
});
```

## Testing

After these fixes:
1. ✅ TypeScript compilation should succeed
2. ✅ Build should complete without errors
3. ✅ Vercel deployment should work

## Deploy

```bash
git add .
git commit -m "Fix: Update Phaser imports and logger type error"
git push
```

Vercel will auto-deploy the fixed version!
