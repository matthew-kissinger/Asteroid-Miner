// engines.js - Creates engine array, particles, and power control for the Star Dreadnought

import * as THREE from 'three';

export class DreadnoughtEngines {
    constructor() {
        this.engineGlows = [];
        this.engineTrailParticles = null;
    }
    
    createEngineArray(scale, ship) {
        // Create engine array at the back of the ship
        const engineRadius = scale * 0.018;
        const engineLength = scale * 0.04;
        const engineZ = scale * 0.48; // Position at the back
        const engineY = scale * 0.01; // Slightly above center line
        
        // Engine housing
        const engineHousingWidth = scale * 0.2;
        const engineHousingHeight = scale * 0.05;
        const engineHousingLength = scale * 0.06;
        
        const housingGeometry = new THREE.BoxGeometry(engineHousingWidth, engineHousingHeight, engineHousingLength);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.8,
            roughness: 0.4
        });
        
        const engineHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        engineHousing.position.set(0, engineY, engineZ);
        engineHousing.castShadow = true;
        engineHousing.receiveShadow = true;
        ship.add(engineHousing);
        
        // Engine exhaust material - blue glow for Star Wars style
        const engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x3366ff,
            emissive: 0x3366ff,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.7
        });
        
        // Glow material (fully emissive)
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x3366ff,
            emissive: 0x3366ff,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.8
        });
        
        // Create engine exhausts - two rows of engines for Star Destroyer style
        const engineRows = 2;
        const enginesPerRow = 5;
        const verticalSpacing = engineHousingHeight * 0.5;
        
        for (let row = 0; row < engineRows; row++) {
            const rowY = engineY - verticalSpacing * (row - 0.5);
            
            for (let i = 0; i < enginesPerRow; i++) {
                // Distribute engines across the width
                const posX = (i - (enginesPerRow - 1) / 2) * (engineHousingWidth / (enginesPerRow - 1) * 0.8);
                
                // Engine exhaust
                const engineGeometry = new THREE.CylinderGeometry(engineRadius, engineRadius * 1.5, engineLength, 16);
                const engine = new THREE.Mesh(engineGeometry, engineMaterial);
                
                // Position and orient the engine
                engine.position.set(posX, rowY, engineZ + engineHousingLength * 0.5);
                engine.rotation.x = Math.PI / 2; // Orient horizontally
                
                ship.add(engine);
                
                // Add engine glow with additional outer glow
                const glowGeometry = new THREE.SphereGeometry(engineRadius * 1.6, 16, 16);
                const glow = new THREE.Mesh(glowGeometry, glowMaterial.clone());
                glow.position.set(posX, rowY, engineZ + engineHousingLength * 0.5 + engineLength * 1.1);
                
                ship.add(glow);
                this.engineGlows.push(glow);
                
                // Add additional outer glow for more dramatic effect
                const outerGlowGeometry = new THREE.SphereGeometry(engineRadius * 2.5, 16, 16);
                const outerGlowMaterial = glowMaterial.clone();
                outerGlowMaterial.opacity = 0.4;
                const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
                outerGlow.position.copy(glow.position);
                
                ship.add(outerGlow);
                this.engineGlows.push(outerGlow);
            }
        }
        
        // Add engine trail particles
        this.createEngineTrailParticles(scale, engineZ, engineHousingWidth, ship);
        
        return { engineHousing, engineGlows: this.engineGlows };
    }
    
    createEngineTrailParticles(scale, engineZ, width, ship) {
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create arrays for particle properties
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Engine positions to emit particles from
        const enginePositions = [];
        const enginesPerRow = 5;
        
        for (let i = 0; i < enginesPerRow; i++) {
            const posX = (i - (enginesPerRow - 1) / 2) * (width / (enginesPerRow - 1) * 0.8);
            enginePositions.push(posX);
        }
        
        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Choose an engine position to emit from
            const engineIndex = Math.floor(Math.random() * enginePositions.length);
            const engineX = enginePositions[engineIndex];
            
            // Random offset from engine
            const offsetX = (Math.random() - 0.5) * scale * 0.01;
            const offsetY = (Math.random() - 0.5) * scale * 0.01;
            
            // Position behind the engine
            const trailLength = Math.random() * scale * 0.5;
            
            positions[i3] = engineX + offsetX;     // x
            positions[i3 + 1] = offsetY;           // y
            positions[i3 + 2] = engineZ + engineX * 0.05 + trailLength; // z with slight angle
            
            // Blue-white colors for engine glow
            colors[i3] = 0.5 + Math.random() * 0.5;     // r
            colors[i3 + 1] = 0.7 + Math.random() * 0.3; // g
            colors[i3 + 2] = 1.0;                       // b
            
            // Different sizes for depth
            sizes[i] = (Math.random() * 0.5 + 0.5) * scale * 0.004;
        }
        
        // Add attributes to geometry
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Particle material with custom shader
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    
                    // Animate size with time
                    float pulseFactor = sin(time * 2.0 + position.z * 0.1) * 0.3 + 0.7;
                    
                    // Calculate position
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Size attenuation
                    gl_PointSize = size * pulseFactor * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                
                void main() {
                    // Sample soft particle texture
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    
                    // Apply color
                    gl_FragColor = vec4(vColor, texColor.r);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        // Create particle system
        this.engineTrailParticles = new THREE.Points(particleGeometry, particleMaterial);
        ship.add(this.engineTrailParticles);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            32, 32, 0, 32, 32, 32
        );
        
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    // Set engines power level (0-1)
    setEnginesPower(power) {
        // Adjust engine glow intensity based on power level
        this.engineGlows.forEach((glow, index) => {
            // Alternate between main glow and outer glow
            const isMainGlow = index % 2 === 0;
            
            if (isMainGlow) {
                // Main engine glow - brighter
                glow.material.emissiveIntensity = 0.8 + power * 1.2;
                glow.material.opacity = 0.5 + power * 0.5;
            } else {
                // Outer engine glow - softer
                glow.material.emissiveIntensity = 0.5 + power * 0.8;
                glow.material.opacity = 0.2 + power * 0.3;
            }
            
            // Scale the glow with power
            const scale = 1 + power * 0.8;
            glow.scale.set(scale, scale, scale * 1.2); // Stretch slightly on z-axis
        });
        
        // Update engine trail particles
        if (this.engineTrailParticles) {
            this.engineTrailParticles.visible = power > 0.2;
            
            // Scale particle sizes based on power
            if (this.engineTrailParticles.geometry.attributes.size) {
                const sizes = this.engineTrailParticles.geometry.attributes.size.array;
                const baseSizes = this.engineTrailParticles.userData.baseSizes || 
                                  Array.from(sizes); // Store original sizes if not saved
                                  
                // Save original sizes
                if (!this.engineTrailParticles.userData.baseSizes) {
                    this.engineTrailParticles.userData.baseSizes = baseSizes;
                }
                
                // Scale sizes
                for (let i = 0; i < sizes.length; i++) {
                    sizes[i] = baseSizes[i] * (1 + power * 2);
                }
                
                this.engineTrailParticles.geometry.attributes.size.needsUpdate = true;
            }
        }
    }
    
    // Update engine trail particles animation
    updateEngineTrails() {
        if (this.engineTrailParticles && this.engineTrailParticles.material.uniforms) {
            this.engineTrailParticles.material.uniforms.time.value += 0.02;
        }
    }
}