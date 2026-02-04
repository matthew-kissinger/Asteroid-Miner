// systemUtils.js - Utility functions for star system generation

import * as THREE from 'three';
import { STAR_CLASSES, SYSTEM_CLASSIFICATIONS, SKYBOX_TEXTURES } from './systemConfig.js';

export class SystemUtils {
    static getRandomStarClass() {
        const weights = [1, 2, 5, 10, 15, 20, 50]; // More M class stars, fewer O class
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * total;
        
        for (let i = 0; i < weights.length; i++) {
            if (random < weights[i]) {
                return STAR_CLASSES[i];
            }
            random -= weights[i];
        }
        
        return STAR_CLASSES[SystemUtils.getRandomInt(0, STAR_CLASSES.length - 1)];
    }

    static getRandomClassification() {
        return SYSTEM_CLASSIFICATIONS[SystemUtils.getRandomInt(0, SYSTEM_CLASSIFICATIONS.length - 1)];
    }

    static getRandomSkyboxTexture() {
        return SKYBOX_TEXTURES[SystemUtils.getRandomInt(0, SKYBOX_TEXTURES.length - 1)];
    }

    static generateMapPosition() {
        const radius = 150 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return new THREE.Vector3(x, y, 0);
    }

    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    static getRandomColor() {
        return Math.floor(Math.random() * 0xFFFFFF);
    }
}