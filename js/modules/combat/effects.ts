/**
 * Effects Module - Handles trail/instancing/vfx glue to rendering
 * 
 * This module contains all visual effects logic including material initialization,
 * explosions, tracers, muzzle flashes, and particle effects.
 */

import * as THREE from 'three';
// @ts-ignore
import { ExplosionEffects } from './effects/explosionEffects.js';
// @ts-ignore
import { MaterialManager } from './effects/materialManager.js';
// @ts-ignore
import { GeometryManager } from './effects/geometryManager.js';
// @ts-ignore
import { ProjectileEffects } from './effects/projectileEffects.js';

export class EffectsManager {
    scene: THREE.Scene;
    materialManager: any;
    geometryManager: any;
    explosionEffects: any;
    projectileEffects: any;

    constructor(scene: THREE.Scene) {
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
    createExplosionEffect(position: THREE.Vector3, duration: number = 1000, isVisible: boolean = true, poolManager: any = null) {
        return this.explosionEffects.createExplosionEffect(position, duration, isVisible, poolManager, this._addToScene.bind(this));
    }

    /**
     * Create an instant plasma beam with hot glow
     * @param {THREE.Vector3} startPos Starting position of the beam
     * @param {THREE.Vector3} endPos End position of the beam (hit point or max range)
     * @param {boolean} isHit Whether this beam hit a target
     * @param {number} fadeTime Time in seconds for the beam to fade
     */
    createInstantTracer(startPos: THREE.Vector3, endPos: THREE.Vector3, isHit: boolean = false, fadeTime: number = 0.5) {
        return this.explosionEffects.createInstantTracer(startPos, endPos, isHit, fadeTime, this._addToScene.bind(this));
    }

    /**
     * Update active tracer beams - fade them out from start to end
     * @param {number} deltaTime Time since last update
     */
    updateTracers(deltaTime: number) {
        this.explosionEffects.updateTracers(deltaTime, this._removeFromScene.bind(this));
    }

    /**
     * Create a laser burst effect that travels forward with the projectile
     * @param {THREE.Vector3} position Position for the effect
     * @param {THREE.Vector3} direction Direction the effect should travel
     */
    createMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3, poolManager: any) {
        return this.projectileEffects.createMuzzleFlash(position, direction, poolManager);
    }

    /**
     * Add a dynamic particle trail to a projectile (Simplified for Lasers)
     * @param {THREE.Mesh} projectile The projectile mesh
     * @param {THREE.Vector3} direction Direction of travel
     * @param {Object} poolManager Pool manager for getting trail components
     */
    addProjectileTrail(projectile: THREE.Mesh, direction: THREE.Vector3, poolManager: any) {
        this.projectileEffects.addProjectileTrail(projectile, direction, poolManager);
    }

    /**
     * New method to visualize projectile trajectory
     */
    createAimingTracer(startPosition: THREE.Vector3, direction: THREE.Vector3, distance: number = 3000, poolManager: any) {
        return this.projectileEffects.createAimingTracer(startPosition, direction, distance, poolManager);
    }

    /**
     * Get material by type
     */
    getMaterial(type: string) {
        return this.materialManager.getMaterial(type);
    }

    // --- Renderer facade helpers to centralize scene mutations ---
    _addToScene(object: THREE.Object3D) {
        const renderer = (window as any).game && (window as any).game.renderer ? (window as any).game.renderer : null;
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => renderer.add(object));
        } else if (this.scene && typeof this.scene.add === 'function') {
            // Fallback for safety; may warn in dev via guard wrapper
            this.scene.add(object);
        }
    }

    _removeFromScene(object: THREE.Object3D) {
        const renderer = (window as any).game && (window as any).game.renderer ? (window as any).game.renderer : null;
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
