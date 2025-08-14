/**
 * Debris Factory Module
 * 
 * Handles creation and management of debris effects for impacts
 */

import * as THREE from 'three';

export class DebrisFactory {
    constructor() {
        // No shared assets needed for debris
    }

    /**
     * Create debris effect for impacts
     * @returns {THREE.Group} A debris group
     */
    createDebrisEffect() {
        const debris = new THREE.Group();
        const pieceCount = 8;
        
        for (let i = 0; i < pieceCount; i++) {
            // Create small debris pieces
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x666666,
                transparent: true,
                opacity: 0.8
            });
            
            const piece = new THREE.Mesh(geometry, material);
            
            // Random initial position and rotation
            piece.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            
            piece.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            // Store initial state for reset
            piece.userData = {
                initialPosition: piece.position.clone(),
                initialRotation: piece.rotation.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200
                ),
                angularVelocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                )
            };
            
            debris.add(piece);
        }
        
        debris.userData = {
            isDebris: true,
            effectType: 'debris',
            active: false,
            pooled: true,
            startTime: 0,
            duration: 2000, // 2 seconds for debris
            pieces: debris.children
        };
        
        return debris;
    }

    /**
     * Reset debris effect to initial state
     * @param {THREE.Group} debris - The debris effect to reset
     */
    resetDebrisEffect(debris) {
        debris.position.set(0, 0, 0);
        debris.visible = false;
        
        debris.userData.active = false;
        debris.userData.startTime = 0;
        debris.userData.duration = 2000;
        
        // Reset all debris pieces
        for (const piece of debris.children) {
            piece.position.copy(piece.userData.initialPosition);
            piece.rotation.copy(piece.userData.initialRotation);
            piece.material.opacity = 0.8;
            piece.scale.set(1, 1, 1);
        }
    }

    /**
     * Update all active debris effects
     * @param {Array} activeDebris - Array of active debris objects
     * @param {Function} releaseCallback - Function to call when debris should be released
     */
    updateDebris(activeDebris, releaseCallback) {
        for (const debris of activeDebris) {
            const elapsed = Date.now() - debris.userData.startTime;
            const duration = debris.userData.duration;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                releaseCallback(debris);
            } else {
                // Update debris pieces
                for (const piece of debris.children) {
                    // Apply velocity
                    piece.position.add(
                        piece.userData.velocity.clone().multiplyScalar(0.001 * 16) // Approximate 60fps deltaTime
                    );
                    
                    // Apply angular velocity
                    piece.rotation.x += piece.userData.angularVelocity.x * 16 * 0.01;
                    piece.rotation.y += piece.userData.angularVelocity.y * 16 * 0.01;
                    piece.rotation.z += piece.userData.angularVelocity.z * 16 * 0.01;
                    
                    // Fade out and scale down
                    piece.material.opacity = 0.8 * (1 - progress);
                    const scale = 1 - progress * 0.5;
                    piece.scale.set(scale, scale, scale);
                }
            }
        }
    }
}