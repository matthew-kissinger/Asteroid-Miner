/**
 * SystemManager - Manages the registration and execution of systems
 * 
 * Handles system priority, updates, and lifecycle.
 */

import type { World } from './world.js';
import type { System } from './system.js';

export class SystemManager {
    public world: World;
    public systems: System[];
    public systemsByType: Map<string, System>;
    private _tick: number;

    constructor(world: World) {
        this.world = world;
        this.systems = [];
        this.systemsByType = new Map();
        // perf timings bucket
        if (!(window as any).__perf) (window as any).__perf = { systems: {} };
        this._tick = 0;
    }
    
    /**
     * Register a system with the manager
     * @param {System} system The system to register
     * @returns {System} The registered system
     */
    registerSystem(system: System): System {
        const systemType = (system as any).type || system.constructor.name;
        if (this.systemsByType.has(systemType)) {
            console.warn(`System of type ${systemType} already registered`);
            return system;
        }

        this.systems.push(system);
        this.systemsByType.set(systemType, system);

        // Sort systems by priority (lower = earlier)
        this.systems.sort((a, b) => a.priority - b.priority);

        return system;
    }
    
    /**
     * Get a system by type
     * @param {any} systemType The system class type
     * @returns {System|undefined} The system instance or undefined if not found
     */
    getSystem(systemType: any): System | undefined {
        const typeName = systemType.type || systemType.name;
        return this.systemsByType.get(typeName);
    }
    
    /**
     * Update all enabled systems
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime: number): void {
        this._tick = (this._tick + 1) >>> 0;
        for (const system of this.systems) {
            if (!system.enabled) continue;
            // Stagger heavy systems every 2 ticks (example heuristic)
            const name = (system as any).type || system.constructor.name;
            const isHeavy = name === 'EnemySystem' || name === 'CollisionSystem' || name === 'TargetingSystem';
            if (isHeavy && (this._tick & 1) === 1) {
                continue;
            }
            const t0 = performance.now();
            system.update(deltaTime);
            const t1 = performance.now();
            if ((window as any).__perf) {
                if (!(window as any).__perf.systems) (window as any).__perf.systems = {};
                (window as any).__perf.systems[name] = Number(t1 - t0);
            }
        }
    }
    
    /**
     * Initialize all systems
     * Called once before the first update
     */
    initialize(): void {
        for (const system of this.systems) {
            if (typeof system.initialize === 'function') {
                system.initialize();
            }
        }
    }
    
    /**
     * Enable a system by type
     * @param {any} systemType The system class type
     */
    enableSystem(systemType: any): void {
        const system = this.getSystem(systemType);
        if (system) {
            system.enable();
        }
    }
    
    /**
     * Disable a system by type
     * @param {any} systemType The system class type
     */
    disableSystem(systemType: any): void {
        const system = this.getSystem(systemType);
        if (system) {
            system.disable();
        }
    }
}
