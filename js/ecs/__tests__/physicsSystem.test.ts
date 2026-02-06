import { describe, it, expect, beforeEach } from 'vitest'
import { addEntity } from 'bitecs'
import { world } from '../world'
import { 
  Position, 
  Velocity, 
  Rigidbody,
  Force
} from '../components'
import { 
  physicsSystem, 
  integratePositionSystem,
  integrateForcesSystem
} from '../systems/physicsSystem'

describe('Physics System', () => {
  let eid: number

  beforeEach(() => {
    eid = addEntity(world)
    // Reset components for this entity
    Position.x[eid] = 0
    Position.y[eid] = 0
    Position.z[eid] = 0
    Velocity.x[eid] = 0
    Velocity.y[eid] = 0
    Velocity.z[eid] = 0
    Force.x[eid] = 0
    Force.y[eid] = 0
    Force.z[eid] = 0
    Rigidbody.mass[eid] = 1
    Rigidbody.drag[eid] = 0
    Rigidbody.isKinematic[eid] = 0
  })

  it('should integrate velocity into position', () => {
    // Setup initial state
    Position.x[eid] = 0
    Velocity.x[eid] = 10

    // Run system for 1 second
    integratePositionSystem([eid], 1.0)

    // Check result
    expect(Position.x[eid]).toBe(10)
  })

  it('should integrate forces into velocity', () => {
    // Setup F=ma
    // Force = 10, Mass = 2 => Acceleration = 5
    Rigidbody.mass[eid] = 2
    Force.x[eid] = 10
    
    // Run system for 1 second
    integrateForcesSystem([eid], 1.0)

    // Check result (v = at)
    expect(Velocity.x[eid]).toBe(5)
    
    // Forces should be cleared
    expect(Force.x[eid]).toBe(0)
  })

  it('should run full physics system without crashing', () => {
    physicsSystem([eid], 0.016)
    // Pass if no error thrown
  })
})
