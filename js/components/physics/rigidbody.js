/**
 * RigidbodyComponent - Physics properties for entities
 * 
 * Handles velocity, forces, and other physics-related properties.
 */

import { Component } from '../../core/component.js';

export class RigidbodyComponent extends Component {
    constructor(mass = 1.0) {
        super();
        
        // Basic physics properties
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();
        this.mass = mass;
        this.drag = 0.01;
        this.angularDrag = 0.01;
        
        // Movement constraints
        this.useGravity = false;
        this.isKinematic = false;
        this.freezeRotation = false;
        
        // Force properties
        this.forces = new THREE.Vector3();
        this.torque = new THREE.Vector3();
        
        // Collision properties
        this.collisionRadius = 1.0;
        this.isTrigger = false;
    }
    
    /**
     * Reset forces applied this frame
     */
    resetForces() {
        this.forces.set(0, 0, 0);
        this.torque.set(0, 0, 0);
    }
    
    /**
     * Apply a force to the rigidbody
     * @param {THREE.Vector3} force Force vector to apply
     * @param {THREE.Vector3} point Point where force is applied (for torque)
     */
    applyForce(force, point = null) {
        if (this.isKinematic) return;
        
        // Add to force accumulator
        this.forces.add(force);
        
        // Calculate torque if point is specified
        if (point) {
            const transformComponent = this.entity.getComponent('TransformComponent');
            if (transformComponent) {
                const relativePoint = point.clone().sub(transformComponent.position);
                const torque = relativePoint.cross(force);
                this.applyTorque(torque);
            }
        }
    }
    
    /**
     * Apply an impulse (immediate velocity change)
     * @param {THREE.Vector3} impulse Impulse vector
     */
    applyImpulse(impulse) {
        if (this.isKinematic) return;
        
        // Calculate velocity change based on mass
        const velocityChange = impulse.clone().divideScalar(this.mass);
        this.velocity.add(velocityChange);
    }
    
    /**
     * Apply torque (rotational force)
     * @param {THREE.Vector3} torque Torque vector
     */
    applyTorque(torque) {
        if (this.isKinematic || this.freezeRotation) return;
        
        this.torque.add(torque);
    }
    
    /**
     * Set velocity directly
     * @param {THREE.Vector3} velocity New velocity vector
     */
    setVelocity(velocity) {
        this.velocity.copy(velocity);
    }
    
    /**
     * Set angular velocity directly
     * @param {THREE.Vector3} angularVelocity New angular velocity vector
     */
    setAngularVelocity(angularVelocity) {
        if (this.freezeRotation) return;
        
        this.angularVelocity.copy(angularVelocity);
    }
}