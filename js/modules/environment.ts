// environment.ts - Main environment class that integrates all environment components

import * as THREE from 'three';
import type { Skybox } from './environment/skybox.ts';
import type { Sun } from './environment/sun.ts';
import type { Planets } from './environment/planets.ts';
import type { Stargate } from './environment/stargate.ts';
import type { StarSystemGenerator } from './environment/starSystemGenerator.ts';
import type { AsteroidBelt } from './environment/asteroidBelt.ts';
import type { SpaceAnomalies } from './environment/spaceAnomalies.ts';
import type { SystemTransition } from './environment/systemTransition.ts';
import type { HazardManager } from './environment/hazards/hazardManager.ts';
import type { EnvironmentEffects } from './environment/effects/environmentEffects.ts';
import { SceneInitializer } from './environment/core/sceneInitializer.ts';
import { RegionManager } from './environment/core/regionManager.ts';
import { SystemTransitionManager } from './environment/core/systemTransitionManager.ts';

interface VibeVersePortalsUpdatable {
    update(deltaTime: number): void;
}

interface CustomSystemCreator {
    // unknown type - no specific methods accessed
}

interface EnvironmentAsteroidData {
    mesh: THREE.Object3D;
    [key: string]: unknown;
}

interface EnvironmentAnomalyData {
    position: THREE.Vector3;
    type: string;
    orbCollected: boolean;
    mesh: THREE.Object3D;
    orb: unknown;
    [key: string]: unknown;
}

interface OrbReward {
    rarity: string;
    value: number;
}

interface EnvironmentComponents {
    skybox?: Skybox;
    sun?: Sun;
    starSystemGenerator?: StarSystemGenerator;
    planets?: Planets;
    stargate?: Stargate;
    asteroidBelt?: AsteroidBelt;
    spaceAnomalies?: SpaceAnomalies;
    systemTransition?: SystemTransition;
    customSystemCreator?: CustomSystemCreator;
    hazardManager?: HazardManager;
    environmentEffects?: EnvironmentEffects;
}

export class Environment {
    scene: THREE.Scene;
    componentsLoaded: boolean;
    sceneInitializer: SceneInitializer;
    regionManager: RegionManager;
    transitionManager: SystemTransitionManager;

    // Components assigned from sceneInitializer
    skybox?: Skybox;
    sun?: Sun;
    starSystemGenerator?: StarSystemGenerator;
    planets?: Planets;
    stargate?: Stargate;
    asteroidBelt?: AsteroidBelt;
    spaceAnomalies?: SpaceAnomalies;
    systemTransition?: SystemTransition;
    customSystemCreator?: CustomSystemCreator;
    hazardManager?: HazardManager;
    environmentEffects?: EnvironmentEffects;

    asteroids: EnvironmentAsteroidData[];
    currentSystemId: string;
    spaceship: any; // Using any to access position property
    vibeVersePortals?: VibeVersePortalsUpdatable;

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
        if (this.sun && this.stargate && this.planets) {
            this.regionManager.setupInitialRegions(this.sun, this.stargate, this.planets);
        }
        
