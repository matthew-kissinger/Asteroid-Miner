/**
 * bitECS Component Definitions
 *
 * Data-oriented component definitions using bitECS v0.4.0 API.
 * Components are Structure-of-Arrays (SoA) for cache locality.
 *
 * Design principles:
 * - SoA layout (separate arrays for each property) for cache locality
 * - TypedArrays for numeric data (Float32Array, Uint8Array, etc.)
 * - Components are pure data - logic goes in systems
 * - Keep components minimal - only the data systems need
 *
 * bitECS v0.4.0 uses plain objects/arrays as components. Access pattern:
 *   Position.x[eid] = 100
 *   Velocity.y[eid] = 5.5
 */

/**
 * Component definitions for registration with world.
 * These are the shape definitions - actual arrays are created by bitECS.
 */

// ============================================================================
// CORE TRANSFORM COMPONENTS
// ============================================================================

/**
 * Position in 3D space
 */
export const Position = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  z: new Float32Array(10000)
}

/**
 * Velocity vector
 */
export const Velocity = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  z: new Float32Array(10000)
}

/**
 * Angular velocity (rotation rate in radians/second)
 * Stored as Euler angles for simplicity
 */
export const AngularVelocity = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  z: new Float32Array(10000)
}

/**
 * Rotation as quaternion (most efficient for 3D rotation math)
 */
export const Rotation = {
  x: new Float32Array(10000),  // Quaternion x
  y: new Float32Array(10000),  // Quaternion y
  z: new Float32Array(10000),  // Quaternion z
  w: new Float32Array(10000)   // Quaternion w
}

/**
 * Scale (uniform or non-uniform)
 */
export const Scale = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  z: new Float32Array(10000)
}

// ============================================================================
// RENDER BRIDGE COMPONENTS
// ============================================================================

/**
 * Reference to Three.js mesh in render system
 * Uses index into a mesh array for cache-friendly lookup
 */
export const MeshRef = {
  meshIndex: new Uint32Array(10000)  // Index into Three.js mesh array
}

/**
 * Visual state flags
 */
export const Renderable = {
  visible: new Uint8Array(10000),      // 0 = hidden, 1 = visible
  castShadow: new Uint8Array(10000),   // 0 = no shadow, 1 = cast shadow
  receiveShadow: new Uint8Array(10000) // 0 = no receive, 1 = receive shadow
}

// ============================================================================
// PHYSICS COMPONENTS
// ============================================================================

/**
 * Rigidbody physics properties
 */
export const Rigidbody = {
  mass: new Float32Array(10000),
  drag: new Float32Array(10000),         // Linear drag (space friction)
  angularDrag: new Float32Array(10000),  // Angular damping
  isKinematic: new Uint8Array(10000),    // 0 = dynamic, 1 = kinematic (no physics)
  freezeRotation: new Uint8Array(10000)  // 0 = normal, 1 = freeze rotation
}

/**
 * Force accumulator (cleared each frame)
 */
export const Force = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  z: new Float32Array(10000)
}

/**
 * Torque accumulator (cleared each frame)
 */
export const Torque = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  z: new Float32Array(10000)
}

/**
 * Sphere collision detection
 */
export const Collider = {
  radius: new Float32Array(10000)        // Sphere collision radius
}

// ============================================================================
// HEALTH & COMBAT COMPONENTS
// ============================================================================

/**
 * Health and shield data
 */
export const Health = {
  current: new Float32Array(10000),      // Current health
  max: new Float32Array(10000),          // Maximum health
  shield: new Float32Array(10000),       // Current shield
  maxShield: new Float32Array(10000),    // Maximum shield
  shieldRegenRate: new Float32Array(10000),  // Shield points per second
  shieldRegenDelay: new Float32Array(10000), // Seconds after damage before regen
  timeSinceLastDamage: new Float32Array(10000),
  damageResistance: new Float32Array(10000)  // 0-1 damage reduction percentage
}

/**
 * Weapon properties
 */
