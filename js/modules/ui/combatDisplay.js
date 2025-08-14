// combatDisplay.js - Main combat display orchestrator

import { combatStyles } from './components/combat/styles.js';
import { CombatIndicators } from './components/combat/indicators.js';
import { EnemyDisplay } from './components/combat/enemyDisplay.js';
import { WeaponDisplay } from './components/combat/weaponDisplay.js';
import { CombatAnimations } from './components/combat/animations.js';
import { CombatEventHandlers } from './components/combat/eventHandlers.js';
import { CombatHelpers } from './components/combat/helpers.js';

export class CombatDisplay {
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
    
    setReferences(weaponSystem, spaceship, combatSystem) {
        this.weaponSystem = weaponSystem;
        this.spaceship = spaceship;
        this.combatSystem = combatSystem;
        
        // Pass references to subsystems
        this.weaponDisplay.setReferences(weaponSystem, spaceship);
        this.eventHandlers.setCombatSystem(combatSystem);
        this.eventHandlers.initializeEventListeners();
    }
    
    setupCombatDisplay() {
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
    createShieldDisplay(parent) {
        const shieldContainer = document.createElement('div');
        this.styles.applyShieldContainerStyles(shieldContainer);
        
        const shieldLabel = document.createElement('div');
        shieldLabel.textContent = 'SHIELD';
        this.styles.applyShieldLabelStyles(shieldLabel);
        shieldContainer.appendChild(shieldLabel);
        
        const { container: shieldBarContainer, bar: shieldBar } = this.helpers.createProgressBar(
            'shield-bar-container', 'shield-bar', this.styles,
            this.styles.applyShieldBarContainerStyles, this.styles.applyShieldBarStyles
        );
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
    createHullDisplay(parent) {
        const hullContainer = document.createElement('div');
        this.styles.applyHullContainerStyles(hullContainer);
        
        const hullLabel = document.createElement('div');
        hullLabel.textContent = 'HULL INTEGRITY';
        this.styles.applyHullLabelStyles(hullLabel);
        hullContainer.appendChild(hullLabel);
        
        const { container: hullBarContainer, bar: hullBar } = this.helpers.createProgressBar(
            'hull-bar-container', 'hull-bar', this.styles,
            this.styles.applyHullBarContainerStyles, this.styles.applyHullBarStyles
        );
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
    createStatsContainer(parent) {
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
    
    update() {
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
    updateShieldDisplay() {
        const shieldBar = document.getElementById('shield-bar');
        const shieldValue = document.getElementById('shield-value');
        
        if (!shieldBar || !shieldValue) return;
        
        // Get shield component or fall back to spaceship properties
        const shieldComponent = this.helpers.getComponent(this.spaceship, 'HealthComponent');
        
        let shield = this.helpers.safeGet(shieldComponent, 'shield', 
                                         this.helpers.safeGet(this.spaceship, 'shield', 0));
        let maxShield = this.helpers.safeGet(shieldComponent, 'maxShield', 
                                            this.helpers.safeGet(this.spaceship, 'maxShield', 100));
        
        const shieldPercent = this.helpers.formatPercentage(shield, maxShield);
        shieldBar.style.width = `${shieldPercent}%`;
        shieldValue.textContent = this.helpers.formatValueDisplay(shield, maxShield);
        
        // Change color based on shield level
        shieldBar.style.backgroundColor = this.helpers.getShieldColor(shieldPercent);
    }
    
    /**
     * Update hull display
     */
    updateHullDisplay() {
        const hullBar = document.getElementById('hull-bar');
        const hullValue = document.getElementById('hull-value');
        
        if (!hullBar || !hullValue) return;
        
        // Get health component or fall back to spaceship properties
        const healthComponent = this.helpers.getComponent(this.spaceship, 'HealthComponent');
        
        let health = this.helpers.safeGet(healthComponent, 'health', 
                                         this.helpers.safeGet(this.spaceship, 'hull', 0));
        let maxHealth = this.helpers.safeGet(healthComponent, 'maxHealth', 
                                            this.helpers.safeGet(this.spaceship, 'maxHull', 100));
        
        const healthPercent = this.helpers.formatPercentage(health, maxHealth);
        hullBar.style.width = `${healthPercent}%`;
        hullValue.textContent = this.helpers.formatValueDisplay(health, maxHealth);
        
        // Change color based on hull level
        hullBar.style.backgroundColor = this.helpers.getHealthColor(healthPercent);
    }
    
    
    /**
     * Update enemy count
     */
    updateEnemyCount() {
        const enemyCount = this.helpers.getEnemyCount();
        this.enemyCount = enemyCount;
        this.enemyDisplay.updateEnemyCount(enemyCount);
    }
    
    
    
    
    
    
    /**
     * World position to screen coordinates
     * @param {THREE.Vector3} position World position
     * @returns {Object|null} Screen coordinates
     */
    worldToScreen(position) {
        if (!window.game || !window.game.camera) return null;
        return this.helpers.worldToScreen(position, window.game.camera);
    }
    
    /**
     * Set current target
     * @param {Entity} target Target entity
     */
    setTarget(target) {
        this.currentTarget = target;
        this.enemyDisplay.setTarget(target);
    }
    
    /**
     * Clear current target
     */
    clearTarget() {
        this.currentTarget = null;
        this.enemyDisplay.clearTarget();
    }
    
    
    showNotification(message, duration = 3000) {
        this.indicators.showNotification(message, duration);
    }
    
    hide() {
        // Hide combat UI
        const combatContainer = document.getElementById('combat-container');
        if (combatContainer) {
            combatContainer.style.display = 'none';
        }
        
        // Hide target displays
        this.enemyDisplay.hide();
    }
    
    show() {
        // Show combat UI
        const combatContainer = document.getElementById('combat-container');
        if (combatContainer) {
            combatContainer.style.display = 'block';
        }
    }
    
    /**
     * Cleanup combat display
     */
    cleanup() {
        this.eventHandlers.cleanup();
        this.animations.cleanup();
        this.indicators.clearAll();
    }
} 