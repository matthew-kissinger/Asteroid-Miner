// environment.js - Main environment class that integrates all environment components

import { Skybox } from './environment/skybox.js';
import { Sun } from './environment/sun.js';
import { Planets } from './environment/planets.js';
import { AsteroidBelt } from './environment/asteroidBelt.js';
import { Stargate } from './environment/stargate.js';
import { StarSystemGenerator } from './environment/starSystemGenerator.js';
import { SystemTransition } from './environment/systemTransition.js';
import { CustomSystemCreator } from './ui/customSystemCreator.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.planetRegions = {};
        this.currentSystemId = 'Solar System'; // Default starting system
        
        console.log("Initializing environment components...");
        
        // Initialize environment components
        this.skybox = new Skybox(scene);
        this.sun = new Sun(scene);
        
        // Initialize star system generator first
        this.starSystemGenerator = new StarSystemGenerator(scene);
        
        // Initialize planets with reference to starSystemGenerator
        this.planets = new Planets(scene, this.starSystemGenerator);
        
        this.asteroidBelt = new AsteroidBelt(scene);
        this.stargate = new Stargate(scene);
        
        // Initialize system transition effects
        this.systemTransition = new SystemTransition(scene, scene.camera);
        
        // Initialize the custom system creator
        this.customSystemCreator = new CustomSystemCreator(this.starSystemGenerator, this);
        console.log("Custom system creator initialized:", this.customSystemCreator);
        
        // Store references for easier access
        this.asteroids = this.asteroidBelt.getAsteroids();
        
        // Compile all planet regions for location tracking
        this.setupRegions();
        
        // Setup event handlers for star system transitions
        this.setupSystemTransitionHandlers();
        
        console.log("Environment components initialized");
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
        
        // Check planets
        for (const [name, region] of Object.entries(this.planetRegions)) {
            if (name === "Asteroid Belt") {
                // Special case for asteroid belt
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
        if (this.asteroidBelt && this.asteroidBelt.findClosestAsteroid) {
            return this.asteroidBelt.findClosestAsteroid(position, maxDistance);
        }
        return null;
    }
    
    update(deltaTime = 0.016, camera) {
        // Update all environment components with deltaTime and camera
        if (this.skybox && this.skybox.update) {
            this.skybox.update(deltaTime, camera);
        }
        
        if (this.sun && this.sun.update) {
            this.sun.update(deltaTime);
        }
        
        if (this.planets && this.planets.update) {
            this.planets.update(deltaTime);
        }
        
        if (this.asteroidBelt && this.asteroidBelt.update) {
            this.asteroidBelt.update(deltaTime);
        }
        
        if (this.stargate && this.stargate.update) {
            this.stargate.update(deltaTime);
        }
        
        // Update system transition effects if active
        if (this.systemTransition && this.systemTransition.update) {
            this.systemTransition.update(deltaTime);
        }
    }
} 