// combatDisplay.js - Main combat display orchestrator

import { combatStyles } from './components/combat/styles.ts';
import { CombatIndicators } from './components/combat/indicators.ts';
import { EnemyDisplay } from './components/combat/enemyDisplay.ts';
import { WeaponDisplay } from './components/combat/weaponDisplay.ts';
import { CombatAnimations } from './components/combat/animations.ts';
import { CombatEventHandlers } from './components/combat/eventHandlers.ts';
import { CombatHelpers } from './components/combat/helpers.ts';
import type { Vector3 } from 'three';

type CombatScreenPosition = {
    x: number;
    y: number;
};

type CombatWeaponSystem = {
    [key: string]: unknown;
};

type CombatSpaceship = {
    [key: string]: unknown;
};

type CombatSystem = {
    [key: string]: unknown;
};

export class CombatDisplay {
    weaponSystem: CombatWeaponSystem | null;
    spaceship: CombatSpaceship | null;
    combatSystem?: CombatSystem;
    enemyCount: number;
    currentTarget: any;
    styles: typeof combatStyles;
    indicators: CombatIndicators;
    enemyDisplay: EnemyDisplay;
    weaponDisplay: WeaponDisplay;
    animations: CombatAnimations;
    eventHandlers: CombatEventHandlers;
    helpers: typeof CombatHelpers;

    constructor() {
        this.weaponSystem = null;
        this.spaceship = null;
        this.enemyCount = 0;
        this.currentTarget = null;
        
        // Initialize subsystems
        this.styles = combatStyles;
        this.indicators = new CombatIndicators();
        this.enemyDisplay = new EnemyDisplay();
        this.weaponDisplay = new WeaponDisplay();
        this.animations = new CombatAnimations();
        this.eventHandlers = new CombatEventHandlers();
        this.helpers = CombatHelpers;
        
        this.setupCombatDisplay();
    }
    
    setReferences(weaponSystem: CombatWeaponSystem, spaceship: CombatSpaceship, combatSystem: CombatSystem): void {
        this.weaponSystem = weaponSystem;
        this.spaceship = spaceship;
        this.combatSystem = combatSystem;
        
        // Pass references to subsystems
        this.weaponDisplay.setReferences(weaponSystem, spaceship);
        this.eventHandlers.setCombatSystem(combatSystem);
        this.eventHandlers.initializeEventListeners();
    }
    
    setupCombatDisplay(): void {
        // Create combat container
        const combatContainer = document.createElement('div');
        combatContainer.id = 'combat-container';
        this.styles.applyCombatContainerStyles(combatContainer);
        document.body.appendChild(combatContainer);
        
        // Combat systems title
        const combatTitle = document.createElement('div');
        combatTitle.className = 'combat-title';
        combatTitle.textContent = 'COMBAT SYSTEMS';
        this.styles.applyCombatTitleStyles(combatTitle);
        combatContainer.appendChild(combatTitle);
        
        // Create shield display
        this.createShieldDisplay(combatContainer);
        
        // Hull integrity display
        this.createHullDisplay(combatContainer);
        
        // Weapon system display
        this.weaponDisplay.createWeaponDisplay(combatContainer, this.styles);
        
        // Target info section
        this.enemyDisplay.createTargetInfoSection(combatContainer, this.styles);
        
        // Special weapons section
        this.weaponDisplay.createSpecialWeaponsSection(combatContainer, this.styles);
        
        // Enemy counter
        combatContainer.appendChild(this.helpers.createUIItem('Hostiles:', 'enemy-count', this.styles));
        
        // Combat stats
        this.createStatsContainer(combatContainer);
        
        // Controls hint
        combatContainer.appendChild(this.helpers.createControlsHint(this.styles));
        
        // Create notification area
        document.body.appendChild(this.helpers.createNotificationArea(this.styles));
        
        // Create target HUD - appears over targeted enemies
        this.enemyDisplay.createTargetHUD(this.styles);
    }
    
