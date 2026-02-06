// indicators.ts - Hit indicators, damage numbers, and combat feedback
// Base styles are in src/styles/combat.css (combat-damage-number, combat-hit-indicator, etc.)

export interface DamageNumber {
    element: HTMLElement;
    startTime: number;
}

export interface ScreenPosition {
    x: number;
    y: number;
}

export class CombatIndicators {
    notifications: string[];
    damageNumbers: DamageNumber[];

    constructor() {
        this.notifications = [];
        this.damageNumbers = [];
    }

    /**
     * Show notification message
     * @param message Notification message
     * @param duration Duration in milliseconds
     */
    showNotification(message: string, duration: number = 3000): void {
        const notificationArea = document.getElementById('notification-area');
        if (!notificationArea) return;
        
        notificationArea.textContent = message;
        notificationArea.classList.remove('combat-hidden');
        notificationArea.classList.add('combat-visible');
        notificationArea.style.opacity = '1';
        
        setTimeout(() => {
            notificationArea.style.opacity = '0';
            setTimeout(() => {
                notificationArea.classList.remove('combat-visible');
                notificationArea.classList.add('combat-hidden');
            }, 500);
        }, duration);
    }

    /**
     * Show damage number at specific position
     * @param damage Damage amount
     * @param position Screen position {x, y}
     * @param color Color of damage number
     * @param isCritical Whether this is a critical hit
     */
    showDamageNumber(damage: number, position: ScreenPosition, color: string = '#ff3030', isCritical: boolean = false): void {
        const el = document.createElement('div');
        el.textContent = Math.round(damage).toString();
        el.classList.add('combat-damage-number');
        if (isCritical) {
            el.classList.add('combat-damage-number--critical');
        }

        // Dynamic: position and color
        el.style.left = `${position.x}px`;
        el.style.top = `${position.y}px`;
        el.style.color = color;
        
        if (isCritical) {
            el.style.textShadow = `0 0 10px ${color}`;
        }
        
        document.body.appendChild(el);
        
        // Trigger animation via CSS class
        requestAnimationFrame(() => {
            el.classList.add('combat-damage-number--animate');
        });
        
        setTimeout(() => {
            el.remove();
        }, 1000);
        
        this.damageNumbers.push({ element: el, startTime: Date.now() });
    }

    /**
     * Show hit indicator at target position
     * @param position Screen position {x, y}
     * @param type Type of hit ('hit', 'critical', 'shield', 'miss')
     */
    showHitIndicator(position: ScreenPosition, type: string = 'hit'): void {
        const el = document.createElement('div');
        el.classList.add('combat-hit-indicator');

        // Dynamic positioning
        el.style.left = `${position.x - 15}px`;
        el.style.top = `${position.y - 15}px`;
        
        switch (type) {
            case 'critical': el.classList.add('combat-hit-indicator--critical'); break;
            case 'shield':   el.classList.add('combat-hit-indicator--shield');   break;
            case 'miss':     el.classList.add('combat-hit-indicator--miss');     break;
            default:         el.classList.add('combat-hit-indicator--hit');      break;
        }
        
        document.body.appendChild(el);
        
        requestAnimationFrame(() => {
            el.classList.add('combat-hit-indicator--animate');
        });
        
        setTimeout(() => { el.remove(); }, 500);
    }

    /**
     * Show status effect indicator
     * @param effect Effect name
     * @param position Screen position {x, y}
     * @param color Effect color
     */
    showStatusEffect(effect: string, position: ScreenPosition, color: string = '#00ffff'): void {
        const el = document.createElement('div');
        el.textContent = effect.toUpperCase();
        el.classList.add('combat-status-effect');

        // Dynamic positioning and color
        el.style.left = `${position.x}px`;
        el.style.top = `${position.y - 20}px`;
        el.style.color = color;
        
        document.body.appendChild(el);
        
        requestAnimationFrame(() => {
            el.classList.add('combat-status-effect--animate');
        });
        
        setTimeout(() => { el.remove(); }, 1500);
    }

    /**
     * Show weapon overheat warning
     */
    showOverheatWarning(): void {
        this.showNotification('WEAPON OVERHEATED - COOLING DOWN', 2000);
    }

    /**
     * Show shield recharge indicator
     */
    showShieldRecharge(): void {
        this.showNotification('SHIELDS RECHARGING', 1500);
    }

    /**
     * Show EMP effect indicator
     * @param position Screen position {x, y}
     */
    showEMPEffect(position: ScreenPosition): void {
        const el = document.createElement('div');
        el.classList.add('combat-emp-effect');

        // Dynamic positioning
        el.style.left = `${position.x - 25}px`;
        el.style.top = `${position.y - 25}px`;
        
        document.body.appendChild(el);
        
        requestAnimationFrame(() => {
            el.classList.add('combat-emp-effect--animate');
        });
        
        setTimeout(() => { el.remove(); }, 800);
    }

    /**
     * Show missile lock indicator
     * @param position Screen position {x, y}
     */
    showMissileLock(position: ScreenPosition): void {
        const el = document.createElement('div');
        el.innerHTML = '&#9678;';
        el.classList.add('combat-missile-lock');

        // Dynamic positioning
        el.style.left = `${position.x - 10}px`;
        el.style.top = `${position.y - 10}px`;
        
        document.body.appendChild(el);
        
        setTimeout(() => { el.remove(); }, 2000);
    }

    /**
     * Show low ammo warning
     * @param weaponType Type of weapon
     * @param ammoCount Remaining ammo
     */
    showLowAmmoWarning(weaponType: string, ammoCount: number): void {
        this.showNotification(`${weaponType.toUpperCase()} AMMO LOW: ${ammoCount}`, 2000);
    }

    /**
     * Show no ammo warning
     * @param weaponType Type of weapon
     */
    showNoAmmoWarning(weaponType: string): void {
        this.showNotification(`${weaponType.toUpperCase()} OUT OF AMMO`, 2000);
    }

    /**
     * Clean up old damage numbers and indicators
     */
    cleanup(): void {
        const now = Date.now();
        this.damageNumbers = this.damageNumbers.filter(item => {
            if (now - item.startTime > 2000) {
                item.element.remove();
                return false;
            }
            return true;
        });
    }

    /**
     * Clear all active indicators
     */
    clearAll(): void {
        this.damageNumbers.forEach(item => { item.element.remove(); });
        this.damageNumbers = [];
        
        const notificationArea = document.getElementById('notification-area');
        if (notificationArea) {
            notificationArea.classList.remove('combat-visible');
            notificationArea.classList.add('combat-hidden');
        }
    }
}
