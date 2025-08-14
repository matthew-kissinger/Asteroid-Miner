// customSystemCreator.js - Refactored UI for creating custom star systems with AI-generated assets

import { ApiClient } from '../utils/apiClient.js';
import { StyleManager } from './components/customSystem/styles.js';
import { ValidationManager } from './components/customSystem/validation.js';
import { SystemDataManager } from './components/customSystem/systemData.js';
import { FormViewManager } from './components/customSystem/formView.js';
import { PreviewManager } from './components/customSystem/preview.js';
import { EventHandlerManager } from './components/customSystem/eventHandlers.js';
import { HelperManager } from './components/customSystem/helpers.js';

export class CustomSystemCreator {
    constructor(starSystemGenerator, environment) {
        this.starSystemGenerator = starSystemGenerator;
        this.environment = environment;
        this.apiClient = new ApiClient();
        this.isVisible = false;
        this.isGenerating = false;
        this.generatedSkyboxUrl = null;
        this.generatedPlanetUrls = [];
        this.systemData = null;
        
        // Initialize helper utilities
        this.helpers = new HelperManager();
        this.isMobile = this.helpers.detectMobile();
        
        // Initialize managers
        this.styleManager = new StyleManager(this.isMobile);
        this.validationManager = new ValidationManager(this.isMobile);
        this.systemDataManager = new SystemDataManager();
        this.formViewManager = new FormViewManager(this.isMobile, this.styleManager);
        this.previewManager = new PreviewManager(this.isMobile);
        this.eventHandlerManager = new EventHandlerManager(this, this.isMobile);
        
        // Initialize UI
        this.createUI();
        this.setupEventHandlers();
        this.setupSliderListeners(1);
    }
    
    createUI() {
        // Inject styles
        this.styleManager.injectStyles();
        
        // Create main container
        this.container = this.formViewManager.createMainContainer();
        this.container.innerHTML = this.formViewManager.createModalContent();
        
        // Add to document
        document.body.appendChild(this.container);
        
        // Capture references to elements
        this.captureElementReferences();
        
        // Add mobile enhancements
        if (this.isMobile) {
            this.setupMobileEnhancements();
        }
    }
    
    captureElementReferences() {
        this.systemNameInput = document.getElementById('system-name');
        this.skyboxDescription = document.getElementById('skybox-description');
        this.planetDescriptions = document.getElementById('planet-descriptions');
        this.addPlanetBtn = document.getElementById('add-planet-btn');
        this.generateSystemBtn = document.getElementById('generate-system-btn');
        this.generationProgress = document.getElementById('generation-progress');
        this.generationStatus = document.getElementById('generation-status');
        this.systemForm = document.getElementById('system-creator-form');
        this.systemPreview = document.getElementById('system-preview');
        this.skyboxPreviewImg = document.getElementById('skybox-preview-img');
        this.planetsPreview = document.getElementById('planets-preview');
        this.travelToSystemBtn = document.getElementById('travel-to-system-btn');
        this.regenerateSystemBtn = document.getElementById('regenerate-system-btn');
        this.closeBtn = document.getElementById('close-system-creator');
    }
    
    setupMobileEnhancements() {
        this.formViewManager.addRippleEffect(this.container);
        this.validationManager.setupCharacterCounters(this.skyboxDescription, this.planetDescriptions);
    }
    
    setupEventHandlers() {
        const elements = {
            closeBtn: this.closeBtn,
            addPlanetBtn: this.addPlanetBtn,
            generateSystemBtn: this.generateSystemBtn,
            travelToSystemBtn: this.travelToSystemBtn,
            regenerateSystemBtn: this.regenerateSystemBtn,
            systemForm: this.systemForm,
            systemPreview: this.systemPreview,
            systemNameInput: this.systemNameInput,
            skyboxDescription: this.skyboxDescription
        };
        
        this.eventHandlerManager.setupAllEventHandlers(this.container, elements);
        this.eventHandlerManager.setupValidationHandlers(elements, this.validationManager);
    }
    