    /**
     * Create shield display
     * @param {HTMLElement} parent Parent container
     */
    createShieldDisplay(parent: HTMLElement): void {
        const shieldContainer = document.createElement('div');
        this.styles.applyShieldContainerStyles(shieldContainer);
        
        const shieldLabel = document.createElement('div');
        shieldLabel.textContent = 'SHIELD';
        this.styles.applyShieldLabelStyles(shieldLabel);
        shieldContainer.appendChild(shieldLabel);
        
        const { container: shieldBarContainer } = this.helpers.createProgressBar(
            'shield-bar-container', 'shield-bar', this.styles,
            this.styles.applyShieldBarContainerStyles, this.styles.applyShieldBarStyles
        ) as { container: HTMLDivElement; bar: HTMLDivElement };
        shieldContainer.appendChild(shieldBarContainer);
        
        const shieldValue = document.createElement('div');
        shieldValue.id = 'shield-value';
        shieldValue.textContent = '100/100';
        this.styles.applyValueDisplayStyles(shieldValue);
        shieldContainer.appendChild(shieldValue);
        
        parent.appendChild(shieldContainer);
    }
    
    /**
     * Create hull display
     * @param {HTMLElement} parent Parent container
     */
    createHullDisplay(parent: HTMLElement): void {
        const hullContainer = document.createElement('div');
        this.styles.applyHullContainerStyles(hullContainer);
        
        const hullLabel = document.createElement('div');
        hullLabel.textContent = 'HULL INTEGRITY';
        this.styles.applyHullLabelStyles(hullLabel);
        hullContainer.appendChild(hullLabel);
        
        const { container: hullBarContainer } = this.helpers.createProgressBar(
            'hull-bar-container', 'hull-bar', this.styles,
            this.styles.applyHullBarContainerStyles, this.styles.applyHullBarStyles
        ) as { container: HTMLDivElement; bar: HTMLDivElement };
        hullContainer.appendChild(hullBarContainer);
        
        const hullValue = document.createElement('div');
        hullValue.id = 'hull-value';
        hullValue.textContent = '100/100';
        this.styles.applyValueDisplayStyles(hullValue);
        hullContainer.appendChild(hullValue);
        
        parent.appendChild(hullContainer);
    }
    
    /**
     * Create stats container
     * @param {HTMLElement} parent Parent container
     */
    createStatsContainer(parent: HTMLElement): void {
        const statsContainer = document.createElement('div');
        this.styles.applyStatsContainerStyles(statsContainer);
        
        const statsTitle = document.createElement('div');
        statsTitle.textContent = 'COMBAT STATS';
        this.styles.applyStatsTitleStyles(statsTitle);
        statsContainer.appendChild(statsTitle);
        
        statsContainer.appendChild(this.helpers.createStatItem('Enemies Destroyed:', 'enemies-destroyed', this.styles));
        statsContainer.appendChild(this.helpers.createStatItem('Damage Dealt:', 'damage-dealt', this.styles));
        statsContainer.appendChild(this.helpers.createStatItem('Damage Received:', 'damage-received', this.styles));
        
        parent.appendChild(statsContainer);
    }
    
    update(): void {
        // Skip updating if refs not set
        if (!this.spaceship) return;
        
        // Update shield display
        this.updateShieldDisplay();
        
        // Update hull display
        this.updateHullDisplay();
        
        // Update weapon display
        this.weaponDisplay.updateWeaponDisplay();
        
        // Update enemy count
        this.updateEnemyCount();
        
        // Update target info
        this.enemyDisplay.updateTargetInfo(this.currentTarget);
        
        // Update special weapons status
        this.weaponDisplay.updateSpecialWeaponsStatus();
        
        // Update combat stats
        this.eventHandlers.updateCombatStats();
        
        // Update target HUD position if we have a target
        this.enemyDisplay.updateTargetHUD(this.currentTarget, this.worldToScreen.bind(this));
    }
    
