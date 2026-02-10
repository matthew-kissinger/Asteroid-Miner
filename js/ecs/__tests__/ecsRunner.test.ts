import { beforeEach, describe, expect, it, vi } from 'vitest'

type MockVec3 = {
  x: number
  y: number
  z: number
  set: ReturnType<typeof vi.fn>
}

type MockQuat = {
  x: number
  y: number
  z: number
  w: number
  set: ReturnType<typeof vi.fn>
}

type MockMesh = {
  position: MockVec3
  quaternion: MockQuat
  scale: MockVec3
  visible: boolean
  castShadow: boolean
  receiveShadow: boolean
}

function createMockVec3(x = 0, y = 0, z = 0): MockVec3 {
  const vec = {
    x,
    y,
    z,
    set: vi.fn((nx: number, ny: number, nz: number) => {
      vec.x = nx
      vec.y = ny
      vec.z = nz
    }),
  }
  return vec
}

function createMockQuat(x = 0, y = 0, z = 0, w = 1): MockQuat {
  const quat = {
    x,
    y,
    z,
    w,
    set: vi.fn((nx: number, ny: number, nz: number, nw: number) => {
      quat.x = nx
      quat.y = ny
      quat.z = nz
      quat.w = nw
    }),
  }
  return quat
}

function createMockMesh(): MockMesh {
  return {
    position: createMockVec3(),
    quaternion: createMockQuat(),
    scale: createMockVec3(1, 1, 1),
    visible: true,
    castShadow: false,
    receiveShadow: false,
  }
}

async function loadModules() {
  vi.resetModules()

  const ecsRunner = await import('../systems/ecsRunner')
  const components = await import('../components')
  const world = await import('../world')
  const renderSync = await import('../systems/renderSyncSystem')

  return { ecsRunner, components, world, renderSync }
}

