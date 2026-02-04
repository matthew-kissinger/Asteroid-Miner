// spaceship.ts - Main spaceship class with delegation to specialized modules
// Refactored to improve maintainability and reduce file size

import * as THREE from 'three';
import { TrailEffects } from '../trail';
import { ShipModel } from './model/shipModel';
import { ShipUpgrades } from './systems/upgrades';
import { ShipDocking } from './systems/docking';
import { ShipServices } from './systems/services';
import { ShipVisualEffects } from './effects/visualEffects';
import { HealthSync } from './sync/healthSync';

interface ThrustState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

interface CargoState {
  iron: number;
  gold: number;
  platinum: number;
}

export class Spaceship {
  scene: THREE.Scene;
  mesh: THREE.Group | null;
  thrusters: Array<{ mesh: THREE.Mesh; type: string }>;
  leftCannon: THREE.Mesh | null;
  rightCannon: THREE.Mesh | null;
  leftEmitter: THREE.Mesh | null;
  rightEmitter: THREE.Mesh | null;
  miningLaser: THREE.Mesh | null;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  thrust: ThrustState;
  trailEffects: TrailEffects | null;
  shipScale: number;

  // Combat properties
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  isDestroyed: boolean;

  // Docking and fuel properties
  fuel: number;
  maxFuel: number;
  fuelConsumptionRate: number;
  isDocked: boolean;
  credits: number;

  // Cargo
  cargo: CargoState;

  // Ship capabilities
  maxVelocity: number;
  miningEfficiency: number;
  collisionResistance: number;
  scanRange: number;
  deployableLaserCount: number;

  // Specialized modules
  shipModel!: ShipModel;
  shipUpgrades!: ShipUpgrades | null;
  shipDocking!: ShipDocking | null;
  shipServices!: ShipServices;
  shipVisualEffects!: ShipVisualEffects | null;
  healthSync!: HealthSync;

  constructor(scene: THREE.Scene) {
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

    this.createSpaceship();

    // Initialize trail effects after spaceship mesh is created
    if (this.mesh) {
      this.trailEffects = new TrailEffects(this.scene, this.mesh as THREE.Group);
      // Start the ship invisible since it's docked
      (this.mesh as THREE.Group).visible = false;
    }
  }

