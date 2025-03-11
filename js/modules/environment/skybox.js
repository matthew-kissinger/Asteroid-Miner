// skybox.js - Creates and manages advanced procedural skybox with volumetric effects

export class Skybox {
    constructor(scene) {
        this.scene = scene;
        this.skybox = null;
        this.time = 0;
        
        // Create texture loader
        this.textureLoader = new THREE.TextureLoader();
        
        // Load the Milky Way texture
        this.milkyWayTexture = this.textureLoader.load('./assets/2k_stars_milky_way.jpg');
        this.milkyWayTexture.encoding = THREE.sRGBEncoding;
        
        // Store initial parameters for the Solar System
        this.solarSystemParams = {
            starDensity: 1.0,
            nebulaDensity: 0.5,
            color: 0xFFFFFF
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
    
    createProceduralSkybox(params = {}) {
        // Apply system parameters if provided
        let starDensity = params?.starDensity || 1.0;
        let nebulaDensity = params?.nebulaDensity || 0.5;
        let skyboxColor = params?.color || 0x000000;
        const size = 80000; // Very large size to contain entire game world
        
        console.log(`Creating enhanced skybox with star density: ${starDensity}, nebula density: ${nebulaDensity}, color: 0x${skyboxColor.toString(16)}`);
        
        // Create advanced shader material for skybox with Milky Way texture
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: this.time || 0 },
                milkyWayTexture: { value: this.milkyWayTexture },
                starDensity: { value: starDensity },
                nebulaDensity: { value: nebulaDensity },
                skyColor: { value: new THREE.Color(skyboxColor) }
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
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Random and noise functions
                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                float stars(vec2 p) {
                    vec2 cell = floor(p);
                    vec2 cellPos = fract(p);
                    
                    float brightness = 0.0;
                    
                    // Improved star distribution with smoother falloff
                    float starValue = hash(cell);
                    if (starValue > (1.0 - starDensity * 0.5)) {
                        float size = (hash(cell + 1.23) * 0.6 + 0.2) * 0.015;  // Smaller, more natural star size
                        
                        // Smoother star falloff with gaussian-like distribution
                        float dist = length(cellPos - vec2(0.5));
                        brightness = 1.5 * exp(-dist * dist / (size * size));
                        
                        // Add subtle twinkle effect
                        brightness *= 0.8 + 0.2 * sin(time * (hash(cell + 2.34) * 2.0));
                    }
                    
                    return brightness;
                }
                
                void main() {
                    // Sample the Milky Way texture with adjusted brightness
                    vec4 milkyWay = texture2D(milkyWayTexture, vUv);
                    milkyWay.rgb *= 1.5; // Slightly reduced Milky Way brightness
                    
                    // Generate stars with improved distribution
                    vec2 starPos = vPosition.xy * 50.0 + time * 0.05; // Reduced frequency and speed
                    float starField = stars(starPos) * starDensity;
                    
                    // Add depth variation to stars
                    starField *= (0.8 + 0.2 * hash(floor(starPos * 0.1)));
                    
                    // Combine Milky Way with procedural stars
                    vec3 finalColor = milkyWay.rgb * nebulaDensity * 1.2 + vec3(starField);
                    
                    // Reduced ambient light
                    finalColor += vec3(0.05);
                    
                    // Subtle color tint
                    finalColor = mix(finalColor, skyColor * 1.2, 0.1);
                    
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
        
        console.log("Enhanced skybox created with Milky Way texture");
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