// eventHandlers.js - Combat events, damage processing, and combat stats

export class CombatEventHandlers {
    constructor() {
        this.combatSystem = null;
        this.combatStats = {
            enemiesDestroyed: 0,
            damageDealt: 0,
            damageReceived: 0
        };
        this.eventListeners = [];
    }

    /**
     * Set reference to combat system
     * @param {Object} combatSystem Combat system reference
     */
    setCombatSystem(combatSystem) {
        this.combatSystem = combatSystem;
    }

    /**
     * Initialize combat event listeners
     */
    initializeEventListeners() {
        // Listen for damage events
        this.addEventListener('entity:damage', this.handleDamageEvent.bind(this));
        
        // Listen for enemy destroyed events
        this.addEventListener('enemy:destroyed', this.handleEnemyDestroyed.bind(this));
        
        // Listen for weapon fired events
        this.addEventListener('weapon:fired', this.handleWeaponFired.bind(this));
        
        // Listen for shield events
        this.addEventListener('shield:hit', this.handleShieldHit.bind(this));
        this.addEventListener('shield:depleted', this.handleShieldDepleted.bind(this));
        this.addEventListener('shield:recharge', this.handleShieldRecharge.bind(this));
        
        // Listen for weapon events
        this.addEventListener('weapon:overheat', this.handleWeaponOverheat.bind(this));
        this.addEventListener('weapon:reload', this.handleWeaponReload.bind(this));
        
        // Listen for special ability events
        this.addEventListener('emp:activated', this.handleEMPActivated.bind(this));
        this.addEventListener('turret:toggle', this.handleTurretToggle.bind(this));
        this.addEventListener('missile:lock', this.handleMissileLock.bind(this));
        this.addEventListener('missile:fired', this.handleMissileFired.bind(this));
    }

    /**
     * Add event listener
     * @param {string} eventType Event type
     * @param {Function} handler Event handler function
     */
    addEventListener(eventType, handler) {
        if (window.game && window.game.eventBus) {
            window.game.eventBus.addEventListener(eventType, handler);
            this.eventListeners.push({ eventType, handler });
        }
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        if (window.game && window.game.eventBus) {
            this.eventListeners.forEach(({ eventType, handler }) => {
                window.game.eventBus.removeEventListener(eventType, handler);
            });
        }
        this.eventListeners = [];
    }

    /**
     * Handle damage event
     * @param {Object} event Damage event data
     */
    handleDamageEvent(event) {
        const { target, damage, source, isCritical, damageType } = event.detail || event;
        
        if (!target || !damage) return;
        
        // Update damage statistics
        if (source === window.game?.spaceship) {
            // Player dealt damage
            this.combatStats.damageDealt += damage;
        } else if (target === window.game?.spaceship) {
            // Player received damage
            this.combatStats.damageReceived += damage;
            
            // Trigger damage feedback
            this.triggerDamageFeedback(damage, damageType, isCritical);
        }
        
        // Show damage number if target is visible
        const screenPos = this.getEntityScreenPosition(target);
        if (screenPos && window.combatDisplay?.indicators) {
            const color = this.getDamageColor(damageType, isCritical);
            window.combatDisplay.indicators.showDamageNumber(damage, screenPos, color, isCritical);
            
            // Show hit indicator
            const hitType = isCritical ? 'critical' : (damageType === 'shield' ? 'shield' : 'hit');
            window.combatDisplay.indicators.showHitIndicator(screenPos, hitType);
        }
    }

    /**
     * Handle enemy destroyed event
     * @param {Object} event Enemy destroyed event data
     */
    handleEnemyDestroyed(event) {
        const { enemy, killer } = event.detail || event;
        
        if (killer === window.game?.spaceship) {
            this.combatStats.enemiesDestroyed++;
            
            // Show destruction feedback
            if (window.combatDisplay?.indicators) {
                window.combatDisplay.indicators.showNotification('ENEMY DESTROYED', 1500);
            }
        }
    }

    /**
     * Handle weapon fired event
     * @param {Object} event Weapon fired event data
     */
    handleWeaponFired(event) {
        const { weapon, shooter, target } = event.detail || event;
        
        if (shooter === window.game?.spaceship) {
            // Player fired weapon - trigger visual feedback
            this.triggerWeaponFiredFeedback(weapon);
        }
    }

