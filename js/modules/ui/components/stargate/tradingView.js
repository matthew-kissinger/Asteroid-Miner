// tradingView.js - Trading interface components and logic

export class TradingView {
    constructor() {
        this.spaceship = null;
        this.resources = null;
    }
    
    setGameReferences(spaceship, resources) {
        this.spaceship = spaceship;
        this.resources = resources;
    }
    
    // Sell an energy orb of the specified rarity
    sellEnergyOrb(rarity) {
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
        if (!this.resources.orbs[rarity] || this.resources.orbs[rarity] <= 0) {
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
        this.resources.orbs[rarity]--;
        this.spaceship.credits += value;
        
        // Show message
        const capitalizedRarity = rarity.charAt(0).toUpperCase() + rarity.slice(1);
        this.showNotification(`Sold ${capitalizedRarity} Energy Orb for ${value} credits`, 0x33aaff);
        
        // Play sound if audio manager is available
        if (window.game && window.game.audio) {
            window.game.audio.playSoundEffect('sell', 0.5);
        }
        
        return true;
    }
    
    /**
     * Purchase a deployable laser turret
     */
    purchaseLaserTurret() {
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
            if (window.mainMessageBus) {
                window.mainMessageBus.publish('ui.notification', {
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
        if (window.game && window.game.audio && window.game.audio.playSound) {
            window.game.audio.playSound('purchase');
        }
        
        // Show notification to the player
        if (window.mainMessageBus) {
            window.mainMessageBus.publish('ui.notification', {
                message: "Laser turret purchased",
                type: "success",
                duration: 2
            });
        }
        
        console.log("Laser turret purchased successfully");
    }
    
    // Helper method to show notifications
    showNotification(message, color = 0x33aaff) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '35%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#fff';
        notification.style.padding = '15px 30px';
        notification.style.borderRadius = '10px';
        notification.style.border = `2px solid #${color.toString(16).padStart(6, '0')}`;
        notification.style.boxShadow = `0 0 15px #${color.toString(16).padStart(6, '0')}`;
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = '16px';
        notification.style.zIndex = '1001'; // Above the stargate UI
        notification.style.textAlign = 'center';
        
        // Set notification text
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.8s';
            
            setTimeout(() => {
                notification.remove();
            }, 800);
        }, 2000);
    }
    
    updateOrbCounts() {
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
        document.getElementById('orb-common-count').textContent = this.resources.orbs.common > 0 ? 
            `${this.resources.orbs.common} in inventory` : "0 in inventory";
        document.getElementById('orb-uncommon-count').textContent = this.resources.orbs.uncommon > 0 ? 
            `${this.resources.orbs.uncommon} in inventory` : "0 in inventory";
        document.getElementById('orb-rare-count').textContent = this.resources.orbs.rare > 0 ? 
            `${this.resources.orbs.rare} in inventory` : "0 in inventory";
        document.getElementById('orb-epic-count').textContent = this.resources.orbs.epic > 0 ? 
            `${this.resources.orbs.epic} in inventory` : "0 in inventory";
        document.getElementById('orb-legendary-count').textContent = this.resources.orbs.legendary > 0 ? 
            `${this.resources.orbs.legendary} in inventory` : "0 in inventory";
    }
    
    updateOrbSellButtons() {
        const updateOrbSellButton = (buttonId, orbCount, borderColor) => {
            const button = document.getElementById(buttonId);
            if (!button) return;
            
            if (orbCount === 0) {
                button.disabled = true;
                button.style.backgroundColor = 'rgba(40, 40, 40, 0.8)';
                button.style.color = '#777';
                button.style.cursor = 'not-allowed';
                button.style.boxShadow = 'none';
            } else {
                button.disabled = false;
                button.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
                button.style.color = '#fff';
                button.style.cursor = 'pointer';
                button.style.boxShadow = `0 0 10px ${borderColor}`;
            }
        };
        
        if (!this.resources.orbs) return;
        
        updateOrbSellButton('sell-orb-common', this.resources.orbs.common, 'rgba(0, 255, 102, 0.3)');
        updateOrbSellButton('sell-orb-uncommon', this.resources.orbs.uncommon, 'rgba(0, 102, 255, 0.3)');
        updateOrbSellButton('sell-orb-rare', this.resources.orbs.rare, 'rgba(153, 0, 255, 0.3)');
        updateOrbSellButton('sell-orb-epic', this.resources.orbs.epic, 'rgba(255, 102, 0, 0.3)');
        updateOrbSellButton('sell-orb-legendary', this.resources.orbs.legendary, 'rgba(255, 0, 0, 0.3)');
    }
    
    updateLaserTurretDisplay() {
        // Update the laser turret count
        const laserCountElement = document.getElementById('current-laser-count');
        if (laserCountElement) {
            laserCountElement.textContent = this.spaceship.deployableLaserCount || 0;
        }
        
        // Update the purchase laser button status
        const purchaseLaserBtn = document.getElementById('purchase-laser');
        if (purchaseLaserBtn) {
            if (this.spaceship.credits < 1000) {
                purchaseLaserBtn.disabled = true;
                purchaseLaserBtn.style.backgroundColor = '#555';
                purchaseLaserBtn.style.cursor = 'not-allowed';
            } else {
                purchaseLaserBtn.disabled = false;
                purchaseLaserBtn.style.backgroundColor = '#FF3333';
                purchaseLaserBtn.style.cursor = 'pointer';
            }
        }
    }
    
    updateResourceSellButtons() {
        // Disable sell buttons if no resources
        document.getElementById('sell-iron').disabled = this.resources.iron === 0;
        document.getElementById('sell-gold').disabled = this.resources.gold === 0;
        document.getElementById('sell-platinum').disabled = this.resources.platinum === 0;
        
        // Update sell button styles based on resource availability
        this.updateSellButtonStatus('sell-iron', this.resources.iron, '#cc6633');
        this.updateSellButtonStatus('sell-gold', this.resources.gold, '#ffcc33');
        this.updateSellButtonStatus('sell-platinum', this.resources.platinum, '#33ccff');
        
        // Update button styles based on disabled state
        document.querySelectorAll('.sell-btn').forEach(btn => {
            if (btn.disabled) {
                btn.style.backgroundColor = 'rgba(40, 40, 40, 0.8)';
                btn.style.color = '#777';
                btn.style.cursor = 'not-allowed';
                btn.style.boxShadow = 'none';
            }
        });
    }
    
    // Update sell button styles based on available resources
    updateSellButtonStatus(buttonId, resourceAmount, borderColor) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (resourceAmount === 0) {
            button.disabled = true;
            button.style.backgroundColor = 'rgba(40, 40, 40, 0.8)';
            button.style.borderColor = '#555';
            button.style.color = '#777';
            button.style.boxShadow = 'none';
            button.style.cursor = 'not-allowed';
        } else {
            button.disabled = false;
            button.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
            button.style.borderColor = borderColor;
            button.style.color = '#fff';
            button.style.boxShadow = `0 0 10px rgba(${parseInt(borderColor.slice(1, 3), 16)}, ${parseInt(borderColor.slice(3, 5), 16)}, ${parseInt(borderColor.slice(5, 7), 16)}, 0.3)`;
            button.style.cursor = 'pointer';
        }
    }
}