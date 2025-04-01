/**
 * OptimizedMovementSystem
 * 
 * [PRESERVED FOR FUTURE SCALING]
 * This optimized system is currently not used in the main game, but is preserved for
 * future performance optimization when scaling to many entities. This system works with
 * the optimized components to provide faster physics updates by:
 * 
 * 1. Operating directly on TypedArrays instead of individual component objects
 * 2. Better cache usage through contiguous memory access patterns
 * 3. Reduced garbage collection overhead
 * 
 * Would be valuable for implementing:
 * - Large asteroid fields
 * - Space battles with many ships
 * - Particle effects
 */

import * as THREE from 'three';
import { System } from '../../core/system.js';
import { OptimizedTransformComponent } from '../../components/optimized/transformComponent.js';
import { OptimizedRigidbodyComponent } from '../../components/optimized/rigidbodyComponent.js';

export class OptimizedMovementSystem extends System {
    constructor(world) {
        super(world);
        this.priority = 10; // Run early in the frame
        this.requiredComponents = [OptimizedTransformComponent, OptimizedRigidbodyComponent];
        
        // Get the data stores from the component singletons
        this.transformDataStore = OptimizedTransformComponent.dataStore;
        this.rigidbodyDataStore = OptimizedRigidbodyComponent.dataStore;
        
        // Temporary vectors for calculations
        this._acceleration = new THREE.Vector3();
        this._angularAcceleration = new THREE.Vector3();
        this._tempVelocity = new THREE.Vector3();
        this._tempAngularVelocity = new THREE.Vector3();
        this._tempQuaternion = new THREE.Quaternion();
        this._deltaRotation = new THREE.Quaternion();
        
        // Cache for entity IDs by components
        this.entityIds = [];
        this.dirtyEntityIds = true;
    }
    
    /**
     * Initialize the system
     */
    initialize() {
        // Ensure we have the data stores
        if (!this.transformDataStore) {
            this.transformDataStore = OptimizedTransformComponent.dataStore;
        }
        
        if (!this.rigidbodyDataStore) {
            this.rigidbodyDataStore = OptimizedRigidbodyComponent.dataStore;
        }
        
        // Subscribe to entity created/destroyed events to invalidate cache
        this.world.messageBus.subscribe('entity.created', () => {
            this.dirtyEntityIds = true;
        });
        
        this.world.messageBus.subscribe('entity.destroyed', () => {
            this.dirtyEntityIds = true;
        });
        
        this.world.messageBus.subscribe('component.added', () => {
            this.dirtyEntityIds = true;
        });
        
        this.world.messageBus.subscribe('component.removed', () => {
            this.dirtyEntityIds = true;
        });
    }
    
