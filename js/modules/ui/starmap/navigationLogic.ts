// navigationLogic.ts - Handles star map navigation and travel logic

interface StarSystem {
    name: string;
    starClass: string;
    classification: string;
    resourceMultipliers: {
        iron: number;
        gold: number;
        platinum: number;
    };
    description: string;
    specialFeatures: string[];
}

interface StarSystemGenerator {
    getAllSystems(): Record<string, StarSystem>;
    currentSystem: string;
    getCurrentSystemConnections(): string[];
    travelToSystem(systemId: string): boolean;
    getCurrentSystemData(): StarSystem | null;
}

interface DockingSystem {
    // Docking system interface
}

interface StargateInterface {
    // Stargate interface
}

interface Environment {
    travelToSystem(systemId: string): boolean;
}

export class NavigationLogic {
    private starSystemGenerator: StarSystemGenerator;
    private selectedSystem: string | null;
    private isTraveling: boolean;

    constructor(starSystemGenerator: StarSystemGenerator, _dockingSystem: DockingSystem, _stargateInterface: StargateInterface) {
        this.starSystemGenerator = starSystemGenerator;
        this.selectedSystem = null;
        this.isTraveling = false;
    }

    // Select a system and update the UI
    selectSystem(
        systemId: string | null, 
        isMobile: boolean, 
        updateSelectedSystemCallback: (system: StarSystem | null, isMobile: boolean) => void, 
        updateTravelButtonCallback: (systemId: string | null, isCurrentSystem: boolean, isConnected: boolean) => void
    ): void {
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
    handleTravel(hideCallback: () => void): void {
        if (this.selectedSystem && this.selectedSystem !== this.starSystemGenerator.currentSystem) {
            console.log(`Initiating travel to system: ${this.selectedSystem}`);
            
            // Set traveling flag before hiding the star map
            this.isTraveling = true;
            
            // Close the star map first
            hideCallback();
            
            // Find the environment object to properly handle transition
            const environment = (window.game as any).environment as Environment;
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
                    this.selectSystem(null, false, () => {}, () => {});
                    
                    // Notify the user
                    const currentSystemData = this.starSystemGenerator.getCurrentSystemData();
                    if (currentSystemData) {
                        this.showTravelNotification(currentSystemData.name, false);
                    }
                    
                    // Reset traveling flag
                    this.isTraveling = false;
                }
            }
        }
    }

    // Show travel notification
    showTravelNotification(systemName: string, isMobile: boolean): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.classList.add('starmap-notification');
        if (isMobile) {
            notification.classList.add('starmap-notification-mobile');
        }
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

    getSelectedSystem(): string | null {
        return this.selectedSystem;
    }

    isTravelingToSystem(): boolean {
        return this.isTraveling;
    }
}
