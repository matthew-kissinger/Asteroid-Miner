/**
 * Enemy AI System (bitECS)
 *
 * Ports enemy AI behavior from legacy ECS to bitECS.
 * Handles:
 * - Enemy detection of player (range check)
 * - Pursuit behavior (move toward player)
 * - Spiral movement patterns (sinusoidal offset)
 * - Separation behavior (flocking avoidance)
 * - Difficulty scaling (stats increase over time)
 *
 * Based on js/systems/combat/enemySystem.js and js/components/combat/enemyAI.js
 */

import {
  Position,
  Velocity,
  Rotation,
  EnemyAI,
  SeparationForce,
  Health,
  Lifetime,
  Collider,
} from '../components'

// Constants from legacy system
const SEPARATION_FORCE_MAGNITUDE = 150
const SEPARATION_THRESHOLD_MULTIPLIER = 2.5
const COLLISION_DISTANCE = 75 // Kamikaze attack distance

/**
 * Configuration for difficulty scaling
 */
export interface DifficultyConfig {
  healthMultiplier: number
  damageMultiplier: number
  speedMultiplier: number
  isHordeMode: boolean
  hordeSurvivalTime: number // in seconds
}

const DEFAULT_DIFFICULTY_CONFIG: DifficultyConfig = {
  healthMultiplier: 1,
  damageMultiplier: 1,
  speedMultiplier: 1,
  isHordeMode: false,
  hordeSurvivalTime: 0,
}

// State constants
const STATE_IDLE = 0
const STATE_PATROL = 1
const STATE_CHASE = 2
const STATE_EVADE = 3

/**
 * Enemy Detection System
 *
 * Checks if enemies detect the player based on distance.
 * Sets EnemyAI.playerFound flag when player is within detection range.
 * Handles state transitions: IDLE -> PATROL, PATROL -> CHASE.
 *
 * @param enemies - Array of enemy entity IDs
 * @param playerEid - Player entity ID (or -1 if no player)
 */
export function enemyDetectionSystem(
  enemies: number[],
  playerEid: number
): void {
  for (const eid of enemies) {
    // Handle IDLE -> PATROL transition
    if (EnemyAI.state[eid] === STATE_IDLE) {
      EnemyAI.state[eid] = STATE_PATROL
      EnemyAI.spawnX[eid] = Position.x[eid]
      EnemyAI.spawnY[eid] = Position.y[eid]
      EnemyAI.spawnZ[eid] = Position.z[eid]
    }
  }

  if (playerEid === -1) return

  // Get player position
  const playerX = Position.x[playerEid]
  const playerY = Position.y[playerEid]
  const playerZ = Position.z[playerEid]

  for (const eid of enemies) {
    // Skip if already in CHASE or EVADE
    if (EnemyAI.state[eid] === STATE_CHASE || EnemyAI.state[eid] === STATE_EVADE) continue

    // Calculate distance to player
    const dx = Position.x[eid] - playerX
    const dy = Position.y[eid] - playerY
    const dz = Position.z[eid] - playerZ
    const distSq = dx * dx + dy * dy + dz * dz

    const detectionRangeSq = EnemyAI.detectionRange[eid] ** 2

    if (distSq < detectionRangeSq) {
      EnemyAI.playerFound[eid] = 1
      EnemyAI.state[eid] = STATE_CHASE
    }
  }
}

/**
 * Enemy Pursuit System
 *
 * Handles movement for enemies in CHASE state.
 * Transitions to EVADE if health is low.
 *
 * @param enemies - Array of enemy entity IDs
 * @param playerEid - Player entity ID (or -1 if no player)
 * @param dt - Delta time in seconds
 */
export function enemyPursuitSystem(
  enemies: number[],
  playerEid: number,
  dt: number
): void {
  for (const eid of enemies) {
    if (EnemyAI.state[eid] !== STATE_CHASE) continue

    // Transition to EVADE if health is low (below 25%)
    if (Health.max[eid] > 0 && Health.current[eid] < 0.25 * Health.max[eid]) {
      EnemyAI.state[eid] = STATE_EVADE
      EnemyAI.stateTimer[eid] = 0
      continue
    }

    if (playerEid === -1) {
      EnemyAI.state[eid] = STATE_PATROL
      continue
    }

    // Update time alive
    EnemyAI.timeAlive[eid] += dt

    applyChaseMovement(eid, playerEid, dt)
  }
}

