/**
 * InstancedMeshComponent - Optimized visual representation using instanced rendering
 * 
 * Handles THREE.InstancedMesh for efficient rendering of many similar objects,
 * significantly reducing draw calls for better performance.
 */

import { Component } from '../../core/component.js';

// Template meshes for different object types
const templateGeometries = new Map();
const templateMaterials = new Map();

// Instanced mesh storage - shared across all components of same type
const instancedMeshes = new Map();

// Counter for instance tracking
let instanceCounter = 0;

export class InstancedMeshComponent extends Component {
    constructor(templateName, customMaterial = null) {
        super();
        
        // Set template name for group identification
        this.templateName = templateName;
        
        // Set instance index (will be assigned in onAttached)
        this.instanceId = -1;
        
        // Custom material override - can be used to modify material for individual instances
        this.customMaterial = customMaterial;
        
        // Visibility flag
        this.visible = true;
        
        // Matrix for local transformations
        this.matrix = new THREE.Matrix4();
        
        // Color for instanced mesh
        this.color = new THREE.Color(1, 1, 1);
    }
    
    /**
     * Set the geometry template for a specific template name
     * @param {string} templateName The template identifier
     * @param {THREE.BufferGeometry} geometry The geometry to use as template
     */
    static setTemplateGeometry(templateName, geometry) {
        // Ensure geometry has computed boundingSphere
        if (!geometry.boundingSphere && typeof geometry.computeBoundingSphere === 'function') {
            geometry.computeBoundingSphere();
        }
        
        templateGeometries.set(templateName, geometry);
        
        // If we already have material but no instanced mesh yet, create it
        if (templateMaterials.has(templateName) && !instancedMeshes.has(templateName)) {
            InstancedMeshComponent.createInstancedMesh(templateName);
        }
    }
    
    /**
     * Set the material template for a specific template name
     * @param {string} templateName The template identifier
     * @param {THREE.Material} material The material to use as template
     */
    static setTemplateMaterial(templateName, material) {
        templateMaterials.set(templateName, material);
        
        // If we already have geometry but no instanced mesh yet, create it
        if (templateGeometries.has(templateName) && !instancedMeshes.has(templateName)) {
            InstancedMeshComponent.createInstancedMesh(templateName);
        }
    }
    
    /**
     * Create an instanced mesh for a template
     * @param {string} templateName The template identifier
     * @param {number} initialCount Maximum number of instances
     */
    static createInstancedMesh(templateName, initialCount = 1000) {
        // Check if we have required templates
        if (!templateGeometries.has(templateName)) {
            console.error(`Missing geometry template for ${templateName}`);
            return;
        }
        
        if (!templateMaterials.has(templateName)) {
            console.error(`Missing material template for ${templateName}`);
            return;
        }
        
        // Create the instanced mesh
        const geometry = templateGeometries.get(templateName);
        const material = templateMaterials.get(templateName);
        
        const instancedMesh = new THREE.InstancedMesh(
            geometry, 
            material.clone(), // Clone to avoid modifying the template
            initialCount
        );
        
        // Set initial visibility to false for all instances
        instancedMesh.count = 0;
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // Store in the map
        instancedMeshes.set(templateName, {
            mesh: instancedMesh,
            activeInstances: new Set(),
            instanceIdToIndex: new Map(),
            maxCount: initialCount
        });
        
        return instancedMesh;
    }
    
    /**
     * Get the instanced mesh for a template
     * @param {string} templateName The template identifier
     * @returns {THREE.InstancedMesh} The instanced mesh
     */
    static getInstancedMesh(templateName) {
        if (!instancedMeshes.has(templateName)) {
            return null;
        }
        
        return instancedMeshes.get(templateName).mesh;
    }
    
    /**
     * Get all instanced meshes
     * @returns {Map<string, object>} Map of template names to instanced mesh data
     */
    static getAllInstancedMeshes() {
        return instancedMeshes;
    }
    
    /**
     * Add all instanced meshes to a scene
     * @param {THREE.Scene} scene The scene to add meshes to
     */
    static addAllToScene(scene) {
        for (const [templateName, instanceData] of instancedMeshes.entries()) {
            scene.add(instanceData.mesh);
        }
    }
    
