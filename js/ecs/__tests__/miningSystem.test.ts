import { describe, it, expect, beforeEach } from 'vitest'
import { addEntity } from 'bitecs'
import { world } from '../world'
import {
  Position,
  MiningLaser,
  Mineable,
  Cargo,
} from '../components'
import {
  miningDetectionSystem,
  miningProgressSystem,
  miningExtractionSystem,
  deactivateMiningLaser,
  ResourceType,
} from '../systems/miningSystem'

describe('Mining System', () => {
  let minerEid: number
  let asteroidEid1: number
  let asteroidEid2: number

  beforeEach(() => {
    minerEid = addEntity(world)
    asteroidEid1 = addEntity(world)
    asteroidEid2 = addEntity(world)

    // Setup miner
    Position.x[minerEid] = 0
    Position.y[minerEid] = 0
    Position.z[minerEid] = 0
    MiningLaser.active[minerEid] = 0
    MiningLaser.targetEntity[minerEid] = 0
    MiningLaser.progress[minerEid] = 0
    MiningLaser.range[minerEid] = 6000
    MiningLaser.ironRate[minerEid] = 0.133
    MiningLaser.goldRate[minerEid] = 0.044
    MiningLaser.platinumRate[minerEid] = 0.022
    MiningLaser.power[minerEid] = 1.0
    Cargo.maxCapacity[minerEid] = 1000
    Cargo.usedCapacity[minerEid] = 0
    Cargo.iron[minerEid] = 0
    Cargo.gold[minerEid] = 0
    Cargo.platinum[minerEid] = 0

    // Setup asteroid 1 (close, iron)
    Position.x[asteroidEid1] = 1000
    Position.y[asteroidEid1] = 0
    Position.z[asteroidEid1] = 0
    Mineable.resourceType[asteroidEid1] = ResourceType.Iron
    Mineable.remainingAmount[asteroidEid1] = 100
    Mineable.miningDifficulty[asteroidEid1] = 1.0
    Mineable.beingMined[asteroidEid1] = 0

    // Setup asteroid 2 (far, gold)
    Position.x[asteroidEid2] = 10000
    Position.y[asteroidEid2] = 0
    Position.z[asteroidEid2] = 0
    Mineable.resourceType[asteroidEid2] = ResourceType.Gold
    Mineable.remainingAmount[asteroidEid2] = 50
    Mineable.miningDifficulty[asteroidEid2] = 1.0
    Mineable.beingMined[asteroidEid2] = 0
  })

  it('should detect closest target in range', () => {
    miningDetectionSystem([minerEid], [asteroidEid1, asteroidEid2])

    // Should target asteroid1 (closer, in range)
    expect(MiningLaser.targetEntity[minerEid]).toBe(asteroidEid1)
    expect(Mineable.beingMined[asteroidEid1]).toBe(1)
  })

  it('should ignore out-of-range targets', () => {
    // Move asteroid1 out of range
    Position.x[asteroidEid1] = 7000
    Position.y[asteroidEid1] = 0
    Position.z[asteroidEid1] = 0

    miningDetectionSystem([minerEid], [asteroidEid1, asteroidEid2])

    // Should not target anything (both out of range)
    expect(MiningLaser.targetEntity[minerEid]).toBe(0)
  })

  it('should advance mining progress over time', () => {
    // Setup: active mining, iron type
    MiningLaser.active[minerEid] = 1
    MiningLaser.targetEntity[minerEid] = asteroidEid1
    MiningLaser.progress[minerEid] = 0
    Mineable.resourceType[asteroidEid1] = ResourceType.Iron
    Mineable.miningDifficulty[asteroidEid1] = 1.0

    // Run for 1 second
    miningProgressSystem([minerEid], 1.0)

    // Iron rate is 0.133/sec, so progress should be ~0.133
    expect(MiningLaser.progress[minerEid]).toBeGreaterThan(0.1)
    expect(MiningLaser.progress[minerEid]).toBeLessThan(0.2)
  })

  it('should respect cargo capacity during extraction', () => {
    // Setup: mining complete, cargo almost full
    MiningLaser.active[minerEid] = 1
    MiningLaser.targetEntity[minerEid] = asteroidEid1
    MiningLaser.progress[minerEid] = 1.0
    Cargo.maxCapacity[minerEid] = 100
    Cargo.usedCapacity[minerEid] = 90 // Only 10 space left
    Mineable.remainingAmount[asteroidEid1] = 50 // Asteroid has 50

    miningExtractionSystem([minerEid])

    // Should only extract 10 (available space)
    expect(Cargo.iron[minerEid]).toBe(10)
    expect(Cargo.usedCapacity[minerEid]).toBe(100)
    expect(Mineable.remainingAmount[asteroidEid1]).toBe(40) // 50 - 10
  })

  it('should extract full amount when cargo has space', () => {
    // Setup: mining complete, cargo empty
    MiningLaser.active[minerEid] = 1
    MiningLaser.targetEntity[minerEid] = asteroidEid1
    MiningLaser.progress[minerEid] = 1.0
    Cargo.maxCapacity[minerEid] = 1000
    Cargo.usedCapacity[minerEid] = 0
    Mineable.remainingAmount[asteroidEid1] = 100

    miningExtractionSystem([minerEid])

    // Should extract full 100
    expect(Cargo.iron[minerEid]).toBe(100)
    expect(Cargo.usedCapacity[minerEid]).toBe(100)
    expect(Mineable.remainingAmount[asteroidEid1]).toBe(0)
  })

  it('should deactivate mining laser and clear state', () => {
    // Setup: active mining
    MiningLaser.active[minerEid] = 1
    MiningLaser.targetEntity[minerEid] = asteroidEid1
    MiningLaser.progress[minerEid] = 0.5
    Mineable.beingMined[asteroidEid1] = 1

    deactivateMiningLaser(minerEid)

    // Should clear all state
    expect(MiningLaser.active[minerEid]).toBe(0)
    expect(MiningLaser.progress[minerEid]).toBe(0)
    expect(Mineable.beingMined[asteroidEid1]).toBe(0)
    // Target entity may or may not be cleared depending on implementation
  })

  it('should handle different resource types correctly', () => {
    // Test gold extraction
    MiningLaser.active[minerEid] = 1
    MiningLaser.targetEntity[minerEid] = asteroidEid2
    MiningLaser.progress[minerEid] = 1.0
    Position.x[asteroidEid2] = 1000 // Move in range
    Mineable.resourceType[asteroidEid2] = ResourceType.Gold
    Mineable.remainingAmount[asteroidEid2] = 50
    Cargo.maxCapacity[minerEid] = 1000
    Cargo.usedCapacity[minerEid] = 0

    miningExtractionSystem([minerEid])

    // Should add to gold cargo
    expect(Cargo.gold[minerEid]).toBe(50)
    expect(Cargo.iron[minerEid]).toBe(0)
    expect(Cargo.platinum[minerEid]).toBe(0)
  })
})
