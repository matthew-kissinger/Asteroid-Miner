// helpers.ts - Utility functions and formatting for combat display

import type { Camera, Vector3 } from 'three';
import { combatStyles } from './styles';

export interface ScreenPosition {
    x: number;
    y: number;
}

export class CombatHelpers {
    /**
     * Create a standardized UI item with label and value
     * @param label Label text
     * @param id Element ID for the value span
     * @param styles Styles object
     * @returns UI item element
     */
    static createUIItem(label: string, id: string, styles: typeof combatStyles): HTMLElement {
        const item = document.createElement('div');
        item.className = 'ui-item';
        styles.applyUIItemStyles(item);
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'ui-label';
        labelSpan.textContent = label;
        styles.applyUILabelStyles(labelSpan);
        item.appendChild(labelSpan);
        
        const valueSpan = document.createElement('span');
        valueSpan.id = id;
        valueSpan.className = 'ui-value';
        valueSpan.textContent = '--';
        styles.applyUIValueStyles(valueSpan);
        item.appendChild(valueSpan);
        
        return item;
    }

    /**
     * Create a stat item for combat statistics
     * @param label Stat label
     * @param id Element ID for the value span
     * @param styles Styles object
     * @returns Stat item element
     */
    static createStatItem(label: string, id: string, styles: typeof combatStyles): HTMLElement {
        const statItem = document.createElement('div');
        styles.applyStatItemStyles(statItem);
        
        const statLabel = document.createElement('span');
        statLabel.textContent = label;
        styles.applyStatLabelStyles(statLabel);
        statItem.appendChild(statLabel);
        
        const statValue = document.createElement('span');
        statValue.id = id;
        statValue.textContent = '0';
        styles.applyStatValueStyles(statValue);
        statItem.appendChild(statValue);
        
        return statItem;
    }

    /**
     * Create a progress bar (health, shield, energy, etc.)
     * @param containerId Container element ID
     * @param barId Bar element ID
     * @param styles Styles object
     * @param containerStyleFn Style function for container
     * @param barStyleFn Style function for bar
     * @returns Container and bar elements
     */
    static createProgressBar(
        containerId: string, 
        barId: string, 
        styles: typeof combatStyles, 
        containerStyleFn: (this: typeof combatStyles, el: HTMLElement) => void, 
        barStyleFn: (this: typeof combatStyles, el: HTMLElement) => void
    ): { container: HTMLElement; bar: HTMLElement } {
        const container = document.createElement('div');
        container.id = containerId;
        containerStyleFn.call(styles, container);
        
        const bar = document.createElement('div');
        bar.id = barId;
        barStyleFn.call(styles, bar);
        
        container.appendChild(bar);
        
        return { container, bar };
    }

    /**
     * Create combat controls hint
     * @param styles Styles object
     * @returns Controls hint element
     */
    static createControlsHint(styles: typeof combatStyles): HTMLElement {
        const controlsHint = document.createElement('div');
        styles.applyControlsHintStyles(controlsHint);
        controlsHint.innerHTML = `
            <div class="combat-controls-heading">COMBAT CONTROLS:</div>
            <div>• RMB: Fire Primary</div>
            <div>• MMB: Fire Secondary/Missile</div>
            <div>• Z: Shield</div>
            <div>• X: EMP Burst</div>
            <div>• C: Toggle Turrets</div>
            <div>• F: Cycle Weapons</div>
        `;
        return controlsHint;
    }

    /**
     * Create notification area
     * @param styles Styles object
     * @returns Notification area element
     */
    static createNotificationArea(styles: typeof combatStyles): HTMLElement {
        const notificationArea = document.createElement('div');
        notificationArea.id = 'notification-area';
        styles.applyNotificationStyles(notificationArea);
        return notificationArea;
    }

    /**
     * Format percentage for display
     * @param current Current value
     * @param max Maximum value
     * @returns Percentage (0-100)
     */
    static formatPercentage(current: number, max: number): number {
        if (max === 0) return 0;
        return Math.max(0, Math.min(100, (current / max) * 100));
    }

    /**
     * Format value display text
     * @param current Current value
     * @param max Maximum value
     * @returns Formatted text "current/max"
     */
    static formatValueDisplay(current: number, max: number): string {
        return `${Math.round(current)}/${Math.round(max)}`;
    }

    /**
     * Get health color based on percentage
     * @param percentage Health percentage (0-100)
     * @returns Color hex string
     */
    static getHealthColor(percentage: number): string {
        if (percentage < 25) return '#ff3030'; // Red for critical
        if (percentage < 50) return '#ffcc00'; // Yellow for damaged
        return '#ff9900'; // Orange for healthy
    }

    /**
     * Get shield color based on percentage
     * @param percentage Shield percentage (0-100)
     * @returns Color hex string
     */
    static getShieldColor(percentage: number): string {
        if (percentage < 25) return '#ff3030'; // Red for low shields
        if (percentage < 50) return '#ffcc00'; // Yellow for mid shields
        return '#3399ff'; // Blue for healthy shields
    }

