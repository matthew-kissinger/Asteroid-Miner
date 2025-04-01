/**
 * DeployableLaserSystem - Manages deployable laser turrets
 * 
 * This system handles targeting, firing, and damage application for player-owned deployable laser turrets.
 */

import { System } from '../../core/system.js';
import * as THREE from 'three';

export class DeployableLaserSystem extends System {
    constructor(world) {
        super(world);
        
        // Required components for entities this system processes
        this.requiredComponents = ['DeployableLaserComponent', 'TransformComponent', 'MeshComponent'];
        
        // Tracking properties
        this.player = null;
        
        // Visual state
        this.activeBeams = new Map(); // Map of entity ID to beam object
        
        // Subscribe to messages
        this.world.messageBus.subscribe('player.created', this.handlePlayerCreated.bind(this));
    }
    
    /**
     * Initialize the system
     */
    initialize() {
        console.log('Deployable Laser System initialized');
    }
    
    /**
     * Handle player creation
     * @param {Object} data Event data
     */
    handlePlayerCreated(data) {
        this.player = data.entity;
    }
    
    /**
     * Update all deployable lasers
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Get all deployable laser entities
        const laserEntities = this.world.getEntitiesWithComponents(this.requiredComponents);
        
        // Get all potential target entities (enemies)
        const targetEntities = this.world.getEntitiesByTag('enemy');
        
        // Update each laser
        for (const laserEntity of laserEntities) {
            const laserComponent = laserEntity.getComponent('DeployableLaserComponent');
            const transform = laserEntity.getComponent('TransformComponent');
            
            // Update cooldown
            if (laserComponent.fireCooldown > 0) {
                laserComponent.fireCooldown -= deltaTime;
            }
            
            // Find a target if don't have one or current target is invalid
            if (!laserComponent.targetEntityId || !this.isValidTarget(laserComponent.targetEntityId)) {
                this.findTarget(laserEntity, laserComponent, transform, targetEntities);
            }
            
            // If we have a valid target and can fire, shoot at it
            if (laserComponent.targetEntityId && laserComponent.canFire()) {
                this.fireAtTarget(laserEntity, laserComponent);
            }
            
            // Cleanup any beam visuals
            this.updateBeamVisuals(laserEntity.id, deltaTime);
        }
    }
    
    /**
     * Find a valid target for the laser
     * @param {Entity} laserEntity The laser entity
     * @param {Object} laserComponent The laser component
     * @param {Object} transform The transform component
     * @param {Entity[]} potentialTargets List of potential targets
     */
    findTarget(laserEntity, laserComponent, transform, potentialTargets) {
        const laserPosition = transform.position;
        let closestTarget = null;
        let closestDistance = Infinity;
        
        // Find the closest valid target within range
        for (const target of potentialTargets) {
            // Skip already destroyed targets
            const healthComponent = target.getComponent('HealthComponent');
            if (!healthComponent || healthComponent.isDestroyed) {
                continue;
            }
            
            // Get target position
            const targetTransform = target.getComponent('TransformComponent');
            if (!targetTransform) continue;
            
            // Calculate distance
            const distance = targetTransform.position.distanceTo(laserPosition);
            
            // Check if in range and closer than current closest
            if (distance <= laserComponent.range && distance < closestDistance) {
                closestTarget = target;
                closestDistance = distance;
            }
        }
        
        // Set the target
        laserComponent.targetEntityId = closestTarget ? closestTarget.id : null;
    }
    
    /**
     * Check if a target is still valid
     * @param {string} targetId The target entity ID
     * @returns {boolean} Whether the target is valid
     */
    isValidTarget(targetId) {
        const entity = this.world.getEntity(targetId);
        if (!entity) return false;
        
        const healthComponent = entity.getComponent('HealthComponent');
        if (!healthComponent || healthComponent.isDestroyed) return false;
        
        return true;
    }
    
    /**
     * Fire the laser at the current target
     * @param {Entity} laserEntity The laser entity
     * @param {Object} laserComponent The laser component
     */
    fireAtTarget(laserEntity, laserComponent) {
        // Get the target entity
        const targetEntity = this.world.getEntity(laserComponent.targetEntityId);
        if (!targetEntity) {
            laserComponent.targetEntityId = null;
            return;
        }
        
        // Roll for accuracy
        const hit = Math.random() <= laserComponent.accuracy;
        
        if (hit) {
            // Apply damage to target
            const healthComponent = targetEntity.getComponent('HealthComponent');
            if (healthComponent) {
                // Ensure we can reference the entity in the event
                const entityId = targetEntity.id;
                const entityType = targetEntity.hasTag('enemy') ? 'enemy' : 'unknown';
                
                try {
                    // Make sure to set a large enough damage to one-shot any enemy
                    const damageAmount = Math.max(healthComponent.health + healthComponent.shield, 1000);
                    
                    // Apply the damage
                    healthComponent.applyDamage(damageAmount);
                    
                    // Set entity as destroyed
                    healthComponent.isDestroyed = true;
                    
                    // Publish damage event with proper entity reference
                    this.world.messageBus.publish('entity.damaged', {
                        entity: targetEntity,
                        entityId: entityId,
                        entityType: entityType,
                        damage: damageAmount,
                        sourceId: laserEntity.id,
                        sourceType: 'deployableLaser'
                    });
                    
                    // Publish entity destroyed event with the full entity object
                    this.world.messageBus.publish('entity.destroyed', {
                        entity: targetEntity,
                        entityId: entityId,
                        entityType: entityType,
                        sourceId: laserEntity.id,
                        sourceType: 'deployableLaser'
                    });
                    
                    // Directly destroy the entity
                    if (this.world && this.world.destroyEntity) {
                        // Get the mesh component to remove from scene first
                        const meshComponent = targetEntity.getComponent('MeshComponent');
                        if (meshComponent && meshComponent.mesh) {
                            // Remove from scene before destroying
                            this.world.scene.remove(meshComponent.mesh);
                        }
                        
                        // Destroy the entity
                        setTimeout(() => {
                            try {
                                this.world.destroyEntity(targetEntity);
                            } catch (error) {
                                console.error("Error destroying entity:", error);
                            }
                        }, 10); // Small delay to ensure event processing happens first
                    }
                    
                    console.log(`Deployable laser ${laserEntity.id} hit and destroyed target ${targetEntity.id}`);
                } catch (error) {
                    console.error("Error applying damage:", error);
                }
            }
        } else {
            console.log(`Deployable laser ${laserEntity.id} missed target ${targetEntity.id}`);
        }
        
        // Create visual effect
        try {
            this.createFireVisual(laserEntity, targetEntity, hit);
        } catch (error) {
            console.error("Error creating visual effect:", error);
        }
        
        // Reset cooldown
        laserComponent.resetCooldown();
    }
    
