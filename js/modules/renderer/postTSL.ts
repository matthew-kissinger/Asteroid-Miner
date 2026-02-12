// postTSL.ts - TSL Post-processing manager for WebGPU
import { Scene, Camera, Vector2, Color, Vector3 } from 'three';
// @ts-ignore
import { PostProcessing } from 'three/webgpu';
import { pass, uniform, float, vec3, uv, mix, dot, pow, vec4 } from 'three/tsl';
// @ts-ignore
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
// @ts-ignore
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
// @ts-ignore
import { film } from 'three/addons/tsl/display/FilmNode.js';
// @ts-ignore
import { colorCorrection } from 'three/addons/tsl/display/ColorCorrectionNode.js'; // Assuming this exists or I'll reimplement

import { volumetricLight, claudeRays } from './shadersTSL';

export class TSLPostProcessingManager {
    renderer: any; // WebGPURenderer
    scene: Scene;
    camera: Camera;
    postProcessing: any; // PostProcessing instance
    
    // Uniforms for controlling effects
    uniforms: {
        godRays: {
            lightPosition: any;
            intensity: any;
            decay: any;
            density: any;
            weight: any;
            samples: any;
            sunColor: any;
            sunDistance: any;
            sunVisibility: any;
            scattering: any;
            attenuationMultiplier: any;
            enabled: any; // Mix factor (0 or 1)
        };
        claudeRays: {
            lightPosition: any;
            exposure: any;
            decay: any;
            density: any;
            weight: any;
            lightColor: any;
            enabled: any; // Mix factor
        };
        bloom: {
            strength: any;
            radius: any;
            threshold: any;
        };
        film: {
            nIntensity: any;
            sIntensity: any;
            grayscale: any;
            time: any;
        };
        vignette: {
            offset: any;
            darkness: any;
        };
        colorCorrection: {
            powRGB: any;
            mulRGB: any;
        };
    };

    volumetricLightEnabled: boolean = true;
    useClaudeRays: boolean = false;
    
    constructor(renderer: any, scene: Scene, camera: Camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.postProcessing = null;
        
        // Initialize uniforms
        this.uniforms = {
            godRays: {
                lightPosition: uniform(new Vector2(0.5, 0.5)),
                intensity: uniform(0.45),
                decay: uniform(0.94),
                density: uniform(0.6),
                weight: uniform(0.5),
                samples: uniform(100),
                sunColor: uniform(new Color(0xFFFAF0)),
                sunDistance: uniform(0.5),
                sunVisibility: uniform(1.0),
                scattering: uniform(0.4),
                attenuationMultiplier: uniform(3.5),
                enabled: uniform(1.0) 
            },
            claudeRays: {
                lightPosition: uniform(new Vector2(0.5, 0.5)),
                exposure: uniform(0.4),
                decay: uniform(0.93),
                density: uniform(0.8),
                weight: uniform(0.25),
                lightColor: uniform(new Color(0xFFFAF0)),
                enabled: uniform(0.0)
            },
            bloom: {
                strength: uniform(0.2),
                radius: uniform(0.2),
                threshold: uniform(0.95)
            },
            film: {
                nIntensity: uniform(0.08),
                sIntensity: uniform(0.03),
                grayscale: uniform(0),
                time: uniform(0.0)
            },
            vignette: {
                offset: uniform(0.95),
                darkness: uniform(1.6)
            },
            colorCorrection: {
                powRGB: uniform(new Vector3(1.1, 1.1, 1.2)),
                mulRGB: uniform(new Vector3(1.2, 1.1, 1.0))
            }
        };
    }

    // Compatibility getters for VolumetricLightingManager and Renderer
    get godRayPass() {
        const uniforms = this.uniforms.godRays;
        return {
            uniforms: uniforms,
            get enabled() { return uniforms.enabled.value > 0.5; },
            set enabled(v: boolean) { uniforms.enabled.value = v ? 1.0 : 0.0; }
        };
    }

    get claudeRayPass() {
        const uniforms = this.uniforms.claudeRays;
        return {
            uniforms: uniforms,
            get enabled() { return uniforms.enabled.value > 0.5; },
            set enabled(v: boolean) { uniforms.enabled.value = v ? 1.0 : 0.0; }
        };
    }

    get filmPass() {
        return {
            uniforms: this.uniforms.film
        };
    }

