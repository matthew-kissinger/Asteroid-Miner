// volumetricLighting.ts - Handles volumetric lighting effects and light position updates

import * as THREE from 'three';
import { PostProcessingManager } from './post.js';
import { SceneApiManager } from './sceneApi.js';

interface VolumetricLightParams {
    intensity?: number;
    decay?: number;
    density?: number;
    weight?: number;
    samples?: number;
    sunColor?: number | string | THREE.Color;
    scattering?: number;
    attenuationMultiplier?: number;
}

interface ClaudeRayParams {
    exposure?: number;
    decay?: number;
    density?: number;
    weight?: number;
    lightColor?: number | string | THREE.Color;
}

export class VolumetricLightingManager {
    postProcessingManager: PostProcessingManager;
    sceneApiManager: SceneApiManager;
    camera: THREE.Camera;

    constructor(
        postProcessingManager: PostProcessingManager,
        sceneApiManager: SceneApiManager,
        camera: THREE.Camera
    ) {
        this.postProcessingManager = postProcessingManager;
        this.sceneApiManager = sceneApiManager;
        this.camera = camera;
    }

    /**
     * Update volumetric light ray position if sun is present
     */
    update(): void {
        if (this.postProcessingManager.volumetricLightEnabled) {
            if (this.postProcessingManager.useClaudeRays) {
                this.updateClaudeRayPosition();
            } else {
                this.updateVolumetricLightPosition();
            }
        }
    }

    /**
     * Update the light position for Claude Rays
     */
    updateClaudeRayPosition(): void {
        try {
            // Ensure we have the required objects
            if (!this.postProcessingManager.claudeRayPass || !this.postProcessingManager.claudeRayPass.uniforms || !this.postProcessingManager.claudeRayPass.uniforms.lightPosition) {
                return;
            }
            
            if (!this.camera) {
                return;
            }
            
            // Try to find the sun in the scene
            const sun = this.sceneApiManager.findSunObject();
            
            if (sun) {
                // Get sun world position
                const sunWorldPos = new THREE.Vector3();
                sun.getWorldPosition(sunWorldPos);
                
                // Create a vector to hold the screen position
                const screenVector = sunWorldPos.clone();
                
                // Project to camera space
                screenVector.project(this.camera);
                
                // Convert to normalized device coordinates (NDC)
                const x = (screenVector.x + 1) / 2;
                const y = (screenVector.y + 1) / 2;
                
                // Update the shader uniform with the new position
                this.postProcessingManager.claudeRayPass.uniforms.lightPosition.value.set(x, y);
            } else {
                // Default to center if sun not found
                this.postProcessingManager.claudeRayPass.uniforms.lightPosition.value.set(0.5, 0.5);
            }
        } catch (error) {
            console.warn('Error updating Claude Ray position:', error);
            
            // Set a default position in case of error
            if (this.postProcessingManager.claudeRayPass && this.postProcessingManager.claudeRayPass.uniforms && this.postProcessingManager.claudeRayPass.uniforms.lightPosition) {
                this.postProcessingManager.claudeRayPass.uniforms.lightPosition.value.set(0.5, 0.5);
            }
        }
    }
    
    /**
     * Update the light position for volumetric rays
     */
    updateVolumetricLightPosition(): void {
        try {
            // Ensure we have the required objects
            if (!this.postProcessingManager.godRayPass || !this.postProcessingManager.godRayPass.uniforms || !this.postProcessingManager.godRayPass.uniforms.lightPosition) {
                return;
            }
            
            if (!this.camera) {
                return;
            }
            
            // Try to find the sun in the scene
            const sun = this.sceneApiManager.findSunObject();
            
            if (sun) {
                // Get sun world position
                const sunWorldPos = new THREE.Vector3();
                sun.getWorldPosition(sunWorldPos);
                
                // Create a vector to hold the screen position
                const screenVector = sunWorldPos.clone();
                
                // Project to camera space
                screenVector.project(this.camera);
                
                // Convert to normalized device coordinates (NDC)
                const x = (screenVector.x + 1) / 2;
                const y = (screenVector.y + 1) / 2;
                
                // Calculate distance from camera to sun for attenuation
                const camToSunDistance = this.camera.position.distanceTo(sunWorldPos);
                
                // Update the shader uniforms
                this.postProcessingManager.godRayPass.uniforms.lightPosition.value.set(x, y);
                
                // Update distance - normalized to 0-1 range for shader
                // Base the max distance on the sun's size and visibility range
                const maxDistance = 130000; // Increased from 100000 for longer rays
                const normalizedDistance = Math.min(1.0, camToSunDistance / maxDistance);
                this.postProcessingManager.godRayPass.uniforms.sunDistance.value = normalizedDistance;
                
                // Calculate if sun is in front of camera (dot product with camera direction)
                const camDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const sunDirection = new THREE.Vector3().subVectors(sunWorldPos, this.camera.position).normalize();
                const dotProduct = camDirection.dot(sunDirection);
                
                // Sun is visible when dot product is positive (sun is in front of camera)
                this.postProcessingManager.godRayPass.uniforms.sunVisibility.value = Math.max(0, dotProduct);
            } else {
                // Default to center if sun not found
                this.postProcessingManager.godRayPass.uniforms.lightPosition.value.set(0.5, 0.5);
                this.postProcessingManager.godRayPass.uniforms.sunDistance.value = 1.0; // Far away
                this.postProcessingManager.godRayPass.uniforms.sunVisibility.value = 0.0; // Not visible
            }
        } catch (error) {
            console.warn('Error updating volumetric light position:', error);
            
            // Set default values in case of error
            if (this.postProcessingManager.godRayPass && this.postProcessingManager.godRayPass.uniforms) {
                if (this.postProcessingManager.godRayPass.uniforms.lightPosition) {
                    this.postProcessingManager.godRayPass.uniforms.lightPosition.value.set(0.5, 0.5);
                }
                if (this.postProcessingManager.godRayPass.uniforms.sunDistance) {
                    this.postProcessingManager.godRayPass.uniforms.sunDistance.value = 1.0;
                }
                if (this.postProcessingManager.godRayPass.uniforms.sunVisibility) {
                    this.postProcessingManager.godRayPass.uniforms.sunVisibility.value = 0.0;
                }
            }
        }
    }

