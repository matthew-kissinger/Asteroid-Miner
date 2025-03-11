// combatDisplay.js - Handles the combat UI elements

export class CombatDisplay {
    constructor() {
        this.weaponSystem = null;
        this.spaceship = null;
        this.enemyCount = 0;
        this.currentTarget = null;
        this.setupCombatDisplay();
    }
    
    setReferences(weaponSystem, spaceship, combatSystem) {
        this.weaponSystem = weaponSystem;
        this.spaceship = spaceship;
        this.combatSystem = combatSystem;
    }
    
    setupCombatDisplay() {
        // Create combat container
        const combatContainer = document.createElement('div');
        combatContainer.id = 'combat-container';
        combatContainer.style.position = 'absolute';
        combatContainer.style.top = '20px';
        combatContainer.style.right = '20px';
        combatContainer.style.backgroundColor = 'rgba(6, 22, 31, 0.8)';
        combatContainer.style.padding = '15px';
        combatContainer.style.borderRadius = '10px';
        combatContainer.style.border = '1px solid #ff3030';
        combatContainer.style.boxShadow = '0 0 10px rgba(255, 48, 48, 0.5)';
        document.body.appendChild(combatContainer);
        
        // Combat systems title
        const combatTitle = document.createElement('div');
        combatTitle.className = 'combat-title';
        combatTitle.textContent = 'COMBAT SYSTEMS';
        combatTitle.style.fontWeight = 'bold';
        combatTitle.style.marginBottom = '10px';
        combatTitle.style.color = '#ff3030';
        combatTitle.style.textAlign = 'center';
        combatTitle.style.fontSize = '14px';
        combatTitle.style.letterSpacing = '1px';
        combatTitle.style.textTransform = 'uppercase';
        combatContainer.appendChild(combatTitle);
        
        // Create UI item helper function
        const createUIItem = (label, id) => {
            const item = document.createElement('div');
            item.className = 'ui-item';
            item.style.marginBottom = '8px';
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'ui-label';
            labelSpan.textContent = label;
            labelSpan.style.display = 'inline-block';
            labelSpan.style.width = '120px';
            labelSpan.style.color = '#ff3030';
            item.appendChild(labelSpan);
            
            const valueSpan = document.createElement('span');
            valueSpan.id = id;
            valueSpan.className = 'ui-value';
            valueSpan.textContent = '--';
            valueSpan.style.color = '#fff';
            valueSpan.style.fontWeight = 'bold';
            item.appendChild(valueSpan);
            
            return item;
        };
        
        // Create shield display
        const shieldContainer = document.createElement('div');
        shieldContainer.style.marginBottom = '15px';
        
        // Shield label
        const shieldLabel = document.createElement('div');
        shieldLabel.textContent = 'SHIELD';
        shieldLabel.style.color = '#3399ff';
        shieldLabel.style.marginBottom = '5px';
        shieldContainer.appendChild(shieldLabel);
        
        // Shield bar
        const shieldBarContainer = document.createElement('div');
        shieldBarContainer.style.width = '100%';
        shieldBarContainer.style.height = '10px';
        shieldBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        shieldBarContainer.style.border = '1px solid #3399ff';
        shieldBarContainer.style.borderRadius = '5px';
        shieldBarContainer.style.overflow = 'hidden';
        
        const shieldBar = document.createElement('div');
        shieldBar.id = 'shield-bar';
        shieldBar.style.width = '100%';
        shieldBar.style.height = '100%';
        shieldBar.style.backgroundColor = '#3399ff';
        shieldBar.style.transition = 'width 0.3s';
        
        shieldBarContainer.appendChild(shieldBar);
        shieldContainer.appendChild(shieldBarContainer);
        
        // Shield value
        const shieldValue = document.createElement('div');
        shieldValue.id = 'shield-value';
        shieldValue.style.textAlign = 'right';
        shieldValue.style.fontSize = '12px';
        shieldValue.style.marginTop = '2px';
        shieldValue.textContent = '100/100';
        shieldContainer.appendChild(shieldValue);
        
        combatContainer.appendChild(shieldContainer);
        
        // Hull integrity display
        const hullContainer = document.createElement('div');
        hullContainer.style.marginBottom = '15px';
        
        // Hull label
        const hullLabel = document.createElement('div');
        hullLabel.textContent = 'HULL INTEGRITY';
        hullLabel.style.color = '#ff9900';
        hullLabel.style.marginBottom = '5px';
        hullContainer.appendChild(hullLabel);
        
        // Hull bar
        const hullBarContainer = document.createElement('div');
        hullBarContainer.style.width = '100%';
        hullBarContainer.style.height = '10px';
        hullBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        hullBarContainer.style.border = '1px solid #ff9900';
        hullBarContainer.style.borderRadius = '5px';
        hullBarContainer.style.overflow = 'hidden';
        
        const hullBar = document.createElement('div');
        hullBar.id = 'hull-bar';
        hullBar.style.width = '100%';
        hullBar.style.height = '100%';
        hullBar.style.backgroundColor = '#ff9900';
        hullBar.style.transition = 'width 0.3s';
        
        hullBarContainer.appendChild(hullBar);
        hullContainer.appendChild(hullBarContainer);
        
        // Hull value
        const hullValue = document.createElement('div');
        hullValue.id = 'hull-value';
        hullValue.style.textAlign = 'right';
        hullValue.style.fontSize = '12px';
        hullValue.style.marginTop = '2px';
        hullValue.textContent = '100/100';
        hullContainer.appendChild(hullValue);
        
        combatContainer.appendChild(hullContainer);
        
        // Weapon system display
        const weaponContainer = document.createElement('div');
        weaponContainer.style.marginBottom = '15px';
        
        // Weapon mode label
        const weaponLabel = document.createElement('div');
        weaponLabel.textContent = 'WEAPON SYSTEM';
        weaponLabel.style.color = '#33ccff';
        weaponLabel.style.marginBottom = '5px';
        weaponContainer.appendChild(weaponLabel);
        
        // Weapon mode
        const weaponMode = document.createElement('div');
        weaponMode.id = 'weapon-mode';
        weaponMode.textContent = 'Particle Cannon';
        weaponMode.style.marginBottom = '5px';
        weaponContainer.appendChild(weaponMode);
        
        // Weapon energy bar
        const weaponEnergyContainer = document.createElement('div');
        weaponEnergyContainer.style.width = '100%';
        weaponEnergyContainer.style.height = '8px';
        weaponEnergyContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        weaponEnergyContainer.style.border = '1px solid #33ccff';
        weaponEnergyContainer.style.borderRadius = '5px';
        weaponEnergyContainer.style.overflow = 'hidden';
        
        const weaponEnergyBar = document.createElement('div');
        weaponEnergyBar.id = 'weapon-energy-bar';
        weaponEnergyBar.style.width = '100%';
        weaponEnergyBar.style.height = '100%';
        weaponEnergyBar.style.backgroundColor = '#33ccff';
        weaponEnergyBar.style.transition = 'width 0.1s';
        
        weaponEnergyContainer.appendChild(weaponEnergyBar);
        weaponContainer.appendChild(weaponEnergyContainer);
        
        // Energy value
        const energyValue = document.createElement('div');
        energyValue.id = 'energy-value';
        energyValue.style.textAlign = 'right';
        energyValue.style.fontSize = '12px';
        energyValue.style.marginTop = '2px';
        energyValue.textContent = '100/100';
        weaponContainer.appendChild(energyValue);
        
        combatContainer.appendChild(weaponContainer);
        
        // Target info section
        this.createTargetInfoSection(combatContainer);
        
        // Special weapons section
        this.createSpecialWeaponsSection(combatContainer);
        
        // Enemy counter
        combatContainer.appendChild(createUIItem('Hostiles:', 'enemy-count'));
        
        // Combat stats
        const statsContainer = document.createElement('div');
        statsContainer.style.marginTop = '10px';
        statsContainer.style.borderTop = '1px solid rgba(255, 48, 48, 0.5)';
        statsContainer.style.paddingTop = '10px';
        
        const statsTitle = document.createElement('div');
        statsTitle.textContent = 'COMBAT STATS';
        statsTitle.style.color = '#ff3030';
        statsTitle.style.fontSize = '12px';
        statsTitle.style.marginBottom = '5px';
        statsContainer.appendChild(statsTitle);
        
        // Create simple stats display
        const createStatItem = (label, id) => {
            const statItem = document.createElement('div');
            statItem.style.display = 'flex';
            statItem.style.justifyContent = 'space-between';
            statItem.style.fontSize = '11px';
            statItem.style.marginBottom = '3px';
            
            const statLabel = document.createElement('span');
            statLabel.textContent = label;
            statLabel.style.color = '#aaaaaa';
            statItem.appendChild(statLabel);
            
            const statValue = document.createElement('span');
            statValue.id = id;
            statValue.textContent = '0';
            statValue.style.color = '#ffffff';
            statItem.appendChild(statValue);
            
            return statItem;
        };
        
        statsContainer.appendChild(createStatItem('Enemies Destroyed:', 'enemies-destroyed'));
        statsContainer.appendChild(createStatItem('Damage Dealt:', 'damage-dealt'));
        statsContainer.appendChild(createStatItem('Damage Received:', 'damage-received'));
        
        combatContainer.appendChild(statsContainer);
        
        // Controls hint
        const controlsHint = document.createElement('div');
        controlsHint.style.fontSize = '11px';
        controlsHint.style.color = '#cccccc';
        controlsHint.style.marginTop = '10px';
        controlsHint.innerHTML = `
            <div style="margin-bottom:3px;">COMBAT CONTROLS:</div>
            <div>• RMB: Fire Primary</div>
            <div>• MMB: Fire Secondary/Missile</div>
            <div>• Z: Shield</div>
            <div>• X: EMP Burst</div>
            <div>• C: Toggle Turrets</div>
            <div>• F: Cycle Weapons</div>
        `;
        combatContainer.appendChild(controlsHint);
        
        // Create notification area
        const notificationArea = document.createElement('div');
        notificationArea.id = 'notification-area';
        notificationArea.style.position = 'absolute';
        notificationArea.style.top = '100px';
        notificationArea.style.left = '50%';
        notificationArea.style.transform = 'translateX(-50%)';
        notificationArea.style.padding = '10px 20px';
        notificationArea.style.borderRadius = '8px';
        notificationArea.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notificationArea.style.color = '#ff9900';
        notificationArea.style.fontWeight = 'bold';
        notificationArea.style.zIndex = '1000';
        notificationArea.style.display = 'none';
        notificationArea.style.transition = 'opacity 0.5s';
        document.body.appendChild(notificationArea);
        
        // Create target HUD - appears over targeted enemies
        this.createTargetHUD();
    }
    
