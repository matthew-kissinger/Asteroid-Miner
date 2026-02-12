// spaceAnomalies.ts - Creates and manages space anomalies with collectible energy orbs

import {
  Mesh,
  Color,
  Object3D,
  Vector3,
  Scene,
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  BackSide,
  AdditiveBlending,
} from 'three';
import { AnomalyRegistry } from './anomalies/anomalyRegistry';

type OrbRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface OrbData {
    mesh: Mesh;
    rarity: OrbRarity;
    value: number;
    size: number;
    color: Color;
    pulsePhase: number;
    pulseSpeed: number;
    glow: Mesh;
}

interface AnomalyData {
    type: string;
    mesh: Object3D;
    position: Vector3;
    orb: OrbData;
    orbCollected: boolean;
    playerEntered?: boolean;
    rotationSpeed?: { x: number; y: number; z: number };
    rings?: Array<{ mesh: Mesh; rotationSpeed: { x: number; y: number; z: number } }>;
    [key: string]: unknown;
}

interface GameRenderer {
    _withGuard?: (fn: () => void) => void;
    add?: (obj: Object3D) => void;
}

interface GameGlobal {
    renderer?: GameRenderer;
    spaceship?: { mesh?: Object3D };
}

export class SpaceAnomalies {
    scene: Scene;
    anomalies: AnomalyData[];
    minRadius: number;
    maxRadius: number;
    width: number;
    anomalyScale: number;
    orbScale: number;
    orbValues: Record<OrbRarity, number>;
    spawnTimer: number;
    checkInterval: number;
    spawnChance: number;
    despawnChance: number;
    anomalyRegistry: AnomalyRegistry;
    anomalyTypes: string[];
    maxAnomalies: number;

