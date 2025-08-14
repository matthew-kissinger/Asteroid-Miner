// upgrades.js - Ship upgrades UI and logic

export class UpgradesView {
    constructor() {
        this.spaceship = null;
    }
    
    setSpaceship(spaceship) {
        this.spaceship = spaceship;
    }
    
    updateUpgradeDisplays() {
        if (!this.spaceship) return;
        
        // Update Fuel Tank upgrade information
        document.getElementById('current-fuel-level').textContent = this.spaceship.fuelTankLevel;
        document.getElementById('current-fuel-capacity').textContent = this.spaceship.maxFuel;
        document.getElementById('next-fuel-capacity').textContent = this.spaceship.maxFuel * 2;
        document.getElementById('fuel-upgrade-cost').textContent = this.spaceship.fuelUpgradeCost;
        document.getElementById('fuel-upgrade-progress').style.width = `${Math.min(this.spaceship.fuelTankLevel * 20, 100)}%`;
        
        // Update Engine upgrade information
        document.getElementById('current-engine-level').textContent = this.spaceship.engineLevel;
        document.getElementById('current-max-velocity').textContent = this.spaceship.maxVelocity.toFixed(2);
        document.getElementById('next-max-velocity').textContent = (this.spaceship.maxVelocity * 1.25).toFixed(2);
        document.getElementById('engine-upgrade-cost').textContent = this.spaceship.engineUpgradeCost;
        document.getElementById('engine-upgrade-progress').style.width = `${Math.min(this.spaceship.engineLevel * 20, 100)}%`;
        
        // Update Mining Laser upgrade information
        document.getElementById('current-mining-level').textContent = this.spaceship.miningLevel;
        document.getElementById('current-mining-efficiency').textContent = Math.round(this.spaceship.miningEfficiency * 100);
        document.getElementById('next-mining-efficiency').textContent = Math.round(this.spaceship.miningEfficiency * 130);
        document.getElementById('mining-upgrade-cost').textContent = this.spaceship.miningUpgradeCost;
        document.getElementById('mining-upgrade-progress').style.width = `${Math.min(this.spaceship.miningLevel * 20, 100)}%`;
        
        // Update Hull upgrade information
        document.getElementById('current-hull-level').textContent = this.spaceship.hullLevel;
        document.getElementById('current-hull-resistance').textContent = Math.round(this.spaceship.collisionResistance * 100);
        document.getElementById('next-hull-resistance').textContent = Math.round(this.spaceship.collisionResistance * 125);
        document.getElementById('hull-upgrade-cost').textContent = this.spaceship.hullUpgradeCost;
        document.getElementById('hull-upgrade-progress').style.width = `${Math.min(this.spaceship.hullLevel * 20, 100)}%`;
        
        // Update Scanner upgrade information
        document.getElementById('current-scanner-level').textContent = this.spaceship.scannerLevel;
        document.getElementById('current-scanner-range').textContent = Math.round(this.spaceship.scanRange);
        document.getElementById('next-scanner-range').textContent = Math.round(this.spaceship.scanRange * 1.2);
        document.getElementById('scanner-upgrade-cost').textContent = this.spaceship.scannerUpgradeCost;
        document.getElementById('scanner-upgrade-progress').style.width = `${Math.min(this.spaceship.scannerLevel * 20, 100)}%`;
        
        // Update upgrade button statuses
        this.updateUpgradeButtonStatus('upgrade-fuel-tank', this.spaceship.credits, this.spaceship.fuelUpgradeCost, '#00cc33');
        this.updateUpgradeButtonStatus('upgrade-engine', this.spaceship.credits, this.spaceship.engineUpgradeCost, '#ff9900');
        this.updateUpgradeButtonStatus('upgrade-mining', this.spaceship.credits, this.spaceship.miningUpgradeCost, '#ff3030');
        this.updateUpgradeButtonStatus('upgrade-hull', this.spaceship.credits, this.spaceship.hullUpgradeCost, '#30cfd0');
        this.updateUpgradeButtonStatus('upgrade-scanner', this.spaceship.credits, this.spaceship.scannerUpgradeCost, '#9933cc');
    }
    
    // Helper method to update upgrade button status
    updateUpgradeButtonStatus(buttonId, currentCredits, cost, activeColor) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (currentCredits < cost) {
            button.disabled = true;
            button.style.backgroundColor = '#555';
            button.style.color = '#777';
            button.style.cursor = 'not-allowed';
        } else {
            button.disabled = false;
            button.style.backgroundColor = activeColor;
            button.style.color = activeColor === '#ff9900' || activeColor === '#30cfd0' ? '#000' : '#fff';
            button.style.cursor = 'pointer';
        }
    }
}