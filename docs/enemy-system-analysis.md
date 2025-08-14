# Enemy System Analysis - Asteroid Miner Game

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Enemy Types and Behaviors](#enemy-types-and-behaviors)
3. [Combat System](#combat-system)
4. [Visual Appearance](#visual-appearance)
5. [Difficulty Scaling](#difficulty-scaling)
6. [Special Mechanics](#special-mechanics)
7. [System Architecture](#system-architecture)
8. [Code References](#code-references)

---

## Executive Summary

The Asteroid Miner game features a sophisticated enemy system built around **Spectral Drones** - the primary and currently only enemy type. The system employs an ECS (Entity Component System) architecture with advanced AI behaviors, dynamic difficulty scaling, visual effects, and comprehensive combat mechanics.

**Key Features:**
- Single enemy type with 4 visual variants
- Advanced AI with spiral movement patterns and separation behavior
- Pool-based object management for performance
- Raycast-based collision detection
- Progressive difficulty scaling with time-based and horde mode systems
- Rich visual effects including trails, explosions, and emissive materials

---

## Enemy Types and Behaviors

### Spectral Drones (Primary Enemy)

**File References:**
- `/js/systems/combat/spawner/factory/enemies/spectralDrone.js:1-227`
- `/js/components/combat/enemyAI.js:1-514`
- `/js/systems/combat/spawner/waves/definitions.js:19-33`

#### Characteristics
```javascript
// Base configuration from definitions.js:8-14
const BASE_ENEMY_CONFIG = {
    health: 20,
    damage: 15,
    speed: 700,
    spiralAmplitude: 150,
    spiralFrequency: 2.0
};
```

#### Behavioral Patterns

**1. Spiral Movement Pattern** (`enemyAI.js:421-513`)
- Circular spiral approach toward player
- Amplitude adjusts based on distance (tighter spirals when closer)
- Banking effects during turns for realistic flight
- Mathematical formula: `sin(time * frequency) * amplitude`

**2. Drone-like Movement Pattern** (`enemyAI.js:292-411`)
- Distance-based behavioral changes:
  - **Far (>1000 units)**: Rapid approach with zigzag variations
  - **Medium (400-1000 units)**: Circling with gradual approach
  - **Close (<400 units)**: Erratic evasive maneuvers

**3. Separation Behavior** (`enemy/behaviors/separationBehavior.js`)
- Prevents overlapping between multiple enemies
- Uses spatial hashing for performance
- Configurable influence factor (0-1 range)

#### AI Decision Making
```javascript
// Player detection hierarchy (enemyAI.js:69-142)
1. Direct world.playerEntity reference
2. Global window.game.combat.playerEntity
3. getEntitiesByTag('player')
4. entityManager.entitiesByTag map search
5. Brute force entity iteration
6. Fallback to spaceship mesh position
```

#### Attack Behavior
- **Kamikaze attacks** when within 75 units of player
- Applies 25 damage (configurable per difficulty)
- Creates explosion effects on impact
- Self-destructs after successful attack

### Spawning Mechanics

**File References:**
- `/js/systems/combat/spawner/enemySpawner.js`
- `/js/systems/combat/spawner/timing/scheduler.js`
- `/js/systems/combat/enemy/updates/spawnMonitoring.js`

#### Spawn System Features
- **Initial Delay**: 60-second delay before first enemy spawn
- **Spawn Points**: Generated around player at 3000+ unit distance
- **Pool Management**: Object pooling for performance optimization
- **Formation Support**: Single, Pair, Squad, Pack patterns
- **Monitoring**: Failsafe checks for spawn system health

```javascript
// Spawn intervals by difficulty (definitions.js:64-69)
const SPAWN_INTERVALS = {
    EASY: 5.0,      // 5 seconds
    NORMAL: 3.0,    // 3 seconds  
    HARD: 2.0,      // 2 seconds
    NIGHTMARE: 1.0  // 1 second
};
```

---

## Combat System

### Player Weapons

**File References:**
- `/js/modules/combat/combatLogic.js:1-325`
- `/js/systems/combat/combatSystem.js:1-496`
- `/js/modules/pooling/projectiles/types/bullet.js:1-279`

#### Weapon Types

**1. Particle Cannon (Primary & Only Active Weapon)**
- **Damage**: 20 points per hit (actual damage, not just visual)
- **Type**: Instant raycast/hitscan weapon
- **Range**: 5000 units maximum
- **Cooldown**: Configurable (prevents rapid fire)
- **Effect**: Dual plasma beams with explosion impact effects
- **Note**: Projectile system code has been removed as it was never used

**2. Projectile System** (REMOVED)
- Previously existed as unused infrastructure for physical projectiles
- Would have supported bullets, enemy projectiles, etc.
- Code has been removed from `combat.js` as it was never called
- Collision detection for enemy projectiles still exists in physics system but enemies don't fire them

#### Damage Mechanics

**Health Component System** (`healthComponent.js:98-193`)
```javascript
applyDamage(amount, type = 'projectile', source = null) {
    // Damage resistance calculation
    const resistedAmount = amount * (1 - this.damageResistance);
    
    // Shield-first damage model
    if (this.shield > 0) {
        // Shield absorbs damage first
    } else {
        // Direct health damage
    }
}
```

#### Collision Detection

**Raycast-based System** (`combatSystem.js:100-267`)
1. **Projectile Ray Setup**: Creates ray from projectile position with velocity direction
2. **Mesh Intersection**: Uses `raycaster.intersectObject(mesh, true)` for precise hits
3. **Hit Processing**: Applies damage and creates visual effects
4. **Cleanup**: Destroys projectiles and handles entity removal

### Enemy Damage to Player

- **Collision-based**: Enemies deal damage through kamikaze attacks
- **Shield System**: Player shields absorb damage first
- **Hull Damage**: Direct health damage when shields depleted
- **Game Over**: Triggered when hull reaches zero

---

## Visual Appearance

### Enemy Rendering

**File References:**
- `/js/systems/combat/spawner/factory/enemies/meshGeneration.js:1-354`
- `/js/systems/combat/spawner/waves/definitions.js:84-162`

#### Model System
- **Primary**: `enemy.glb` 3D model from `/public/assets/enemy.glb`
- **Fallback**: Procedural octahedron with wings if model fails to load

#### Visual Variants (4 types)

```javascript
// Visual variants (definitions.js:100-134)
const VISUAL_VARIANTS = {
    NORMAL: {
        emissiveIntensity: { min: 1.0, max: 1.5 },
        opacity: 1.0
    },
    DAMAGED: {
        emissiveIntensity: { base: 0.5, flicker: 0.3 },
        opacity: 0.85,
        colorMultiplier: 0.7
    },
    ELITE: {
        emissiveIntensity: { base: 2.0, pulse: 0.5 },
        haloEffect: true,
        additionalEffects: true
    },
    SHIELDED: {
        emissiveIntensity: 1.5,
        shimmerEffect: true,
        shieldEffect: true
    }
};
```

#### Color Palette
**10 distinct color schemes** (`definitions.js:84-95`):
- Blue/cyan, Purple/blue, Teal/green, Red/pink
- Orange/gold, Lime/green, Pink/magenta, Yellow
- Deep blue, Deep red

#### Special Effects

**1. Elite Enemies** (`meshGeneration.js:245-268`)
- Rotating halo ring effect
- Pulsing scale animation
- Enhanced metallic materials

**2. Shielded Enemies** (`meshGeneration.js:274-296`)
- Translucent sphere shield overlay
- Pulsing opacity and scale
- Shimmer color effects

**3. Damage States**
- Flickering emissive for damaged variants
- Reduced opacity and color saturation

### Combat Visual Effects

**File References:**
- `/js/modules/combat/effects/explosionEffects.js:1-253`
- `/js/systems/combat/combatSystem.js:330-458`

#### Explosion System
```javascript
// Explosion characteristics (explosionEffects.js:32-42)
const material = new THREE.MeshBasicMaterial({
    color: 0xff6600,        // Orange core
    emissive: 0xff3300,     // Red emissive
    emissiveIntensity: 2,
    blending: THREE.AdditiveBlending
});
```

#### Tracer Beams
**Multi-layer plasma effects** (`explosionEffects.js:107-176`):
1. **Core**: Hot yellow-white plasma (1.5 unit radius)
2. **Inner Glow**: Orange plasma (3 unit radius)
3. **Outer Glow**: Cyan/blue edge effect (5 unit radius)

#### Hit Effects
- Color-coded damage indicators (blue for shields, red for critical hits)
- Expanding sphere animations
- Object pooling for performance

---

## Difficulty Scaling

### Time-based Progression

**File References:**
- `/js/core/difficultyManager.js:1-122`
- `/js/systems/combat/enemy/state/difficultyScaling.js:1-97`

#### Difficulty Levels
```javascript
// Progressive thresholds (difficultyManager.js:19-25)
const DIFFICULTY_THRESHOLDS = [
    { level: 1, time: 0,   maxEnemies: 10, enemyHealth: 20,  spawnInterval: 3.0 },
    { level: 2, time: 120, maxEnemies: 15, enemyHealth: 30,  spawnInterval: 2.5 },
    { level: 3, time: 300, maxEnemies: 20, enemyHealth: 40,  spawnInterval: 2.0 },
    { level: 4, time: 600, maxEnemies: 25, enemyHealth: 60,  spawnInterval: 1.5 },
    { level: 5, time: 900, maxEnemies: 30, enemyHealth: 80,  spawnInterval: 1.0 }
];
```

### Horde Mode Scaling

**File References:**
- `/js/main/hordeMode.js:1-86`
- `/js/systems/combat/enemy/state/difficultyScaling.js:40-96`

#### Exponential Scaling
```javascript
// Horde mode scaling (difficultyScaling.js:53-62)
const minutesPassed = survivalTime / 60;

// Max enemies: exponential growth after 5 minutes
if (minutesPassed < 5) {
    maxEnemiesScale = baseMaxEnemies + (minutesPassed * 10);
} else {
    maxEnemiesScale = (baseMaxEnemies + 50) * Math.pow(1.2, minutesPassed - 5);
}
```

#### Scaling Parameters
- **Max Enemies**: Up to 300 simultaneous enemies
- **Health**: +50% per minute survived
- **Damage**: +30% per minute survived
- **Speed**: +20% per minute survived

---

## Special Mechanics

### Player Status Effects

**File References:**
- `/js/systems/combat/enemy/state/dockingManager.js`
- `/js/systems/combat/enemySystem.js:101-109`

#### Docking System Integration
- **Enemy Freeze**: All enemies freeze when player docks at stargate
- **AI Suspension**: Enemy AI updates paused during docking
- **Automatic Resume**: Enemies resume when player undocks

### Object Pooling

**File References:**
- `/js/systems/combat/enemyPoolManager.js`
- `/js/modules/pooling/ObjectPool.js`

#### Pool Management
- **Enemy Pool**: Reuses enemy entities to prevent garbage collection
- **Projectile Pools**: Separate pools for bullets, lasers, missiles, plasma
- **Effect Pools**: Explosion effects and hit indicators
- **Memory Management**: Automatic cleanup and validation

### Spatial Systems

#### Spatial Hashing
- **Separation Behavior**: Efficient neighbor finding for enemy separation
- **Collision Detection**: Optimized entity proximity calculations
- **Performance**: Reduces O(n²) to O(n) complexity for multi-entity operations

---

## System Architecture

### Entity Component System (ECS)

**Core Components:**
1. **TransformComponent**: Position, rotation, scale
2. **EnemyAIComponent**: Behavior, movement patterns, combat logic
3. **HealthComponent**: Health, shields, damage resistance
4. **MeshComponent**: Visual representation, materials
5. **RigidbodyComponent**: Physics, collision detection
6. **TrailComponent**: Visual trails (optional)

### System Dependencies

```
EnemySystem
├── EnemyPoolManager (object pooling)
├── EnemySpawner (spawn logic)
├── EnemyLifecycle (entity management)
├── SeparationBehavior (AI behavior)
├── DifficultyScaling (parameter adjustment)
├── DockingManager (player state integration)
└── SpawnMonitoring (health checks)
```

### Message Bus Events

**Enemy System Events:**
- `entity.destroyed` - Entity removal
- `entity.damaged` - Damage application
- `combat.hit` - Projectile impacts
- `vfx.explosion` - Visual effects
- `horde.activated` - Horde mode start

---

## Code References

### Core Enemy Files
- **Main System**: `/js/systems/combat/enemySystem.js`
- **AI Component**: `/js/components/combat/enemyAI.js`
- **Enemy Factory**: `/js/systems/combat/spawner/factory/enemyFactory.js`
- **Spectral Drone**: `/js/systems/combat/spawner/factory/enemies/spectralDrone.js`

### Combat System Files
- **Combat Logic**: `/js/modules/combat/combatLogic.js`
- **Combat System**: `/js/systems/combat/combatSystem.js`
- **Health Component**: `/js/components/combat/healthComponent.js`

### Visual System Files
- **Mesh Generation**: `/js/systems/combat/spawner/factory/enemies/meshGeneration.js`
- **Wave Definitions**: `/js/systems/combat/spawner/waves/definitions.js`
- **Explosion Effects**: `/js/modules/combat/effects/explosionEffects.js`

### Difficulty System Files
- **Difficulty Manager**: `/js/core/difficultyManager.js`
- **Difficulty Scaling**: `/js/systems/combat/enemy/state/difficultyScaling.js`
- **Horde Mode**: `/js/main/hordeMode.js`

### UI Display Files
- **Enemy Display**: `/js/modules/ui/components/combat/enemyDisplay.js`
- **Combat Display**: `/js/modules/ui/combatDisplay.js`

### Asset Files
- **Enemy Model**: `/public/assets/enemy.glb`
- **Audio Effects**: `/public/sounds/effects/boink.wav`, `/public/sounds/effects/explosion.wav`

---

## Performance Optimizations

1. **Object Pooling**: Prevents garbage collection spikes
2. **Spatial Hashing**: Efficient collision detection
3. **LOD System**: Distance-based detail reduction
4. **Batch Processing**: Group similar operations
5. **Memory Management**: Proper resource cleanup
6. **Instanced Rendering**: Multiple enemies with shared geometry

---

## Future Enhancement Possibilities

Based on the codebase structure, the system is designed to support:

1. **Additional Enemy Types**: Framework supports multiple factions and types
2. **Boss Enemies**: Special encounter system hooks present
3. **Enemy Weapons**: Projectile system supports enemy-fired projectiles
4. **Formation Flying**: Group behavior patterns partially implemented
5. **Environmental Hazards**: Effect system can support area damage
6. **Power-ups**: Upgrade system hooks for combat modifications

---

*Analysis completed on: 2025-08-14*  
*Codebase version: Latest commit 2e7b43a*