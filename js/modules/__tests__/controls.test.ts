// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock dependencies before imports
vi.mock('../../globals/debug', () => ({
  DEBUG_MODE: { enabled: false },
  debugLog: vi.fn(),
  debugWarn: vi.fn(),
  debugError: vi.fn()
}))

vi.mock('../../globals/messageBus', () => ({
  mainMessageBus: {
    subscribe: vi.fn(),
    publish: vi.fn()
  }
}))

vi.mock('three', () => {
  const Vector3 = vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: vi.fn().mockReturnThis(),
    copy: vi.fn().mockReturnThis(),
    clone: vi.fn().mockImplementation(function(this: any) { return { x: this.x, y: this.y, z: this.z, set: vi.fn(), copy: vi.fn(), clone: vi.fn() } }),
    normalize: vi.fn().mockReturnThis(),
    multiplyScalar: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    sub: vi.fn().mockReturnThis(),
    length: vi.fn().mockReturnValue(0),
    distanceTo: vi.fn().mockReturnValue(0),
  }))
  return {
    Vector3,
    Object3D: vi.fn().mockImplementation(() => ({
      position: new Vector3(),
      quaternion: { set: vi.fn(), copy: vi.fn(), x: 0, y: 0, z: 0, w: 1 },
      scale: new Vector3(1, 1, 1),
      rotation: { set: vi.fn(), x: 0, y: 0, z: 0 },
      add: vi.fn(),
      remove: vi.fn(),
      children: [],
      visible: true,
    })),
    Scene: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      children: [],
      camera: null,
    })),
    Raycaster: vi.fn().mockImplementation(() => ({
      set: vi.fn(),
      intersectObjects: vi.fn().mockReturnValue([]),
    })),
    Color: vi.fn(),
    LineBasicMaterial: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
    BufferGeometry: vi.fn().mockImplementation(() => ({
      setFromPoints: vi.fn(),
      dispose: vi.fn(),
    })),
    Line: vi.fn().mockImplementation(() => ({
      visible: false,
      geometry: { dispose: vi.fn() },
      material: { dispose: vi.fn() },
    })),
    RingGeometry: vi.fn(),
    MeshBasicMaterial: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
    Mesh: vi.fn().mockImplementation(() => ({
      position: new Vector3(),
      visible: false,
    })),
    Group: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      children: [],
      position: new Vector3(),
    })),
  }
})

// Mock the sub-modules used by Controls constructor
vi.mock('../controls/inputHandler', () => {
  return {
    InputHandler: class MockInputHandler {
      isPointerLocked = false
      isLocked = vi.fn().mockReturnValue(false)
      exitPointerLock = vi.fn()
      constructor() {}
    }
  }
})

vi.mock('../controls/gamepadHandler', () => {
  return {
    GamepadHandler: class MockGamepadHandler {
      update = vi.fn()
      lookSensitivity = 1.0
      toggleDebug = vi.fn()
      constructor() {}
    }
  }
})

vi.mock('../controls/miningSystem', () => {
  return {
    MiningSystem: class MockMiningSystem {
      isMining = false
      miningProgress = 0
      targetAsteroid = null
      miningSpeedByType: Record<string, number> = { iron: 1.0, gold: 0.5 }
      setTargetAsteroid = vi.fn()
      startMining = vi.fn()
      stopMining = vi.fn()
      update = vi.fn()
      getLastDestroyedAsteroid = vi.fn().mockReturnValue(null)
      resourceExtraction = {
        resources: { iron: 0, gold: 0, orbs: null }
      }
      constructor() {}
    }
  }
})

vi.mock('../controls/targetingSystem', () => {
  return {
    TargetingSystem: class MockTargetingSystem {
      toggleLockOn = vi.fn()
      isLockOnEnabled = vi.fn().mockReturnValue(false)
      cycleLockOnTarget = vi.fn()
      getCurrentTarget = vi.fn().mockReturnValue(null)
      update = vi.fn()
      constructor() {}
    }
  }
})

