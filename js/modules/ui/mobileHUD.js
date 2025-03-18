// mobileHUD.js - Simplified HUD for mobile devices

export class MobileHUD {
    constructor(spaceship) {
        this.spaceship = spaceship;
        this.controls = null; // Will be set from UI class
        this.setupMobileHUD();
    }
    
    setupMobileHUD() {
        // Create main container for mobile HUD
        const hudContainer = document.createElement('div');
        hudContainer.id = 'mobile-hud-container';
        hudContainer.style.position = 'absolute';
        hudContainer.style.top = '10px';
        hudContainer.style.right = '10px';
        hudContainer.style.width = '120px'; // Keep it compact
        hudContainer.style.backgroundColor = 'rgba(6, 22, 31, 0.7)';
        hudContainer.style.backdropFilter = 'blur(5px)';
        hudContainer.style.borderRadius = '8px';
        hudContainer.style.border = '1px solid rgba(120, 220, 232, 0.3)';
        hudContainer.style.padding = '10px';
        hudContainer.style.color = 'rgba(120, 220, 232, 0.9)';
        hudContainer.style.fontFamily = '"Rajdhani", "Electrolize", sans-serif';
        hudContainer.style.fontSize = '14px';
        hudContainer.style.boxShadow = '0 0 15px rgba(120, 220, 232, 0.2)';
        hudContainer.style.zIndex = '1000';
        document.body.appendChild(hudContainer);

        // Create status bars with labels
        this.createStatusBar(hudContainer, 'S', 'shield-bar-mobile', 'rgba(51, 153, 255, 0.8)');
        this.createStatusBar(hudContainer, 'H', 'hull-bar-mobile', 'rgba(120, 220, 232, 0.8)');
        this.createStatusBar(hudContainer, 'F', 'fuel-bar-mobile', 'rgba(120, 220, 232, 0.8)');
        
        // Create cargo display
        const cargoContainer = document.createElement('div');
        cargoContainer.style.display = 'flex';
        cargoContainer.style.justifyContent = 'space-between';
        cargoContainer.style.alignItems = 'center';
        cargoContainer.style.marginTop = '10px';
        
        const cargoLabel = document.createElement('div');
        cargoLabel.textContent = 'C';
        cargoLabel.style.marginRight = '10px';
        
        const cargoValue = document.createElement('div');
        cargoValue.id = 'cargo-value-mobile';
        cargoValue.textContent = '0 / 1000';
        cargoValue.style.textAlign = 'right';
        cargoValue.style.flexGrow = '1';
        
        cargoContainer.appendChild(cargoLabel);
        cargoContainer.appendChild(cargoValue);
        hudContainer.appendChild(cargoContainer);
        
        // Add decorative corner elements
        this.addCornerElements(hudContainer);
    }
    
    createStatusBar(parent, label, id, color) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.marginBottom = '8px';
        
        const labelElement = document.createElement('div');
        labelElement.textContent = label;
        labelElement.style.marginRight = '10px';
        labelElement.style.width = '15px';
        labelElement.style.textAlign = 'center';
        
        const barContainer = document.createElement('div');
        barContainer.style.flexGrow = '1';
        barContainer.style.height = '8px';
        barContainer.style.backgroundColor = 'rgba(10, 30, 40, 0.5)';
        barContainer.style.borderRadius = '4px';
        barContainer.style.overflow = 'hidden';
        
        const bar = document.createElement('div');
        bar.id = id;
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = color;
        bar.style.transition = 'width 0.3s ease';
        
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
    
    update() {
        // Update shield display
        this.updateShieldDisplay();
        
        // Update hull display
        this.updateHullDisplay();
        
        // Update fuel display
        this.updateFuelDisplay();
        
        // Update cargo display
        this.updateCargoDisplay();
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
        if (!fuelBar || !this.spaceship) return;
        
        fuelBar.style.width = `${this.spaceship.fuel}%`;
        
        // Change color when low
        if (this.spaceship.fuel < 20) {
            fuelBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)';
        } else if (this.spaceship.fuel < 40) {
            fuelBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)';
        } else {
            fuelBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
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
    
    hide() {
        const container = document.getElementById('mobile-hud-container');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    show() {
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
} 