/**
 * MovementSystem - Updates entity positions based on physics
 * 
 * Handles velocity, forces, and position updates.
 */

import { System } from '../../core/system.js';

export class MovementSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['TransformComponent', 'RigidbodyComponent'];
        this.priority = 10; // Run early in the update cycle
    }
    
    /**
     * Process a single entity
     * @param {Entity} entity The entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntity(entity, deltaTime) {
        const transform = entity.getComponent('TransformComponent');
        const rigidbody = entity.getComponent('RigidbodyComponent');
        
        // Skip processing if rigidbody is kinematic
        if (rigidbody.isKinematic) return;
        
        // Integrate forces
        this._integrateForces(rigidbody, deltaTime);
        
        // Apply drag
        this._applyDrag(rigidbody, deltaTime);
        
        // Integrate velocity (update position)
        this._integrateVelocity(transform, rigidbody, deltaTime);
        
        // Integrate angular velocity (update rotation)
        this._integrateAngularVelocity(transform, rigidbody, deltaTime);
        
        // Reset forces for next frame
        rigidbody.resetForces();
        
        // Notify position changed
        this.world.messageBus.publish('entity.moved', {
            entity: entity,
            position: transform.position,
            rotation: transform.rotation
        });
    }
    
    /**
     * Integrate forces into velocity
     * @param {RigidbodyComponent} rigidbody Rigidbody component
     * @param {number} deltaTime Time step
     * @private
     */
    _integrateForces(rigidbody, deltaTime) {
        // Calculate acceleration from forces
        const acceleration = rigidbody.forces.clone().divideScalar(rigidbody.mass);
        
        // Apply acceleration to velocity
        rigidbody.velocity.add(acceleration.multiplyScalar(deltaTime));
        
        // Calculate angular acceleration from torque
        const angularAcceleration = rigidbody.torque.clone().divideScalar(rigidbody.mass);
        
        // Apply angular acceleration to angular velocity
        rigidbody.angularVelocity.add(angularAcceleration.multiplyScalar(deltaTime));
    }
    
    /**
     * Apply drag to velocity and angular velocity
     * @param {RigidbodyComponent} rigidbody Rigidbody component
     * @param {number} deltaTime Time step
     * @private
     */
    _applyDrag(rigidbody, deltaTime) {
        // Linear drag (velocity)
        const dragFactor = 1 - rigidbody.drag * deltaTime;
        const linearDragFactor = Math.max(0, dragFactor); // Prevent negative values
        rigidbody.velocity.multiplyScalar(linearDragFactor);
        
        // Angular drag (angular velocity)
        const angularDragFactor = 1 - rigidbody.angularDrag * deltaTime;
        const clampedAngularDragFactor = Math.max(0, angularDragFactor); // Prevent negative values
        rigidbody.angularVelocity.multiplyScalar(clampedAngularDragFactor);
    }
    
    /**
     * Integrate velocity into position
     * @param {TransformComponent} transform Transform component
     * @param {RigidbodyComponent} rigidbody Rigidbody component
     * @param {number} deltaTime Time step
     * @private
     */
    _integrateVelocity(transform, rigidbody, deltaTime) {
        // Calculate position change
        const positionDelta = rigidbody.velocity.clone().multiplyScalar(deltaTime);
        
        // Update position
        transform.position.add(positionDelta);
        transform.needsUpdate = true;
    }
    
    /**
     * Integrate angular velocity into rotation
     * @param {TransformComponent} transform Transform component
     * @param {RigidbodyComponent} rigidbody Rigidbody component
     * @param {number} deltaTime Time step
     * @private
     */
    _integrateAngularVelocity(transform, rigidbody, deltaTime) {
        // Skip if rotation is frozen
        if (rigidbody.freezeRotation) return;
        
        // Convert angular velocity to quaternion change
        const angularChange = rigidbody.angularVelocity.clone().multiplyScalar(deltaTime);
        
        // Create a quaternion from the angular change
        const rotationDelta = new THREE.Quaternion();
        rotationDelta.setFromEuler(new THREE.Euler(
            angularChange.x,
            angularChange.y,
            angularChange.z,
            'XYZ'
        ));
        
        // Apply rotation change using quaternion multiplication
        // This preserves the normalization of the quaternion
        transform.quaternion.multiply(rotationDelta);
        
        // Update the Euler angles from the quaternion
        transform.rotation.setFromQuaternion(transform.quaternion);
        
        transform.needsUpdate = true;
    }
}