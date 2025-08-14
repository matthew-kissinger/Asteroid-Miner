// anomalyRegistry.js - Registry and factory for space anomalies

import { VortexAnomaly } from './vortex.js';
import { CrystalClusterAnomaly } from './crystalCluster.js';
import { NebulaNexusAnomaly } from './nebulaNexus.js';
import { QuantumFluxAnomaly } from './quantumFlux.js';
import { DarkMatterAnomaly } from './darkMatter.js';

export class AnomalyRegistry {
    constructor(scene, anomalyScale = 4, orbScale = 4) {
        this.scene = scene;
        this.anomalyScale = anomalyScale;
        this.orbScale = orbScale;
        
        // Initialize anomaly implementations
        this.anomalyTypes = {
            'vortex': new VortexAnomaly(scene, anomalyScale, orbScale),
            'crystalCluster': new CrystalClusterAnomaly(scene, anomalyScale, orbScale),
            'nebulaNexus': new NebulaNexusAnomaly(scene, anomalyScale, orbScale),
            'quantumFlux': new QuantumFluxAnomaly(scene, anomalyScale, orbScale),
            'darkMatter': new DarkMatterAnomaly(scene, anomalyScale, orbScale)
        };
    }

    /**
     * Create an anomaly of the specified type
     * @param {string} type - The type of anomaly to create
     * @param {THREE.Vector3} position - Position where the anomaly should be created
     * @param {Function} createEnergyOrbCallback - Callback to create energy orbs
     * @param {Function} getRandomOrbRarityCallback - Callback to get random orb rarity
     * @param {Function} addToSceneCallback - Callback to add objects to the scene
     * @returns {Object} The created anomaly data
     */
    createAnomaly(type, position, createEnergyOrbCallback, getRandomOrbRarityCallback, addToSceneCallback) {
        const anomalyClass = this.anomalyTypes[type];
        if (!anomalyClass) {
            throw new Error(`Unknown anomaly type: ${type}`);
        }

        return anomalyClass.create(position, createEnergyOrbCallback, getRandomOrbRarityCallback, addToSceneCallback);
    }

    /**
     * Update an anomaly of the specified type
     * @param {Object} anomaly - The anomaly to update
     * @param {number} deltaTime - Time since last update
     */
    updateAnomaly(anomaly, deltaTime) {
        const anomalyClass = this.anomalyTypes[anomaly.type];
        if (anomalyClass && typeof anomalyClass.update === 'function') {
            anomalyClass.update(anomaly, deltaTime);
        }
    }

    /**
     * Clean up an anomaly of the specified type
     * @param {Object} anomaly - The anomaly to clean up
     */
    cleanupAnomaly(anomaly) {
        const anomalyClass = this.anomalyTypes[anomaly.type];
        if (anomalyClass && typeof anomalyClass.cleanup === 'function') {
            anomalyClass.cleanup(anomaly);
        }
    }

    /**
     * Get all available anomaly type names
     * @returns {string[]} Array of anomaly type names
     */
    getAvailableTypes() {
        return Object.keys(this.anomalyTypes);
    }

    /**
     * Check if an anomaly type is supported
     * @param {string} type - The anomaly type to check
     * @returns {boolean} True if the type is supported
     */
    isTypeSupported(type) {
        return type in this.anomalyTypes;
    }
}