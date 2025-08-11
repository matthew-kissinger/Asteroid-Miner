// SpatialHash.js - simple 3D spatial hash grid for proximity queries

export class SpatialHash {
  constructor(cellSize = 200) {
    this.cellSize = cellSize;
    this.map = new Map(); // key -> Set(entityId)
    this.entityToCells = new Map(); // entityId -> array of keys
  }

  _key(ix, iy, iz) { return `${ix}|${iy}|${iz}`; }
  _cellIndex(v) { return Math.floor(v / this.cellSize) | 0; }

  _computeKeysForAABB(min, max) {
    const ix0 = this._cellIndex(min.x), iy0 = this._cellIndex(min.y), iz0 = this._cellIndex(min.z);
    const ix1 = this._cellIndex(max.x), iy1 = this._cellIndex(max.y), iz1 = this._cellIndex(max.z);
    const keys = [];
    for (let ix = ix0; ix <= ix1; ix++)
      for (let iy = iy0; iy <= iy1; iy++)
        for (let iz = iz0; iz <= iz1; iz++)
          keys.push(this._key(ix, iy, iz));
    return keys;
  }

  insert(entityId, position, radius = 1) {
    const min = { x: position.x - radius, y: position.y - radius, z: position.z - radius };
    const max = { x: position.x + radius, y: position.y + radius, z: position.z + radius };
    const keys = this._computeKeysForAABB(min, max);
    this.entityToCells.set(entityId, keys);
    for (const k of keys) {
      let set = this.map.get(k);
      if (!set) { set = new Set(); this.map.set(k, set); }
      set.add(entityId);
    }
  }

  update(entityId, position, radius = 1) {
    this.remove(entityId);
    this.insert(entityId, position, radius);
  }

  remove(entityId) {
    const keys = this.entityToCells.get(entityId);
    if (!keys) return;
    for (const k of keys) {
      const set = this.map.get(k);
      if (set) {
        set.delete(entityId);
        if (set.size === 0) this.map.delete(k);
      }
    }
    this.entityToCells.delete(entityId);
  }

  querySphere(center, radius) {
    const min = { x: center.x - radius, y: center.y - radius, z: center.z - radius };
    const max = { x: center.x + radius, y: center.y + radius, z: center.z + radius };
    const keys = this._computeKeysForAABB(min, max);
    const result = new Set();
    for (const k of keys) {
      const set = this.map.get(k);
      if (set) for (const id of set) result.add(id);
    }
    return Array.from(result);
  }
}


