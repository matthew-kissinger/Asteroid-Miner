// mobileHUD.js - Simplified HUD for mobile devices

export class MobileHUD {
    constructor(spaceship) {
        this.spaceship = spaceship;
        this.controls = null; // Will be set from UI class
        this.setupMobileHUD();
    }
    
    setupMobileHUD() {
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-horde-mobile {
                0% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.5); }
                50% { box-shadow: 0 0 10px rgba(255, 30, 30, 0.8); }
                100% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.5); }
            }
        `;
        document.head.appendChild(style);
        
        // Create main container for mobile HUD
        const hudContainer = document.createElement('div');
        hudContainer.id = 'mobile-hud-container';
        hudContainer.style.position = 'absolute';
        hudContainer.style.top = '10px';
        hudContainer.style.right = '10px';
        hudContainer.style.width = 'min(140px, 25vw)'; // Responsive width with minimum
        hudContainer.style.backgroundColor = 'rgba(6, 22, 31, 0.8)';
        hudContainer.style.backdropFilter = 'blur(5px)';
        hudContainer.style.webkitBackdropFilter = 'blur(5px)'; // For Safari
        hudContainer.style.borderRadius = '8px';
        hudContainer.style.border = '1px solid rgba(120, 220, 232, 0.3)';
        hudContainer.style.padding = '10px';
        hudContainer.style.color = 'rgba(120, 220, 232, 0.9)';
        hudContainer.style.fontFamily = '"Rajdhani", "Electrolize", sans-serif';
        hudContainer.style.fontSize = '14px';
        hudContainer.style.boxShadow = '0 0 10px rgba(120, 220, 232, 0.2)';
        hudContainer.style.zIndex = '1000';
        // Add hardware acceleration to improve performance
        hudContainer.style.transform = 'translateZ(0)';
        hudContainer.style.backfaceVisibility = 'hidden';
        document.body.appendChild(hudContainer);

        // Create status bars with labels
        this.createStatusBar(hudContainer, 'S', 'shield-bar-mobile', 'rgba(51, 153, 255, 0.8)');
        this.createStatusBar(hudContainer, 'H', 'hull-bar-mobile', 'rgba(120, 220, 232, 0.8)');
        this.createStatusBar(hudContainer, 'F', 'fuel-bar-mobile', 'rgba(120, 220, 232, 0.8)');
        
        // Add thrust and velocity displays
        this.createThrustVelocityDisplay(hudContainer);
        
        // Create cargo display
        const cargoContainer = document.createElement('div');
        cargoContainer.style.display = 'flex';
        cargoContainer.style.justifyContent = 'space-between';
        cargoContainer.style.alignItems = 'center';
        cargoContainer.style.marginTop = '10px';
        
        const cargoLabel = document.createElement('div');
        cargoLabel.textContent = 'C';
        cargoLabel.style.marginRight = '10px';
        cargoLabel.style.fontSize = '14px';
        
        const cargoValue = document.createElement('div');
        cargoValue.id = 'cargo-value-mobile';
        cargoValue.textContent = '0 / 1000';
        cargoValue.style.textAlign = 'right';
        cargoValue.style.flexGrow = '1';
        cargoValue.style.fontSize = '14px';
        
        cargoContainer.appendChild(cargoLabel);
        cargoContainer.appendChild(cargoValue);
        hudContainer.appendChild(cargoContainer);
        
        // Add horde mode indicator (hidden by default)
        const hordeContainer = document.createElement('div');
        hordeContainer.id = 'mobile-horde-indicator';
        hordeContainer.style.display = 'none';
        hordeContainer.style.marginTop = '10px';
        hordeContainer.style.padding = '5px';
        hordeContainer.style.backgroundColor = 'rgba(255, 30, 30, 0.2)';
        hordeContainer.style.borderRadius = '4px';
        hordeContainer.style.border = '1px solid #ff3030';
        hordeContainer.style.animation = 'pulse-horde-mobile 2s infinite';
        hordeContainer.style.fontSize = '12px';
        
        const hordeTimer = document.createElement('div');
        hordeTimer.id = 'mobile-horde-timer';
        hordeTimer.textContent = '00:00';
        hordeTimer.style.textAlign = 'center';
        hordeTimer.style.fontWeight = 'bold';
        hordeTimer.style.color = '#ff3030';
        
        hordeContainer.appendChild(hordeTimer);
        hudContainer.appendChild(hordeContainer);
        
        // Add decorative corner elements
        this.addCornerElements(hudContainer);

        // Add location info
        this.setupLocationInfo(hudContainer);
    }
    
    createStatusBar(parent, label, id, color) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.marginBottom = '8px';
        
        const labelElement = document.createElement('div');
        labelElement.textContent = label;
        labelElement.style.marginRight = '8px';
        labelElement.style.width = '16px';
        labelElement.style.textAlign = 'center';
        labelElement.style.fontSize = '14px';
        
        const barContainer = document.createElement('div');
        barContainer.style.flexGrow = '1';
        barContainer.style.height = '8px';
        barContainer.style.backgroundColor = 'rgba(10, 30, 40, 0.5)';
        barContainer.style.borderRadius = '4px';
        barContainer.style.overflow = 'hidden';
        barContainer.style.position = 'relative';
        
        // Add fuel value text if this is the fuel bar
        if (id === 'fuel-bar-mobile') {
            const fuelValue = document.createElement('div');
            fuelValue.id = 'fuel-value-mobile';
            fuelValue.style.position = 'absolute';
            fuelValue.style.right = '0';
            fuelValue.style.top = '-14px';
            fuelValue.style.fontSize = '10px';
            fuelValue.style.color = 'rgba(120, 220, 232, 0.9)';
            fuelValue.textContent = '100 / 100';
            barContainer.appendChild(fuelValue);
        }
        
        const bar = document.createElement('div');
        bar.id = id;
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = color;
        bar.style.transition = 'width 0.2s ease';
        
        barContainer.appendChild(bar);
        container.appendChild(labelElement);
        container.appendChild(barContainer);
        parent.appendChild(container);
    }
    
    addCornerElements(panel) {
        // Top left corner
        const topLeft = document.createElement('div');
        topLeft.style.position = 'absolute';
        topLeft.style.top = '0';
        topLeft.style.left = '0';
        topLeft.style.width = '6px';
        topLeft.style.height = '6px';
        topLeft.style.borderTop = '1px solid rgba(120, 220, 232, 0.8)';
        topLeft.style.borderLeft = '1px solid rgba(120, 220, 232, 0.8)';
        panel.appendChild(topLeft);
        
        // Top right corner
        const topRight = document.createElement('div');
        topRight.style.position = 'absolute';
        topRight.style.top = '0';
        topRight.style.right = '0';
        topRight.style.width = '6px';
        topRight.style.height = '6px';
        topRight.style.borderTop = '1px solid rgba(120, 220, 232, 0.8)';
        topRight.style.borderRight = '1px solid rgba(120, 220, 232, 0.8)';
        panel.appendChild(topRight);
        
        // Bottom left corner
        const bottomLeft = document.createElement('div');
        bottomLeft.style.position = 'absolute';
        bottomLeft.style.bottom = '0';
        bottomLeft.style.left = '0';
        bottomLeft.style.width = '6px';
        bottomLeft.style.height = '6px';
        bottomLeft.style.borderBottom = '1px solid rgba(120, 220, 232, 0.8)';
        bottomLeft.style.borderLeft = '1px solid rgba(120, 220, 232, 0.8)';
        panel.appendChild(bottomLeft);
        
        // Bottom right corner
        const bottomRight = document.createElement('div');
        bottomRight.style.position = 'absolute';
        bottomRight.style.bottom = '0';
        bottomRight.style.right = '0';
        bottomRight.style.width = '6px';
        bottomRight.style.height = '6px';
        bottomRight.style.borderBottom = '1px solid rgba(120, 220, 232, 0.8)';
        bottomRight.style.borderRight = '1px solid rgba(120, 220, 232, 0.8)';
        panel.appendChild(bottomRight);
    }
    
    setupLocationInfo(parent) {
        // Create simplified location info for mobile
        const locationInfo = document.createElement('div');
        locationInfo.id = 'mobile-location-info';
        locationInfo.style.position = 'absolute';
        locationInfo.style.top = '10px';
        locationInfo.style.left = '10px';
        locationInfo.style.padding = '5px 10px';
        locationInfo.style.backgroundColor = 'rgba(0, 20, 40, 0.7)';
        locationInfo.style.borderRadius = '5px';
        locationInfo.style.color = '#7ecce9';
        locationInfo.style.fontSize = '12px';
        locationInfo.style.fontFamily = '"Rajdhani", sans-serif';
        locationInfo.style.backdropFilter = 'blur(5px)';
        locationInfo.style.zIndex = '1000';
        
        // Add system name and coordinates
        locationInfo.innerHTML = `
            <div id="mobile-current-system" style="font-weight:600;">SOLAR SYSTEM</div>
            <div id="mobile-coordinates" style="font-size:10px; opacity:0.8;">X: 0 Y: 0 Z: 0</div>
            <div style="display: flex; align-items: center; gap: 5px; font-size:10px; opacity:0.8; margin-top: 2px;">
                <span>ANOMALIES: <span id="anomaly-count" style="font-weight:600;">0</span></span>
            </div>
        `;
        
        parent.appendChild(locationInfo);
    }
    
    update() {
        // Update shield display
        this.updateShieldDisplay();
        
        // Update hull display
        this.updateHullDisplay();
        
        // Update fuel display
        this.updateFuelDisplay();
        
        // Update thrust and velocity displays
        this.updateThrustDisplay();
        this.updateVelocityDisplay();
        
        // Update cargo display
        this.updateCargoDisplay();
        
        // Update horde mode display
        this.updateHordeModeDisplay();
    }
    
    updateShieldDisplay() {
        const shieldBar = document.getElementById('shield-bar-mobile');
        if (!shieldBar) return;
        
        let shieldPercentage = 100;
        
        // Get shield data from spaceship
        if (this.spaceship && typeof this.spaceship.shield !== 'undefined') {
            shieldPercentage = (this.spaceship.shield / this.spaceship.maxShield) * 100;
        }
        
        // Update the shield bar
        shieldBar.style.width = `${shieldPercentage}%`;
        
        // Change color based on shield status
        if (shieldPercentage < 25) {
            shieldBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)'; // Red for low shields
        } else if (shieldPercentage < 50) {
            shieldBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)'; // Yellow for medium shields
        } else {
            shieldBar.style.backgroundColor = 'rgba(51, 153, 255, 0.8)'; // Blue for healthy shields
        }
    }
    
    updateHullDisplay() {
        const hullBar = document.getElementById('hull-bar-mobile');
        if (!hullBar) return;
        
        let hullPercentage = 100;
        
        // Get hull data from spaceship
        if (this.spaceship && typeof this.spaceship.hull !== 'undefined') {
            hullPercentage = (this.spaceship.hull / this.spaceship.maxHull) * 100;
        }
        
        // Update the hull bar
        hullBar.style.width = `${hullPercentage}%`;
        
        // Change color based on hull status
        if (hullPercentage < 30) {
            hullBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)';
        } else if (hullPercentage < 60) {
            hullBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)';
        } else {
            hullBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        }
    }
    
    updateFuelDisplay() {
        const fuelBar = document.getElementById('fuel-bar-mobile');
        const fuelValue = document.getElementById('fuel-value-mobile');
        if (!fuelBar || !this.spaceship) return;
        
        // Correctly calculate fuel percentage based on maxFuel
        const fuelPercent = this.spaceship.maxFuel > 0 ? 
            (this.spaceship.fuel / this.spaceship.maxFuel) * 100 : 0;
        
        fuelBar.style.width = `${fuelPercent}%`;
        
        // Change color when low based on percentage, not absolute value
        if (fuelPercent < 20) {
            fuelBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)';
        } else if (fuelPercent < 40) {
            fuelBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)';
        } else {
            fuelBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        }
        
        // Update the fuel value text display
        if (fuelValue) {
            fuelValue.textContent = `${Math.round(this.spaceship.fuel)} / ${Math.round(this.spaceship.maxFuel)}`;
        }
    }
    
    updateCargoDisplay() {
        const cargoValue = document.getElementById('cargo-value-mobile');
        if (!cargoValue) return;
        
        // Try to get resources from different possible sources
        let resources = null;
        let maxCargo = 1000; // Default max
        
        // First try to get from controls
        if (this.controls && this.controls.resources) {
            resources = this.controls.resources;
            // Get max capacity from spaceship if available
            if (this.spaceship && typeof this.spaceship.maxCargoCapacity !== 'undefined') {
                maxCargo = this.spaceship.maxCargoCapacity;
            }
        } 
        // Fall back to cargo component if available
        else if (this.spaceship && this.spaceship.cargoComponent && this.spaceship.cargoComponent.resources) {
            resources = this.spaceship.cargoComponent.resources;
            maxCargo = this.spaceship.cargoComponent.maxCapacity;
        }
        // Last resort - use previously defined resources structure
        else if (this.spaceship && this.spaceship.resources) {
            resources = this.spaceship.resources;
        }
        
        // If no resources found, exit
        if (!resources) return;
        
        // Calculate total cargo
        const totalCargo = Object.values(resources).reduce((sum, amount) => sum + amount, 0);
        
        cargoValue.textContent = `${totalCargo} / ${maxCargo}`;
        
        // Change color when cargo is almost full
        if (totalCargo >= maxCargo * 0.9) {
            cargoValue.style.color = 'rgba(255, 80, 80, 0.9)';
        } else if (totalCargo >= maxCargo * 0.7) {
            cargoValue.style.color = 'rgba(255, 204, 0, 0.9)';
        } else {
            cargoValue.style.color = 'rgba(120, 220, 232, 0.9)';
        }
    }
    
    /**
     * Update the horde mode indicator and timer in the mobile HUD
     */
    updateHordeModeDisplay() {
        const hordeIndicator = document.getElementById('mobile-horde-indicator');
        const hordeTimer = document.getElementById('mobile-horde-timer');
        
        if (!hordeIndicator || !hordeTimer) return;
        
        // Check if horde mode is active
        if (window.game && window.game.isHordeActive) {
            // Show the indicator if not already visible
            if (hordeIndicator.style.display === 'none') {
                hordeIndicator.style.display = 'block';
                hordeIndicator.innerHTML = '<div style="text-align:center; color:#ff3030; font-weight:bold; margin-bottom:2px;">HORDE MODE</div>';
                hordeIndicator.appendChild(hordeTimer);
            }
            
            // Update the timer
            if (window.game.getFormattedHordeSurvivalTime) {
                hordeTimer.textContent = window.game.getFormattedHordeSurvivalTime();
            } else {
                // Fallback calculation
                const totalSeconds = Math.floor(window.game.hordeSurvivalTime / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                hordeTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Increase pulsing intensity after 3 minutes
            if (window.game.hordeSurvivalTime > 3 * 60 * 1000) {
                const styleEl = document.createElement('style');
                styleEl.textContent = `
                    @keyframes pulse-horde-mobile {
                        0% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.7); }
                        50% { box-shadow: 0 0 10px rgba(255, 30, 30, 1); }
                        100% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.7); }
                    }
                `;
                document.head.appendChild(styleEl);
                
                // Make animation faster
                hordeIndicator.style.animation = 'pulse-horde-mobile 0.8s infinite';
                hordeIndicator.style.backgroundColor = 'rgba(255, 30, 30, 0.3)';
            }
        } else {
            // Hide the indicator
            hordeIndicator.style.display = 'none';
        }
    }
    
    hide() {
        const container = document.getElementById('mobile-hud-container');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    show() {
        // Check if intro sequence is active
        if (window.game && window.game.introSequenceActive) {
            console.log("MobileHUD: Not showing HUD during intro sequence");
            return; // Don't show during intro
        }
        
        const container = document.getElementById('mobile-hud-container');
        if (container) {
            container.style.display = 'block';
        }
    }
    
    // Add method to set controls reference
    setControls(controls) {
        console.log("MobileHUD: Setting controls reference");
        this.controls = controls;
    }
    
    // Add thrust and velocity display for mobile HUD
    createThrustVelocityDisplay(parent) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.marginTop = '10px';
        container.style.marginBottom = '10px';
        container.style.fontSize = '12px';
        
        // Thrust display
        const thrustContainer = document.createElement('div');
        thrustContainer.style.display = 'flex';
        thrustContainer.style.flexDirection = 'column';
        thrustContainer.style.alignItems = 'center';
        
        const thrustLabel = document.createElement('div');
        thrustLabel.textContent = 'THR';
        thrustLabel.style.fontSize = '10px';
        thrustLabel.style.opacity = '0.8';
        
        const thrustValue = document.createElement('div');
        thrustValue.id = 'thrust-value-mobile';
        thrustValue.textContent = '0.0';
        thrustValue.style.fontWeight = 'bold';
        
        thrustContainer.appendChild(thrustLabel);
        thrustContainer.appendChild(thrustValue);
        
        // Velocity display
        const velocityContainer = document.createElement('div');
        velocityContainer.style.display = 'flex';
        velocityContainer.style.flexDirection = 'column';
        velocityContainer.style.alignItems = 'center';
        
        const velocityLabel = document.createElement('div');
        velocityLabel.textContent = 'VEL';
        velocityLabel.style.fontSize = '10px';
        velocityLabel.style.opacity = '0.8';
        
        const velocityValue = document.createElement('div');
        velocityValue.id = 'velocity-value-mobile';
        velocityValue.textContent = '0.00';
        velocityValue.style.fontWeight = 'bold';
        
        velocityContainer.appendChild(velocityLabel);
        velocityContainer.appendChild(velocityValue);
        
        // Add containers to parent
        container.appendChild(thrustContainer);
        container.appendChild(velocityContainer);
        parent.appendChild(container);
    }
    
    // New methods to update thrust and velocity displays
    updateThrustDisplay() {
        const thrustDisplay = document.getElementById('thrust-value-mobile');
        if (!thrustDisplay) return;
        
        let thrustValue = 0;
        let thrusterComponent = null;
        
        // Try to get thrust state from player entity first
        if (window.game && window.game.world) {
            const players = window.game.world.getEntitiesByTag('player');
            if (players && players.length > 0) {
                thrusterComponent = players[0].getComponent('ThrusterComponent');
                
                if (thrusterComponent) {
                    // Get thrust values from the ThrusterComponent
                    if (thrusterComponent.thrusting.forward) thrustValue += 1;
                    if (thrusterComponent.thrusting.backward) thrustValue += 0.5;
                    if (thrusterComponent.thrusting.left || thrusterComponent.thrusting.right) thrustValue += 0.5;
                }
            }
        }
        
        // Fallback to spaceship object if ThrusterComponent not found
        if (!thrusterComponent && this.spaceship && this.spaceship.thrust) {
            if (this.spaceship.thrust.forward) thrustValue += 1;
            if (this.spaceship.thrust.backward) thrustValue += 0.5;
            if (this.spaceship.thrust.left || this.spaceship.thrust.right) thrustValue += 0.5;
        }
        
        thrustDisplay.textContent = thrustValue.toFixed(1);
        
        // Change color if thrusting
        if (thrustValue > 0) {
            thrustDisplay.style.color = 'rgba(120, 220, 232, 1)';
        } else {
            thrustDisplay.style.color = 'rgba(120, 220, 232, 0.7)';
        }
    }
    
    updateVelocityDisplay() {
        const velocityDisplay = document.getElementById('velocity-value-mobile');
        if (!velocityDisplay) return;
        
        // Get velocity from RigidbodyComponent, fallback to spaceship or physics
        let velocity = 0;
        let maxVelocity = 25.0; // Default fallback value
        
        // Try to get velocity from player entity's RigidbodyComponent first
        if (window.game && window.game.world) {
            const players = window.game.world.getEntitiesByTag('player');
            if (players && players.length > 0) {
                const rigidbody = players[0].getComponent('RigidbodyComponent');
                const thruster = players[0].getComponent('ThrusterComponent');
                
                if (rigidbody && rigidbody.velocity) {
                    velocity = rigidbody.velocity.length();
                }
                
                if (thruster) {
                    maxVelocity = thruster.maxVelocity;
                    if (thruster.thrusting.boost) {
                        maxVelocity *= thruster.boostMultiplier;
                    }
                }
            }
        }
        
        // Fallback to spaceship object if not found in component
        if (velocity === 0 && this.spaceship && this.spaceship.velocity) {
            velocity = this.spaceship.velocity.length();
            
            if (this.spaceship.maxVelocity) {
                maxVelocity = this.spaceship.maxVelocity;
            }
        } 
        // Last resort fallback to game physics
        else if (velocity === 0 && window.game && window.game.physics && window.game.physics.velocity) {
            velocity = window.game.physics.velocity.length();
        }
        
        velocityDisplay.textContent = velocity.toFixed(2);
        
        // Change color based on velocity
        if (velocity > maxVelocity * 0.8) {
            velocityDisplay.style.color = 'rgba(255, 204, 0, 0.9)';
        } else if (velocity > 0.5) {
            velocityDisplay.style.color = 'rgba(120, 220, 232, 1)';
        } else {
            velocityDisplay.style.color = 'rgba(120, 220, 232, 0.7)';
        }
    }

    // Update updateLocation method to only update system name
    updateLocation(locationName, systemName = 'Unknown System') {
        const currentSystem = document.getElementById('mobile-current-system');
        
        if (currentSystem) {
            currentSystem.textContent = systemName.toUpperCase();
        }
    }
} 