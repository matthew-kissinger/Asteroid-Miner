// environment.js - Main environment class that integrates all environment components

import { Skybox } from './environment/skybox.js';
import { Sun } from './environment/sun.js';
import { Planets } from './environment/planets.js';
import { AsteroidBelt } from './environment/asteroidBelt.js';
import { Stargate } from './environment/stargate.js';
import { StarSystemGenerator } from './environment/starSystemGenerator.js';
import { SystemTransition } from './environment/systemTransition.js';
import { CustomSystemCreator } from './ui/customSystemCreator.js';
import { VibeVersePortals } from './environment/vibeVersePortals.js';
import { SpaceAnomalies } from './environment/spaceAnomalies.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.planetRegions = {};
        this.currentSystemId = 'Solar System'; // Default starting system
        this.componentsLoaded = false;
        
        console.log("Initializing essential environment components...");
        
        // Initialize only essential components first
        this.skybox = new Skybox(scene);
        this.sun = new Sun(scene);
        
        // Initialize star system generator
        this.starSystemGenerator = new StarSystemGenerator(scene);
        
        // Initialize planets with reference to starSystemGenerator - needed for basic gameplay
        this.planets = new Planets(scene, this.starSystemGenerator);
        
        // Initialize stargate - needed for docking UI
        this.stargate = new Stargate(scene);
        
        // Store references for easier access
        this.asteroids = [];
        
        // Setup initial regions for location tracking (minimal setup)
        this.setupInitialRegions();
        
        console.log("Essential environment components initialized");
        
        // Schedule loading of remaining components after a short delay to not block startup
        setTimeout(() => {
            this.loadRemainingComponents();
        }, 500);
    }
    
    // Load remaining non-essential components asynchronously
    loadRemainingComponents() {
        console.log("Loading remaining environment components...");
        
        // Initialize asteroid belt - slightly defer to prioritize UI loading
        this.asteroidBelt = new AsteroidBelt(this.scene);
        this.asteroids = this.asteroidBelt.getAsteroids();
        
        // Initialize space anomalies
        this.spaceAnomalies = new SpaceAnomalies(this.scene);
        
        // Initialize system transition effects
        this.systemTransition = new SystemTransition(this.scene, this.scene.camera);
        
        // Initialize the custom system creator
        this.customSystemCreator = new CustomSystemCreator(this.starSystemGenerator, this);
        console.log("Custom system creator initialized:", this.customSystemCreator);
        
        // Setup complete regions now that all components are loaded
        this.setupRegions();
        
        // Setup event handlers for star system transitions
        this.setupSystemTransitionHandlers();
        
        this.componentsLoaded = true;
        console.log("All environment components initialized");
    }
    
    // Basic region setup for essential components only
    setupInitialRegions() {
        console.log("Setting up essential environment regions");
        
        // Get planet regions from planets component
        this.planetRegions = this.planets.getPlanetRegions();
        
        // Add sun region
        this.planetRegions["Sun"] = {
            center: this.sun.getPosition(),
            radius: this.sun.getRadius()
        };
        
        // Add stargate region
        const stargateRegion = this.stargate.getRegionInfo();
        this.planetRegions["Stargate"] = {
            center: stargateRegion.center,
            radius: stargateRegion.radius
        };
    }
    
    // Called after spaceship is created - we need this to initialize portals
    setSpaceship(spaceship) {
        this.spaceship = spaceship;
        
        // Initialize VibeVerse portals
        this.vibeVersePortals = new VibeVersePortals(this.scene, spaceship);
        console.log("VibeVerse portals initialized");
    }
    
    // Set up handlers for star system transitions
    setupSystemTransitionHandlers() {
        // Apply resource multipliers from current system to asteroid belt
        if (this.starSystemGenerator && this.asteroidBelt) {
            const resources = this.starSystemGenerator.getCurrentSystemResources();
            this.asteroidBelt.setResourceMultipliers(resources);
        }
    }
    
    // Travel to a new star system
    travelToSystem(systemId) {
        if (!this.starSystemGenerator || !this.systemTransition) return false;
        
        // Check if the system exists and is connected to the current one
        if (!this.starSystemGenerator.travelToSystem(systemId)) {
            console.error(`Cannot travel to system ${systemId}`);
            return false;
        }
        
        console.log(`Starting transition to system: ${systemId}`);
        
        // Start the transition effect
        this.systemTransition.startTransition(() => {
            // This callback is called when transition is complete
            console.log(`Transition complete, updating environment for: ${systemId}`);
            
            // Update the environment based on the new system
            this.updateEnvironmentForSystem(systemId);
            
            // Display welcome notification
            this.showSystemWelcomeNotification(systemId);
            
            // If player is docked, make sure the stargate interface is correctly displayed
            if (window.game && window.game.spaceship && window.game.spaceship.isDocked) {
                console.log("Player is docked after arriving in new system, showing interface");
                
                // Handle docking system to enforce proper dock state
                if (window.game.controls && window.game.controls.dockingSystem) {
                    setTimeout(() => {
                        // Trigger the docking system's docking method directly
                        window.game.controls.dockingSystem.dockWithStargate();
                    }, 500); // Small delay to ensure everything is ready
                }
            }
        });
        
        return true;
    }
    
    // Update environment visuals and properties for the new system
    updateEnvironmentForSystem(systemId) {
        const systemData = this.starSystemGenerator.getAllSystems()[systemId];
        if (!systemData) {
            console.error(`No system data found for ${systemId}`);
            return;
        }
        
        console.log(`Updating environment for system: ${systemId}`, systemData);
        
        // Update current system ID
        this.currentSystemId = systemId;
        
        // Update skybox based on system properties
        if (this.skybox && this.skybox.updateForSystem) {
            // Special case for Solar System - always enforce white skybox
            if (systemId === 'Solar System') {
                const solarSystemParams = {
                    starDensity: 1.0,
                    nebulaDensity: 0.5,
                    color: 0xFFFFFF,  // Ensure white color for Solar System
                    isSolarSystem: true,  // Flag this as Solar System
                    resetTime: true  // Reset the time for consistent appearance
                };
                console.log(`Updating skybox for Solar System with enforced white color`);
                this.skybox.updateForSystem(solarSystemParams);
            } else {
                console.log(`Updating skybox for ${systemId} with params:`, systemData.skyboxParams);
                this.skybox.updateForSystem(systemData.skyboxParams);
            }
        } else {
            console.warn("Skybox or updateForSystem method not available");
        }
        
        // Update star (sun) color and properties
        if (this.sun) {
            // First check if it's a custom system with an intensity multiplier
            const lightIntensityMultiplier = systemData.lightIntensityMultiplier || 1.0;
            
            // Check which update method to use
            if (this.sun.updateSunType && systemData.starClass) {
                console.log(`Updating sun type for ${systemId} to ${systemData.starClass} with intensity multiplier: ${lightIntensityMultiplier}`);
                this.sun.updateSunType(systemData.starClass, lightIntensityMultiplier);
            } else if (this.sun.updateColor) {
                console.log(`Updating sun color for ${systemId} to:`, systemData.starColor.toString(16));
                this.sun.updateColor(systemData.starColor);
                
                // Store the multiplier for use in the update method
                if (this.sun.sunLight) {
                    this.sun.sunLight._intensityMultiplier = lightIntensityMultiplier;
                }
            } else {
                console.warn("Sun update methods not available");
            }
        } else {
            console.warn("Sun not available");
        }
        
        // Update planets for this system
        if (this.planets && this.planets.updateForSystem) {
            console.log(`Updating planets for ${systemId}`);
            this.planets.updateForSystem(systemId);
            
            // Update planet regions after planets have been updated
            this.planetRegions = this.planets.getPlanetRegions();
        } else {
            console.warn("Planets or updateForSystem method not available");
        }
        
        // Update asteroid belt based on system properties
        if (this.asteroidBelt && this.asteroidBelt.setResourceMultipliers) {
            // Apply resource multipliers from system
            console.log(`Updating asteroid resources for ${systemId}:`, systemData.resourceMultipliers);
            this.asteroidBelt.setResourceMultipliers(systemData.resourceMultipliers);
            
            // Update asteroid density if the method exists
            if (this.asteroidBelt.updateDensity) {
                console.log(`Updating asteroid density for ${systemId}:`, systemData.asteroidDensity);
                this.asteroidBelt.updateDensity(systemData.asteroidDensity);
            }
        } else {
            console.warn("AsteroidBelt or update methods not available");
        }
        
        // Update space anomalies for this system
        if (this.spaceAnomalies && this.spaceAnomalies.updateForSystem) {
            console.log(`Updating space anomalies for ${systemId}`);
            this.spaceAnomalies.updateForSystem(systemData);
        } else {
            console.warn("SpaceAnomalies or updateForSystem method not available");
        }
        
        console.log(`Environment updated for ${systemId}`);
    }
    
    // Show welcome notification when arriving at a new system
    showSystemWelcomeNotification(systemId) {
        const system = this.starSystemGenerator.getAllSystems()[systemId];
        if (!system) return;
        
        // Create welcome notification
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '25%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#fff';
        notification.style.padding = '20px 40px';
        notification.style.borderRadius = '10px';
        notification.style.border = `2px solid #${system.starColor.toString(16).padStart(6, '0')}`;
        notification.style.boxShadow = `0 0 30px #${system.starColor.toString(16).padStart(6, '0')}`;
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = '18px';
        notification.style.zIndex = '9999';
        notification.style.textAlign = 'center';
        
        // Special welcome for Earth/Solar System
        if (systemId === 'Solar System') {
            notification.innerHTML = `
                <h2 style="color: #30cfd0; margin-top: 0;">Welcome to the Solar System</h2>
                <p>Your home system, with Earth as your starting location.</p>
                <p style="font-size: 14px; margin-bottom: 0; color: #aaa;">Safe travels, commander.</p>
            `;
        } else {
            notification.innerHTML = `
                <h2 style="color: #${system.starColor.toString(16).padStart(6, '0')}; margin-top: 0;">Welcome to ${system.name}</h2>
                <p>${system.description}</p>
                <p style="font-size: 14px; margin-bottom: 0; color: #aaa;">Classification: ${system.classification} - Star Class: ${system.starClass}</p>
            `;
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 1s';
            
            setTimeout(() => {
                notification.remove();
            }, 1000);
        }, 5000);
    }
    
    setupRegions() {
        console.log("Setting up environment regions");
        
        // Get planet regions from planets component
        this.planetRegions = this.planets.getPlanetRegions();
        
        // Add sun region
        this.planetRegions["Sun"] = {
            center: this.sun.getPosition(),
            radius: this.sun.getRadius()
        };
        
        // Add asteroid belt region
        const asteroidBeltRegion = this.asteroidBelt.getRegionInfo();
        this.planetRegions["Asteroid Belt"] = {
            center: asteroidBeltRegion.center,
            minRadius: asteroidBeltRegion.innerRadius,
            maxRadius: asteroidBeltRegion.outerRadius
        };
        
        // Add stargate region
        const stargateRegion = this.stargate.getRegionInfo();
        this.planetRegions["Stargate"] = {
            center: stargateRegion.center,
            radius: stargateRegion.radius
        };
        
        // Add space anomalies region
        const anomaliesRegion = this.spaceAnomalies.getRegionInfo();
        this.planetRegions["Space Anomalies"] = {
            center: anomaliesRegion.center,
            minRadius: anomaliesRegion.innerRadius,
            maxRadius: anomaliesRegion.outerRadius
        };
    }
    
    // Get the player's current location based on position
    getPlayerLocation(playerPosition) {
        if (!playerPosition) {
            return "Unknown Location";
        }
        
        // Check if near stargate
        const stargateRegion = this.planetRegions["Stargate"];
        if (stargateRegion) {
            const distanceToStargate = playerPosition.distanceTo(stargateRegion.center);
            if (distanceToStargate <= stargateRegion.radius) {
                return "Stargate";
            }
        }
        
        // Check if near an anomaly - only if spaceAnomalies is loaded
        if (this.componentsLoaded && this.spaceAnomalies) {
            const closestAnomaly = this.spaceAnomalies.findClosestAnomaly(playerPosition, 2000);
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
            if (name === "Asteroid Belt" && this.componentsLoaded && this.asteroidBelt) {
                // Special case for asteroid belt - only if loaded
                const distance = playerPosition.distanceTo(region.center);
                if (region.minRadius && region.maxRadius && 
                    distance >= region.minRadius && 
                    distance <= region.maxRadius) {
                    // Count nearby asteroids (useful for mining)
                    const nearbyAsteroids = this.asteroids.filter(asteroid => {
                        return playerPosition.distanceTo(asteroid.mesh.position) < 500;
                    });
                    
                    if (nearbyAsteroids.length > 0) {
                        return `Asteroid Field (${nearbyAsteroids.length} nearby)`;
                    }
                    return "Asteroid Belt";
                }
            } else if (name === "Space Anomalies" && this.componentsLoaded) {
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
            if (distanceToSun <= sunRegion.radius) {
            return "Near Sun";
            }
        }
        
        // Deep space
        return "Deep Space";
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
        // Dispose all environment components
        if (this.skybox) {
            this.skybox.dispose();
        }
        
        if (this.sun) {
            this.sun.dispose();
        }
        
        if (this.planets) {
            this.planets.dispose();
        }
        
        if (this.asteroidBelt) {
            this.asteroidBelt.dispose();
        }
        
        if (this.stargate) {
            this.stargate.dispose();
        }
        
        if (this.spaceAnomalies) {
            this.spaceAnomalies.clearAllAnomalies();
        }
        
        if (this.vibeVersePortals) {
            this.vibeVersePortals.dispose();
        }
    }
} 