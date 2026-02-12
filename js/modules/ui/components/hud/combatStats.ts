/**
 * Combat Stats HUD Component - Displays live combat performance statistics
 *
 * Shows:
 * - Kill counter (total enemies destroyed)
 * - DPS meter (damage per second, rolling 10s average)
 * - Accuracy percentage (hits / shots fired)
 *
 * Updates at 2 Hz (every 500ms) to reduce overhead.
 * Fades in smoothly when player first engages in combat.
 */

import { HUDStyles } from './styles.ts';
import type { CombatStats } from '../../../combat/combatStats.ts';

export class CombatStatsHUD {
    private container: HTMLDivElement | null = null;
    private killsValue: HTMLSpanElement | null = null;
    private dpsValue: HTMLSpanElement | null = null;
    private accuracyValue: HTMLSpanElement | null = null;

    private combatStats: CombatStats | null = null;
    private updateInterval: number | null = null;
    private visible: boolean = false;

    private readonly UPDATE_RATE_MS = 500; // 2 Hz (500ms interval)

    /**
     * Create the combat stats HUD element
     */
    create(parent: HTMLElement, combatStats: CombatStats): HTMLDivElement {
        this.combatStats = combatStats;

        // Main container
        this.container = document.createElement('div');
        this.container.id = 'combat-stats';
        this.container.className = 'hud-panel';

        // Detect mobile for positioning
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
                         window.innerWidth <= 768;

        const positionStyles = isMobile ? {
            top: '80px',
            right: '15px'
        } : {
            top: '20px',
            right: '20px'
        };

        HUDStyles.applyStyles(this.container, {
            position: 'fixed',
            width: '200px',
            padding: '12px 15px',
            backgroundColor: 'rgba(6, 22, 31, 0.7)',
            backdropFilter: 'blur(5px)',
            borderRadius: '8px',
            border: '1px solid rgba(120, 220, 232, 0.3)',
            boxShadow: '0 0 15px rgba(120, 220, 232, 0.2)',
            fontFamily: '"Rajdhani", "Electrolize", sans-serif',
            fontSize: '13px',
            color: 'rgba(120, 220, 232, 0.9)',
            zIndex: '998',
            opacity: '0',
            transition: 'opacity 0.5s ease-in',
            pointerEvents: 'none',
            ...positionStyles
        });

        parent.appendChild(this.container);

        // Panel header
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = '<span>COMBAT</span>';
        HUDStyles.applyStyles(header, HUDStyles.getPanelHeaderStyles());
        this.container.appendChild(header);

        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        HUDStyles.applyStyles(statusIndicator, HUDStyles.getStatusIndicatorStyles());
        header.appendChild(statusIndicator);

        // Create stat rows
        this.createStatRow(this.container, 'KILLS', 'kills', '0', 'rgba(255, 80, 80, 0.9)');
        this.createStatRow(this.container, 'DPS', 'dps', '0', 'rgba(255, 153, 51, 0.9)');
        this.createStatRow(this.container, 'ACCURACY', 'accuracy', '0%', 'rgba(120, 220, 100, 0.9)');

        // Add corner decorative elements
        HUDStyles.addCornerElements(this.container);

        // Cache value elements
        this.killsValue = document.getElementById('combat-kills-value') as HTMLSpanElement;
        this.dpsValue = document.getElementById('combat-dps-value') as HTMLSpanElement;
        this.accuracyValue = document.getElementById('combat-accuracy-value') as HTMLSpanElement;

        // Start update loop
        this.startUpdateLoop();

        return this.container;
    }

    /**
     * Create a single stat row
     */
    private createStatRow(parent: HTMLElement, label: string, id: string, initialValue: string, color: string): void {
        const row = document.createElement('div');
        HUDStyles.applyStyles(row, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(120, 220, 232, 0.15)'
        });

        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        HUDStyles.applyStyles(labelSpan, {
            fontSize: '11px',
            color: 'rgba(120, 220, 232, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        });

        const valueSpan = document.createElement('span');
        valueSpan.id = `combat-${id}-value`;
        valueSpan.textContent = initialValue;
        HUDStyles.applyStyles(valueSpan, {
            fontSize: '14px',
            fontWeight: '600',
            color: color
        });

        row.appendChild(labelSpan);
        row.appendChild(valueSpan);
        parent.appendChild(row);
    }

    /**
     * Start the update loop (2 Hz throttled)
     */
    private startUpdateLoop(): void {
        this.updateInterval = window.setInterval(() => {
            this.update();
        }, this.UPDATE_RATE_MS);
    }

    /**
     * Update displayed stats
     */
    private update(): void {
        if (!this.combatStats || !this.container) return;

        // Check if combat has started
        const hasEngaged = this.combatStats.hasEngagedCombat();

        // Show panel on first combat engagement
        if (hasEngaged && !this.visible) {
            this.show();
        }

        // Update values
        if (this.killsValue) {
            this.killsValue.textContent = `${this.combatStats.getKills()}`;
        }

        if (this.dpsValue) {
            const dps = this.combatStats.getDPS();
            this.dpsValue.textContent = `${Math.round(dps)}`;
        }

        if (this.accuracyValue) {
            const accuracy = this.combatStats.getAccuracy();
            this.accuracyValue.textContent = `${accuracy.toFixed(1)}%`;
        }
    }

    /**
     * Show the combat stats panel (fade in)
     */
    private show(): void {
        if (!this.container || this.visible) return;

        this.container.style.opacity = '1';
        this.visible = true;
    }

    /**
     * Hide the combat stats panel (fade out)
     */
    hide(): void {
        if (!this.container || !this.visible) return;

        this.container.style.opacity = '0';
        this.visible = false;
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        if (this.updateInterval !== null) {
            window.clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }

        this.container = null;
        this.killsValue = null;
        this.dpsValue = null;
        this.accuracyValue = null;
        this.combatStats = null;
        this.visible = false;
    }
}
