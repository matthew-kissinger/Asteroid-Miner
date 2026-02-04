// helpers.js - Utility functions and formatting for HUD components

export class HUDHelpers {
    /**
     * Format a number with appropriate units (K, M, B)
     */
    static formatNumber(num: number): string {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * Format time in MM:SS format
     */
    static formatTime(milliseconds: number): string {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Format coordinates for display
     */
    static formatCoordinates(x: number, y: number, z: number): string {
        return `X: ${Math.round(x)} Y: ${Math.round(y)} Z: ${Math.round(z)}`;
    }

    /**
     * Format distance with appropriate units
     */
    static formatDistance(distance: number): string {
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)} km`;
        }
        return `${Math.round(distance)} m`;
    }

    /**
     * Format percentage for display
     */
    static formatPercentage(value: number, maxValue: number): number {
        if (maxValue === 0) return 0;
        return Math.round((value / maxValue) * 100);
    }

    /**
     * Get color based on percentage value (green to red)
     */
    static getStatusColor(percentage: number): string {
        if (percentage >= 75) {
            return 'rgba(95, 255, 143, 0.8)'; // Green
        } else if (percentage >= 50) {
            return 'rgba(255, 255, 95, 0.8)'; // Yellow
        } else if (percentage >= 25) {
            return 'rgba(255, 204, 0, 0.8)'; // Orange
        } else {
            return 'rgba(255, 80, 80, 0.8)'; // Red
        }
    }

    /**
     * Get fuel color based on fuel level
     */
    static getFuelColor(fuelPercent: number): string {
        if (fuelPercent < 20) {
            return 'rgba(255, 80, 80, 0.8)'; // Red for critical
        } else if (fuelPercent < 40) {
            return 'rgba(255, 204, 0, 0.8)'; // Yellow for low
        } else {
            return 'rgba(120, 220, 232, 0.8)'; // Blue for normal
        }
    }

    /**
     * Get shield color based on shield level
     */
    static getShieldColor(shieldPercent: number): string {
        if (shieldPercent < 25) {
            return 'rgba(255, 80, 80, 0.8)'; // Red for low shields
        } else if (shieldPercent < 50) {
            return 'rgba(255, 204, 0, 0.8)'; // Yellow for medium shields
        } else {
            return 'rgba(51, 153, 255, 0.8)'; // Blue for healthy shields
        }
    }

    /**
     * Get hull color based on hull integrity
     */
    static getHullColor(hullPercent: number): string {
        if (hullPercent < 30) {
            return 'rgba(255, 80, 80, 0.8)'; // Red for critical damage
        } else if (hullPercent < 60) {
            return 'rgba(255, 204, 0, 0.8)'; // Yellow for damaged
        } else {
            return 'rgba(120, 220, 232, 0.8)'; // Blue for intact
        }
    }

    /**
     * Check if device is mobile
     */
    static isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
               window.innerWidth <= 768;
    }

    /**
     * Clamp a value between min and max
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     */
    static lerp(start: number, end: number, factor: number): number {
        return start + (end - start) * factor;
    }

    /**
     * Convert degrees to radians
     */
    static degToRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     */
    static radToDeg(radians: number): number {
        return radians * (180 / Math.PI);
    }

    /**
     * Get resource icon color based on type
     */
    static getResourceColor(resourceType: string): string {
        switch (resourceType.toLowerCase()) {
            case 'iron':
                return 'rgba(180, 180, 180, 0.8)';
            case 'gold':
                return 'rgba(255, 215, 0, 0.8)';
            case 'platinum':
                return 'rgba(229, 228, 226, 0.8)';
            case 'titanium':
                return 'rgba(135, 135, 135, 0.8)';
            case 'uranium':
                return 'rgba(0, 255, 0, 0.8)';
            default:
                return 'rgba(120, 220, 232, 0.8)';
        }
    }

    /**
     * Generate a random ID for temporary elements
     */
    static generateId(prefix: string = 'hud'): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Debounce function to limit how often a function can be called
     */
    static debounce(func: Function, wait: number): (...args: any[]) => void {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function to limit how often a function can be called
     */
    static throttle(func: Function, limit: number): (...args: any[]) => void {
        let inThrottle: boolean;
        return function(this: any) {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Safe access to nested object properties
     */
    static safeGet(obj: Record<string, any>, path: string, defaultValue: any = null): any {
        try {
            return path.split('.').reduce((current, key) => current[key], obj) ?? defaultValue;
        } catch {
            return defaultValue;
        }
    }

    /**
     * Check if an element is visible in the viewport
     */
    static isElementVisible(element: HTMLElement | null): boolean {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Get the current game state safely
     */
    static getGameState(): string {
        return HUDHelpers.safeGet(window, 'game.state', 'unknown');
    }

    /**
     * Get player data safely
     */
    static getPlayerData(): any {
        try {
            if (window.game && window.game.world) {
                const players: any[] = window.game.world.getEntitiesByTag('player');
                return players && players.length > 0 ? players[0] : null;
            }
        } catch (e: any) {
            console.error('Error accessing player data:', e);
        }
        return null;
    }

    /**
     * Get player health component safely
     */
    static getPlayerHealthComponent(): any {
        const player: any = HUDHelpers.getPlayerData();
        if (player) {
            try {
                return player.getComponent('HealthComponent');
            } catch (e: any) {
                console.error('Error accessing health component:', e);
            }
        }
        return null;
    }

    /**
     * Validate and sanitize user input
     */
    static sanitizeString(str: string): string {
        if (typeof str !== 'string') return '';
        return str.replace(/[<>'"&]/g, '');
    }

    /**
     * Check if a value is numeric
     */
    static isNumeric(value: any): boolean {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    /**
     * Get optimal text color for given background color
     */
    static getOptimalTextColor(backgroundColor: string): string {
        // Simple luminance calculation to determine if text should be light or dark
        const rgb: number[] | null = backgroundColor.match(/\d+/g)?.map(Number) || null;
        if (rgb && rgb.length >= 3) {
            const luminance: number = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
            return luminance > 0.5 ? '#000000' : '#ffffff';
        }
        return '#ffffff'; // Default to white
    }
}