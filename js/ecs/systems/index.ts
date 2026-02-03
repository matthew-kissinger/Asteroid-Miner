/**
 * ECS Systems Index
 *
 * Re-exports all game systems for easy importing.
 */

// Physics system
export {
  physicsSystem,
  applyThrustSystem,
  applyDragSystem,
  integratePositionSystem,
  collisionSystem,
} from './physicsSystem'

// Render sync system
export {
  renderSyncSystem,
  createMeshRegistry,
  registerMesh,
  unregisterMesh,
  type MeshRegistry,
} from './renderSyncSystem'

// ECS Runner
export {
  initECS,
  updateECS,
  getMeshRegistry,
  addTrackedEntity,
  removeTrackedEntity,
} from './ecsRunner'
