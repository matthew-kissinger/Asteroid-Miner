/**
 * Explosion Effects Module
 * 
 * Handles explosion visual effects including instant tracers and pooled explosions
 */

import * as THREE from 'three';

export class ExplosionEffects {
    activeTracers: THREE.Group[] = [];

    constructor() {
    }

    /**
     * Create an explosion effect at the given position
     * @param {THREE.Vector3} position Position for the explosion
     * @param {number} duration Duration of the explosion in milliseconds
     * @param {boolean} _isVisible Whether the explosion should be visible
     * @param {Object} poolManager Pool manager for getting explosion objects
     * @param {Function} addToScene Function to add objects to scene
     */
    createExplosionEffect(position: THREE.Vector3, duration: number = 1000, _isVisible: boolean = true, poolManager: any = null, addToScene: ((obj: THREE.Object3D) => void) | null = null) {
        try {
            let explosion: any = null;
            
            // Try to get explosion from poolManager
            if (poolManager && poolManager.getExplosion) {
                explosion = poolManager.getExplosion(position, duration);
            }
            
            // If no explosion from pool, create a simple one
            if (!explosion) {
                // Create a simple explosion mesh
                const geometry = new THREE.SphereGeometry(30, 16, 16);
                const material = new THREE.MeshBasicMaterial({
                    color: 0xff6600,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending
                });
                const emissiveMaterial = material as THREE.MeshBasicMaterial & {
                    emissive?: THREE.ColorRepresentation;
                    emissiveIntensity?: number;
                };
                emissiveMaterial.emissive = 0xff3300;
                emissiveMaterial.emissiveIntensity = 2;
                
                explosion = new THREE.Mesh(geometry, material);
                explosion.position.copy(position);
                
                // Add to scene if function provided
                if (addToScene) {
                    addToScene(explosion);
                } else if ((window as any).game && (window as any).game.scene) {
                    (window as any).game.scene.add(explosion);
                }
                
                // Animate the explosion
                const startTime = Date.now();
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = elapsed / duration;
                    
                    if (progress >= 1 || !explosion.parent) {
                        // Remove explosion
                        if (explosion.parent) {
                            explosion.parent.remove(explosion);
                        }
                        geometry.dispose();
                        material.dispose();
                        return;
                    }
                    
                    // Expand and fade
                    const expansionScale = 1 + progress * 3;
                    explosion.scale.setScalar(expansionScale);
                    material.opacity = 0.9 * (1 - progress);
                    
                    requestAnimationFrame(animate);
                };
                
                animate();
            }
            
            // Play explosion sound
            if ((window as any).game && (window as any).game.audio) {
                (window as any).game.audio.playSound('boink');
            }
            
            return explosion;
        } catch (error) {
            console.error("Error creating explosion effect:", error);
            return null;
        }
    }

    /**
     * Create an instant plasma beam with hot glow
     * @param {THREE.Vector3} startPos Starting position of the beam
     * @param {THREE.Vector3} endPos End position of the beam (hit point or max range)
     * @param {boolean} isHit Whether this beam hit a target
     * @param {number} fadeTime Time in seconds for the beam to fade
     * @param {Function} addToScene Function to add objects to scene
     */
    createInstantTracer(startPos: THREE.Vector3, endPos: THREE.Vector3, isHit: boolean = false, fadeTime: number = 0.5, addToScene: ((obj: THREE.Object3D) => void) | null = null) {
        const distance = startPos.distanceTo(endPos);
        
        // Create multiple cylinders for a layered plasma effect
        const beamGroup = new THREE.Group();
        
        // Core beam - bright white/yellow hot plasma
        const coreGeometry = new THREE.CylinderGeometry(1.5, 1.5, distance, 12);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa, // Hot yellow-white
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        
        // Inner glow - orange-white plasma
        const innerGlowGeometry = new THREE.CylinderGeometry(3, 3, distance, 8);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: isHit ? 0xffaa00 : 0xff8800, // Orange for hits, red-orange for misses
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        
        // Outer glow - cooler blue-cyan edge
        const outerGlowGeometry = new THREE.CylinderGeometry(5, 5, distance, 6);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: isHit ? 0x00ffff : 0x0088ff, // Cyan for hits, blue for misses
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        
        // Add all layers to the group
        beamGroup.add(coreMesh);
        beamGroup.add(innerGlowMesh);
        beamGroup.add(outerGlowMesh);
        
        // Position and orient the entire beam group
        const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        beamGroup.position.copy(midpoint);
        
        // Orient the cylinders along the beam direction
        const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        beamGroup.quaternion.copy(quaternion);
        
        if (addToScene) {
            addToScene(beamGroup);
        }
        
        // Store beam data for progressive fade animation
        beamGroup.userData = {
            startTime: performance.now(),
            fadeTime: fadeTime * 1000,
            beamLength: distance,
            startPos: startPos.clone(),
            endPos: endPos.clone(),
            direction: direction.clone(),
            coreMesh: coreMesh,
            innerGlowMesh: innerGlowMesh,
            outerGlowMesh: outerGlowMesh,
            initialCoreOpacity: 1.0,
            initialInnerOpacity: 0.6,
            initialOuterOpacity: 0.3,
            isDissolving: false
        };
        
        // Add to active tracers list for update loop
        this.activeTracers.push(beamGroup);
        
        return beamGroup;
    }

    /**
     * Update active tracer beams - fade them out from start to end
     * @param {number} _deltaTime Time since last update
     * @param {Function} removeFromScene Function to remove objects from scene
     */
    updateTracers(_deltaTime: number, removeFromScene: ((obj: THREE.Object3D) => void) | null = null) {
        if (!this.activeTracers || this.activeTracers.length === 0) return;
        
        const currentTime = performance.now();
        const tracersToRemove: number[] = [];
        
        for (let i = this.activeTracers.length - 1; i >= 0; i--) {
            const beamGroup = this.activeTracers[i];
            const userData = beamGroup.userData;
            
            if (!userData) continue;
            
            const elapsed = currentTime - userData.startTime;
            const fadeProgress = Math.min(elapsed / userData.fadeTime, 1.0);
            
            if (fadeProgress >= 1.0) {
                // Remove entire beam group
                if (removeFromScene) {
                    removeFromScene(beamGroup);
                }
                tracersToRemove.push(i);
            } else {
                // Progressive dissolve from start to end
                // The beam shortens from the start point toward the end point
                const dissolveDistance = userData.beamLength * fadeProgress;
                
                // Calculate new start position (moves toward end as it dissolves)
                const newStartOffset = userData.direction.clone().multiplyScalar(dissolveDistance);
                const newStartPos = userData.startPos.clone().add(newStartOffset);
                
                // Calculate new beam length
                const newLength = userData.beamLength * (1.0 - fadeProgress);
                
                if (newLength > 0.1) {
                    // Update beam geometry to be shorter
                    // We need to recreate the cylinders with new height
                    userData.coreMesh.geometry.dispose();
                    userData.innerGlowMesh.geometry.dispose();
                    userData.outerGlowMesh.geometry.dispose();
                    
                    userData.coreMesh.geometry = new THREE.CylinderGeometry(1.5, 1.5, newLength, 12);
                    userData.innerGlowMesh.geometry = new THREE.CylinderGeometry(3, 3, newLength, 8);
                    userData.outerGlowMesh.geometry = new THREE.CylinderGeometry(5, 5, newLength, 6);
                    
                    // Update position to new midpoint
                    const newMidpoint = new THREE.Vector3().addVectors(newStartPos, userData.endPos).multiplyScalar(0.5);
                    beamGroup.position.copy(newMidpoint);
                    
                    // Also fade opacity slightly as it dissolves
                    const opacityFactor = Math.pow(1.0 - fadeProgress, 0.3); // Slower opacity fade
                    userData.coreMesh.material.opacity = userData.initialCoreOpacity * opacityFactor;
                    userData.innerGlowMesh.material.opacity = userData.initialInnerOpacity * opacityFactor;
                    userData.outerGlowMesh.material.opacity = userData.initialOuterOpacity * opacityFactor;
                }
            }
        }
        
        // Remove completed tracers from the array
        // Sort indices in descending order to avoid splicing issues
        tracersToRemove.sort((a, b) => b - a);
        for (const index of tracersToRemove) {
            this.activeTracers.splice(index, 1);
        }
    }

    /**
     * Clean up explosion effects resources
     */
    dispose(): void {
        this.activeTracers = [];
    }
}
