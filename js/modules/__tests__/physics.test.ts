import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { Physics } from '../physics'

// Mock message bus
vi.mock('../../globals/messageBus', () => ({
  mainMessageBus: {
    subscribe: vi.fn(),
    publish: vi.fn()
  }
}))

// Mock debug mode
vi.mock('../../globals/debug', () => ({
  DEBUG_MODE: { enabled: false }
}))

describe('Physics Module', () => {
  let scene: THREE.Scene
  let physics: Physics
  let mockSpaceship: any
  let mockCamera: THREE.PerspectiveCamera

  beforeEach(() => {
    scene = new THREE.Scene()
    physics = new Physics(scene)

    // Create mock spaceship
    mockSpaceship = {
      mesh: new THREE.Object3D(),
      velocity: new THREE.Vector3(0, 0, 0),
      thrust: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        boost: false
      },
      isDestroyed: false,
      isDocked: false,
      collisionResistance: 1,
      maxVelocity: 25,
      trailEffects: null,
      consumeFuel: vi.fn(() => true)
    }

    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    mockCamera.position.set(0, 0, 10)

    physics.setSpaceship(mockSpaceship)
    physics.setCamera(mockCamera)
  })

  describe('getMaxVelocity', () => {
    it('should return spaceship maxVelocity when available', () => {
      mockSpaceship.maxVelocity = 30
      expect(physics.getMaxVelocity()).toBe(30)
    })

    it('should return default MAX_VELOCITY when spaceship has no maxVelocity', () => {
      mockSpaceship.maxVelocity = undefined
      expect(physics.getMaxVelocity()).toBe(Physics.MAX_VELOCITY)
    })

    it('should return default when spaceship is null', () => {
      physics.setSpaceship(null as any)
      expect(physics.getMaxVelocity()).toBe(Physics.MAX_VELOCITY)
    })
  })

  describe('updateRotation', () => {
    it('should update rotation state based on mouse deltas', () => {
      const initialX = physics.rotationState.x
      const initialY = physics.rotationState.y

      physics.updateRotation(0.1, 0.05)

      expect(physics.rotationState.x).toBe(initialX - 0.1)
      expect(physics.rotationState.y).toBe(initialY - 0.05)
    })

    it('should accumulate multiple rotation updates', () => {
      physics.updateRotation(0.1, 0.1)
      physics.updateRotation(0.1, 0.1)

      expect(physics.rotationState.x).toBe(-0.2)
      expect(physics.rotationState.y).toBe(-0.2)
    })
  })

  describe('triggerShake', () => {
    it('should set shake intensity', () => {
      physics.triggerShake(0.5, 0.2)
      expect(physics.shakeIntensity).toBe(0.5)
    })

    it('should use maximum intensity when multiple shakes occur', () => {
      physics.triggerShake(0.3, 0.1)
      physics.triggerShake(0.7, 0.2)
      expect(physics.shakeIntensity).toBe(0.7)
    })

    it('should not reduce intensity if new shake is weaker', () => {
      physics.triggerShake(0.8, 0.3)
      physics.triggerShake(0.4, 0.1)
      expect(physics.shakeIntensity).toBe(0.8)
    })
  })

  describe('triggerRecoil', () => {
    it('should set recoil intensity and direction', () => {
      const direction = new THREE.Vector3(1, 0, 0)
      physics.triggerRecoil(0.5, direction)

      expect(physics.recoilIntensity).toBe(0.5)
      expect(physics.recoilDirection.x).toBe(-1) // Negated
      expect(physics.recoilDirection.y).toBeCloseTo(0) // Use toBeCloseTo for floating point
      expect(physics.recoilDirection.z).toBeCloseTo(0)
    })

    it('should reset recoil time on new recoil', () => {
      physics.recoilTime = 5
      physics.triggerRecoil(0.3, new THREE.Vector3(0, 1, 0))
      expect(physics.recoilTime).toBe(0)
    })

    it('should use maximum intensity for overlapping recoils', () => {
      physics.triggerRecoil(0.3, new THREE.Vector3(1, 0, 0))
      physics.triggerRecoil(0.6, new THREE.Vector3(0, 1, 0))
      expect(physics.recoilIntensity).toBe(0.6)
    })
  })

  describe('attemptCollisionRecovery', () => {
    it('should return false when spaceship has no collision resistance', () => {
      mockSpaceship.collisionResistance = 0
      expect(physics.attemptCollisionRecovery('asteroid')).toBe(false)
    })

    it('should have higher recovery chance for asteroids than planets', () => {
      mockSpaceship.collisionResistance = 2
      
      // Run multiple times to test probability
      const asteroidResults: boolean[] = []
      const planetResults: boolean[] = []
      
      for (let i = 0; i < 100; i++) {
        asteroidResults.push(physics.attemptCollisionRecovery('asteroid'))
        planetResults.push(physics.attemptCollisionRecovery('planet'))
      }
      
      const asteroidSuccessRate = asteroidResults.filter(r => r).length / 100
      const planetSuccessRate = planetResults.filter(r => r).length / 100
      
      // Asteroid should have ~58% (0.50 + 0.08), planet ~30% (0.1 + 0.2)
      expect(asteroidSuccessRate).toBeGreaterThan(planetSuccessRate)
    })

    it('should have very low recovery chance for sun collisions', () => {
      mockSpaceship.collisionResistance = 2
      
      const results: boolean[] = []
      for (let i = 0; i < 100; i++) {
        results.push(physics.attemptCollisionRecovery('sun'))
      }
      
      const successRate = results.filter(r => r).length / 100
      
      // Sun should have ~5% (0.05 * 1) with resistance 2
      expect(successRate).toBeLessThan(0.15)
    })

    it('should increase recovery chance with higher collision resistance', () => {
      const lowResistance = { ...mockSpaceship, collisionResistance: 1 }
      const highResistance = { ...mockSpaceship, collisionResistance: 5 }
      
      physics.setSpaceship(lowResistance)
      const lowResults: boolean[] = []
      for (let i = 0; i < 100; i++) {
        lowResults.push(physics.attemptCollisionRecovery('asteroid'))
      }
      
      physics.setSpaceship(highResistance)
      const highResults: boolean[] = []
      for (let i = 0; i < 100; i++) {
        highResults.push(physics.attemptCollisionRecovery('asteroid'))
      }
      
      const lowRate = lowResults.filter(r => r).length / 100
      const highRate = highResults.filter(r => r).length / 100
      
      expect(highRate).toBeGreaterThan(lowRate)
    })
  })

  describe('update - thrust and velocity', () => {
    it('should not update when spaceship is destroyed', () => {
      mockSpaceship.isDestroyed = true
      const initialVelocity = mockSpaceship.velocity.clone()
      
      physics.update(0.016)
      
      expect(mockSpaceship.velocity.equals(initialVelocity)).toBe(true)
    })

    it('should not update when spaceship is docked', () => {
      mockSpaceship.isDocked = true
      const initialVelocity = mockSpaceship.velocity.clone()
      
      physics.update(0.016)
      
      expect(mockSpaceship.velocity.equals(initialVelocity)).toBe(true)
    })

    it('should apply forward thrust when thrust.forward is true', () => {
      mockSpaceship.thrust.forward = true
      
      physics.update(0.016)
      
      // Velocity should increase in negative Z direction (forward)
      expect(mockSpaceship.velocity.z).toBeLessThan(0)
    })

    it('should apply backward thrust when thrust.backward is true', () => {
      mockSpaceship.thrust.backward = true
      
      physics.update(0.016)
      
      // Velocity should increase in positive Z direction (backward)
      expect(mockSpaceship.velocity.z).toBeGreaterThan(0)
    })

    it('should apply left strafe when thrust.left is true', () => {
      mockSpaceship.thrust.left = true
      
      physics.update(0.016)
      
      // Velocity should increase in negative X direction (left)
      expect(mockSpaceship.velocity.x).toBeLessThan(0)
    })

    it('should apply right strafe when thrust.right is true', () => {
      mockSpaceship.thrust.right = true
      
      physics.update(0.016)
      
      // Velocity should increase in positive X direction (right)
      expect(mockSpaceship.velocity.x).toBeGreaterThan(0)
    })

    it('should apply boost multiplier when boost is active', () => {
      mockSpaceship.thrust.forward = true
      physics.update(0.016)
      const normalVelocity = mockSpaceship.velocity.length()
      
      // Reset
      mockSpaceship.velocity.set(0, 0, 0)
      mockSpaceship.thrust.boost = true
      physics.update(0.016)
      const boostedVelocity = mockSpaceship.velocity.length()
      
      expect(boostedVelocity).toBeGreaterThan(normalVelocity)
    })

    it('should cap velocity at maxVelocity', () => {
      mockSpaceship.maxVelocity = 10
      mockSpaceship.thrust.forward = true
      
      // Apply thrust many times
      for (let i = 0; i < 100; i++) {
        physics.update(0.016)
      }
      
      expect(mockSpaceship.velocity.length()).toBeLessThanOrEqual(10.1)
    })

    it('should apply friction when not thrusting', () => {
      mockSpaceship.velocity.set(5, 0, 0)
      
      physics.update(0.016)
      
      // Velocity should decrease due to friction
      expect(mockSpaceship.velocity.x).toBeLessThan(5)
      expect(mockSpaceship.velocity.x).toBeGreaterThan(0)
    })

    it('should update position based on velocity', () => {
      mockSpaceship.velocity.set(10, 0, 0)
      const initialX = mockSpaceship.mesh.position.x
      
      physics.update(0.016)
      
      expect(mockSpaceship.mesh.position.x).toBeGreaterThan(initialX)
    })

    it('should not apply thrust when out of fuel', () => {
      mockSpaceship.consumeFuel = vi.fn(() => false)
      mockSpaceship.thrust.forward = true
      
      physics.update(0.016)
      
      // Velocity should remain zero
      expect(mockSpaceship.velocity.length()).toBe(0)
    })
  })

  describe('updateShipRotation', () => {
    it('should clamp Y rotation to prevent flipping', () => {
      physics.rotationState.y = Math.PI // 180 degrees
      
      physics.updateShipRotation()
      
      const maxY = Math.PI * 0.45
      expect(physics.rotationState.y).toBeLessThanOrEqual(maxY)
    })

    it('should clamp negative Y rotation', () => {
      physics.rotationState.y = -Math.PI
      
      physics.updateShipRotation()
      
      const maxY = Math.PI * 0.45
      expect(physics.rotationState.y).toBeGreaterThanOrEqual(-maxY)
    })
  })

  describe('camera shake decay', () => {
    it('should decay shake intensity over time', () => {
      physics.triggerShake(1.0, 0.5)
      const initialIntensity = physics.shakeIntensity
      
      // Simulate multiple frames
      for (let i = 0; i < 10; i++) {
        physics.update(0.016)
      }
      
      expect(physics.shakeIntensity).toBeLessThan(initialIntensity)
    })

    it('should stop shake when intensity is negligible', () => {
      physics.triggerShake(0.02, 0.1)
      
      // Run enough frames to decay
      for (let i = 0; i < 50; i++) {
        physics.update(0.016)
      }
      
      expect(physics.shakeIntensity).toBe(0)
    })
  })

  describe('camera recoil decay', () => {
    it('should decay recoil intensity over time', () => {
      physics.triggerRecoil(1.0, new THREE.Vector3(1, 0, 0))
      const initialIntensity = physics.recoilIntensity
      
      // Simulate multiple frames
      for (let i = 0; i < 10; i++) {
        physics.update(0.016)
      }
      
      expect(physics.recoilIntensity).toBeLessThan(initialIntensity)
    })

    it('should stop recoil when intensity is negligible', () => {
      physics.triggerRecoil(0.02, new THREE.Vector3(0, 1, 0))
      
      // Run enough frames to decay
      for (let i = 0; i < 50; i++) {
        physics.update(0.016)
      }
      
      expect(physics.recoilIntensity).toBe(0)
      expect(physics.recoilTime).toBe(0)
    })
  })

  describe('camera zoom', () => {
    it('should set target zoom when boosting', () => {
      mockSpaceship.thrust.forward = true
      mockSpaceship.thrust.boost = true
      
      physics.update(0.016)
      
      expect(physics.targetZoom).toBe(Physics.ZOOM_BOOST_MULTIPLIER)
    })

    it('should reset target zoom when not boosting', () => {
      mockSpaceship.thrust.boost = false
      
      physics.update(0.016)
      
      expect(physics.targetZoom).toBe(1.0)
    })
  })

  describe('normalized delta time', () => {
    it('should normalize delta time to 60 FPS standard', () => {
      physics.update(0.016) // 60 FPS
      expect(physics.normalizedDeltaTime).toBeCloseTo(0.96, 1)
    })

    it('should handle variable frame rates', () => {
      physics.update(0.032) // 30 FPS
      expect(physics.normalizedDeltaTime).toBeCloseTo(1.92, 1)
      
      physics.update(0.008) // 120 FPS
      expect(physics.normalizedDeltaTime).toBeCloseTo(0.48, 1)
    })
  })
})
