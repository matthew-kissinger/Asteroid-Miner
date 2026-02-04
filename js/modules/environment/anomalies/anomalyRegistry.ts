// anomalyRegistry.ts - Registry and factory for space anomalies

import { VortexAnomaly } from './vortex';
import { CrystalClusterAnomaly } from './crystalCluster';
import { NebulaNexusAnomaly } from './nebulaNexus';
import { QuantumFluxAnomaly } from './quantumFlux';
import { DarkMatterAnomaly } from './darkMatter';
import * as THREE from 'three';

// Callback type definitions
interface EnergyOrbData {
    mesh: THREE.Sprite | THREE.Mesh;
}

type CreateEnergyOrbCallback = (rarity: string) => EnergyOrbData;
type GetRandomOrbRarityCallback = () => string;
type AddToSceneCallback = (object: THREE.Object3D) => void;

// Define a common interface for anomaly classes
interface BaseAnomaly {
    create(
        position: THREE.Vector3,
        createEnergyOrbCallback: CreateEnergyOrbCallback,
        getRandomOrbRarityCallback: GetRandomOrbRarityCallback,
        addToSceneCallback: AddToSceneCallback
    ): any;
    update?(anomaly: any, deltaTime: number): void;
    cleanup?(anomaly: any): void;
}

export class AnomalyRegistry {
    private anomalyTypes: { [key: string]: BaseAnomaly };

    constructor(_scene: THREE.Scene, _anomalyScale: number = 4, _orbScale: number = 4) {
        
        // Initialize anomaly implementations
        this.anomalyTypes = {
            'vortex': new VortexAnomaly(_scene, _anomalyScale, _orbScale),
            'crystalCluster': new CrystalClusterAnomaly(_scene, _anomalyScale, _orbScale),
            'nebulaNexus': new NebulaNexusAnomaly(_scene, _anomalyScale, _orbScale),
            'quantumFlux': new QuantumFluxAnomaly(_scene, _anomalyScale, _orbScale),
            'darkMatter': new DarkMatterAnomaly(_scene, _anomalyScale, _orbScale)
        };
    }

    /**
     * Create an anomaly of the specified type
     * @param type - The type of anomaly to create
     * @param position - Position where the anomaly should be created
     * @param createEnergyOrbCallback - Callback to create energy orbs
     * @param getRandomOrbRarityCallback - Callback to get random orb rarity
     * @param addToSceneCallback - Callback to add objects to the scene
     * @returns The created anomaly data
     */
    createAnomaly(
        type: string,
        position: THREE.Vector3,
        createEnergyOrbCallback: CreateEnergyOrbCallback,
        getRandomOrbRarityCallback: GetRandomOrbRarityCallback,
        addToSceneCallback: AddToSceneCallback
    ): any {
        const anomalyClass = this.anomalyTypes[type];
        if (!anomalyClass) {
            throw new Error(`Unknown anomaly type: ${type}`);
        }

        return anomalyClass.create(position, createEnergyOrbCallback, getRandomOrbRarityCallback, addToSceneCallback);
    }

    /**
     * Update an anomaly of the specified type
     * @param anomaly - The anomaly to update
     * @param deltaTime - Time since last update
     */
    updateAnomaly(anomaly: any, deltaTime: number): void {
        const anomalyClass = this.anomalyTypes[anomaly.type];
        if (anomalyClass && typeof anomalyClass.update === 'function') {
            anomalyClass.update(anomaly, deltaTime);
        }
    }

    /**
     * Clean up an anomaly of the specified type
     * @param anomaly - The anomaly to clean up
     */
    cleanupAnomaly(anomaly: any): void {
        const anomalyClass = this.anomalyTypes[anomaly.type];
        if (anomalyClass && typeof anomalyClass.cleanup === 'function') {
            anomalyClass.cleanup(anomaly);
        }
    }

    /**
     * Get all available anomaly type names
     * @returns Array of anomaly type names
     */
    getAvailableTypes(): string[] {
        return Object.keys(this.anomalyTypes);
    }

    /**
     * Check if an anomaly type is supported
     * @param type - The anomaly type to check
     * @returns True if the type is supported
     */
    isTypeSupported(type: string): boolean {
        return type in this.anomalyTypes;
    }
}