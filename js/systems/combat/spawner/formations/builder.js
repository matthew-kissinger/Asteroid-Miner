/**
 * Formation Builder - Position calculation and spawn point management
 */

import * as THREE from 'three';
import { TransformComponent } from '../../../../components/transform.js';
import { FORMATION_PATTERNS, DEFAULT_FORMATION } from './patterns.js';

/**
 * Formation builder for managing spawn points and player detection
 */
export class FormationBuilder {
    constructor(world) {
        this.world = world;
        this.spawnPoints = [];
        this.currentFormation = DEFAULT_FORMATION;
        this.lastPlayerPosition = null;
        this.regenerationDistance = 1000; // Distance player must move to regenerate points
    }

    /**
     * Find player position using multiple detection methods
     * @returns {THREE.Vector3|null} Player position or null if not found
     */
    findPlayerPosition() {
        let players = [];
        let playerPosition = null;
        
        // Method 1: Try using entityManager
        try {
            if (this.world.entityManager && this.world.entityManager.getEntitiesByTag) {
                players = this.world.entityManager.getEntitiesByTag('player');
                if (players.length > 0) {
                    const transform = players[0].getComponent(TransformComponent);
                    if (transform && transform.position) {
                        playerPosition = transform.position;
                    }
                }
            }
        } catch (e) {
            console.log("Could not get player via entityManager:", e.message);
        }
        
        // Method 2: Try direct world method
        if (!playerPosition) {
            try {
                if (this.world.getEntitiesByTag) {
                    players = this.world.getEntitiesByTag('player');
                    if (players.length > 0) {
                        const transform = players[0].getComponent(TransformComponent);
                        if (transform && transform.position) {
                            playerPosition = transform.position;
                        }
                    }
                }
            } catch (e) {
                console.log("Could not get player via world.getEntitiesByTag:", e.message);
            }
        }
        
        // Method 3: Check window.game for spaceship position
        if (!playerPosition && window.game) {
            try {
                if (window.game.spaceship && window.game.spaceship.mesh && window.game.spaceship.mesh.position) {
                    playerPosition = window.game.spaceship.mesh.position;
                    console.log("Using spaceship mesh position for spawn points");
                }
            } catch (e) {
                console.log("Could not get player via window.game.spaceship:", e.message);
            }
        }

        return playerPosition;
    }

    /**
     * Generate spawn points using current formation pattern
     * @param {boolean} forceRegenerate - Force regeneration even if player hasn't moved far
     * @returns {Array<THREE.Vector3>} Array of spawn points
     */
    generateSpawnPoints(forceRegenerate = false) {
        const playerPosition = this.findPlayerPosition();
        
        // Check if we need to regenerate based on player movement
        if (!forceRegenerate && this.lastPlayerPosition && playerPosition) {
            const distance = this.lastPlayerPosition.distanceTo(playerPosition);
            if (distance < this.regenerationDistance && this.spawnPoints.length > 0) {
                return this.spawnPoints; // Use existing spawn points
            }
        }

        // Clear existing spawn points
        this.spawnPoints = [];
        
        // If no player position found, use default spawn points around origin
        if (!playerPosition) {
            console.log("No player position found - generating default spawn points around origin");
            const center = new THREE.Vector3(0, 0, 0);
            this.spawnPoints = this.currentFormation.generate(
                center,
                this.currentFormation.defaultCount,
                this.currentFormation.defaultRadius
            );
        } else {
            // Generate spawn points around player
            const center = playerPosition.clone ? playerPosition.clone() : 
                new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
            
            this.spawnPoints = this.currentFormation.generate(
                center,
                this.currentFormation.defaultCount,
                this.currentFormation.defaultRadius
            );
            
            this.lastPlayerPosition = center.clone();
            
            console.log(`Generated ${this.spawnPoints.length} spawn points using ${this.currentFormation.name} formation around player at position ${center.x.toFixed(0)}, ${center.y.toFixed(0)}, ${center.z.toFixed(0)}`);
        }
        
        return this.spawnPoints;
    }

    /**
     * Get a random spawn point
     * @returns {THREE.Vector3} Random spawn position
     */
    getRandomSpawnPoint() {
        // Make sure spawn points are available
        if (this.spawnPoints.length === 0) {
            this.generateSpawnPoints();
        }
        
        // Choose a random spawn point
        if (this.spawnPoints.length > 0) {
            const index = Math.floor(Math.random() * this.spawnPoints.length);
            return this.spawnPoints[index].clone();
        } else {
            // Fallback - spawn at a fixed distance from origin
            console.warn("No spawn points available, using fallback position");
            const angle = Math.random() * Math.PI * 2;
            const distance = 2000;
            return new THREE.Vector3(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 500,
                Math.sin(angle) * distance
            );
        }
    }

    /**
     * Set formation pattern
     * @param {string} patternName - Name of the formation pattern
     * @param {boolean} regenerate - Whether to regenerate spawn points immediately
     */
    setFormationPattern(patternName, regenerate = true) {
        const pattern = FORMATION_PATTERNS[patternName.toUpperCase()];
        if (pattern) {
            this.currentFormation = pattern;
            if (regenerate) {
                this.generateSpawnPoints(true);
            }
            console.log(`Formation pattern changed to: ${pattern.name}`);
        } else {
            console.warn(`Unknown formation pattern: ${patternName}`);
        }
    }

    /**
     * Get current formation info
     * @returns {Object} Current formation information
     */
    getCurrentFormation() {
        return {
            name: this.currentFormation.name,
            description: this.currentFormation.description,
            spawnPointCount: this.spawnPoints.length
        };
    }

    /**
     * Get spawn points in a specific formation around a position
     * @param {THREE.Vector3} center - Center position
     * @param {string} patternName - Formation pattern name
     * @param {number} count - Number of spawn points
     * @param {number} radius - Formation radius
     * @returns {Array<THREE.Vector3>} Array of spawn points
     */
    generateFormationAround(center, patternName, count = 12, radius = 2500) {
        const pattern = FORMATION_PATTERNS[patternName.toUpperCase()] || DEFAULT_FORMATION;
        return pattern.generate(center, count, radius);
    }

    /**
     * Clear all spawn points and force regeneration on next request
     */
    clearSpawnPoints() {
        this.spawnPoints = [];
        this.lastPlayerPosition = null;
    }

    /**
     * Get statistics about current spawn points
     * @returns {Object} Spawn point statistics
     */
    getSpawnPointStats() {
        if (this.spawnPoints.length === 0) {
            return { count: 0, pattern: 'none' };
        }

        // Calculate average distance from center
        let totalDistance = 0;
        let center = new THREE.Vector3();
        
        // Calculate center point
        for (const point of this.spawnPoints) {
            center.add(point);
        }
        center.divideScalar(this.spawnPoints.length);

        // Calculate average distance from center
        for (const point of this.spawnPoints) {
            totalDistance += center.distanceTo(point);
        }

        return {
            count: this.spawnPoints.length,
            pattern: this.currentFormation.name,
            averageDistance: Math.round(totalDistance / this.spawnPoints.length),
            centerPosition: {
                x: Math.round(center.x),
                y: Math.round(center.y),
                z: Math.round(center.z)
            }
        };
    }
}