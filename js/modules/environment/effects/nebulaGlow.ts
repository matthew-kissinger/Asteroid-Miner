import * as THREE from 'three';
import { debugLog } from '../../../globals/debug.ts';

/**
 * Subtle colored fog/glow in certain regions using a few large semi-transparent point sprites.
 * Using THREE.Points instead of THREE.Sprite to satisfy the requirement of using Points geometry.
 */
export class NebulaGlow {
    private scene: THREE.Scene;
    private points: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;
    private count: number = 5;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);
        const pulseOffsets = new Float32Array(this.count);
        const pulseSpeeds = new Float32Array(this.count);
        const opacities = new Float32Array(this.count);

        const nebulaColors = [
            new THREE.Color(0x4b0082), // Indigo
            new THREE.Color(0x008080), // Teal
            new THREE.Color(0x191970), // Midnight Blue
            new THREE.Color(0x483d8b)  // Dark Slate Blue
        ];

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            const radius = 20000 + Math.random() * 15000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            const color = nebulaColors[i % nebulaColors.length];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            sizes[i] = 12000 + Math.random() * 8000;
            pulseOffsets[i] = Math.random() * Math.PI * 2;
            pulseSpeeds[i] = 0.1 + Math.random() * 0.2;
            opacities[i] = 0.05 + Math.random() * 0.1;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('pulseOffset', new THREE.BufferAttribute(pulseOffsets, 1));
        this.geometry.setAttribute('pulseSpeed', new THREE.BufferAttribute(pulseSpeeds, 1));
        this.geometry.setAttribute('opacityBase', new THREE.BufferAttribute(opacities, 1));

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float pulseOffset;
                attribute float pulseSpeed;
                attribute float opacityBase;
                varying vec3 vColor;
                varying float vOpacity;
                uniform float time;
                void main() {
                    vColor = color;
                    // Pulsing opacity
                    vOpacity = opacityBase * (0.8 + 0.2 * sin(time * pulseSpeed + pulseOffset));
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Extremely large points for nebulae
                    gl_PointSize = size * (1000.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vOpacity;
                void main() {
                    // Very soft radial gradient for nebula look
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;
                    
                    // Gaussian-like falloff for extra softness
                    float strength = exp(-r * r * 10.0);
                    gl_FragColor = vec4(vColor, vOpacity * strength);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
        debugLog("Nebula Points initialized");
    }

    update(time: number): void {
        this.material.uniforms.time.value = time;
    }

    dispose(): void {
        this.scene.remove(this.points);
        this.geometry.dispose();
        this.material.dispose();
    }
}
