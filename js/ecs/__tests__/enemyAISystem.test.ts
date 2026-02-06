import { describe, it, expect, beforeEach } from 'vitest'
import { addEntity } from 'bitecs'
import { world } from '../world'
import {
  Position,
  Velocity,
  EnemyAI,
  Health,
  SeparationForce,
  Collider,
} from '../components'
import {
  enemyDetectionSystem,
  enemyPursuitSystem,
  enemyEvadeSystem,
  enemySeparationSystem,
} from '../systems/enemyAISystem'

describe('Enemy AI System', () => {
  let enemyEid: number
  let playerEid: number
  let enemyEid2: number

  beforeEach(() => {
    enemyEid = addEntity(world)
    playerEid = addEntity(world)
    enemyEid2 = addEntity(world)

    // Setup enemy
    Position.x[enemyEid] = 0
    Position.y[enemyEid] = 0
    Position.z[enemyEid] = 0
    Velocity.x[enemyEid] = 0
    Velocity.y[enemyEid] = 0
    Velocity.z[enemyEid] = 0
    EnemyAI.state[enemyEid] = 0 // IDLE
    EnemyAI.detectionRange[enemyEid] = 1000
    EnemyAI.speed[enemyEid] = 100
    EnemyAI.subtype[enemyEid] = 0 // Standard
    EnemyAI.spiralAmplitude[enemyEid] = 50
    EnemyAI.spiralFrequency[enemyEid] = 1.0
    EnemyAI.spiralPhase[enemyEid] = 0
    EnemyAI.timeAlive[enemyEid] = 0
    EnemyAI.separationInfluence[enemyEid] = 0.5
    EnemyAI.playerFound[enemyEid] = 0
    EnemyAI.stateTimer[enemyEid] = 0
    Health.current[enemyEid] = 100
    Health.max[enemyEid] = 100
    Collider.radius[enemyEid] = 10
    SeparationForce.x[enemyEid] = 0
    SeparationForce.y[enemyEid] = 0
    SeparationForce.z[enemyEid] = 0

    // Setup player
    Position.x[playerEid] = 500
    Position.y[playerEid] = 0
    Position.z[playerEid] = 0

    // Setup enemy 2 (for separation tests)
    Position.x[enemyEid2] = 20
    Position.y[enemyEid2] = 0
    Position.z[enemyEid2] = 0
    Velocity.x[enemyEid2] = 0
    Velocity.y[enemyEid2] = 0
    Velocity.z[enemyEid2] = 0
    EnemyAI.state[enemyEid2] = 1 // PATROL
    EnemyAI.detectionRange[enemyEid2] = 1000
    EnemyAI.speed[enemyEid2] = 100
    EnemyAI.subtype[enemyEid2] = 0
    EnemyAI.spiralAmplitude[enemyEid2] = 50
    EnemyAI.spiralFrequency[enemyEid2] = 1.0
    EnemyAI.spiralPhase[enemyEid2] = 0
    EnemyAI.timeAlive[enemyEid2] = 0
    EnemyAI.separationInfluence[enemyEid2] = 0.5
    EnemyAI.playerFound[enemyEid2] = 0
    EnemyAI.stateTimer[enemyEid2] = 0
    Health.current[enemyEid2] = 100
    Health.max[enemyEid2] = 100
    Collider.radius[enemyEid2] = 10
    SeparationForce.x[enemyEid2] = 0
    SeparationForce.y[enemyEid2] = 0
    SeparationForce.z[enemyEid2] = 0
  })

  it('should transition from IDLE to PATROL', () => {
    // Enemy starts in IDLE state
    EnemyAI.state[enemyEid] = 0 // IDLE

    enemyDetectionSystem([enemyEid], -1) // No player

    // Should transition to PATROL
    expect(EnemyAI.state[enemyEid]).toBe(1) // PATROL
    expect(EnemyAI.spawnX[enemyEid]).toBe(0)
    expect(EnemyAI.spawnY[enemyEid]).toBe(0)
    expect(EnemyAI.spawnZ[enemyEid]).toBe(0)
  })

  it('should transition from PATROL to CHASE when player in range', () => {
    // Enemy in PATROL state
    EnemyAI.state[enemyEid] = 1 // PATROL
    Position.x[enemyEid] = 0
    Position.x[playerEid] = 500 // Within detection range (1000)

    enemyDetectionSystem([enemyEid], playerEid)

    // Should transition to CHASE
    expect(EnemyAI.state[enemyEid]).toBe(2) // CHASE
    expect(EnemyAI.playerFound[enemyEid]).toBe(1)
  })

  it('should transition from CHASE to EVADE when health low', () => {
    // Enemy in CHASE state with low health
    EnemyAI.state[enemyEid] = 2 // CHASE
    Health.current[enemyEid] = 20 // 20% of max (100)
    Health.max[enemyEid] = 100

    enemyPursuitSystem([enemyEid], playerEid, 0.016)

    // Should transition to EVADE (below 25% threshold)
    expect(EnemyAI.state[enemyEid]).toBe(3) // EVADE
  })

  it('should calculate pursuit direction toward player', () => {
    // Enemy at (0, 0, 0), player at (100, 0, 0)
    Position.x[enemyEid] = 0
    Position.y[enemyEid] = 0
    Position.z[enemyEid] = 0
    Position.x[playerEid] = 100
    Position.y[playerEid] = 0
    Position.z[playerEid] = 0

    EnemyAI.state[enemyEid] = 2 // CHASE
    Health.current[enemyEid] = 100 // Not low health
    EnemyAI.spiralAmplitude[enemyEid] = 0 // Disable spiral for this test

    enemyPursuitSystem([enemyEid], playerEid, 0.016)

    // Velocity should point toward player (positive X)
    expect(Velocity.x[enemyEid]).toBeGreaterThan(0)
    expect(Velocity.y[enemyEid]).toBeCloseTo(0, 2)
    expect(Velocity.z[enemyEid]).toBeCloseTo(0, 2)
  })

  it('should calculate separation force between nearby enemies', () => {
    // Two enemies close together
    Position.x[enemyEid] = 0
    Position.y[enemyEid] = 0
    Position.z[enemyEid] = 0
    Position.x[enemyEid2] = 20 // Within separation threshold (radius 10 * 2.5 = 25)
    Position.y[enemyEid2] = 0
    Position.z[enemyEid2] = 0

    enemySeparationSystem([enemyEid, enemyEid2])

    // Should have separation forces pushing them apart
    // enemyEid should have force pointing away from enemyEid2 (negative X)
    expect(SeparationForce.x[enemyEid]).toBeLessThan(0)
    // enemyEid2 should have force pointing away from enemyEid (positive X)
    expect(SeparationForce.x[enemyEid2]).toBeGreaterThan(0)
  })

  it('should transition from EVADE back to CHASE after timeout', () => {
    // Enemy in EVADE state, timer past threshold
    EnemyAI.state[enemyEid] = 3 // EVADE
    EnemyAI.stateTimer[enemyEid] = 3.1 // Past 3 second threshold

    enemyEvadeSystem([enemyEid], playerEid, 0.016)

    // Should transition back to CHASE
    expect(EnemyAI.state[enemyEid]).toBe(2) // CHASE
  })

  it('should transition from EVADE to CHASE when health recovered', () => {
    // Enemy in EVADE state, health recovered above 40%
    EnemyAI.state[enemyEid] = 3 // EVADE
    Health.current[enemyEid] = 50 // 50% of max (100)
    Health.max[enemyEid] = 100
    EnemyAI.stateTimer[enemyEid] = 1.0 // Not past timeout yet

    enemyEvadeSystem([enemyEid], playerEid, 0.016)

    // Should transition back to CHASE due to health recovery
    expect(EnemyAI.state[enemyEid]).toBe(2) // CHASE
  })
})
