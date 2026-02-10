// starMap.js - Handles the star map UI for interstellar travel

import { MobileDetector } from '../../utils/mobileDetector.ts';
import { CanvasRenderer } from './starmap/canvasRenderer.js';
import { NavigationLogic } from './starmap/navigationLogic.js';
import { DataManager } from './starmap/dataManager.js';
import { UICreator } from './starmap/uiCreator.js';

// Star system generator shape varies across game systems; use loose typing.
type StarSystemGenerator = any;

type DockingSystem = any;

type StargateInterfaceRef = {
    showStargateUI?: () => void;
};

type AudioSystem = {
    playSound?: (sound: string) => void;
};

type MapInteractionEvent = MouseEvent | Touch;

export class StarMap {
    starSystemGenerator: StarSystemGenerator;
    dockingSystem: DockingSystem | null;
    stargateInterface: StargateInterfaceRef | null;
    audio: AudioSystem | null;
    isVisible: boolean;
    isMobile: boolean;
    canvasRenderer: CanvasRenderer;
    navigationLogic: NavigationLogic;
    dataManager: DataManager;
    uiCreator: UICreator;

    constructor(
        starSystemGenerator: StarSystemGenerator | null | undefined,
        dockingSystem: DockingSystem | null,
        stargateInterface: StargateInterfaceRef | null,
        audio: AudioSystem | null = null
    ) {
        this.starSystemGenerator = starSystemGenerator;
        this.dockingSystem = dockingSystem;
        this.stargateInterface = stargateInterface;
        this.audio = audio;
        this.isVisible = false;
        this.isMobile = MobileDetector.isMobile();
        
        console.log("StarMap constructor - isMobile:", this.isMobile);
        
        // Initialize component modules
        this.canvasRenderer = new CanvasRenderer(this.isMobile);
        this.navigationLogic = new NavigationLogic(starSystemGenerator as any, dockingSystem as any, stargateInterface as any);
        this.dataManager = new DataManager(starSystemGenerator as any);
        this.uiCreator = new UICreator(this.isMobile);
        
        // Create star map UI
        this.uiCreator.setupStarMapUI();
        
        // Set event handlers
        this.setupEventHandlers();
    }
    
    
    setupEventHandlers(): void {
        // Close button
        const closeButton = document.getElementById('close-star-map') as HTMLButtonElement | null;
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (this.audio && this.audio.playSound) {
                    this.audio.playSound('boink');
                }
                this.hide();
            });

            // Add touch event for mobile
            if (this.isMobile) {
                closeButton.addEventListener('touchend', (e: TouchEvent) => {
                    e.preventDefault();
                    if (this.audio && this.audio.playSound) {
                        console.log("Mobile: Playing sound on star map close button");
                        this.audio.playSound('boink');
                        // Give time for the sound to start before hiding
                        setTimeout(() => this.hide(), 50);
                    } else {
                        this.hide();
                    }
                });
            }
        }
        
        // Canvas click/touch handler for selecting systems
        const canvas = document.getElementById('star-map-canvas') as HTMLCanvasElement | null;
        if (canvas) {
            // Mouse events
            canvas.addEventListener('click', (e: MouseEvent) => {
                this.handleMapInteraction(e);
            });
            
            // Touch events for mobile
            if (this.isMobile) {
                canvas.addEventListener('touchend', (e: TouchEvent) => {
                    e.preventDefault();
                    this.handleMapInteraction(e.changedTouches[0]);
                });
            }
        }
        
        // Travel button
        const travelButton = document.getElementById('travel-button') as HTMLButtonElement | null;
        if (travelButton) {
            const travelHandler = () => {
                this.navigationLogic.handleTravel(() => this.hide());
            };
            
            // Click event
            travelButton.addEventListener('click', travelHandler);
            
            // Touch event for mobile
            if (this.isMobile) {
                travelButton.addEventListener('touchend', (e: TouchEvent) => {
                    e.preventDefault();
                    travelHandler();
                });
            }
        }
    }
    
    // Handler for map interactions (click or touch)
    handleMapInteraction(event: MapInteractionEvent): void {
        // Convert click/touch position to canvas coordinates
        const canvas = document.getElementById('star-map-canvas') as HTMLCanvasElement | null;
        if (!canvas) return;
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
    selectSystem(systemId: string | null): void {
        this.navigationLogic.selectSystem(
            systemId, 
            this.isMobile,
            (system, isMobile) => this.dataManager.updateSelectedSystemInfo(system, isMobile),
            (systemId, isCurrentSystem, isConnected) => this.dataManager.updateTravelButton(systemId, isCurrentSystem, isConnected)
        );
    }
    
    // Draw the star map on the canvas
    updateCanvas(): void {
        this.canvasRenderer.updateCanvas(this.starSystemGenerator);
        // Update selected system drawing
        const canvas = document.getElementById('star-map-canvas') as HTMLCanvasElement | null;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        this.canvasRenderer.drawSystems(
            context,
            250, 250, // center coordinates
            this.dataManager.getAllSystems() as any,
            this.dataManager.getCurrentSystem() as any,
            this.navigationLogic.getSelectedSystem() as any
        );
    }
    
    // Update the current system information
    updateCurrentSystemInfo(): void {
        this.dataManager.updateCurrentSystemInfo(this.isMobile);
    }
    
    // Show the star map
    show(): void {
        // Update the map with current data
        this.updateCurrentSystemInfo();
        this.updateCanvas();
        
        // Reset selection
        this.selectSystem(null);
        
        // Force audio context resumption for mobile
        if (this.isMobile && this.audio && this.audio.playSound) {
            // Play a sound to kickstart the audio context
            setTimeout(() => {
                console.log("Mobile: Attempting to play initial sound in StarMap");
                this.audio!.playSound!('boink');
            }, 100);
        }
        
        // Show the map
        const starMap = document.getElementById('star-map') as HTMLDivElement | null;
        if (starMap) {
            starMap.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    // Hide the star map
    hide(): void {
        const starMap = document.getElementById('star-map') as HTMLDivElement | null;
        if (starMap) {
            starMap.style.display = 'none';
            this.isVisible = false;
            
            // Show the stargate UI when returning from star map
            if (this.stargateInterface?.showStargateUI) {
                this.stargateInterface.showStargateUI();
            } else {
                // Direct DOM access as fallback
                const stargateUI = document.getElementById('stargate-ui') as HTMLDivElement | null;
                if (stargateUI) {
                    stargateUI.style.display = 'block';
                }
            }
        }
    }
    
    // Toggle map visibility
    toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
} 
