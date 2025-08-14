/**
 * Spark Factory Module
 * 
 * Handles creation and management of spark particle effects for impacts
 */

import * as THREE from 'three';

export class SparkFactory {
    constructor(sharedAssets) {
        this.sharedAssets = sharedAssets;
    }

    /**
     * Create a spark effect for impacts
     * @returns {THREE.Points} A spark particle system
     */
    createSparkEffect() {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Create spark positions
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Sparks shoot outward in a cone
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI * 0.3; // 30 degree cone
            const distance = Math.random() * 50 + 10;
            
            positions[i3] = Math.cos(angle) * Math.cos(elevation) * distance;
            positions[i3 + 1] = Math.sin(elevation) * distance;
            positions[i3 + 2] = Math.sin(angle) * Math.cos(elevation) * distance;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create spark material
        const material = this.sharedAssets.explosionParticleMaterial.clone();
        material.color.setHex(0xffee00); // Yellow sparks
        material.size = 2;
        
        const spark = new THREE.Points(geometry, material);
        
        spark.userData = {
            isSpark: true,
            effectType: 'spark',
            active: false,
            pooled: true,
            startTime: 0,
            duration: 500, // Short duration for sparks
            particleCount: particleCount,
            initialPositions: positions.slice()
        };
        
        return spark;
    }

    /**
     * Reset spark effect to initial state
     * @param {THREE.Points} spark - The spark effect to reset
     */
    resetSparkEffect(spark) {
        spark.position.set(0, 0, 0);
        spark.visible = false;
        
        spark.material.opacity = 1.0;
        spark.material.color.setHex(0xffee00);
        
        spark.userData.active = false;
        spark.userData.startTime = 0;
        spark.userData.duration = 500;
        
        // Reset positions
        const positions = spark.geometry.attributes.position.array;
        const initialPositions = spark.userData.initialPositions;
        for (let i = 0; i < positions.length; i++) {
            positions[i] = initialPositions[i];
        }
        spark.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Update all active spark effects
     * @param {Array} activeSparks - Array of active spark objects
     * @param {Function} releaseCallback - Function to call when spark should be released
     */
    updateSparks(activeSparks, releaseCallback) {
        for (const spark of activeSparks) {
            const elapsed = Date.now() - spark.userData.startTime;
            const duration = spark.userData.duration;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                releaseCallback(spark);
            } else {
                // Extend sparks along their trajectory
                const positions = spark.geometry.attributes.position.array;
                const initialPositions = spark.userData.initialPositions;
                const particleCount = spark.userData.particleCount;
                
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    const extension = 1 + progress * 3;
                    
                    positions[i3] = initialPositions[i3] * extension;
                    positions[i3 + 1] = initialPositions[i3 + 1] * extension;
                    positions[i3 + 2] = initialPositions[i3 + 2] * extension;
                }
                
                spark.geometry.attributes.position.needsUpdate = true;
                spark.material.opacity = 1 - progress;
            }
        }
    }
}