  /**
   * Initialize specialized modules for different aspects of the ship
   */
  private _initializeModules(): void {
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
  createSpaceship(): void {
    this.mesh = this.shipModel.createSpaceship();
    const components = this.shipModel.getComponents();

    // Store component references
    this.thrusters = components.thrusters;
    this.leftCannon = components.leftCannon ?? null;
    this.rightCannon = components.rightCannon ?? null;
    this.leftEmitter = components.leftEmitter ?? null;
    this.rightEmitter = components.rightEmitter ?? null;
    this.miningLaser = components.miningLaser ?? null;

    // Initialize modules that need mesh components
    this.shipUpgrades = new ShipUpgrades(components);
    if (this.mesh) {
      this.shipDocking = new ShipDocking(this.mesh, this.scene);
    }
    this.shipVisualEffects = new ShipVisualEffects(components);
  }

  // Methods for updating spaceship state in game loop
  update(_deltaTime: number): void {
    // Update any continuous effects or animations
    if (this.updateParticles && !this.isDocked) {
      this.updateParticles();
    }
  }

  // VISUAL EFFECTS - Delegate to visual effects module
  activateMiningLaser(): void {
    this.shipVisualEffects?.activateMiningLaser();
  }

  deactivateMiningLaser(): void {
    this.shipVisualEffects?.deactivateMiningLaser();
  }

  updateParticles(): void {
    this.shipVisualEffects?.updateParticles(this.thrust, this.velocity, this.trailEffects);
  }

  updateTrailVisibility(isMoving: boolean): void {
    this.shipVisualEffects?.updateTrailVisibility(isMoving, this.thrust, this.velocity, this.trailEffects);
  }

  // DOCKING OPERATIONS - Delegate to docking module
  dock(): void {
    this.shipDocking?.dock(this, this.syncValuesToHealthComponent.bind(this));
  }

  undock(): THREE.Vector3 | undefined {
    return this.shipDocking?.undock(this, this.syncValuesToHealthComponent.bind(this));
  }

  // SERVICE OPERATIONS - Delegate to services module
  refuel(): number | undefined {
    return this.shipServices.refuel(this);
  }

  repairShield(): number | undefined {
    return this.shipServices.repairShield(this, this.syncValuesToHealthComponent.bind(this));
  }

  repairHull(): number | undefined {
    return this.shipServices.repairHull(this, this.syncValuesToHealthComponent.bind(this));
  }

  consumeFuel(): boolean | undefined {
    return this.shipServices.consumeFuel(this, this.thrust);
  }

  // UPGRADE OPERATIONS - Delegate to upgrades module
  upgradeFuelTank(): number | undefined {
    return this.shipUpgrades?.upgradeFuelTank(this);
  }

  upgradeEngine(): number | undefined {
    return this.shipUpgrades?.upgradeEngine(this);
  }

  upgradeMiningLaser(): number | undefined {
    return this.shipUpgrades?.upgradeMiningLaser(this);
  }

  upgradeHull(): number | undefined {
    return this.shipUpgrades?.upgradeHull(this);
  }

  upgradeScanner(): number | undefined {
    return this.shipUpgrades?.upgradeScanner(this);
  }

  // Upgrade level access methods
  get fuelTankLevel(): number {
    return this.shipUpgrades?.fuelTankLevel || 1;
  }

  get fuelUpgradeCost(): number {
    return this.shipUpgrades?.fuelUpgradeCost || 1000;
  }

  get engineLevel(): number {
    return this.shipUpgrades?.engineLevel || 1;
  }

  get engineUpgradeCost(): number {
    return this.shipUpgrades?.engineUpgradeCost || 800;
  }

  get miningLevel(): number {
    return this.shipUpgrades?.miningLevel || 1;
  }

  get miningUpgradeCost(): number {
    return this.shipUpgrades?.miningUpgradeCost || 1200;
  }

  get hullLevel(): number {
    return this.shipUpgrades?.hullLevel || 1;
  }

  get hullUpgradeCost(): number {
    return this.shipUpgrades?.hullUpgradeCost || 1500;
  }

  get scannerLevel(): number {
    return this.shipUpgrades?.scannerLevel || 1;
  }

  get scannerUpgradeCost(): number {
    return this.shipUpgrades?.scannerUpgradeCost || 600;
  }

  // HEALTH SYNCHRONIZATION - Delegate to health sync module
  subscribeToDestructionEvents(messageBus: any): void {
    this.healthSync.subscribeToDestructionEvents(messageBus, this.handleDestruction.bind(this));
  }

  syncValuesToHealthComponent(): void {
    this.healthSync.syncValuesToHealthComponent(this);
  }

  /**
   * Handle ship destruction effects
   */
  handleDestruction(hull: number, shield: number): void {
    this.isDestroyed = true;
    this.hull = hull;
    this.shield = shield;

    // Visual and behavioral changes for destroyed state
    if (this.mesh) {
      // Disable thrusters via trail effects
      if (this.trailEffects && (this.trailEffects as any).particleSystems) {
        (this.trailEffects as any).particleSystems.forEach((ps: any) => {
          if (ps && ps.system) {
            ps.system.visible = false;
          }
        });
      }
    }
  }

  // POSITION AND ROTATION ACCESS (for external systems)
  get position(): THREE.Vector3 {
    return this.mesh ? this.mesh.position : new THREE.Vector3(0, 0, 0);
  }

  set position(newPosition: THREE.Vector3) {
    if (this.mesh) {
      this.mesh.position.copy(newPosition);
    }
  }

  // UNDOCK LOCATION ACCESS
  get undockLocation(): THREE.Vector3 {
    return this.shipDocking?.getUndockLocation() || new THREE.Vector3(0, 10000, 0);
  }

  set undockLocation(location: THREE.Vector3) {
    if (this.shipDocking) {
      this.shipDocking.setUndockLocation(location);
    }
  }
}
