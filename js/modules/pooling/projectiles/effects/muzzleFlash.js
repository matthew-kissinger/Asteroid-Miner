/**
 * Muzzle Flash Effects Pool
 * 
 * Manages pooling of muzzle flash effects for weapon firing:
 * - Cone-shaped flash geometry
 * - Point light illumination
 * - Animated fade and travel effects
 * - Weapon-specific flash characteristics
 */

import { ObjectPool } from '../../ObjectPool.js';
import * as THREE from 'three';

export class MuzzleFlashPool {
    /**
     * Create a new MuzzleFlashPool
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
     * Initialize the muzzle flash pool
     */
    initializePool() {
        this.pool = new ObjectPool(
            // Create function
            () => this.createMuzzleFlash(),
            // Reset function
            (muzzleFlash) => this.resetMuzzleFlash(muzzleFlash),
            20, // Initial size
            5   // Expand size
        );
    }
    
    /**
     * Create a new muzzle flash effect
     * @returns {THREE.Mesh} A muzzle flash mesh
     */
    createMuzzleFlash() {
        // Create cone mesh for muzzle flash
        const muzzleFlash = new THREE.Mesh(
            this.sharedAssets.muzzleFlashGeometry, 
            this.sharedAssets.muzzleFlashMaterial.clone()
        );
        
        // Set up userData to track state
        muzzleFlash.userData = {
            isMuzzleFlash: true,
            effectType: 'muzzleFlash',
            active: false,
            pooled: true,
            startTime: 0,
            flashLight: null,
            weaponType: 'generic',
            burstDuration: 70, // Default burst duration
            initialPosition: new THREE.Vector3(),
            direction: new THREE.Vector3()
        };
        
        // Create a point light that will be attached to the flash
        const flashLight = new THREE.PointLight(0x00ffff, 200, 10, 2);
        flashLight.visible = false;
        this._addToScene(flashLight);
        
        // Store reference to light
        muzzleFlash.userData.flashLight = flashLight;
        
        return muzzleFlash;
    }
    
    /**
     * Reset a muzzle flash to initial state
     * @param {THREE.Mesh} muzzleFlash - The muzzle flash to reset
     */
    resetMuzzleFlash(muzzleFlash) {
        // Reset position, scale and visibility
        muzzleFlash.position.set(0, 0, 0);
        muzzleFlash.rotation.set(0, 0, 0);
        muzzleFlash.scale.set(1, 1, 1);
        muzzleFlash.visible = false;
        
        // Reset material opacity
        muzzleFlash.material.opacity = 0.7;
        muzzleFlash.material.color.setHex(0x00ffff); // Default cyan
        
        // Reset flash light
        const flashLight = muzzleFlash.userData.flashLight;
        if (flashLight) {
            flashLight.position.set(0, 0, 0);
            flashLight.intensity = 200;
            flashLight.color.setHex(0x00ffff);
            flashLight.visible = false;
        }
        
        // Reset state
        muzzleFlash.userData.active = false;
        muzzleFlash.userData.startTime = 0;
        muzzleFlash.userData.weaponType = 'generic';
        muzzleFlash.userData.burstDuration = 70;
        muzzleFlash.userData.initialPosition.set(0, 0, 0);
        muzzleFlash.userData.direction.set(0, 0, 1);
    }
    
    /**
     * Get a muzzle flash from the pool
     * @param {string} weaponType - Type of weapon firing
     * @param {THREE.Vector3} position - Position of the muzzle
     * @param {THREE.Vector3} direction - Direction of firing
     * @returns {THREE.Mesh} A muzzle flash mesh
     */
    getMuzzleFlash(weaponType = 'generic', position = null, direction = null) {
        const muzzleFlash = this.pool.get();
        muzzleFlash.visible = true;
        muzzleFlash.userData.active = true;
        muzzleFlash.userData.startTime = performance.now();
        muzzleFlash.userData.weaponType = weaponType;
        
        // Store initial position and direction for animation
        if (position) {
            muzzleFlash.position.copy(position);
            muzzleFlash.userData.initialPosition.copy(position);
        }
        
        if (direction) {
            muzzleFlash.userData.direction.copy(direction).normalize();
            // Orient flash along direction
            muzzleFlash.lookAt(position.clone().add(direction));
        }
        
        // Configure flash based on weapon type
        this.configureFlashForWeapon(muzzleFlash, weaponType);
        
        // Set up flash light
        const flashLight = muzzleFlash.userData.flashLight;
        if (flashLight) {
            flashLight.position.copy(muzzleFlash.position);
            flashLight.visible = true;
            this.configureLightForWeapon(flashLight, weaponType);
        }
        
        // Add to scene if not already there
        if (!muzzleFlash.parent) {
            this._addToScene(muzzleFlash);
        }
        
        return muzzleFlash;
    }
    
