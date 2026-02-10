// environment.ts - Main environment class that integrates all environment components

import * as THREE from 'three';
import { SceneInitializer } from './environment/core/sceneInitializer.ts';
import { RegionManager } from './environment/core/regionManager.ts';
import { SystemTransitionManager } from './environment/core/systemTransitionManager.ts';

interface EnvironmentComponents {
    skybox?: any;
    sun?: any;
    starSystemGenerator?: any;
    planets?: any;
    stargate?: any;
    asteroidBelt?: any;
    spaceAnomalies?: any;
    systemTransition?: any;
    customSystemCreator?: any;
}

export class Environment {
    scene: THREE.Scene;
    componentsLoaded: boolean;
    sceneInitializer: any;
    regionManager: any;
    transitionManager: any;
    
    // Components assigned from sceneInitializer
    skybox: any;
    sun: any;
    starSystemGenerator: any;
    planets: any;
    stargate: any;
    asteroidBelt: any;
    spaceAnomalies: any;
    systemTransition: any;
    customSystemCreator: any;
    
    asteroids: any[];
    currentSystemId: string;
    spaceship: any;
    vibeVersePortals: any;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.componentsLoaded = false;
        
        // Initialize core managers
        this.sceneInitializer = new SceneInitializer(scene);
        this.regionManager = new RegionManager();
        this.transitionManager = new SystemTransitionManager();
        
        // Initialize essential components
        const essentialComponents = this.sceneInitializer.initializeEssentialComponents() as EnvironmentComponents;
        Object.assign(this, essentialComponents);
        
        // Store references for easier access
        this.asteroids = [];
        this.currentSystemId = this.transitionManager.getCurrentSystemId();
        
        // Setup initial regions for location tracking (minimal setup)
        this.regionManager.setupInitialRegions(this.sun, this.stargate, this.planets);
        
        // Schedule loading of remaining components after a short delay to not block startup
        setTimeout(async () => {
            const remainingComponents = await this.sceneInitializer.loadRemainingComponents() as EnvironmentComponents;
            Object.assign(this, remainingComponents);
            
            // Connect asteroids from asteroidBelt to environment
            if (this.asteroidBelt) {
                this.asteroids = this.asteroidBelt.getAsteroids();
            }
            
            this.componentsLoaded = true;
        }, 500);
    }
    
    
    // Called after spaceship is created - we need this to initialize portals
    async setSpaceship(spaceship: any): Promise<void> {
        this.spaceship = spaceship;
        this.vibeVersePortals = await this.sceneInitializer.initializePortals(spaceship);
    }
    
    // Travel to a new star system
    travelToSystem(systemId: string): any {
        return this.transitionManager.travelToSystem(
            systemId, 
            this.starSystemGenerator, 
            this.systemTransition, 
            (id: string) => this.updateEnvironmentForSystem(id)
        );
    }
    
    // Update environment visuals and properties for the new system
    updateEnvironmentForSystem(systemId: string): void {
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
    getPlayerLocation(playerPosition: THREE.Vector3): any {
        return this.regionManager.getPlayerLocation(
            playerPosition, 
            this.spaceAnomalies, 
            this.asteroids, 
            this.componentsLoaded
        );
    }

    // Get planet regions for external access
    getPlanetRegions(): any {
        return this.regionManager.getPlanetRegions();
    }
    
    // Find the closest asteroid to a position
    findClosestAsteroid(position: THREE.Vector3, maxDistance: number): any {
        if (this.componentsLoaded && this.asteroidBelt && typeof this.asteroidBelt.findClosestAsteroid === 'function') {
            return this.asteroidBelt.findClosestAsteroid(position, maxDistance);
        }
        return null;
    }
    
    // Find the closest space anomaly
    findClosestAnomaly(position: THREE.Vector3, maxDistance: number): any {
        if (this.componentsLoaded && this.spaceAnomalies && typeof this.spaceAnomalies.findClosestAnomaly === 'function') {
            return this.spaceAnomalies.findClosestAnomaly(position, maxDistance);
        }
        return null;
    }
    
    // Check if position collides with any anomaly
    checkAnomalyCollision(position: THREE.Vector3): any {
        if (!this.componentsLoaded || !this.spaceAnomalies) return null;
        
        const closestAnomaly = this.spaceAnomalies.findClosestAnomaly(position, 8000);
        if (closestAnomaly && this.spaceAnomalies.checkCollision(position, closestAnomaly)) {
            return closestAnomaly;
        }
        
        return null;
    }
    
    // Collect energy orb from anomaly
    collectAnomalyOrb(anomaly: any): any {
        if (this.componentsLoaded && this.spaceAnomalies && typeof this.spaceAnomalies.collectOrb === 'function') {
            return this.spaceAnomalies.collectOrb(anomaly);
        }
    }
    
    update(deltaTime: number = 0.016, camera: THREE.Camera): void {
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
    
    dispose(): void {
        // Delegate disposal to scene initializer
        if (this.sceneInitializer) {
            this.sceneInitializer.dispose();
        }
    }
}
