// helpers.js - Utility functions and instanced mesh management

import * as THREE from 'three';

export class RenderHelpers {
    constructor(scene) {
        this.scene = scene;
        this.instancedMeshes = new Map();
        
        // Performance counters
        this._frameDrawCalls = 0;
        this._frameVisibleInstances = 0;
        this.renderAlpha = 0;
    }

    /**
     * Create an instanced mesh for efficient rendering of many similar objects
     * @param {string} key Unique identifier for this instanced mesh type
     * @param {THREE.BufferGeometry} geometry The geometry to instance
     * @param {THREE.Material} material The material to use
     * @param {number} maxCount Maximum number of instances
     * @returns {THREE.InstancedMesh} The created instanced mesh
     */
    createInstancedMesh(key, geometry, material, maxCount) {
        const instancedMesh = new THREE.InstancedMesh(geometry, material, maxCount);
        instancedMesh.count = 0; // Start with 0 visible instances
        instancedMesh.frustumCulled = true;
        this.scene.add(instancedMesh);
        
        this.instancedMeshes.set(key, {
            mesh: instancedMesh,
            count: 0,
            maxCount: maxCount,
            dummy: new THREE.Object3D() // Reusable temporary Object3D for matrix calculations
        });
        
        return instancedMesh;
    }
    
    /**
     * Add or update an instance in an instanced mesh
     * @param {string} key The instanced mesh identifier
     * @param {number} index Index of the instance to update (or next available)
     * @param {THREE.Vector3} position Position of the instance
     * @param {THREE.Quaternion} quaternion Rotation of the instance
     * @param {THREE.Vector3} scale Scale of the instance
     * @returns {number} The index of the instance
     */
    updateInstance(key, index, position, quaternion, scale) {
        const instance = this.instancedMeshes.get(key);
        if (!instance) return -1;
        
        // Determine index to use
        const idx = (index !== undefined) ? index : instance.count;
        
        // If we're adding a new instance, increment the count
        if (idx >= instance.count) {
            if (idx >= instance.maxCount) return -1; // Can't exceed max count
            instance.count = idx + 1;
        }
        
        // Update matrix using dummy object
        instance.dummy.position.copy(position);
        if (quaternion) instance.dummy.quaternion.copy(quaternion);
        if (scale) instance.dummy.scale.copy(scale);
        instance.dummy.updateMatrix();
        
        // Apply to instanced mesh
        instance.mesh.setMatrixAt(idx, instance.dummy.matrix);
        instance.mesh.instanceMatrix.needsUpdate = true;
        
        return idx;
    }
    
    /**
     * Update instanced meshes
     */
    updateInstancedMeshes() {
        for (const [key, instance] of this.instancedMeshes.entries()) {
            if (instance.mesh.instanceMatrix.needsUpdate) {
                instance.mesh.instanceMatrix.needsUpdate = false;
            }
        }
    }
    
    /**
     * Remove an instance from an instanced mesh
     * @param {string} key The instanced mesh identifier
     * @param {number} index Index of the instance to remove
     */
    removeInstance(key, index) {
        const instance = this.instancedMeshes.get(key);
        if (!instance || index >= instance.count) return;
        
        // Move the last instance to this slot if it's not the last one
        if (index < instance.count - 1) {
            // Get the matrix of the last instance
            const matrix = new THREE.Matrix4();
            instance.mesh.getMatrixAt(instance.count - 1, matrix);
            
            // Set it at the removed index
            instance.mesh.setMatrixAt(index, matrix);
        }
        
        // Decrease count
        instance.count--;
        instance.mesh.count = instance.count;
        instance.mesh.instanceMatrix.needsUpdate = true;
    }

    /**
     * Update performance counters and render stats
     */
    updatePerformanceCounters(renderer) {
        // reset counters
        this._frameDrawCalls = 0;
        this._frameVisibleInstances = 0;

        // count visible instances from instancedMeshes map
        try {
            for (const [, inst] of this.instancedMeshes) {
                if (inst && inst.mesh) {
                    this._frameVisibleInstances += inst.mesh.count || 0;
                }
            }
        } catch {}

        // track render start
        const ctx = renderer.info;
        const startCalls = ctx.render.calls;
        
        return startCalls;
    }

    /**
     * Finalize performance counters after rendering
     */
    finalizePerformanceCounters(renderer, startCalls) {
        const endCalls = renderer.info.render.calls;
        this._frameDrawCalls = Math.max(0, endCalls - startCalls);

        if (window.__perf) {
            window.__perf.drawCalls = endCalls; // total since reset
            window.__perf.visibleInstances = this._frameVisibleInstances;
        }
    }

    /**
     * Properly dispose of Three.js resources to prevent memory leaks
     */
    dispose() {
        console.log("Disposing instanced meshes...");
        
        // Dispose of instanced meshes
        this.instancedMeshes.forEach(instance => {
            if (instance.mesh) {
                if (instance.mesh.geometry) instance.mesh.geometry.dispose();
                if (instance.mesh.material) {
                    if (Array.isArray(instance.mesh.material)) {
                        instance.mesh.material.forEach(material => material.dispose());
                    } else {
                        instance.mesh.material.dispose();
                    }
                }
                this.scene.remove(instance.mesh);
            }
        });
        
        this.instancedMeshes.clear();
    }

    /**
     * Helper method to dispose of materials and their textures
     * @param {THREE.Material} material The material to dispose
     */
    disposeMaterial(material) {
        // Dispose textures
        for (const propertyName in material) {
            const property = material[propertyName];
            if (property && property.isTexture) {
                property.dispose();
            }
        }
        
        // Dispose the material itself
        material.dispose();
    }
}