export const Weapon = {
  damage: new Float32Array(10000),       // Damage per hit
  fireRate: new Float32Array(10000),     // Shots per second
  range: new Float32Array(10000),        // Maximum range
  timeSinceLastShot: new Float32Array(10000),
  level: new Uint8Array(10000)           // Weapon upgrade level
}

// ============================================================================
// SPACESHIP COMPONENTS
// ============================================================================

/**
 * Thrust control state (bitfield for input)
 */
export const Thrust = {
  forward: new Uint8Array(10000),      // 0 or 1
  backward: new Uint8Array(10000),
  left: new Uint8Array(10000),
  right: new Uint8Array(10000),
  up: new Uint8Array(10000),
  down: new Uint8Array(10000),
  boost: new Uint8Array(10000)
}

/**
 * Thruster properties
 */
export const Thruster = {
  thrustForce: new Float32Array(10000),
  maxVelocity: new Float32Array(10000),
  boostMultiplier: new Float32Array(10000),
  rotationSpeed: new Float32Array(10000),
  fuelConsumptionRate: new Float32Array(10000),
  boostConsumptionMultiplier: new Float32Array(10000)
}

/**
 * Ship state data
 */
export const ShipState = {
  fuel: new Float32Array(10000),
  maxFuel: new Float32Array(10000),
  credits: new Uint32Array(10000),
  isDocked: new Uint8Array(10000),
  isDestroyed: new Uint8Array(10000),
  isInvulnerable: new Uint8Array(10000),
  engineLevel: new Uint8Array(10000),
  fuelTankLevel: new Uint8Array(10000),
  hullLevel: new Uint8Array(10000),
  shieldLevel: new Uint8Array(10000),
  miningLevel: new Uint8Array(10000),
  scannerLevel: new Uint8Array(10000),
  weaponLevel: new Uint8Array(10000)
}

/**
 * Cargo/inventory data
 */
export const Cargo = {
  maxCapacity: new Float32Array(10000),
  usedCapacity: new Float32Array(10000),
  iron: new Uint32Array(10000),        // Iron units
  gold: new Uint32Array(10000),        // Gold units
  platinum: new Uint32Array(10000)     // Platinum units
}

// ============================================================================
// MINING COMPONENTS
// ============================================================================

/**
 * Mining laser data
 */
export const MiningLaser = {
  active: new Uint8Array(10000),       // 0 = inactive, 1 = active
  targetEntity: new Uint32Array(10000), // Entity ID of target (bitECS entity ID)
  progress: new Float32Array(10000),     // Mining progress (0-1)
  power: new Float32Array(10000),        // Mining power multiplier
  range: new Float32Array(10000),        // Maximum mining range
  ironRate: new Float32Array(10000),     // Mining rate for iron (progress per second)
  goldRate: new Float32Array(10000),     // Mining rate for gold
  platinumRate: new Float32Array(10000)  // Mining rate for platinum
}

/**
 * Mineable resource data (for asteroids)
 */
export const Mineable = {
  resourceType: new Uint8Array(10000), // 0 = iron, 1 = gold, 2 = platinum
  totalAmount: new Float32Array(10000),  // Total resource amount
  remainingAmount: new Float32Array(10000), // Remaining resource amount
  miningDifficulty: new Float32Array(10000), // Difficulty multiplier
  beingMined: new Uint8Array(10000),   // 0 = not being mined, 1 = being mined
  startingScale: new Float32Array(10000), // Initial scale for depletion visuals
  minScale: new Float32Array(10000)      // Minimum scale before destruction
}

// ============================================================================
// AI COMPONENTS
// ============================================================================

/**
 * Enemy AI data
 */
