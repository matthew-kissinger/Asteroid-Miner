# Asteroid Miner

3D space mining game. Full overhaul to modern 2026 stack.

## Vision

A polished space mining game running on WebGPU at locked 60fps. Clean architecture, modern tooling, production quality.

## Current State: Phase 1 Complete, Phase 2 In Progress

Phase 1 is done. Phase 2 is progressing - bitECS installed, components defined, spaceship factory and mining subsystem converted to TypeScript, lighting config wired up.

**Completed:**
- TypeScript with strict mode (tsconfig.json configured, typecheck passes)
- WebGPU renderer with automatic WebGL2 fallback (js/modules/renderer.js)
- Directional sun lighting fixed
- TSL laser material created and integrated (js/modules/render/laserMaterial.js)
- Entry points converted to TypeScript (src/main.ts, js/main.ts)
- Mining subsystem converted to TypeScript (5 modules in js/modules/controls/mining/)
- CSS mining laser replaced with 3D cylinder mesh using TSL material (js/modules/controls/mining/laserControl.ts)
- bitECS installed (v0.4.0) and world module created (js/ecs/world.ts)
- bitECS components defined (24 components in js/ecs/components.ts) - Transform, Render, Physics, Combat, Spaceship, Mining, AI, Tags, Utility
- Spaceship entity factory converted to TypeScript (js/entities/spaceship.ts)
- Vite minification re-enabled (constructor.name breakage fixed)
- lightingConfig.js wired to lighting.js - values now match (sun: 3.0, ambient: 0.3)

**Remaining Problems:**
- **Partial TypeScript** - 12 TS files done, but 269 JS files remain. js/main.ts has 16 @ts-ignore suppressions (imports from untyped JS modules).
- **bitECS components defined but no systems** - js/ecs/components.ts has 24 components but no systems, queries, or game loop integration exist. Nothing imports the world or components modules.
- **Custom ECS still active** - Legacy ECS framework in js/core/ still runs the game. bitECS migration requires creating systems before switchover.
- **GLSL shaders** - 2 GLSL post-processing shaders in js/modules/renderer/shaders.js (volumetric light + claude rays). Pending TSL conversion task exists (ccc67db9).
- **Global state** - ~922 `window.*` usages across 165 files
- **Dormant ECS mining system** - js/systems/mining/ still has a fully implemented but never-integrated ECS mining system. Delete task failed. Active system is the TypeScript version in js/modules/controls/mining/.
- **Physics still JavaScript** - js/modules/physics.js (27KB) remains unconverted despite a completed task claiming otherwise. Needs actual TypeScript conversion.

## Target Stack (2026 Best Practices)

| Layer | Current | Target | Status |
|-------|---------|--------|--------|
| Language | TypeScript (partial) | **TypeScript (strict)** | In Progress |
| Renderer | Three.js r180 WebGPU | **Three.js r180+ WebGPU** | Done |
| Shaders | GLSL + TSL laser (integrated) | **TSL (Three Shading Language)** | Started |
| ECS | Custom + bitECS (components defined) | **bitECS** | Started |
| Physics | Custom Newtonian | **Keep custom** (cleaned up) | - |
| Particles | CPU-based | **WebGPU Compute Shaders** | - |
| Build | Vite 5 | Vite 6 | - |
| UI | Inline styles | **CSS/Tailwind** | - |

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
4. Convert `.js` -> `.ts` incrementally - In progress (12 TS files done, 269 JS files remain)

### Phase 2: bitECS Migration - IN PROGRESS
1. ~~Install bitECS~~ Done (v0.4.0, js/ecs/world.ts created)
2. ~~Define components~~ Done (24 components in js/ecs/components.ts)
3. Create systems (physics, combat, AI, mining) - Next up
4. Delete old custom ECS
5. Delete dormant ECS mining system (js/systems/mining/)

### Phase 3: Game Feel Overhaul
1. **Controller tuning**
   - Response curves (not linear)
   - Dead zones
   - Acceleration/deceleration curves
   - Gamepad rumble feedback
2. **Combat system**
   - Better hit feedback (screen shake, flash)
   - Weapon feel (recoil, sound sync)
   - Enemy behavior variety
   - Damage numbers or indicators
