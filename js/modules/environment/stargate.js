// stargate.js - Creates and manages the stargate

import * as THREE from 'three';

export class Stargate {
    constructor(scene) {
        this.scene = scene;
        this.stargate = null;
        this.navLights = [];
        this.portalParticles = [];
        this.createStargate();
    }
    
    createStargate() {
        // Create a stargate group
        const stargateGroup = new THREE.Group();
        stargateGroup.name = 'stargate';
        
        // Main ring - matte black
        const ringGeometry = new THREE.TorusGeometry(1000, 200, 32, 100);
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: 0.9,
          metalness: 0.1,
          emissive: 0x000000
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        stargateGroup.add(ring);
        
        // Neon turquoise accent rings
        const createAccentRing = (radius, tubeRadius, position = {x: 0, y: 0, z: 0}, rotation = {x: 0, y: 0, z: 0}) => {
          const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);
          const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.5,
            roughness: 0.2,
            metalness: 0.8
          });
          const accentRing = new THREE.Mesh(geometry, material);
          accentRing.position.set(position.x, position.y, position.z);
          accentRing.rotation.set(rotation.x, rotation.y, rotation.z);
          return accentRing;
        };
        
        // Add accent rings on outer edges - make them brighter
        const outerRing1 = createAccentRing(1060, 10);
        const outerRing2 = createAccentRing(940, 10);
        // Add an inner ring to enhance portal effect
        const innerRing = createAccentRing(850, 5);
        stargateGroup.add(outerRing1);
        stargateGroup.add(outerRing2);
        stargateGroup.add(innerRing);
        
        // Create enhanced turquoise portal in the center
        this.createPortalEffect(stargateGroup);
        
        // Add neon accent details
        const detailsGroup = this.createNeonDetails();
        stargateGroup.add(detailsGroup);
        
        // Position the stargate at 2x height from the original position
        stargateGroup.position.set(0, 10000, 0);
        stargateGroup.rotation.x = Math.PI / 2; // Horizontal orientation
        
        // Add to scene
        this.scene.add(stargateGroup);
        this.stargate = stargateGroup;
        
        // Create a counter-rotating inner ring for additional portal effect
        this.createCounterRotatingRing(stargateGroup);
    }
    
    createCounterRotatingRing(parentGroup) {
        // Create a separate rotating group for the inner portal structure
        const innerStructure = new THREE.Group();
        
        // Add a thin ring that rotates opposite to the main stargate
        const thinRingGeometry = new THREE.TorusGeometry(820, 3, 16, 100);
        const thinRingMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        
        // Create 3 counter-rotating rings
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(thinRingGeometry, thinRingMaterial.clone());
            ring.rotation.x = Math.PI * i / 3;
            ring.rotation.y = Math.PI * i / 3;
            innerStructure.add(ring);
        }
        
        parentGroup.add(innerStructure);
        this.counterRotatingRing = innerStructure;
    }
    
    createPortalEffect(parentGroup) {
        // Enhanced custom shader material for the portal
        const portalShaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(1024, 1024) },
            baseColor: { value: new THREE.Color(0x00ffff) }
          },
          vertexShader: `
            varying vec2 vUv;
            
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float time;
            uniform vec2 resolution;
            uniform vec3 baseColor;
            varying vec2 vUv;
            
            // Simple noise function
            float noise(vec2 p) {
              return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            // Smoothed noise
            float smoothNoise(vec2 p) {
              vec2 ip = floor(p);
              vec2 fp = fract(p);
              
              vec2 u = fp * fp * (3.0 - 2.0 * fp);
              
              float a = noise(ip);
              float b = noise(ip + vec2(1.0, 0.0));
              float c = noise(ip + vec2(0.0, 1.0));
              float d = noise(ip + vec2(1.0, 1.0));
              
              return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }
            
            // Fractal Brownian Motion
            float fbm(vec2 p) {
              float value = 0.0;
              float amplitude = 0.5;
              float frequency = 3.0;
              
              for (int i = 0; i < 6; i++) {
                value += amplitude * smoothNoise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
              }
              
              return value;
            }
            
            void main() {
              // Convert uv to be centered at (0.5, 0.5) with range -1 to 1
              vec2 centeredUV = (vUv - 0.5) * 2.0;
              float dist = length(centeredUV);
              
              // Create angle for rotation
              float angle = atan(centeredUV.y, centeredUV.x);
              
              // Enhanced swirling effect parameters - more aggressive
              float swirl = sin(angle * 6.0 + time * 2.0) * 0.5 + 0.5;
              float pulse = sin(time * 0.8) * 0.5 + 0.5;
              
              // Create more distorted coordinates for noise - enhances warp feel
              vec2 distortedUV = vec2(
                centeredUV.x + sin(time * 0.7 + centeredUV.y * 5.0) * 0.2,
                centeredUV.y + cos(time * 0.6 + centeredUV.x * 5.0) * 0.2
              );
              
              // Create noise patterns - more contrast
              float noiseValue = fbm(distortedUV * 3.0 + time * 0.3);
              float ripple = sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5;
              
              // Combine effects with more intensity
              float alpha = smoothstep(0.9, 0.0, dist);
              float intensity = mix(noiseValue, ripple, 0.7) * swirl * pulse;
              
              // Enhanced portal colors - bright cyan to deep blue
              vec3 darkColor = vec3(0.0, 0.1, 0.3);
              vec3 brightColor = vec3(0.0, 1.0, 1.0) * 2.0;
              vec3 accentColor = vec3(0.3, 0.8, 1.0);
              
              // More complex color mixing
              vec3 finalColor = mix(darkColor, brightColor, intensity);
              finalColor = mix(finalColor, accentColor, ripple * swirl);
              
              // Enhanced edge glow for portal effect
              float edgeGlow = smoothstep(0.8, 0.4, dist) * smoothstep(0.0, 0.6, dist);
              finalColor = mix(finalColor, brightColor, edgeGlow * pulse);
              
              // Add portal event horizon effect
              float eventHorizon = smoothstep(0.8, 0.78, dist) * 2.0;
              finalColor += vec3(0.0, 1.0, 1.0) * eventHorizon;
              
              gl_FragColor = vec4(finalColor, alpha);
            }
          `,
          transparent: true,
          side: THREE.DoubleSide
        });
        
        // Create portal disc using the shader material
        const portalGeometry = new THREE.CircleGeometry(800, 128);
        const portal = new THREE.Mesh(portalGeometry, portalShaderMaterial);
        parentGroup.add(portal);
        
        // Enhanced portal glow light
        const portalLight = new THREE.PointLight(0x00ffff, 400, 2000, 2);
        portalLight.position.set(0, 0, 0);
        parentGroup.add(portalLight);
        
        // Add some more volumetric effects around the portal
        const createPortalWisps = () => {
          const wispGeometry = new THREE.TorusGeometry(650, 10, 8, 100);
          const wispMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
          });
        
          const wisp = new THREE.Mesh(wispGeometry, wispMaterial);
          wisp.rotation.x = Math.random() * Math.PI;
          wisp.rotation.y = Math.random() * Math.PI;
          
          // Store animation parameters - more dramatic for enhanced effect
          wisp.userData = {
            rotationSpeed: {
              x: (Math.random() - 0.5) * 0.02,  // 10x faster rotation
              y: (Math.random() - 0.5) * 0.02,
              z: (Math.random() - 0.5) * 0.02
            },
            pulseSpeed: 0.5 + Math.random() * 0.3
          };
          
          this.portalParticles.push(wisp);
          return wisp;
        };
        
        // Add more wisps for enhanced effect
        for (let i = 0; i < 8; i++) {
          parentGroup.add(createPortalWisps());
        }
        
        // Store the shader material for animation updates
        this.portalShaderMaterial = portalShaderMaterial;
        this.portalLight = portalLight;
    }
  
    createNeonDetails() {
        const detailsGroup = new THREE.Group();
        
        // Create evenly spaced neon accents around the ring
        const createNeonAccent = (angle) => {
          const accentGroup = new THREE.Group();
          
          // Neon light beam
          const beamGeometry = new THREE.CylinderGeometry(10, 10, 300, 8);
          const beamMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
          });
          const beam = new THREE.Mesh(beamGeometry, beamMaterial);
          beam.rotation.x = Math.PI / 2; // Align with ring
          
          // Light source for glow
          const light = new THREE.PointLight(0x00ffff, 100, 400, 2);
          light.position.set(0, 0, 0);
          
          accentGroup.add(beam);
          accentGroup.add(light);
          
          // Position on the ring
          accentGroup.position.x = Math.cos(angle) * 1000;
          accentGroup.position.y = Math.sin(angle) * 1000;
          accentGroup.rotation.z = angle - Math.PI / 2; // Orient toward center
          
          // Store for animation
          light.userData = {
            originalIntensity: light.intensity,
            phase: Math.random() * Math.PI * 2
          };
          
          this.navLights.push({ light, lightMesh: beam });
          
          return accentGroup;
        };
        
        // Add 8 neon accents evenly around the ring
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          detailsGroup.add(createNeonAccent(angle));
        }
        
        return detailsGroup;
    }
    
    getPosition() {
        // Updated to 2x height from the sun
        return new THREE.Vector3(0, 10000, 0);
    }
    
    getRegionInfo() {
        // Updated center position to match new height
        return {
            center: new THREE.Vector3(0, 10000, 0),
            radius: 2000
        };
    }
    
    update() {
        // Animate navigation lights with pulsing effect
        if (this.navLights) {
          this.navLights.forEach(({ light, lightMesh }) => {
                const time = Date.now() * 0.001;
                const flicker = 0.7 + 0.3 * Math.sin(time * 2 + light.userData.phase);
                
                light.intensity = light.userData.originalIntensity * flicker;
                
            // Also update the light beam material
            if (lightMesh.material) {
              lightMesh.material.emissiveIntensity = flicker;
              lightMesh.material.opacity = 0.5 + (flicker * 0.5);
            }
          });
        }
        
        // Update shader time for the portal effect
        if (this.portalShaderMaterial) {
          this.portalShaderMaterial.uniforms.time.value = Date.now() * 0.001;
          
          // Make portal light pulse with time
          if (this.portalLight) {
            const time = Date.now() * 0.001;
            this.portalLight.intensity = 400 + Math.sin(time * 2.0) * 150;
          }
        }
        
        // Animate the portal wisp effects
        if (this.portalParticles) {
          this.portalParticles.forEach(particle => {
            const time = Date.now() * 0.001;
            
            // Apply rotation based on stored rotation speeds
            if (particle.userData.rotationSpeed) {
              particle.rotation.x += particle.userData.rotationSpeed.x;
              particle.rotation.y += particle.userData.rotationSpeed.y;
              particle.rotation.z += particle.userData.rotationSpeed.z;
            }
            
            // Apply subtle scale pulsing if present
            if (particle.userData.pulseSpeed) {
              const pulse = 0.9 + 0.2 * Math.sin(time * particle.userData.pulseSpeed);
              particle.scale.set(pulse, pulse, pulse);
            }
          });
        }
        
        // Update counter-rotating ring
        if (this.counterRotatingRing) {
          this.counterRotatingRing.rotation.x += 0.006; // Counter rotate
          this.counterRotatingRing.rotation.y += 0.009;
          this.counterRotatingRing.rotation.z -= 0.003;
        }
        
        // Rotate the stargate on all three axes for a more dynamic spinning effect (30x faster)
        if (this.stargate) {
          this.stargate.rotation.x += 0.003;   // 30x faster rotation on X axis (was 0.0001)
          this.stargate.rotation.y += 0.0045;  // 30x faster rotation on Y axis (was 0.00015)
          this.stargate.rotation.z += 0.006;   // 30x faster rotation on Z axis (was 0.0002)
        }
    }
} 