    /**
     * Create target info section of the HUD
     * @param {HTMLElement} parent Parent container
     */
    createTargetInfoSection(parent) {
        const targetContainer = document.createElement('div');
        targetContainer.style.marginBottom = '15px';
        targetContainer.style.padding = '8px';
        targetContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        targetContainer.style.borderRadius = '5px';
        targetContainer.style.border = '1px solid rgba(255, 128, 0, 0.5)';
        
        // Target header
        const targetHeader = document.createElement('div');
        targetHeader.textContent = 'TARGET';
        targetHeader.style.color = '#ff8000';
        targetHeader.style.fontSize = '12px';
        targetHeader.style.marginBottom = '5px';
        targetContainer.appendChild(targetHeader);
        
        // Target info
        const targetInfo = document.createElement('div');
        targetInfo.id = 'target-info';
        targetInfo.style.fontSize = '12px';
        targetInfo.style.color = '#cccccc';
        targetInfo.innerHTML = 'No target selected';
        targetContainer.appendChild(targetInfo);
        
        // Target health bar
        const targetHealthContainer = document.createElement('div');
        targetHealthContainer.id = 'target-health-container';
        targetHealthContainer.style.width = '100%';
        targetHealthContainer.style.height = '8px';
        targetHealthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        targetHealthContainer.style.border = '1px solid #ff5500';
        targetHealthContainer.style.borderRadius = '4px';
        targetHealthContainer.style.overflow = 'hidden';
        targetHealthContainer.style.marginTop = '5px';
        targetHealthContainer.style.display = 'none'; // Hide until target selected
        
        const targetHealthBar = document.createElement('div');
        targetHealthBar.id = 'target-health-bar';
        targetHealthBar.style.width = '100%';
        targetHealthBar.style.height = '100%';
        targetHealthBar.style.backgroundColor = '#ff5500';
        targetHealthBar.style.transition = 'width 0.3s';
        
        targetHealthContainer.appendChild(targetHealthBar);
        targetContainer.appendChild(targetHealthContainer);
        
        // Target shield bar
        const targetShieldContainer = document.createElement('div');
        targetShieldContainer.id = 'target-shield-container';
        targetShieldContainer.style.width = '100%';
        targetShieldContainer.style.height = '4px';
        targetShieldContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        targetShieldContainer.style.border = '1px solid #3399ff';
        targetShieldContainer.style.borderRadius = '2px';
        targetShieldContainer.style.overflow = 'hidden';
        targetShieldContainer.style.marginTop = '3px';
        targetShieldContainer.style.display = 'none'; // Hide until target with shields selected
        
        const targetShieldBar = document.createElement('div');
        targetShieldBar.id = 'target-shield-bar';
        targetShieldBar.style.width = '100%';
        targetShieldBar.style.height = '100%';
        targetShieldBar.style.backgroundColor = '#3399ff';
        targetShieldBar.style.transition = 'width 0.3s';
        
        targetShieldContainer.appendChild(targetShieldBar);
        targetContainer.appendChild(targetShieldContainer);
        
        parent.appendChild(targetContainer);
    }
    
