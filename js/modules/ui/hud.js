// hud.js - Refactored HUD orchestrator class

import { HUDStyles } from './components/hud/styles.js';
import { HUDDisplays } from './components/hud/displays.js';
import { HUDNotifications } from './components/hud/notifications.js';
import { HUDMinimap } from './components/hud/minimap.js';
import { HUDStatusIndicators } from './components/hud/statusIndicators.js';
import { HUDEventHandlers } from './components/hud/eventHandlers.js';
import { HUDHelpers } from './components/hud/helpers.js';

export class HUD {
    constructor(spaceship) {
        this.spaceship = spaceship;
        this.eventHandlers = new HUDEventHandlers();
        this.setupHUD();
        this.eventHandlers.animateHudIn();
    }
    
    setupHUD() {
        // Initialize styles first
        HUDStyles.initializeStyles();
        
        // Create main HUD container
        const hudContainer = this.createMainContainer();
        
        // Create scanline effect and get reference
        const scanline = HUDStatusIndicators.createScanlineEffect(hudContainer);
        this.eventHandlers.setScanline(scanline);
        
        // Create all HUD panels
        HUDDisplays.createFlightPanel(hudContainer);
        HUDDisplays.createStatusPanel(hudContainer);
        HUDStatusIndicators.createTargetingSystem(hudContainer);
        HUDDisplays.createLocationPanel(hudContainer);
        HUDDisplays.createResourcePanel(hudContainer);
        HUDNotifications.createNotificationsArea(hudContainer);
    }
    
    createMainContainer() {
        const hudContainer = document.createElement('div');
        hudContainer.id = 'hud-container';
        HUDStyles.applyStyles(hudContainer, HUDStyles.getMainContainerStyles());
        document.body.appendChild(hudContainer);
        return hudContainer;
    }
    
    update() {
        if (!this.spaceship) return;
        
        // Update all status indicators
        HUDStatusIndicators.updateShieldDisplay(this.spaceship);
        HUDStatusIndicators.updateHullDisplay(this.spaceship);
        HUDStatusIndicators.updateFuelDisplay(this.spaceship);
        HUDStatusIndicators.updateCreditsDisplay(this.spaceship);
        
        // Update horde mode display
        HUDNotifications.updateHordeModeDisplay();
    }
    
    updateLocation(locationName, systemName = 'Unknown System') {
        HUDStatusIndicators.updateLocation(locationName, systemName);
        this.eventHandlers.handleLocationChange(locationName, systemName);
    }
    
    updateCoordinates(x, y, z) {
        HUDStatusIndicators.updateCoordinates(x, y, z);
    }
    
    updateFPS(fps, cap) {
        HUDStatusIndicators.updateFPS(fps, cap);
    }
    
    hide() {
        this.eventHandlers.hide();
    }
    
    show() {
        this.eventHandlers.show();
    }
    
    destroy() {
        this.eventHandlers.destroy();
        
        // Remove DOM elements
        const hudContainer = document.getElementById('hud-container');
        if (hudContainer && hudContainer.parentNode) {
            hudContainer.parentNode.removeChild(hudContainer);
        }
        
        // Clear references
        this.spaceship = null;
        this.eventHandlers = null;
    }
    
    // Backward compatibility methods
    updateShieldDisplay() {
        HUDStatusIndicators.updateShieldDisplay(this.spaceship);
    }
    
    updateHullDisplay() {
        HUDStatusIndicators.updateHullDisplay(this.spaceship);
    }
    
    updateHordeModeDisplay() {
        HUDNotifications.updateHordeModeDisplay();
    }
    
    // Utility methods for external access
    showNotification(message, type = 'info', duration = 3000) {
        HUDNotifications.showNotification(message, type, duration);
    }
    
    showCriticalAlert(message) {
        HUDNotifications.showCriticalAlert(message);
    }
    
    // Helper method access
    static get helpers() {
        return HUDHelpers;
    }
}

// Maintain backward compatibility as default export
export default HUD;