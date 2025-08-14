// visualEffects.js - Handles visual effects for mining operations

import * as THREE from 'three';

export class VisualEffects {
    constructor(scene) {
        this.scene = scene;
        this.miningParticles = null;
        this.setupMiningParticles();
    }

    /**
     * Setup mining particles effect
     */
    setupMiningParticles() {
        // Create particle effect for mining impact
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff5500,
            size: 1.5,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.miningParticles = new THREE.Points(particles, particleMaterial);
        this.miningParticles.visible = false;
        this.scene.add(this.miningParticles);
    }

    /**
     * Show mining particles with appropriate color
     */
    showMiningParticles(asteroid, efficiency = 1.0) {
        if (!this.miningParticles) return;
        
        this.miningParticles.visible = true;
        
        // Adjust particle color based on resource type
        if (asteroid.resourceType && this.miningParticles.material) {
            const resourceType = asteroid.resourceType.toLowerCase();
            
            if (resourceType === 'iron') {
                this.miningParticles.material.color.set(0xff5500); // Orange
            } else if (resourceType === 'gold') {
                this.miningParticles.material.color.set(0xffcc00); // Yellow
            } else if (resourceType === 'platinum') {
                this.miningParticles.material.color.set(0x66ffff); // Light blue
            }
            
            // Adjust particle size based on mining efficiency
            if (efficiency > 1.0) {
                this.miningParticles.material.size = 1.5 * Math.sqrt(efficiency);
            }
        }
    }

    /**
     * Hide mining particles
     */
    hideMiningParticles() {
        if (this.miningParticles) {
            this.miningParticles.visible = false;
        }
    }

    /**
     * Update mining particles animation
     */
    updateMiningParticles(efficiency = 1.0) {
        if (!this.miningParticles || !this.miningParticles.visible) return;
        
        const positions = this.miningParticles.geometry.attributes.position.array;
        
        // Particles move faster with higher efficiency
        const particleSpeed = 0.3 * efficiency;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Move particles outward slightly
            const dir = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
            dir.normalize().multiplyScalar(particleSpeed);
            
            positions[i] += dir.x;
            positions[i+1] += dir.y;
            positions[i+2] += dir.z;
            
            // Reset particles that move too far
            const dist = Math.sqrt(
                positions[i] * positions[i] + 
                positions[i+1] * positions[i+1] + 
                positions[i+2] * positions[i+2]
            );
            
            if (dist > 36) {
                positions[i] = (Math.random() - 0.5) * 24;
                positions[i+1] = (Math.random() - 0.5) * 24;
                positions[i+2] = (Math.random() - 0.5) * 24;
            }
        }
        this.miningParticles.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Update particles position to asteroid location
     */
    setParticlesPosition(position) {
        if (this.miningParticles && this.miningParticles.visible) {
            this.miningParticles.position.copy(position);
        }
    }

    /**
     * Create asteroid break effect
     */
    createAsteroidBreakEffect(position) {
        // Create particle effect for asteroid breaking
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 12,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Start at asteroid position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            // Random velocity in all directions
            velocities.push({
                x: (Math.random() - 0.5) * 8,
                y: (Math.random() - 0.5) * 8,
                z: (Math.random() - 0.5) * 8
            });
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
        
        // Animate particles
        let frameCount = 0;
        const animateParticles = () => {
            frameCount++;
            
            // Update particle positions
            const positions = particleSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
            
            // Fade out over time
            particleSystem.material.opacity = Math.max(0, 0.8 - frameCount * 0.02);
            
            // Remove after 40 frames
            if (frameCount < 40) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particleSystem);
            }
        };
        
        animateParticles();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.miningParticles) {
            if (this.miningParticles.geometry) this.miningParticles.geometry.dispose();
            if (this.miningParticles.material) this.miningParticles.material.dispose();
            this.scene.remove(this.miningParticles);
            this.miningParticles = null;
        }
    }
}