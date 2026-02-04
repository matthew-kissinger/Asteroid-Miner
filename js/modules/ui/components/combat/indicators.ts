// indicators.ts - Hit indicators, damage numbers, and combat feedback

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
        
        // Set message
        notificationArea.textContent = message;
        
        // Show notification
        notificationArea.style.display = 'block';
        notificationArea.style.opacity = '1';
        
        // Hide after duration
        setTimeout(() => {
            notificationArea.style.opacity = '0';
            setTimeout(() => {
                notificationArea.style.display = 'none';
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
        const damageElement = document.createElement('div');
        damageElement.textContent = Math.round(damage).toString();
        damageElement.style.position = 'absolute';
        damageElement.style.left = `${position.x}px`;
        damageElement.style.top = `${position.y}px`;
        damageElement.style.color = color;
        damageElement.style.fontSize = isCritical ? '20px' : '16px';
        damageElement.style.fontWeight = 'bold';
        damageElement.style.pointerEvents = 'none';
        damageElement.style.zIndex = '1000';
        damageElement.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
        damageElement.style.transition = 'all 1s ease-out';
        
        if (isCritical) {
            damageElement.style.textShadow = '0 0 10px ' + color;
        }
        
        document.body.appendChild(damageElement);
        
        // Animate damage number
        requestAnimationFrame(() => {
            damageElement.style.transform = 'translateY(-30px)';
            damageElement.style.opacity = '0';
        });
        
        // Remove after animation
        setTimeout(() => {
            if (damageElement.parentNode) {
                damageElement.parentNode.removeChild(damageElement);
            }
        }, 1000);
        
        this.damageNumbers.push({
            element: damageElement,
            startTime: Date.now()
        });
    }

    /**
     * Show hit indicator at target position
     * @param position Screen position {x, y}
     * @param type Type of hit ('hit', 'critical', 'shield', 'miss')
     */
    showHitIndicator(position: ScreenPosition, type: string = 'hit'): void {
        const indicator = document.createElement('div');
        indicator.style.position = 'absolute';
        indicator.style.left = `${position.x - 15}px`;
        indicator.style.top = `${position.y - 15}px`;
        indicator.style.width = '30px';
        indicator.style.height = '30px';
        indicator.style.borderRadius = '50%';
        indicator.style.pointerEvents = 'none';
        indicator.style.zIndex = '999';
        indicator.style.transition = 'all 0.5s ease-out';
        
        switch (type) {
            case 'critical':
                indicator.style.border = '3px solid #ffff00';
                indicator.style.boxShadow = '0 0 20px #ffff00';
                break;
            case 'shield':
                indicator.style.border = '2px solid #3399ff';
                indicator.style.boxShadow = '0 0 15px #3399ff';
                break;
            case 'miss':
                indicator.style.border = '1px solid #666666';
                indicator.style.boxShadow = '0 0 5px #666666';
                break;
            default: // hit
                indicator.style.border = '2px solid #ff3030';
                indicator.style.boxShadow = '0 0 10px #ff3030';
                break;
        }
        
        document.body.appendChild(indicator);
        
        // Animate hit indicator
        requestAnimationFrame(() => {
            indicator.style.transform = 'scale(1.5)';
            indicator.style.opacity = '0';
        });
        
        // Remove after animation
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 500);
    }

    /**
     * Show status effect indicator
     * @param effect Effect name
     * @param position Screen position {x, y}
     * @param color Effect color
     */
    showStatusEffect(effect: string, position: ScreenPosition, color: string = '#00ffff'): void {
        const effectElement = document.createElement('div');
        effectElement.textContent = effect.toUpperCase();
        effectElement.style.position = 'absolute';
        effectElement.style.left = `${position.x}px`;
        effectElement.style.top = `${position.y - 20}px`;
        effectElement.style.color = color;
        effectElement.style.fontSize = '14px';
        effectElement.style.fontWeight = 'bold';
        effectElement.style.pointerEvents = 'none';
        effectElement.style.zIndex = '1000';
        effectElement.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
        effectElement.style.transition = 'all 1.5s ease-out';
        
        document.body.appendChild(effectElement);
        
        // Animate status effect
        requestAnimationFrame(() => {
            effectElement.style.transform = 'translateY(-40px)';
            effectElement.style.opacity = '0';
        });
        
        // Remove after animation
        setTimeout(() => {
            if (effectElement.parentNode) {
                effectElement.parentNode.removeChild(effectElement);
            }
        }, 1500);
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
        const empElement = document.createElement('div');
        empElement.style.position = 'absolute';
        empElement.style.left = `${position.x - 25}px`;
        empElement.style.top = `${position.y - 25}px`;
        empElement.style.width = '50px';
        empElement.style.height = '50px';
        empElement.style.border = '2px solid #00ffff';
        empElement.style.borderRadius = '50%';
        empElement.style.pointerEvents = 'none';
        empElement.style.zIndex = '999';
        empElement.style.boxShadow = '0 0 30px #00ffff';
        empElement.style.transition = 'all 0.8s ease-out';
        
        document.body.appendChild(empElement);
        
        // Animate EMP effect
        requestAnimationFrame(() => {
            empElement.style.transform = 'scale(3)';
            empElement.style.opacity = '0';
        });
        
        // Remove after animation
        setTimeout(() => {
            if (empElement.parentNode) {
                empElement.parentNode.removeChild(empElement);
            }
        }, 800);
    }

    /**
     * Show missile lock indicator
     * @param position Screen position {x, y}
     */
    showMissileLock(position: ScreenPosition): void {
        const lockElement = document.createElement('div');
        lockElement.innerHTML = '◎';
        lockElement.style.position = 'absolute';
        lockElement.style.left = `${position.x - 10}px`;
        lockElement.style.top = `${position.y - 10}px`;
        lockElement.style.color = '#ff5500';
        lockElement.style.fontSize = '20px';
        lockElement.style.fontWeight = 'bold';
        lockElement.style.pointerEvents = 'none';
        lockElement.style.zIndex = '1000';
        lockElement.style.textShadow = '0 0 10px #ff5500';
        lockElement.style.animation = 'pulse 0.5s infinite alternate';
        
        // Add keyframe animation for pulsing
        if (!document.querySelector('#missile-lock-keyframes')) {
            const style = document.createElement('style');
            style.id = 'missile-lock-keyframes';
            style.textContent = `
                @keyframes pulse {
                    from { transform: scale(1); }
                    to { transform: scale(1.2); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(lockElement);
        
        // Remove after 2 seconds
        setTimeout(() => {
            if (lockElement.parentNode) {
                lockElement.parentNode.removeChild(lockElement);
            }
        }, 2000);
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
                if (item.element.parentNode) {
                    item.element.parentNode.removeChild(item.element);
                }
                return false;
            }
            return true;
        });
    }

    /**
     * Clear all active indicators
     */
    clearAll(): void {
        // Clear damage numbers
        this.damageNumbers.forEach(item => {
            if (item.element.parentNode) {
                item.element.parentNode.removeChild(item.element);
            }
        });
        this.damageNumbers = [];
        
        // Hide notification
        const notificationArea = document.getElementById('notification-area');
        if (notificationArea) {
            notificationArea.style.display = 'none';
        }
    }
}