// customSystemCreator.js - Refactored UI for creating custom star systems with AI-generated assets

import { ApiClient } from '../utils/apiClient.ts';
import { StyleManager } from './components/customSystem/styles.ts';
import { ValidationManager } from './components/customSystem/validation.ts';
import { SystemDataManager } from './components/customSystem/systemData.ts';
import { FormViewManager } from './components/customSystem/formView.ts';
import { PreviewManager } from './components/customSystem/preview.ts';
import { EventHandlerManager } from './components/customSystem/eventHandlers.ts';
import { HelperManager } from './components/customSystem/helpers.ts';

type ApiImageResponse = {
    success: boolean;
    image_paths?: string[];
    message?: string;
};

type GeneratedPlanetPreview = {
    name: string;
    url: string | null;
};

type CustomSystemData = {
    id: string;
    [key: string]: unknown;
};

type StarSystemGenerator = any;

type EnvironmentForCustomSystem = {
    travelToSystem?: (systemId: string) => void;
};

export class CustomSystemCreator {
    starSystemGenerator: StarSystemGenerator | null;
    environment: EnvironmentForCustomSystem | null;
    apiClient: ApiClient;
    isVisible: boolean;
    isGenerating: boolean;
    generatedSkyboxUrl: string | null;
    generatedPlanetUrls: GeneratedPlanetPreview[];
    systemData: CustomSystemData | null;
    helpers: HelperManager;
    isMobile: boolean;
    styleManager: StyleManager;
    validationManager: ValidationManager;
    systemDataManager: SystemDataManager;
    formViewManager: FormViewManager;
    previewManager: PreviewManager;
    eventHandlerManager: EventHandlerManager;
    container: HTMLDivElement | null;
    systemNameInput: HTMLInputElement | null;
    skyboxDescription: HTMLTextAreaElement | null;
    planetDescriptions: HTMLDivElement | null;
    addPlanetBtn: HTMLButtonElement | null;
    generateSystemBtn: HTMLButtonElement | null;
    generationProgress: HTMLDivElement | null;
    generationStatus: HTMLParagraphElement | null;
    systemForm: HTMLDivElement | null;
    systemPreview: HTMLDivElement | null;
    skyboxPreviewImg: HTMLImageElement | null;
    planetsPreview: HTMLDivElement | null;
    travelToSystemBtn: HTMLButtonElement | null;
    regenerateSystemBtn: HTMLButtonElement | null;
    closeBtn: HTMLButtonElement | null;

    constructor(starSystemGenerator: StarSystemGenerator | null, environment: EnvironmentForCustomSystem | null) {
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
        this.formViewManager = new FormViewManager(this.isMobile, this.styleManager as unknown as null);
        this.previewManager = new PreviewManager(this.isMobile);
        this.eventHandlerManager = new EventHandlerManager(this, this.isMobile);
        
        // Initialize UI
        this.container = null;
        this.systemNameInput = null;
        this.skyboxDescription = null;
        this.planetDescriptions = null;
        this.addPlanetBtn = null;
        this.generateSystemBtn = null;
        this.generationProgress = null;
        this.generationStatus = null;
        this.systemForm = null;
        this.systemPreview = null;
        this.skyboxPreviewImg = null;
        this.planetsPreview = null;
        this.travelToSystemBtn = null;
        this.regenerateSystemBtn = null;
        this.closeBtn = null;

        this.createUI();
        this.setupEventHandlers();
        this.setupSliderListeners(1);
    }
    
    createUI(): void {
        // Inject styles
        this.styleManager.injectStyles();
        
        // Create main container
        const container = this.formViewManager.createMainContainer();
        container.innerHTML = this.formViewManager.createModalContent();
        this.container = container;
        
        // Add to document
        document.body.appendChild(container);
        
        // Capture references to elements
        this.captureElementReferences();
        
        // Add mobile enhancements
        if (this.isMobile) {
            this.setupMobileEnhancements();
        }
    }
    
    captureElementReferences(): void {
        this.systemNameInput = document.getElementById('system-name') as HTMLInputElement | null;
        this.skyboxDescription = document.getElementById('skybox-description') as HTMLTextAreaElement | null;
        this.planetDescriptions = document.getElementById('planet-descriptions') as HTMLDivElement | null;
        this.addPlanetBtn = document.getElementById('add-planet-btn') as HTMLButtonElement | null;
        this.generateSystemBtn = document.getElementById('generate-system-btn') as HTMLButtonElement | null;
        this.generationProgress = document.getElementById('generation-progress') as HTMLDivElement | null;
        this.generationStatus = document.getElementById('generation-status') as HTMLParagraphElement | null;
        this.systemForm = document.getElementById('system-creator-form') as HTMLDivElement | null;
        this.systemPreview = document.getElementById('system-preview') as HTMLDivElement | null;
        this.skyboxPreviewImg = document.getElementById('skybox-preview-img') as HTMLImageElement | null;
        this.planetsPreview = document.getElementById('planets-preview') as HTMLDivElement | null;
        this.travelToSystemBtn = document.getElementById('travel-to-system-btn') as HTMLButtonElement | null;
        this.regenerateSystemBtn = document.getElementById('regenerate-system-btn') as HTMLButtonElement | null;
        this.closeBtn = document.getElementById('close-system-creator') as HTMLButtonElement | null;
    }
    
