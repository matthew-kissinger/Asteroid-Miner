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
                <div class="starmap-empty-selection">
                    No system selected.<br>${isMobile ? 'Tap' : 'Click'} on a star system in the map to select it.
                </div>
            `;
            return;
        }

        selectedCard.innerHTML = `
            <div id="selected-system-name" class="starmap-system-name ${isMobile ? 'starmap-system-name-mobile' : ''}">${system.name}</div>
            <div id="selected-system-class" class="starmap-system-class ${isMobile ? 'starmap-system-class-mobile' : ''}">Class ${system.starClass} - ${system.classification}</div>
            <div id="selected-system-resources" class="starmap-resources">
                <div class="starmap-resource-row">
                    <span>Iron:</span>
                    <div class="starmap-resource-indicator">
                        <div class="starmap-resource-bar starmap-resource-bar-iron" style="width: ${system.resourceMultipliers.iron * 50}%;"></div>
                    </div>
                </div>
                <div class="starmap-resource-row">
                    <span>Gold:</span>
                    <div class="starmap-resource-indicator">
                        <div class="starmap-resource-bar starmap-resource-bar-gold" style="width: ${system.resourceMultipliers.gold * 50}%;"></div>
                    </div>
                </div>
                <div class="starmap-resource-row">
                    <span>Platinum:</span>
                    <div class="starmap-resource-indicator">
                        <div class="starmap-resource-bar starmap-resource-bar-platinum" style="width: ${system.resourceMultipliers.platinum * 50}%;"></div>
                    </div>
                </div>
            </div>
            <div class="starmap-system-description ${isMobile ? 'starmap-system-description-mobile' : ''}">
                ${system.description}
            </div>
            <div class="starmap-system-features ${isMobile ? 'starmap-system-features-mobile' : ''}">
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
            travelButton.classList.add('starmap-travel-button-disabled');
            travelButton.textContent = 'TRAVEL TO SYSTEM';
            return;
        }

        travelButton.disabled = isCurrentSystem || !isConnected;
        if (isCurrentSystem || !isConnected) {
            travelButton.classList.add('starmap-travel-button-disabled');
        } else {
            travelButton.classList.remove('starmap-travel-button-disabled');
        }
        
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
