/**
 * TrailComponent - Creates a visual trail behind entities
 * 
 * Uses THREE.js Line object to create a trailing effect behind entities as they move.
 */

import { Component } from '../../core/component.js';
// THREE is available globally, no need to import

export class TrailComponent extends Component {
    /**
     * Creates a new trail component
     * @param {Object} config Trail configuration
     */
    constructor(config = {}) {
        super();
        
        // Trail configuration
        this.maxPoints = config.maxPoints || 50;          // Maximum number of points in trail
        this.pointDistance = config.pointDistance || 5;   // Min distance to record a new point
        this.width = config.width || 10;                  // Trail width
        this.color = config.color || 0xffffff;            // Trail color
        this.fadeTime = config.fadeTime || 1.0;           // Time in seconds to fade out
        this.transparent = config.transparent !== undefined ? config.transparent : true;
        this.alphaTest = config.alphaTest || 0.01;
        this.blending = config.blending || THREE.NormalBlending;
        this.pulse = config.pulse || false;               // Whether trail should pulse
        this.pulseSpeed = config.pulseSpeed || 1.0;       // Speed of pulsing
        this.tapering = config.tapering || false;         // Whether trail should taper
        this.glow = config.glow || false;                 // Glow effect
        
        // Internal state
        this.points = [];                                 // Trail points
        this.times = [];                                  // Time each point was added
        this.lastPosition = new THREE.Vector3();          // Last recorded position
        this.initialized = false;                         // Whether trail has been initialized
        this.trailMesh = null;                            // THREE.js mesh for trail
        this.trailGeometry = null;                        // Trail geometry
        this.trailMaterial = null;                        // Trail material
        this.isActive = true;                             // Whether trail is active
    }
    
    /**
     * Called when component is attached to an entity
     */
    onAttached() {
        if (!this.entity) return;
        
        // Get transform component
        const transform = this.entity.getComponent('TransformComponent');
        if (!transform) {
            console.warn('TrailComponent requires a TransformComponent on the entity');
            return;
        }
        
        // Initialize trail with current position
        this.lastPosition.copy(transform.position);
        this.initializeTrail();
    }
    
    /**
     * Initialize trail visuals
     */
    initializeTrail() {
        // Create a basic line geometry
        this.trailGeometry = new THREE.BufferGeometry();
        
        // Create positions array (3 values per point - x, y, z)
        const positions = new Float32Array(this.maxPoints * 3);
        this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create colors array (3 values per point - r, g, b)
        const colors = new Float32Array(this.maxPoints * 3);
        this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Set default values and usage for dynamic updates
        this.trailGeometry.setDrawRange(0, 0);
        this.trailGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
        this.trailGeometry.attributes.color.setUsage(THREE.DynamicDrawUsage);
        
        // Create material based on configuration
        this.trailMaterial = new THREE.LineBasicMaterial({
            color: this.color,
            vertexColors: true,
            linewidth: 1, // Note: Line width is often limited to 1 by WebGL
            transparent: this.transparent,
            alphaTest: this.alphaTest,
            blending: this.blending
        });
        
        // Create the actual mesh
        this.trailMesh = new THREE.Line(this.trailGeometry, this.trailMaterial);
        this.trailMesh.frustumCulled = false; // Avoid frustum culling issues
        
        // Mark as initialized
        this.initialized = true;
        
        // Add to scene if available
        if (this.entity && this.entity.world && this.entity.world.scene) {
            this.entity.world.scene.add(this.trailMesh);
        } else {
            console.warn('TrailComponent: No scene available to add trail mesh');
        }
    }
    
    /**
     * Called when component is detached from an entity
     */
    onDetached() {
        // Clean up THREE.js objects
        if (this.trailMesh && this.trailMesh.parent) {
            this.trailMesh.parent.remove(this.trailMesh);
        }
        
        if (this.trailGeometry) {
            this.trailGeometry.dispose();
        }
        
        if (this.trailMaterial) {
            this.trailMaterial.dispose();
        }
    }
    
    /**
     * Update the trail
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.initialized || !this.isActive || !this.entity) return;
        
        // Get transform
        const transform = this.entity.getComponent('TransformComponent');
        if (!transform) return;
        
        // Calculate distance moved
        const distance = transform.position.distanceTo(this.lastPosition);
        
        // Only add new point if moved enough distance
        if (distance >= this.pointDistance) {
            // Add current position to points array
            this.points.unshift(transform.position.clone());
            this.times.unshift(performance.now());
            
            // Limit number of points
            if (this.points.length > this.maxPoints) {
                this.points.pop();
                this.times.pop();
            }
            
            // Update last position
            this.lastPosition.copy(transform.position);
            
            // Update trail visual
            this.updateTrailGeometry();
        }
        
        // Always update trail colors for fading effect
        this.updateTrailColors();
    }
    
    /**
     * Update trail geometry with current points
     */
    updateTrailGeometry() {
        if (!this.trailGeometry || this.points.length === 0) return;
        
        // Get positions attribute
        const positions = this.trailGeometry.attributes.position.array;
        
        // Update all points
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        }
        
        // Mark positions as needing update
        this.trailGeometry.attributes.position.needsUpdate = true;
        
        // Update draw range
        this.trailGeometry.setDrawRange(0, this.points.length);
    }
    
    /**
     * Update trail colors based on fade time
     */
    updateTrailColors() {
        if (!this.trailGeometry || this.points.length === 0) return;
        
        // Get colors attribute
        const colors = this.trailGeometry.attributes.color.array;
        const now = performance.now();
        
        // Convert hex color to RGB
        const baseColor = new THREE.Color(this.color);
        
        // Update colors
        for (let i = 0; i < this.points.length; i++) {
            // Calculate fade based on time
            const age = (now - this.times[i]) / 1000;
            const fadeRatio = Math.max(0, 1 - (age / this.fadeTime));
            
            // Apply pulsing if enabled
            let alpha = fadeRatio;
            if (this.pulse) {
                const pulsePhase = (now / 1000) * this.pulseSpeed;
                const pulseValue = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2);
                alpha *= 0.7 + 0.3 * pulseValue;
            }
            
            // Apply tapering if enabled
            if (this.tapering) {
                // Taper based on position in trail (newer points are larger)
                const taperRatio = 1 - (i / this.points.length);
                alpha *= taperRatio;
            }
            
            // Set colors with alpha
            colors[i * 3] = baseColor.r;
            colors[i * 3 + 1] = baseColor.g;
            colors[i * 3 + 2] = baseColor.b * alpha; // Use blue channel for alpha effect
        }
        
        // Mark colors as needing update
        this.trailGeometry.attributes.color.needsUpdate = true;
    }
    
    /**
     * Set trail active/inactive
     * @param {boolean} active Whether trail should be active
     */
    setActive(active) {
        this.isActive = active;
        if (this.trailMesh) {
            this.trailMesh.visible = active;
        }
    }
    
    /**
     * Clear all trail points
     */
    clear() {
        this.points = [];
        this.times = [];
        if (this.trailGeometry) {
            this.trailGeometry.setDrawRange(0, 0);
        }
    }
} 