    setupMobileEnhancements(): void {
        if (this.container) {
            this.formViewManager.addRippleEffect(this.container);
        }
        if (this.skyboxDescription && this.planetDescriptions) {
            this.validationManager.setupCharacterCounters(this.skyboxDescription, this.planetDescriptions);
        }
    }
    
    setupEventHandlers(): void {
        if (!this.container || !this.closeBtn || !this.addPlanetBtn || !this.generateSystemBtn || 
            !this.travelToSystemBtn || !this.regenerateSystemBtn || !this.systemForm || 
            !this.systemPreview || !this.systemNameInput || !this.skyboxDescription) {
            return;
        }
        
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
    
    addPlanetInput(): void {
        if (!this.planetDescriptions) return;
        
        const planetDiv = this.formViewManager.addPlanetInput(
            this.planetDescriptions,
            this.setupSliderListeners.bind(this),
            this.updatePlanetNumbers.bind(this),
            this.playUISound.bind(this)
        );
        
        // Add character counter for new planet description if mobile
        if (this.isMobile) {
            const planetDesc = planetDiv.querySelector<HTMLTextAreaElement>(`textarea[id^="planet-description-"]`);
            if (planetDesc) {
                this.validationManager.addCharacterCounter(planetDesc, 150);
            }
        }
    }
    
    setupSliderListeners(index: number): void {
        this.formViewManager.setupSliderListeners(index);
    }
    
    updatePlanetNumbers(): void {
        if (!this.planetDescriptions) return;
        this.formViewManager.updatePlanetNumbers(this.planetDescriptions);
    }
    
    async generateSystem(): Promise<void> {
        // Validate inputs
        if (!this.systemNameInput || !this.skyboxDescription) return;
        
        const systemValidation = this.validationManager.validateSystemForm(
            this.systemNameInput, 
            this.skyboxDescription
        );
        
        if (!systemValidation.isValid) {
            this.validationManager.showMobileAlert(systemValidation.message || 'Validation failed', this.playUISound.bind(this) as unknown as null);
            return;
        }
        
        if (!this.planetDescriptions) return;
        
        const planetInputs = this.planetDescriptions.getElementsByClassName('planet-input');
        const planetValidation = this.validationManager.validatePlanetCount(planetInputs);
        
        if (!planetValidation.isValid) {
            this.validationManager.showMobileAlert(planetValidation.message || 'Planet validation failed', this.playUISound.bind(this) as unknown as null);
            return;
        }
        
        // Collect and validate planet data
        const { planets, errors } = this.validationManager.collectPlanetData(planetInputs);
        
        if (errors.length > 0) {
            this.validationManager.showMobileAlert(errors[0], this.playUISound.bind(this) as unknown as null);
            return;
        }
        
        // Show progress UI
        this.previewManager.showProgress('Initializing...');
        this.isGenerating = true;
        
        try {
            // Generate skybox
            this.previewManager.updateGenerationStatus('Generating skybox...');
            if (!this.systemNameInput || !this.skyboxDescription) {
                throw new Error('Missing system input elements');
            }
            
            const skyboxResponse: ApiImageResponse = await this.apiClient.generateSkybox(
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
                
                const planetResponse: ApiImageResponse = await this.apiClient.generatePlanet(planet.name, planet.description);
                
                if (planetResponse.success && planetResponse.image_paths?.length) {
                    this.generatedPlanetUrls.push({
                        name: planet.name,
                        url: planetResponse.image_paths[0]
                    });
                }
            }
            
            // Create system data
            const starClassSelect = document.getElementById('star-class') as HTMLSelectElement | null;
            const starClass = starClassSelect ? starClassSelect.value : 'G';
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
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error generating system:', error);
            this.validationManager.showMobileAlert(
                `Failed to generate system: ${errorMessage}`, 
                this.playUISound.bind(this) as unknown as null
            );
            this.previewManager.hideProgress();
        }
        
        this.isGenerating = false;
    }
    
    travelToSystem(): void {
        if (!this.systemData) {
            this.validationManager.showMobileAlert(
                'No system data available. Please generate a system first.',
                this.playUISound.bind(this) as unknown as null
            );
            return;
        }
        
        try {
            if (!this.starSystemGenerator) {
                throw new Error('Star system generator not available');
            }
            
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
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error traveling to custom system:', error);
            this.validationManager.showMobileAlert(
                `Failed to travel to custom system: ${errorMessage}`,
                this.playUISound.bind(this) as unknown as null
            );
        }
    }
    
    playUISound(): void {
        this.helpers.playUISound();
    }
    
    show(): void {
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
    
    setupMobileShow(): void {
        if (!this.container) return;
        const modalContent = this.container.querySelector<HTMLElement>('.modal-content');
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
    
    setupDesktopShow(): void {
        setTimeout(() => {
            if (this.systemNameInput) {
                this.systemNameInput.focus();
            }
        }, 300);
    }
    
    hide(): void {
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
    
    toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    cleanupBeforeHiding(): void {
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
    
    destroy(): void {
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
