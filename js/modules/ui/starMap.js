// starMap.js - Handles the star map UI for interstellar travel

import { MobileDetector } from '../../utils/mobileDetector.js';
import { CanvasRenderer } from './starmap/canvasRenderer.js';
import { NavigationLogic } from './starmap/navigationLogic.js';
import { DataManager } from './starmap/dataManager.js';
import { UICreator } from './starmap/uiCreator.js';

export class StarMap {
    constructor(starSystemGenerator, dockingSystem, stargateInterface) {
        this.starSystemGenerator = starSystemGenerator;
        this.dockingSystem = dockingSystem;
        this.stargateInterface = stargateInterface;
        this.isVisible = false;
        this.isMobile = MobileDetector.isMobile();
        
        console.log("StarMap constructor - isMobile:", this.isMobile);
        
        // Initialize component modules
        this.canvasRenderer = new CanvasRenderer(this.isMobile);
        this.navigationLogic = new NavigationLogic(starSystemGenerator, dockingSystem, stargateInterface);
        this.dataManager = new DataManager(starSystemGenerator);
        this.uiCreator = new UICreator(this.isMobile);
        
        // Create star map UI
        this.uiCreator.setupStarMapUI();
        
        // Set event handlers
        this.setupEventHandlers();
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
                this.navigationLogic.handleTravel(() => this.hide());
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
        const clickedSystem = this.canvasRenderer.findSystemAtPosition(x, y, this.starSystemGenerator);
        if (clickedSystem) {
            this.selectSystem(clickedSystem);
            this.updateCanvas(); // Redraw to show selection
        }
    }
    
    // Select a system and update the UI
    selectSystem(systemId) {
        this.navigationLogic.selectSystem(
            systemId, 
            this.isMobile,
            (system, isMobile) => this.dataManager.updateSelectedSystemInfo(system, isMobile),
            (systemId, isCurrentSystem, isConnected) => this.dataManager.updateTravelButton(systemId, isCurrentSystem, isConnected)
        );
    }
    
    // Draw the star map on the canvas
    updateCanvas() {
        this.canvasRenderer.updateCanvas(this.starSystemGenerator);
        // Update selected system drawing
        this.canvasRenderer.drawSystems(
            document.getElementById('star-map-canvas').getContext('2d'),
            250, 250, // center coordinates
            this.dataManager.getAllSystems(),
            this.dataManager.getCurrentSystem(),
            this.navigationLogic.getSelectedSystem()
        );
    }
    
    // Update the current system information
    updateCurrentSystemInfo() {
        this.dataManager.updateCurrentSystemInfo(this.isMobile);
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
            
            // Show the stargate UI when returning from star map
            if (this.stargateInterface) {
                this.stargateInterface.showStargateUI();
            } else if (window.game && window.game.ui && window.game.ui.stargateInterface) {
                // Try to find stargate UI via game instance if direct reference fails
                window.game.ui.stargateInterface.showStargateUI();
            } else {
                // Direct DOM access as last resort
                const stargateUI = document.getElementById('stargate-ui');
                if (stargateUI) {
                    stargateUI.style.display = 'block';
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