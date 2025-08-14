// systemCoordinator.js - System coordination and updates
export class GameSystemCoordinator {
    constructor(game) {
        this.game = game;
    }

    /**
     * Main game update method - coordinates all system updates
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        if (this.game.isGameOver) return;

        // Update physics
        this.game.physics.update(deltaTime);

        // Update spaceship
        if (this.game.spaceship.update) {
            this.game.spaceship.update(deltaTime);
        }

        // Update coordinates in HUD after physics update
        if (this.game.ui && this.game.ui.updateCoordinates && this.game.spaceship && this.game.spaceship.mesh) {
            const position = this.game.spaceship.mesh.position;
            this.game.ui.updateCoordinates(position.x, position.y, position.z);
        }

        // Calculate and update FPS
        this.game.currentFPS = 1 / deltaTime;
        // Only update FPS display every 10 frames to reduce DOM operations
        if (this.game.frameCount % 10 === 0 && this.game.ui && this.game.ui.updateFPS) {
            this.game.ui.updateFPS(this.game.currentFPS);
        }

        // Update controls
        if (this.game.controls.update) {
            this.game.controls.update(deltaTime);
        }

        // Update environment
        if (this.game.environment.update) {
            this.game.environment.update(deltaTime, this.game.camera);
        }

        // Update weapon system
        this.updateWeaponSystems(deltaTime);

        // Update combat manager
        this.updateCombatSystems(deltaTime);

        // Update location info
        const locationName = this.game.environment.getPlayerLocation(this.game.spaceship.mesh.position);
        if (this.game.ui.updateLocation) {
            this.game.ui.updateLocation(locationName);
        }

        // Update UI
        if (this.game.ui.update) {
            this.game.ui.update();
        }
        
        // Update renderer for visual effects and animations
        if (this.game.renderer && this.game.renderer.update) {
            this.game.renderer.update(deltaTime);
        }

        // Update audio - play thruster sound when moving
        if (this.game.audio) {
            this.updateAudio();
        }

        // Performance metrics (every 100 frames)
        this.game.frameCount++;
        if (this.game.frameCount % 100 === 0) {
            console.log(`FPS: ${Math.round(1000 / deltaTime)}`);
        }
    }

    /**
     * Update weapon systems
     * @param {number} deltaTime - Time elapsed since last frame
     */
    updateWeaponSystems(deltaTime) {
        if (this.game.combat) {
            // Update weapon systems
            this.game.combat.update(deltaTime);
            // Handle continuous firing if weapon is active
            if (this.game.combat.isFiring && !this.game.spaceship.isDocked) {
                // Fire weapon (sound is handled directly in the particle cannon firing method)
                this.game.combat.fireParticleCannon();
            }
        }
    }

    /**
     * Update combat systems and handle combat interactions
     * @param {number} deltaTime - Time elapsed since last frame
     */
    updateCombatSystems(deltaTime) {
        if (this.game.combatManager) {
            this.game.combatManager.update(deltaTime);
            
            // Check for player projectile hits on enemies
            if (this.game.combat) {
                for (const enemy of this.game.combatManager.enemies) {
                    if (!enemy.isDestroyed) {
                        const didHit = this.game.combat.checkHit && this.game.combat.checkHit(enemy);
                        // Track stats and play hit sound
                        if (didHit) {
                            this.game.damageDealt += 1;
                            // Play boink sound for hit
                            if (this.game.audio) {
                                this.game.audio.playSound('boink');
                            }
                        }
                    }
                }
                
                // Explicitly reset any projectiles getting too close to player to prevent self-damage
                this.preventSelfDamage();
            }
        }
    }

    /**
     * Prevent player projectiles from causing self-damage
     */
    preventSelfDamage() {
        const minSafeDistance = 30; // Safe distance from player to prevent self-hits
        if (this.game.combat.projectiles) {
            for (let i = this.game.combat.projectiles.length - 1; i >= 0; i--) {
                const projectile = this.game.combat.projectiles[i];
                if (projectile.mesh && projectile.mesh.position.distanceTo(this.game.spaceship.mesh.position) < minSafeDistance) {
                    console.log("Removing projectile too close to player");
                    // Clean up projectile
                    if (projectile.mesh.userData.trail && projectile.mesh.userData.trail.mesh) {
                        this.game.scene.remove(projectile.mesh.userData.trail.mesh);
                    }
                    this.game.scene.remove(projectile.mesh);
                    this.game.combat.projectiles.splice(i, 1);
                }
            }
        }
    }

    /**
     * Update game sounds based on current game state
     */
    updateAudio() {
        if (!this.game.audio || !this.game.spaceship) return;

        // Handle thruster sounds based on current thrust state
        if (this.game.spaceship.isDocked) {
            // No thruster sounds when docked
            this.game.audio.stopSound('thrust');
        } else {
            const isThrusting = this.game.spaceship.thrust.forward || 
                              this.game.spaceship.thrust.backward || 
                              this.game.spaceship.thrust.left || 
                              this.game.spaceship.thrust.right;

            if (isThrusting) {
                // Play thrust sound if not already playing
                this.game.audio.playSound('thrust');
                // Calculate thrust intensity for volume
                let thrustIntensity = 0.5; // Base level
                if (this.game.spaceship.thrust.forward) thrustIntensity += 0.2;
                if (this.game.spaceship.thrust.backward) thrustIntensity += 0.1;
                if (this.game.spaceship.thrust.left) thrustIntensity += 0.1;
                if (this.game.spaceship.thrust.right) thrustIntensity += 0.1;
                // Boost increases volume
                if (this.game.spaceship.thrust.boost) thrustIntensity *= 1.5;
                // Set thrust volume
                this.game.audio.setThrustVolume(thrustIntensity);
            } else {
                // Stop thrust sound if no thrusters active
                this.game.audio.stopSound('thrust');
            }
        }
    }
}