    /**
     * Configure muzzle flash appearance based on weapon type
     * @param {THREE.Mesh} muzzleFlash - The muzzle flash to configure
     * @param {string} weaponType - Type of weapon
     */
    configureFlashForWeapon(muzzleFlash, weaponType) {
        switch (weaponType) {
            case 'laser':
                muzzleFlash.material.color.setHex(0x00ffff); // Cyan
                muzzleFlash.scale.set(0.8, 0.8, 1.5); // Narrower, longer
                muzzleFlash.userData.burstDuration = 50; // Quick flash
                break;
                
            case 'missile':
                muzzleFlash.material.color.setHex(0xff4400); // Orange
                muzzleFlash.scale.set(1.5, 1.5, 2.0); // Large flash
                muzzleFlash.userData.burstDuration = 120; // Longer burst
                break;
                
            case 'plasma':
                muzzleFlash.material.color.setHex(0x8800ff); // Purple
                muzzleFlash.scale.set(1.2, 1.2, 1.8); // Medium size
                muzzleFlash.userData.burstDuration = 80; // Medium duration
                break;
                
            case 'bullet':
                muzzleFlash.material.color.setHex(0xffaa00); // Yellow-orange
                muzzleFlash.scale.set(0.6, 0.6, 1.0); // Small flash
                muzzleFlash.userData.burstDuration = 40; // Very quick
                break;
                
            default:
                muzzleFlash.material.color.setHex(0xffffff); // White
                muzzleFlash.scale.set(1, 1, 1);
                muzzleFlash.userData.burstDuration = 70;
                break;
        }
        
        // Set initial opacity
        muzzleFlash.material.opacity = 0.7;
    }
    
    /**
     * Configure point light based on weapon type
     * @param {THREE.PointLight} light - The light to configure
     * @param {string} weaponType - Type of weapon
     */
    configureLightForWeapon(light, weaponType) {
        switch (weaponType) {
            case 'laser':
                light.color.setHex(0x00ffff); // Cyan
                light.intensity = 150;
                light.distance = 8;
                break;
                
            case 'missile':
                light.color.setHex(0xff6600); // Orange
                light.intensity = 300;
                light.distance = 15;
                break;
                
            case 'plasma':
                light.color.setHex(0xaa00ff); // Purple
                light.intensity = 250;
                light.distance = 12;
                break;
                
            case 'bullet':
                light.color.setHex(0xffdd00); // Yellow
                light.intensity = 100;
                light.distance = 6;
                break;
                
            default:
                light.color.setHex(0xffffff); // White
                light.intensity = 200;
                light.distance = 10;
                break;
        }
    }
    
    /**
     * Update all active muzzle flashes
     * @param {number} deltaTime - Time since last update
     */
    updateMuzzleFlashes(deltaTime) {
        // Check all active muzzle flashes
        for (const muzzleFlash of this.pool.active) {
            const elapsed = performance.now() - muzzleFlash.userData.startTime;
            const burstDuration = muzzleFlash.userData.burstDuration;
            const progress = elapsed / burstDuration;
            
            if (progress >= 1) {
                // Animation complete, release back to pool
                this.release(muzzleFlash);
            } else {
                this.updateMuzzleFlashAnimation(muzzleFlash, progress, deltaTime);
            }
        }
    }
    
