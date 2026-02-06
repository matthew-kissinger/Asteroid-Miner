# Asteroid Miner

3D space mining game. Full overhaul to modern 2026 stack.

## Vision

A polished space mining game running on WebGPU at locked 60fps. Clean architecture, modern tooling, production quality.

## Current State: Phase 5 IN PROGRESS - HUD Overhaul

**MILESTONE: Phase 5 HUD Overhaul Started (2026-02-06)**

- ~243 TypeScript files, 0 JavaScript files (pure TypeScript codebase)
- bitECS systems ALL wired into game loop: physics, renderSync, enemyAI, combat, mining
- Build succeeds, typecheck passes with 0 errors
- Code splitting: game-core 182 kB, combat 27 kB, env 62 kB, ui 65 kB
- Vite 6 + Tailwind CSS 3.4 + PostCSS installed and configured
- 8 CSS files extracted (46.3 KB total) - combat, mobile-hud, touch-controls, blackjack, game-over, settings, starmap all committed
- ~965 inline `.style.` usages remain across 68 files
- physics.ts window.game globals removed via dependency injection (77fdb44)
- Vitest smoke tests: 3 test files, 10 tests passing (58f5fce)
- CI/CD workflow triggers on `main` but default branch is `master` - deploys never run

**Phase 4 Completed Features:**
- Lock-on targeting: target reticle, lead indicator, health bar (ad26e0c)
- Threat indicators: off-screen enemy arrows, color-coded by distance (f711765)
- Enemy AI: state machine with IDLE/PATROL/CHASE/EVADE behaviors (ae668e6)
- Radar minimap: 2D radar showing enemies, asteroids, stations (67ae92d)
- Velocity indicator: direction arrow, speed display, color-coded (306af3a)
- Speed lines: radial motion blur at high velocity (306af3a)

**Phase 3 Completed Features:**
- Controller tuning: response curves, dead zones, gamepad rumble
- Combat feedback: screen flash, camera shake, weapon recoil, floating damage numbers
- Camera system: damping, velocity offset, look-ahead, boost zoom

