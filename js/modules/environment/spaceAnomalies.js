// spaceAnomalies.js - Creates and manages space anomalies with collectible energy orbs

import * as THREE from 'three';
import { AnomalyRegistry } from './anomalies/anomalyRegistry.js';

export class SpaceAnomalies {
    constructor(scene) {
        this.scene = scene;
        this.anomalies = [];
        
        // Anomalies are outside the asteroid belt
        this.minRadius = 32000; // Beyond asteroid belt
        this.maxRadius = 45000; // Not too far into deep space
        this.width = 3000; // Height variation
        
        // Scale factors for size
        this.anomalyScale = 4; // Make anomalies 4x bigger
        this.orbScale = 4;     // Make orbs 4x bigger
        
        // Orb rarity and values
        this.orbValues = {
            common: 100,    // Green orb - 100 credits
            uncommon: 500,  // Blue orb - 500 credits
            rare: 1500,     // Purple orb - 1500 credits
            epic: 5000,     // Orange orb - 5000 credits
            legendary: 15000 // Red orb - 15000 credits
        };
        
        // Initialize timer system for dynamic anomaly spawning
        this.spawnTimer = 0;
        this.checkInterval = 60; // Check every 60 seconds (1 minute)
        this.spawnChance = 0.5; // 50% chance to spawn a new anomaly
        this.despawnChance = 0.3; // 30% chance for an anomaly to despawn
        
        // Initialize anomaly registry
        this.anomalyRegistry = new AnomalyRegistry(scene, this.anomalyScale, this.orbScale);
        this.anomalyTypes = this.anomalyRegistry.getAvailableTypes();
        
        // Maximum number of anomalies that can exist simultaneously
        this.maxAnomalies = 5;
        
        // Notify about active anomalies
        this.updateAnomalyCountDisplay();
    }

    // --- Renderer facade helpers ---
    _getRenderer() {
        return (window.game && window.game.renderer) ? window.game.renderer : null;
    }

