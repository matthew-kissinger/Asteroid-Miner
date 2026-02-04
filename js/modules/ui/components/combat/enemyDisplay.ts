// enemyDisplay.js - Enemy health bars, status displays, and target tracking

export class EnemyDisplay {
    constructor() {
        this.currentTarget = null;
    }

    /**
     * Create target info section of the HUD
     * @param {HTMLElement} parent Parent container
     * @param {Object} styles Styles object
     */
    createTargetInfoSection(parent, styles) {
        const targetContainer = document.createElement('div');
        styles.applyTargetContainerStyles(targetContainer);
        
        // Target header
        const targetHeader = document.createElement('div');
        targetHeader.textContent = 'TARGET';
        styles.applyTargetHeaderStyles(targetHeader);
        targetContainer.appendChild(targetHeader);
        
        // Target info for combat display (different from main HUD target-info)
        const targetInfo = document.createElement('div');
        targetInfo.id = 'combat-target-info';  // Changed ID to avoid conflict
        styles.applyTargetInfoStyles(targetInfo);
        targetContainer.appendChild(targetInfo);
        
        // Target health bar
        const targetHealthContainer = document.createElement('div');
        targetHealthContainer.id = 'target-health-container';
        styles.applyTargetHealthContainerStyles(targetHealthContainer);
        
        const targetHealthBar = document.createElement('div');
        targetHealthBar.id = 'target-health-bar';
        styles.applyTargetHealthBarStyles(targetHealthBar);
        
        targetHealthContainer.appendChild(targetHealthBar);
        targetContainer.appendChild(targetHealthContainer);
        
        // Target shield bar
        const targetShieldContainer = document.createElement('div');
        targetShieldContainer.id = 'target-shield-container';
        styles.applyTargetShieldContainerStyles(targetShieldContainer);
        
        const targetShieldBar = document.createElement('div');
        targetShieldBar.id = 'target-shield-bar';
        styles.applyTargetShieldBarStyles(targetShieldBar);
        
        targetShieldContainer.appendChild(targetShieldBar);
        targetContainer.appendChild(targetShieldContainer);
        
        parent.appendChild(targetContainer);
    }

    /**
     * Create target HUD that appears over enemies
     * @param {Object} styles Styles object
     */
    createTargetHUD(styles) {
        const targetHUD = document.createElement('div');
        targetHUD.id = 'target-hud';
        styles.applyTargetHUDStyles(targetHUD);
        document.body.appendChild(targetHUD);
        
        // Create targeting bracket (consists of 4 corner brackets)
        for (let i = 0; i < 4; i++) {
            const bracket = document.createElement('div');
            bracket.className = 'target-bracket';
            styles.applyTargetBracketStyles(bracket, i);
            targetHUD.appendChild(bracket);
        }
        
        // Create target info label (appears below target)
        const targetLabel = document.createElement('div');
        targetLabel.id = 'target-hud-label';
        styles.applyTargetHUDLabelStyles(targetLabel);
        targetHUD.appendChild(targetLabel);
        
        // Create health bar (appears above target)
        const healthContainer = document.createElement('div');
        styles.applyTargetHUDHealthContainerStyles(healthContainer);
        
        const healthBar = document.createElement('div');
        healthBar.id = 'target-hud-health';
        styles.applyTargetHUDHealthBarStyles(healthBar);
        
        healthContainer.appendChild(healthBar);
        targetHUD.appendChild(healthContainer);
    }

    /**
     * Update target information display
     * @param {Entity} currentTarget Current target entity
     */
    updateTargetInfo(currentTarget) {
        this.currentTarget = currentTarget;
        
        const targetInfo = document.getElementById('combat-target-info');
        const targetHealthContainer = document.getElementById('target-health-container');
        const targetHealthBar = document.getElementById('target-health-bar');
        const targetShieldContainer = document.getElementById('target-shield-container');
        const targetShieldBar = document.getElementById('target-shield-bar');
        
        if (!targetInfo || !targetHealthContainer || !targetHealthBar || !targetShieldContainer || !targetShieldBar) {
            return;
        }
        
        // Check if we have a target
        if (!currentTarget || !this.isTargetValid(currentTarget)) {
            // No target or invalid target - hide it if we were showing combat info
            // Only hide if it's currently showing combat info (has the enemy div structure)
            if (targetInfo.innerHTML.includes('State:')) {
                targetInfo.style.display = 'none';
            }
            targetHealthContainer.style.display = 'none';
            targetShieldContainer.style.display = 'none';
            return;
        }
        
        // Get target components
        const enemyAI = currentTarget.getComponent('EnemyAIComponent');
        const health = currentTarget.getComponent('HealthComponent');
        
        if (!enemyAI || !health) {
            // Don't modify target-info, let targeting system control it
            targetHealthContainer.style.display = 'none';
            targetShieldContainer.style.display = 'none';
            return;
        }
        
        // Update target info text
        const faction = enemyAI.faction.charAt(0).toUpperCase() + enemyAI.faction.slice(1);
        const type = enemyAI.type.charAt(0).toUpperCase() + enemyAI.type.slice(1);
        targetInfo.innerHTML = `
            <div style="color:#ff8000">${faction} ${type}</div>
            <div style="font-size:11px">State: ${enemyAI.currentState.toUpperCase()}</div>
        `;
        targetInfo.style.display = 'block'; // Show when we have a combat target
        
        // Update health bar
        const healthPercent = health.getHealthPercentage();
        targetHealthContainer.style.display = 'block';
        targetHealthBar.style.width = `${healthPercent}%`;
        
        // Change health bar color based on percentage
        if (healthPercent < 25) {
            targetHealthBar.style.backgroundColor = '#ff3030'; // Red for critical health
        } else if (healthPercent < 50) {
            targetHealthBar.style.backgroundColor = '#ffcc00'; // Yellow for damaged
        } else {
            targetHealthBar.style.backgroundColor = '#ff5500'; // Orange for healthy
        }
        
        // Update shield bar if target has shields
        if (health.maxShield > 0) {
            const shieldPercent = health.getShieldPercentage();
            targetShieldContainer.style.display = 'block';
            targetShieldBar.style.width = `${shieldPercent}%`;
        } else {
            targetShieldContainer.style.display = 'none';
        }
    }

