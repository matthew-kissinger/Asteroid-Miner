// spaceship.js - Main spaceship class with delegation to specialized modules
// Refactored to improve maintainability and reduce file size

import * as THREE from 'three';
import { TrailEffects } from '../trail.js';
import { ShipModel } from './model/shipModel.js';
import { ShipUpgrades } from './systems/upgrades.js';
import { ShipDocking } from './systems/docking.js';
import { ShipServices } from './systems/services.js';
import { ShipVisualEffects } from './effects/visualEffects.js';
import { HealthSync } from './sync/healthSync.js';

export class Spaceship {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.thrusters = [];
        this.leftCannon = null;
        this.rightCannon = null;
        this.leftEmitter = null;
        this.rightEmitter = null;
        this.miningLaser = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.thrust = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            boost: false
        };
        this.trailEffects = null;
        this.shipScale = 2.0;
        
        // Combat properties
        this.hull = 100;
        this.maxHull = 100;
        this.shield = 50;
        this.maxShield = 50;
        this.isDestroyed = false;
        
        // Docking and fuel properties
        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelConsumptionRate = 0.01;
        this.isDocked = true;
        this.credits = 1000;
        
        // Initialize cargo (empty by default)
        this.cargo = {
            iron: 0,
            gold: 0,
            platinum: 0
        };
        
        // Ship capabilities
        this.maxVelocity = 25.0;
        this.miningEfficiency = 1.0;
        this.collisionResistance = 1.0;
        this.scanRange = 1000;
        this.deployableLaserCount = 0;
        
        // Initialize specialized modules
        this._initializeModules();
        
        console.log("Creating spaceship...");
        this.createSpaceship();
        
        // Initialize trail effects after spaceship mesh is created
        this.trailEffects = new TrailEffects(this.scene, this.mesh);
        
        // Start the ship invisible since it's docked
        if (this.mesh) {
            this.mesh.visible = false;
        }
        
        console.log("Spaceship created successfully (docked state)");
    }

    /**
     * Initialize specialized modules for different aspects of the ship
     */
    _initializeModules() {
        // Model creation module
        this.shipModel = new ShipModel(this.scene, this.shipScale);
        
        // These will be initialized after mesh creation
        this.shipUpgrades = null;
        this.shipDocking = null;
        this.shipServices = new ShipServices();
        this.shipVisualEffects = null;
        this.healthSync = new HealthSync();
    }

    /**
     * Create the spaceship using the model module
     */
    createSpaceship() {
        this.mesh = this.shipModel.createSpaceship();
        const components = this.shipModel.getComponents();
        
        // Store component references
        this.thrusters = components.thrusters;
        this.leftCannon = components.leftCannon;
        this.rightCannon = components.rightCannon;
        this.leftEmitter = components.leftEmitter;
        this.rightEmitter = components.rightEmitter;
        this.miningLaser = components.miningLaser;
        
        // Initialize modules that need mesh components
        this.shipUpgrades = new ShipUpgrades(components);
        this.shipDocking = new ShipDocking(this.mesh, this.scene);
        this.shipVisualEffects = new ShipVisualEffects(components);
    }

    // Methods for updating spaceship state in game loop
    update(deltaTime) {
        // Update any continuous effects or animations
        if (this.updateParticles && !this.isDocked) {
            this.updateParticles();
        }
    }

    // VISUAL EFFECTS - Delegate to visual effects module
    activateMiningLaser() { this.shipVisualEffects.activateMiningLaser(); }
    deactivateMiningLaser() { this.shipVisualEffects.deactivateMiningLaser(); }
    updateParticles() { this.shipVisualEffects.updateParticles(this.thrust, this.velocity, this.trailEffects); }
    updateTrailVisibility(isMoving) { this.shipVisualEffects.updateTrailVisibility(isMoving, this.thrust, this.velocity, this.trailEffects); }

    // DOCKING OPERATIONS - Delegate to docking module
    dock() { this.shipDocking.dock(this, this.syncValuesToHealthComponent.bind(this)); }
    undock() { return this.shipDocking.undock(this, this.syncValuesToHealthComponent.bind(this)); }

    // SERVICE OPERATIONS - Delegate to services module
    refuel() { return this.shipServices.refuel(this); }
    repairShield() { return this.shipServices.repairShield(this, this.syncValuesToHealthComponent.bind(this)); }
    repairHull() { return this.shipServices.repairHull(this, this.syncValuesToHealthComponent.bind(this)); }
    consumeFuel() { return this.shipServices.consumeFuel(this, this.thrust); }

    // UPGRADE OPERATIONS - Delegate to upgrades module
    upgradeFuelTank() { return this.shipUpgrades.upgradeFuelTank(this); }
    upgradeEngine() { return this.shipUpgrades.upgradeEngine(this); }
    upgradeMiningLaser() { return this.shipUpgrades.upgradeMiningLaser(this); }
    upgradeHull() { return this.shipUpgrades.upgradeHull(this); }
    upgradeScanner() { return this.shipUpgrades.upgradeScanner(this); }

    // Upgrade level access methods
    get fuelTankLevel() { return this.shipUpgrades?.fuelTankLevel || 1; }
    get fuelUpgradeCost() { return this.shipUpgrades?.fuelUpgradeCost || 1000; }
    get engineLevel() { return this.shipUpgrades?.engineLevel || 1; }
    get engineUpgradeCost() { return this.shipUpgrades?.engineUpgradeCost || 800; }
    get miningLevel() { return this.shipUpgrades?.miningLevel || 1; }
    get miningUpgradeCost() { return this.shipUpgrades?.miningUpgradeCost || 1200; }
    get hullLevel() { return this.shipUpgrades?.hullLevel || 1; }
    get hullUpgradeCost() { return this.shipUpgrades?.hullUpgradeCost || 1500; }
    get scannerLevel() { return this.shipUpgrades?.scannerLevel || 1; }
    get scannerUpgradeCost() { return this.shipUpgrades?.scannerUpgradeCost || 600; }

    // HEALTH SYNCHRONIZATION - Delegate to health sync module
    subscribeToDestructionEvents(messageBus) { this.healthSync.subscribeToDestructionEvents(messageBus, this.handleDestruction.bind(this)); }
    syncValuesToHealthComponent() { this.healthSync.syncValuesToHealthComponent(this); }

    /**
     * Handle ship destruction effects
     */
    handleDestruction(hull, shield) {
        this.isDestroyed = true;
        this.hull = hull;
        this.shield = shield;
        
        // Visual and behavioral changes for destroyed state
        if (this.mesh) {
            // Disable thrusters via trail effects
            if (this.trailEffects) {
                this.trailEffects.particleSystems.forEach(ps => {
                    if (ps && ps.system) {
                        ps.system.visible = false;
                    }
                });
            }
        }
    }

    // POSITION AND ROTATION ACCESS (for external systems)
    get position() {
        return this.mesh ? this.mesh.position : new THREE.Vector3(0, 0, 0);
    }

    get rotation() {
        return this.mesh ? this.mesh.rotation : new THREE.Euler(0, 0, 0);
    }

    set position(newPosition) {
        if (this.mesh) {
            this.mesh.position.copy(newPosition);
        }
    }

    set rotation(newRotation) {
        if (this.mesh) {
            this.mesh.rotation.copy(newRotation);
        }
    }

    // UNDOCK LOCATION ACCESS
    get undockLocation() {
        return this.shipDocking?.getUndockLocation() || new THREE.Vector3(0, 10000, 0);
    }

    set undockLocation(location) {
        if (this.shipDocking) {
            this.shipDocking.setUndockLocation(location);
        }
    }
}