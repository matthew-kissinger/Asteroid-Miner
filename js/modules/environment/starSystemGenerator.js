// starSystemGenerator.js - Procedural generation of star systems

import * as THREE from 'three';
import { SystemFactory } from './generator/systemFactory.js';
import { SystemUtils } from './generator/systemUtils.js';

export class StarSystemGenerator {
    constructor(scene) {
        this.scene = scene;
        this.systems = {};
        this.currentSystem = null;
        this.warpGates = {};
        this.initializeSystems();
    }
    
    // Initialize star systems with Solar System as default
    initializeSystems() {
        console.log("Initializing star systems...");
        
        this.systems['Solar System'] = SystemFactory.createSolarSystem();
        this.generateRandomSystems(5);
        this.createSystemConnections();
        this.setCurrentSystem('Solar System');
        
        console.log("Star systems initialized");
    }
    
    // Generate random star systems
    generateRandomSystems(count) {
        for (let i = 0; i < count; i++) {
            const id = `System-${i+1}`;
            this.systems[id] = SystemFactory.createRandomSystem(id);
        }
    }
    
    // Create connections between systems
    createSystemConnections() {
        const systemIds = Object.keys(this.systems);
        
        // Connect Solar System to at least two random systems
        const solarConnections = this.getRandomSystemsExcept('Solar System', 2);
        for (const targetId of solarConnections) {
            this.createConnection('Solar System', targetId);
        }
        
        // Ensure each system has at least one connection
        for (const systemId of systemIds) {
            const system = this.systems[systemId];
            if (system.connections.length === 0) {
                const targetId = this.getRandomSystemExcept(systemId);
                this.createConnection(systemId, targetId);
            }
        }
        
        // Add additional random connections
        const extraConnectionCount = Math.floor(systemIds.length / 2);
        for (let i = 0; i < extraConnectionCount; i++) {
            const sourceId = systemIds[SystemUtils.getRandomInt(0, systemIds.length - 1)];
            const targetId = this.getRandomSystemExcept(sourceId);
            
            if (!this.systems[sourceId].connections.includes(targetId)) {
                this.createConnection(sourceId, targetId);
            }
        }
    }
    
    // Create a connection between two systems
    createConnection(sourceId, targetId) {
        this.systems[sourceId].connections.push(targetId);
        this.systems[targetId].connections.push(sourceId);
        
        if (!this.warpGates[sourceId]) {
            this.warpGates[sourceId] = [];
        }
        if (!this.warpGates[targetId]) {
            this.warpGates[targetId] = [];
        }
        
        this.warpGates[sourceId].push(targetId);
        this.warpGates[targetId].push(sourceId);
        
        console.log(`Created connection between ${sourceId} and ${targetId}`);
    }
    
    // Get list of connections for current system
    getCurrentSystemConnections() {
        if (!this.currentSystem) return [];
        return this.systems[this.currentSystem].connections;
    }
    
    // Get resource distribution for current system
    getCurrentSystemResources() {
        if (!this.currentSystem) return { iron: 1, gold: 1, platinum: 1 };
        
        const system = this.systems[this.currentSystem];
        return system.resourceMultipliers;
    }
    
    // Set the current active system
    setCurrentSystem(systemId) {
        if (this.systems[systemId]) {
            this.currentSystem = systemId;
            console.log(`Traveled to system: ${systemId}`);
            return true;
        }
        return false;
    }
    
    // Travel to a connected system
    travelToSystem(targetSystemId) {
        // Verify the target system exists
        if (!this.systems[targetSystemId]) {
            console.error(`System ${targetSystemId} does not exist`);
            return false;
        }
        
        // Verify there is a connection from current to target
        const connections = this.getCurrentSystemConnections();
        if (!connections.includes(targetSystemId)) {
            console.error(`No connection from ${this.currentSystem} to ${targetSystemId}`);
            return false;
        }
        
        // Check if the ship is docked
        if (window.game && window.game.spaceship && window.game.spaceship.isDocked) {
            console.log("Player is docked during interstellar travel");
        }
        
        // Log current system params
        if (this.systems[this.currentSystem]) {
            const currentParams = this.systems[this.currentSystem].skyboxParams;
            console.log(`${this.currentSystem} skybox params before travel: 
                         color=${currentParams.color.toString(16)}, 
                         starDensity=${currentParams.starDensity}, 
                         nebulaDensity=${currentParams.nebulaDensity}, 
                         texture=${currentParams.texturePath}`);
        }
        
        // Log target system params
        if (this.systems[targetSystemId]) {
            const targetParams = this.systems[targetSystemId].skyboxParams;
            console.log(`Traveling to ${targetSystemId} with skybox params: 
                         color=${targetParams.color.toString(16)}, 
                         starDensity=${targetParams.starDensity}, 
                         nebulaDensity=${targetParams.nebulaDensity}, 
                         texture=${targetParams.texturePath}`);
        }
        
        // Set the new current system
        this.setCurrentSystem(targetSystemId);
        return true;
    }
    
