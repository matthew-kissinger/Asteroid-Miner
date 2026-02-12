// hud.js - Refactored HUD orchestrator class

import { HUDStyles } from './components/hud/styles.ts';
import { HUDDisplays } from './components/hud/displays.ts';
import { HUDNotifications } from './components/hud/notifications.ts';
import { HUDStatusIndicators } from './components/hud/statusIndicators.ts';
import { HUDEventHandlers } from './components/hud/eventHandlers.ts';
import { HUDHelpers } from './components/hud/helpers.ts';
import { HUDXpBar } from './components/hud/xpBar.ts';
import { StargateIndicator } from './components/hud/stargateIndicator.ts';
import { CombatStatsHUD } from './components/hud/combatStats.ts';
import type { CombatStats } from '../combat/combatStats.ts';

type HUDSpaceship = {
    [key: string]: unknown;
};

type HUDNotificationType = 'info' | 'warning' | 'error' | 'success';

export class HUD {
    spaceship: HUDSpaceship | null;
    eventHandlers: HUDEventHandlers | null;
    xpBar: HUDXpBar | null = null;
    stargateIndicator: StargateIndicator | null = null;
    world: any = null;
    settings: any = null;
    camera: any = null;
    combatStatsHUD: CombatStatsHUD | null = null;

    constructor(spaceship: HUDSpaceship) {
        this.spaceship = spaceship;
        this.eventHandlers = new HUDEventHandlers();
        this.xpBar = new HUDXpBar();
        this.stargateIndicator = new StargateIndicator();
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
        this.xpBar?.create(hudContainer);
        this.stargateIndicator?.init(hudContainer);
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
        HUDStatusIndicators.updateShieldDisplay(this.spaceship, this.world);
        HUDStatusIndicators.updateHullDisplay(this.spaceship, this.world);
        HUDStatusIndicators.updateFuelDisplay(this.spaceship);
        HUDStatusIndicators.updateCreditsDisplay(this.spaceship);

        // Update XP bar
        this.xpBar?.update(this.spaceship);

        // Update stargate indicator
        if (this.stargateIndicator && this.camera && (this.spaceship as any).mesh) {
            this.stargateIndicator.update(this.camera, (this.spaceship as any).mesh.position);
        }

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
        HUDStatusIndicators.updateFPS(fps, cap ?? 0, this.settings);
    }
    
    hide(): void {
        this.eventHandlers?.hide();
    }
    
    show(): void {
        this.eventHandlers?.show();
    }
    
    destroy(): void {
        this.eventHandlers?.destroy();
        this.xpBar?.destroy();
        this.xpBar = null;
        this.stargateIndicator?.destroy();
        this.stargateIndicator = null;

        // Dispose combat stats HUD
        if (this.combatStatsHUD) {
            this.combatStatsHUD.dispose();
            this.combatStatsHUD = null;
        }

        // Remove DOM elements
        const hudContainer = document.getElementById('hud-container') as HTMLDivElement | null;
        if (hudContainer && hudContainer.parentNode) {
            hudContainer.parentNode.removeChild(hudContainer);
        }

        // Clear references
        this.spaceship = null;
        this.eventHandlers = null;
        this.camera = null;
    }

    /**
     * Initialize combat stats HUD with combat stats tracker
     */
    initializeCombatStats(combatStats: CombatStats): void {
        if (this.combatStatsHUD) {
            this.combatStatsHUD.dispose();
        }

        const hudContainer = document.getElementById('hud-container');
        if (!hudContainer) return;

        this.combatStatsHUD = new CombatStatsHUD();
        this.combatStatsHUD.create(hudContainer, combatStats);
    }
    
    // Backward compatibility methods
    updateShieldDisplay(): void {
        HUDStatusIndicators.updateShieldDisplay(this.spaceship, this.world);
    }

    updateHullDisplay(): void {
        HUDStatusIndicators.updateHullDisplay(this.spaceship, this.world);
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