    addPlanetInput() {
        const planetDiv = this.formViewManager.addPlanetInput(
            this.planetDescriptions,
            this.setupSliderListeners.bind(this),
            this.updatePlanetNumbers.bind(this),
            this.playUISound.bind(this)
        );
        
        // Add character counter for new planet description if mobile
        if (this.isMobile) {
            const planetDesc = planetDiv.querySelector(`textarea[id^="planet-description-"]`);
            if (planetDesc) {
                this.validationManager.addCharacterCounter(planetDesc, 150);
            }
        }
    }
    
    setupSliderListeners(index) {
        this.formViewManager.setupSliderListeners(index);
    }
    
    updatePlanetNumbers() {
        this.formViewManager.updatePlanetNumbers(this.planetDescriptions);
    }
    
    async generateSystem() {
        // Validate inputs
        const systemValidation = this.validationManager.validateSystemForm(
            this.systemNameInput, 
            this.skyboxDescription
        );
        
        if (!systemValidation.isValid) {
            this.validationManager.showMobileAlert(systemValidation.message, this.playUISound.bind(this));
            return;
        }
        
        const planetInputs = this.planetDescriptions.getElementsByClassName('planet-input');
        const planetValidation = this.validationManager.validatePlanetCount(planetInputs);
        
        if (!planetValidation.isValid) {
            this.validationManager.showMobileAlert(planetValidation.message, this.playUISound.bind(this));
            return;
        }
        
        // Collect and validate planet data
        const { planets, errors } = this.validationManager.collectPlanetData(planetInputs);
        
        if (errors.length > 0) {
            this.validationManager.showMobileAlert(errors[0], this.playUISound.bind(this));
            return;
        }
        
        // Show progress UI
        this.previewManager.showProgress('Initializing...');
        this.isGenerating = true;
        
        try {
            // Check for auth token or get one
            if (!this.apiClient.hasValidToken()) {
                this.previewManager.updateGenerationStatus('Authenticating...');
                await this.apiClient.getToken();
            }
            
            // Generate skybox
            this.previewManager.updateGenerationStatus('Generating skybox...');
            const skyboxResponse = await this.apiClient.generateSkybox(
                this.systemNameInput.value.trim(), 
                this.skyboxDescription.value.trim()
            );
            
            if (!skyboxResponse.success || !skyboxResponse.image_paths?.length) {
                throw new Error(skyboxResponse.message || 'Failed to generate skybox');
            }
            
            this.generatedSkyboxUrl = skyboxResponse.image_paths[0];
            
            // Generate planets
            this.generatedPlanetUrls = [];
            for (let i = 0; i < planets.length; i++) {
                const planet = planets[i];
                this.previewManager.updateGenerationStatus(
                    `Generating planet ${i+1} of ${planets.length}: ${planet.name}...`
                );
                
                const planetResponse = await this.apiClient.generatePlanet(planet.name, planet.description);
                
                if (planetResponse.success && planetResponse.image_paths?.length) {
                    this.generatedPlanetUrls.push({
                        name: planet.name,
                        url: planetResponse.image_paths[0]
                    });
                }
            }
            
            // Create system data
            const starClass = document.getElementById('star-class').value;
            this.systemData = this.systemDataManager.createSystemData(
                this.systemNameInput.value.trim(),
                starClass,
                this.generatedSkyboxUrl,
                planets.map((planet, i) => ({
                    ...planet,
                    textureUrl: this.generatedPlanetUrls[i]?.url || null
                }))
            );
            
            // Show preview
            this.previewManager.showSystemPreview(
                this.generatedSkyboxUrl, 
                this.generatedPlanetUrls, 
                this.apiClient
            );
            
        } catch (error) {
            console.error('Error generating system:', error);
            this.validationManager.showMobileAlert(
                `Failed to generate system: ${error.message}`, 
                this.playUISound.bind(this)
            );
            this.previewManager.hideProgress();
        }
        
        this.isGenerating = false;
    }
    
