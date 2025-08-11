// renderer.js - Handles the Three.js scene, camera, renderer setup and post-processing

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import { FilmShader } from 'three/addons/shaders/FilmShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

export class Renderer {
    constructor() {
        console.log("Initializing enhanced renderer...");
        
        // Check for WebGL 2 support
        if (!WebGL.isWebGL2Available()) {
            const warning = WebGL.getWebGL2ErrorMessage();
            document.body.appendChild(warning);
            console.error("WebGL 2 is required but not available.");
            throw new Error("WebGL 2 not available");
        } else {
            console.log("WebGL 2 is available.");
        }
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400000);
        
        // Create renderer with HDR support
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true, // Better for space scenes with huge distance ranges
            stencil: true, // Explicitly enable stencil buffer (default changed to false in r163)
        });
        
        // Enable shadow mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Use the new physically correct lighting system (default in r155+)
        this.renderer.useLegacyLights = false;
        
        // Set tone mapping for HDR rendering
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Setup for instanced meshes
        this.instancedMeshes = new Map();
        
        this.setupRenderer();
        this.setupPostProcessing();
        this.setupLighting();
        this.setupResizeHandler();
        console.log("Enhanced renderer initialized successfully");
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);
        
        // Set the output color space to sRGB
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Position camera - brought closer for better visibility
        this.camera.position.z = 10;
        
        // Make sure the camera can see far enough to show the skybox
        this.camera.far = 400000;
        this.camera.updateProjectionMatrix();

        // Enhance shadow mapping for better quality eclipse effects
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
    }
    
    setupPostProcessing() {
        try {
            // Create a composer for post-processing effects
            this.composer = new EffectComposer(this.renderer);
            
            // Add the render pass
            const renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Add godray effect based on settings
            this.setupGodRayEffects();
            
            try {
                // Add bloom effect for sun, engines, etc.
                this.bloomPass = new UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    0.2,    // strength (further reduced from 0.3)
                    0.2,    // radius (further reduced from 0.3)
                    0.95    // threshold (further increased from 0.9 to only affect the very brightest parts)
                );
                this.composer.addPass(this.bloomPass);
            } catch (error) {
                console.warn("Error setting up UnrealBloomPass:", error);
            }
            
            try {
                // Add FXAA for edge aliasing
                const fxaaPass = new ShaderPass(FXAAShader);
                if (fxaaPass.material && fxaaPass.material.uniforms && fxaaPass.material.uniforms.resolution) {
                    const pixelRatio = this.renderer.getPixelRatio();
                    fxaaPass.material.uniforms.resolution.value.x = 1 / (window.innerWidth * pixelRatio);
                    fxaaPass.material.uniforms.resolution.value.y = 1 / (window.innerHeight * pixelRatio);
                    this.composer.addPass(fxaaPass);
                } else {
                    console.warn("FXAAShader uniforms not as expected, skipping pass");
                }
            } catch (error) {
                console.warn("Error setting up FXAAShader:", error);
            }
            
            try {
                // Add color correction effects
                this.colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
                if (this.colorCorrectionPass.uniforms && this.colorCorrectionPass.uniforms.powRGB && this.colorCorrectionPass.uniforms.mulRGB) {
                    this.colorCorrectionPass.uniforms.powRGB.value = new THREE.Vector3(1.1, 1.1, 1.2); // Slightly blue tint
                    this.colorCorrectionPass.uniforms.mulRGB.value = new THREE.Vector3(1.2, 1.1, 1.0); // Warmer highlights
                    this.composer.addPass(this.colorCorrectionPass);
                } else {
                    console.warn("ColorCorrectionShader uniforms not as expected, skipping pass");
                }
            } catch (error) {
                console.warn("Error setting up ColorCorrectionShader:", error);
            }
            
            try {
                // Add subtle film grain for more cinematic feel
                this.filmPass = new ShaderPass(FilmShader);
                if (this.filmPass.uniforms && this.filmPass.uniforms.nIntensity && 
                    this.filmPass.uniforms.sIntensity && this.filmPass.uniforms.grayscale) {
                    this.filmPass.uniforms.nIntensity.value = 0.15; // Noise intensity
                    this.filmPass.uniforms.sIntensity.value = 0.05; // Scanline intensity
                    this.filmPass.uniforms.grayscale.value = 0; // Color
                    this.composer.addPass(this.filmPass);
                } else {
                    console.warn("FilmShader uniforms not as expected, skipping pass");
                }
            } catch (error) {
                console.warn("Error setting up FilmShader:", error);
            }
            
            try {
                // Add vignette effect
                this.vignettePass = new ShaderPass(VignetteShader);
                if (this.vignettePass.uniforms && this.vignettePass.uniforms.offset && this.vignettePass.uniforms.darkness) {
                    this.vignettePass.uniforms.offset.value = 0.95;
                    this.vignettePass.uniforms.darkness.value = 1.6;
                    this.composer.addPass(this.vignettePass);
                } else {
                    console.warn("VignetteShader uniforms not as expected, skipping pass");
                }
            } catch (error) {
                console.warn("Error setting up VignetteShader:", error);
            }
            
            console.log("Post-processing setup complete");
        } catch (error) {
            console.error("Error setting up post-processing:", error);
            console.log("Continuing with basic rendering without post-processing");
            // Set a flag to use basic rendering instead
            this.useBasicRendering = true;
        }
    }
    
    /**
     * Setup for volumetric lighting (god rays) effects
     * Handles both the new realistic godray effect and the original "Claude Rays"
     */
    setupGodRayEffects() {
        try {
            // Initialize flags for volumetric lighting effects
            this.volumetricLightEnabled = true;     // Master toggle for any god ray effect
            this.useClaudeRays = false;             // Toggle between new godRays (false) and Claude Rays (true)
            
            // Create the original "Claude Rays" effect (disabled by default)
            this.claudeRayPass = this.createClaudeRayShader();
            this.claudeRayPass.enabled = this.volumetricLightEnabled && this.useClaudeRays;
            this.composer.addPass(this.claudeRayPass);
            console.log("Claude Rays effect created (disabled by default)");
            
            // Create the new improved volumetric lighting effect
            this.godRayPass = this.createVolumetricLightShader();
            this.godRayPass.enabled = this.volumetricLightEnabled && !this.useClaudeRays;
            this.composer.addPass(this.godRayPass);
            console.log("New volumetric light ray effect added to post-processing chain");
        } catch (error) {
            console.warn("Error setting up volumetric light shaders:", error);
        }
    }
    
    setupLighting() {
        // Ambient light - reduced for better shadow visibility
        const ambientLight = new THREE.AmbientLight(0x404050, 1.0); // Reduced from 2.5
        this.scene.add(ambientLight);
        this.ambientLight = ambientLight; // Store reference to adjust later

        // Directional light - kept the same
        const directionalLight = new THREE.DirectionalLight(0xffffe0, 2.0);
        directionalLight.position.set(1, 0.5, 1).normalize();
        directionalLight.castShadow = true;
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.bias = -0.0005;
        this.scene.add(directionalLight);
        
        // Fill light - reduced for better shadow definition
        const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3); // Reduced from 0.8
        fillLight.position.set(-1, -0.3, -1).normalize();
        this.scene.add(fillLight);
        
        // Hemisphere light - reduced for better contrast
        const hemisphereLight = new THREE.HemisphereLight(0x606090, 0x101020, 0.4); // Reduced from 0.8
        this.scene.add(hemisphereLight);
        
        // Ambient point light - reduced brightness
        const ambientPointLight = new THREE.PointLight(0xffffff, 1.2, 1200, 2); // Reduced from 2.5
        ambientPointLight.position.set(0, 500, 0); // Positioned high up
        this.scene.add(ambientPointLight);
    }
    
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    // Explicitly define getter methods for scene and camera
    getScene() {
        return this.scene;
    }
    
    getCamera() {
        return this.camera;
    }
    
    // Resize handler method
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update composer size if it exists
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        
            // Update FXAA resolution
            try {
                const pixelRatio = this.renderer.getPixelRatio();
                const fxaaPass = this.composer.passes.find(pass => 
                    pass.material && 
                    pass.material.uniforms && 
                    pass.material.uniforms.resolution &&
                    pass.material.uniforms.resolution.value
                );
                
                if (fxaaPass) {
                    fxaaPass.material.uniforms.resolution.value.x = 1 / (window.innerWidth * pixelRatio);
                    fxaaPass.material.uniforms.resolution.value.y = 1 / (window.innerHeight * pixelRatio);
                }
            } catch (error) {
                console.warn("Error updating FXAA resolution:", error);
            }
        }
    }
    
    // Add an object to the scene
    add(object) {
        this.scene.add(object);
    }
    
    // Allow dynamic adjustment of post-processing settings
    adjustBloom(strength, radius, threshold) {
        if (this.bloomPass) {
            this.bloomPass.strength = strength !== undefined ? strength : this.bloomPass.strength;
            this.bloomPass.radius = radius !== undefined ? radius : this.bloomPass.radius;
            this.bloomPass.threshold = threshold !== undefined ? threshold : this.bloomPass.threshold;
        }
    }
    
    // Update for dynamic visual effects
    update(deltaTime) {
        // Update film grain with time for animation
        if (this.filmPass && this.filmPass.uniforms && this.filmPass.uniforms.time && this.filmPass.uniforms.time.value !== undefined) {
            try {
                this.filmPass.uniforms.time.value += deltaTime;
            } catch (error) {
                console.warn("Error updating film pass time:", error);
            }
        }
        
        // Update volumetric light ray position if sun is present
        if (this.volumetricLightEnabled) {
            if (this.useClaudeRays) {
                this.updateClaudeRayPosition();
            } else {
                this.updateVolumetricLightPosition();
            }
        }
        
        // Update instanced meshes
        this.updateInstancedMeshes();
    }
    
    /**
     * Update the light position for Claude Rays
     */
    updateClaudeRayPosition() {
        try {
            // Ensure we have the required objects
            if (!this.claudeRayPass || !this.claudeRayPass.uniforms || !this.claudeRayPass.uniforms.lightPosition) {
                return;
            }
            
            if (!this.camera || !this.scene) {
                return;
            }
            
            // Try to find the sun in the scene
            let sun = this.findSunObject();
            
            if (sun) {
                // Get sun world position
                const sunWorldPos = new THREE.Vector3();
                sun.getWorldPosition(sunWorldPos);
                
                // Create a vector to hold the screen position
                const screenVector = sunWorldPos.clone();
                
                // Project to camera space
                screenVector.project(this.camera);
                
                // Convert to normalized device coordinates (NDC)
                const x = (screenVector.x + 1) / 2;
                const y = (screenVector.y + 1) / 2;
                
                // Update the shader uniform with the new position
                this.claudeRayPass.uniforms.lightPosition.value.set(x, y);
            } else {
                // Default to center if sun not found
                this.claudeRayPass.uniforms.lightPosition.value.set(0.5, 0.5);
            }
        } catch (error) {
            console.warn('Error updating Claude Ray position:', error);
            
            // Set a default position in case of error
            if (this.claudeRayPass && this.claudeRayPass.uniforms && this.claudeRayPass.uniforms.lightPosition) {
                this.claudeRayPass.uniforms.lightPosition.value.set(0.5, 0.5);
            }
        }
    }
    
    /**
     * Update the light position for volumetric rays
     */
    updateVolumetricLightPosition() {
        try {
            // Ensure we have the required objects
            if (!this.godRayPass || !this.godRayPass.uniforms || !this.godRayPass.uniforms.lightPosition) {
                return;
            }
            
            if (!this.camera || !this.scene) {
                return;
            }
            
            // Try to find the sun in the scene
            let sun = this.findSunObject();
            
            if (sun) {
                // Get sun world position
                const sunWorldPos = new THREE.Vector3();
                sun.getWorldPosition(sunWorldPos);
                
                // Create a vector to hold the screen position
                const screenVector = sunWorldPos.clone();
                
                // Project to camera space
                screenVector.project(this.camera);
                
                // Convert to normalized device coordinates (NDC)
                const x = (screenVector.x + 1) / 2;
                const y = (screenVector.y + 1) / 2;
                
                // Calculate distance from camera to sun for attenuation
                const camToSunDistance = this.camera.position.distanceTo(sunWorldPos);
                
                // Update the shader uniforms
                this.godRayPass.uniforms.lightPosition.value.set(x, y);
                
                // Update distance - normalized to 0-1 range for shader
                // Base the max distance on the sun's size and visibility range
                const maxDistance = 130000; // Increased from 100000 for longer rays
                const normalizedDistance = Math.min(1.0, camToSunDistance / maxDistance);
                this.godRayPass.uniforms.sunDistance.value = normalizedDistance;
                
                // Calculate if sun is in front of camera (dot product with camera direction)
                const camDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const sunDirection = new THREE.Vector3().subVectors(sunWorldPos, this.camera.position).normalize();
                const dotProduct = camDirection.dot(sunDirection);
                
                // Sun is visible when dot product is positive (sun is in front of camera)
                this.godRayPass.uniforms.sunVisibility.value = Math.max(0, dotProduct);
            } else {
                // Default to center if sun not found
                this.godRayPass.uniforms.lightPosition.value.set(0.5, 0.5);
                this.godRayPass.uniforms.sunDistance.value = 1.0; // Far away
                this.godRayPass.uniforms.sunVisibility.value = 0.0; // Not visible
            }
        } catch (error) {
            console.warn('Error updating volumetric light position:', error);
            
            // Set default values in case of error
            if (this.godRayPass && this.godRayPass.uniforms) {
                if (this.godRayPass.uniforms.lightPosition) {
                    this.godRayPass.uniforms.lightPosition.value.set(0.5, 0.5);
                }
                if (this.godRayPass.uniforms.sunDistance) {
                    this.godRayPass.uniforms.sunDistance.value = 1.0;
                }
                if (this.godRayPass.uniforms.sunVisibility) {
                    this.godRayPass.uniforms.sunVisibility.value = 0.0;
                }
            }
        }
    }
    
    /**
     * Helper method to find the sun object in the scene
     * @returns {THREE.Object3D|null} The sun object or null if not found
     */
    findSunObject() {
        let sun = null;
        
        // First try by name
        sun = this.scene.getObjectByName('sun');
        
        // If not found by name, try to find by traversing scene
        if (!sun) {
            this.scene.traverse(object => {
                if (object.name === 'sun') {
                    sun = object;
                }
            });
        }
        
        return sun;
    }
    
    // Override the render method to use the composer if available, otherwise fallback to basic rendering
    render() {
        if (this.composer && !this.useBasicRendering) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Create an instanced mesh for efficient rendering of many similar objects
     * @param {string} key Unique identifier for this instanced mesh type
     * @param {THREE.BufferGeometry} geometry The geometry to instance
     * @param {THREE.Material} material The material to use
     * @param {number} maxCount Maximum number of instances
     * @returns {THREE.InstancedMesh} The created instanced mesh
     */
    createInstancedMesh(key, geometry, material, maxCount) {
        const instancedMesh = new THREE.InstancedMesh(geometry, material, maxCount);
        instancedMesh.count = 0; // Start with 0 visible instances
        instancedMesh.frustumCulled = true;
        this.scene.add(instancedMesh);
        
        this.instancedMeshes.set(key, {
            mesh: instancedMesh,
            count: 0,
            maxCount: maxCount,
            dummy: new THREE.Object3D() // Reusable temporary Object3D for matrix calculations
        });
        
        return instancedMesh;
    }
    
    /**
     * Add or update an instance in an instanced mesh
     * @param {string} key The instanced mesh identifier
     * @param {number} index Index of the instance to update (or next available)
     * @param {THREE.Vector3} position Position of the instance
     * @param {THREE.Quaternion} quaternion Rotation of the instance
     * @param {THREE.Vector3} scale Scale of the instance
     * @returns {number} The index of the instance
     */
    updateInstance(key, index, position, quaternion, scale) {
        const instance = this.instancedMeshes.get(key);
        if (!instance) return -1;
        
        // Determine index to use
        const idx = (index !== undefined) ? index : instance.count;
        
        // If we're adding a new instance, increment the count
        if (idx >= instance.count) {
            if (idx >= instance.maxCount) return -1; // Can't exceed max count
            instance.count = idx + 1;
        }
        
        // Update matrix using dummy object
        instance.dummy.position.copy(position);
        if (quaternion) instance.dummy.quaternion.copy(quaternion);
        if (scale) instance.dummy.scale.copy(scale);
        instance.dummy.updateMatrix();
        
        // Apply to instanced mesh
        instance.mesh.setMatrixAt(idx, instance.dummy.matrix);
        instance.mesh.instanceMatrix.needsUpdate = true;
        
        return idx;
    }
    
    /**
     * Update instanced meshes
     */
    updateInstancedMeshes() {
        for (const [key, instance] of this.instancedMeshes.entries()) {
            if (instance.mesh.instanceMatrix.needsUpdate) {
                instance.mesh.instanceMatrix.needsUpdate = false;
            }
        }
    }
    
    /**
     * Remove an instance from an instanced mesh
     * @param {string} key The instanced mesh identifier
     * @param {number} index Index of the instance to remove
     */
    removeInstance(key, index) {
        const instance = this.instancedMeshes.get(key);
        if (!instance || index >= instance.count) return;
        
        // Move the last instance to this slot if it's not the last one
        if (index < instance.count - 1) {
            // Get the matrix of the last instance
            const matrix = new THREE.Matrix4();
            instance.mesh.getMatrixAt(instance.count - 1, matrix);
            
            // Set it at the removed index
            instance.mesh.setMatrixAt(index, matrix);
        }
        
        // Decrease count
        instance.count--;
        instance.mesh.count = instance.count;
        instance.mesh.instanceMatrix.needsUpdate = true;
    }
    
    /**
     * Properly dispose of Three.js resources to prevent memory leaks
     */
    dispose() {
        console.log("Disposing renderer resources...");
        
        // Remove event listener
        window.removeEventListener('resize', this.handleResize);
        
        // Dispose of post-processing
        if (this.composer) {
            this.composer.passes.forEach(pass => {
                if (pass.dispose) pass.dispose();
                if (pass.material) {
                    pass.material.dispose();
                }
            });
        }
        
        // Dispose of instanced meshes
        this.instancedMeshes.forEach(instance => {
            if (instance.mesh) {
                if (instance.mesh.geometry) instance.mesh.geometry.dispose();
                if (instance.mesh.material) {
                    if (Array.isArray(instance.mesh.material)) {
                        instance.mesh.material.forEach(material => material.dispose());
                    } else {
                        instance.mesh.material.dispose();
                    }
                }
                this.scene.remove(instance.mesh);
            }
        });
        
        // Dispose of scene objects
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => this.disposeMaterial(material));
                } else {
                    this.disposeMaterial(object.material);
                }
            }
        });
        
        // Dispose of renderer
        this.renderer.dispose();
        
        console.log("Renderer resources disposed");
    }
    
    /**
     * Helper method to dispose of materials and their textures
     * @param {THREE.Material} material The material to dispose
     */
    disposeMaterial(material) {
        // Dispose textures
        for (const propertyName in material) {
            const property = material[propertyName];
            if (property && property.isTexture) {
                property.dispose();
            }
        }
        
        // Dispose the material itself
        material.dispose();
    }
    
    /**
     * Create a volumetric light shader for realistic god ray effects
     * @returns {ShaderPass} Shader pass for new volumetric lighting
     */
    createVolumetricLightShader() {
        // New improved volumetric light ray shader
        const godRayShader = {
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
                    for (int i = 0; i < MAX_SAMPLES; i++) {
                        if (i >= sampleCount) break;
                        
                        // Move along the ray
                        samplePosition += sampleStep;
                        
                        // Sample at the current position
                        vec4 sampledColor = texture2D(tDiffuse, samplePosition);
                        
                        // Calculate illumination decay factor
                        float decayFactor = illuminationDecay(float(i) / float(sampleCount), sunDistance);
                        
                        // Create the ray sample with attenuation
                        vec4 raySample = sampledColor * decayFactor * weight;
                        
                        // Apply sun color to the ray (tinted by scene color)
                        raySample.rgb *= mix(sunColor, sampledColor.rgb, 0.3);
                        
                        // Apply scattering effect - brightens areas around sun
                        if (i < sampleCount / 3) {
                            raySample.rgb += sunColor * scatterFactor * decayFactor * 0.2 * (1.0 - float(i) / float(sampleCount / 3));
                        }
                        
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
     * @returns {ShaderPass} Shader pass for the original effect
     */
    createClaudeRayShader() {
        // Original volumetric light ray shader (renamed to Claude Rays)
        const claudeRayShader = {
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
    
    /**
     * Toggle the type of volumetric lighting effect
     * @param {boolean} useClaudeRays - If true, use original Claude Rays; if false, use new god rays
     */
    setRayType(useClaudeRays) {
        this.useClaudeRays = useClaudeRays;
        
        // Enable/disable appropriate shader passes
        if (this.claudeRayPass) {
            this.claudeRayPass.enabled = this.volumetricLightEnabled && this.useClaudeRays;
        }
        
        if (this.godRayPass) {
            this.godRayPass.enabled = this.volumetricLightEnabled && !this.useClaudeRays;
        }
        
        // Adjust ambient lighting based on ray type
        this.adjustLightingForRayType();
        
        console.log(`Using ${this.useClaudeRays ? 'Claude Rays' : 'Volumetric God Rays'} effect`);
    }
    
    /**
     * Adjust scene lighting based on current ray type
     * Standard god rays need more ambient light to prevent planets from being too dark
     */
    adjustLightingForRayType() {
        if (!this.ambientLight) return;
        
        if (this.useClaudeRays) {
            // For Claude Rays - use original darker ambient lighting
            this.ambientLight.intensity = 1.0;
        } else {
            // For standard god rays - increase ambient lighting to better illuminate planets
            this.ambientLight.intensity = 1.8; // Increased from 1.0
        }
    }
    
    /**
     * Toggle volumetric light rays effect (master toggle)
     * @param {boolean} enabled Whether to enable or disable all ray effects
     */
    setVolumetricLightEnabled(enabled) {
        this.volumetricLightEnabled = enabled;
        
        // Update enabled state of current ray effect
        if (this.useClaudeRays && this.claudeRayPass) {
            this.claudeRayPass.enabled = enabled;
        } else if (this.godRayPass) {
            this.godRayPass.enabled = enabled;
        }
        
        console.log(`Volumetric lighting ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Update volumetric light parameters for the new god ray shader
     * @param {Object} params Parameters to update
     */
    updateVolumetricLightParams(params = {}) {
        if (!this.godRayPass || !this.godRayPass.uniforms) return;
        
        const uniforms = this.godRayPass.uniforms;
        
        if (params.intensity !== undefined) uniforms.intensity.value = params.intensity;
        if (params.decay !== undefined) uniforms.decay.value = params.decay;
        if (params.density !== undefined) uniforms.density.value = params.density;
        if (params.weight !== undefined) uniforms.weight.value = params.weight;
        if (params.samples !== undefined) uniforms.samples.value = params.samples;
        if (params.sunColor !== undefined) uniforms.sunColor.value = new THREE.Color(params.sunColor);
        if (params.scattering !== undefined) uniforms.scattering.value = params.scattering;
        if (params.attenuationMultiplier !== undefined) uniforms.attenuationMultiplier.value = params.attenuationMultiplier;
    }
    
    /**
     * Update Claude Ray parameters
     * @param {Object} params Parameters to update
     */
    updateClaudeRayParams(params = {}) {
        if (!this.claudeRayPass || !this.claudeRayPass.uniforms) return;
        
        const uniforms = this.claudeRayPass.uniforms;
        
        if (params.exposure !== undefined) uniforms.exposure.value = params.exposure;
        if (params.decay !== undefined) uniforms.decay.value = params.decay;
        if (params.density !== undefined) uniforms.density.value = params.density;
        if (params.weight !== undefined) uniforms.weight.value = params.weight;
        if (params.lightColor !== undefined) uniforms.lightColor.value = new THREE.Color(params.lightColor);
    }
    
    /**
     * Set overall volumetric light ray intensity with a single parameter
     * @param {number} intensity Value from 0-1 controlling overall ray intensity
     */
    setVolumetricLightIntensity(intensity) {
        if (this.useClaudeRays) {
            // For Claude Rays
            if (!this.claudeRayPass || !this.claudeRayPass.uniforms) return;
            
            // Clamp intensity between 0 and 1
            intensity = Math.max(0, Math.min(1, intensity));
            
            // Scale the intensity to reasonable parameter ranges
            const exposure = 0.2 + (intensity * 0.4);  // Range: 0.2-0.6
            const weight = 0.15 + (intensity * 0.25);  // Range: 0.15-0.4
            const density = 0.7 + (intensity * 0.3);   // Range: 0.7-1.0
            
            // Update the shader parameters
            this.updateClaudeRayParams({
                exposure: exposure,
                weight: weight,
                density: density
            });
        } else {
            // For new god rays
            if (!this.godRayPass || !this.godRayPass.uniforms) return;
            
            // Clamp intensity between 0 and 1
            intensity = Math.max(0, Math.min(1, intensity));
            
            // Scale intensity for new shader parameters with higher base values
            this.updateVolumetricLightParams({
                intensity: 0.3 + (intensity * 0.4),  // Increased base intensity
                weight: 0.35 + (intensity * 0.3),    // Increased from 0.3 + intensity * 0.2
                density: 0.45 + (intensity * 0.25),  // Increased from 0.4 + intensity * 0.2
                scattering: 0.25 + (intensity * 0.25) // Increased from 0.2 + intensity * 0.2
            });
        }
        
        console.log(`Volumetric light intensity set to ${intensity.toFixed(2)}`);
    }
}