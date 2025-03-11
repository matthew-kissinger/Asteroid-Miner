// miningDisplay.js - Handles the mining UI and resource display

export class MiningDisplay {
    constructor() {
        this.controls = null; // Will be set later
        this.setupMiningDisplay();
    }
    
    setControls(controls) {
        this.controls = controls;
    }
    
    setupMiningDisplay() {
        // Create only the target info display for when targeting asteroids
        const targetInfo = document.createElement('div');
        targetInfo.id = 'target-info';
        targetInfo.style.position = 'absolute';
        targetInfo.style.bottom = '120px';
        targetInfo.style.left = '50%';
        targetInfo.style.transform = 'translateX(-50%)';
        targetInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        targetInfo.style.padding = '10px 20px';
        targetInfo.style.borderRadius = '20px';
        targetInfo.style.border = '1px solid #30cfd0';
        targetInfo.style.boxShadow = '0 0 10px #30cfd0';
        targetInfo.style.display = 'none';
        targetInfo.style.textAlign = 'center';
        document.body.appendChild(targetInfo);
        
        // Target name
        const targetName = document.createElement('div');
        targetName.id = 'target-name';
        targetName.textContent = 'Asteroid';
        targetInfo.appendChild(targetName);
        
        // Target resources
        const targetResources = document.createElement('div');
        targetResources.id = 'target-resources';
        targetResources.textContent = 'Resources: Iron, Gold';
        targetInfo.appendChild(targetResources);
    }
    
    update() {
        // Update the HUD resource counters in the top right with our resource values
        if (this.controls && this.controls.resources) {
            const ironAmount = document.getElementById('iron-amount');
            const goldAmount = document.getElementById('gold-amount');
            const platinumAmount = document.getElementById('platinum-amount');
            const cargoCapacity = document.getElementById('cargo-capacity');
            const capacityBar = document.getElementById('capacity-bar');
            
            if (ironAmount) ironAmount.textContent = this.controls.resources.iron || 0;
            if (goldAmount) goldAmount.textContent = this.controls.resources.gold || 0;
            if (platinumAmount) platinumAmount.textContent = this.controls.resources.platinum || 0;
            
            // Update cargo capacity
            if (cargoCapacity && capacityBar && this.controls.spaceship) {
                const totalResources = 
                    (this.controls.resources.iron || 0) + 
                    (this.controls.resources.gold || 0) + 
                    (this.controls.resources.platinum || 0);
                const maxCapacity = this.controls.spaceship.maxCargoCapacity || 1000;
                const capacityPercentage = (totalResources / maxCapacity) * 100;
                
                cargoCapacity.textContent = `${totalResources} / ${maxCapacity}`;
                capacityBar.style.width = `${capacityPercentage}%`;
                
                // Change color when near capacity
                if (capacityPercentage > 90) {
                    capacityBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)';
                } else if (capacityPercentage > 75) {
                    capacityBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)';
                } else {
                    capacityBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
                }
            }
        }
    }
    
    hide() {
        // Hide target info
        const targetInfo = document.getElementById('target-info');
        if (targetInfo) {
            targetInfo.style.display = 'none';
        }
    }
    
    show() {
        // Show target info if needed
        // In this implementation, the target info is shown directly by the targeting system
    }
}