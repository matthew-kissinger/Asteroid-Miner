/**
 * InstancedRenderSystem
 * 
 * [PRESERVED FOR FUTURE SCALING]
 * This optimized rendering system is currently not used in the main game, but is preserved
 * for future performance optimization when rendering many similar entities. Using THREE.InstancedMesh
 * can significantly improve rendering performance for:
 * 
 * 1. Large asteroid fields (1000+ asteroids)
 * 2. Large numbers of projectiles or particles
 * 3. Swarms of smaller ships or debris
 * 
 * Would be valuable to re-implement when adding features requiring many similar objects.
 */

import * as THREE from 'three';
import { System } from '../../../core/system.js';
import { InstancedMeshComponent } from '../../components/rendering/instancedMeshComponent.js';
import { OptimizedTransformComponent } from '../../components/optimized/transformComponent.js';
import { TransformComponent } from '../../../components/transform.js';

export class InstancedRenderSystem extends System {
    constructor(scene, camera, frustumCulling = true, renderDistance = 2000) {
        super();
        
        // Required component types
        this.requiredComponents = ['InstancedMeshComponent'];
        
        // THREE.js references
        this.scene = scene;
        this.camera = camera;
        
        // Frustum culling settings
        this.frustumCulling = frustumCulling;
        this.renderDistance = renderDistance;
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        
        // Performance tracking
        this.lastUpdate = 0;
        this.updateFrequency = 1000 / 60; // 60 fps target
        
        // Entity counts for stats
        this.totalEntities = 0;
        this.visibleEntities = 0;
        
        // Distance-based LOD
        this.LODLevels = {
            close: 100,
            medium: 500,
            far: 1000
        };
        
        // Register for entity events
        if (scene && camera) {
            this.isReady = true;
        }
    }
    
    /**
     * Initialize the system
     * @param {World} world The world this system belongs to
     */
    initialize(world) {
        super.initialize(world);
        
        // Validate required references
        if (!this.scene || !this.camera) {
            console.error('InstancedRenderSystem requires scene and camera references');
            this.isReady = false;
            return;
        }
        
        this.isReady = true;
        
        // Add existing instanced meshes to scene
        InstancedMeshComponent.addAllToScene(this.scene);
        
        // Process existing entities
        for (const entity of world.getEntitiesWithComponents(this.requiredComponents)) {
            this.onEntityCreated(entity);
        }
        
        // Start listening for entity events
        this.world.events.on('entityCreated', this.onEntityCreated.bind(this));
        this.world.events.on('entityDestroyed', this.onEntityDestroyed.bind(this));
        this.world.events.on('componentAdded', this.onComponentAdded.bind(this));
        this.world.events.on('componentRemoved', this.onComponentRemoved.bind(this));
    }
    
    /**
     * Handle entity creation
     * @param {Entity} entity The created entity
     */
    onEntityCreated(entity) {
        if (!this.isReady) return;
        
        // Check if entity has required components
        if (entity.hasComponents(this.requiredComponents)) {
            this.totalEntities++;
        }
    }
    
    /**
     * Handle entity destruction
     * @param {Entity} entity The destroyed entity
     */
    onEntityDestroyed(entity) {
        if (!this.isReady) return;
        
        // Check if entity had required components
        if (entity.hasComponents(this.requiredComponents)) {
            this.totalEntities--;
        }
    }
    
    /**
     * Handle component addition
     * @param {Entity} entity The entity
     * @param {string} componentName The added component type
     */
    onComponentAdded(entity, componentName) {
        if (!this.isReady) return;
        
        // Check if this completes the required components
        if (componentName === 'InstancedMeshComponent' && entity.hasComponents(this.requiredComponents)) {
            this.totalEntities++;
        }
    }
    
    /**
     * Handle component removal
     * @param {Entity} entity The entity
     * @param {string} componentName The removed component type
     */
    onComponentRemoved(entity, componentName) {
        if (!this.isReady) return;
        
        // Check if this invalidates the required components
        if (componentName === 'InstancedMeshComponent' && entity.hasComponents(this.requiredComponents)) {
            this.totalEntities--;
        }
    }
    
    /**
     * Update the frustum for culling
     */
    updateFrustum() {
        if (!this.camera) return;
        
        // Update projection matrix
        this.projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        
        // Update frustum
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }
    
