// particles.js - Creates teleport particle systems for the Star Dreadnought

import * as THREE from 'three';

export class TeleportParticles {
    static createTeleportParticles(scale, ship) {
        // Create particle system for teleport beam
        const particleCount = 800; // More particles
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create arrays for particle properties
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Initialize particle positions in a cone shape with more variation
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Determine if this should be an inner or outer particle
            const isInnerBeam = Math.random() > 0.3;
            
            // Random position within the cone or surrounding area
            const radius = isInnerBeam ? 
                Math.random() * scale * 0.03 : // Inner beam
                scale * 0.03 + Math.random() * scale * 0.17; // Outer beam area
            
            const theta = Math.random() * Math.PI * 2;
            const height = -(Math.random() * scale * 0.8); // Full beam height
            
            // Convert to Cartesian
            positions[i3] = radius * Math.cos(theta);     // x
            positions[i3 + 1] = height;                   // y (negative for downward direction)
            positions[i3 + 2] = radius * Math.sin(theta); // z
            
            // Gradient colors from cyan to blue with variation
            if (isInnerBeam) {
                // Brighter inner beam
                colors[i3] = 0.3 + Math.random() * 0.2;       // r
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;   // g
                colors[i3 + 2] = 1.0;                         // b
            } else {
                // Cooler outer particles
                colors[i3] = 0.1 + Math.random() * 0.1;       // r 
                colors[i3 + 1] = 0.7 + Math.random() * 0.3;   // g
                colors[i3 + 2] = 0.9 + Math.random() * 0.1;   // b
            }
            
            // Varied particle sizes
            sizes[i] = isInnerBeam ? 
                scale * 0.002 + Math.random() * scale * 0.002 : // Small inner particles
                scale * 0.004 + Math.random() * scale * 0.006;  // Larger outer particles
        }
        
        // Add attributes to geometry
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Particle material with custom shader for better glow
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
        const teleportParticles = new THREE.Points(particleGeometry, particleMaterial);
        teleportParticles.visible = false;
        
        // Position particle system
        teleportParticles.position.set(0, 0, -scale * 0.1);
        
        // Add to ship
        ship.add(teleportParticles);
        
        return teleportParticles;
    }
    
    static createParticleTexture() {
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
    
    static animateParticles(teleportParticles) {
        if (!teleportParticles || !teleportParticles.visible) return;
        
        // Moving particles
        const positions = teleportParticles.geometry.attributes.position.array;
        
        // Move particles downward and reset when they reach bottom
        for (let i = 0; i < positions.length; i += 3) {
            // Move particle down faster
            positions[i + 1] -= 5;
            
            // Add slight horizontal movement for realism
            positions[i] += (Math.random() - 0.5) * 2;
            positions[i + 2] += (Math.random() - 0.5) * 2;
            
            // Reset particle when it gets too far
            if (positions[i + 1] < -1000) {
                // Get a reference position to place particle within beam
                const isInnerBeam = Math.random() > 0.3;
                const radius = isInnerBeam ? 
                    Math.random() * 40 : // Inner beam
                    40 + Math.random() * 180; // Outer area
                const theta = Math.random() * Math.PI * 2;
                
                positions[i] = radius * Math.cos(theta);     // x
                positions[i + 1] = -(Math.random() * 400);   // y (reset to top of beam)
                positions[i + 2] = radius * Math.sin(theta); // z
            }
        }
        
        // Update buffer geometry
        teleportParticles.geometry.attributes.position.needsUpdate = true;
    }
}