    /**
     * Handle shield hit event
     * @param {Object} event Shield hit event data
     */
    handleShieldHit(event) {
        const { target, damage } = event.detail || event;
        
        if (target === window.game?.spaceship) {
            // Player shields hit - show shield effect
            if (window.combatDisplay?.indicators) {
                const screenPos = this.getEntityScreenPosition(target);
                if (screenPos) {
                    window.combatDisplay.indicators.showStatusEffect('SHIELD HIT', screenPos, '#3399ff');
                }
            }
        }
    }

    /**
     * Handle shield depleted event
     * @param {Object} event Shield depleted event data
     */
    handleShieldDepleted(event) {
        const { target } = event.detail || event;
        
        if (target === window.game?.spaceship) {
            // Player shields depleted
            if (window.combatDisplay?.indicators) {
                window.combatDisplay.indicators.showNotification('SHIELDS DOWN', 2000);
            }
            
            // Trigger warning animation
            this.triggerShieldDepletedWarning();
        }
    }

    /**
     * Handle shield recharge event
     * @param {Object} event Shield recharge event data
     */
    handleShieldRecharge(event) {
        const { target } = event.detail || event;
        
        if (target === window.game?.spaceship) {
            // Player shields recharging
            if (window.combatDisplay?.indicators) {
                window.combatDisplay.indicators.showShieldRecharge();
            }
        }
    }

    /**
     * Handle weapon overheat event
     * @param {Object} event Weapon overheat event data
     */
    handleWeaponOverheat(event) {
        const { weapon, shooter } = event.detail || event;
        
        if (shooter === window.game?.spaceship) {
            // Player weapon overheated
            if (window.combatDisplay?.indicators) {
                window.combatDisplay.indicators.showOverheatWarning();
            }
        }
    }

    /**
     * Handle weapon reload event
     * @param {Object} event Weapon reload event data
     */
    handleWeaponReload(event) {
        const { weapon, shooter, ammoCount } = event.detail || event;
        
        if (shooter === window.game?.spaceship) {
            // Player weapon reloaded
            if (ammoCount <= 3 && window.combatDisplay?.indicators) {
                // Low ammo warning
                window.combatDisplay.indicators.showLowAmmoWarning(weapon.type || 'WEAPON', ammoCount);
            }
        }
    }

    /**
     * Handle EMP activated event
     * @param {Object} event EMP activated event data
     */
    handleEMPActivated(event) {
        const { source, position } = event.detail || event;
        
        if (source === window.game?.spaceship) {
            // Player activated EMP
            const screenPos = this.getEntityScreenPosition(source) || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            
            if (window.combatDisplay?.indicators) {
                window.combatDisplay.indicators.showEMPEffect(screenPos);
                window.combatDisplay.indicators.showNotification('EMP BURST ACTIVATED', 2000);
            }
        }
    }

    /**
     * Handle turret toggle event
     * @param {Object} event Turret toggle event data
     */
    handleTurretToggle(event) {
        const { source, isActive } = event.detail || event;
        
        if (source === window.game?.spaceship) {
            // Player toggled turrets
            const status = isActive ? 'ACTIVATED' : 'DEACTIVATED';
            if (window.combatDisplay?.indicators) {
                window.combatDisplay.indicators.showNotification(`TURRETS ${status}`, 1500);
            }
        }
    }

    /**
     * Handle missile lock event
     * @param {Object} event Missile lock event data
     */
    handleMissileLock(event) {
        const { target, shooter } = event.detail || event;
        
        if (shooter === window.game?.spaceship && target) {
            // Player locked onto target
            const screenPos = this.getEntityScreenPosition(target);
            if (screenPos && window.combatDisplay?.indicators) {
                window.combatDisplay.indicators.showMissileLock(screenPos);
            }
        }
    }

    /**
     * Handle missile fired event
     * @param {Object} event Missile fired event data
     */
    handleMissileFired(event) {
        const { shooter, ammoRemaining } = event.detail || event;
        
        if (shooter === window.game?.spaceship) {
            // Player fired missile
            if (ammoRemaining === 0 && window.combatDisplay?.indicators) {
                window.combatDisplay.indicators.showNoAmmoWarning('MISSILE');
            }
        }
    }

