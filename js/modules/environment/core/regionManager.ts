// regionManager.ts - Handles celestial object regions and location tracking

import * as THREE from 'three';

interface RegionInfo {
    center: THREE.Vector3;
    radius?: number;
    minRadius?: number;
    maxRadius?: number;
}

interface PlanetRegion {
    name?: string;
    position?: THREE.Vector3;
    radius?: number;
}

interface PlanetLike {
    getPlanetRegions?: () => Record<string, PlanetRegion>;
}

interface SunLike {
    getPosition: () => THREE.Vector3;
    getRadius: () => number;
}

interface StargateLike {
    getRegionInfo: () => { center: THREE.Vector3; radius: number };
}

interface AsteroidBeltLike {
    getRegionInfo: () => { center: THREE.Vector3; innerRadius: number; outerRadius: number };
}

interface SpaceAnomaliesLike {
    getRegionInfo: () => { center: THREE.Vector3; innerRadius: number; outerRadius: number };
    findClosestAnomaly?: (position: THREE.Vector3, maxDistance?: number) => { position: THREE.Vector3; type: string; orbCollected: boolean } | null;
}

interface AsteroidLike {
    mesh: THREE.Object3D;
}

export class RegionManager {
    planetRegions: Record<string, RegionInfo>;

    constructor() {
        this.planetRegions = {};
    }

    // Basic region setup for essential components only
    setupInitialRegions(sun: SunLike, stargate: StargateLike, planets: PlanetLike): void {
        console.log("Setting up essential environment regions");

        // Initialize the planetRegions object
        this.planetRegions = {};

        // Safely get planet regions if the method exists
        if (planets && typeof planets.getPlanetRegions === 'function') {
            try {
                this.planetRegions = planets.getPlanetRegions();
            } catch (error) {
                console.warn("Error getting planet regions:", error);
            }
        } else {
            console.warn("planets.getPlanetRegions is not available, using empty object instead");
        }

        // Add sun region
        this.planetRegions["Sun"] = {
            center: sun.getPosition(),
            radius: sun.getRadius()
        };

        // Add stargate region
        const stargateRegion = stargate.getRegionInfo();
        this.planetRegions["Stargate"] = {
            center: stargateRegion.center,
            radius: stargateRegion.radius
        };
    }

    // Complete region setup with all components
    setupRegions(
        sun: SunLike,
        stargate: StargateLike,
        planets: PlanetLike,
        asteroidBelt: AsteroidBeltLike,
        spaceAnomalies: SpaceAnomaliesLike
    ): void {
        console.log("Setting up environment regions");

        // Initialize or reset the planetRegions object
        this.planetRegions = {};

        // Safely get planet regions if the method exists
        if (planets && typeof planets.getPlanetRegions === 'function') {
            try {
                this.planetRegions = planets.getPlanetRegions();
            } catch (error) {
                console.warn("Error getting planet regions in setupRegions:", error);
            }
        } else {
            console.warn("planets.getPlanetRegions is not available in setupRegions, using empty object");
        }

        // Add sun region
        this.planetRegions["Sun"] = {
            center: sun.getPosition(),
            radius: sun.getRadius()
        };

        // Add asteroid belt region
        const asteroidBeltRegion = asteroidBelt.getRegionInfo();
        this.planetRegions["Asteroid Belt"] = {
            center: asteroidBeltRegion.center,
            minRadius: asteroidBeltRegion.innerRadius,
            maxRadius: asteroidBeltRegion.outerRadius
        };

        // Add stargate region
        const stargateRegion = stargate.getRegionInfo();
        this.planetRegions["Stargate"] = {
            center: stargateRegion.center,
            radius: stargateRegion.radius
        };

        // Add space anomalies region
        const anomaliesRegion = spaceAnomalies.getRegionInfo();
        this.planetRegions["Space Anomalies"] = {
            center: anomaliesRegion.center,
            minRadius: anomaliesRegion.innerRadius,
            maxRadius: anomaliesRegion.outerRadius
        };
    }

    // Get the player's current location based on position
    getPlayerLocation(
        playerPosition: THREE.Vector3 | null,
        spaceAnomalies: SpaceAnomaliesLike | null,
        asteroids: AsteroidLike[] | null,
        componentsLoaded: boolean
    ): string {
        if (!playerPosition) {
            return "Unknown Location";
        }

        // Check if near stargate
        const stargateRegion = this.planetRegions["Stargate"];
        if (stargateRegion) {
            const distanceToStargate = playerPosition.distanceTo(stargateRegion.center);
            if (stargateRegion.radius && distanceToStargate <= stargateRegion.radius) {
                return "Stargate";
            }
        }

        // Check if near an anomaly - only if spaceAnomalies is loaded
        if (componentsLoaded && spaceAnomalies && typeof spaceAnomalies.findClosestAnomaly === 'function') {
            const closestAnomaly = spaceAnomalies.findClosestAnomaly(playerPosition, 2000);
            if (closestAnomaly) {
                const distance = playerPosition.distanceTo(closestAnomaly.position);
                if (distance < 800) {
                    let anomalyType = '';
                    switch (closestAnomaly.type) {
                        case 'vortex':
                            anomalyType = 'Vortex';
                            break;
                        case 'crystalCluster':
                            anomalyType = 'Crystal Cluster';
                            break;
                        case 'nebulaNexus':
                            anomalyType = 'Nebula Nexus';
                            break;
                        case 'quantumFlux':
                            anomalyType = 'Quantum Flux';
                            break;
                        case 'darkMatter':
                            anomalyType = 'Dark Matter';
                            break;
                    }

                    // Indicate if orb is still available
                    const orbStatus = closestAnomaly.orbCollected ? 'Depleted' : 'Active';
                    return `${anomalyType} Anomaly (${orbStatus})`;
                }
            }
        }

        // Check planets
        for (const [name, region] of Object.entries(this.planetRegions)) {
            if (name === "Asteroid Belt" && componentsLoaded && asteroids) {
                // Special case for asteroid belt - only if loaded
                const distance = playerPosition.distanceTo(region.center);
                if (region.minRadius && region.maxRadius &&
                    distance >= region.minRadius &&
                    distance <= region.maxRadius) {
                    // Count nearby asteroids (useful for mining)
                    const nearbyAsteroids = asteroids.filter(asteroid => {
                        return playerPosition.distanceTo(asteroid.mesh.position) < 500;
                    });

                    if (nearbyAsteroids.length > 0) {
                        return `Asteroid Field (${nearbyAsteroids.length} nearby)`;
                    }
                    return "Asteroid Belt";
                }
            } else if (name === "Space Anomalies" && componentsLoaded) {
                // Special case for space anomalies region - only if loaded
                const distance = playerPosition.distanceTo(region.center);
                if (region.minRadius && region.maxRadius &&
                    distance >= region.minRadius &&
                    distance <= region.maxRadius) {
                    return "Space Anomaly Field";
                }
            } else if (name !== "Sun" && name !== "Stargate" && region.center && region.radius) {
                const distance = playerPosition.distanceTo(region.center);
                if (distance <= region.radius) {
                    return `Near ${name}`;
                }
            }
        }

        // Check sun
        const sunRegion = this.planetRegions["Sun"];
        if (sunRegion) {
            const distanceToSun = playerPosition.distanceTo(sunRegion.center);
            if (sunRegion.radius && distanceToSun <= sunRegion.radius) {
                return "Near Sun";
            }
        }

        // Deep space
        return "Deep Space";
    }

    getPlanetRegions(): Record<string, RegionInfo> {
        return this.planetRegions;
    }
}
