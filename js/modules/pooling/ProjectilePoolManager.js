/**
 * Projectile Pool Manager
 * 
 * Manages pools of projectiles, muzzle flashes, and trails for the combat system.
 * This reduces garbage collection by reusing objects instead of creating new ones.
 * 
 * Refactored to use specialized pools for different projectile types and effects.
 */

import { LaserProjectilePool } from './projectiles/types/laser.js';
import { MissileProjectilePool } from './projectiles/types/missile.js';
import { PlasmaProjectilePool } from './projectiles/types/plasma.js';
import { BulletProjectilePool } from './projectiles/types/bullet.js';
import { TrailEffectsPool } from './projectiles/effects/trails.js';
import { ImpactEffectsPool } from './projectiles/effects/impacts.js';
import { MuzzleFlashPool } from './projectiles/effects/muzzleFlash.js';
import { ObjectPool } from './ObjectPool.js';
import * as THREE from 'three';

export class ProjectilePoolManager {
    constructor(scene, sharedAssets) {
        this.scene = scene;
        this.sharedAssets = sharedAssets;

        // Assign geometries and materials from sharedAssets
        Object.assign(this, sharedAssets);
        
        // Populate window.game with these shared assets (for legacy access if needed)
        this.populateWindowGameWithSharedAssets();
        
        // Create specialized pools
        this.initializePools();
        
        console.log("ProjectilePoolManager initialized using pre-warmed shared assets and specialized pools");
    }

    populateWindowGameWithSharedAssets() {
        if (!window.game) window.game = {};
        Object.assign(window.game, this.sharedAssets);
    }
    
    initializePools() {
        // Create renderer facade functions for delegation
        const addToScene = (object) => this._addToScene(object);
        const removeFromParent = (object) => this._removeFromParent(object);
        
        // Initialize projectile type pools
        this.laserPool = new LaserProjectilePool(this.sharedAssets, addToScene, removeFromParent);
        this.missilePool = new MissileProjectilePool(this.sharedAssets, addToScene, removeFromParent);
        this.plasmaPool = new PlasmaProjectilePool(this.sharedAssets, addToScene, removeFromParent);
        this.bulletPool = new BulletProjectilePool(this.sharedAssets, addToScene, removeFromParent);
        
        // Initialize effect pools
        this.trailEffects = new TrailEffectsPool(this.sharedAssets, addToScene, removeFromParent);
        this.impactEffects = new ImpactEffectsPool(this.sharedAssets, addToScene, removeFromParent);
        this.muzzleFlashEffects = new MuzzleFlashPool(this.sharedAssets, addToScene, removeFromParent);
        
        // Initialize tracer pool (still generic)
        this.initializeTracerPool();
        
        // Create legacy projectile pool for backward compatibility
        this.createLegacyProjectilePool();
    }
    
    initializeTracerPool() {
        this.tracerPool = new ObjectPool(
            () => {
                const tracer = new THREE.Line(this.tracerGeometry.clone(), this.tracerLineMaterial.clone());
                tracer.userData = { isTracer: true, active: false, pooled: true, startTime: 0 };
                return tracer;
            },
            (tracer) => {
                tracer.position.set(0, 0, 0);
                tracer.visible = false;
                tracer.material.opacity = 0.6;
                tracer.userData.active = false;
                tracer.userData.startTime = 0;
            },
            20, 5
        );
    }
    
    createLegacyProjectilePool() {
        this.projectilePool = {
            get: () => this.bulletPool.get(),
            release: (projectile) => {
                const type = (projectile.userData && projectile.userData.projectileType) || 'bullet';
                this.releaseProjectile(projectile, type);
            },
            active: new Set(),
            availableCount: () => this.bulletPool.availableCount(),
            activeCount: () => this.getAllActiveProjectiles().size
        };
    }
    
    // Factory Pattern - Get projectile by type
    getProjectile(type = 'bullet') {
        switch (type.toLowerCase()) {
            case 'laser': return this.laserPool.get();
            case 'missile': return this.missilePool.get();
            case 'plasma': return this.plasmaPool.get();
            case 'bullet':
            default: return this.bulletPool.get();
        }
    }
    
    // Effect factory methods
    getMuzzleFlash(weaponType = 'generic', position = null, direction = null) {
        return this.muzzleFlashEffects.getMuzzleFlash(weaponType, position, direction);
    }
    
    getTrailContainer() {
        return this.trailEffects.getTrailContainer();
    }
    
    getTrailParticle(sizeIndex = 0) {
        return this.trailEffects.getTrailParticle(sizeIndex);
    }
    
    getTracer() {
        const tracer = this.tracerPool.get();
        tracer.visible = true;
        tracer.userData.active = true;
        tracer.userData.startTime = performance.now();
        if (!tracer.parent) this._addToScene(tracer);
        return tracer;
    }
    
    getExplosion(position, duration = 1000) {
        return this.impactEffects.getExplosion(position, duration);
    }
    
    createImpactEffect(position, projectileType = 'bullet', options = {}) {
        return this.impactEffects.createImpactEffect(position, projectileType, options);
    }
    
