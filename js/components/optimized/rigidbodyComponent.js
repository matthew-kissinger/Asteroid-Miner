/**
 * OptimizedRigidbodyComponent - Physics properties for entities using data-oriented design
 * 
 * Optimized version of RigidbodyComponent that uses a data-oriented approach
 * with typed arrays for better performance.
 */

import { Component } from '../../core/component.js';
import { RigidbodyDataStore } from '../../core/dataStore.js';

// Singleton data store instance
let dataStore = null;

export class OptimizedRigidbodyComponent extends Component {
    constructor(mass = 1.0) {
        super();
        
        // Initialize the data store if it doesn't exist
        if (!dataStore) {
            dataStore = new RigidbodyDataStore();
            OptimizedRigidbodyComponent.dataStore = dataStore;
        }
        
        // These properties will be used for initialization once the component is attached to an entity
        this._mass = mass;
        this._drag = 0.01;
        this._angularDrag = 0.01;
        this._useGravity = false;
        this._isKinematic = false;
        this._freezeRotation = false;
        this._collisionRadius = 1.0;
        this._isTrigger = false;
        
        // Reusable objects for getters to avoid creating new objects
        this._velocity = new THREE.Vector3();
        this._angularVelocity = new THREE.Vector3();
        this._force = new THREE.Vector3();
        this._torque = new THREE.Vector3();
    }
    
    /**
     * Get the data store
     * @returns {RigidbodyDataStore} The rigidbody data store
     */
    static get dataStore() {
        if (!dataStore) {
            dataStore = new RigidbodyDataStore();
            OptimizedRigidbodyComponent.dataStore = dataStore;
        }
        return dataStore;
    }
    
    /**
     * Set the data store
     * @param {RigidbodyDataStore} store The rigidbody data store
     */
    static set dataStore(store) {
        dataStore = store;
    }
    
    /**
     * Called when the component is attached to an entity
     */
    onAttached() {
        if (!this.entity || !this.entity.id) {
            console.error('OptimizedRigidbodyComponent: Cannot attach to entity without ID');
            return;
        }
        
        // Allocate space in the data store
        dataStore.allocate(this.entity.id);
        
        // Set initial values
        dataStore.setMass(this.entity.id, this._mass);
        dataStore.setDrag(this.entity.id, this._drag);
        dataStore.setCollisionRadius(this.entity.id, this._collisionRadius);
        dataStore.setKinematic(this.entity.id, this._isKinematic);
        dataStore.setFreezeRotation(this.entity.id, this._freezeRotation);
    }
    
    /**
     * Called when the component is detached from an entity
     */
    onDetached() {
        if (this.entity && this.entity.id) {
            // Free the allocated space in the data store
            dataStore.free(this.entity.id);
        }
    }
    
    /**
     * Reset forces applied this frame
     */
    resetForces() {
        if (!this.entity || !this.entity.id) return;
        dataStore.resetForces(this.entity.id);
    }
    