3. **Camera system**
   - Smooth follow with lag
   - Shake on impact/explosion
   - Zoom on boost
   - Look-ahead based on velocity

### Phase 4: Visual Indicators
1. **Lock-on system**
   - Target reticle with lead indicator
   - Lock-on animation/sound
   - Target info display (health, distance, type)
2. **Threat awareness**
   - Off-screen enemy arrows
   - Incoming missile warnings
   - Radar/minimap
3. **Movement feedback**
   - Velocity vector indicator
   - Speed lines at high velocity
   - G-force screen effects

### Phase 5: HUD Overhaul
1. Modern design (CSS/Tailwind, not inline)
2. Clean, minimal aesthetic
3. Contextual UI (only show what's relevant)
4. Mining progress with satisfying feedback
5. Resource collection popups

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
    "gh-pages": "^6.3.0",
    "rimraf": "^5.0.5",
    "typescript": "^5.7.3",
    "vite": "^5.0.0"
  }
}
```

Target additions:
```json
{
  "devDependencies": {
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
└── three-imports.ts     # Centralized Three.js imports

js/
├── main.ts              # Game class, main loop
├── ecs/
│   ├── world.ts         # bitECS world module (createWorld, add/remove entity)
│   └── components.ts    # 24 bitECS component definitions (SoA TypedArrays)
├── entities/
│   └── spaceship.ts     # Spaceship entity factory (TypeScript, uses legacy components)
├── main/                # Game initialization, lifecycle
├── modules/
│   ├── renderer.js      # WebGPU/WebGL2 renderer
│   ├── render/
│   │   └── laserMaterial.js  # TSL laser material (pulsing glow)
│   ├── controls/
│   │   ├── miningSystem.js   # Active mining orchestrator
│   │   └── mining/           # TypeScript mining modules
│   │       ├── laserControl.ts       # 3D cylinder laser with TSL material
│   │       ├── resourceExtraction.ts # Resource calculation
│   │       ├── targetValidation.ts   # Range/target checks
│   │       ├── uiUpdates.ts          # Mining progress UI
│   │       └── visualEffects.ts      # Particle effects
│   ├── physics.js       # Newtonian physics
│   ├── combat.js        # Combat system
│   ├── controls.js      # Input handling
│   └── ...              # ~15 more module directories
├── systems/             # Legacy ECS systems (dormant)
│   └── mining/          # Dormant ECS mining system (never integrated)
├── components/          # Legacy components
└── config/
    └── lightingConfig.js # Lighting config (wired to lighting.js, values in sync)
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
- **Mining consolidation is blocked on bitECS systems.** Components are defined but no systems exist yet. Cannot consolidate the dual mining system until bitECS systems are created.
- **Dormant mining delete task failed.** js/systems/mining/ still exists. The cline agent failed to complete this task. Needs a retry with a simpler, more targeted approach.
- ~~**TSL laser integration failed.**~~ RESOLVED - CSS laser replaced with 3D cylinder mesh using TSL material in js/modules/controls/mining/laserControl.ts.
- **js/main.ts has 16 @ts-ignore.** These are imports from JS files that lack type declarations. Will resolve as modules are converted to TS.
- ~~**lightingConfig.js is drifted.**~~ RESOLVED - Config wired to lighting.js, values in sync (sun: 3.0, ambient: 0.3).
- **Physics TypeScript conversion was falsely marked done.** js/modules/physics.js (27KB) is still JavaScript. Task needs to be re-done.

## Resources

- [Three.js WebGPU Docs](https://threejs.org/docs/pages/WebGPU.html)
- [TSL Documentation](https://threejs.org/docs/pages/TSL.html)
- [TSL Tutorial (Jan 2026)](https://arie-m-prasetyo.medium.com/introduction-to-tsl-0e1fda1beffe)
- [bitECS GitHub](https://github.com/NateTheGreatt/bitECS)
- [WebGPU Compute Shaders Guide](https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders)
- [100 Three.js Best Practices 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Game Feel - Juice It or Lose It](https://www.youtube.com/watch?v=Fy0aCDmgnxg) (classic GDC talk)