    /**
     * Create special weapons section of the HUD
     * @param {HTMLElement} parent Parent container
     */
    createSpecialWeaponsSection(parent) {
        const specialContainer = document.createElement('div');
        specialContainer.style.marginBottom = '15px';
        
        // Special weapons header
        const specialHeader = document.createElement('div');
        specialHeader.textContent = 'SPECIAL SYSTEMS';
        specialHeader.style.color = '#33ccff';
        specialHeader.style.fontSize = '12px';
        specialHeader.style.marginBottom = '5px';
        specialContainer.appendChild(specialHeader);
        
        // Create special weapon items
        const createSpecialItem = (name, id, color, icon) => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.marginBottom = '6px';
            
            // Status indicator (colored circle)
            const statusIndicator = document.createElement('div');
            statusIndicator.id = `${id}-status`;
            statusIndicator.style.width = '10px';
            statusIndicator.style.height = '10px';
            statusIndicator.style.borderRadius = '50%';
            statusIndicator.style.backgroundColor = '#555555'; // Inactive color
            statusIndicator.style.marginRight = '6px';
            item.appendChild(statusIndicator);
            
            // Name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            nameSpan.style.color = color;
            nameSpan.style.flex = '1';
            nameSpan.style.fontSize = '12px';
            item.appendChild(nameSpan);
            
            // Cooldown indicator (text showing readiness)
            const cooldownSpan = document.createElement('span');
            cooldownSpan.id = `${id}-cooldown`;
            cooldownSpan.textContent = 'READY';
            cooldownSpan.style.color = '#55ff55';
            cooldownSpan.style.fontSize = '11px';
            cooldownSpan.style.fontWeight = 'bold';
            item.appendChild(cooldownSpan);
            
            return item;
        };
        
