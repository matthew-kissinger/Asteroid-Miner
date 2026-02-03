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
 * 1. Physics systems (thrust, drag, integration, collision)
 * 2. Render sync (ECS -> Three.js)
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

  // Run physics systems
  applyThrustSystem(entities, deltaTime)
  applyDragSystem(entities, deltaTime)
  integratePositionSystem(entities, deltaTime)
  collisionSystem(entities)

  // Sync ECS data to Three.js meshes
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
 * Remove an entity from the tracked list
 */
export function removeTrackedEntity(eid: number): void {
  const index = entities.indexOf(eid)
  if (index !== -1) {
    entities.splice(index, 1)
  }
}
