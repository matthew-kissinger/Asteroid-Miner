import * as THREE from 'three';
import { debugLog } from '../../../globals/debug.ts';

/**
 * Enhances the skybox with subtle twinkling foreground stars.
 * These are bright point sprites placed very far from the camera.
 */
export class StarfieldEnhancement {
    private scene: THREE.Scene;
    private points: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;
    private starCount: number = 80;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.starCount * 3);
        const phases = new Float32Array(this.starCount);
        const sizes = new Float32Array(this.starCount);

        for (let i = 0; i < this.starCount; i++) {
            const i3 = i * 3;
            // Very distant - should not move much relative to camera
            const radius = 350000; 
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2.0 * Math.random() - 1.0);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Random phase for twinkling
            phases[i] = Math.random() * Math.PI * 2;
            // Visible size at this distance
            sizes[i] = 400 + Math.random() * 800;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float phase;
                attribute float size;
                varying float vOpacity;
                uniform float time;
                void main() {
                    // Twinkling effect: oscillate opacity with different phase per star
                    vOpacity = 0.4 + 0.6 * pow(0.5 + 0.5 * sin(time * 1.5 + phase), 3.0);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Use custom size attenuation for distant stars
                    gl_PointSize = size * (1000.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vOpacity;
                void main() {
                    // Circular point
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;
                    
                    // Glow effect
                    float strength = 1.0 - (r * 2.0);
                    gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity * strength);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(this.geometry, this.material);
        // Ensure stars are rendered behind most objects but in front of background
        this.points.renderOrder = -10; 
        
        this.scene.add(this.points);
        debugLog("Starfield enhancement initialized");
    }

    /**
     * Update twinkling animation
     */
    update(time: number): void {
        this.material.uniforms.time.value = time;
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
