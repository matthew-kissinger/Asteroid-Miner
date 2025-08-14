/**
 * Enemy Factory - Handles entity creation, mesh generation, and component setup
 */

import { SpectralDroneCreator } from './enemies/spectralDrone.js';
import { MeshGeneration } from './enemies/meshGeneration.js';
import { getRandomEnemySubtype } from '../waves/definitions.js';

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
     * @param {Object} enemyConfig - Current enemy configuration (ignored, using subtype)
     * @param {string} subtypeId - Optional specific subtype to create
     * @returns {Entity|null} The created entity or null if failed
     */
    createSpectralDrone(position, poolManager, enemies, maxEnemies, enemyConfig, subtypeId = null) {
        // Get random subtype if not specified
        const subtype = subtypeId ? { id: subtypeId } : getRandomEnemySubtype();
        
        // Create entity with subtype-specific stats
        const entity = this.spectralDroneCreator.createSpectralDrone(
            position, 
            poolManager, 
            enemies, 
            maxEnemies, 
            subtype
        );
        
        if (entity) {
            // Store subtype on entity for later reference
            entity.subtype = subtype.id;
            // Setup mesh with subtype-specific shader
            this.meshGeneration.setupMeshComponent(entity, subtype.id);
        }
        
        return entity;
    }



}