/**
 * SystemRegistry - Manages registration and initialization of ECS systems
 * 
 * This module handles registration and initialization of all ECS systems
 * and ensures they are run in the proper order during the game loop.
 */

// System imports
import { InputSystem } from './input/inputSystem.js';
import { TouchInputSystem } from './input/touchInputSystem.js';
import { ShipControlSystem } from './input/shipControlSystem.js';
import { PhysicsSystem } from './physics/physicsSystem.js';
import { CameraSystem } from './rendering/cameraSystem.js';
import { RenderSystem } from './rendering/renderSystem.js';
import { DockingSystem } from './docking/dockingSystem.js';
import { TradingSystem } from './trading/tradingSystem.js';
import { MiningSystem } from './mining/miningSystem.js';
import { AsteroidSystem } from './asteroid/asteroidSystem.js';
import { CollisionSystem } from './physics/collisionSystem.js';
import { HealthSystem } from './entity/healthSystem.js';
import { UISystem } from './ui/uiSystem.js';
import { MobileDetector } from '../utils/mobileDetector.js';

export class SystemRegistry {
    constructor(world) {
        this.world = world;
        this.systems = [];
        this.isMobile = MobileDetector.isMobile();
    }
    
    /**
     * Register all systems
     */
    registerSystems() {
        // Input systems (handle user input)
        if (this.isMobile) {
            // On mobile, use TouchInputSystem
            this.registerSystem(new TouchInputSystem(this.world));
            console.log('Registered TouchInputSystem for mobile device');
        } else {
            // On desktop, use regular InputSystem
            this.registerSystem(new InputSystem(this.world));
            console.log('Registered InputSystem for desktop device');
        }
        
        // Ship control system (handles input translation to ship actions)
        this.registerSystem(new ShipControlSystem(this.world));
        
        // Physics systems (handle movement and collisions)
        this.registerSystem(new PhysicsSystem(this.world));
        this.registerSystem(new CollisionSystem(this.world));
        
        // Game systems (handle game mechanics)
        this.registerSystem(new DockingSystem(this.world));
        this.registerSystem(new TradingSystem(this.world));
        this.registerSystem(new MiningSystem(this.world));
        this.registerSystem(new AsteroidSystem(this.world));
        this.registerSystem(new HealthSystem(this.world));
        
        // Rendering systems (handle visual representation)
        this.registerSystem(new CameraSystem(this.world));
        this.registerSystem(new RenderSystem(this.world));
        
        // UI system (handle user interface)
        this.registerSystem(new UISystem(this.world));
        
        console.log(`Registered ${this.systems.length} systems`);
    }
    
    /**
     * Register a system
     * @param {System} system System to register
     */
    registerSystem(system) {
        this.systems.push(system);
    }
    
    /**
     * Initialize all registered systems
     */
    initializeSystems() {
        for (const system of this.systems) {
            system.initialize();
        }
        console.log('All systems initialized');
    }
    
    /**
     * Update all registered systems
     * @param {number} deltaTime Time elapsed since last update
     */
    updateSystems(deltaTime) {
        for (const system of this.systems) {
            system.update(deltaTime);
        }
    }
    
    /**
     * Get a system by its constructor name
     * @param {string} systemName Constructor name of the system
     * @returns {System|null} The system instance or null if not found
     */
    getSystem(systemName) {
        return this.systems.find(system => system.constructor.name === systemName) || null;
    }
} 