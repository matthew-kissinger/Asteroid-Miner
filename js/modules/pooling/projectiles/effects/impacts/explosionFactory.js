/**
 * Explosion Factory Module
 * 
 * Handles creation and management of explosion particle systems
 */

import * as THREE from 'three';

export class ExplosionFactory {
    constructor(sharedAssets) {
        this.sharedAssets = sharedAssets;
    }

    /**
     * Create a new explosion effect
     * @returns {THREE.Points} An explosion particle system
     */
    createExplosion() {
        // Create particle geometry for explosion
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Randomize particle positions in a sphere
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = (Math.random() - 0.5) * 100;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create bright material with additive blending for glow effect
        const material = this.sharedAssets.explosionParticleMaterial.clone();
        
        // Create particle system
        const explosion = new THREE.Points(geometry, material);
        
        // Set up userData to track state
        explosion.userData = {
            isExplosion: true,
            effectType: 'explosion',
            active: false,
            pooled: true,
            startTime: 0,
            duration: 1000, // Default duration
            particleCount: particleCount,
            initialPositions: positions.slice() // Store initial positions
        };
        
        return explosion;
    }

    /**
     * Reset explosion to initial state
     * @param {THREE.Points} explosion - The explosion to reset
     */
    resetExplosion(explosion) {
        // Reset position and visibility
        explosion.position.set(0, 0, 0);
        explosion.visible = false;
        
        // Reset material opacity
        explosion.material.opacity = 1.0;
        explosion.material.color.setHex(0xff6600); // Default explosion color
        
        // Reset animation state
        explosion.userData.active = false;
        explosion.userData.startTime = 0;
        explosion.userData.duration = 1000;
        
        // Reset particle positions to initial random state
        const positions = explosion.geometry.attributes.position.array;
        const initialPositions = explosion.userData.initialPositions;
        for (let i = 0; i < positions.length; i++) {
            positions[i] = initialPositions[i];
        }
        explosion.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Update all active explosions
     * @param {Array} activeExplosions - Array of active explosion objects
     * @param {Function} releaseCallback - Function to call when explosion should be released
     */
    updateExplosions(activeExplosions, releaseCallback) {
        for (const explosion of activeExplosions) {
            const elapsed = Date.now() - explosion.userData.startTime;
            const duration = explosion.userData.duration;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                releaseCallback(explosion);
            } else {
                // Expand particles
                const positions = explosion.geometry.attributes.position.array;
                const initialPositions = explosion.userData.initialPositions;
                const particleCount = explosion.userData.particleCount;
                
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    const expansionFactor = 1 + progress * 5;
                    
                    positions[i3] = initialPositions[i3] * expansionFactor;
                    positions[i3 + 1] = initialPositions[i3 + 1] * expansionFactor;
                    positions[i3 + 2] = initialPositions[i3 + 2] * expansionFactor;
                }
                
                explosion.geometry.attributes.position.needsUpdate = true;
                explosion.material.opacity = 1 - progress;
            }
        }
    }
}