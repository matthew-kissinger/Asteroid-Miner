// customSystemCreator.js - UI for creating custom star systems with AI-generated assets

import { ApiClient } from '../utils/apiClient.js';

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
        this.isMobile = this.detectMobile();
        
        // Initialize UI
        this.createUI();
        this.setupEventHandlers();
        
        // Setup the sliders for the first planet
        this.setupSliderListeners(1);
    }
    
    detectMobile() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0) ||
               (window.innerWidth < 900);
    }
    
    createUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'custom-system-creator';
        this.container.className = 'modal-container';
        this.container.style.display = 'none';
        
        // Create modal content with mobile optimizations
        this.container.innerHTML = `
            <div class="modal-content" style="${this.isMobile ? 'width: 94%; max-height: 85vh; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: 100px; overscroll-behavior: contain;' : ''}">
                <div class="modal-header">
                    <h2>Create New Star System</h2>
                    <button id="close-system-creator" class="close-btn" style="${this.isMobile ? 'font-size: 28px; padding: 12px; min-height: 48px; min-width: 48px;' : ''}">&times;</button>
                </div>
                <div class="modal-body" style="${this.isMobile ? 'padding-bottom: 150px;' : ''}">
                    <div id="system-creator-form">
                        <div class="form-group">
                            <label for="system-name">System Name:</label>
                            <input type="text" id="system-name" placeholder="Enter a name for your star system" style="${this.isMobile ? 'font-size: 16px; padding: 14px; height: 48px;' : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="skybox-description">Skybox Description:</label>
                            <textarea id="skybox-description" rows="${this.isMobile ? '3' : '4'}" placeholder="Describe the skybox/space environment (e.g., 'A vibrant nebula with blue and purple clouds, dotted with bright stars')" style="${this.isMobile ? 'font-size: 16px; padding: 14px;' : ''}"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="star-class">Star Class:</label>
                            <select id="star-class" class="form-control" style="${this.isMobile ? 'font-size: 16px; padding: 14px; height: 48px;' : ''}">
                                <option value="O">O - Blue Giant (Hot, Blue)</option>
                                <option value="B">B - Blue-White</option>
                                <option value="A">A - White</option>
                                <option value="F">F - Yellow-White</option>
                                <option value="G" selected>G - Yellow (Sun-like)</option>
                                <option value="K">K - Orange</option>
                                <option value="M">M - Red Dwarf</option>
                            </select>
                            <p class="help-text">Different star classes affect the lighting and appearance of your system.</p>
                        </div>
                        
                        <div id="planet-descriptions">
                            <div class="form-group planet-input">
                                <h3>Planet 1</h3>
                                <label for="planet-name-1">Planet Name:</label>
                                <input type="text" id="planet-name-1" placeholder="Enter a name for this planet" style="${this.isMobile ? 'font-size: 16px; padding: 14px; height: 48px;' : ''}">
                                
                                <label for="planet-description-1">Planet Description:</label>
                                <textarea id="planet-description-1" rows="${this.isMobile ? '2' : '3'}" placeholder="Describe the planet (e.g., 'A rocky planet with large oceans and ice caps')" style="${this.isMobile ? 'font-size: 16px; padding: 14px;' : ''}"></textarea>
                                
                                <div class="planet-properties">
                                    <div class="property-row">
                                        <label for="planet-size-1">Size:</label>
                                        <input type="range" id="planet-size-1" min="300" max="1000" value="450" class="slider" style="${this.isMobile ? 'height: 30px; margin: 10px 0;' : ''}">
                                        <span class="slider-value" id="planet-size-value-1">450</span>
                                    </div>
                                    
                                    <div class="property-row">
                                        <label for="planet-distance-1">Distance from Star:</label>
                                        <input type="range" id="planet-distance-1" min="4000" max="60000" value="8000" class="slider" style="${this.isMobile ? 'height: 30px; margin: 10px 0;' : ''}">
                                        <span class="slider-value" id="planet-distance-value-1">8000</span>
                                    </div>
                                    
                                    <div class="property-row">
                                        <label for="planet-speed-1">Orbit Speed:</label>
                                        <input type="range" id="planet-speed-1" min="1" max="10" value="5" class="slider" style="${this.isMobile ? 'height: 30px; margin: 10px 0;' : ''}">
                                        <span class="slider-value" id="planet-speed-value-1">0.0015</span>
                                    </div>
                                    
                                    <div class="property-row" style="${this.isMobile ? 'margin-top: 15px;' : ''}">
                                        <label for="planet-rings-1">Has Rings:</label>
                                        <input type="checkbox" id="planet-rings-1" style="${this.isMobile ? 'transform: scale(1.7); margin: 0 15px; min-height: 24px; min-width: 24px;' : ''}">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button id="add-planet-btn" class="secondary-btn" style="${this.isMobile ? 'min-height: 50px; padding: 14px; font-size: 16px; width: 100%; margin: 15px 0;' : ''}">+ Add Another Planet</button>
                        
                        <div class="form-actions">
                            <button id="generate-system-btn" class="primary-btn" style="${this.isMobile ? 'min-height: 54px; padding: 16px; font-size: 18px; margin-top: 20px; width: 100%;' : ''}">Generate System</button>
                        </div>
                    </div>
                    
                    <div id="generation-progress" style="display: none;">
                        <h3>Generating your star system...</h3>
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <p id="generation-status">Initializing...</p>
                    </div>
                    
                    <div id="system-preview" style="display: none;">
                        <h3>Preview</h3>
                        <div class="preview-container" style="${this.isMobile ? 'flex-direction: column;' : ''}">
                            <div class="skybox-preview" style="${this.isMobile ? 'width: 100%; margin-bottom: 20px;' : ''}">
                                <h4>Skybox</h4>
                                <img id="skybox-preview-img" src="" alt="Skybox Preview">
                            </div>
                            <div class="planets-preview" id="planets-preview" style="${this.isMobile ? 'width: 100%;' : ''}">
                                <!-- Planet previews will be added here dynamically -->
                            </div>
                        </div>
                        <div class="form-actions" style="${this.isMobile ? 'padding-bottom: 30px;' : ''}">
                            <button id="travel-to-system-btn" class="primary-btn" style="${this.isMobile ? 'min-height: 54px; padding: 16px; font-size: 18px; width: 100%; margin-top: 20px;' : ''}">Travel to System</button>
                            <button id="regenerate-system-btn" class="secondary-btn" style="${this.isMobile ? 'min-height: 48px; padding: 14px; font-size: 16px; width: 100%; margin-top: 15px;' : ''}">Regenerate</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(this.container);
        
        // Capture references to elements
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
        
        // Add mobile styles
        if (this.isMobile) {
            this.addMobileStyles();
        }
    }
    
    addMobileStyles() {
        // Add CSS for better mobile experience if not already present
        if (!document.getElementById('custom-system-creator-mobile-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-system-creator-mobile-styles';
            style.innerHTML = `
                @media (max-width: 900px) {
                    /* Mobile-specific styles for CustomSystemCreator */
                    #custom-system-creator .modal-content {
                        border-radius: 10px;
                        padding-bottom: 120px;
                    }
                    
                    #custom-system-creator .form-group {
                        margin-bottom: 24px;
                    }
                    
                    #custom-system-creator label {
                        font-size: 16px;
                        margin-bottom: 10px;
                        display: block;
                    }
                    
                    #custom-system-creator .property-row {
                        flex-direction: column;
                        align-items: flex-start;
                        margin-bottom: 20px;
                    }
                    
                    #custom-system-creator .property-row label {
                        margin-bottom: 10px;
                        width: 100%;
                    }
                    
                    #custom-system-creator .slider {
                        width: 100%;
                        margin: 10px 0;
                    }
                    
                    #custom-system-creator .slider-value {
                        margin-top: 5px;
                        align-self: flex-end;
                    }
                    
                    #custom-system-creator .planet-input {
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    
                    #custom-system-creator input[type="text"],
                    #custom-system-creator textarea,
                    #custom-system-creator select {
                        font-size: 16px !important;
                        padding: 14px !important;
                    }
                    
                    #custom-system-creator .planet-preview {
                        flex: 0 0 100%;
                        margin-bottom: 15px;
                    }
                    
                    #custom-system-creator .form-actions {
                        text-align: center;
                    }
                    
                    /* Better slider for touch */
                    #custom-system-creator input[type="range"] {
                        -webkit-appearance: none;
                        height: 30px;
                        background: #0d1e2f;
                        border-radius: 15px;
                        padding: 0;
                        outline: none;
                    }
                    
                    #custom-system-creator input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: #4a9dff;
                        cursor: pointer;
                    }
                    
                    #custom-system-creator input[type="range"]::-moz-range-thumb {
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: #4a9dff;
                        cursor: pointer;
                        border: none;
                    }
                    
                    /* Touch ripple effect for buttons */
                    .ripple {
                        position: relative;
                        overflow: hidden;
                        transform: translate3d(0, 0, 0);
                    }
                    
                    .ripple:after {
                        content: "";
                        display: block;
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        top: 0;
                        left: 0;
                        pointer-events: none;
                        background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
                        background-repeat: no-repeat;
                        background-position: 50%;
                        transform: scale(10, 10);
                        opacity: 0;
                        transition: transform .5s, opacity 1s;
                    }
                    
                    .ripple:active:after {
                        transform: scale(0, 0);
                        opacity: .3;
                        transition: 0s;
                    }
                    
                    /* Character counter for text areas */
                    .char-counter {
                        font-size: 12px;
                        color: #aaa;
                        text-align: right;
                        margin-top: 5px;
                    }
                    
                    .char-counter.warning {
                        color: #ff9900;
                    }
                    
                    .char-counter.error {
                        color: #ff3030;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add ripple effect to all buttons
        this.addRippleEffect();
        
        // Add character counters to textareas
        this.addCharacterCounters();
    }
    
    // Add ripple effect to buttons for better touch feedback
    addRippleEffect() {
        if (!this.isMobile) return;
        
        const buttons = this.container.querySelectorAll('button');
        buttons.forEach(button => {
            if (!button.classList.contains('ripple')) {
                button.classList.add('ripple');
            }
        });
    }
    
    // Add character counters to textareas
    addCharacterCounters() {
        if (!this.isMobile) return;
        
        // Skybox description
        this.addCharacterCounter(this.skyboxDescription, 250);
        
        // Add counter to first planet and set up event listener for future planets
        const firstPlanetDesc = document.getElementById('planet-description-1');
        if (firstPlanetDesc) {
            this.addCharacterCounter(firstPlanetDesc, 150);
        }
    }
    
    // Helper function to add character counter to a text area
    addCharacterCounter(textarea, maxChars) {
        if (!textarea) return;
        
        // Create counter element
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        
        // Update counter text
        const updateCounter = () => {
            const remaining = maxChars - textarea.value.length;
            counter.textContent = `${remaining} characters remaining`;
            
            // Change color based on remaining characters
            counter.className = 'char-counter';
            if (remaining < 30) {
                counter.classList.add('warning');
            }
            if (remaining < 10) {
                counter.classList.add('error');
            }
            
            // Enforce character limit
            if (remaining < 0) {
                textarea.value = textarea.value.substring(0, maxChars);
                counter.textContent = "0 characters remaining";
            }
        };
        
        // Add event listeners
        textarea.addEventListener('input', updateCounter);
        textarea.addEventListener('keydown', (e) => {
            // Allow deletion even at max characters
            if (textarea.value.length >= maxChars && 
                e.key !== 'Backspace' && 
                e.key !== 'Delete' && 
                e.key !== 'ArrowLeft' && 
                e.key !== 'ArrowRight' &&
                !e.ctrlKey && 
                !e.metaKey) {
                e.preventDefault();
            }
        });
        
        // Set initial counter
        updateCounter();
        
        // Add counter after textarea
        textarea.parentNode.insertBefore(counter, textarea.nextSibling);
        
        // Set maxlength attribute (fallback)
        textarea.setAttribute('maxlength', maxChars.toString());
    }
    
    setupEventHandlers() {
        // Close button
        const closeBtn = document.getElementById('close-system-creator');
        closeBtn.addEventListener('click', () => {
            this.hide();
            this.playUISound();
        });
        
        // For mobile, add touch event listener with sound
        if (this.isMobile) {
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.hide();
                this.playUISound();
            });
            
            // Ensure scrolling works by fixing container event handling
            this.container.addEventListener('touchmove', (e) => {
                // Allow default touchmove behavior (scrolling)
                e.stopPropagation();
            }, { passive: true });
            
            // Improve scroll performance
            const modalContent = this.container.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('touchstart', () => {}, { passive: true });
                modalContent.addEventListener('touchmove', () => {}, { passive: true });
            }
        }
        
        // Add Planet button
        this.addPlanetBtn.addEventListener('click', () => {
            this.addPlanetInput();
            this.playUISound();
        });
        
        if (this.isMobile) {
            this.addPlanetBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.addPlanetInput();
                this.playUISound();
            });
        }
        
        // Generate System button
        this.generateSystemBtn.addEventListener('click', () => {
            this.generateSystem();
            this.playUISound();
        });
        
        if (this.isMobile) {
            this.generateSystemBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.generateSystem();
                this.playUISound();
            });
        }
        
        // Travel to System button
        this.travelToSystemBtn.addEventListener('click', () => {
            this.travelToSystem();
            this.playUISound();
        });
        
        if (this.isMobile) {
            this.travelToSystemBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.travelToSystem();
                this.playUISound();
            });
        }
        
        // Regenerate button
        this.regenerateSystemBtn.addEventListener('click', () => {
            this.systemPreview.style.display = 'none';
            this.systemForm.style.display = 'block';
            this.playUISound();
        });
        
        if (this.isMobile) {
            this.regenerateSystemBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.systemPreview.style.display = 'none';
                this.systemForm.style.display = 'block';
                this.playUISound();
            });
        }
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
        
        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
        
        // Handle mobile touch start on container to properly manage touch events
        if (this.isMobile) {
            this.container.addEventListener('touchstart', (e) => {
                // Only close if the touch is directly on the container background
                if (e.target === this.container) {
                    e.preventDefault();
                    this.hide();
                }
            }, { passive: false });
        }
    }
    
    addPlanetInput() {
        const planetInputs = this.planetDescriptions.getElementsByClassName('planet-input');
        const newIndex = planetInputs.length + 1;
        
        const planetDiv = document.createElement('div');
        planetDiv.className = 'form-group planet-input';
        planetDiv.innerHTML = `
            <h3>Planet ${newIndex}</h3>
            <label for="planet-name-${newIndex}">Planet Name:</label>
            <input type="text" id="planet-name-${newIndex}" placeholder="Enter a name for this planet" style="${this.isMobile ? 'font-size: 16px; padding: 14px; height: 48px;' : ''}">
            
            <label for="planet-description-${newIndex}">Planet Description:</label>
            <textarea id="planet-description-${newIndex}" rows="${this.isMobile ? '2' : '3'}" placeholder="Describe the planet (e.g., 'A rocky planet with large oceans and ice caps')" style="${this.isMobile ? 'font-size: 16px; padding: 14px;' : ''}" maxlength="150"></textarea>
            
            <div class="planet-properties">
                <div class="property-row">
                    <label for="planet-size-${newIndex}">Size:</label>
                    <input type="range" id="planet-size-${newIndex}" min="300" max="1000" value="450" class="slider" style="${this.isMobile ? 'height: 30px; margin: 10px 0;' : ''}">
                    <span class="slider-value" id="planet-size-value-${newIndex}">450</span>
                </div>
                
                <div class="property-row">
                    <label for="planet-distance-${newIndex}">Distance from Star:</label>
                    <input type="range" id="planet-distance-${newIndex}" min="4000" max="60000" value="${4000 + newIndex * 6000}" class="slider" style="${this.isMobile ? 'height: 30px; margin: 10px 0;' : ''}">
                    <span class="slider-value" id="planet-distance-value-${newIndex}">${4000 + newIndex * 6000}</span>
                </div>
                
                <div class="property-row">
                    <label for="planet-speed-${newIndex}">Orbit Speed:</label>
                    <input type="range" id="planet-speed-${newIndex}" min="1" max="10" value="5" class="slider" style="${this.isMobile ? 'height: 30px; margin: 10px 0;' : ''}">
                    <span class="slider-value" id="planet-speed-value-${newIndex}">0.0015</span>
                </div>
                
                <div class="property-row" style="${this.isMobile ? 'margin-top: 15px;' : ''}">
                    <label for="planet-rings-${newIndex}">Has Rings:</label>
                    <input type="checkbox" id="planet-rings-${newIndex}" style="${this.isMobile ? 'transform: scale(1.7); margin: 0 15px; min-height: 24px; min-width: 24px;' : ''}">
                </div>
            </div>
            
            <button class="remove-planet-btn danger-btn ${this.isMobile ? 'ripple' : ''}" style="${this.isMobile ? 'min-height: 50px; padding: 14px; font-size: 16px; right: 15px; top: 15px;' : ''}">Remove</button>
        `;
        
        this.planetDescriptions.appendChild(planetDiv);
        
        // Set up event listeners for the sliders
        this.setupSliderListeners(newIndex);
        
        // Add event listener to remove button
        const removeBtn = planetDiv.querySelector('.remove-planet-btn');
        removeBtn.addEventListener('click', () => {
            planetDiv.remove();
            this.updatePlanetNumbers();
            this.playUISound();
        });
        
        // Add touch-specific event handlers for mobile
        if (this.isMobile) {
            removeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                planetDiv.remove();
                this.updatePlanetNumbers();
                this.playUISound();
            });
            
            // Also add touch events to sliders for better mobile interaction
            const sliders = planetDiv.querySelectorAll('input[type="range"]');
            sliders.forEach(slider => {
                slider.addEventListener('touchstart', () => {
                    // Add active class for visual feedback
                    slider.classList.add('slider-active');
                });
                
                slider.addEventListener('touchend', () => {
                    // Remove active class when touch ends
                    slider.classList.remove('slider-active');
                });
            });
            
            // Add character counter to the new planet's description
            const planetDesc = planetDiv.querySelector(`textarea[id^="planet-description-"]`);
            if (planetDesc) {
                this.addCharacterCounter(planetDesc, 150);
            }
        }
        
        // If on mobile, scroll to the new planet section with improved handling
        if (this.isMobile) {
            // Clear any existing scroll timeout
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            
            // Use a safer scrolling approach that won't freeze the UI
            this.scrollTimeout = setTimeout(() => {
                try {
                    const modalContent = this.container.querySelector('.modal-content');
                    const newPlanet = this.planetDescriptions.lastElementChild;
                    
                    if (modalContent && newPlanet) {
                        // Calculate scroll position
                        const planetPos = newPlanet.offsetTop;
                        const scrollPos = planetPos - (modalContent.clientHeight / 4);
                        
                        // Use manual scrolling instead of scrollIntoView for better control
                        modalContent.scrollTo({
                            top: scrollPos,
                            behavior: 'smooth'
                        });
                    }
                } catch (err) {
                    console.warn("Error during scroll:", err);
                }
            }, 100);
        }
    }
    
    setupSliderListeners(index) {
        // Size slider
        const sizeSlider = document.getElementById(`planet-size-${index}`);
        const sizeValue = document.getElementById(`planet-size-value-${index}`);
        
        sizeSlider.addEventListener('input', () => {
            sizeValue.textContent = sizeSlider.value;
        });
        
        // Distance slider
        const distanceSlider = document.getElementById(`planet-distance-${index}`);
        const distanceValue = document.getElementById(`planet-distance-value-${index}`);
        
        distanceSlider.addEventListener('input', () => {
            distanceValue.textContent = distanceSlider.value;
        });
        
        // Speed slider
        const speedSlider = document.getElementById(`planet-speed-${index}`);
        const speedValue = document.getElementById(`planet-speed-value-${index}`);
        
        speedSlider.addEventListener('input', () => {
            // Convert 1-10 range to 0.001-0.002 range
            const speed = 0.001 + (speedSlider.value - 1) * (0.001 / 9);
            speedValue.textContent = speed.toFixed(4);
        });
        
        // For mobile, add visual feedback
        if (this.isMobile) {
            const sliders = [sizeSlider, distanceSlider, speedSlider];
            sliders.forEach(slider => {
                slider.addEventListener('touchstart', () => {
                    // Add active class for visual feedback
                    slider.classList.add('slider-active');
                });
                
                slider.addEventListener('touchend', () => {
                    // Remove active class when touch ends
                    slider.classList.remove('slider-active');
                });
            });
        }
    }
    
    updatePlanetNumbers() {
        const planetInputs = this.planetDescriptions.getElementsByClassName('planet-input');
        for (let i = 0; i < planetInputs.length; i++) {
            const planetDiv = planetInputs[i];
            const planetHeader = planetDiv.querySelector('h3');
            planetHeader.textContent = `Planet ${i + 1}`;
        }
    }
    
    async generateSystem() {
        // Validate inputs
        const systemName = this.systemNameInput.value.trim();
        const skyboxDesc = this.skyboxDescription.value.trim();
        const starClass = document.getElementById('star-class').value;
        
        if (!systemName || !skyboxDesc) {
            this.showMobileAlert('Please enter a system name and skybox description.');
            return;
        }
        
        // Show progress UI
        this.systemForm.style.display = 'none';
        this.generationProgress.style.display = 'block';
        this.isGenerating = true;
        
        try {
            // Check for auth token or get one
            if (!this.apiClient.hasValidToken()) {
                this.updateGenerationStatus('Authenticating...');
                await this.apiClient.getToken();
            }
            
            // Generate skybox
            this.updateGenerationStatus('Generating skybox...');
            const skyboxResponse = await this.apiClient.generateSkybox(systemName, skyboxDesc);
            
            if (!skyboxResponse.success) {
                throw new Error(skyboxResponse.message || 'Failed to generate skybox');
            }
            
            if (!skyboxResponse.image_paths || skyboxResponse.image_paths.length === 0) {
                throw new Error('No skybox images were generated');
            }
            
            this.generatedSkyboxUrl = skyboxResponse.image_paths[0];
            
            // Collect planet data
            const planets = [];
            const planetInputs = this.planetDescriptions.getElementsByClassName('planet-input');
            
            for (let i = 0; i < planetInputs.length; i++) {
                const planetDiv = planetInputs[i];
                const planetIndex = i + 1;
                
                const nameInput = planetDiv.querySelector(`input[id^="planet-name-"]`);
                const descInput = planetDiv.querySelector(`textarea[id^="planet-description-"]`);
                const sizeInput = planetDiv.querySelector(`input[id^="planet-size-"]`);
                const distanceInput = planetDiv.querySelector(`input[id^="planet-distance-"]`);
                const speedInput = planetDiv.querySelector(`input[id^="planet-speed-"]`);
                const ringsInput = planetDiv.querySelector(`input[id^="planet-rings-"]`);
                
                const planetName = nameInput.value.trim();
                const planetDesc = descInput.value.trim();
                
                if (planetName && planetDesc) {
                    // Calculate speed from slider (1-10 to 0.001-0.002)
                    const speedValue = parseFloat(speedInput.value);
                    const orbitSpeed = 0.001 + (speedValue - 1) * (0.001 / 9);
                    
                    planets.push({ 
                        name: planetName, 
                        description: planetDesc,
                        size: parseInt(sizeInput.value),
                        distance: parseInt(distanceInput.value),
                        speed: orbitSpeed,
                        rings: ringsInput.checked
                    });
                }
            }
            
            // Generate planets
            this.generatedPlanetUrls = [];
            for (let i = 0; i < planets.length; i++) {
                const planet = planets[i];
                this.updateGenerationStatus(`Generating planet ${i+1} of ${planets.length}: ${planet.name}...`);
                
                const planetResponse = await this.apiClient.generatePlanet(planet.name, planet.description);
                
                if (planetResponse.success && planetResponse.image_paths && planetResponse.image_paths.length > 0) {
                    this.generatedPlanetUrls.push({
                        name: planet.name,
                        url: planetResponse.image_paths[0]
                    });
                }
            }
            
            // Create system data
            this.systemData = {
                id: `Custom-${Date.now()}`,
                name: systemName,
                starClass: starClass,
                classification: 'Custom',
                description: `Custom star system with ${planets.length} planets`,
                skyboxUrl: this.generatedSkyboxUrl,
                // Add light intensity multiplier to reduce brightness by 20%
                lightIntensityMultiplier: 0.8,
                planetData: planets.map((planet, i) => {
                    return {
                        name: planet.name,
                        textureUrl: this.generatedPlanetUrls[i]?.url || null,
                        // Use the custom planet properties
                        size: planet.size,
                        distance: planet.distance,
                        speed: planet.speed,
                        color: this.getStarColorForClass(starClass),
                        rings: planet.rings
                    };
                })
            };
            
            // Show preview
            this.showSystemPreview();
            
        } catch (error) {
            console.error('Error generating system:', error);
            this.showMobileAlert(`Failed to generate system: ${error.message}`);
            this.generationProgress.style.display = 'none';
            this.systemForm.style.display = 'block';
        }
        
        this.isGenerating = false;
    }
    
    showSystemPreview() {
        // Update skybox preview
        if (this.generatedSkyboxUrl) {
            this.skyboxPreviewImg.src = this.apiClient.getFullImageUrl(this.generatedSkyboxUrl);
        }
        
        // Update planet previews
        this.planetsPreview.innerHTML = '';
        this.generatedPlanetUrls.forEach(planet => {
            const planetDiv = document.createElement('div');
            planetDiv.className = 'planet-preview';
            planetDiv.innerHTML = `
                <h4>${planet.name}</h4>
                <img src="${this.apiClient.getFullImageUrl(planet.url)}" alt="${planet.name}">
            `;
            this.planetsPreview.appendChild(planetDiv);
        });
        
        // Show preview UI
        this.generationProgress.style.display = 'none';
        this.systemPreview.style.display = 'block';
        
        // If on mobile, scroll to top of preview
        if (this.isMobile) {
            setTimeout(() => {
                this.systemPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }
    }
    
    travelToSystem() {
        if (!this.systemData) {
            this.showMobileAlert('No system data available. Please generate a system first.');
            return;
        }
        
        try {
            // Add the custom system to the star system generator
            const success = this.starSystemGenerator.addCustomSystem(this.systemData);
            
            if (!success) {
                throw new Error('Failed to add custom system');
            }
            
            // Hide UI
            this.hide();
            
            // Travel to the new system
            if (this.environment && this.environment.travelToSystem) {
                this.environment.travelToSystem(this.systemData.id);
            } else {
                console.error('Environment or travelToSystem method not available');
            }
            
        } catch (error) {
            console.error('Error traveling to custom system:', error);
            this.showMobileAlert(`Failed to travel to custom system: ${error.message}`);
        }
    }
    
    updateGenerationStatus(message) {
        if (this.generationStatus) {
            this.generationStatus.textContent = message;
            console.log('Generation status:', message);
        }
    }
    
    getStarColorForClass(starClass) {
        // Star colors based on spectral classification
        const colors = {
            'O': 0x9bb0ff, // Blue
            'B': 0xaabfff, // Blue-white
            'A': 0xcad7ff, // White
            'F': 0xf8f7ff, // Yellow-white
            'G': 0xfff4ea, // Yellow (like our sun)
            'K': 0xffd2a1, // Orange
            'M': 0xffcc6f  // Red
        };
        
        return colors[starClass] || 0xfff4ea; // Default to G-class if undefined
    }
    
    // Mobile-friendly alert that doesn't block UI thread
    showMobileAlert(message) {
        if (this.isMobile) {
            // Create a custom alert overlay for mobile
            const alertOverlay = document.createElement('div');
            alertOverlay.style.position = 'fixed';
            alertOverlay.style.top = '0';
            alertOverlay.style.left = '0';
            alertOverlay.style.width = '100%';
            alertOverlay.style.height = '100%';
            alertOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            alertOverlay.style.display = 'flex';
            alertOverlay.style.justifyContent = 'center';
            alertOverlay.style.alignItems = 'center';
            alertOverlay.style.zIndex = '10000';
            
            const alertBox = document.createElement('div');
            alertBox.style.backgroundColor = '#0a1a2a';
            alertBox.style.color = '#c5d8f1';
            alertBox.style.padding = '20px';
            alertBox.style.borderRadius = '10px';
            alertBox.style.maxWidth = '80%';
            alertBox.style.textAlign = 'center';
            alertBox.style.border = '2px solid #2c5a8c';
            
            const messageEl = document.createElement('p');
            messageEl.textContent = message;
            messageEl.style.marginBottom = '20px';
            messageEl.style.fontSize = '16px';
            
            const okButton = document.createElement('button');
            okButton.textContent = 'OK';
            okButton.style.padding = '12px 30px';
            okButton.style.fontSize = '16px';
            okButton.style.backgroundColor = '#2c5a8c';
            okButton.style.color = 'white';
            okButton.style.border = 'none';
            okButton.style.borderRadius = '5px';
            okButton.style.minHeight = '48px';
            okButton.style.minWidth = '120px';
            
            alertBox.appendChild(messageEl);
            alertBox.appendChild(okButton);
            alertOverlay.appendChild(alertBox);
            document.body.appendChild(alertOverlay);
            
            // Play sound if available
            this.playUISound();
            
            // Handle button click and touch
            okButton.addEventListener('click', () => {
                document.body.removeChild(alertOverlay);
            });
            
            okButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                document.body.removeChild(alertOverlay);
                this.playUISound();
            });
            
        } else {
            // Fall back to regular alert for desktop
            alert(message);
        }
    }
    
    playUISound() {
        // Play UI sound if audio is available
        if (window.game && window.game.audio) {
            window.game.audio.playSound('boink');
        }
    }
    
    show() {
        if (this.container) {
            // Reset any previous state
            this.cleanupBeforeHiding();
            
            this.container.style.display = 'flex';
            this.isVisible = true;
            
            // Reset UI state
            this.systemForm.style.display = 'block';
            this.generationProgress.style.display = 'none';
            this.systemPreview.style.display = 'none';
            
            // Play sound if available
            this.playUISound();
            
            // For mobile, ensure scrolling works properly
            if (this.isMobile) {
                // Enable proper scrolling
                const modalContent = this.container.querySelector('.modal-content');
                if (modalContent) {
                    // Reset scroll position to top
                    modalContent.scrollTop = 0;
                    
                    // Ensure overflow settings are correct
                    modalContent.style.overflowY = 'auto';
                    modalContent.style.webkitOverflowScrolling = 'touch';
                    modalContent.style.overscrollBehavior = 'contain';
                }
                
                // Add body class to prevent background scrolling
                document.body.classList.add('modal-open');
                
                // Delayed focus to avoid iOS keyboard issues
                this.scrollTimeout = setTimeout(() => {
                    if (this.systemNameInput) {
                        this.systemNameInput.focus();
                    }
                }, 300);
            } else {
                // Focus on system name input
                setTimeout(() => {
                    if (this.systemNameInput) {
                        this.systemNameInput.focus();
                    }
                }, 300);
            }
            
            // Add CSS for the modal-open class if it doesn't exist
            if (!document.getElementById('modal-open-style') && this.isMobile) {
                const style = document.createElement('style');
                style.id = 'modal-open-style';
                style.textContent = `
                    .modal-open {
                        overflow: hidden;
                        position: fixed;
                        width: 100%;
                        height: 100%;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Restore custom styles which were removed in previous edit
            if (!document.getElementById('custom-system-creator-styles')) {
                const style = document.createElement('style');
                style.id = 'custom-system-creator-styles';
                style.textContent = `
                    .property-row {
                        display: flex;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    
                    .property-row label {
                        flex: 0 0 150px;
                        margin-right: 10px;
                    }
                    
                    .property-row .slider {
                        flex: 1;
                        height: 10px;
                        background: #2a2a2a;
                        outline: none;
                        border-radius: 5px;
                    }
                    
                    .property-row .slider-value {
                        flex: 0 0 60px;
                        margin-left: 10px;
                        text-align: right;
                    }
                    
                    .planet-properties {
                        background: rgba(0, 0, 0, 0.2);
                        padding: 15px;
                        border-radius: 5px;
                        margin-top: 10px;
                        margin-bottom: 15px;
                    }
                    
                    .help-text {
                        font-size: 12px;
                        color: #aaa;
                        margin-top: 5px;
                    }
                    
                    select.form-control {
                        width: 100%;
                        padding: 8px;
                        border-radius: 4px;
                        background: #25303e;
                        color: white;
                        border: 1px solid #3a5472;
                    }
                    
                    /* Active slider styles */
                    .slider-active {
                        background: #3a5472 !important;
                    }
                    
                    /* Add smooth transitions */
                    #custom-system-creator button {
                        transition: all 0.2s ease;
                    }
                    
                    #custom-system-creator button:active {
                        transform: scale(0.95);
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
    
    hide() {
        if (this.container && !this.isGenerating) {
            // Stop any ongoing processes
            this.cleanupBeforeHiding();
            
            this.container.style.display = 'none';
            this.isVisible = false;
            
            // Play sound if available
            this.playUISound();
            
            // Show the stargate UI when closing the custom system creator
            // Similar to how StarMap does it
            setTimeout(() => {
                if (window.game && window.game.ui && window.game.ui.stargateInterface) {
                    console.log("CustomSystemCreator: Returning to stargate UI");
                    window.game.ui.stargateInterface.showStargateUI();
                } else {
                    // Direct DOM access as last resort
                    const stargateUI = document.getElementById('stargate-ui');
                    if (stargateUI) {
                        stargateUI.style.display = 'block';
                        console.log("CustomSystemCreator: Showed stargate UI via direct DOM access");
                    } else {
                        console.warn("CustomSystemCreator: Could not find stargate UI to return to");
                    }
                }
            }, 100); // Short delay to ensure state is settled
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    // Add a new method to handle cleanup before hiding
    cleanupBeforeHiding() {
        // Reset form state if needed
        if (this.isGenerating) {
            this.isGenerating = false;
            this.generationProgress.style.display = 'none';
            this.systemForm.style.display = 'block';
        }
        
        // Cancel any pending animations/scrolls
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
        
        // Ensure we're not in transition state
        document.body.style.pointerEvents = 'auto';
        
        // Force release any touch captures (helps with freezing issues)
        if (this.isMobile) {
            document.body.style.touchAction = 'auto';
            
            // Force redraw to clear any pending UI states
            this.container.style.display = 'none';
            void this.container.offsetHeight; // Force reflow
        }
    }
    
    // Add method to clean up when component is destroyed
    destroy() {
        // Clean up any event listeners or resources
        this.cleanupBeforeHiding();
        
        // Remove modal-open class if it was added
        document.body.classList.remove('modal-open');
        
        // Remove from DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
} 