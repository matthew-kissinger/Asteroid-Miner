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

## Unmerged Branches (6 - all conflict-free, ready to merge)

Six completed task branches await merge into master:

| Branch | Task | Files | Impact |
|--------|------|-------|--------|
| `mycel/task-39ffe169` | Fix 155 stale .js imports | 46 | Code hygiene |
| `mycel/task-d18c7e13` | Pool Vector3/Quaternion in physics | 3 | -20 per-frame allocs |
| `mycel/task-3933ce70` | ecsRunner integration tests | 3 | +7 tests |
| `mycel/task-8ae7a791` | Type-safe messageBus events | 2 | 40+ typed events |
| `mycel/task-ddca8300` | Remove window.game from 3 UI files | 6 | -24 global usages |
| `mycel/task-cf662b0b` | TSL post-processing for WebGPU | 3 | Phase 6 feature |

## Stack

| Layer | Tech |
|-------|------|
| Graphics | Three.js r180 WebGPU (WebGL2 fallback) |
| ECS | bitECS v0.4.0 (29 components, 5 systems) |
| Physics | Custom Newtonian (thrust, drag, collision) |
| Shaders | TSL laser material + TSL post-processing (branch) + 2 GLSL fallback |
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

### Completed (awaiting merge)
- ~~155 stale `.js` import extensions~~ - Fixed in branch `mycel/task-39ffe169`
- ~~TSL post-processing conversion~~ - Done in branch `mycel/task-cf662b0b`
- ~~window.game in top 3 UI files (24 usages)~~ - Done in branch `mycel/task-ddca8300`
- ~~Physics per-frame allocations~~ - Pooled in branch `mycel/task-d18c7e13`
- ~~Type-safe messageBus~~ - Done in branch `mycel/task-8ae7a791`
- ~~ecsRunner integration tests~~ - Done in branch `mycel/task-3933ce70`

### Active
- 499 unguarded `console.log` statements (task running - opencode)
- 67 `window.game` global usages remaining across ~29 files (after branch merge)
- 649 `as any` type casts (~80 tied to window.game pattern)
- 183 addEventListener vs 31 removeEventListener - memory leak risk
- ~525 inline `.style.` manipulations (mostly dynamic values, diminishing returns)

### Planned
- Phase 6: TSL shaders + WebGPU compute particles
- Phase 7: Polish, remove global state, profile, test coverage expansion
