/**
 * Combat System (bitECS)
 *
 * Ported from legacy combat system for projectile collisions, damage,
 * shield regeneration, and lifetime handling.
 */

import { Collider, Health, Lifetime, Position, Weapon } from '../components'

export type CollisionEvent = {
  projectileEid: number
  targetEid: number
  hitPosition: { x: number; y: number; z: number }
}

/**
 * Detect collisions between projectiles and targets using sphere collision.
 */
export function projectileCollisionSystem(
  projectiles: number[],
  targets: number[]
): CollisionEvent[] {
  const events: CollisionEvent[] = []

  for (let i = 0; i < projectiles.length; i++) {
    const projectileEid = projectiles[i]

    const projX = Position.x[projectileEid]
    const projY = Position.y[projectileEid]
    const projZ = Position.z[projectileEid]
    const projRadius = Collider.radius[projectileEid]

    for (let j = 0; j < targets.length; j++) {
      const targetEid = targets[j]

      if (targetEid === projectileEid) continue

      const dx = projX - Position.x[targetEid]
      const dy = projY - Position.y[targetEid]
      const dz = projZ - Position.z[targetEid]
      const distSq = dx * dx + dy * dy + dz * dz

      const radiusSum = projRadius + Collider.radius[targetEid]
      const radiusSumSq = radiusSum * radiusSum

      if (distSq <= radiusSumSq) {
        let hitX = Position.x[targetEid]
        let hitY = Position.y[targetEid]
        let hitZ = Position.z[targetEid]

        if (distSq > 0) {
          const dist = Math.sqrt(distSq)
          const nx = dx / dist
          const ny = dy / dist
          const nz = dz / dist
          const targetRadius = Collider.radius[targetEid]

          hitX += nx * targetRadius
          hitY += ny * targetRadius
          hitZ += nz * targetRadius
        }

        events.push({
          projectileEid,
          targetEid,
          hitPosition: { x: hitX, y: hitY, z: hitZ },
        })
      }
    }
  }

  return events
}

/**
 * Apply damage from projectile hits to targets.
 */
export function damageApplicationSystem(events: CollisionEvent[]): void {
  for (let i = 0; i < events.length; i++) {
    const { projectileEid, targetEid } = events[i]

    const baseDamage = Weapon.damage[projectileEid]
    if (baseDamage <= 0) continue

    const resistance = clamp01(Health.damageResistance[targetEid])
    const damage = baseDamage * (1 - resistance)

    if (damage <= 0) continue

    const currentShield = Health.shield[targetEid]
    if (currentShield > 0) {
      if (damage <= currentShield) {
        Health.shield[targetEid] = currentShield - damage
        Health.timeSinceLastDamage[targetEid] = 0
        continue
      }

      const remaining = damage - currentShield
      Health.shield[targetEid] = 0
      Health.current[targetEid] = Math.max(
        0,
        Health.current[targetEid] - remaining
      )
      Health.timeSinceLastDamage[targetEid] = 0
      continue
    }

    Health.current[targetEid] = Math.max(
      0,
      Health.current[targetEid] - damage
    )
    Health.timeSinceLastDamage[targetEid] = 0
  }
}

/**
 * Regenerate shields for entities over time.
 */
export function shieldRegenSystem(entities: number[], dt: number): void {
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]

    Health.timeSinceLastDamage[eid] += dt

    if (Health.timeSinceLastDamage[eid] > Health.shieldRegenDelay[eid]) {
      if (Health.shield[eid] < Health.maxShield[eid]) {
        const regen = Health.shieldRegenRate[eid] * dt
        Health.shield[eid] = Math.min(
          Health.maxShield[eid],
          Health.shield[eid] + regen
        )
      }
    }
  }
}

/**
 * Age entities with Lifetime component and return expired IDs.
 */
export function lifetimeSystem(entities: number[], dt: number): number[] {
  const expired: number[] = []

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    Lifetime.age[eid] += dt

    const maxAge = Lifetime.maxAge[eid]
    if (maxAge > 0 && Lifetime.age[eid] > maxAge) {
      expired.push(eid)
    }
  }

  return expired
}

function clamp01(value: number): number {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}
