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
    }
    
    // Override the render method to use the composer if available, otherwise fallback to basic rendering
    render() {
        if (this.composer && !this.useBasicRendering) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}