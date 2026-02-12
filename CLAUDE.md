# Asteroid Miner

3D space mining game built with Three.js WebGPU + bitECS. Mining, trading, combat, exploration across procedural star systems.

## Commands

```bash
npm install
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # TypeScript strict check (0 errors)
npm run test         # 68 tests (all passing)
npm run test:smoke   # Headless browser runtime test (Playwright)
```

## Unmerged Branches (1 - needs conflict resolution)

| Branch | Task | Files | Status |
|--------|------|-------|--------|
| `mycel/task-6ba2d876` | Remove window.game from 5 more UI files | 8 | Clean, ready to merge |

**Abandoned:** `mycel/task-74b9b8b8` (console.log gating) - Agent went rogue, deleted postTSL.ts and ecsRunner tests. Redo from scratch.

**Merged (2025-02-11):** .js imports, physics pooling, ecsRunner tests, messageBus types, window.game (3 files), TSL post-processing.

## Stack

| Layer | Tech |
|-------|------|
| Graphics | Three.js r180 WebGPU (WebGL2 fallback) |
| ECS | bitECS v0.4.0 (29 components, 5 systems) |
| Physics | Custom Newtonian (thrust, drag, collision, 977 lines) |
| Shaders | TSL laser material + TSL post-processing + 2 GLSL fallback |
| Build | Vite 6, TypeScript 5.7 strict |
| Styles | Tailwind CSS 3.4 + 18 CSS files |
| Tests | Vitest - 8 files, 68 tests, all passing |

## Architecture

249 TypeScript files, 0 JavaScript. Pure TS codebase.

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

### Recently Merged
- 155 stale `.js` import extensions fixed
- TSL post-processing for WebGPU
- window.game removed from 3 UI files (starMap, mobileHUD, statusIndicators)
- Physics Vector3/Quaternion pooling (-20 per-frame allocs)
- Type-safe messageBus (40+ typed events)
- ecsRunner integration tests (+7 tests)

### Ready to Merge
- `mycel/task-6ba2d876`: Remove window.game from 5 more UI files (missions, tradingView, gameOverScreen, ui, betting)

### Active Issues
- 502 unguarded `console.log` statements across 105 files (previous opencode task failed - needs redo)
- 67 `window.game` global usages remaining across 29 files
- 664 `as any`/`: any` type casts across 89 files
- 183 addEventListener vs 31 removeEventListener - memory leak risk (worst: customSystem/eventHandlers 26/8, combat/eventHandlers 14/3, stargate/eventHandlers 13/0)
- Zero test coverage on all major modules: controls, physics, combat, environment, ui, renderer, game, messageBus, spaceship

### Planned
- Phase 6: TSL shaders + WebGPU compute particles
- Phase 7: Polish, remove global state, profile, test coverage expansion
