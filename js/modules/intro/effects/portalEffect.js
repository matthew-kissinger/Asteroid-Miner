// portalEffect.js - Manages the warp portal visual effects for intro sequence

import * as THREE from 'three';

export class PortalEffect {
    constructor() {
        this.warpTunnel = null;
        this.warpPortal = null;
        this.portalParticles = null;
        this.setupPortalEffect();
    }
    
    setupPortalEffect() {
        // Create a circular portal instead of a particle tower
        const portalGeometry = new THREE.RingGeometry(0, 400, 64);
        const portalMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x6633aa) }
            },
            vertexShader: `
                precision highp float;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform float time;
                uniform vec3 color;
                varying vec2 vUv;
                
                void main() {
                    float distFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
                    float ripple = sin(distFromCenter * 20.0 - time * 3.0) * 0.5 + 0.5;
                    float alpha = (1.0 - distFromCenter) * ripple;
                    
                    vec3 finalColor = color * (0.8 + ripple * 0.4);
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.warpPortal = new THREE.Mesh(portalGeometry, portalMaterial);
        
        // Create a subtle particle system around the portal for effect
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 350 + Math.random() * 150;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaa33ff,
            size: 3,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.portalParticles = new THREE.Points(particles, particleMaterial);
        
        // Group the portal elements
        this.warpTunnel = new THREE.Group();
        this.warpTunnel.add(this.warpPortal);
        this.warpTunnel.add(this.portalParticles);
    }
    
    /**
     * Update portal shader uniforms and animations
     */
    updatePortalEffect() {
        if (this.warpPortal && this.warpPortal.material.uniforms) {
            this.warpPortal.material.uniforms.time.value += 0.016;
        }
    }
    
    /**
     * Set portal opacity for fade effects
     * @param {number} opacity - Opacity value between 0 and 1
     */
    setOpacity(opacity) {
        if (this.portalParticles && this.portalParticles.material) {
            this.portalParticles.material.opacity = opacity;
        }
        if (this.warpPortal && this.warpPortal.material) {
            this.warpPortal.material.opacity = opacity;
        }
    }
    
    /**
     * Set portal scale
     * @param {number} scale - Scale factor
     */
    setScale(scale) {
        if (this.warpTunnel) {
            this.warpTunnel.scale.set(scale, scale, 1);
        }
    }
    
    /**
     * Set portal position
     * @param {THREE.Vector3} position - Position vector
     */
    setPosition(position) {
        if (this.warpTunnel) {
            this.warpTunnel.position.copy(position);
        }
    }
    
    /**
     * Set portal rotation
     * @param {THREE.Euler} rotation - Rotation euler angles
     */
    setRotation(rotation) {
        if (this.warpTunnel) {
            this.warpTunnel.rotation.copy(rotation);
        }
    }
    
    /**
     * Set portal visibility
     * @param {boolean} visible - Whether portal should be visible
     */
    setVisible(visible) {
        if (this.warpTunnel) {
            this.warpTunnel.visible = visible;
        }
    }
    
    /**
     * Get the portal group for adding to scene
     * @returns {THREE.Group} The warp tunnel group
     */
    getPortalGroup() {
        return this.warpTunnel;
    }
    
    /**
     * Clean up portal resources
     */
    dispose() {
        if (this.warpPortal) {
            if (this.warpPortal.geometry) this.warpPortal.geometry.dispose();
            if (this.warpPortal.material) this.warpPortal.material.dispose();
        }
        if (this.portalParticles) {
            if (this.portalParticles.geometry) this.portalParticles.geometry.dispose();
            if (this.portalParticles.material) this.portalParticles.material.dispose();
        }
        this.warpTunnel = null;
        this.warpPortal = null;
        this.portalParticles = null;
    }
}