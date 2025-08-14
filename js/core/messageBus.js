/**
 * MessageBus - Event system for decoupled communication between systems
 * 
 * The MessageBus enables systems to communicate without direct references
 * by publishing and subscribing to specific message types.
 */

import { validateEventPayload } from './events.js';

export class MessageBus {
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
        if (!window.messageRegistry) {
            window.messageRegistry = new Set();
        }
        window.messageRegistry.add(this);
        
        // Always ensure that mainMessageBus is set - critically important for game over events
        if (!window.mainMessageBus) {
            window.mainMessageBus = this;
        } else if (window.mainMessageBus !== this) {
            // If this is not the main message bus, make sure game.over events are 
            // forwarded to the main message bus for centralized handling
        }
        
    }
    
    /**
     * Register a listener for a message type
     * @param {string} messageType The message type to listen for
     * @param {Function} callback Function to call when message is published
     * @param {Object} context Context to use when calling the callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(messageType, callback, context = null) {
        if (!this.listeners.has(messageType)) {
            this.listeners.set(messageType, []);
        }
        
        this.listeners.get(messageType).push({
            callback,
            context
        });
        
        // Return unsubscribe function for convenience
        return () => this.unsubscribe(messageType, callback, context);
    }
    
    /**
     * Remove a listener
     * @param {string} messageType The message type to unsubscribe from
     * @param {Function} callback The callback to remove
     * @param {Object} context The context used when subscribing
     */
    unsubscribe(messageType, callback, context = null) {
        if (!this.listeners.has(messageType)) return;
        
        const listeners = this.listeners.get(messageType);
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
     * @param {Object} data Data to include with the message
     */
    fastPublish(messageType, data = {}) {
        // Typed event validation in dev
        try { validateEventPayload && validateEventPayload(messageType, data); } catch {}
        if (!this.listeners.has(messageType)) return;
        
        const listeners = this.listeners.get(messageType);
        const messageObj = {
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
     * @param {Object} data Data to include with the message
     */
    publish(messageType, data = {}) {
        // Typed event validation in dev
        try { validateEventPayload && validateEventPayload(messageType, data); } catch {}
        // Use fast path for high-frequency messages
        if (this.highFrequencyTypes.has(messageType)) {
            return this.fastPublish(messageType, data);
        }
        
        
        // Enhanced handling for game.over events to ensure they are properly processed
        if (messageType === 'game.over') {
            // Always forward game.over events to the main message bus if this isn't it
            if (window.mainMessageBus && window.mainMessageBus !== this) {
                window.mainMessageBus.publish(messageType, data);
                return; // Let the main message bus handle it
            }
            
            // Only proceed if we have listeners or we are the main message bus
            if (!this.listeners.has(messageType)) {
                // Verify main game instance
                if (window.game) {
                    // Try to directly call gameOver as a last resort
                    window.game.gameOver(data.reason || "Unknown reason");
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
            
            const listeners = this.listeners.get(messageType);
            listeners.forEach((listener, index) => {
                try {
                    
                    listener.callback.call(listener.context, {
                        type: messageType,
                        data: data,
                        timestamp: Date.now()
                    });
                    
                } catch (error) {
                    
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
     * @param {Object} data Data to include with the message
     */
    queue(messageType, data = {}) {
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
    static triggerGameOver(reason, source) {
        
        // Try to find a message bus to use - prioritization order for reliability
        let messageBusToUse = null;
        
        // Use window.mainMessageBus if available (highest priority)
        if (window.mainMessageBus) {
            messageBusToUse = window.mainMessageBus;
        }
        // Use window.game.messageBus if available and mainMessageBus not found
        else if (window.game && window.game.messageBus) {
            messageBusToUse = window.game.messageBus;
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