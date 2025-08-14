/**
 * Laser Projectile Pool
 * 
 * Manages pooling of laser projectiles with their unique characteristics:
 * - High-energy beam appearance
 * - Bright glow effects
 * - Fast travel speed
 * - Energy discharge visual effects
 */

import { ObjectPool } from '../../ObjectPool.js';
import * as THREE from 'three';

export class LaserProjectilePool {
    /**
     * Create a new LaserProjectilePool
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
     * Initialize the laser projectile pool
     */
    initializePool() {
        this.pool = new ObjectPool(
            // Create function
            () => this.createLaserProjectile(),
            // Reset function
            (projectile) => this.resetLaserProjectile(projectile),
            30, // Initial size - lasers are common
            10  // Expand size
        );
    }
    
    /**
     * Create a new laser projectile
     * @returns {THREE.Mesh} A laser projectile mesh
     */
    createLaserProjectile() {
        // Create main projectile mesh
        const projectile = new THREE.Mesh(
            this.sharedAssets.projectileGeometry, 
            this.sharedAssets.projectileMaterial.clone()
        );
        
        // Create enhanced glow for laser
        const glowMesh = new THREE.Mesh(
            this.sharedAssets.projectileGlowGeometry, 
            this.sharedAssets.projectileGlowMaterial.clone()
        );
        
        // Laser-specific material modifications
        projectile.material.color.setHex(0x00ffff); // Cyan laser color
        projectile.material.emissive.setHex(0x004444); // Subtle emissive
        
        // Enhanced glow for laser
        glowMesh.material.color.setHex(0x00ffff);
        glowMesh.material.opacity = 0.8;
        glowMesh.scale.set(1.5, 1.5, 1.5); // Larger glow for lasers
        
        projectile.add(glowMesh);
        
        // Set up userData with laser-specific properties
        projectile.userData = {
            isProjectile: true,
            projectileType: 'laser',
            active: false,
            pooled: true,
            glowMesh: glowMesh,
            speed: 2000, // High speed for lasers
            damage: 25,
            penetration: true, // Lasers can penetrate
            energyDrain: 15
        };
        
        return projectile;
    }
    
    /**
     * Reset a laser projectile to initial state
     * @param {THREE.Mesh} projectile - The projectile to reset
     */
    resetLaserProjectile(projectile) {
        // Reset position, velocity and visibility
        projectile.position.set(0, 0, 0);
        projectile.rotation.set(0, 0, 0);
        projectile.scale.set(1, 1, 1);
        projectile.visible = false;
        
        // Reset material properties to laser defaults
        projectile.material.color.setHex(0x00ffff);
        projectile.material.emissive.setHex(0x004444);
        projectile.material.opacity = 1.0;
        
        // Reset glow properties
        if (projectile.userData.glowMesh) {
            projectile.userData.glowMesh.material.opacity = 0.8;
            projectile.userData.glowMesh.scale.set(1.5, 1.5, 1.5);
        }
        
        // Clean up any lingering references
        projectile.userData.active = false;
        projectile.userData.creationTime = 0;
        projectile.userData.entityId = null;
        projectile.userData.trail = null;
        projectile.userData.trailParticles = null;
        projectile.userData.target = null;
        projectile.userData.firedBy = null;
    }
    
    /**
     * Get a laser projectile from the pool
     * @returns {THREE.Mesh} A laser projectile mesh
     */
    get() {
        const projectile = this.pool.get();
        projectile.visible = true;
        projectile.userData.active = true;
        projectile.userData.creationTime = performance.now();
        
        // Add to scene if not already there
        if (!projectile.parent) {
            this._addToScene(projectile);
        }
        
        return projectile;
    }
    
    /**
     * Release a laser projectile back to the pool
     * @param {THREE.Mesh} projectile - The projectile to release
     */
    release(projectile) {
        // Skip if not a valid laser projectile
        if (!projectile || !projectile.userData || 
            !projectile.userData.isProjectile || 
            projectile.userData.projectileType !== 'laser') {
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
     * Get all active laser projectiles
     * @returns {Set} Set of active projectiles
     */
    getActive() {
        return this.pool.active;
    }
    
    /**
     * Dispose the laser projectile pool
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