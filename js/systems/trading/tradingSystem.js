/**
 * TradingSystem - Handles trading operations between player and stargate
 * 
 * This system manages selling resources, buying upgrades, and other trading operations
 * that occur when docked with the stargate.
 */

import { System } from '../../core/system.ts';

export class TradingSystem extends System {
    constructor(world) {
        super(world);
        
        // Required components for entities this system processes
        this.requiredComponents = [];
        
        // Reference to UI
        this.ui = null;
        
        // Market prices for resources (per unit)
        this.resourcePrices = {
            iron: 15,
            copper: 25,
            gold: 100,
            platinum: 200,
            diamond: 500,
            uranium: 350,
            titanium: 150,
            helium: 250,
            palladium: 300,
            rhodium: 400
        };
        
        // Reference to entities
        this.player = null;
        
        // Subscribe to relevant events
        this.world.messageBus.subscribe('player.created', this.handlePlayerCreated.bind(this));
        this.world.messageBus.subscribe('ui.created', this.handleUICreated.bind(this));
        this.world.messageBus.subscribe('player.docked', this.setupTradingInterface.bind(this));
        this.world.messageBus.subscribe('player.undocked', this.hideTradingInterface.bind(this));
        this.world.messageBus.subscribe('trading.sellResource', this.handleSellResource.bind(this));
        this.world.messageBus.subscribe('trading.buyUpgrade', this.handleBuyUpgrade.bind(this));
        this.world.messageBus.subscribe('trading.refuel', this.handleRefuel.bind(this));
        this.world.messageBus.subscribe('trading.repair', this.handleRepair.bind(this));
    }

    /**
     * Initialize the trading system
     */
    initialize() {
        console.log('Trading System initialized');
    }
    
    /**
     * Handle player entity creation
     * @param {Object} data Event data
     */
    handlePlayerCreated(data) {
        this.player = data.entity;
    }
    
    /**
     * Handle UI creation
     * @param {Object} data Event data
     */
    handleUICreated(data) {
        this.ui = data.ui;
    }
    
    /**
     * Setup the trading interface when player is docked
     */
    setupTradingInterface() {
        if (!this.player || !this.ui) return;
        
        // Setup selling resources UI
        this.setupSellingButtons();
        
        // Setup upgrade buttons
        this.setupUpgradeButtons();
        
        // Setup refuel and repair buttons
        this.setupServiceButtons();
        
        // Show stargate UI
        this.ui.showStargateUI();
    }
    
    /**
     * Hide trading interface when player undocks
     */
    hideTradingInterface() {
        if (this.ui) {
            this.ui.hideStargateUI();
        }
    }
    
    /**
     * Setup selling resource buttons
     */
    setupSellingButtons() {
        if (!this.ui) return;
        
        // Get cargo component from player
        const cargo = this.player.getComponent('CargoComponent');
        const shipState = this.player.getComponent('ShipStateComponent');
        
        if (!cargo || !shipState) return;
        
        // Create selling buttons for each resource type
        for (const resourceType in cargo.resources) {
            const amount = cargo.resources[resourceType];
            const price = this.resourcePrices[resourceType] || 10;
            
            if (amount > 0) {
                // Create or update the sell button
                this.ui.updateSellResourceButton(
                    resourceType,
                    amount,
                    price,
                    () => {
                        this.world.messageBus.publish('trading.sellResource', {
                            resourceType,
                            amount,
                            price
                        });
                    }
                );
            } else {
                // Hide the button if no resources of this type
                this.ui.hideSellResourceButton(resourceType);
            }
        }
        
        // Update credit display
        this.ui.updateCredits(shipState.credits);
    }
    
