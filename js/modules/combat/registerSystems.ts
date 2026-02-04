/**
 * System Registration Module - Handles deterministic system registration
 *
 * NOTE: Legacy ECS systems have been removed in favor of bitECS. This module is
 * retained as a no-op shim to preserve existing call sites.
 */

import * as THREE from 'three';

export class SystemRegistrar {
    registeredSystems: Record<string, any> = {};

    constructor() {
    }

    /**
     * Register all combat systems with the ECS world in the correct order
     * (legacy no-op shim).
     */
    async registerAllSystems(world: any, scene: THREE.Scene): Promise<any> {
        void world;
        void scene;

        console.warn('[COMBAT] Legacy ECS systems removed; SystemRegistrar is a no-op.');
        this.registeredSystems = {};
        return this.registeredSystems;
    }

    /**
     * Get a specific system by name
     */
    getSystem(systemName: string): any {
        return this.registeredSystems[systemName];
    }

    /**
     * Get all registered systems
     */
    getAllSystems(): Record<string, any> {
        return this.registeredSystems;
    }

    /**
     * Enable or disable all systems (legacy no-op shim).
     */
    setSystemsEnabled(enabled: boolean): void {
        void enabled;
        console.warn('[COMBAT] setSystemsEnabled called on legacy SystemRegistrar.');
    }

    /**
     * Import and register a system dynamically (legacy no-op shim).
     * @param path The path to the system module
     * @param className The name of the system class
     * @param world The ECS world
     * @param scene The scene (optional)
     * @returns null
     */
    async importAndRegisterSystem(
        path: string,
        className: string,
        world: any,
        scene: any = null
    ): Promise<any> {
        void path;
        void className;
        void world;
        void scene;

        console.warn('[COMBAT] importAndRegisterSystem called on legacy SystemRegistrar.');
        return null;
    }
}
