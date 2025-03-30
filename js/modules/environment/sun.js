// sun.js - Creates and manages the sun object (central star) with volumetric rendering

import * as THREE from 'three';

export class Sun {
    constructor(scene) {
        this.scene = scene;
        this.sun = null;
        this.sunFlickerIntensity = 1.0;
        this.sunFlickerDirection = 0.02;
        this.time = 0;
        this.sunType = 'G'; // Default sun type (G-type like our Sun)
        this.lensFlares = []; // Store multiple flare elements
        this.createSun();
    }
    
    createSun() {
        // Create a group to hold all sun-related elements
        this.sun = new THREE.Group();
        this.sun.name = 'sun'; // Add name for easier identification
        this.scene.add(this.sun);
        
        // Create the core sun sphere with increased size
        const sunGeometry = new THREE.SphereGeometry(1000, 64, 64); // Reduced from 1200
        
        // Use advanced shader material for the sun surface
        const sunMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                sunColor: { value: new THREE.Color(0xff7700) },
                surfaceDetail: { value: 1.2 }, // Increased detail
                surfaceDistortion: { value: 0.3 }, // Increased distortion
                sunActivity: { value: 0.8 } // Increased activity
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
                    
                    for (int i = 0; i < 7; ++i) { // Increased iterations for more detail
                        v += a * noise(x);
                        x = x * 2.0 + shift;
                        a *= 0.5;
                    }
                    
                    return v;
                }
                
                void main() {
                    // Calculate dynamic granulation based on noise
                    vec3 surfacePos = vPosition * surfaceDetail * 0.01;
                    float granulation = fbm(surfacePos + time * 0.15); // Increased speed
                    
                    // Calculate solar prominences and flares with more dynamic movement
                    float flareBase = fbm(surfacePos * 2.5 + time * 0.3); // Increased detail and speed
                    float flares = pow(flareBase, 1.8) * sunActivity;
                    flares = smoothstep(0.65, 0.9, flares); // Lower threshold for more flares
                    
                    // Create dynamic hotspots that move across the surface
                    float hotspots = fbm(surfacePos * 3.0 + time * 0.2) * fbm(surfacePos * 1.5 - time * 0.1);
                    hotspots = pow(hotspots, 3.0) * 1.5;
                    
                    // Calculate normal distortion for surface waves with more turbulence
                    vec3 distortedNormal = vNormal;
                    distortedNormal.x += noise(surfacePos * 6.0 + time * 0.15) * surfaceDistortion;
                    distortedNormal.y += noise(surfacePos * 6.0 + time * 0.2) * surfaceDistortion;
                    distortedNormal.z += noise(surfacePos * 6.0 + time * 0.17) * surfaceDistortion;
                    distortedNormal = normalize(distortedNormal);
                    
                    // Edge brightness (limb darkening inverse - brighter at the edges)
                    float edgeBrightness = 1.0 - dot(distortedNormal, vec3(0.0, 0.0, 1.0));
                    edgeBrightness = pow(edgeBrightness, 2.5) * 0.4; // Reduced power and multiplier
                    
                    // Create fire-like color variations
                    vec3 baseColor = sunColor;
                    vec3 hotColor = vec3(1.0, 0.8, 0.4); // Yellow-white hot spots
                    vec3 flareColor = vec3(1.0, 0.6, 0.3); // Orange-red flares
                    
                    // Combine effects for a more dynamic fireball look
                    vec3 finalColor = baseColor * (1.0 + granulation * 0.4);
                    finalColor = mix(finalColor, hotColor, hotspots);
                    finalColor += flareColor * flares;
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
        const coronaGeometry = new THREE.SphereGeometry(2000, 64, 64); // Reduced from 2400
        const coronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coronaColor: { value: new THREE.Color(0xff9940) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) },
                turbulence: { value: 0.6 } // Medium turbulence
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vIntensity;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    
                    // Calculate view-dependent intensity with less view dependency
                    vec3 viewDir = normalize(viewVector);
                    // Use a lower exponent and add a base intensity to ensure visibility from all angles
                    vIntensity = pow(1.15 - dot(vNormal, viewDir), 1.5) * 0.8 + 0.2;
                    
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
                    float turbulenceFactor = fbm(vPosition * 0.005 + time * 0.15) * turbulence;
                    float finalIntensity = vIntensity * (1.0 + turbulenceFactor);
                    
