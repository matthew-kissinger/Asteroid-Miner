# Asteroid Miner

3D space mining game built with Three.js WebGPU + bitECS. Mining, trading, combat, exploration across procedural star systems.

## Commands

```bash
npm install
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run typecheck    # TypeScript strict check (0 errors)
npm run test         # Vitest - 15 files, 304 tests (all passing)
npm run test:smoke   # Headless browser runtime test (Playwright)
```

## Stack

| Layer | Tech |
|-------|------|
| Graphics | Three.js r180 WebGPU (WebGL2 fallback) |
| ECS | bitECS v0.4.0 (29 components, 5 systems) |
| Physics | Custom Newtonian (thrust, drag, collision, 977 lines) |
| Shaders | TSL laser material + TSL post-processing + 2 GLSL fallback |
| Build | Vite 6, TypeScript 5.7 strict |
| Styles | Tailwind CSS 3.4 + 26 CSS files |

## Architecture

265 TypeScript files, 0 JavaScript. Pure TS codebase. 26 CSS files.

```
src/
├── main.ts              # Bootstrap, loading screen, asset preloading
├── three-imports.ts     # Centralized Three.js imports
└── styles/              # 18 CSS files

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
│   ├── physics.ts       # Newtonian physics (977 lines)
│   ├── combat.ts        # Combat orchestrator + 10 submodules
│   ├── ui.ts            # UI module
│   ├── environment.ts   # Environment (39 submodules)
│   ├── audio/           # 8 files (Web Audio synthesis + music player)
│   ├── pooling/         # 15 files (object pools)
│   ├── game/            # 7 files (saveSystem, lifecycle, state)
│   ├── spaceship/       # 9 files (includes xp/ranks systems)
│   ├── intro/           # 6 files
│   └── ui/              # 75 files (hud, settings, stargate, starmap, combat, blackjack)
├── globals/             # Module singletons (debug, messageBus, objectPool)
└── core/                # 3 active files (messageBus, world, events)

public/                  # Static assets (textures, models)
css/                     # 18 CSS files
```

## Key Systems

- **bitECS**: 29 components across 8 categories (Transform, Render, Physics, Combat, Spaceship, Mining, AI, Tags). All systems wired into game loop via `ecsRunner.ts`.
- **WebGPU**: Auto-fallback to WebGL2. TSL laser material for mining.
- **Code splitting**: game-core 189 kB, combat 27 kB, env 62 kB, ui 73 kB.
- **Build config**: `vite.config.js` (not .ts), port 3000, base: '/Asteroid-Miner/'.
- **Module resolution**: `tsconfig.json` uses "bundler" mode, `allowImportingTsExtensions: true`. Vite resolves .js -> .ts at dev and build time.

## Technical Notes

- WebGPURenderer is not in @types/three - use type declaration
- ShaderPass requires raw GLSL/WGSL, not TSL nodes
- Three.js mock pattern: position/quaternion/scale need .set() methods
- bitECS uses Float32Array - use `toBeCloseTo()` not `toBe()` for fractional test values
- TSL PostProcessing replaces EffectComposer for WebGPU, uses `pass()` + `BloomNode`
- `js/globals/debug.ts` exports `debugLog()`, `DEBUG_MODE.enabled`, `setDebugMode()`, `isDebugMode()`

## Active Issues

- 224 `console.log` across 81 files (31 files use debugLog, rest ungated)
- 27 `window.game` files
- 637 `any` type escapes (305 `as any` + 332 `: any`, excluding tests)
- 80 files use `import * as THREE` - Three.js bundle 1,370 kB, tree-shaking blocked
- `js/main/startupSequence.ts` local type aliases (`UiLike`, `CombatLike`) must be updated when adding properties to ui/combat modules - recurring source of type errors
- Test coverage gaps: environment, ui, renderer, spaceship, audio modules have zero tests
