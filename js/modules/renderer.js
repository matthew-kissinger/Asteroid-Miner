// renderer.js - Handles the Three.js scene, camera, renderer setup and post-processing

export class Renderer {
    constructor() {
        console.log("Initializing enhanced renderer...");
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100000);
        
        // Create renderer with HDR support
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true, // Better for space scenes with huge distance ranges
        });
        
        // Enable shadow mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Enable physically accurate lighting
        this.renderer.physicallyCorrectLights = true;
        
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
        
        // Position camera - brought closer for better visibility
        this.camera.position.z = 10;
        
        // Make sure the camera can see far enough to show the skybox
        this.camera.far = 100000;
        this.camera.updateProjectionMatrix();
    }
    
    setupPostProcessing() {
        try {
            // Create a composer for post-processing effects
            this.composer = new THREE.EffectComposer(this.renderer);
            
            // Add the render pass
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Check if required shaders are available
            if (typeof THREE.UnrealBloomPass !== 'undefined' && typeof THREE.LuminosityHighPassShader !== 'undefined') {
                // Add bloom effect for sun, engines, etc.
                this.bloomPass = new THREE.UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    0.6,    // strength
                    0.4,    // radius
                    0.85    // threshold
                );
                this.composer.addPass(this.bloomPass);
            } else {
                console.warn("UnrealBloomPass not available, skipping bloom effect");
            }
            
            // Add FXAA for edge aliasing if available
            if (typeof THREE.FXAAShader !== 'undefined') {
                const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
                const pixelRatio = this.renderer.getPixelRatio();
                fxaaPass.material.uniforms.resolution.value.x = 1 / (window.innerWidth * pixelRatio);
                fxaaPass.material.uniforms.resolution.value.y = 1 / (window.innerHeight * pixelRatio);
                this.composer.addPass(fxaaPass);
            } else {
                console.warn("FXAAShader not available, skipping FXAA pass");
            }
            
            // Add color correction effects if available
            if (typeof THREE.ColorCorrectionShader !== 'undefined') {
                this.colorCorrectionPass = new THREE.ShaderPass(THREE.ColorCorrectionShader);
                this.colorCorrectionPass.uniforms.powRGB.value = new THREE.Vector3(1.1, 1.1, 1.2); // Slightly blue tint
                this.colorCorrectionPass.uniforms.mulRGB.value = new THREE.Vector3(1.2, 1.1, 1.0); // Warmer highlights
                this.composer.addPass(this.colorCorrectionPass);
            } else {
                console.warn("ColorCorrectionShader not available, skipping color correction");
            }
            
            // Add subtle film grain for more cinematic feel if available
            if (typeof THREE.FilmShader !== 'undefined') {
                this.filmPass = new THREE.ShaderPass(THREE.FilmShader);
                this.filmPass.uniforms.nIntensity.value = 0.15; // Noise intensity
                this.filmPass.uniforms.sIntensity.value = 0.05; // Scanline intensity
                this.filmPass.uniforms.grayscale.value = 0; // Color
                this.composer.addPass(this.filmPass);
            } else {
                console.warn("FilmShader not available, skipping film grain effect");
            }
            
            // Add vignette effect if available
            if (typeof THREE.VignetteShader !== 'undefined') {
                this.vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
                this.vignettePass.uniforms.offset.value = 0.95;
                this.vignettePass.uniforms.darkness.value = 1.6;
                this.composer.addPass(this.vignettePass);
            } else {
                console.warn("VignetteShader not available, skipping vignette effect");
            }
            
            console.log("Post-processing setup complete");
        } catch (error) {
            console.error("Error setting up post-processing:", error);
            console.log("Continuing with basic rendering without post-processing");
            // Set a flag to use basic rendering instead
            this.useBasicRendering = true;
        }
    }
    
    setupLighting() {
        // Increased ambient lighting by 2x for better visibility
        const ambientLight = new THREE.AmbientLight(0x404050, 3.0); // Doubled intensity
        this.scene.add(ambientLight);

        // Brighter key light with increased intensity
        const directionalLight = new THREE.DirectionalLight(0xffffe0, 2.4); // Doubled intensity
        directionalLight.position.set(1, 0.5, 1).normalize();
        directionalLight.castShadow = true;
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.bias = -0.0005;
        this.scene.add(directionalLight);
        
        // Brighter fill light to reduce shadows
        const fillLight = new THREE.DirectionalLight(0xaaccff, 0.6); // Doubled intensity
        fillLight.position.set(-1, -0.3, -1).normalize();
        this.scene.add(fillLight);
        
        // Create a brighter hemisphere light for environment lighting
        const hemisphereLight = new THREE.HemisphereLight(0x606090, 0x101020, 0.6); // Doubled intensity
        this.scene.add(hemisphereLight);
        
        // Add a persistent ambient point light for better visibility of nearby objects
        const ambientPointLight = new THREE.PointLight(0xffffff, 0.8, 2000, 1);
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
            const pixelRatio = this.renderer.getPixelRatio();
            const fxaaPass = this.composer.passes.find(pass => pass.material && pass.material.uniforms && pass.material.uniforms.resolution);
            if (fxaaPass) {
                fxaaPass.material.uniforms.resolution.value.x = 1 / (window.innerWidth * pixelRatio);
                fxaaPass.material.uniforms.resolution.value.y = 1 / (window.innerHeight * pixelRatio);
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
        if (this.filmPass && this.filmPass.uniforms && this.filmPass.uniforms.time) {
            this.filmPass.uniforms.time.value += deltaTime;
        }
        
        // Update instanced meshes
        this.updateInstancedMeshes();
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
            instance.mesh.count = instance.count;
        }
        
        // Update the matrix for this instance
        instance.dummy.position.copy(position);
        instance.dummy.quaternion.copy(quaternion);
        instance.dummy.scale.copy(scale);
        instance.dummy.updateMatrix();
        
        instance.mesh.setMatrixAt(idx, instance.dummy.matrix);
        instance.mesh.instanceMatrix.needsUpdate = true;
        
        return idx;
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
     * Update all instanced meshes
     */
    updateInstancedMeshes() {
        this.instancedMeshes.forEach(instance => {
            if (instance.mesh.instanceMatrix.needsUpdate) {
                instance.mesh.instanceMatrix.needsUpdate = false;
            }
        });
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
}