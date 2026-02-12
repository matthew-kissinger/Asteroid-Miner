# Asteroid Miner

3D space mining game built with Three.js WebGPU + bitECS. Mining, trading, combat, exploration across procedural star systems.

## Commands

```bash
npm install
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run typecheck    # TypeScript strict check (0 errors)
npm run test         # Vitest - 10 files, 119 tests (all passing)
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
| Styles | Tailwind CSS 3.4 + 18 CSS files |

## Architecture

251 TypeScript files, 0 JavaScript. Pure TS codebase.

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
- **Code splitting**: game-core 186 kB, combat 27 kB, env 62 kB, ui 64 kB.
- **Build config**: `vite.config.js` (not .ts), port 3000, base: '/Asteroid-Miner/'.
- **Module resolution**: `tsconfig.json` uses "bundler" mode, `allowImportingTsExtensions: true`. Vite resolves .js -> .ts at dev and build time.

## Technical Notes

- WebGPURenderer is not in @types/three - use type declaration
- ShaderPass requires raw GLSL/WGSL, not TSL nodes
- Three.js mock pattern: position/quaternion/scale need .set() methods
- bitECS uses Float32Array - use `toBeCloseTo()` not `toBe()` for fractional test values
- TSL PostProcessing replaces EffectComposer for WebGPU, uses `pass()` + `BloomNode`
- `js/globals/debug.ts` exports `DEBUG_MODE.enabled` boolean + `setDebugMode()`/`isDebugMode()` - no `debugLog()` wrapper yet, needs to be created

## Active Issues

- 502 `console.log` across 105 files - debugLog branch ready but unmerged (4 unmerged task branches total)
- 49 `window.game` across 25 files (includes comments) - partial removal branch unmerged
- 640 `any` type escapes (295 `as any` + 345 `: any`) - worst: combat/eventHandlers 30, controls 26, postTSL 34, environment 32
- 97 files use `import * as THREE` - Three.js bundle 1,370 kB, tree-shaking blocked
- Test coverage gaps: environment, ui, renderer, spaceship, audio modules have zero tests on master
