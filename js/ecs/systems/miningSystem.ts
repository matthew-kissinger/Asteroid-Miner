/**
 * Mining System
 *
 * Handles mining laser targeting, progress tracking, and resource extraction
 * for entities with MiningLaser and Mineable components.
 *
 * System flow:
 * 1. miningDetectionSystem - Detect valid mineable targets in range
 * 2. miningProgressSystem - Update mining progress for active lasers
 * 3. miningExtractionSystem - Extract resources when mining completes
 */

import {
  Position,
  MiningLaser,
  Mineable,
  Cargo,
} from '../components'

// Mining constants (from legacy miningSystem.ts)
const MINING_RANGE = 6000
const MINING_SPEED_IRON = 0.133 // 1/7.5 seconds (7.5s to complete)
const MINING_SPEED_GOLD = 0.044 // 1/22.5 seconds (22.5s to complete)
const MINING_SPEED_PLATINUM = 0.022 // 1/45 seconds (45s to complete)

// Resource type enum (matches Mineable.resourceType)
export enum ResourceType {
  Iron = 0,
  Gold = 1,
  Platinum = 2,
}

/**
 * Mining Detection System
 *
 * Finds the closest valid mineable target within range when the player
 * activates their mining laser.
 *
 * This system should be called when the player presses the mining key.
 * It sets MiningLaser.targetEntity to the closest asteroid in range.
 *
 * @param minerEntities - Entities with MiningLaser (typically just the player)
 * @param asteroidEntities - Entities with Mineable component (asteroids)
 */
export function miningDetectionSystem(
  minerEntities: number[],
  asteroidEntities: number[]
): void {
  for (const minerEid of minerEntities) {
    // Skip if entity doesn't have required components
    if (!hasMiningLaser(minerEid) || !hasPosition(minerEid)) continue

    // Skip if already mining
    if (MiningLaser.active[minerEid]) continue

    // Get mining range
    const range = MiningLaser.range[minerEid] || MINING_RANGE

    // Find closest mineable target in range
    let closestEid = 0
    let closestDistSq = range * range

    for (const asteroidEid of asteroidEntities) {
      if (!hasMineable(asteroidEid) || !hasPosition(asteroidEid)) continue

      // Skip if already being mined
      if (Mineable.beingMined[asteroidEid]) continue

      // Skip if depleted
      if (Mineable.remainingAmount[asteroidEid] <= 0) continue

      // Calculate distance
      const dx = Position.x[minerEid] - Position.x[asteroidEid]
      const dy = Position.y[minerEid] - Position.y[asteroidEid]
      const dz = Position.z[minerEid] - Position.z[asteroidEid]
      const distSq = dx * dx + dy * dy + dz * dz

      // Update closest if this is nearer
      if (distSq < closestDistSq) {
        closestEid = asteroidEid
        closestDistSq = distSq
      }
    }

    // If we found a target, set it
    if (closestEid > 0) {
      MiningLaser.targetEntity[minerEid] = closestEid
      Mineable.beingMined[closestEid] = 1
    }
  }
}

/**
 * Mining Progress System
 *
 * Updates mining progress for active mining lasers.
 * Mining speed depends on:
 * - Resource type (iron fastest, platinum slowest)
 * - Mining difficulty (from asteroid)
 * - Mining laser power (from miner's upgrade level)
 *
 * @param minerEntities - Entities with active MiningLaser
 * @param deltaTime - Time step in seconds
 */
export function miningProgressSystem(
  minerEntities: number[],
  deltaTime: number
): void {
  for (const minerEid of minerEntities) {
    if (!hasMiningLaser(minerEid) || !hasPosition(minerEid)) continue

    // Skip if laser is not active
    if (!MiningLaser.active[minerEid]) continue

    const targetEid = MiningLaser.targetEntity[minerEid]

    // Validate target
    if (targetEid === 0) {
      // No target - deactivate laser
      MiningLaser.active[minerEid] = 0
      continue
    }

    if (!hasMineable(targetEid) || !hasPosition(targetEid)) {
      // Invalid target - deactivate laser
      MiningLaser.active[minerEid] = 0
      MiningLaser.targetEntity[minerEid] = 0
      continue
    }

    // Check if target is depleted
    if (Mineable.remainingAmount[targetEid] <= 0) {
      // Target depleted - deactivate laser
      MiningLaser.active[minerEid] = 0
      MiningLaser.targetEntity[minerEid] = 0
      Mineable.beingMined[targetEid] = 0
      continue
    }

    // Check range
    const range = MiningLaser.range[minerEid] || MINING_RANGE
    const dx = Position.x[minerEid] - Position.x[targetEid]
    const dy = Position.y[minerEid] - Position.y[targetEid]
    const dz = Position.z[minerEid] - Position.z[targetEid]
    const distSq = dx * dx + dy * dy + dz * dz

    if (distSq > range * range) {
      // Out of range - deactivate laser
      MiningLaser.active[minerEid] = 0
      MiningLaser.targetEntity[minerEid] = 0
      Mineable.beingMined[targetEid] = 0
      continue
    }

    // Calculate mining rate based on resource type
    const resourceType = Mineable.resourceType[targetEid]
    let baseMiningRate = MINING_SPEED_IRON

    switch (resourceType) {
      case ResourceType.Iron:
        baseMiningRate = MiningLaser.ironRate[minerEid] || MINING_SPEED_IRON
        break
      case ResourceType.Gold:
        baseMiningRate = MiningLaser.goldRate[minerEid] || MINING_SPEED_GOLD
        break
      case ResourceType.Platinum:
        baseMiningRate =
          MiningLaser.platinumRate[minerEid] || MINING_SPEED_PLATINUM
        break
    }

    // Apply difficulty and power modifiers
    const difficulty = Mineable.miningDifficulty[targetEid] || 1.0
    const power = MiningLaser.power[minerEid] || 1.0
    const effectiveRate = (baseMiningRate * power) / difficulty

    // Update progress
    MiningLaser.progress[minerEid] += effectiveRate * deltaTime

    // Clamp progress to [0, 1]
    if (MiningLaser.progress[minerEid] > 1.0) {
      MiningLaser.progress[minerEid] = 1.0
    }
  }
}

