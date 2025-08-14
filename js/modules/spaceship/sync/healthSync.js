// healthSync.js - ECS health component synchronization
// Extracted from spaceship.js to improve maintainability

export class HealthSync {
    constructor() {
        // Health sync doesn't need complex initialization
    }

    /**
     * Subscribe to player entity destruction events
     * @param {MessageBus} messageBus The game's message bus
     * @param {function} destructionCallback Callback when player is destroyed
     */
    subscribeToDestructionEvents(messageBus, destructionCallback) {
        if (!messageBus) return;
        
        messageBus.subscribe('entity.destroyed', (message) => {
            const entity = message.data.entity;
            
            // Check if this is the player entity
            if (entity && entity.hasTag && entity.hasTag('player')) {
                console.log("Player entity destroyed - updating spaceship state");
                
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
        
        console.log("Spaceship subscribed to destruction events");
    }

    /**
     * Method to sync hull and shield values to the player entity's HealthComponent
     * @param {object} spaceshipState Current spaceship state
     */
    syncValuesToHealthComponent(spaceshipState) {
        console.log("Beginning shield and hull sync to HealthComponent");
        
        console.log("Current spaceship values:", {
            shield: spaceshipState.shield,
            maxShield: spaceshipState.maxShield,
            hull: spaceshipState.hull,
            maxHull: spaceshipState.maxHull
        });
        
        // Store the values that need to be synced to the HealthComponent
        const valuesForSync = {
            shield: spaceshipState.shield,
            maxShield: spaceshipState.maxShield,
            hull: spaceshipState.hull,
            maxHull: spaceshipState.maxHull
        };
        
        console.log(`Preparing to sync values to player HealthComponent: Shield=${spaceshipState.shield}, Hull=${spaceshipState.hull}`);
        
        // Try using the MessageBus to broadcast the sync event
        try {
            if (window.game && window.game.messageBus) {
                // Use the message bus to publish a sync event for any interested components
                window.game.messageBus.publish('player.syncHealth', valuesForSync);
                console.log("Published player.syncHealth event to game.messageBus with values:", valuesForSync);
            } else if (window.mainMessageBus) {
                // Try using the global message bus
                window.mainMessageBus.publish('player.syncHealth', valuesForSync);
                console.log("Published player.syncHealth event to mainMessageBus with values:", valuesForSync);
            } else {
                console.warn("No message bus available to sync health values");
            }
        } catch (e) {
            console.error("Error publishing sync event:", e);
        }
        
        // Also try direct access as a fallback
        try {
            if (window.game && window.game.world) {
                const players = window.game.world.getEntitiesByTag('player');
                console.log(`Found ${players ? players.length : 0} player entities for direct sync`);
                
                if (players && players.length > 0) {
                    const player = players[0];
                    const health = player.getComponent('HealthComponent');
                    
                    if (health) {
                        // Log pre-sync state
                        console.log("DIRECT SYNC - HealthComponent before sync:", {
                            shield: health.shield,
                            maxShield: health.maxShield,
                            health: health.health,
                            maxHealth: health.maxHealth
                        });
                        
                        console.log("DIRECT SYNC - Spaceship values to sync:", {
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
                        
                        console.log(`Directly synced values to HealthComponent: Shield ${oldShield} → ${health.shield}, Hull ${oldHealth} → ${health.health}`);
                        
                        // Verify sync was successful
                        console.log("DIRECT SYNC - HealthComponent after sync:", {
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