/**
 * MessageBus - Event system for decoupled communication between systems
 * 
 * The MessageBus enables systems to communicate without direct references
 * by publishing and subscribing to specific message types.
 */

import { validateEventPayload } from './events.ts';

export interface Message {
    type: string;
    data: any;
    timestamp: number;
}

export type MessageCallback = (message: Message) => void;

interface Listener {
    callback: MessageCallback;
    context: any;
}

export class MessageBus {
    public listeners: Map<string, Listener[]>;
    private queuedMessages: { type: string, data: any }[];
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
        if (!(window as any).messageRegistry) {
            (window as any).messageRegistry = new Set();
        }
        (window as any).messageRegistry.add(this);
        
        // Always ensure that mainMessageBus is set - critically important for game over events
        if (!(globalThis as any).mainMessageBus) {
            (globalThis as any).mainMessageBus = this;
        } else if ((globalThis as any).mainMessageBus !== this) {
            // If this is not the main message bus, make sure game.over events are 
            // forwarded to the main message bus for centralized handling
        }
    }
    
    /**
     * Register a listener for a message type
     * @param {string} messageType The message type to listen for
     * @param {MessageCallback} callback Function to call when message is published
     * @param {any} context Context to use when calling the callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(messageType: string, callback: MessageCallback, context: any = null): () => void {
        if (!this.listeners.has(messageType)) {
            this.listeners.set(messageType, []);
        }
        
        this.listeners.get(messageType)!.push({
            callback,
            context
        });
        
        // Return unsubscribe function for convenience
        return () => this.unsubscribe(messageType, callback, context);
    }
    
    /**
     * Remove a listener
     * @param {string} messageType The message type to unsubscribe from
     * @param {MessageCallback} callback The callback to remove
     * @param {any} context The context used when subscribing
     */
    unsubscribe(messageType: string, callback: MessageCallback, context: any = null): void {
        if (!this.listeners.has(messageType)) return;
        
        const listeners = this.listeners.get(messageType)!;
        const index = listeners.findIndex(listener => 
            listener.callback === callback && listener.context === context);
            
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        
        if (listeners.length === 0) {
            this.listeners.delete(messageType);
        }
    }
    
    /**
     * Fast publish for high-frequency events with minimal overhead
     * @param {string} messageType The message type to publish
     * @param {any} data Data to include with the message
     */
    fastPublish(messageType: string, data: any = {}): void {
        // Typed event validation in dev
        try { validateEventPayload && validateEventPayload(messageType, data); } catch {}
        if (!this.listeners.has(messageType)) return;
        
        const listeners = this.listeners.get(messageType)!;
        const messageObj: Message = {
            type: messageType,
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
     * @param {string} messageType The message type to publish
     * @param {any} data Data to include with the message
     */
    publish(messageType: string, data: any = {}): void {
        // Typed event validation in dev
        try { validateEventPayload && validateEventPayload(messageType, data); } catch {}
        // Use fast path for high-frequency messages
        if (this.highFrequencyTypes.has(messageType)) {
            return this.fastPublish(messageType, data);
        }
        
        // Enhanced handling for game.over events to ensure they are properly processed
        if (messageType === 'game.over') {
            // Always forward game.over events to the main message bus if this isn't it
            if ((globalThis as any).mainMessageBus && (globalThis as any).mainMessageBus !== this) {
                (globalThis as any).mainMessageBus.publish(messageType, data);
                return; // Let the main message bus handle it
            }
            
            // Only proceed if we have listeners or we are the main message bus
            if (!this.listeners.has(messageType)) {
                // Verify main game instance
                if ((window as any).game) {
                    // Try to directly call gameOver as a last resort
                    (window as any).game.gameOver(data.reason || "Unknown reason");
                } 
                
                return;
            }
        }
        
        if (!this.listeners.has(messageType)) return;
        
        // If we're already dispatching, queue this message
        if (this.dispatching) {
            this.queuedMessages.push({ type: messageType, data });
            return;
        }
        
        try {
            // Set flag to prevent nested dispatch issues
            this.dispatching = true;
            
            const listeners = this.listeners.get(messageType)!;
            listeners.forEach((listener) => {
                try {
                    listener.callback.call(listener.context, {
                        type: messageType,
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
                    this.publish(message.type, message.data);
                });
            }
        }
    }
    
    /**
     * Queue a message for next update
     * @param {string} messageType The message type to queue
     * @param {any} data Data to include with the message
     */
    queue(messageType: string, data: any = {}): void {
        this.queuedMessages.push({
            type: messageType,
            data: data
        });
    }
    
    /**
     * Universal handler for game over events - used by multiple components
     * @param {string} reason Reason for game over
     * @param {string} source Source of the game over event
     */
    static triggerGameOver(reason: string, source: string): void {
        // Try to find a message bus to use - prioritization order for reliability
        let messageBusToUse: MessageBus | null = null;
        
        // Use main message bus if available (highest priority)
        if ((globalThis as any).mainMessageBus) {
            messageBusToUse = (globalThis as any).mainMessageBus;
        }
        // Use window.game.messageBus if available and mainMessageBus not found
        else if ((window as any).game && (window as any).game.messageBus) {
            messageBusToUse = (window as any).game.messageBus;
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
