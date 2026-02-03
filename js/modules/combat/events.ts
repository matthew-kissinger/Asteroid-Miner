/**
 * Event Manager Module - Handles event subscriptions and MessageBus interactions
 * 
 * This module contains all the logic for subscribing to game events and
 * translating them into ECS actions, as well as publishing combat events.
 */

export class EventManager {
    subscriptions: any[] = [];
    world: any = null;
    playerEntity: any = null;

    constructor() {
    }

    /**
     * Set up all event handlers for the combat module
     */
    setupEventHandlers(world: any, playerEntity: any): void {
        this.world = world;
        this.playerEntity = playerEntity;
        
        // Skip if no message bus
        if (!world || !world.messageBus) return;
        
        const messageBus = world.messageBus;
        
        // Listen for enemy destruction to reward player
        const sub1 = messageBus.subscribe('enemy.destroyed', (data: any) => {
            this.handleEnemyDestroyed(data);
        });
        this.subscriptions.push({ topic: 'enemy.destroyed', token: sub1 });
        
        // Listen for player damage events from the ECS world
        const sub2 = messageBus.subscribe('entity.damage', (data: any) => {
            this.handleEntityDamage(data);
        });
        this.subscriptions.push({ topic: 'entity.damage', token: sub2 });
        
        console.log(`[COMBAT] Event handlers setup for world ${world.id || 'default'}`);
    }

    /**
     * Handle enemy destruction events
     */
    handleEnemyDestroyed(data: any): void {
        // Reward player with score or resources
        if ((window as any).game && (window as any).game.ui && (window as any).game.ui.updateScore) {
            const points = data.points || 100;
            (window as any).game.ui.updateScore(points);
        }
    }

    /**
     * Handle entity damage events
     */
    handleEntityDamage(data: any): void {
        const { entityId, damage, shieldDamage } = data;
        
        // Check if this is the player entity
        if (this.playerEntity && entityId === this.playerEntity.id) {
            
            // Publish to main game message bus for UI and other modules
            if ((window as any).mainMessageBus) {
                (window as any).mainMessageBus.publish('player.damaged', {
                    damage,
                    shieldDamage,
                    source: data.source || 'unknown'
                });
            }
        }
    }

    /**
     * Clean up all event subscriptions
     */
    cleanup(): void {
        if (!this.world || !this.world.messageBus) return;
        
        for (const sub of this.subscriptions) {
            this.world.messageBus.unsubscribe(sub.topic, sub.token);
        }
        
        this.subscriptions = [];
    }
}