    constructor(scene: Scene) {
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
    _getRenderer(): GameRenderer | null {
        const game = (window as any).game as GameGlobal | undefined;
        return game?.renderer ?? null;
    }

    _addToScene(object: Object3D): void {
        const renderer = this._getRenderer();
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => renderer.add && renderer.add(object));
        } else if (this.scene && typeof this.scene.add === 'function') {
            this.scene.add(object);
        }
    }

    _removeFromScene(object: Object3D | null): void {
        const renderer = this._getRenderer();
        if (!object) return;
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => this.scene.remove(object));
        } else if (this.scene && typeof this.scene.remove === 'function') {
            this.scene.remove(object);
        }
    }

    // Method to check and potentially spawn/despawn anomalies
    checkAnomalySpawning(deltaTime: number): void {
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
            const anomaliesToRemove: AnomalyData[] = [];
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
    spawnAnomaly(type: string): void {
        console.log(`Spawning ${type} anomaly`);

        if (!this.anomalyRegistry.isTypeSupported(type)) {
            console.error(`Unknown anomaly type: ${type}`);
            return;
        }

        const position = this.getRandomAnomalyPosition();
        const anomaly = this.anomalyRegistry.createAnomaly(
            type,
            position,
            (rarity: string) => this.createEnergyOrb(rarity as OrbRarity),
            () => this.getRandomOrbRarity(),
            (object: Object3D) => this._addToScene(object)
        ) as AnomalyData;

        this.anomalies.push(anomaly);
    }

    // Despawn and cleanup a specific anomaly
    despawnAnomaly(anomaly: AnomalyData): void {
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
    updateAnomalyCountDisplay(): void {
        // Find the anomaly count element in the HUD
        const anomalyCountEl = document.getElementById('anomaly-count');
        if (anomalyCountEl) {
            anomalyCountEl.textContent = this.anomalies.length.toString();
        }
    }

    // Get the number of active anomalies
    getActiveAnomalyCount(): number {
        return this.anomalies.length;
    }

    // Modified update method to include anomaly spawning/despawning checks
    update(deltaTime: number): void {
        // Check for spawning/despawning anomalies
        this.checkAnomalySpawning(deltaTime);

        // Get player position if available (from global reference)
        let playerPosition: Vector3 | null = null;
        const game = (window as any).game as GameGlobal | undefined;
        if (game?.spaceship && game.spaceship.mesh) {
            playerPosition = (game.spaceship.mesh as Object3D).position;
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
                
                // Publish hazard.entered event when player first enters anomaly zone
                if (playerNearby && !anomaly.playerEntered) {
                    anomaly.playerEntered = true;
                    if ((globalThis as any).mainMessageBus) {
                        (globalThis as any).mainMessageBus.publish('hazard.entered', { 
                            hazardType: 'anomaly' 
                        });
                    }
                } else if (!playerNearby && anomaly.playerEntered) {
                    // Reset flag when player leaves
                    anomaly.playerEntered = false;
                }
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

    createEnergyOrb(rarity: OrbRarity): OrbData {
        // Create an energy orb with glow effects based on rarity

        // Determine orb color and properties based on rarity
        let color: Color, size: number, intensity: number, pulseSpeed: number;

        switch (rarity) {
            case 'legendary':
                color = new Color(0xff0000); // Red
                size = 30 * this.orbScale;  // 4x bigger
                intensity = 0.9;
                pulseSpeed = 2.0;
                break;
            case 'epic':
                color = new Color(0xff6600); // Orange
                size = 25 * this.orbScale;  // 4x bigger
                intensity = 0.8;
                pulseSpeed = 1.8;
                break;
            case 'rare':
                color = new Color(0x9900ff); // Purple
                size = 22 * this.orbScale;  // 4x bigger
                intensity = 0.7;
                pulseSpeed = 1.5;
                break;
            case 'uncommon':
                color = new Color(0x0066ff); // Blue
                size = 20 * this.orbScale;  // 4x bigger
                intensity = 0.6;
                pulseSpeed = 1.2;
                break;
            default: // common
                color = new Color(0x00ff66); // Green
                size = 18 * this.orbScale;  // 4x bigger
                intensity = 0.5;
                pulseSpeed = 1.0;
                break;
        }

        // Create the core orb
        const orbGeometry = new SphereGeometry(size, 32, 32);
        const orbMaterial = new MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: intensity,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });

        const orb = new Mesh(orbGeometry, orbMaterial);

        // Create outer glow
        const glowSize = size * 1.5;
        const glowGeometry = new SphereGeometry(glowSize, 32, 32);
        const glowMaterial = new MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: BackSide,
            blending: AdditiveBlending
        });

        const glow = new Mesh(glowGeometry, glowMaterial);
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


    getRandomAnomalyPosition(): Vector3 {
        // Get random position outside asteroid belt
        const angle = Math.random() * Math.PI * 2;
        const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius);
        const heightVariation = (Math.random() - 0.5) * this.width;

        return new Vector3(
            Math.cos(angle) * radius,
            heightVariation,
            Math.sin(angle) * radius
        );
    }

    getRandomOrbRarity(): OrbRarity {
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

    getRegionInfo(): { center: Vector3; innerRadius: number; outerRadius: number } {
        return {
            center: new Vector3(0, 0, 0),
            innerRadius: this.minRadius,
            outerRadius: this.maxRadius
        };
    }

    findClosestAnomaly(position: Vector3, maxDistance: number = 8000): AnomalyData | null {
        let closestAnomaly: AnomalyData | null = null;
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

    collectOrb(anomaly: AnomalyData): { rarity: OrbRarity; value: number } | null {
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

    checkCollision(position: Vector3, anomaly: AnomalyData): boolean {
        if (!position || !anomaly || !anomaly.position) return false;

        // Calculate distance from player to anomaly center
        const distance = position.distanceTo(anomaly.position);

        // Check if within orb collection radius - we only want orb collisions, not anomaly collision
        // Use the original collision radius for orb collection, scaled by orbScale
        // This ensures we're only checking for the orb and not the anomaly itself
        return distance < (anomaly.orb.size * 2) * this.orbScale;
    }

    updateOrbEffects(anomaly: AnomalyData, playerNearby: boolean): void {
        if (!anomaly || !anomaly.orb || anomaly.orbCollected) return;

        // Enhance orb effects when player is nearby to make collection more obvious
        if (playerNearby) {
            // If player is nearby, make the orb pulse more dramatically
            const scale = 1.5 + Math.sin(performance.now() * 0.005) * 0.5;
            anomaly.orb.mesh.scale.set(scale, scale, scale);

            // Increase emission intensity
            const material = anomaly.orb.mesh.material as MeshStandardMaterial | MeshStandardMaterial[];
            if (material) {
                if (Array.isArray(material)) {
                    material.forEach((mat: MeshStandardMaterial) => { mat.emissiveIntensity = 2.0; });
                } else {
                    material.emissiveIntensity = 2.0;
                }
            }
        } else {
            // Reset to normal effects when player is not nearby
            const scale = 1.0 + Math.sin(performance.now() * 0.002) * 0.2;
            anomaly.orb.mesh.scale.set(scale, scale, scale);

            // Normal emission intensity
            const material = anomaly.orb.mesh.material as MeshStandardMaterial | MeshStandardMaterial[];
            if (material) {
                if (Array.isArray(material)) {
                    material.forEach((mat: MeshStandardMaterial) => { mat.emissiveIntensity = 0.8; });
                } else {
                    material.emissiveIntensity = 0.8;
                }
            }
        }
    }


    updateForSystem(systemData: unknown): void {
        void systemData;
        console.log("Updating space anomalies for new star system");

        // Clear any existing anomalies
        this.clearAllAnomalies();

        // Reset the timer to immediately check for spawning in the new system
        this.spawnTimer = this.checkInterval;

        // Update HUD
        this.updateAnomalyCountDisplay();
    }

    clearAllAnomalies(): void {
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
