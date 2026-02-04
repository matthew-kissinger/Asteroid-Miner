// post.ts - Post-processing effects management

import * as THREE from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import { FilmShader } from 'three/addons/shaders/FilmShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { createVolumetricLightShader, createClaudeRayShader } from './shaders';

type RendererType = THREE.WebGLRenderer | WebGPURenderer;

export class PostProcessingManager {
    renderer: RendererType;
    scene: THREE.Scene;
    camera: THREE.Camera;
    composer: EffectComposer | null;
    bloomPass: UnrealBloomPass | null;
    filmPass: ShaderPass | null;
    colorCorrectionPass: ShaderPass | null;
    vignettePass: ShaderPass | null;
    claudeRayPass: ShaderPass | null;
    godRayPass: ShaderPass | null;
    useBasicRendering: boolean;
    volumetricLightEnabled: boolean;
    useClaudeRays: boolean;

    constructor(renderer: RendererType, scene: THREE.Scene, camera: THREE.Camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.bloomPass = null;
        this.filmPass = null;
        this.colorCorrectionPass = null;
        this.vignettePass = null;
        this.claudeRayPass = null;
        this.godRayPass = null;
        this.useBasicRendering = false;
        
        // Volumetric lighting settings
        this.volumetricLightEnabled = true;
        this.useClaudeRays = false;
    }

    setupPostProcessing(): void {
        try {
            // Create a composer for post-processing effects
            this.composer = new EffectComposer(this.renderer);
            
            // Add the render pass
            const renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Add godray effect based on settings
            this.setupGodRayEffects();
            
            this.setupBloomPass();
            this.setupFXAAPass();
            this.setupColorCorrectionPass();
            this.setupFilmPass();
            this.setupVignettePass();
            
            console.log("Post-processing setup complete");
        } catch (error) {
            console.error("Error setting up post-processing:", error);
            console.log("Continuing with basic rendering without post-processing");
            // Set a flag to use basic rendering instead
            this.useBasicRendering = true;
        }
    }

