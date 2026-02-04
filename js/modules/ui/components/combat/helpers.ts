// helpers.js - Utility functions and formatting for combat display

export class CombatHelpers {
    /**
     * Create a standardized UI item with label and value
     * @param {string} label Label text
     * @param {string} id Element ID for the value span
     * @param {Object} styles Styles object
     * @returns {HTMLElement} UI item element
     */
    static createUIItem(label, id, styles) {
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
     * @param {string} label Stat label
     * @param {string} id Element ID for the value span
     * @param {Object} styles Styles object
     * @returns {HTMLElement} Stat item element
     */
    static createStatItem(label, id, styles) {
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
     * @param {string} containerId Container element ID
     * @param {string} barId Bar element ID
     * @param {Object} styles Styles object
     * @param {Function} containerStyleFn Style function for container
     * @param {Function} barStyleFn Style function for bar
     * @returns {Object} Container and bar elements
     */
    static createProgressBar(containerId, barId, styles, containerStyleFn, barStyleFn) {
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
     * @param {Object} styles Styles object
     * @returns {HTMLElement} Controls hint element
     */
    static createControlsHint(styles) {
        const controlsHint = document.createElement('div');
        styles.applyControlsHintStyles(controlsHint);
        controlsHint.innerHTML = `
            <div style="margin-bottom:3px;">COMBAT CONTROLS:</div>
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
     * @param {Object} styles Styles object
     * @returns {HTMLElement} Notification area element
     */
    static createNotificationArea(styles) {
        const notificationArea = document.createElement('div');
        notificationArea.id = 'notification-area';
        styles.applyNotificationStyles(notificationArea);
        return notificationArea;
    }

    /**
     * Format percentage for display
     * @param {number} current Current value
     * @param {number} max Maximum value
     * @returns {number} Percentage (0-100)
     */
    static formatPercentage(current, max) {
        if (max === 0) return 0;
        return Math.max(0, Math.min(100, (current / max) * 100));
    }

    /**
     * Format value display text
     * @param {number} current Current value
     * @param {number} max Maximum value
     * @returns {string} Formatted text "current/max"
     */
    static formatValueDisplay(current, max) {
        return `${Math.round(current)}/${Math.round(max)}`;
    }

    /**
     * Get health color based on percentage
     * @param {number} percentage Health percentage (0-100)
     * @returns {string} Color hex string
     */
    static getHealthColor(percentage) {
        if (percentage < 25) return '#ff3030'; // Red for critical
        if (percentage < 50) return '#ffcc00'; // Yellow for damaged
        return '#ff9900'; // Orange for healthy
    }

    /**
     * Get shield color based on percentage
     * @param {number} percentage Shield percentage (0-100)
     * @returns {string} Color hex string
     */
    static getShieldColor(percentage) {
        if (percentage < 25) return '#ff3030'; // Red for low shields
        if (percentage < 50) return '#ffcc00'; // Yellow for mid shields
        return '#3399ff'; // Blue for healthy shields
    }

    /**
     * World position to screen coordinates helper
     * @param {THREE.Vector3} position World position
     * @param {THREE.Camera} camera Camera object
     * @returns {Object|null} Screen coordinates {x, y}
     */
    static worldToScreen(position, camera) {
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
     * @returns {number} Current enemy count
     */
    static getEnemyCount() {
        if (window.game && window.game.enemySystem) {
            return window.game.enemySystem.enemies.size;
        } else if (window.game && window.game.combatManager) {
            return window.game.combatManager.enemies.length;
        }
        return 0;
    }

    /**
     * Safely get component from entity
     * @param {Object} entity Entity object
     * @param {string} componentType Component type name
     * @returns {Object|null} Component or null
     */
    static getComponent(entity, componentType) {
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
     * @param {Object} obj Object to get property from
     * @param {string} path Property path (e.g., 'health.shield')
     * @param {*} defaultValue Default value if property doesn't exist
     * @returns {*} Property value or default
     */
    static safeGet(obj, path, defaultValue = null) {
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
     * @param {Function} func Function to debounce
     * @param {number} wait Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func Function to throttle
     * @param {number} limit Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Clamp value between min and max
     * @param {number} value Value to clamp
     * @param {number} min Minimum value
     * @param {number} max Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     * @param {number} start Start value
     * @param {number} end End value
     * @param {number} t Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(start, end, t) {
        return start + (end - start) * this.clamp(t, 0, 1);
    }

    /**
     * Format large numbers with appropriate suffixes
     * @param {number} num Number to format
     * @returns {string} Formatted number string
     */
    static formatLargeNumber(num) {
        if (num < 1000) return num.toString();
        if (num < 1000000) return Math.floor(num / 100) / 10 + 'K';
        if (num < 1000000000) return Math.floor(num / 100000) / 10 + 'M';
        return Math.floor(num / 100000000) / 10 + 'B';
    }

    /**
     * Get weapon type display name
     * @param {string} weaponType Internal weapon type
     * @returns {string} Display name
     */
    static getWeaponDisplayName(weaponType) {
        const names = {
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
     * @param {string} faction Internal faction name
     * @returns {string} Display name
     */
    static getFactionDisplayName(faction) {
        if (!faction) return 'Unknown';
        return faction.charAt(0).toUpperCase() + faction.slice(1);
    }

    /**
     * Get enemy type display name
     * @param {string} type Internal enemy type
     * @returns {string} Display name
     */
    static getEnemyTypeDisplayName(type) {
        if (!type) return 'Unknown';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Check if element is visible in viewport
     * @param {HTMLElement} element Element to check
     * @returns {boolean} True if element is visible
     */
    static isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.right <= window.innerWidth;
    }

    /**
     * Animate value change with smooth transition
     * @param {number} from Starting value
     * @param {number} to Ending value
     * @param {number} duration Animation duration in ms
     * @param {Function} updateCallback Callback to update display
     * @param {Function} easeFunction Easing function (optional)
     */
    static animateValue(from, to, duration, updateCallback, easeFunction = null) {
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
     * @param {number} t Time parameter (0-1)
     * @returns {number} Eased value
     */
    static easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Easing function - ease in out cubic
     * @param {number} t Time parameter (0-1)
     * @returns {number} Eased value
     */
    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}