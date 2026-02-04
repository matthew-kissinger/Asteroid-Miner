// helpers.ts - Utility functions and instanced mesh management

import * as THREE from 'three';

// WebGPURenderer is not in @types/three yet, declare it
declare class WebGPURenderer extends THREE.WebGLRenderer {}

interface InstanceData {
    mesh: THREE.InstancedMesh;
    count: number;
    maxCount: number;
    dummy: THREE.Object3D;
}

type RendererType = THREE.WebGLRenderer | WebGPURenderer;

export class RenderHelpers {
    scene: THREE.Scene;
    instancedMeshes: Map<string, InstanceData>;
    _frameDrawCalls: number;
    _frameVisibleInstances: number;
    renderAlpha: number;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.instancedMeshes = new Map();
        
        // Performance counters
        this._frameDrawCalls = 0;
        this._frameVisibleInstances = 0;
        this.renderAlpha = 0;
    }

    /**
     * Create an instanced mesh for efficient rendering of many similar objects
     * @param key Unique identifier for this instanced mesh type
     * @param geometry The geometry to instance
     * @param material The material to use
     * @param maxCount Maximum number of instances
     * @returns The created instanced mesh
     */
    createInstancedMesh(
        key: string,
        geometry: THREE.BufferGeometry,
        material: THREE.Material,
        maxCount: number
    ): THREE.InstancedMesh {
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
     * @param key The instanced mesh identifier
     * @param index Index of the instance to update (or next available)
     * @param position Position of the instance
     * @param quaternion Rotation of the instance
     * @param scale Scale of the instance
     * @returns The index of the instance
     */
    updateInstance(
        key: string,
        index: number | undefined,
        position: THREE.Vector3,
        quaternion: THREE.Quaternion | null,
        scale: THREE.Vector3 | null
    ): number {
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
    updateInstancedMeshes(): void {
        for (const [, instance] of this.instancedMeshes.entries()) {
            if (instance.mesh.instanceMatrix.needsUpdate) {
                instance.mesh.instanceMatrix.needsUpdate = false;
            }
        }
    }
    
    /**
     * Remove an instance from an instanced mesh
     * @param key The instanced mesh identifier
     * @param index Index of the instance to remove
     */
    removeInstance(key: string, index: number): void {
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
    updatePerformanceCounters(renderer: RendererType): number {
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
    finalizePerformanceCounters(renderer: RendererType, startCalls: number): void {
        const endCalls = renderer.info.render.calls;
        this._frameDrawCalls = Math.max(0, endCalls - startCalls);

        if ((window as any).__perf) {
            (window as any).__perf.drawCalls = endCalls; // total since reset
            (window as any).__perf.visibleInstances = this._frameVisibleInstances;
        }
    }

    /**
     * Properly dispose of Three.js resources to prevent memory leaks
     */
    dispose(): void {
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
     * @param material The material to dispose
     */
    disposeMaterial(material: THREE.Material): void {
        // Dispose textures
        for (const propertyName in material) {
            const property = (material as any)[propertyName];
            if (property && property.isTexture) {
                property.dispose();
            }
        }
        
        // Dispose the material itself
        material.dispose();
    }
}
