/**
 * System Registration Module - Handles deterministic system registration
 * 
 * This module contains all the logic for registering ECS systems in the exact
 * order required to maintain compatibility with existing behavior.
 */

import { CombatSystem } from '../../systems/combat/combatSystem.js';
import { EnemySystem } from '../../systems/combat/enemySystem.js';
import { RenderSystem } from '../../systems/rendering/renderSystem.js';
import { CollisionSystem } from '../../systems/physics/collisionSystem.js';
import { VisualEffectsSystem } from '../../systems/rendering/visualEffectsSystem.js';
import { TrailSystem } from '../../systems/rendering/trailSystem.js';
import { DeployableLaserSystem } from '../../systems/weapons/deployableLaserSystem.js';
import { DeploymentSystem } from '../../systems/deployables/deploymentSystem.js';
import { ExplosionHandler } from '../../systems/effects/explosionHandler.js';

export class SystemRegistrar {
    constructor() {
        this.registeredSystems = {};
    }

    /**
     * Register all combat systems with the ECS world in the correct order
     * CRITICAL: This order must be preserved to maintain existing behavior
     */
    async registerAllSystems(world, scene) {
        console.log("[COMBAT] Registering combat systems with ECS world...");
        
        try {
            // 1. Register the combat system
            this.registeredSystems.combatSystem = new CombatSystem(world);
            world.registerSystem(this.registeredSystems.combatSystem);
            
            // 2. Register the enemy system
            this.registeredSystems.enemySystem = new EnemySystem(world);
            world.registerSystem(this.registeredSystems.enemySystem);
            
            // GLOBAL ACCESS: Make the enemy system accessible to other modules
            if (window.game) {
                window.game.ecsWorld = window.game.ecsWorld || {};
                window.game.ecsWorld.enemySystem = this.registeredSystems.enemySystem;
                console.log("[COMBAT] Made enemy system globally available via window.game.ecsWorld.enemySystem");
            }
            
            // 3. Register the trail system for visual effects
            this.registeredSystems.trailSystem = new TrailSystem(world);
            world.registerSystem(this.registeredSystems.trailSystem);
            
            // 4. Register deployable laser systems
            try {
                this.registeredSystems.deployableLaserSystem = new DeployableLaserSystem(world);
                world.registerSystem(this.registeredSystems.deployableLaserSystem);
            } catch (error) {
                console.warn('[COMBAT] Failed to register DeployableLaserSystem:', error);
            }

            try {
                this.registeredSystems.deploymentSystem = new DeploymentSystem(world);
                world.registerSystem(this.registeredSystems.deploymentSystem);
            } catch (error) {
                console.warn('[COMBAT] Failed to register DeploymentSystem:', error);
            }
            
            // Add trail system to window.game for global access if game object exists
            if (window.game) {
                window.game.trailSystem = this.registeredSystems.trailSystem;
                console.log("[COMBAT] Registered trail system with window.game for global access");
            }
            
            // 5. Register the instanced renderer first
            try {
                const { InstancedRenderer } = await import('../../systems/rendering/InstancedRenderer.js');
                this.registeredSystems.instancedRenderer = new InstancedRenderer(world, scene);
                world.registerSystem(this.registeredSystems.instancedRenderer);
                console.log('[COMBAT] InstancedRenderer registered');
            } catch (e) {
                console.warn('[COMBAT] InstancedRenderer not available:', e);
            }

            // 6. Register the render system - this is critical for making meshes visible
            // Use the scene's camera reference if available
            const camera = scene.camera;
            
            if (!camera) {
                console.error("[COMBAT] No camera found on scene, enemies may not be visible");
            }
            
            // Log camera reference for debugging
            console.log(`[COMBAT] Camera reference for RenderSystem: ${camera ? "Available" : "Missing"}`);
            
            // Note: We're only passing the scene and camera, not the renderer
            // This avoids the issues with trying to call render() from the RenderSystem
            this.registeredSystems.renderSystem = new RenderSystem(world, scene, camera);
            world.registerSystem(this.registeredSystems.renderSystem);
            
            // 7. Register the CollisionSystem
            console.log("[COMBAT] Registering CollisionSystem with the world...");
            this.registeredSystems.collisionSystem = new CollisionSystem(world);
            world.registerSystem(this.registeredSystems.collisionSystem);
            console.log("[COMBAT] CollisionSystem registered");
            
            // 8. Register the VisualEffectsSystem
            console.log("[COMBAT] Registering VisualEffectsSystem with the world...");
            this.registeredSystems.visualEffectsSystem = new VisualEffectsSystem(world);
            world.registerSystem(this.registeredSystems.visualEffectsSystem);
            console.log("[COMBAT] VisualEffectsSystem registered");
            
            // 9. Register the ExplosionHandler for combat explosion effects
            console.log("[COMBAT] Registering ExplosionHandler with the world...");
            this.registeredSystems.explosionHandler = new ExplosionHandler(world);
            world.registerSystem(this.registeredSystems.explosionHandler);
            console.log("[COMBAT] ExplosionHandler registered");
            
            console.log("[COMBAT] All combat systems registered successfully");
            
            return this.registeredSystems;
        } catch (error) {
            console.error("[COMBAT] Error during system registration:", error);
            console.error("[COMBAT] Stack trace:", error.stack);
            throw error;
        }
    }

    /**
     * Get a specific system by name
     */
    getSystem(systemName) {
        return this.registeredSystems[systemName];
    }

    /**
     * Get all registered systems
     */
    getAllSystems() {
        return this.registeredSystems;
    }

    /**
     * Enable or disable all systems
     */
    setSystemsEnabled(enabled) {
        // Enable/disable ECS systems
        const systems = ['enemySystem', 'combatSystem'];
        
        for (const systemName of systems) {
            const system = this.registeredSystems[systemName];
            if (!system) continue;
            
            if (typeof system.setEnabled === 'function') {
                system.setEnabled(enabled);
            } else {
                system.enabled = enabled;
            }
        }
        
        console.log(`Combat systems ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Import and register a system dynamically
     * @param {string} path The path to the system module
     * @param {string} className The name of the system class
     * @param {Object} world The ECS world
     * @param {Object} scene The scene (optional)
     * @returns {Object} The system instance
     */
    async importAndRegisterSystem(path, className, world, scene = null) {
        try {
            // Add vite-ignore to allow dynamic imports
            // @ts-ignore
            const module = await import(/* @vite-ignore */ path);
            if (!module[className]) {
                console.error(`[COMBAT] System class ${className} not found in module ${path}`);
                return null;
            }
            
            const SystemClass = module[className];
            // Pass world and scene to systems that might need them for rendering or context
            let system;
            if (className === 'TrailSystem' || className === 'VisualEffectsSystem' || className === 'RenderSystem') {
                 // These systems might specifically need the scene
                system = new SystemClass(world, scene);
            } else {
                system = new SystemClass(world);
            }
            
            // Register the system
            world.registerSystem(system);
            
            // Store reference
            this.registeredSystems[className.toLowerCase()] = system;
            
            return system;
        } catch (error) {
            console.error(`[COMBAT] Error importing system ${className} from ${path}:`, error);
            return null;
        }
    }
}