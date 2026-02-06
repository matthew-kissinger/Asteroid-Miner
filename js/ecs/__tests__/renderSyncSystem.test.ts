import { describe, it, expect, beforeEach, vi } from 'vitest'
import { addEntity } from 'bitecs'
import { world } from '../world'
import {
  Position,
  Rotation,
  Scale,
  MeshRef,
  Renderable,
} from '../components'
import {
  renderSyncSystem,
  registerMesh,
  unregisterMesh,
  createMeshRegistry,
  type MeshRegistry,
} from '../systems/renderSyncSystem'

// Mock Three.js Object3D
interface MockObject3D {
  position: { x: number; y: number; z: number }
  quaternion: { x: number; y: number; z: number; w: number }
  scale: { x: number; y: number; z: number }
  visible: boolean
  castShadow?: boolean
  receiveShadow?: boolean
}

function createMockMesh(): MockObject3D {
  return {
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    castShadow: false,
    receiveShadow: false,
  }
}

describe('Render Sync System', () => {
  let eid: number
  let meshRegistry: MeshRegistry
  let mockMesh: MockObject3D

  beforeEach(() => {
    eid = addEntity(world)
    meshRegistry = createMeshRegistry()
    mockMesh = createMockMesh()

    // Reset components for this entity
    Position.x[eid] = 0
    Position.y[eid] = 0
    Position.z[eid] = 0
    Rotation.x[eid] = 0
    Rotation.y[eid] = 0
    Rotation.z[eid] = 0
    Rotation.w[eid] = 1
    Scale.x[eid] = 1
    Scale.y[eid] = 1
    Scale.z[eid] = 1
    MeshRef.meshIndex[eid] = 0
    Renderable.visible[eid] = 1
    Renderable.castShadow[eid] = 0
    Renderable.receiveShadow[eid] = 0
  })

  describe('Mesh Registry', () => {
    it('should create an empty mesh registry', () => {
      const registry = createMeshRegistry()
      expect(registry.size).toBe(0)
    })

    it('should register a mesh and return index', () => {
      const mesh = createMockMesh()
      const index = registerMesh(meshRegistry, mesh as any)

      expect(index).toBe(0)
      expect(meshRegistry.get(index)).toBe(mesh)
    })

    it('should register multiple meshes with sequential indices', () => {
      const mesh1 = createMockMesh()
      const mesh2 = createMockMesh()
      const mesh3 = createMockMesh()

      const index1 = registerMesh(meshRegistry, mesh1 as any)
      const index2 = registerMesh(meshRegistry, mesh2 as any)
      const index3 = registerMesh(meshRegistry, mesh3 as any)

      expect(index1).toBe(0)
      expect(index2).toBe(1)
      expect(index3).toBe(2)
      expect(meshRegistry.size).toBe(3)
    })

    it('should unregister a mesh', () => {
      const mesh = createMockMesh()
      const index = registerMesh(meshRegistry, mesh as any)

      unregisterMesh(meshRegistry, index)

      expect(meshRegistry.has(index)).toBe(false)
    })

    it('should reuse indices after unregistering', () => {
      const mesh1 = createMockMesh()
      const mesh2 = createMockMesh()
      const mesh3 = createMockMesh()

      const index1 = registerMesh(meshRegistry, mesh1 as any)
      const index2 = registerMesh(meshRegistry, mesh2 as any)

      // Unregister first mesh
      unregisterMesh(meshRegistry, index1)

      // Next registration should reuse index 0
      const index3 = registerMesh(meshRegistry, mesh3 as any)
      expect(index3).toBe(0)
      expect(meshRegistry.get(0)).toBe(mesh3)
    })
  })

  describe('Position Sync', () => {
    beforeEach(() => {
      const meshIndex = registerMesh(meshRegistry, mockMesh as any)
      MeshRef.meshIndex[eid] = meshIndex
    })

    it('should sync position from ECS to mesh', () => {
      Position.x[eid] = 10
      Position.y[eid] = 20
      Position.z[eid] = 30

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.position.x).toBe(10)
      expect(mockMesh.position.y).toBe(20)
      expect(mockMesh.position.z).toBe(30)
    })

    it('should sync negative positions', () => {
      Position.x[eid] = -5
      Position.y[eid] = -10
      Position.z[eid] = -15

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.position.x).toBe(-5)
      expect(mockMesh.position.y).toBe(-10)
      expect(mockMesh.position.z).toBe(-15)
    })

    it('should sync zero positions', () => {
      Position.x[eid] = 0
      Position.y[eid] = 0
      Position.z[eid] = 0

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.position.x).toBe(0)
      expect(mockMesh.position.y).toBe(0)
      expect(mockMesh.position.z).toBe(0)
    })
  })

  describe('Rotation Sync', () => {
    beforeEach(() => {
      const meshIndex = registerMesh(meshRegistry, mockMesh as any)
      MeshRef.meshIndex[eid] = meshIndex
    })

    it('should sync quaternion rotation from ECS to mesh', () => {
      Rotation.x[eid] = 0.5
      Rotation.y[eid] = 0.5
      Rotation.z[eid] = 0.5
      Rotation.w[eid] = 0.5

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.quaternion.x).toBe(0.5)
      expect(mockMesh.quaternion.y).toBe(0.5)
      expect(mockMesh.quaternion.z).toBe(0.5)
      expect(mockMesh.quaternion.w).toBe(0.5)
    })

    it('should sync identity quaternion', () => {
      Rotation.x[eid] = 0
      Rotation.y[eid] = 0
      Rotation.z[eid] = 0
      Rotation.w[eid] = 1

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.quaternion.x).toBe(0)
      expect(mockMesh.quaternion.y).toBe(0)
      expect(mockMesh.quaternion.z).toBe(0)
      expect(mockMesh.quaternion.w).toBe(1)
    })
  })

  describe('Scale Sync', () => {
    beforeEach(() => {
      const meshIndex = registerMesh(meshRegistry, mockMesh as any)
      MeshRef.meshIndex[eid] = meshIndex
    })

    it('should sync scale from ECS to mesh', () => {
      Scale.x[eid] = 2
      Scale.y[eid] = 3
      Scale.z[eid] = 4

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.scale.x).toBe(2)
      expect(mockMesh.scale.y).toBe(3)
      expect(mockMesh.scale.z).toBe(4)
    })

    it('should sync uniform scale', () => {
      Scale.x[eid] = 5
      Scale.y[eid] = 5
      Scale.z[eid] = 5

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.scale.x).toBe(5)
      expect(mockMesh.scale.y).toBe(5)
      expect(mockMesh.scale.z).toBe(5)
    })

    it('should sync fractional scale', () => {
      Scale.x[eid] = 0.5
      Scale.y[eid] = 0.25
      Scale.z[eid] = 0.1

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.scale.x).toBe(0.5)
      expect(mockMesh.scale.y).toBe(0.25)
      expect(mockMesh.scale.z).toBe(0.1)
    })
  })

  describe('Visibility Sync', () => {
    beforeEach(() => {
      const meshIndex = registerMesh(meshRegistry, mockMesh as any)
      MeshRef.meshIndex[eid] = meshIndex
    })

    it('should set mesh visible when Renderable.visible is 1', () => {
      Renderable.visible[eid] = 1

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.visible).toBe(true)
    })

    it('should set mesh invisible when Renderable.visible is 0', () => {
      Renderable.visible[eid] = 0

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.visible).toBe(false)
    })

    it('should toggle visibility', () => {
      Renderable.visible[eid] = 1
      renderSyncSystem([eid], meshRegistry)
      expect(mockMesh.visible).toBe(true)

      Renderable.visible[eid] = 0
      renderSyncSystem([eid], meshRegistry)
      expect(mockMesh.visible).toBe(false)
    })
  })

  describe('Shadow Sync', () => {
    beforeEach(() => {
      const meshIndex = registerMesh(meshRegistry, mockMesh as any)
      MeshRef.meshIndex[eid] = meshIndex
    })

    it('should sync castShadow flag', () => {
      Renderable.castShadow[eid] = 1

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.castShadow).toBe(true)
    })

    it('should sync receiveShadow flag', () => {
      Renderable.receiveShadow[eid] = 1

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.receiveShadow).toBe(true)
    })

    it('should disable shadows when flags are 0', () => {
      Renderable.castShadow[eid] = 0
      Renderable.receiveShadow[eid] = 0

      renderSyncSystem([eid], meshRegistry)

      expect(mockMesh.castShadow).toBe(false)
      expect(mockMesh.receiveShadow).toBe(false)
    })

    it('should handle mesh without shadow support', () => {
      // Create mesh without shadow properties
      const meshNoShadow = {
        position: { x: 0, y: 0, z: 0 },
        quaternion: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
      }

      const meshIndex = registerMesh(meshRegistry, meshNoShadow as any)
      MeshRef.meshIndex[eid] = meshIndex
      Renderable.castShadow[eid] = 1
      Renderable.receiveShadow[eid] = 1

      // Should not throw error
      expect(() => {
        renderSyncSystem([eid], meshRegistry)
      }).not.toThrow()
    })
  })

  describe('Multiple Entities', () => {
    it('should sync multiple entities in one call', () => {
      const eid1 = addEntity(world)
      const eid2 = addEntity(world)
      const mesh1 = createMockMesh()
      const mesh2 = createMockMesh()

      // Setup entity 1
      Position.x[eid1] = 10
      Position.y[eid1] = 20
      Position.z[eid1] = 30
      const meshIndex1 = registerMesh(meshRegistry, mesh1 as any)
      MeshRef.meshIndex[eid1] = meshIndex1

      // Setup entity 2
      Position.x[eid2] = 100
      Position.y[eid2] = 200
      Position.z[eid2] = 300
      const meshIndex2 = registerMesh(meshRegistry, mesh2 as any)
      MeshRef.meshIndex[eid2] = meshIndex2

      renderSyncSystem([eid1, eid2], meshRegistry)

      expect(mesh1.position.x).toBe(10)
      expect(mesh1.position.y).toBe(20)
      expect(mesh1.position.z).toBe(30)

      expect(mesh2.position.x).toBe(100)
      expect(mesh2.position.y).toBe(200)
      expect(mesh2.position.z).toBe(300)
    })

    it('should handle empty entity array', () => {
      expect(() => {
        renderSyncSystem([], meshRegistry)
      }).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should skip entity without MeshRef', () => {
      // Don't register mesh, so MeshRef is invalid
      Position.x[eid] = 100

      // Should not throw
      expect(() => {
        renderSyncSystem([eid], meshRegistry)
      }).not.toThrow()
    })

    it('should skip entity with missing mesh in registry', () => {
      // Set MeshRef to non-existent index
      MeshRef.meshIndex[eid] = 999
      Position.x[eid] = 100

      // Should not throw
      expect(() => {
        renderSyncSystem([eid], meshRegistry)
      }).not.toThrow()
    })

    it('should sync all transform components together', () => {
      const meshIndex = registerMesh(meshRegistry, mockMesh as any)
      MeshRef.meshIndex[eid] = meshIndex

      // Set all components
      Position.x[eid] = 10
      Position.y[eid] = 20
      Position.z[eid] = 30
      Rotation.x[eid] = 0.1
      Rotation.y[eid] = 0.2
      Rotation.z[eid] = 0.3
      Rotation.w[eid] = 0.9
      Scale.x[eid] = 2
      Scale.y[eid] = 3
      Scale.z[eid] = 4
      Renderable.visible[eid] = 1
      Renderable.castShadow[eid] = 1
      Renderable.receiveShadow[eid] = 1

      renderSyncSystem([eid], meshRegistry)

      // Verify all synced
      expect(mockMesh.position.x).toBe(10)
      expect(mockMesh.position.y).toBe(20)
      expect(mockMesh.position.z).toBe(30)
      expect(mockMesh.quaternion.x).toBe(0.1)
      expect(mockMesh.quaternion.y).toBe(0.2)
      expect(mockMesh.quaternion.z).toBe(0.3)
      expect(mockMesh.quaternion.w).toBe(0.9)
      expect(mockMesh.scale.x).toBe(2)
      expect(mockMesh.scale.y).toBe(3)
      expect(mockMesh.scale.z).toBe(4)
      expect(mockMesh.visible).toBe(true)
      expect(mockMesh.castShadow).toBe(true)
      expect(mockMesh.receiveShadow).toBe(true)
    })

    it('should handle zero-initialized components', () => {
      const meshIndex = registerMesh(meshRegistry, mockMesh as any)
      MeshRef.meshIndex[eid] = meshIndex

      // All components already zero-initialized in beforeEach
      renderSyncSystem([eid], meshRegistry)

      // Should sync zeros without error
      expect(mockMesh.position.x).toBe(0)
      expect(mockMesh.position.y).toBe(0)
      expect(mockMesh.position.z).toBe(0)
    })

    it('should handle entity ID at array bounds', () => {
      // Create entity with high ID (but within bounds)
      const highEid = addEntity(world)
      const mesh = createMockMesh()
      const meshIndex = registerMesh(meshRegistry, mesh as any)

      Position.x[highEid] = 42
      MeshRef.meshIndex[highEid] = meshIndex

      renderSyncSystem([highEid], meshRegistry)

      expect(mesh.position.x).toBe(42)
    })
  })

  describe('Performance', () => {
    it('should handle large number of entities efficiently', () => {
      const entities: number[] = []
      const meshes: MockObject3D[] = []

      // Create 100 entities
      for (let i = 0; i < 100; i++) {
        const eid = addEntity(world)
        const mesh = createMockMesh()
        const meshIndex = registerMesh(meshRegistry, mesh as any)

        Position.x[eid] = i
        Position.y[eid] = i * 2
        Position.z[eid] = i * 3
        MeshRef.meshIndex[eid] = meshIndex

        entities.push(eid)
        meshes.push(mesh)
      }

      // Sync all at once
      const start = performance.now()
      renderSyncSystem(entities, meshRegistry)
      const duration = performance.now() - start

      // Verify first and last
      expect(meshes[0].position.x).toBe(0)
      expect(meshes[99].position.x).toBe(99)

      // Should be fast (< 10ms for 100 entities)
      expect(duration).toBeLessThan(10)
    })
  })
})
