/**
 * Missile Projectile Pool
 * 
 * Manages pooling of missile projectiles with their unique characteristics:
 * - Explosive warheads
 * - Guidance systems
 * - Trail effects
 * - Area of effect damage
 */

import { ObjectPool } from '../../ObjectPool.js';
import * as THREE from 'three';

export class MissileProjectilePool {
    /**
     * Create a new MissileProjectilePool
     * @param {object} sharedAssets - Shared geometries and materials
     * @param {function} addToScene - Function to add objects to scene
     * @param {function} removeFromParent - Function to remove objects from parent
     */
    constructor(sharedAssets, addToScene, removeFromParent) {
        this.sharedAssets = sharedAssets;
        this._addToScene = addToScene;
        this._removeFromParent = removeFromParent;
        
        this.initializePool();
    }
    
    /**
     * Initialize the missile projectile pool
     */
    initializePool() {
        this.pool = new ObjectPool(
            // Create function
            () => this.createMissileProjectile(),
            // Reset function
            (projectile) => this.resetMissileProjectile(projectile),
            20, // Initial size - missiles less common than lasers
            8   // Expand size
        );
    }
    
    /**
     * Create a new missile projectile
     * @returns {THREE.Mesh} A missile projectile mesh
     */
    createMissileProjectile() {
        // Create main projectile mesh (slightly larger for missiles)
        const projectile = new THREE.Mesh(
            this.sharedAssets.projectileGeometry, 
            this.sharedAssets.projectileMaterial.clone()
        );
        
        // Create glow for missile exhaust
        const glowMesh = new THREE.Mesh(
            this.sharedAssets.projectileGlowGeometry, 
            this.sharedAssets.projectileGlowMaterial.clone()
        );
        
        // Missile-specific material modifications
        projectile.material.color.setHex(0xff4400); // Orange missile color
        projectile.material.emissive.setHex(0x441100); // Warm emissive
        
        // Exhaust glow for missile
        glowMesh.material.color.setHex(0xff6600);
        glowMesh.material.opacity = 0.7;
        glowMesh.scale.set(1.2, 1.2, 2.0); // Elongated exhaust trail
        
        // Scale up missile slightly
        projectile.scale.set(1.3, 1.3, 1.8);
        
        projectile.add(glowMesh);
        
        // Set up userData with missile-specific properties
        projectile.userData = {
            isProjectile: true,
            projectileType: 'missile',
            active: false,
            pooled: true,
            glowMesh: glowMesh,
            speed: 800, // Slower than lasers but guided
            damage: 75,
            aoeRadius: 100, // Area of effect damage
            guidance: true, // Can track targets
            fuelTime: 5000, // 5 seconds of fuel
            explosionRadius: 120
        };
        
        return projectile;
    }
    
    /**
     * Reset a missile projectile to initial state
     * @param {THREE.Mesh} projectile - The projectile to reset
     */
    resetMissileProjectile(projectile) {
        // Reset position, velocity and visibility
        projectile.position.set(0, 0, 0);
        projectile.rotation.set(0, 0, 0);
        projectile.scale.set(1.3, 1.3, 1.8); // Restore missile scale
        projectile.visible = false;
        
        // Reset material properties to missile defaults
        projectile.material.color.setHex(0xff4400);
        projectile.material.emissive.setHex(0x441100);
        projectile.material.opacity = 1.0;
        
        // Reset glow properties
        if (projectile.userData.glowMesh) {
            projectile.userData.glowMesh.material.opacity = 0.7;
            projectile.userData.glowMesh.scale.set(1.2, 1.2, 2.0);
        }
        
        // Clean up any lingering references
        projectile.userData.active = false;
        projectile.userData.creationTime = 0;
        projectile.userData.entityId = null;
        projectile.userData.trail = null;
        projectile.userData.trailParticles = null;
        projectile.userData.target = null;
        projectile.userData.firedBy = null;
        projectile.userData.fuelRemaining = projectile.userData.fuelTime;
        projectile.userData.guidanceActive = true;
        projectile.userData.hasExploded = false;
    }
    
    /**
     * Get a missile projectile from the pool
     * @returns {THREE.Mesh} A missile projectile mesh
     */
    get() {
        const projectile = this.pool.get();
        projectile.visible = true;
        projectile.userData.active = true;
        projectile.userData.creationTime = performance.now();
        projectile.userData.fuelRemaining = projectile.userData.fuelTime;
        projectile.userData.guidanceActive = true;
        projectile.userData.hasExploded = false;
        
        // Add to scene if not already there
        if (!projectile.parent) {
            this._addToScene(projectile);
        }
        
        return projectile;
    }
    
    /**
     * Release a missile projectile back to the pool
     * @param {THREE.Mesh} projectile - The projectile to release
     */
    release(projectile) {
        // Skip if not a valid missile projectile
        if (!projectile || !projectile.userData || 
            !projectile.userData.isProjectile || 
            projectile.userData.projectileType !== 'missile') {
            return;
        }
        
        // Remove from scene
        if (projectile.parent) {
            this._removeFromParent(projectile);
        }
        
        // Return to pool
        this.pool.release(projectile);
    }
    
    /**
     * Update missile-specific behavior (fuel consumption, guidance)
     * @param {THREE.Mesh} projectile - The missile to update
     * @param {number} deltaTime - Time since last update
     */
    updateMissile(projectile, deltaTime) {
        if (!projectile.userData.active) return;
        
        // Consume fuel
        projectile.userData.fuelRemaining -= deltaTime;
        
        // Disable guidance when fuel runs out
        if (projectile.userData.fuelRemaining <= 0) {
            projectile.userData.guidanceActive = false;
            
            // Dim the exhaust glow when out of fuel
            if (projectile.userData.glowMesh) {
                projectile.userData.glowMesh.material.opacity *= 0.95;
            }
        }
        
        // Update exhaust intensity based on fuel
        if (projectile.userData.glowMesh && projectile.userData.fuelRemaining > 0) {
            const fuelRatio = projectile.userData.fuelRemaining / projectile.userData.fuelTime;
            projectile.userData.glowMesh.material.opacity = 0.7 * fuelRatio;
        }
    }
    
    /**
     * Get count of available projectiles in pool
     * @returns {number} Available count
     */
    availableCount() {
        return this.pool.availableCount();
    }
    
    /**
     * Get count of active projectiles
     * @returns {number} Active count
     */
    activeCount() {
        return this.pool.activeCount();
    }
    
    /**
     * Get all active missile projectiles
     * @returns {Set} Set of active projectiles
     */
    getActive() {
        return this.pool.active;
    }
    
    /**
     * Dispose the missile projectile pool
     * @param {function} disposeFn - Custom dispose function
     */
    dispose(disposeFn) {
        this.pool.dispose((projectile) => {
            // Remove from scene
            if (projectile.parent) {
                this._removeFromParent(projectile);
            }
            
            // Clean up materials (cloned per projectile)
            if (projectile.material) {
                projectile.material.dispose();
            }
            
            if (projectile.userData.glowMesh && projectile.userData.glowMesh.material) {
                projectile.userData.glowMesh.material.dispose();
            }
            
            // Call custom dispose if provided
            if (disposeFn) {
                disposeFn(projectile);
            }
        });
    }
}