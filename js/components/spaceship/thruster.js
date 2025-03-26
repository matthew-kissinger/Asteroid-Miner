/**
 * ThrusterComponent - Handles spaceship propulsion
 * 
 * Manages thrust forces, fuel consumption, and thruster effects.
 */

import { Component } from '../../core/component.js';

export class ThrusterComponent extends Component {
    constructor(thrust = 10, maxVelocity = 100) {
        super();
        
        // Thrust parameters
        this.thrust = thrust;
        this.maxVelocity = maxVelocity;
        this.boostMultiplier = 2.0;
        this.rotationSpeed = 2.0;
        
        // Thrust state
        this.thrusting = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            boost: false
        };
        
        // Particle effects
        this.particleSystems = {
            main: null,
            left: null,
            right: null,
            reverse: null
        };
        
        // Fuel consumption
        this.fuelConsumptionRate = 0.2;  // Base fuel units per second
        this.boostConsumptionMultiplier = 3.0;
    }
    
    /**
     * Initialize thruster particle effects
     * @param {THREE.Scene} scene Scene to add particles to
     */
    initializeParticleEffects(scene) {
        // Create particle system for main thruster
        const mainParticles = this._createParticleSystem(0x3366ff, 0.5);
        mainParticles.position.set(0, 0, 1); // Positioned at the back of the ship
        scene.add(mainParticles);
        this.particleSystems.main = mainParticles;
        
        // Create particle system for left thruster
        const leftParticles = this._createParticleSystem(0x33ccff, 0.3);
        leftParticles.position.set(0.5, 0, 0.5); // Positioned at the left side
        scene.add(leftParticles);
        this.particleSystems.left = leftParticles;
        
        // Create particle system for right thruster
        const rightParticles = this._createParticleSystem(0x33ccff, 0.3);
        rightParticles.position.set(-0.5, 0, 0.5); // Positioned at the right side
        scene.add(rightParticles);
        this.particleSystems.right = rightParticles;
        
        // Create particle system for reverse thruster
        const reverseParticles = this._createParticleSystem(0x3366ff, 0.3);
        reverseParticles.position.set(0, 0, -0.5); // Positioned at the front of the ship
        scene.add(reverseParticles);
        this.particleSystems.reverse = reverseParticles;
        
        // Initially hide all particle systems
        this._updateParticleSystems(false, false, false, false);
    }
    
    /**
     * Create a particle system for thrusters
     * @param {number} color Thruster color
     * @param {number} size Particle size
     * @returns {THREE.Points} Particle system
     * @private
     */
    _createParticleSystem(color, size) {
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const colorObj = new THREE.Color(color);
        
        for (let i = 0; i < particleCount; i++) {
            // Position
            positions[i * 3] = (Math.random() - 0.5) * 0.2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
            positions[i * 3 + 2] = Math.random() * 2; // Trail extends backward
            
            // Color (based on position for gradient effect)
            const colorIntensity = 1 - (positions[i * 3 + 2] / 2);
            colors[i * 3] = colorObj.r * colorIntensity;
            colors[i * 3 + 1] = colorObj.g * colorIntensity;
            colors[i * 3 + 2] = colorObj.b * colorIntensity;
            
            // Size (larger at engine, smaller at trail end)
            sizes[i] = size * (1 - (positions[i * 3 + 2] / 4));
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Points(particles, material);
    }
    
    /**
     * Update particle systems visibility based on thrust state
     * @param {boolean} main Main thruster active
     * @param {boolean} left Left thruster active
     * @param {boolean} right Right thruster active
     * @param {boolean} reverse Reverse thruster active
     * @private
     */
    _updateParticleSystems(main, left, right, reverse) {
        if (this.particleSystems.main) {
            this.particleSystems.main.visible = main;
        }
        
        if (this.particleSystems.left) {
            this.particleSystems.left.visible = left;
        }
        
        if (this.particleSystems.right) {
            this.particleSystems.right.visible = right;
        }
        
        if (this.particleSystems.reverse) {
            this.particleSystems.reverse.visible = reverse;
        }
    }
    
    /**
     * Calculate fuel consumption based on current thrust state
     * @param {number} deltaTime Time since last update
     * @returns {number} Fuel consumed this frame
     */
    calculateFuelConsumption(deltaTime) {
        // Count active thrusters
        let activeThrusters = 0;
        
        if (this.thrusting.forward) activeThrusters++;
        if (this.thrusting.backward) activeThrusters++;
        if (this.thrusting.left) activeThrusters++;
        if (this.thrusting.right) activeThrusters++;
        if (this.thrusting.up) activeThrusters++;
        if (this.thrusting.down) activeThrusters++;
        
        // Calculate base consumption
        let consumption = this.fuelConsumptionRate * activeThrusters * deltaTime;
        
        // Add boost consumption if active
        if (this.thrusting.boost && activeThrusters > 0) {
            consumption *= this.boostConsumptionMultiplier;
        }
        
        return consumption;
    }
    
    /**
     * Apply thrust forces to the entity's rigidbody
     * @param {number} deltaTime Time since last update
     */
    applyThrust(deltaTime) {
        const transform = this.entity.getComponent('TransformComponent');
        const rigidbody = this.entity.getComponent('RigidbodyComponent');
        
        if (!transform || !rigidbody) return;
        
        // Get thrust multiplier (includes boost)
        const thrustMultiplier = this.thrusting.boost ? this.thrust * this.boostMultiplier : this.thrust;
        
        // Calculate direction vectors from transform
        const forwardVector = transform.getForwardVector();
        const rightVector = transform.getRightVector();
        const upVector = transform.getUpVector();
        
        // Calculate thrust force
        const thrustForce = new THREE.Vector3();
        
        // Forward/backward thrust
        if (this.thrusting.forward) {
            thrustForce.add(forwardVector.clone().multiplyScalar(thrustMultiplier));
        }
        if (this.thrusting.backward) {
            thrustForce.add(forwardVector.clone().multiplyScalar(-thrustMultiplier));
        }
        
        // Left/right thrust
        if (this.thrusting.right) {
            thrustForce.add(rightVector.clone().multiplyScalar(thrustMultiplier));
        }
        if (this.thrusting.left) {
            thrustForce.add(rightVector.clone().multiplyScalar(-thrustMultiplier));
        }
        
        // Up/down thrust
        if (this.thrusting.up) {
            thrustForce.add(upVector.clone().multiplyScalar(thrustMultiplier));
        }
        if (this.thrusting.down) {
            thrustForce.add(upVector.clone().multiplyScalar(-thrustMultiplier));
        }
        
        // Apply force
        rigidbody.applyForce(thrustForce);
        
        // Apply velocity limit
        const maxVel = this.thrusting.boost ? this.maxVelocity * this.boostMultiplier : this.maxVelocity;
        if (rigidbody.velocity.length() > maxVel) {
            rigidbody.velocity.normalize().multiplyScalar(maxVel);
        }
        
        // Update thruster particle effects
        this._updateParticleSystems(
            this.thrusting.forward,
            this.thrusting.right,
            this.thrusting.left,
            this.thrusting.backward
        );
        
        // Update particle positions based on ship transform
        if (this.particleSystems.main) {
            Object.values(this.particleSystems).forEach(particles => {
                if (particles) {
                    particles.position.copy(transform.position);
                    particles.quaternion.copy(transform.quaternion);
                }
            });
        }
    }
    
    /**
     * Upgrade thruster power
     * @param {number} multiplier Power multiplier
     */
    upgrade(multiplier = 1.5) {
        this.thrust *= multiplier;
        this.maxVelocity *= multiplier;
        return this;
    }
    
    /**
     * Called when component is detached from an entity
     */
    onDetached() {
        // Clean up particle systems to prevent memory leaks
        Object.values(this.particleSystems).forEach(particles => {
            if (particles) {
                // Remove from scene
                if (particles.parent) {
                    particles.parent.remove(particles);
                }
                
                // Dispose geometry
                if (particles.geometry) {
                    particles.geometry.dispose();
                }
                
                // Dispose material
                if (particles.material) {
                    particles.material.dispose();
                }
            }
        });
        
        // Clear references
        this.particleSystems = {
            main: null,
            left: null,
            right: null,
            reverse: null
        };
    }
}