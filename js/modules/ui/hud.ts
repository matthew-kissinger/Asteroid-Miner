// hud.js - Refactored HUD orchestrator class

import { HUDStyles } from './components/hud/styles.js';
import { HUDDisplays } from './components/hud/displays.js';
import { HUDNotifications } from './components/hud/notifications.js';
import { HUDStatusIndicators } from './components/hud/statusIndicators.js';
import { HUDEventHandlers } from './components/hud/eventHandlers.js';
import { HUDHelpers } from './components/hud/helpers.js';

type HUDSpaceship = {
    [key: string]: unknown;
};

type HUDNotificationType = 'info' | 'warning' | 'error' | 'success';

export class HUD {
    spaceship: HUDSpaceship | null;
    eventHandlers: HUDEventHandlers | null;

    constructor(spaceship: HUDSpaceship) {
        this.spaceship = spaceship;
        this.eventHandlers = new HUDEventHandlers();
        this.setupHUD();
        this.eventHandlers?.animateHudIn();
    }
    
    setupHUD(): void {
        // Initialize styles first
        HUDStyles.initializeStyles();
        
        // Create main HUD container
        const hudContainer = this.createMainContainer();
        
        // Create scanline effect and get reference
        const scanline = HUDStatusIndicators.createScanlineEffect(hudContainer);
        if (scanline) {
            this.eventHandlers?.setScanline(scanline);
        }
        
        // Create all HUD panels
        HUDDisplays.createFlightPanel(hudContainer);
        HUDDisplays.createStatusPanel(hudContainer);
        HUDStatusIndicators.createTargetingSystem(hudContainer);
        HUDDisplays.createLocationPanel(hudContainer);
        HUDDisplays.createResourcePanel(hudContainer);
        HUDNotifications.createNotificationsArea(hudContainer);
    }
    
    createMainContainer(): HTMLDivElement {
        const hudContainer = document.createElement('div');
        hudContainer.id = 'hud-container';
        HUDStyles.applyStyles(hudContainer, HUDStyles.getMainContainerStyles());
        document.body.appendChild(hudContainer);
        return hudContainer;
    }
    
    update(): void {
        if (!this.spaceship) return;
        
        // Update all status indicators
        HUDStatusIndicators.updateShieldDisplay(this.spaceship);
        HUDStatusIndicators.updateHullDisplay(this.spaceship);
        HUDStatusIndicators.updateFuelDisplay(this.spaceship);
        HUDStatusIndicators.updateCreditsDisplay(this.spaceship);
        
        // Update horde mode display
        HUDNotifications.updateHordeModeDisplay();
    }
    
    updateLocation(locationName: string | null, systemName = 'Unknown System'): void {
        const safeLocation = locationName ?? 'Unknown Location';
        HUDStatusIndicators.updateLocation(safeLocation, systemName);
        this.eventHandlers?.handleLocationChange(safeLocation, systemName);
    }
    
    updateCoordinates(x: number, y: number, z: number): void {
        HUDStatusIndicators.updateCoordinates(x, y, z);
    }
    
    updateFPS(fps: number, cap?: number): void {
        HUDStatusIndicators.updateFPS(fps, cap ?? 0);
    }
    
    hide(): void {
        this.eventHandlers?.hide();
    }
    
    show(): void {
        this.eventHandlers?.show();
    }
    
    destroy(): void {
        this.eventHandlers?.destroy();
        
        // Remove DOM elements
        const hudContainer = document.getElementById('hud-container') as HTMLDivElement | null;
        if (hudContainer && hudContainer.parentNode) {
            hudContainer.parentNode.removeChild(hudContainer);
        }
        
        // Clear references
        this.spaceship = null;
        this.eventHandlers = null;
    }
    
    // Backward compatibility methods
    updateShieldDisplay(): void {
        HUDStatusIndicators.updateShieldDisplay(this.spaceship);
    }
    
    updateHullDisplay(): void {
        HUDStatusIndicators.updateHullDisplay(this.spaceship);
    }
    
    updateHordeModeDisplay(): void {
        HUDNotifications.updateHordeModeDisplay();
    }
    
    // Utility methods for external access
    showNotification(message: string, type: HUDNotificationType = 'info', duration = 3000): void {
        HUDNotifications.showNotification(message, type, duration);
    }
    
    showCriticalAlert(message: string): void {
        HUDNotifications.showCriticalAlert(message);
    }
    
    // Helper method access
    static get helpers() {
        return HUDHelpers;
    }
}

// Maintain backward compatibility as default export
export default HUD;
