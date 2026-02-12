// renderer.ts - Main renderer orchestrator delegating to specialized submodules

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PCFSoftShadowMap,
  ACESFilmicToneMapping,
  SRGBColorSpace,
  Object3D,
  BufferGeometry,
  Material,
  InstancedMesh,
  Vector3,
  Quaternion,
} from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { WebGPURenderer } from 'three/webgpu';
import { LightingManager } from './renderer/lighting';
import { PostProcessingManager } from './renderer/post';
import { TSLPostProcessingManager } from './renderer/postTSL';
import { SceneApiManager } from './renderer/sceneApi';
import { RenderHelpers } from './renderer/helpers';
import { debugLog } from '../globals/debug.ts';
import { VolumetricLightingManager } from './renderer/volumetricLighting';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

type RendererType = WebGLRenderer | WebGPURenderer;

interface ViewDef {
    [key: string]: any;
}

export class Renderer {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer!: RendererType;
    renderAlpha: number = 0;
    lightingManager?: LightingManager;
    postProcessingManager?: PostProcessingManager | TSLPostProcessingManager;
    sceneApiManager?: SceneApiManager;
    renderHelpers?: RenderHelpers;
    volumetricLightingManager?: VolumetricLightingManager;
    composer?: EffectComposer;
    filmPass?: any; // ShaderPass from post-processing
    volumetricLightEnabled?: boolean;
    useClaudeRays?: boolean;

    constructor() {
        debugLog("Initializing enhanced renderer...");

        this.scene = new Scene();
        this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400000);

