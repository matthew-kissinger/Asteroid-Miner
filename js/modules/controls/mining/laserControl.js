// laserControl.js - Handles laser beam visuals and control

import * as THREE from 'three';

export class LaserControl {
    constructor(scene, spaceship) {
        this.scene = scene;
        this.spaceship = spaceship;
    }

    /**
     * Update laser beam position and appearance
     */
    updateLaserBeam(targetAsteroid) {
        const laserBeam = document.getElementById('laser-beam');
        if (!laserBeam || !targetAsteroid || !this.spaceship.mesh) return;
        
        // Create a vector pointing from the ship to the asteroid
        const shipPosition = this.spaceship.mesh.position.clone();
        const asteroidPosition = targetAsteroid.mesh.position.clone();
        
        // Add a small offset to the ship position to start from the FRONT of the mining laser
        // The ship's coordinate system has -Z as the forward direction, so use negative Z
        const shipOffset = new THREE.Vector3(0, 0, -60); // 4x the original offset (-15)
        shipOffset.applyQuaternion(this.spaceship.mesh.quaternion);
        shipPosition.add(shipOffset);
        
        // Convert 3D positions to screen coordinates
        const tempVector = new THREE.Vector3();
        
        // Get the camera
        const camera = this.scene.camera;
        if (!camera) return;
        
        // Convert ship position to screen space
        tempVector.copy(shipPosition);
        tempVector.project(camera);
        const shipX = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        const shipY = (-(tempVector.y * 0.5) + 0.5) * window.innerHeight;
        
        // Convert asteroid position to screen space
        tempVector.copy(asteroidPosition);
        tempVector.project(camera);
        const asteroidX = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        const asteroidY = (-(tempVector.y * 0.5) + 0.5) * window.innerHeight;
        
        // Calculate distance and angle
        const dx = asteroidX - shipX;
        const dy = asteroidY - shipY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Update laser beam style
        laserBeam.style.width = `${distance}px`;
        laserBeam.style.left = `${shipX}px`;
        laserBeam.style.top = `${shipY}px`;
        laserBeam.style.transform = `rotate(${angle}rad)`;
        
        // Animate the laser beam for a more dynamic effect
        const intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        laserBeam.style.opacity = intensity.toString();
        
        // Make laser thickness vary with mining efficiency
        const efficiency = this.spaceship.miningEfficiency || 1.0;
        const thickness = Math.max(2, Math.ceil(2 * Math.sqrt(efficiency)));
        laserBeam.style.height = `${thickness}px`;
        
        // Create multiple beams for a more powerful effect
        if (!laserBeam.hasChildNodes()) {
            // Create 2 additional beams for a thicker laser effect
            for (let i = 0; i < 2; i++) {
                const additionalBeam = document.createElement('div');
                additionalBeam.style.position = 'absolute';
                additionalBeam.style.left = '0';
                additionalBeam.style.top = `${i === 0 ? -1 : 1}px`;
                additionalBeam.style.width = '100%';
                additionalBeam.style.height = '1px';
                additionalBeam.style.backgroundColor = '#ff6060';
                additionalBeam.style.opacity = '0.7';
                laserBeam.appendChild(additionalBeam);
            }
        }
    }

    /**
     * Create or get laser beam element
     */
    setupLaserBeam(targetAsteroid) {
        // Get or create laser beam element
        let laserBeam = document.getElementById('laser-beam');
        
        // If laser beam element doesn't exist, create it
        if (!laserBeam) {
            console.log("LaserControl: Creating laser beam element");
            laserBeam = document.createElement('div');
            laserBeam.id = 'laser-beam';
            laserBeam.style.position = 'absolute';
            laserBeam.style.height = '2px';
            laserBeam.style.backgroundColor = '#ff3030';
            laserBeam.style.transformOrigin = '0 0';
            laserBeam.style.zIndex = '100';
            laserBeam.style.pointerEvents = 'none';
            document.body.appendChild(laserBeam);
        }
        
        // Show mining laser beam
        if (laserBeam) {
            laserBeam.style.display = 'block';
            
            // Adjust laser color based on resource type and mining level
            if (targetAsteroid.resourceType) {
                const resourceType = targetAsteroid.resourceType.toLowerCase();
                let laserColor = '#ff3030'; // Default red for iron
                let glowColor = '#ff0000';
                
                if (resourceType === 'gold') {
                    laserColor = '#ffcc00'; // Gold color
                    glowColor = '#ffaa00';
                } else if (resourceType === 'platinum') {
                    laserColor = '#66ffff'; // Cyan color for platinum
                    glowColor = '#00ffff';
                }
                
                // Adjust intensity based on mining efficiency - brighter for higher efficiency
                const efficiency = this.spaceship.miningEfficiency || 1.0;
                if (efficiency > 1.0) {
                    // Make the laser more intense as mining level increases
                    const laserIntensity = Math.min(1.0 + (efficiency - 1.0) * 0.5, 3.0);
                    laserBeam.style.boxShadow = `0 0 ${10 * laserIntensity}px ${glowColor}, 0 0 ${20 * laserIntensity}px ${glowColor}`;
                } else {
                    laserBeam.style.boxShadow = `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`;
                }
                
                laserBeam.style.backgroundColor = laserColor;
            } else {
                // Default red laser
                laserBeam.style.backgroundColor = '#ff3030'; 
                laserBeam.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
            }
        }
    }

    /**
     * Hide laser beam
     */
    hideLaserBeam() {
        const laserBeam = document.getElementById('laser-beam');
        if (laserBeam) {
            laserBeam.style.display = 'none';
        }
    }

    /**
     * Activate spaceship's mining laser
     */
    activateSpaceshipLaser() {
        if (this.spaceship && typeof this.spaceship.activateMiningLaser === 'function') {
            this.spaceship.activateMiningLaser();
        }
    }

    /**
     * Deactivate spaceship's mining laser
     */
    deactivateSpaceshipLaser() {
        if (this.spaceship && typeof this.spaceship.deactivateMiningLaser === 'function') {
            this.spaceship.deactivateMiningLaser();
        }
    }
}