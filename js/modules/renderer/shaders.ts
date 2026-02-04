// shaders.ts - Custom shaders for volumetric lighting effects

import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

interface GodRayShaderUniforms {
    tDiffuse: { value: THREE.Texture | null };
    lightPosition: { value: THREE.Vector2 };
    intensity: { value: number };
    decay: { value: number };
    density: { value: number };
    weight: { value: number };
    samples: { value: number };
    sunColor: { value: THREE.Color };
    sunDistance: { value: number };
    sunVisibility: { value: number };
    scattering: { value: number };
    attenuationMultiplier: { value: number };
}

interface ClaudeRayShaderUniforms {
    tDiffuse: { value: THREE.Texture | null };
    lightPosition: { value: THREE.Vector2 };
    exposure: { value: number };
    decay: { value: number };
    density: { value: number };
    weight: { value: number };
    lightColor: { value: THREE.Color };
}

/**
 * Create a volumetric light shader for realistic god ray effects
 * @returns Shader pass for new volumetric lighting
 */
export function createVolumetricLightShader(): ShaderPass {
    // New improved volumetric light ray shader
    const godRayShader: {
        uniforms: GodRayShaderUniforms;
        vertexShader: string;
        fragmentShader: string;
    } = {
        uniforms: {
            tDiffuse: { value: null },
            lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
            intensity: { value: 0.45 },         // Increased from 0.3
            decay: { value: 0.94 },             // Adjusted from 0.95 for better distance
            density: { value: 0.6 },            // Increased from 0.5
            weight: { value: 0.5 },             // Increased from 0.4
            samples: { value: 100 },            // Sample count - higher = better quality but slower
            sunColor: { value: new THREE.Color(0xFFFAF0) },   // Sun color
            sunDistance: { value: 0.5 },        // Distance to sun (0-1 normalized)
            sunVisibility: { value: 1.0 },      // Whether sun is in front of camera (0-1)
            scattering: { value: 0.4 },         // Increased from 0.3
            attenuationMultiplier: { value: 3.5 } // Reduced from 5.0 to allow rays to travel further
        },
        
        vertexShader: `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        
        fragmentShader: `
            precision highp float;
            
            varying vec2 vUv;
            uniform sampler2D tDiffuse;
            uniform vec2 lightPosition;
            uniform float intensity;
            uniform float decay;
            uniform float density;
            uniform float weight;
            uniform int samples;
            uniform vec3 sunColor;
            uniform float sunDistance;
            uniform float sunVisibility;
            uniform float scattering;
            uniform float attenuationMultiplier;
            
            const int MAX_SAMPLES = 150;
            
            float illuminationDecay(float rayProgress, float dist) {
                // rayProgress: 0.0 to a1.0 (how far along the ray)
                // dist: normalized distance to sun (0 = close, 1 = far)
                
                // Base decay from exponential falloff
                float baseFalloff = pow(decay, rayProgress * 100.0);
                
                // More decay the further the sun is 
                float distanceAttenuation = 1.0 - (dist * dist * attenuationMultiplier);
                distanceAttenuation = max(0.0, distanceAttenuation);
                
                // Apply visibility factor
                float visibilityFactor = sunVisibility;
                
                return baseFalloff * distanceAttenuation * visibilityFactor;
            }
            
            void main() {
                // Get the texture color (original scene)
                vec4 sceneColor = texture2D(tDiffuse, vUv);
                
                // Calculate ray direction from pixel to light source
                vec2 rayVector = (vUv - lightPosition);
                float rayLength = length(rayVector);
                vec2 rayDirection = normalize(rayVector);
                
                // Skip calculation if ray is too long (reduces artifacts far from sun)
                if (rayLength > 1.0) {
                    gl_FragColor = sceneColor;
                    return;
                }
                
                // Angle factor (rays stronger when looking near sun)
                float angleFactor = 1.0 - rayLength;
                angleFactor = pow(angleFactor, 0.8); // Adjust the power for ray spread
                
                // Calculate ray sampling parameters
                vec2 sampleStep = -rayDirection * min(density, 1.0) / float(samples);
                
                // Use a tighter sampling box around the light source
                // This creates more defined rays and reduces artifacts
                float rayProgress = max(0.0, (1.0 - rayLength * 2.0)); // Start closer to light source
                vec2 samplePosition = vUv - sampleStep * rayProgress * 10.0; // Start closer to current position
                
                // Clamp sample count for performance
                int sampleCount = min(samples, MAX_SAMPLES);
                
                // Start with current scene color
                vec4 finalColor = sceneColor;
                
                // Calculate scattering factor based on distance and angle
                float scatterFactor = scattering * angleFactor * (1.0 - sunDistance * 0.5);
                
                // Sample the light path
                // Use a fixed loop to avoid gradient instruction warnings
                for (int i = 0; i < MAX_SAMPLES; i++) {
                    // Early exit condition without break (to avoid varying iteration)
                    float shouldSample = step(float(i), float(sampleCount) - 0.5);
                    
                    // Move along the ray
                    samplePosition += sampleStep;
                    
                    // Sample at the current position
                    // Note: texture2D in a loop with uniform iteration is fine
                    vec4 sampledColor = texture2D(tDiffuse, samplePosition);
                    
                    // Calculate illumination decay factor
                    float decayFactor = illuminationDecay(float(i) / float(sampleCount), sunDistance);
                    
                    // Create the ray sample with attenuation
                    vec4 raySample = sampledColor * decayFactor * weight * shouldSample;
                    
                    // Apply sun color to the ray (tinted by scene color)
                    raySample.rgb *= mix(sunColor, sampledColor.rgb, 0.3);
                    
                    // Apply scattering effect - brightens areas around sun
                    float scatterAmount = step(float(i), float(sampleCount) / 3.0 - 0.5);
                    raySample.rgb += sunColor * scatterFactor * decayFactor * 0.2 * 
                                     (1.0 - float(i) / max(float(sampleCount) / 3.0, 1.0)) * scatterAmount * shouldSample;
                    
                    // Add to accumulated color
                    finalColor += raySample;
                }
                
                // Apply master intensity factor
                finalColor *= mix(1.0, intensity, sunVisibility);
                
                // Preserve original scene color with a blend factor
                finalColor = mix(sceneColor, finalColor, min(0.95, intensity * sunVisibility));
                
                gl_FragColor = finalColor;
            }
        `
    };
    
    // Create and return a shader pass
    const shaderPass = new ShaderPass(godRayShader);
    shaderPass.renderToScreen = false;
    
    return shaderPass;
}

/**
 * Create the original "Claude Ray" shader (the original implementation renamed)
 * @returns Shader pass for the original effect
 */
export function createClaudeRayShader(): ShaderPass {
    // Original volumetric light ray shader (renamed to Claude Rays)
    const claudeRayShader: {
        uniforms: ClaudeRayShaderUniforms;
        vertexShader: string;
        fragmentShader: string;
    } = {
        uniforms: {
            tDiffuse: { value: null },
            lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
            exposure: { value: 0.4 },    // Reduced from 0.6
            decay: { value: 0.93 },
            density: { value: 0.8 },     // Reduced from 0.96
            weight: { value: 0.25 },     // Reduced from 0.4
            lightColor: { value: new THREE.Color(0xFFFAF0) }  // Matches sun directional light
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            precision highp float;
            
            varying vec2 vUv;
            uniform sampler2D tDiffuse;
            uniform vec2 lightPosition;
            uniform float exposure;
            uniform float decay;
            uniform float density;
            uniform float weight;
            uniform vec3 lightColor;
            
            const int NUM_SAMPLES = 24; // Reduced from 30 for better balance of quality and performance
            
            void main() {
                // Get the texture color
                vec4 color = texture2D(tDiffuse, vUv);
                
                // Ray direction
                vec2 texCoord = vUv;
                vec2 deltaTextCoord = (texCoord - lightPosition) * density / float(NUM_SAMPLES);
                
                // Start illumination decay at 1.0
                float illuminationDecay = 1.0;
                
                // Sample the light path with a fixed number of steps
                for(int i = 0; i < NUM_SAMPLES; i++) {
                    // Move along the ray
                    texCoord -= deltaTextCoord;
                    
                    // Sample at the current position
                    vec4 sampleColor = texture2D(tDiffuse, texCoord);
                    
                    // Apply decay and weight
                    sampleColor *= illuminationDecay * weight;
                    
                    // Apply light color
                    sampleColor.rgb *= lightColor;
                    
                    // Add to the final color
                    color += sampleColor;
                    
                    // Reduce illumination for the next sample
                    illuminationDecay *= decay;
                }
                
                // Apply exposure
                color *= exposure;
                
                // Output the final color
                gl_FragColor = color;
            }
        `
    };
    
    // Create and return a shader pass
    const shaderPass = new ShaderPass(claudeRayShader);
    shaderPass.renderToScreen = false;
    
    return shaderPass;
}