/**
 * Enemy Patrol System
 *
 * Handles movement for enemies in PATROL state.
 *
 * @param enemies - Array of enemy entity IDs
 * @param dt - Delta time in seconds
 */
export function enemyPatrolSystem(
  enemies: number[],
  dt: number
): void {
  for (const eid of enemies) {
    if (EnemyAI.state[eid] !== STATE_PATROL) continue

    const spawnX = EnemyAI.spawnX[eid]
    const spawnY = EnemyAI.spawnY[eid]
    const spawnZ = EnemyAI.spawnZ[eid]
    const timeAlive = EnemyAI.timeAlive[eid]
    const speed = EnemyAI.speed[eid] * 0.5 // Patrol at 50% speed

    // Circular patrol pattern
    const radius = 200
    const angle = timeAlive * 0.5 // Rotation speed
    
    const targetX = spawnX + Math.cos(angle) * radius
    const targetY = spawnY
    const targetZ = spawnZ + Math.sin(angle) * radius

    const dx = targetX - Position.x[eid]
    const dy = targetY - Position.y[eid]
    const dz = targetZ - Position.z[eid]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (dist > 1) {
      const dirX = dx / dist
      const dirY = dy / dist
      const dirZ = dz / dist

      Velocity.x[eid] = dirX * speed
      Velocity.y[eid] = dirY * speed
      Velocity.z[eid] = dirZ * speed

      // Face movement direction
      updateRotationTowardsPlayer(eid, dirX, dirY, dirZ)
    } else {
      Velocity.x[eid] = 0
      Velocity.y[eid] = 0
      Velocity.z[eid] = 0
    }

    // Apply separation force influence
    applySeparationInfluence(eid, speed, dt)
  }
}

/**
 * Chase behavior: Original pursuit logic
 */
function applyChaseMovement(
  eid: number,
  playerEid: number,
  dt: number
): void {
  const playerX = Position.x[playerEid]
  const playerY = Position.y[playerEid]
  const playerZ = Position.z[playerEid]

  // Calculate base direction to player
  const dx = playerX - Position.x[eid]
  const dy = playerY - Position.y[eid]
  const dz = playerZ - Position.z[eid]
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

  if (dist === 0) return

  // Normalize base direction
  const baseDirX = dx / dist
  const baseDirY = dy / dist
  const baseDirZ = dz / dist

  // Apply movement based on subtype
  const subtype = EnemyAI.subtype[eid]
  const speed = EnemyAI.speed[eid]

  if (subtype === 0) {
    // Standard drone: spiral approach
    applyStandardDroneMovement(
      eid,
      baseDirX,
      baseDirY,
      baseDirZ,
      dist,
      speed,
      dt
    )
  } else if (subtype === 1) {
    // Heavy drone: slow, direct approach
    applyHeavyDroneMovement(eid, baseDirX, baseDirY, baseDirZ, speed, dt)
  } else if (subtype === 2) {
    // Swift drone: fast zigzag
    applySwiftDroneMovement(
      eid,
      baseDirX,
      baseDirY,
      baseDirZ,
      dist,
      speed,
      dt
    )
  }

  // Apply separation force influence
  applySeparationInfluence(eid, speed, dt)

  // Update rotation to face player
  updateRotationTowardsPlayer(eid, baseDirX, baseDirY, baseDirZ)
}

/**
 * Enemy Evade System
 *
 * Handles movement for enemies in EVADE state.
 * Transitions back to CHASE after timeout or health recovery.
 *
 * @param enemies - Array of enemy entity IDs
 * @param playerEid - Player entity ID (or -1 if no player)
 * @param dt - Delta time in seconds
 */