vi.mock('../controls/dockingSystem', () => {
  return {
    DockingSystem: class MockDockingSystem {
      update = vi.fn()
      dockWithStargate = vi.fn()
      setupStargateUIControls = vi.fn()
      setResources = vi.fn()
      canDock = vi.fn().mockReturnValue(false)
      initiateDocking = vi.fn()
      constructor() {}
    }
  }
})

vi.mock('../controls/touchControls', () => {
  return {
    TouchControls: class MockTouchControls {
      setControlSystems = vi.fn()
      update = vi.fn()
      show = vi.fn()
      hide = vi.fn()
      constructor() {}
    }
  }
})

vi.mock('../../utils/mobileDetector', () => ({
  MobileDetector: {
    isMobile: vi.fn().mockReturnValue(false),
  }
}))

import { Controls } from '../controls'

// Use importActual to get the real GamepadHandler for pure logic tests
const { GamepadHandler: RealGamepadHandler } = await vi.importActual('../controls/gamepadHandler') as { GamepadHandler: typeof import('../controls/gamepadHandler').GamepadHandler }

// ─── Helpers ────────────────────────────────────────────────────
function makeSpaceship(): any {
  return {
    thrust: { forward: false, backward: false, right: false, left: false, boost: false },
    thrustPower: 1,
    strafePower: 1,
    mesh: { position: { x: 0, y: 0, z: 0, clone: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }) } },
    isDocked: false,
    miningEfficiency: 1.0,
    scanRange: 100,
  }
}

function makePhysics(): any {
  return {
    scene: { add: vi.fn(), remove: vi.fn(), children: [], camera: null },
    updateRotation: vi.fn(),
  }
}

function makeEnvironment(): any {
  return {
    stargate: {},
    asteroidBelt: { removeAsteroid: vi.fn() },
    asteroids: [],
    checkAnomalyCollision: vi.fn().mockReturnValue(null),
    collectAnomalyOrb: vi.fn().mockReturnValue(null),
  }
}

function makeUI(): any {
  return {
    setControls: vi.fn(),
    showStargateUI: vi.fn(),
    hideStargateUI: vi.fn(),
    updateDockingUI: vi.fn(),
  }
}

// ─── Tests ──────────────────────────────────────────────────────