**Completed:**
- TypeScript with strict mode (tsconfig.json configured)
- WebGPU renderer with automatic WebGL2 fallback
- Directional sun lighting fixed
- TSL laser material created and integrated (js/modules/render/laserMaterial.ts)
- Entry points converted to TypeScript (src/main.ts, js/main.ts)
- js/main/ lifecycle modules converted to TypeScript (12 files, all TS - bootstrap.ts, gameLifecycle.ts committed at 3fef5c3)
- Mining subsystem converted to TypeScript (5 modules in js/modules/controls/mining/)
- CSS mining laser replaced with 3D cylinder mesh using TSL material (js/modules/controls/mining/laserControl.ts)
- bitECS installed (v0.4.0) and world module created (js/ecs/world.ts)
- bitECS components defined (24 components in js/ecs/components.ts) - Transform, Render, Physics, Combat, Spaceship, Mining, AI, Tags, Utility
- bitECS physics system created (js/ecs/systems/physicsSystem.ts) - thrust, drag, position integration, collision
- bitECS render sync system created (js/ecs/systems/renderSyncSystem.ts) - ECS-to-Three.js bridge with mesh registry
- bitECS systems integrated into game loop via ecsRunner.ts - initECS() and updateECS(deltaTime) called from js/main.ts
- Combat module fully converted to TypeScript (js/modules/combat.ts + 11 submodules in combat/)
- Renderer module converted to TypeScript (js/modules/renderer.ts)
- Controls module + entire subsystem converted to TypeScript (js/modules/controls.ts + 17 submodule files, d807f26)
- Spaceship entity factory converted to TypeScript (js/entities/spaceship.ts)
- Physics module converted to TypeScript (js/modules/physics.ts) - 752 lines, fully typed
- Stale physics.js deleted, imports updated
- Dormant ECS mining system deleted (js/systems/mining/ removed)
- Vite minification re-enabled (constructor.name breakage fixed)
- lightingConfig.js wired to lighting.js - values now match (sun: 3.0, ambient: 0.3)
- UI module converted to TypeScript (js/modules/ui.ts) - 25,620 bytes, stale ui.js deleted
- Environment module converted to TypeScript (js/modules/environment.ts)
- Stale renderer.js, controls.js, combatManager.js deleted, imports updated
- game.js and introSequence.js converted to TypeScript (42bd5b2)
- trail.js and spaceship.js (entity modules) converted to TypeScript
- Audio subsystem fully converted to TypeScript (7 files, 8b59957)
- Renderer subdirectory fully converted and committed (6 TS files, 5b661ee), stale JS deleted
- Pooling subsystem fully converted to TypeScript (14 files, 7e81a49), stale JS deleted
- Spaceship/ subsystem fully converted to TypeScript (7 files, 1833049)
- Game/ subsystem fully converted to TypeScript (5 files, 4ec0b63)
- Controls/ typecheck errors fully resolved (65 errors fixed, aaff4bb)
- Intro/ subsystem fully converted to TypeScript (6 files, 6d8f9fa)
- Environment/ subsystem fully converted to TypeScript (39 files, d945b03 + d9afbc0)
- Scattered JS files converted to TypeScript (7 files: lightingConfig, perfOverlay, laserMaterial, apiClient, memoryManager, mobileDetector, pathUtils - baf5249)
- Previous 15 typecheck errors fixed (diagnostics, gameInitializer, arrivalPhase - dedf603)
- UI top-level files converted to TypeScript (13 files, 33412a0) - includes hud/ (7 of 7), settings/ (7), stargate/ (14), starmap/ (4)
- 18 stale JS files deleted from stargate/ + starmap/ (44af1e0)
- UI blackjack/ converted to TypeScript (7 files, 5c12dfe)
- UI combat/ converted to TypeScript (7 files, 324c740)
- UI hud + settings converted to TypeScript (14 files, 1592476)
- All typecheck errors in ui/ resolved (9254892) - 0 errors remaining
- UI customSystem/ converted to TypeScript (7 files, 25ba2e6)
- Type declarations added for legacy ECS JS files (26 .d.ts files) - eliminates all @ts-ignore
- GLSL shaders evaluated for TSL conversion - ShaderPass requires raw GLSL, documented in shaders.ts
- Vite code splitting implemented (563abdd) - dynamic imports for UI, audio, intro, ECS
- Legacy ECS core framework converted to TypeScript (12 files in js/core/, 984eaac)
- Global state module singletons created (js/globals/ - debug.ts, messageBus.ts, objectPool.ts)
- bitECS MovementSystem ported (cde26c6) - Newtonian physics in bitECS

**Remaining Problems:**
- **Runtime unverified** - No browser available on NixOS hub. Game may not load. Needs testing on Windows PC or via GitHub Pages deployment. (GitHub Pages deployment task completed - verify at live URL)
- **CI/CD broken** - `.github/workflows/deploy.yml` triggers on `main` but default branch is `master`. Deploys never run. Also uses Node 16 (EOL), missing test/typecheck steps, outdated action versions (checkout@v3, setup-node@v3).
- **GLSL shaders** - 2 GLSL post-processing shaders in js/modules/renderer/shaders.ts remain GLSL (ShaderPass requires raw GLSL/WGSL, not TSL nodes). Converting to TSL requires switching to NodePostProcessing.
- **Global state** - ~213 non-API `window.*` usages across ~45 files (down from ~264). js/globals/ module created. physics.ts cleaned up (77fdb44), enemyAISystem cleaned up (4a8b9cc). Top remaining: src/main.ts (17), diagnostics.ts (16), starMap.ts (8), mobileHUD.ts (8).
- ~~**Dead legacy ECS code**~~ RESOLVED - 7 orphaned files + optimized/ + spatial/ deleted (d9d648f). Only 3 active files remain: messageBus.ts, world.ts, events.ts.
- **Inline styles** - ~965 `.style.` manipulations across 68 files. 8 CSS files extracted (46.3 KB). Top remaining: ui.ts (49), tradingView.ts (42), targetingUI.ts (39), combat/animations.ts (38), blackjack/gameView.ts (37), controls.ts (32), src/main.ts (29).
- **Test coverage thin** - Only 10 smoke tests for ECS world/components/physics. Combat, AI, mining, and render sync systems have zero test coverage.
- **Unused dependency** - `serve-static` in package.json is not imported anywhere.

