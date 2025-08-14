// systemTransitionManager.js - Handles system transitions and travel logic

export class SystemTransitionManager {
    constructor() {
        this.currentSystemId = 'Solar System'; // Default starting system
    }

    // Set up handlers for star system transitions
    setupSystemTransitionHandlers(starSystemGenerator, asteroidBelt) {
        // Apply resource multipliers from current system to asteroid belt
        if (starSystemGenerator && asteroidBelt) {
            const resources = starSystemGenerator.getCurrentSystemResources();
            asteroidBelt.setResourceMultipliers(resources);
        }
    }

    // Travel to a new star system
    travelToSystem(systemId, starSystemGenerator, systemTransition, updateEnvironmentCallback) {
        if (!starSystemGenerator || !systemTransition) return false;
        
        // Check if the system exists and is connected to the current one
        if (!starSystemGenerator.travelToSystem(systemId)) {
            console.error(`Cannot travel to system ${systemId}`);
            return false;
        }
        
        console.log(`Starting transition to system: ${systemId}`);
        
        // Start the transition effect
        systemTransition.startTransition(() => {
            // This callback is called when transition is complete
            console.log(`Transition complete, updating environment for: ${systemId}`);
            
            // Update the environment based on the new system
            updateEnvironmentCallback(systemId);
            
            // Display welcome notification
            this.showSystemWelcomeNotification(systemId, starSystemGenerator);
            
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
    updateEnvironmentForSystem(systemId, starSystemGenerator, skybox, sun, planets, asteroidBelt, spaceAnomalies, regionManager) {
        const systemData = starSystemGenerator.getAllSystems()[systemId];
        if (!systemData) {
            console.error(`No system data found for ${systemId}`);
            return;
        }
        
        console.log(`Updating environment for system: ${systemId}`, systemData);
        
        // Update current system ID
        this.currentSystemId = systemId;
        
        // Update skybox based on system properties
        if (skybox && skybox.updateForSystem) {
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
                skybox.updateForSystem(solarSystemParams);
            } else {
                console.log(`Updating skybox for ${systemId} with params:`, systemData.skyboxParams);
                skybox.updateForSystem(systemData.skyboxParams);
            }
        } else {
            console.warn("Skybox or updateForSystem method not available");
        }
        
        // Update star (sun) color and properties
        if (sun) {
            // First check if it's a custom system with an intensity multiplier
            const lightIntensityMultiplier = systemData.lightIntensityMultiplier || 1.0;
            
            // Check which update method to use
            if (sun.updateSunType && systemData.starClass) {
                console.log(`Updating sun type for ${systemId} to ${systemData.starClass} with intensity multiplier: ${lightIntensityMultiplier}`);
                sun.updateSunType(systemData.starClass, lightIntensityMultiplier);
            } else if (sun.updateColor) {
                console.log(`Updating sun color for ${systemId} to:`, systemData.starColor.toString(16));
                sun.updateColor(systemData.starColor);
                
                // Store the multiplier for use in the update method
                if (sun.sunLight) {
                    sun.sunLight._intensityMultiplier = lightIntensityMultiplier;
                }
            } else {
                console.warn("Sun update methods not available");
            }
        } else {
            console.warn("Sun not available");
        }
        
        // Update planets for this system
        if (planets && planets.updateForSystem) {
            console.log(`Updating planets for ${systemId}`);
            planets.updateForSystem(systemId);
            
            // Safely update planet regions if the method exists
            if (typeof planets.getPlanetRegions === 'function') {
                try {
                    regionManager.planetRegions = planets.getPlanetRegions();
                } catch (error) {
                    console.warn(`Error getting planet regions for system ${systemId}:`, error);
                }
            } else {
                console.warn(`planets.getPlanetRegions is not available for system ${systemId}`);
            }
        } else {
            console.warn("Planets or updateForSystem method not available");
        }
        
        // Update asteroid belt based on system properties
        if (asteroidBelt) {
            // Dispose of old asteroids before creating new ones
            if (asteroidBelt.dispose) {
                console.log(`Disposing old asteroids before updating for ${systemId}`);
                asteroidBelt.dispose();
            }
            
            // Recreate asteroid belt for new system
            if (asteroidBelt.createAsteroidBelt) {
                console.log(`Creating new asteroids for ${systemId}`);
                asteroidBelt.createAsteroidBelt();
            }
            
            // Apply resource multipliers from system
            if (asteroidBelt.setResourceMultipliers) {
                console.log(`Updating asteroid resources for ${systemId}:`, systemData.resourceMultipliers);
                asteroidBelt.setResourceMultipliers(systemData.resourceMultipliers);
            }
            
            // Update asteroid density if the method exists
            if (asteroidBelt.updateDensity) {
                console.log(`Updating asteroid density for ${systemId}:`, systemData.asteroidDensity);
                asteroidBelt.updateDensity(systemData.asteroidDensity);
            }
        } else {
            console.warn("AsteroidBelt not available");
        }
        
        // Update space anomalies for this system
        if (spaceAnomalies && spaceAnomalies.updateForSystem) {
            console.log(`Updating space anomalies for ${systemId}`);
            spaceAnomalies.updateForSystem(systemData);
        } else {
            console.warn("SpaceAnomalies or updateForSystem method not available");
        }
        
        console.log(`Environment updated for ${systemId}`);
    }

    // Show welcome notification when arriving at a new system
    showSystemWelcomeNotification(systemId, starSystemGenerator) {
        const system = starSystemGenerator.getAllSystems()[systemId];
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

    getCurrentSystemId() {
        return this.currentSystemId;
    }
}