export function enemyEvadeSystem(
  enemies: number[],
  playerEid: number,
  dt: number
): void {
  for (const eid of enemies) {
    if (EnemyAI.state[eid] !== STATE_EVADE) continue

    // Update evade timer
    EnemyAI.stateTimer[eid] += dt

    // Transition back to CHASE after 3 seconds or if health recovered (above 40%)
    const healthRecovered = Health.max[eid] > 0 && Health.current[eid] > 0.4 * Health.max[eid]
    if (EnemyAI.stateTimer[eid] >= 3.0 || healthRecovered) {
      EnemyAI.state[eid] = STATE_CHASE
      continue
    }

    if (playerEid === -1) {
      EnemyAI.state[eid] = STATE_PATROL
      continue
    }

    // Update time alive
    EnemyAI.timeAlive[eid] += dt

    const playerX = Position.x[playerEid]
    const playerY = Position.y[playerEid]
    const playerZ = Position.z[playerEid]

    // Calculate direction AWAY from player
    let dx = Position.x[eid] - playerX
    let dy = Position.y[eid] - playerY
    let dz = Position.z[eid] - playerZ
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (dist === 0) continue

    // Move AWAY from player at 1.2x speed
    const speed = EnemyAI.speed[eid] * 1.2
    
    // Add some random jitter to prevent predictable retreat
    const jitter = 0.2
    let dirX = dx / dist + (Math.random() - 0.5) * jitter
    let dirY = dy / dist + (Math.random() - 0.5) * jitter
    let dirZ = dz / dist + (Math.random() - 0.5) * jitter
    
    // Re-normalize after jitter
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ)
    dirX /= dirLen
    dirY /= dirLen
    dirZ /= dirLen

    Velocity.x[eid] = dirX * speed
    Velocity.y[eid] = dirY * speed
    Velocity.z[eid] = dirZ * speed

    // Face away from player (movement direction)
    updateRotationTowardsPlayer(eid, dirX, dirY, dirZ)

    // Apply separation force influence
    applySeparationInfluence(eid, speed, dt)
  }
}

/**
 * Standard drone movement: spiral approach with sinusoidal offset
 */
function applyStandardDroneMovement(
  eid: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  distToPlayer: number,
  speed: number,
  _dt: number
): void {
  void _dt

  const amplitude = EnemyAI.spiralAmplitude[eid]
  const frequency = EnemyAI.spiralFrequency[eid]
  const phase = EnemyAI.spiralPhase[eid]
  const timeAlive = EnemyAI.timeAlive[eid]

  // Dampen amplitude based on distance (closer = tighter spiral)
  let effectiveAmplitude = amplitude
  if (distToPlayer < 500) {
    effectiveAmplitude = amplitude * (distToPlayer / 500)
  }

  // Calculate spiral offset using time and phase
  const spiralTime = timeAlive * frequency + phase
  const spiralOffset = Math.sin(spiralTime) * effectiveAmplitude

  // Create orthogonal basis for spiral movement
  // Up vector
  const upX = 0
  const upY = 1
  const upZ = 0

  // Right vector (cross product: dir × up)
  let rightX = dirY * upZ - dirZ * upY
  let rightY = dirZ * upX - dirX * upZ
  let rightZ = dirX * upY - dirY * upX

  // Normalize right vector
  const rightLen = Math.sqrt(
    rightX * rightX + rightY * rightY + rightZ * rightZ
  )
  if (rightLen > 0.1) {
    rightX /= rightLen
    rightY /= rightLen
    rightZ /= rightLen
  } else {
    // Fallback if direction is parallel to up
    rightX = 1
    rightY = 0
    rightZ = 0
  }

  // Apply base movement toward player
  Velocity.x[eid] = dirX * speed
  Velocity.y[eid] = dirY * speed
  Velocity.z[eid] = dirZ * speed

  // Add spiral offset perpendicular to movement
  Velocity.x[eid] += rightX * spiralOffset
  Velocity.y[eid] += rightY * spiralOffset
  Velocity.z[eid] += rightZ * spiralOffset
}

/**
 * Heavy drone movement: slow, direct approach
 */
function applyHeavyDroneMovement(
  eid: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  speed: number,
  _dt: number
): void {
  void _dt

  // Heavy drones move at 70% speed, no spiral
  const heavySpeed = speed * 0.7

  Velocity.x[eid] = dirX * heavySpeed
  Velocity.y[eid] = dirY * heavySpeed
  Velocity.z[eid] = dirZ * heavySpeed
}

/**
 * Swift drone movement: fast zigzag approach
 */
