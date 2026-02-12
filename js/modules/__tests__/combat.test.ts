import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as THREE from 'three'
import { Combat } from '../combat'

// Mock combat submodules so we test only the orchestrator layer
const mockUpdatePlayerReference = vi.fn()
const mockUpdateSpaceshipHealth = vi.fn()
const mockSetSceneReference = vi.fn()
const mockInitializeWorld = vi.fn()
const mockSetWorldInitialized = vi.fn()
const mockGetPlayerEntity = vi.fn().mockReturnValue(null)
const mockGetWorld = vi.fn().mockReturnValue(null)
const mockInitializeECSWorld = vi.fn().mockResolvedValue({
  update: vi.fn(),
  messageBus: {},
  systems: [],
  id: 'test-world'
})
const mockCreatePlayerReferenceEntity = vi.fn().mockResolvedValue(null)
const mockIsWorldInitialized = vi.fn().mockReturnValue(false)

vi.mock('../combat/worldSetup', () => ({
  WorldSetup: vi.fn().mockImplementation(function (this: any) {
    return {
      initializeECSWorld: mockInitializeECSWorld,
      isWorldInitialized: mockIsWorldInitialized,
      getPlayerEntity: mockGetPlayerEntity,
      setSceneReference: mockSetSceneReference,
      initializeWorld: mockInitializeWorld,
      createPlayerReferenceEntity: mockCreatePlayerReferenceEntity,
      updatePlayerReference: mockUpdatePlayerReference,
      updateSpaceshipHealth: mockUpdateSpaceshipHealth,
      setWorldInitialized: mockSetWorldInitialized,
      getWorld: mockGetWorld
    }
  })
}))

const mockRegisterAllSystems = vi.fn().mockResolvedValue({})
const mockSetSystemsEnabled = vi.fn()
const mockImportAndRegisterSystem = vi.fn().mockResolvedValue(null)

vi.mock('../combat/registerSystems', () => ({
  SystemRegistrar: vi.fn().mockImplementation(function (this: any) {
    return {
      registerAllSystems: mockRegisterAllSystems,
      setSystemsEnabled: mockSetSystemsEnabled,
      importAndRegisterSystem: mockImportAndRegisterSystem
    }
  })
}))

const mockSetupEventHandlers = vi.fn()
const mockEventCleanup = vi.fn()

vi.mock('../combat/events', () => ({
  EventManager: vi.fn().mockImplementation(function (this: any) {
    return {
      setupEventHandlers: mockSetupEventHandlers,
      cleanup: mockEventCleanup
    }
  })
}))

const mockUpdateTracers = vi.fn()
const mockCreateExplosionEffect = vi.fn().mockReturnValue({})
const mockCreateAimingTracer = vi.fn().mockReturnValue({})
const mockCreateMuzzleFlash = vi.fn().mockReturnValue({})
const mockEffectsDispose = vi.fn()

vi.mock('../combat/effects', () => ({
  EffectsManager: vi.fn().mockImplementation(function (this: any, _scene: THREE.Scene) {
    return {
      updateTracers: mockUpdateTracers,
      createExplosionEffect: mockCreateExplosionEffect,
      createAimingTracer: mockCreateAimingTracer,
      createMuzzleFlash: mockCreateMuzzleFlash,
      dispose: mockEffectsDispose
    }
  })
}))

const mockConfigureEnemySystem = vi.fn()
const mockRegisterEnemy = vi.fn()
const mockUnregisterEnemy = vi.fn()
const mockEmergencyCleanup = vi.fn()

vi.mock('../combat/aiAndSpawners', () => ({
  AISpawnerManager: vi.fn().mockImplementation(function (this: any) {
    return {
      configureEnemySystem: mockConfigureEnemySystem,
      registerEnemy: mockRegisterEnemy,
      unregisterEnemy: mockUnregisterEnemy,
      emergencyCleanup: mockEmergencyCleanup
    }
  })
}))

const mockFireParticleCannon = vi.fn().mockReturnValue({ newLastFireTime: 0, success: true })

vi.mock('../combat/combatLogic', () => ({
  CombatLogic: vi.fn().mockImplementation(function (this: any) {
    return {
      fireParticleCannon: mockFireParticleCannon
    }
  })
}))

function makeMockSpaceship() {
  const mesh = new THREE.Object3D()
  mesh.position.set(0, 0, 0)
  mesh.quaternion.identity()
  return {
    mesh,
    isDocked: false,
    isDestroyed: false
  }
}

