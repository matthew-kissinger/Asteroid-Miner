/**
 * bitECS System Runner
 *
 * Integrates bitECS systems into the game loop.
 * Runs PARALLEL to legacy ECS - both systems execute each frame.
 */

import { Scene, BoxGeometry, MeshBasicMaterial, Mesh } from 'three'
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
  enemyPatrolSystem,
  enemyPursuitSystem,
  enemyEvadeSystem,
  enemySeparationSystem,
  difficultyScalingSystem,
  type DifficultyConfig,
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
  Health,
  Boss,
  Enemy,
} from '../components'
import { createGameEntity } from '../world'

// Track all bitECS entities
const entities: number[] = []

// Track entity categories for systems
const enemies: number[] = []
const projectiles: number[] = []
const asteroids: number[] = []
const planets: number[] = []
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
export function initECS(scene?: Scene): void {
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
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ color: 0x00ff00 })
    const mesh = new Mesh(geometry, material)
    scene.add(mesh)

    // Register mesh and link to entity
    const meshIndex = registerMesh(meshRegistry, mesh)
    MeshRef.meshIndex[testEntity] = meshIndex
    Renderable.visible[testEntity] = 1
    Renderable.castShadow[testEntity] = 0
    Renderable.receiveShadow[testEntity] = 0
  }

  // Add as enemy for testing radar/targeting
  addEnemy(testEntity)

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
    enemyPatrolSystem(enemies, deltaTime)
    enemyPursuitSystem(enemies, playerEntityId, deltaTime)
    enemyEvadeSystem(enemies, playerEntityId, deltaTime)
    enemySeparationSystem(enemies)

    // Build difficulty config from window.game (centralized dependency injection point)
    const diffConfig: DifficultyConfig = buildDifficultyConfig()
    difficultyScalingSystem(enemies, diffConfig)

    enemyCollisionAttackSystem(enemies, playerEntityId)
  }

  // 3. Combat systems
  if (projectiles.length > 0) {
    // Detect projectile-enemy collisions
    if (enemies.length > 0) {
      const collisionEvents = projectileCollisionSystem(projectiles, enemies)
      if (collisionEvents.length > 0) {
        damageApplicationSystem(collisionEvents)
      }
    }

    // Detect projectile-player collisions
    if (playerEntityId !== -1) {
      const playerHits = projectileCollisionSystem(projectiles, [playerEntityId])
      if (playerHits.length > 0) {
        damageApplicationSystem(playerHits)
        
        // Trigger player damage vibration
        if ((globalThis as any).mainMessageBus) {
          (globalThis as any).mainMessageBus.publish('input.vibrate', { intensity: 0.6, duration: 150 });
        }
      }
    }
  }

  // Shield regeneration for all entities with health
  if (entitiesWithHealth.length > 0) {
    shieldRegenSystem(entitiesWithHealth, deltaTime)
  }

  // Death system - check for entities with health <= 0
  const deadEntities: number[] = []
  for (const eid of entitiesWithHealth) {
    if (Health.current[eid] <= 0) {
      deadEntities.push(eid)
      
      // Publish events for achievements
      if ((globalThis as any).mainMessageBus) {
        // Check if this is a boss
        if (Boss.bossType[eid] !== undefined && Boss.bossType[eid] !== 0) {
          (globalThis as any).mainMessageBus.publish('boss.destroyed', { 
            bossType: Boss.bossType[eid] 
          })
        }
        
        // Check if this is an enemy
        if (Enemy.tag[eid] !== 0) {
          (globalThis as any).mainMessageBus.publish('enemy.destroyed', { 
            entityId: eid 
          })
        }
      }
    }
  }

  // Remove dead entities
  for (const eid of deadEntities) {
    removeTrackedEntity(eid)
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

  const asteroidIndex = asteroids.indexOf(eid)
  if (asteroidIndex !== -1) {
    asteroids.splice(asteroidIndex, 1)
  }

  const planetIndex = planets.indexOf(eid)
  if (planetIndex !== -1) {
    planets.splice(planetIndex, 1)
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
 * Add an entity to the asteroid category
 */
export function addAsteroid(eid: number): void {
  addTrackedEntity(eid)
  if (asteroids.indexOf(eid) === -1) {
    asteroids.push(eid)
  }
}

/**
 * Add an entity to the planet category
 */
export function addPlanet(eid: number): void {
  addTrackedEntity(eid)
  if (planets.indexOf(eid) === -1) {
    planets.push(eid)
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

/**
 * Get the enemies array (for external systems like UI)
 */
export function getEnemies(): number[] {
  return enemies
}

/**
 * Get the asteroids array (for external systems like UI)
 */
export function getAsteroids(): number[] {
  return asteroids
}

/**
 * Get the planets array (for external systems like UI)
 */
export function getPlanets(): number[] {
  return planets
}

/**
 * Get the player entity ID (for external systems like UI)
 */
export function getPlayerEntity(): number {
  return playerEntityId
}

/**
 * Build difficulty configuration from global game state
 *
 * Centralizes window.game access to a single location, making it easier
 * to transition away from global state in the future.
 *
 * @returns DifficultyConfig with values from window.game or sensible defaults
 */
function buildDifficultyConfig(): DifficultyConfig {
  // Default config
  const config: DifficultyConfig = {
    healthMultiplier: 1,
    damageMultiplier: 1,
    speedMultiplier: 1,
    isHordeMode: false,
    hordeSurvivalTime: 0,
  }

  // Attempt to read from window.game (may not exist in all contexts)
  if (typeof window !== 'undefined' && (window as any).game) {
    const game = (window as any).game

    config.isHordeMode = game.isHordeActive || false

    if (config.isHordeMode && game.hordeSurvivalTime !== undefined) {
      config.hordeSurvivalTime = game.hordeSurvivalTime / 1000 // Convert ms to seconds
    }

    // If difficulty manager exists, could extract more config here in future
    // config.difficultyLevel = game.difficultyManager?.level || 1
  }

  return config
}
