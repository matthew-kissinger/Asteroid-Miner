// miningDisplay.js - Handles the mining UI and resource display

export class MiningDisplay {
    controls: MiningControls | null;

    constructor() {
        this.controls = null; // Will be set later
        this.setupMiningDisplay();
    }
    
    setControls(controls: MiningControls): void {
        this.controls = controls;
    }
    
    setupMiningDisplay(): void {
        // Don't create a duplicate target-info element
        // The HUD already creates one that we'll use
        // We just need to ensure mining-time element exists when needed
    }
    
    update(): void {
        // Update the HUD resource counters in the top right with our resource values
        if (this.controls && this.controls.resources) {
            const ironAmount = document.getElementById('iron-amount') as HTMLSpanElement | null;
            const goldAmount = document.getElementById('gold-amount') as HTMLSpanElement | null;
            const platinumAmount = document.getElementById('platinum-amount') as HTMLSpanElement | null;
            const cargoCapacity = document.getElementById('cargo-capacity') as HTMLSpanElement | null;
            const capacityBar = document.getElementById('capacity-bar') as HTMLDivElement | null;
            
            if (ironAmount) ironAmount.textContent = String(this.controls.resources.iron || 0);
            if (goldAmount) goldAmount.textContent = String(this.controls.resources.gold || 0);
            if (platinumAmount) platinumAmount.textContent = String(this.controls.resources.platinum || 0);
            
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
    updateMiningTimeEstimate(): void {
        const miningTimeElement = document.getElementById('mining-time') as HTMLDivElement | null;
        if (!miningTimeElement || !this.controls || !this.controls.miningSystem) return;
        
        const miningSystem = this.controls.miningSystem;
        if (miningSystem.targetAsteroid && miningSystem.targetAsteroid.resourceType) {
            const resourceType = miningSystem.targetAsteroid.resourceType.toLowerCase();
            const efficiency = miningSystem.getMiningEfficiency();
            const baseSpeed = miningSystem.miningSpeedByType[resourceType] || 0;
            const secondsRequired = baseSpeed > 0 ? Math.round(1 / (baseSpeed * efficiency)) : 0;
            
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
    
    hide(): void {
        // Hide target info
        const targetInfo = document.getElementById('target-info') as HTMLDivElement | null;
        if (targetInfo) {
            targetInfo.style.display = 'none';
        }
    }
    
    show(): void {
        // Show target info if needed
        // In this implementation, the target info is shown directly by the targeting system
    }
}

type MiningResources = {
    iron?: number;
    gold?: number;
    platinum?: number;
};

type MiningSpaceship = {
    maxCargoCapacity?: number;
};

type MiningSystem = {
    targetAsteroid?: {
        resourceType?: string;
    };
    getMiningEfficiency: () => number;
    miningSpeedByType: Record<string, number>;
};

type MiningControls = {
    resources?: MiningResources;
    spaceship?: MiningSpaceship;
    miningSystem?: MiningSystem;
};
