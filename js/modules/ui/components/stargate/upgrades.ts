// upgrades.ts - Ship upgrades UI and logic

interface Spaceship {
    fuelTankLevel: number;
    maxFuel: number;
    fuelUpgradeCost: number;
    engineLevel: number;
    maxVelocity: number;
    engineUpgradeCost: number;
    miningLevel: number;
    miningEfficiency: number;
    miningUpgradeCost: number;
    hullLevel: number;
    collisionResistance: number;
    hullUpgradeCost: number;
    scannerLevel: number;
    scanRange: number;
    scannerUpgradeCost: number;
    weaponLevel: number;
    weaponDamage: number;
    weaponFireRate: number;
    weaponUpgradeCost: number;
    shieldLevel: number;
    maxShield: number;
    shieldRegenRate: number;
    shieldUpgradeCost: number;
    credits: number;
}

export class UpgradesView {
    private spaceship: Spaceship | null;
    
    constructor() {
        this.spaceship = null;
    }
    
    setSpaceship(spaceship: Spaceship): void {
        this.spaceship = spaceship;
    }
    
    updateUpgradeDisplays(): void {
        if (!this.spaceship) return;
        
        // Update Fuel Tank upgrade information
        const currentFuelLevel = document.getElementById('current-fuel-level');
        const currentFuelCapacity = document.getElementById('current-fuel-capacity');
        const nextFuelCapacity = document.getElementById('next-fuel-capacity');
        const fuelUpgradeCost = document.getElementById('fuel-upgrade-cost');
        const fuelUpgradeProgress = document.getElementById('fuel-upgrade-progress');
        
        if (currentFuelLevel) currentFuelLevel.textContent = String(this.spaceship.fuelTankLevel);
        if (currentFuelCapacity) currentFuelCapacity.textContent = String(this.spaceship.maxFuel);
        if (nextFuelCapacity) nextFuelCapacity.textContent = String(this.spaceship.maxFuel * 2);
        if (fuelUpgradeCost) fuelUpgradeCost.textContent = String(this.spaceship.fuelUpgradeCost);
        if (fuelUpgradeProgress) {
            fuelUpgradeProgress.style.width = `${Math.min(this.spaceship.fuelTankLevel * 20, 100)}%`;
        }
        
        // Update Engine upgrade information
        const currentEngineLevel = document.getElementById('current-engine-level');
        const currentMaxVelocity = document.getElementById('current-max-velocity');
        const nextMaxVelocity = document.getElementById('next-max-velocity');
        const engineUpgradeCost = document.getElementById('engine-upgrade-cost');
        const engineUpgradeProgress = document.getElementById('engine-upgrade-progress');
        
        if (currentEngineLevel) currentEngineLevel.textContent = String(this.spaceship.engineLevel);
        if (currentMaxVelocity) currentMaxVelocity.textContent = this.spaceship.maxVelocity.toFixed(2);
        if (nextMaxVelocity) nextMaxVelocity.textContent = (this.spaceship.maxVelocity * 1.25).toFixed(2);
        if (engineUpgradeCost) engineUpgradeCost.textContent = String(this.spaceship.engineUpgradeCost);
        if (engineUpgradeProgress) {
            engineUpgradeProgress.style.width = `${Math.min(this.spaceship.engineLevel * 20, 100)}%`;
        }
        
        // Update Mining Laser upgrade information
        const currentMiningLevel = document.getElementById('current-mining-level');
        const currentMiningEfficiency = document.getElementById('current-mining-efficiency');
        const nextMiningEfficiency = document.getElementById('next-mining-efficiency');
        const miningUpgradeCost = document.getElementById('mining-upgrade-cost');
        const miningUpgradeProgress = document.getElementById('mining-upgrade-progress');
        
        if (currentMiningLevel) currentMiningLevel.textContent = String(this.spaceship.miningLevel);
        if (currentMiningEfficiency) {
            currentMiningEfficiency.textContent = String(Math.round(this.spaceship.miningEfficiency * 100));
        }
        if (nextMiningEfficiency) {
            nextMiningEfficiency.textContent = String(Math.round(this.spaceship.miningEfficiency * 130));
        }
        if (miningUpgradeCost) miningUpgradeCost.textContent = String(this.spaceship.miningUpgradeCost);
        if (miningUpgradeProgress) {
            miningUpgradeProgress.style.width = `${Math.min(this.spaceship.miningLevel * 20, 100)}%`;
        }
        
        // Update Hull upgrade information
        const currentHullLevel = document.getElementById('current-hull-level');
        const currentHullResistance = document.getElementById('current-hull-resistance');
        const nextHullResistance = document.getElementById('next-hull-resistance');
        const hullUpgradeCost = document.getElementById('hull-upgrade-cost');
        const hullUpgradeProgress = document.getElementById('hull-upgrade-progress');
        
        if (currentHullLevel) currentHullLevel.textContent = String(this.spaceship.hullLevel);
        if (currentHullResistance) {
            currentHullResistance.textContent = String(Math.round(this.spaceship.collisionResistance * 100));
        }
        if (nextHullResistance) {
            nextHullResistance.textContent = String(Math.round(this.spaceship.collisionResistance * 125));
        }
        if (hullUpgradeCost) hullUpgradeCost.textContent = String(this.spaceship.hullUpgradeCost);
        if (hullUpgradeProgress) {
            hullUpgradeProgress.style.width = `${Math.min(this.spaceship.hullLevel * 20, 100)}%`;
        }
        
        // Update Scanner upgrade information
        const currentScannerLevel = document.getElementById('current-scanner-level');
        const currentScannerRange = document.getElementById('current-scanner-range');
        const nextScannerRange = document.getElementById('next-scanner-range');
        const scannerUpgradeCost = document.getElementById('scanner-upgrade-cost');
        const scannerUpgradeProgress = document.getElementById('scanner-upgrade-progress');
        
        if (currentScannerLevel) currentScannerLevel.textContent = String(this.spaceship.scannerLevel);
        if (currentScannerRange) {
            currentScannerRange.textContent = String(Math.round(this.spaceship.scanRange));
        }
        if (nextScannerRange) {
            nextScannerRange.textContent = String(Math.round(this.spaceship.scanRange * 1.2));
        }
        if (scannerUpgradeCost) scannerUpgradeCost.textContent = String(this.spaceship.scannerUpgradeCost);
        if (scannerUpgradeProgress) {
            scannerUpgradeProgress.style.width = `${Math.min(this.spaceship.scannerLevel * 20, 100)}%`;
        }
        
        // Update Weapon upgrade information
        const currentWeaponLevel = document.getElementById('current-weapon-level');
        const currentWeaponDamage = document.getElementById('current-weapon-damage');
        const currentWeaponFireRate = document.getElementById('current-weapon-firerate');
        const nextWeaponDamage = document.getElementById('next-weapon-damage');
        const nextWeaponFireRate = document.getElementById('next-weapon-firerate');
        const weaponUpgradeCost = document.getElementById('weapon-upgrade-cost');
        const weaponUpgradeProgress = document.getElementById('weapon-upgrade-progress');
        
        if (currentWeaponLevel) currentWeaponLevel.textContent = String(this.spaceship.weaponLevel);
        if (currentWeaponDamage) currentWeaponDamage.textContent = String(Math.round(this.spaceship.weaponDamage));
        if (currentWeaponFireRate) currentWeaponFireRate.textContent = this.spaceship.weaponFireRate.toFixed(2);
        if (nextWeaponDamage) nextWeaponDamage.textContent = String(Math.round(this.spaceship.weaponDamage * 1.2));
        if (nextWeaponFireRate) nextWeaponFireRate.textContent = (this.spaceship.weaponFireRate * 1.15).toFixed(2);
        if (weaponUpgradeCost) weaponUpgradeCost.textContent = String(this.spaceship.weaponUpgradeCost);
        if (weaponUpgradeProgress) {
            weaponUpgradeProgress.style.width = `${Math.min(this.spaceship.weaponLevel * 20, 100)}%`;
        }
        
        // Update Shield upgrade information
        const currentShieldLevel = document.getElementById('current-shield-level');
        const currentShieldMax = document.getElementById('current-shield-max');
        const currentShieldRegen = document.getElementById('current-shield-regen');
        const nextShieldMax = document.getElementById('next-shield-max');
        const nextShieldRegen = document.getElementById('next-shield-regen');
        const shieldUpgradeCost = document.getElementById('shield-upgrade-cost');
        const shieldUpgradeProgress = document.getElementById('shield-upgrade-progress');
        
        if (currentShieldLevel) currentShieldLevel.textContent = String(this.spaceship.shieldLevel);
        if (currentShieldMax) currentShieldMax.textContent = String(Math.round(this.spaceship.maxShield));
        if (currentShieldRegen) currentShieldRegen.textContent = this.spaceship.shieldRegenRate.toFixed(1);
        if (nextShieldMax) nextShieldMax.textContent = String(Math.round(this.spaceship.maxShield * 1.3));
        if (nextShieldRegen) nextShieldRegen.textContent = (this.spaceship.shieldRegenRate * 1.2).toFixed(1);
        if (shieldUpgradeCost) shieldUpgradeCost.textContent = String(this.spaceship.shieldUpgradeCost);
        if (shieldUpgradeProgress) {
            shieldUpgradeProgress.style.width = `${Math.min(this.spaceship.shieldLevel * 20, 100)}%`;
        }
        
        // Update upgrade button statuses
        this.updateUpgradeButtonStatus('upgrade-fuel-tank', this.spaceship.credits, this.spaceship.fuelUpgradeCost, '#00cc33');
        this.updateUpgradeButtonStatus('upgrade-engine', this.spaceship.credits, this.spaceship.engineUpgradeCost, '#ff9900');
        this.updateUpgradeButtonStatus('upgrade-mining', this.spaceship.credits, this.spaceship.miningUpgradeCost, '#ff3030');
        this.updateUpgradeButtonStatus('upgrade-hull', this.spaceship.credits, this.spaceship.hullUpgradeCost, '#30cfd0');
        this.updateUpgradeButtonStatus('upgrade-scanner', this.spaceship.credits, this.spaceship.scannerUpgradeCost, '#9933cc');
        const weaponCost = this.spaceship.weaponLevel >= 5 ? Infinity : this.spaceship.weaponUpgradeCost;
        const shieldCost = this.spaceship.shieldLevel >= 5 ? Infinity : this.spaceship.shieldUpgradeCost;
        this.updateUpgradeButtonStatus('upgrade-weapon', this.spaceship.credits, weaponCost, '#ff4444');
        this.updateUpgradeButtonStatus('upgrade-shield', this.spaceship.credits, shieldCost, '#4488ff');
    }
    
    // Helper method to update upgrade button status
    updateUpgradeButtonStatus(buttonId: string, currentCredits: number, cost: number, activeColor: string): void {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
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
