/**
 * Bullet Projectile Pool
 * 
 * Manages pooling of bullet projectiles with their unique characteristics:
 * - Kinetic projectiles
 * - High velocity, low energy cost
 * - Minimal visual effects
 * - Physical impact damage
 */

import { ObjectPool } from '../../ObjectPool.js';
import * as THREE from 'three';

export class BulletProjectilePool {
    /**
     * Create a new BulletProjectilePool
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
     * Initialize the bullet projectile pool
     */
    initializePool() {
        this.pool = new ObjectPool(
            // Create function
            () => this.createBulletProjectile(),
            // Reset function
            (projectile) => this.resetBulletProjectile(projectile),
            40, // Initial size - bullets very common
            15  // Expand size
        );
    }
    
    /**
     * Create a new bullet projectile
     * @returns {THREE.Mesh} A bullet projectile mesh
     */
    createBulletProjectile() {
        // Create main projectile mesh (smaller for bullets)
        const projectile = new THREE.Mesh(
            this.sharedAssets.projectileGeometry, 
            this.sharedAssets.projectileMaterial.clone()
        );
        
        // Create minimal glow for bullet
        const glowMesh = new THREE.Mesh(
            this.sharedAssets.projectileGlowGeometry, 
            this.sharedAssets.projectileGlowMaterial.clone()
        );
        
        // Bullet-specific material modifications
        projectile.material.color.setHex(0xffdd00); // Yellow/gold bullet color
        projectile.material.emissive.setHex(0x332200); // Minimal emissive
        projectile.material.metalness = 0.8; // Metallic appearance
        projectile.material.roughness = 0.2;
        
        // Minimal glow for bullets
        glowMesh.material.color.setHex(0xffee44);
        glowMesh.material.opacity = 0.4; // Much less glow
        glowMesh.scale.set(0.8, 0.8, 0.8); // Smaller glow
        
        // Scale down bullet
        projectile.scale.set(0.7, 0.7, 1.5); // Smaller, more elongated
        
        projectile.add(glowMesh);
        
        // Set up userData with bullet-specific properties
        projectile.userData = {
            isProjectile: true,
            projectileType: 'bullet',
            active: false,
            pooled: true,
            glowMesh: glowMesh,
            speed: 2500, // Very high speed
            damage: 15,
            kinetic: true, // Physical impact
            energyDrain: 2, // Very low energy cost
            penetration: false,
            ricochet: true // Can ricochet off surfaces
        };
        
        return projectile;
    }
    
    /**
     * Reset a bullet projectile to initial state
     * @param {THREE.Mesh} projectile - The projectile to reset
     */
    resetBulletProjectile(projectile) {
        // Reset position, velocity and visibility
        projectile.position.set(0, 0, 0);
        projectile.rotation.set(0, 0, 0);
        projectile.scale.set(0.7, 0.7, 1.5); // Restore bullet scale
        projectile.visible = false;
        
        // Reset material properties to bullet defaults
        projectile.material.color.setHex(0xffdd00);
        projectile.material.emissive.setHex(0x332200);
        projectile.material.opacity = 1.0;
        projectile.material.metalness = 0.8;
        projectile.material.roughness = 0.2;
        
        // Reset glow properties
        if (projectile.userData.glowMesh) {
            projectile.userData.glowMesh.material.opacity = 0.4;
            projectile.userData.glowMesh.scale.set(0.8, 0.8, 0.8);
        }
        
        // Clean up any lingering references
        projectile.userData.active = false;
        projectile.userData.creationTime = 0;
        projectile.userData.entityId = null;
        projectile.userData.trail = null;
        projectile.userData.trailParticles = null;
        projectile.userData.target = null;
        projectile.userData.firedBy = null;
        projectile.userData.ricochetCount = 0;
        projectile.userData.spinRate = Math.random() * 0.1 + 0.05; // Random spin
    }
    
    /**
     * Get a bullet projectile from the pool
     * @returns {THREE.Mesh} A bullet projectile mesh
     */
    get() {
        const projectile = this.pool.get();
        projectile.visible = true;
        projectile.userData.active = true;
        projectile.userData.creationTime = performance.now();
        projectile.userData.ricochetCount = 0;
        projectile.userData.spinRate = Math.random() * 0.1 + 0.05;
        
        // Add to scene if not already there
        if (!projectile.parent) {
            this._addToScene(projectile);
        }
        
        return projectile;
    }
    
    /**
     * Release a bullet projectile back to the pool
     * @param {THREE.Mesh} projectile - The projectile to release
     */
    release(projectile) {
        // Skip if not a valid bullet projectile
        if (!projectile || !projectile.userData || 
            !projectile.userData.isProjectile || 
            projectile.userData.projectileType !== 'bullet') {
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
     * Update bullet-specific behavior (spinning, ricochet effects)
     * @param {THREE.Mesh} projectile - The bullet to update
     * @param {number} deltaTime - Time since last update
     */
    updateBullet(projectile, deltaTime) {
        if (!projectile.userData.active) return;
        
        // Apply spinning motion for realism
        projectile.rotation.z += projectile.userData.spinRate * deltaTime * 0.01;
        
        // Fade glow slightly over time for realism
        const age = performance.now() - projectile.userData.creationTime;
        const maxAge = 2000; // 2 seconds max visible lifetime
        const ageFactor = Math.max(0, 1 - (age / maxAge));
        
        if (projectile.userData.glowMesh) {
            projectile.userData.glowMesh.material.opacity = 0.4 * ageFactor;
        }
        
        // Reduce metallic sheen over distance (oxidation effect)
        if (projectile.material) {
            projectile.material.metalness = 0.8 * ageFactor;
        }
    }
    
    /**
     * Handle bullet ricochet logic
     * @param {THREE.Mesh} projectile - The bullet that ricocheted
     * @param {THREE.Vector3} newDirection - New direction after ricochet
     * @returns {boolean} True if ricochet was successful, false if bullet should be destroyed
     */
    handleRicochet(projectile, newDirection) {
        if (!projectile.userData.ricochet) return false;
        
        projectile.userData.ricochetCount++;
        
        // Bullets can ricochet up to 3 times
        if (projectile.userData.ricochetCount > 3) {
            return false;
        }
        
        // Reduce damage and speed with each ricochet
        const damageReduction = 0.7; // 30% damage loss per ricochet
        const speedReduction = 0.8;  // 20% speed loss per ricochet
        
        projectile.userData.damage *= damageReduction;
        projectile.userData.speed *= speedReduction;
        
        // Visual indication of ricochet (sparks could be added here)
        if (projectile.userData.glowMesh) {
            projectile.userData.glowMesh.material.color.setHex(0xff8800); // Orange sparks
            projectile.userData.glowMesh.material.opacity = 0.8;
        }
        
        return true;
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
     * Get all active bullet projectiles
     * @returns {Set} Set of active projectiles
     */
    getActive() {
        return this.pool.active;
    }
    
    /**
     * Dispose the bullet projectile pool
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