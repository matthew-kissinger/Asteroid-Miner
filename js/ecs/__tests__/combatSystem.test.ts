import { describe, it, expect, beforeEach } from 'vitest'
import { addEntity } from 'bitecs'
import { world } from '../world'
import {
  Position,
  Collider,
  Health,
  Weapon,
  Lifetime,
} from '../components'
import {
  projectileCollisionSystem,
  damageApplicationSystem,
  shieldRegenSystem,
  lifetimeSystem,
} from '../systems/combatSystem'

describe('Combat System', () => {
  let projectileEid: number
  let targetEid: number

  beforeEach(() => {
    projectileEid = addEntity(world)
    targetEid = addEntity(world)

    // Setup projectile
    Position.x[projectileEid] = 0
    Position.y[projectileEid] = 0
    Position.z[projectileEid] = 0
    Collider.radius[projectileEid] = 5
    Weapon.damage[projectileEid] = 10

    // Setup target
    Position.x[targetEid] = 0
    Position.y[targetEid] = 0
    Position.z[targetEid] = 0
    Collider.radius[targetEid] = 10
    Health.current[targetEid] = 100
    Health.max[targetEid] = 100
    Health.shield[targetEid] = 0
    Health.maxShield[targetEid] = 50
    Health.damageResistance[targetEid] = 0
    Health.timeSinceLastDamage[targetEid] = 0
    Health.shieldRegenRate[targetEid] = 5
    Health.shieldRegenDelay[targetEid] = 2
  })

  it('should detect collision when projectile is within radius', () => {
    // Projectile at origin, target at (10, 0, 0)
    // Radii: projectile=5, target=10, sum=15
    // Distance=10 < 15, so collision
    Position.x[projectileEid] = 0
    Position.y[projectileEid] = 0
    Position.z[projectileEid] = 0

    Position.x[targetEid] = 10
    Position.y[targetEid] = 0
    Position.z[targetEid] = 0

    const events = projectileCollisionSystem([projectileEid], [targetEid])

    expect(events.length).toBe(1)
    expect(events[0].projectileEid).toBe(projectileEid)
    expect(events[0].targetEid).toBe(targetEid)
  })

  it('should not detect collision when projectile is outside radius', () => {
    // Projectile at (0, 0, 0), target at (20, 0, 0)
    // Radii: projectile=5, target=10, sum=15
    // Distance=20 > 15, so no collision
    Position.x[projectileEid] = 0
    Position.y[projectileEid] = 0
    Position.z[projectileEid] = 0

    Position.x[targetEid] = 20
    Position.y[targetEid] = 0
    Position.z[targetEid] = 0

    const events = projectileCollisionSystem([projectileEid], [targetEid])

    expect(events.length).toBe(0)
  })

  it('should apply damage with resistance', () => {
    // Setup: 10 damage, 50% resistance
    Weapon.damage[projectileEid] = 10
    Health.damageResistance[targetEid] = 0.5
    Health.current[targetEid] = 100

    const events = [
      {
        projectileEid,
        targetEid,
        hitPosition: { x: 0, y: 0, z: 0 },
      },
    ]

    damageApplicationSystem(events)

    // Expected: 10 * (1 - 0.5) = 5 damage
    expect(Health.current[targetEid]).toBe(95)
  })

  it('should absorb damage with shield before HP', () => {
    // Setup: 10 damage, 20 shield
    Weapon.damage[projectileEid] = 10
    Health.shield[targetEid] = 20
    Health.current[targetEid] = 100

    const events = [
      {
        projectileEid,
        targetEid,
        hitPosition: { x: 0, y: 0, z: 0 },
      },
    ]

    damageApplicationSystem(events)

    // Shield should absorb all damage
    expect(Health.shield[targetEid]).toBe(10)
    expect(Health.current[targetEid]).toBe(100)
  })

  it('should damage HP after shield is depleted', () => {
    // Setup: 30 damage, 20 shield
    Weapon.damage[projectileEid] = 30
    Health.shield[targetEid] = 20
    Health.current[targetEid] = 100

    const events = [
      {
        projectileEid,
        targetEid,
        hitPosition: { x: 0, y: 0, z: 0 },
      },
    ]

    damageApplicationSystem(events)

    // Shield depleted, 10 damage to HP
    expect(Health.shield[targetEid]).toBe(0)
    expect(Health.current[targetEid]).toBe(90)
  })

  it('should regenerate shield after delay', () => {
    // Setup: shield at 0, regen rate 5/sec, delay 2s
    Health.shield[targetEid] = 0
    Health.maxShield[targetEid] = 50
    Health.shieldRegenRate[targetEid] = 5
    Health.shieldRegenDelay[targetEid] = 2
    Health.timeSinceLastDamage[targetEid] = 2.1 // Past delay

    shieldRegenSystem([targetEid], 1.0)

    // Should regen 5 points over 1 second
    expect(Health.shield[targetEid]).toBe(5)
  })

  it('should not regenerate shield before delay', () => {
    // Setup: shield at 0, delay 2s, only 1s passed
    Health.shield[targetEid] = 0
    Health.maxShield[targetEid] = 50
    Health.shieldRegenRate[targetEid] = 5
    Health.shieldRegenDelay[targetEid] = 2
    Health.timeSinceLastDamage[targetEid] = 1.0 // Before delay

    shieldRegenSystem([targetEid], 1.0)

    // Should not regen yet
    expect(Health.shield[targetEid]).toBe(0)
  })

  it('should expire entities after max lifetime', () => {
    // Setup: age 0, maxAge 5
    Lifetime.age[projectileEid] = 0
    Lifetime.maxAge[projectileEid] = 5

    // Age by 6 seconds
    const expired = lifetimeSystem([projectileEid], 6.0)

    expect(expired.length).toBe(1)
    expect(expired[0]).toBe(projectileEid)
    expect(Lifetime.age[projectileEid]).toBe(6)
  })

  it('should not expire entities before max lifetime', () => {
    // Setup: age 0, maxAge 5
    Lifetime.age[projectileEid] = 0
    Lifetime.maxAge[projectileEid] = 5

    // Age by 3 seconds
    const expired = lifetimeSystem([projectileEid], 3.0)

    expect(expired.length).toBe(0)
    expect(Lifetime.age[projectileEid]).toBe(3)
  })
})
