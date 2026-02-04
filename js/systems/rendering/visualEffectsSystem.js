/**
 * VisualEffectsSystem - Manages visual effects like explosions, damage flashes, etc.
 * 
 * This system handles creating and managing visual effects for the game,
 * keeping them separate from game logic.
 */

import * as THREE from 'three';
import { System } from '../../core/system.ts';
import { objectPool } from '../../globals/objectPool.ts';

export class VisualEffectsSystem extends System {
    constructor(world) {
        super(world);
        this.priority = 70; // Lower priority, run after gameplay systems
        
        // Keep track of active effects
        this.activeEffects = new Map();
        
        // Effect counters for unique IDs
        this.effectCounter = 0;
        
        // Setup listeners for effect events
        this.setupEventListeners();
        
        console.log("VisualEffectsSystem initialized");
    }
    
    /**
     * Set up event listeners for visual effect events
     */
    setupEventListeners() {
        // Listen for explosion effect requests
        this.world.messageBus.subscribe('vfx.explosion', this.handleExplosionRequest.bind(this));
        
        // Listen for damage flash effect requests
        this.world.messageBus.subscribe('vfx.damageFlash', this.handleDamageFlashRequest.bind(this));
    }
    
    /**
     * Update all active visual effects
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Update all active effects and remove completed ones
        for (const [id, effect] of this.activeEffects.entries()) {
            if (!effect.update(deltaTime)) {
                // Effect is complete, remove it
                this.removeEffect(id);
            }
        }
    }
    
    /**
     * Handle request to create an explosion effect
     * @param {object} message The explosion request message
     */
    handleExplosionRequest(message) {
        if (!message || !message.data || !message.data.position) {
            console.error("Invalid explosion effect request", message);
            return;
        }
        
        // Extract parameters from message
        const position = message.data.position;
        const scale = message.data.scale || 1.0;
        const duration = message.data.duration || 2.0;
        
        // Create explosion effect
        this.createExplosionEffect(position, scale, duration);
        
        // Play explosion sound (use boink instead of explosion)
        if (window.game && window.game.audio) {
            window.game.audio.playSound('boink');
        }
    }
    
    /**
     * Handle request to create a damage flash effect
     * @param {object} message The damage flash request message
     */
    handleDamageFlashRequest(message) {
        // Extract intensity from message if available
        const intensity = message && message.data && message.data.intensity ? 
            message.data.intensity : 0.3;
        
        // Create damage flash effect
        this.createDamageFlashEffect(intensity);
    }
    
