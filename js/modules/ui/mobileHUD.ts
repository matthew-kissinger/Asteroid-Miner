// mobileHUD.ts - Simplified HUD for mobile devices
// Static styles are defined in src/styles/mobile-hud.css
// This module applies CSS classes instead of inline styles.

export class MobileHUD {
    spaceship: MobileHUDSpaceship | null;
    controls: MobileHUDControls | null;

    constructor(spaceship: MobileHUDSpaceship) {
        this.spaceship = spaceship;
        this.controls = null; // Will be set from UI class
        this.setupMobileHUD();
    }
    
    setupMobileHUD(): void {
        // Create main container for mobile HUD
        const hudContainer = document.createElement('div');
        hudContainer.id = 'mobile-hud-container';
        hudContainer.classList.add('mobile-hud-container');
        document.body.appendChild(hudContainer);

        // Create status bars with labels
        this.createStatusBar(hudContainer, 'S', 'shield-bar-mobile', 'shield');
        this.createStatusBar(hudContainer, 'H', 'hull-bar-mobile', 'hull');
        this.createStatusBar(hudContainer, 'F', 'fuel-bar-mobile', 'fuel');
        
        // Add anomaly count display
        this.createAnomalyDisplay(hudContainer);
        
        // Create cargo display
        const cargoContainer = document.createElement('div');
        cargoContainer.classList.add('mobile-hud-cargo-row');
        
        const cargoLabel = document.createElement('div');
        cargoLabel.textContent = 'C';
        cargoLabel.classList.add('mobile-hud-cargo-label');
        
        const cargoValue = document.createElement('div');
        cargoValue.id = 'cargo-value-mobile';
        cargoValue.textContent = '0 / 1000';
        cargoValue.classList.add('mobile-hud-cargo-value');
        
        cargoContainer.appendChild(cargoLabel);
        cargoContainer.appendChild(cargoValue);
        hudContainer.appendChild(cargoContainer);
        
        // Add horde mode indicator (hidden by default)
        const hordeContainer = document.createElement('div');
        hordeContainer.id = 'mobile-horde-indicator';
        hordeContainer.classList.add('mobile-hud-horde', 'mobile-hud-hidden');
        
        const hordeTimer = document.createElement('div');
        hordeTimer.id = 'mobile-horde-timer';
        hordeTimer.textContent = '00:00';
        hordeTimer.classList.add('mobile-hud-horde-timer');
        
        hordeContainer.appendChild(hordeTimer);
        hudContainer.appendChild(hordeContainer);
        
        // Add decorative corner elements
        this.addCornerElements(hudContainer);
    }
    
    createStatusBar(parent: HTMLElement, label: string, id: string, barType: string): void {
        const container = document.createElement('div');
        container.classList.add('mobile-hud-status-row');
        
        const labelElement = document.createElement('div');
        labelElement.textContent = label;
        labelElement.classList.add('mobile-hud-status-label');
        
        const barContainer = document.createElement('div');
        barContainer.classList.add('mobile-hud-bar-container');
        
        // Add fuel value text if this is the fuel bar
        if (id === 'fuel-bar-mobile') {
            const fuelValue = document.createElement('div');
            fuelValue.id = 'fuel-value-mobile';
            fuelValue.classList.add('mobile-hud-fuel-value');
            fuelValue.textContent = '100 / 100';
            barContainer.appendChild(fuelValue);
        }
        
        const bar = document.createElement('div');
        bar.id = id;
        bar.classList.add('mobile-hud-bar', `mobile-hud-bar--${barType}`);
        
        barContainer.appendChild(bar);
        container.appendChild(labelElement);
        container.appendChild(barContainer);
        parent.appendChild(container);
    }
    
    createAnomalyDisplay(parent: HTMLElement): void {
        const anomalyContainer = document.createElement('div');
        anomalyContainer.classList.add('mobile-hud-anomaly-row');
        
        const anomalyLabel = document.createElement('div');
        anomalyLabel.textContent = 'A';
        anomalyLabel.classList.add('mobile-hud-anomaly-label');
        
        const anomalyCount = document.createElement('div');
        anomalyCount.id = 'anomaly-count-mobile';
        anomalyCount.textContent = '0';
        anomalyCount.classList.add('mobile-hud-anomaly-count');
        
        anomalyContainer.appendChild(anomalyLabel);
        anomalyContainer.appendChild(anomalyCount);
        parent.appendChild(anomalyContainer);
    }
    
    addCornerElements(panel: HTMLElement): void {
        const corners = ['tl', 'tr', 'bl', 'br'] as const;
        for (const corner of corners) {
            const el = document.createElement('div');
            el.classList.add('mobile-hud-corner', `mobile-hud-corner--${corner}`);
            panel.appendChild(el);
        }
    }
    
