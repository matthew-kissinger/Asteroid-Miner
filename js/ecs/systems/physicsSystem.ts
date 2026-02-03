/**
 * Physics System
 *
 * Newtonian physics for space game:
 * - Thrust accumulates velocity
 * - Objects keep moving (Newton's first law)
 * - Small friction for playability
 * - Simple sphere collision detection
 *
 * Based on js/modules/physics.js implementation.
 */

import {
  Position,
  Velocity,
  Rotation,
  Rigidbody,
  Thrust,
  Thruster,
  Collider,
} from '../components'

// Physics constants (from physics.js)
const THRUST_FORCE = 0.5
const BOOST_MULTIPLIER = 4
const MAX_VELOCITY = 25.0
const FRICTION = 0.01

/**
 * Apply thrust forces to entities with Thrust + Thruster components
 *
 * Converts thrust input into velocity changes using Newtonian physics.
 * Thrust is applied in local space, then rotated to world space.
 */
export function applyThrustSystem(entities: number[], dt: number): void {
  for (const eid of entities) {
    // Check if entity has required components
    if (!hasThrust(eid) || !hasThruster(eid)) continue

    // Calculate thrust vector in local space
    let thrustX = 0
    let thrustY = 0
    let thrustZ = 0

    const boostMult = Thrust.boost[eid] ? BOOST_MULTIPLIER : 1

    if (Thrust.forward[eid]) {
      thrustZ -= THRUST_FORCE * boostMult
    }
    if (Thrust.backward[eid]) {
      thrustZ += THRUST_FORCE * boostMult
    }
    if (Thrust.left[eid]) {
      thrustX -= THRUST_FORCE
    }
    if (Thrust.right[eid]) {
      thrustX += THRUST_FORCE
    }
    if (Thrust.up[eid]) {
      thrustY += THRUST_FORCE
    }
    if (Thrust.down[eid]) {
      thrustY -= THRUST_FORCE
    }

    // Early exit if no thrust
    if (thrustX === 0 && thrustY === 0 && thrustZ === 0) continue

    // Rotate thrust vector from local to world space using quaternion
    const rotatedThrust = rotateVector(
      thrustX,
      thrustY,
      thrustZ,
      Rotation.x[eid],
      Rotation.y[eid],
      Rotation.z[eid],
      Rotation.w[eid]
    )

    // Apply thrust to velocity (scaled by delta time)
    Velocity.x[eid] += rotatedThrust.x * dt
    Velocity.y[eid] += rotatedThrust.y * dt
    Velocity.z[eid] += rotatedThrust.z * dt

    // Cap velocity at max (use Thruster.maxVelocity if set, else default)
    const maxVel = Thruster.maxVelocity[eid] || MAX_VELOCITY
    const velLength = Math.sqrt(
      Velocity.x[eid] ** 2 + Velocity.y[eid] ** 2 + Velocity.z[eid] ** 2
    )

    if (velLength > maxVel) {
      const scale = maxVel / velLength
      Velocity.x[eid] *= scale
      Velocity.y[eid] *= scale
      Velocity.z[eid] *= scale
    }
  }
}

/**
 * Apply drag/friction to slow down entities
 *
 * Uses Rigidbody.drag if present, else uses default FRICTION.
 * This is space friction - not realistic but improves playability.
 */
export function applyDragSystem(entities: number[], dt: number): void {
  for (const eid of entities) {
    if (!hasVelocity(eid)) continue

    // Get drag coefficient
    let drag = FRICTION
    if (hasRigidbody(eid)) {
      drag = Rigidbody.drag[eid]
    }

    // Apply drag as exponential decay
    const dragFactor = 1 - drag * dt
    Velocity.x[eid] *= dragFactor
    Velocity.y[eid] *= dragFactor
    Velocity.z[eid] *= dragFactor

    // Zero out very small velocities to prevent float drift
    if (Math.abs(Velocity.x[eid]) < 0.001) Velocity.x[eid] = 0
    if (Math.abs(Velocity.y[eid]) < 0.001) Velocity.y[eid] = 0
    if (Math.abs(Velocity.z[eid]) < 0.001) Velocity.z[eid] = 0
  }
}

/**
 * Integrate velocity into position (Newton's first law)
 *
 * Objects in motion stay in motion unless acted upon by a force.
 */
export function integratePositionSystem(entities: number[], dt: number): void {
  for (const eid of entities) {
    if (!hasPosition(eid) || !hasVelocity(eid)) continue

    Position.x[eid] += Velocity.x[eid] * dt
    Position.y[eid] += Velocity.y[eid] * dt
    Position.z[eid] += Velocity.z[eid] * dt
  }
}

