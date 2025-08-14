/**
 * Effects Module - Handles trail/instancing/vfx glue to rendering
 * 
 * This module contains all visual effects logic including material initialization,
 * explosions, tracers, muzzle flashes, and particle effects.
 */

import * as THREE from 'three';
import { ExplosionEffects } from './effects/explosionEffects.js';
import { MaterialManager } from './effects/materialManager.js';
import { GeometryManager } from './effects/geometryManager.js';
import { ProjectileEffects } from './effects/projectileEffects.js';

export class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        
        // Initialize sub-managers
        this.materialManager = new MaterialManager(scene);
        this.geometryManager = new GeometryManager();
        this.explosionEffects = new ExplosionEffects();
        this.projectileEffects = new ProjectileEffects();
        
        // Store material references on window.game
        this.geometryManager.storeMaterialReferences(this.materialManager);
    }


    /**
     * Create an explosion effect at the given position
     * @param {THREE.Vector3} position Position for the explosion
     * @param {number} duration Duration of the explosion in milliseconds
     * @param {boolean} isVisible Whether the explosion should be visible
     */
    createExplosionEffect(position, duration = 1000, isVisible = true, poolManager = null) {
        return this.explosionEffects.createExplosionEffect(position, duration, isVisible, poolManager, this._addToScene.bind(this));
    }

    /**
     * Create an instant plasma beam with hot glow
     * @param {THREE.Vector3} startPos Starting position of the beam
     * @param {THREE.Vector3} endPos End position of the beam (hit point or max range)
     * @param {boolean} isHit Whether this beam hit a target
     * @param {number} fadeTime Time in seconds for the beam to fade
     */
    createInstantTracer(startPos, endPos, isHit = false, fadeTime = 0.5) {
        return this.explosionEffects.createInstantTracer(startPos, endPos, isHit, fadeTime, this._addToScene.bind(this));
    }

    /**
     * Update active tracer beams - fade them out from start to end
     * @param {number} deltaTime Time since last update
     */
    updateTracers(deltaTime) {
        this.explosionEffects.updateTracers(deltaTime, this._removeFromScene.bind(this));
    }

    /**
     * Create a laser burst effect that travels forward with the projectile
     * @param {THREE.Vector3} position Position for the effect
     * @param {THREE.Vector3} direction Direction the effect should travel
     */
    createMuzzleFlash(position, direction, poolManager) {
        return this.projectileEffects.createMuzzleFlash(position, direction, poolManager);
    }

    /**
     * Add a dynamic particle trail to a projectile (Simplified for Lasers)
     * @param {THREE.Mesh} projectile The projectile mesh
     * @param {THREE.Vector3} direction Direction of travel
     * @param {Object} poolManager Pool manager for getting trail components
     */
    addProjectileTrail(projectile, direction, poolManager) {
        this.projectileEffects.addProjectileTrail(projectile, direction, poolManager);
    }

    /**
     * New method to visualize projectile trajectory
     */
    createAimingTracer(startPosition, direction, distance = 3000, poolManager) {
        return this.projectileEffects.createAimingTracer(startPosition, direction, distance, poolManager);
    }

    /**
     * Get material by type
     */
    getMaterial(type) {
        return this.materialManager.getMaterial(type);
    }

    // --- Renderer facade helpers to centralize scene mutations ---
    _addToScene(object) {
        const renderer = window.game && window.game.renderer ? window.game.renderer : null;
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => renderer.add(object));
        } else if (this.scene && typeof this.scene.add === 'function') {
            // Fallback for safety; may warn in dev via guard wrapper
            this.scene.add(object);
        }
    }

    _removeFromScene(object) {
        const renderer = window.game && window.game.renderer ? window.game.renderer : null;
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => this.scene.remove(object));
        } else if (this.scene && typeof this.scene.remove === 'function') {
            // Fallback for safety
            this.scene.remove(object);
        }
    }

    /**
     * Clean up all effects resources
     */
    dispose() {
        // Dispose sub-managers
        this.explosionEffects.dispose();
        this.materialManager.dispose();
        this.geometryManager.dispose();

        console.log("Effects resources disposed");
    }
}