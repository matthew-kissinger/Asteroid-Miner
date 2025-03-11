/**
 * Component Base Class - Foundation for all ECS components
 * 
 * Components hold data and state but typically have no logic.
 * They can define lifecycle methods that are called by the entity system.
 */

export class Component {
    constructor() {
        this.entity = null;
        this.enabled = true;
    }
    
    /**
     * Called when the component is attached to an entity
     * Override in derived components if needed
     */
    onAttached() {}
    
    /**
     * Called when the component is detached from an entity
     * Override in derived components if needed
     */
    onDetached() {}
    
    /**
     * Called when the component is enabled
     * Override in derived components if needed
     */
    onEnabled() {}
    
    /**
     * Called when the component is disabled
     * Override in derived components if needed
     */
    onDisabled() {}
    
    /**
     * Enable this component
     * @returns {Component} This component for chaining
     */
    enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.onEnabled();
        }
        return this;
    }
    
    /**
     * Disable this component
     * @returns {Component} This component for chaining
     */
    disable() {
        if (this.enabled) {
            this.enabled = false;
            this.onDisabled();
        }
        return this;
    }
}