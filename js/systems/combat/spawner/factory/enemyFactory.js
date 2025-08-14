/**
 * Enemy Factory - Handles entity creation, mesh generation, and component setup
 */

import { SpectralDroneCreator } from './enemies/spectralDrone.js';
import { MeshGeneration } from './enemies/meshGeneration.js';
import { getRandomVisualVariant } from '../waves/definitions.js';

/**
 * Factory for creating enemy entities with all required components
 */
export class EnemyFactory {
    constructor(world) {
        this.world = world;
        
        // Initialize extracted modules
        this.spectralDroneCreator = new SpectralDroneCreator(world);
        this.meshGeneration = new MeshGeneration(world);
    }


    /**
     * Create a spectral drone entity at the given position
     * @param {THREE.Vector3} position - Spawn position
     * @param {Object} poolManager - Enemy pool manager
     * @param {Set} enemies - Active enemies tracking set
     * @param {number} maxEnemies - Maximum enemy count
     * @param {Object} enemyConfig - Current enemy configuration
     * @returns {Entity|null} The created entity or null if failed
     */
    createSpectralDrone(position, poolManager, enemies, maxEnemies, enemyConfig) {
        const entity = this.spectralDroneCreator.createSpectralDrone(position, poolManager, enemies, maxEnemies, enemyConfig);
        
        if (entity) {
            // Add visual variant and setup mesh
            const visualVariant = getRandomVisualVariant();
            entity.visualVariant = visualVariant;
            this.meshGeneration.setupMeshComponent(entity);
        }
        
        return entity;
    }



}