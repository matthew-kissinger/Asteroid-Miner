# Changelog

## v0.7.0 Hybrid-Tightening

- Perf overlay (F3): FPS, sim ms, render ms, draw calls, visible instances, pool stats, GC count, per-system timings.
- Fixed-step simulation (60 Hz) with render interpolation.
- Unified PoolRegistry; bridged `window.objectPool` facade to registry. Pool hit/miss stats wired to perf overlay.
- Instanced rendering for enemies via `js/systems/rendering/InstancedRenderer.js`.
- Spatial hash and entity index integrated into ECS world for future proximity queries.
- Typed events and dev-time schema validation in `MessageBus`.
- Renderer facade guard: Warns on direct `scene.add/remove` in dev; migrated hotspots to guarded path.
- Optimized projectile store (TypedArrays) for projectile movement.

### Path mappings and migrations
- Renderer facade adoption:
  - FROM direct `scene.add/remove` in `js/modules/combat.js` → TO guarded helpers `_addToScene/_removeFromScene` using `renderer._withGuard`.
  - FROM direct `scene.add/remove` in `js/modules/pooling/ProjectilePoolManager.js` → TO `_addToScene/_removeFromParent` helpers.
  - FROM direct `scene.add/remove` in `js/modules/environment/spaceAnomalies.js` → TO `_addToScene/_removeFromScene` helpers.
  - FROM direct warm-up `scene.add/remove` in `js/main.js` → TO `renderer._withGuard(() => scene.add/remove)`.

### Docs
- README.md: Added v0.7.0 Performance Optimization and Runbook sections.
- architecture.md: Updated to v0.7.0, noted facade, pooling, instancing, typed events, and migrations.