        // Interpolation alpha provided by main
        this.renderAlpha = 0;
    }

    static async create(): Promise<Renderer> {
        const instance = new Renderer();
        await instance.init();
        return instance;
    }

    async init(): Promise<void> {
        this.renderer = await this.createRenderer();

        // Enable shadow mapping
        if ('shadowMap' in this.renderer) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = PCFSoftShadowMap;
        }

        // Set tone mapping for HDR rendering
        if ('toneMapping' in this.renderer) {
            this.renderer.toneMapping = ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
        }

        this.setupRenderer();

        // Initialize submodules
        this.lightingManager = new LightingManager(this.scene, this.renderer, this.camera);
        
        // Choose post-processing manager based on renderer type
        // Check if it's a WebGPURenderer (using helper or class check)
        // Note: isWebGPURenderer property is common check
        if ('isWebGPURenderer' in this.renderer && this.renderer.isWebGPURenderer) {
            debugLog("Using TSL Post-Processing for WebGPU");
            this.postProcessingManager = new TSLPostProcessingManager(this.renderer, this.scene, this.camera);
        } else {
            debugLog("Using GLSL Post-Processing for WebGL");
            this.postProcessingManager = new PostProcessingManager(this.renderer as WebGLRenderer, this.scene, this.camera);
        }

        this.sceneApiManager = new SceneApiManager(this.scene);
        this.renderHelpers = new RenderHelpers(this.scene);
        // Cast postProcessingManager to any because VolumetricLightingManager expects PostProcessingManager but we have a compatible interface
        this.volumetricLightingManager = new VolumetricLightingManager(this.postProcessingManager as any, this.sceneApiManager, this.camera);

        // Setup through submodules
        this.lightingManager.setupLighting();
        this.postProcessingManager.setupPostProcessing();
        this.setupResizeHandler();

        // Store reference for sun to access
        (this.scene as any).lightingManager = this.lightingManager;

        // Store composer reference
        this.composer = this.postProcessingManager.composer || undefined;
        this.filmPass = this.postProcessingManager.filmPass || undefined;
        this.volumetricLightEnabled = this.postProcessingManager.volumetricLightEnabled;
        this.useClaudeRays = this.postProcessingManager.useClaudeRays;

        debugLog("Enhanced renderer initialized successfully");
    }

    async createRenderer(): Promise<RendererType> {
        // Try WebGPU first, fall back to WebGL2
        try {
            const renderer = new WebGPURenderer({
                antialias: true,
                powerPreference: "high-performance",
            });
            await renderer.init();
            debugLog("WebGPU renderer initialized");
            return renderer;
        } catch (error) {
            debugLog("WebGPU not available, falling back to WebGL2");
        }

        if (!WebGL.isWebGL2Available()) {
            const warning = WebGL.getWebGL2ErrorMessage();
            document.body.appendChild(warning);
            console.error("WebGL 2 is required but not available.");
            throw new Error("WebGL 2 not available");
        }

        debugLog("WebGL 2 is available.");
        return new WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true, // Better for space scenes with huge distance ranges
            stencil: true, // Explicitly enable stencil buffer (default changed to false in r163)
        });
    }
    
    setupRenderer(): void {
        if ('setSize' in this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        if ('setClearColor' in this.renderer) {
            this.renderer.setClearColor(0x000000);
        }
        if ('domElement' in this.renderer) {
            document.body.appendChild(this.renderer.domElement);
        }
        
        // Set the output color space to sRGB
        if ('outputColorSpace' in this.renderer) {
            this.renderer.outputColorSpace = SRGBColorSpace;
        }
        
        // Position camera - brought closer for better visibility
        this.camera.position.z = 10;
        
        // Make sure the camera can see far enough to show the skybox
        this.camera.far = 400000;
        this.camera.updateProjectionMatrix();

        // Enhance shadow mapping for better quality eclipse effects
        if ('shadowMap' in this.renderer) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = PCFSoftShadowMap;
            if ('autoUpdate' in this.renderer.shadowMap) {
                (this.renderer.shadowMap as any).autoUpdate = true;
            }
        }
    }
    
    // Post-processing setup is now handled by PostProcessingManager
    
    // Volumetric lighting setup is now handled by PostProcessingManager and VolumetricLightingManager
    
    // Lighting setup is now handled by LightingManager
    
    setupResizeHandler(): void {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    // Explicitly define getter methods for scene and camera
    getScene(): Scene {
        return this.scene;
    }
    
    getCamera(): PerspectiveCamera {
        return this.camera;
    }
    
    // Resize handler method
    handleResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        if ('setSize' in this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // Update lighting manager's post-processing
        if (this.lightingManager) {
            this.lightingManager.handleResize();
        }

        // Delegate to post-processing manager
        if (this.postProcessingManager) {
            this.postProcessingManager.handleResize();
        }
        
        // Update composer size if it exists (legacy GLSL path)
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        
            // Update FXAA resolution
            try {
                const pixelRatio = 'getPixelRatio' in this.renderer ? this.renderer.getPixelRatio() : 1;
                const fxaaPass = this.composer.passes.find((pass: any) => 
                    pass.material && 
                    pass.material.uniforms && 
                    pass.material.uniforms.resolution &&
                    pass.material.uniforms.resolution.value
                );
                
                if (fxaaPass) {
                    (fxaaPass as any).material.uniforms.resolution.value.x = 1 / (window.innerWidth * pixelRatio);
                    (fxaaPass as any).material.uniforms.resolution.value.y = 1 / (window.innerHeight * pixelRatio);
                }
            } catch (error) {
                console.warn("Error updating FXAA resolution:", error);
            }
        }
    }
    
    // Add an object to the scene through guarded path
    add(object: Object3D): void {
        this._withGuard(() => this.scene.add(object));
    }
    
    // Allow dynamic adjustment of post-processing settings
    adjustBloom(strength: number, radius: number, threshold: number): void {
        if (this.postProcessingManager) {
            this.postProcessingManager.adjustBloom(strength, radius, threshold);
        }
    }
    
    // Update for dynamic visual effects
    update(deltaTime: number): void {
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
    render(): void {
        // Update performance counters
        if (this.renderHelpers) {
            const startCalls = this.renderHelpers.updatePerformanceCounters(this.renderer);
            
            // Delegate to post-processing manager
            if (this.postProcessingManager) {
                this.postProcessingManager.render();
            }
            
            // Finalize performance counters
            this.renderHelpers.finalizePerformanceCounters(this.renderer, startCalls);
        } else if (this.postProcessingManager) {
            this.postProcessingManager.render();
        }
    }

    // Interpolate ECS meshes before compositing
    interpolateMeshes(alpha: number): void {
        this.renderAlpha = alpha;
        if (this.sceneApiManager) {
            this.sceneApiManager.interpolateMeshes(alpha);
        }
    }

    // Facade API for views - delegated to SceneApiManager
    addView(entityId: number, viewDef: ViewDef): void {
        if (this.sceneApiManager) {
            this.sceneApiManager.addView(entityId, viewDef);
        }
    }

    removeView(entityId: number): void {
        if (this.sceneApiManager) {
            this.sceneApiManager.removeView(entityId);
        }
    }

    _withGuard<T>(fn: () => T): T {
        if (this.sceneApiManager) {
            return this.sceneApiManager._withGuard(fn);
        }
        return fn();
    }

    updateView(entityId: number, props: any): void {
        if (this.sceneApiManager) {
            this.sceneApiManager.updateView(entityId, props);
        }
    }
    
    /**
     * Create an instanced mesh for efficient rendering of many similar objects
     */
    createInstancedMesh(key: string, geometry: BufferGeometry, material: Material, maxCount: number): InstancedMesh | null {
        if (this.renderHelpers) {
            return this.renderHelpers.createInstancedMesh(key, geometry, material, maxCount);
        }
        return null;
    }
    
    /**
     * Add or update an instance in an instanced mesh
     */
    updateInstance(key: string, index: number, position: Vector3, quaternion: Quaternion, scale: Vector3): boolean {
        if (this.renderHelpers) {
            return Boolean(this.renderHelpers.updateInstance(key, index, position, quaternion, scale));
        }
        return false;
    }
    
    /**
     * Update instanced meshes
     */
    updateInstancedMeshes(): void {
        if (this.renderHelpers) {
            this.renderHelpers.updateInstancedMeshes();
        }
    }
    
    /**
     * Remove an instance from an instanced mesh
     */
    removeInstance(key: string, index: number): void {
        if (this.renderHelpers) {
            this.renderHelpers.removeInstance(key, index);
        }
    }
    
    /**
     * Properly dispose of Three.js resources to prevent memory leaks
     */
    dispose(): void {
        debugLog("Disposing renderer resources...");
        
        // Remove event listener
        window.removeEventListener('resize', this.handleResize);
        
        // Dispose submodules
        if (this.postProcessingManager) {
            this.postProcessingManager.dispose();
        }
        if (this.lightingManager) {
            this.lightingManager.dispose();
        }
        if (this.renderHelpers) {
            this.renderHelpers.dispose();
        }
        
        // Dispose of scene objects
        this.scene.traverse((object) => {
            if ('geometry' in object && object.geometry) {
                (object.geometry as any).dispose();
            }
            
            if ('material' in object && object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((material) => {
                        if (this.renderHelpers) {
                            this.renderHelpers.disposeMaterial(material as any);
                        }
                    });
                } else {
                    if (this.renderHelpers) {
                        this.renderHelpers.disposeMaterial(object.material as any);
                    }
                }
            }
        });
        
        // Dispose of renderer
        if ('dispose' in this.renderer) {
            this.renderer.dispose();
        }
        
        debugLog("Renderer resources disposed");
    }
    // Material disposal is now handled by RenderHelpers
    // Shader creation is now handled by shaders.js module
    // Shader creation is now handled by shaders.js module
    
    /**
     * Toggle the type of volumetric lighting effect
     */
    setRayType(useClaudeRays: boolean): void {
        if (this.volumetricLightingManager && this.lightingManager) {
            this.volumetricLightingManager.setRayType(useClaudeRays);
            this.lightingManager.adjustLightingForRayType(useClaudeRays);
        }
    }
    // Lighting adjustment is now handled by LightingManager
    
    /**
     * Toggle volumetric light rays effect (master toggle)
     */
    setVolumetricLightEnabled(enabled: boolean): void {
        if (this.volumetricLightingManager) {
            this.volumetricLightingManager.setVolumetricLightEnabled(enabled);
        }
    }
    
    /**
     * Update volumetric light parameters for the new god ray shader
     */
    updateVolumetricLightParams(params: any = {}): void {
        if (this.volumetricLightingManager) {
            this.volumetricLightingManager.updateVolumetricLightParams(params);
        }
    }
    
    /**
     * Update Claude Ray parameters
     */
    updateClaudeRayParams(params: any = {}): void {
        if (this.volumetricLightingManager) {
            this.volumetricLightingManager.updateClaudeRayParams(params);
        }
    }
    
    /**
     * Set overall volumetric light ray intensity with a single parameter
     */
    setVolumetricLightIntensity(intensity: number): void {
        if (this.volumetricLightingManager) {
            this.volumetricLightingManager.setVolumetricLightIntensity(intensity);
        }
    }

    // Helper methods for volumetric lighting (delegated to VolumetricLightingManager)
    private updateClaudeRayPosition(): void {
        if (this.volumetricLightingManager) {
            this.volumetricLightingManager.updateClaudeRayPosition();
        }
    }

    private updateVolumetricLightPosition(): void {
        if (this.volumetricLightingManager) {
            this.volumetricLightingManager.updateVolumetricLightPosition();
        }
    }
}
