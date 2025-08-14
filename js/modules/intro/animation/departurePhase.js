// departurePhase.js - Manages the ship departure phase of the intro sequence

import * as THREE from 'three';

/**
 * Update the departure phase animation (ship rotation, portal reappearance, and departure)
 * @param {number} progress - Progress through departure phase (0-1)
 * @param {Object} context - Context object containing all necessary references
 */
export function updateDeparturePhase(progress, context) {
    const {
        portalEffect,
        starDreadnought,
        camera,
        introSounds,
        flashOverlay
    } = context;
    
    // Simple departure sequence: rotate ship 180 degrees and go back through original portal
    
    // Original portal location
    const portalPos = new THREE.Vector3(30000, 5000, 0);
    
    // FIRST HALF: Ship rotates and portal reappears (0-0.5)
    if (progress < 0.5) {
        // Turn off teleport beam at start
        if (progress < 0.1 && starDreadnought.teleportBeamActive) {
            starDreadnought.deactivateTeleportBeam();
        }
        
        // Make portal visible again at original position
        if (progress > 0.1) {
            // Position portal back at original entry point
            portalEffect.setPosition(portalPos);
            portalEffect.setVisible(true);
            portalEffect.setRotation(new THREE.Euler(0, 0, Math.PI/2)); // Original orientation
            
            // Portal should be at full size immediately
            portalEffect.setScale(3.5);
            
            // Fade in portal
            const portalProgress = Math.min((progress - 0.1) / 0.3, 1.0);
            portalEffect.setOpacity(portalProgress);
        }
        
        // Simple 180 degree rotation
        if (progress > 0.2) {
            const rotateProgress = Math.min((progress - 0.2) / 0.3, 1.0);
            const startRot = Math.PI/2;  // Currently facing center
            const endRot = 3 * Math.PI/2; // 180 degree rotation (facing back toward original portal)
            starDreadnought.ship.rotation.y = startRot + (endRot - startRot) * rotateProgress;
        }
        
        // Fixed camera position from the side to view the rotation
        const shipPos = starDreadnought.ship.position.clone();
        camera.position.set(
            shipPos.x,
            shipPos.y + 3000, // High-ish angle
            shipPos.z + 8000  // Side view
        );
        camera.lookAt(shipPos);
    }
    
    // SECOND HALF: Ship accelerates through original portal and disappears (0.5-1.0)
    else {
        // Calculate movement progress for this phase
        const moveProgress = (progress - 0.5) / 0.5;
        
        // Ship position calculation - go back toward original portal
        const startPos = new THREE.Vector3(22000, 5000, 0); // Ship's current position
        const beyondPos = new THREE.Vector3(35000, 5000, 0); // Beyond portal
        
        // Simple acceleration curve
        const easeIn = moveProgress * moveProgress; // Accelerating movement
        
        // Ship position calculation
        let position;
        if (moveProgress < 0.7) {
            // Move to portal
            const t = easeIn / 0.5; // Normalized and accelerated
            position = new THREE.Vector3().lerpVectors(startPos, portalPos, t);
        } else {
            // Continue beyond portal
            const t = (moveProgress - 0.7) / 0.3;
            position = new THREE.Vector3().lerpVectors(portalPos, beyondPos, t);
        }
        
        // Update ship position
        starDreadnought.ship.position.copy(position);
        
        // Increase engine power for dramatic exit
        starDreadnought.setEnginesPower(0.7 + moveProgress * 0.8);
        
        // Flash when ship enters portal
        if (moveProgress > 0.6 && moveProgress < 0.63) {
            flashOverlay(0.4);
            
            // Play warp sound for re-entry but only exactly once at 0.61
            if (introSounds.warp && Math.abs(moveProgress - 0.61) < 0.01) {
                introSounds.warp.play();
            }
        }
        
        // Hide ship after it enters portal
        if (moveProgress > 0.65) {
            starDreadnought.ship.visible = false;
        }
        
        // Collapse portal at the very end
        if (moveProgress > 0.9) {
            const collapseProgress = (moveProgress - 0.9) / 0.1;
            const collapseScale = (1 - collapseProgress) * 3.5;
            portalEffect.setScale(collapseScale);
        }
        
        // Static camera position showing ship's departure path
        const shipPos = startPos.clone(); // Use initial position as reference
        camera.position.set(
            shipPos.x - 2000,
            shipPos.y + 3000,
            10000 // Side view
        );
        // Look at the midpoint of the departure path
        const lookPos = new THREE.Vector3().lerpVectors(startPos, portalPos, 0.5);
        camera.lookAt(lookPos);
    }
}