    createTrailForProjectile(projectile, options = {}) {
        return this.trailEffects.createTrailForProjectile(projectile, options);
    }
    
    // Release methods - delegate to appropriate pools
    releaseProjectile(projectile, type = null) {
        if (!projectile || !projectile.userData || !projectile.userData.isProjectile) return;
        
        const projectileType = type || projectile.userData.projectileType || 'bullet';
        
        // Release trail if it exists
        if (projectile.userData.trail) {
            this.releaseTrail(projectile.userData.trail);
            projectile.remove(projectile.userData.trail);
            projectile.userData.trail = null;
            projectile.userData.trailParticles = null;
        }
        
        // Delegate to appropriate pool
        switch (projectileType.toLowerCase()) {
            case 'laser': this.laserPool.release(projectile); break;
            case 'missile': this.missilePool.release(projectile); break;
            case 'plasma': this.plasmaPool.release(projectile); break;
            case 'bullet':
            default: this.bulletPool.release(projectile); break;
        }
    }
    
    releaseMuzzleFlash(muzzleFlash) { this.muzzleFlashEffects.release(muzzleFlash); }
    releaseTrail(trail) { this.trailEffects.releaseTrail(trail); }
    releaseTrailParticle(particle) { this.trailEffects.releaseTrailParticle(particle); }
    releaseExplosion(explosion) { this.impactEffects.releaseExplosion(explosion); }
    
    releaseTracer(tracer) {
        if (!tracer || !tracer.userData || !tracer.userData.isTracer) return;
        if (tracer.parent) this._removeFromParent(tracer);
        this.tracerPool.release(tracer);
    }
    
    // Get all active projectiles from all pools
    getAllActiveProjectiles() {
        const allActive = new Set();
        [this.laserPool, this.missilePool, this.plasmaPool, this.bulletPool].forEach(pool => {
            pool.getActive().forEach(p => allActive.add(p));
        });
        this.projectilePool.active = allActive;
        return allActive;
    }
    
    // Update all active objects from the pools
    update(deltaTime) {
        // Update specialized projectile behaviors
        this.missilePool.getActive().forEach(missile => this.missilePool.updateMissile(missile, deltaTime));
        this.plasmaPool.getActive().forEach(plasma => this.plasmaPool.updatePlasma(plasma, deltaTime));
        this.bulletPool.getActive().forEach(bullet => this.bulletPool.updateBullet(bullet, deltaTime));
        
        // Update effects
        this.muzzleFlashEffects.updateMuzzleFlashes(deltaTime);
        this.trailEffects.updateTrails(deltaTime);
        this.impactEffects.updateEffects(deltaTime);
        this.updateTracers(deltaTime);
    }
    
    updateTracers(deltaTime) {
        for (const tracer of this.tracerPool.active) {
            const opacity = Math.max(0, tracer.material.opacity - 1.5 * 0.016);
            if (opacity <= 0) {
                this.releaseTracer(tracer);
            } else {
                tracer.material.opacity = opacity;
            }
        }
    }
    
    // Dispose all pools and shared assets
    dispose() {
        // Dispose shared geometries
        [this.projectileGeometry, this.projectileGlowGeometry, this.muzzleFlashGeometry, this.tracerGeometry]
            .forEach(geo => geo && geo.dispose());
        if (this.trailParticleGeometries) {
            this.trailParticleGeometries.forEach(geo => geo && geo.dispose());
        }
        
        // Dispose shared materials
        [this.projectileMaterial, this.projectileGlowMaterial, this.trailParticleMaterial, 
         this.muzzleFlashMaterial, this.tracerLineMaterial].forEach(mat => mat && mat.dispose());
        
        // Dispose specialized pools
        [this.laserPool, this.missilePool, this.plasmaPool, this.bulletPool].forEach(pool => pool && pool.dispose());
        
        // Dispose effect pools
        [this.trailEffects, this.impactEffects, this.muzzleFlashEffects].forEach(pool => pool && pool.dispose());
        
        // Dispose tracer pool
        if (this.tracerPool) {
            this.tracerPool.dispose((tracer) => {
            if (tracer.parent) this._removeFromParent(tracer);
            if (tracer.material) tracer.material.dispose();
            });
        }
        
        console.log("ProjectilePoolManager disposed all pools and shared assets");
    }

    // Renderer facade helpers
    _getRenderer() {
        return (window.game && window.game.renderer) || null;
    }

    _addToScene(object) {
        const renderer = this._getRenderer();
        if (renderer && renderer._withGuard) {
            renderer._withGuard(() => renderer.add(object));
        } else if (this.scene && this.scene.add) {
            this.scene.add(object);
        }
    }

    _removeFromScene(object) {
        const renderer = this._getRenderer();
        if (renderer && renderer._withGuard) {
            renderer._withGuard(() => this.scene.remove(object));
        } else if (this.scene && this.scene.remove) {
            this.scene.remove(object);
        }
    }

    _removeFromParent(object) {
        if (!object || !object.parent) return;
        if (object.parent === this.scene) {
            this._removeFromScene(object);
        } else if (object.parent.remove) {
            object.parent.remove(object);
        }
    }
}