// weaponDisplay.ts - Weapon status, ammo, cooldowns, and special systems
// Base styles are in src/styles/combat.css

import { combatStyles } from './styles';

export interface WeaponComponent {
    type?: string;
    constructor?: { name: string };
    ammo?: number;
    maxAmmo?: number;
    isActive?: boolean;
    isReady?: boolean;
    lockingOn?: boolean;
    timeSinceLastShot?: number;
    cooldown?: number;
    shield?: number;
    getShieldPercentage?: () => number;
    getCooldownProgress?: () => number;
}

/** Helper to swap between mutually-exclusive modifier classes */
function setModifierClass(el: HTMLElement, prefix: string, modifier: string): void {
    // Remove any existing modifier with this prefix
    const toRemove: string[] = [];
    el.classList.forEach(c => { if (c.startsWith(prefix)) toRemove.push(c); });
    toRemove.forEach(c => el.classList.remove(c));
    el.classList.add(`${prefix}${modifier}`);
}

export class WeaponDisplay {
    weaponSystem: any | null;
    spaceship: any | null;

    constructor() {
        this.weaponSystem = null;
        this.spaceship = null;
    }

    /**
     * Set references to weapon system and spaceship
     * @param weaponSystem Weapon system reference
     * @param spaceship Spaceship reference
     */
    setReferences(weaponSystem: any, spaceship: any): void {
        this.weaponSystem = weaponSystem;
        this.spaceship = spaceship;
    }

