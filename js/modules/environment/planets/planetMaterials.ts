// planetMaterials.ts - Planet material creation and management

import * as THREE from 'three';
import { planetTextures, proceduralTextures } from './planetTextures.js';
import type { PlanetData } from './planetFactory.js';

const textureLoader = new THREE.TextureLoader();

export class PlanetMaterials {
    static createMaterialForPlanet(planet: PlanetData): THREE.MeshStandardMaterial {
        // Check if this is a custom planet with its own texture
        if (planet.textureUrl) {
            console.log(`Creating planet ${planet.name} with custom texture: ${planet.textureUrl}`);

            // Fix texture path for API server images
            let adjustedTextureUrl = planet.textureUrl;

            if (planet.textureUrl.startsWith('/images/')) {
                if ((window as any).location.port === '8000') {
                    const serverHost = (window as any).location.hostname;
                    adjustedTextureUrl = `http://${serverHost}:8001${planet.textureUrl}`;
                    console.log(`Adjusted planet texture path to API server: ${adjustedTextureUrl}`);
                }
            }

            const customTexture = textureLoader.load(adjustedTextureUrl);
            customTexture.colorSpace = THREE.SRGBColorSpace;

            return new THREE.MeshStandardMaterial({
                map: customTexture,
                roughness: 0.5,
                metalness: 0.0,
                flatShading: false,
                emissive: new THREE.Color(planet.color || 0x222222),
                emissiveIntensity: 0.3
            });
        }

        // Use standard planet textures based on planet name
        switch (planet.name) {
            case "Mercury":
                return new THREE.MeshStandardMaterial({
                    map: planetTextures.mercury,
                    roughness: 0.95,
                    metalness: 0.0,
                    flatShading: false,
                    emissive: new THREE.Color(0x2a2a2a),
                    emissiveIntensity: 0.15
                });

            case "Venus":
                return new THREE.MeshStandardMaterial({
                    map: planetTextures.venus.surface,
                    roughness: 0.85,
                    metalness: 0.0,
                    flatShading: false,
                    emissive: new THREE.Color(0x443322),
                    emissiveIntensity: 0.2
                });

            case "Earth":
                return new THREE.MeshStandardMaterial({
                    map: planetTextures.earth,
                    roughness: 0.75,
                    metalness: 0.0,
                    flatShading: false,
                    emissive: new THREE.Color(0x112233),
                    emissiveIntensity: 0.18
                });

            case "Mars":
                return new THREE.MeshStandardMaterial({
                    map: planetTextures.mars,
                    roughness: 0.9,
                    metalness: 0.0,
                    flatShading: false,
                    emissive: new THREE.Color(0x442211),
                    emissiveIntensity: 0.18
                });

            case "Jupiter":
                return new THREE.MeshStandardMaterial({
                    map: planetTextures.jupiter,
                    roughness: 0.8,
                    metalness: 0.0,
                    flatShading: false,
                    emissive: new THREE.Color(0x332211),
                    emissiveIntensity: 0.15
                });

            case "Saturn":
                return new THREE.MeshStandardMaterial({
                    map: planetTextures.saturn.surface,
                    roughness: 0.85,
                    metalness: 0.0,
                    flatShading: false,
                    emissive: new THREE.Color(0x332211),
                    emissiveIntensity: 0.15
                });

            case "Uranus":
                return new THREE.MeshStandardMaterial({
                    map: planetTextures.uranus,
                    roughness: 0.85,
                    metalness: 0.0,
                    flatShading: false,
                    emissive: new THREE.Color(0x112233),
                    emissiveIntensity: 0.14
                });

            case "Neptune":
                return new THREE.MeshStandardMaterial({
                    map: planetTextures.neptune,
                    roughness: 0.85,
                    metalness: 0.0,
                    flatShading: false,
                    emissive: new THREE.Color(0x112244),
                    emissiveIntensity: 0.14
                });

            default:
                // For other planets, use a procedural texture from the collection
                const textureIndex = Math.floor(Math.random() * proceduralTextures.length);
                return new THREE.MeshStandardMaterial({
                    map: proceduralTextures[textureIndex],
                    roughness: 0.85,
                    metalness: 0.0,
                    color: new THREE.Color(planet.color),
                    flatShading: false,
                    emissive: new THREE.Color(0x222222),
                    emissiveIntensity: 0.15
                });
        }
    }

    static createRingMaterial(planet: PlanetData): THREE.MeshStandardMaterial {
        if (planet.name === "Saturn") {
            return new THREE.MeshStandardMaterial({
                map: planetTextures.saturn.rings,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                roughness: 0.8,
                metalness: 0.1,
                emissive: new THREE.Color(0xf0e5c9),
                emissiveIntensity: 0.2,
                emissiveMap: planetTextures.saturn.rings
            });
        } else {
            return new THREE.MeshStandardMaterial({
                color: planet.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.4,
                roughness: 0.7,
                metalness: 0.2,
                emissive: new THREE.Color(planet.color),
                emissiveIntensity: 0.3
            });
        }
    }
}