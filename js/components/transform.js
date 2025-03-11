/**
 * TransformComponent - Position, rotation, scale component
 * 
 * Handles spatial transformation of entities in the 3D world.
 */

import { Component } from '../core/component.js';
// THREE is loaded globally via CDN

export class TransformComponent extends Component {
    constructor(position = new THREE.Vector3(), rotation = new THREE.Euler(), scale = new THREE.Vector3(1, 1, 1)) {
        super();
        this.position = position.clone();
        this.rotation = rotation.clone();
        this.scale = scale.clone();
        this.quaternion = new THREE.Quaternion().setFromEuler(this.rotation);
        this.matrix = new THREE.Matrix4();
        this.needsUpdate = true;
    }
    
    /**
     * Set the position
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {number} z Z coordinate
     * @returns {TransformComponent} This component for chaining
     */
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.needsUpdate = true;
        return this;
    }
    
    /**
     * Set the rotation in Euler angles
     * @param {number} x X rotation in radians
     * @param {number} y Y rotation in radians
     * @param {number} z Z rotation in radians
     * @returns {TransformComponent} This component for chaining
     */
    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        this.quaternion.setFromEuler(this.rotation);
        this.needsUpdate = true;
        return this;
    }
    
    /**
     * Set the rotation from a quaternion
     * @param {THREE.Quaternion} quaternion The quaternion
     * @returns {TransformComponent} This component for chaining
     */
    setQuaternion(quaternion) {
        this.quaternion.copy(quaternion);
        this.rotation.setFromQuaternion(this.quaternion);
        this.needsUpdate = true;
        return this;
    }
    
    /**
     * Set the scale
     * @param {number} x X scale
     * @param {number} y Y scale
     * @param {number} z Z scale
     * @returns {TransformComponent} This component for chaining
     */
    setScale(x, y, z) {
        this.scale.set(x, y, z);
        this.needsUpdate = true;
        return this;
    }
    
    /**
     * Look at a point
     * @param {THREE.Vector3} target The point to look at
     * @returns {TransformComponent} This component for chaining
     */
    lookAt(target) {
        // Create a temporary matrix to derive the rotation
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.lookAt(this.position, target, new THREE.Vector3(0, 1, 0));
        
        // Extract the quaternion from the matrix
        this.quaternion.setFromRotationMatrix(tempMatrix);
        this.rotation.setFromQuaternion(this.quaternion);
        
        this.needsUpdate = true;
        return this;
    }
    
    /**
     * Update the matrix from position, quaternion, and scale
     * @returns {THREE.Matrix4} The updated matrix
     */
    updateMatrix() {
        if (this.needsUpdate) {
            this.matrix.compose(this.position, this.quaternion, this.scale);
            this.needsUpdate = false;
        }
        return this.matrix;
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
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);
        return forward;
    }
    
    /**
     * Get right direction vector
     * @returns {THREE.Vector3} A normalized vector pointing right
     */
    getRightVector() {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.quaternion);
        return right;
    }
    
    /**
     * Get up direction vector
     * @returns {THREE.Vector3} A normalized vector pointing up
     */
    getUpVector() {
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(this.quaternion);
        return up;
    }
}