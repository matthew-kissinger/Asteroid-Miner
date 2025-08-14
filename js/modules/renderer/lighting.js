// lighting.js - Handles all lighting setup and management for the renderer

import * as THREE from 'three';

export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.ambientLight = null;
        this.directionalLight = null;
        this.fillLight = null;
        this.hemisphereLight = null;
        this.ambientPointLight = null;
    }

    setupLighting() {
        // Ambient light - reduced for better shadow visibility
        this.ambientLight = new THREE.AmbientLight(0x404050, 1.0); // Reduced from 2.5
        this.scene.add(this.ambientLight);

        // Directional light - kept the same
        this.directionalLight = new THREE.DirectionalLight(0xffffe0, 2.0);
        this.directionalLight.position.set(1, 0.5, 1).normalize();
        this.directionalLight.castShadow = true;
        // Configure shadow properties
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.bias = -0.0005;
        this.scene.add(this.directionalLight);
        
        // Fill light - reduced for better shadow definition
        this.fillLight = new THREE.DirectionalLight(0xaaccff, 0.3); // Reduced from 0.8
        this.fillLight.position.set(-1, -0.3, -1).normalize();
        this.scene.add(this.fillLight);
        
        // Hemisphere light - reduced for better contrast
        this.hemisphereLight = new THREE.HemisphereLight(0x606090, 0x101020, 0.4); // Reduced from 0.8
        this.scene.add(this.hemisphereLight);
        
        // Ambient point light - reduced brightness
        this.ambientPointLight = new THREE.PointLight(0xffffff, 1.2, 1200, 2); // Reduced from 2.5
        this.ambientPointLight.position.set(0, 500, 0); // Positioned high up
        this.scene.add(this.ambientPointLight);
    }

    /**
     * Adjust scene lighting based on current ray type
     * Standard god rays need more ambient light to prevent planets from being too dark
     */
    adjustLightingForRayType(useClaudeRays) {
        if (!this.ambientLight) return;
        
        if (useClaudeRays) {
            // For Claude Rays - use original darker ambient lighting
            this.ambientLight.intensity = 1.0;
        } else {
            // For standard god rays - increase ambient lighting to better illuminate planets
            this.ambientLight.intensity = 1.8; // Increased from 1.0
        }
    }

    dispose() {
        // The lights will be disposed when the scene is disposed
        // This method exists for completeness
    }
}