function applySwiftDroneMovement(
  eid: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  _distToPlayer: number,
  speed: number,
  _dt: number
): void {
  void _distToPlayer
  void _dt

  // Swift drones move at 150% speed with aggressive zigzag
  const swiftSpeed = speed * 1.5
  const timeAlive = EnemyAI.timeAlive[eid]

  // Calculate zigzag offset (faster frequency than standard)
  const zigzagFrequency = 3.0
  const zigzagAmplitude = 80
  const zigzagOffset = Math.sin(timeAlive * zigzagFrequency) * zigzagAmplitude

  // Create right vector for zigzag
  const upX = 0
  const upY = 1
  const upZ = 0

  let rightX = dirY * upZ - dirZ * upY
  let rightY = dirZ * upX - dirX * upZ
  let rightZ = dirX * upY - dirY * upX

  const rightLen = Math.sqrt(
    rightX * rightX + rightY * rightY + rightZ * rightZ
  )
  if (rightLen > 0.1) {
    rightX /= rightLen
    rightY /= rightLen
    rightZ /= rightLen
  } else {
    rightX = 1
    rightY = 0
    rightZ = 0
  }

  // Apply swift movement with zigzag
  Velocity.x[eid] = dirX * swiftSpeed + rightX * zigzagOffset
  Velocity.y[eid] = dirY * swiftSpeed + rightY * zigzagOffset
  Velocity.z[eid] = dirZ * swiftSpeed + rightZ * zigzagOffset
}

/**
 * Apply separation force influence to velocity
 */
function applySeparationInfluence(
  eid: number,
  speed: number,
  _dt: number
): void {
  void _dt

  const sepX = SeparationForce.x[eid]
  const sepY = SeparationForce.y[eid]
  const sepZ = SeparationForce.z[eid]

  const sepLengthSq = sepX * sepX + sepY * sepY + sepZ * sepZ

  if (sepLengthSq > 0.01) {
    const sepLength = Math.sqrt(sepLengthSq)
    const influence = EnemyAI.separationInfluence[eid]

    // Dynamic influence based on separation force strength
    const dynamicInfluence =
      influence * (0.5 + 0.5 * Math.min(1.0, sepLength / 100))

    // Lerp velocity toward separation direction
    const targetVelX = (sepX / sepLength) * speed
    const targetVelY = (sepY / sepLength) * speed
    const targetVelZ = (sepZ / sepLength) * speed

    Velocity.x[eid] += (targetVelX - Velocity.x[eid]) * dynamicInfluence
    Velocity.y[eid] += (targetVelY - Velocity.y[eid]) * dynamicInfluence
    Velocity.z[eid] += (targetVelZ - Velocity.z[eid]) * dynamicInfluence
  }
}

/**
 * Update rotation quaternion to face player (simplified LookAt)
 */
function updateRotationTowardsPlayer(
  eid: number,
  dirX: number,
  dirY: number,
  dirZ: number
): void {
  // Simple quaternion from direction vector
  // This is a simplified version - for production, use proper quaternion LookAt

  // Calculate yaw and pitch from direction
  const yaw = Math.atan2(dirX, dirZ)
  const pitch = Math.atan2(dirY, Math.sqrt(dirX * dirX + dirZ * dirZ))

  // Convert to quaternion (Euler to quaternion, YXZ order)
  const cy = Math.cos(yaw * 0.5)
  const sy = Math.sin(yaw * 0.5)
  const cp = Math.cos(pitch * 0.5)
  const sp = Math.sin(pitch * 0.5)

  Rotation.x[eid] = sp * cy
  Rotation.y[eid] = sy * cp
  Rotation.z[eid] = -sp * sy
  Rotation.w[eid] = cp * cy
}

/**
 * Enemy Separation System
 *
 * Calculates separation forces between nearby enemies to prevent clustering.
 * Uses spatial partitioning for efficiency (O(n) instead of O(n^2)).
 *
 * @param enemies - Array of enemy entity IDs
 */
export function enemySeparationSystem(enemies: number[]): void {
  // Clear separation forces
  for (const eid of enemies) {
    SeparationForce.x[eid] = 0
    SeparationForce.y[eid] = 0
    SeparationForce.z[eid] = 0
  }

  // Simple O(n^2) separation check
  // For production, use spatial partitioning (octree/grid)
  for (let i = 0; i < enemies.length; i++) {
    const eidA = enemies[i]
    const radiusA = Collider.radius[eidA]
    const threshold = radiusA * SEPARATION_THRESHOLD_MULTIPLIER

    for (let j = i + 1; j < enemies.length; j++) {
      const eidB = enemies[j]

      // Calculate distance
      const dx = Position.x[eidA] - Position.x[eidB]
      const dy = Position.y[eidA] - Position.y[eidB]
      const dz = Position.z[eidA] - Position.z[eidB]
      const distSq = dx * dx + dy * dy + dz * dz
      const dist = Math.sqrt(distSq)

      // Check if within separation threshold
      if (dist < threshold && dist > 0) {
        // Calculate separation force strength
        const strength = (threshold - dist) / threshold

        // Normalize separation vector
        const nx = dx / dist
        const ny = dy / dist
        const nz = dz / dist

        // Apply separation force
        const forceX = nx * strength * SEPARATION_FORCE_MAGNITUDE
        const forceY = ny * strength * SEPARATION_FORCE_MAGNITUDE
        const forceZ = nz * strength * SEPARATION_FORCE_MAGNITUDE

        // Add to both entities (opposite directions)
        SeparationForce.x[eidA] += forceX
        SeparationForce.y[eidA] += forceY
        SeparationForce.z[eidA] += forceZ

        SeparationForce.x[eidB] -= forceX
        SeparationForce.y[eidB] -= forceY
        SeparationForce.z[eidB] -= forceZ
      }
    }
  }
}

