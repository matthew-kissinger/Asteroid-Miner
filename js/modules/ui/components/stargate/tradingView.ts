// tradingView.ts - Trading interface components and logic

import { mainMessageBus } from '../../../../globals/messageBus.ts';

interface Resources {
    iron: number;
    gold: number;
    platinum: number;
    orbs?: {
        common: number;
        uncommon: number;
        rare: number;
        epic: number;
        legendary: number;
    };
}

interface Spaceship {
    credits: number;
    deployableLaserCount?: number;
}

export class TradingView {
    private spaceship: Spaceship | null;
    private resources: Resources | null;
    private audio: { playSound?: (sound: string) => void; playSoundEffect?: (sound: string, volume: number) => void } | null;
    
    constructor() {
        this.spaceship = null;
        this.resources = null;
        this.audio = null;
    }
    
    setGameReferences(spaceship: Spaceship, resources: Resources): void {
        this.spaceship = spaceship;
        this.resources = resources;
    }
    
    setAudio(audio: { playSound?: (sound: string) => void; playSoundEffect?: (sound: string, volume: number) => void }): void {
        this.audio = audio;
    }
    
    // Sell an energy orb of the specified rarity
    sellEnergyOrb(rarity: string): boolean {
        // Make sure we have spaceship and resources references
        if (!this.spaceship || !this.resources) {
            console.error("Required game objects not available");
            return false;
        }
        
        // Check if orbs property exists, initialize if needed
        if (!this.resources.orbs) {
            this.resources.orbs = {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };
            return false; // No orbs available yet
        }
        
        // Check if player has any orbs of the specified rarity
        if (!this.resources.orbs[rarity as keyof typeof this.resources.orbs] || this.resources.orbs[rarity as keyof typeof this.resources.orbs]! <= 0) {
            console.log(`No ${rarity} orbs available to sell`);
            return false;
        }
        
        // Calculate value based on rarity
        let value = 0;
        switch (rarity) {
            case 'common':
                value = 100;
                break;
            case 'uncommon':
                value = 500;
                break;
            case 'rare':
                value = 1500;
                break;
            case 'epic':
                value = 5000;
                break;
            case 'legendary':
                value = 15000;
                break;
            default:
                console.error(`Unknown orb rarity: ${rarity}`);
                return false;
        }
        
        // Sell the orb - update inventory and credits
        const orbCount = this.resources.orbs[rarity as keyof typeof this.resources.orbs]!;
        this.resources.orbs[rarity as keyof typeof this.resources.orbs] = orbCount - 1;
        this.spaceship.credits += value;
        
        // Show message
        const capitalizedRarity = rarity.charAt(0).toUpperCase() + rarity.slice(1);
        this.showNotification(`Sold ${capitalizedRarity} Energy Orb for ${value} credits`, 0x33aaff);
        
        // Play sound if audio manager is available
        if (this.audio?.playSoundEffect) {
            this.audio.playSoundEffect('sell', 0.5);
        }
        
        return true;
    }
    
    /**
     * Purchase a deployable laser turret
     */
    purchaseLaserTurret(): void {
        console.log("Attempting to purchase laser turret");
        
        // Check if spaceship is available
        if (!this.spaceship) {
            console.error("Cannot purchase laser turret: spaceship not found");
            return;
        }
        
        // Check if player has enough credits
        if (this.spaceship.credits < 1000) {
            console.log("Not enough credits to purchase laser turret");
            // Show notification to the player
            if (mainMessageBus) {
                (mainMessageBus as any).publish('ui.notification', {
                    message: "Not enough credits to purchase laser turret",
                    type: "error",
                    duration: 2
                });
            }
            return;
        }
        
        // Purchase the laser turret
        this.spaceship.credits -= 1000;
        
        // Initialize deployableLaserCount if it doesn't exist
        if (typeof this.spaceship.deployableLaserCount === 'undefined') {
            this.spaceship.deployableLaserCount = 0;
        }
        
        // Add a laser turret to the player's inventory
        this.spaceship.deployableLaserCount++;
        
        // Play purchase sound
        if (this.audio?.playSound) {
            this.audio.playSound('purchase');
        }
        
        // Show notification to the player
        if (mainMessageBus) {
            (mainMessageBus as any).publish('ui.notification', {
                message: "Laser turret purchased",
                type: "success",
                duration: 2
            });
        }
        
        console.log("Laser turret purchased successfully");
    }
    
    // Helper method to show notifications
    showNotification(message: string, color = 0x33aaff): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'trading-notification';
        notification.style.border = `2px solid #${color.toString(16).padStart(6, '0')}`;
        notification.style.boxShadow = `0 0 15px #${color.toString(16).padStart(6, '0')}`;
        
