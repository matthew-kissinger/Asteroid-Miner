/**
 * bitECS System Runner
 *
 * Integrates bitECS systems into the game loop.
 * Runs PARALLEL to legacy ECS - both systems execute each frame.
 */

import * as THREE from 'three'
import {
  applyThrustSystem,
  applyDragSystem,
  integratePositionSystem,
  collisionSystem,
  renderSyncSystem,
  createMeshRegistry,
  registerMesh,
  type MeshRegistry,
  enemyDetectionSystem,
  enemyPursuitSystem,
  enemySeparationSystem,
  difficultyScalingSystem,
  enemyCollisionAttackSystem,
  projectileCollisionSystem,
  damageApplicationSystem,
  shieldRegenSystem,
  lifetimeSystem,
} from './index'
import {
  Position,
  Velocity,
  Rotation,
  Scale,
  MeshRef,
  Renderable,
} from '../components'
import { createGameEntity } from '../world'

// Track all bitECS entities
const entities: number[] = []

// Track entity categories for systems
const enemies: number[] = []
const projectiles: number[] = []
const entitiesWithHealth: number[] = []

// Track player entity (if any)
let playerEntityId = -1

// Track game time for difficulty scaling
let gameTime = 0

// Mesh registry for render sync
let meshRegistry: MeshRegistry | null = null

/**
 * Initialize bitECS systems
 *
 * Creates the mesh registry and a test entity to verify integration.
 * This test entity has a small velocity and should move across the screen.
 */
export function initECS(scene?: THREE.Scene): void {
  // Create mesh registry
  meshRegistry = createMeshRegistry()

  // Create test entity to validate the integration
  const testEntity = createGameEntity()
  entities.push(testEntity)

  // Set position at origin
  Position.x[testEntity] = 0
  Position.y[testEntity] = 5
  Position.z[testEntity] = 0

  // Give it a small velocity (should drift slowly)
  Velocity.x[testEntity] = 0.5
  Velocity.y[testEntity] = 0
  Velocity.z[testEntity] = 0

  // Set rotation to identity quaternion
  Rotation.x[testEntity] = 0
  Rotation.y[testEntity] = 0
  Rotation.z[testEntity] = 0
  Rotation.w[testEntity] = 1

  // Set scale
  Scale.x[testEntity] = 1
  Scale.y[testEntity] = 1
  Scale.z[testEntity] = 1

  // Create a simple test mesh (bright green cube)
  if (scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Register mesh and link to entity
    const meshIndex = registerMesh(meshRegistry, mesh)
    MeshRef.meshIndex[testEntity] = meshIndex
    Renderable.visible[testEntity] = 1
    Renderable.castShadow[testEntity] = 0
    Renderable.receiveShadow[testEntity] = 0
  }

  console.log('[bitECS] Initialized - test entity created')
}

/**
 * Update bitECS systems
 *
 * Runs all bitECS systems in order:
 * 1. Physics systems (thrust, drag, integration)
 * 2. AI systems (detection, pursuit, separation, difficulty, collision attack)
 * 3. Combat systems (projectile collision, damage, shield regen, lifetime)
 * 4. Collision system (general collision detection)
 * 5. Render sync (ECS -> Three.js)
 *
 * @param deltaTime - Time step in seconds
 */
export function updateECS(deltaTime: number): void {
  if (!meshRegistry) {
    console.error('[bitECS] updateECS called before initECS')
    return
  }

  // Skip if no entities
  if (entities.length === 0) return

  // Update game time
  gameTime += deltaTime

  // 1. Physics systems
  applyThrustSystem(entities, deltaTime)
  applyDragSystem(entities, deltaTime)
  integratePositionSystem(entities, deltaTime)

  // 2. Enemy AI systems
  if (enemies.length > 0) {
    enemyDetectionSystem(enemies, playerEntityId)
    enemyPursuitSystem(enemies, playerEntityId, deltaTime)
    enemySeparationSystem(enemies)
    difficultyScalingSystem(enemies, gameTime)
    enemyCollisionAttackSystem(enemies, playerEntityId)
  }

  // 3. Combat systems
  if (projectiles.length > 0 && enemies.length > 0) {
    // Detect projectile-enemy collisions
    const collisionEvents = projectileCollisionSystem(projectiles, enemies)

    // Apply damage from collisions
    if (collisionEvents.length > 0) {
      damageApplicationSystem(collisionEvents)
    }
  }

  // Shield regeneration for all entities with health
  if (entitiesWithHealth.length > 0) {
    shieldRegenSystem(entitiesWithHealth, deltaTime)
  }

  // Lifetime system for all entities (returns expired IDs)
  const expiredEntities = lifetimeSystem(entities, deltaTime)

  // Clean up expired entities
  for (const eid of expiredEntities) {
    removeTrackedEntity(eid)
    // TODO: Trigger cleanup/removal from scene when entity management is integrated
  }

  // 4. General collision system
  collisionSystem(entities)

  // 5. Sync ECS data to Three.js meshes (must be last)
  renderSyncSystem(entities, meshRegistry)
}

/**
 * Get the mesh registry (for external entity creation)
 */
export function getMeshRegistry(): MeshRegistry | null {
  return meshRegistry
}

/**
 * Add an entity to the tracked list
 */
export function addTrackedEntity(eid: number): void {
  if (entities.indexOf(eid) === -1) {
    entities.push(eid)
  }
}

/**
 * Remove an entity from the tracked list and all category lists
 */
export function removeTrackedEntity(eid: number): void {
  // Remove from main entities list
  const index = entities.indexOf(eid)
  if (index !== -1) {
    entities.splice(index, 1)
  }

  // Remove from category lists
  const enemyIndex = enemies.indexOf(eid)
  if (enemyIndex !== -1) {
    enemies.splice(enemyIndex, 1)
  }

  const projectileIndex = projectiles.indexOf(eid)
  if (projectileIndex !== -1) {
    projectiles.splice(projectileIndex, 1)
  }

  const healthIndex = entitiesWithHealth.indexOf(eid)
  if (healthIndex !== -1) {
    entitiesWithHealth.splice(healthIndex, 1)
  }

  // Clear player reference if it's the player
  if (eid === playerEntityId) {
    playerEntityId = -1
  }
}

/**
 * Add an entity to the enemy category
 */
export function addEnemy(eid: number): void {
  addTrackedEntity(eid)
  if (enemies.indexOf(eid) === -1) {
    enemies.push(eid)
  }
}

/**
 * Add an entity to the projectile category
 */
export function addProjectile(eid: number): void {
  addTrackedEntity(eid)
  if (projectiles.indexOf(eid) === -1) {
    projectiles.push(eid)
  }
}

/**
 * Add an entity to the health category
 */
export function addEntityWithHealth(eid: number): void {
  addTrackedEntity(eid)
  if (entitiesWithHealth.indexOf(eid) === -1) {
    entitiesWithHealth.push(eid)
  }
}

/**
 * Set the player entity ID
 */
export function setPlayerEntity(eid: number): void {
  playerEntityId = eid
  addTrackedEntity(eid)
  addEntityWithHealth(eid)
}