    /**
     * Update all entities with physics movement
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.enabled) return;
        
        // Update entity cache if needed
        if (this.dirtyEntityIds) {
            this.updateEntityCache();
        }
        
        // Process entities in batch
        this.processEntitiesBatch(deltaTime);
    }
    
    /**
     * Process all entities in a batched operation for better performance
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntitiesBatch(deltaTime) {
        const transformStore = this.transformDataStore;
        const rigidbodyStore = this.rigidbodyDataStore;
        
        if (!transformStore || !rigidbodyStore) return;
        
        // Process all entities
        for (const entityId of this.entityIds) {
            // Get indices
            const transformIndex = transformStore.getIndex(entityId);
            const rigidbodyIndex = rigidbodyStore.getIndex(entityId);
            
            if (transformIndex === -1 || rigidbodyIndex === -1) continue;
            
            // Check if entity is kinematic
            const flagIdx = rigidbodyIndex * 4;
            const isKinematic = rigidbodyStore.flags[flagIdx] === 1;
            
            if (isKinematic) continue;
            
            // Get properties
            const propIdx = rigidbodyIndex * 4;
            const mass = rigidbodyStore.properties[propIdx];
            const drag = rigidbodyStore.properties[propIdx + 1];
            const angularDrag = rigidbodyStore.properties[propIdx + 2];
            
            // Force indices
            const forceIdx = rigidbodyIndex * 3;
            const torqueIdx = rigidbodyIndex * 3;
            
            // Velocity indices
            const velIdx = rigidbodyIndex * 3;
            const angVelIdx = rigidbodyIndex * 3;
            
            // Position indices
            const posIdx = transformIndex * 3;
            const quatIdx = transformIndex * 4;
            
            // Check for freeze rotation
            const freezeRotation = rigidbodyStore.flags[flagIdx + 1] === 1;
            
            // Calculate acceleration from forces (F = ma, a = F/m)
            const invMass = 1 / mass;
            this._acceleration.set(
                rigidbodyStore.forces[forceIdx] * invMass,
                rigidbodyStore.forces[forceIdx + 1] * invMass,
                rigidbodyStore.forces[forceIdx + 2] * invMass
            );
            
            // Update velocity with acceleration (v += a * dt)
            rigidbodyStore.velocities[velIdx] += this._acceleration.x * deltaTime;
            rigidbodyStore.velocities[velIdx + 1] += this._acceleration.y * deltaTime;
            rigidbodyStore.velocities[velIdx + 2] += this._acceleration.z * deltaTime;
            
            // Apply drag (v *= (1 - drag * dt))
            const dragFactor = 1 - drag * deltaTime;
            if (dragFactor > 0) { // Prevent negative values that would reverse velocity
                rigidbodyStore.velocities[velIdx] *= dragFactor;
                rigidbodyStore.velocities[velIdx + 1] *= dragFactor;
                rigidbodyStore.velocities[velIdx + 2] *= dragFactor;
            }
            
            // Update position with velocity (p += v * dt)
            transformStore.positions[posIdx] += rigidbodyStore.velocities[velIdx] * deltaTime;
            transformStore.positions[posIdx + 1] += rigidbodyStore.velocities[velIdx + 1] * deltaTime;
            transformStore.positions[posIdx + 2] += rigidbodyStore.velocities[velIdx + 2] * deltaTime;
            
            // Handle rotation if not frozen
            if (!freezeRotation) {
                // Calculate angular acceleration from torque
                this._angularAcceleration.set(
                    rigidbodyStore.torques[torqueIdx] * invMass,
                    rigidbodyStore.torques[torqueIdx + 1] * invMass,
                    rigidbodyStore.torques[torqueIdx + 2] * invMass
                );
                
                // Update angular velocity
                rigidbodyStore.angularVelocities[angVelIdx] += this._angularAcceleration.x * deltaTime;
                rigidbodyStore.angularVelocities[angVelIdx + 1] += this._angularAcceleration.y * deltaTime;
                rigidbodyStore.angularVelocities[angVelIdx + 2] += this._angularAcceleration.z * deltaTime;
                
                // Apply angular drag
                const angularDragFactor = 1 - angularDrag * deltaTime;
                if (angularDragFactor > 0) {
                    rigidbodyStore.angularVelocities[angVelIdx] *= angularDragFactor;
                    rigidbodyStore.angularVelocities[angVelIdx + 1] *= angularDragFactor;
                    rigidbodyStore.angularVelocities[angVelIdx + 2] *= angularDragFactor;
                }
                
                // Create a quaternion from the angular velocity
                const angVelMagnitude = Math.sqrt(
                    rigidbodyStore.angularVelocities[angVelIdx] * rigidbodyStore.angularVelocities[angVelIdx] +
                    rigidbodyStore.angularVelocities[angVelIdx + 1] * rigidbodyStore.angularVelocities[angVelIdx + 1] +
                    rigidbodyStore.angularVelocities[angVelIdx + 2] * rigidbodyStore.angularVelocities[angVelIdx + 2]
                );
                
                if (angVelMagnitude > 0.0001) { // Only update rotation if angular velocity is significant
                    const angle = angVelMagnitude * deltaTime;
                    this._tempAngularVelocity.set(
                        rigidbodyStore.angularVelocities[angVelIdx] / angVelMagnitude,
                        rigidbodyStore.angularVelocities[angVelIdx + 1] / angVelMagnitude,
                        rigidbodyStore.angularVelocities[angVelIdx + 2] / angVelMagnitude
                    );
                    
                    this._deltaRotation.setFromAxisAngle(this._tempAngularVelocity, angle);
                    
                    // Get current quaternion
                    this._tempQuaternion.set(
                        transformStore.quaternions[quatIdx],
                        transformStore.quaternions[quatIdx + 1],
                        transformStore.quaternions[quatIdx + 2],
                        transformStore.quaternions[quatIdx + 3]
                    );
                    
                    // Apply rotation
                    this._tempQuaternion.multiply(this._deltaRotation);
                    this._tempQuaternion.normalize(); // Ensure quaternion stays normalized
                    
                    // Store updated quaternion
                    transformStore.quaternions[quatIdx] = this._tempQuaternion.x;
                    transformStore.quaternions[quatIdx + 1] = this._tempQuaternion.y;
                    transformStore.quaternions[quatIdx + 2] = this._tempQuaternion.z;
                    transformStore.quaternions[quatIdx + 3] = this._tempQuaternion.w;
                }
            }
            
            // Mark transform as needing update
            transformStore.needsUpdate[transformIndex] = 1;
            
            // Reset forces and torques
            rigidbodyStore.forces[forceIdx] = 0;
            rigidbodyStore.forces[forceIdx + 1] = 0;
            rigidbodyStore.forces[forceIdx + 2] = 0;
            
            rigidbodyStore.torques[torqueIdx] = 0;
            rigidbodyStore.torques[torqueIdx + 1] = 0;
            rigidbodyStore.torques[torqueIdx + 2] = 0;
            
            // Signal that the entity moved
            if (this.world && this.world.messageBus) {
                const entity = this.world.getEntity(entityId);
                if (entity) {
                    this.world.messageBus.publish('entity.moved', {
                        entity: entity,
                        deltaTime: deltaTime
                    });
                }
            }
        }
    }
    
    /**
     * Update the cached list of entity IDs
     */
    updateEntityCache() {
        // Get entity IDs from both data stores
        const transformIds = this.transformDataStore ? this.transformDataStore.getEntityIds() : [];
        const rigidbodyIds = this.rigidbodyDataStore ? this.rigidbodyDataStore.getEntityIds() : [];
        
        // Only keep IDs that are in both data stores
        this.entityIds = transformIds.filter(id => rigidbodyIds.includes(id));
        this.dirtyEntityIds = false;
    }
} 