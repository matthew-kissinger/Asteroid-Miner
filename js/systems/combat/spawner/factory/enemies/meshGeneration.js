/**
 * Mesh Generation - Handles enemy mesh creation and visual effects
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshComponent } from '../../../../../components/rendering/mesh.js';
import { getRandomEnemyColor, getVisualVariant, getRandomVisualVariant } from '../../waves/definitions.js';

export class MeshGeneration {
    constructor(world) {
        this.world = world;
        this.modelCache = {};
        this.currentEntity = null;
        this.loadModels();
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
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.emissive !== undefined) {
                    child.material.emissive = new THREE.Color(0x0088ff);
                    child.material.emissiveIntensity = 2.0;
                } else if (child.material.isMeshBasicMaterial) {
                    child.material.color = new THREE.Color(0x00aaff);
                }
            }
        });
    }

    /**
     * Setup mesh component for entity
     * @param {Entity} entity Entity to setup
     */
    setupMeshComponent(entity) {
        this.currentEntity = entity;
        const mesh = this.createSpectralDroneMesh();
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
     * @returns {Object} Mesh object
     */
    createSpectralDroneMesh() {
        console.log("Creating spectral drone mesh...");
        
        if (!this.modelCache.enemyDrone) {
            return this.createFallbackMesh();
        }
        
        const model = this.modelCache.enemyDrone.clone();
        const visualVariant = this.currentEntity ? this.currentEntity.visualVariant || 0 : 0;
        
        this.applyVisualEffects(model, visualVariant);
        
        return { model, isGLTF: true };
    }

    /**
     * Create fallback mesh when GLB model isn't available
     * @returns {Object} Fallback mesh object
     */
    createFallbackMesh() {
        console.warn("Enemy model not loaded - creating stylized fallback enemy");
        
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.OctahedronGeometry(2, 0);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff,
            emissive: 0x0088ff,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        const wingGeometry = new THREE.BoxGeometry(4, 0.2, 1);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0x8888ff,
            emissive: 0x4444ff,
            emissiveIntensity: 1.0
        });
        
        const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
        wing1.rotation.z = Math.PI / 6;
        group.add(wing1);
        
        const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
        wing2.rotation.z = -Math.PI / 6;
        group.add(wing2);
        
        group.scale.set(1.5, 1.5, 1.5);
        
        return group;
    }

    /**
     * Apply visual effects based on variant
     * @param {THREE.Object3D} model Model to apply effects to
     * @param {number} visualVariant Visual variant ID
     */
    applyVisualEffects(model, visualVariant) {
        const selectedColor = getRandomEnemyColor();
        const variantConfig = getVisualVariant(visualVariant);
        
        let emissiveIntensity = this.calculateEmissiveIntensity(variantConfig);
        let opacity = variantConfig.opacity;
        
        this.applyVariantColorEffects(selectedColor, variantConfig);
        
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.color = new THREE.Color(selectedColor.main);
                child.material.emissive = new THREE.Color(selectedColor.emissive.r, selectedColor.emissive.g, selectedColor.emissive.b);
                child.material.emissiveIntensity = emissiveIntensity;
                
                if (opacity < 1.0) {
                    child.material.transparent = true;
                    child.material.opacity = opacity;
                }
                
                if (variantConfig.additionalEffects) {
                    this.applyAdditionalEffects(child.material);
                }
            }
        });
        
        if (variantConfig.haloEffect) {
            this.addHaloEffect(model, selectedColor);
        }
        
        if (variantConfig.shieldEffect) {
            this.addShieldEffect(model);
        }
    }

    /**
     * Calculate emissive intensity based on variant
     */
    calculateEmissiveIntensity(variantConfig) {
        if (variantConfig.name === 'damaged') {
            return variantConfig.emissiveIntensity.base + 
                (Math.sin(Date.now() * 0.01) * variantConfig.emissiveIntensity.flicker);
        } else if (variantConfig.name === 'elite') {
            return variantConfig.emissiveIntensity.base + 
                (Math.sin(Date.now() * 0.003) * variantConfig.emissiveIntensity.pulse);
        } else if (variantConfig.emissiveIntensity.min !== undefined) {
            return variantConfig.emissiveIntensity.min + 
                Math.random() * (variantConfig.emissiveIntensity.max - variantConfig.emissiveIntensity.min);
        }
        
        return variantConfig.emissiveIntensity;
    }

    /**
     * Apply color effects based on variant
     */
    applyVariantColorEffects(selectedColor, variantConfig) {
        if (variantConfig.colorMultiplier) {
            selectedColor.emissive.r *= variantConfig.colorMultiplier;
            selectedColor.emissive.g *= variantConfig.colorMultiplier;
            selectedColor.emissive.b *= variantConfig.colorMultiplier;
        }
        
        if (variantConfig.shimmerEffect) {
            const shieldPhase = Date.now() * 0.001;
            const shimmerValue = 0.8 + (Math.sin(shieldPhase) * 0.2);
            selectedColor.emissive.r *= shimmerValue;
            selectedColor.emissive.g *= 1 + (1 - shimmerValue);
            selectedColor.emissive.b *= 1 + (Math.cos(shieldPhase) * 0.2);
        }
    }

    /**
     * Apply additional material effects for elite enemies
     */
    applyAdditionalEffects(material) {
        if (material.shininess !== undefined) {
            material.shininess = 100;
        }
        
        if (material.envMapIntensity !== undefined) {
            material.envMapIntensity = 0.8;
        }
    }

    /**
     * Add halo effect for elite enemies
     */
    addHaloEffect(model, selectedColor) {
        try {
            const haloGeometry = new THREE.RingGeometry(1.2, 1.5, 16);
            const haloMaterial = new THREE.MeshBasicMaterial({
                color: selectedColor.main,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const halo = new THREE.Mesh(haloGeometry, haloMaterial);
            halo.rotation.x = Math.PI / 2;
            model.add(halo);
            
            halo.userData.update = function(delta) {
                halo.rotation.z += delta * 0.5;
                const pulseScale = 1 + 0.2 * Math.sin(Date.now() * 0.002);
                halo.scale.set(pulseScale, pulseScale, pulseScale);
            };
        } catch (error) {
            console.error("Failed to create elite halo effect:", error);
        }
    }

    /**
     * Add shield effect for shielded enemies
     */
    addShieldEffect(model) {
        try {
            const shieldGeometry = new THREE.SphereGeometry(1.1, 16, 12);
            const shieldMaterial = new THREE.MeshBasicMaterial({
                color: 0xaaddff,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            model.add(shield);
            
            shield.userData.update = function(delta) {
                const pulseScale = 1 + 0.05 * Math.sin(Date.now() * 0.003);
                shield.scale.set(pulseScale, pulseScale, pulseScale);
                shield.material.opacity = 0.2 + 0.1 * Math.sin(Date.now() * 0.002);
            };
        } catch (error) {
            console.error("Failed to create shield effect:", error);
        }
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