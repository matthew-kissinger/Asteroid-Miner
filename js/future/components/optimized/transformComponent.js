/**
 * OptimizedTransformComponent
 * 
 * [PRESERVED FOR FUTURE SCALING]
 * This optimized component is currently not used in the main game, but is preserved for
 * future performance needs. Using TypedArrays for position, rotation, and scale data
 * provides better memory layout and cache performance when dealing with thousands of entities.
 * 
 * If re-implementing this system:
 * 1. Import and use DataStore from core/dataStore.js
 * 2. Register optimizedMovementSystem instead of standard movementSystem
 * 3. Consider using instancedRenderSystem for rendering many similar objects
 */

import { Component } from '../../../core/component.js';
import { TransformDataStore } from '../../../future/core/dataStore.js';

// Singleton data store instance
let dataStore = null;

export class OptimizedTransformComponent extends Component {
    constructor(position = new THREE.Vector3(), rotation = new THREE.Euler(), scale = new THREE.Vector3(1, 1, 1)) {
        super();
        
        // Initialize the data store if it doesn't exist
        if (!dataStore) {
            dataStore = new TransformDataStore();
            OptimizedTransformComponent.dataStore = dataStore;
        }
        
        // These properties will be used for initialization once the component is attached to an entity
        this._initialPosition = position.clone();
        this._initialRotation = rotation.clone();
        this._initialQuaternion = new THREE.Quaternion().setFromEuler(rotation);
        this._initialScale = scale.clone();
        
        // Reusable objects for getters to avoid creating new objects
        this._position = new THREE.Vector3();
        this._quaternion = new THREE.Quaternion();
        this._rotation = new THREE.Euler();
        this._scale = new THREE.Vector3();
        this._matrix = new THREE.Matrix4();
        
        // Direction vector reuse objects
        this._forward = new THREE.Vector3();
        this._right = new THREE.Vector3();
        this._up = new THREE.Vector3();
    }
    
    /**
     * Get the data store
     * @returns {TransformDataStore} The transform data store
     */
    static get dataStore() {
        if (!dataStore) {
            dataStore = new TransformDataStore();
            OptimizedTransformComponent.dataStore = dataStore;
        }
        return dataStore;
    }
    
    /**
     * Set the data store
     * @param {TransformDataStore} store The transform data store
     */
    static set dataStore(store) {
        dataStore = store;
    }
    
