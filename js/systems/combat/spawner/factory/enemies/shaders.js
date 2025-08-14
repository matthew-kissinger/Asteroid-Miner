/**
 * Enemy Shaders - Custom shader effects for different enemy types
 * Creates visually distinct, glowing enemies that stand out against space
 */

import * as THREE from 'three';

export class EnemyShaders {
    /**
     * Create pulsing core shader for Standard drones
     * @param {Object} color - Color configuration
     * @param {number} intensity - Emissive intensity
     * @returns {THREE.ShaderMaterial} Shader material
     */
    static createPulsingCoreShader(color, intensity) {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform vec3 baseColor;
            uniform vec3 emissiveColor;
            uniform float emissiveIntensity;
            uniform float time;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                // Calculate view direction for fresnel effect
                vec3 viewDirection = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
                
                // Pulsing core effect
                float pulse = sin(time * 3.0) * 0.3 + 0.7;
                float corePulse = sin(time * 5.0) * 0.2 + 0.8;
                
                // Distance from center for core glow
                float distFromCenter = length(vPosition) / 10.0;
                float coreGlow = 1.0 - smoothstep(0.0, 1.0, distFromCenter);
                
                // Combine effects
                vec3 color = baseColor;
                vec3 emission = emissiveColor * emissiveIntensity * pulse;
                emission += emissiveColor * coreGlow * corePulse * 2.0;
                
                // Add fresnel glow for rim lighting
                emission += emissiveColor * fresnel * emissiveIntensity * 0.5;
                
                // Final color with additive blending
                gl_FragColor = vec4(color + emission, 1.0);
            }
        `;
        
        return new THREE.ShaderMaterial({
            uniforms: {
                baseColor: { value: new THREE.Color(color.main) },
                emissiveColor: { value: new THREE.Color(color.emissive.r, color.emissive.g, color.emissive.b) },
                emissiveIntensity: { value: intensity },
                time: { value: 0 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
    }
    
    /**
     * Create hexagonal shield shader for Heavy drones
     * @param {Object} color - Color configuration
     * @param {number} intensity - Emissive intensity
     * @returns {THREE.ShaderMaterial} Shader material
     */
    static createHexagonShieldShader(color, intensity) {
        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform vec3 baseColor;
            uniform vec3 emissiveColor;
            uniform float emissiveIntensity;
            uniform float time;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            // Hexagon pattern function
            float hexagon(vec2 p, float radius) {
                const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
                p = abs(p);
                p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
                p -= vec2(clamp(p.x, -k.z * radius, k.z * radius), radius);
                return length(p) * sign(p.y);
            }
            
            void main() {
                // Create hexagonal grid
                vec2 hexCoord = vUv * 10.0;
                float hexPattern = 1.0 - smoothstep(0.0, 0.1, abs(hexagon(fract(hexCoord) - 0.5, 0.4)));
                
                // Ripple effect
                float ripple = sin(length(vPosition) * 2.0 - time * 3.0) * 0.5 + 0.5;
                
                // Shield shimmer
                float shimmer = sin(time * 4.0 + vPosition.x * 5.0) * 0.3 + 0.7;
                
                // View-dependent fresnel
                vec3 viewDirection = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - dot(viewDirection, vNormal), 1.5);
                
                // Combine effects
                vec3 color = baseColor;
                vec3 emission = emissiveColor * emissiveIntensity;
                emission *= (hexPattern * 0.5 + 0.5) * shimmer;
                emission += emissiveColor * ripple * emissiveIntensity * 0.3;
                emission += emissiveColor * fresnel * emissiveIntensity * 0.7;
                
                gl_FragColor = vec4(color + emission, 1.0);
            }
        `;
        
