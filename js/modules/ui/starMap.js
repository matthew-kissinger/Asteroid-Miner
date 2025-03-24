// starMap.js - Handles the star map UI for interstellar travel

import { MobileDetector } from '../../utils/mobileDetector.js';

export class StarMap {
    constructor(starSystemGenerator, dockingSystem, mothershipInterface) {
        this.starSystemGenerator = starSystemGenerator;
        this.dockingSystem = dockingSystem;
        this.mothershipInterface = mothershipInterface;
        this.isVisible = false;
        this.selectedSystem = null;
        this.isTraveling = false;
        this.isMobile = MobileDetector.isMobile();
        
        console.log("StarMap constructor - isMobile:", this.isMobile);
        
        // Create star map UI
        this.setupStarMapUI();
        
        // Set event handlers
        this.setupEventHandlers();
    }
    
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
        
        // Right column - System Information
        const infoPanel = document.createElement('div');
        infoPanel.id = 'system-info-panel';
        infoPanel.style.width = this.isMobile ? '100%' : '350px';
        infoPanel.style.marginLeft = this.isMobile ? '0' : '20px';
        infoPanel.style.overflowY = 'auto';
        infoPanel.style.height = this.isMobile ? '60%' : '100%';
        infoPanel.style.webkitOverflowScrolling = 'touch'; // For smooth scrolling on iOS
        
        // Current system section
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
        infoPanel.appendChild(currentSystem);
        
        // Selected system section
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
        infoPanel.appendChild(selectedSystem);
        
        // Add all elements to the map
        content.appendChild(mapContainer);
        content.appendChild(infoPanel);
        starMap.appendChild(content);
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.id = 'close-star-map';
        closeButton.textContent = 'RETURN TO MOTHERSHIP';
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
        
        starMap.appendChild(closeButton);
        