    update(): void {
        // Update shield display
        this.updateShieldDisplay();
        
        // Update hull display
        this.updateHullDisplay();
        
        // Update fuel display
        this.updateFuelDisplay();
        
        // Update cargo display
        this.updateCargoDisplay();
        
        // Update anomaly count
        this.updateAnomalyCount();
        
        // Update horde mode display
        this.updateHordeModeDisplay();
    }
    
    updateShieldDisplay(): void {
        const shieldBar = document.getElementById('shield-bar-mobile') as HTMLDivElement | null;
        if (!shieldBar) return;
        
        let shieldPercentage = 100;
        
        // Get shield data from spaceship
        const shieldValue = this.spaceship?.shield ?? null;
        const maxShield = this.spaceship?.maxShield ?? null;
        if (typeof shieldValue === 'number' && typeof maxShield === 'number' && maxShield > 0) {
            shieldPercentage = (shieldValue / maxShield) * 100;
        }
        
        // Update the shield bar width (dynamic)
        shieldBar.style.width = `${shieldPercentage}%`;
        
        // Change color based on shield status via CSS classes
        shieldBar.classList.remove('mobile-hud-bar--danger', 'mobile-hud-bar--warning');
        if (shieldPercentage < 25) {
            shieldBar.classList.add('mobile-hud-bar--danger');
        } else if (shieldPercentage < 50) {
            shieldBar.classList.add('mobile-hud-bar--warning');
        }
    }
    
    updateHullDisplay(): void {
        const hullBar = document.getElementById('hull-bar-mobile') as HTMLDivElement | null;
        if (!hullBar) return;
        
        let hullPercentage = 100;
        
        // Get hull data from spaceship
        const hullValue = this.spaceship?.hull ?? null;
        const maxHull = this.spaceship?.maxHull ?? null;
        if (typeof hullValue === 'number' && typeof maxHull === 'number' && maxHull > 0) {
            hullPercentage = (hullValue / maxHull) * 100;
        }
        
        // Update the hull bar width (dynamic)
        hullBar.style.width = `${hullPercentage}%`;
        
        // Change color based on hull status via CSS classes
        hullBar.classList.remove('mobile-hud-bar--danger', 'mobile-hud-bar--warning');
        if (hullPercentage < 30) {
            hullBar.classList.add('mobile-hud-bar--danger');
        } else if (hullPercentage < 60) {
            hullBar.classList.add('mobile-hud-bar--warning');
        }
    }
    
    updateFuelDisplay(): void {
        const fuelBar = document.getElementById('fuel-bar-mobile') as HTMLDivElement | null;
        const fuelValue = document.getElementById('fuel-value-mobile') as HTMLDivElement | null;
        if (!fuelBar || !this.spaceship) return;
        
        // Correctly calculate fuel percentage based on maxFuel
        const maxFuel = this.spaceship.maxFuel ?? 0;
        const fuel = this.spaceship.fuel ?? 0;
        const fuelPercent = maxFuel > 0 ? (fuel / maxFuel) * 100 : 0;
        
        // Update the fuel bar width (dynamic)
        fuelBar.style.width = `${fuelPercent}%`;
        
        // Change color when low based on percentage via CSS classes
        fuelBar.classList.remove('mobile-hud-bar--danger', 'mobile-hud-bar--warning');
        if (fuelPercent < 20) {
            fuelBar.classList.add('mobile-hud-bar--danger');
        } else if (fuelPercent < 40) {
            fuelBar.classList.add('mobile-hud-bar--warning');
        }
        
        // Update the fuel value text display
        if (fuelValue) {
            fuelValue.textContent = `${Math.round(fuel)} / ${Math.round(maxFuel)}`;
        }
    }
    
    updateCargoDisplay(): void {
        const cargoValue = document.getElementById('cargo-value-mobile') as HTMLDivElement | null;
        if (!cargoValue) return;
        
        // Try to get resources from different possible sources
        let resources = null;
        let maxCargo = 1000; // Default max
        
        // First try to get from controls
        if (this.controls && this.controls.resources) {
            resources = this.controls.resources;
            // Get max capacity from spaceship if available
            if (this.spaceship && typeof this.spaceship.maxCargoCapacity === 'number') {
                maxCargo = this.spaceship.maxCargoCapacity;
            }
        } 
        // Fall back to cargo component if available
        else if (this.spaceship && this.spaceship.cargoComponent && this.spaceship.cargoComponent.resources) {
            resources = this.spaceship.cargoComponent.resources;
            if (typeof this.spaceship.cargoComponent.maxCapacity === 'number') {
                maxCargo = this.spaceship.cargoComponent.maxCapacity;
            }
        }
        // Last resort - use previously defined resources structure
        else if (this.spaceship && this.spaceship.resources) {
            resources = this.spaceship.resources;
        }
        
        // If no resources found, exit
        if (!resources) return;
        
        // Calculate total cargo - ensure we're dealing with numbers
        let totalCargo = 0;
        
        // Properly iterate through the resources object and sum numeric values
        for (const key in resources) {
            if (Object.prototype.hasOwnProperty.call(resources, key)) {
                // Get the resource amount, ensure it's a number
                const amount = parseFloat(String(resources[key])) || 0;
                totalCargo += amount;
            }
        }
        
        // Format to integer for display
        totalCargo = Math.round(totalCargo);
        
        cargoValue.textContent = `${totalCargo} / ${maxCargo}`;
        
        // Change color when cargo is almost full via CSS classes
        cargoValue.classList.remove('mobile-hud-cargo-value--danger', 'mobile-hud-cargo-value--warning');
        if (totalCargo >= maxCargo * 0.9) {
            cargoValue.classList.add('mobile-hud-cargo-value--danger');
        } else if (totalCargo >= maxCargo * 0.7) {
            cargoValue.classList.add('mobile-hud-cargo-value--warning');
        }
    }
    