        return new THREE.ShaderMaterial({
            uniforms: {
                baseColor: { value: new THREE.Color(color.main) },
                emissiveColor: { value: new THREE.Color(color.emissive.r, color.emissive.g, color.emissive.b) },
                emissiveIntensity: { value: intensity },
                time: { value: 0 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
    }
    
    /**
     * Create speed blur shader for Swift drones
     * @param {Object} color - Color configuration
     * @param {number} intensity - Emissive intensity
     * @returns {THREE.ShaderMaterial} Shader material
     */
    static createSpeedBlurShader(color, intensity) {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform vec3 baseColor;
            uniform vec3 emissiveColor;
            uniform float emissiveIntensity;
            uniform float time;
            uniform vec3 velocity;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                // Speed trail effect based on UV coordinates
                float speedTrail = smoothstep(0.0, 1.0, vUv.x);
                speedTrail *= sin(time * 10.0 + vUv.y * 20.0) * 0.3 + 0.7;
                
                // Electric energy effect
                float energy = sin(time * 15.0 + vPosition.x * 10.0) * 
                              sin(time * 12.0 + vPosition.y * 10.0) * 
                              sin(time * 18.0 + vPosition.z * 10.0);
                energy = energy * 0.3 + 0.7;
                
                // Afterimage effect
                float afterimage = sin(time * 20.0) * 0.5 + 0.5;
                
                // View-dependent fresnel for energy field
                vec3 viewDirection = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - dot(viewDirection, vNormal), 1.2);
                
                // Combine effects
                vec3 color = baseColor * (0.5 + energy * 0.5);
                vec3 emission = emissiveColor * emissiveIntensity * energy;
                emission += emissiveColor * speedTrail * emissiveIntensity * 0.5;
                emission += emissiveColor * afterimage * 0.3;
                emission += emissiveColor * fresnel * emissiveIntensity;
                
                gl_FragColor = vec4(color + emission, 0.9 + fresnel * 0.1);
            }
        `;
        
        return new THREE.ShaderMaterial({
            uniforms: {
                baseColor: { value: new THREE.Color(color.main) },
                emissiveColor: { value: new THREE.Color(color.emissive.r, color.emissive.g, color.emissive.b) },
                emissiveIntensity: { value: intensity },
                time: { value: 0 },
                velocity: { value: new THREE.Vector3(0, 0, 0) }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }
    
    /**
     * Create a basic bright material as fallback
     * @param {Object} color - Color configuration
     * @param {number} intensity - Emissive intensity
     * @returns {THREE.MeshPhongMaterial} Basic material
     */
    static createBrightMaterial(color, intensity) {
        return new THREE.MeshPhongMaterial({
            color: color.main,
            emissive: new THREE.Color(color.emissive.r, color.emissive.g, color.emissive.b),
            emissiveIntensity: intensity,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
    }
    
    /**
     * Update shader uniforms for animation
     * @param {THREE.ShaderMaterial} material - Shader material to update
     * @param {number} deltaTime - Time delta for animation
     * @param {THREE.Vector3} velocity - Optional velocity for speed shader
     */
    static updateShaderUniforms(material, deltaTime, velocity = null) {
        if (material.uniforms && material.uniforms.time) {
            material.uniforms.time.value += deltaTime;
        }
        
        if (material.uniforms && material.uniforms.velocity && velocity) {
            material.uniforms.velocity.value.copy(velocity);
        }
    }
    
    /**
     * Create shader based on type string
     * @param {string} shaderType - Type of shader to create
     * @param {Object} color - Color configuration
     * @param {number} intensity - Emissive intensity
     * @returns {THREE.Material} Created material
     */
    static createShaderByType(shaderType, color, intensity) {
        switch (shaderType) {
            case 'pulsingCore':
                return this.createPulsingCoreShader(color, intensity);
            case 'hexagonShield':
                return this.createHexagonShieldShader(color, intensity);
            case 'speedBlur':
                return this.createSpeedBlurShader(color, intensity);
            default:
                console.warn(`Unknown shader type: ${shaderType}, using bright material fallback`);
                return this.createBrightMaterial(color, intensity);
        }
    }
}