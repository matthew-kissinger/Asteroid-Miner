/**
 * CameraSystem - Controls camera position and orientation
 * 
 * Manages camera following for entities and camera effects.
 */

import * as THREE from 'three';
import { System } from '../../core/system.js';

export class CameraSystem extends System {
    constructor(world, camera) {
        super(world);
        this.requiredComponents = ['TransformComponent']; // Applies to any entity with a transform
        this.priority = 90; // Run just before rendering
        
        // Camera reference
        this.camera = camera;
        
        // Target entity to follow
        this.targetEntityId = null;
        
        // Camera following parameters
        this.followDistance = 15;
        this.followHeight = 5;
        this.followLerpFactor = 0.1; // Lower = smoother but slower
        
        // Camera offset for third-person view
        this.cameraOffset = new THREE.Vector3(0, this.followHeight, this.followDistance);
        
        // Current camera target position
        this.targetPosition = new THREE.Vector3();
    }
    
    /**
     * Set the entity to follow
     * @param {Entity|string} entityOrId The entity or entity ID to follow
     */
    setTarget(entityOrId) {
        if (typeof entityOrId === 'string') {
            this.targetEntityId = entityOrId;
        } else if (entityOrId && entityOrId.id) {
            this.targetEntityId = entityOrId.id;
        } else {
            this.targetEntityId = null;
        }
    }
    
    /**
     * Update the camera position and orientation
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Skip if no camera or no target
        if (!this.camera || !this.targetEntityId) return;
        
        // Get target entity
        const targetEntity = this.world.getEntity(this.targetEntityId);
        if (!targetEntity) return;
        
        // Get target transform
        const transform = targetEntity.getComponent('TransformComponent');
        if (!transform) return;
        
        // Update camera position to follow target
        this.updateCameraFollow(transform, deltaTime);
    }
    
    /**
     * Update camera to follow target
     * @param {TransformComponent} targetTransform Target transform
     * @param {number} deltaTime Time since last update in seconds
     */
    updateCameraFollow(targetTransform, deltaTime) {
        // Calculate camera position in local coordinates
        const localOffset = this.cameraOffset.clone();
        
        // Convert to world coordinates
        const worldOffset = localOffset.clone().applyQuaternion(targetTransform.quaternion);
        
        // Calculate target camera position
        this.targetPosition.copy(targetTransform.position).add(worldOffset);
        
        // Smoothly interpolate current camera position to target position
        this.camera.position.lerp(this.targetPosition, this.followLerpFactor);
        
        // Look at the target's position
        this.camera.lookAt(targetTransform.position);
    }
    
    /**
     * Set camera follow parameters
     * @param {object} params Camera follow parameters
     * @param {number} params.distance Follow distance
     * @param {number} params.height Follow height
     * @param {number} params.lerpFactor Follow lerp factor
     */
    setFollowParameters(params) {
        if (params.distance !== undefined) {
            this.followDistance = params.distance;
            this.cameraOffset.z = this.followDistance;
        }
        
        if (params.height !== undefined) {
            this.followHeight = params.height;
            this.cameraOffset.y = this.followHeight;
        }
        
        if (params.lerpFactor !== undefined) {
            this.followLerpFactor = params.lerpFactor;
        }
    }
    
    /**
     * Apply camera shake effect
     * @param {number} intensity Shake intensity
     * @param {number} duration Shake duration in seconds
     */
    applyShake(intensity, duration) {
        // Simple implementation - in a real game you'd want a more sophisticated shake
        const startTime = this.world.time;
        const endTime = startTime + duration;
        
        // Store original camera position
        const originalPosition = this.camera.position.clone();
        
        // Create shake animation
        const animate = () => {
            const currentTime = this.world.time;
            
            if (currentTime < endTime) {
                // Calculate shake factor based on remaining time
                const remainingTime = endTime - currentTime;
                const shakeFactor = (remainingTime / duration) * intensity;
                
                // Apply random offset to camera
                this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeFactor;
                this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeFactor;
                this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeFactor;
                
                // Continue animation
                requestAnimationFrame(animate);
            } else {
                // Reset to original position
                this.camera.position.copy(originalPosition);
            }
        };
        
        // Start shake animation
        animate();
    }
}