    /**
     * Setup upgrade buttons
     */
    setupUpgradeButtons() {
        if (!this.ui) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        if (!shipState) return;
        
        // Engine upgrades
        this.ui.updateUpgradeButton(
            'engine',
            shipState.engineLevel,
            shipState.engineUpgradeCost,
            () => {
                this.world.messageBus.publish('trading.buyUpgrade', {
                    upgradeType: 'engine',
                    cost: shipState.engineUpgradeCost
                });
            },
            shipState.credits >= shipState.engineUpgradeCost
        );
        
        // Fuel tank upgrades
        this.ui.updateUpgradeButton(
            'fuelTank',
            shipState.fuelTankLevel,
            shipState.fuelTankUpgradeCost,
            () => {
                this.world.messageBus.publish('trading.buyUpgrade', {
                    upgradeType: 'fuelTank',
                    cost: shipState.fuelTankUpgradeCost
                });
            },
            shipState.credits >= shipState.fuelTankUpgradeCost
        );
        
        // Hull upgrades
        this.ui.updateUpgradeButton(
            'hull',
            shipState.hullLevel,
            shipState.hullUpgradeCost,
            () => {
                this.world.messageBus.publish('trading.buyUpgrade', {
                    upgradeType: 'hull',
                    cost: shipState.hullUpgradeCost
                });
            },
            shipState.credits >= shipState.hullUpgradeCost
        );
        
        // Shield upgrades
        this.ui.updateUpgradeButton(
            'shield',
            shipState.shieldLevel,
            shipState.shieldUpgradeCost,
            () => {
                this.world.messageBus.publish('trading.buyUpgrade', {
                    upgradeType: 'shield',
                    cost: shipState.shieldUpgradeCost
                });
            },
            shipState.credits >= shipState.shieldUpgradeCost
        );
        
        // Mining upgrades
        this.ui.updateUpgradeButton(
            'mining',
            shipState.miningLevel,
            shipState.miningUpgradeCost,
            () => {
                this.world.messageBus.publish('trading.buyUpgrade', {
                    upgradeType: 'mining',
                    cost: shipState.miningUpgradeCost
                });
            },
            shipState.credits >= shipState.miningUpgradeCost
        );
        
        // Scanner upgrades
        this.ui.updateUpgradeButton(
            'scanner',
            shipState.scannerLevel,
            shipState.scannerUpgradeCost,
            () => {
                this.world.messageBus.publish('trading.buyUpgrade', {
                    upgradeType: 'scanner',
                    cost: shipState.scannerUpgradeCost
                });
            },
            shipState.credits >= shipState.scannerUpgradeCost
        );
        
        // Weapon upgrades
        this.ui.updateUpgradeButton(
            'weapon',
            shipState.weaponLevel,
            shipState.weaponUpgradeCost,
            () => {
                this.world.messageBus.publish('trading.buyUpgrade', {
                    upgradeType: 'weapon',
                    cost: shipState.weaponUpgradeCost
                });
            },
            shipState.credits >= shipState.weaponUpgradeCost
        );
    }
    
    /**
     * Setup service buttons (refuel, repair)
     */
    setupServiceButtons() {
        if (!this.ui) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        const health = this.player.getComponent('HealthComponent');
        
        if (!shipState || !health) return;
        
        // Refuel button
        const fuelNeeded = shipState.maxFuel - shipState.fuel;
        const refuelCost = Math.ceil(fuelNeeded * 2); // 2 credits per unit
        
        this.ui.updateRefuelButton(
            shipState.fuel,
            shipState.maxFuel,
            refuelCost,
            () => {
                this.world.messageBus.publish('trading.refuel', {
                    cost: refuelCost
                });
            },
            fuelNeeded > 0 && shipState.credits >= refuelCost
        );
        
        // Repair hull button
        const hullDamage = health.maxHealth - health.health;
        const hullRepairCost = Math.ceil(hullDamage * 4); // 4 credits per unit
        
        this.ui.updateRepairButton(
            'hull',
            health.health,
            health.maxHealth,
            hullRepairCost,
            () => {
                this.world.messageBus.publish('trading.repair', {
                    type: 'hull',
                    cost: hullRepairCost
                });
            },
            hullDamage > 0 && shipState.credits >= hullRepairCost
        );
        
        // Repair shield button
        const shieldDamage = health.maxShield - health.shield;
        const shieldRepairCost = Math.ceil(shieldDamage * 3); // 3 credits per unit
        
        this.ui.updateRepairButton(
            'shield',
            health.shield,
            health.maxShield,
            shieldRepairCost,
            () => {
                this.world.messageBus.publish('trading.repair', {
                    type: 'shield',
                    cost: shieldRepairCost
                });
            },
            shieldDamage > 0 && shipState.credits >= shieldRepairCost
        );
    }
    
    /**
     * Handle selling resources
     * @param {Object} data Event data (resourceType, amount, price)
     */
    handleSellResource(data) {
        const { resourceType, amount, price } = data;
        
        if (!this.player) return;
        
        const cargo = this.player.getComponent('CargoComponent');
        const shipState = this.player.getComponent('ShipStateComponent');
        
        if (!cargo || !shipState) return;
        
        // Check if player has the resource
        if (cargo.resources[resourceType] >= amount) {
            // Calculate total price
            const totalPrice = amount * price;
            
            // Remove resource from cargo
            cargo.resources[resourceType] -= amount;
            
            // Add credits to player
            shipState.addCredits(totalPrice);
            
            // Update UI
            if (this.ui) {
                this.ui.updateCredits(shipState.credits);
                this.ui.updateCargoDisplay(cargo.resources, cargo.currentCapacity, cargo.maxCapacity);
                
                // Feedback message
                this.ui.showMessage(`Sold ${amount} ${resourceType} for ${totalPrice} credits`);
            }
            
            // Update selling buttons
            this.setupSellingButtons();
            // Update upgrade buttons (since credits changed)
            this.setupUpgradeButtons();
            // Update service buttons
            this.setupServiceButtons();
            
            console.log(`Sold ${amount} ${resourceType} for ${totalPrice} credits`);
        }
    }
    
