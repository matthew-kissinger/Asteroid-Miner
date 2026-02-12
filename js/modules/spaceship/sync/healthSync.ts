// healthSync.ts - ECS health component synchronization
// Extracted from spaceship.js to improve maintainability

import { debugLog } from '../../../globals/debug.js';

interface SpaceshipState {
  shield: number;
  maxShield: number;
  hull: number;
  maxHull: number;
}

interface MessageBusEvent {
  data: {
    entity: any;
  };
}

export class HealthSync {
  constructor() {
    // Health sync doesn't need complex initialization
  }

  /**
   * Subscribe to player entity destruction events
   * @param {MessageBus} messageBus The game's message bus
   * @param {function} destructionCallback Callback when player is destroyed
   */
  subscribeToDestructionEvents(messageBus: any, destructionCallback: (hull: number, shield: number) => void): void {
    if (!messageBus) return;

    messageBus.subscribe('entity.destroyed', (message: MessageBusEvent) => {
      const entity = message.data.entity;

      // Check if this is the player entity
      if (entity && entity.hasTag && entity.hasTag('player')) {
        debugLog("Player entity destroyed - updating spaceship state");

        // Get health component data
        const healthComponent = entity.getComponent('HealthComponent');
        let hull = 0;
        let shield = 0;

        if (healthComponent) {
          hull = healthComponent.health;
          shield = healthComponent.shield;
        } else {
          // If no health component, just set to 0
          hull = 0;
          shield = 0;
        }

        // Call destruction callback with updated values
        destructionCallback(hull, shield);
      }
    });

    debugLog("Spaceship subscribed to destruction events");
  }

  /**
   * Method to sync hull and shield values to the player entity's HealthComponent
   * @param {object} spaceshipState Current spaceship state
   */
  syncValuesToHealthComponent(spaceshipState: SpaceshipState): void {
    debugLog("Beginning shield and hull sync to HealthComponent");

    debugLog("Current spaceship values:", {
      shield: spaceshipState.shield,
      maxShield: spaceshipState.maxShield,
      hull: spaceshipState.hull,
      maxHull: spaceshipState.maxHull
    });

    // Store the values that need to be synced to the HealthComponent
    const shieldRegenRate = (spaceshipState as { shieldRegenRate?: number }).shieldRegenRate;
    const valuesForSync = {
      shield: spaceshipState.shield,
      maxShield: spaceshipState.maxShield,
      hull: spaceshipState.hull,
      maxHull: spaceshipState.maxHull,
      ...(shieldRegenRate != null && { shieldRegenRate })
    };

    debugLog(`Preparing to sync values to player HealthComponent: Shield=${spaceshipState.shield}, Hull=${spaceshipState.hull}`);

    // Try using the MessageBus to broadcast the sync event
    try {
      if ((window as any).game && (window as any).game.messageBus) {
        // Use the message bus to publish a sync event for any interested components
        (window as any).game.messageBus.publish('player.syncHealth', valuesForSync);
        debugLog("Published player.syncHealth event to game.messageBus with values:", valuesForSync);
      } else if ((window as any).mainMessageBus) {
        // Try using the global message bus
        (window as any).mainMessageBus.publish('player.syncHealth', valuesForSync);
        debugLog("Published player.syncHealth event to mainMessageBus with values:", valuesForSync);
      } else {
        console.warn("No message bus available to sync health values");
      }
    } catch (e) {
      console.error("Error publishing sync event:", e);
    }

    // Also try direct access as a fallback
    try {
      if ((window as any).game && (window as any).game.world) {
        const players = (window as any).game.world.getEntitiesByTag('player');
        debugLog(`Found ${players ? players.length : 0} player entities for direct sync`);

        if (players && players.length > 0) {
          const player = players[0];
          const health = player.getComponent('HealthComponent');

          if (health) {
            // Log pre-sync state
            debugLog("DIRECT SYNC - HealthComponent before sync:", {
              shield: health.shield,
              maxShield: health.maxShield,
              health: health.health,
              maxHealth: health.maxHealth
            });

            debugLog("DIRECT SYNC - Spaceship values to sync:", {
              shield: spaceshipState.shield,
              maxShield: spaceshipState.maxShield,
              hull: spaceshipState.hull,
              maxHull: spaceshipState.maxHull
            });

            // Sync shield value
            const oldShield = health.shield;
            health.shield = spaceshipState.shield;
            health.maxShield = spaceshipState.maxShield;

            // Sync hull value
            const oldHealth = health.health;
            health.health = spaceshipState.hull;
            health.maxHealth = spaceshipState.maxHull;

            debugLog(`Directly synced values to HealthComponent: Shield ${oldShield} → ${health.shield}, Hull ${oldHealth} → ${health.health}`);

            // Verify sync was successful
            debugLog("DIRECT SYNC - HealthComponent after sync:", {
              shield: health.shield,
              maxShield: health.maxShield,
              health: health.health,
              maxHealth: health.maxHealth
            });
          } else {
            console.warn("Player entity found but has no HealthComponent");
          }
        } else {
          console.warn("No player entities found for direct sync");
        }
      }
    } catch (e) {
      console.error("Error directly syncing values to HealthComponent:", e);
    }
  }
}