                    // Create dynamic wisps in the corona for a fire-like effect
                    float wisps = fbm(vPosition * 0.01 - time * 0.05) * fbm(vPosition * 0.02 + time * 0.1);
                    wisps = pow(wisps, 2.0) * 0.5;
                    
                    // HDR color with variation
                    vec3 finalColor = coronaColor * (finalIntensity + wisps);
                    
                    // Add color variation based on intensity
                    if (finalIntensity > 0.7) {
                        finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), (finalIntensity - 0.7) * 3.0);
                    }
                    
                    // Add transparency at the edges for volumetric feel
                    float alpha = smoothstep(0.0, 0.15, finalIntensity + wisps * 0.5);
                    
                    gl_FragColor = vec4(finalColor, alpha * 0.9); // Slightly more transparent
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
        const outerCoronaGeometry = new THREE.SphereGeometry(3000, 32, 32); // Reduced from 3600
        const outerCoronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coronaColor: { value: new THREE.Color(0xff8800) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float vIntensity;
                varying vec3 vPosition;
                
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(viewVector);
                    // Less extreme view dependency to ensure more consistent appearance
                    vIntensity = pow(1.05 - dot(vNormal, vNormel), 2.0) * 0.7 + 0.3;
                    vPosition = position;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 coronaColor;
                varying float vIntensity;
                varying vec3 vPosition;
                
                // Simple noise for variation
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
                
                void main() {
                    // Apply time-based pulsing with noise variation
                    float noiseVal = noise(vPosition * 0.002 + time * 0.1);
                    float pulseIntensity = vIntensity * (1.0 + 0.2 * sin(time + noiseVal * 5.0));
                    
                    // Add subtle fire-like variations
                    pulseIntensity += noiseVal * 0.2;
                    
                    vec3 glow = coronaColor * pulseIntensity;
                    gl_FragColor = vec4(glow, pulseIntensity * 0.4); // Reduced from 0.6
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide
        });
        
        const outerCoronaMesh = new THREE.Mesh(outerCoronaGeometry, outerCoronaMaterial);
        this.sun.add(outerCoronaMesh);
        
        // Add sun light with increased intensity but focused on a smaller range
        const sunLight = new THREE.PointLight(0xFFFAF0, 200000, 100000, 2); // Using pure white with a hint of warmth
        this.sun.add(sunLight);
        
        // Create multiple lens flare elements distributed around the sun
        this.createFireballFlares();
        
        // Store material references for updates
        this.sunMaterial = sunMaterial;
        this.coronaMaterial = coronaMaterial;
        this.outerCoronaMaterial = outerCoronaMaterial;
        this.sunLight = sunLight;

        // Store base light intensity for balancing
        this.baseLightIntensity = 200000; // Increased from 100000
        
        // Add a directional light for casting shadows across the solar system
        const sunDirectionalLight = new THREE.DirectionalLight(0xFFFAF0, 1.5);
        sunDirectionalLight.position.set(0, 0, 0);
        sunDirectionalLight.castShadow = true;
        
        // Configure shadow mapping for large-scale space scene
        sunDirectionalLight.shadow.mapSize.width = 4096;
        sunDirectionalLight.shadow.mapSize.height = 4096;
        sunDirectionalLight.shadow.camera.near = 1000;
        sunDirectionalLight.shadow.camera.far = 100000;
        sunDirectionalLight.shadow.camera.left = -50000;
        sunDirectionalLight.shadow.camera.right = 50000;
        sunDirectionalLight.shadow.camera.top = 50000;
        sunDirectionalLight.shadow.camera.bottom = -50000;
        sunDirectionalLight.shadow.bias = -0.00005;
        sunDirectionalLight.shadow.normalBias = 0.02;
        sunDirectionalLight.shadow.radius = 2; // For softer shadows

        // Use PCFSoftShadowMap for better shadow quality
        if (this.scene && this.scene.renderer) {
            this.scene.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        this.sun.add(sunDirectionalLight);
        this.sunDirectionalLight = sunDirectionalLight;
    }
    
    // New method to create multiple flare elements
    createFireballFlares() {
        // Load different flare textures
        const flareTextures = [
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare0.png',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare2.png',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare3.png'
        ];
        
        const textureLoader = new THREE.TextureLoader();
        
        // Clear any existing flares
        this.lensFlares.forEach(flare => {
            if (flare.parent) flare.parent.remove(flare);
        });
        this.lensFlares = [];
        
        // Create main central flare
        const mainFlareTexture = textureLoader.load(flareTextures[0]);
        mainFlareTexture.colorSpace = THREE.SRGBColorSpace;
        const mainFlare = new THREE.Sprite(new THREE.SpriteMaterial({
            map: mainFlareTexture,
            color: 0xffaa55,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        }));
        mainFlare.scale.set(700, 700, 1.0);
        this.sun.add(mainFlare);
        this.lensFlares.push(mainFlare);
        
        // Create smaller surrounding flares
        const flareCount = 8;
        const radius = 300; // Distance from center
        
        for (let i = 0; i < flareCount; i++) {
            // Alternate between flare textures
            const textureIndex = 1 + (i % 2);
            const flareTexture = textureLoader.load(flareTextures[textureIndex]);
            flareTexture.colorSpace = THREE.SRGBColorSpace;
            
            // Create flare with varying colors
            const flare = new THREE.Sprite(new THREE.SpriteMaterial({
                map: flareTexture,
                color: i % 3 === 0 ? 0xffcc77 : (i % 3 === 1 ? 0xff8855 : 0xff6622),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthTest: false
            }));
            
            // Position around the sun at different angles
            const angle = (i / flareCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            flare.position.set(x, y, 0);
            
            // Random size variations
            const size = 200 + Math.random() * 200;
            flare.scale.set(size, size, 1.0);
            
            // Store in array and add to sun
            this.sun.add(flare);
            this.lensFlares.push(flare);
            
            // Create an additional layer of smaller flares
            if (i % 2 === 0) {
                const smallFlareTexture = textureLoader.load(flareTextures[i % 3]);
                smallFlareTexture.colorSpace = THREE.SRGBColorSpace;
                
                const smallFlare = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: smallFlareTexture,
                    color: 0xffaa22,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthTest: false
                }));
                
                // Position at twice the radius
                const farRadius = radius * 2;
                const farAngle = angle + (Math.random() * 0.2 - 0.1);
                const farX = Math.cos(farAngle) * farRadius;
                const farY = Math.sin(farAngle) * farRadius;
                smallFlare.position.set(farX, farY, 0);
                
                // Smaller size
                const smallSize = 100 + Math.random() * 150;
                smallFlare.scale.set(smallSize, smallSize, 1.0);
                
                this.sun.add(smallFlare);
                this.lensFlares.push(smallFlare);
            }
        }
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
            // Adjust light intensity based on temperature and physical units
            this.sunLight.intensity = (200000 + (temperature / 10000) * 200000) * lightIntensityMultiplier;
        }
        
        // Update lens flare colors
        this.lensFlares.forEach((flare, index) => {
            if (flare && flare.material) {
                const flareColor = new THREE.Color(color);
                // Add variations to the flare colors
                if (index % 3 === 0) {
                    flareColor.r = Math.min(1.0, flareColor.r * 1.2);
                } else if (index % 3 === 1) {
                    flareColor.g = Math.min(1.0, flareColor.g * 1.1);
                }
                flare.material.color = flareColor;
            }
        });
        
        console.log(`Updated sun to type ${this.sunType}, color: ${color.toString(16)}, intensity multiplier: ${lightIntensityMultiplier}`);
    }
    
    getRadius() {
        return 3000; // Return the radius of the sun's boundary (reduced from 3600)
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
            const baseIntensity = this.baseLightIntensity + (this.sunType === 'G' ? 30000 : 
                                         (this.sunType === 'O' || this.sunType === 'B') ? 100000 : 
                                         (this.sunType === 'M') ? 10000 : 50000);
            
            // Apply view-dependent intensity adjustment
            let viewDependentMultiplier = 1.0;
            if (this.scene && this.scene.camera) {
                // Calculate angle between camera and sun
                const viewVector = new THREE.Vector3().subVectors(
                    this.scene.camera.position,
                    this.sun.position
                ).normalize();
                
                const cameraNormal = new THREE.Vector3(0, 0, -1).applyQuaternion(this.scene.camera.quaternion);
                const angleToCam = viewVector.dot(cameraNormal);
                
                // Reduce intensity when looking directly at sun to prevent overwhelming brightness
                if (angleToCam > 0.8) {
                    viewDependentMultiplier = 0.5 + (1.0 - angleToCam) * 0.5;
                }
            }
            
            this.sunLight.intensity = baseIntensity * this.sunFlickerIntensity * intensityMultiplier * viewDependentMultiplier;
        }
        
        // Update directional light for shadow casting
        if (this.sunDirectionalLight && this.scene && this.scene.camera) {
            // Get camera position
            const cameraPos = this.scene.camera.position.clone();
            
            // Calculate vector from sun to camera
            const sunToCam = cameraPos.clone().sub(this.sun.position).normalize();
            
            // Set the directional light to point toward the camera
            // This ensures shadows are cast in the correct direction relative to the viewer
            const distanceFactor = 15000; // Large distance to ensure the light covers the scene
            const lightPos = sunToCam.clone().multiplyScalar(-distanceFactor).add(this.sun.position);
            
            // Update light position
            this.sunDirectionalLight.position.copy(lightPos);
            this.sunDirectionalLight.target.position.copy(this.sun.position);
            
            // Ensure the target is in the scene
            if (!this.sunDirectionalLight.target.parent) {
                this.scene.add(this.sunDirectionalLight.target);
            }
            
            // Adjust shadow camera frustum based on camera distance from sun
            const camDistanceToSun = cameraPos.distanceTo(this.sun.position);
            const shadowSize = Math.max(50000, camDistanceToSun * 2);
            
            this.sunDirectionalLight.shadow.camera.left = -shadowSize;
            this.sunDirectionalLight.shadow.camera.right = shadowSize;
            this.sunDirectionalLight.shadow.camera.top = shadowSize;
            this.sunDirectionalLight.shadow.camera.bottom = -shadowSize;
            this.sunDirectionalLight.shadow.camera.updateProjectionMatrix();
            
            // Apply flickering to directional light intensity as well
            this.sunDirectionalLight.intensity = 1.5 * this.sunFlickerIntensity;
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
            
            // Animate the flares for a more dynamic fireball effect
            const time = this.time;
            this.lensFlares.forEach((flare, index) => {
                if (!flare) return;
                
                // Scale flares with slight pulsing
                const pulseSpeed = 0.5 + (index % 3) * 0.3;
                const pulseFactor = 0.9 + Math.sin(time * pulseSpeed + index) * 0.1;
                
                // Different behavior for the main flare vs the surrounding flares
                if (index === 0) {
                    // Main flare - just pulse
                    const mainScale = 700 * pulseFactor;
                    flare.scale.set(mainScale, mainScale, 1.0);
                } else {
                    // Surrounding flares - move slightly and pulse
                    const originalSize = 200 + (index % 3) * 100;
                    const size = originalSize * pulseFactor;
                    flare.scale.set(size, size, 1.0);
                    
                    // Slightly move position in circular pattern for surrounding flares
                    if (flare.userData.originalPos) {
                        const orbit = 0.1 + (index % 5) * 0.05;
                        const orbitSpeed = 0.3 + (index % 4) * 0.1;
                        flare.position.x = flare.userData.originalPos.x + Math.sin(time * orbitSpeed) * orbit * originalSize;
                        flare.position.y = flare.userData.originalPos.y + Math.cos(time * orbitSpeed) * orbit * originalSize;
                    } else {
                        // Store original position on first update
                        flare.userData.originalPos = flare.position.clone();
                    }
                }
                
                // Adjust opacity based on camera angle 
                const angleToCam = viewVector.dot(new THREE.Vector3(0, 0, -1).applyQuaternion(this.scene.camera.quaternion));
                
                // More balanced opacity calculations to maintain visibility across viewing angles
                if (angleToCam > 0.5) {
                    // Gentler falloff when looking more directly at the sun
                    const opacity = Math.min(1.0, (angleToCam - 0.5) / 0.3 + 0.3);
                    flare.material.opacity = opacity;
                    flare.visible = true;
                } else {
                    // Still show flares at wider angles, with less extreme falloff
                    const reducedOpacity = Math.max(0.1, (angleToCam + 0.5) / 1.0) * 0.5;
                    flare.material.opacity = reducedOpacity;
                    flare.visible = true; // Always keep visible for more consistency
                }
            });
        }
    }
    
    // New method to toggle shadow camera helper for debugging
    toggleShadowHelper(enabled) {
        // Remove existing helper if any
        if (this.shadowHelper && this.shadowHelper.parent) {
            this.shadowHelper.parent.remove(this.shadowHelper);
            this.shadowHelper = null;
        }
        
        if (enabled && this.sunDirectionalLight && this.scene) {
            // Create and add shadow camera helper
            this.shadowHelper = new THREE.CameraHelper(this.sunDirectionalLight.shadow.camera);
            this.scene.add(this.shadowHelper);
            console.log("Shadow camera helper enabled - showing sun shadow frustum");
        }
    }
}