/**
 * Difficulty Scaling System
 *
 * Scales enemy parameters based on difficulty configuration.
 * Modifies enemy stats in-place to increase difficulty over time.
 *
 * @param enemies - Array of enemy entity IDs
 * @param config - Difficulty configuration (replaces global window.game dependency)
 */
export function difficultyScalingSystem(
  enemies: number[],
  config: DifficultyConfig = DEFAULT_DIFFICULTY_CONFIG
): void {
  if (config.isHordeMode && config.hordeSurvivalTime > 0) {
    // Horde mode scaling
    const survivalTime = config.hordeSurvivalTime
    const minutesPassed = survivalTime / 60

    // Health multiplier
    const healthMultiplier = config.healthMultiplier || (1 + minutesPassed * 0.5)

    // Damage multiplier
    const damageMultiplier = config.damageMultiplier || (1 + minutesPassed * 0.3)

    // Speed multiplier
    const speedMultiplier = config.speedMultiplier || (1 + minutesPassed * 0.2)

    // Apply scaling to all enemies
    for (const eid of enemies) {
      // Scale damage
      EnemyAI.damage[eid] = Math.floor(15 * damageMultiplier) // Base damage 15

      // Scale speed
      EnemyAI.speed[eid] = 700 * speedMultiplier // Base speed 700

      // Scale health (if enemy has Health component)
      if (Health.max[eid] > 0) {
        const baseHealth = 20
        Health.max[eid] = Math.floor(baseHealth * healthMultiplier)
        // Don't reduce current health, only increase max
        if (Health.current[eid] > Health.max[eid]) {
          Health.current[eid] = Health.max[eid]
        }
      }
    }
  }
}

/**
 * Enemy Collision Attack System
 *
 * Checks for kamikaze attacks when enemies get close to player.
 * Destroys the enemy and damages the player on collision.
 *
 * @param enemies - Array of enemy entity IDs
 * @param playerEid - Player entity ID (or -1 if no player)
 */
export function enemyCollisionAttackSystem(
  enemies: number[],
  playerEid: number
): void {
  if (playerEid === -1) return

  const playerX = Position.x[playerEid]
  const playerY = Position.y[playerEid]
  const playerZ = Position.z[playerEid]

  for (const eid of enemies) {
    // Calculate distance to player
    const dx = Position.x[eid] - playerX
    const dy = Position.y[eid] - playerY
    const dz = Position.z[eid] - playerZ
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // Check for collision
    if (dist < COLLISION_DISTANCE) {
      // Apply damage to player
      const damage = EnemyAI.damage[eid]

      // Update player health
      if (Health.current[playerEid] > 0) {
        // Trigger player damage vibration
        if (typeof window !== 'undefined' && (window as any).mainMessageBus) {
          (window as any).mainMessageBus.publish('input.vibrate', { intensity: 0.6, duration: 150 });
        }

        // First check shields
        if (Health.shield[playerEid] > 0) {
          if (Health.shield[playerEid] >= damage) {
            Health.shield[playerEid] -= damage
          } else {
            const remainingDamage = damage - Health.shield[playerEid]
            Health.shield[playerEid] = 0
            Health.current[playerEid] -= remainingDamage
          }
        } else {
          // Directly damage health
          Health.current[playerEid] -= damage
        }

        // Clamp health to 0
        if (Health.current[playerEid] < 0) {
          Health.current[playerEid] = 0
        }
      }

      // Mark enemy for destruction (set Lifetime to expire immediately)
      if (Lifetime.maxAge[eid] > 0) {
        Lifetime.age[eid] = Lifetime.maxAge[eid]
      }

      // TODO: Publish explosion VFX event when message bus is integrated
      // TODO: Play explosion sound when audio system is integrated
    }
  }
}