        specialContainer.appendChild(createSpecialItem('Shield Generator', 'shield', '#3399ff', 'shield'));
        specialContainer.appendChild(createSpecialItem('EMP Burst', 'emp', '#00ffff', 'burst'));
        specialContainer.appendChild(createSpecialItem('Laser Turrets', 'turret', '#ff00aa', 'turret'));
        specialContainer.appendChild(createSpecialItem('Missile System', 'missile', '#ff5500', 'missile'));
        
        parent.appendChild(specialContainer);
    }
    
    /**
     * Create target HUD that appears over enemies
     */
    createTargetHUD() {
        const targetHUD = document.createElement('div');
        targetHUD.id = 'target-hud';
        targetHUD.style.position = 'absolute';
        targetHUD.style.display = 'none'; // Hidden until target acquired
        targetHUD.style.pointerEvents = 'none';
        document.body.appendChild(targetHUD);
        
        // Create targeting bracket (consists of 4 corner brackets)
        for (let i = 0; i < 4; i++) {
            const bracket = document.createElement('div');
            bracket.className = 'target-bracket';
            bracket.style.position = 'absolute';
            bracket.style.width = '12px';
            bracket.style.height = '12px';
            bracket.style.borderColor = '#ff3030';
            bracket.style.borderStyle = 'solid';
            bracket.style.borderWidth = '0';
            
            // Position corner brackets
            switch (i) {
                case 0: // Top left
                    bracket.style.top = '0';
                    bracket.style.left = '0';
                    bracket.style.borderTopWidth = '2px';
                    bracket.style.borderLeftWidth = '2px';
                    break;
                case 1: // Top right
                    bracket.style.top = '0';
                    bracket.style.right = '0';
                    bracket.style.borderTopWidth = '2px';
                    bracket.style.borderRightWidth = '2px';
                    break;
                case 2: // Bottom left
                    bracket.style.bottom = '0';
                    bracket.style.left = '0';
                    bracket.style.borderBottomWidth = '2px';
                    bracket.style.borderLeftWidth = '2px';
                    break;
                case 3: // Bottom right
                    bracket.style.bottom = '0';
                    bracket.style.right = '0';
                    bracket.style.borderBottomWidth = '2px';
                    bracket.style.borderRightWidth = '2px';
                    break;
            }
            
            targetHUD.appendChild(bracket);
        }
        
        // Create target info label (appears below target)
        const targetLabel = document.createElement('div');
        targetLabel.id = 'target-hud-label';
        targetLabel.style.position = 'absolute';
        targetLabel.style.top = '100%';
        targetLabel.style.left = '50%';
        targetLabel.style.transform = 'translateX(-50%)';
        targetLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        targetLabel.style.color = '#ff3030';
        targetLabel.style.padding = '2px 6px';
        targetLabel.style.borderRadius = '3px';
        targetLabel.style.fontSize = '12px';
        targetLabel.style.whiteSpace = 'nowrap';
        targetLabel.style.marginTop = '5px';
        targetHUD.appendChild(targetLabel);
        
        // Create health bar (appears above target)
        const healthContainer = document.createElement('div');
        healthContainer.style.position = 'absolute';
        healthContainer.style.bottom = '100%';
        healthContainer.style.left = '0';
        healthContainer.style.width = '100%';
        healthContainer.style.height = '4px';
        healthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        healthContainer.style.marginBottom = '3px';
        
        const healthBar = document.createElement('div');
        healthBar.id = 'target-hud-health';
        healthBar.style.width = '100%';
        healthBar.style.height = '100%';
        healthBar.style.backgroundColor = '#ff3030';
        
        healthContainer.appendChild(healthBar);
        targetHUD.appendChild(healthContainer);
    }
    
    update() {
        // Skip updating if refs not set
        if (!this.spaceship) return;
        
        // Update shield display
        this.updateShieldDisplay();
        
        // Update hull display
        this.updateHullDisplay();
        
        // Update weapon display
        this.updateWeaponDisplay();
        
        // Update enemy count
        this.updateEnemyCount();
        
        // Update target info
        this.updateTargetInfo();
        
        // Update special weapons status
        this.updateSpecialWeaponsStatus();
        
        // Update combat stats
        this.updateCombatStats();
        
        // Update target HUD position if we have a target
        this.updateTargetHUD();
    }
    
    /**
     * Update shield display
     */
    updateShieldDisplay() {
        const shieldBar = document.getElementById('shield-bar');
        const shieldValue = document.getElementById('shield-value');
        
        if (!shieldBar || !shieldValue) return;
        
        // Get shield component or fall back to spaceship properties
        const shieldComponent = this.spaceship.getComponent ? 
                              this.spaceship.getComponent('HealthComponent') : null;
        
        let shield = 0;
        let maxShield = 100;
        
        if (shieldComponent) {
            shield = shieldComponent.shield;
            maxShield = shieldComponent.maxShield;
        } else if (this.spaceship.shield !== undefined) {
            // Fallback to direct properties
            shield = this.spaceship.shield;
            maxShield = this.spaceship.maxShield;
        }
        
        const shieldPercent = (shield / maxShield) * 100;
        shieldBar.style.width = `${shieldPercent}%`;
        shieldValue.textContent = `${Math.round(shield)}/${Math.round(maxShield)}`;
        
        // Change color based on shield level
        if (shieldPercent < 25) {
            shieldBar.style.backgroundColor = '#ff3030'; // Red for low shields
        } else if (shieldPercent < 50) {
            shieldBar.style.backgroundColor = '#ffcc00'; // Yellow for mid shields
        } else {
            shieldBar.style.backgroundColor = '#3399ff'; // Blue for healthy shields
        }
    }
    
    /**
     * Update hull display
     */
    updateHullDisplay() {
        const hullBar = document.getElementById('hull-bar');
        const hullValue = document.getElementById('hull-value');
        
        if (!hullBar || !hullValue) return;
        
        // Get health component or fall back to spaceship properties
        const healthComponent = this.spaceship.getComponent ? 
                               this.spaceship.getComponent('HealthComponent') : null;
        
        let health = 0;
        let maxHealth = 100;
        
        if (healthComponent) {
            health = healthComponent.health;
            maxHealth = healthComponent.maxHealth;
        } else if (this.spaceship.hull !== undefined) {
            // Fallback to direct properties
            health = this.spaceship.hull;
            maxHealth = this.spaceship.maxHull;
        }
        
        const healthPercent = (health / maxHealth) * 100;
        hullBar.style.width = `${healthPercent}%`;
        hullValue.textContent = `${Math.round(health)}/${Math.round(maxHealth)}`;
        
        // Change color based on hull level
        if (healthPercent < 25) {
            hullBar.style.backgroundColor = '#ff3030'; // Red for critical hull
        } else if (healthPercent < 50) {
            hullBar.style.backgroundColor = '#ffcc00'; // Yellow for damaged hull
        } else {
            hullBar.style.backgroundColor = '#ff9900'; // Orange for healthy hull
        }
    }
    
    /**
     * Update weapon display
     */
    updateWeaponDisplay() {
        const weaponMode = document.getElementById('weapon-mode');
        const weaponEnergyBar = document.getElementById('weapon-energy-bar');
        const energyValue = document.getElementById('energy-value');
        
        if (!weaponMode || !weaponEnergyBar || !energyValue || !this.weaponSystem) return;
        
        // Update weapon mode text
        let weaponName = 'Particle Cannon';
        let weaponColor = '#00ffff';
        let energy = 100;
        let maxEnergy = 100;
        
        // Get active weapon component
        const activeWeapon = this.weaponSystem.getActiveWeapon ? 
                          this.weaponSystem.getActiveWeapon() : null;
        
        if (activeWeapon) {
            // Set weapon name and color based on type
            if (activeWeapon.constructor.name === 'ParticleCannonComponent') {
                weaponName = 'Particle Cannon';
                weaponColor = '#00ffff';
                energy = this.spaceship.energy || 100;
                maxEnergy = this.spaceship.maxEnergy || 100;
            } else if (activeWeapon.constructor.name === 'MissileComponent') {
                weaponName = `Missiles (${activeWeapon.ammo}/${activeWeapon.maxAmmo})`;
                weaponColor = '#ff5500';
                energy = this.spaceship.energy || 100;
                maxEnergy = this.spaceship.maxEnergy || 100;
            } else if (activeWeapon.constructor.name === 'TurretComponent') {
                weaponName = `Laser Turrets ${activeWeapon.isActive ? '(ACTIVE)' : '(INACTIVE)'}`;
                weaponColor = '#ff00aa';
                energy = this.spaceship.energy || 100;
                maxEnergy = this.spaceship.maxEnergy || 100;
            } else if (activeWeapon.constructor.name === 'EMPComponent') {
                weaponName = 'EMP Burst';
                weaponColor = '#00ffff';
                energy = this.spaceship.energy || 100;
                maxEnergy = this.spaceship.maxEnergy || 100;
            }
        } else if (this.weaponSystem.getCurrentWeaponInfo) {
            // Alternative: use weapon info method
            const weaponInfo = this.weaponSystem.getCurrentWeaponInfo();
            weaponName = weaponInfo.name;
            weaponColor = `#${weaponInfo.color.toString(16).padStart(6, '0')}`;
            energy = weaponInfo.energy;
            maxEnergy = weaponInfo.maxEnergy;
        }
        
        // Update weapon mode display
        weaponMode.textContent = weaponName;
        weaponMode.style.color = weaponColor;
        
        // Update energy bar
        const energyPercent = (energy / maxEnergy) * 100;
        weaponEnergyBar.style.width = `${energyPercent}%`;
        energyValue.textContent = `${Math.round(energy)}/${Math.round(maxEnergy)}`;
        
        // Set energy bar color to match weapon
        weaponEnergyBar.style.backgroundColor = weaponColor;
    }
    
    /**
     * Update enemy count
     */
    updateEnemyCount() {
        const enemyCountElement = document.getElementById('enemy-count');
        if (!enemyCountElement) return;
        
        // Get enemy count from enemy system or combat manager
        let enemyCount = 0;
        
        if (window.game && window.game.enemySystem) {
            enemyCount = window.game.enemySystem.enemies.size;
        } else if (window.game && window.game.combatManager) {
            enemyCount = window.game.combatManager.enemies.length;
        }
        
        this.enemyCount = enemyCount;
        enemyCountElement.textContent = this.enemyCount;
        
        // Highlight when enemies are present
        if (this.enemyCount > 0) {
            enemyCountElement.style.color = '#ff3030';
        } else {
            enemyCountElement.style.color = '#ffffff';
        }
    }
    
    /**
     * Update target information display
     */
    updateTargetInfo() {
        const targetInfo = document.getElementById('target-info');
        const targetHealthContainer = document.getElementById('target-health-container');
        const targetHealthBar = document.getElementById('target-health-bar');
        const targetShieldContainer = document.getElementById('target-shield-container');
        const targetShieldBar = document.getElementById('target-shield-bar');
        
        if (!targetInfo || !targetHealthContainer || !targetHealthBar || !targetShieldContainer || !targetShieldBar) {
            return;
        }
        
        // Check if we have a target
        if (!this.currentTarget || !this.isTargetValid(this.currentTarget)) {
            // No target or invalid target
            targetInfo.textContent = 'No target selected';
            targetHealthContainer.style.display = 'none';
            targetShieldContainer.style.display = 'none';
            return;
        }
        
        // Get target components
        const enemyAI = this.currentTarget.getComponent('EnemyAIComponent');
        const health = this.currentTarget.getComponent('HealthComponent');
        
        if (!enemyAI || !health) {
            targetInfo.textContent = 'Target data unavailable';
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
     * Update special weapons status
     */
    updateSpecialWeaponsStatus() {
        // Update shield status
        this.updateSpecialWeaponStatus('shield', this.spaceship.getComponent ? 
                                       this.spaceship.getComponent('HealthComponent') : null);
        
        // Update EMP status
        this.updateSpecialWeaponStatus('emp', this.spaceship.getComponent ?
                                      this.spaceship.getComponent('EMPComponent') : null);
        
        // Update turret status
        this.updateSpecialWeaponStatus('turret', this.spaceship.getComponent ?
                                       this.spaceship.getComponent('TurretComponent') : null);
        
        // Update missile status
        this.updateSpecialWeaponStatus('missile', this.spaceship.getComponent ?
                                        this.spaceship.getComponent('MissileComponent') : null);
    }
    
    /**
     * Update status for a single special weapon
     * @param {string} id Component ID
     * @param {Component} component Weapon component
     */
    updateSpecialWeaponStatus(id, component) {
        const statusIndicator = document.getElementById(`${id}-status`);
        const cooldownText = document.getElementById(`${id}-cooldown`);
        
        if (!statusIndicator || !cooldownText) return;
        
        // Default values if component not found
        let isActive = false;
        let isReady = true;
        let cooldownProgress = 1;
        
        if (component) {
            // Get component status
            if (id === 'shield') {
                // Use shield properties from HealthComponent instead of ShieldComponent
                isActive = component.shield > 0;
                isReady = component.getShieldPercentage() > 0;
                cooldownProgress = component.getShieldPercentage() / 100;
            } else if (id === 'emp') {
                isActive = false; // EMP is momentary, not a toggle
                isReady = component.isReady;
                cooldownProgress = component.getCooldownProgress ? component.getCooldownProgress() : 1;
            } else if (id === 'turret') {
                isActive = component.isActive;
                isReady = true; // Turrets are always ready, just toggled on/off
                cooldownProgress = 1;
            } else if (id === 'missile') {
                isActive = component.lockingOn;
                isReady = component.timeSinceLastShot >= component.cooldown;
                cooldownProgress = component.timeSinceLastShot / component.cooldown;
                
                // Special case for missiles - show ammo count
                if (cooldownText) {
                    if (component.ammo <= 0) {
                        cooldownText.textContent = 'NO AMMO';
                        cooldownText.style.color = '#ff3030';
                    } else if (!isReady) {
                        cooldownText.textContent = 'LOADING';
                        cooldownText.style.color = '#ffcc00';
                    } else {
                        cooldownText.textContent = `${component.ammo}/${component.maxAmmo}`;
                        cooldownText.style.color = '#55ff55';
                    }
                    
                    // Skip rest of function as we've already set the text
                    return;
                }
            }
        }
        
        // Update status indicator color
        if (isActive) {
            // Active
            statusIndicator.style.backgroundColor = getColorForSpecialWeapon(id);
            statusIndicator.style.boxShadow = `0 0 5px ${getColorForSpecialWeapon(id)}`;
        } else if (isReady) {
            // Ready but not active
            statusIndicator.style.backgroundColor = '#55ff55';
            statusIndicator.style.boxShadow = '0 0 5px #55ff55';
        } else {
            // Cooling down
            statusIndicator.style.backgroundColor = '#555555';
            statusIndicator.style.boxShadow = 'none';
        }
        
        // Update cooldown text
        if (cooldownProgress >= 1) {
            cooldownText.textContent = 'READY';
            cooldownText.style.color = '#55ff55';
        } else {
            // Show percentage
            const percent = Math.floor(cooldownProgress * 100);
            cooldownText.textContent = `${percent}%`;
            cooldownText.style.color = '#ffcc00';
        }
        
        // Helper function to get color for special weapon
        function getColorForSpecialWeapon(type) {
            switch (type) {
                case 'shield': return '#3399ff';
                case 'emp': return '#00ffff';
                case 'turret': return '#ff00aa';
                case 'missile': return '#ff5500';
                default: return '#ffffff';
            }
        }
    }
    
    /**
     * Update combat statistics display
     */
    updateCombatStats() {
        // Get combat stats from combat system
        if (!this.combatSystem) return;
        
        // Update enemies destroyed
        const enemiesDestroyedElement = document.getElementById('enemies-destroyed');
        if (enemiesDestroyedElement) {
            const enemiesDestroyed = this.combatSystem.enemiesDestroyed || 0;
            enemiesDestroyedElement.textContent = enemiesDestroyed;
        }
        
        // Update damage dealt
        const damageDealtElement = document.getElementById('damage-dealt');
        if (damageDealtElement) {
            const damageDealt = Math.floor(this.combatSystem.damageDealt || 0);
            damageDealtElement.textContent = damageDealt;
        }
        
        // Update damage received
        const damageReceivedElement = document.getElementById('damage-received');
        if (damageReceivedElement) {
            const damageReceived = Math.floor(this.combatSystem.damageReceived || 0);
            damageReceivedElement.textContent = damageReceived;
        }
    }
    
    /**
     * Update target HUD position over targeted enemy
     */
    updateTargetHUD() {
        const targetHUD = document.getElementById('target-hud');
        const targetHUDLabel = document.getElementById('target-hud-label');
        const targetHUDHealth = document.getElementById('target-hud-health');
        
        if (!targetHUD || !targetHUDLabel || !targetHUDHealth) return;
        
        // Hide target HUD if no target or invalid target
        if (!this.currentTarget || !this.isTargetValid(this.currentTarget)) {
            targetHUD.style.display = 'none';
            return;
        }
        
        // Get target components
        const enemyAI = this.currentTarget.getComponent('EnemyAIComponent');
        const health = this.currentTarget.getComponent('HealthComponent');
        const transform = this.currentTarget.getComponent('TransformComponent');
        
        if (!enemyAI || !health || !transform) {
            targetHUD.style.display = 'none';
            return;
        }
        
        // Convert 3D position to screen coordinates
        const screenPosition = this.worldToScreen(transform.position);
        
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
     * World position to screen coordinates
     * @param {THREE.Vector3} position World position
     * @returns {Object|null} Screen coordinates
     */
    worldToScreen(position) {
        // Need access to camera
        if (!window.game || !window.game.camera) return null;
        
        const camera = window.game.camera;
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
     * Set current target
     * @param {Entity} target Target entity
     */
    setTarget(target) {
        this.currentTarget = target;
        
        // Update UI immediately
        this.updateTargetInfo();
        this.updateTargetHUD();
    }
    
    /**
     * Clear current target
     */
    clearTarget() {
        this.currentTarget = null;
        
        // Update UI immediately
        this.updateTargetInfo();
        this.updateTargetHUD();
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
    
    showNotification(message, duration = 3000) {
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
    
    hide() {
        // Hide combat UI
        const combatContainer = document.getElementById('combat-container');
        if (combatContainer) {
            combatContainer.style.display = 'none';
        }
        
        // Hide target HUD
        const targetHUD = document.getElementById('target-hud');
        if (targetHUD) {
            targetHUD.style.display = 'none';
        }
    }
    
    show() {
        // Show combat UI
        const combatContainer = document.getElementById('combat-container');
        if (combatContainer) {
            combatContainer.style.display = 'block';
        }
    }
} 