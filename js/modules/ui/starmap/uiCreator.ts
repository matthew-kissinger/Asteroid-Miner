// uiCreator.ts - Handles star map UI creation and setup

export class UICreator {
    private isMobile: boolean;

    constructor(isMobile: boolean) {
        this.isMobile = isMobile;
    }

    // Create star map UI
    setupStarMapUI(): void {
        // Create starmap container
        const starMap = document.createElement('div');
        starMap.id = 'star-map';
        starMap.classList.add('starmap-container');
        
        // Adjust size for mobile devices
        if (this.isMobile) {
            starMap.classList.add('starmap-container-mobile');
        }
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'STAR MAP';
        title.classList.add('starmap-title');
        if (this.isMobile) {
            title.classList.add('starmap-title-mobile');
        }
        starMap.appendChild(title);
        
        // Create map content container with flexible layout
        const content = document.createElement('div');
        content.classList.add('starmap-content');
        if (this.isMobile) {
            content.classList.add('starmap-content-mobile');
        }
        
        // Left column - System Map (stars and connections)
        const mapContainer = this.createMapContainer();
        
        // Right column - System Information
        const infoPanel = this.createInfoPanel();
        
        // Add all elements to the map
        content.appendChild(mapContainer);
        content.appendChild(infoPanel);
        starMap.appendChild(content);
        
        // Close button
        const closeButton = this.createCloseButton();
        starMap.appendChild(closeButton);
        
        // Add to DOM
        document.body.appendChild(starMap);
    }

    createMapContainer(): HTMLElement {
        const mapContainer = document.createElement('div');
        mapContainer.id = 'star-map-visual';
        mapContainer.classList.add('starmap-visual');
        if (this.isMobile) {
            mapContainer.classList.add('starmap-visual-mobile');
        }
        
        // Create canvas for map visualization
        const canvas = document.createElement('canvas');
        canvas.id = 'star-map-canvas';
        canvas.width = 500;
        canvas.height = 500;
        canvas.classList.add('starmap-canvas');
        mapContainer.appendChild(canvas);
        
        return mapContainer;
    }

    createInfoPanel(): HTMLElement {
        const infoPanel = document.createElement('div');
        infoPanel.id = 'system-info-panel';
        infoPanel.classList.add('starmap-info-panel');
        if (this.isMobile) {
            infoPanel.classList.add('starmap-info-panel-mobile');
        }
        
        // Current system section
        const currentSystem = this.createCurrentSystemSection();
        infoPanel.appendChild(currentSystem);
        
        // Selected system section
        const selectedSystem = this.createSelectedSystemSection();
        infoPanel.appendChild(selectedSystem);
        
        return infoPanel;
    }

    createCurrentSystemSection(): HTMLElement {
        const currentSystem = document.createElement('div');
        currentSystem.id = 'current-system-info';
        
        currentSystem.innerHTML = `
            <h3 class="starmap-section-title ${this.isMobile ? 'starmap-section-title-mobile' : ''}">CURRENT SYSTEM</h3>
            <div class="starmap-system-card">
                <div id="current-system-name" class="starmap-system-name ${this.isMobile ? 'starmap-system-name-mobile' : ''}">Solar System</div>
                <div id="current-system-class" class="starmap-system-class ${this.isMobile ? 'starmap-system-class-mobile' : ''}">Class G - Home System</div>
                <div id="current-system-resources" class="starmap-resources">
                    <div class="starmap-resource-row">
                        <span>Iron:</span>
                        <div class="starmap-resource-indicator">
                            <div id="current-iron-indicator" class="starmap-resource-bar starmap-resource-bar-iron" style="width: 50%;"></div>
                        </div>
                    </div>
                    <div class="starmap-resource-row">
                        <span>Gold:</span>
                        <div class="starmap-resource-indicator">
                            <div id="current-gold-indicator" class="starmap-resource-bar starmap-resource-bar-gold" style="width: 50%;"></div>
                        </div>
                    </div>
                    <div class="starmap-resource-row">
                        <span>Platinum:</span>
                        <div class="starmap-resource-indicator">
                            <div id="current-platinum-indicator" class="starmap-resource-bar starmap-resource-bar-platinum" style="width: 50%;"></div>
                        </div>
                    </div>
                </div>
                <div id="current-system-description" class="starmap-system-description ${this.isMobile ? 'starmap-system-description-mobile' : ''}">
                    Our home system, with Earth as the starting location.
                </div>
                <div id="current-system-features" class="starmap-system-features ${this.isMobile ? 'starmap-system-features-mobile' : ''}">
                    Special Features: Earth
                </div>
            </div>
        `;
        return currentSystem;
    }

    createSelectedSystemSection(): HTMLElement {
        const selectedSystem = document.createElement('div');
        selectedSystem.id = 'selected-system-info';
        selectedSystem.innerHTML = `
            <h3 class="starmap-section-title ${this.isMobile ? 'starmap-section-title-mobile' : ''}">SELECTED SYSTEM</h3>
            <div id="selected-system-card" class="starmap-system-card starmap-system-card-selected">
                <div class="starmap-empty-selection">
                    No system selected.<br>
                    ${this.isMobile ? 'Tap' : 'Click'} on a star system in the map to select it.
                </div>
            </div>
            <button id="travel-button" disabled class="starmap-travel-button starmap-travel-button-disabled ${this.isMobile ? 'starmap-travel-button-mobile' : ''}">
                TRAVEL TO SYSTEM
            </button>
        `;
        return selectedSystem;
    }

    createCloseButton(): HTMLButtonElement {
        const closeButton = document.createElement('button');
        closeButton.id = 'close-star-map';
        closeButton.textContent = 'RETURN TO STARGATE';
        closeButton.classList.add('starmap-close-button');
        if (this.isMobile) {
            closeButton.classList.add('starmap-close-button-mobile');
        }
        
        return closeButton;
    }
}
