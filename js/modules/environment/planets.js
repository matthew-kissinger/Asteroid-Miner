// planets.js - Creates and manages the planets in the solar system

import * as THREE from 'three';
import { PlanetGenerator } from './planets/planetGenerator.js';
import { PlanetFactory } from './planets/planetFactory.js';

export class Planets {
    constructor(scene, starSystemGenerator) {
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
    createHomeSolarSystem() {
        const solarSystemPlanets = PlanetGenerator.createHomeSolarSystemPlanets();
        this.systemPlanets['Solar System'] = solarSystemPlanets;
        this.createPlanetsForSystem('Solar System');
    }
    
    // Create planet objects for the current system
    createPlanetsForSystem(systemId) {
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
    generatePlanetsForSystem(systemId) {
        return PlanetGenerator.generatePlanetsForSystem(systemId, this.starSystemGenerator);
    }
    
    // Create planet objects from data array
    createPlanetsFromData(planetData) {
        this.clearPlanets();
        
        planetData.forEach(planet => {
            const planetObj = PlanetFactory.createPlanetMesh(planet);
            
            // Add the planet to the scene
            this.scene.add(planetObj.mesh);
            
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
    clearPlanets() {
        // Remove planets from scene and clear arrays
        this.planets.forEach(planet => {
            this.scene.remove(planet.mesh);
        });
        
        this.planets = [];
        this.planetRegions = {};
    }
    
    // Set up planet system for specified star system
    updateForSystem(systemId) {
        console.log(`Updating planets for system: ${systemId}`);
        
        // Generate and create planets for this system if we haven't already
        this.createPlanetsForSystem(systemId);
        
        // Return true to indicate success
        return true;
    }
    
    getPlanetRegions() {
        return this.planetRegions;
    }
    
    getPlanets() {
        return this.planets;
    }
    
    update(deltaTime) {
        this.planets.forEach(planet => {
            planet.angle += planet.speed * deltaTime;
            
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * Math.cos(planet.orbitalTilt) * planet.distance;
            planet.mesh.position.y = Math.sin(planet.angle) * Math.sin(planet.orbitalTilt) * planet.distance;
            
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
}