    /**
     * Update target HUD position over targeted enemy
     * @param {Entity} currentTarget Current target entity
     * @param {Function} worldToScreen Function to convert world to screen coords
     */
    updateTargetHUD(currentTarget, worldToScreen) {
        this.currentTarget = currentTarget;
        
        const targetHUD = document.getElementById('target-hud');
        const targetHUDLabel = document.getElementById('target-hud-label');
        const targetHUDHealth = document.getElementById('target-hud-health');
        
        if (!targetHUD || !targetHUDLabel || !targetHUDHealth) return;
        
        // Hide target HUD if no target or invalid target
        if (!currentTarget || !this.isTargetValid(currentTarget)) {
            targetHUD.style.display = 'none';
            return;
        }
        
        // Get target components
        const enemyAI = currentTarget.getComponent('EnemyAIComponent');
        const health = currentTarget.getComponent('HealthComponent');
        const transform = currentTarget.getComponent('TransformComponent');
        
        if (!enemyAI || !health || !transform) {
            targetHUD.style.display = 'none';
            return;
        }
        
        // Convert 3D position to screen coordinates
        const screenPosition = worldToScreen(transform.position);
        
        if (!screenPosition) {
            targetHUD.style.display = 'none';
            return;
        }
        
        // Position target HUD
        targetHUD.style.display = 'block';
        targetHUD.style.left = `${screenPosition.x - 50}px`;
        targetHUD.style.top = `${screenPosition.y - 50}px`;
        targetHUD.style.width = '100px';
        targetHUD.style.height = '100px';
        
        // Update label
        const faction = enemyAI.faction.charAt(0).toUpperCase() + enemyAI.faction.slice(1);
        const type = enemyAI.type.charAt(0).toUpperCase() + enemyAI.type.slice(1);
        targetHUDLabel.textContent = `${faction} ${type}`;
        
        // Update health bar
        const healthPercent = health.getHealthPercentage();
        targetHUDHealth.style.width = `${healthPercent}%`;
        
        // Change health bar color based on percentage
        if (healthPercent < 25) {
            targetHUDHealth.style.backgroundColor = '#ff3030'; // Red for critical health
        } else if (healthPercent < 50) {
            targetHUDHealth.style.backgroundColor = '#ffcc00'; // Yellow for damaged
        } else {
            targetHUDHealth.style.backgroundColor = '#ff5500'; // Orange for healthy
        }
    }

    /**
     * Set current target
     * @param {Entity} target Target entity
     */
    setTarget(target) {
        this.currentTarget = target;
        this.updateTargetInfo(target);
    }

    /**
     * Clear current target
     */
    clearTarget() {
        this.currentTarget = null;
        this.updateTargetInfo(null);
    }

    /**
     * Check if a target is valid
     * @param {Entity} target Target to check
     * @returns {boolean} True if target is valid
     */
    isTargetValid(target) {
        if (!target) return false;
        
        // Check if target exists in world
        if (!target.world) return false;
        
        // Check if target has required components
        const health = target.getComponent('HealthComponent');
        if (!health) return false;
        
        // Check if target is destroyed
        if (health.isDestroyed) return false;
        
        return true;
    }

    /**
     * Update enemy count display
     * @param {number} enemyCount Current enemy count
     */
    updateEnemyCount(enemyCount) {
        const enemyCountElement = document.getElementById('enemy-count');
        if (!enemyCountElement) return;
        
        enemyCountElement.textContent = enemyCount;
        
        // Highlight when enemies are present
        if (enemyCount > 0) {
            enemyCountElement.style.color = '#ff3030';
        } else {
            enemyCountElement.style.color = '#ffffff';
        }
    }

    /**
     * Hide target displays
     */
    hide() {
        const targetHUD = document.getElementById('target-hud');
        if (targetHUD) {
            targetHUD.style.display = 'none';
        }
    }
}