// ============================================================================
// BOSS AI SYSTEMS
// ============================================================================

import { Boss } from '../components'
import { debugLog } from '../../globals/debug'

// Boss type constants
const BOSS_DREADNOUGHT = 0
const BOSS_PHASE_SHIFTER = 1
const BOSS_SWARM_QUEEN = 2

/**
 * Boss AI System - Handles boss-specific behaviors
 * 
 * @param bosses - Array of boss entity IDs
 * @param playerEid - Player entity ID
 * @param dt - Delta time in seconds
 */
export function bossAISystem(
  bosses: number[],
  playerEid: number,
  dt: number
): void {
  if (playerEid === -1) return

  for (const eid of bosses) {
    const bossType = Boss.bossType[eid]

    // Update time alive
    EnemyAI.timeAlive[eid] += dt

    switch (bossType) {
      case BOSS_DREADNOUGHT:
        updateDreadnoughtBoss(eid, playerEid, dt)
        break
      case BOSS_PHASE_SHIFTER:
        updatePhaseShifterBoss(eid, playerEid, dt)
        break
      case BOSS_SWARM_QUEEN:
        updateSwarmQueenBoss(eid, playerEid, dt)
        break
    }
  }
}

/**
 * Dreadnought Boss - Large, slow, high HP, frontal beam weapon
 */
function updateDreadnoughtBoss(eid: number, playerEid: number, dt: number): void {
  // Slow direct approach
  const playerX = Position.x[playerEid]
  const playerY = Position.y[playerEid]
  const playerZ = Position.z[playerEid]

  const dx = playerX - Position.x[eid]
  const dy = playerY - Position.y[eid]
  const dz = playerZ - Position.z[eid]
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

  if (dist === 0) return

  const dirX = dx / dist
  const dirY = dy / dist
  const dirZ = dz / dist

  // Slow movement (50% of normal speed)
  const speed = EnemyAI.speed[eid] * 0.5
  Velocity.x[eid] = dirX * speed
  Velocity.y[eid] = dirY * speed
  Velocity.z[eid] = dirZ * speed

  // Face player
  updateRotationTowardsPlayer(eid, dirX, dirY, dirZ)

  // Beam weapon logic
  Boss.beamChargeTime[eid] += dt
  if (Boss.beamChargeTime[eid] >= 3.0 && dist < 800) {
    // Fire beam
    if (Boss.beamActive[eid] === 0) {
      Boss.beamActive[eid] = 1
      debugLog(`Dreadnought ${eid} firing beam weapon`)
      
      // Publish beam attack event
      if (typeof window !== 'undefined' && (window as any).mainMessageBus) {
        (window as any).mainMessageBus.publish('boss.beamAttack', {
          bossEid: eid,
          targetEid: playerEid,
          damage: EnemyAI.damage[eid] * 2
        })
      }
    }

    // Beam lasts 2 seconds
    if (Boss.beamChargeTime[eid] >= 5.0) {
      Boss.beamActive[eid] = 0
      Boss.beamChargeTime[eid] = 0
    }
  }

  // Spawn minions every 15 seconds
  Boss.spawnCooldown[eid] += dt
  if (Boss.spawnCooldown[eid] >= 15.0 && Boss.minionsSpawned[eid] < 4) {
    Boss.spawnCooldown[eid] = 0
    debugLog(`Dreadnought ${eid} spawning minion`)
    
    // Publish minion spawn event
    if (typeof window !== 'undefined' && (window as any).mainMessageBus) {
      (window as any).mainMessageBus.publish('boss.spawnMinion', {
        bossEid: eid,
        spawnX: Position.x[eid],
        spawnY: Position.y[eid],
        spawnZ: Position.z[eid]
      })
    }
    Boss.minionsSpawned[eid]++
  }
}

/**
 * Phase Shifter Boss - Periodically becomes invulnerable
 */
