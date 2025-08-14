// controller.js - Controls teleport beam activation and animation for the Star Dreadnought

import { TeleportParticles } from './particles.js';

export class TeleportController {
    constructor() {
        this.teleportBeam = null;
        this.teleportParticles = null;
        this.impactRing = null;
        this.teleportBeamActive = false;
    }
    
    setComponents(teleportBeam, teleportParticles, impactRing) {
        this.teleportBeam = teleportBeam;
        this.teleportParticles = teleportParticles;
        this.impactRing = impactRing;
    }
    
    // Activate teleport beam
    activateTeleportBeam() {
        if (this.teleportBeam) {
            this.teleportBeam.visible = true;
            this.teleportParticles.visible = true;
            this.impactRing.visible = true;
            this.teleportBeamActive = true;
            
            // Reset animation time
            this.teleportBeam.material.uniforms.time.value = 0;
            this.impactRing.material.uniforms.time.value = 0;
            if (this.teleportParticles.material.uniforms) {
                this.teleportParticles.material.uniforms.time.value = 0;
            }
        }
    }
    
    // Deactivate teleport beam
    deactivateTeleportBeam() {
        if (this.teleportBeam) {
            this.teleportBeam.visible = false;
            this.teleportParticles.visible = false;
            this.impactRing.visible = false;
            this.teleportBeamActive = false;
        }
    }
    
    // Update teleport beam effect
    updateTeleportBeam(progress = 0) {
        if (!this.teleportBeamActive) return;
        
        // Update shader time uniforms for animation
        const timeIncrement = 0.02;
        
        // Update beam animation
        if (this.teleportBeam && this.teleportBeam.material.uniforms) {
            this.teleportBeam.material.uniforms.time.value += timeIncrement;
            
            // Pulse the beam based on progress
            const intensity = 0.3 + Math.sin(progress * Math.PI * 6) * 0.1;
            this.teleportBeam.material.uniforms.pulseAmplitude.value = intensity;
        }
        
        // Update impact ring
        if (this.impactRing && this.impactRing.material.uniforms) {
            this.impactRing.material.uniforms.time.value += timeIncrement;
            
            // Scale the impact ring with progress
            const ringScale = 1.0 + Math.sin(progress * Math.PI * 3) * 0.2;
            this.impactRing.scale.set(ringScale, ringScale, 1);
        }
        
        // Animate particles
        if (this.teleportParticles && this.teleportParticles.material.uniforms) {
            this.teleportParticles.material.uniforms.time.value += timeIncrement;
            
            // Use the static method from TeleportParticles for animation
            TeleportParticles.animateParticles(this.teleportParticles);
        }
    }
    
    // Get current beam active state
    isBeamActive() {
        return this.teleportBeamActive;
    }
}