    // Get all star systems for the map
    getAllSystems() {
        return this.systems;
    }
    
    // Get current system data
    getCurrentSystemData() {
        if (!this.currentSystem) return null;
        return this.systems[this.currentSystem];
    }
    
    // Helper methods
    
    getRandomSystemsExcept(exceptId, count) {
        const systemIds = Object.keys(this.systems).filter(id => id !== exceptId);
        const selected = [];
        
        for (let i = 0; i < Math.min(count, systemIds.length); i++) {
            const index = SystemUtils.getRandomInt(0, systemIds.length - 1);
            selected.push(systemIds[index]);
            systemIds.splice(index, 1);
        }
        
        return selected;
    }
    
    getRandomSystemExcept(exceptId) {
        const systemIds = Object.keys(this.systems).filter(id => id !== exceptId);
        const index = SystemUtils.getRandomInt(0, systemIds.length - 1);
        return systemIds[index];
    }
    
    // Add custom system
    addCustomSystem(systemData) {
        const customSystem = SystemFactory.createCustomSystem(systemData);
        if (!customSystem) {
            return false;
        }
        
        if (this.systems[systemData.id]) {
            console.warn(`System with ID ${systemData.id} already exists, overwriting`);
        }
        
        console.log(`Adding custom system: ${systemData.name} (${systemData.id})`);
        
        // Store custom planet data if provided
        if (systemData.planetData && Array.isArray(systemData.planetData)) {
            this.storePlanetData(systemData.id, systemData.planetData);
        }
        
        this.systems[systemData.id] = customSystem;
        
        // Create connections
        this.createConnection('Solar System', systemData.id);
        
        const randomSystem = this.getRandomSystemExcept(systemData.id, 'Solar System');
        if (randomSystem) {
            this.createConnection(systemData.id, randomSystem);
        }
        
        console.log(`Custom system ${systemData.name} added successfully with connections to Solar System and ${randomSystem || 'no other system'}`);
        
        return true;
    }
    
    // Store custom planet data
    storePlanetData(systemId, planetData) {
        if (!Array.isArray(planetData)) {
            console.error('Planet data must be an array');
            return;
        }
        
        const standardizedPlanets = [];
        
        for (let i = 0; i < planetData.length; i++) {
            const planet = planetData[i];
            
            standardizedPlanets.push({
                name: planet.name || `Planet-${i+1}`,
                size: planet.size || (300 + Math.random() * 500),
                distance: planet.distance || (4800 + (i * 8000) + (Math.random() * 2000)),
                speed: planet.speed || (0.001 + (Math.random() * 0.001)),
                color: planet.color || SystemUtils.getRandomColor(),
                rings: planet.rings !== undefined ? planet.rings : Math.random() > 0.7,
                textureUrl: planet.textureUrl || null,
                axialTilt: planet.axialTilt || (Math.random() * Math.PI * 0.5),
                orbitalTilt: planet.orbitalTilt || (Math.random() * Math.PI * 0.2)
            });
        }
        
        if (!this.customPlanetData) {
            this.customPlanetData = {};
        }
        
        this.customPlanetData[systemId] = standardizedPlanets;
        console.log(`Stored ${standardizedPlanets.length} planets for system ${systemId}`);
    }

    /**
     * Returns player to stargate after interstellar travel
     * Should be called after travel to ensure proper docking state
     */
    returnFromTravel() {
        console.log("StarSystemGenerator: Handling return from interstellar travel");
        
        // Check if game and spaceship are available
        if (!window.game || !window.game.spaceship) {
            console.error("StarSystemGenerator: Cannot return from travel - game or spaceship not found");
            return false;
        }
        
        // Ensure the player is docked after travel
        if (!window.game.spaceship.isDocked) {
            console.log("StarSystemGenerator: Setting ship to docked state after travel");
            window.game.spaceship.dock();
        }
        
        // Reposition ship near stargate
        const dockingSystem = window.game.controls?.dockingSystem;
        if (dockingSystem) {
            console.log("StarSystemGenerator: Repositioning ship near stargate");
            dockingSystem.positionNearStargate();
            
            // Show stargate UI
            if (typeof dockingSystem.showStargateUI === 'function') {
                console.log("StarSystemGenerator: Showing stargate UI via docking system");
                dockingSystem.showStargateUI();
                return true;
            }
        }
        
        // Fallback - try to find UI or stargate interface directly
        if (window.game.ui?.stargateInterface?.showStargateUI) {
            console.log("StarSystemGenerator: Showing stargate UI via game.ui.stargateInterface");
            window.game.ui.stargateInterface.showStargateUI();
            return true;
        }
        
        console.warn("StarSystemGenerator: Could not fully complete return from travel");
        return false;
    }
}