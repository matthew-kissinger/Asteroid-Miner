# Asteroid Miner

3D space mining game. Full overhaul to modern 2026 stack.

## Vision

A polished space mining game running on WebGPU at locked 60fps. Clean architecture, modern tooling, production quality.

## Current State: Phase 1 Complete

Phase 1 of the modernization is done. TypeScript and WebGPU renderer are working.

**Completed:**
- TypeScript with strict mode (tsconfig.json configured, typecheck passes)
- WebGPU renderer with automatic WebGL2 fallback (js/modules/renderer.js)
- Directional sun lighting fixed
- TSL laser material created (js/modules/render/laserMaterial.js)
- Entry points converted to TypeScript (src/main.ts, js/main.ts)

**Remaining Problems:**
- **Partial TypeScript** - Entry points done, but ~100 JS modules remain
- **Custom ECS mess** - Hybrid architecture, bitECS not yet integrated
- **GLSL shaders** - Most shaders still GLSL strings, TSL laser material ready but not integrated
- **Global state** - 686 `window.*` usages across 112 files
- **Dual mining system** - Two implementations need consolidation

## Target Stack (2026 Best Practices)

| Layer | Current | Target | Status |
|-------|---------|--------|--------|
| Language | TypeScript (partial) | **TypeScript (strict)** | In Progress |
| Renderer | Three.js r175 WebGPU | **Three.js r180+ WebGPU** | Done (needs upgrade) |
| Shaders | GLSL + TSL laser | **TSL (Three Shading Language)** | Started |
| ECS | Custom mess | **bitECS** | Pending |
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

## Component Design

```typescript
import { defineComponent, Types } from 'bitecs'

// Flat TypedArrays - cache friendly
const Position = defineComponent({
  x: Types.f32, y: Types.f32, z: Types.f32
})

const Velocity = defineComponent({
  x: Types.f32, y: Types.f32, z: Types.f32
})

const Rotation = defineComponent({
  x: Types.f32, y: Types.f32, z: Types.f32, w: Types.f32  // Quaternion
})

const MeshRef = defineComponent({
  id: Types.ui32  // Index into Three.js mesh array
})

const Health = defineComponent({
  current: Types.f32, max: Types.f32, shield: Types.f32
})

const Collider = defineComponent({
  radius: Types.f32  // Sphere collision radius
})

const MiningLaser = defineComponent({
  active: Types.ui8,
  targetEntity: Types.eid,
  progress: Types.f32
})

const Thrust = defineComponent({
  forward: Types.ui8,
  backward: Types.ui8,
  left: Types.ui8,
  right: Types.ui8,
  boost: Types.ui8
})
```

## Migration Plan

### Phase 1: Upgrade Three.js + TypeScript - COMPLETE
1. ~~Upgrade to Three.js r180+~~ Done (r175 with WebGPU)
2. ~~Add TypeScript with strict mode~~ Done (tsconfig.json)
3. ~~Enable WebGPU renderer with WebGL2 fallback~~ Done (js/modules/renderer.js)
4. Convert `.js` → `.ts` incrementally - In progress (entry points done)

### Phase 2: bitECS Migration
1. Install bitECS
2. Define components
3. Create systems (physics, combat, AI, mining)
4. Delete old custom ECS

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
    "three": "^0.175.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "vite": "^5.0.0",
    "@types/three": "^0.175.0"
  }
}
```

Target:
```json
{
  "dependencies": {
    "three": "^0.180.0",
    "bitecs": "^0.3.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "@types/three": "^0.180.0"
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
├── main/                # Game initialization, lifecycle
├── modules/
│   ├── renderer.js      # WebGPU/WebGL2 renderer
│   ├── render/
│   │   └── laserMaterial.js  # TSL laser material
│   ├── physics.js       # Newtonian physics
│   ├── combat.js        # Combat system
│   ├── controls.js      # Input handling
│   └── ...              # ~15 more module directories
├── systems/             # Legacy ECS systems
└── components/          # Legacy components
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

## Resources

- [Three.js WebGPU Docs](https://threejs.org/docs/pages/WebGPU.html)
- [TSL Documentation](https://threejs.org/docs/pages/TSL.html)
- [TSL Tutorial (Jan 2026)](https://arie-m-prasetyo.medium.com/introduction-to-tsl-0e1fda1beffe)
- [bitECS GitHub](https://github.com/NateTheGreatt/bitECS)
- [WebGPU Compute Shaders Guide](https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders)
- [100 Three.js Best Practices 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Game Feel - Juice It or Lose It](https://www.youtube.com/watch?v=Fy0aCDmgnxg) (classic GDC talk)
