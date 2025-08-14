// services.js - Ship service operations (refuel, repair)
// Extracted from spaceship.js to improve maintainability

export class ShipServices {
    constructor() {
        // Service operations don't need complex initialization
    }

    /**
     * Refuel the spaceship to maximum capacity
     * @param {object} spaceshipState Reference to spaceship state
     * @returns {number} Cost of refueling
     */
    refuel(spaceshipState) {
        console.log("Refueling spaceship");
        spaceshipState.fuel = spaceshipState.maxFuel;
        return 100; // Cost of refueling
    }

    /**
     * Repair the ship's shield system
     * @param {object} spaceshipState Reference to spaceship state
     * @param {function} syncCallback Callback to sync values to health component
     * @returns {number} Cost of shield repair
     */
    repairShield(spaceshipState, syncCallback) {
        const oldShield = spaceshipState.shield;
        console.log(`===== SHIELD REPAIR INITIATED =====`);
        console.log(`Repairing shield: ${oldShield} → ${spaceshipState.maxShield}`);
        
        // CRITICAL FIX: Set and verify shield repair
        spaceshipState.shield = spaceshipState.maxShield;
        console.log(`Shield value is now: ${spaceshipState.shield} (Expected: ${spaceshipState.maxShield})`);
        
        // Log full spaceship state for debugging
        console.log("Full spaceship state after shield repair:", {
            shield: spaceshipState.shield,
            maxShield: spaceshipState.maxShield,
            hull: spaceshipState.hull,
            maxHull: spaceshipState.maxHull,
            fuel: spaceshipState.fuel,
            maxFuel: spaceshipState.maxFuel
        });
        console.log(`===== SHIELD REPAIR COMPLETED =====`);
        
        // Sync the updated shield value to the player entity's HealthComponent
        // Use direct entity access for more reliable syncing
        if (window.game && window.game.world) {
            try {
                const players = window.game.world.getEntitiesByTag('player');
                if (players && players.length > 0) {
                    const health = players[0].getComponent('HealthComponent');
                    if (health) {
                        // Update shield directly on the component
                        const oldHealthShield = health.shield;
                        health.shield = spaceshipState.shield;
                        console.log(`Direct shield update on HealthComponent: ${oldHealthShield} → ${health.shield}`);
                    }
                }
            } catch (e) {
                console.error("Error during direct HealthComponent update:", e);
            }
        }
        
        // Also use the normal sync method
        if (syncCallback) {
            syncCallback();
        }
        
        return 150; // Cost of shield repair
    }

    /**
     * Repair the ship's hull structure
     * @param {object} spaceshipState Reference to spaceship state
     * @param {function} syncCallback Callback to sync values to health component
     * @returns {number} Cost of hull repair
     */
    repairHull(spaceshipState, syncCallback) {
        const oldHull = spaceshipState.hull;
        console.log(`===== HULL REPAIR INITIATED =====`);
        console.log(`Repairing hull: ${oldHull} → ${spaceshipState.maxHull}`);
        
        // CRITICAL FIX: Set and verify hull repair
        spaceshipState.hull = spaceshipState.maxHull;
        console.log(`Hull value is now: ${spaceshipState.hull} (Expected: ${spaceshipState.maxHull})`);
        
        // Log full spaceship state for debugging
        console.log("Full spaceship state after hull repair:", {
            shield: spaceshipState.shield,
            maxShield: spaceshipState.maxShield,
            hull: spaceshipState.hull,
            maxHull: spaceshipState.maxHull,
            fuel: spaceshipState.fuel,
            maxFuel: spaceshipState.maxFuel
        });
        console.log(`===== HULL REPAIR COMPLETED =====`);
        
        // Sync the updated hull value to the player entity's HealthComponent
        // Use direct entity access for more reliable syncing
        if (window.game && window.game.world) {
            try {
                const players = window.game.world.getEntitiesByTag('player');
                if (players && players.length > 0) {
                    const health = players[0].getComponent('HealthComponent');
                    if (health) {
                        // Update hull directly on the component
                        const oldHealthHull = health.health;
                        health.health = spaceshipState.hull;
                        console.log(`Direct hull update on HealthComponent: ${oldHealthHull} → ${health.health}`);
                    }
                }
            } catch (e) {
                console.error("Error during direct HealthComponent update:", e);
            }
        }
        
        // Also use the normal sync method
        if (syncCallback) {
            syncCallback();
        }
        
        return 200; // Cost of hull repair
    }

    /**
     * Check if fuel consumption is allowed and consume fuel
     * @param {object} spaceshipState Reference to spaceship state
     * @param {object} thrustState Current thrust state
     * @returns {boolean} True if we have fuel, false if empty
     */
    consumeFuel(spaceshipState, thrustState) {
        // Consume fuel when thrusting
        if (thrustState.forward || thrustState.backward || thrustState.left || thrustState.right) {
            let consumptionRate = spaceshipState.fuelConsumptionRate;
            
            // Extra consumption when boosting
            if (thrustState.boost) {
                consumptionRate *= 3;
            }
            
            spaceshipState.fuel = Math.max(0, spaceshipState.fuel - consumptionRate);
        }
        
        // Return true if we have fuel, false if empty
        return spaceshipState.fuel > 0;
    }
}