    /**
     * Handle buying upgrades
     * @param {Object} data Event data (upgradeType, cost)
     */
    handleBuyUpgrade(data) {
        const { upgradeType, cost } = data;
        
        if (!this.player) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        if (!shipState) return;
        
        // Check if player has enough credits
        if (shipState.credits >= cost) {
            let upgradeSuccess = false;
            let newLevel = 1;
            
            // Perform the upgrade based on type
            switch (upgradeType) {
                case 'engine':
                    shipState.deductCredits(shipState.upgradeEngine());
                    newLevel = shipState.engineLevel;
                    upgradeSuccess = true;
                    break;
                    
                case 'fuelTank':
                    shipState.deductCredits(shipState.upgradeFuelTank());
                    newLevel = shipState.fuelTankLevel;
                    upgradeSuccess = true;
                    break;
                    
                case 'hull':
                    shipState.deductCredits(shipState.upgradeHull());
                    newLevel = shipState.hullLevel;
                    upgradeSuccess = true;
                    break;
                    
                case 'shield':
                    shipState.deductCredits(shipState.upgradeShield());
                    newLevel = shipState.shieldLevel;
                    upgradeSuccess = true;
                    break;
                    
                case 'mining':
                    shipState.deductCredits(shipState.upgradeMiningLaser());
                    newLevel = shipState.miningLevel;
                    upgradeSuccess = true;
                    break;
                    
                case 'scanner':
                    shipState.deductCredits(shipState.upgradeScanner());
                    newLevel = shipState.scannerLevel;
                    upgradeSuccess = true;
                    break;
                    
                case 'weapon':
                    shipState.deductCredits(shipState.upgradeWeapons());
                    newLevel = shipState.weaponLevel;
                    upgradeSuccess = true;
                    break;
                    
                default:
                    console.error(`Unknown upgrade type: ${upgradeType}`);
            }
            
            if (upgradeSuccess) {
                // Update UI
                if (this.ui) {
                    this.ui.updateCredits(shipState.credits);
                    this.ui.showMessage(`Upgraded ${upgradeType} to level ${newLevel}`);
                }
                
                // Update buttons
                this.setupUpgradeButtons();
                // Update service buttons (credits changed)
                this.setupServiceButtons();
                
                console.log(`Upgraded ${upgradeType} to level ${newLevel}`);
            }
        }
    }
    
    /**
     * Handle refueling
     * @param {Object} data Event data (cost)
     */
    handleRefuel(data) {
        const { cost } = data;
        
        if (!this.player) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        if (!shipState) return;
        
        // Check if player has enough credits
        if (shipState.credits >= cost) {
            // Refuel the ship and deduct credits
            const refuelCost = shipState.refuel();
            shipState.deductCredits(refuelCost);
            
            // Update UI
            if (this.ui) {
                this.ui.updateCredits(shipState.credits);
                this.ui.updateFuelDisplay(shipState.fuel, shipState.maxFuel);
                this.ui.showMessage(`Refueled ship for ${refuelCost} credits`);
            }
            
            // Update buttons
            this.setupServiceButtons();
            // Update upgrade buttons (credits changed)
            this.setupUpgradeButtons();
            
            console.log(`Refueled ship for ${refuelCost} credits`);
        }
    }
    
    /**
     * Handle repairs
     * @param {Object} data Event data (type, cost)
     */
    handleRepair(data) {
        const { type, cost } = data;
        
        if (!this.player) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        const health = this.player.getComponent('HealthComponent');
        
        if (!shipState || !health) return;
        
        // Check if player has enough credits
        if (shipState.credits >= cost) {
            let repairCost = 0;
            
            // Perform repair based on type
            if (type === 'hull') {
                repairCost = shipState.repairHull();
                shipState.deductCredits(repairCost);
            } else if (type === 'shield') {
                repairCost = shipState.repairShield();
                shipState.deductCredits(repairCost);
            }
            
            // Update UI
            if (this.ui) {
                this.ui.updateCredits(shipState.credits);
                this.ui.updateHealthDisplay(health.health, health.maxHealth, health.shield, health.maxShield);
                this.ui.showMessage(`Repaired ${type} for ${repairCost} credits`);
            }
            
            // Update buttons
            this.setupServiceButtons();
            // Update upgrade buttons (credits changed)
            this.setupUpgradeButtons();
            
            console.log(`Repaired ${type} for ${repairCost} credits`);
        }
    }
    
    /**
     * Update method called each frame
     * @param {number} deltaTime Time elapsed since last update
     */
    update(deltaTime) {
        // Nothing to update each frame for trading
    }
} 