/**
 * SystemManager - Manages the registration and execution of systems
 * 
 * Handles system priority, updates, and lifecycle.
 */

export class SystemManager {
    constructor(world) {
        this.world = world;
        this.systems = [];
        this.systemsByType = new Map();
    }
    
    /**
     * Register a system with the manager
     * @param {System} system The system to register
     * @returns {System} The registered system
     */
    registerSystem(system) {
        if (this.systemsByType.has(system.constructor.name)) {
            console.warn(`System of type ${system.constructor.name} already registered`);
            return system;
        }
        
        this.systems.push(system);
        this.systemsByType.set(system.constructor.name, system);
        
        // Sort systems by priority (lower = earlier)
        this.systems.sort((a, b) => a.priority - b.priority);
        
        return system;
    }
    
    /**
     * Get a system by type
     * @param {Function} systemType The system class type
     * @returns {System|undefined} The system instance or undefined if not found
     */
    getSystem(systemType) {
        return this.systemsByType.get(systemType.name);
    }
    
    /**
     * Update all enabled systems
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        for (const system of this.systems) {
            if (system.enabled) {
                system.update(deltaTime);
            }
        }
    }
    
    /**
     * Initialize all systems
     * Called once before the first update
     */
    initialize() {
        for (const system of this.systems) {
            if (typeof system.initialize === 'function') {
                system.initialize();
            }
        }
    }
    
    /**
     * Enable a system by type
     * @param {Function} systemType The system class type
     */
    enableSystem(systemType) {
        const system = this.getSystem(systemType);
        if (system) {
            system.enable();
        }
    }
    
    /**
     * Disable a system by type
     * @param {Function} systemType The system class type
     */
    disableSystem(systemType) {
        const system = this.getSystem(systemType);
        if (system) {
            system.disable();
        }
    }
}