    updateAnomalyCount(): void {
        const anomalyCount = document.getElementById('anomaly-count-mobile') as HTMLDivElement | null;
        if (!anomalyCount) return;
        
        // Get anomaly count from game object if available
        let count = 0;
        if (window.game && window.game.environment && window.game.environment.anomalyCount) {
            count = window.game.environment.anomalyCount;
        }
        
        // Update the anomaly counter
        anomalyCount.textContent = count.toString();
        
        // Highlight if anomalies are present via CSS class
        if (count > 0) {
            anomalyCount.classList.add('mobile-hud-anomaly-count--active');
        } else {
            anomalyCount.classList.remove('mobile-hud-anomaly-count--active');
        }
    }
    
    /**
     * Update the horde mode indicator and timer in the mobile HUD
     */
    updateHordeModeDisplay(): void {
        const hordeIndicator = document.getElementById('mobile-horde-indicator') as HTMLDivElement | null;
        const hordeTimer = document.getElementById('mobile-horde-timer') as HTMLDivElement | null;
        
        if (!hordeIndicator || !hordeTimer) return;
        
        // Check if horde mode is active
        if (window.game && window.game.isHordeActive) {
            // Show the indicator if not already visible
            if (hordeIndicator.classList.contains('mobile-hud-hidden')) {
                hordeIndicator.classList.remove('mobile-hud-hidden');
                
                // Create horde title element with CSS class
                const hordeTitle = document.createElement('div');
                hordeTitle.classList.add('mobile-hud-horde-title');
                hordeTitle.textContent = 'HORDE MODE';
                hordeIndicator.insertBefore(hordeTitle, hordeTimer);
            }
            
            // Update the timer
            if (window.game.getFormattedHordeSurvivalTime) {
                hordeTimer.textContent = window.game.getFormattedHordeSurvivalTime();
            } else {
                // Fallback calculation
                const hordeSurvivalTime = window.game.hordeSurvivalTime ?? 0;
                const totalSeconds = Math.floor(hordeSurvivalTime / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                hordeTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Increase pulsing intensity after 3 minutes via CSS class
            if ((window.game.hordeSurvivalTime ?? 0) > 3 * 60 * 1000) {
                hordeIndicator.classList.add('mobile-hud-horde--intense');
            } else {
                hordeIndicator.classList.remove('mobile-hud-horde--intense');
            }
        } else {
            // Hide the indicator and reset intense state
            hordeIndicator.classList.add('mobile-hud-hidden');
            hordeIndicator.classList.remove('mobile-hud-horde--intense');
        }
    }
    
    hide(): void {
        const container = document.getElementById('mobile-hud-container') as HTMLDivElement | null;
        if (container) {
            container.classList.add('mobile-hud-hidden');
        }
    }
    
    show(): void {
        // Check if intro sequence is active
        if (window.game && window.game.introSequenceActive) {
            console.log("MobileHUD: Not showing HUD during intro sequence");
            return; // Don't show during intro
        }
        
        const container = document.getElementById('mobile-hud-container') as HTMLDivElement | null;
        if (container) {
            container.classList.remove('mobile-hud-hidden');
        }
    }
    
    // Add method to set controls reference
    setControls(controls: MobileHUDControls): void {
        console.log("MobileHUD: Setting controls reference");
        this.controls = controls;
    }

    // Update to handle system name and anomaly count in a simpler way
    updateLocation(_locationName: string | null, _systemName = 'Unknown System'): void {
        // Since we no longer show system name, we just need to update anomaly count
        this.updateAnomalyCount();
    }
} 

type MobileHUDResources = Record<string, number | string>;

type MobileHUDSpaceship = any;

type MobileHUDControls = {
    resources?: MobileHUDResources;
};
