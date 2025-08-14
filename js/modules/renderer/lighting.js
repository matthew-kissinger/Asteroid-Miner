// lighting.js - Handles all lighting setup and management for the renderer

import * as THREE from 'three';

export class LightingManager {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        
        // Light components
        this.sunLight = null;
        this.ambientLight = null;
        this.rimLight = null;
        this.fillLight = null;
        
        // Configuration for space scene with proper lighting
        this.config = {
            // Sun light - primary illumination
            sun: {
                color: 0xFFFFFF,  // Pure white sun
                intensity: 3.0,    // Moderate intensity with new lighting model
                position: new THREE.Vector3(1, 0.5, 0.5).normalize() // Direction vector
            },
            // Ambient - increased for better visibility
            ambient: {
                skyColor: 0x303045,    // Slightly brighter blue space
                groundColor: 0x151520,  // Dark blue
                intensity: 0.6         // More visible ambient
            },
            // Rim light - edge definition from opposite side
            rim: {
                color: 0x4466AA,       // Blue rim light
                intensity: 0.5,        // Subtle rim
                position: new THREE.Vector3(-1, -0.3, -0.5).normalize()
            },
            // Fill light - subtle shadow fill
            fill: {
                color: 0x334466,       // Dark blue fill
                intensity: 0.3,        // Very subtle
                position: new THREE.Vector3(0.5, -0.5, 1).normalize()
            },
            // Shadows
            shadows: {
                mapSize: 4096,
                radius: 2,
                blurSamples: 25,
                bias: -0.0001,
                normalBias: 0.02,
                frustumSize: 10000,  // Large enough for nearby objects
                near: 0.5,
                far: 50000
            },
            // Tone mapping
            toneMapping: {
                exposure: 1.0,
                type: THREE.ACESFilmicToneMapping
            }
        };
    }

    setupLighting() {
        // Configure renderer for physically correct lighting
        this.renderer.useLegacyLights = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        this.renderer.toneMapping = this.config.toneMapping.type;
        this.renderer.toneMappingExposure = this.config.toneMapping.exposure;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Create main sun directional light
        this.sunLight = new THREE.DirectionalLight(
            this.config.sun.color,
            this.config.sun.intensity * Math.PI  // Multiply by PI for physically correct
        );
        
        // Set light direction - DirectionalLight shines FROM position TO target
        // For sun at origin, light should come FROM origin outward
        this.sunLight.position.set(0, 0, 0);  // At sun position
        this.sunLight.target.position.set(10000, 5000, 5000);  // Pointing outward
        
        // Configure shadows
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = this.config.shadows.mapSize;
        this.sunLight.shadow.mapSize.height = this.config.shadows.mapSize;
        
        // Shadow camera setup - this is crucial for large scenes
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
        
        // Add hemisphere ambient light for basic visibility
        this.ambientLight = new THREE.HemisphereLight(
            this.config.ambient.skyColor,
            this.config.ambient.groundColor,
            this.config.ambient.intensity * Math.PI
        );
        this.scene.add(this.ambientLight);
        
        // Add rim light from opposite direction
        this.rimLight = new THREE.DirectionalLight(
            this.config.rim.color,
            this.config.rim.intensity * Math.PI
        );
        this.rimLight.position.set(-10000, -3000, -5000);
        this.scene.add(this.rimLight);
        
        // Add fill light
        this.fillLight = new THREE.DirectionalLight(
            this.config.fill.color,
            this.config.fill.intensity * Math.PI
        );
        this.fillLight.position.set(5000, -5000, 10000);
        this.scene.add(this.fillLight);
        
        console.log("Lighting setup complete with physically correct lights");
    }
    
    /**
     * Update sun light direction based on sun position
     * For DirectionalLight, we need to set the direction, not just position
     */
    updateSunPosition(sunWorldPosition) {
        if (!this.sunLight) return;
        
        // DirectionalLight simulates parallel rays from infinite distance
        // Position sets WHERE the light comes from
        // Target sets WHERE the light points to
        
        // Since sun is at origin (0,0,0), we want light to come FROM the sun
        // and illuminate everything around it
        
        // Elegant solution: Make directional light simulate sun rays
        // Position it BEHIND the sun (opposite from camera) pointing through the sun
        
        if (this.camera) {
            // Get vector from camera to sun
            const sunToCamera = new THREE.Vector3().subVectors(this.camera.position, sunWorldPosition);
            
            // Position light behind sun (opposite side from camera)
            // This makes light come through the sun toward the camera
            const lightPosition = sunWorldPosition.clone().sub(sunToCamera.normalize().multiplyScalar(50000));
            this.sunLight.position.copy(lightPosition);
            
            // Point light toward camera through the sun
            // This illuminates everything between sun and camera correctly
            this.sunLight.target.position.copy(this.camera.position);
        } else {
            // Fallback: standard position
            this.sunLight.position.set(-10000, 5000, -5000);
            this.sunLight.target.position.set(0, 0, 0);
        }
        this.sunLight.target.updateMatrixWorld();
    }
    
    /**
     * Adjust lighting intensity
     */
    adjustLightingIntensity(factor = 1.0) {
        const clampedFactor = THREE.MathUtils.clamp(factor, 0.5, 2.0);
        
        if (this.sunLight) {
            this.sunLight.intensity = this.config.sun.intensity * Math.PI * clampedFactor;
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
            this.ambientLight.intensity = this.config.ambient.intensity * Math.PI;
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
        [this.sunLight, this.ambientLight, this.rimLight, this.fillLight].forEach(light => {
            if (light) {
                if (light.target) {
                    this.scene.remove(light.target);
                }
                this.scene.remove(light);
            }
        });
    }
}