    /**
     * Check if an entity is visible within the frustum
     * @param {Entity} entity The entity to check
     * @param {InstancedMeshComponent} instancedMesh The instanced mesh component
     * @returns {boolean} Whether the entity is visible
     */
    isVisible(entity, instancedMesh) {
        // If frustum culling is disabled, always visible
        if (!this.frustumCulling) return true;
        
        // Get transform
        const transform = entity.getComponent('TransformComponent') || 
                        entity.getComponent('OptimizedTransformComponent');
                        
        if (!transform) return true;
        
        // Get template mesh
        const meshData = InstancedMeshComponent.getAllInstancedMeshes().get(instancedMesh.templateName);
        if (!meshData) return true;
        
        // Get instance mesh and its bounding sphere
        const mesh = meshData.mesh;
        if (!mesh || !mesh.geometry || !mesh.geometry.boundingSphere) return true;
        
        // Create a sphere at the entity's position with the radius of the mesh's bounding sphere
        const boundingSphere = mesh.geometry.boundingSphere.clone();
        boundingSphere.center.copy(transform.position);
        
        // Adjust radius for scale
        const maxScale = Math.max(
            transform.scale.x,
            transform.scale.y,
            transform.scale.z
        );
        boundingSphere.radius *= maxScale;
        
        // Check if in frustum
        return this.frustum.intersectsSphere(boundingSphere);
    }
    
    /**
     * Get the LOD level for an entity based on distance
     * @param {Entity} entity The entity
     * @returns {string} The LOD level ('close', 'medium', 'far', or 'outOfRange')
     */
    getLODLevel(entity) {
        // Get transform
        const transform = entity.getComponent('TransformComponent') || 
                        entity.getComponent('OptimizedTransformComponent');
                        
        if (!transform) return 'close';
        
        // Calculate distance to camera
        const distance = transform.position.distanceTo(this.camera.position);
        
        // Return LOD level
        if (distance <= this.LODLevels.close) return 'close';
        if (distance <= this.LODLevels.medium) return 'medium';
        if (distance <= this.LODLevels.far) return 'far';
        return 'outOfRange';
    }
    
    /**
     * Update entity visibility based on frustum and distance
     * @param {Entity} entity The entity to update
     */
    updateEntityVisibility(entity) {
        const instancedMesh = entity.getComponent('InstancedMeshComponent');
        if (!instancedMesh) return;
        
        // Get LOD level
        const lodLevel = this.getLODLevel(entity);
        
        // Check visibility
        const isInFrustum = this.isVisible(entity, instancedMesh);
        const isInRange = lodLevel !== 'outOfRange';
        const shouldBeVisible = isInFrustum && isInRange;
        
        // Update visibility if needed
        if (instancedMesh.visible !== shouldBeVisible) {
            instancedMesh.setVisible(shouldBeVisible);
        }
        
        // Increment visible count if visible
        if (shouldBeVisible) {
            this.visibleEntities++;
        }
    }
    
    /**
     * Update all entities
     * @param {number} dt Delta time in seconds
     */
    update(dt) {
        if (!this.isReady) return;
        
        const now = performance.now();
        if (now - this.lastUpdate < this.updateFrequency) {
            return;
        }
        this.lastUpdate = now;
        
        // Update frustum for culling
        this.updateFrustum();
        
        // Reset visible count
        this.visibleEntities = 0;
        
        // Process each entity with an instanced mesh
        const entities = this.world.getEntitiesWithComponents(this.requiredComponents);
        for (const entity of entities) {
            // Update transform in the instanced mesh
            const instancedMesh = entity.getComponent('InstancedMeshComponent');
            instancedMesh.updateFromTransform();
            
            // Update visibility
            this.updateEntityVisibility(entity);
        }
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            totalEntities: this.totalEntities,
            visibleEntities: this.visibleEntities,
            cullingEnabled: this.frustumCulling,
            renderDistance: this.renderDistance,
            instancedMeshCount: InstancedMeshComponent.getAllInstancedMeshes().size
        };
    }
    
    /**
     * Set frustum culling enabled/disabled
     * @param {boolean} enabled Whether frustum culling is enabled
     */
    setFrustumCulling(enabled) {
        this.frustumCulling = enabled;
    }
    
    /**
     * Set render distance for LOD and culling
     * @param {number} distance The maximum render distance
     */
    setRenderDistance(distance) {
        this.renderDistance = distance;
        
        // Update LOD levels based on render distance
        const close = distance * 0.05;
        const medium = distance * 0.25;
        const far = distance * 0.5;
        
        this.LODLevels = {
            close,
            medium,
            far
        };
    }
} 