    /**
     * World position to screen coordinates helper
     * @param position World position
     * @param camera Camera object
     * @returns Screen coordinates {x, y}
     */
    static worldToScreen(position: Vector3 | null, camera: Camera | null): ScreenPosition | null {
        if (!camera || !position) return null;
        
        const vector = position.clone();
        
        // Apply the camera projection
        vector.project(camera);
        
        // Convert to screen coordinates
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;
        
        // Check if position is in front of the camera (z <= 1)
        if (vector.z > 1) return null;
        
        return {
            x: (vector.x * widthHalf) + widthHalf,
            y: -(vector.y * heightHalf) + heightHalf
        };
    }

    /**
     * Get enemy count from game systems
     * @returns Current enemy count
     */
    static getEnemyCount(): number {
        const game = (window as any).game;
        if (game && game.enemySystem) {
            return game.enemySystem.enemies.size;
        } else if (game && game.combatManager) {
            return game.combatManager.enemies.length;
        }
        return 0;
    }

    /**
     * Safely get component from entity
     * @param entity Entity object
     * @param componentType Component type name
     * @returns Component or null
     */
    static getComponent(entity: any, componentType: string): any {
        if (!entity || !entity.getComponent) return null;
        
        try {
            return entity.getComponent(componentType);
        } catch (error) {
            console.warn(`Failed to get component ${componentType}:`, error);
            return null;
        }
    }

    /**
     * Safely get property from object
     * @param obj Object to get property from
     * @param path Property path (e.g., 'health.shield')
     * @param defaultValue Default value if property doesn't exist
     * @returns Property value or default
     */
    static safeGet(obj: any, path: string, defaultValue: any = null): any {
        if (!obj) return defaultValue;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current == null || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current !== undefined ? current : defaultValue;
    }

    /**
     * Debounce function calls
     * @param func Function to debounce
     * @param wait Wait time in milliseconds
     * @returns Debounced function
     */
    static debounce(func: Function, wait: number): Function {
        let timeout: any;
        return function executedFunction(this: any, ...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     * @param func Function to throttle
     * @param limit Time limit in milliseconds
     * @returns Throttled function
     */
    static throttle(func: Function, limit: number): Function {
        let inThrottle: boolean;
        return function(this: any, ...args: any[]) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Clamp value between min and max
     * @param value Value to clamp
     * @param min Minimum value
     * @param max Maximum value
     * @returns Clamped value
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     * @param start Start value
     * @param end End value
     * @param t Interpolation factor (0-1)
     * @returns Interpolated value
     */
    static lerp(start: number, end: number, t: number): number {
        return start + (end - start) * this.clamp(t, 0, 1);
    }

    /**
     * Format large numbers with appropriate suffixes
     * @param num Number to format
     * @returns Formatted number string
     */
    static formatLargeNumber(num: number): string {
        if (num < 1000) return num.toString();
        if (num < 1000000) return Math.floor(num / 100) / 10 + 'K';
        if (num < 1000000000) return Math.floor(num / 100000) / 10 + 'M';
        return Math.floor(num / 100000000) / 10 + 'B';
    }

    /**
     * Get weapon type display name
     * @param weaponType Internal weapon type
     * @returns Display name
     */
    static getWeaponDisplayName(weaponType: string): string {
        const names: Record<string, string> = {
            'ParticleCannonComponent': 'Particle Cannon',
            'MissileComponent': 'Missile System',
            'TurretComponent': 'Laser Turrets',
            'EMPComponent': 'EMP Burst',
            'LaserComponent': 'Laser Cannon',
            'PlasmaComponent': 'Plasma Cannon'
        };
        
        return names[weaponType] || weaponType.replace('Component', '');
    }

    /**
     * Get faction display name
     * @param faction Internal faction name
     * @returns Display name
     */
    static getFactionDisplayName(faction: string | null): string {
        if (!faction) return 'Unknown';
        return faction.charAt(0).toUpperCase() + faction.slice(1);
    }

    /**
     * Get enemy type display name
     * @param type Internal enemy type
     * @returns Display name
     */
    static getEnemyTypeDisplayName(type: string | null): string {
        if (!type) return 'Unknown';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Check if element is visible in viewport
     * @param element Element to check
     * @returns True if element is visible
     */
    static isElementVisible(element: HTMLElement | null): boolean {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.right <= window.innerWidth;
    }

    /**
     * Animate value change with smooth transition
     * @param from Starting value
     * @param to Ending value
     * @param duration Animation duration in ms
     * @param updateCallback Callback to update display
     * @param easeFunction Easing function (optional)
     */
    static animateValue(
        from: number, 
        to: number, 
        duration: number, 
        updateCallback: (val: number) => void, 
        easeFunction: ((t: number) => number) | null = null
    ): void {
        const startTime = Date.now();
        const change = to - from;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            let easedProgress = progress;
            if (easeFunction) {
                easedProgress = easeFunction(progress);
            }
            
            const currentValue = from + change * easedProgress;
            updateCallback(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * Easing function - ease out cubic
     * @param t Time parameter (0-1)
     * @returns Eased value
     */
    static easeOutCubic(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Easing function - ease in out cubic
     * @param t Time parameter (0-1)
     * @returns Eased value
     */
    static easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}