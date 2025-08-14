// uiCreator.js - Handles star map UI creation and setup

export class UICreator {
    constructor(isMobile) {
        this.isMobile = isMobile;
    }

    // Create star map UI
    setupStarMapUI() {
        // Create starmap container
        const starMap = document.createElement('div');
        starMap.id = 'star-map';
        starMap.style.position = 'absolute';
        starMap.style.top = '50%';
        starMap.style.left = '50%';
        starMap.style.transform = 'translate(-50%, -50%)';
        
        // Adjust size for mobile devices
        if (this.isMobile) {
            starMap.style.width = '95%';
            starMap.style.height = '85vh'; // Reduced to ensure the button is visible
            starMap.style.maxHeight = '700px';
        } else {
            starMap.style.width = '900px';
            starMap.style.height = '700px';
        }
        
        starMap.style.backgroundColor = 'rgba(10, 15, 30, 0.95)';
        starMap.style.color = '#fff';
        starMap.style.padding = this.isMobile ? '15px' : '30px';
        starMap.style.borderRadius = '10px';
        starMap.style.border = '2px solid #30cfd0';
        starMap.style.boxShadow = '0 0 30px #30cfd0';
        starMap.style.fontFamily = 'Courier New, monospace';
        starMap.style.zIndex = '1500';
        starMap.style.display = 'none';
        starMap.style.overflow = 'hidden';
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'STAR MAP';
        title.style.textAlign = 'center';
        title.style.color = '#30cfd0';
        title.style.margin = '0 0 20px 0';
        title.style.fontSize = this.isMobile ? '24px' : '28px';
        starMap.appendChild(title);
        
        // Create map content container with flexible layout
        const content = document.createElement('div');
        content.style.display = 'flex';
        content.style.flexDirection = this.isMobile ? 'column' : 'row';
        content.style.height = this.isMobile ? 'calc(100% - 120px)' : 'calc(100% - 100px)';
        content.style.gap = this.isMobile ? '15px' : '0';
        
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

    createMapContainer() {
        const mapContainer = document.createElement('div');
        mapContainer.id = 'star-map-visual';
        mapContainer.style.flex = '1';
        mapContainer.style.background = 'rgba(0, 0, 0, 0.7)';
        mapContainer.style.borderRadius = '10px';
        mapContainer.style.border = '1px solid #30cfd0';
        mapContainer.style.position = 'relative';
        mapContainer.style.overflow = 'hidden';
        mapContainer.style.height = this.isMobile ? '40%' : '100%';
        mapContainer.style.minHeight = this.isMobile ? '250px' : 'auto';
        
        // Create canvas for map visualization
        const canvas = document.createElement('canvas');
        canvas.id = 'star-map-canvas';
        canvas.width = 500;
        canvas.height = 500;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        mapContainer.appendChild(canvas);
        
        return mapContainer;
    }

    createInfoPanel() {
        const infoPanel = document.createElement('div');
        infoPanel.id = 'system-info-panel';
        infoPanel.style.width = this.isMobile ? '100%' : '350px';
        infoPanel.style.marginLeft = this.isMobile ? '0' : '20px';
        infoPanel.style.overflowY = 'auto';
        infoPanel.style.height = this.isMobile ? '60%' : '100%';
        infoPanel.style.webkitOverflowScrolling = 'touch'; // For smooth scrolling on iOS
        
        // Current system section
        const currentSystem = this.createCurrentSystemSection();
        infoPanel.appendChild(currentSystem);
        
        // Selected system section
        const selectedSystem = this.createSelectedSystemSection();
        infoPanel.appendChild(selectedSystem);
        
        return infoPanel;
    }

    createCurrentSystemSection() {
        const currentSystem = document.createElement('div');
        currentSystem.id = 'current-system-info';
        currentSystem.innerHTML = `
            <h3 style="color: #30cfd0; margin-top: 0; font-size: ${this.isMobile ? '16px' : '18px'};">CURRENT SYSTEM</h3>
            <div class="system-card" style="background: rgba(0, 0, 0, 0.7); padding: 15px; border-radius: 5px; border: 1px solid #30cfd0; margin-bottom: 20px;">
                <div id="current-system-name" style="font-size: ${this.isMobile ? '16px' : '18px'}; font-weight: bold; color: #fff; margin-bottom: 5px;">Solar System</div>
                <div id="current-system-class" style="font-size: ${this.isMobile ? '12px' : '14px'}; color: #aaa; margin-bottom: 10px;">Class G - Home System</div>
                <div id="current-system-resources" style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Iron:</span>
                        <div class="resource-indicator" style="width: 100px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                            <div id="current-iron-indicator" style="height: 100%; width: 50%; background: #aaa;"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Gold:</span>
                        <div class="resource-indicator" style="width: 100px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                            <div id="current-gold-indicator" style="height: 100%; width: 50%; background: #FFD700;"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Platinum:</span>
                        <div class="resource-indicator" style="width: 100px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                            <div id="current-platinum-indicator" style="height: 100%; width: 50%; background: #E5E4E2;"></div>
                        </div>
                    </div>
                </div>
                <div id="current-system-description" style="font-size: ${this.isMobile ? '11px' : '12px'}; color: #ccc; margin-bottom: 10px;">
                    Our home system, with Earth as the starting location.
                </div>
                <div id="current-system-features" style="font-size: ${this.isMobile ? '11px' : '12px'}; color: #30cfd0;">
                    Special Features: Earth
                </div>
            </div>
        `;
        return currentSystem;
    }

    createSelectedSystemSection() {
        const selectedSystem = document.createElement('div');
        selectedSystem.id = 'selected-system-info';
        selectedSystem.innerHTML = `
            <h3 style="color: #30cfd0; font-size: ${this.isMobile ? '16px' : '18px'};">SELECTED SYSTEM</h3>
            <div id="selected-system-card" class="system-card" style="background: rgba(0, 0, 0, 0.7); padding: 15px; border-radius: 5px; border: 1px solid #555; margin-bottom: 20px;">
                <div class="empty-selection" style="color: #777; text-align: center; padding: 20px;">
                    No system selected.<br>
                    ${this.isMobile ? 'Tap' : 'Click'} on a star system in the map to select it.
                </div>
            </div>
            <button id="travel-button" disabled style="width: 100%; padding: ${this.isMobile ? '15px' : '12px'}; background-color: #30cfd0; color: #000; border: none; border-radius: 5px; cursor: not-allowed; font-family: 'Courier New', monospace; font-weight: bold; font-size: ${this.isMobile ? '18px' : '16px'}; opacity: 0.5;">
                TRAVEL TO SYSTEM
            </button>
        `;
        return selectedSystem;
    }

    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.id = 'close-star-map';
        closeButton.textContent = 'RETURN TO STARGATE';
        closeButton.style.width = '100%';
        closeButton.style.padding = this.isMobile ? '15px' : '12px';
        closeButton.style.marginTop = '20px';
        closeButton.style.backgroundColor = '#555';
        closeButton.style.color = '#fff';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontFamily = 'Courier New, monospace';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.fontSize = this.isMobile ? '18px' : '16px';
        
        // Make the button more prominent on mobile
        if (this.isMobile) {
            closeButton.style.backgroundColor = '#30cfd0';
            closeButton.style.color = '#000';
            closeButton.style.boxShadow = '0 0 15px rgba(48, 207, 208, 0.7)';
        }
        
        return closeButton;
    }
}