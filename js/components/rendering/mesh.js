/**
 * MeshComponent - Visual representation of an entity
 * 
 * Handles the Three.js mesh and its properties.
 */

import { Component } from '../../core/component.js';

export class MeshComponent extends Component {
    constructor(geometry, material) {
        super();
        
        // Handle case where geometry is already a mesh or group
        if (geometry && geometry.isMesh || geometry && geometry.isGroup) {
            this.mesh = geometry;
        } else if (geometry && material) {
            this.mesh = new THREE.Mesh(geometry, material);
            
            // Ensure geometry has computed boundingSphere
            if (geometry && typeof geometry.computeBoundingSphere === 'function' && !geometry.boundingSphere) {
                geometry.computeBoundingSphere();
            }
        } else {
            // Fallback to simple cube if no valid geometry
            console.warn('MeshComponent created with invalid geometry, using default cube');
            const defaultGeom = new THREE.BoxGeometry(10, 10, 10);
            defaultGeom.computeBoundingSphere();
            const defaultMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.mesh = new THREE.Mesh(defaultGeom, defaultMat);
        }
        
        this.visible = true;
        this.castShadow = false;
        this.receiveShadow = false;
    }
    
    /**
     * Called when component is attached to an entity
     */
    onAttached() {
        // Link mesh to transform if available
        const transform = this.entity.getComponent('TransformComponent');
        if (transform) {
            // Initial setup of mesh position, rotation, and scale
            this.mesh.position.copy(transform.position);
            this.mesh.quaternion.copy(transform.quaternion);
            this.mesh.scale.copy(transform.scale);
        }
    }
    
    /**
     * Called when component is detached from an entity
     */
    onDetached() {
        // Remove from scene if present
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        // Dispose of geometry and material to prevent memory leaks
        if (this.mesh.geometry) {
            this.mesh.geometry.dispose();
        }
        
        if (this.mesh.material) {
            // Check if material is an array
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(material => {
                    if (material.map) material.map.dispose();
                    if (material.lightMap) material.lightMap.dispose();
                    if (material.bumpMap) material.bumpMap.dispose();
                    if (material.normalMap) material.normalMap.dispose();
                    if (material.specularMap) material.specularMap.dispose();
                    if (material.envMap) material.envMap.dispose();
                    material.dispose();
                });
            } else {
                // Single material case
                if (this.mesh.material.map) this.mesh.material.map.dispose();
                if (this.mesh.material.lightMap) this.mesh.material.lightMap.dispose();
                if (this.mesh.material.bumpMap) this.mesh.material.bumpMap.dispose();
                if (this.mesh.material.normalMap) this.mesh.material.normalMap.dispose();
                if (this.mesh.material.specularMap) this.mesh.material.specularMap.dispose();
                if (this.mesh.material.envMap) this.mesh.material.envMap.dispose();
                this.mesh.material.dispose();
            }
        }
    }
    
    /**
     * Set mesh visibility
     * @param {boolean} visible Whether the mesh is visible
     */
    setVisible(visible) {
        this.visible = visible;
        this.mesh.visible = visible;
    }
    
    /**
     * Set whether the mesh casts shadows
     * @param {boolean} castShadow Whether the mesh casts shadows
     */
    setCastShadow(castShadow) {
        this.castShadow = castShadow;
        this.mesh.castShadow = castShadow;
    }
    
    /**
     * Set whether the mesh receives shadows
     * @param {boolean} receiveShadow Whether the mesh receives shadows
     */
    setReceiveShadow(receiveShadow) {
        this.receiveShadow = receiveShadow;
        this.mesh.receiveShadow = receiveShadow;
    }
    
    /**
     * Change the mesh's material
     * @param {THREE.Material} material New material
     */
    setMaterial(material) {
        this.mesh.material = material;
    }
    
    /**
     * Change the mesh's geometry
     * @param {THREE.BufferGeometry} geometry New geometry
     */
    setGeometry(geometry) {
        this.mesh.geometry = geometry;
    }
    
    /**
     * Add the mesh to a scene
     * @param {THREE.Scene} scene Scene to add the mesh to
     */
    addToScene(scene) {
        scene.add(this.mesh);
    }
    
    /**
     * Update mesh transform from entity transform
     */
    updateFromTransform() {
        const transform = this.entity.getComponent('TransformComponent');
        if (transform) {
            this.mesh.position.copy(transform.position);
            this.mesh.quaternion.copy(transform.quaternion);
            this.mesh.scale.copy(transform.scale);
        }
    }
}