describe('Controls Module', () => {
  let spaceship: any
  let physics: any
  let environment: any
  let ui: any
  let controls: Controls

  beforeEach(() => {
    vi.clearAllMocks()

    // Provide minimal DOM stubs
    vi.spyOn(document, 'addEventListener').mockImplementation(vi.fn())
    vi.spyOn(document, 'createElement').mockReturnValue({
      id: '',
      style: {},
      classList: { add: vi.fn() },
      textContent: '',
      innerHTML: '',
      remove: vi.fn(),
      appendChild: vi.fn(),
    } as any)
    vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn() as any)

    // Reset window properties
    ;(window as any).game = undefined
    ;(window as any).mainMessageBus = undefined

    spaceship = makeSpaceship()
    physics = makePhysics()
    environment = makeEnvironment()
    ui = makeUI()
    controls = new Controls(spaceship, physics, environment, ui)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── Constructor / Initialization ───────────────────────────
  describe('constructor', () => {
    it('should initialize with correct references', () => {
      expect(controls.spaceship).toBe(spaceship)
      expect(controls.physics).toBe(physics)
      expect(controls.environment).toBe(environment)
      expect(controls.ui).toBe(ui)
    })

    it('should set isMobile to false for desktop', () => {
      expect(controls.isMobile).toBe(false)
    })

    it('should initialize anomaly tracking state', () => {
      expect(controls.lastAnomalyCheck).toBe(0)
      expect(controls.currentAnomaly).toBeNull()
      expect(controls.showingAnomalyNotification).toBe(false)
    })

    it('should set initial weaponSystem to null', () => {
      expect(controls.weaponSystem).toBeNull()
    })

    it('should track initial docking state', () => {
      expect(controls._wasDocked).toBe(false)
    })

    it('should initialize docked state from spaceship', () => {
      spaceship.isDocked = true
      const dockedControls = new Controls(spaceship, physics, environment, ui)
      expect(dockedControls._wasDocked).toBe(true)
    })
  })

  // ─── isMining / miningProgress getters ──────────────────────
  describe('isMining getter', () => {
    it('should return false when not mining', () => {
      expect(controls.isMining).toBe(false)
    })

    it('should return true when mining system is mining', () => {
      ;(controls.miningSystem as any).isMining = true
      expect(controls.isMining).toBe(true)
    })
  })

  describe('miningProgress getter', () => {
    it('should return 0 when no mining in progress', () => {
      expect(controls.miningProgress).toBe(0)
    })

    it('should return miningSystem progress value', () => {
      ;(controls.miningSystem as any).miningProgress = 0.75
      expect(controls.miningProgress).toBe(0.75)
    })
  })

  // ─── update() ───────────────────────────────────────────────
  describe('update', () => {
    it('should skip all updates when intro sequence is active', () => {
      ;(window as any).game = { introSequenceActive: true }

      controls.update(1 / 60)

      expect(controls.targetingSystem.update).not.toHaveBeenCalled()
      expect(controls.miningSystem.update).not.toHaveBeenCalled()
      expect(controls.dockingSystem.update).not.toHaveBeenCalled()
    })

    it('should only update docking system when spaceship is docked', () => {
      spaceship.isDocked = true

      controls.update(1 / 60)

      expect(controls.dockingSystem.update).toHaveBeenCalled()
      expect(controls.targetingSystem.update).not.toHaveBeenCalled()
      expect(controls.miningSystem.update).not.toHaveBeenCalled()
    })

    it('should update all systems when flying', () => {
      spaceship.isDocked = false

      controls.update(1 / 60)

      expect(controls.targetingSystem.update).toHaveBeenCalled()
      expect(controls.miningSystem.update).toHaveBeenCalledWith(1 / 60)
      expect(controls.dockingSystem.update).toHaveBeenCalled()
    })

    it('should update gamepad handler when available', () => {
      spaceship.isDocked = false

      controls.update(1 / 60)

      expect(controls.gamepadHandler!.update).toHaveBeenCalledWith(1 / 60)
    })

    it('should use default deltaTime of 1/60 when not provided', () => {
      spaceship.isDocked = false

      controls.update()

      expect(controls.miningSystem.update).toHaveBeenCalledWith(1 / 60)
    })

    it('should remove destroyed asteroid from environment', () => {
      const destroyedAsteroid = { id: 'test-asteroid' }
      ;(controls.miningSystem.getLastDestroyedAsteroid as any).mockReturnValue(destroyedAsteroid)

      controls.update(1 / 60)

      expect(environment.asteroidBelt.removeAsteroid).toHaveBeenCalledWith(destroyedAsteroid)
    })

    it('should not crash when no destroyed asteroid', () => {
      ;(controls.miningSystem.getLastDestroyedAsteroid as any).mockReturnValue(null)

      expect(() => controls.update(1 / 60)).not.toThrow()
    })
  })

  // ─── Docking state transitions ─────────────────────────────
  describe('docking state transitions', () => {
    it('should call dockWithStargate on docking system', () => {
      controls.dockWithStargate()
      expect(controls.dockingSystem.dockWithStargate).toHaveBeenCalled()
    })

    it('should call setupStargateUIControls', () => {
      controls.setupStargateUIControls()
      expect(controls.dockingSystem.setupStargateUIControls).toHaveBeenCalled()
    })
  })

  // ─── collectEnergyOrb ──────────────────────────────────────
  describe('collectEnergyOrb', () => {
    it('should return early if no environment', () => {
      ;(controls as any).environment = null
      expect(() => controls.collectEnergyOrb()).not.toThrow()
    })

    it('should return early if no anomaly in range', () => {
      environment.checkAnomalyCollision.mockReturnValue(null)
      controls.collectEnergyOrb()
      expect(environment.collectAnomalyOrb).not.toHaveBeenCalled()
    })

    it('should return early if orb already collected', () => {
      const anomaly = { position: { x: 1, y: 2, z: 3 } }
      environment.checkAnomalyCollision.mockReturnValue(anomaly)
      environment.collectAnomalyOrb.mockReturnValue(null)

      controls.collectEnergyOrb()

      // Should try to collect but get null (already collected)
      expect(environment.collectAnomalyOrb).toHaveBeenCalledWith(anomaly)
    })

    it('should add orb to resources inventory with correct rarity', () => {
      const anomaly = { position: { x: 0, y: 0, z: 0, clone: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }) } }
      environment.checkAnomalyCollision.mockReturnValue(anomaly)
      environment.collectAnomalyOrb.mockReturnValue({ rarity: 'rare', value: 500 })

      controls.collectEnergyOrb()

      expect(controls.resources.orbs).toBeDefined()
      expect(controls.resources.orbs!.rare).toBe(1)
    })

    it('should accumulate orbs of the same rarity', () => {
      controls.resources.orbs = { common: 2, uncommon: 0, rare: 0, epic: 0, legendary: 0 }
      const anomaly = { position: { x: 0, y: 0, z: 0, clone: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }) } }
      environment.checkAnomalyCollision.mockReturnValue(anomaly)
      environment.collectAnomalyOrb.mockReturnValue({ rarity: 'common', value: 100 })

      controls.collectEnergyOrb()

      expect(controls.resources.orbs.common).toBe(3)
    })

    it('should initialize orbs object if missing', () => {
      controls.resources.orbs = undefined as any
      const anomaly = { position: { x: 0, y: 0, z: 0, clone: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }) } }
      environment.checkAnomalyCollision.mockReturnValue(anomaly)
      environment.collectAnomalyOrb.mockReturnValue({ rarity: 'legendary', value: 2000 })

      controls.collectEnergyOrb()

      expect(controls.resources.orbs).toBeDefined()
      expect(controls.resources.orbs!.legendary).toBe(1)
      expect(controls.resources.orbs!.common).toBe(0)
    })
  })

  // ─── checkForAnomalyOrbs ──────────────────────────────────
  describe('checkForAnomalyOrbs', () => {
    it('should return early if no environment', () => {
      ;(controls as any).environment = null
      expect(() => controls.checkForAnomalyOrbs()).not.toThrow()
    })

    it('should return early if no spaceship', () => {
      ;(controls as any).spaceship = null
      expect(() => controls.checkForAnomalyOrbs()).not.toThrow()
    })

    it('should throttle checks to 500ms intervals', () => {
      const perfSpy = vi.spyOn(performance, 'now')
      perfSpy.mockReturnValue(1000)
      controls.lastAnomalyCheck = 0

      controls.checkForAnomalyOrbs()
      expect(environment.checkAnomalyCollision).toHaveBeenCalled()

      vi.clearAllMocks()
      perfSpy.mockReturnValue(1300) // Only 300ms later
      controls.checkForAnomalyOrbs()
      expect(environment.checkAnomalyCollision).not.toHaveBeenCalled()

      perfSpy.mockReturnValue(1600) // 600ms after first check
      controls.checkForAnomalyOrbs()
      expect(environment.checkAnomalyCollision).toHaveBeenCalled()
    })

    it('should reset currentAnomaly when player leaves anomaly range', () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000)
      controls.lastAnomalyCheck = 0
      controls.currentAnomaly = { position: { x: 1, y: 1, z: 1 } } as any

      environment.checkAnomalyCollision.mockReturnValue(null)
      controls.checkForAnomalyOrbs()

      expect(controls.currentAnomaly).toBeNull()
    })
  })

  // ─── showAnomalyMessage ────────────────────────────────────
  describe('showAnomalyMessage', () => {
    it('should not stack notifications', () => {
      controls.showingAnomalyNotification = true
      controls.showAnomalyMessage('Test', '#fff')
      // Should early return without creating element
      expect(document.createElement).not.toHaveBeenCalled()
    })

    it('should set showingAnomalyNotification flag', () => {
      controls.showingAnomalyNotification = false
      controls.showAnomalyMessage('Test', '#ff0000')
      expect(controls.showingAnomalyNotification).toBe(true)
    })
  })

  // ─── connectUpgradeEffects ─────────────────────────────────
  describe('connectUpgradeEffects', () => {
    it('should set updateMiningSystem on docking system', () => {
      expect((controls.dockingSystem as any).updateMiningSystem).toBeDefined()
      expect(typeof (controls.dockingSystem as any).updateMiningSystem).toBe('function')
    })

    it('should update mining speeds when called', () => {
      spaceship.miningEfficiency = 2.0
      ;(controls.dockingSystem as any).updateMiningSystem()

      // Mining speed should be updated based on efficiency
      expect(controls.miningSystem.miningSpeedByType.iron).toBe(2.0)
      expect(controls.miningSystem.miningSpeedByType.gold).toBe(1.0)
    })
  })
})