    /**
     * Create weapon system display
     * @param parent Parent container
     * @param styles Styles object
     */
    createWeaponDisplay(parent: HTMLElement, styles: typeof combatStyles): void {
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
     * @param parent Parent container
     * @param styles Styles object
     */
    createSpecialWeaponsSection(parent: HTMLElement, styles: typeof combatStyles): void {
        const specialContainer = document.createElement('div');
        styles.applySpecialContainerStyles(specialContainer);
        
        // Special weapons header
        const specialHeader = document.createElement('div');
        specialHeader.textContent = 'SPECIAL SYSTEMS';
        styles.applySpecialHeaderStyles(specialHeader);
        specialContainer.appendChild(specialHeader);
        
        // Create special weapon items
        const createSpecialItem = (name: string, id: string, color: string, _icon: string) => {
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
    updateWeaponDisplay(): void {
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
            const weaponType = activeWeapon.type || (activeWeapon.constructor ? activeWeapon.constructor.name : '');
            if (weaponType === 'ParticleCannonComponent') {
                weaponName = 'Particle Cannon';
                weaponColor = '#00ffff';
                energy = this.spaceship.energy || 100;
                maxEnergy = this.spaceship.maxEnergy || 100;
            } else if (weaponType === 'MissileComponent') {
                weaponName = `Missiles (${activeWeapon.ammo}/${activeWeapon.maxAmmo})`;
                weaponColor = '#ff5500';
                energy = this.spaceship.energy || 100;
                maxEnergy = this.spaceship.maxEnergy || 100;
            } else if (weaponType === 'TurretComponent') {
                weaponName = `Laser Turrets ${activeWeapon.isActive ? '(ACTIVE)' : '(INACTIVE)'}`;
                weaponColor = '#ff00aa';
                energy = this.spaceship.energy || 100;
                maxEnergy = this.spaceship.maxEnergy || 100;
            } else if (weaponType === 'EMPComponent') {
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
        
        // Update weapon mode display (dynamic color per weapon type)
        weaponMode.textContent = weaponName;
        weaponMode.style.color = weaponColor;
        
        // Update energy bar (dynamic width and color)
        const energyPercent = (energy / maxEnergy) * 100;
        weaponEnergyBar.style.width = `${energyPercent}%`;
        energyValue.textContent = `${Math.round(energy)}/${Math.round(maxEnergy)}`;
        weaponEnergyBar.style.backgroundColor = weaponColor;
    }

    /**
     * Update special weapons status
     */
    updateSpecialWeaponsStatus(): void {
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
     * @param id Component ID
     * @param component Weapon component
     */
    updateSpecialWeaponStatus(id: string, component: WeaponComponent | null): void {
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
                isActive = (component.shield || 0) > 0;
                isReady = component.getShieldPercentage ? component.getShieldPercentage() > 0 : true;
                cooldownProgress = component.getShieldPercentage ? component.getShieldPercentage() / 100 : 1;
            } else if (id === 'emp') {
                isActive = false; // EMP is momentary, not a toggle
                isReady = component.isReady || false;
                cooldownProgress = component.getCooldownProgress ? component.getCooldownProgress() : 1;
            } else if (id === 'turret') {
                isActive = component.isActive || false;
                isReady = true; // Turrets are always ready, just toggled on/off
                cooldownProgress = 1;
            } else if (id === 'missile') {
                isActive = component.lockingOn || false;
                isReady = (component.timeSinceLastShot || 0) >= (component.cooldown || 0);
                cooldownProgress = component.cooldown ? (component.timeSinceLastShot || 0) / component.cooldown : 1;
                
                // Special case for missiles - show ammo count
                if (cooldownText) {
                    if ((component.ammo || 0) <= 0) {
                        cooldownText.textContent = 'NO AMMO';
                        setModifierClass(cooldownText, 'combat-cooldown--', 'no-ammo');
                    } else if (!isReady) {
                        cooldownText.textContent = 'LOADING';
                        setModifierClass(cooldownText, 'combat-cooldown--', 'charging');
                    } else {
                        cooldownText.textContent = `${component.ammo}/${component.maxAmmo}`;
                        setModifierClass(cooldownText, 'combat-cooldown--', 'ready');
                    }
                    
                    // Skip rest of function as we've already set the text
                    return;
                }
            }
        }
        
        // Update status indicator
        if (isActive) {
            // Active - use dynamic color per weapon type (can't be a static class)
            const activeColor = this.getColorForSpecialWeapon(id);
            statusIndicator.style.backgroundColor = activeColor;
            statusIndicator.style.boxShadow = `0 0 5px ${activeColor}`;
            statusIndicator.classList.remove('combat-status-indicator--ready', 'combat-status-indicator--cooldown');
        } else if (isReady) {
            // Ready but not active
            statusIndicator.classList.remove('combat-status-indicator--cooldown');
            statusIndicator.classList.add('combat-status-indicator--ready');
            statusIndicator.style.backgroundColor = '';
            statusIndicator.style.boxShadow = '';
        } else {
            // Cooling down
            statusIndicator.classList.remove('combat-status-indicator--ready');
            statusIndicator.classList.add('combat-status-indicator--cooldown');
            statusIndicator.style.backgroundColor = '';
            statusIndicator.style.boxShadow = '';
        }
        
        // Update cooldown text
        if (cooldownProgress >= 1) {
            cooldownText.textContent = 'READY';
            setModifierClass(cooldownText, 'combat-cooldown--', 'ready');
        } else {
            // Show percentage
            const percent = Math.floor(cooldownProgress * 100);
            cooldownText.textContent = `${percent}%`;
            setModifierClass(cooldownText, 'combat-cooldown--', 'charging');
        }
    }

    /**
     * Get color for special weapon type
     * @param type Weapon type
     * @returns Color hex string
     */
    getColorForSpecialWeapon(type: string): string {
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
     * @returns Weapon information
     */
    getWeaponInfo(): any {
        if (!this.weaponSystem) return null;
        
        const activeWeapon = this.weaponSystem.getActiveWeapon ? 
                          this.weaponSystem.getActiveWeapon() : null;
        
        if (!activeWeapon) return null;
        
        return {
            name: activeWeapon.type || (activeWeapon.constructor ? activeWeapon.constructor.name : 'Unknown'),
            component: activeWeapon,
            energy: this.spaceship?.energy || 100,
            maxEnergy: this.spaceship?.maxEnergy || 100
        };
    }

    /**
     * Check if weapon is ready to fire
     * @param weaponType Type of weapon to check
     * @returns True if weapon is ready
     */
    isWeaponReady(weaponType: string): boolean {
        const component = this.spaceship?.getComponent ? 
                         this.spaceship.getComponent(`${weaponType}Component`) : null;
        
        if (!component) return false;
        
        if (weaponType === 'missile') {
            return (component.ammo || 0) > 0 && (component.timeSinceLastShot || 0) >= (component.cooldown || 0);
        } else if (weaponType === 'emp') {
            return component.isReady || false;
        }
        
        return true;
    }
}
