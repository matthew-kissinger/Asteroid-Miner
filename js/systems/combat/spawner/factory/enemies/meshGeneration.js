/**
 * Mesh Generation - Handles enemy mesh creation and visual effects
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshComponent } from '../../../../../components/rendering/mesh.js';
import { getEnemySubtype } from '../../waves/definitions.js';

export class MeshGeneration {
    constructor(world) {
        this.world = world;
        this.modelCache = {};
        this.materialCache = {}; // Cache materials to reuse them
        this.currentEntity = null;
        this.loadModels();
        this.initializeMaterials(); // Pre-create all materials
    }

    /**
     * Pre-load all enemy models
     */
    loadModels() {
        const loader = new GLTFLoader();
        const modelPaths = ['assets/enemy.glb'];
        
        const tryLoadModel = (index) => {
            if (index >= modelPaths.length) {
                console.warn('Could not load enemy model from any path, will use fallback meshes');
                return;
            }
            
            const path = modelPaths[index];
            console.log(`Attempting to load enemy model from: ${path}`);
            
            loader.load(
                path,
                (gltf) => {
                    console.log(`Enemy model loaded successfully from ${path}`);
                    this.modelCache.enemyDrone = gltf.scene;
                    this.applyGlobalModelEffects(this.modelCache.enemyDrone);
                },
                (xhr) => {},
                (error) => {
                    console.log(`Failed to load from ${path}, trying next...`);
                    tryLoadModel(index + 1);
                }
            );
        };
        
        tryLoadModel(0);
    }

    /**
     * Apply global transformations and material adjustments to loaded models
     * @param {THREE.Object3D} model The loaded model
     */
    applyGlobalModelEffects(model) {
        // Model will get proper shader material when created
        // Just ensure it's visible
        model.traverse((child) => {
            if (child.isMesh) {
                child.visible = true;
            }
        });
    }
    
    /**
     * Pre-create and cache all materials and geometry for performance
     */
    initializeMaterials() {
        console.log("Pre-creating enemy materials and geometry...");
        
        // Cache geometry that will be reused
        this.geometryCache = {
            body: new THREE.OctahedronGeometry(2, 0),
            wing: new THREE.BoxGeometry(4, 0.2, 1),
            shield: new THREE.SphereGeometry(3, 8, 6)
        };
        
        // Create simplified, performant materials for each subtype
        const subtypes = ['standard', 'heavy', 'swift'];
        
        subtypes.forEach(subtypeId => {
            const subtype = subtypeId === 'standard' ? 
                { color: { main: 0x00FFFF, emissive: { r: 0, g: 1, b: 1 } }, emissiveIntensity: 2.5 } :
                subtypeId === 'heavy' ?
                { color: { main: 0xFF6600, emissive: { r: 1, g: 0.4, b: 0 } }, emissiveIntensity: 3.0 } :
                { color: { main: 0x66FF00, emissive: { r: 0.4, g: 1, b: 0 } }, emissiveIntensity: 2.8 };
            
            // Use simpler MeshPhongMaterial with emissive for performance
            this.materialCache[subtypeId] = new THREE.MeshPhongMaterial({
                color: subtype.color.main,
                emissive: new THREE.Color(subtype.color.emissive.r, subtype.color.emissive.g, subtype.color.emissive.b),
                emissiveIntensity: subtype.emissiveIntensity,
                shininess: 100,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide
            });
        });
        
        // Warm up materials and geometry by creating temporary meshes
        this.warmupMaterials();
    }
    
    /**
     * Warmup materials to precompile shaders
     */
    warmupMaterials() {
        console.log("Warming up enemy materials (precompiling shaders)...");
        
        // Delay warmup until scene is ready
        setTimeout(() => {
            // Create a temporary mesh for each material to force shader compilation
            const tempGroup = new THREE.Group();
            
            Object.keys(this.materialCache).forEach(subtypeId => {
                const tempMesh = new THREE.Mesh(this.geometryCache.body, this.materialCache[subtypeId]);
                tempGroup.add(tempMesh);
            });
            
            // Add to scene temporarily to force compilation
            if (this.world && this.world.scene) {
                // Use renderer facade if available
                if (window.game && window.game.renderer && window.game.renderer.add) {
                    window.game.renderer.add(tempGroup);
                } else if (this.world.scene.add) {
                    this.world.scene.add(tempGroup);
                }
                
                // Try to force compilation if renderer supports it
                try {
                    if (window.game && window.game.renderer) {
                        // The actual THREE.js renderer is at game.renderer.renderer
                        const threeRenderer = window.game.renderer.renderer;
                        const camera = window.game.camera || window.game.renderer.camera || this.world.scene.camera;
                        
                        if (threeRenderer && camera) {
                            // Check if compile method exists (THREE.js r152+)
                            if (typeof threeRenderer.compile === 'function') {
                                threeRenderer.compile(this.world.scene, camera);
                            } else {
                                // Fallback: just render a frame to compile shaders
                                threeRenderer.render(this.world.scene, camera);
                            }
                        }
                    }
                } catch (e) {
                    console.log("Could not force shader compilation, will compile on first use:", e.message);
                }
                
                // Remove after a frame
                setTimeout(() => {
                    if (tempGroup && tempGroup.parent) {
                        tempGroup.parent.remove(tempGroup);
                    }
                    // Dispose of temp meshes but keep materials and geometry
                    if (tempGroup.children) {
                        while (tempGroup.children.length > 0) {
                            const child = tempGroup.children[0];
                            tempGroup.remove(child);
                            // Don't dispose materials or geometry - we're caching those!
                        }
                    }
                    console.log("Material warmup complete");
                }, 100);
            }
        }, 1000); // Wait 1 second for everything to be initialized
    }

    /**
     * Setup mesh component for entity
     * @param {Entity} entity Entity to setup
     * @param {string} subtypeId Enemy subtype ID
     */
    setupMeshComponent(entity, subtypeId = null) {
        this.currentEntity = entity;
        const mesh = this.createSpectralDroneMesh(subtypeId);
        this.currentEntity = null;
        
        this.cleanupOldMeshComponent(entity);
        
        let meshComponent;
        if (mesh.isGLTF) {
            meshComponent = new MeshComponent(mesh.model);
        } else {
            meshComponent = new MeshComponent(mesh.geometry, mesh.material);
        }
        
        entity.addComponent(meshComponent);
        meshComponent.setVisible(true);
        
        this.addMeshToScene(entity, meshComponent);
    }

    /**
     * Create spectral drone mesh
     * @param {string} subtypeId Enemy subtype ID
     * @returns {Object} Mesh object
     */
    createSpectralDroneMesh(subtypeId = null) {
        console.log("Creating spectral drone mesh...");
        
        // Get subtype configuration
        const subtype = subtypeId ? getEnemySubtype(subtypeId) : 
                       (this.currentEntity && this.currentEntity.subtype ? 
                        getEnemySubtype(this.currentEntity.subtype) : 
                        getEnemySubtype('standard'));
        
        if (!this.modelCache.enemyDrone) {
            return this.createFallbackMesh(subtype);
        }
        
        const model = this.modelCache.enemyDrone.clone();
        this.applySubtypeEffects(model, subtype);
        
        return { model, isGLTF: true };
    }

    /**
     * Create fallback mesh when GLB model isn't available
     * @param {Object} subtype Enemy subtype configuration
     * @returns {Object} Fallback mesh object
     */
    createFallbackMesh(subtype) {
        const group = new THREE.Group();
        
        // Use cached geometry and material for performance
        const bodyMaterial = this.materialCache[subtype.id] || this.materialCache['standard'];
        const body = new THREE.Mesh(this.geometryCache.body, bodyMaterial);
        group.add(body);
        
        // Use cached geometry and reuse the same material for wings
        const wingMaterial = bodyMaterial;
        
        const wing1 = new THREE.Mesh(this.geometryCache.wing, wingMaterial);
        wing1.rotation.z = Math.PI / 6;
        group.add(wing1);
        
        const wing2 = new THREE.Mesh(this.geometryCache.wing, wingMaterial);
        wing2.rotation.z = -Math.PI / 6;
        group.add(wing2);
        
        // Apply subtype-specific scale
        const scale = 1.5 * (subtype.sizeScale || 1.0);
        group.scale.set(scale, scale, scale);
        
        return group;
    }

    /**
     * Apply visual effects based on subtype
     * @param {THREE.Object3D} model Model to apply effects to
     * @param {Object} subtype Enemy subtype configuration
     */
    applySubtypeEffects(model, subtype) {
        // Use cached material instead of creating new shader
        const material = this.materialCache[subtype.id] || this.materialCache['standard'];
        
        // Apply cached material to all meshes in the model
        model.traverse((child) => {
            if (child.isMesh) {
                // Use the cached material
                child.material = material;
            }
        });
        
        // Apply scale based on subtype
        const scale = subtype.sizeScale || 1.0;
        model.scale.multiplyScalar(scale);
        
        // Add subtype-specific effects
        if (subtype.id === 'heavy') {
            this.addHeavyDroneEffects(model, subtype);
        } else if (subtype.id === 'swift') {
            this.addSwiftDroneEffects(model, subtype);
        } else {
            this.addStandardDroneEffects(model, subtype);
        }
    }

    /**
     * Add effects for standard drones
     */
    addStandardDroneEffects(model, subtype) {
        // Skip point lights - they're expensive
        // The emissive material provides enough glow
    }
    
    /**
     * Add effects for heavy drones
     */
    addHeavyDroneEffects(model, subtype) {
        // Add simple shield visual using cached geometry
        // Cache shield material if not already cached
        if (!this.materialCache['shield_' + subtype.id]) {
            this.materialCache['shield_' + subtype.id] = new THREE.MeshBasicMaterial({
                color: subtype.color.main,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
        }
        const shield = new THREE.Mesh(this.geometryCache.shield, this.materialCache['shield_' + subtype.id]);
        model.add(shield);
        // Skip point light for performance
    }
    
    /**
     * Add effects for swift drones
     */
    addSwiftDroneEffects(model, subtype) {
        // Skip particle trails and point lights for performance
        // The high emissive and movement provides enough visual distinction
    }


    /**
     * Clean up old mesh component
     */
    cleanupOldMeshComponent(entity) {
        let meshComponent = entity.getComponent(MeshComponent);
        
        if (meshComponent) {
            if (meshComponent.mesh && meshComponent.mesh.parent) {
                meshComponent.mesh.parent.remove(meshComponent.mesh);
            }
            
            if (meshComponent.mesh) {
                if (meshComponent.mesh.geometry) {
                    meshComponent.mesh.geometry.dispose();
                }
                
                if (meshComponent.mesh.material) {
                    if (Array.isArray(meshComponent.mesh.material)) {
                        meshComponent.mesh.material.forEach(mat => mat.dispose());
                    } else {
                        meshComponent.mesh.material.dispose();
                    }
                }
            }
            
            entity.removeComponent(MeshComponent);
        }
    }

    /**
     * Add mesh to scene and sync with transform
     */
    addMeshToScene(entity, meshComponent) {
        if (this.world && this.world.scene && meshComponent.mesh) {
            if (!meshComponent.mesh.parent) {
                const prevGuard = window.__rendererGuard;
                window.__rendererGuard = true;
                try {
                    this.world.scene.add(meshComponent.mesh);
                } finally {
                    window.__rendererGuard = prevGuard;
                }
            }
            
            const transform = entity.getComponent('TransformComponent');
            if (transform && transform.position) {
                meshComponent.mesh.position.copy(transform.position);
                meshComponent.mesh.rotation.x = transform.rotation.x || 0;
                meshComponent.mesh.rotation.y = transform.rotation.y || 0;
                meshComponent.mesh.rotation.z = transform.rotation.z || 0;
                meshComponent.mesh.scale.copy(transform.scale);
                
                console.log(`Synced mesh position to (${transform.position.x.toFixed(0)}, ${transform.position.y.toFixed(0)}, ${transform.position.z.toFixed(0)})`);
            }
        }
    }
}