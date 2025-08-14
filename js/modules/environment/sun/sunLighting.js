// sunLighting.js - Sun lighting system and visual effects

import * as THREE from 'three';

export class SunLighting {
    constructor(scene, sunGroup, lightingManager) {
        this.scene = scene;
        this.sunGroup = sunGroup;
        this.lightingManager = lightingManager; // Reference to main lighting manager
        
        // Light configuration for visual sun glow only
        this.config = {
            // Point light for actual sun illumination
            pointLight: {
                intensity: 3000,  // High intensity for space scene
                distance: 100000,  // Very long range
                decay: 2
            },
            // Flicker parameters for realism
            flicker: {
                intensity: 1.0,
                direction: 0.01,
                minIntensity: 0.95,
                maxIntensity: 1.05,
                speed: 0.015
            }
        };
        
        this.sunFlickerIntensity = this.config.flicker.intensity;
        this.sunFlickerDirection = this.config.flicker.direction;
        this.createLights();
    }

    createLights() {
        // Add point light for close-range glow effect only
        // This creates the visual glow around the sun mesh
        this.sunPointLight = new THREE.PointLight(
            0xFFFAF0,
            this.config.pointLight.intensity,
            this.config.pointLight.distance,
            this.config.pointLight.decay
        );
        this.sunGroup.add(this.sunPointLight);
        
        // We no longer create our own directional light
        // The main LightingManager handles all scene lighting
        // This prevents conflicting light sources
    }

    updateForStarType(starType, color, temperature, lightIntensityMultiplier = 1.0) {
        // Update point light color for glow
        if (this.sunPointLight) {
            this.sunPointLight.color.setHex(color);
            
            // Subtle intensity variation based on star type
            const baseIntensity = this.config.pointLight.intensity;
            const tempFactor = temperature / 30000; // Normalized temperature factor
            this.sunPointLight.intensity = baseIntensity * (0.8 + tempFactor * 0.4) * lightIntensityMultiplier;
            this.sunPointLight._intensityMultiplier = lightIntensityMultiplier;
        }
        
        // Update main scene lighting color through lighting manager
        if (this.lightingManager && this.lightingManager.sunLight) {
            // Blend the star color with warm white for realistic sun lighting
            const blendedColor = new THREE.Color(color);
            const warmWhite = new THREE.Color(0xFFF5F0);
            blendedColor.lerp(warmWhite, 0.5); // 50% blend for natural look
            
            this.lightingManager.sunLight.color.copy(blendedColor);
        }
    }

    update(deltaTime, camera, sunType) {
        // Update subtle flickering effect for realism
        this.sunFlickerIntensity += this.sunFlickerDirection * this.config.flicker.speed;
        
        if (this.sunFlickerIntensity > this.config.flicker.maxIntensity) {
            this.sunFlickerIntensity = this.config.flicker.maxIntensity;
            this.sunFlickerDirection = -Math.random() * this.config.flicker.speed;
        } else if (this.sunFlickerIntensity < this.config.flicker.minIntensity) {
            this.sunFlickerIntensity = this.config.flicker.minIntensity;
            this.sunFlickerDirection = Math.random() * this.config.flicker.speed;
        }
        
        // Apply flickering to point light (glow effect)
        if (this.sunPointLight) {
            const intensityMultiplier = this.sunPointLight._intensityMultiplier || 1.0;
            const baseIntensity = this.config.pointLight.intensity;
            
            // Subtle variation based on star type
            const typeBonus = sunType === 'G' ? 1.1 : 
                             (sunType === 'O' || sunType === 'B') ? 1.3 : 
                             (sunType === 'M') ? 0.9 : 1.0;
            
            this.sunPointLight.intensity = baseIntensity * this.sunFlickerIntensity * intensityMultiplier * typeBonus;
        }
        
        // Update main scene sun light position through lighting manager
        if (this.lightingManager) {
            this.lightingManager.updateSunPosition(this.sunGroup.position);
            
            // Apply subtle flicker to main sun light
            if (this.lightingManager.sunLight) {
                const baseIntensity = this.lightingManager.config.sun.intensity;
                this.lightingManager.sunLight.intensity = baseIntensity * this.sunFlickerIntensity;
            }
            
            // Update exposure based on camera distance
            if (camera) {
                this.lightingManager.updateExposure(camera.position);
            }
        }
    }

    toggleShadowHelper(enabled) {
        // Shadow helper is now managed by the main LightingManager
        // This method is kept for backward compatibility
        if (enabled && this.lightingManager && this.lightingManager.sunLight) {
            console.log("Shadow debugging should be enabled through the main LightingManager");
        }
    }
    
    dispose() {
        if (this.sunPointLight) {
            this.sunGroup.remove(this.sunPointLight);
            this.sunPointLight.dispose();
        }
    }
}