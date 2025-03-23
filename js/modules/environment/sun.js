// sun.js - Creates and manages the sun object (central star) with volumetric rendering

export class Sun {
    constructor(scene) {
        this.scene = scene;
        this.sun = null;
        this.sunFlickerIntensity = 1.0;
        this.sunFlickerDirection = 0.02;
        this.time = 0;
        this.sunType = 'G'; // Default sun type (G-type like our Sun)
        this.createSun();
    }
    
    createSun() {
        // Create a group to hold all sun-related elements
        this.sun = new THREE.Group();
        this.scene.add(this.sun);
        
        // Create the core sun sphere with increased size
        const sunGeometry = new THREE.SphereGeometry(1200, 64, 64);
        
        // Use advanced shader material for the sun surface
        const sunMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                sunColor: { value: new THREE.Color(0xff7700) },
                surfaceDetail: { value: 0.8 },
                surfaceDistortion: { value: 0.2 },
                sunActivity: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 sunColor;
                uniform float surfaceDetail;
                uniform float surfaceDistortion;
                uniform float sunActivity;
                
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Noise functions for surface detail
                float hash(float n) { return fract(sin(n) * 43758.5453123); }
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                
                float noise(vec3 x) {
                    vec3 p = floor(x);
                    vec3 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    
                    float n = p.x + p.y * 157.0 + 113.0 * p.z;
                    return mix(
                        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y),
                        f.z);
                }
                
                // Fractional Brownian Motion for layered detail
                float fbm(vec3 x) {
                    float v = 0.0;
                    float a = 0.5;
                    vec3 shift = vec3(100);
                    
                    for (int i = 0; i < 5; ++i) {
                        v += a * noise(x);
                        x = x * 2.0 + shift;
                        a *= 0.5;
                    }
                    
                    return v;
                }
                