## Target Stack (2026 Best Practices)

| Layer | Current | Target | Status |
|-------|---------|--------|--------|
| Language | TypeScript (~235 TS, 0 JS) | **TypeScript (strict)** | **COMPLETE** |
| Renderer | Three.js r180 WebGPU | **Three.js r180+ WebGPU** | Done |
| Shaders | GLSL + TSL laser (integrated) | **TSL (Three Shading Language)** | Started |
| ECS | bitECS (5 systems wired) | **bitECS** | **Active** |
| Physics | Custom Newtonian (bitECS) | **Keep custom** (cleaned up) | Done |
| Particles | CPU-based | **WebGPU Compute Shaders** | - |
| Build | Vite 6 | **Vite 6** | **COMPLETE** |
| UI | Inline styles + CSS (combat migrating) | **CSS/Tailwind** | **Active** |

### Why This Stack

**Three.js r171+ WebGPU**
- Production-ready since r171 - zero config, auto WebGL2 fallback
- [2-10x performance improvement](https://medium.com/@sudenurcevik/upgrading-performance-moving-from-webgl-to-webgpu-in-three-js-4356e84e4702) in draw-call-heavy scenes
- Safari 26 shipped WebGPU Sept 2025 - all browsers now supported
- Compute shaders for particles

**TSL (Three Shading Language)**
- Write shaders in JavaScript/TypeScript, not GLSL strings
- [Compiles to GLSL or WGSL automatically](https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs)
- Type-safe shader development
- Better IDE support, refactoring

**bitECS**
- [Ultra-high performance ECS](https://github.com/NateTheGreatt/bitECS)
- TypedArrays for data-oriented design
- Handles 100k+ entities at 60fps
- Excellent TypeScript support

**Custom Newtonian Physics (NOT Rapier)**
- Space games need floaty, inertia-based movement
- Rapier is for ground-based physics with gravity/friction
- Current physics is already correct approach:
  - Thrust → velocity accumulation
  - Objects keep moving (Newton's first law)
  - Small friction for playability
  - Simple sphere collision detection
- Just needs cleanup and TypeScript types, not replacement

**WebGPU Compute Shaders for Particles**
- [CPU particles hit bottleneck at ~50k](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- WebGPU compute shaders handle millions
- Use `instancedArray` for GPU-persistent buffers
- 150x improvement for particle systems

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Game Loop                      │
├─────────────────────────────────────────────────┤
│  Input → Physics System → AI → Combat → Mining  │
│                    ↓                             │
│         bitECS World (TypedArrays)              │
│                    ↓                             │
│            Render Sync System                   │
├─────────────────────────────────────────────────┤
│    Three.js WebGPU Scene (TSL shaders)          │
│         Compute Shaders (particles)             │
└─────────────────────────────────────────────────┘
```

**Principles:**
- Three.js is render-only - no game logic in meshes
- Custom Newtonian physics in a bitECS system
- bitECS owns all game state
- TSL for all custom shaders
- Compute shaders for particles, effects

## Component Design (Implemented)

Components are defined in `js/ecs/components.ts` using plain SoA (Structure-of-Arrays) pattern with pre-allocated TypedArrays (10k entities). bitECS v0.4.0 uses plain objects as components.

**24 components across 8 categories:**
- **Transform:** Position, Velocity, Rotation (quaternion), Scale
- **Render:** MeshRef (index into Three.js mesh array), Renderable (visibility flags)
- **Physics:** Rigidbody (mass, drag), Collider (sphere radius)
- **Combat:** Health (HP, shield, regen, resistance), Weapon (damage, fire rate, range)
- **Spaceship:** Thrust (6-axis input), Thruster (force, speed), ShipState (fuel, upgrades), Cargo (resources)
- **Mining:** MiningLaser (target, progress, rates per resource), Mineable (type, amount, difficulty)
- **AI:** EnemyAI (faction, detection, spiral movement), SeparationForce (flocking)
- **Tags/Utility:** Player, Enemy, Asteroid, Planet, Projectile, Lifetime, Trail

```typescript
// Access pattern (SoA):
Position.x[eid] = 100
Velocity.y[eid] = 5.5
Health.current[eid] = Health.max[eid]
```

## Migration Plan

### Phase 1: Upgrade Three.js + TypeScript - COMPLETE
1. ~~Upgrade to Three.js r180+~~ Done (r180, package.json updated)
2. ~~Add TypeScript with strict mode~~ Done (tsconfig.json, checkJs=false for JS files)
3. ~~Enable WebGPU renderer with WebGL2 fallback~~ Done (js/modules/renderer.js)
4. ~~Convert `.js` -> `.ts` incrementally~~ Done (247 TS files, only legacy ECS JS remains)

### Phase 2: bitECS Migration - COMPLETE
1. ~~Install bitECS~~ Done (v0.4.0, js/ecs/world.ts created)
2. ~~Define components~~ Done (24 components in js/ecs/components.ts)
3. ~~Create first systems~~ Done (physicsSystem.ts + renderSyncSystem.ts in js/ecs/systems/)
4. ~~Delete dormant ECS mining system~~ Done (js/systems/mining/ removed)
5. ~~Integrate bitECS systems into game loop~~ Done (ecsRunner.ts, called from js/main.ts)
6. ~~Delete stale physics.js~~ Done (imports updated to physics.ts)
7. ~~Convert combat module to TypeScript~~ Done (combat.ts + 11 submodules)
8. ~~Convert renderer.js and controls.js to TypeScript~~ Done
9. ~~Delete stale renderer.js, controls.js, combatManager.js, update imports~~ Done (d168865)
10. ~~Fix 12 typecheck errors in renderer.ts, controls.ts, gameInitializer.ts~~ Done (7f26904)
11. ~~Fix remaining 5 typecheck errors in gameInitializer.ts~~ Done.
12. ~~Convert controls subsystem to TypeScript~~ Done (17 files, d807f26)
13. ~~Convert renderer subdirectory to TypeScript~~ Done (6 files, 5b661ee), stale JS deleted
14. ~~Convert audio subsystem to TypeScript~~ Done (7 files, 8b59957)
15. ~~Fix 41 remaining typecheck errors (controls types, renderer WebGPU types)~~ Done (codex 1b3fa71c + pooling 7e81a49, down to 5 errors)
16. ~~Convert pooling subsystem to TypeScript~~ Done (14 files, 7e81a49)
17. ~~Convert spaceship/ subsystem to TypeScript~~ Done (7 files, 1833049)
18. ~~Convert game/ subsystem to TypeScript~~ Done (5 files, 4ec0b63)
19. ~~Convert intro/ subsystem to TypeScript~~ Done (6 files, 6d8f9fa)
20. ~~Convert environment/ subsystem to TypeScript~~ Done (39 files, d945b03 + d9afbc0)
21. ~~Convert scattered JS files to TypeScript~~ Done (7 files, baf5249)
22. ~~Convert ui/ top-level + hud + settings + stargate + starmap to TypeScript~~ Done (44 files, 33412a0)
23. ~~Fix 15 typecheck errors (diagnostics, gameInitializer, arrivalPhase)~~ Done (dedf603)
24. ~~Delete 18 stale JS files in stargate/ + starmap/~~ Done (44af1e0)
25. ~~Convert ui/components/blackjack to TypeScript~~ Done (7 files, 5c12dfe)
26. ~~Convert ui/components/combat to TypeScript~~ Done (7 files, 324c740)
27. ~~Convert ui/components/customSystem to TypeScript~~ Done (7 files, 25ba2e6)
28. ~~Convert ui/components/hud/displays.js to TypeScript~~ Done (1592476)
29. ~~Fix typecheck errors in newly converted ui/ files~~ Done (9254892) - 0 errors
30. ~~Add type declarations for legacy ECS~~ Done (26 .d.ts files, eliminated all @ts-ignore)
31. ~~Implement Vite code splitting~~ Done (563abdd, dynamic imports, manualChunks)
32. ~~Convert legacy ECS core framework to TypeScript~~ Done (12 files in js/core/, 984eaac)
33. ~~Port MovementSystem to bitECS~~ Done (cde26c6)
34. ~~Create global state module singletons~~ Done (js/globals/ - debug.ts, messageBus.ts, objectPool.ts, 984eaac)
35. ~~Create remaining bitECS systems (combat, AI, mining)~~ Done (ef235ca, 7454f66, 0070db4)
36. ~~Wire all bitECS systems into ecsRunner.ts~~ Done (e9d8f51)
37. ~~Delete old custom ECS (js/components/, js/systems/)~~ Done (13c30a0)

### Phase 3: Game Feel Overhaul - COMPLETE
1. **Controller tuning** - COMPLETE
   - ~~Response curves (not linear)~~ Done (407f1eb)
   - ~~Dead zones~~ Already implemented in gamepadHandler.ts
   - ~~Acceleration/deceleration curves~~ Done (407f1eb - unified applyResponseCurve)
   - ~~Gamepad rumble feedback~~ Done (388f075 - combat events trigger vibration)
2. **Combat system** - COMPLETE
   - ~~Screen flash on damage~~ Done (0da1d40 - HTML overlay with CSS transitions)
   - ~~Camera shake on impact~~ Done (1934ba2 - dual-frequency sine waves in Physics.applyShake)
   - ~~Weapon feel (recoil, sound sync)~~ Done (2b51030 - camera recoil via weapon.fire events)
   - ~~Damage numbers~~ Done (2b51030 - floating damage numbers with color-coding)
   - Enemy behavior variety - DEFERRED to Phase 4 (depends on state machine architecture)
3. **Camera system** - COMPLETE
   - ~~Smooth follow with lag~~ Done (978e50e - CAMERA_LAG damping)
   - ~~Shake on impact/explosion~~ Done (1934ba2 - event-driven via mainMessageBus)
   - ~~Zoom on boost~~ Done (32854ea - 1.3x zoom out with smooth lerp)
   - ~~Look-ahead based on velocity~~ Done (978e50e - CAMERA_LOOKAHEAD_SCALE)

### Phase 4: Visual Indicators - COMPLETE
1. **Lock-on system** - COMPLETE
   - ~~Target reticle with lead indicator~~ Done (ad26e0c - red crosshairs + green lead circle)
   - ~~Lock-on animation/sound~~ Done (keyboard Q, gamepad LB)
   - ~~Target info display (health, distance, type)~~ Done (health bar, distance display)
2. **Threat awareness** - COMPLETE
   - ~~Off-screen enemy arrows~~ Done (f711765 - color-coded by distance, max 6 indicators)
   - ~~Radar/minimap~~ Done (67ae92d - 2D radar with enemies, asteroids, stations)
   - Incoming missile warnings - DEFERRED (requires missile AI enhancements first)
3. **Movement feedback** - COMPLETE
   - ~~Velocity vector indicator~~ Done (306af3a - direction arrow, speed in u/s, color-coded)
   - ~~Speed lines at high velocity~~ Done (306af3a - radial lines above 10 u/s)
   - G-force screen effects - DEFERRED (nice-to-have, low priority)
4. **Enemy AI** - COMPLETE
   - ~~Enemy behavior variety (state machines)~~ Done (ae668e6 - IDLE/PATROL/CHASE/EVADE states)
   - ~~Difficulty-based spawning~~ Done via DifficultyConfig injection (4a8b9cc)

### Phase 5: HUD Overhaul - IN PROGRESS
1. ~~Install Tailwind CSS + PostCSS + autoprefixer, configure with Vite~~ Done (2b45218)
2. ~~Delete dead legacy ECS code (7 orphaned files + optimized/ + spatial/ in js/core/)~~ Done (d9d648f)
3. Migrate inline styles to CSS classes - ~965 remaining across 68 files
   - ~~combat/ CSS extracted to src/styles/combat.css (630 lines)~~ Done (ce67697)
   - ~~mobileHUD.ts CSS extracted to src/styles/mobile-hud.css (254 lines)~~ Done (ce67697)
   - ~~touch-controls.ts CSS extracted to src/styles/touch-controls.css~~ Done
   - ~~blackjack/ CSS extracted to src/styles/blackjack.css~~ Done
   - ~~gameOverScreen CSS extracted to src/styles/game-over.css~~ Done
   - ~~starmap/ CSS extracted to src/styles/starmap.css~~ Done
   - ~~settings/ CSS extracted to src/styles/settings.css~~ Done
   - ~~Missing @imports fixed in main.css~~ Done (d2990aa)
   - Priority: ui.ts (49), tradingView.ts (42), targetingUI.ts (39), combat/animations.ts (38), blackjack/gameView.ts (37), controls.ts (32)
4. Clean, minimal aesthetic
5. Contextual UI (only show what's relevant)
6. Mining progress with satisfying feedback
7. Resource collection popups

### Phase 6: TSL Shaders + Compute
1. Convert GLSL shaders to TSL
2. Move particles to compute shaders
3. Proper mining laser with glow
4. Engine trails, explosions, effects

### Phase 7: Polish & Cleanup
1. Fix lighting
2. Remove global state
3. Archive feature bloat (AI gen, portals)
4. Profile and optimize
5. Test on various hardware

## Specific Fixes

### Mining Laser (TSL)
```typescript
import { MeshBasicNodeMaterial, color, positionLocal, time, sin } from 'three/tsl'

// TSL-based glowing laser
const laserMaterial = new MeshBasicNodeMaterial()
laserMaterial.colorNode = color(0xff3030).mul(
  sin(time.mul(10)).mul(0.3).add(1)  // Pulsing glow
)
laserMaterial.transparent = true
laserMaterial.blending = THREE.AdditiveBlending
```

### Particle System (Compute Shader)
```typescript
import { instancedArray, compute } from 'three/tsl'

// GPU-persistent particle buffer
const particleBuffer = instancedArray(particleCount, 'vec4')

// Update particles on GPU
const updateParticles = compute(() => {
  const particle = particleBuffer.element(instanceIndex)
  // Physics in compute shader - runs on GPU
  particle.xyz.addAssign(particle.w.mul(deltaTime))
})
```

## Dependencies

Current (package.json):
```json
{
  "dependencies": {
    "bitecs": "^0.4.0",
    "three": "^0.180.0",
    "serve-static": "^2.2.0"
  },
  "devDependencies": {
    "@types/three": "^0.180.0",
    "autoprefixer": "^10.4.20",
    "gh-pages": "^6.3.0",
    "postcss": "^8.4.47",
    "rimraf": "^5.0.5",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.7.3",
    "vite": "^6.0.0"
  }
}
```

## File Structure

Current:
```
src/
├── main.ts              # Bootstrap, loading screen, asset preloading
├── global.d.ts          # Window interface extensions
├── three-imports.ts     # Centralized Three.js imports
└── styles/
    ├── main.css         # Tailwind directives + imports + theme vars
    └── combat.css       # Combat UI styles (extracted from inline)

js/
├── main.ts              # Game class, main loop (calls initECS/updateECS)
├── ecs/
│   ├── world.ts         # bitECS world module (createWorld, add/remove entity)
│   ├── components.ts    # 24 bitECS component definitions (SoA TypedArrays)
│   └── systems/
│       ├── index.ts             # System exports
│       ├── ecsRunner.ts         # initECS() + updateECS() orchestrator (ALL systems wired)
│       ├── physicsSystem.ts     # Newtonian physics (thrust, drag, integration, collision)
│       ├── renderSyncSystem.ts  # ECS-to-Three.js mesh bridge
│       ├── enemyAISystem.ts     # Enemy AI (detection, pursuit, separation, difficulty)
│       ├── combatSystem.ts      # Combat (projectile collision, damage, shields)
│       └── miningSystem.ts      # Mining (detection, progress, extraction)
├── entities/
│   └── spaceship.ts     # Spaceship entity factory (TypeScript)
├── main/                # Game initialization, lifecycle (all TS - 12 files)
├── modules/
│   ├── renderer.ts      # WebGPU/WebGL2 renderer (TS)
│   ├── controls.ts      # Input handling (TS)
│   ├── physics.ts       # Newtonian physics (TS, 752 lines)
│   ├── ui.ts            # UI module (TS)
│   ├── environment.ts   # Environment module (TS)
│   ├── combat.ts        # Combat orchestrator (TS)
│   ├── game.ts          # Game module (TS)
│   ├── introSequence.ts # Intro sequence (TS)
│   ├── trail.ts         # Trail module (TS)
│   ├── spaceship.ts     # Spaceship shim (TS, deprecated re-export)
│   ├── render/
│   │   └── laserMaterial.ts  # TSL laser material (pulsing glow)
│   ├── controls/
│   │   ├── miningSystem.ts   # Active mining orchestrator (TS)
│   │   ├── mining/           # TypeScript mining modules (5 files)
│   │   ├── docking/          # Docking subsystem (all TS - 3 files)
│   │   ├── touch/            # Touch controls (all TS - 7 files)
│   │   └── ...               # gamepadHandler.ts, targetingSystem.ts, inputHandler.ts, touchControls.ts
│   ├── combat/          # Combat submodules (all TS - 6 files + effects/ 4 files)
│   ├── audio/           # 7 TS files (fully converted, 8b59957)
│   ├── pooling/         # 14 TS files (fully converted, 7e81a49)
│   ├── spaceship/       # 7 TS files (fully converted, 1833049)
│   ├── game/            # 5 TS files (fully converted, 4ec0b63)
│   ├── renderer/        # 6 TS files (fully converted, 5b661ee)
│   ├── environment/     # 39 TS files (fully converted, d945b03 + d9afbc0)
│   ├── ui/              # All TS (65+ files, fully converted)
│   └── intro/           # 6 TS files (fully converted, 6d8f9fa)
├── globals/             # Module-level singletons (debug.ts, messageBus.ts, objectPool.ts)
├── core/                # Core framework (3 active files: messageBus.ts, world.ts, events.ts)
└── config/
    └── lightingConfig.ts # Lighting config (wired to lighting.js, values in sync)
```

Target:
```
src/
├── main.ts
├── game/
│   ├── world.ts          # bitECS world
│   ├── components/       # bitECS components
│   ├── systems/          # bitECS systems
│   └── queries.ts
├── render/
│   ├── scene.ts          # WebGPU renderer
│   ├── sync.ts           # ECS → Three.js
│   ├── shaders/          # TSL shaders
│   └── compute/          # Compute shaders
├── ui/
│   ├── hud.ts
│   ├── stargate.ts
│   └── styles.css
└── utils/
```

## Planet Textures

Generate more with pixel-forge using nano-banana:
```
Seamless spherical planet texture, [TYPE].
Equirectangular projection, tileable horizontally.
[SURFACE DETAILS].
2K resolution, photorealistic.
Solid black background.
```

Types needed: lava, ocean, toxic, crystal, dead, jungle

## Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run typecheck  # TypeScript check
```

## Quality Bar

After overhaul:
- **Locked 60 FPS** on WebGPU, graceful WebGL2 fallback
- **Type safe** - TypeScript strict, no `any`
- **Good game feel** - Responsive controls, satisfying feedback
- **Modern architecture** - bitECS + TSL + WebGPU
- **GPU particles** - Millions of particles via compute shaders
- **Clean HUD** - Minimal, informative, contextual
- **No dead code** - No globals, CSS classes, clean imports

## Known Pitfalls (From Failed Tasks)

- **bitECS install tasks timeout.** Two attempts failed at 30min. The scope was too large (install + components + systems + queries + verification). Break into smaller pieces: install only, then components, then systems. Third attempt (install-only) succeeded.
- **TypeScript conversion of large modules fails.** The spaceship module conversion (7+ files) was too ambitious. Convert one file at a time, verify build after each.
- **Combat conversion timed out on first attempt.** gemini/flash timed out at 15min. Succeeded on retry (combat.ts + 11 submodules). Keep tasks focused - one module at a time.
- **bitECS game loop integration timed out.** First attempt (claude/sonnet) timed out at 30min. Retry succeeded. The ecsRunner.ts pattern worked well.
- ~~**Mining consolidation is blocked on bitECS game loop integration.**~~ RESOLVED - bitECS systems now run each frame via ecsRunner.ts.
- ~~**Dormant mining delete task failed.**~~ RESOLVED - js/systems/mining/ deleted successfully on retry.
- ~~**TSL laser integration failed.**~~ RESOLVED - CSS laser replaced with 3D cylinder mesh using TSL material in js/modules/controls/mining/laserControl.ts.
- ~~**51 @ts-ignore suppressions.**~~ RESOLVED - All eliminated via .d.ts type declarations for legacy ECS.
- ~~**Controls conversion landed with 65 typecheck errors.**~~ RESOLVED - codex task 1b3fa71c fixed all docking type issues (aaff4bb).
- ~~**Renderer/ uncommitted TS files.**~~ RESOLVED - Fixed typecheck errors, committed TS files, deleted stale JS (5b661ee).
- ~~**Audio "done" task was a no-op.**~~ RESOLVED - Retried with gemini, fully converted (8b59957).
- ~~**Pooling "done" task (9eebf151) produced no commit.**~~ RESOLVED - Retried with codex, fully converted (14 files, 7e81a49).
- ~~**Intro "done" task (4546b3a8) by cline was a no-op.**~~ RESOLVED - Retried with gemini/flash (6d8f9fa).
- **cursor/cline "done" tasks may not actually convert.** e569f774 (cursor, customSystem+stargate+starmap) was marked done but customSystem has zero TS files. e56d6b84 (cline, combat+blackjack) also marked done but no TS files exist. Always verify actual file state.
- ~~**lightingConfig.js is drifted.**~~ RESOLVED - Config wired to lighting.js, values in sync (sun: 3.0, ambient: 0.3).
- ~~**Stale physics.js coexists with physics.ts.**~~ RESOLVED - physics.js deleted, imports updated.
- ~~**Stale renderer.js and controls.js coexist with .ts versions.**~~ RESOLVED - Stale .js files deleted, imports updated (d168865).
- ~~**12 typecheck errors after TS conversion.**~~ RESOLVED - Fixed in 7f26904.
- ~~**5 typecheck errors in gameInitializer.ts.**~~ RESOLVED - UI type mismatch fixed.
- **codex/gpt-5.2-codex-fast failed on stale file deletion.** The fast model didn't produce usable output for the delete-stale-files task. Use a more capable model for file deletion + import rewiring tasks.
- **Cursor agents may not commit.** cursor/composer-1 completed tasks but sometimes no commit was found (renderer/ conversion is latest example). Add explicit commit instructions to cursor task prompts, or avoid cursor for tasks requiring commits.
- **CI/CD workflow targets wrong branch.** deploy.yml triggers on `main` but default branch is `master`. Deploys have never run automatically. Also uses Node 16 (EOL), checkout@v3 (outdated), and has no test/typecheck gate.
- **CSS migration agents forget @import.** 4 CSS files were silently not loaded until d2990aa added the missing `@import` statements to main.css. Always include explicit instructions to update main.css when creating CSS migration tasks.

## Resources

- [Three.js WebGPU Docs](https://threejs.org/docs/pages/WebGPU.html)
- [TSL Documentation](https://threejs.org/docs/pages/TSL.html)
- [TSL Tutorial (Jan 2026)](https://arie-m-prasetyo.medium.com/introduction-to-tsl-0e1fda1beffe)
- [bitECS GitHub](https://github.com/NateTheGreatt/bitECS)
- [WebGPU Compute Shaders Guide](https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders)
- [100 Three.js Best Practices 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Game Feel - Juice It or Lose It](https://www.youtube.com/watch?v=Fy0aCDmgnxg) (classic GDC talk)
