const EVENT = Object.freeze({
  GAME_OVER: "game.over",
  PLAYER_CREATED: "player.created",
  TRANSFORM_UPDATED: "transform.updated",
  VFX_EXPLOSION: "vfx.explosion",
  MINING_START: "player.mining.start",
  MINING_STOP: "player.mining.stop",
  ENEMY_DESTROYED: "enemy.destroyed",
  WEAPON_FIRED: "weapon.fired"
});
const SCHEMA = {
  [EVENT.GAME_OVER]: { reason: "string" },
  [EVENT.PLAYER_CREATED]: { entity: "object" },
  [EVENT.TRANSFORM_UPDATED]: { entity: "object" },
  [EVENT.VFX_EXPLOSION]: { position: "object", color: "number", size: "number", duration: "number" },
  [EVENT.MINING_START]: { sourceEntity: "object", targetEntity: "object" },
  [EVENT.MINING_STOP]: { sourceEntity: "object" },
  [EVENT.ENEMY_DESTROYED]: { entityId: "string" },
  [EVENT.WEAPON_FIRED]: { entity: "object" }
};
function validateEventPayload(type, data) {
  if (!window || !window.DEBUG_MODE) return true;
  const shape = SCHEMA[type];
  if (!shape) return true;
  if (typeof data !== "object" || data == null) return warn(type, "payload is not object");
  for (const [key, t] of Object.entries(shape)) {
    const v = data[key];
    if (t === "object") {
      if (typeof v !== "object" || v == null) return warn(type, `field ${key} must be object`);
    } else if (typeof v !== t) {
      return warn(type, `field ${key} must be ${t}`);
    }
  }
  return true;
}
function warn(type, msg) {
  console.warn(`[EVENT VALIDATION] ${type}: ${msg}`);
  return false;
}
class MessageBus {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
    this.queuedMessages = [];
    this.dispatching = false;
    this.highFrequencyTypes = /* @__PURE__ */ new Set([
      "transform.updated",
      "physics.update",
      "render.update"
    ]);
    if (!window.messageRegistry) {
      window.messageRegistry = /* @__PURE__ */ new Set();
    }
    window.messageRegistry.add(this);
    if (!window.mainMessageBus) {
      window.mainMessageBus = this;
      console.log("MessageBus: Set this instance as window.mainMessageBus");
    } else if (window.mainMessageBus !== this) {
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
    const index = listeners.findIndex((listener) => listener.callback === callback && listener.context === context);
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
    try {
      validateEventPayload && validateEventPayload(messageType, data);
    } catch {
    }
    if (!this.listeners.has(messageType)) return;
    const listeners = this.listeners.get(messageType);
    const messageObj = {
      type: messageType,
      data,
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
    try {
      validateEventPayload && validateEventPayload(messageType, data);
    } catch {
    }
    if (this.highFrequencyTypes.has(messageType)) {
      return this.fastPublish(messageType, data);
    }
    const criticalMessages = ["entity.created", "entity.destroyed", "component.added", "component.removed", "game.over"];
    if (criticalMessages.includes(messageType)) {
      console.log(`MessageBus: Publishing ${messageType}`, data);
    }
    if (messageType === "game.over") {
      if (window.mainMessageBus && window.mainMessageBus !== this) {
        console.log(`MessageBus: Forwarding game.over event to window.mainMessageBus`);
        window.mainMessageBus.publish(messageType, data);
        return;
      }
      if (!this.listeners.has(messageType)) {
        console.error(`MessageBus: No listeners found for '${messageType}' event!`);
        console.log(`MessageBus: Registered event types:`, Array.from(this.listeners.keys()));
        console.trace("MessageBus: This is where the game.over event was published from");
        if (window.game) {
          console.log("MessageBus: window.game exists:", window.game);
          console.log("MessageBus: window.game.messageBus exists:", window.game.messageBus);
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
    if (this.dispatching) {
      console.log(`MessageBus: Already dispatching, queueing ${messageType} message`);
      this.queuedMessages.push({ type: messageType, data });
      return;
    }
    try {
      this.dispatching = true;
      const listeners = this.listeners.get(messageType);
      listeners.forEach((listener, index) => {
        try {
          if (messageType === "game.over") {
            console.log(`MessageBus: Calling listener #${index + 1} for game.over event`);
          }
          listener.callback.call(listener.context, {
            type: messageType,
            data,
            timestamp: Date.now()
          });
          if (messageType === "game.over") {
            console.log(`MessageBus: Listener #${index + 1} for game.over event completed successfully`);
          }
        } catch (error) {
          console.error(`Error in message listener #${index + 1} (${messageType}):`, error);
          console.error("Error stack:", error.stack);
        }
      });
    } finally {
      this.dispatching = false;
      if (this.queuedMessages.length > 0) {
        const queuedMessages = [...this.queuedMessages];
        this.queuedMessages = [];
        queuedMessages.forEach((message) => {
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
      data
    });
  }
  /**
   * Universal handler for game over events - used by multiple components
   * @param {string} reason Reason for game over
   * @param {string} source Source of the game over event
   */
  static triggerGameOver(reason, source) {
    console.log("MessageBus.triggerGameOver called:", reason, "from", source);
    let messageBusToUse = null;
    if (window.mainMessageBus) {
      console.log("MessageBus: Using window.mainMessageBus for game over");
      messageBusToUse = window.mainMessageBus;
    } else if (window.game && window.game.messageBus) {
      console.log("MessageBus: Using window.game.messageBus for game over");
      messageBusToUse = window.game.messageBus;
    }
    if (messageBusToUse) {
      console.log("MessageBus: Publishing game.over event");
      if (messageBusToUse.listeners.has("game.over")) {
        const listeners = messageBusToUse.listeners.get("game.over");
        console.log(`MessageBus: Found ${listeners.length} game.over listeners`);
      } else {
        console.warn("MessageBus: No game.over listeners found before publishing");
      }
      messageBusToUse.publish("game.over", {
        reason,
        source
      });
    } else {
      console.error("MessageBus: No message bus instance found for game over!");
    }
  }
}
export {
  MessageBus
};
//# sourceMappingURL=core-D1pAqHYH.js.map
