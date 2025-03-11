/**
 * RenderSystem - Manages visual representation of entities
 * 
 * Syncs entity transforms with Three.js meshes and handles rendering.
 */

import { System } from '../../core/system.js';

export class RenderSystem extends System {
    constructor(world, scene, camera, renderer) {
        super(world);
        this.requiredComponents = ['TransformComponent', 'MeshComponent'];
        this.priority = 100; // Run at the end of the update cycle
        
        // Three.js references
        this.scene = scene;
        this.camera = camera;
        // Don't store renderer reference to avoid issues
        this.renderer = null;
        
        // Track meshes for frustum culling
        this.meshEntities = new Map();
        
        // Frustum for view culling
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        
        // Listen for entity events
        this.world.messageBus.subscribe('entity.created', this.onEntityCreated.bind(this));
        this.world.messageBus.subscribe('entity.destroyed', this.onEntityDestroyed.bind(this));
        
        // Also listen for component.added events directly to catch component additions
        this.world.messageBus.subscribe('component.added', this.onComponentAdded.bind(this));
        
        console.log("RenderSystem initialized - handling mesh updates only, no rendering");
    }
    
    /**
     * Handle component added event
     * @param {object} message Event message
     */
    onComponentAdded(message) {
        const entity = message.data.entity;
        const componentType = message.data.componentType;
        
        // Only interested if one of our required components was added
        if (componentType !== 'MeshComponent' && componentType !== 'TransformComponent') {
            return;
        }
        
        // Check if we're already tracking this entity
        if (this.meshEntities.has(entity.id)) {
            return;
        }
        
        console.log(`RenderSystem: Component ${componentType} added to entity ${entity.id}`);
        
        // Check if entity now has all required components
        if (entity.getComponent('TransformComponent') && entity.getComponent('MeshComponent')) {
            console.log(`Entity ${entity.id} now has all required components, adding to scene`);
            this.addEntityToScene(entity);
        }
    }
    
    /**
     * Initialize the rendering system
     */
    initialize() {
        // Verify the system has scene and camera references
        if (!this.scene || !this.camera) {
            console.error('RenderSystem missing required Three.js scene or camera references');
            return;
        }
        
        // Process any entities that already exist
        const entities = this.world.getEntitiesWithComponents(['TransformComponent', 'MeshComponent']);
        entities.forEach(entity => {
            this.addEntityToScene(entity);
        });
    }
    
    /**
     * Handle entity created event
     * @param {object} message Event message
     */
    onEntityCreated(message) {
        const entity = message.data.entity;
        
        // Log entity creation for debugging
        console.log(`RenderSystem received entity.created event for entity ${entity.id}`);
        
        // List all components for debugging
        console.log(`Entity ${entity.id} components:`, Array.from(entity.components.keys()).join(', '));
        
        // Check if entity has required components using getComponent for better debugging
        const transform = entity.getComponent('TransformComponent');
        const mesh = entity.getComponent('MeshComponent');
        
        if (transform && mesh) {
            console.log(`Entity ${entity.id} has required components, adding to scene`);
            this.addEntityToScene(entity);
        } else {
            // Check if the entity might get components later
            console.log(`Entity ${entity.id} missing required components (has transform: ${!!transform}, has mesh: ${!!mesh}), will check later`);
            
            // Set up a one-time component added listener
            const checkComponentsAdded = (msg) => {
                // Only process if it's about our entity
                if (msg.data.entity?.id !== entity.id) return;
                
                // Log the added component
                console.log(`Entity ${entity.id} got component ${msg.data.componentType}`);
                
                // Check if now it has the required components
                const transform = entity.getComponent('TransformComponent');
                const mesh = entity.getComponent('MeshComponent');
                
                if (transform && mesh) {
                    console.log(`Entity ${entity.id} now has required components, adding to scene`);
                    this.addEntityToScene(entity);
                    
                    // Remove this listener after processing
                    this.world.messageBus.unsubscribe('component.added', checkComponentsAdded);
                }
            };
            
            // Subscribe to component added events
            this.world.messageBus.subscribe('component.added', checkComponentsAdded);
        }
    }
    
    /**
     * Handle entity destroyed event
     * @param {object} message Event message
     */
    onEntityDestroyed(message) {
        const entity = message.data.entity;
        
        // Check if we're tracking this entity
        if (this.meshEntities.has(entity.id)) {
            this.removeEntityFromScene(entity);
        }
    }
    
