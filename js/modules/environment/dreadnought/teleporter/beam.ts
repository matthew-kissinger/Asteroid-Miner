// beam.ts - Creates the teleport beam and impact ring for the Star Dreadnought

import * as THREE from 'three';

export class TeleportBeam {
    static createTeleportBeam(scale: number, ship: THREE.Group): THREE.Mesh {
        // Create teleport beam (initially inactive)
        const beamTopRadius = scale * 0.03;
        const beamBottomRadius = scale * 0.2; // Much wider at bottom for dramatic beam
        const beamHeight = scale * 0.8; // Longer beam to reach further

        // Custom shader material for energy beam effect with more dynamic patterns
        const beamMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                color: { value: new THREE.Color(0x33ccff) },
                pulseFrequency: { value: 12.0 },
                pulseAmplitude: { value: 0.3 }
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
                uniform vec3 color;
                uniform float pulseFrequency;
                uniform float pulseAmplitude;
                varying vec2 vUv;
                
                // Improved pattern with scrolling and pulsing
                void main() {
                    // Create primary energy pattern - vertical striations
                    float verticalPattern = sin(vUv.y * 50.0 - time * 3.0) * 0.5 + 0.5;
                    
                    // Create horizontal pulse bands
                    float horizontalPulse = sin(vUv.y * pulseFrequency - time * 2.0) * pulseAmplitude + (1.0 - pulseAmplitude);
                    
                    // Edge glow effect with distortion
                    float edgeEffect = smoothstep(0.0, 0.4, vUv.x) * smoothstep(1.0, 0.6, vUv.x);
                    
                    // Swirling energy effect
                    float swirl = sin(vUv.y * 30.0 + vUv.x * 5.0 + time * 4.0) * 0.5 + 0.5;
                    
                    // Combine effects
                    float pattern = mix(verticalPattern, swirl, 0.5) * horizontalPulse * edgeEffect;
                    
                    // Add vertical fade for more realistic beam
                    float opacity = (1.0 - vUv.y * 0.8) * 0.9;
                    
                    // Pulsing brightness based on time
                    float pulse = sin(time * 3.0) * 0.1 + 0.9;
                    
                    // Combine final color 
                    vec3 finalColor = color * pulse;
                    
                    // Output final color with combined opacity
                    gl_FragColor = vec4(finalColor, opacity * pattern);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending // Use additive blending for glowing effect
        });

        // Create beam cone
        const beamGeometry = new THREE.CylinderGeometry(beamBottomRadius, beamTopRadius, beamHeight, 32, 16, true);
        const teleportBeam = new THREE.Mesh(beamGeometry, beamMaterial);

        // Position beam below the ship facing down
        teleportBeam.position.set(0, -beamHeight / 2, -scale * 0.1);
        teleportBeam.rotation.x = Math.PI; // Point downward

        // Hide beam initially
        teleportBeam.visible = false;

        // Add to ship
        ship.add(teleportBeam);

        return teleportBeam;
    }

    static createBeamImpactRing(scale: number, ship: THREE.Group): THREE.Mesh {
        // Create a flat ring at the beam impact point
        const ringGeometry = new THREE.RingGeometry(scale * 0.1, scale * 0.22, 32);
        const ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                color: { value: new THREE.Color(0x33ccff) }
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
                uniform vec3 color;
                varying vec2 vUv;
                
                void main() {
                    // Animated ripple effect
                    float ripple = sin(distance(vUv, vec2(0.5)) * 20.0 - time * 5.0) * 0.5 + 0.5;
                    
                    // Rotating element
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float rotatingPattern = sin(angle * 8.0 + time * 3.0) * 0.5 + 0.5;
                    
                    // Pulsing opacity
                    float pulse = sin(time * 2.0) * 0.3 + 0.7;
                    
                    // Combine patterns
                    float pattern = mix(ripple, rotatingPattern, 0.5) * pulse;
                    
                    gl_FragColor = vec4(color, pattern * 0.7);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const impactRing = new THREE.Mesh(ringGeometry, ringMaterial);

        // Position the ring below the beam's end
        impactRing.position.set(0, -scale * 1.0, -scale * 0.1);
        impactRing.rotation.x = -Math.PI / 2; // Face downward

        // Hide initially
        impactRing.visible = false;

        // Add to ship
        ship.add(impactRing);

        return impactRing;
    }
}