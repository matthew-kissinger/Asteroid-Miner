// environment.js - Main environment class that integrates all environment components

import { SceneInitializer } from './environment/core/sceneInitializer.js';
import { RegionManager } from './environment/core/regionManager.js';
import { SystemTransitionManager } from './environment/core/systemTransitionManager.js';
import { AsteroidBelt } from './environment/asteroidBelt.js';
import { SystemTransition } from './environment/systemTransition.js';
import { CustomSystemCreator } from './ui/customSystemCreator.js';
import { VibeVersePortals } from './environment/vibeVersePortals.js';
import { SpaceAnomalies } from './environment/spaceAnomalies.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.componentsLoaded = false;
        
        // Initialize core managers
        this.sceneInitializer = new SceneInitializer(scene);
        this.regionManager = new RegionManager();
        this.transitionManager = new SystemTransitionManager();
        
        // Initialize essential components
        const essentialComponents = this.sceneInitializer.initializeEssentialComponents();
        Object.assign(this, essentialComponents);
        
        // Store references for easier access
        this.asteroids = [];
        this.currentSystemId = this.transitionManager.getCurrentSystemId();
        
        // Setup initial regions for location tracking (minimal setup)
        this.regionManager.setupInitialRegions(this.sun, this.stargate, this.planets);
        
        // Schedule loading of remaining components after a short delay to not block startup
        setTimeout(async () => {
            const remainingComponents = await this.sceneInitializer.loadRemainingComponents();
            Object.assign(this, remainingComponents);
            
            // Connect asteroids from asteroidBelt to environment
            if (this.asteroidBelt) {
                this.asteroids = this.asteroidBelt.getAsteroids();
            }
            
            this.componentsLoaded = true;
        }, 500);
    }
    
    
    // Called after spaceship is created - we need this to initialize portals
    async setSpaceship(spaceship) {
        this.spaceship = spaceship;
        this.vibeVersePortals = await this.sceneInitializer.initializePortals(spaceship);
    }
    
    // Travel to a new star system
    travelToSystem(systemId) {
        return this.transitionManager.travelToSystem(
            systemId, 
            this.starSystemGenerator, 
            this.systemTransition, 
            (systemId) => this.updateEnvironmentForSystem(systemId)
        );
    }
    
    // Update environment visuals and properties for the new system
    updateEnvironmentForSystem(systemId) {
        this.transitionManager.updateEnvironmentForSystem(
            systemId, 
            this.starSystemGenerator, 
            this.skybox, 
            this.sun, 
            this.planets, 
            this.asteroidBelt, 
            this.spaceAnomalies, 
            this.regionManager
        );
        this.currentSystemId = this.transitionManager.getCurrentSystemId();
    }
    
    // Get the player's current location based on position
    getPlayerLocation(playerPosition) {
        return this.regionManager.getPlayerLocation(
            playerPosition, 
            this.spaceAnomalies, 
            this.asteroids, 
            this.componentsLoaded
        );
    }

    // Get planet regions for external access
    getPlanetRegions() {
        return this.regionManager.getPlanetRegions();
    }
    
    // Find the closest asteroid to a position
    findClosestAsteroid(position, maxDistance) {
        if (this.componentsLoaded && this.asteroidBelt && this.asteroidBelt.findClosestAsteroid) {
            return this.asteroidBelt.findClosestAsteroid(position, maxDistance);
        }
        return null;
    }
    
    // Find the closest space anomaly
    findClosestAnomaly(position, maxDistance) {
        if (this.componentsLoaded && this.spaceAnomalies && this.spaceAnomalies.findClosestAnomaly) {
            return this.spaceAnomalies.findClosestAnomaly(position, maxDistance);
        }
        return null;
    }
    
    // Check if position collides with any anomaly
    checkAnomalyCollision(position) {
        if (!this.componentsLoaded || !this.spaceAnomalies) return null;
        
        const closestAnomaly = this.spaceAnomalies.findClosestAnomaly(position, 8000);
        if (closestAnomaly && this.spaceAnomalies.checkCollision(position, closestAnomaly)) {
            return closestAnomaly;
        }
        
        return null;
    }
    
    // Collect energy orb from anomaly
    collectAnomalyOrb(anomaly) {
        if (this.componentsLoaded && this.spaceAnomalies && this.spaceAnomalies.collectOrb) {
            return this.spaceAnomalies.collectOrb(anomaly);
        }
    }
    
    update(deltaTime = 0.016, camera) {
        // Update skybox if it has an update method
        if (this.skybox && typeof this.skybox.update === 'function') {
            this.skybox.update(deltaTime);
        }
        
        // Update sun if it has an update method
        if (this.sun && typeof this.sun.update === 'function') {
            this.sun.update(deltaTime);
        }
        
        // Update planets if they have an update method
        if (this.planets && typeof this.planets.update === 'function') {
            this.planets.update(deltaTime);
        }
        
        // Update system transition effects if active - this needs to run regardless of componentsLoaded
        if (this.systemTransition && typeof this.systemTransition.update === 'function') {
            this.systemTransition.update(deltaTime);
        }
        
        // Only update non-essential components if they're loaded
        if (this.componentsLoaded) {
            // Update asteroids
            if (this.asteroidBelt && typeof this.asteroidBelt.update === 'function') {
                this.asteroidBelt.update(deltaTime);
            }
            
            // Update stargate
            if (this.stargate && typeof this.stargate.update === 'function') {
                this.stargate.update(deltaTime);
            }
            
            // Update space anomalies
            if (this.spaceAnomalies && typeof this.spaceAnomalies.update === 'function') {
                this.spaceAnomalies.update(deltaTime, camera);
            }
            
            // Update vibe verse portals
            if (this.vibeVersePortals && typeof this.vibeVersePortals.update === 'function') {
                this.vibeVersePortals.update(deltaTime);
            }
        }
    }
    
    dispose() {
        // Delegate disposal to scene initializer
        if (this.sceneInitializer) {
            this.sceneInitializer.dispose();
        }
    }
} 