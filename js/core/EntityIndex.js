// EntityIndex.js - track entity lookups and mesh/instance mapping

export class EntityIndex {
  constructor() {
    this.entityToView = new Map(); // entityId -> { meshRef, instanceKey, instanceId }
    this.tagToEntities = new Map(); // tag -> Set(entityId)
  }

  setView(entityId, view) {
    this.entityToView.set(entityId, view);
  }
  getView(entityId) { return this.entityToView.get(entityId); }
  clearView(entityId) { this.entityToView.delete(entityId); }

  addTag(entityId, tag) {
    let set = this.tagToEntities.get(tag);
    if (!set) { set = new Set(); this.tagToEntities.set(tag, set); }
    set.add(entityId);
  }
  removeTag(entityId, tag) {
    const set = this.tagToEntities.get(tag);
    if (set) { set.delete(entityId); if (set.size === 0) this.tagToEntities.delete(tag); }
  }
  getByTag(tag) {
    const set = this.tagToEntities.get(tag);
    return set ? Array.from(set) : [];
  }
}


