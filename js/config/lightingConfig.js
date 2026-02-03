// lightingConfig.js - Centralized lighting configuration for fine-tuning
// This file contains all the key lighting parameters that define the visual aesthetic

export const LIGHTING_CONFIG = {
    // Main sun light configuration
    sun: {
        color: 0xFFFFFF,           // Pure white sun
        intensity: 3.0,            // Moderate intensity for space scenes
        position: {
            x: 50000,
            y: 10000,
            z: 20000
        }
    },
    
    // Ambient lighting - enough to see objects in space
    ambient: {
        skyColor: 0x202030,        // Deep blue space
        groundColor: 0x0a0a10,      // Nearly black
        intensity: 0.3             // Very subtle ambient from starlight
    },
    
    // Shadow configuration
    shadows: {
        enabled: true,
        mapSize: 4096,              // High quality
        type: 'PCFSoft',            // Soft shadows
        radius: 2,                  // Softness amount
        blurSamples: 25,            // Quality of blur
        bias: -0.0001,              // Prevents shadow acne
        normalBias: 0.02,           // Additional bias based on normals
        frustumSize: 10000,         // Shadow camera size
        near: 0.5,
        far: 50000
    },
    
    // Post-processing bloom for stars
    bloom: {
        enabled: true,
        strength: 0.8,              // Bloom intensity
        radius: 0.4,                // Bloom spread
        threshold: 0.9              // What brightness triggers bloom
    },
    
    // Tone mapping for HDR
    toneMapping: {
        type: 'ACESFilmic',         // Cinematic tone mapping
        exposure: 1.0               // Overall brightness
    },
    
    // Volumetric effects
    volumetric: {
        godRays: {
            enabled: true,
            density: 0.96,
            weight: 0.4,
            decay: 0.95,
            exposure: 0.35,
            samples: 100
        }
    },
    
    // Material presets for consistency
    materials: {
        // Asteroid materials using standard materials
        asteroids: {
            iron: {
                metalness: 0.7,
                roughness: 0.6,
                emissiveIntensity: 0.1
            },
            gold: {
                metalness: 0.9,
                roughness: 0.2,
                emissiveIntensity: 0.15
            },
            platinum: {
                metalness: 0.85,
                roughness: 0.15,
                emissiveIntensity: 0.1
            }
        },
        // Planet materials enhanced
        planets: {
            rocky: {
                metalness: 0.05,
                roughness: 0.85,
                clearcoat: 0.05
            },
            gasGiant: {
                metalness: 0.0,
                roughness: 0.3,
                clearcoat: 0.2,
                sheen: 0.2
            },
            terrestrial: {
                metalness: 0.02,
                roughness: 0.4,
                clearcoat: 0.3,
                sheen: 0.1
            }
        }
    },
    
    // Performance settings
    performance: {
        shadowAutoUpdate: true,
        shadowMapAutoUpdate: true,
        logarithmicDepthBuffer: true // Better for large scenes
    },
    
    // Fine-tuning parameters
    fineTuning: {
        // Adjust these for different moods
        sunFlicker: {
            enabled: true,
            minIntensity: 0.95,
            maxIntensity: 1.05,
            speed: 0.015
        },
        // Distance-based adjustments
        distanceAttenuation: {
            enabled: true,
            maxDistance: 50000,
            minExposure: 0.6,
            maxExposure: 1.0
        }
    }
};

/**
 * Helper function to apply config to lighting and post-processing managers
 * @param {Object} lightingManager - The LightingManager instance or a combined renderer instance
 * @param {Object} config - The lighting configuration to apply
 * @param {Object} postProcessingManager - Optional PostProcessingManager instance
 */
export function applyLightingConfig(lightingManager, config = LIGHTING_CONFIG, postProcessingManager = null) {
    if (!lightingManager) return;
    
    // Support passing the main Renderer instance
    const lm = lightingManager.lightingManager || lightingManager;
    const ppm = postProcessingManager || lightingManager.postProcessingManager;
    
    // Update sun light
    if (lm.sunLight) {
        lm.sunLight.color.setHex(config.sun.color);
        lm.sunLight.intensity = config.sun.intensity;
        
        // Update sun position if specified
        if (config.sun.position) {
            lm.sunLight.position.set(
                config.sun.position.x,
                config.sun.position.y,
                config.sun.position.z
            );
        }
    }
    
    // Update ambient
    if (lm.ambientLight) {
        lm.ambientLight.color.setHex(config.ambient.skyColor);
        lm.ambientLight.groundColor.setHex(config.ambient.groundColor);
        lm.ambientLight.intensity = config.ambient.intensity;
    }
    
    // Update shadows
    if (lm.sunLight && lm.sunLight.shadow) {
        lm.sunLight.shadow.mapSize.width = config.shadows.mapSize;
        lm.sunLight.shadow.mapSize.height = config.shadows.mapSize;
        lm.sunLight.shadow.radius = config.shadows.radius;
        
        // Update frustum
        const d = config.shadows.frustumSize;
        lm.sunLight.shadow.camera.left = -d;
        lm.sunLight.shadow.camera.right = d;
        lm.sunLight.shadow.camera.top = d;
        lm.sunLight.shadow.camera.bottom = -d;
        lm.sunLight.shadow.camera.near = config.shadows.near;
        lm.sunLight.shadow.camera.far = config.shadows.far;
        lm.sunLight.shadow.camera.updateProjectionMatrix();
        
        lm.sunLight.shadow.bias = config.shadows.bias;
        lm.sunLight.shadow.normalBias = config.shadows.normalBias;
    }
    
    // Update bloom
    if (ppm) {
        ppm.adjustBloom(config.bloom.strength, config.bloom.radius, config.bloom.threshold);
    }
    
    // Update exposure
    if (lm.renderer) {
        lm.renderer.toneMappingExposure = config.toneMapping.exposure;
    }
}

// Export for use in other modules
export default LIGHTING_CONFIG;