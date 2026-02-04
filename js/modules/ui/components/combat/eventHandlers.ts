// eventHandlers.ts - Combat events, damage processing, and combat stats

export interface CombatStats {
    enemiesDestroyed: number;
    damageDealt: number;
    damageReceived: number;
}

export interface CombatEvent {
    detail?: any;
    [key: string]: any;
}

export class CombatEventHandlers {
    combatSystem: any | null;
    combatStats: CombatStats;
    eventListeners: { eventType: string; handler: (event: any) => void }[];

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
     * @param combatSystem Combat system reference
     */
    setCombatSystem(combatSystem: any): void {
        this.combatSystem = combatSystem;
    }

    /**
     * Initialize combat event listeners
     */
    initializeEventListeners(): void {
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
     * @param eventType Event type
     * @param handler Event handler function
     */
    addEventListener(eventType: string, handler: (event: any) => void): void {
        const game = (window as any).game;
        if (game && game.eventBus) {
            game.eventBus.addEventListener(eventType, handler);
            this.eventListeners.push({ eventType, handler });
        }
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners(): void {
        const game = (window as any).game;
        if (game && game.eventBus) {
            this.eventListeners.forEach(({ eventType, handler }) => {
                game.eventBus.removeEventListener(eventType, handler);
            });
        }
        this.eventListeners = [];
    }

    /**
     * Handle damage event
     * @param event Damage event data
     */
    handleDamageEvent(event: CombatEvent): void {
        const { target, damage, source, isCritical, damageType } = event.detail || event;
        
        if (!target || !damage) return;
        
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;

        // Update damage statistics
        if (source === game?.spaceship) {
            // Player dealt damage
            this.combatStats.damageDealt += damage;
        } else if (target === game?.spaceship) {
            // Player received damage
            this.combatStats.damageReceived += damage;
            
            // Trigger damage feedback
            this.triggerDamageFeedback(damage, isCritical);
        }
        
        // Show damage number if target is visible
        const screenPos = this.getEntityScreenPosition(target);
        if (screenPos && combatDisplay?.indicators) {
            const color = this.getDamageColor(damageType, isCritical);
            combatDisplay.indicators.showDamageNumber(damage, screenPos, color, isCritical);
            
            // Show hit indicator
            const hitType = isCritical ? 'critical' : (damageType === 'shield' ? 'shield' : 'hit');
            combatDisplay.indicators.showHitIndicator(screenPos, hitType);
        }
    }

    /**
     * Handle enemy destroyed event
     * @param event Enemy destroyed event data
     */
    handleEnemyDestroyed(event: CombatEvent): void {
        const { killer } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (killer === game?.spaceship) {
            this.combatStats.enemiesDestroyed++;
            
            // Show destruction feedback
            if (combatDisplay?.indicators) {
                combatDisplay.indicators.showNotification('ENEMY DESTROYED', 1500);
            }
        }
    }

    /**
     * Handle weapon fired event
     * @param event Weapon fired event data
     */
    handleWeaponFired(event: CombatEvent): void {
        const { shooter } = event.detail || event;
        const game = (window as any).game;
        
        if (shooter === game?.spaceship) {
            // Player fired weapon - trigger visual feedback
            this.triggerWeaponFiredFeedback();
        }
    }

    /**
     * Handle shield hit event
     * @param event Shield hit event data
     */
    handleShieldHit(event: CombatEvent): void {
        const { target } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (target === game?.spaceship) {
            // Player shields hit - show shield effect
            if (combatDisplay?.indicators) {
                const screenPos = this.getEntityScreenPosition(target);
                if (screenPos) {
                    combatDisplay.indicators.showStatusEffect('SHIELD HIT', screenPos, '#3399ff');
                }
            }
        }
    }

    /**
     * Handle shield depleted event
     * @param event Shield depleted event data
     */
    handleShieldDepleted(event: CombatEvent): void {
        const { target } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (target === game?.spaceship) {
            // Player shields depleted
            if (combatDisplay?.indicators) {
                combatDisplay.indicators.showNotification('SHIELDS DOWN', 2000);
            }
            
            // Trigger warning animation
            this.triggerShieldDepletedWarning();
        }
    }

    /**
     * Handle shield recharge event
     * @param event Shield recharge event data
     */
    handleShieldRecharge(event: CombatEvent): void {
        const { target } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (target === game?.spaceship) {
            // Player shields recharging
            if (combatDisplay?.indicators) {
                combatDisplay.indicators.showShieldRecharge();
            }
        }
    }

    /**
     * Handle weapon overheat event
     * @param event Weapon overheat event data
     */
    handleWeaponOverheat(event: CombatEvent): void {
        const { shooter } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (shooter === game?.spaceship) {
            // Player weapon overheated
            if (combatDisplay?.indicators) {
                combatDisplay.indicators.showOverheatWarning();
            }
        }
    }

    /**
     * Handle weapon reload event
     * @param event Weapon reload event data
     */
    handleWeaponReload(event: CombatEvent): void {
        const { weapon, shooter, ammoCount } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (shooter === game?.spaceship) {
            // Player weapon reloaded
            if (ammoCount <= 3 && combatDisplay?.indicators) {
                // Low ammo warning
                combatDisplay.indicators.showLowAmmoWarning(weapon.type || 'WEAPON', ammoCount);
            }
        }
    }

    /**
     * Handle EMP activated event
     * @param event EMP activated event data
     */
    handleEMPActivated(event: CombatEvent): void {
        const { source } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (source === game?.spaceship) {
            // Player activated EMP
            const screenPos = this.getEntityScreenPosition(source) || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            
            if (combatDisplay?.indicators) {
                combatDisplay.indicators.showEMPEffect(screenPos);
                combatDisplay.indicators.showNotification('EMP BURST ACTIVATED', 2000);
            }
        }
    }

    /**
     * Handle turret toggle event
     * @param event Turret toggle event data
     */
    handleTurretToggle(event: CombatEvent): void {
        const { source, isActive } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (source === game?.spaceship) {
            // Player toggled turrets
            const status = isActive ? 'ACTIVATED' : 'DEACTIVATED';
            if (combatDisplay?.indicators) {
                combatDisplay.indicators.showNotification(`TURRETS ${status}`, 1500);
            }
        }
    }

    /**
     * Handle missile lock event
     * @param event Missile lock event data
     */
    handleMissileLock(event: CombatEvent): void {
        const { target, shooter } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (shooter === game?.spaceship && target) {
            // Player locked onto target
            const screenPos = this.getEntityScreenPosition(target);
            if (screenPos && combatDisplay?.indicators) {
                combatDisplay.indicators.showMissileLock(screenPos);
            }
        }
    }

    /**
     * Handle missile fired event
     * @param event Missile fired event data
     */
    handleMissileFired(event: CombatEvent): void {
        const { shooter, ammoRemaining } = event.detail || event;
        const game = (window as any).game;
        const combatDisplay = (window as any).combatDisplay;
        
        if (shooter === game?.spaceship) {
            // Player fired missile
            if (ammoRemaining === 0 && combatDisplay?.indicators) {
                combatDisplay.indicators.showNoAmmoWarning('MISSILE');
            }
        }
    }

    /**
     * Trigger damage feedback for player
     * @param damage Damage amount
     * @param isCritical Whether damage is critical
     */
    triggerDamageFeedback(damage: number, isCritical: boolean): void {
        const combatDisplay = (window as any).combatDisplay;
        if (!combatDisplay) return;

        // Screen shake effect based on damage
        const shakeIntensity = Math.min(Math.floor(damage / 20), 5);
        if (shakeIntensity > 0 && combatDisplay.animations) {
            const combatContainer = document.getElementById('combat-container');
            if (combatContainer) {
                combatDisplay.animations.shakeElement(combatContainer, shakeIntensity, 300);
            }
        }
        
        // Flash effect for critical hits
        if (isCritical && combatDisplay.animations) {
            const combatContainer = document.getElementById('combat-container');
            if (combatContainer) {
                combatDisplay.animations.warningFlash(combatContainer, 2, 100);
            }
        }
    }

    /**
     * Trigger weapon fired feedback
     */
    triggerWeaponFiredFeedback(): void {
        const combatDisplay = (window as any).combatDisplay;
        if (!combatDisplay?.animations) return;
        
        // Pulse weapon energy bar
        const weaponEnergyBar = document.getElementById('weapon-energy-bar');
        if (weaponEnergyBar) {
            combatDisplay.animations.pulseElement(weaponEnergyBar, 200, 1);
        }
    }

    /**
     * Trigger shield depleted warning
     */
    triggerShieldDepletedWarning(): void {
        const combatDisplay = (window as any).combatDisplay;
        if (!combatDisplay?.animations) return;
        
        const shieldBar = document.getElementById('shield-bar');
        if (shieldBar) {
            combatDisplay.animations.warningFlash(shieldBar, 5, 150);
        }
    }

    /**
     * Get entity screen position
     * @param entity Entity to get position for
     * @returns Screen position {x, y}
     */
    getEntityScreenPosition(entity: any): { x: number; y: number } | null {
        const combatDisplay = (window as any).combatDisplay;
        if (!entity || !combatDisplay?.worldToScreen) return null;
        
        const transform = entity.getComponent ? entity.getComponent('TransformComponent') : null;
        if (!transform || !transform.position) return null;
        
        return combatDisplay.worldToScreen(transform.position);
    }

    /**
     * Get damage color based on type and criticality
     * @param damageType Type of damage
     * @param isCritical Whether damage is critical
     * @returns Color hex string
     */
    getDamageColor(damageType: string, isCritical: boolean): string {
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
    updateCombatStats(): void {
        // Update enemies destroyed
        const enemiesDestroyedElement = document.getElementById('enemies-destroyed');
        if (enemiesDestroyedElement) {
            enemiesDestroyedElement.textContent = this.combatStats.enemiesDestroyed.toString();
        }
        
        // Update damage dealt
        const damageDealtElement = document.getElementById('damage-dealt');
        if (damageDealtElement) {
            damageDealtElement.textContent = Math.floor(this.combatStats.damageDealt).toString();
        }
        
        // Update damage received
        const damageReceivedElement = document.getElementById('damage-received');
        if (damageReceivedElement) {
            damageReceivedElement.textContent = Math.floor(this.combatStats.damageReceived).toString();
        }
    }

    /**
     * Reset combat statistics
     */
    resetStats(): void {
        this.combatStats = {
            enemiesDestroyed: 0,
            damageDealt: 0,
            damageReceived: 0
        };
        this.updateCombatStats();
    }

    /**
     * Get current combat statistics
     * @returns Combat statistics
     */
    getStats(): CombatStats {
        return { ...this.combatStats };
    }

    /**
     * Fire custom combat event
     * @param eventType Event type
     * @param eventData Event data
     */
    fireEvent(eventType: string, eventData: any): void {
        const game = (window as any).game;
        if (game && game.eventBus) {
            game.eventBus.dispatchEvent(new CustomEvent(eventType, { detail: eventData }));
        }
    }

    /**
     * Cleanup event handlers
     */
    cleanup(): void {
        this.removeEventListeners();
        this.resetStats();
    }
}