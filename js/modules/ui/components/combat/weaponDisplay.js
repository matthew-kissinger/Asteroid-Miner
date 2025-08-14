// weaponDisplay.js - Weapon status, ammo, cooldowns, and special systems

export class WeaponDisplay {
    constructor() {
        this.weaponSystem = null;
        this.spaceship = null;
    }

    /**
     * Set references to weapon system and spaceship
     * @param {Object} weaponSystem Weapon system reference
     * @param {Object} spaceship Spaceship reference
     */
    setReferences(weaponSystem, spaceship) {
        this.weaponSystem = weaponSystem;
        this.spaceship = spaceship;
    }

    /**
     * Create weapon system display
     * @param {HTMLElement} parent Parent container
     * @param {Object} styles Styles object
     */
    createWeaponDisplay(parent, styles) {
        const weaponContainer = document.createElement('div');
        styles.applyWeaponContainerStyles(weaponContainer);
        
        // Weapon mode label
        const weaponLabel = document.createElement('div');
        weaponLabel.textContent = 'WEAPON SYSTEM';
        styles.applyWeaponLabelStyles(weaponLabel);
        weaponContainer.appendChild(weaponLabel);
        
        // Weapon mode
        const weaponMode = document.createElement('div');
        weaponMode.id = 'weapon-mode';
        weaponMode.textContent = 'Particle Cannon';
        styles.applyWeaponModeStyles(weaponMode);
        weaponContainer.appendChild(weaponMode);
        
        // Weapon energy bar
        const weaponEnergyContainer = document.createElement('div');
        styles.applyWeaponEnergyContainerStyles(weaponEnergyContainer);
        
        const weaponEnergyBar = document.createElement('div');
        weaponEnergyBar.id = 'weapon-energy-bar';
        styles.applyWeaponEnergyBarStyles(weaponEnergyBar);
        
        weaponEnergyContainer.appendChild(weaponEnergyBar);
        weaponContainer.appendChild(weaponEnergyContainer);
        
        // Energy value
        const energyValue = document.createElement('div');
        energyValue.id = 'energy-value';
        energyValue.textContent = '100/100';
        styles.applyValueDisplayStyles(energyValue);
        weaponContainer.appendChild(energyValue);
        
        parent.appendChild(weaponContainer);
    }

    /**
     * Create special weapons section of the HUD
     * @param {HTMLElement} parent Parent container
     * @param {Object} styles Styles object
     */
    createSpecialWeaponsSection(parent, styles) {
        const specialContainer = document.createElement('div');
        styles.applySpecialContainerStyles(specialContainer);
        
        // Special weapons header
        const specialHeader = document.createElement('div');
        specialHeader.textContent = 'SPECIAL SYSTEMS';
        styles.applySpecialHeaderStyles(specialHeader);
        specialContainer.appendChild(specialHeader);
        
        // Create special weapon items
        const createSpecialItem = (name, id, color, icon) => {
            const item = document.createElement('div');
            styles.applySpecialItemStyles(item);
            
            // Status indicator (colored circle)
            const statusIndicator = document.createElement('div');
            statusIndicator.id = `${id}-status`;
            styles.applyStatusIndicatorStyles(statusIndicator);
            item.appendChild(statusIndicator);
            
            // Name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            styles.applySpecialNameStyles(nameSpan, color);
            item.appendChild(nameSpan);
            
            // Cooldown indicator (text showing readiness)
            const cooldownSpan = document.createElement('span');
            cooldownSpan.id = `${id}-cooldown`;
            cooldownSpan.textContent = 'READY';
            styles.applyCooldownStyles(cooldownSpan);
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
     * Update special weapons status
     */
    updateSpecialWeaponsStatus() {
        // Update shield status
        this.updateSpecialWeaponStatus('shield', this.spaceship?.getComponent ? 
                                       this.spaceship.getComponent('HealthComponent') : null);
        
        // Update EMP status
        this.updateSpecialWeaponStatus('emp', this.spaceship?.getComponent ?
                                      this.spaceship.getComponent('EMPComponent') : null);
        
        // Update turret status
        this.updateSpecialWeaponStatus('turret', this.spaceship?.getComponent ?
                                       this.spaceship.getComponent('TurretComponent') : null);
        
        // Update missile status
        this.updateSpecialWeaponStatus('missile', this.spaceship?.getComponent ?
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
            statusIndicator.style.backgroundColor = this.getColorForSpecialWeapon(id);
            statusIndicator.style.boxShadow = `0 0 5px ${this.getColorForSpecialWeapon(id)}`;
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
    }

    /**
     * Get color for special weapon type
     * @param {string} type Weapon type
     * @returns {string} Color hex string
     */
    getColorForSpecialWeapon(type) {
        switch (type) {
            case 'shield': return '#3399ff';
            case 'emp': return '#00ffff';
            case 'turret': return '#ff00aa';
            case 'missile': return '#ff5500';
            default: return '#ffffff';
        }
    }

    /**
     * Get weapon info for display
     * @returns {Object} Weapon information
     */
    getWeaponInfo() {
        if (!this.weaponSystem) return null;
        
        const activeWeapon = this.weaponSystem.getActiveWeapon ? 
                          this.weaponSystem.getActiveWeapon() : null;
        
        if (!activeWeapon) return null;
        
        return {
            name: activeWeapon.constructor.name,
            component: activeWeapon,
            energy: this.spaceship?.energy || 100,
            maxEnergy: this.spaceship?.maxEnergy || 100
        };
    }

    /**
     * Check if weapon is ready to fire
     * @param {string} weaponType Type of weapon to check
     * @returns {boolean} True if weapon is ready
     */
    isWeaponReady(weaponType) {
        const component = this.spaceship?.getComponent ? 
                         this.spaceship.getComponent(`${weaponType}Component`) : null;
        
        if (!component) return false;
        
        if (weaponType === 'missile') {
            return component.ammo > 0 && component.timeSinceLastShot >= component.cooldown;
        } else if (weaponType === 'emp') {
            return component.isReady;
        }
        
        return true;
    }
}