// services.ts - Ship service operations (refuel, repair)
import { DEBUG_MODE } from '../../../globals/debug.ts';
// Extracted from spaceship.js to improve maintainability

interface SpaceshipState {
  fuel: number;
  maxFuel: number;
  shield: number;
  maxShield: number;
  hull: number;
  maxHull: number;
}

interface ThrustState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

export class ShipServices {
  constructor() {
    // Service operations don't need complex initialization
  }

  /**
   * Refuel the spaceship to maximum capacity
   * @param {object} spaceshipState Reference to spaceship state
   * @returns {number} Cost of refueling
   */
  refuel(spaceshipState: SpaceshipState): number {
    if (DEBUG_MODE.enabled) console.log("Refueling spaceship");
    spaceshipState.fuel = spaceshipState.maxFuel;
    return 100; // Cost of refueling
  }

  /**
   * Repair the ship's shield system
   * @param {object} spaceshipState Reference to spaceship state
   * @param {function} syncCallback Callback to sync values to health component
   * @returns {number} Cost of shield repair
   */
  repairShield(spaceshipState: SpaceshipState, syncCallback: () => void): number {
    const oldShield = spaceshipState.shield;
    if (DEBUG_MODE.enabled) console.log(`===== SHIELD REPAIR INITIATED =====`);
    if (DEBUG_MODE.enabled) console.log(`Repairing shield: ${oldShield} → ${spaceshipState.maxShield}`);

    // CRITICAL FIX: Set and verify shield repair
    spaceshipState.shield = spaceshipState.maxShield;
    if (DEBUG_MODE.enabled) console.log(`Shield value is now: ${spaceshipState.shield} (Expected: ${spaceshipState.maxShield})`);

    // Log full spaceship state for debugging
    if (DEBUG_MODE.enabled) console.log("Full spaceship state after shield repair:", {
      shield: spaceshipState.shield,
      maxShield: spaceshipState.maxShield,
      hull: spaceshipState.hull,
      maxHull: spaceshipState.maxHull,
      fuel: spaceshipState.fuel,
      maxFuel: spaceshipState.maxFuel
    });
    if (DEBUG_MODE.enabled) console.log(`===== SHIELD REPAIR COMPLETED =====`);

    // Sync the updated shield value to the player entity's HealthComponent
    // Use direct entity access for more reliable syncing
    if ((window as any).game && (window as any).game.world) {
      try {
        const players = (window as any).game.world.getEntitiesByTag('player');
        if (players && players.length > 0) {
          const health = players[0].getComponent('HealthComponent');
          if (health) {
            // Update shield directly on the component
            const oldHealthShield = health.shield;
            health.shield = spaceshipState.shield;
            if (DEBUG_MODE.enabled) console.log(`Direct shield update on HealthComponent: ${oldHealthShield} → ${health.shield}`);
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
  repairHull(spaceshipState: SpaceshipState, syncCallback: () => void): number {
    const oldHull = spaceshipState.hull;
    if (DEBUG_MODE.enabled) console.log(`===== HULL REPAIR INITIATED =====`);
    if (DEBUG_MODE.enabled) console.log(`Repairing hull: ${oldHull} → ${spaceshipState.maxHull}`);

    // CRITICAL FIX: Set and verify hull repair
    spaceshipState.hull = spaceshipState.maxHull;
    if (DEBUG_MODE.enabled) console.log(`Hull value is now: ${spaceshipState.hull} (Expected: ${spaceshipState.maxHull})`);

    // Log full spaceship state for debugging
    if (DEBUG_MODE.enabled) console.log("Full spaceship state after hull repair:", {
      shield: spaceshipState.shield,
      maxShield: spaceshipState.maxShield,
      hull: spaceshipState.hull,
      maxHull: spaceshipState.maxHull,
      fuel: spaceshipState.fuel,
      maxFuel: spaceshipState.maxFuel
    });
    if (DEBUG_MODE.enabled) console.log(`===== HULL REPAIR COMPLETED =====`);

    // Sync the updated hull value to the player entity's HealthComponent
    // Use direct entity access for more reliable syncing
    if ((window as any).game && (window as any).game.world) {
      try {
        const players = (window as any).game.world.getEntitiesByTag('player');
        if (players && players.length > 0) {
          const health = players[0].getComponent('HealthComponent');
          if (health) {
            // Update hull directly on the component
            const oldHealthHull = health.health;
            health.health = spaceshipState.hull;
            if (DEBUG_MODE.enabled) console.log(`Direct hull update on HealthComponent: ${oldHealthHull} → ${health.health}`);
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
  consumeFuel(spaceshipState: SpaceshipState, thrustState: ThrustState): boolean {
    // Consume fuel when thrusting
    if (thrustState.forward || thrustState.backward || thrustState.left || thrustState.right) {
      let consumptionRate = 0.01; // spaceshipState.fuelConsumptionRate

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
