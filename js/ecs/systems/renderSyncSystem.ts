/**
 * Render Sync System
 *
 * Bridges bitECS component data to Three.js mesh transforms.
 * This keeps game logic (bitECS) decoupled from rendering (Three.js).
 *
 * Architecture:
 * - bitECS owns all game state (Position, Rotation, Scale)
 * - Three.js meshes are pure rendering artifacts
 * - MeshRef component maps entity ID -> mesh index
 * - Mesh registry maps mesh index -> THREE.Object3D
 */

import * as THREE from 'three'
import {
  Position,
  Rotation,
  Scale,
  MeshRef,
  Renderable,
} from '../components'

/**
 * Mesh registry
 *
 * Maps mesh index (from MeshRef.meshIndex[eid]) to Three.js Object3D.
 * This allows cache-friendly lookup without coupling ECS to Three.js.
 */
export type MeshRegistry = Map<number, THREE.Object3D>

/**
 * Sync ECS transform data to Three.js meshes
 *
 * Copies Position, Rotation, Scale from ECS components to mesh transforms.
 * Updates visibility based on Renderable component.
 *
 * @param entities - Array of entity IDs to sync
 * @param meshRegistry - Map of mesh indices to Three.js objects
 */
export function renderSyncSystem(
  entities: number[],
  meshRegistry: MeshRegistry
): void {
  for (const eid of entities) {
    // Skip entities without mesh reference
    if (!hasMeshRef(eid)) continue

    // Get mesh from registry
    const meshIndex = MeshRef.meshIndex[eid]
    const mesh = meshRegistry.get(meshIndex)

    if (!mesh) {
      // Mesh not found - might have been destroyed or not yet created
      continue
    }

    // Sync position
    if (hasPosition(eid)) {
      mesh.position.set(
        Position.x[eid],
        Position.y[eid],
        Position.z[eid]
      )
    }

    // Sync rotation (quaternion)
    if (hasRotation(eid)) {
      mesh.quaternion.set(
        Rotation.x[eid],
        Rotation.y[eid],
        Rotation.z[eid],
        Rotation.w[eid]
      )
    }

    // Sync scale
    if (hasScale(eid)) {
      mesh.scale.set(
        Scale.x[eid],
        Scale.y[eid],
        Scale.z[eid]
      )
    }

    // Sync visibility and shadow casting
    if (hasRenderable(eid)) {
      mesh.visible = Renderable.visible[eid] !== 0

      // Only set shadow properties if mesh supports them
      if ('castShadow' in mesh) {
        mesh.castShadow = Renderable.castShadow[eid] !== 0
      }
      if ('receiveShadow' in mesh) {
        mesh.receiveShadow = Renderable.receiveShadow[eid] !== 0
      }
    }
  }
}

/**
 * Create a mesh registry entry
 *
 * Helper to add a Three.js object to the registry and return its index.
 *
 * @param registry - Mesh registry
 * @param mesh - Three.js object to register
 * @returns Mesh index to store in MeshRef.meshIndex[eid]
 */
export function registerMesh(
  registry: MeshRegistry,
  mesh: THREE.Object3D
): number {
  // Find next available index
  let index = 0
  while (registry.has(index)) {
    index++
  }

  registry.set(index, mesh)
  return index
}

/**
 * Remove a mesh from the registry
 *
 * @param registry - Mesh registry
 * @param meshIndex - Index to remove
 */
export function unregisterMesh(
  registry: MeshRegistry,
  meshIndex: number
): void {
  registry.delete(meshIndex)
}

/**
 * Create a new mesh registry
 */
export function createMeshRegistry(): MeshRegistry {
  return new Map()
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Component existence checks
 *
 * Simple bounds check. For production, use explicit component tracking.
 */
function hasPosition(eid: number): boolean {
  return eid < Position.x.length
}

function hasRotation(eid: number): boolean {
  return eid < Rotation.x.length
}

function hasScale(eid: number): boolean {
  return eid < Scale.x.length
}

function hasMeshRef(eid: number): boolean {
  return eid < MeshRef.meshIndex.length
}

function hasRenderable(eid: number): boolean {
  return eid < Renderable.visible.length
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example integration into game loop:
 *
 * ```typescript
 * import { world } from './world'
 * import { physicsSystem } from './systems/physicsSystem'
 * import { renderSyncSystem, createMeshRegistry } from './systems/renderSyncSystem'
 *
 * const meshRegistry = createMeshRegistry()
 * const entities: number[] = [] // Track all entities
 *
 * function gameLoop(dt: number) {
 *   // Update game logic
 *   physicsSystem(entities, dt)
 *
 *   // Sync to render
 *   renderSyncSystem(entities, meshRegistry)
 *
 *   // Render Three.js scene
 *   renderer.render(scene, camera)
 * }
 * ```
 *
 * When creating an entity with a mesh:
 *
 * ```typescript
 * const eid = createGameEntity()
 *
 * // Set ECS components
 * Position.x[eid] = 0
 * Position.y[eid] = 0
 * Position.z[eid] = 0
 *
 * // Create Three.js mesh
 * const mesh = new THREE.Mesh(geometry, material)
 * scene.add(mesh)
 *
 * // Register mesh and link to entity
 * const meshIndex = registerMesh(meshRegistry, mesh)
 * MeshRef.meshIndex[eid] = meshIndex
 * Renderable.visible[eid] = 1
 * ```
 */
