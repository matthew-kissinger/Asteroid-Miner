import * as THREE from 'three';
import { debugLog } from '../../../globals/debug.ts';

/**
 * Ambient dust/debris particles floating near asteroid belts.
 * Uses a ring buffer pattern to recycle particles around the player.
 */
export class DustParticles {
    private scene: THREE.Scene;
    private points: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;
    private particleCount: number = 400;
    private range: number = 2000; // Radius around player to maintain particles
    private positions: Float32Array;
    private velocities: Float32Array;
    private sizes: Float32Array;
    private alphas: Float32Array;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        this.sizes = new Float32Array(this.particleCount);
        this.alphas = new Float32Array(this.particleCount);

        // Initialize particles with random positions within range
        for (let i = 0; i < this.particleCount; i++) {
            this.resetParticle(i, true);
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xccaa88) }, // Warm amber/brown
            },
            vertexShader: `
                attribute float size;
                attribute float alpha;
                varying float vAlpha;
                void main() {
                    vAlpha = alpha;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Standard size attenuation formula
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying float vAlpha;
                void main() {
                    // Soft circular particle
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;
                    
                    // Smooth edge
                    float strength = 1.0 - (r * 2.0);
                    gl_FragColor = vec4(color, vAlpha * strength);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
        
        debugLog("Dust particles initialized");
    }

    /**
     * Reset a particle's properties
     */
    private resetParticle(i: number, randomDist: boolean = false): void {
        const i3 = i * 3;
        if (randomDist) {
            this.positions[i3] = (Math.random() - 0.5) * this.range * 2;
            this.positions[i3 + 1] = (Math.random() - 0.5) * this.range * 2;
            this.positions[i3 + 2] = (Math.random() - 0.5) * this.range * 2;
        }

        // Slight random drift velocity
        this.velocities[i3] = (Math.random() - 0.5) * 0.15;
        this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.15;
        this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.15;
        
        // Random small sizes (0.5 to 2.0 units)
        this.sizes[i] = 0.5 + Math.random() * 1.5;
        
        // Subtle opacity
        this.alphas[i] = 0.1 + Math.random() * 0.3;
    }

    /**
     * Update particle positions and recycle those that move too far from the player
     */
    update(deltaTime: number, playerPos: THREE.Vector3): void {
        const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
        // Use a small constant factor for velocity to keep it framerate independent if deltaTime is provided
        const vFactor = deltaTime * 60; 
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Apply drift velocity
            this.positions[i3] += this.velocities[i3] * vFactor;
            this.positions[i3 + 1] += this.velocities[i3 + 1] * vFactor;
            this.positions[i3 + 2] += this.velocities[i3 + 2] * vFactor;

            // Recycling logic: Wrap particles around the player's position
            // This maintains a constant density of particles around the player
            if (this.positions[i3] - playerPos.x > this.range) this.positions[i3] -= this.range * 2;
            else if (this.positions[i3] - playerPos.x < -this.range) this.positions[i3] += this.range * 2;
            
            if (this.positions[i3 + 1] - playerPos.y > this.range) this.positions[i3 + 1] -= this.range * 2;
            else if (this.positions[i3 + 1] - playerPos.y < -this.range) this.positions[i3 + 1] += this.range * 2;
            
            if (this.positions[i3 + 2] - playerPos.z > this.range) this.positions[i3 + 2] -= this.range * 2;
            else if (this.positions[i3 + 2] - playerPos.z < -this.range) this.positions[i3 + 2] += this.range * 2;
        }

        posAttr.needsUpdate = true;
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.scene.remove(this.points);
        this.geometry.dispose();
        this.material.dispose();
    }
}
