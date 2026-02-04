// planetFactory.ts - Planet mesh creation and ring generation

import * as THREE from 'three';
import { PlanetMaterials } from './planetMaterials.js';

// Type definitions for planet objects
export interface PlanetData {
    name: string;
    size: number;
    distance: number;
    speed: number;
    color?: number;
    rings?: boolean;
    axialTilt?: number;
    orbitalTilt?: number;
    textureUrl?: string;
}

export interface PlanetMeshData {
    mesh: THREE.Mesh;
    distance: number;
    speed: number;
    angle: number;
    orbitalTilt: number;
}

export class PlanetFactory {
    static createPlanetMesh(planet: PlanetData): PlanetMeshData {
        const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
        const planetMaterial = PlanetMaterials.createMaterialForPlanet(planet);
        const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

        // Position the planet at its orbital distance
        const angle = Math.random() * Math.PI * 2;
        const orbitalTilt = planet.orbitalTilt || 0;
        const axialTilt = planet.axialTilt || 0;

        // Position planet with orbital tilt
        planetMesh.position.x = Math.cos(angle) * planet.distance;
        planetMesh.position.y = Math.sin(orbitalTilt) * planet.distance;
        planetMesh.position.z = Math.sin(angle) * Math.cos(orbitalTilt) * planet.distance;

        // Apply axial tilt to planet rotation
        planetMesh.rotation.x = axialTilt;

        // Enable shadows for eclipse effects
        planetMesh.castShadow = true;
        planetMesh.receiveShadow = true;

        // Create planet rings if specified
        if (planet.rings) {
            const ringMesh = PlanetFactory.createRingMesh(planet);
            planetMesh.add(ringMesh);
        }

        return {
            mesh: planetMesh,
            distance: planet.distance,
            speed: planet.speed,
            angle: angle,
            orbitalTilt: orbitalTilt
        };
    }

    static createRingMesh(planet: PlanetData): THREE.Mesh {
        let ringGeometry: THREE.RingGeometry;

        if (planet.name === "Saturn") {
            ringGeometry = new THREE.RingGeometry(planet.size * 1.4, planet.size * 2.0, 32);
        } else {
            ringGeometry = new THREE.RingGeometry(planet.size * 1.3, planet.size * 1.8, 32);
        }

        const ringMaterial = PlanetMaterials.createRingMaterial(planet);
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

        // Rotate rings to be flat (perpendicular to y-axis)
        ringMesh.rotation.x = Math.PI / 2;

        // Enable shadows for rings
        ringMesh.castShadow = true;
        ringMesh.receiveShadow = true;

        return ringMesh;
    }
}