import { describe, it, expect } from 'vitest'
import { addEntity } from 'bitecs'
import { world } from '../world'
import { Position, Health, Renderable } from '../components'

describe('ECS Components', () => {
  it('Position component should have x, y, z arrays', () => {
    expect(Position.x).toBeDefined()
    expect(Position.y).toBeDefined()
    expect(Position.z).toBeDefined()
    expect(Position.x).toBeInstanceOf(Float32Array)
  })

  it('Health component should have current and max arrays', () => {
    expect(Health.current).toBeDefined()
    expect(Health.max).toBeDefined()
    expect(Health.current).toBeInstanceOf(Float32Array)
  })

  it('should persist component values', () => {
    const eid = addEntity(world)
    
    // Set values
    Position.x[eid] = 100
    Position.y[eid] = 50
    Position.z[eid] = -25

    // Verify values
    expect(Position.x[eid]).toBe(100)
    expect(Position.y[eid]).toBe(50)
    expect(Position.z[eid]).toBe(-25)
  })

  it('should handle boolean-like flag components', () => {
    const eid = addEntity(world)
    
    Renderable.visible[eid] = 1
    Renderable.castShadow[eid] = 0

    expect(Renderable.visible[eid]).toBe(1)
    expect(Renderable.castShadow[eid]).toBe(0)
  })
})