    /**
     * Add entity mesh to scene
     * @param {Entity} entity Entity to add
     */
    addEntityToScene(entity) {
        const meshComponent = entity.getComponent('MeshComponent');
        
        // Debug output all component keys
        console.log(`Entity ${entity.id} components for scene addition:`, Array.from(entity.components.keys()).join(', '));
        
        // Skip if mesh component is missing
        if (!meshComponent || !meshComponent.mesh) {
            console.warn(`Entity ${entity.id} has no valid mesh to add to scene`);
            
            // Debug output if we have a meshComponent but no mesh
            if (meshComponent && !meshComponent.mesh) {
                console.warn(`Entity ${entity.id} has MeshComponent but mesh property is ${meshComponent.mesh}`);
            }
            return;
        }
        
        // Handle bounding sphere carefully - THREE.Group objects don't have geometry
        if (meshComponent.mesh.geometry) {
            // Only compute if it's a mesh with geometry and not a Group
            if (!meshComponent.mesh.geometry.boundingSphere && typeof meshComponent.mesh.geometry.computeBoundingSphere === 'function') {
                meshComponent.mesh.geometry.computeBoundingSphere();
            }
        } else if (meshComponent.mesh.isGroup) {
            // It's a Group object (no direct geometry property)
            console.log(`Entity ${entity.id} uses a THREE.Group - skipping bounding sphere computation`);
        }
        
        // Ensure we have access to the scene
        if (!this.scene) {
            console.error(`Cannot add entity ${entity.id} mesh to scene - scene reference is missing`);
            return;
        }
        
        // Add mesh to scene directly (don't check for parent)
        this.scene.add(meshComponent.mesh);
        
        // Make sure mesh is visible
        meshComponent.mesh.visible = true;
        
        // Apply entity transform to mesh
        const transform = entity.getComponent('TransformComponent');
        if (transform) {
            meshComponent.mesh.position.copy(transform.position);
            meshComponent.mesh.quaternion.copy(transform.quaternion);
            meshComponent.mesh.scale.copy(transform.scale);
        }
        
        // Log debug info about entity being added
        console.log(`Added entity ${entity.id} mesh to scene - position: ${meshComponent.mesh.position.x.toFixed(0)},${meshComponent.mesh.position.y.toFixed(0)},${meshComponent.mesh.position.z.toFixed(0)}`);
        
        // Track this entity for updates
        this.meshEntities.set(entity.id, entity);
    }
    
    /**
     * Remove entity mesh from scene
     * @param {Entity} entity Entity to remove
     */
    removeEntityFromScene(entity) {
        const meshComponent = entity.getComponent('MeshComponent');
        
        // Remove mesh from scene
        if (meshComponent.mesh && meshComponent.mesh.parent) {
            this.scene.remove(meshComponent.mesh);
        }
        
        // Stop tracking this entity
        this.meshEntities.delete(entity.id);
    }
    
    /**
     * Update camera frustum for culling
     */
    updateFrustum() {
        if (!this.camera) return;
        
        try {
            // Check if camera matrices are valid
            if (!this.camera.projectionMatrix || !this.camera.matrixWorldInverse) {
                console.warn('Camera matrices not initialized');
                return;
            }
            
            // Create fresh matrices to avoid reference issues
            this.projScreenMatrix = new THREE.Matrix4();
            
            // Multiply matrices to create projection
            this.projScreenMatrix.multiplyMatrices(
                this.camera.projectionMatrix,
                this.camera.matrixWorldInverse
            );
            
            // Set frustum from projection matrix
            this.frustum = new THREE.Frustum();
            this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
        } catch (error) {
            console.error('Error updating frustum:', error);
            // If we can't update the frustum, we'll disable culling by setting DEBUG_MODE
            window.DEBUG_MODE = true;
        }
    }
    
