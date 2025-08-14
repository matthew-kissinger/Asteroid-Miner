/**
 * Plasma Projectile Pool
 * 
 * Manages pooling of plasma projectiles with their unique characteristics:
 * - Ionized energy bolts
 * - Pulsing energy effects
 * - Medium speed and damage
 * - Electromagnetic interference
 */

import { ObjectPool } from '../../ObjectPool.js';
import * as THREE from 'three';

export class PlasmaProjectilePool {
    /**
     * Create a new PlasmaProjectilePool
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
     * Initialize the plasma projectile pool
     */
    initializePool() {
        this.pool = new ObjectPool(
            // Create function
            () => this.createPlasmaProjectile(),
            // Reset function
            (projectile) => this.resetPlasmaProjectile(projectile),
            25, // Initial size - medium usage
            8   // Expand size
        );
    }
    
    /**
     * Create a new plasma projectile
     * @returns {THREE.Mesh} A plasma projectile mesh
     */
    createPlasmaProjectile() {
        // Create main projectile mesh
        const projectile = new THREE.Mesh(
            this.sharedAssets.projectileGeometry, 
            this.sharedAssets.projectileMaterial.clone()
        );
        
        // Create plasma glow effect
        const glowMesh = new THREE.Mesh(
            this.sharedAssets.projectileGlowGeometry, 
            this.sharedAssets.projectileGlowMaterial.clone()
        );
        
        // Plasma-specific material modifications
        projectile.material.color.setHex(0x8800ff); // Purple plasma color
        projectile.material.emissive.setHex(0x440088); // Purple emissive
        
        // Pulsing glow for plasma
        glowMesh.material.color.setHex(0xaa00ff);
        glowMesh.material.opacity = 0.9;
        glowMesh.scale.set(1.3, 1.3, 1.3); // Medium glow size
        
        // Slightly enlarge plasma bolt
        projectile.scale.set(1.1, 1.1, 1.2);
        
        projectile.add(glowMesh);
        
        // Set up userData with plasma-specific properties
        projectile.userData = {
            isProjectile: true,
            projectileType: 'plasma',
            active: false,
            pooled: true,
            glowMesh: glowMesh,
            speed: 1200, // Medium speed
            damage: 40,
            empEffect: true, // Electromagnetic pulse
            energyDrain: 20,
            pulsePhase: 0, // For pulsing animation
            chargeLevel: 1.0
        };
        
        return projectile;
    }
    
    /**
     * Reset a plasma projectile to initial state
     * @param {THREE.Mesh} projectile - The projectile to reset
     */
    resetPlasmaProjectile(projectile) {
        // Reset position, velocity and visibility
        projectile.position.set(0, 0, 0);
        projectile.rotation.set(0, 0, 0);
        projectile.scale.set(1.1, 1.1, 1.2); // Restore plasma scale
        projectile.visible = false;
        
        // Reset material properties to plasma defaults
        projectile.material.color.setHex(0x8800ff);
        projectile.material.emissive.setHex(0x440088);
        projectile.material.opacity = 1.0;
        
        // Reset glow properties
        if (projectile.userData.glowMesh) {
            projectile.userData.glowMesh.material.opacity = 0.9;
            projectile.userData.glowMesh.scale.set(1.3, 1.3, 1.3);
        }
        
        // Clean up any lingering references
        projectile.userData.active = false;
        projectile.userData.creationTime = 0;
        projectile.userData.entityId = null;
        projectile.userData.trail = null;
        projectile.userData.trailParticles = null;
        projectile.userData.target = null;
        projectile.userData.firedBy = null;
        projectile.userData.pulsePhase = 0;
        projectile.userData.chargeLevel = 1.0;
    }
    
    /**
     * Get a plasma projectile from the pool
     * @returns {THREE.Mesh} A plasma projectile mesh
     */
    get() {
        const projectile = this.pool.get();
        projectile.visible = true;
        projectile.userData.active = true;
        projectile.userData.creationTime = performance.now();
        projectile.userData.pulsePhase = 0;
        projectile.userData.chargeLevel = 1.0;
        
        // Add to scene if not already there
        if (!projectile.parent) {
            this._addToScene(projectile);
        }
        
        return projectile;
    }
    
    /**
     * Release a plasma projectile back to the pool
     * @param {THREE.Mesh} projectile - The projectile to release
     */
    release(projectile) {
        // Skip if not a valid plasma projectile
        if (!projectile || !projectile.userData || 
            !projectile.userData.isProjectile || 
            projectile.userData.projectileType !== 'plasma') {
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
     * Update plasma-specific behavior (pulsing, charge decay)
     * @param {THREE.Mesh} projectile - The plasma to update
     * @param {number} deltaTime - Time since last update
     */
    updatePlasma(projectile, deltaTime) {
        if (!projectile.userData.active) return;
        
        const time = performance.now() * 0.001; // Convert to seconds
        
        // Update pulse phase for pulsing effect
        projectile.userData.pulsePhase = time * 4; // 4 Hz pulsing
        
        // Plasma charge decay over time
        const age = (time * 1000) - projectile.userData.creationTime;
        const maxAge = 3000; // 3 seconds max lifetime
        projectile.userData.chargeLevel = Math.max(0, 1 - (age / maxAge));
        
        // Apply pulsing glow effect
        if (projectile.userData.glowMesh) {
            const pulse = 0.5 + 0.5 * Math.sin(projectile.userData.pulsePhase);
            const chargeModifier = projectile.userData.chargeLevel;
            
            projectile.userData.glowMesh.material.opacity = 0.9 * pulse * chargeModifier;
            
            // Scale pulsing
            const scale = 1.3 + 0.2 * pulse * chargeModifier;
            projectile.userData.glowMesh.scale.set(scale, scale, scale);
        }
        
        // Fade core as charge depletes
        if (projectile.material) {
            const fadeIntensity = 0.5 + 0.5 * projectile.userData.chargeLevel;
            projectile.material.opacity = fadeIntensity;
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
     * Get all active plasma projectiles
     * @returns {Set} Set of active projectiles
     */
    getActive() {
        return this.pool.active;
    }
    
    /**
     * Dispose the plasma projectile pool
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