// ─── GamepadHandler Pure Logic ───────────────────────────────
// Test the pure functions directly without DOM
describe('GamepadHandler - Pure Logic', () => {
  let handler: InstanceType<typeof RealGamepadHandler>

  beforeEach(() => {
    // Stub navigator.getGamepads and window events for constructor
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn().mockReturnValue([]),
    })
    vi.spyOn(window, 'addEventListener').mockImplementation(vi.fn())
    vi.spyOn(document, 'createElement').mockReturnValue({
      id: '',
      style: {},
      className: '',
      textContent: '',
      innerHTML: '',
      remove: vi.fn(),
      appendChild: vi.fn(),
    } as any)
    vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn() as any)
    ;(globalThis as any).mainMessageBus = undefined

    const spaceship: any = {
      isDocked: false,
      thrust: { forward: false, backward: false, left: false, right: false, boost: false },
      thrustPower: 1,
      strafePower: 1,
    }
    const physics: any = { updateRotation: vi.fn() }
    const controlsInput: any = {}

    handler = new RealGamepadHandler(spaceship, physics, controlsInput)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('applyDeadZone', () => {
    it('should return 0 for values within dead zone', () => {
      expect(handler.applyDeadZone(0)).toBe(0)
      expect(handler.applyDeadZone(0.1)).toBe(0)
      expect(handler.applyDeadZone(-0.1)).toBe(0)
      expect(handler.applyDeadZone(0.14)).toBe(0)
      expect(handler.applyDeadZone(-0.14)).toBe(0)
    })

    it('should return scaled value for inputs above dead zone', () => {
      // With deadZone = 0.15: (0.5 - 0.15) / (1 - 0.15) ≈ 0.4118
      const result = handler.applyDeadZone(0.5)
      expect(result).toBeCloseTo(0.4118, 3)
    })

    it('should return negative scaled value for negative inputs', () => {
      const result = handler.applyDeadZone(-0.5)
      expect(result).toBeCloseTo(-0.4118, 3)
    })

    it('should return 1.0 for full stick deflection', () => {
      const result = handler.applyDeadZone(1.0)
      expect(result).toBeCloseTo(1.0, 3)
    })

    it('should return -1.0 for full negative deflection', () => {
      const result = handler.applyDeadZone(-1.0)
      expect(result).toBeCloseTo(-1.0, 3)
    })

    it('should return 0 for dead zone boundary', () => {
      expect(handler.applyDeadZone(0.15)).toBe(0)
      // -0.15 produces -0 due to sign preservation; functionally equivalent to 0
      expect(handler.applyDeadZone(-0.15)).toBeCloseTo(0)
    })

    it('should return small positive for just above dead zone', () => {
      const result = handler.applyDeadZone(0.16)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(0.05)
    })
  })

  describe('applyResponseCurve', () => {
    it('should return 0 for 0 input', () => {
      expect(handler.applyResponseCurve(0)).toBe(0)
    })

    it('should return 1 for full positive deflection', () => {
      expect(handler.applyResponseCurve(1)).toBeCloseTo(1.0)
    })

    it('should return -1 for full negative deflection', () => {
      expect(handler.applyResponseCurve(-1)).toBeCloseTo(-1.0)
    })

    it('should reduce magnitude for small inputs (precision region)', () => {
      // With exponent 2.5: 0.5^2.5 ≈ 0.1768
      const result = handler.applyResponseCurve(0.5)
      expect(result).toBeCloseTo(0.1768, 3)
      expect(Math.abs(result)).toBeLessThan(0.5)
    })

    it('should preserve sign for negative values', () => {
      const result = handler.applyResponseCurve(-0.5)
      expect(result).toBeLessThan(0)
      expect(result).toBeCloseTo(-0.1768, 3)
    })

    it('should be more aggressive with higher exponent', () => {
      const default25 = handler.applyResponseCurve(0.5, 2.5)
      const higherCurve = handler.applyResponseCurve(0.5, 4.0)
      expect(Math.abs(higherCurve)).toBeLessThan(Math.abs(default25))
    })

    it('should be linear with exponent 1', () => {
      expect(handler.applyResponseCurve(0.5, 1)).toBeCloseTo(0.5)
      expect(handler.applyResponseCurve(0.3, 1)).toBeCloseTo(0.3)
    })
  })

  describe('wasButtonPressed (edge detection)', () => {
    it('should return true when button transitions from released to pressed', () => {
      handler.previousButtonStates = { 0: false }
      handler.buttonStates = { 0: true }
      expect(handler.wasButtonPressed(0)).toBe(true)
    })

    it('should return false when button is held (no transition)', () => {
      handler.previousButtonStates = { 0: true }
      handler.buttonStates = { 0: true }
      expect(handler.wasButtonPressed(0)).toBe(false)
    })

    it('should return false when button is released', () => {
      handler.previousButtonStates = { 0: true }
      handler.buttonStates = { 0: false }
      expect(handler.wasButtonPressed(0)).toBe(false)
    })

    it('should return false when button was never pressed', () => {
      handler.previousButtonStates = {}
      handler.buttonStates = {}
      expect(handler.wasButtonPressed(0)).toBeFalsy()
    })
  })

  describe('wasButtonReleased (edge detection)', () => {
    it('should return true when button transitions from pressed to released', () => {
      handler.previousButtonStates = { 0: true }
      handler.buttonStates = { 0: false }
      expect(handler.wasButtonReleased(0)).toBe(true)
    })

    it('should return false when button is still pressed', () => {
      handler.previousButtonStates = { 0: true }
      handler.buttonStates = { 0: true }
      expect(handler.wasButtonReleased(0)).toBe(false)
    })

    it('should return false when button was just pressed', () => {
      handler.previousButtonStates = { 0: false }
      handler.buttonStates = { 0: true }
      expect(handler.wasButtonReleased(0)).toBe(false)
    })
  })

  describe('button mapping', () => {
    it('should have correct Xbox face button mappings', () => {
      expect(handler.buttonMap.A).toBe(0)
      expect(handler.buttonMap.B).toBe(1)
      expect(handler.buttonMap.X).toBe(2)
      expect(handler.buttonMap.Y).toBe(3)
    })

    it('should have correct bumper/trigger mappings', () => {
      expect(handler.buttonMap.LB).toBe(4)
      expect(handler.buttonMap.RB).toBe(5)
      expect(handler.buttonMap.LT).toBe(6)
      expect(handler.buttonMap.RT).toBe(7)
    })

    it('should have correct special button mappings', () => {
      expect(handler.buttonMap.BACK).toBe(8)
      expect(handler.buttonMap.START).toBe(9)
      expect(handler.buttonMap.L3).toBe(10)
      expect(handler.buttonMap.R3).toBe(11)
    })

    it('should have correct D-Pad mappings', () => {
      expect(handler.buttonMap.DPAD_UP).toBe(12)
      expect(handler.buttonMap.DPAD_DOWN).toBe(13)
      expect(handler.buttonMap.DPAD_LEFT).toBe(14)
      expect(handler.buttonMap.DPAD_RIGHT).toBe(15)
    })
  })

  describe('axis mapping', () => {
    it('should have correct stick axis mappings', () => {
      expect(handler.axisMap.LEFT_STICK_X).toBe(0)
      expect(handler.axisMap.LEFT_STICK_Y).toBe(1)
      expect(handler.axisMap.RIGHT_STICK_X).toBe(2)
      expect(handler.axisMap.RIGHT_STICK_Y).toBe(3)
    })

    it('should have trigger axis mappings for alternate controllers', () => {
      expect(handler.axisMap.LT).toBe(4)
      expect(handler.axisMap.RT).toBe(5)
    })
  })

  describe('settings methods', () => {
    it('should clamp lookSensitivity between 0.1 and 5.0', () => {
      handler.setLookSensitivity(0.05)
      expect(handler.lookSensitivity).toBe(0.1)

      handler.setLookSensitivity(10.0)
      expect(handler.lookSensitivity).toBe(5.0)

      handler.setLookSensitivity(2.5)
      expect(handler.lookSensitivity).toBe(2.5)
    })

    it('should clamp movementSensitivity between 0.1 and 2.0', () => {
      handler.setMovementSensitivity(0.0)
      expect(handler.movementSensitivity).toBe(0.1)

      handler.setMovementSensitivity(5.0)
      expect(handler.movementSensitivity).toBe(2.0)

      handler.setMovementSensitivity(1.5)
      expect(handler.movementSensitivity).toBe(1.5)
    })

    it('should clamp deadZone between 0.05 and 0.3', () => {
      handler.setDeadZone(0.01)
      expect(handler.deadZone).toBe(0.05)

      handler.setDeadZone(0.5)
      expect(handler.deadZone).toBe(0.3)

      handler.setDeadZone(0.2)
      expect(handler.deadZone).toBe(0.2)
    })

    it('should set vibration enabled/disabled', () => {
      handler.setVibration(false)
      expect(handler.vibrationEnabled).toBe(false)

      handler.setVibration(true)
      expect(handler.vibrationEnabled).toBe(true)
    })
  })

  describe('resetControls', () => {
    it('should reset all thrust to false and power to 1.0', () => {
      handler['spaceship'].thrust.forward = true
      handler['spaceship'].thrust.boost = true
      handler['spaceship'].thrustPower = 0.5

      handler.resetControls()

      expect(handler['spaceship'].thrust.forward).toBe(false)
      expect(handler['spaceship'].thrust.backward).toBe(false)
      expect(handler['spaceship'].thrust.left).toBe(false)
      expect(handler['spaceship'].thrust.right).toBe(false)
      expect(handler['spaceship'].thrust.boost).toBe(false)
      expect(handler['spaceship'].thrustPower).toBe(1.0)
      expect(handler['spaceship'].strafePower).toBe(1.0)
    })
  })

  describe('isConnected', () => {
    it('should return false when no gamepad is active', () => {
      handler.activeGamepadIndex = null
      expect(handler.isConnected()).toBe(false)
    })

    it('should return true when gamepad is active', () => {
      handler.activeGamepadIndex = 0
      expect(handler.isConnected()).toBe(true)
    })
  })

  describe('getGamepadName', () => {
    it('should identify Xbox controllers', () => {
      expect(handler.getGamepadName({ id: 'Xbox One Controller' } as Gamepad)).toBe('Xbox Controller')
    })

    it('should identify PlayStation controllers', () => {
      expect(handler.getGamepadName({ id: 'Sony DualShock 4' } as Gamepad)).toBe('PlayStation Controller')
      expect(handler.getGamepadName({ id: 'PLAYSTATION(R)3' } as Gamepad)).toBe('PlayStation Controller')
    })

    it('should identify Switch controllers', () => {
      expect(handler.getGamepadName({ id: 'Nintendo Switch Pro Controller' } as Gamepad)).toBe('Switch Pro Controller')
    })

    it('should return Generic for unknown controllers', () => {
      expect(handler.getGamepadName({ id: 'Some Random Controller' } as Gamepad)).toBe('Generic Controller')
    })
  })

  describe('swapRightStickAxes', () => {
    it('should swap X and Y axis indices', () => {
      const originalX = handler.rightStickXAxis
      const originalY = handler.rightStickYAxis

      handler.swapRightStickAxes()

      expect(handler.rightStickXAxis).toBe(originalY)
      expect(handler.rightStickYAxis).toBe(originalX)
    })

    it('should disable axis detection mode after swap', () => {
      handler.axisDetectionMode = true
      handler.swapRightStickAxes()
      expect(handler.axisDetectionMode).toBe(false)
    })
  })

  describe('onGamepadConnected / onGamepadDisconnected', () => {
    it('should set active gamepad on first connection', () => {
      const gamepad = { index: 0, id: 'Xbox Controller' } as Gamepad

      handler.onGamepadConnected(gamepad)

      expect(handler.activeGamepadIndex).toBe(0)
      expect(handler.gamepads[0]).toBe(gamepad)
    })

    it('should not change active if another gamepad connects', () => {
      handler.activeGamepadIndex = 0
      handler.gamepads[0] = { index: 0, id: 'first' } as Gamepad

      const second = { index: 1, id: 'second Xbox Controller' } as Gamepad
      handler.onGamepadConnected(second)

      expect(handler.activeGamepadIndex).toBe(0) // Unchanged
      expect(handler.gamepads[1]).toBe(second)
    })

    it('should switch to another gamepad on disconnect', () => {
      handler.gamepads[0] = { index: 0, id: 'first' } as Gamepad
      handler.gamepads[1] = { index: 1, id: 'second Xbox Controller' } as Gamepad
      handler.activeGamepadIndex = 0

      handler.onGamepadDisconnected({ index: 0, id: 'first' } as Gamepad)

      expect(handler.activeGamepadIndex).toBe(1)
    })

    it('should set activeGamepadIndex to null when last gamepad disconnects', () => {
      handler.gamepads[0] = { index: 0, id: 'only' } as Gamepad
      handler.activeGamepadIndex = 0

      handler.onGamepadDisconnected({ index: 0, id: 'only' } as Gamepad)

      expect(handler.activeGamepadIndex).toBeNull()
    })
  })

  describe('default configuration values', () => {
    it('should have correct dead zone defaults', () => {
      expect(handler.deadZone).toBe(0.15)
      expect(handler.triggerDeadZone).toBe(0.15)
    })

    it('should have correct sensitivity defaults', () => {
      expect(handler.lookSensitivity).toBe(1.0)
      expect(handler.movementSensitivity).toBe(1.0)
    })

    it('should have smoothing defaults', () => {
      expect(handler.rotationSmoothing.smoothingFactor).toBe(0.15)
      expect(handler.rotationSmoothing.targetX).toBe(0)
      expect(handler.rotationSmoothing.targetY).toBe(0)
      expect(handler.rotationSmoothing.currentX).toBe(0)
      expect(handler.rotationSmoothing.currentY).toBe(0)
    })

    it('should have vibration enabled by default', () => {
      expect(handler.vibrationEnabled).toBe(true)
    })

    it('should start with debug mode disabled', () => {
      expect(handler.debugMode).toBe(false)
      expect(handler.debugDisplay).toBeNull()
    })
  })
})