    _addToScene(object) {
        const renderer = this._getRenderer();
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => renderer.add(object));
        } else if (this.scene && typeof this.scene.add === 'function') {
            this.scene.add(object);
        }
    }

    _removeFromScene(object) {
        const renderer = this._getRenderer();
        if (!object) return;
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => this.scene.remove(object));
        } else if (this.scene && typeof this.scene.remove === 'function') {
            this.scene.remove(object);
        }
    }
    
    // Method to check and potentially spawn/despawn anomalies
    checkAnomalySpawning(deltaTime) {
        // Increment timer
        this.spawnTimer += deltaTime;
        
        // Check if it's time to evaluate spawn/despawn
        if (this.spawnTimer >= this.checkInterval) {
            // Reset timer
            this.spawnTimer -= this.checkInterval;
            
            // Check for potential new anomaly spawn
            if (this.anomalies.length < this.maxAnomalies && Math.random() < this.spawnChance) {
                // Determine which anomaly type to spawn
                const availableTypes = this.anomalyTypes.filter(type => 
                    !this.anomalies.some(anomaly => anomaly.type === type)
                );
                
                if (availableTypes.length > 0) {
                    const typeToSpawn = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                    this.spawnAnomaly(typeToSpawn);
                    
                    // Update HUD with new count
                    this.updateAnomalyCountDisplay();
                }
            }
            
            // Check each existing anomaly for potential despawn
            const anomaliesToRemove = [];
            this.anomalies.forEach(anomaly => {
                if (Math.random() < this.despawnChance) {
                    anomaliesToRemove.push(anomaly);
                }
            });
            
            // Remove marked anomalies
            if (anomaliesToRemove.length > 0) {
                anomaliesToRemove.forEach(anomaly => {
                    this.despawnAnomaly(anomaly);
                });
                
                // Update HUD with new count
                this.updateAnomalyCountDisplay();
            }
        }
    }
    
    // Spawn a specific type of anomaly
    spawnAnomaly(type) {
        console.log(`Spawning ${type} anomaly`);
        
        if (!this.anomalyRegistry.isTypeSupported(type)) {
            console.error(`Unknown anomaly type: ${type}`);
            return;
        }
        
        const position = this.getRandomAnomalyPosition();
        const anomaly = this.anomalyRegistry.createAnomaly(
            type,
            position,
            (rarity) => this.createEnergyOrb(rarity),
            () => this.getRandomOrbRarity(),
            (object) => this._addToScene(object)
        );
        
        this.anomalies.push(anomaly);
    }
    
    // Despawn and cleanup a specific anomaly
    despawnAnomaly(anomaly) {
        console.log(`Despawning ${anomaly.type} anomaly`);
        
        // Remove from scene
        this._removeFromScene(anomaly.mesh);
        
        // Use the registry to clean up the anomaly
        this.anomalyRegistry.cleanupAnomaly(anomaly);
        
        // Clean up the orb
        if (anomaly.orb && anomaly.orb.mesh) {
            if (anomaly.orb.mesh.geometry) anomaly.orb.mesh.geometry.dispose();
            if (anomaly.orb.mesh.material) {
                if (Array.isArray(anomaly.orb.mesh.material)) {
                    anomaly.orb.mesh.material.forEach(m => m.dispose());
                } else {
                    anomaly.orb.mesh.material.dispose();
                }
            }
        }
        
        // Remove from anomalies array
        const index = this.anomalies.indexOf(anomaly);
        if (index !== -1) {
            this.anomalies.splice(index, 1);
        }
    }
    
    // Update HUD to show active anomaly count
    updateAnomalyCountDisplay() {
        // Find the anomaly count element in the HUD
        const anomalyCountEl = document.getElementById('anomaly-count');
        if (anomalyCountEl) {
            anomalyCountEl.textContent = this.anomalies.length.toString();
        }
    }
    
    // Get the number of active anomalies
    getActiveAnomalyCount() {
        return this.anomalies.length;
    }
    
    // Modified update method to include anomaly spawning/despawning checks
    update(deltaTime) {
        // Check for spawning/despawning anomalies
        this.checkAnomalySpawning(deltaTime);
        
        // Get player position if available (from global reference)
        let playerPosition = null;
        if (window.game && window.game.spaceship && window.game.spaceship.mesh) {
            playerPosition = window.game.spaceship.mesh.position;
        }
        
        // Update existing anomalies
        for (let i = 0; i < this.anomalies.length; i++) {
            const anomaly = this.anomalies[i];
            
            // Skip if orb is already collected
            if (anomaly.orbCollected) {
                // Simple rotation for collected anomalies
                if (anomaly.mesh && anomaly.rotationSpeed) {
                    anomaly.mesh.rotation.x += anomaly.rotationSpeed.x * deltaTime;
                    anomaly.mesh.rotation.y += anomaly.rotationSpeed.y * deltaTime;
                    anomaly.mesh.rotation.z += anomaly.rotationSpeed.z * deltaTime;
                }
                continue;
            }
            
            // Check if player is nearby to enhance effects
            let playerNearby = false;
            if (playerPosition) {
                const distance = playerPosition.distanceTo(anomaly.position);
                playerNearby = distance < (anomaly.orb.size * 3) * this.orbScale; // Only enhance effects based on orb distance
            }
            
            // Rotate the entire anomaly slowly
            if (anomaly.mesh && anomaly.rotationSpeed) {
                anomaly.mesh.rotation.x += anomaly.rotationSpeed.x * deltaTime;
                anomaly.mesh.rotation.y += anomaly.rotationSpeed.y * deltaTime;
                anomaly.mesh.rotation.z += anomaly.rotationSpeed.z * deltaTime;
            }
            
            // Animate anomaly using registry
            this.anomalyRegistry.updateAnomaly(anomaly, deltaTime);
            
            // Update orb effects based on player proximity
            this.updateOrbEffects(anomaly, playerNearby);
        }
    }
    
    createEnergyOrb(rarity) {
        // Create an energy orb with glow effects based on rarity
        
        // Determine orb color and properties based on rarity
        let color, size, intensity, pulseSpeed;
        
        switch(rarity) {
            case 'legendary':
                color = new THREE.Color(0xff0000); // Red
                size = 30 * this.orbScale;  // 4x bigger
                intensity = 0.9;
                pulseSpeed = 2.0;
                break;
            case 'epic':
                color = new THREE.Color(0xff6600); // Orange
                size = 25 * this.orbScale;  // 4x bigger
                intensity = 0.8;
                pulseSpeed = 1.8;
                break;
            case 'rare':
                color = new THREE.Color(0x9900ff); // Purple
                size = 22 * this.orbScale;  // 4x bigger
                intensity = 0.7;
                pulseSpeed = 1.5;
                break;
            case 'uncommon':
                color = new THREE.Color(0x0066ff); // Blue
                size = 20 * this.orbScale;  // 4x bigger
                intensity = 0.6;
                pulseSpeed = 1.2;
                break;
            default: // common
                color = new THREE.Color(0x00ff66); // Green
                size = 18 * this.orbScale;  // 4x bigger
                intensity = 0.5;
                pulseSpeed = 1.0;
                break;
        }
        
        // Create the core orb
        const orbGeometry = new THREE.SphereGeometry(size, 32, 32);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: intensity,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });
        
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        
        // Create outer glow
        const glowSize = size * 1.5;
        const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        orb.add(glow);
        
        // Return orb data
        return {
            mesh: orb,
            rarity: rarity,
            value: this.orbValues[rarity],
            size: size,
            color: color,
            pulsePhase: 0,
            pulseSpeed: pulseSpeed,
            glow: glow
        };
    }
    
    
    getRandomAnomalyPosition() {
        // Get random position outside asteroid belt
        const angle = Math.random() * Math.PI * 2;
        const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius);
        const heightVariation = (Math.random() - 0.5) * this.width;
        
        return new THREE.Vector3(
            Math.cos(angle) * radius,
            heightVariation,
            Math.sin(angle) * radius
        );
    }
    
    getRandomOrbRarity() {
        // Determine orb rarity based on probabilities
        const roll = Math.random();
        
        if (roll < 0.005) {
            return 'legendary'; // 0.5% chance
        } else if (roll < 0.025) {
            return 'epic'; // 2% chance
        } else if (roll < 0.1) {
            return 'rare'; // 7.5% chance
        } else if (roll < 0.3) {
            return 'uncommon'; // 20% chance
        } else {
            return 'common'; // 70% chance
        }
    }
    
    getRegionInfo() {
        return {
            center: new THREE.Vector3(0, 0, 0),
            innerRadius: this.minRadius,
            outerRadius: this.maxRadius
        };
    }
    
    findClosestAnomaly(position, maxDistance = 8000) {
        let closestAnomaly = null;
        let closestDistance = maxDistance;
        
        this.anomalies.forEach(anomaly => {
            // Calculate distance to this anomaly
            const distance = position.distanceTo(anomaly.position);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestAnomaly = anomaly;
            }
        });
        
        return closestAnomaly;
    }
    
    collectOrb(anomaly) {
        if (!anomaly || anomaly.orbCollected) {
            return null; // Already collected or invalid anomaly
        }
        
        // Get orb data before marking as collected
        const orbData = {
            rarity: anomaly.orb.rarity,
            value: this.orbValues[anomaly.orb.rarity] || 100 // Default to 100 if rarity not found
        };
        
        // Mark as collected and update visuals
        anomaly.orbCollected = true;
        
        // Hide the orb
        if (anomaly.orb && anomaly.orb.mesh) {
            anomaly.orb.mesh.visible = false;
            
            // Also hide glow if present
            if (anomaly.orb.glow) {
                anomaly.orb.glow.visible = false;
            }
        }
        
        return orbData; // Return data for player inventory and notification
    }
    
    checkCollision(position, anomaly) {
        if (!position || !anomaly || !anomaly.position) return false;
        
        // Calculate distance from player to anomaly center
        const distance = position.distanceTo(anomaly.position);
        
        // Check if within orb collection radius - we only want orb collisions, not anomaly collision
        // Use the original collision radius for orb collection, scaled by orbScale
        // This ensures we're only checking for the orb and not the anomaly itself
        return distance < (anomaly.orb.size * 2) * this.orbScale;
    }
    
    updateOrbEffects(anomaly, playerNearby) {
        if (!anomaly || !anomaly.orb || anomaly.orbCollected) return;
        
        // Enhance orb effects when player is nearby to make collection more obvious
        if (playerNearby) {
            // If player is nearby, make the orb pulse more dramatically
            const scale = 1.5 + Math.sin(performance.now() * 0.005) * 0.5;
            anomaly.orb.mesh.scale.set(scale, scale, scale);
            
            // Increase emission intensity
            if (anomaly.orb.mesh.material) {
                anomaly.orb.mesh.material.emissiveIntensity = 2.0;
            }
        } else {
            // Reset to normal effects when player is not nearby
            const scale = 1.0 + Math.sin(performance.now() * 0.002) * 0.2;
            anomaly.orb.mesh.scale.set(scale, scale, scale);
            
            // Normal emission intensity
            if (anomaly.orb.mesh.material) {
                anomaly.orb.mesh.material.emissiveIntensity = 0.8;
            }
        }
    }
    
    
    updateForSystem(systemData) {
        console.log("Updating space anomalies for new star system");
        
        // Clear any existing anomalies
        this.clearAllAnomalies();
        
        // Reset the timer to immediately check for spawning in the new system
        this.spawnTimer = this.checkInterval;
        
        // Update HUD
        this.updateAnomalyCountDisplay();
    }
    
    clearAllAnomalies() {
        // Clone the array to avoid modification during iteration
        const anomaliesToRemove = [...this.anomalies];
        
        // Remove each anomaly
        anomaliesToRemove.forEach(anomaly => {
            this.despawnAnomaly(anomaly);
        });
        
        // Ensure the array is empty
        this.anomalies = [];
        
        // Update HUD
        this.updateAnomalyCountDisplay();
    }
} 