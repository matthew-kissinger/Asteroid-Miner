// lightingConfig.js - Centralized lighting configuration for fine-tuning
// This file contains all the key lighting parameters that define the visual aesthetic

export const LIGHTING_CONFIG = {
    // Main sun light configuration
    sun: {
        color: 0xFFFFF5,           // Bright white with slight warmth
        intensity: 12.0 * Math.PI,  // Physically correct intensity for non-legacy lights
        position: {
            x: 10000,
            y: 4000,
            z: 2000
        }
    },
    
    // Ambient lighting - enough to see objects in space
    ambient: {
        skyColor: 0x404060,        // Dark blue for top hemisphere
        groundColor: 0x101020,      // Very dark blue for bottom hemisphere  
        intensity: 0.5 * Math.PI    // Visible ambient light
    },
    
    // Rim light for edge definition
    rim: {
        color: 0x6A8FBD,           // Light blue for contrast
        intensity: 0.8 * Math.PI,   // More visible
        position: {
            x: -5000,
            y: 2000,
            z: -3000
        }
    },
    
    // Fill light for shadow softening
    fill: {
        color: 0x4A6F8F,           // Medium blue
        intensity: 0.5 * Math.PI,   // More visible
        position: {
            x: -3000,
            y: -1000,
            z: 4000
        }
    },
    
    // Shadow configuration
    shadows: {
        enabled: true,
        mapSize: 4096,              // High quality (was 2048)
        type: 'PCFSoft',            // Soft shadows
        radius: 1.5,                // Softness amount
        blurSamples: 25,            // Quality of blur
        bias: -0.00008,             // Prevents shadow acne
        normalBias: 0.015,          // Additional bias based on normals
        frustumSize: 3000,          // Shadow camera size
        near: 0.1,
        far: 15000
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
        useLegacyLights: false,     // Use modern lighting
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

// Helper function to apply config to lighting manager
export function applyLightingConfig(lightingManager, config = LIGHTING_CONFIG) {
    if (!lightingManager) return;
    
    // Update sun light
    if (lightingManager.sunLight) {
        lightingManager.sunLight.color.setHex(config.sun.color);
        lightingManager.sunLight.intensity = config.sun.intensity;
    }
    
    // Update ambient
    if (lightingManager.ambientLight) {
        lightingManager.ambientLight.color.setHex(config.ambient.skyColor);
        lightingManager.ambientLight.groundColor.setHex(config.ambient.groundColor);
        lightingManager.ambientLight.intensity = config.ambient.intensity;
    }
    
    // Update shadows
    if (lightingManager.sunLight && lightingManager.sunLight.shadow) {
        lightingManager.sunLight.shadow.mapSize.width = config.shadows.mapSize;
        lightingManager.sunLight.shadow.mapSize.height = config.shadows.mapSize;
        lightingManager.sunLight.shadow.radius = config.shadows.radius;
        lightingManager.sunLight.shadow.blurSamples = config.shadows.blurSamples;
    }
    
    // Update bloom
    if (lightingManager.bloomPass) {
        lightingManager.bloomPass.strength = config.bloom.strength;
        lightingManager.bloomPass.radius = config.bloom.radius;
        lightingManager.bloomPass.threshold = config.bloom.threshold;
    }
    
    // Update exposure
    if (lightingManager.renderer) {
        lightingManager.renderer.toneMappingExposure = config.toneMapping.exposure;
    }
}

// Export for use in other modules
export default LIGHTING_CONFIG;