    /**
     * Called when component is attached to an entity
     */
    onAttached() {
        // Create/get the instanced mesh for this template
        if (!instancedMeshes.has(this.templateName)) {
            // Check if we have the required templates
            if (!templateGeometries.has(this.templateName) || 
                !templateMaterials.has(this.templateName)) {
                console.error(`Missing templates for ${this.templateName}`);
                return;
            }
            
            // Create the instanced mesh
            InstancedMeshComponent.createInstancedMesh(this.templateName);
        }
        
        // Get the instanced mesh data
        const instanceData = instancedMeshes.get(this.templateName);
        const instancedMesh = instanceData.mesh;
        
        // Assign a unique instance ID
        this.instanceId = instanceCounter++;
        
        // Find an available index in the instanced mesh
        let instanceIndex = -1;
        
        if (instanceData.activeInstances.size >= instanceData.maxCount) {
            // Need to resize the instanced mesh
            const newMaxCount = instanceData.maxCount * 2;
            console.log(`Resizing instanced mesh ${this.templateName} from ${instanceData.maxCount} to ${newMaxCount}`);
            
            // Create a new instanced mesh with larger capacity
            const newInstancedMesh = new THREE.InstancedMesh(
                instancedMesh.geometry,
                instancedMesh.material,
                newMaxCount
            );
            
            // Copy all matrix and color data from the old mesh
            const oldCount = instancedMesh.count;
            newInstancedMesh.count = oldCount;
            
            // Copy instance matrices
            const dummyMatrix = new THREE.Matrix4();
            for (let i = 0; i < oldCount; i++) {
                instancedMesh.getMatrixAt(i, dummyMatrix);
                newInstancedMesh.setMatrixAt(i, dummyMatrix);
                
                if (instancedMesh.instanceColor) {
                    const color = new THREE.Color();
                    instancedMesh.getColorAt(i, color);
                    newInstancedMesh.setColorAt(i, color);
                }
            }
            
            // Replace the instanced mesh in the scene
            if (instancedMesh.parent) {
                instancedMesh.parent.add(newInstancedMesh);
                instancedMesh.parent.remove(instancedMesh);
            }
            
            // Update the instance data
            instanceData.mesh = newInstancedMesh;
            instanceData.maxCount = newMaxCount;
            instanceIndex = oldCount;
        } else {
            // Use next available index
            instanceIndex = instanceData.activeInstances.size;
        }
        
        // Store the instance index
        instanceData.instanceIdToIndex.set(this.instanceId, instanceIndex);
        instanceData.activeInstances.add(this.instanceId);
        
        // Update the count if needed
        if (instanceIndex >= instanceData.mesh.count) {
            instanceData.mesh.count = instanceIndex + 1;
        }
        
        // Initial placement using entity transform
        const transform = this.entity.getComponent('TransformComponent') || 
                        this.entity.getComponent('OptimizedTransformComponent');
                        
        if (transform) {
            // Get position and rotation from transform
            // First try to get the matrix directly
            this.matrix.compose(
                transform.position,
                transform.quaternion,
                transform.scale
            );
            
            // Update the instance matrix
            instanceData.mesh.setMatrixAt(instanceIndex, this.matrix);
            instanceData.mesh.instanceMatrix.needsUpdate = true;
        }
        
        // Set color if using custom material
        if (this.customMaterial && this.customMaterial.color) {
            this.setColor(this.customMaterial.color);
        }
    }
    