        // Add to DOM
        document.body.appendChild(starMap);
    }
    
    setupEventHandlers() {
        // Close button
        const closeButton = document.getElementById('close-star-map');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (window.game && window.game.audio) {
                    window.game.audio.playSound('boink');
                }
                this.hide();
            });
            
            // Add touch event for mobile
            if (this.isMobile) {
                closeButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (window.game && window.game.audio) {
                        console.log("Mobile: Playing sound on star map close button");
                        window.game.audio.playSound('boink');
                        // Give time for the sound to start before hiding
                        setTimeout(() => this.hide(), 50);
                    } else {
                        this.hide();
                    }
                });
            }
        }
        
        // Canvas click/touch handler for selecting systems
        const canvas = document.getElementById('star-map-canvas');
        if (canvas) {
            // Mouse events
            canvas.addEventListener('click', (e) => {
                this.handleMapInteraction(e);
            });
            
            // Touch events for mobile
            if (this.isMobile) {
                canvas.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.handleMapInteraction(e.changedTouches[0]);
                });
            }
        }
        
        // Travel button
        const travelButton = document.getElementById('travel-button');
        if (travelButton) {
            const travelHandler = () => {
                if (this.selectedSystem && this.selectedSystem !== this.starSystemGenerator.currentSystem) {
                    console.log(`Initiating travel to system: ${this.selectedSystem}`);
                    
                    // Set traveling flag before hiding the star map
                    this.isTraveling = true;
                    
                    // Close the star map first
                    this.hide();
                    
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
                            // Update UI
                            this.updateCurrentSystemInfo();
                            this.updateCanvas();
                            
                            // Reset selection
                            this.selectSystem(null);
                            
                            // Notify the user
                            this.showTravelNotification(this.starSystemGenerator.getCurrentSystemData().name);
                            
                            // Reset traveling flag
                            this.isTraveling = false;
                        }
                    }
                }
            };
            
            // Click event
            travelButton.addEventListener('click', travelHandler);
            
            // Touch event for mobile
            if (this.isMobile) {
                travelButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    travelHandler();
                });
            }
        }
    }
    
    // Handler for map interactions (click or touch)
    handleMapInteraction(event) {
        // Convert click/touch position to canvas coordinates
        const canvas = document.getElementById('star-map-canvas');
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (canvas.height / rect.height);
        
        // Check if a star system was clicked/tapped
        const clickedSystem = this.findSystemAtPosition(x, y);
        if (clickedSystem) {
            this.selectSystem(clickedSystem);
            this.updateCanvas(); // Redraw to show selection
        }
    }
    
    // Find which system was clicked (if any)
    findSystemAtPosition(x, y) {
        const systems = this.starSystemGenerator.getAllSystems();
        const currentSystem = this.starSystemGenerator.currentSystem;
        
        // Define the center of the canvas
        const centerX = 250;
        const centerY = 250;
        
        // Check each system
        for (const [systemId, system] of Object.entries(systems)) {
            // Convert system position to canvas position
            const canvasX = centerX + system.position.x;
            const canvasY = centerY + system.position.y;
            
            // Calculate distance from click to star
            const dx = x - canvasX;
            const dy = y - canvasY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If click is within the star's radius (make current system bigger)
            // Use larger tap area for mobile
            const radius = systemId === currentSystem ? 
                          (this.isMobile ? 20 : 15) : 
                          (this.isMobile ? 15 : 10);
            if (distance <= radius) {
                return systemId;
            }
        }
        
        return null;
    }
    
    // Select a system and update the UI
    selectSystem(systemId) {
        console.log(`Selecting system: ${systemId}`);
        this.selectedSystem = systemId;
        
        if (!systemId) {
            // Clear selection
            const selectedCard = document.getElementById('selected-system-card');
            if (selectedCard) {
                selectedCard.innerHTML = `
                    <div class="empty-selection" style="color: #777; text-align: center; padding: 20px;">
                        No system selected.<br>${this.isMobile ? 'Tap' : 'Click'} on a star system in the map to select it.
                    </div>
                `;
            }
            
            // Disable travel button
            const travelButton = document.getElementById('travel-button');
            if (travelButton) {
                travelButton.disabled = true;
                travelButton.style.cursor = 'not-allowed';
                travelButton.style.opacity = '0.5';
            }
            
            return;
        }
        
        // Get system data
        const system = this.starSystemGenerator.getAllSystems()[systemId];
        const currentSystem = this.starSystemGenerator.currentSystem;
        
        // Update selected system info card
        const selectedCard = document.getElementById('selected-system-card');
        if (selectedCard && system) {
            selectedCard.innerHTML = `
                <div id="selected-system-name" style="font-size: ${this.isMobile ? '16px' : '18px'}; font-weight: bold; color: #fff; margin-bottom: 5px;">${system.name}</div>
                <div id="selected-system-class" style="font-size: ${this.isMobile ? '12px' : '14px'}; color: #aaa; margin-bottom: 10px;">Class ${system.starClass} - ${system.classification}</div>
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
                <div style="font-size: ${this.isMobile ? '11px' : '12px'}; color: #ccc; margin-bottom: 10px;">
                    ${system.description}
                </div>
                <div style="font-size: ${this.isMobile ? '11px' : '12px'}; color: #30cfd0;">
                    Special Features: ${system.specialFeatures.join(', ')}
                </div>
            `;
            
            // Scroll to make selected system info visible on mobile
            if (this.isMobile) {
                const infoPanel = document.getElementById('system-info-panel');
                if (infoPanel) {
                    infoPanel.scrollTop = selectedCard.offsetTop - infoPanel.offsetTop;
                }
            }
        }
        
        // Enable/disable travel button
        const travelButton = document.getElementById('travel-button');
        if (travelButton) {
            // Only enable if not current system and is connected to current
            const isConnected = this.starSystemGenerator.getCurrentSystemConnections().includes(systemId);
            const isCurrentSystem = systemId === currentSystem;
            
            travelButton.disabled = isCurrentSystem || !isConnected;
            travelButton.style.cursor = isCurrentSystem || !isConnected ? 'not-allowed' : 'pointer';
            travelButton.style.opacity = isCurrentSystem || !isConnected ? '0.5' : '1';
            
            // Update button text
            travelButton.textContent = isCurrentSystem ? 'CURRENT LOCATION' : 
                                      !isConnected ? 'NO DIRECT ROUTE' : 'TRAVEL TO SYSTEM';
        }
    }
    
    // Draw the star map on the canvas
    updateCanvas() {
        const canvas = document.getElementById('star-map-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Define the center of the canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Get systems data
        const systems = this.starSystemGenerator.getAllSystems();
        const currentSystem = this.starSystemGenerator.currentSystem;
        const connections = this.starSystemGenerator.warpGates;
        
        // First draw connections
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(48, 207, 208, 0.4)';
        
        for (const [systemId, connectedSystems] of Object.entries(connections)) {
            const system = systems[systemId];
            if (!system) continue;
            
            // Convert system position to canvas position
            const x1 = centerX + system.position.x;
            const y1 = centerY + system.position.y;
            
            for (const connectedId of connectedSystems) {
                const connectedSystem = systems[connectedId];
                if (!connectedSystem) continue;
                
                // Convert connected system position to canvas position
                const x2 = centerX + connectedSystem.position.x;
                const y2 = centerY + connectedSystem.position.y;
                
                // Draw the connection
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        
        // Highlight connections from current system
        if (currentSystem && systems[currentSystem]) {
            const currentSystemData = systems[currentSystem];
            const x1 = centerX + currentSystemData.position.x;
            const y1 = centerY + currentSystemData.position.y;
            
            ctx.lineWidth = this.isMobile ? 3 : 2;
            ctx.strokeStyle = 'rgba(48, 207, 208, 0.8)';
            
            for (const connectedId of currentSystemData.connections) {
                const connectedSystem = systems[connectedId];
                if (!connectedSystem) continue;
                
                // Convert connected system position to canvas position
                const x2 = centerX + connectedSystem.position.x;
                const y2 = centerY + connectedSystem.position.y;
                
                // Draw the connection
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        
        // Now draw systems
        for (const [systemId, system] of Object.entries(systems)) {
            // Convert system position to canvas position
            const x = centerX + system.position.x;
            const y = centerY + system.position.y;
            
            // Determine if it's the current system, selected system, or regular
            const isCurrent = systemId === currentSystem;
            const isSelected = systemId === this.selectedSystem;
            const isConnected = currentSystem && systems[currentSystem] && 
                                systems[currentSystem].connections.includes(systemId);
            
            // Draw a circle for the system
            ctx.beginPath();
            
            // Size based on status and device
            let radius;
            if (this.isMobile) {
                radius = isCurrent ? 18 : isSelected ? 15 : 10;
            } else {
                radius = isCurrent ? 15 : isSelected ? 12 : 8;
            }
            
            // Fill color based on star class
            ctx.fillStyle = system.starColor ? `#${system.starColor.toString(16).padStart(6, '0')}` : '#ffffff';
            
            // Add glow for current and selected
            if (isCurrent || isSelected) {
                ctx.shadowBlur = this.isMobile ? 20 : 15;
                ctx.shadowColor = isCurrent ? '#30cfd0' : '#ffffff';
            } else {
                ctx.shadowBlur = 0;
            }
            
            // Draw the star
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
            // Draw border for connected systems
            if (isConnected && !isCurrent) {
                ctx.strokeStyle = '#30cfd0';
                ctx.lineWidth = this.isMobile ? 3 : 2;
                ctx.beginPath();
                ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Draw name label
            ctx.fillStyle = isCurrent ? '#30cfd0' : isSelected ? '#ffffff' : '#aaaaaa';
            ctx.font = isCurrent ? 
                      (this.isMobile ? 'bold 14px Courier New' : 'bold 12px Courier New') : 
                      (this.isMobile ? '12px Courier New' : '10px Courier New');
            ctx.textAlign = 'center';
            ctx.fillText(system.name, x, y + radius + (this.isMobile ? 18 : 15));
        }
    }
    
    // Show travel notification
    showTravelNotification(systemName) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = this.isMobile ? '30%' : '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#30cfd0';
        notification.style.padding = this.isMobile ? '15px 30px' : '20px 40px';
        notification.style.borderRadius = '10px';
        notification.style.border = '2px solid #30cfd0';
        notification.style.boxShadow = '0 0 30px #30cfd0';
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = this.isMobile ? '18px' : '20px';
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
    
    // Update the current system information
    updateCurrentSystemInfo() {
        const system = this.starSystemGenerator.getCurrentSystemData();
        if (!system) return;
        
        // Update system name and class
        document.getElementById('current-system-name').textContent = system.name;
        document.getElementById('current-system-class').textContent = `Class ${system.starClass} - ${system.classification}`;
        
        // Update resource indicators
        document.getElementById('current-iron-indicator').style.width = `${system.resourceMultipliers.iron * 50}%`;
        document.getElementById('current-gold-indicator').style.width = `${system.resourceMultipliers.gold * 50}%`;
        document.getElementById('current-platinum-indicator').style.width = `${system.resourceMultipliers.platinum * 50}%`;
        
        // Update description and features
        document.getElementById('current-system-description').textContent = system.description;
        document.getElementById('current-system-features').textContent = `Special Features: ${system.specialFeatures.join(', ')}`;
    }
    
    // Show the star map
    show() {
        // Update the map with current data
        this.updateCurrentSystemInfo();
        this.updateCanvas();
        
        // Reset selection
        this.selectSystem(null);
        
        // Force audio context resumption for mobile
        if (this.isMobile && window.game && window.game.audio) {
            // Play a sound to kickstart the audio context
            setTimeout(() => {
                console.log("Mobile: Attempting to play initial sound in StarMap");
                window.game.audio.playSound('boink');
            }, 100);
        }
        
        // Show the map
        const starMap = document.getElementById('star-map');
        if (starMap) {
            starMap.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    // Hide the star map
    hide() {
        const starMap = document.getElementById('star-map');
        if (starMap) {
            starMap.style.display = 'none';
            this.isVisible = false;
            
            // Show the mothership UI when returning from star map
            if (this.mothershipInterface) {
                this.mothershipInterface.showMothershipUI();
            } else if (window.game && window.game.ui && window.game.ui.mothershipInterface) {
                // Try to find mothership UI via game instance if direct reference fails
                window.game.ui.mothershipInterface.showMothershipUI();
            } else {
                // Direct DOM access as last resort
                const mothershipUI = document.getElementById('mothership-ui');
                if (mothershipUI) {
                    mothershipUI.style.display = 'block';
                }
            }
        }
    }
    
    // Toggle map visibility
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}