    /**
     * Check if a position is visible in the camera frustum
     * @param {THREE.Vector3} position Position to check
     * @param {number} radius Bounding sphere radius
     * @returns {boolean} True if visible
     */
    isVisible(position, radius) {
        // Use a much larger radius for distant objects
        const visibilityRadius = Math.max(radius, 1000); // Ensure large distant objects remain visible
        
        // During development, or for this fix, ALWAYS assume everything is visible to aid debugging
        // Force to true to bypass the culling system entirely
        window.DEBUG_MODE = true;
        return true;
        
        // Safely check if position is valid before creating a sphere
        if (!position || typeof position.x !== 'number') {
            console.warn('Invalid position for visibility check:', position);
            return true; // Default to visible if position is invalid
        }
        
        // First try just using containsPoint which is simpler
        if (this.frustum.containsPoint(position)) {
            return true;
        }
        
        // Create sphere for intersection test - with error handling
        try {
            const sphere = new THREE.Sphere(position.clone(), visibilityRadius);
            return this.frustum.intersectsSphere(sphere);
        } catch (error) {
            console.warn('Error in frustum intersection test:', error);
            return true; // Default to visible on error
        }
    }
    
    /**
     * Update all mesh transforms from entity transforms
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Update camera frustum for culling
        this.updateFrustum();
        
        // Try to scan for entities that should be tracked but aren't
        if (window.DEBUG_MODE && this.world.time % 5 < deltaTime) {
            this.scanForMissingEntities();
        }
        
        // Update all registered meshes
        for (const entity of this.meshEntities.values()) {
            const transform = entity.getComponent('TransformComponent');
            const meshComponent = entity.getComponent('MeshComponent');
            
            // Skip if either component is missing
            if (!transform || !meshComponent || !meshComponent.mesh) continue;
            
            // Check if mesh is in the scene, if not add it
            if (!meshComponent.mesh.parent && this.scene) {
                console.log(`RenderSystem: Adding missing mesh for entity ${entity.id} to scene`);
                this.scene.add(meshComponent.mesh);
            }
            
            // Update mesh from transform
            meshComponent.mesh.position.copy(transform.position);
            meshComponent.mesh.quaternion.copy(transform.quaternion);
            meshComponent.mesh.scale.copy(transform.scale);
            
            // Mark transform as updated
            transform.needsUpdate = false;
            
            // Force visibility in debug mode
            if (window.DEBUG_MODE) {
                meshComponent.mesh.visible = true;
                continue;
            }
            
            // Update visibility based on frustum culling
            if (meshComponent.visible) {
                // Use a large default radius for better visibility
                // Handle both mesh geometry and group objects
                let radius = 500; // Default large radius
                
                // Safely check for boundingSphere - handle all cases
                if (meshComponent.mesh.isGroup) {
                    // For groups, we don't have a direct boundingSphere, so use default
                    radius = 500;
                } else if (meshComponent.mesh.geometry) {
                    // Only try to access boundingSphere if geometry exists
                    if (meshComponent.mesh.geometry.boundingSphere) {
                        radius = meshComponent.mesh.geometry.boundingSphere.radius;
                    } else if (typeof meshComponent.mesh.geometry.computeBoundingSphere === 'function') {
                        // Try to compute if not already done
                        meshComponent.mesh.geometry.computeBoundingSphere();
                        // Now check if it was created successfully
                        if (meshComponent.mesh.geometry.boundingSphere) {
                            radius = meshComponent.mesh.geometry.boundingSphere.radius;
                        }
                    }
                }
                const isInView = this.isVisible(transform.position, radius);
                meshComponent.mesh.visible = isInView;
            } else {
                meshComponent.mesh.visible = false;
            }
        }
        
        // Diagnostics - log mesh counts periodically
        if (window.DEBUG_MODE && this.world.time % 5 < deltaTime) {
            console.log(`RenderSystem: ${this.meshEntities.size} entities being managed`);
        }
        
        // This system only handles mesh transform updates
        // The main game renderer handles the actual rendering
    }
    
    /**
     * Scan for entities that should be tracked but aren't
     */
    scanForMissingEntities() {
        // Get all entities with transform and mesh components
        const entities = this.world.getEntitiesWithComponents(['TransformComponent', 'MeshComponent']);
        
        // Count how many we're not tracking
        let missingCount = 0;
        
        // Add any entities that aren't already being tracked
        entities.forEach(entity => {
            if (!this.meshEntities.has(entity.id)) {
                console.log(`RenderSystem: Found untracked entity ${entity.id} with mesh, adding to scene`);
                this.addEntityToScene(entity);
                missingCount++;
            }
        });
        
        if (missingCount > 0) {
            console.log(`RenderSystem: Added ${missingCount} missing entities to tracking`);
        }
    }
}