export const EnemyAI = {
  faction: new Uint8Array(10000),      // 0 = spectrals, 1 = other (expand as needed)
  aiType: new Uint8Array(10000),       // 0 = drone, 1 = other
  subtype: new Uint8Array(10000),      // 0 = standard, 1 = heavy, 2 = swift
  state: new Uint8Array(10000),        // 0 = idle, 1 = patrol, 2 = chase, 3 = evade
  detectionRange: new Float32Array(10000),
  damage: new Float32Array(10000),
  speed: new Float32Array(10000),
  playerFound: new Uint8Array(10000),  // 0 = not found, 1 = found
  spawnX: new Float32Array(10000),
  spawnY: new Float32Array(10000),
  spawnZ: new Float32Array(10000),
  stateTimer: new Float32Array(10000),
  spiralAmplitude: new Float32Array(10000),
  spiralFrequency: new Float32Array(10000),
  spiralPhase: new Float32Array(10000),
  timeAlive: new Float32Array(10000),
  isDroneLike: new Uint8Array(10000),
  separationInfluence: new Float32Array(10000)
}

/**
 * Separation force for flocking/avoidance (computed by systems)
 */
export const SeparationForce = {
  x: new Float32Array(10000),
  y: new Float32Array(10000),
  z: new Float32Array(10000)
}

// ============================================================================
// TAG COMPONENTS (minimal data, mainly for queries)
// ============================================================================

/**
 * Player entity marker
 */
export const Player = {
  tag: new Uint8Array(10000)  // Always 1 if component exists
}

/**
 * Enemy entity marker
 */
export const Enemy = {
  tag: new Uint8Array(10000)
}

/**
 * Asteroid entity marker
 */
export const Asteroid = {
  tag: new Uint8Array(10000)
}

/**
 * Planet entity marker
 */
export const Planet = {
  tag: new Uint8Array(10000)
}

/**
 * Projectile entity marker
 */
export const Projectile = {
  tag: new Uint8Array(10000),
  sourceEntity: new Uint32Array(10000)  // Who fired this
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Lifetime tracking (for particles, projectiles, etc.)
 */
export const Lifetime = {
  age: new Float32Array(10000),          // Time alive in seconds
  maxAge: new Float32Array(10000)        // When to destroy (-1 = infinite)
}

/**
 * Trail effect data (for thruster trails, etc.)
 */
export const Trail = {
  enabled: new Uint8Array(10000),
  particleSystemIndex: new Uint32Array(10000)  // Index into particle system array
}

// ============================================================================
// COMPONENT REGISTRATION
// ============================================================================

/**
 * All game components for easy registration with world
 */
export const AllComponents = {
  // Transform
  Position,
  Velocity,
  AngularVelocity,
  Rotation,
  Scale,

  // Render
  MeshRef,
  Renderable,

  // Physics
  Rigidbody,
  Force,
  Torque,
  Collider,

  // Combat
  Health,
  Weapon,

  // Spaceship
  Thrust,
  Thruster,
  ShipState,
  Cargo,

  // Mining
  MiningLaser,
  Mineable,

  // AI
  EnemyAI,
  SeparationForce,

  // Tags
  Player,
  Enemy,
  Asteroid,
  Planet,
  Projectile,

  // Utility
  Lifetime,
  Trail
}

// ============================================================================
// COMPONENT SUMMARY
// ============================================================================

/**
 * Example entity compositions:
 *
 * Player Spaceship:
 * - Position, Velocity, Rotation, Scale
 * - MeshRef, Renderable
 * - Rigidbody, Collider
 * - Health, Weapon
 * - Thrust, Thruster, ShipState, Cargo
 * - MiningLaser
 * - Player (tag)
 * - Trail
 *
 * Enemy Drone:
 * - Position, Velocity, Rotation, Scale
 * - MeshRef, Renderable
 * - Rigidbody, Collider
 * - Health, Weapon
 * - EnemyAI, SeparationForce
 * - Enemy (tag)
 * - Lifetime
 *
 * Asteroid:
 * - Position, Velocity, Rotation, Scale
 * - MeshRef, Renderable
 * - Collider
 * - Mineable
 * - Asteroid (tag)
 *
 * Projectile:
 * - Position, Velocity, Rotation
 * - MeshRef
 * - Collider
 * - Projectile (tag)
 * - Lifetime
 */
