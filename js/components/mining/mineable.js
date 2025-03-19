/**
 * MineableComponent - For objects that can be mined
 * 
 * Adds mining capabilities to asteroids and other resource-bearing entities.
 */

import { Component } from '../../core/component.js';

export class MineableComponent extends Component {
    constructor(resourceType = 'iron', amount = 100) {
        super();
        
        // Resource properties
        this.resourceType = resourceType;
        this.totalAmount = amount;
        this.remainingAmount = amount;
        
        // Mining difficulty by resource type
        this.miningDifficulty = 1.0;
        switch (resourceType.toLowerCase()) {
            case 'iron':
                this.miningDifficulty = 1.0;
                break;
            case 'gold':
                this.miningDifficulty = 3.0;
                break;
            case 'platinum':
                this.miningDifficulty = 8.0;
                break;
            default:
                console.warn(`Unknown resource type: ${resourceType}, using default difficulty`);
        }
        
        // Visual properties
        this.miningEffectColor = this._getResourceColor(resourceType);
        this.miningParticles = null;
        
        // Mining state
        this.beingMined = false;
        this.lastMineTime = 0;
        
        // Size changes as resources are depleted
        this.startingScale = 1.0;
        this.minScale = 0.2; // Minimum size before destruction
    }
    
    /**
     * Get color for mining effects based on resource type
     * @param {string} resourceType Resource type
     * @returns {number} Color as hexadecimal
     * @private
     */
    _getResourceColor(resourceType) {
        switch (resourceType.toLowerCase()) {
            case 'iron':
                return 0xA19D94; // Gray
            case 'gold':
                return 0xFFD700; // Gold
            case 'platinum':
                return 0xE5E4E2; // Silvery white
            default:
                return 0xCCCCCC; // Default gray
        }
    }
    
    /**
     * Initialize mining particle effects
     * @param {THREE.Scene} scene Scene to add particles to
     */
    initializeParticleEffects(scene) {
        // Create particle system for mining effects
        const particles = new THREE.BufferGeometry();
        const particleCount = 30;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const colorObj = new THREE.Color(this.miningEffectColor);
        
        for (let i = 0; i < particleCount; i++) {
            // Random positions around the asteroid
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            
            // Color with some variation
            colors[i * 3] = colorObj.r * (0.8 + Math.random() * 0.2);
            colors[i * 3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
            colors[i * 3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);
            
            // Random sizes
            sizes[i] = Math.random() * 0.3 + 0.1;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.miningParticles = new THREE.Points(particles, material);
        this.miningParticles.visible = false;
        scene.add(this.miningParticles);
    }
    
    /**
     * Show mining effect particles
     * @param {boolean} active Whether mining is active
     */
    showMiningEffect(active) {
        if (this.miningParticles) {
            this.miningParticles.visible = active;
            this.beingMined = active;
        }
    }
    
    /**
     * Update mining particle positions
     * @param {THREE.Vector3} position Position to update particles around
     */
    updateParticlePosition(position) {
        if (this.miningParticles) {
            this.miningParticles.position.copy(position);
        }
    }
    
    /**
     * Mine resources from the entity
     * @param {number} amount Amount to mine
     * @returns {object} Mining result
     */
    mine(amount) {
        // Check if the entity exists and is visible
        if (!this.entity || !this.entity.getComponent('MeshComponent')?.isVisible()) {
            return { type: this.resourceType, amount: 0, depleted: true };
        }
        
        // Record mine time for effects
        this.lastMineTime = Date.now();
        
        // Calculate how much can actually be mined
        const actualAmount = Math.min(amount, this.remainingAmount);
        this.remainingAmount -= actualAmount;
        
        // Update visual scale
        this._updateScale();
        
        // Return mining result
        return {
            type: this.resourceType,
            amount: actualAmount,
            depleted: this.isDepleted()
        };
    }
    
    /**
     * Update the object's scale based on remaining resources
     * @private
     */
    _updateScale() {
        const transform = this.entity.getComponent('TransformComponent');
        if (!transform) return;
        
        // Calculate new scale based on remaining resources
        const resourceRatio = this.remainingAmount / this.totalAmount;
        const scaleRatio = Math.max(this.minScale, resourceRatio);
        const newScale = this.startingScale * scaleRatio;
        
        // Apply new scale
        transform.setScale(newScale, newScale, newScale);
    }
    
    /**
     * Set initial scale as reference for depletion scaling
     * @param {number} scale Initial scale
     */
    setStartingScale(scale) {
        this.startingScale = scale;
    }
    
    /**
     * Check if the object is depleted
     * @returns {boolean} True if depleted
     */
    isDepleted() {
        return this.remainingAmount <= 0;
    }
    
    /**
     * Get the depletion percentage
     * @returns {number} Depletion percentage (0-100)
     */
    getDepletionPercentage() {
        return 100 - ((this.remainingAmount / this.totalAmount) * 100);
    }
    
    /**
     * Clean up resources when component is detached
     */
    onDetached() {
        // Remove particle system
        if (this.miningParticles && this.miningParticles.parent) {
            this.miningParticles.parent.remove(this.miningParticles);
        }
    }
}