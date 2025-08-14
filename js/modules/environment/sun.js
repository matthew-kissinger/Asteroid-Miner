// sun.js - Creates and manages the sun object (central star) with volumetric rendering

import * as THREE from 'three';
import { SunShaders } from './sun/sunShaders.js';
import { SunFlares } from './sun/sunFlares.js';
import { SunLighting } from './sun/sunLighting.js';

export class Sun {
    constructor(scene) {
        this.scene = scene;
        this.sun = null;
        this.time = 0;
        this.sunType = 'G'; // Default sun type (G-type like our Sun)
        this.createSun();
    }
    
    createSun() {
        // Create a group to hold all sun-related elements
        this.sun = new THREE.Group();
        this.sun.name = 'sun';
        this.scene.add(this.sun);
        
        // Create the core sun sphere with shader material
        const sunGeometry = new THREE.SphereGeometry(1000, 64, 64);
        this.sunMaterial = SunShaders.createSunMaterial();
        const sunCoreMesh = new THREE.Mesh(sunGeometry, this.sunMaterial);
        this.sun.add(sunCoreMesh);
        
        // Add corona layers
        const coronaGeometry = new THREE.SphereGeometry(2000, 64, 64);
        this.coronaMaterial = SunShaders.createCoronaMaterial();
        const coronaMesh = new THREE.Mesh(coronaGeometry, this.coronaMaterial);
        this.sun.add(coronaMesh);
        
        const outerCoronaGeometry = new THREE.SphereGeometry(3000, 32, 32);
        this.outerCoronaMaterial = SunShaders.createOuterCoronaMaterial();
        const outerCoronaMesh = new THREE.Mesh(outerCoronaGeometry, this.outerCoronaMaterial);
        this.sun.add(outerCoronaMesh);
        
        // Initialize subsystems
        this.lighting = new SunLighting(this.scene, this.sun);
        this.flares = new SunFlares(this.scene, this.sun);
    }
    
    // Update sun based on star type (O, B, A, F, G, K, M)
    updateSunType(type, lightIntensityMultiplier = 1.0) {
        this.sunType = type || 'G';
        let color, temperature, activity;
        
        // Set sun properties based on star classification
        switch(this.sunType) {
            case 'O': color = 0x9db4ff; temperature = 30000; activity = 0.8; break;
            case 'B': color = 0xaabfff; temperature = 20000; activity = 0.75; break;
            case 'A': color = 0xcad7ff; temperature = 10000; activity = 0.7; break;
            case 'F': color = 0xf8f7ff; temperature = 7000; activity = 0.65; break;
            case 'G': color = 0xfff4ea; temperature = 5500; activity = 0.6; break;
            case 'K': color = 0xffd2a1; temperature = 4000; activity = 0.5; break;
            case 'M': color = 0xffcc6f; temperature = 3000; activity = 0.4; break;
            default: color = 0xfff4ea; temperature = 5500; activity = 0.6;
        }
        
        // Update material colors and parameters
        if (this.sunMaterial) {
            this.sunMaterial.uniforms.sunColor.value.setHex(color);
            this.sunMaterial.uniforms.sunActivity.value = activity;
        }
        
        if (this.coronaMaterial) {
            const coronaColor = new THREE.Color(color);
            coronaColor.r = Math.min(1.0, coronaColor.r * 1.2);
            coronaColor.g = Math.min(1.0, coronaColor.g * 1.1);
            this.coronaMaterial.uniforms.coronaColor.value = coronaColor;
        }
        
        if (this.outerCoronaMaterial) {
            const outerCoronaColor = new THREE.Color(color);
            outerCoronaColor.r = Math.min(1.0, outerCoronaColor.r * 1.3);
            outerCoronaColor.g = Math.min(1.0, outerCoronaColor.g * 1.2);
            outerCoronaColor.b = Math.min(1.0, outerCoronaColor.b * 1.1);
            this.outerCoronaMaterial.uniforms.coronaColor.value = outerCoronaColor;
        }
        
        // Update lighting and flares
        this.lighting.updateForStarType(this.sunType, color, temperature, lightIntensityMultiplier);
        this.flares.updateFlareColors(color);
        
        console.log(`Updated sun to type ${this.sunType}, color: ${color.toString(16)}, intensity multiplier: ${lightIntensityMultiplier}`);
    }
    
    getRadius() {
        return 3000;
    }
    
    getPosition() {
        return new THREE.Vector3(0, 0, 0);
    }
    
    update(deltaTime = 0.016) {
        if (!this.sun) return;
        
        // Update time for all shaders
        this.time += deltaTime * 0.4;
        
        if (this.sunMaterial && this.sunMaterial.uniforms.time) {
            this.sunMaterial.uniforms.time.value = this.time;
        }
        
        if (this.coronaMaterial && this.coronaMaterial.uniforms.time) {
            this.coronaMaterial.uniforms.time.value = this.time;
        }
        
        if (this.outerCoronaMaterial && this.outerCoronaMaterial.uniforms.time) {
            this.outerCoronaMaterial.uniforms.time.value = this.time;
        }
        
        // Update camera-relative uniforms
        if (this.scene && this.scene.camera) {
            const viewVector = new THREE.Vector3().subVectors(
                this.scene.camera.position,
                this.sun.position
            ).normalize();
            
            if (this.coronaMaterial && this.coronaMaterial.uniforms.viewVector) {
                this.coronaMaterial.uniforms.viewVector.value = viewVector;
            }
            
            if (this.outerCoronaMaterial && this.outerCoronaMaterial.uniforms.viewVector) {
                this.outerCoronaMaterial.uniforms.viewVector.value = viewVector;
            }
        }
        
        // Update subsystems
        this.lighting.update(deltaTime, this.scene.camera, this.sunType);
        this.flares.update(this.time, this.scene.camera);
    }
    
    // Toggle shadow camera helper for debugging
    toggleShadowHelper(enabled) {
        this.lighting.toggleShadowHelper(enabled);
    }
}