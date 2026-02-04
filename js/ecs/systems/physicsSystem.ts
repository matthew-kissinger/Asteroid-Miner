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
  AngularVelocity,
  Rotation,
  Rigidbody,
  Force,
  Torque,
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
 * Integrate forces into velocity (F = ma)
 *
 * Converts accumulated forces into velocity changes.
 * Forces are cleared at the end of each frame.
 */
export function integrateForcesSystem(entities: number[], dt: number): void {
  for (const eid of entities) {
    if (!hasForce(eid) || !hasVelocity(eid) || !hasRigidbody(eid)) continue

    // Skip kinematic entities
    if (Rigidbody.isKinematic[eid]) continue

    const mass = Rigidbody.mass[eid] || 1

    // Calculate acceleration: a = F / m
    const ax = Force.x[eid] / mass
    const ay = Force.y[eid] / mass
    const az = Force.z[eid] / mass

    // Apply acceleration to velocity: v += a * dt
    Velocity.x[eid] += ax * dt
    Velocity.y[eid] += ay * dt
    Velocity.z[eid] += az * dt

    // Clear forces for next frame
    Force.x[eid] = 0
    Force.y[eid] = 0
    Force.z[eid] = 0
  }
}

/**
 * Integrate torque into angular velocity
 *
 * Converts accumulated torque into angular velocity changes.
 * Torque is cleared at the end of each frame.
 */
export function integrateTorqueSystem(entities: number[], dt: number): void {
  for (const eid of entities) {
    if (!hasTorque(eid) || !hasAngularVelocity(eid) || !hasRigidbody(eid))
      continue

    // Skip kinematic entities or frozen rotation
    if (Rigidbody.isKinematic[eid] || Rigidbody.freezeRotation[eid]) continue

    const mass = Rigidbody.mass[eid] || 1

    // Calculate angular acceleration: α = τ / I
    // For simplicity, use mass as moment of inertia
    const alphax = Torque.x[eid] / mass
    const alphay = Torque.y[eid] / mass
    const alphaz = Torque.z[eid] / mass

    // Apply angular acceleration to angular velocity: ω += α * dt
    AngularVelocity.x[eid] += alphax * dt
    AngularVelocity.y[eid] += alphay * dt
    AngularVelocity.z[eid] += alphaz * dt

    // Clear torque for next frame
    Torque.x[eid] = 0
    Torque.y[eid] = 0
    Torque.z[eid] = 0
  }
}

/**
 * Apply angular drag to angular velocity
 *
 * Similar to linear drag but for rotational motion.
 */
export function applyAngularDragSystem(entities: number[], dt: number): void {
  for (const eid of entities) {
    if (!hasAngularVelocity(eid) || !hasRigidbody(eid)) continue

    const angularDrag = Rigidbody.angularDrag[eid]
    if (angularDrag <= 0) continue

    // Apply angular drag as exponential decay
    const dragFactor = Math.max(0, 1 - angularDrag * dt)
    AngularVelocity.x[eid] *= dragFactor
    AngularVelocity.y[eid] *= dragFactor
    AngularVelocity.z[eid] *= dragFactor

    // Zero out very small angular velocities
    if (Math.abs(AngularVelocity.x[eid]) < 0.001) AngularVelocity.x[eid] = 0
    if (Math.abs(AngularVelocity.y[eid]) < 0.001) AngularVelocity.y[eid] = 0
    if (Math.abs(AngularVelocity.z[eid]) < 0.001) AngularVelocity.z[eid] = 0
  }
}

/**
 * Integrate angular velocity into rotation (quaternion update)
 *
 * Converts angular velocity (Euler) to quaternion rotation changes.
 * This matches the legacy MovementSystem implementation.
 */
export function integrateAngularVelocitySystem(
  entities: number[],
  dt: number
): void {
  for (const eid of entities) {
    if (
      !hasAngularVelocity(eid) ||
      !hasRotation(eid) ||
      !hasRigidbody(eid)
    )
      continue

    // Skip if rotation is frozen
    if (Rigidbody.freezeRotation[eid]) continue

    // Get angular velocity
    const angVelX = AngularVelocity.x[eid] * dt
    const angVelY = AngularVelocity.y[eid] * dt
    const angVelZ = AngularVelocity.z[eid] * dt

    // Skip if no angular velocity
    if (
      Math.abs(angVelX) < 0.0001 &&
      Math.abs(angVelY) < 0.0001 &&
      Math.abs(angVelZ) < 0.0001
    )
      continue

    // Convert angular velocity change to quaternion
    // This uses the same approach as the legacy system:
    // 1. Create Euler from angular change
    // 2. Convert to quaternion
    // 3. Multiply with current rotation
    const rotationDelta = eulerToQuaternion(angVelX, angVelY, angVelZ)

    // Apply rotation change: q_new = q_current * q_delta
    const qx = Rotation.x[eid]
    const qy = Rotation.y[eid]
    const qz = Rotation.z[eid]
    const qw = Rotation.w[eid]

    const dx = rotationDelta.x
    const dy = rotationDelta.y
    const dz = rotationDelta.z
    const dw = rotationDelta.w

    // Quaternion multiplication
    Rotation.x[eid] = qw * dx + qx * dw + qy * dz - qz * dy
    Rotation.y[eid] = qw * dy - qx * dz + qy * dw + qz * dx
    Rotation.z[eid] = qw * dz + qx * dy - qy * dx + qz * dw
    Rotation.w[eid] = qw * dw - qx * dx - qy * dy - qz * dz

    // Normalize quaternion to prevent drift
    const len = Math.sqrt(
      Rotation.x[eid] ** 2 +
        Rotation.y[eid] ** 2 +
        Rotation.z[eid] ** 2 +
        Rotation.w[eid] ** 2
    )
    if (len > 0) {
      Rotation.x[eid] /= len
      Rotation.y[eid] /= len
      Rotation.z[eid] /= len
      Rotation.w[eid] /= len
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
  integrateForcesSystem(entities, normalizedDt) // NEW: Force → velocity
  integrateTorqueSystem(entities, normalizedDt) // NEW: Torque → angular velocity
  applyThrustSystem(entities, normalizedDt)
  applyDragSystem(entities, normalizedDt)
  applyAngularDragSystem(entities, normalizedDt) // NEW: Angular drag
  integratePositionSystem(entities, normalizedDt)
  integrateAngularVelocitySystem(entities, normalizedDt) // NEW: Angular velocity → rotation
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
 * Convert Euler angles (radians) to quaternion
 *
 * This matches the Three.js Quaternion.setFromEuler implementation.
 */
function eulerToQuaternion(
  x: number,
  y: number,
  z: number
): { x: number; y: number; z: number; w: number } {
  // Compute half angles
  const cx = Math.cos(x * 0.5)
  const cy = Math.cos(y * 0.5)
  const cz = Math.cos(z * 0.5)
  const sx = Math.sin(x * 0.5)
  const sy = Math.sin(y * 0.5)
  const sz = Math.sin(z * 0.5)

  // XYZ order (Three.js default)
  return {
    x: sx * cy * cz + cx * sy * sz,
    y: cx * sy * cz - sx * cy * sz,
    z: cx * cy * sz + sx * sy * cz,
    w: cx * cy * cz - sx * sy * sz,
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

function hasAngularVelocity(eid: number): boolean {
  return eid < AngularVelocity.x.length
}

function hasRotation(eid: number): boolean {
  return eid < Rotation.x.length
}

function hasForce(eid: number): boolean {
  return eid < Force.x.length
}

function hasTorque(eid: number): boolean {
  return eid < Torque.x.length
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
