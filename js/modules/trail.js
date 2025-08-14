// trail.js - Thruster exhaust effects for spaceship

import * as THREE from 'three';

export class TrailEffects {
    constructor(scene, mesh) {
        this.scene = scene;
        this.mesh = mesh; // The spaceship mesh
        this.thrusterEffects = [];
        this.time = 0;
        
        // Initialize effects
        this.createThrusterEffects();
    }
    
    createThrusterEffects() {
        // Create exhaust beam effect using multiple overlapping cylinders
        const createExhaustBeam = (position, direction, config) => {
            const { baseRadius, length, color, glowColor, type } = config;
            const group = new THREE.Group();
            
            // Create multiple cylinder segments for tapered effect
            const segments = 8;
            const beams = [];
            
            for (let i = 0; i < segments; i++) {
                const t = i / segments;
                
                // Taper the radius
                const topRadius = baseRadius * (1 - t * 0.7);
                const bottomRadius = baseRadius * (1 - (t + 1/segments) * 0.7);
                const segmentLength = length / segments;
                
                // Create cylinder geometry
                const geometry = new THREE.CylinderGeometry(
                    topRadius,
                    bottomRadius,
                    segmentLength,
                    12, // More segments for smoother look
                    1,
                    false
                );
                
                // Create material with gradient
                const material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color).lerp(new THREE.Color(glowColor), t),
                    transparent: true,
                    opacity: 1.0 - t * 0.3, // High opacity
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthTest: false // Always render on top
                });
                
                const beam = new THREE.Mesh(geometry, material);
                
                // Position each segment along the exhaust direction
                if (direction.z !== 0) {
                    // Main/reverse thrusters - point along Z
                    geometry.rotateX(Math.PI / 2);
                    beam.position.z = direction.z * (i * segmentLength + segmentLength/2);
                } else if (direction.x !== 0) {
                    // Side thrusters - point along X (perpendicular to ship)
                    geometry.rotateZ(Math.PI / 2);
                    beam.position.x = direction.x * (i * segmentLength + segmentLength/2);
                }
                
                beams.push({ mesh: beam, material });
                group.add(beam);
            }
            
            // Position the group at the thruster location
            group.position.copy(position);
            
            group.visible = false;
            
            // Debug: log thruster creation  
            // console.log(`Created ${type} thruster at position:`, position);
            this.mesh.add(group);
            
            return { group, beams, type };
        };
        
        // Main thruster - big blue/orange exhaust
        this.thrusterEffects.push(createExhaustBeam(
            new THREE.Vector3(0, 0, 1.2), // Back of ship (ship scale is 2.0)
            new THREE.Vector3(0, 0, 1), // Points backward
            {
                baseRadius: 0.25, // Scaled for ship size
                length: 2.5, // Good length for exhaust
                color: 0xffaa00, // Orange core
                glowColor: 0x0088ff, // Blue edges
                type: 'main'
            }
        ));
        
        // RIGHT side thruster - fires when A pressed to push ship LEFT
        this.thrusterEffects.push(createExhaustBeam(
            new THREE.Vector3(0.7, 0, 0.2), // Right side of ship
            new THREE.Vector3(1, 0, 0), // Shoots right (away from ship)
            {
                baseRadius: 0.15,
                length: 1.0, // Shorter exhaust
                color: 0xffaa00,
                glowColor: 0x00aaff,
                type: 'right_thruster' // RIGHT thruster
            }
        ));
        
        // LEFT side thruster - fires when D pressed to push ship RIGHT
        this.thrusterEffects.push(createExhaustBeam(
            new THREE.Vector3(-0.7, 0, 0.2), // Left side of ship
            new THREE.Vector3(-1, 0, 0), // Shoots left (away from ship)
            {
                baseRadius: 0.15,
                length: 1.0, // Shorter exhaust
                color: 0xffaa00,
                glowColor: 0x00aaff,
                type: 'left_thruster' // LEFT thruster
            }
        ));
        
        // Reverse thruster
        this.thrusterEffects.push(createExhaustBeam(
            new THREE.Vector3(0, 0, -1.2), // Front of ship
            new THREE.Vector3(0, 0, -1), // Points forward
            {
                baseRadius: 0.2,
                length: 1.8,
                color: 0xff8800,
                glowColor: 0xff4400,
                type: 'reverse'
            }
        ));
    }
    
    updateParticles(thrust, velocity) {
        this.time += 0.016;
        
        // Check window.inputIntent for keyboard controls
        const intent = window.inputIntent || 0;
        const leftPressed = thrust.left || ((intent & 4) !== 0);  // A key
        const rightPressed = thrust.right || ((intent & 8) !== 0); // D key
        
        // Update each thruster effect
        this.thrusterEffects.forEach(effect => {
            const { group, beams, type } = effect;
            
            let shouldShow = false;
            let intensity = 0;
            
            // Determine visibility based on thrust
            switch(type) {
                case 'main':
                    shouldShow = thrust.forward || velocity.length() > 1.0;
                    intensity = thrust.forward ? (thrust.boost ? 1.5 : 1.0) : 0.5;
                    break;
                case 'right_thruster':
                    // RIGHT thruster fires when A pressed (to move ship LEFT)
                    shouldShow = leftPressed; // A key
                    intensity = thrust.boost ? 1.5 : 1.2;
                    // if (shouldShow) console.log('RIGHT thruster firing to move LEFT');
                    break;
                case 'left_thruster':
                    // LEFT thruster fires when D pressed (to move ship RIGHT)
                    shouldShow = rightPressed; // D key
                    intensity = thrust.boost ? 1.5 : 1.2;
                    // if (shouldShow) console.log('LEFT thruster firing to move RIGHT');
                    break;
                case 'reverse':
                    shouldShow = thrust.backward;
                    intensity = thrust.boost ? 1.3 : 1.0;
                    break;
            }
            
            group.visible = shouldShow;
            
            if (shouldShow && beams) {
                // Animate the exhaust
                beams.forEach((beam, index) => {
                    const t = index / beams.length;
                    
                    // Very subtle flicker
                    const flicker = 0.95 + Math.sin(this.time * 10 + index) * 0.05;
                    
                    // Update opacity for animation - ensure visibility
                    beam.material.opacity = Math.max(0.7, (1.0 - t * 0.2) * intensity * flicker);
                    
                    // Subtle scale animation
                    beam.mesh.scale.x = beam.mesh.scale.y = 1.0 + Math.sin(this.time * 8 + index) * 0.05;
                    beam.mesh.scale.z = 1.0 + intensity * 0.3; // Longer when boosting
                });
            }
        });
    }
    
    updateTrailVisibility(isMoving, thrust, velocity) {
        // Update main thruster visibility based on movement
        const mainEffect = this.thrusterEffects.find(e => e.type === 'main');
        if (mainEffect) {
            const shouldShow = thrust.forward || (isMoving && velocity.length() > 2.0);
            mainEffect.group.visible = shouldShow;
        }
    }
    
    dispose() {
        // Clean up all thruster effects
        this.thrusterEffects.forEach(effect => {
            if (effect.group) {
                if (effect.group.parent) {
                    effect.group.parent.remove(effect.group);
                }
                
                // Dispose of all children
                effect.group.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        });
        
        this.thrusterEffects = [];
    }
}