/**
 * Simple sphere collision detection
 *
 * Checks all pairs of entities with Collider components.
 * On collision, applies separation force to push entities apart.
 *
 * TODO: Use spatial partitioning (octree/grid) for better performance
 */
export function collisionSystem(entities: number[]): void {
  // Simple O(n^2) check - fine for small entity counts
  // For larger games, use spatial partitioning
  for (let i = 0; i < entities.length; i++) {
    const eidA = entities[i]
    if (!hasCollider(eidA) || !hasPosition(eidA)) continue

    for (let j = i + 1; j < entities.length; j++) {
      const eidB = entities[j]
      if (!hasCollider(eidB) || !hasPosition(eidB)) continue

      // Calculate distance between entities
      const dx = Position.x[eidA] - Position.x[eidB]
      const dy = Position.y[eidA] - Position.y[eidB]
      const dz = Position.z[eidA] - Position.z[eidB]
      const distSq = dx * dx + dy * dy + dz * dz

      // Check collision
      const radiusSum = Collider.radius[eidA] + Collider.radius[eidB]
      const radiusSumSq = radiusSum * radiusSum

      if (distSq < radiusSumSq && distSq > 0) {
        // Collision detected - apply separation
        const dist = Math.sqrt(distSq)
        const overlap = radiusSum - dist

        // Normalize separation vector
        const nx = dx / dist
        const ny = dy / dist
        const nz = dz / dist

        // Push entities apart by half the overlap each
        const separation = overlap * 0.5

        Position.x[eidA] += nx * separation
        Position.y[eidA] += ny * separation
        Position.z[eidA] += nz * separation

        Position.x[eidB] -= nx * separation
        Position.y[eidB] -= ny * separation
        Position.z[eidB] -= nz * separation

        // Apply bounce to velocity if entities have velocity
        if (hasVelocity(eidA) && hasVelocity(eidB)) {
          // Simple elastic collision response
          const restitution = 0.5 // Bounciness factor

          // Relative velocity
          const vrelX = Velocity.x[eidA] - Velocity.x[eidB]
          const vrelY = Velocity.y[eidA] - Velocity.y[eidB]
          const vrelZ = Velocity.z[eidA] - Velocity.z[eidB]

          // Velocity along collision normal
          const vn = vrelX * nx + vrelY * ny + vrelZ * nz

          // Don't resolve if velocities are separating
          if (vn < 0) {
            // Impulse magnitude
            const impulse = -(1 + restitution) * vn

            // Apply impulse
            Velocity.x[eidA] += impulse * nx * 0.5
            Velocity.y[eidA] += impulse * ny * 0.5
            Velocity.z[eidA] += impulse * nz * 0.5

            Velocity.x[eidB] -= impulse * nx * 0.5
            Velocity.y[eidB] -= impulse * ny * 0.5
            Velocity.z[eidB] -= impulse * nz * 0.5
          }
        }
      }
    }
  }
}

/**
 * Main physics system - runs all physics subsystems
 *
 * @param entities - Array of entity IDs to process
 * @param dt - Delta time in seconds
 */
export function physicsSystem(entities: number[], dt: number): void {
  // Normalize delta time to 60 FPS for consistent feel
  const normalizedDt = dt * 60

  // Run physics subsystems in order
  applyThrustSystem(entities, normalizedDt)
  applyDragSystem(entities, normalizedDt)
  integratePositionSystem(entities, normalizedDt)
  collisionSystem(entities)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Rotate a vector by a quaternion
 */
function rotateVector(
  x: number,
  y: number,
  z: number,
  qx: number,
  qy: number,
  qz: number,
  qw: number
): { x: number; y: number; z: number } {
  // Quaternion rotation formula: v' = q * v * q^-1
  // Optimized version using direct math

  const ix = qw * x + qy * z - qz * y
  const iy = qw * y + qz * x - qx * z
  const iz = qw * z + qx * y - qy * x
  const iw = -qx * x - qy * y - qz * z

  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  }
}

/**
 * Component existence checks
 *
 * bitECS v0.4.0 doesn't have built-in component existence checks.
 * We check if the component data is non-zero or has been explicitly set.
 *
 * NOTE: This is a simple approach. For production, track component
 * assignment explicitly (e.g., Set<number> per component).
 */
function hasPosition(eid: number): boolean {
  return eid < Position.x.length
}

function hasVelocity(eid: number): boolean {
  return eid < Velocity.x.length
}

function hasThrust(eid: number): boolean {
  return eid < Thrust.forward.length
}

function hasThruster(eid: number): boolean {
  return eid < Thruster.thrustForce.length
}

function hasRigidbody(eid: number): boolean {
  return eid < Rigidbody.mass.length
}

function hasCollider(eid: number): boolean {
  return eid < Collider.radius.length
}