describe('ECS Runner Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('initECS creates runnable ECS state', async () => {
    const { ecsRunner } = await loadModules()

    const scene = { add: vi.fn() }
    ecsRunner.initECS(scene as any)

    expect(ecsRunner.getMeshRegistry()).not.toBeNull()
    expect(ecsRunner.getEnemies().length).toBe(1)
    expect(ecsRunner.getPlayerEntity()).toBe(-1)
    expect(scene.add).toHaveBeenCalledTimes(1)
  })

  it('updateECS runs physics systems (thrust, drag, integration)', async () => {
    const { ecsRunner, components, world } = await loadModules()

    ecsRunner.initECS()

    const eid = world.createGameEntity()
    ecsRunner.addTrackedEntity(eid)

    components.Position.x[eid] = 0
    components.Position.y[eid] = 0
    components.Position.z[eid] = 0

    components.Velocity.x[eid] = 0
    components.Velocity.y[eid] = 0
    components.Velocity.z[eid] = 0

    components.Rotation.x[eid] = 0
    components.Rotation.y[eid] = 0
    components.Rotation.z[eid] = 0
    components.Rotation.w[eid] = 1

    components.Thrust.forward[eid] = 1
    components.Thruster.maxVelocity[eid] = 100
    components.Rigidbody.drag[eid] = 0.1

    ecsRunner.updateECS(1.0)

    expect(components.Velocity.z[eid]).toBeCloseTo(-0.45)
    expect(components.Position.z[eid]).toBeCloseTo(-0.45)
  })

  it('updateECS runs render sync (position/rotation/scale updates)', async () => {
    const { ecsRunner, components, world, renderSync } = await loadModules()

    ecsRunner.initECS()

    const registry = ecsRunner.getMeshRegistry()
    expect(registry).not.toBeNull()

    const dummyMesh = createMockMesh()
    renderSync.registerMesh(registry!, dummyMesh as any)

    const eid = world.createGameEntity()
    ecsRunner.addTrackedEntity(eid)

    const mesh = createMockMesh()
    const meshIndex = renderSync.registerMesh(registry!, mesh as any)

    components.MeshRef.meshIndex[eid] = meshIndex
    components.Position.x[eid] = 10
    components.Position.y[eid] = 20
    components.Position.z[eid] = 30
    components.Rotation.x[eid] = 0.1
    components.Rotation.y[eid] = 0.2
    components.Rotation.z[eid] = 0.3
    components.Rotation.w[eid] = 0.9
    components.Scale.x[eid] = 2
    components.Scale.y[eid] = 3
    components.Scale.z[eid] = 4
    components.Renderable.visible[eid] = 1
    components.Renderable.castShadow[eid] = 1
    components.Renderable.receiveShadow[eid] = 1

    ecsRunner.updateECS(0.016)

    expect(mesh.position.set).toHaveBeenCalledWith(
      expect.closeTo(10, 5),
      expect.closeTo(20, 5),
      expect.closeTo(30, 5)
    )
    expect(mesh.quaternion.x).toBeCloseTo(0.1)
    expect(mesh.quaternion.y).toBeCloseTo(0.2)
    expect(mesh.quaternion.z).toBeCloseTo(0.3)
    expect(mesh.quaternion.w).toBeCloseTo(0.9)
    expect(mesh.scale.set).toHaveBeenCalledWith(2, 3, 4)
    expect(mesh.visible).toBe(true)
    expect(mesh.castShadow).toBe(true)
    expect(mesh.receiveShadow).toBe(true)
  })

  it('updateECS runs enemy AI systems', async () => {
    const { ecsRunner, components, world } = await loadModules()

    ecsRunner.initECS()

    const playerEid = world.createGameEntity()
    ecsRunner.setPlayerEntity(playerEid)
    components.Position.x[playerEid] = 100
    components.Position.y[playerEid] = 0
    components.Position.z[playerEid] = 0
    components.Health.current[playerEid] = 100
    components.Health.max[playerEid] = 100

    const enemyEid = world.createGameEntity()
    ecsRunner.addEnemy(enemyEid)
    components.Position.x[enemyEid] = 0
    components.Position.y[enemyEid] = 0
    components.Position.z[enemyEid] = 0
    components.Velocity.x[enemyEid] = 0
    components.Velocity.y[enemyEid] = 0
    components.Velocity.z[enemyEid] = 0
    components.Collider.radius[enemyEid] = 10

    components.EnemyAI.state[enemyEid] = 0
    components.EnemyAI.detectionRange[enemyEid] = 500
    components.EnemyAI.speed[enemyEid] = 100
    components.EnemyAI.subtype[enemyEid] = 0
    components.EnemyAI.spiralAmplitude[enemyEid] = 0
    components.EnemyAI.spiralFrequency[enemyEid] = 1
    components.EnemyAI.spiralPhase[enemyEid] = 0
    components.EnemyAI.separationInfluence[enemyEid] = 0
    components.Health.current[enemyEid] = 100
    components.Health.max[enemyEid] = 100

    ecsRunner.updateECS(0.016)

    expect(components.EnemyAI.state[enemyEid]).toBe(2)
    expect(components.EnemyAI.playerFound[enemyEid]).toBe(1)
    expect(components.Velocity.x[enemyEid]).toBeGreaterThan(0)
  })

  it('updateECS runs combat systems', async () => {
    const { ecsRunner, components, world } = await loadModules()

    ecsRunner.initECS()

    const enemyEid = world.createGameEntity()
    ecsRunner.addEnemy(enemyEid)
    ecsRunner.addEntityWithHealth(enemyEid)

    components.Position.x[enemyEid] = 0
    components.Position.y[enemyEid] = 0
    components.Position.z[enemyEid] = 0
    components.Collider.radius[enemyEid] = 10
    components.Health.current[enemyEid] = 30
    components.Health.max[enemyEid] = 30
    components.Health.shield[enemyEid] = 0
    components.Health.maxShield[enemyEid] = 0
    components.Health.damageResistance[enemyEid] = 0

    const projectileEid = world.createGameEntity()
    ecsRunner.addProjectile(projectileEid)
    components.Position.x[projectileEid] = 0
    components.Position.y[projectileEid] = 0
    components.Position.z[projectileEid] = 0
    components.Collider.radius[projectileEid] = 5
    components.Weapon.damage[projectileEid] = 12

    ecsRunner.updateECS(0.016)

    expect(components.Health.current[enemyEid]).toBe(18)
  })

  it('runs a full frame update with a player entity', async () => {
    const { ecsRunner, components, world, renderSync } = await loadModules()

    ecsRunner.initECS()

    const registry = ecsRunner.getMeshRegistry()
    expect(registry).not.toBeNull()

    renderSync.registerMesh(registry!, createMockMesh() as any)

    const playerEid = world.createGameEntity()
    ecsRunner.setPlayerEntity(playerEid)

    const playerMesh = createMockMesh()
    const playerMeshIndex = renderSync.registerMesh(registry!, playerMesh as any)

    components.MeshRef.meshIndex[playerEid] = playerMeshIndex
    components.Renderable.visible[playerEid] = 1
    components.Position.x[playerEid] = 0
    components.Position.y[playerEid] = 0
    components.Position.z[playerEid] = 0
    components.Velocity.x[playerEid] = 2
    components.Velocity.y[playerEid] = 0
    components.Velocity.z[playerEid] = 0
    components.Rotation.x[playerEid] = 0
    components.Rotation.y[playerEid] = 0
    components.Rotation.z[playerEid] = 0
    components.Rotation.w[playerEid] = 1
    components.Scale.x[playerEid] = 1
    components.Scale.y[playerEid] = 1
    components.Scale.z[playerEid] = 1
    components.Health.current[playerEid] = 100
    components.Health.max[playerEid] = 100

    ecsRunner.updateECS(0.5)

    expect(components.Position.x[playerEid]).toBeCloseTo(1)
    expect(playerMesh.position.set).toHaveBeenCalled()
    expect(ecsRunner.getPlayerEntity()).toBe(playerEid)
  })

  it('accumulates state across multiple sequential updates', async () => {
    const { ecsRunner, components, world } = await loadModules()

    ecsRunner.initECS()

    const eid = world.createGameEntity()
    ecsRunner.addTrackedEntity(eid)

    components.Position.x[eid] = 0
    components.Position.y[eid] = 0
    components.Position.z[eid] = 0
    components.Velocity.x[eid] = 2
    components.Velocity.y[eid] = 0
    components.Velocity.z[eid] = 0
    components.Rigidbody.drag[eid] = 0

    ecsRunner.updateECS(0.5)
    ecsRunner.updateECS(0.5)
    ecsRunner.updateECS(0.5)

    expect(components.Position.x[eid]).toBeCloseTo(3)
  })
})