        // Schedule loading of remaining components after a short delay to not block startup
        setTimeout(async () => {
            const remainingComponents = await this.sceneInitializer.loadRemainingComponents() as EnvironmentComponents;
            Object.assign(this, remainingComponents);
            
            // Connect asteroids from asteroidBelt to environment
            if (this.asteroidBelt) {
                this.asteroids = this.asteroidBelt.getAsteroids() as unknown as EnvironmentAsteroidData[];
            }
            
            this.componentsLoaded = true;
        }, 500);
    }
    

    // Called after spaceship is created - we need this to initialize portals
    async setSpaceship(spaceship: unknown): Promise<void> {
        this.spaceship = spaceship;
        this.vibeVersePortals = await this.sceneInitializer.initializePortals(spaceship);
    }

    // Travel to a new star system
    travelToSystem(systemId: string): boolean {
        if (!this.starSystemGenerator || !this.systemTransition) {
            return false;
        }
        return this.transitionManager.travelToSystem(
            systemId,
            this.starSystemGenerator,
            this.systemTransition,
            (id: string) => this.updateEnvironmentForSystem(id)
        );
    }
    
    // Update environment visuals and properties for the new system
    updateEnvironmentForSystem(systemId: string): void {
        if (!this.starSystemGenerator || !this.skybox || !this.sun || !this.planets ||
            !this.asteroidBelt || !this.spaceAnomalies) {
            console.warn('Cannot update environment: missing required components');
            return;
        }

        this.transitionManager.updateEnvironmentForSystem(
            systemId,
            this.starSystemGenerator,
            this.skybox as unknown as Parameters<typeof this.transitionManager.updateEnvironmentForSystem>[2],
            this.sun as unknown as Parameters<typeof this.transitionManager.updateEnvironmentForSystem>[3],
            this.planets,
            this.asteroidBelt,
            this.spaceAnomalies,
            this.regionManager,
            this.hazardManager
        );
        this.currentSystemId = this.transitionManager.getCurrentSystemId();

        // Connect new asteroids from the updated asteroid belt
        if (this.asteroidBelt) {
            this.asteroids = this.asteroidBelt.getAsteroids() as unknown as EnvironmentAsteroidData[];
        }

        // Dispose and recreate environmental effects for the new system
        if (this.environmentEffects) {
            this.environmentEffects.dispose();
            this.environmentEffects = undefined;
        }
        if (this.componentsLoaded) {
            import('./environment/effects/environmentEffects.ts').then(({ EnvironmentEffects }) => {
                this.environmentEffects = new EnvironmentEffects(this.scene);
            }).catch(err => console.error("Failed to recreate environment effects:", err));
        }
    }

    // Get the player's current location based on position
    getPlayerLocation(playerPosition: THREE.Vector3): string {
        return this.regionManager.getPlayerLocation(
            playerPosition,
            this.spaceAnomalies || null,
            this.asteroids,
            this.componentsLoaded
        );
    }

    // Get planet regions for external access
    getPlanetRegions(): Record<string, unknown> {
        return this.regionManager.getPlanetRegions();
    }

    // Find the closest asteroid to a position
    findClosestAsteroid(position: THREE.Vector3, maxDistance: number): EnvironmentAsteroidData | null {
        if (this.componentsLoaded && this.asteroidBelt) {
            return this.asteroidBelt.findClosestAsteroid(position, maxDistance) as unknown as EnvironmentAsteroidData | null;
        }
        return null;
    }

    // Find the closest space anomaly
    findClosestAnomaly(position: THREE.Vector3, maxDistance: number): EnvironmentAnomalyData | null {
        if (this.componentsLoaded && this.spaceAnomalies) {
            return this.spaceAnomalies.findClosestAnomaly(position, maxDistance) as unknown as EnvironmentAnomalyData | null;
        }
        return null;
    }

    // Check if position collides with any anomaly
    checkAnomalyCollision(position: THREE.Vector3): EnvironmentAnomalyData | null {
        if (!this.componentsLoaded || !this.spaceAnomalies) return null;

        const closestAnomaly = this.spaceAnomalies.findClosestAnomaly(position, 8000) as unknown as EnvironmentAnomalyData | null;
        if (closestAnomaly && this.spaceAnomalies.checkCollision(position, closestAnomaly as unknown as Parameters<typeof this.spaceAnomalies.checkCollision>[1])) {
            return closestAnomaly;
        }

        return null;
    }

    // Collect energy orb from anomaly
    collectAnomalyOrb(anomaly: EnvironmentAnomalyData): OrbReward | null | undefined {
        if (this.componentsLoaded && this.spaceAnomalies) {
            return this.spaceAnomalies.collectOrb(anomaly as unknown as Parameters<typeof this.spaceAnomalies.collectOrb>[0]) as unknown as OrbReward | null;
        }
        return undefined;
    }
    
    update(deltaTime: number = 0.016, _camera?: THREE.Camera): void {
        // Update skybox
        if (this.skybox) {
            this.skybox.update(deltaTime);
        }

        // Update sun
        if (this.sun) {
            this.sun.update(deltaTime);
        }

        // Update planets
        if (this.planets) {
            this.planets.update(deltaTime);
        }

        // SystemTransition handles its own animation loop via requestAnimationFrame,
        // no update call needed

        // Only update non-essential components if they're loaded
        if (this.componentsLoaded) {
            // Update asteroids
            if (this.asteroidBelt) {
                this.asteroidBelt.update(deltaTime);
            }

            // Update stargate
            if (this.stargate) {
                this.stargate.update();
            }

            // Update space anomalies
            if (this.spaceAnomalies) {
                this.spaceAnomalies.update(deltaTime);
            }

            // Update environmental hazards
            if (this.hazardManager) {
                this.hazardManager.update(deltaTime);
            }

            // Update environmental effects (dust, nebula, starfield)
            if (this.environmentEffects) {
                const playerPos = this.spaceship && this.spaceship.position ? this.spaceship.position : new THREE.Vector3(0, 0, 0);
                const hasAsteroidBelt = !!this.asteroidBelt && this.asteroids.length > 0;
                this.environmentEffects.update(deltaTime, playerPos, hasAsteroidBelt);
            }

            // Update vibe verse portals
            if (this.vibeVersePortals) {
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
