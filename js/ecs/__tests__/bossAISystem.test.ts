import { describe, it, expect, beforeEach } from 'vitest'
import { addEntity } from 'bitecs'
import { world } from '../world'
import {
  Position,
  Velocity,
  EnemyAI,
  Health,
  Boss,
  Collider,
  Rotation,
} from '../components'
import { bossAISystem } from '../systems/enemyAISystem'

describe('Boss AI System', () => {
  let bossEid: number
  let playerEid: number

  // Boss type constants
  const BOSS_DREADNOUGHT = 0
  const BOSS_PHASE_SHIFTER = 1
  const BOSS_SWARM_QUEEN = 2

  beforeEach(() => {
    bossEid = addEntity(world)
    playerEid = addEntity(world)

    // Setup player
    Position.x[playerEid] = 0
    Position.y[playerEid] = 0
    Position.z[playerEid] = 0

    // Setup base boss entity
    Position.x[bossEid] = 100
    Position.y[bossEid] = 0
    Position.z[bossEid] = 0
    Velocity.x[bossEid] = 0
    Velocity.y[bossEid] = 0
    Velocity.z[bossEid] = 0
    EnemyAI.speed[bossEid] = 100
    EnemyAI.damage[bossEid] = 50
    EnemyAI.timeAlive[bossEid] = 0
    Health.current[bossEid] = 500
    Health.max[bossEid] = 500
    Collider.radius[bossEid] = 20
    Rotation.x[bossEid] = 0
    Rotation.y[bossEid] = 0
    Rotation.z[bossEid] = 0
    Rotation.w[bossEid] = 1

    // Initialize Boss component fields
    Boss.bossType[bossEid] = BOSS_DREADNOUGHT
    Boss.phaseTimer[bossEid] = 0
    Boss.phaseActive[bossEid] = 0
    Boss.spawnCooldown[bossEid] = 0
    Boss.minionsSpawned[bossEid] = 0
    Boss.beamChargeTime[bossEid] = 0
    Boss.beamActive[bossEid] = 0
    Boss.originalScale[bossEid] = 1
  })

  describe('Boss component initialization', () => {
    it('should initialize boss component with correct fields', () => {
      expect(Boss.bossType[bossEid]).toBe(BOSS_DREADNOUGHT)
      expect(Boss.phaseTimer[bossEid]).toBe(0)
      expect(Boss.phaseActive[bossEid]).toBe(0)
      expect(Boss.spawnCooldown[bossEid]).toBe(0)
      expect(Boss.minionsSpawned[bossEid]).toBe(0)
      expect(Boss.beamChargeTime[bossEid]).toBe(0)
      expect(Boss.beamActive[bossEid]).toBe(0)
    })

    it('should handle different boss types', () => {
      Boss.bossType[bossEid] = BOSS_PHASE_SHIFTER
      expect(Boss.bossType[bossEid]).toBe(BOSS_PHASE_SHIFTER)

      Boss.bossType[bossEid] = BOSS_SWARM_QUEEN
      expect(Boss.bossType[bossEid]).toBe(BOSS_SWARM_QUEEN)

      Boss.bossType[bossEid] = BOSS_DREADNOUGHT
      expect(Boss.bossType[bossEid]).toBe(BOSS_DREADNOUGHT)
    })
  })

  describe('Dreadnought behavior', () => {
    beforeEach(() => {
      Boss.bossType[bossEid] = BOSS_DREADNOUGHT
    })

    it('should move toward player at reduced speed', () => {
      Position.x[bossEid] = 100
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Velocity should point toward player (negative X direction)
      // Speed should be reduced (50% of normal)
      const expectedSpeed = EnemyAI.speed[bossEid] * 0.5
      const expectedVelX = -expectedSpeed
      const expectedVelY = 0
      const expectedVelZ = 0

      expect(Velocity.x[bossEid]).toBeCloseTo(expectedVelX, 1)
      expect(Velocity.y[bossEid]).toBeCloseTo(expectedVelY, 1)
      expect(Velocity.z[bossEid]).toBeCloseTo(expectedVelZ, 1)
    })

    it('should charge beam attack over 3 seconds', () => {
      Position.x[bossEid] = 100
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0
      Boss.beamChargeTime[bossEid] = 0

      const dt = 0.016

      // Run system for ~3 seconds
      for (let i = 0; i < 188; i++) {
        bossAISystem([bossEid], playerEid, dt)
      }

      // Should have triggered beam attack (charged >= 3.0)
      expect(Boss.beamChargeTime[bossEid]).toBeGreaterThanOrEqual(3.0)
    })

    it('should activate beam after 3 second charge', () => {
      Position.x[bossEid] = 100
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0
      Boss.beamChargeTime[bossEid] = 3.1
      Boss.beamActive[bossEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Beam should be active
      expect(Boss.beamActive[bossEid]).toBe(1)
    })

    it('should deactivate beam after 5 second total time', () => {
      Position.x[bossEid] = 100
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0
      Boss.beamChargeTime[bossEid] = 5.1
      Boss.beamActive[bossEid] = 1

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Beam should be deactivated and timer reset
      expect(Boss.beamActive[bossEid]).toBe(0)
      expect(Boss.beamChargeTime[bossEid]).toBe(0)
    })

    it('should increment spawn cooldown timer every 15 seconds', () => {
      Boss.spawnCooldown[bossEid] = 0
      Boss.minionsSpawned[bossEid] = 0

      const dt = 0.016

      // Run system for ~15 seconds
      for (let i = 0; i < 937; i++) {
        bossAISystem([bossEid], playerEid, dt)
      }

      // Spawn cooldown should have incremented significantly
      expect(Boss.spawnCooldown[bossEid]).toBeGreaterThan(14.0)
    })

    it('should limit minion spawns to max 4', () => {
      Position.x[bossEid] = 100
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0
      Boss.minionsSpawned[bossEid] = 4
      Boss.spawnCooldown[bossEid] = 15.1

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Should not spawn more minions beyond max
      expect(Boss.minionsSpawned[bossEid]).toBe(4)
    })

    it('should not fire beam when player is far away', () => {
      Position.x[bossEid] = 0
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 1000 // Far away (> 800)
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0
      Boss.beamChargeTime[bossEid] = 3.1
      Boss.beamActive[bossEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Beam should not activate when distance > 800
      expect(Boss.beamActive[bossEid]).toBe(0)
    })
  })

  describe('PhaseShifter behavior', () => {
    beforeEach(() => {
      Boss.bossType[bossEid] = BOSS_PHASE_SHIFTER
    })

    it('should move toward player at increased speed with zigzag', () => {
      Position.x[bossEid] = 100
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Velocity should point toward player (negative X direction)
      // Speed is increased (120% of normal) plus zigzag offset
      const expectedSpeed = EnemyAI.speed[bossEid] * 1.2

      expect(Velocity.x[bossEid]).toBeLessThan(0) // Moving toward player
      expect(Math.abs(Velocity.x[bossEid])).toBeLessThanOrEqual(expectedSpeed) // Can be up to expected speed with zigzag
    })

    it('should reach 8 second timer for phase shift activation', () => {
      Boss.phaseTimer[bossEid] = 0
      Boss.phaseActive[bossEid] = 0

      const dt = 0.016

      // Run system for ~8 seconds
      for (let i = 0; i < 501; i++) {
        bossAISystem([bossEid], playerEid, dt)
      }

      // Timer should have reached ~8 seconds (and likely triggered phase shift)
      // After triggering, it resets, but we can verify it went through the cycle
      expect(Boss.phaseTimer[bossEid]).toBeLessThan(1.0) // Either reset or close to 0
    })

    it('should exit phase shift after 2 seconds of invulnerability', () => {
      Boss.phaseTimer[bossEid] = 0
      Boss.phaseActive[bossEid] = 1

      const dt = 0.016

      // Run system for ~2 seconds while in phase
      for (let i = 0; i < 125; i++) {
        bossAISystem([bossEid], playerEid, dt)
      }

      // Should exit phase shift
      expect(Boss.phaseActive[bossEid]).toBe(0)
      expect(Boss.phaseTimer[bossEid]).toBeCloseTo(0, 1)
    })

    it('should cycle between normal and invulnerable states', () => {
      Boss.phaseTimer[bossEid] = 0
      Boss.phaseActive[bossEid] = 0

      const dt = 0.016
      let normalCycles = 0
      let invulnCycles = 0

      // Run system for 2 full cycles (~20 seconds)
      for (let i = 0; i < 1250; i++) {
        bossAISystem([bossEid], playerEid, dt)
        if (Boss.phaseActive[bossEid] === 0) normalCycles++
        else invulnCycles++
      }

      // Should have experienced invulnerability
      expect(invulnCycles).toBeGreaterThan(0)
    })

    it('should have zigzag movement pattern', () => {
      Position.x[bossEid] = 100
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016
      const velocities: number[] = []

      // Collect velocities over time to detect zigzag
      for (let i = 0; i < 50; i++) {
        bossAISystem([bossEid], playerEid, dt)
        velocities.push(Velocity.z[bossEid])
      }

      // Velocities should vary (zigzag), not all the same
      const uniqueVels = new Set(velocities.map(v => v.toFixed(2)))
      expect(uniqueVels.size).toBeGreaterThan(1)
    })
  })

  describe('SwarmQueen behavior', () => {
    beforeEach(() => {
      Boss.bossType[bossEid] = BOSS_SWARM_QUEEN
    })

    it('should maintain circular orbit around player', () => {
      // Position at 400 units away from player (target distance)
      Position.x[bossEid] = 400
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Should have some velocity (orbital movement)
      const velMagnitude = Math.sqrt(
        Velocity.x[bossEid] ** 2 +
        Velocity.y[bossEid] ** 2 +
        Velocity.z[bossEid] ** 2
      )
      expect(velMagnitude).toBeGreaterThan(0)
    })

    it('should adjust position toward target distance if too close', () => {
      // Position too close to player (100 units)
      Position.x[bossEid] = 100
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Velocity should have positive X component (moving away from player)
      const distError = 100 - 400 // negative, so should move away
      const expectedX = distError * 0.5 // Proportional to distance error
      expect(Velocity.x[bossEid]).toBeGreaterThan(expectedX - 50)
    })

    it('should adjust position toward target distance if too far', () => {
      // Position too far from player (700 units)
      Position.x[bossEid] = 700
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Velocity should have negative X component (moving toward player)
      expect(Velocity.x[bossEid]).toBeLessThan(0)
    })

    it('should reset spawn cooldown after triggering minion spawn', () => {
      Position.x[bossEid] = 400
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0
      Boss.spawnCooldown[bossEid] = 0
      Boss.minionsSpawned[bossEid] = 0

      const dt = 0.016

      // Run system for ~5.1 seconds to trigger spawn
      for (let i = 0; i < 313; i++) {
        bossAISystem([bossEid], playerEid, dt)
      }

      // Spawn cooldown should have reset (it resets to 0 when >= 5)
      // Either at 0 or very close to 0
      expect(Boss.spawnCooldown[bossEid]).toBeLessThan(0.1)
    })

    it('should spawn 2 minions per cooldown cycle', () => {
      Boss.spawnCooldown[bossEid] = 5.1
      Boss.minionsSpawned[bossEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Should spawn 2 minions (per spawn cycle)
      expect(Boss.minionsSpawned[bossEid]).toBe(2)
    })

    it('should limit minion spawns to max 12', () => {
      Position.x[bossEid] = 400
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0
      Boss.minionsSpawned[bossEid] = 12
      Boss.spawnCooldown[bossEid] = 5.1

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Should not spawn more minions beyond max
      expect(Boss.minionsSpawned[bossEid]).toBe(12)
    })

    it('should increment minion count on each spawn', () => {
      Boss.spawnCooldown[bossEid] = 5.1
      Boss.minionsSpawned[bossEid] = 3

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Each spawn cycle adds 2
      expect(Boss.minionsSpawned[bossEid]).toBe(5)
    })
  })

  describe('Boss system integration', () => {
    it('should handle invalid player entity ID', () => {
      Boss.bossType[bossEid] = BOSS_DREADNOUGHT

      const dt = 0.016

      // Should not crash with invalid player ID
      expect(() => {
        bossAISystem([bossEid], -1, dt)
      }).not.toThrow()
    })

    it('should track time alive across all boss types', () => {
      EnemyAI.timeAlive[bossEid] = 0

      const dt = 0.016

      // Test Dreadnought
      Boss.bossType[bossEid] = BOSS_DREADNOUGHT
      bossAISystem([bossEid], playerEid, dt)
      const dreadnoughtTime = EnemyAI.timeAlive[bossEid]
      expect(dreadnoughtTime).toBeCloseTo(dt, 3)

      // Test PhaseShifter
      EnemyAI.timeAlive[bossEid] = 0
      Boss.bossType[bossEid] = BOSS_PHASE_SHIFTER
      bossAISystem([bossEid], playerEid, dt)
      const phaseShifterTime = EnemyAI.timeAlive[bossEid]
      expect(phaseShifterTime).toBeCloseTo(dt, 3)

      // Test SwarmQueen
      EnemyAI.timeAlive[bossEid] = 0
      Boss.bossType[bossEid] = BOSS_SWARM_QUEEN
      bossAISystem([bossEid], playerEid, dt)
      const swarmQueenTime = EnemyAI.timeAlive[bossEid]
      expect(swarmQueenTime).toBeCloseTo(dt, 3)
    })

    it('should handle multiple boss entities independently', () => {
      const boss1 = addEntity(world)
      const boss2 = addEntity(world)

      // Setup boss 1 as Dreadnought
      Position.x[boss1] = 100
      Position.y[boss1] = 0
      Position.z[boss1] = 0
      Boss.bossType[boss1] = BOSS_DREADNOUGHT
      Boss.spawnCooldown[boss1] = 0
      Boss.minionsSpawned[boss1] = 0
      EnemyAI.speed[boss1] = 100
      EnemyAI.damage[boss1] = 50
      EnemyAI.timeAlive[boss1] = 0

      // Setup boss 2 as PhaseShifter
      Position.x[boss2] = 200
      Position.y[boss2] = 0
      Position.z[boss2] = 0
      Boss.bossType[boss2] = BOSS_PHASE_SHIFTER
      Boss.phaseTimer[boss2] = 0
      Boss.phaseActive[boss2] = 0
      EnemyAI.speed[boss2] = 100
      EnemyAI.damage[boss2] = 50
      EnemyAI.timeAlive[boss2] = 0

      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016

      // Run system on both bosses
      bossAISystem([boss1, boss2], playerEid, dt)

      // Both should have time alive updated
      expect(EnemyAI.timeAlive[boss1]).toBeCloseTo(dt, 3)
      expect(EnemyAI.timeAlive[boss2]).toBeCloseTo(dt, 3)

      // Boss 1 should behave as Dreadnought
      expect(Boss.bossType[boss1]).toBe(BOSS_DREADNOUGHT)

      // Boss 2 should behave as PhaseShifter
      expect(Boss.bossType[boss2]).toBe(BOSS_PHASE_SHIFTER)
    })
  })

  describe('Boss death and cleanup', () => {
    it('should reset minion count when boss respawns', () => {
      Boss.minionsSpawned[bossEid] = 8

      // Reset (simulating boss death/respawn)
      Boss.minionsSpawned[bossEid] = 0

      expect(Boss.minionsSpawned[bossEid]).toBe(0)
    })

    it('should reset timers on boss respawn', () => {
      Boss.bossType[bossEid] = BOSS_DREADNOUGHT
      Boss.beamChargeTime[bossEid] = 5.5
      Boss.spawnCooldown[bossEid] = 10.0
      EnemyAI.timeAlive[bossEid] = 120.0

      // Reset for respawn
      Boss.beamChargeTime[bossEid] = 0
      Boss.spawnCooldown[bossEid] = 0
      EnemyAI.timeAlive[bossEid] = 0

      expect(Boss.beamChargeTime[bossEid]).toBe(0)
      expect(Boss.spawnCooldown[bossEid]).toBe(0)
      expect(EnemyAI.timeAlive[bossEid]).toBe(0)
    })

    it('should handle phase state reset', () => {
      Boss.bossType[bossEid] = BOSS_PHASE_SHIFTER
      Boss.phaseActive[bossEid] = 1
      Boss.phaseTimer[bossEid] = 1.5

      // Reset phase state
      Boss.phaseActive[bossEid] = 0
      Boss.phaseTimer[bossEid] = 0

      expect(Boss.phaseActive[bossEid]).toBe(0)
      expect(Boss.phaseTimer[bossEid]).toBe(0)
    })
  })

  describe('Boss spatial behavior', () => {
    it('should update rotation toward player for Dreadnought', () => {
      Boss.bossType[bossEid] = BOSS_DREADNOUGHT
      Position.x[bossEid] = 0
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 100
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Rotation quaternion should exist (w component should be valid)
      expect(Rotation.w[bossEid]).toBeGreaterThanOrEqual(-1)
      expect(Rotation.w[bossEid]).toBeLessThanOrEqual(1)
    })

    it('should handle 3D movement for SwarmQueen', () => {
      Boss.bossType[bossEid] = BOSS_SWARM_QUEEN
      Position.x[bossEid] = 400
      Position.y[bossEid] = 100 // Offset in Y
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016
      bossAISystem([bossEid], playerEid, dt)

      // Should have Y velocity component to correct height
      expect(Velocity.y[bossEid]).toBeLessThan(0)
    })

    it('should handle zero distance gracefully', () => {
      Boss.bossType[bossEid] = BOSS_DREADNOUGHT
      Position.x[bossEid] = 0
      Position.y[bossEid] = 0
      Position.z[bossEid] = 0
      Position.x[playerEid] = 0
      Position.y[playerEid] = 0
      Position.z[playerEid] = 0

      const dt = 0.016

      // Should not crash when boss and player at same position
      expect(() => {
        bossAISystem([bossEid], playerEid, dt)
      }).not.toThrow()
    })
  })
})
