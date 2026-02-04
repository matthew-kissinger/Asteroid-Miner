// skybox.js - Creates and manages advanced procedural skybox with volumetric effects

import * as THREE from 'three';

export class Skybox {
    constructor(scene) {
        this.scene = scene;
        this.skybox = null;
        this.time = 0;
        
        // Create texture loader
        this.textureLoader = new THREE.TextureLoader();
        
        // Load the Milky Way texture
        this.milkyWayTexture = this.textureLoader.load('./assets/2k_stars_milky_way.jpg');
        this.milkyWayTexture.colorSpace = THREE.SRGBColorSpace;
        
        // Store additional skybox textures
        this.skyboxTextures = {};
        
        // Store initial parameters for the Solar System
        this.solarSystemParams = {
            starDensity: 1.0,
            nebulaDensity: 0.5,
            color: 0xFFFFFF,
            texturePath: './assets/2k_stars_milky_way.jpg',
            brightness: 1.0 // Default brightness for Solar System
        };
        
        this.createProceduralSkybox(this.solarSystemParams);
    }
    
    // Update skybox based on star system parameters
    updateForSystem(params) {
        if (!params) return;
        
        console.log("Updating skybox with parameters:", params);
        
        // Special case for Solar System - ensure consistent appearance
        if (params.isSolarSystem || 
            (params.color === 0xFFFFFF && params.starDensity === 1.0 && params.nebulaDensity === 0.5)) {
            console.log("Detected Solar System skybox parameters, using stored solar system configuration");
            params = this.solarSystemParams;
        }
        
        // Remove existing skybox
        if (this.skybox) {
            console.log("Removing existing skybox");
            this.scene.remove(this.skybox);
        }
        
        // Reset time for consistent star pattern
        if (params.resetTime) {
            this.time = 0;
        }
        
        // Create new skybox with system parameters
        this.createProceduralSkybox(params);
    }
    
    // Load texture if needed and return it
    getTexture(texturePath) {
        // Use default Milky Way texture if none specified
        if (!texturePath) {
            return this.milkyWayTexture;
        }
        
        // Return Milky Way texture for the default Solar System texture
        if (texturePath === './assets/2k_stars_milky_way.jpg') {
            return this.milkyWayTexture;
        }
        
        // Fix texture path for API server images
        let adjustedTexturePath = texturePath;
        
        // Check if this is an image from our API server
        if (texturePath.startsWith('/images/')) {
            // If running on port 8000, adjust URL to point to port 8001
            if (window.location.port === '8000') {
                const serverHost = window.location.hostname;
                adjustedTexturePath = `http://${serverHost}:8001${texturePath}`;
                console.log(`Adjusted texture path to API server: ${adjustedTexturePath}`);
            }
        }
        
        // Load the texture if not already loaded
        if (!this.skyboxTextures[texturePath]) {
            console.log(`Loading new skybox texture: ${adjustedTexturePath}`);
            this.skyboxTextures[texturePath] = this.textureLoader.load(adjustedTexturePath);
            this.skyboxTextures[texturePath].colorSpace = THREE.SRGBColorSpace;
        }
        
        return this.skyboxTextures[texturePath];
    }
    
    createProceduralSkybox(params = {}) {
        // Apply system parameters if provided
        let starDensity = params?.starDensity || 1.0;
        let nebulaDensity = params?.nebulaDensity || 0.5;
        let skyboxColor = params?.color || 0x000000;
        let brightness = params?.brightness !== undefined ? params.brightness : 1.0;
        const size = 320000; // Very large size to contain entire game world (4x original)
        const texturePath = params?.texturePath || './assets/2k_stars_milky_way.jpg';
        
        console.log(`Creating enhanced skybox with star density: ${starDensity}, nebula density: ${nebulaDensity}, color: 0x${skyboxColor.toString(16)}, texture: ${texturePath}, brightness: ${brightness}`);
        
        // Get the appropriate texture
        const skyboxTexture = this.getTexture(texturePath);
        
        // Create advanced shader material for skybox with texture
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: this.time || 0 },
                milkyWayTexture: { value: skyboxTexture },
                starDensity: { value: starDensity },
                nebulaDensity: { value: nebulaDensity },
                skyColor: { value: new THREE.Color(skyboxColor) },
                brightness: { value: brightness }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D milkyWayTexture;
                uniform float time;
                uniform float starDensity;
                uniform float nebulaDensity;
                uniform vec3 skyColor;
                uniform float brightness;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    // Sample the Milky Way texture with adjusted brightness
                    vec4 milkyWay = texture2D(milkyWayTexture, vUv);
                    milkyWay.rgb *= 1.5 * brightness; // Apply brightness factor
                    
                    // Use only the Milky Way texture without procedural stars
                    vec3 finalColor = milkyWay.rgb * nebulaDensity * 1.2 * brightness;
                    
                    // Reduced ambient light
                    finalColor += vec3(0.05);
                    
                    // Subtle color tint
                    finalColor = mix(finalColor, skyColor * 1.2 * brightness, 0.1);
                    
                    // Apply gamma correction for more natural brightness
                    finalColor = pow(finalColor, vec3(0.9));
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        // Create the skybox mesh
        const skyboxGeometry = new THREE.BoxGeometry(size, size, size);
        this.skybox = new THREE.Mesh(skyboxGeometry, skyMaterial);
        
        // Rotate the skybox to align the Milky Way with the galactic plane
        this.skybox.rotation.x = Math.PI / 4;
        this.skybox.rotation.y = Math.PI / 6;
        
        this.scene.add(this.skybox);
        
        // Store material for updates
        this.skyMaterial = skyMaterial;
        
        console.log("Enhanced skybox created with texture");
    }
    
    update(deltaTime = 0.016, camera) {
        // Update skybox animation
        if (this.skyMaterial) {
            this.time += deltaTime * 0.1; // Slower star movement
            this.skyMaterial.uniforms.time.value = this.time;
        }
        
        // Keep skybox centered on camera if it exists
        if (this.skybox && camera) {
            this.skybox.position.copy(camera.position);
        }
    }
}