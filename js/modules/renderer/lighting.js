// lighting.js - Handles all lighting setup and management for the renderer

import * as THREE from 'three';
import { LIGHTING_CONFIG } from '../../config/lightingConfig.js';

export class LightingManager {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        
        // Light components
        this.sunLight = null;
        this.ambientLight = null;
        
        // Use centralized configuration
        this.config = LIGHTING_CONFIG;
    }

    setupLighting() {
        // Configure renderer for physically correct lighting
        this.renderer.shadowMap.enabled = this.config.shadows.enabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = this.config.performance.shadowMapAutoUpdate;
        
        // Map string type to THREE constant
        if (this.config.toneMapping.type === 'ACESFilmic') {
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        }
        
        this.renderer.toneMappingExposure = this.config.toneMapping.exposure;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Create main sun directional light
        this.sunLight = new THREE.DirectionalLight(
            this.config.sun.color,
            this.config.sun.intensity
        );

        // Position sun light to come from behind the sun toward scene
        this.sunLight.position.set(
            this.config.sun.position.x, 
            this.config.sun.position.y, 
            this.config.sun.position.z
        );
        this.sunLight.target.position.set(0, 0, 0);

        // Configure shadows
        this.sunLight.castShadow = this.config.shadows.enabled;
        this.sunLight.shadow.mapSize.width = this.config.shadows.mapSize;
        this.sunLight.shadow.mapSize.height = this.config.shadows.mapSize;

        // Shadow camera setup
        const d = this.config.shadows.frustumSize;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.camera.near = this.config.shadows.near;
        this.sunLight.shadow.camera.far = this.config.shadows.far;

        this.sunLight.shadow.bias = this.config.shadows.bias;
        this.sunLight.shadow.normalBias = this.config.shadows.normalBias;
        this.sunLight.shadow.radius = this.config.shadows.radius;
        this.sunLight.shadow.blurSamples = this.config.shadows.blurSamples;

        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);

        // Add subtle ambient light
        this.ambientLight = new THREE.HemisphereLight(
            this.config.ambient.skyColor,
            this.config.ambient.groundColor,
            this.config.ambient.intensity
        );
        this.scene.add(this.ambientLight);

        console.log("Lighting setup complete using centralized LIGHTING_CONFIG");
    }
    
    /**
     * Update sun light direction based on sun position
     * Keep the directional light stable in world space
     */
    updateSunPosition(sunWorldPosition) {
        if (!this.sunLight) return;

        // The sun's directional light should maintain a fixed direction
        // relative to the sun, simulating the sun's rays coming from a direction.
        // We keep it at a fixed position and pointed at the sun.

        // This creates proper shadows for objects around the sun
        // The position is maintained, only the target follows the sun
        this.sunLight.target.position.copy(sunWorldPosition);
        this.sunLight.target.updateMatrixWorld();
    }
    
    /**
     * Adjust lighting intensity
     */
    adjustLightingIntensity(factor = 1.0) {
        const clampedFactor = THREE.MathUtils.clamp(factor, 0.5, 2.0);
        
        if (this.sunLight) {
            this.sunLight.intensity = this.config.sun.intensity * clampedFactor;
        }
    }
    
    /**
     * Update exposure based on camera position
     */
    updateExposure(cameraPosition) {
        // Keep exposure relatively constant
        this.renderer.toneMappingExposure = this.config.toneMapping.exposure;
    }
    
    /**
     * Adjust for volumetric ray type (backward compatibility)
     */
    adjustLightingForRayType(useClaudeRays) {
        // Keep lighting consistent
        if (this.ambientLight) {
            this.ambientLight.intensity = this.config.ambient.intensity;
        }
    }
    
    /**
     * Set shadow quality
     */
    setShadowQuality(quality) {
        const sizes = {
            low: 2048,
            medium: 4096,
            high: 8192,
            ultra: 16384
        };
        
        const size = sizes[quality] || 4096;
        
        if (this.sunLight && this.sunLight.shadow) {
            this.sunLight.shadow.mapSize.width = size;
            this.sunLight.shadow.mapSize.height = size;
            
            if (this.sunLight.shadow.map) {
                this.sunLight.shadow.map.dispose();
                this.sunLight.shadow.map = null;
            }
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Handled by post-processing manager
    }
    
    dispose() {
        // Dispose shadows
        if (this.sunLight && this.sunLight.shadow && this.sunLight.shadow.map) {
            this.sunLight.shadow.map.dispose();
        }
        
        // Remove lights from scene
        [this.sunLight, this.ambientLight].forEach(light => {
            if (light) {
                if (light.target) {
                    this.scene.remove(light.target);
                }
                this.scene.remove(light);
            }
        });
    }
}