    /**
     * Apply a force to the rigidbody
     * @param {THREE.Vector3} force Force vector to apply
     * @param {THREE.Vector3} point Point where force is applied (for torque)
     */
    applyForce(force, point = null) {
        if (!this.entity || !this.entity.id) return;
        
        // Add to force accumulator
        dataStore.applyForce(this.entity.id, force.x, force.y, force.z);
        
        // Calculate torque if point is specified
        if (point) {
            const transformComponent = this.entity.getComponent('OptimizedTransformComponent') || 
                                     this.entity.getComponent('TransformComponent');
            if (transformComponent) {
                const position = transformComponent.position;
                const relativePoint = point.clone().sub(position);
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
        if (!this.entity || !this.entity.id) return;
        dataStore.applyImpulse(this.entity.id, impulse.x, impulse.y, impulse.z);
    }
    
    /**
     * Apply torque (rotational force)
     * @param {THREE.Vector3} torque Torque vector
     */
    applyTorque(torque) {
        if (!this.entity || !this.entity.id) return;
        dataStore.applyTorque(this.entity.id, torque.x, torque.y, torque.z);
    }
    
    /**
     * Set velocity directly
     * @param {THREE.Vector3|number} velocityOrX Velocity vector or x component
     * @param {number} y Y component (if not using vector)
     * @param {number} z Z component (if not using vector)
     */
    setVelocity(velocityOrX, y, z) {
        if (!this.entity || !this.entity.id) return;
        
        let vx, vy, vz;
        
        if (velocityOrX instanceof THREE.Vector3) {
            vx = velocityOrX.x;
            vy = velocityOrX.y;
            vz = velocityOrX.z;
        } else {
            vx = velocityOrX;
            vy = y;
            vz = z;
        }
        
        dataStore.setVelocity(this.entity.id, vx, vy, vz);
    }
    
    /**
     * Set angular velocity directly
     * @param {THREE.Vector3|number} angularVelocityOrX Angular velocity vector or x component
     * @param {number} y Y component (if not using vector)
     * @param {number} z Z component (if not using vector)
     */
    setAngularVelocity(angularVelocityOrX, y, z) {
        if (!this.entity || !this.entity.id) return;
        
        let avx, avy, avz;
        
        if (angularVelocityOrX instanceof THREE.Vector3) {
            avx = angularVelocityOrX.x;
            avy = angularVelocityOrX.y;
            avz = angularVelocityOrX.z;
        } else {
            avx = angularVelocityOrX;
            avy = y;
            avz = z;
        }
        
        dataStore.setAngularVelocity(this.entity.id, avx, avy, avz);
    }
    
    /**
     * Get velocity
     * @returns {THREE.Vector3} The velocity
     */
    get velocity() {
        if (!this.entity || !this.entity.id) return new THREE.Vector3();
        return dataStore.getVelocity(this.entity.id, this._velocity);
    }
    
    /**
     * Get angular velocity
     * @returns {THREE.Vector3} The angular velocity
     */
    get angularVelocity() {
        if (!this.entity || !this.entity.id) return new THREE.Vector3();
        return dataStore.getAngularVelocity(this.entity.id, this._angularVelocity);
    }
    
    /**
     * Set mass
     * @param {number} value The new mass value
     */
    set mass(value) {
        this._mass = value;
        if (this.entity && this.entity.id) {
            dataStore.setMass(this.entity.id, value);
        }
    }
    
    /**
     * Get mass
     * @returns {number} The mass
     */
    get mass() {
        if (!this.entity || !this.entity.id) return this._mass;
        const index = dataStore.getIndex(this.entity.id);
        if (index === -1) return this._mass;
        return dataStore.properties[index * 4];
    }
    
    /**
     * Set drag
     * @param {number} value The new drag value
     */
    set drag(value) {
        this._drag = value;
        if (this.entity && this.entity.id) {
            dataStore.setDrag(this.entity.id, value);
        }
    }
    
    /**
     * Get drag
     * @returns {number} The drag
     */
    get drag() {
        if (!this.entity || !this.entity.id) return this._drag;
        const index = dataStore.getIndex(this.entity.id);
        if (index === -1) return this._drag;
        return dataStore.properties[index * 4 + 1];
    }
    
    /**
     * Set angular drag
     * @param {number} value The new angular drag value
     */
    set angularDrag(value) {
        this._angularDrag = value;
        if (this.entity && this.entity.id) {
            const index = dataStore.getIndex(this.entity.id);
            if (index !== -1) {
                dataStore.properties[index * 4 + 2] = value;
            }
        }
    }
    
    /**
     * Get angular drag
     * @returns {number} The angular drag
     */
    get angularDrag() {
        if (!this.entity || !this.entity.id) return this._angularDrag;
        const index = dataStore.getIndex(this.entity.id);
        if (index === -1) return this._angularDrag;
        return dataStore.properties[index * 4 + 2];
    }
    
    /**
     * Set collision radius
     * @param {number} value The new collision radius
     */
    set collisionRadius(value) {
        this._collisionRadius = value;
        if (this.entity && this.entity.id) {
            dataStore.setCollisionRadius(this.entity.id, value);
        }
    }
    
    /**
     * Get collision radius
     * @returns {number} The collision radius
     */
    get collisionRadius() {
        if (!this.entity || !this.entity.id) return this._collisionRadius;
        const index = dataStore.getIndex(this.entity.id);
        if (index === -1) return this._collisionRadius;
        return dataStore.properties[index * 4 + 3];
    }
    
    /**
     * Set kinematic flag
     * @param {boolean} value The new kinematic state
     */
    set isKinematic(value) {
        this._isKinematic = value;
        if (this.entity && this.entity.id) {
            dataStore.setKinematic(this.entity.id, value);
        }
    }
    
    /**
     * Get kinematic flag
     * @returns {boolean} The kinematic state
     */
    get isKinematic() {
        if (!this.entity || !this.entity.id) return this._isKinematic;
        const index = dataStore.getIndex(this.entity.id);
        if (index === -1) return this._isKinematic;
        return dataStore.flags[index * 4] === 1;
    }
    
    /**
     * Set freeze rotation flag
     * @param {boolean} value The new freeze rotation state
     */
    set freezeRotation(value) {
        this._freezeRotation = value;
        if (this.entity && this.entity.id) {
            dataStore.setFreezeRotation(this.entity.id, value);
        }
    }
    
    /**
     * Get freeze rotation flag
     * @returns {boolean} The freeze rotation state
     */
    get freezeRotation() {
        if (!this.entity || !this.entity.id) return this._freezeRotation;
        const index = dataStore.getIndex(this.entity.id);
        if (index === -1) return this._freezeRotation;
        return dataStore.flags[index * 4 + 1] === 1;
    }
    
    /**
     * Set use gravity flag
     * @param {boolean} value The new use gravity state
     */
    set useGravity(value) {
        this._useGravity = value;
        if (this.entity && this.entity.id) {
            const index = dataStore.getIndex(this.entity.id);
            if (index !== -1) {
                dataStore.flags[index * 4 + 2] = value ? 1 : 0;
            }
        }
    }
    
    /**
     * Get use gravity flag
     * @returns {boolean} The use gravity state
     */
    get useGravity() {
        if (!this.entity || !this.entity.id) return this._useGravity;
        const index = dataStore.getIndex(this.entity.id);
        if (index === -1) return this._useGravity;
        return dataStore.flags[index * 4 + 2] === 1;
    }
    
    /**
     * Set trigger flag
     * @param {boolean} value The new trigger state
     */
    set isTrigger(value) {
        this._isTrigger = value;
        if (this.entity && this.entity.id) {
            const index = dataStore.getIndex(this.entity.id);
            if (index !== -1) {
                dataStore.flags[index * 4 + 3] = value ? 1 : 0;
            }
        }
    }
    
    /**
     * Get trigger flag
     * @returns {boolean} The trigger state
     */
    get isTrigger() {
        if (!this.entity || !this.entity.id) return this._isTrigger;
        const index = dataStore.getIndex(this.entity.id);
        if (index === -1) return this._isTrigger;
        return dataStore.flags[index * 4 + 3] === 1;
    }
} 