        // Set notification text
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            
            setTimeout(() => {
                notification.remove();
            }, 800);
        }, 2000);
    }
    
    updateOrbCounts(): void {
        if (!this.resources) return;
        
        if (!this.resources.orbs) {
            this.resources.orbs = {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };
        }
        
        // Update orb counts
        const commonCount = document.getElementById('orb-common-count');
        const uncommonCount = document.getElementById('orb-uncommon-count');
        const rareCount = document.getElementById('orb-rare-count');
        const epicCount = document.getElementById('orb-epic-count');
        const legendaryCount = document.getElementById('orb-legendary-count');
        
        if (commonCount) {
            commonCount.textContent = this.resources.orbs.common > 0 ? 
                `${this.resources.orbs.common} in inventory` : "0 in inventory";
        }
        if (uncommonCount) {
            uncommonCount.textContent = this.resources.orbs.uncommon > 0 ? 
                `${this.resources.orbs.uncommon} in inventory` : "0 in inventory";
        }
        if (rareCount) {
            rareCount.textContent = this.resources.orbs.rare > 0 ? 
                `${this.resources.orbs.rare} in inventory` : "0 in inventory";
        }
        if (epicCount) {
            epicCount.textContent = this.resources.orbs.epic > 0 ? 
                `${this.resources.orbs.epic} in inventory` : "0 in inventory";
        }
        if (legendaryCount) {
            legendaryCount.textContent = this.resources.orbs.legendary > 0 ? 
                `${this.resources.orbs.legendary} in inventory` : "0 in inventory";
        }
    }
    
    updateOrbSellButtons(): void {
        if (!this.resources || !this.resources.orbs) return;
        
        const updateOrbSellButton = (buttonId: string, orbCount: number, borderColor: string): void => {
            const button = document.getElementById(buttonId) as HTMLButtonElement;
            if (!button) return;
            
            if (orbCount === 0) {
                button.disabled = true;
                button.className = 'orb-sell-btn-disabled';
            } else {
                button.disabled = false;
                button.className = 'orb-sell-btn-enabled';
                button.style.boxShadow = `0 0 10px ${borderColor}`;
            }
        };
        
        updateOrbSellButton('sell-orb-common', this.resources.orbs.common, 'rgba(0, 255, 102, 0.3)');
        updateOrbSellButton('sell-orb-uncommon', this.resources.orbs.uncommon, 'rgba(0, 102, 255, 0.3)');
        updateOrbSellButton('sell-orb-rare', this.resources.orbs.rare, 'rgba(153, 0, 255, 0.3)');
        updateOrbSellButton('sell-orb-epic', this.resources.orbs.epic, 'rgba(255, 102, 0, 0.3)');
        updateOrbSellButton('sell-orb-legendary', this.resources.orbs.legendary, 'rgba(255, 0, 0, 0.3)');
    }
    
    updateLaserTurretDisplay(): void {
        if (!this.spaceship) return;
        
        // Update the laser turret count
        const laserCountElement = document.getElementById('current-laser-count');
        if (laserCountElement) {
            laserCountElement.textContent = String(this.spaceship.deployableLaserCount || 0);
        }
        
        // Update the purchase laser button status
        const purchaseLaserBtn = document.getElementById('purchase-laser') as HTMLButtonElement;
        if (purchaseLaserBtn) {
            if (this.spaceship.credits < 1000) {
                purchaseLaserBtn.disabled = true;
                purchaseLaserBtn.className = 'laser-purchase-btn-disabled';
            } else {
                purchaseLaserBtn.disabled = false;
                purchaseLaserBtn.className = 'laser-purchase-btn-enabled';
            }
        }
    }
    
    updateResourceSellButtons(): void {
        if (!this.resources) return;
        
        // Disable sell buttons if no resources
        const sellIron = document.getElementById('sell-iron') as HTMLButtonElement;
        const sellGold = document.getElementById('sell-gold') as HTMLButtonElement;
        const sellPlatinum = document.getElementById('sell-platinum') as HTMLButtonElement;
        
        if (sellIron) sellIron.disabled = this.resources.iron === 0;
        if (sellGold) sellGold.disabled = this.resources.gold === 0;
        if (sellPlatinum) sellPlatinum.disabled = this.resources.platinum === 0;
        
        // Update sell button styles based on resource availability
        this.updateSellButtonStatus('sell-iron', this.resources.iron, '#cc6633');
        this.updateSellButtonStatus('sell-gold', this.resources.gold, '#ffcc33');
        this.updateSellButtonStatus('sell-platinum', this.resources.platinum, '#33ccff');
        
        // Update button styles based on disabled state
        document.querySelectorAll('.sell-btn').forEach(btn => {
            const button = btn as HTMLButtonElement;
            if (button.disabled) {
                button.className = 'sell-btn sell-btn-disabled';
            }
        });
    }
    
    // Update sell button styles based on available resources
    updateSellButtonStatus(buttonId: string, resourceAmount: number, borderColor: string): void {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (!button) return;
        
        if (resourceAmount === 0) {
            button.disabled = true;
            button.className = 'sell-btn sell-btn-disabled';
            button.style.borderColor = '#555';
        } else {
            button.disabled = false;
            button.className = 'sell-btn sell-btn-enabled';
            button.style.borderColor = borderColor;
            const r = parseInt(borderColor.slice(1, 3), 16);
            const g = parseInt(borderColor.slice(3, 5), 16);
            const b = parseInt(borderColor.slice(5, 7), 16);
            button.style.boxShadow = `0 0 10px rgba(${r}, ${g}, ${b}, 0.3)`;
        }
    }
}
