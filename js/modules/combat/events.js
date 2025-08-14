/**
 * Events Module - Handles all cross-module event subscriptions and bridges
 * 
 * This module contains all MessageBus interactions, event subscriptions,
 * and cross-system communication logic.
 */

export class EventManager {
    constructor() {
        this.subscriptions = [];
    }

    /**
     * Set up all event subscriptions and message bus interactions
     */
    setupEventHandlers(world, playerEntity) {
        if (!world || !world.messageBus) {
            console.warn("[EVENTS] No world or messageBus available for event setup");
            return;
        }

        // Subscribe to transform updates to refresh spatial hash
        const transformSubscription = world.messageBus.subscribe('transform.updated', (msg) => {
            const entity = msg.data && msg.data.entity;
            if (entity && world.onEntityTransformUpdated) {
                world.onEntityTransformUpdated(entity);
            }
        });
        this.subscriptions.push(transformSubscription);

        // Subscribe to player creation events if playerEntity is provided
        if (playerEntity) {
            const playerCreatedSubscription = world.messageBus.subscribe('player.created', (msg) => {
                console.log("[EVENTS] Player created event received:", msg.data);
            });
            this.subscriptions.push(playerCreatedSubscription);
        }

        console.log("[EVENTS] Event handlers set up successfully");
    }

    /**
     * Publish an event about player entity creation
     */
    publishPlayerCreated(world, playerEntity) {
        if (world && world.messageBus && playerEntity) {
            world.messageBus.publish('player.created', { entity: playerEntity });
            console.log("[EVENTS] Published player.created event");
        }
    }

    /**
     * Publish an event about enemy destruction
     */
    publishEnemyDestroyed(world, entityId, source, position) {
        if (world && world.messageBus) {
            world.messageBus.publish('enemy.destroyed', {
                entityId: entityId,
                source: source,
                position: position ? position.clone() : null
            });
            console.log(`[EVENTS] Published enemy.destroyed event for entity ${entityId}`);
        }
    }

    /**
     * Notify EnemySystem directly about enemy destruction
     */
    notifyEnemySystemDestruction(enemy, reason = 'projectile') {
        if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
            console.log(`[EVENTS] Notifying EnemySystem directly about enemy ${enemy.id} destruction`);
            try {
                const enemySystem = window.game.ecsWorld.enemySystem;
                if (typeof enemySystem.handleEntityDestroyed === 'function') {
                    enemySystem.handleEntityDestroyed({
                        entity: enemy,
                        reason: reason
                    });
                }
            } catch (syncError) {
                console.error("[EVENTS] Error syncing with EnemySystem:", syncError);
            }
        }
    }

    /**
     * Clean up all event subscriptions
     */
    cleanup() {
        for (const subscription of this.subscriptions) {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        }
        this.subscriptions = [];
        console.log("[EVENTS] Event subscriptions cleaned up");
    }

    /**
     * Set up general game event handlers
     */
    setupGameEventHandlers() {
        // Set up any game-wide event handlers here
        // This can be extended as needed for cross-module communication
        console.log("[EVENTS] Game event handlers set up");
    }

    /**
     * Publish a general combat event
     */
    publishCombatEvent(world, eventType, data) {
        if (world && world.messageBus) {
            world.messageBus.publish(`combat.${eventType}`, data);
            console.log(`[EVENTS] Published combat.${eventType} event`);
        }
    }

    /**
     * Subscribe to a specific event type
     */
    subscribe(world, eventType, handler) {
        if (world && world.messageBus) {
            const subscription = world.messageBus.subscribe(eventType, handler);
            this.subscriptions.push(subscription);
            return subscription;
        }
        return null;
    }

    /**
     * Unsubscribe from a specific subscription
     */
    unsubscribe(subscription) {
        if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
            const index = this.subscriptions.indexOf(subscription);
            if (index > -1) {
                this.subscriptions.splice(index, 1);
            }
        }
    }
}