function updatePhaseShifterBoss(eid: number, playerEid: number, dt: number): void {
  // Update phase timer
  Boss.phaseTimer[eid] += dt

  // Phase shift every 8 seconds for 2 seconds
  if (Boss.phaseTimer[eid] >= 8.0 && Boss.phaseActive[eid] === 0) {
    Boss.phaseActive[eid] = 1
    Boss.phaseTimer[eid] = 0
    debugLog(`Phase Shifter ${eid} entering phase shift`)
    
    // Publish phase shift event for visual effect
    if (typeof window !== 'undefined' && (window as any).mainMessageBus) {
      (window as any).mainMessageBus.publish('boss.phaseShift', {
        bossEid: eid,
        active: true
      })
    }
  }

  // Exit phase shift after 2 seconds
  if (Boss.phaseActive[eid] === 1 && Boss.phaseTimer[eid] >= 2.0) {
    Boss.phaseActive[eid] = 0
    Boss.phaseTimer[eid] = 0
    debugLog(`Phase Shifter ${eid} exiting phase shift`)
    
    if (typeof window !== 'undefined' && (window as any).mainMessageBus) {
      (window as any).mainMessageBus.publish('boss.phaseShift', {
        bossEid: eid,
        active: false
      })
    }
  }

  // Fast zigzag movement (similar to swift drone)
  const playerX = Position.x[playerEid]
  const playerY = Position.y[playerEid]
  const playerZ = Position.z[playerEid]

  const dx = playerX - Position.x[eid]
  const dy = playerY - Position.y[eid]
  const dz = playerZ - Position.z[eid]
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

  if (dist === 0) return

  const dirX = dx / dist
  const dirY = dy / dist
  const dirZ = dz / dist

  // Fast movement with zigzag
  const speed = EnemyAI.speed[eid] * 1.2
  const zigzagOffset = Math.sin(EnemyAI.timeAlive[eid] * 4) * 100
  
  const perpX = -dirZ
  const perpZ = dirX
  
  Velocity.x[eid] = (dirX * speed) + (perpX * zigzagOffset * 0.01)
  Velocity.y[eid] = dirY * speed
  Velocity.z[eid] = (dirZ * speed) + (perpZ * zigzagOffset * 0.01)

  updateRotationTowardsPlayer(eid, dirX, dirY, dirZ)
}

/**
 * Swarm Queen Boss - Spawns minions that reform when destroyed
 */
function updateSwarmQueenBoss(eid: number, playerEid: number, dt: number): void {
  // Moderate speed circular movement around player
  const playerX = Position.x[playerEid]
  const playerY = Position.y[playerEid]
  const playerZ = Position.z[playerEid]

  const dx = playerX - Position.x[eid]
  const dy = playerY - Position.y[eid]
  const dz = playerZ - Position.z[eid]
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

  if (dist === 0) return

  // Maintain distance of 400 units
  const targetDist = 400
  const distError = dist - targetDist

  const dirX = dx / dist
  const dirY = dy / dist
  const dirZ = dz / dist

  // Circular orbit
  const speed = EnemyAI.speed[eid]
  const orbitSpeed = speed * 0.8
  const tangentX = -dirZ
  const tangentZ = dirX

  Velocity.x[eid] = (dirX * distError * 0.5) + (tangentX * orbitSpeed)
  Velocity.y[eid] = dirY * distError * 0.5
  Velocity.z[eid] = (dirZ * distError * 0.5) + (tangentZ * orbitSpeed)

  updateRotationTowardsPlayer(eid, dirX, dirY, dirZ)

  // Spawn minions every 5 seconds
  Boss.spawnCooldown[eid] += dt
  if (Boss.spawnCooldown[eid] >= 5.0 && Boss.minionsSpawned[eid] < 12) {
    Boss.spawnCooldown[eid] = 0
    
    // Spawn 2 minions at a time
    const spawnOffset = 100
    for (let i = 0; i < 2; i++) {
      debugLog(`Swarm Queen ${eid} spawning minion ${Boss.minionsSpawned[eid] + 1}`)
      
      if (typeof window !== 'undefined' && (window as any).mainMessageBus) {
        const minionIndex = Boss.minionsSpawned[eid]
        const spawnAngle = (minionIndex / 12) * Math.PI * 2
        (window as any).mainMessageBus.publish('boss.spawnMinion', {
          bossEid: eid,
          spawnX: Position.x[eid] + Math.cos(spawnAngle) * spawnOffset,
          spawnY: Position.y[eid],
          spawnZ: Position.z[eid] + Math.sin(spawnAngle) * spawnOffset
        })
      }
      Boss.minionsSpawned[eid]++
    }
  }
}
