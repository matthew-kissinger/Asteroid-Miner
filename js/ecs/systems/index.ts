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

// Combat systems
export {
  projectileCollisionSystem,
  damageApplicationSystem,
  shieldRegenSystem,
  lifetimeSystem,
  type CollisionEvent,
} from './combatSystem'

// ECS Runner
export {
  initECS,
  updateECS,
  getMeshRegistry,
  addTrackedEntity,
  removeTrackedEntity,
} from './ecsRunner'

// Enemy AI system
export {
  enemyDetectionSystem,
  enemyPursuitSystem,
  enemySeparationSystem,
  difficultyScalingSystem,
  enemyCollisionAttackSystem,
} from './enemyAISystem'
