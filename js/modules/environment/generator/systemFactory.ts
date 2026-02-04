// systemFactory.js - Star system creation and configuration

import * as THREE from 'three';
import { 
    STAR_CLASSES, 
    SYSTEM_CLASSIFICATIONS, 
    SKYBOX_TEXTURES, 
    RESOURCE_DISTRIBUTION,
    CLASSIFICATION_MULTIPLIERS,
    STAR_COLORS,
    SKYBOX_COLORS
} from './systemConfig.js';
import { SystemNames } from './systemNames.js';
import { SystemUtils } from './systemUtils.js';

export class SystemFactory {
    static createSolarSystem() {
        return {
            id: 'Solar System',
            name: 'Solar System',
            starClass: 'G',
            classification: 'Home System',
            starColor: 0xFFFF00,
            planetCount: 8,
            asteroidDensity: 1.0,
            specialFeatures: ['Earth'],
            description: 'Our home system, with Earth as the starting location.',
            connections: [],
            position: new THREE.Vector3(0, 0, 0),
            skyboxParams: {
                starDensity: 1.0,
                nebulaDensity: 0.5,
                color: 0xFFFFFF,
                texturePath: './assets/2k_stars_milky_way.jpg',
                brightness: 1.0
            },
            resourceMultipliers: {
                iron: 1.0, 
                gold: 1.0, 
                platinum: 1.0
            }
        };
    }

    static createRandomSystem(id) {
        const starClass = SystemUtils.getRandomStarClass();
        const classification = SystemUtils.getRandomClassification();
        const starColor = STAR_COLORS[starClass] || 0xffffff;
        const resourceMult = SystemFactory.calculateResourceMultipliers(starClass, classification);
        const skyboxTexture = SystemUtils.getRandomSkyboxTexture();
        
        return {
            id: id,
            name: SystemNames.generateSystemName(starClass),
            starClass: starClass,
            classification: classification,
            starColor: starColor,
            planetCount: SystemUtils.getRandomInt(2, 10),
            asteroidDensity: SystemUtils.getRandomFloat(0.5, 2.5),
            specialFeatures: SystemNames.generateSpecialFeatures(classification),
            description: SystemNames.generateDescription(starClass, classification),
            connections: [],
            position: SystemUtils.generateMapPosition(),
            skyboxParams: {
                starDensity: SystemUtils.getRandomFloat(0.7, 1.5),
                nebulaDensity: SystemUtils.getRandomFloat(0.3, 1.2),
                color: SKYBOX_COLORS[starClass] || 0xffffff,
                texturePath: skyboxTexture,
                brightness: 0.8
            },
            resourceMultipliers: resourceMult
        };
    }

    static calculateResourceMultipliers(starClass, classification) {
        const baseDistribution = RESOURCE_DISTRIBUTION[starClass];
        const classMultiplier = CLASSIFICATION_MULTIPLIERS[classification];
        
        return {
            iron: baseDistribution.iron * classMultiplier.iron,
            gold: baseDistribution.gold * classMultiplier.gold, 
            platinum: baseDistribution.platinum * classMultiplier.platinum
        };
    }

    static createCustomSystem(systemData) {
        if (!systemData || !systemData.id || !systemData.name) {
            console.error('Invalid system data', systemData);
            return null;
        }

        return {
            id: systemData.id,
            name: systemData.name,
            starClass: systemData.starClass || SystemUtils.getRandomStarClass(),
            classification: systemData.classification || 'Custom',
            starColor: systemData.starColor || STAR_COLORS[systemData.starClass || 'G'],
            planetCount: systemData.planetData ? systemData.planetData.length : 0,
            asteroidDensity: systemData.asteroidDensity || 1.0,
            specialFeatures: systemData.specialFeatures || ['User Created'],
            description: systemData.description || 'A custom star system created by the user',
            connections: [],
            position: systemData.position || SystemUtils.generateMapPosition(),
            skyboxParams: {
                starDensity: systemData.skyboxParams?.starDensity || 1.0,
                nebulaDensity: systemData.skyboxParams?.nebulaDensity || 0.8,
                color: systemData.skyboxParams?.color || SKYBOX_COLORS[systemData.starClass || 'G'],
                texturePath: systemData.skyboxUrl || SystemUtils.getRandomSkyboxTexture(),
                brightness: systemData.skyboxParams?.brightness || 0.8,
                isCustomTexture: !!systemData.skyboxUrl
            },
            resourceMultipliers: systemData.resourceMultipliers || {
                iron: 1.0,
                gold: 1.0,
                platinum: 1.0
            },
            isCustomSystem: true
        };
    }
}