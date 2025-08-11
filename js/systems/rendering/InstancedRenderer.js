// InstancedRenderer.js - ECS-driven instanced rendering per cell × archetype

import * as THREE from 'three';
import { System } from '../../core/system.js';

export class InstancedRenderer extends System {
  constructor(world, scene) {
    super(world);
    this.requiredComponents = ['TransformComponent'];
    this.priority = 95; // run before standard RenderSystem (which is 100)
    this.scene = scene;
    this.cellSize = world && world.spatial ? world.spatial.cellSize : 400;

    // cellKey|archetype -> { mesh, count, max, freeIds, dummy }
    this.cellMeshes = new Map();
    // entityId -> { key, index }
    this.entityToInstance = new Map();
  }

  initialize() {
    // Nothing on init; will allocate lazily
  }

  getArchetype(entity) {
    if (entity.hasTag && entity.hasTag('enemy')) return 'enemy_drone';
    return null; // others not yet handled
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
    // Derive geometry/material from sample mesh or simple placeholder
    let geom, mat;
    if (sampleMesh && sampleMesh.geometry && sampleMesh.material) {
      geom = sampleMesh.geometry;
      mat = sampleMesh.material;
    } else {
      geom = new THREE.SphereGeometry(2, 8, 8);
      mat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    }
    const max = 2048; // capacity per cell × archetype
    const inst = new THREE.InstancedMesh(geom, mat, max);
    inst.count = 0;
    inst.frustumCulled = true;
    this.scene.add(inst);
    rec = { mesh: inst, count: 0, max, freeIds: [], dummy: new THREE.Object3D() };
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
    const entities = world.getEntitiesWithComponents(['TransformComponent', 'MeshComponent']);

    // Per-frame: hide original meshes for handled archetypes
    for (const entity of entities) {
      const archetype = this.getArchetype(entity);
      if (!archetype) continue;
      const meshComp = entity.getComponent('MeshComponent');
      if (meshComp && meshComp.mesh) meshComp.mesh.visible = false;
      const t = entity.getComponent('TransformComponent');
      const cellKey = this.getCellKeyFromPosition(t.position);
      const key = `${cellKey}|${archetype}`;
      let mapEntry = this.entityToInstance.get(entity.id);
      let rec = this.cellMeshes.get(key);

      // If entity moved cell or not allocated, (re)allocate
      if (!mapEntry || mapEntry.key !== key) {
        // free previous
        if (mapEntry) {
          const prev = this.cellMeshes.get(mapEntry.key);
          if (prev) this.releaseInstance(prev, mapEntry.index);
        }
        // ensure mesh
        rec = this.ensureCellMesh(cellKey, archetype, meshComp ? meshComp.mesh : null);
        const idx = this.allocateInstance(rec);
        if (idx === -1) continue; // capacity reached
        mapEntry = { key, index: idx };
        this.entityToInstance.set(entity.id, mapEntry);
      }

      if (!rec) rec = this.cellMeshes.get(key);
      if (!rec) continue;

      // Update instance matrix
      rec.dummy.position.copy(t.position);
      rec.dummy.quaternion.copy(t.quaternion);
      rec.dummy.scale.set(1, 1, 1);
      rec.dummy.updateMatrix();
      rec.mesh.setMatrixAt(mapEntry.index, rec.dummy.matrix);
      rec.mesh.instanceMatrix.needsUpdate = true;
    }

    // TODO: CPU frustum cull by toggling entire cell meshes via bounding boxes
    // and picking instanceId → entityId mapping if needed in future gates.
  }
}