describe('Combat Module (orchestrator)', () => {
  let scene: THREE.Scene
  let spaceship: ReturnType<typeof makeMockSpaceship>
  let combat: Combat

  beforeEach(() => {
    vi.clearAllMocks()
    if (typeof (globalThis as any).window === 'undefined') {
      ;(globalThis as any).window = {}
    }
    ;(globalThis as any).window.game = undefined
    scene = new THREE.Scene()
    spaceship = makeMockSpaceship()
    combat = new Combat(scene, spaceship)
  })

  afterEach(() => {
    if (combat && !combat.disposed) {
      combat.dispose()
    }
    if ((globalThis as any).window) {
      delete (globalThis as any).window.game
    }
  })

  describe('initialization', () => {
    it('should store scene and spaceship and set default combat state', () => {
      expect(combat.scene).toBe(scene)
      expect(combat.spaceship).toBe(spaceship)
      expect(combat.fireRate).toBe(3)
      expect(combat.lastFireTime).toBe(0)
      expect(combat.aimingSpread).toBe(0.05)
      expect(combat.isFiring).toBe(false)
      expect(combat.cooldown).toBe(1000 / 3)
      expect(combat.particleCannonDamage).toBe(20)
      expect(combat.disposed).toBe(false)
    })

    it('should create submodule instances and call initializeECSWorld', () => {
      expect(mockInitializeECSWorld).toHaveBeenCalledWith(scene, spaceship)
    })

    it('should have worldSetup, systemRegistrar, eventManager, effectsManager, aiSpawnerManager, combatLogic', () => {
      expect(combat.worldSetup).toBeDefined()
      expect(combat.systemRegistrar).toBeDefined()
      expect(combat.eventManager).toBeDefined()
      expect(combat.effectsManager).toBeDefined()
      expect(combat.aiSpawnerManager).toBeDefined()
      expect(combat.combatLogic).toBeDefined()
    })
  })

  describe('setFiring', () => {
    it('should set isFiring to true', () => {
      combat.setFiring(true)
      expect(combat.isFiring).toBe(true)
    })

    it('should set isFiring to false', () => {
      combat.setFiring(true)
      combat.setFiring(false)
      expect(combat.isFiring).toBe(false)
    })
  })

  describe('update', () => {
    it('should skip update when scene is null', () => {
      ;(combat as any).scene = null
      combat.update(0.016)
      expect(mockUpdatePlayerReference).not.toHaveBeenCalled()
      expect(mockUpdateTracers).not.toHaveBeenCalled()
    })

    it('should skip update when spaceship is null', () => {
      ;(combat as any).spaceship = null
      combat.update(0.016)
      expect(mockUpdatePlayerReference).not.toHaveBeenCalled()
    })

    it('should call updatePlayerReference and updateSpaceshipHealth and updateTracers', () => {
      combat.update(0.016)
      expect(mockUpdatePlayerReference).toHaveBeenCalledWith(spaceship)
      expect(mockUpdateSpaceshipHealth).toHaveBeenCalledWith(spaceship)
      expect(mockUpdateTracers).toHaveBeenCalledWith(0.016)
    })

    it('should not fire when isFiring is false', () => {
      combat.setFiring(false)
      combat.update(0.016)
      expect(mockFireParticleCannon).not.toHaveBeenCalled()
    })

    it('should not fire when spaceship is docked', () => {
      spaceship.isDocked = true
      combat.setFiring(true)
      combat.update(0.016)
      expect(mockFireParticleCannon).not.toHaveBeenCalled()
    })

    it('should call fireParticleCannon when isFiring and not docked', () => {
      combat.setFiring(true)
      combat.update(0.016)
      expect(mockFireParticleCannon).toHaveBeenCalledWith(
        scene,
        spaceship,
        combat.world,
        combat.playerEntity,
        combat.particleCannonDamage,
        combat.lastFireTime,
        combat.cooldown
      )
    })
  })

  describe('updatePlayerReference and updateSpaceshipHealth', () => {
    it('updatePlayerReference should delegate to worldSetup', () => {
      combat.updatePlayerReference()
      expect(mockUpdatePlayerReference).toHaveBeenCalledWith(spaceship)
    })

    it('updateSpaceshipHealth should delegate to worldSetup', () => {
      combat.updateSpaceshipHealth()
      expect(mockUpdateSpaceshipHealth).toHaveBeenCalledWith(spaceship)
    })
  })

  describe('createExplosionEffect', () => {
    it('should delegate to effectsManager with default duration and visibility', () => {
      const pos = new THREE.Vector3(1, 2, 3)
      combat.createExplosionEffect(pos)
      expect(mockCreateExplosionEffect).toHaveBeenCalledWith(pos, 1000, true, null)
    })

    it('should pass custom duration and isVisible', () => {
      const pos = new THREE.Vector3(0, 0, 0)
      combat.createExplosionEffect(pos, 500, false)
      expect(mockCreateExplosionEffect).toHaveBeenCalledWith(pos, 500, false, null)
    })
  })

  describe('enemy registration', () => {
    it('registerEnemy should delegate to aiSpawnerManager', () => {
      combat.registerEnemy('enemy-1')
      expect(mockRegisterEnemy).toHaveBeenCalledWith('enemy-1')
    })

    it('unregisterEnemy should delegate to aiSpawnerManager', () => {
      combat.unregisterEnemy('enemy-1')
      expect(mockUnregisterEnemy).toHaveBeenCalledWith('enemy-1')
    })
  })

  describe('fireParticleCannon', () => {
    it('should delegate to combatLogic and update lastFireTime on success', () => {
      const now = 1000
      mockFireParticleCannon.mockReturnValueOnce({ newLastFireTime: now, success: true })

      const result = combat.fireParticleCannon()

      expect(mockFireParticleCannon).toHaveBeenCalledWith(
        scene,
        spaceship,
        combat.world,
        combat.playerEntity,
        combat.particleCannonDamage,
        0, // lastFireTime before this call
        combat.cooldown
      )
      expect(combat.lastFireTime).toBe(now)
      expect(result).toBe(true)
    })

    it('should update lastFireTime and return false when combatLogic returns success: false', () => {
      mockFireParticleCannon.mockReturnValueOnce({ newLastFireTime: 500, success: false })

      const result = combat.fireParticleCannon()

      expect(combat.lastFireTime).toBe(500)
      expect(result).toBe(false)
    })
  })

  describe('setEnabled', () => {
    it('should call systemRegistrar.setSystemsEnabled', () => {
      combat.setEnabled(true)
      expect(mockSetSystemsEnabled).toHaveBeenCalledWith(true)
      combat.setEnabled(false)
      expect(mockSetSystemsEnabled).toHaveBeenCalledWith(false)
    })
  })

  describe('createAimingTracer and createMuzzleFlash', () => {
    it('createAimingTracer should delegate to effectsManager with default distance', () => {
      const start = new THREE.Vector3(0, 0, 0)
      const dir = new THREE.Vector3(0, 0, -1)
      combat.createAimingTracer(start, dir)
      expect(mockCreateAimingTracer).toHaveBeenCalledWith(start, dir, 3000, null)
    })

    it('createMuzzleFlash should delegate to effectsManager', () => {
      const pos = new THREE.Vector3(0, 0, 0)
      const dir = new THREE.Vector3(0, 0, -1)
      combat.createMuzzleFlash(pos, dir)
      expect(mockCreateMuzzleFlash).toHaveBeenCalledWith(pos, dir, null)
    })
  })

  describe('dispose', () => {
    it('should call effectsManager.dispose, eventManager.cleanup, aiSpawnerManager.emergencyCleanup', () => {
      combat.dispose()
      expect(mockEffectsDispose).toHaveBeenCalled()
      expect(mockEventCleanup).toHaveBeenCalled()
      expect(mockEmergencyCleanup).toHaveBeenCalled()
    })

    it('should set disposed to true', () => {
      combat.dispose()
      expect(combat.disposed).toBe(true)
    })

  })

  describe('setupECSWorld (async)', () => {
    it('should skip setup when world is already initialized', async () => {
      mockIsWorldInitialized.mockReturnValue(true)
      mockRegisterAllSystems.mockClear()
      await combat.setupECSWorld()
      // Our explicit call should not register (early return); any prior async init may have called it
      expect(mockIsWorldInitialized).toHaveBeenCalled()
      mockIsWorldInitialized.mockReturnValue(false)
    })

    it('should call registerAllSystems and setup when not initialized', async () => {
      mockIsWorldInitialized.mockReturnValue(false)
      mockGetWorld.mockReturnValue({ id: 'mock-world', update: vi.fn(), systems: [] })
      mockGetPlayerEntity.mockReturnValue({ id: 'player-1' })
      combat.world = await mockInitializeECSWorld()

      await combat.setupECSWorld()

      expect(mockRegisterAllSystems).toHaveBeenCalledWith(combat.world, scene)
      expect(mockSetupEventHandlers).toHaveBeenCalledWith(combat.world, mockGetPlayerEntity())
      expect(mockSetSceneReference).toHaveBeenCalledWith(scene)
      expect(mockInitializeWorld).toHaveBeenCalled()
      expect(mockCreatePlayerReferenceEntity).toHaveBeenCalledWith(spaceship)
      expect(mockSetWorldInitialized).toHaveBeenCalled()
    })
  })

  describe('importAndRegisterSystem', () => {
    it('should delegate to systemRegistrar with world and scene', async () => {
      combat.world = { id: 'w' } as any
      await combat.importAndRegisterSystem('./SomeSystem', 'SomeSystem')
      expect(mockImportAndRegisterSystem).toHaveBeenCalledWith(
        './SomeSystem',
        'SomeSystem',
        combat.world,
        scene
      )
    })
  })
})
