/**
 * MessageBus - Event system for decoupled communication between systems
 * 
 * The MessageBus enables systems to communicate without direct references
 * by publishing and subscribing to specific message types.
 */

export class MessageBus {
    constructor() {
        this.listeners = new Map();
        this.queuedMessages = [];
        this.dispatching = false;
        
        // Store this instance in a global registry for emergency access
        if (!window.messageRegistry) {
            window.messageRegistry = new Set();
        }
        window.messageRegistry.add(this);
        
        // Always ensure that mainMessageBus is set - critically important for game over events
        if (!window.mainMessageBus) {
            window.mainMessageBus = this;
            console.log("MessageBus: Set this instance as window.mainMessageBus");
        } else if (window.mainMessageBus !== this) {
            // If this is not the main message bus, make sure game.over events are 
            // forwarded to the main message bus for centralized handling
            console.log("MessageBus: This instance will forward game.over events to window.mainMessageBus");
        }
        
        console.log("MessageBus: New instance created and added to registry");
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
     * Send a message immediately
     * @param {string} messageType The message type to publish
     * @param {Object} data Data to include with the message
     */
    publish(messageType, data = {}) {
        // Debug logging for critical messages - add 'game.over' as high priority message
        const criticalMessages = ['entity.created', 'entity.destroyed', 'component.added', 'component.removed', 'game.over'];
        if (criticalMessages.includes(messageType)) {
            console.log(`MessageBus: Publishing ${messageType}`, data);
        }
        
        // Enhanced handling for game.over events to ensure they are properly processed
        if (messageType === 'game.over') {
            // Always forward game.over events to the main message bus if this isn't it
            if (window.mainMessageBus && window.mainMessageBus !== this) {
                console.log(`MessageBus: Forwarding game.over event to window.mainMessageBus`);
                window.mainMessageBus.publish(messageType, data);
                return; // Let the main message bus handle it
            }
            
            // Only proceed if we have listeners or we are the main message bus
            if (!this.listeners.has(messageType)) {
                console.error(`MessageBus: No listeners found for '${messageType}' event!`);
                console.log(`MessageBus: Registered event types:`, Array.from(this.listeners.keys()));
                
                // Log where subscribers should be
                console.trace("MessageBus: This is where the game.over event was published from");
                
                // Verify main game instance
                if (window.game) {
                    console.log("MessageBus: window.game exists:", window.game);
                    console.log("MessageBus: window.game.messageBus exists:", window.game.messageBus);
                    
                    // Try to directly call gameOver as a last resort
                    console.log("MessageBus: Directly calling window.game.gameOver as an emergency measure");
                    window.game.gameOver(data.reason || "Unknown reason");
                } else {
                    console.error("MessageBus: window.game does not exist - critical issue");
                }
                
                return;
            } else {
                const listeners = this.listeners.get(messageType);
                console.log(`MessageBus: Found ${listeners.length} listeners for '${messageType}' event`);
            }
        }
        
        if (!this.listeners.has(messageType)) return;
        
        // If we're already dispatching, queue this message
        if (this.dispatching) {
            console.log(`MessageBus: Already dispatching, queueing ${messageType} message`);
            this.queuedMessages.push({ type: messageType, data });
            return;
        }
        
        try {
            // Set flag to prevent nested dispatch issues
            this.dispatching = true;
            
            const listeners = this.listeners.get(messageType);
            listeners.forEach((listener, index) => {
                try {
                    if (messageType === 'game.over') {
                        console.log(`MessageBus: Calling listener #${index + 1} for game.over event`);
                    }
                    
                    listener.callback.call(listener.context, {
                        type: messageType,
                        data: data,
                        timestamp: Date.now()
                    });
                    
                    if (messageType === 'game.over') {
                        console.log(`MessageBus: Listener #${index + 1} for game.over event completed successfully`);
                    }
                } catch (error) {
                    console.error(`Error in message listener #${index + 1} (${messageType}):`, error);
                    console.error("Error stack:", error.stack);
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
        console.log("MessageBus.triggerGameOver called:", reason, "from", source);
        
        // Try to find a message bus to use - prioritization order for reliability
        let messageBusToUse = null;
        
        // Use window.mainMessageBus if available (highest priority)
        if (window.mainMessageBus) {
            console.log("MessageBus: Using window.mainMessageBus for game over");
            messageBusToUse = window.mainMessageBus;
        }
        // Use window.game.messageBus if available and mainMessageBus not found
        else if (window.game && window.game.messageBus) {
            console.log("MessageBus: Using window.game.messageBus for game over");
            messageBusToUse = window.game.messageBus;
        } 
        
        // Check if we found a message bus to use
        if (messageBusToUse) {
            console.log("MessageBus: Publishing game.over event");
            
            // Log the listeners to verify game.over handler is registered
            if (messageBusToUse.listeners.has('game.over')) {
                const listeners = messageBusToUse.listeners.get('game.over');
                console.log(`MessageBus: Found ${listeners.length} game.over listeners`);
            } else {
                console.warn("MessageBus: No game.over listeners found before publishing");
            }
            
            // Publish the event
            messageBusToUse.publish('game.over', {
                reason: reason,
                source: source
            });
        } else {
            console.error("MessageBus: No message bus instance found for game over!");
        }
    }
}