    /**
     * Create visual beam effect for firing
     * @param {Entity} laserEntity The laser entity
     * @param {Entity} targetEntity The target entity
     * @param {boolean} hit Whether the shot hit
     */
    createFireVisual(laserEntity, targetEntity, hit) {
        try {
            const laserComponent = laserEntity.getComponent('DeployableLaserComponent');
            const laserTransform = laserEntity.getComponent('TransformComponent');
            const targetTransform = targetEntity.getComponent('TransformComponent');
            const meshComponent = laserEntity.getComponent('MeshComponent');
            
            if (!laserTransform || !targetTransform) {
                console.error("Missing required transform component for visual effect");
                return;
            }
            
            // Get the target position
            const targetPos = targetTransform.position.clone();
            
            // Calculate base position of the laser entity
            const basePos = laserTransform.position.clone();
            
            // Determine which emitter to use based on positions
            // Calculate emitter positions relative to the base
            const scale = 20; // Should match the scale in deploymentSystem.js
            const emitterPositions = [
                new THREE.Vector3(basePos.x + 3.5 * scale, basePos.y + 3.5 * scale, basePos.z),
                new THREE.Vector3(basePos.x - 3.5 * scale, basePos.y + 3.5 * scale, basePos.z),
                new THREE.Vector3(basePos.x, basePos.y - 3.5 * scale, basePos.z + 3.5 * scale),
                new THREE.Vector3(basePos.x, basePos.y + 3.5 * scale, basePos.z - 3.5 * scale)
            ];
            
            // Find closest emitter to target
            let closestEmitter = null;
            let minDistance = Infinity;
            for (const emitterPos of emitterPositions) {
                const dist = emitterPos.distanceTo(targetPos);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestEmitter = emitterPos;
                }
            }
            
            // Use the closest emitter as the start position
            const start = closestEmitter;
            const end = targetPos;
            const direction = new THREE.Vector3().subVectors(end, start).normalize();
            const distance = start.distanceTo(end);
            
            // Create a basic cylinder representing the laser beam
            const beamWidth = 5; // Increased width for more visibility
            const beamGeometry = new THREE.CylinderGeometry(beamWidth, beamWidth, distance, 12);
            beamGeometry.rotateX(Math.PI / 2); // Align with z-axis
            beamGeometry.translate(0, 0, distance / 2); // Move pivot to base of cylinder
            
            // More impressive material with emissive properties
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF0033,
                transparent: true,
                opacity: 0.8,
                emissive: 0xFF0000,
                emissiveIntensity: 1.0
            });
            
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            
            // Set position and orientation
            beam.position.copy(start);
            beam.lookAt(end);
            
            // Add to scene
            this.world.scene.add(beam);
            
            // Store the beam for later cleanup with a lifetime of 0.2 seconds
            this.activeBeams.set(laserEntity.id, {
                mesh: beam,
                lifetime: 0.2,
                hit: hit
            });
            
            // If the shot hit, create an impact effect
            if (hit) {
                // Use the standard explosion effect by publishing an event
                this.world.messageBus.publish('vfx.explosion', {
                    position: end,
                    scale: 1.5, // Make it a bit larger than standard
                    color: 0xFF3333
                });
            }
        } catch (error) {
            console.error("Error creating laser visual effect:", error);
        }
    }
    
    /**
     * Update and clean up beam visuals
     * @param {string} entityId The laser entity ID
     * @param {number} deltaTime Time since last update
     */
    updateBeamVisuals(entityId, deltaTime) {
        if (this.activeBeams.has(entityId)) {
            const beamData = this.activeBeams.get(entityId);
            
            // Skip if beam data is invalid
            if (!beamData || !beamData.mesh) {
                this.activeBeams.delete(entityId);
                return;
            }
            
            // Reduce lifetime
            beamData.lifetime -= deltaTime;
            
            // If beam has expired, remove it
            if (beamData.lifetime <= 0) {
                try {
                    this.world.scene.remove(beamData.mesh);
                    
                    // Clean up resources
                    if (beamData.mesh.geometry) beamData.mesh.geometry.dispose();
                    if (beamData.mesh.material) beamData.mesh.material.dispose();
                    
                    this.activeBeams.delete(entityId);
                } catch (error) {
                    console.error("Error removing beam visual:", error);
                    this.activeBeams.delete(entityId);
                }
            }
            // Otherwise, fade it out
            else {
                beamData.mesh.material.opacity = beamData.lifetime / 0.2 * 0.7;
            }
        }
    }
} 