// sunLighting.js - Sun lighting system and shadow management

import * as THREE from 'three';

export class SunLighting {
    constructor(scene, sunGroup) {
        this.scene = scene;
        this.sunGroup = sunGroup;
        this.baseLightIntensity = 200000;
        this.sunFlickerIntensity = 1.0;
        this.sunFlickerDirection = 0.02;
        this.createLights();
    }

    createLights() {
        // Add sun light with increased intensity
        this.sunLight = new THREE.PointLight(0xFFFAF0, 200000, 100000, 2);
        this.sunGroup.add(this.sunLight);
        
        // Add directional light for casting shadows
        this.sunDirectionalLight = new THREE.DirectionalLight(0xFFFAF0, 1.5);
        this.sunDirectionalLight.position.set(0, 0, 0);
        this.sunDirectionalLight.castShadow = true;
        
        // Configure shadow mapping
        this.sunDirectionalLight.shadow.mapSize.width = 4096;
        this.sunDirectionalLight.shadow.mapSize.height = 4096;
        this.sunDirectionalLight.shadow.camera.near = 1000;
        this.sunDirectionalLight.shadow.camera.far = 100000;
        this.sunDirectionalLight.shadow.camera.left = -50000;
        this.sunDirectionalLight.shadow.camera.right = 50000;
        this.sunDirectionalLight.shadow.camera.top = 50000;
        this.sunDirectionalLight.shadow.camera.bottom = -50000;
        this.sunDirectionalLight.shadow.bias = -0.00005;
        this.sunDirectionalLight.shadow.normalBias = 0.02;
        this.sunDirectionalLight.shadow.radius = 2;

        if (this.scene && this.scene.renderer) {
            this.scene.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        this.sunGroup.add(this.sunDirectionalLight);
        
        // Shadow helper for debugging
        this.shadowHelper = null;
    }

    updateForStarType(starType, color, temperature, lightIntensityMultiplier = 1.0) {
        if (this.sunLight) {
            this.sunLight.color.setHex(color);
            this.sunLight.intensity = (200000 + (temperature / 10000) * 200000) * lightIntensityMultiplier;
            this.sunLight._intensityMultiplier = lightIntensityMultiplier;
        }
    }

    update(deltaTime, camera, sunType) {
        // Update flickering effect
        this.sunFlickerIntensity += this.sunFlickerDirection;
        if (this.sunFlickerIntensity > 1.2) {
            this.sunFlickerIntensity = 1.2;
            this.sunFlickerDirection = -Math.random() * 0.03;
        } else if (this.sunFlickerIntensity < 0.9) {
            this.sunFlickerIntensity = 0.9;
            this.sunFlickerDirection = Math.random() * 0.03;
        }
        
        // Apply flickering to light intensity
        if (this.sunLight) {
            const intensityMultiplier = this.sunLight._intensityMultiplier || 1.0;
            const baseIntensity = this.baseLightIntensity + (sunType === 'G' ? 30000 : 
                                         (sunType === 'O' || sunType === 'B') ? 100000 : 
                                         (sunType === 'M') ? 10000 : 50000);
            
            let viewDependentMultiplier = 1.0;
            if (camera) {
                const viewVector = new THREE.Vector3().subVectors(
                    camera.position,
                    this.sunGroup.position
                ).normalize();
                
                const cameraNormal = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                const angleToCam = viewVector.dot(cameraNormal);
                
                if (angleToCam > 0.8) {
                    viewDependentMultiplier = 0.5 + (1.0 - angleToCam) * 0.5;
                }
            }
            
            this.sunLight.intensity = baseIntensity * this.sunFlickerIntensity * intensityMultiplier * viewDependentMultiplier;
        }
        
        // Update directional light for shadow casting
        if (this.sunDirectionalLight && camera) {
            const cameraPos = camera.position.clone();
            const sunToCam = cameraPos.clone().sub(this.sunGroup.position).normalize();
            
            const distanceFactor = 15000;
            const lightPos = sunToCam.clone().multiplyScalar(-distanceFactor).add(this.sunGroup.position);
            
            this.sunDirectionalLight.position.copy(lightPos);
            this.sunDirectionalLight.target.position.copy(this.sunGroup.position);
            
            if (!this.sunDirectionalLight.target.parent) {
                this.scene.add(this.sunDirectionalLight.target);
            }
            
            const camDistanceToSun = cameraPos.distanceTo(this.sunGroup.position);
            const shadowSize = Math.max(50000, camDistanceToSun * 2);
            
            this.sunDirectionalLight.shadow.camera.left = -shadowSize;
            this.sunDirectionalLight.shadow.camera.right = shadowSize;
            this.sunDirectionalLight.shadow.camera.top = shadowSize;
            this.sunDirectionalLight.shadow.camera.bottom = -shadowSize;
            this.sunDirectionalLight.shadow.camera.updateProjectionMatrix();
            
            this.sunDirectionalLight.intensity = 1.5 * this.sunFlickerIntensity;
        }
    }

    toggleShadowHelper(enabled) {
        if (this.shadowHelper && this.shadowHelper.parent) {
            this.shadowHelper.parent.remove(this.shadowHelper);
            this.shadowHelper = null;
        }
        
        if (enabled && this.sunDirectionalLight && this.scene) {
            this.shadowHelper = new THREE.CameraHelper(this.sunDirectionalLight.shadow.camera);
            this.scene.add(this.shadowHelper);
            console.log("Shadow camera helper enabled - showing sun shadow frustum");
        }
    }
}