    /**
     * Trigger damage feedback for player
     * @param {number} damage Damage amount
     * @param {string} damageType Type of damage
     * @param {boolean} isCritical Whether damage is critical
     */
    triggerDamageFeedback(damage, damageType, isCritical) {
        // Screen shake effect based on damage
        const shakeIntensity = Math.min(Math.floor(damage / 20), 5);
        if (shakeIntensity > 0 && window.combatDisplay?.animations) {
            const combatContainer = document.getElementById('combat-container');
            window.combatDisplay.animations.shakeElement(combatContainer, shakeIntensity, 300);
        }
        
        // Flash effect for critical hits
        if (isCritical && window.combatDisplay?.animations) {
            const combatContainer = document.getElementById('combat-container');
            window.combatDisplay.animations.warningFlash(combatContainer, 2, 100);
        }
    }

    /**
     * Trigger weapon fired feedback
     * @param {Object} weapon Weapon that was fired
     */
    triggerWeaponFiredFeedback(weapon) {
        if (!window.combatDisplay?.animations) return;
        
        // Pulse weapon energy bar
        const weaponEnergyBar = document.getElementById('weapon-energy-bar');
        if (weaponEnergyBar) {
            window.combatDisplay.animations.pulseElement(weaponEnergyBar, 200, 1);
        }
    }

    /**
     * Trigger shield depleted warning
     */
    triggerShieldDepletedWarning() {
        if (!window.combatDisplay?.animations) return;
        
        const shieldBar = document.getElementById('shield-bar');
        if (shieldBar) {
            window.combatDisplay.animations.warningFlash(shieldBar, 5, 150);
        }
    }

    /**
     * Get entity screen position
     * @param {Object} entity Entity to get position for
     * @returns {Object|null} Screen position {x, y}
     */
    getEntityScreenPosition(entity) {
        if (!entity || !window.combatDisplay?.worldToScreen) return null;
        
        const transform = entity.getComponent ? entity.getComponent('TransformComponent') : null;
        if (!transform || !transform.position) return null;
        
        return window.combatDisplay.worldToScreen(transform.position);
    }

    /**
     * Get damage color based on type and criticality
     * @param {string} damageType Type of damage
     * @param {boolean} isCritical Whether damage is critical
     * @returns {string} Color hex string
     */
    getDamageColor(damageType, isCritical) {
        if (isCritical) return '#ffff00'; // Yellow for critical
        
        switch (damageType) {
            case 'shield': return '#3399ff'; // Blue for shield damage
            case 'emp': return '#00ffff'; // Cyan for EMP damage
            case 'explosive': return '#ff5500'; // Orange for explosive damage
            case 'energy': return '#ff00ff'; // Magenta for energy damage
            default: return '#ff3030'; // Red for normal damage
        }
    }

    /**
     * Update combat statistics display
     */
    updateCombatStats() {
        // Update enemies destroyed
        const enemiesDestroyedElement = document.getElementById('enemies-destroyed');
        if (enemiesDestroyedElement) {
            enemiesDestroyedElement.textContent = this.combatStats.enemiesDestroyed;
        }
        
        // Update damage dealt
        const damageDealtElement = document.getElementById('damage-dealt');
        if (damageDealtElement) {
            damageDealtElement.textContent = Math.floor(this.combatStats.damageDealt);
        }
        
        // Update damage received
        const damageReceivedElement = document.getElementById('damage-received');
        if (damageReceivedElement) {
            damageReceivedElement.textContent = Math.floor(this.combatStats.damageReceived);
        }
    }

    /**
     * Reset combat statistics
     */
    resetStats() {
        this.combatStats = {
            enemiesDestroyed: 0,
            damageDealt: 0,
            damageReceived: 0
        };
        this.updateCombatStats();
    }

    /**
     * Get current combat statistics
     * @returns {Object} Combat statistics
     */
    getStats() {
        return { ...this.combatStats };
    }

    /**
     * Fire custom combat event
     * @param {string} eventType Event type
     * @param {Object} eventData Event data
     */
    fireEvent(eventType, eventData) {
        if (window.game && window.game.eventBus) {
            window.game.eventBus.dispatchEvent(new CustomEvent(eventType, { detail: eventData }));
        }
    }

    /**
     * Cleanup event handlers
     */
    cleanup() {
        this.removeEventListeners();
        this.resetStats();
    }
}