    /**
     * Update individual muzzle flash animation
     * @param {THREE.Mesh} muzzleFlash - The muzzle flash to update
     * @param {number} progress - Animation progress (0-1)
     * @param {number} deltaTime - Time since last update
     */
    updateMuzzleFlashAnimation(muzzleFlash, progress, deltaTime) {
        // Travel forward along direction
        const travelProgress = Math.min(progress * 2.5, 1);
        const travelDistance = 300;
        
        if (muzzleFlash.userData.initialPosition && muzzleFlash.userData.direction) {
            const newPosition = muzzleFlash.userData.initialPosition.clone().add(
                muzzleFlash.userData.direction.clone().multiplyScalar(travelDistance * travelProgress)
            );
            muzzleFlash.position.copy(newPosition);
            
            // Update the flash light position too
            if (muzzleFlash.userData.flashLight) {
                muzzleFlash.userData.flashLight.position.copy(newPosition);
            }
        }
        
        // Fade out over time
        muzzleFlash.material.opacity = 0.7 * (1 - progress);
        
        // Fade light intensity
        if (muzzleFlash.userData.flashLight) {
            const baseIntensity = this.getBaseLightIntensity(muzzleFlash.userData.weaponType);
            muzzleFlash.userData.flashLight.intensity = baseIntensity * (1 - progress * 3);
        }
        
        // Stretch effect - flash elongates as it travels
        const stretchFactor = 1 + progress * 1.5;
        const currentScale = muzzleFlash.scale.clone();
        muzzleFlash.scale.set(currentScale.x, currentScale.y, currentScale.z * stretchFactor);
        
        // Add slight flickering for realism
        const flicker = 0.9 + 0.1 * Math.sin(performance.now() * 0.02);
        muzzleFlash.material.opacity *= flicker;
    }
    
    /**
     * Get base light intensity for weapon type
     * @param {string} weaponType - Type of weapon
     * @returns {number} Base intensity
     */
    getBaseLightIntensity(weaponType) {
        switch (weaponType) {
            case 'laser': return 150;
            case 'missile': return 300;
            case 'plasma': return 250;
            case 'bullet': return 100;
            default: return 200;
        }
    }
    
    /**
     * Release a muzzle flash back to the pool
     * @param {THREE.Mesh} muzzleFlash - The muzzle flash to release
     */
    release(muzzleFlash) {
        // Skip if not a valid muzzle flash
        if (!muzzleFlash || !muzzleFlash.userData || !muzzleFlash.userData.isMuzzleFlash) {
            return;
        }
        
        // Hide the flash light
        const flashLight = muzzleFlash.userData.flashLight;
        if (flashLight) {
            flashLight.visible = false;
        }
        
        // Remove from scene
        if (muzzleFlash.parent) {
            this._removeFromParent(muzzleFlash);
        }
        
        // Return to pool
        this.pool.release(muzzleFlash);
    }
    
    /**
     * Get count of available muzzle flashes in pool
     * @returns {number} Available count
     */
    availableCount() {
        return this.pool.availableCount();
    }
    
    /**
     * Get count of active muzzle flashes
     * @returns {number} Active count
     */
    activeCount() {
        return this.pool.activeCount();
    }
    
    /**
     * Get all active muzzle flashes
     * @returns {Set} Set of active muzzle flashes
     */
    getActive() {
        return this.pool.active;
    }
    
    /**
     * Dispose the muzzle flash pool
     * @param {function} disposeFn - Custom dispose function
     */
    dispose(disposeFn) {
        this.pool.dispose((muzzleFlash) => {
            // Remove from scene
            if (muzzleFlash.parent) {
                this._removeFromParent(muzzleFlash);
            }
            
            // Remove flash light
            if (muzzleFlash.userData.flashLight) {
                if (muzzleFlash.userData.flashLight.parent) {
                    muzzleFlash.userData.flashLight.parent.remove(muzzleFlash.userData.flashLight);
                }
            }
            
            // Materials are cloned per muzzle flash
            if (muzzleFlash.material) {
                muzzleFlash.material.dispose();
            }
            
            // Call custom dispose if provided
            if (disposeFn) {
                disposeFn(muzzleFlash);
            }
        });
    }
}