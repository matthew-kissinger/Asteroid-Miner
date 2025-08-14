// renderer.js - Main renderer orchestrator delegating to specialized submodules

import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { LightingManager } from './renderer/lighting.js';
import { PostProcessingManager } from './renderer/post.js';
import { SceneApiManager } from './renderer/sceneApi.js';
import { RenderHelpers } from './renderer/helpers.js';
import { VolumetricLightingManager } from './renderer/volumetricLighting.js';

export class Renderer {
    constructor() {
        console.log("Initializing enhanced renderer...");
        
        // Check for WebGL 2 support
        if (!WebGL.isWebGL2Available()) {
            const warning = WebGL.getWebGL2ErrorMessage();
            document.body.appendChild(warning);
            console.error("WebGL 2 is required but not available.");
            throw new Error("WebGL 2 not available");
        } else {
            console.log("WebGL 2 is available.");
        }
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400000);
        
        // Create renderer with HDR support
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true, // Better for space scenes with huge distance ranges
            stencil: true, // Explicitly enable stencil buffer (default changed to false in r163)
        });
        
        // Enable shadow mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Use the new physically correct lighting system (default in r155+)
        this.renderer.useLegacyLights = false;
        
        // Set tone mapping for HDR rendering
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        this.setupRenderer();
        
        // Initialize submodules
        this.lightingManager = new LightingManager(this.scene);
        this.postProcessingManager = new PostProcessingManager(this.renderer, this.scene, this.camera);
        this.sceneApiManager = new SceneApiManager(this.scene);
        this.renderHelpers = new RenderHelpers(this.scene);
        this.volumetricLightingManager = new VolumetricLightingManager(this.postProcessingManager, this.sceneApiManager, this.camera);
        
        // Setup through submodules
        this.lightingManager.setupLighting();
        this.postProcessingManager.setupPostProcessing();
        this.setupResizeHandler();
        
        // Interpolation alpha provided by main
        this.renderAlpha = 0;
        
        console.log("Enhanced renderer initialized successfully");
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);
        
        // Set the output color space to sRGB
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Position camera - brought closer for better visibility
        this.camera.position.z = 10;
        
        // Make sure the camera can see far enough to show the skybox
        this.camera.far = 400000;
        this.camera.updateProjectionMatrix();

        // Enhance shadow mapping for better quality eclipse effects
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
    }
    
    // Post-processing setup is now handled by PostProcessingManager
    
    // Volumetric lighting setup is now handled by PostProcessingManager and VolumetricLightingManager
    
    // Lighting setup is now handled by LightingManager
    
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    // Explicitly define getter methods for scene and camera
    getScene() {
        return this.scene;
    }
    
    getCamera() {
        return this.camera;
    }
    
    // Resize handler method
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update composer size if it exists
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        
            // Update FXAA resolution
            try {
                const pixelRatio = this.renderer.getPixelRatio();
                const fxaaPass = this.composer.passes.find(pass => 
                    pass.material && 
                    pass.material.uniforms && 
                    pass.material.uniforms.resolution &&
                    pass.material.uniforms.resolution.value
                );
                
                if (fxaaPass) {
                    fxaaPass.material.uniforms.resolution.value.x = 1 / (window.innerWidth * pixelRatio);
                    fxaaPass.material.uniforms.resolution.value.y = 1 / (window.innerHeight * pixelRatio);
                }
            } catch (error) {
                console.warn("Error updating FXAA resolution:", error);
            }
        }
    }
    
    // Add an object to the scene through guarded path
    add(object) {
        return this._withGuard(() => this.scene.add(object));
    }
    
    // Allow dynamic adjustment of post-processing settings
    adjustBloom(strength, radius, threshold) {
        if (this.bloomPass) {
            this.bloomPass.strength = strength !== undefined ? strength : this.bloomPass.strength;
            this.bloomPass.radius = radius !== undefined ? radius : this.bloomPass.radius;
            this.bloomPass.threshold = threshold !== undefined ? threshold : this.bloomPass.threshold;
        }
    }
    
    // Update for dynamic visual effects
    update(deltaTime) {
        // Update film grain with time for animation
        if (this.filmPass && this.filmPass.uniforms && this.filmPass.uniforms.time && this.filmPass.uniforms.time.value !== undefined) {
            try {
                this.filmPass.uniforms.time.value += deltaTime;
            } catch (error) {
                console.warn("Error updating film pass time:", error);
            }
        }
        
        // Update volumetric light ray position if sun is present
        if (this.volumetricLightEnabled) {
            if (this.useClaudeRays) {
                this.updateClaudeRayPosition();
            } else {
                this.updateVolumetricLightPosition();
            }
        }
        
        // Update instanced meshes
        this.updateInstancedMeshes();
    }
    
    // Volumetric lighting position updates are now handled by VolumetricLightingManager
    // Volumetric lighting position updates are now handled by VolumetricLightingManager
    // Sun object finding is now handled by SceneApiManager
    
    // Override the render method to use the composer if available, otherwise fallback to basic rendering
    render() {
        // Update performance counters
        const startCalls = this.renderHelpers.updatePerformanceCounters(this.renderer);
        
        // Delegate to post-processing manager
        this.postProcessingManager.render();
        
        // Finalize performance counters
        this.renderHelpers.finalizePerformanceCounters(this.renderer, startCalls);
    }

    // Interpolate ECS meshes before compositing
    interpolateMeshes(alpha) {
        this.renderAlpha = alpha;
        this.sceneApiManager.interpolateMeshes(alpha);
    }

    // Facade API for views - delegated to SceneApiManager
    addView(entityId, viewDef) {
        this.sceneApiManager.addView(entityId, viewDef);
    }

    removeView(entityId) {
        this.sceneApiManager.removeView(entityId);
    }

    _withGuard(fn) {
        return this.sceneApiManager._withGuard(fn);
    }

    updateView(entityId, props) {
        this.sceneApiManager.updateView(entityId, props);
    }
    
    /**
     * Create an instanced mesh for efficient rendering of many similar objects
     */
    createInstancedMesh(key, geometry, material, maxCount) {
        return this.renderHelpers.createInstancedMesh(key, geometry, material, maxCount);
    }
    
    /**
     * Add or update an instance in an instanced mesh
     */
    updateInstance(key, index, position, quaternion, scale) {
        return this.renderHelpers.updateInstance(key, index, position, quaternion, scale);
    }
    
    /**
     * Update instanced meshes
     */
    updateInstancedMeshes() {
        this.renderHelpers.updateInstancedMeshes();
    }
    
    /**
     * Remove an instance from an instanced mesh
     */
    removeInstance(key, index) {
        this.renderHelpers.removeInstance(key, index);
    }
    
    /**
     * Properly dispose of Three.js resources to prevent memory leaks
     */
    dispose() {
        console.log("Disposing renderer resources...");
        
        // Remove event listener
        window.removeEventListener('resize', this.handleResize);
        
        // Dispose submodules
        this.postProcessingManager.dispose();
        this.lightingManager.dispose();
        this.renderHelpers.dispose();
        
        // Dispose of scene objects
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => this.renderHelpers.disposeMaterial(material));
                } else {
                    this.renderHelpers.disposeMaterial(object.material);
                }
            }
        });
        
        // Dispose of renderer
        this.renderer.dispose();
        
        console.log("Renderer resources disposed");
    }
    // Material disposal is now handled by RenderHelpers
    // Shader creation is now handled by shaders.js module
    // Shader creation is now handled by shaders.js module
    
    /**
     * Toggle the type of volumetric lighting effect
     */
    setRayType(useClaudeRays) {
        this.volumetricLightingManager.setRayType(useClaudeRays);
        this.lightingManager.adjustLightingForRayType(useClaudeRays);
    }
    // Lighting adjustment is now handled by LightingManager
    
    /**
     * Toggle volumetric light rays effect (master toggle)
     */
    setVolumetricLightEnabled(enabled) {
        this.volumetricLightingManager.setVolumetricLightEnabled(enabled);
    }
    
    /**
     * Update volumetric light parameters for the new god ray shader
     */
    updateVolumetricLightParams(params = {}) {
        this.volumetricLightingManager.updateVolumetricLightParams(params);
    }
    
    /**
     * Update Claude Ray parameters
     */
    updateClaudeRayParams(params = {}) {
        this.volumetricLightingManager.updateClaudeRayParams(params);
    }
    
    /**
     * Set overall volumetric light ray intensity with a single parameter
     */
    setVolumetricLightIntensity(intensity) {
        this.volumetricLightingManager.setVolumetricLightIntensity(intensity);
    }
}