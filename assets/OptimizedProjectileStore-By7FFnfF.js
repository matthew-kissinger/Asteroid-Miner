class OptimizedProjectileStore {
  constructor(capacity = 2048) {
    this.capacity = capacity;
    this.count = 0;
    this.pos = new Float32Array(capacity * 3);
    this.vel = new Float32Array(capacity * 3);
    this.alive = new Uint8Array(capacity);
    this.idToIndex = /* @__PURE__ */ new Map();
    this.indexToProjectile = new Array(capacity);
  }
  _allocIndex() {
    if (this.count >= this.capacity) return -1;
    const idx = this.count++;
    return idx;
  }
  register(projectile) {
    const idx = this._allocIndex();
    if (idx === -1) return -1;
    this.idToIndex.set(projectile.uuid || projectile.id || idx, idx);
    this.indexToProjectile[idx] = projectile;
    this.alive[idx] = 1;
    const p = projectile.position;
    this.pos[idx * 3 + 0] = p.x;
    this.pos[idx * 3 + 1] = p.y;
    this.pos[idx * 3 + 2] = p.z;
    const v = projectile.velocity || { x: 0, y: 0, z: 0 };
    this.vel[idx * 3 + 0] = v.x;
    this.vel[idx * 3 + 1] = v.y;
    this.vel[idx * 3 + 2] = v.z;
    return idx;
  }
  unregisterByIndex(idx) {
    if (idx < 0 || idx >= this.count) return;
    this.alive[idx] = 0;
    this.indexToProjectile[idx] = null;
  }
  unregister(projectile) {
    const id = projectile.uuid || projectile.id;
    if (id == null) return;
    const idx = this.idToIndex.get(id);
    if (idx == null) return;
    this.alive[idx] = 0;
    this.indexToProjectile[idx] = null;
    this.idToIndex.delete(id);
  }
  update(dt) {
    const n = this.count;
    for (let i = 0; i < n; i++) {
      if (!this.alive[i]) continue;
      const pi = i * 3;
      this.pos[pi + 0] += this.vel[pi + 0] * dt;
      this.pos[pi + 1] += this.vel[pi + 1] * dt;
      this.pos[pi + 2] += this.vel[pi + 2] * dt;
      const proj = this.indexToProjectile[i];
      if (proj && proj.position) {
        proj.position.set(this.pos[pi + 0], this.pos[pi + 1], this.pos[pi + 2]);
      }
    }
  }
}
export {
  OptimizedProjectileStore
};
//# sourceMappingURL=OptimizedProjectileStore-By7FFnfF.js.map
