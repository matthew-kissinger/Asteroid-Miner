// helpers.js - Utility functions and common operations

export class StargateHelpers {
    static updateResourceDisplays(resources) {
        // Update resource display with visual elements
        document.getElementById('ms-iron').textContent = resources.iron;
        document.getElementById('ms-gold').textContent = resources.gold;
        document.getElementById('ms-platinum').textContent = resources.platinum;
    }
    
    static updateCreditsDisplay(spaceship) {
        // Update credits with styling
        document.getElementById('ms-credits').textContent = `${spaceship.credits} CR`;
    }
    
    static updateStatusGauges(spaceship) {
        // Update fuel gauge
        document.getElementById('fuel-gauge').style.width = `${(spaceship.fuel / spaceship.maxFuel) * 100}%`;
        document.getElementById('fuel-level').textContent = Math.round((spaceship.fuel / spaceship.maxFuel) * 100);
        
        // Update shield gauge
        document.getElementById('shield-gauge').style.width = `${(spaceship.shield / spaceship.maxShield) * 100}%`;
        document.getElementById('shield-level').textContent = Math.round((spaceship.shield / spaceship.maxShield) * 100);
        
        // Update hull gauge
        document.getElementById('hull-gauge').style.width = `${(spaceship.hull / spaceship.maxHull) * 100}%`;
        document.getElementById('hull-level').textContent = Math.round((spaceship.hull / spaceship.maxHull) * 100);
    }
    
    static updateServiceButtons(spaceship) {
        // Disable refuel button if not enough credits or fuel is full
        const refuelBtn = document.getElementById('refuel-btn');
        if (spaceship.credits < 100 || spaceship.fuel >= spaceship.maxFuel * 0.999) {
            refuelBtn.disabled = true;
            refuelBtn.style.backgroundColor = '#555';
            refuelBtn.style.cursor = 'not-allowed';
        } else {
            refuelBtn.disabled = false;
            refuelBtn.style.backgroundColor = '#00cc33';
            refuelBtn.style.cursor = 'pointer';
        }
        
        // Disable shield repair button if not enough credits or shield is full
        const repairShieldBtn = document.getElementById('repair-shield-btn');
        if (spaceship.credits < 150 || spaceship.shield >= spaceship.maxShield * 0.999) {
            repairShieldBtn.disabled = true;
            repairShieldBtn.style.backgroundColor = '#555';
            repairShieldBtn.style.cursor = 'not-allowed';
        } else {
            repairShieldBtn.disabled = false;
            repairShieldBtn.style.backgroundColor = '#3399ff';
            repairShieldBtn.style.cursor = 'pointer';
        }
        
        // Disable hull repair button if not enough credits or hull is full
        const repairHullBtn = document.getElementById('repair-hull-btn');
        if (spaceship.credits < 200 || spaceship.hull >= spaceship.maxHull * 0.999) {
            repairHullBtn.disabled = true;
            repairHullBtn.style.backgroundColor = '#555';
            repairHullBtn.style.cursor = 'not-allowed';
        } else {
            repairHullBtn.disabled = false;
            repairHullBtn.style.backgroundColor = '#ff9900';
            repairHullBtn.style.cursor = 'pointer';
        }
    }
    
    static configureMobileUI(stargateUI, isMobile) {
        if (!isMobile) return;
        
        // Ensure proper mobile styling
        stargateUI.style.width = '92%';
        stargateUI.style.maxWidth = '92vw';
        stargateUI.style.maxHeight = '85vh';
        stargateUI.style.webkitOverflowScrolling = 'touch';
        stargateUI.style.touchAction = 'pan-y';
        stargateUI.style.overscrollBehavior = 'auto';
        
        // Ensure proper positioning
        stargateUI.style.position = 'absolute';
        stargateUI.style.top = '50%';
        stargateUI.style.left = '50%';
        stargateUI.style.transform = 'translate(-50%, -50%)';
        stargateUI.style.zIndex = '1000';
        
        // Ensure body is in a state that allows the UI to be visible
        document.body.classList.remove('undocking', 'modal-open');
    }
    
    static syncWithGameResources() {
        // Sync resources with game if available (similar to BlackjackGame)
        if (window.game && window.game.controls) {
            // Get reference to spaceship and resources
            const spaceship = window.game.spaceship;
            const resources = window.game.controls.resources;
            
            // Return references for use by caller
            if (spaceship && resources) {
                console.log("Syncing stargate UI with game resources:", resources);
                return { spaceship, resources };
            }
        }
        return null;
    }
}