// dataManager.ts - Handles star map data management and system information

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
    getCurrentSystemData(): StarSystem | null;
    getAllSystems(): Record<string, StarSystem>;
    currentSystem: string;
}

export class DataManager {
    private starSystemGenerator: StarSystemGenerator;

    constructor(starSystemGenerator: StarSystemGenerator) {
        this.starSystemGenerator = starSystemGenerator;
    }

    // Update the current system information
    updateCurrentSystemInfo(_isMobile: boolean): void {
        const system = this.starSystemGenerator.getCurrentSystemData();
        if (!system) return;
        
        // Update system name and class
        const systemNameEl = document.getElementById('current-system-name');
        const systemClassEl = document.getElementById('current-system-class');
        if (systemNameEl) systemNameEl.textContent = system.name;
        if (systemClassEl) {
            systemClassEl.textContent = `Class ${system.starClass} - ${system.classification}`;
        }
        
        // Update resource indicators
        const ironIndicator = document.getElementById('current-iron-indicator');
        const goldIndicator = document.getElementById('current-gold-indicator');
        const platinumIndicator = document.getElementById('current-platinum-indicator');
        
        if (ironIndicator) {
            ironIndicator.style.width = `${system.resourceMultipliers.iron * 50}%`;
        }
        if (goldIndicator) {
            goldIndicator.style.width = `${system.resourceMultipliers.gold * 50}%`;
        }
        if (platinumIndicator) {
            platinumIndicator.style.width = `${system.resourceMultipliers.platinum * 50}%`;
        }
        
        // Update description and features
        const descriptionEl = document.getElementById('current-system-description');
        const featuresEl = document.getElementById('current-system-features');
        if (descriptionEl) descriptionEl.textContent = system.description;
        if (featuresEl) {
            featuresEl.textContent = `Special Features: ${system.specialFeatures.join(', ')}`;
        }
    }

    // Update selected system info card
    updateSelectedSystemInfo(system: StarSystem | null, isMobile: boolean): void {
        const selectedCard = document.getElementById('selected-system-card');
        if (!selectedCard) return;

        if (!system) {
            // Clear selection
            selectedCard.innerHTML = `
                <div class="empty-selection" style="color: #777; text-align: center; padding: 20px;">
                    No system selected.<br>${isMobile ? 'Tap' : 'Click'} on a star system in the map to select it.
                </div>
            `;
            return;
        }

        selectedCard.innerHTML = `
            <div id="selected-system-name" style="font-size: ${isMobile ? '16px' : '18px'}; font-weight: bold; color: #fff; margin-bottom: 5px;">${system.name}</div>
            <div id="selected-system-class" style="font-size: ${isMobile ? '12px' : '14px'}; color: #aaa; margin-bottom: 10px;">Class ${system.starClass} - ${system.classification}</div>
            <div id="selected-system-resources" style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Iron:</span>
                    <div class="resource-indicator" style="width: 100px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${system.resourceMultipliers.iron * 50}%; background: #aaa;"></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Gold:</span>
                    <div class="resource-indicator" style="width: 100px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${system.resourceMultipliers.gold * 50}%; background: #FFD700;"></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Platinum:</span>
                    <div class="resource-indicator" style="width: 100px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${system.resourceMultipliers.platinum * 50}%; background: #E5E4E2;"></div>
                    </div>
                </div>
            </div>
            <div style="font-size: ${isMobile ? '11px' : '12px'}; color: #ccc; margin-bottom: 10px;">
                ${system.description}
            </div>
            <div style="font-size: ${isMobile ? '11px' : '12px'}; color: #30cfd0;">
                Special Features: ${system.specialFeatures.join(', ')}
            </div>
        `;
        
        // Scroll to make selected system info visible on mobile
        if (isMobile) {
            const infoPanel = document.getElementById('system-info-panel');
            if (infoPanel && selectedCard) {
                infoPanel.scrollTop = selectedCard.offsetTop - infoPanel.offsetTop;
            }
        }
    }

    // Update travel button state
    updateTravelButton(systemId: string | null, isCurrentSystem: boolean, isConnected: boolean): void {
        const travelButton = document.getElementById('travel-button') as HTMLButtonElement;
        if (!travelButton) return;

        if (!systemId) {
            // No system selected
            travelButton.disabled = true;
            travelButton.style.cursor = 'not-allowed';
            travelButton.style.opacity = '0.5';
            travelButton.textContent = 'TRAVEL TO SYSTEM';
            return;
        }

        travelButton.disabled = isCurrentSystem || !isConnected;
        travelButton.style.cursor = isCurrentSystem || !isConnected ? 'not-allowed' : 'pointer';
        travelButton.style.opacity = isCurrentSystem || !isConnected ? '0.5' : '1';
        
        // Update button text
        travelButton.textContent = isCurrentSystem ? 'CURRENT LOCATION' : 
                                  !isConnected ? 'NO DIRECT ROUTE' : 'TRAVEL TO SYSTEM';
    }

    getCurrentSystemData(): StarSystem | null {
        return this.starSystemGenerator.getCurrentSystemData();
    }

    getAllSystems(): Record<string, StarSystem> {
        return this.starSystemGenerator.getAllSystems();
    }

    getCurrentSystem(): string {
        return this.starSystemGenerator.currentSystem;
    }
}