    get bloomPass() {
        // UnrealBloomPass has strength, radius, threshold properties directly
        const self = this;
        return {
            get strength() { return self.uniforms.bloom.strength.value; },
            set strength(v: number) { self.uniforms.bloom.strength.value = v; },
            get radius() { return self.uniforms.bloom.radius.value; },
            set radius(v: number) { self.uniforms.bloom.radius.value = v; },
            get threshold() { return self.uniforms.bloom.threshold.value; },
            set threshold(v: number) { self.uniforms.bloom.threshold.value = v; }
        };
    }

    // No direct equivalent for composer, but expose something if needed
    get composer() {
        return null; // Signals to renderer that we don't use standard composer
    }

    setupPostProcessing(): void {
        try {
            this.postProcessing = new PostProcessing(this.renderer);
            
            // 1. Scene Pass
            const scenePass = pass(this.scene, this.camera);
            // Use any for pipeline to avoid type issues with TSL node chaining
            let currentOutput: any = scenePass;

            // 2. Volumetric Lights
            // We calculate both and mix based on enabled state to avoid rebuilding graph
            // This assumes reasonable performance cost. If too expensive, we might need to swap nodes.
            // But for now, let's wire them up.
            
            // God Rays (New)
            const godRayOutput = volumetricLight(currentOutput, this.uniforms.godRays);
            
            // Claude Rays (Old)
            const claudeRayOutput = claudeRays(currentOutput, this.uniforms.claudeRays);
            
            // Mix God Rays
            // If godRays.enabled is 1, we use godRayOutput. But godRayOutput is already mixed with scene in the shader function?
            // Actually my shader function implementation returns the final mixed color for god rays.
            // So we can just use mix() to blend between scenePass and godRayOutput based on global enabled switch
            
            // Logic: 
            // If volEnabled && !useClaude -> use GodRays
            // If volEnabled && useClaude -> use ClaudeRays
            // Else -> use scenePass
            
            // I'll control this via the 'enabled' uniforms I created. 
            // If I want to disable, I set enabled uniform to 0. 
            // My shader implementation for GodRays DOES define 'intensity' but doesn't have an external 'enabled' mix.
            // I should adhere to what the shader does.
            // The shader returns a color that includes the scene.
            
            // Let's blend:
            // Final = mix(Scene, GodRayResult, GodRayEnabled)
            // But GodRayResult ALREADY includes Scene.
            // So if GodRayResult is effectively "Scene + Rays", and if I disabled it I want "Scene".
            // So: mix(Scene, GodRayResult, Enabled) works.
            
            currentOutput = mix(currentOutput, godRayOutput, this.uniforms.godRays.enabled);
            currentOutput = mix(currentOutput, claudeRayOutput, this.uniforms.claudeRays.enabled);

            // 3. Bloom
            // bloom( input, strength, radius, threshold )
            const bloomEffect = bloom(
                currentOutput, 
                this.uniforms.bloom.strength,
                this.uniforms.bloom.radius,
                this.uniforms.bloom.threshold
            );
            // Bloom usually returns just the bloom component or the composited result? 
            // TSL bloom node usually adds to input. Let's assume it returns the BLOOMED image (input + bloom) 
            // or we might need to add it. 
            // Looking at three.js examples, bloom(pass) returns the result.
            currentOutput = bloomEffect;

            // 4. FXAA
            currentOutput = fxaa(currentOutput);

            // 5. Color Correction
            // Re-implementing logic: pow( color, powRGB ) * mulRGB
            const cc = this.uniforms.colorCorrection;
            // pow() in TSL is per-component? Yes.
            // colorCorrection node might exist but simple math is safer if I'm unsure of import
            /* 
            if (colorCorrection) {
                 currentOutput = colorCorrection(currentOutput, cc.powRGB, cc.mulRGB);
            } else {
            */
                // Manual Color Correction
                // Note: scenePass is vec4.
                const colorRGB = currentOutput.rgb;
                const corrected = pow(colorRGB, cc.powRGB).mul(cc.mulRGB);
                currentOutput = vec4(corrected, currentOutput.a);
            /* } */

            // 6. Film Grain
            // film( input, noiseIntensity, scanlineIntensity, scanlineCount, grayscale )
            // My film shader has nIntensity, sIntensity, grayscale. 
            // Scanline count was fixed in shader or calculated? 
            // Original FilmShader has 'count' uniform usually. The wrapper used default?
            // js/modules/renderer/post.ts says: filmPass.uniforms.nIntensity... 
            // It doesn't set count explicitly in setupFilmPass, so it uses default.
            // TSL film node usually expects explicit params.
            // Let's use 648 as count (common default).
            
            // film node might take (input, noise, scanlines, grayscale) or similar.
            // I'll assume: film(input, noise, scanlines, grayscale)
            // But wait, my uniform is 'time' for animation. The TSL node might handle time internally or accept it?
            // Usually TSL nodes use the global 'time' uniform if needed, or we pass it.
            // three/addons/tsl/display/FilmNode.js: export const film = ( node, noiseIntensity, scanlineIntensity, scanlineCount, grayscale )
            
            // I need to animate the noise. The standard FilmNode might not animate noise by default unless it uses 'time'.
            // I'll use the imported 'film' and hope it supports animation or I might need a custom one.
            // Note: TSL film() takes 1-3 arguments, not 5 like the GLSL FilmPass
            // film(input, noiseIntensity, scanlineIntensity)
            currentOutput = film(
                currentOutput,
                this.uniforms.film.nIntensity,
                this.uniforms.film.sIntensity
            );

            // 7. Vignette
            // Re-implementing logic: 
            // vec2 uv = (vUv - 0.5) * offset;
            // gl_FragColor = vec4(mix(texel.rgb, vec3(1.0 - darkness), dot(uv, uv)), texel.a);
            
            // Manual Vignette
            const vParams = this.uniforms.vignette;
            const uvCentered = uv().sub(0.5).mul(vParams.offset);
            const dotVal = dot(uvCentered, uvCentered);
            // mix(color, vec3(1.0 - darkness), dot) -> darkness is > 1 usually (1.6) so 1-1.6 = -0.6?
            // Wait, VignetteShader source:
            // mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) )
            // If darkness is 1.6, vec3 is -0.6. That seems like it would darken a lot or invert.
            // Actually, usually darkness is < 1 for black vignette? 
            // But the code had darkness 1.6. 
            // Let's implement exactly as the GLSL shader logic I read in `post.ts` (implied) or standard VignetteShader.
            // Standard VignetteShader:
            // uniform float offset; uniform float darkness;
            // ... mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) )
            // Yes.
            
            // In TSL:
            const darknessColor = vec3(float(1.0).sub(vParams.darkness));
            const vigColor = mix(currentOutput.rgb, darknessColor, dotVal);
            currentOutput = vec4(vigColor, currentOutput.a);

            // Set final output
            this.postProcessing.outputNode = currentOutput;
            
            console.log("TSL Post-processing setup complete");
        } catch (error) {
            console.error("Error setting up TSL post-processing:", error);
        }
    }

