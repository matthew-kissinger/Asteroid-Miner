# Asteroid Miner

3D space mining game built with Three.js WebGPU + bitECS. Mining, trading, combat, exploration across procedural star systems.

## Commands

```bash
npm install
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # TypeScript strict check (0 errors)
npm run test         # 61 tests (all passing)
npm run test:smoke   # Headless browser runtime test (Playwright)
```

## Code Hygiene: 155 Stale `.js` Import Extensions

155 import statements across 48 files in `js/` use `.js` extensions pointing to `.ts` files. Vite resolves these correctly at both dev and build time (`moduleResolution: "bundler"` + Vite's resolve), so the game builds and runs normally. However, these should be cleaned up for code consistency and portability.

**Example** (`js/main.ts`):
```typescript
import { initializeGlobals } from './main/globals.js';  // File is globals.ts - works via Vite
```

**Fix**: Bulk find-and-replace `.js'` to `.ts'` in import statements across `js/`:
```bash
grep -r "from '.*\.js'" js/ --include="*.ts" -l  # 48 files affected
```

**Note**: `src/three-imports.ts` and `src/global.d.ts` also use `.js` in Three.js package imports (`three/addons/...`) - these are correct and should NOT be changed.

## Stack

| Layer | Tech |
|-------|------|
| Graphics | Three.js r180 WebGPU (WebGL2 fallback) |
| ECS | bitECS v0.4.0 (29 components, 5 systems) |
| Physics | Custom Newtonian (thrust, drag, collision) |
| Shaders | TSL laser material + 2 GLSL post-processing |
| Build | Vite 6, TypeScript 5.7 strict |
| Styles | Tailwind CSS 3.4 + 18 CSS files |
| Tests | Vitest - 7 files, 61 tests, all passing |

## Architecture

248 TypeScript files, 0 JavaScript. Pure TS codebase.

```
src/
├── main.ts              # Bootstrap, loading screen, asset preloading
├── three-imports.ts     # Centralized Three.js imports
└── styles/              # 18 CSS files (3,041 lines)

js/
├── main.ts              # Game class, main loop
├── ecs/
│   ├── world.ts         # bitECS world (createWorld, add/remove entity)
│   ├── components.ts    # 29 components (SoA TypedArrays, 10k entities)
│   └── systems/         # 5 systems + ecsRunner: physics, renderSync, enemyAI, combat, mining
├── entities/spaceship.ts
├── main/                # 11 lifecycle modules (globals, bootstrap, gameLoop, etc.)
├── modules/
│   ├── renderer.ts      # WebGPU/WebGL2 renderer
│   ├── controls.ts      # Input handling (keyboard + gamepad)
│   ├── physics.ts       # Newtonian physics (752 lines)
│   ├── combat.ts        # Combat orchestrator + 10 submodules
│   ├── ui.ts            # UI module
│   ├── environment.ts   # Environment (39 submodules)
│   ├── audio/           # 7 files
│   ├── pooling/         # 14 files (object pools)
│   ├── spaceship/       # 7 files
│   ├── intro/           # 6 files
│   └── ui/              # 73 files (hud, settings, stargate, starmap, combat, blackjack)
├── globals/             # Module singletons (debug, messageBus, objectPool)
└── core/                # 3 active files (messageBus, world, events)

public/                  # Static assets (textures, models)
css/                     # 18 CSS files
```

## Key Systems

- **bitECS**: 29 components across 8 categories (Transform, Render, Physics, Combat, Spaceship, Mining, AI, Tags). All systems wired into game loop via `ecsRunner.ts`.
- **WebGPU**: Auto-fallback to WebGL2. TSL laser material for mining.
- **Code splitting**: game-core 180 kB, combat 27 kB, env 62 kB, ui 63 kB.

## Remaining Work

- **155 stale `.js` import extensions** across 48 files (code hygiene - Vite resolves them)
- 91 `window.game` global usages across 32 files (top: starMap 8, mobileHUD 8, statusIndicators 8)
- ~525 inline `.style.` manipulations (mostly dynamic values, diminishing returns)
- 2 GLSL post-processing shaders need TSL conversion (requires NodePostProcessing)
- Phase 6 planned: TSL shaders + WebGPU compute particles
- Phase 7 planned: Polish, remove global state, profile