    /**
     * Update shield display
     */
    updateShieldDisplay(): void {
        const shieldBar = document.getElementById('shield-bar') as HTMLDivElement | null;
        const shieldValue = document.getElementById('shield-value') as HTMLSpanElement | null;
        
        if (!shieldBar || !shieldValue) return;
        
        // Get shield component or fall back to spaceship properties
        const spaceship = this.spaceship ?? {};
        const shieldComponent = this.helpers.getComponent(spaceship, 'HealthComponent');
        
        const shield = this.helpers.safeGet(shieldComponent ?? {}, 'shield', 
                                            this.helpers.safeGet(spaceship, 'shield', 0));
        const maxShield = this.helpers.safeGet(shieldComponent ?? {}, 'maxShield', 
                                               this.helpers.safeGet(spaceship, 'maxShield', 100));
        
        const shieldPercent = this.helpers.formatPercentage(shield, maxShield);
        shieldBar.style.width = `${shieldPercent}%`;
        shieldValue.textContent = this.helpers.formatValueDisplay(shield, maxShield);
        
        // Change color based on shield level
        shieldBar.style.backgroundColor = this.helpers.getShieldColor(shieldPercent);
    }
    
    /**
     * Update hull display
     */
    updateHullDisplay(): void {
        const hullBar = document.getElementById('hull-bar') as HTMLDivElement | null;
        const hullValue = document.getElementById('hull-value') as HTMLSpanElement | null;
        
        if (!hullBar || !hullValue) return;
        
        // Get health component or fall back to spaceship properties
        const spaceship = this.spaceship ?? {};
        const healthComponent = this.helpers.getComponent(spaceship, 'HealthComponent');
        
        const health = this.helpers.safeGet(healthComponent ?? {}, 'health', 
                                            this.helpers.safeGet(spaceship, 'hull', 0));
        const maxHealth = this.helpers.safeGet(healthComponent ?? {}, 'maxHealth', 
                                               this.helpers.safeGet(spaceship, 'maxHull', 100));
        
        const healthPercent = this.helpers.formatPercentage(health, maxHealth);
        hullBar.style.width = `${healthPercent}%`;
        hullValue.textContent = this.helpers.formatValueDisplay(health, maxHealth);
        
        // Change color based on hull level
        hullBar.style.backgroundColor = this.helpers.getHealthColor(healthPercent);
    }
    
    
    /**
     * Update enemy count
     */
    updateEnemyCount(): void {
        const enemyCount = this.helpers.getEnemyCount();
        this.enemyCount = enemyCount;
        this.enemyDisplay.updateEnemyCount(enemyCount);
    }
    
    
    
    
    
    
    /**
     * World position to screen coordinates
     * @param {THREE.Vector3} position World position
     * @returns {Object|null} Screen coordinates
     */
    worldToScreen(position: Vector3): CombatScreenPosition | null {
        if (!window.game || !window.game.camera) return null;
        return this.helpers.worldToScreen(position, window.game.camera) as CombatScreenPosition | null;
    }
    
    /**
     * Set current target
     * @param {Entity} target Target entity
     */
    setTarget(target: any): void {
        this.currentTarget = target;
        this.enemyDisplay.setTarget(target);
    }
    
    /**
     * Clear current target
     */
    clearTarget(): void {
        this.currentTarget = null;
        this.enemyDisplay.clearTarget();
    }
    
    
    showNotification(message: string, duration = 3000): void {
        this.indicators.showNotification(message, duration);
    }
    
    hide(): void {
        // Hide combat UI
        const combatContainer = document.getElementById('combat-container') as HTMLDivElement | null;
        if (combatContainer) {
            combatContainer.style.display = 'none';
        }
        
        // Hide target displays
        this.enemyDisplay.hide();
    }
    
    show(): void {
        // Show combat UI
        const combatContainer = document.getElementById('combat-container') as HTMLDivElement | null;
        if (combatContainer) {
            combatContainer.style.display = 'block';
        }
    }
    
    /**
     * Cleanup combat display
     */
    cleanup(): void {
        this.eventHandlers.cleanup();
        this.animations.cleanup();
        this.indicators.clearAll();
    }
} 