    /**
     * Toggle the type of volumetric lighting effect
     * @param useClaudeRays - If true, use original Claude Rays; if false, use new god rays
     */
    setRayType(useClaudeRays: boolean): void {
        this.postProcessingManager.useClaudeRays = useClaudeRays;
        
        // Enable/disable appropriate shader passes
        if (this.postProcessingManager.claudeRayPass) {
            this.postProcessingManager.claudeRayPass.enabled = this.postProcessingManager.volumetricLightEnabled && this.postProcessingManager.useClaudeRays;
        }
        
        if (this.postProcessingManager.godRayPass) {
            this.postProcessingManager.godRayPass.enabled = this.postProcessingManager.volumetricLightEnabled && !this.postProcessingManager.useClaudeRays;
        }
        
        console.log(`Using ${this.postProcessingManager.useClaudeRays ? 'Claude Rays' : 'Volumetric God Rays'} effect`);
    }
    
    /**
     * Toggle volumetric light rays effect (master toggle)
     * @param enabled Whether to enable or disable all ray effects
     */
    setVolumetricLightEnabled(enabled: boolean): void {
        this.postProcessingManager.volumetricLightEnabled = enabled;
        
        // Update enabled state of current ray effect
        if (this.postProcessingManager.useClaudeRays && this.postProcessingManager.claudeRayPass) {
            this.postProcessingManager.claudeRayPass.enabled = enabled;
        } else if (this.postProcessingManager.godRayPass) {
            this.postProcessingManager.godRayPass.enabled = enabled;
        }
        
        console.log(`Volumetric lighting ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Update volumetric light parameters for the new god ray shader
     * @param params Parameters to update
     */
    updateVolumetricLightParams(params: VolumetricLightParams = {}): void {
        if (!this.postProcessingManager.godRayPass || !this.postProcessingManager.godRayPass.uniforms) return;
        
        const uniforms = this.postProcessingManager.godRayPass.uniforms;
        
        if (params.intensity !== undefined) uniforms.intensity.value = params.intensity;
        if (params.decay !== undefined) uniforms.decay.value = params.decay;
        if (params.density !== undefined) uniforms.density.value = params.density;
        if (params.weight !== undefined) uniforms.weight.value = params.weight;
        if (params.samples !== undefined) uniforms.samples.value = params.samples;
        if (params.sunColor !== undefined) uniforms.sunColor.value = new THREE.Color(params.sunColor);
        if (params.scattering !== undefined) uniforms.scattering.value = params.scattering;
        if (params.attenuationMultiplier !== undefined) uniforms.attenuationMultiplier.value = params.attenuationMultiplier;
    }
    
    /**
     * Update Claude Ray parameters
     * @param params Parameters to update
     */
    updateClaudeRayParams(params: ClaudeRayParams = {}): void {
        if (!this.postProcessingManager.claudeRayPass || !this.postProcessingManager.claudeRayPass.uniforms) return;
        
        const uniforms = this.postProcessingManager.claudeRayPass.uniforms;
        
        if (params.exposure !== undefined) uniforms.exposure.value = params.exposure;
        if (params.decay !== undefined) uniforms.decay.value = params.decay;
        if (params.density !== undefined) uniforms.density.value = params.density;
        if (params.weight !== undefined) uniforms.weight.value = params.weight;
        if (params.lightColor !== undefined) uniforms.lightColor.value = new THREE.Color(params.lightColor);
    }
    
    /**
     * Set overall volumetric light ray intensity with a single parameter
     * @param intensity Value from 0-1 controlling overall ray intensity
     */
    setVolumetricLightIntensity(intensity: number): void {
        if (this.postProcessingManager.useClaudeRays) {
            // For Claude Rays
            if (!this.postProcessingManager.claudeRayPass || !this.postProcessingManager.claudeRayPass.uniforms) return;
            
            // Clamp intensity between 0 and 1
            intensity = Math.max(0, Math.min(1, intensity));
            
            // Scale the intensity to reasonable parameter ranges
            const exposure = 0.2 + (intensity * 0.4);  // Range: 0.2-0.6
            const weight = 0.15 + (intensity * 0.25);  // Range: 0.15-0.4
            const density = 0.7 + (intensity * 0.3);   // Range: 0.7-1.0
            
            // Update the shader parameters
            this.updateClaudeRayParams({
                exposure: exposure,
                weight: weight,
                density: density
            });
        } else {
            // For new god rays
            if (!this.postProcessingManager.godRayPass || !this.postProcessingManager.godRayPass.uniforms) return;
            
            // Clamp intensity between 0 and 1
            intensity = Math.max(0, Math.min(1, intensity));
            
            // Scale intensity for new shader parameters with higher base values
            this.updateVolumetricLightParams({
                intensity: 0.3 + (intensity * 0.4),  // Increased base intensity
                weight: 0.35 + (intensity * 0.3),    // Increased from 0.3 + intensity * 0.2
                density: 0.45 + (intensity * 0.25),  // Increased from 0.4 + intensity * 0.2
                scattering: 0.25 + (intensity * 0.25) // Increased from 0.2 + intensity * 0.2
            });
        }
        
        console.log(`Volumetric light intensity set to ${intensity.toFixed(2)}`);
    }
}
