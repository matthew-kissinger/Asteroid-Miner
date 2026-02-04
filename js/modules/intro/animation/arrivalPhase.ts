// arrivalPhase.ts - Manages the ship arrival phase of the intro sequence

import * as THREE from 'three';
import type { IntroSequenceAnimationContext } from '../../introSequence.ts';

/**
 * Update the arrival phase animation (portal, ship arrival and player deployment)
 * @param {number} progress - Progress through arrival phase (0-1)
 * @param {any} context - Context object containing all necessary references
 */
export function updateArrivalPhase(progress: number, context: IntroSequenceAnimationContext): void {
    const {
        portalEffect,
        starDreadnought,
        camera,
        spaceship,
        introSounds,
        flashOverlay
    } = context;
    
    // Portal animation
    portalEffect.updatePortalEffect();
    
    // Position portal outside the asteroid belt
    portalEffect.setPosition(new THREE.Vector3(30000, 5000, 0));
    portalEffect.setRotation(new THREE.Euler(0, 0, Math.PI/2));
    
    // PORTAL GROWTH phase (0-0.2)
    if (progress < 0.2) {
        // Grow portal
        const portalProgress = progress / 0.2;
        const portalScale = portalProgress * 3.5;
        portalEffect.setScale(portalScale);
        
        // Medium-distance side view of portal formation
        camera.position.set(0, 6000, 12000);
        camera.lookAt(30000, 5000, 0); // Look at portal
    }
    
    // SHIP EMERGENCE and JOURNEY phase (0.2-0.7)
    if (progress >= 0.2 && progress < 0.7) {
        // Make ship visible when it first emerges
        if (progress >= 0.2 && !starDreadnought.ship.visible) {
            starDreadnought.ship.visible = true;
            flashOverlay(0.3);
            
            // Play arrival sound using Tone.js
            if (introSounds.shipArrival) {
                introSounds.shipArrival.play();
            }
        }
        
        // Smooth continuous movement along Bezier curve
        const t = (progress - 0.2) / 0.5; // Normalized time for this phase
        const easeInOut = t < 0.5 
            ? 2 * t * t 
            : 1 - Math.pow(-2 * t + 2, 2) / 2;
        
        // Bezier curve control points for ship path
        const start = new THREE.Vector3(30000, 5000, 0);        // Portal position
        const control = new THREE.Vector3(26000, 5300, -2000);  // Control point for curve
        const end = new THREE.Vector3(22000, 5000, 0);          // Final position above belt
        
        // Calculate position along quadratic Bezier curve
        const p0 = new THREE.Vector3();
        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();
        
        p0.copy(start).multiplyScalar(Math.pow(1-easeInOut, 2));
        p1.copy(control).multiplyScalar(2 * (1-easeInOut) * easeInOut);
        p2.copy(end).multiplyScalar(easeInOut * easeInOut);
        
        const position = new THREE.Vector3()
            .add(p0)
            .add(p1)
            .add(p2);
        
        // Add subtle vertical oscillation like a naval vessel
        position.y += Math.sin(progress * Math.PI * 3) * 80;
        
        // Update ship position
        starDreadnought.ship.position.copy(position);
        
        // Engine power during journey
        const enginePower = 0.4 + easeInOut * 0.6;
        starDreadnought.setEnginesPower(enginePower);
        
        // Fade out portal as ship moves away
        if (progress > 0.3) {
            const portalFade = Math.min((progress - 0.3) / 0.3, 1.0);
            portalEffect.setOpacity(1 - portalFade);
        }
        
        // Tracking shot alongside ship journey
        const shipPos = starDreadnought.ship.position.clone();
        camera.position.set(
            shipPos.x - 3000, 
            shipPos.y + 1000, 
            8000
        );
        camera.lookAt(shipPos);
    }
    
    // PLAYER DEPLOYMENT phase (0.7-1.0)
    if (progress >= 0.7) {
        // Ensure portal is fully invisible
        portalEffect.setOpacity(0);
        
        // Activate teleport beam if not already active
        if (progress < 0.75 && !starDreadnought.teleportBeamActive) {
            starDreadnought.activateTeleportBeam();
            
            // Play teleport sound using Tone.js
            if (introSounds.teleport) {
                introSounds.teleport.play();
            }
        }
        
        // Update teleport beam
        starDreadnought.updateTeleportBeam(progress);
        
        // Deploy player ship
        if (progress > 0.8 && spaceship && !spaceship.mesh.visible) {
            // Position player ship BELOW dreadnought but ABOVE the asteroid belt
            const dreadPos = starDreadnought.ship.position;
            spaceship.mesh.position.set(
                dreadPos.x, 
                dreadPos.y - 2000, // 2000 units below dreadnought
                dreadPos.z
            );
            
            // Properly undock the ship - this is critical to update game state
            if (spaceship.isDocked) {
                console.log("Undocking player ship during intro sequence");
                spaceship.isDocked = false; // Force undock directly to avoid position reset
                spaceship.mesh.visible = true;
            } else {
                spaceship.mesh.visible = true;
            }
            
            // Store final player position
            context.finalPlayerPosition = spaceship.mesh.position.clone();
            
            // Add shield effect to player ship
            createPlayerShieldEffect(spaceship, context);
            
            // Flash effect for ship appearance
            flashOverlay(0.3);
        }
        
        // Teleport beam view camera
        const shipPos = starDreadnought.ship.position.clone();
        const t = (progress - 0.7) / 0.3;
        camera.position.set(
            shipPos.x - 2000 + t * 2000,
            shipPos.y + 2000,
            5000 - t * 3000
        );
        
        // Look at midpoint between ship and deployed player
        const lookY = shipPos.y - 1000;
        camera.lookAt(shipPos.x, lookY, shipPos.z);
    }
}

/**
 * Create shield effect around player ship
 * @param {any} spaceship - Player spaceship object
 * @param {any} context - Context object for storing shield effect reference
 */
function createPlayerShieldEffect(spaceship: any, context: any): void {
    // Create a sphere slightly larger than the player ship
    const geometry = new THREE.SphereGeometry(30, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    context.playerShieldEffect = new THREE.Mesh(geometry, material);
    context.playerShieldEffect.scale.set(1.2, 1.2, 1.2);
    spaceship.mesh.add(context.playerShieldEffect);
    
    // Add pulsing animation
    context.shieldPulseTime = 0;
}
