// navigationLogic.js - Handles star map navigation and travel logic

export class NavigationLogic {
    constructor(starSystemGenerator, dockingSystem, stargateInterface) {
        this.starSystemGenerator = starSystemGenerator;
        this.dockingSystem = dockingSystem;
        this.stargateInterface = stargateInterface;
        this.selectedSystem = null;
        this.isTraveling = false;
    }

    // Select a system and update the UI
    selectSystem(systemId, isMobile, updateSelectedSystemCallback, updateTravelButtonCallback) {
        console.log(`Selecting system: ${systemId}`);
        this.selectedSystem = systemId;
        
        if (!systemId) {
            // Clear selection
            updateSelectedSystemCallback(null, isMobile);
            updateTravelButtonCallback(null, false, false);
            return;
        }
        
        // Get system data
        const system = this.starSystemGenerator.getAllSystems()[systemId];
        const currentSystem = this.starSystemGenerator.currentSystem;
        
        // Update selected system info card
        updateSelectedSystemCallback(system, isMobile);
        
        // Enable/disable travel button
        const isConnected = this.starSystemGenerator.getCurrentSystemConnections().includes(systemId);
        const isCurrentSystem = systemId === currentSystem;
        
        updateTravelButtonCallback(systemId, isCurrentSystem, isConnected);
    }

    // Handle travel to selected system
    handleTravel(hideCallback) {
        if (this.selectedSystem && this.selectedSystem !== this.starSystemGenerator.currentSystem) {
            console.log(`Initiating travel to system: ${this.selectedSystem}`);
            
            // Set traveling flag before hiding the star map
            this.isTraveling = true;
            
            // Close the star map first
            hideCallback();
            
            // Find the environment object to properly handle transition
            const environment = window.game.environment;
            if (environment && environment.travelToSystem) {
                const success = environment.travelToSystem(this.selectedSystem);
                console.log(`Travel to ${this.selectedSystem} initiated: ${success}`);
                
                // Reset traveling flag after travel is complete
                setTimeout(() => {
                    this.isTraveling = false;
                }, 5000); // Wait for transition to complete
            } else {
                // Fallback to direct use of starSystemGenerator
                const success = this.starSystemGenerator.travelToSystem(this.selectedSystem);
                
                if (success) {
                    // Reset selection
                    this.selectSystem(null);
                    
                    // Notify the user
                    this.showTravelNotification(this.starSystemGenerator.getCurrentSystemData().name);
                    
                    // Reset traveling flag
                    this.isTraveling = false;
                }
            }
        }
    }

    // Show travel notification
    showTravelNotification(systemName, isMobile) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = isMobile ? '30%' : '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#30cfd0';
        notification.style.padding = isMobile ? '15px 30px' : '20px 40px';
        notification.style.borderRadius = '10px';
        notification.style.border = '2px solid #30cfd0';
        notification.style.boxShadow = '0 0 30px #30cfd0';
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = isMobile ? '18px' : '20px';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '9999';
        notification.style.textAlign = 'center';
        notification.textContent = `ARRIVED AT ${systemName}`;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 1s';
            
            setTimeout(() => {
                notification.remove();
            }, 1000);
        }, 3000);
    }

    getSelectedSystem() {
        return this.selectedSystem;
    }

    isTravelingToSystem() {
        return this.isTraveling;
    }
}