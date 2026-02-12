/**
 * MessageBus - Event system for decoupled communication between systems
 *
 * The MessageBus enables systems to communicate without direct references
 * by publishing and subscribing to specific message types.
 *
 * @template TEvents - Event map defining event names and their payload types
 */

import { validateEventPayload, type GameEventMap } from './events.js';

export interface Message<T = unknown> {
    type: string;
    data: T;
    timestamp: number;
}

export type MessageCallback<T = unknown> = (message: Message<T>) => void;

interface Listener<T = unknown> {
    callback: MessageCallback<T>;
    context: unknown;
}

interface GlobalWithMessageBus {
    mainMessageBus?: MessageBus<GameEventMap>;
    messageRegistry?: Set<MessageBus<GameEventMap>>;
}

interface WindowWithGame {
    game?: {
        messageBus?: MessageBus<GameEventMap>;
        gameOver?: (reason: string) => void;
    };
}

export class MessageBus<TEvents extends Record<string, unknown> = GameEventMap> {
    public listeners: Map<string, Listener[]>;
    private queuedMessages: { type: string; data: unknown }[];
    private dispatching: boolean;
    private highFrequencyTypes: Set<string>;

    constructor() {
        this.listeners = new Map();
        this.queuedMessages = [];
        this.dispatching = false;

        // High-frequency message types to minimize logging
        this.highFrequencyTypes = new Set([
            'transform.updated',
            'physics.update',
            'render.update'
        ]);

        // Store this instance in a global registry for emergency access
        const globalWithRegistry = globalThis as GlobalWithMessageBus & { messageRegistry?: Set<MessageBus<GameEventMap>> };
        if (!globalWithRegistry.messageRegistry) {
            globalWithRegistry.messageRegistry = new Set();
        }
        globalWithRegistry.messageRegistry.add(this as unknown as MessageBus<GameEventMap>);

        // Always ensure that mainMessageBus is set - critically important for game over events
        const globalWithBus = globalThis as GlobalWithMessageBus;
        if (!globalWithBus.mainMessageBus) {
            globalWithBus.mainMessageBus = this as unknown as MessageBus<GameEventMap>;
        } else if (globalWithBus.mainMessageBus !== (this as unknown as MessageBus<GameEventMap>)) {
            // If this is not the main message bus, make sure game.over events are
            // forwarded to the main message bus for centralized handling
        }
    }
    
    /**
     * Register a listener for a message type
     * @param messageType The message type to listen for
     * @param callback Function to call when message is published
     * @param context Context to use when calling the callback
     * @returns Unsubscribe function
     */
    subscribe<K extends keyof TEvents>(
        messageType: K,
        callback: MessageCallback<TEvents[K]>,
        context: unknown = null
    ): () => void {
        const eventName = messageType as string;
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }

        this.listeners.get(eventName)!.push({
            callback: callback as MessageCallback,
            context
        });

