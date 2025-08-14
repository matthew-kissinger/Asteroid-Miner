import { h as System } from "./modules-BnzCGJKr.js";
import { an as SphereGeometry, x as MeshBasicMaterial, I as InstancedMesh, O as Object3D } from "./three-l6xBJAGV.js";
import "./core-CQR7b8gS.js";
class InstancedRenderer extends System {
  constructor(world, scene) {
    super(world);
    this.requiredComponents = ["TransformComponent"];
    this.priority = 95;
    this.scene = scene;
    this.cellSize = world && world.spatial ? world.spatial.cellSize : 400;
    this.cellMeshes = /* @__PURE__ */ new Map();
    this.entityToInstance = /* @__PURE__ */ new Map();
  }
  initialize() {
  }
  getArchetype(entity) {
    if (entity.hasTag && entity.hasTag("enemy")) return "enemy_drone";
    return null;
  }
  getCellKeyFromPosition(pos) {
    const ix = Math.floor(pos.x / this.cellSize) | 0;
    const iy = Math.floor(pos.y / this.cellSize) | 0;
    const iz = Math.floor(pos.z / this.cellSize) | 0;
    return `${ix}|${iy}|${iz}`;
  }
  ensureCellMesh(cellKey, archetype, sampleMesh) {
    const key = `${cellKey}|${archetype}`;
    let rec = this.cellMeshes.get(key);
    if (rec) return rec;
    let geom, mat;
    if (sampleMesh && sampleMesh.geometry && sampleMesh.material) {
      geom = sampleMesh.geometry;
      mat = sampleMesh.material;
    } else {
      geom = new SphereGeometry(2, 8, 8);
      mat = new MeshBasicMaterial({ color: 16711935 });
    }
    const max = 2048;
    const inst = new InstancedMesh(geom, mat, max);
    inst.count = 0;
    inst.frustumCulled = true;
    this.scene.add(inst);
    rec = { mesh: inst, count: 0, max, freeIds: [], dummy: new Object3D() };
    this.cellMeshes.set(key, rec);
    return rec;
  }
  allocateInstance(rec) {
    if (rec.freeIds.length > 0) return rec.freeIds.pop();
    if (rec.count >= rec.max) return -1;
    const id = rec.count;
    rec.count++;
    rec.mesh.count = rec.count;
    return id;
  }
  releaseInstance(rec, index) {
    if (index < 0) return;
    rec.freeIds.push(index);
  }
  update(deltaTime) {
    const world = this.world;
    if (!world || !world.entityManager) return;
    const entities = world.getEntitiesWithComponents(["TransformComponent", "MeshComponent"]);
    for (const entity of entities) {
      const archetype = this.getArchetype(entity);
      if (!archetype) continue;
      const meshComp = entity.getComponent("MeshComponent");
      if (meshComp && meshComp.mesh) meshComp.mesh.visible = false;
      const t = entity.getComponent("TransformComponent");
      const cellKey = this.getCellKeyFromPosition(t.position);
      const key = `${cellKey}|${archetype}`;
      let mapEntry = this.entityToInstance.get(entity.id);
      let rec = this.cellMeshes.get(key);
      if (!mapEntry || mapEntry.key !== key) {
        if (mapEntry) {
          const prev = this.cellMeshes.get(mapEntry.key);
          if (prev) this.releaseInstance(prev, mapEntry.index);
        }
        rec = this.ensureCellMesh(cellKey, archetype, meshComp ? meshComp.mesh : null);
        const idx = this.allocateInstance(rec);
        if (idx === -1) continue;
        mapEntry = { key, index: idx };
        this.entityToInstance.set(entity.id, mapEntry);
      }
      if (!rec) rec = this.cellMeshes.get(key);
      if (!rec) continue;
      rec.dummy.position.copy(t.position);
      rec.dummy.quaternion.copy(t.quaternion);
      rec.dummy.scale.set(1, 1, 1);
      rec.dummy.updateMatrix();
      rec.mesh.setMatrixAt(mapEntry.index, rec.dummy.matrix);
      rec.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
export {
  InstancedRenderer
};
//# sourceMappingURL=InstancedRenderer-BF_LO-uX.js.map
