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
        // Don't create a duplicate target-info element
        // The HUD already creates one that we'll use
        // We just need to ensure mining-time element exists when needed
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
            
            // Update mining time estimate if targeting an asteroid
            this.updateMiningTimeEstimate();
        }
    }
    
    /**
     * Update the mining time estimate based on the targeted asteroid type and mining efficiency
     */
    updateMiningTimeEstimate() {
        const miningTimeElement = document.getElementById('mining-time');
        if (!miningTimeElement || !this.controls || !this.controls.miningSystem) return;
        
        const miningSystem = this.controls.miningSystem;
        if (miningSystem.targetAsteroid && miningSystem.targetAsteroid.resourceType) {
            const resourceType = miningSystem.targetAsteroid.resourceType.toLowerCase();
            const efficiency = miningSystem.getMiningEfficiency();
            const secondsRequired = Math.round(1 / (miningSystem.miningSpeedByType[resourceType] * efficiency));
            
            miningTimeElement.textContent = `Mining time: ${secondsRequired} seconds`;
            miningTimeElement.style.display = 'block';
            
            // Color based on resource value
            if (resourceType === 'platinum') {
                miningTimeElement.style.color = '#66ffff';
            } else if (resourceType === 'gold') {
                miningTimeElement.style.color = '#ffcc00';
            } else {
                miningTimeElement.style.color = '#a0a0a0';
            }
        } else {
            miningTimeElement.style.display = 'none';
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