                void main() {
                    // Calculate dynamic granulation based on noise
                    vec3 surfacePos = vPosition * surfaceDetail * 0.01;
                    float granulation = fbm(surfacePos + time * 0.1);
                    
                    // Calculate solar prominences and flares
                    float flares = pow(fbm(surfacePos * 2.0 + time * 0.2), 2.0) * sunActivity;
                    flares = smoothstep(0.7, 0.95, flares);
                    
                    // Calculate normal distortion for surface waves
                    vec3 distortedNormal = vNormal;
                    distortedNormal.x += noise(surfacePos * 5.0 + time * 0.1) * surfaceDistortion;
                    distortedNormal.y += noise(surfacePos * 5.0 + time * 0.15) * surfaceDistortion;
                    distortedNormal.z += noise(surfacePos * 5.0 + time * 0.12) * surfaceDistortion;
                    distortedNormal = normalize(distortedNormal);
                    
                    // Edge brightness (limb darkening inverse - brighter at the edges)
                    float edgeBrightness = 1.0 - dot(distortedNormal, vec3(0.0, 0.0, 1.0));
                    edgeBrightness = pow(edgeBrightness, 3.0) * 0.5;
                    
                    // Combine effects
                    vec3 finalColor = sunColor * (1.0 + granulation * 0.3);
                    finalColor += vec3(1.0, 0.6, 0.3) * flares * 0.8;
                    finalColor += vec3(1.0, 0.9, 0.7) * edgeBrightness;
                    
                    // Output with HDR values
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.FrontSide
        });
        
        const sunCoreMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.add(sunCoreMesh);
        
        // Add corona layer (volumetric glow effect)
        const coronaGeometry = new THREE.SphereGeometry(2400, 64, 64);
        const coronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coronaColor: { value: new THREE.Color(0xff9940) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) },
                turbulence: { value: 0.7 }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vIntensity;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    
                    // Calculate view-dependent intensity
                    vec3 viewDir = normalize(viewVector);
                    vIntensity = pow(1.15 - dot(vNormal, viewDir), 3.0);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 coronaColor;
                uniform float turbulence;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vIntensity;
                
                // Noise functions
                float hash(vec3 p) {
                    p = fract(p * vec3(443.897, 441.423, 437.195));
                    p += dot(p, p.yzx + 19.19);
                    return fract((p.x + p.y) * p.z);
                }
                
                float noise(vec3 p) {
                    vec3 i = floor(p);
                    vec3 f = fract(p);
                    f = f*f*(3.0-2.0*f);
                    
                    return mix(
                        mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                }
                
                float fbm(vec3 p) {
                    float f = 0.0;
                    float weight = 0.5;
                    for (int i = 0; i < 5; i++) {
                        f += weight * noise(p);
                        weight *= 0.5;
                        p *= 2.0;
                    }
                    return f;
                }
                
                void main() {
                    // Add turbulence to the corona intensity based on position
                    float turbulenceFactor = fbm(vPosition * 0.005 + time * 0.1) * turbulence;
                    float finalIntensity = vIntensity * (1.0 + turbulenceFactor);
                    
                    // HDR color with variation
                    vec3 finalColor = coronaColor * finalIntensity;
                    
                    // Add color variation based on intensity
                    if (finalIntensity > 0.8) {
                        finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), (finalIntensity - 0.8) * 5.0);
                    }
                    
                    // Add transparency at the edges for volumetric feel
                    float alpha = smoothstep(0.0, 0.2, finalIntensity);
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide
        });
        
        const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.sun.add(coronaMesh);
        
        // Add outer corona for extended glow
        const outerCoronaGeometry = new THREE.SphereGeometry(3600, 32, 32);
        const outerCoronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coronaColor: { value: new THREE.Color(0xff8800) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float vIntensity;
                
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(viewVector);
                    vIntensity = pow(1.05 - dot(vNormal, vNormel), 6.0);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 coronaColor;
                varying float vIntensity;
                
                void main() {
                    // Apply time-based pulsing
                    float pulseIntensity = vIntensity * (1.0 + 0.2 * sin(time));
                    vec3 glow = coronaColor * pulseIntensity;
                    gl_FragColor = vec4(glow, pulseIntensity * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide
        });
        
        const outerCoronaMesh = new THREE.Mesh(outerCoronaGeometry, outerCoronaMaterial);
        this.sun.add(outerCoronaMesh);
        
        // Add sun light
        const sunLight = new THREE.PointLight(0xff7700, 2.0, 10000, 1.5);
        this.sun.add(sunLight);
        
        // Add lens flare effect
        const lensFlareTexture = new THREE.TextureLoader().load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare0.png');
        const lensFlare = new THREE.Sprite(new THREE.SpriteMaterial({
            map: lensFlareTexture,
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        }));
        lensFlare.scale.set(2000, 2000, 1.0);
        this.sun.add(lensFlare);
        
        // Store material references for updates
        this.sunMaterial = sunMaterial;
        this.coronaMaterial = coronaMaterial;
        this.outerCoronaMaterial = outerCoronaMaterial;
        this.sunLight = sunLight;
    }
    
    // Update sun based on star type (O, B, A, F, G, K, M)
    updateSunType(type, lightIntensityMultiplier = 1.0) {
        this.sunType = type || 'G';
        let color, temperature, activity;
        
        // Set sun properties based on star classification
        switch(this.sunType) {
            case 'O': // Hot blue stars
                color = 0x9db4ff;
                temperature = 30000;
                activity = 0.8;
                break;
            case 'B': // Blue-white
                color = 0xaabfff;
                temperature = 20000;
                activity = 0.75;
                break;
            case 'A': // White
                color = 0xcad7ff;
                temperature = 10000;
                activity = 0.7;
                break;
            case 'F': // Yellow-white
                color = 0xf8f7ff;
                temperature = 7000;
                activity = 0.65;
                break;
            case 'G': // Yellow (like our Sun)
                color = 0xfff4ea;
                temperature = 5500;
                activity = 0.6;
                break;
            case 'K': // Orange
                color = 0xffd2a1;
                temperature = 4000;
                activity = 0.5;
                break;
            case 'M': // Red
                color = 0xffcc6f;
                temperature = 3000;
                activity = 0.4;
                break;
            default: // Default to G-type
                color = 0xfff4ea;
                temperature = 5500;
                activity = 0.6;
        }
        
        // Update material colors and parameters
        if (this.sunMaterial) {
            this.sunMaterial.uniforms.sunColor.value.setHex(color);
            this.sunMaterial.uniforms.sunActivity.value = activity;
        }
        
        if (this.coronaMaterial) {
            // Adjust corona color to be slightly lighter
            const coronaColor = new THREE.Color(color);
            coronaColor.r = Math.min(1.0, coronaColor.r * 1.2);
            coronaColor.g = Math.min(1.0, coronaColor.g * 1.1);
            coronaColor.b = Math.min(1.0, coronaColor.b * 1.0);
            this.coronaMaterial.uniforms.coronaColor.value = coronaColor;
        }
        
        if (this.outerCoronaMaterial) {
            // Adjust outer corona color
            const outerCoronaColor = new THREE.Color(color);
            outerCoronaColor.r = Math.min(1.0, outerCoronaColor.r * 1.3);
            outerCoronaColor.g = Math.min(1.0, outerCoronaColor.g * 1.2);
            outerCoronaColor.b = Math.min(1.0, outerCoronaColor.b * 1.1);
            this.outerCoronaMaterial.uniforms.coronaColor.value = outerCoronaColor;
        }
        
        // Update light color
        if (this.sunLight) {
            this.sunLight.color.setHex(color);
            // Adjust light intensity based on temperature and apply the multiplier
            this.sunLight.intensity = (1.5 + (temperature / 10000)) * lightIntensityMultiplier;
        }
        
        console.log(`Updated sun to type ${this.sunType}, color: ${color.toString(16)}, intensity multiplier: ${lightIntensityMultiplier}`);
    }
    
    getRadius() {
        return 3600; // Return the radius of the sun's boundary (including corona)
    }
    
    getPosition() {
        return new THREE.Vector3(0, 0, 0); // Sun is at the center
    }
    
    update(deltaTime = 0.016) {
        if (!this.sun) return;
        
        // Update time for all shaders
        this.time += deltaTime * 0.4; // Slow down the animation slightly
        
        if (this.sunMaterial && this.sunMaterial.uniforms.time) {
            this.sunMaterial.uniforms.time.value = this.time;
        }
        
        if (this.coronaMaterial && this.coronaMaterial.uniforms.time) {
            this.coronaMaterial.uniforms.time.value = this.time;
        }
        
        if (this.outerCoronaMaterial && this.outerCoronaMaterial.uniforms.time) {
            this.outerCoronaMaterial.uniforms.time.value = this.time;
        }
        
        // Add flickering effect to simulate solar activity
        this.sunFlickerIntensity += this.sunFlickerDirection;
        if (this.sunFlickerIntensity > 1.2) {
            this.sunFlickerIntensity = 1.2;
            this.sunFlickerDirection = -Math.random() * 0.03;
        } else if (this.sunFlickerIntensity < 0.9) {
            this.sunFlickerIntensity = 0.9;
            this.sunFlickerDirection = Math.random() * 0.03;
        }
        
        // Apply flickering to light intensity - preserve any multiplier that was applied
        if (this.sunLight) {
            const intensityMultiplier = this.sunLight._intensityMultiplier || 1.0;
            const baseIntensity = 1.5 + (this.sunType === 'G' ? 0.5 : 
                                       (this.sunType === 'O' || this.sunType === 'B') ? 1.5 : 
                                       (this.sunType === 'M') ? 0.2 : 0.8);
            this.sunLight.intensity = baseIntensity * this.sunFlickerIntensity * intensityMultiplier;
        }
        
        // Update camera-relative uniforms if available
        if (this.scene && this.scene.camera) {
            const viewVector = new THREE.Vector3().subVectors(
                this.scene.camera.position,
                this.sun.position
            ).normalize();
            
            if (this.coronaMaterial && this.coronaMaterial.uniforms.viewVector) {
                this.coronaMaterial.uniforms.viewVector.value = viewVector;
            }
            
            if (this.outerCoronaMaterial && this.outerCoronaMaterial.uniforms.viewVector) {
                this.outerCoronaMaterial.uniforms.viewVector.value = viewVector;
            }
        }
    }
}