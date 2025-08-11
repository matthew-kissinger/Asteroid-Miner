/**
 * TrailComponent - Creates a plasma energy trail with dynamic geometry
 * 
 * Uses advanced shader effects to create a dynamic plasma trail with electric arcs
 */

import { Component } from '../../core/component.js';
import * as THREE from 'three';

export class TrailComponent extends Component {
    /**
     * Creates a new plasma trail component
     * @param {Object} config Trail configuration
     */
    constructor(config = {}) {
        super();
        
        // Trail configuration
        this.maxPoints = config.maxPoints || 60;          // More points for smoother trail
        this.pointDistance = config.pointDistance || 2;   // Smaller distance for smoother trail
        this.width = config.width || 15;                  // Base trail width
        this.color = config.color || 0x00ddff;            // Plasma blue color
        this.coreColor = config.coreColor || 0xffffff;    // White hot core
        this.fadeTime = config.fadeTime || 0.8;           // Faster fade for energy effect
        this.transparent = config.transparent !== undefined ? config.transparent : true;
        this.alphaTest = config.alphaTest || 0.01;
        this.blending = config.blending || THREE.AdditiveBlending;
        this.pulse = config.pulse !== undefined ? config.pulse : true;  // Enable pulsing by default
        this.pulseSpeed = config.pulseSpeed || 2.0;       // Faster pulsing
        this.tapering = config.tapering !== undefined ? config.tapering : true;  // Enable tapering
        this.glow = config.glow !== undefined ? config.glow : true;  // Enable glow
        this.thrustPower = 0;                             // Current thrust power (0-1)
        this.trailType = config.trailType || 'main';      // Type of trail (main, left, right)
        
        // Internal state
        this.points = [];                                 // Trail points
        this.times = [];                                  // Time each point was added
        this.widths = [];                                 // Width at each point
        this.lastPosition = new THREE.Vector3();          // Last recorded position
        this.initialized = false;                         // Whether trail has been initialized
        this.trailMesh = null;                            // Main trail mesh
        this.coreMesh = null;                             // Core energy mesh
        this.electricArcs = [];                           // Electric arc effects
        this.trailGeometry = null;                        // Trail geometry
        this.trailMaterial = null;                        // Trail material
        this.isActive = true;                             // Whether trail is active
        this.time = 0;                                    // Time accumulator for animations
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
     * Initialize plasma trail visuals with dynamic geometry
     */
    initializeTrail() {
        // Create dynamic ribbon geometry for smooth trail
        const vertices = [];
        const uvs = [];
        
        // Create ribbon vertices (2 vertices per point for width)
        for (let i = 0; i < this.maxPoints; i++) {
            vertices.push(0, 0, 0); // Left vertex
            vertices.push(0, 0, 0); // Right vertex
            uvs.push(0, i / this.maxPoints);
            uvs.push(1, i / this.maxPoints);
        }
        
        // Create faces for ribbon
        const indices = [];
        for (let i = 0; i < this.maxPoints - 1; i++) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = i * 2 + 2;
            const d = i * 2 + 3;
            
            // Two triangles per segment
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
        
        this.trailGeometry = new THREE.BufferGeometry();
        this.trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.trailGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        this.trailGeometry.setIndex(indices);
        
        // Add custom attributes for effects
        const alphas = new Float32Array(this.maxPoints * 2);
        const energyLevels = new Float32Array(this.maxPoints * 2);
        this.trailGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        this.trailGeometry.setAttribute('energy', new THREE.BufferAttribute(energyLevels, 1));
        
        // Create plasma shader material
        this.trailMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(this.color) },
                coreColor: { value: new THREE.Color(this.coreColor) },
                thrustPower: { value: 0 },
                opacity: { value: 1.0 }
            },
            vertexShader: `
                attribute float alpha;
                attribute float energy;
                varying float vAlpha;
                varying float vEnergy;
                varying vec2 vUv;
                
                void main() {
                    vAlpha = alpha;
                    vEnergy = energy;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform vec3 coreColor;
                uniform float thrustPower;
                uniform float opacity;
                
                varying float vAlpha;
                varying float vEnergy;
                varying vec2 vUv;
                
                void main() {
                    // Create plasma effect with hot core
                    float coreIntensity = 1.0 - abs(vUv.x - 0.5) * 2.0;
                    coreIntensity = pow(coreIntensity, 2.0);
                    
                    // Energy pulse effect
                    float pulse = sin(time * 4.0 + vUv.y * 10.0) * 0.2 + 0.8;
                    
                    // Mix core and outer colors
                    vec3 finalColor = mix(color, coreColor, coreIntensity * vEnergy);
                    
                    // Add electric arc effect
                    float arc = sin(vUv.y * 50.0 + time * 20.0) * 0.1;
                    finalColor += vec3(arc) * vEnergy;
                    
                    // Apply alpha and energy
                    float finalAlpha = vAlpha * coreIntensity * pulse * opacity * thrustPower;
                    
                    gl_FragColor = vec4(finalColor, finalAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create the trail mesh
        this.trailMesh = new THREE.Mesh(this.trailGeometry, this.trailMaterial);
        this.trailMesh.frustumCulled = false;
        
        // Create additional core energy line for extra glow
        const coreGeometry = new THREE.BufferGeometry();
        const corePositions = new Float32Array(this.maxPoints * 3);
        coreGeometry.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
        coreGeometry.setDrawRange(0, 0);
        
        const coreMaterial = new THREE.LineBasicMaterial({
            color: this.coreColor,
            linewidth: 2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.coreMesh = new THREE.Line(coreGeometry, coreMaterial);
        this.coreMesh.frustumCulled = false;
        
        // Mark as initialized
        this.initialized = true;
        
        // Add to scene if available
        if (this.entity && this.entity.world && this.entity.world.scene) {
            this.entity.world.scene.add(this.trailMesh);
            this.entity.world.scene.add(this.coreMesh);
        } else if (window.game && window.game.scene) {
            window.game.scene.add(this.trailMesh);
            window.game.scene.add(this.coreMesh);
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
        
        if (this.coreMesh && this.coreMesh.parent) {
            this.coreMesh.parent.remove(this.coreMesh);
        }
        
        // Clean up electric arcs
        for (const arc of this.electricArcs) {
            if (arc.mesh && arc.mesh.parent) {
                arc.mesh.parent.remove(arc.mesh);
                if (arc.mesh.geometry) arc.mesh.geometry.dispose();
                if (arc.mesh.material) arc.mesh.material.dispose();
            }
        }
        this.electricArcs = [];
        
        if (this.trailGeometry) {
            this.trailGeometry.dispose();
        }
        
        if (this.trailMaterial) {
            this.trailMaterial.dispose();
        }
        
        if (this.coreMesh && this.coreMesh.geometry) {
            this.coreMesh.geometry.dispose();
        }
        
        if (this.coreMesh && this.coreMesh.material) {
            this.coreMesh.material.dispose();
        }
    }
    
    /**
     * Update the plasma trail
     * @param {number} deltaTime Time since last update in seconds
     * @param {number} thrustPower Current thrust power (0-1)
     */
    update(deltaTime, thrustPower = 0) {
        if (!this.initialized || !this.isActive || !this.entity) return;
        
        this.time += deltaTime;
        this.thrustPower = thrustPower;
        
        // Get transform
        const transform = this.entity.getComponent('TransformComponent');
        if (!transform) return;
        
        // Calculate distance moved
        const distance = transform.position.distanceTo(this.lastPosition);
        
        // Only add new point if moved enough distance or thrusting
        if (distance >= this.pointDistance || thrustPower > 0.1) {
            // Add current position to points array
            this.points.unshift(transform.position.clone());
            this.times.unshift(performance.now());
            this.widths.unshift(this.width * (0.5 + thrustPower * 0.5)); // Dynamic width based on thrust
            
            // Limit number of points
            if (this.points.length > this.maxPoints) {
                this.points.pop();
                this.times.pop();
                this.widths.pop();
            }
            
            // Update last position
            this.lastPosition.copy(transform.position);
            
            // Update trail visual
            this.updateTrailGeometry();
        }
        
        // Update shader uniforms
        if (this.trailMaterial && this.trailMaterial.uniforms) {
            this.trailMaterial.uniforms.time.value = this.time;
            this.trailMaterial.uniforms.thrustPower.value = thrustPower;
        }
        
        // Always update trail effects
        this.updateTrailEffects(deltaTime);
    }
    
    /**
     * Update plasma trail ribbon geometry
     */
    updateTrailGeometry() {
        if (!this.trailGeometry || this.points.length < 2) return;
        
        const positions = this.trailGeometry.attributes.position.array;
        const alphas = this.trailGeometry.attributes.alpha.array;
        const energies = this.trailGeometry.attributes.energy.array;
        
        // Get transform for orientation
        const transform = this.entity.getComponent('TransformComponent');
        if (!transform) return;
        
        // Update ribbon vertices
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            const width = this.widths[i] || this.width;
            
            // Calculate perpendicular vector for ribbon width
            let perpVector;
            if (i < this.points.length - 1) {
                const nextPoint = this.points[i + 1];
                const direction = new THREE.Vector3().subVectors(point, nextPoint).normalize();
                perpVector = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
            } else if (i > 0) {
                const prevPoint = this.points[i - 1];
                const direction = new THREE.Vector3().subVectors(prevPoint, point).normalize();
                perpVector = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
            } else {
                perpVector = new THREE.Vector3(1, 0, 0);
            }
            
            // Taper width based on position in trail
            const taperFactor = this.tapering ? (1 - i / this.points.length) : 1;
            const currentWidth = width * taperFactor;
            
            // Set left and right vertices
            const leftVertex = point.clone().add(perpVector.clone().multiplyScalar(currentWidth * 0.5));
            const rightVertex = point.clone().sub(perpVector.clone().multiplyScalar(currentWidth * 0.5));
            
            positions[i * 6] = leftVertex.x;
            positions[i * 6 + 1] = leftVertex.y;
            positions[i * 6 + 2] = leftVertex.z;
            positions[i * 6 + 3] = rightVertex.x;
            positions[i * 6 + 4] = rightVertex.y;
            positions[i * 6 + 5] = rightVertex.z;
            
            // Calculate fade based on time
            const now = performance.now();
            const age = (now - this.times[i]) / 1000;
            const fadeRatio = Math.max(0, 1 - (age / this.fadeTime));
            
            // Set alpha and energy values
            alphas[i * 2] = fadeRatio;
            alphas[i * 2 + 1] = fadeRatio;
            energies[i * 2] = fadeRatio * this.thrustPower;
            energies[i * 2 + 1] = fadeRatio * this.thrustPower;
        }
        
        // Update core line
        if (this.coreMesh && this.coreMesh.geometry) {
            const corePositions = this.coreMesh.geometry.attributes.position.array;
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                corePositions[i * 3] = point.x;
                corePositions[i * 3 + 1] = point.y;
                corePositions[i * 3 + 2] = point.z;
            }
            this.coreMesh.geometry.attributes.position.needsUpdate = true;
            this.coreMesh.geometry.setDrawRange(0, this.points.length);
        }
        
        // Mark as needing update
        this.trailGeometry.attributes.position.needsUpdate = true;
        this.trailGeometry.attributes.alpha.needsUpdate = true;
        this.trailGeometry.attributes.energy.needsUpdate = true;
    }
    
    /**
     * Update plasma trail effects and animations
     */
    updateTrailEffects(deltaTime) {
        if (!this.trailGeometry || this.points.length === 0) return;
        
        // Update electric arc effects randomly
        if (Math.random() < 0.05 * this.thrustPower && this.points.length > 5) {
            this.createElectricArc();
        }
        
        // Update existing arcs
        for (let i = this.electricArcs.length - 1; i >= 0; i--) {
            const arc = this.electricArcs[i];
            arc.life -= deltaTime;
            
            if (arc.life <= 0) {
                // Remove expired arc
                if (arc.mesh && arc.mesh.parent) {
                    arc.mesh.parent.remove(arc.mesh);
                    if (arc.mesh.geometry) arc.mesh.geometry.dispose();
                    if (arc.mesh.material) arc.mesh.material.dispose();
                }
                this.electricArcs.splice(i, 1);
            } else {
                // Update arc opacity
                if (arc.mesh && arc.mesh.material) {
                    arc.mesh.material.opacity = arc.life / arc.maxLife;
                }
            }
        }
    }
    
    /**
     * Create an electric arc effect
     */
    createElectricArc() {
        if (this.points.length < 2) return;
        
        // Pick random points for arc
        const startIdx = Math.floor(Math.random() * (this.points.length - 1));
        const endIdx = Math.min(startIdx + Math.floor(Math.random() * 5) + 1, this.points.length - 1);
        
        const startPoint = this.points[startIdx];
        const endPoint = this.points[endIdx];
        
        // Create arc geometry with jagged path
        const arcPoints = [];
        const segments = 5;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
            
            // Add random offset for electric effect
            if (i > 0 && i < segments) {
                point.x += (Math.random() - 0.5) * 2;
                point.y += (Math.random() - 0.5) * 2;
                point.z += (Math.random() - 0.5) * 2;
            }
            
            arcPoints.push(point);
        }
        
        const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arcMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const arcMesh = new THREE.Line(arcGeometry, arcMaterial);
        
        // Add to scene
        const scene = this.entity?.world?.scene || window.game?.scene;
        if (scene) {
            scene.add(arcMesh);
            
            // Track arc for cleanup
            this.electricArcs.push({
                mesh: arcMesh,
                life: 0.2,
                maxLife: 0.2
            });
        }
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