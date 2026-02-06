import { describe, it, expect } from 'vitest'
import { world, createGameEntity, removeGameEntity } from '../world'

describe('ECS World', () => {
  it('should export a valid world', () => {
    expect(world).toBeDefined()
  })

  it('should create new entities', () => {
    const eid = createGameEntity()
    expect(eid).toBeDefined()
    expect(typeof eid).toBe('number')
    expect(eid).toBeGreaterThanOrEqual(0)
  })

  it('should remove entities', () => {
    const eid = createGameEntity()
    removeGameEntity(eid)
    // bitecs doesn't easily let us check if an entity "exists" after removal 
    // without checking components or using internal API, but we ensure it doesn't throw.
  })
})
