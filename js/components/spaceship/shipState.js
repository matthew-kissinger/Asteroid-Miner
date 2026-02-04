/**
 * ShipStateComponent - Stores spaceship state information
 * 
 * Tracks the spaceship's current state, including docking status, health, shield, etc.
 */

import { Component } from '../../core/component.ts';

export class ShipStateComponent extends Component {
    constructor() {
        super();
        
        // Docking state
        this.isDocked = false;
        this.undockPosition = new THREE.Vector3(0, 2000, 0); // Default position for undocking
        this.undockQuaternion = new THREE.Quaternion(); // Default rotation for undocking
        
        // Ship resources
        this.fuel = 100;
        this.maxFuel = 100;
        this.credits = 0;
        
        // Ship upgrades
        this.engineLevel = 1;
        this.fuelTankLevel = 1;
        this.hullLevel = 1;
        this.shieldLevel = 1;
        this.miningLevel = 1;
        this.scannerLevel = 1;
        this.weaponLevel = 1;
        
        // Ship properties derived from upgrades
        this.maxSpeed = 30 * this.engineLevel;
        this.maxThrust = 10 * this.engineLevel;
        this.fuelConsumptionRate = 0.02 / this.engineLevel;
        this.miningEfficiency = this.miningLevel;
        this.scanRange = 5000 * this.scannerLevel;
        
        // Upgrade costs (increase with level)
        this.engineUpgradeCost = 500 * this.engineLevel;
        this.fuelTankUpgradeCost = 300 * this.fuelTankLevel;
        this.hullUpgradeCost = 600 * this.hullLevel;
        this.shieldUpgradeCost = 700 * this.shieldLevel;
        this.miningUpgradeCost = 400 * this.miningLevel;
        this.scannerUpgradeCost = 250 * this.scannerLevel;
        this.weaponUpgradeCost = 800 * this.weaponLevel;
    }
    
