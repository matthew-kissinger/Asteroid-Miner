// planets.ts - Creates and manages the planets in the solar system

import * as THREE from 'three';
import { createGameEntity, removeGameEntity } from '../../ecs/world';
import { Position, Planet as PlanetTag } from '../../ecs/components';
import { addPlanet } from '../../ecs/systems/index';
import { PlanetGenerator } from './planets/planetGenerator';
import { PlanetFactory, PlanetData, PlanetMeshData } from './planets/planetFactory';

interface StarSystemGenerator {
    customPlanetData?: Record<string, PlanetData[]>;
}

interface PlanetRegion {
    name: string;
    position: THREE.Vector3;
    radius: number;
}

export class Planets {
    scene: THREE.Scene;
    starSystemGenerator: StarSystemGenerator;
    planets: PlanetMeshData[];
    planetRegions: Record<string, PlanetRegion>;
    currentSystemId: string;
    systemPlanets: Record<string, PlanetData[]>;

    constructor(scene: THREE.Scene, starSystemGenerator: StarSystemGenerator) {
        this.scene = scene;
        this.starSystemGenerator = starSystemGenerator;
        this.planets = [];
        this.planetRegions = {};
        this.currentSystemId = 'Solar System'; // Default to our Solar System
        this.systemPlanets = {};

        // Initialize our solar system planets
        this.createHomeSolarSystem();
    }

    // Create our home solar system (the only non-procedural system)
    createHomeSolarSystem(): void {
        const solarSystemPlanets = PlanetGenerator.createHomeSolarSystemPlanets();
        this.systemPlanets['Solar System'] = solarSystemPlanets;
        this.createPlanetsForSystem('Solar System');
    }

    // Create planet objects for the current system
    createPlanetsForSystem(systemId: string): void {
        // Clear existing planets
        this.clearPlanets();

        // Update current system
        this.currentSystemId = systemId;

        // If we already have planet data for this system, use it
        if (this.systemPlanets[systemId]) {
            this.createPlanetsFromData(this.systemPlanets[systemId]);
            return;
        }

        // Otherwise, we need to generate planets for this system
        const generatedPlanets = this.generatePlanetsForSystem(systemId);
        this.systemPlanets[systemId] = generatedPlanets;
        this.createPlanetsFromData(generatedPlanets);
    }

    // Generate procedural planets for a new star system
    generatePlanetsForSystem(systemId: string): PlanetData[] {
        return PlanetGenerator.generatePlanetsForSystem(systemId, this.starSystemGenerator);
    }

    // Create planet objects from data array
    createPlanetsFromData(planetData: PlanetData[]): void {
        this.clearPlanets();

        planetData.forEach(planet => {
            const planetObj = PlanetFactory.createPlanetMesh(planet) as PlanetMeshData & { eid: number };

            // Add the planet to the scene
            this.scene.add(planetObj.mesh);

            // Create bitECS entity for the radar and other systems
            const eid = createGameEntity();
            PlanetTag.tag[eid] = 1;
            
            Position.x[eid] = planetObj.mesh.position.x;
            Position.y[eid] = planetObj.mesh.position.y;
            Position.z[eid] = planetObj.mesh.position.z;
            
            addPlanet(eid);
            planetObj.eid = eid;

            // Store planet data for orbiting
            this.planets.push(planetObj);

            // Store planet regions for game mechanics
            this.planetRegions[planet.name] = {
                name: planet.name,
                position: planetObj.mesh.position.clone(),
                radius: planet.size * 2
            };
        });
    }

    // Clear all existing planets
    clearPlanets(): void {
        // Remove planets from scene and clear arrays
        this.planets.forEach(planet => {
            if ((planet as any).eid !== undefined) {
                removeGameEntity((planet as any).eid);
            }
            this.scene.remove(planet.mesh);
        });

        this.planets = [];
        this.planetRegions = {};
    }

    // Set up planet system for specified star system
    updateForSystem(systemId: string): boolean {
        console.log(`Updating planets for system: ${systemId}`);

        // Generate and create planets for this system if we haven't already
        this.createPlanetsForSystem(systemId);

        // Return true to indicate success
        return true;
    }

    getPlanetRegions(): Record<string, PlanetRegion> {
        return this.planetRegions;
    }

    getPlanets(): PlanetMeshData[] {
        return this.planets;
    }

    update(deltaTime: number): void {
        this.planets.forEach(planet => {
            planet.angle += planet.speed * deltaTime;

            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * Math.cos(planet.orbitalTilt) * planet.distance;
            planet.mesh.position.y = Math.sin(planet.angle) * Math.sin(planet.orbitalTilt) * planet.distance;

            // Sync bitECS position for radar
            if ((planet as any).eid !== undefined) {
                const eid = (planet as any).eid;
                Position.x[eid] = planet.mesh.position.x;
                Position.y[eid] = planet.mesh.position.y;
                Position.z[eid] = planet.mesh.position.z;
            }

            planet.mesh.rotation.y += deltaTime * 0.1;

            // Update planet regions for location tracking
            if (planet.mesh) {
                Object.values(this.planetRegions).forEach(region => {
                    if (region && region.position) {
                        const distance = region.position.distanceTo(planet.mesh.position);
                        if (distance < 5000) {
                            region.position.copy(planet.mesh.position);
                        }
                    }
                });
            }
        });
    }

    dispose(): void {
        this.clearPlanets();
    }
}
