// resourceExtraction.js - Handles resource extraction and notification

export class ResourceExtraction {
    constructor() {
        this.resources = {
            iron: 0,
            gold: 0,
            platinum: 0
        };
    }

    /**
     * Add all resources from the mined asteroid to the player's inventory at once
     */
    addAsteroidResources(targetAsteroid, efficiency = 1.0) {
        if (!targetAsteroid) return false;
        
        // Get the resource type from the asteroid
        const resourceType = targetAsteroid.resourceType || 'iron'; // Default to iron if no type specified
        
        // Get mining efficiency for resource extraction bonus
        const bonusChance = (efficiency - 1.0) * 0.5; // Chance for bonus resources based on efficiency
        
        // Calculate base amount based on asteroid type
        let amount = 0;
        switch (resourceType.toLowerCase()) {
            case 'iron':
                amount = Math.floor(Math.random() * 5) + 10; // 10-14 iron
                break;
            case 'gold':
                amount = Math.floor(Math.random() * 3) + 5; // 5-7 gold
                break;
            case 'platinum':
                amount = Math.floor(Math.random() * 2) + 2; // 2-3 platinum
                break;
            default:
                amount = 10; // Default to 10 iron
        }
        
        // Apply bonus resources based on mining efficiency
        if (efficiency > 1.0 && Math.random() < bonusChance) {
            amount = Math.ceil(amount * 1.2); // 20% bonus
        }
        
        // Update resource counts
        switch (resourceType.toLowerCase()) {
            case 'iron':
                this.resources.iron += amount;
                break;
            case 'gold':
                this.resources.gold += amount;
                break;
            case 'platinum':
                this.resources.platinum += amount;
                break;
            default:
                this.resources.iron += amount;
        }
        
        console.log(`ResourceExtraction: Added ${amount} ${resourceType} from asteroid`);
        
        // Show resource gain notification
        this.showResourceGainNotification(amount, resourceType);
        
        return true;
    }

    /**
     * Show a notification for resources gained
     */
    showResourceGainNotification(amount, resourceType) {
        // Get color based on resource type
        let color = '#a0a0a0'; // Default gray for iron
        if (resourceType === 'gold') {
            color = '#ffcc00';
        } else if (resourceType === 'platinum') {
            color = '#66ffff';
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = `+${amount} ${resourceType.toUpperCase()}`;
        notification.style.position = 'absolute';
        notification.style.top = '40%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.color = color;
        notification.style.fontSize = '24px';
        notification.style.fontWeight = 'bold';
        notification.style.textShadow = '0 0 8px black';
        notification.style.zIndex = '1000';
        notification.style.opacity = '1';
        notification.style.transition = 'all 1.5s ease-out';
        
        document.body.appendChild(notification);
        
        // Animate the notification
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.top = '30%';
            
            // Remove after animation
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 1500);
        }, 100);
    }

    /**
     * Get current resource counts
     */
    getResources() {
        return { ...this.resources };
    }

    /**
     * Get resource count for specific type
     */
    getResource(type) {
        return this.resources[type.toLowerCase()] || 0;
    }
}