    setupBloomPass(): void {
        try {
            // Add bloom effect for sun, engines, etc.
            this.bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.2,    // strength (further reduced from 0.3)
                0.2,    // radius (further reduced from 0.3)
                0.95    // threshold (further increased from 0.9 to only affect the very brightest parts)
            );
            this.composer!.addPass(this.bloomPass);
        } catch (error) {
            console.warn("Error setting up UnrealBloomPass:", error);
        }
    }

    setupFXAAPass(): void {
        try {
            // Add FXAA for edge aliasing
            const fxaaPass = new ShaderPass(FXAAShader);
            if (fxaaPass.material && fxaaPass.material.uniforms && fxaaPass.material.uniforms.resolution) {
                const pixelRatio = 'getPixelRatio' in this.renderer ? this.renderer.getPixelRatio() : 1;
                fxaaPass.material.uniforms.resolution.value.x = 1 / (window.innerWidth * pixelRatio);
                fxaaPass.material.uniforms.resolution.value.y = 1 / (window.innerHeight * pixelRatio);
                this.composer!.addPass(fxaaPass);
            } else {
                console.warn("FXAAShader uniforms not as expected, skipping pass");
            }
        } catch (error) {
            console.warn("Error setting up FXAAShader:", error);
        }
    }

    setupColorCorrectionPass(): void {
        try {
            // Add color correction effects
            this.colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
            if (this.colorCorrectionPass.uniforms && this.colorCorrectionPass.uniforms.powRGB && this.colorCorrectionPass.uniforms.mulRGB) {
                this.colorCorrectionPass.uniforms.powRGB.value = new THREE.Vector3(1.1, 1.1, 1.2); // Slightly blue tint
                this.colorCorrectionPass.uniforms.mulRGB.value = new THREE.Vector3(1.2, 1.1, 1.0); // Warmer highlights
                this.composer!.addPass(this.colorCorrectionPass);
            } else {
                console.warn("ColorCorrectionShader uniforms not as expected, skipping pass");
            }
        } catch (error) {
            console.warn("Error setting up ColorCorrectionShader:", error);
        }
    }

    setupFilmPass(): void {
        try {
            // Add CRT/film effect with static scanlines
            this.filmPass = new ShaderPass(FilmShader);
            if (this.filmPass.uniforms && this.filmPass.uniforms.nIntensity && 
                this.filmPass.uniforms.sIntensity && this.filmPass.uniforms.grayscale) {
                this.filmPass.uniforms.nIntensity.value = 0.08; // Reduced noise for subtle grain
                this.filmPass.uniforms.sIntensity.value = 0.03; // Static CRT scanlines
                this.filmPass.uniforms.grayscale.value = 0; // Keep color
                this.composer!.addPass(this.filmPass);
            } else {
                console.warn("FilmShader uniforms not as expected, skipping pass");
            }
        } catch (error) {
            console.warn("Error setting up FilmShader:", error);
        }
    }

    setupVignettePass(): void {
        try {
            // Add vignette effect
            this.vignettePass = new ShaderPass(VignetteShader);
            if (this.vignettePass.uniforms && this.vignettePass.uniforms.offset && this.vignettePass.uniforms.darkness) {
                this.vignettePass.uniforms.offset.value = 0.95;
                this.vignettePass.uniforms.darkness.value = 1.6;
                this.composer!.addPass(this.vignettePass);
            } else {
                console.warn("VignetteShader uniforms not as expected, skipping pass");
            }
        } catch (error) {
            console.warn("Error setting up VignetteShader:", error);
        }
    }

    /**
     * Setup for volumetric lighting (god rays) effects
     * Handles both the new realistic godray effect and the original "Claude Rays"
     */
    setupGodRayEffects(): void {
        try {
            // Initialize flags for volumetric lighting effects
            this.volumetricLightEnabled = true;     // Master toggle for any god ray effect
            this.useClaudeRays = false;             // Toggle between new godRays (false) and Claude Rays (true)
            
            // Create the original "Claude Rays" effect (disabled by default)
            this.claudeRayPass = createClaudeRayShader();
            this.claudeRayPass.enabled = this.volumetricLightEnabled && this.useClaudeRays;
            this.composer!.addPass(this.claudeRayPass);
            console.log("Claude Rays effect created (disabled by default)");
            
            // Create the new improved volumetric lighting effect
            this.godRayPass = createVolumetricLightShader();
            this.godRayPass.enabled = this.volumetricLightEnabled && !this.useClaudeRays;
            this.composer!.addPass(this.godRayPass);
            console.log("New volumetric light ray effect added to post-processing chain");
        } catch (error) {
            console.warn("Error setting up volumetric light shaders:", error);
        }
    }

    // Allow dynamic adjustment of post-processing settings
    adjustBloom(strength?: number, radius?: number, threshold?: number): void {
        if (this.bloomPass) {
            this.bloomPass.strength = strength !== undefined ? strength : this.bloomPass.strength;
            this.bloomPass.radius = radius !== undefined ? radius : this.bloomPass.radius;
            this.bloomPass.threshold = threshold !== undefined ? threshold : this.bloomPass.threshold;
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
    }

    handleResize(): void {
        // Update composer size if it exists
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        
            // Update FXAA resolution
            try {
                const pixelRatio = 'getPixelRatio' in this.renderer ? this.renderer.getPixelRatio() : 1;
                const fxaaPass = this.composer.passes.find(pass =>
                    (pass as any).material &&
                    (pass as any).material.uniforms &&
                    (pass as any).material.uniforms.resolution &&
                    (pass as any).material.uniforms.resolution.value
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

    render(): void {
        if (this.composer && !this.useBasicRendering) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    dispose(): void {
        // Dispose of post-processing
        if (this.composer) {
            this.composer.passes.forEach(pass => {
                if ('dispose' in pass && typeof (pass as any).dispose === 'function') {
                    (pass as any).dispose();
                }
                if ('material' in pass && (pass as any).material) {
                    (pass as any).material.dispose();
                }
            });
        }
    }
}