        // Return unsubscribe function for convenience
        return () => this.unsubscribe(messageType, callback, context);
    }

    /**
     * Remove a listener
     * @param messageType The message type to unsubscribe from
     * @param callback The callback to remove
     * @param context The context used when subscribing
     */
    unsubscribe<K extends keyof TEvents>(
        messageType: K,
        callback: MessageCallback<TEvents[K]>,
        context: unknown = null
    ): void {
        const eventName = messageType as string;
        if (!this.listeners.has(eventName)) return;

        const listeners = this.listeners.get(eventName)!;
        const index = listeners.findIndex(listener =>
            listener.callback === (callback as MessageCallback) && listener.context === context);

        if (index !== -1) {
            listeners.splice(index, 1);
        }

        if (listeners.length === 0) {
            this.listeners.delete(eventName);
        }
    }
    
    /**
     * Fast publish for high-frequency events with minimal overhead
     * @param messageType The message type to publish
     * @param data Data to include with the message
     */
    fastPublish<K extends keyof TEvents>(messageType: K, data: TEvents[K]): void {
        const eventName = messageType as string;
        // Typed event validation in dev
        try { validateEventPayload && validateEventPayload(eventName, data); } catch {}
        if (!this.listeners.has(eventName)) return;

        const listeners = [...this.listeners.get(eventName)!];
        const messageObj: Message<TEvents[K]> = {
            type: eventName,
            data: data,
            timestamp: Date.now()
        };

        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener.callback.call(listener.context, messageObj);
        }
    }
    
    /**
     * Send a message immediately
     * @param messageType The message type to publish
     * @param data Data to include with the message
     */
    publish<K extends keyof TEvents>(messageType: K, data: TEvents[K]): void {
        const eventName = messageType as string;
        // Typed event validation in dev
        try { validateEventPayload && validateEventPayload(eventName, data); } catch {}
        // Use fast path for high-frequency messages
        if (this.highFrequencyTypes.has(eventName)) {
            return this.fastPublish(messageType, data);
        }

        // Enhanced handling for game.over events to ensure they are properly processed
        if (eventName === 'game.over') {
            const globalWithBus = globalThis as GlobalWithMessageBus;
            // Always forward game.over events to the main message bus if this isn't it
            if (globalWithBus.mainMessageBus && globalWithBus.mainMessageBus !== (this as unknown as MessageBus<GameEventMap>)) {
                globalWithBus.mainMessageBus.publish(messageType as keyof GameEventMap, data as GameEventMap[keyof GameEventMap]);
                return; // Let the main message bus handle it
            }

            // Only proceed if we have listeners or we are the main message bus
            if (!this.listeners.has(eventName)) {
                // Verify main game instance
                const windowWithGame = window as unknown as WindowWithGame;
                if (windowWithGame.game?.gameOver) {
                    const gameOverData = data as GameEventMap['game.over'];
                    // Try to directly call gameOver as a last resort
                    windowWithGame.game.gameOver(gameOverData.reason || "Unknown reason");
                }

                return;
            }
        }

        if (!this.listeners.has(eventName)) return;

        // If we're already dispatching, queue this message
        if (this.dispatching) {
            this.queuedMessages.push({ type: eventName, data });
            return;
        }

        try {
            // Set flag to prevent nested dispatch issues
            this.dispatching = true;

            const listeners = [...this.listeners.get(eventName)!];
            listeners.forEach((listener) => {
                try {
                    listener.callback.call(listener.context, {
                        type: eventName,
                        data: data,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    // Silently catch listener errors to prevent one listener from crashing the bus
                }
            });
        } finally {
            // Always clear the dispatching flag, even if an error occurs
            this.dispatching = false;

            // Process any queued messages
            if (this.queuedMessages.length > 0) {
                const queuedMessages = [...this.queuedMessages];
                this.queuedMessages = [];

                queuedMessages.forEach(message => {
                    // Type assertion needed here since we're replaying queued messages
                    // We use the actual string type from the queued message
                    this.publish(message.type as keyof TEvents, message.data as TEvents[keyof TEvents]);
                });
            }
        }
    }
    
    /**
     * Queue a message for next update
     * @param messageType The message type to queue
     * @param data Data to include with the message
     */
    queue<K extends keyof TEvents>(messageType: K, data: TEvents[K]): void {
        this.queuedMessages.push({
            type: messageType as string,
            data: data
        });
    }

    /**
     * Universal handler for game over events - used by multiple components
     * @param reason Reason for game over
     * @param source Source of the game over event
     */
    static triggerGameOver(reason: string, source: string): void {
        // Try to find a message bus to use - prioritization order for reliability
        let messageBusToUse: MessageBus | null = null;

        const globalWithBus = globalThis as GlobalWithMessageBus;
        const windowWithGame = window as unknown as WindowWithGame;

        // Use main message bus if available (highest priority)
        if (globalWithBus.mainMessageBus) {
            messageBusToUse = globalWithBus.mainMessageBus;
        }
        // Use window.game.messageBus if available and mainMessageBus not found
        else if (windowWithGame.game?.messageBus) {
            messageBusToUse = windowWithGame.game.messageBus;
        }

        // Check if we found a message bus to use
        if (messageBusToUse) {
            // Publish the event
            messageBusToUse.publish('game.over', {
                reason: reason,
                source: source
            });
        }
    }
}