    travelToSystem() {
        if (!this.systemData) {
            this.validationManager.showMobileAlert(
                'No system data available. Please generate a system first.',
                this.playUISound.bind(this)
            );
            return;
        }
        
        try {
            const success = this.starSystemGenerator.addCustomSystem(this.systemData);
            
            if (!success) {
                throw new Error('Failed to add custom system');
            }
            
            this.hide();
            
            if (this.environment?.travelToSystem) {
                this.environment.travelToSystem(this.systemData.id);
            } else {
                console.error('Environment or travelToSystem method not available');
            }
            
        } catch (error) {
            console.error('Error traveling to custom system:', error);
            this.validationManager.showMobileAlert(
                `Failed to travel to custom system: ${error.message}`,
                this.playUISound.bind(this)
            );
        }
    }
    
    playUISound() {
        this.helpers.playUISound();
    }
    
    show() {
        if (!this.container) return;
        
        this.cleanupBeforeHiding();
        this.container.style.display = 'flex';
        this.isVisible = true;
        
        // Reset UI state
        this.previewManager.resetToForm();
        this.playUISound();
        
        // Handle mobile-specific setup
        if (this.isMobile) {
            this.setupMobileShow();
        } else {
            this.setupDesktopShow();
        }
    }
    
    setupMobileShow() {
        const modalContent = this.container.querySelector('.modal-content');
        if (modalContent) {
            this.helpers.scrollToTop(modalContent);
            this.helpers.setStyleSafe(modalContent, 'overflowY', 'auto');
            this.helpers.setStyleSafe(modalContent, 'webkitOverflowScrolling', 'touch');
            this.helpers.setStyleSafe(modalContent, 'overscrollBehavior', 'contain');
        }
        
        this.helpers.addClassSafe(document.body, 'modal-open');
        
        // Delayed focus to avoid iOS keyboard issues
        setTimeout(() => {
            if (this.systemNameInput) {
                this.systemNameInput.focus();
            }
        }, 300);
    }
    
    setupDesktopShow() {
        setTimeout(() => {
            if (this.systemNameInput) {
                this.systemNameInput.focus();
            }
        }, 300);
    }
    
    hide() {
        if (!this.container || this.isGenerating) return;
        
        this.cleanupBeforeHiding();
        this.container.style.display = 'none';
        this.isVisible = false;
        this.playUISound();
        
        // Return to stargate UI
        setTimeout(() => {
            if (window.game?.ui?.stargateInterface) {
                console.log("CustomSystemCreator: Returning to stargate UI");
                window.game.ui.stargateInterface.showStargateUI();
            } else {
                const stargateUI = document.getElementById('stargate-ui');
                if (stargateUI) {
                    stargateUI.style.display = 'block';
                    console.log("CustomSystemCreator: Showed stargate UI via direct DOM access");
                } else {
                    console.warn("CustomSystemCreator: Could not find stargate UI to return to");
                }
            }
        }, 100);
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    cleanupBeforeHiding() {
        if (this.isGenerating) {
            this.isGenerating = false;
            this.previewManager.hideProgress();
        }
        
        this.helpers.cleanupScrolling();
        this.helpers.setStyleSafe(document.body, 'pointerEvents', 'auto');
        
        if (this.isMobile) {
            this.helpers.setStyleSafe(document.body, 'touchAction', 'auto');
            this.helpers.removeClassSafe(document.body, 'modal-open');
            this.helpers.forceReflow(this.container);
        }
    }
    
    destroy() {
        this.cleanupBeforeHiding();
        this.eventHandlerManager.cleanup();
        this.styleManager.cleanup();
        this.helpers.cleanup();
        this.formViewManager.cleanup();
        
        if (this.container?.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}