    /**
     * Called when component is detached from an entity
     */
    onDetached() {
        if (this.instanceId === -1 || !instancedMeshes.has(this.templateName)) {
            return;
        }
        
        const instanceData = instancedMeshes.get(this.templateName);
        
        // Check if this instance was active
        if (!instanceData.activeInstances.has(this.instanceId)) {
            return;
        }
        
        // Get the index of this instance
        const instanceIndex = instanceData.instanceIdToIndex.get(this.instanceId);
        
        // Remove from active instances
        instanceData.activeInstances.delete(this.instanceId);
        instanceData.instanceIdToIndex.delete(this.instanceId);
        
        // If this was the last instance, just decrease the count
        if (instanceIndex === instanceData.mesh.count - 1) {
            instanceData.mesh.count--;
            instanceData.mesh.instanceMatrix.needsUpdate = true;
            return;
        }
        
        // Otherwise, we need to move the last instance to fill this gap
        // Find the last instance
        const lastIndex = instanceData.mesh.count - 1;
        
        // Find which instanceId corresponds to the last index
        let lastInstanceId = null;
        for (const [id, idx] of instanceData.instanceIdToIndex.entries()) {
            if (idx === lastIndex) {
                lastInstanceId = id;
                break;
            }
        }
        
        if (lastInstanceId !== null) {
            // Get the matrix from the last index
            const matrix = new THREE.Matrix4();
            instanceData.mesh.getMatrixAt(lastIndex, matrix);
            
            // Move it to the current index
            instanceData.mesh.setMatrixAt(instanceIndex, matrix);
            
            // Update the index mapping
            instanceData.instanceIdToIndex.set(lastInstanceId, instanceIndex);
            
            // If we have colors, move those too
            if (instanceData.mesh.instanceColor !== null) {
                const color = new THREE.Color();
                instanceData.mesh.getColorAt(lastIndex, color);
                instanceData.mesh.setColorAt(instanceIndex, color);
                instanceData.mesh.instanceColor.needsUpdate = true;
            }
        }
        
        // Decrease the count
        instanceData.mesh.count--;
        instanceData.mesh.instanceMatrix.needsUpdate = true;
    }
    
    /**
     * Update instance matrix from entity transform
     */
    updateFromTransform() {
        if (this.instanceId === -1 || !instancedMeshes.has(this.templateName)) {
            return;
        }
        
        const instanceData = instancedMeshes.get(this.templateName);
        
        // Check if this instance is active
        if (!instanceData.activeInstances.has(this.instanceId)) {
            return;
        }
        
        // Get the index of this instance
        const instanceIndex = instanceData.instanceIdToIndex.get(this.instanceId);
        
        // Get transform from entity
        const transform = this.entity.getComponent('TransformComponent') || 
                        this.entity.getComponent('OptimizedTransformComponent');
        
        if (transform) {
            // Update matrix from transform
            this.matrix.compose(
                transform.position,
                transform.quaternion,
                transform.scale
            );
            
            // Update the instance matrix
            instanceData.mesh.setMatrixAt(instanceIndex, this.matrix);
            instanceData.mesh.instanceMatrix.needsUpdate = true;
        }
    }
    
    /**
     * Set the color of this instance
     * @param {THREE.Color|number} color The color to set
     */
    setColor(color) {
        if (this.instanceId === -1 || !instancedMeshes.has(this.templateName)) {
            // Save color for when instance is created
            if (color instanceof THREE.Color) {
                this.color.copy(color);
            } else {
                this.color.set(color);
            }
            return;
        }
        
        const instanceData = instancedMeshes.get(this.templateName);
        
        // Check if this instance is active
        if (!instanceData.activeInstances.has(this.instanceId)) {
            return;
        }
        
        // Get the index of this instance
        const instanceIndex = instanceData.instanceIdToIndex.get(this.instanceId);
        
        // Make sure the mesh has instance colors
        if (!instanceData.mesh.instanceColor) {
            // Create an instance color buffer if it doesn't exist
            const colors = new Float32Array(instanceData.maxCount * 3);
            instanceData.mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
        }
        
        // Update the color
        if (color instanceof THREE.Color) {
            this.color.copy(color);
        } else {
            this.color.set(color);
        }
        
        instanceData.mesh.setColorAt(instanceIndex, this.color);
        instanceData.mesh.instanceColor.needsUpdate = true;
    }
    
    /**
     * Set the visibility of this instance
     * @param {boolean} visible Whether this instance is visible
     */
    setVisible(visible) {
        if (this.visible === visible) return;
        
        this.visible = visible;
        
        if (this.instanceId === -1 || !instancedMeshes.has(this.templateName)) {
            return;
        }
        
        const instanceData = instancedMeshes.get(this.templateName);
        
        // Check if this instance is active
        if (!instanceData.activeInstances.has(this.instanceId)) {
            return;
        }
        
        // Get the index of this instance
        const instanceIndex = instanceData.instanceIdToIndex.get(this.instanceId);
        
        if (!visible) {
            // Make the instance invisible by scaling to zero
            const zeroScale = new THREE.Matrix4().makeScale(0, 0, 0);
            instanceData.mesh.setMatrixAt(instanceIndex, zeroScale);
        } else {
            // Restore normal transform
            this.updateFromTransform();
        }
        
        instanceData.mesh.instanceMatrix.needsUpdate = true;
    }
} 