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
 * Enemy Detection System
 *
 * Checks if enemies detect the player based on distance.
 * Sets EnemyAI.playerFound flag when player is within detection range.
 *
 * @param enemies - Array of enemy entity IDs
 * @param playerEid - Player entity ID (or -1 if no player)
 */
export function enemyDetectionSystem(
  enemies: number[],
  playerEid: number
): void {
  if (playerEid === -1) return

  // Get player position
  const playerX = Position.x[playerEid]
  const playerY = Position.y[playerEid]
  const playerZ = Position.z[playerEid]

  for (const eid of enemies) {
    // Skip if already found player
    if (EnemyAI.playerFound[eid]) continue

    // Calculate distance to player
    const dx = Position.x[eid] - playerX
    const dy = Position.y[eid] - playerY
    const dz = Position.z[eid] - playerZ
    const distSq = dx * dx + dy * dy + dz * dz

    const detectionRangeSq = EnemyAI.detectionRange[eid] ** 2

    if (distSq < detectionRangeSq) {
      EnemyAI.playerFound[eid] = 1
    }
  }
}

/**
 * Enemy Pursuit System
 *
 * Moves enemies toward the player with spiral movement patterns.
 * Implements different movement behaviors based on enemy subtype:
 * - Standard drones: Spiral approach with sinusoidal offset
 * - Heavy drones: Slow, direct approach
 * - Swift drones: Fast zigzag approach
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
  if (playerEid === -1) return

  const playerX = Position.x[playerEid]
  const playerY = Position.y[playerEid]
  const playerZ = Position.z[playerEid]

  for (const eid of enemies) {
    // Only pursue if player has been detected
    if (!EnemyAI.playerFound[eid]) continue

    // Update time alive
    EnemyAI.timeAlive[eid] += dt

    // Calculate base direction to player
    const dx = playerX - Position.x[eid]
    const dy = playerY - Position.y[eid]
    const dz = playerZ - Position.z[eid]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (dist === 0) continue

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

    // Update rotation to face player (simple LookAt approximation)
    updateRotationTowardsPlayer(eid, baseDirX, baseDirY, baseDirZ)
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
 * Scales enemy parameters based on game time or difficulty settings.
 * Modifies enemy stats in-place to increase difficulty over time.
 *
 * This system reads from global game state (window.game) to get difficulty parameters.
 *
 * @param enemies - Array of enemy entity IDs
 * @param gameTime - Total game time in seconds
 */
export function difficultyScalingSystem(
  enemies: number[],
  _gameTime: number
): void {
  void _gameTime

  // Check if global difficulty manager exists
  if (
    typeof window === 'undefined' ||
    !window.game ||
    !window.game.difficultyManager
  ) {
    return
  }

  const diffManager = window.game.difficultyManager

  // Check if horde mode is active
  const isHordeMode = window.game.isHordeActive || false

  if (isHordeMode && window.game.hordeSurvivalTime !== undefined) {
    // Horde mode scaling
    const survivalTime = window.game.hordeSurvivalTime / 1000
    const minutesPassed = survivalTime / 60

    // Health multiplier
    const healthMultiplier = 1 + minutesPassed * 0.5

    // Damage multiplier
    const damageMultiplier = 1 + minutesPassed * 0.3

    // Speed multiplier
    const speedMultiplier = 1 + minutesPassed * 0.2

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
  } else if (diffManager.params) {
    // Normal difficulty scaling (read from difficulty manager params)
    // This system doesn't modify params - it reads them
    // Spawning logic uses diffManager.params.maxEnemies and spawnInterval
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