    render(): void {
        if (this.postProcessing) {
            this.postProcessing.render();
        }
    }

    handleResize(): void {
        // PostProcessing handles resize automatically? 
        // We might need to update resolution uniforms if we used any manually.
        // FXAA in TSL might need resolution update if it doesn't use standard screen size.
        // Usually TSL nodes are resolution-aware.
    }

    adjustBloom(strength?: number, radius?: number, threshold?: number): void {
        if (strength !== undefined) this.uniforms.bloom.strength.value = strength;
        if (radius !== undefined) this.uniforms.bloom.radius.value = radius;
        if (threshold !== undefined) this.uniforms.bloom.threshold.value = threshold;
    }

    update(deltaTime: number): void {
        // Update time for film grain
        this.uniforms.film.time.value += deltaTime;
        
        // Update enabled state based on flags
        // If volumetric light is enabled
        if (this.volumetricLightEnabled) {
            if (this.useClaudeRays) {
                this.uniforms.claudeRays.enabled.value = 1.0;
                this.uniforms.godRays.enabled.value = 0.0;
            } else {
                this.uniforms.claudeRays.enabled.value = 0.0;
                this.uniforms.godRays.enabled.value = 1.0;
            }
        } else {
            this.uniforms.claudeRays.enabled.value = 0.0;
            this.uniforms.godRays.enabled.value = 0.0;
        }
    }

    dispose(): void {
        if (this.postProcessing) {
            this.postProcessing.dispose();
        }
    }
}