    /**
     * Create an explosion effect at the specified position
     * @param {THREE.Vector3} position Position for the explosion
     * @param {number} scale Size scale for the explosion (1.0 = normal)
     * @param {number} duration Duration in seconds
     * @returns {number} Effect ID
     */
    createExplosionEffect(position, scale = 1.0, duration = 2.0) {
        // Get access to THREE.js scene
        if (!this.world.scene) {
            console.error("No scene available for explosion effect");
            return -1;
        }
        
        // Create effect container
        const container = new THREE.Group();
        container.position.copy(position);
        container.scale.set(scale, scale, scale);
        
        // Create particles for explosion - use object pool if available
        const particleCount = Math.floor(20 * scale);
        const particles = [];
        
        // Check if pooling system is available
        const usePooling = objectPool && 
                          objectPool.pools && 
                          objectPool.pools['explosionParticle'];
        
        // Create particles with properties
        for (let i = 0; i < particleCount; i++) {
            let particle;
            const size = Math.random() * 2 + 1;
            
            if (usePooling) {
                // Get particle from pool
                particle = objectPool.get('explosionParticle');
                
                if (particle) {
                    // Position randomly within explosion radius
                    const radius = Math.random() * 10;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    
                    const particlePos = new THREE.Vector3(
                        radius * Math.sin(phi) * Math.cos(theta),
                        radius * Math.sin(phi) * Math.sin(theta),
                        radius * Math.cos(phi)
                    );
                    
                    // Reset the particle with position relative to container origin
                    particle.reset(particlePos, size, 0xff5500);
                    
                    // Set velocity for animation
                    particle.velocity.copy(particlePos).normalize().multiplyScalar(
                        Math.random() * 2 + 1
                    );
                    
                    // Add to container
                    container.add(particle.mesh);
                    particles.push(particle);
                }
            } else {
                // Fallback to creating new particles if pool is not available
                // Use precomputed geometry if available, otherwise create new
                const geometry = window.game && window.game.explosionGeometry ? 
                                window.game.explosionGeometry : 
                                new THREE.SphereGeometry(size, 8, 8);
                
                // Use precomputed material as template if available
                const material = window.game && window.game.explosionMaterial ? 
                                window.game.explosionMaterial.clone() : 
                                new THREE.MeshBasicMaterial({
                                    color: 0xff5500,
                                    transparent: true,
                                    opacity: 0.8
                                });
                
                const particleMesh = new THREE.Mesh(geometry, material);
                
                // Random position within explosion radius
                const radius = Math.random() * 10;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                particleMesh.position.set(
                    radius * Math.sin(phi) * Math.cos(theta),
                    radius * Math.sin(phi) * Math.sin(theta),
                    radius * Math.cos(phi)
                );
                
                // Store velocity in userData
                particleMesh.userData.velocity = particleMesh.position.clone().normalize().multiplyScalar(
                    Math.random() * 2 + 1
                );
                
                // Add to container
                container.add(particleMesh);
                particles.push({
                    mesh: particleMesh,
                    material: material,
                    velocity: particleMesh.userData.velocity
                });
            }
        }
        
        // Add container to scene
        this.world.scene.add(container);
        
        // Create effect object
        const effectId = this.effectCounter++;
        const effect = {
            id: effectId,
            type: 'explosion',
            container: container,
            particles: particles,
            duration: duration,
            elapsed: 0,
            usePooling: usePooling,
            update: (dt) => {
                // Update elapsed time
                effect.elapsed += dt;
                
                // Check if effect is complete
                if (effect.elapsed >= effect.duration) {
                    // Clean up explosion particles
                    if (effect.usePooling) {
                        // Return particles to pool
                        effect.particles.forEach(particle => {
                            objectPool.release('explosionParticle', particle);
                        });
                    }
                    // Remove container from scene
                    this.world.scene.remove(container);
                    return false;
                }
                
                // Calculate progress (0 to 1)
                const progress = effect.elapsed / effect.duration;
                
                // Update particle positions and opacity
                effect.particles.forEach(particle => {
                    if (effect.usePooling) {
                        // Using pooled particles
                        // Move particle outward
                        particle.mesh.position.add(
                            particle.velocity.clone().multiplyScalar(dt)
                        );
                        
                        // Fade out gradually
                        particle.material.opacity = 0.8 * (1 - progress);
                        
                        // Shrink slightly
                        particle.mesh.scale.multiplyScalar(0.99);
                    } else {
                        // Using direct mesh
                        // Move particle outward
                        particle.mesh.position.add(
                            particle.velocity.clone().multiplyScalar(dt)
                        );
                        
                        // Fade out gradually
                        particle.material.opacity = 0.8 * (1 - progress);
                        
                        // Shrink slightly
                        particle.mesh.scale.multiplyScalar(0.99);
                    }
                });
                
                return true;
            }
        };
        
        // Add to active effects
        this.activeEffects.set(effectId, effect);
        
        return effectId;
    }
    
    /**
     * Create a damage flash effect on screen
     * @param {number} intensity Flash intensity (0-1)
     * @returns {number} Effect ID
     */
    createDamageFlashEffect(intensity = 0.3) {
        // Create a full-screen flash element
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = `rgba(255, 0, 0, ${intensity})`;
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '1000';
        flash.style.opacity = '1';
        flash.style.transition = 'opacity 0.2s ease-out';
        
        // Add to DOM
        document.body.appendChild(flash);
        
        // Create effect object
        const effectId = this.effectCounter++;
        const effect = {
            id: effectId,
            type: 'damageFlash',
            element: flash,
            duration: 0.3, // Fixed duration for damage flash
            elapsed: 0,
            update: (dt) => {
                // Update elapsed time
                effect.elapsed += dt;
                
                // Check if effect is complete
                if (effect.elapsed >= effect.duration) {
                    // Remove element from DOM
                    if (document.body.contains(flash)) {
                        document.body.removeChild(flash);
                    }
                    return false;
                }
                
                // Calculate progress (0 to 1)
                const progress = effect.elapsed / effect.duration;
                
                // Fade out
                flash.style.opacity = (1 - progress).toString();
                
                return true;
            }
        };
        
        // Add to active effects
        this.activeEffects.set(effectId, effect);
        
        return effectId;
    }
    
    /**
     * Remove an effect and clean up its resources
     * @param {number} effectId ID of the effect to remove
     */
    removeEffect(effectId) {
        // Get effect
        const effect = this.activeEffects.get(effectId);
        if (!effect) return;
        
        // Clean up based on effect type
        if (effect.type === 'explosion') {
            if (effect.container && this.world.scene) {
                this.world.scene.remove(effect.container);
            }
        } else if (effect.type === 'damageFlash') {
            if (effect.element && document.body.contains(effect.element)) {
                document.body.removeChild(effect.element);
            }
        }
        
        // Remove from active effects
        this.activeEffects.delete(effectId);
    }
    
    /**
     * Clean up all effects when system is disabled
     */
    onDisabled() {
        // Remove all active effects
        for (const effectId of this.activeEffects.keys()) {
            this.removeEffect(effectId);
        }
        
        // Clear effects map
        this.activeEffects.clear();
    }
} 
