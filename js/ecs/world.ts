import { createWorld, addEntity, removeEntity } from 'bitecs'

// Create the game world
export const world = createWorld()

// Helper to create a new entity
export function createGameEntity() {
  return addEntity(world)
}

// Helper to remove an entity
export function removeGameEntity(eid: number) {
  return removeEntity(world, eid)
}