/**
 * Mining Extraction System
 *
 * Extracts resources when mining progress reaches 100%.
 * - Adds resources to the miner's Cargo
 * - Depletes the asteroid's remaining resources
 * - Resets mining state
 *
 * @param minerEntities - Entities with MiningLaser
 * @returns Array of asteroid entity IDs that were fully depleted
 */
export function miningExtractionSystem(minerEntities: number[]): number[] {
  const depletedAsteroids: number[] = []

  for (const minerEid of minerEntities) {
    if (!hasMiningLaser(minerEid) || !hasCargo(minerEid)) continue

    // Skip if laser is not active
    if (!MiningLaser.active[minerEid]) continue

    // Check if mining is complete
    if (MiningLaser.progress[minerEid] < 1.0) continue

    const targetEid = MiningLaser.targetEntity[minerEid]

    // Validate target
    if (targetEid === 0 || !hasMineable(targetEid)) {
      // Invalid target - reset mining state
      MiningLaser.active[minerEid] = 0
      MiningLaser.progress[minerEid] = 0
      MiningLaser.targetEntity[minerEid] = 0
      continue
    }

    // Extract resources based on type
    const resourceType = Mineable.resourceType[targetEid]
    const extractionAmount = Mineable.remainingAmount[targetEid]

    // Check cargo capacity
    const currentCapacity = Cargo.usedCapacity[minerEid]
    const maxCapacity = Cargo.maxCapacity[minerEid]
    const availableSpace = maxCapacity - currentCapacity

    // Extract what we can fit
    const actualExtraction = Math.min(extractionAmount, availableSpace)

    if (actualExtraction > 0) {
      // Add to cargo based on resource type
      switch (resourceType) {
        case ResourceType.Iron:
          Cargo.iron[minerEid] += Math.floor(actualExtraction)
          break
        case ResourceType.Gold:
          Cargo.gold[minerEid] += Math.floor(actualExtraction)
          break
        case ResourceType.Platinum:
          Cargo.platinum[minerEid] += Math.floor(actualExtraction)
          break
      }

      // Update used capacity
      Cargo.usedCapacity[minerEid] += actualExtraction

      // Deplete asteroid
      Mineable.remainingAmount[targetEid] -= actualExtraction
    }

    // Check if asteroid is fully depleted
    if (Mineable.remainingAmount[targetEid] <= 0) {
      depletedAsteroids.push(targetEid)
      Mineable.beingMined[targetEid] = 0
    }

    // Reset mining state
    MiningLaser.active[minerEid] = 0
    MiningLaser.progress[minerEid] = 0
    MiningLaser.targetEntity[minerEid] = 0
  }

  return depletedAsteroids
}

/**
 * Mining Activation System
 *
 * Activates mining laser when player presses the mining key.
 * This should be called from input handling code when the user
 * wants to start mining.
 *
 * @param minerEid - Entity ID of the miner (typically player)
 */
export function activateMiningLaser(minerEid: number): void {
  if (!hasMiningLaser(minerEid)) return

  // Check if already mining
  if (MiningLaser.active[minerEid]) return

  // Check if we have a target
  const targetEid = MiningLaser.targetEntity[minerEid]
  if (targetEid === 0) return

  // Validate target
  if (!hasMineable(targetEid) || !hasPosition(targetEid)) {
    MiningLaser.targetEntity[minerEid] = 0
    return
  }

  // Check if target is depleted
  if (Mineable.remainingAmount[targetEid] <= 0) {
    MiningLaser.targetEntity[minerEid] = 0
    return
  }

  // Activate laser
  MiningLaser.active[minerEid] = 1
  MiningLaser.progress[minerEid] = 0
  Mineable.beingMined[targetEid] = 1
}

/**
 * Mining Deactivation System
 *
 * Deactivates mining laser when player releases the mining key.
 * This should be called from input handling code when the user
 * stops mining.
 *
 * @param minerEid - Entity ID of the miner (typically player)
 */
export function deactivateMiningLaser(minerEid: number): void {
  if (!hasMiningLaser(minerEid)) return

  // Get target before resetting
  const targetEid = MiningLaser.targetEntity[minerEid]

  // Deactivate laser
  MiningLaser.active[minerEid] = 0
  MiningLaser.progress[minerEid] = 0

  // Release target
  if (targetEid > 0 && hasMineable(targetEid)) {
    Mineable.beingMined[targetEid] = 0
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Component existence checks
 *
 * bitECS v0.4.0 doesn't have built-in component existence checks.
 * We check if the component data is within array bounds.
 */
function hasMiningLaser(eid: number): boolean {
  return eid < MiningLaser.active.length
}

function hasMineable(eid: number): boolean {
  return eid < Mineable.resourceType.length
}

function hasPosition(eid: number): boolean {
  return eid < Position.x.length
}

function hasCargo(eid: number): boolean {
  return eid < Cargo.iron.length
}