    /**
     * Called when the component is attached to an entity
     */
    onAttached() {
        if (!this.entity || !this.entity.id) {
            console.error('OptimizedTransformComponent: Cannot attach to entity without ID');
            return;
        }
        
        // Allocate space in the data store
        dataStore.allocate(this.entity.id);
        
        // Set initial values
        this.setPosition(
            this._initialPosition.x,
            this._initialPosition.y,
            this._initialPosition.z
        );
        
        this.setQuaternion(
            this._initialQuaternion.x,
            this._initialQuaternion.y,
            this._initialQuaternion.z,
            this._initialQuaternion.w
        );
        
        this.setScale(
            this._initialScale.x,
            this._initialScale.y,
            this._initialScale.z
        );
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
     * Get the position
     * @returns {THREE.Vector3} The position
     */
    get position() {
        if (!this.entity || !this.entity.id) return this._initialPosition;
        return dataStore.getPosition(this.entity.id, this._position);
    }
    
    /**
     * Get the quaternion
     * @returns {THREE.Quaternion} The quaternion
     */
    get quaternion() {
        if (!this.entity || !this.entity.id) return this._initialQuaternion;
        return dataStore.getQuaternion(this.entity.id, this._quaternion);
    }
    
    /**
     * Get the rotation (calculated from quaternion)
     * @returns {THREE.Euler} The rotation
     */
    get rotation() {
        if (!this.entity || !this.entity.id) return this._initialRotation;
        this._rotation.setFromQuaternion(this.quaternion);
        return this._rotation;
    }
    
    /**
     * Get the scale
     * @returns {THREE.Vector3} The scale
     */
    get scale() {
        if (!this.entity || !this.entity.id) return this._initialScale;
        return dataStore.getScale(this.entity.id, this._scale);
    }
    
    /**
     * Set the position
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {number} z Z coordinate
     * @returns {OptimizedTransformComponent} This component for chaining
     */
    setPosition(x, y, z) {
        if (!this.entity || !this.entity.id) {
            this._initialPosition.set(x, y, z);
            return this;
        }
        
        dataStore.setPosition(this.entity.id, x, y, z);
        
        // Publish transform update event
        if (this.entity.world && this.entity.world.messageBus) {
            this.entity.world.messageBus.publish('transform.updated', {
                entity: this.entity,
                component: this
            });
        }
        
        return this;
    }
    
    /**
     * Set the rotation in Euler angles
     * @param {number} x X rotation in radians
     * @param {number} y Y rotation in radians
     * @param {number} z Z rotation in radians
     * @returns {OptimizedTransformComponent} This component for chaining
     */
    setRotation(x, y, z) {
        if (!this.entity || !this.entity.id) {
            this._initialRotation.set(x, y, z);
            this._initialQuaternion.setFromEuler(this._initialRotation);
            return this;
        }
        
        this._rotation.set(x, y, z);
        this._quaternion.setFromEuler(this._rotation);
        
        dataStore.setQuaternion(
            this.entity.id,
            this._quaternion.x,
            this._quaternion.y,
            this._quaternion.z,
            this._quaternion.w
        );
        
        // Publish transform update event
        if (this.entity.world && this.entity.world.messageBus) {
            this.entity.world.messageBus.publish('transform.updated', {
                entity: this.entity,
                component: this
            });
        }
        
        return this;
    }
    
    /**
     * Set the rotation from a quaternion
     * @param {THREE.Quaternion|number} quaternionOrX Quaternion or x component
     * @param {number} y Y component (if not using quaternion)
     * @param {number} z Z component (if not using quaternion)
     * @param {number} w W component (if not using quaternion)
     * @returns {OptimizedTransformComponent} This component for chaining
     */
    setQuaternion(quaternionOrX, y, z, w) {
        let qx, qy, qz, qw;
        
        if (quaternionOrX instanceof THREE.Quaternion) {
            qx = quaternionOrX.x;
            qy = quaternionOrX.y;
            qz = quaternionOrX.z;
            qw = quaternionOrX.w;
        } else {
            qx = quaternionOrX;
            qy = y;
            qz = z;
            qw = w;
        }
        
        if (!this.entity || !this.entity.id) {
            this._initialQuaternion.set(qx, qy, qz, qw);
            this._initialRotation.setFromQuaternion(this._initialQuaternion);
            return this;
        }
        
        dataStore.setQuaternion(this.entity.id, qx, qy, qz, qw);
        
        // Publish transform update event
        if (this.entity.world && this.entity.world.messageBus) {
            this.entity.world.messageBus.publish('transform.updated', {
                entity: this.entity,
                component: this
            });
        }
        
        return this;
    }
    
    /**
     * Set the scale
     * @param {number} x X scale
     * @param {number} y Y scale
     * @param {number} z Z scale
     * @returns {OptimizedTransformComponent} This component for chaining
     */
    setScale(x, y, z) {
        if (!this.entity || !this.entity.id) {
            this._initialScale.set(x, y, z);
            return this;
        }
        
        dataStore.setScale(this.entity.id, x, y, z);
        
        // Publish transform update event
        if (this.entity.world && this.entity.world.messageBus) {
            this.entity.world.messageBus.publish('transform.updated', {
                entity: this.entity,
                component: this
            });
        }
        
        return this;
    }
    
    /**
     * Look at a point
     * @param {THREE.Vector3} target The point to look at
     * @returns {OptimizedTransformComponent} This component for chaining
     */
    lookAt(target) {
        if (!this.entity || !this.entity.id) {
            // Use initial values for unattached component
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.lookAt(this._initialPosition, target, new THREE.Vector3(0, 1, 0));
            this._initialQuaternion.setFromRotationMatrix(tempMatrix);
            this._initialRotation.setFromQuaternion(this._initialQuaternion);
            return this;
        }
        
        // Get current position
        const position = this.position;
        
        // Create a temporary matrix to derive the rotation
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.lookAt(position, target, new THREE.Vector3(0, 1, 0));
        
        // Extract the quaternion from the matrix
        this._quaternion.setFromRotationMatrix(tempMatrix);
        
        // Update the data store
        dataStore.setQuaternion(
            this.entity.id,
            this._quaternion.x,
            this._quaternion.y,
            this._quaternion.z,
            this._quaternion.w
        );
        
        // Publish transform update event
        if (this.entity.world && this.entity.world.messageBus) {
            this.entity.world.messageBus.publish('transform.updated', {
                entity: this.entity,
                component: this
            });
        }
        
        return this;
    }
    
    /**
     * Update the matrix from position, quaternion, and scale
     * @returns {THREE.Matrix4} The updated matrix
     */
    updateMatrix() {
        if (!this.entity || !this.entity.id) {
            return this._matrix.compose(
                this._initialPosition,
                this._initialQuaternion,
                this._initialScale
            );
        }
        
        // Get current position, quaternion, and scale
        const position = this.position;
        const quaternion = this.quaternion;
        const scale = this.scale;
        
        // Compose the matrix
        return this._matrix.compose(position, quaternion, scale);
    }
    
    /**
     * Get world position
     * @returns {THREE.Vector3} A new vector representing the world position
     */
    getWorldPosition() {
        return this.position.clone();
    }
    
    /**
     * Get forward direction vector
     * @returns {THREE.Vector3} A normalized vector pointing forward
     */
    getForwardVector() {
        this._forward.set(0, 0, -1);
        this._forward.applyQuaternion(this.quaternion);
        return this._forward;
    }
    
    /**
     * Get right direction vector
     * @returns {THREE.Vector3} A normalized vector pointing right
     */
    getRightVector() {
        this._right.set(1, 0, 0);
        this._right.applyQuaternion(this.quaternion);
        return this._right;
    }
    
    /**
     * Get up direction vector
     * @returns {THREE.Vector3} A normalized vector pointing up
     */
    getUpVector() {
        this._up.set(0, 1, 0);
        this._up.applyQuaternion(this.quaternion);
        return this._up;
    }
} 