    /**
     * Upgrades the ship's engine
     * @returns {number} Cost of the upgrade
     */
    upgradeEngine() {
        const cost = this.engineUpgradeCost;
        this.engineLevel++;
        this.maxSpeed = 30 * this.engineLevel;
        this.maxThrust = 10 * this.engineLevel;
        this.fuelConsumptionRate = 0.02 / this.engineLevel;
        this.engineUpgradeCost = 500 * this.engineLevel;
        
        // Publish upgrade event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.engineUpgraded', {
                entity: this.entity,
                newLevel: this.engineLevel,
                maxSpeed: this.maxSpeed,
                maxThrust: this.maxThrust
            });
        }
        
        return cost;
    }
    
    /**
     * Upgrades the ship's fuel tank
     * @returns {number} Cost of the upgrade
     */
    upgradeFuelTank() {
        const cost = this.fuelTankUpgradeCost;
        const oldMaxFuel = this.maxFuel;
        
        this.fuelTankLevel++;
        this.maxFuel = 100 * this.fuelTankLevel;
        this.fuel += (this.maxFuel - oldMaxFuel); // Fill the added capacity
        this.fuelTankUpgradeCost = 300 * this.fuelTankLevel;
        
        // Publish upgrade event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.fuelTankUpgraded', {
                entity: this.entity,
                newLevel: this.fuelTankLevel,
                maxFuel: this.maxFuel
            });
        }
        
        return cost;
    }
    
    /**
     * Upgrades the ship's hull
     * @returns {number} Cost of the upgrade
     */
    upgradeHull() {
        const cost = this.hullUpgradeCost;
        this.hullLevel++;
        this.hullUpgradeCost = 600 * this.hullLevel;
        
        // Update hull health in health component
        const healthComponent = this.entity.getComponent('HealthComponent');
        if (healthComponent) {
            const oldMaxHealth = healthComponent.maxHealth;
            healthComponent.maxHealth = 100 * this.hullLevel;
            healthComponent.health += (healthComponent.maxHealth - oldMaxHealth); // Heal by the added amount
        }
        
        // Publish upgrade event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.hullUpgraded', {
                entity: this.entity,
                newLevel: this.hullLevel
            });
        }
        
        return cost;
    }
    
    /**
     * Upgrades the ship's shields
     * @returns {number} Cost of the upgrade
     */
    upgradeShield() {
        const cost = this.shieldUpgradeCost;
        this.shieldLevel++;
        this.shieldUpgradeCost = 700 * this.shieldLevel;
        
        // Update shield in health component
        const healthComponent = this.entity.getComponent('HealthComponent');
        if (healthComponent) {
            const oldMaxShield = healthComponent.maxShield;
            healthComponent.maxShield = 100 * this.shieldLevel;
            healthComponent.shield += (healthComponent.maxShield - oldMaxShield); // Restore by the added amount
        }
        
        // Publish upgrade event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.shieldUpgraded', {
                entity: this.entity,
                newLevel: this.shieldLevel
            });
        }
        
        return cost;
    }
    
    /**
     * Upgrades the ship's mining laser
     * @returns {number} Cost of the upgrade
     */
    upgradeMiningLaser() {
        const cost = this.miningUpgradeCost;
        this.miningLevel++;
        this.miningEfficiency = this.miningLevel;
        this.miningUpgradeCost = 400 * this.miningLevel;
        
        // Update mining laser component
        const miningLaser = this.entity.getComponent('MiningLaserComponent');
        if (miningLaser) {
            miningLaser.upgrade(this.miningEfficiency / (this.miningLevel - 1));
        }
        
        // Publish upgrade event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.miningUpgraded', {
                entity: this.entity,
                newLevel: this.miningLevel,
                efficiency: this.miningEfficiency
            });
        }
        
        return cost;
    }
    
    /**
     * Upgrades the ship's scanner
     * @returns {number} Cost of the upgrade
     */
    upgradeScanner() {
        const cost = this.scannerUpgradeCost;
        this.scannerLevel++;
        this.scanRange = 5000 * this.scannerLevel;
        this.scannerUpgradeCost = 250 * this.scannerLevel;
        
        // Publish upgrade event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.scannerUpgraded', {
                entity: this.entity,
                newLevel: this.scannerLevel,
                range: this.scanRange
            });
        }
        
        return cost;
    }
    
    /**
     * Upgrades the ship's weapons
     * @returns {number} Cost of the upgrade
     */
    upgradeWeapons() {
        const cost = this.weaponUpgradeCost;
        this.weaponLevel++;
        this.weaponUpgradeCost = 800 * this.weaponLevel;
        
        // Update weapon component
        const weapon = this.entity.getComponent('WeaponComponent');
        if (weapon) {
            weapon.upgrade(this.weaponLevel);
        }
        
        // Publish upgrade event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.weaponsUpgraded', {
                entity: this.entity,
                newLevel: this.weaponLevel
            });
        }
        
        return cost;
    }
    
    /**
     * Refuel the ship
     * @param {number} amount Amount to refuel (default: max)
     * @returns {number} Cost of refueling
     */
    refuel(amount = null) {
        // Determine amount to refuel and cost
        const fuelNeeded = amount ? Math.min(amount, this.maxFuel - this.fuel) : this.maxFuel - this.fuel;
        const costPerUnit = 2;
        const cost = Math.ceil(fuelNeeded * costPerUnit);
        
        // Add fuel
        this.fuel = Math.min(this.fuel + fuelNeeded, this.maxFuel);
        
        // Publish refuel event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.refueled', {
                entity: this.entity,
                amount: fuelNeeded,
                currentFuel: this.fuel,
                maxFuel: this.maxFuel
            });
        }
        
        return cost;
    }
    
    /**
     * Consume fuel based on thrust
     * @param {number} amount Amount of fuel to consume
     * @returns {boolean} True if fuel was consumed
     */
    consumeFuel(amount) {
        if (this.fuel <= 0) return false;
        
        this.fuel = Math.max(0, this.fuel - amount);
        
        // Notify if fuel is getting low
        if (this.fuel < this.maxFuel * 0.2 && this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.fuelLow', {
                entity: this.entity,
                currentFuel: this.fuel,
                maxFuel: this.maxFuel
            });
        }
        
        return true;
    }
    
    /**
     * Repair ship hull
     * @returns {number} Cost of repair
     */
    repairHull() {
        const healthComponent = this.entity.getComponent('HealthComponent');
        if (!healthComponent) return 0;
        
        const healthNeeded = healthComponent.maxHealth - healthComponent.health;
        const costPerUnit = 4;
        const cost = Math.ceil(healthNeeded * costPerUnit);
        
        // Repair hull
        healthComponent.health = healthComponent.maxHealth;
        
        // Publish repair event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.hullRepaired', {
                entity: this.entity,
                health: healthComponent.health,
                maxHealth: healthComponent.maxHealth
            });
        }
        
        return cost;
    }
    
    /**
     * Repair ship shields
     * @returns {number} Cost of repair
     */
    repairShield() {
        const healthComponent = this.entity.getComponent('HealthComponent');
        if (!healthComponent) return 0;
        
        const shieldNeeded = healthComponent.maxShield - healthComponent.shield;
        const costPerUnit = 3;
        const cost = Math.ceil(shieldNeeded * costPerUnit);
        
        // Repair shield
        healthComponent.shield = healthComponent.maxShield;
        
        // Publish repair event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.shieldRepaired', {
                entity: this.entity,
                shield: healthComponent.shield,
                maxShield: healthComponent.maxShield
            });
        }
        
        return cost;
    }
    
    /**
     * Add credits to the ship
     * @param {number} amount Amount of credits to add
     */
    addCredits(amount) {
        this.credits += amount;
        
        // Publish credits added event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.creditsChanged', {
                entity: this.entity,
                credits: this.credits,
                change: amount
            });
        }
    }
    
    /**
     * Deduct credits from the ship
     * @param {number} amount Amount of credits to deduct
     * @returns {boolean} True if successful, false if insufficient credits
     */
    deductCredits(amount) {
        if (this.credits < amount) return false;
        
        this.credits -= amount;
        
        // Publish credits deducted event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('ship.creditsChanged', {
                entity: this.entity,
                credits: this.credits,
                change: -amount
            });
        }
        
        return true;
    }
} 