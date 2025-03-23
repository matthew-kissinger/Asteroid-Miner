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
        
        // Initialize UI
        this.createUI();
        this.setupEventHandlers();
        
        // Setup the sliders for the first planet
        this.setupSliderListeners(1);
    }
    
    createUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'custom-system-creator';
        this.container.className = 'modal-container';
        this.container.style.display = 'none';
        
        // Create modal content
        this.container.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Star System</h2>
                    <button id="close-system-creator" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="system-creator-form">
                        <div class="form-group">
                            <label for="system-name">System Name:</label>
                            <input type="text" id="system-name" placeholder="Enter a name for your star system">
                        </div>
                        
                        <div class="form-group">
                            <label for="skybox-description">Skybox Description:</label>
                            <textarea id="skybox-description" rows="4" placeholder="Describe the skybox/space environment (e.g., 'A vibrant nebula with blue and purple clouds, dotted with bright stars')"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="star-class">Star Class:</label>
                            <select id="star-class" class="form-control">
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
                                <input type="text" id="planet-name-1" placeholder="Enter a name for this planet">
                                
                                <label for="planet-description-1">Planet Description:</label>
                                <textarea id="planet-description-1" rows="3" placeholder="Describe the planet (e.g., 'A rocky planet with large oceans and ice caps')"></textarea>
                                
                                <div class="planet-properties">
                                    <div class="property-row">
                                        <label for="planet-size-1">Size:</label>
                                        <input type="range" id="planet-size-1" min="300" max="1000" value="450" class="slider">
                                        <span class="slider-value" id="planet-size-value-1">450</span>
                                    </div>
                                    
                                    <div class="property-row">
                                        <label for="planet-distance-1">Distance from Star:</label>
                                        <input type="range" id="planet-distance-1" min="4000" max="60000" value="8000" class="slider">
                                        <span class="slider-value" id="planet-distance-value-1">8000</span>
                                    </div>
                                    
                                    <div class="property-row">
                                        <label for="planet-speed-1">Orbit Speed:</label>
                                        <input type="range" id="planet-speed-1" min="1" max="10" value="5" class="slider">
                                        <span class="slider-value" id="planet-speed-value-1">0.0015</span>
                                    </div>
                                    
                                    <div class="property-row">
                                        <label for="planet-rings-1">Has Rings:</label>
                                        <input type="checkbox" id="planet-rings-1">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button id="add-planet-btn" class="secondary-btn">+ Add Another Planet</button>
                        
                        <div class="form-actions">
                            <button id="generate-system-btn" class="primary-btn">Generate System</button>
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
                        <div class="preview-container">
                            <div class="skybox-preview">
                                <h4>Skybox</h4>
                                <img id="skybox-preview-img" src="" alt="Skybox Preview">
                            </div>
                            <div class="planets-preview" id="planets-preview">
                                <!-- Planet previews will be added here dynamically -->
                            </div>
                        </div>
                        <div class="form-actions">
                            <button id="travel-to-system-btn" class="primary-btn">Travel to System</button>
                            <button id="regenerate-system-btn" class="secondary-btn">Regenerate</button>
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
    }
    
    setupEventHandlers() {
        // Close button
        document.getElementById('close-system-creator').addEventListener('click', () => {
            this.hide();
        });
        
        // Add Planet button
        this.addPlanetBtn.addEventListener('click', () => {
            this.addPlanetInput();
        });
        
        // Generate System button
        this.generateSystemBtn.addEventListener('click', () => {
            this.generateSystem();
        });
        
        // Travel to System button
        this.travelToSystemBtn.addEventListener('click', () => {
            this.travelToSystem();
        });
        
        // Regenerate button
        this.regenerateSystemBtn.addEventListener('click', () => {
            this.systemPreview.style.display = 'none';
            this.systemForm.style.display = 'block';
        });
        
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
    }
    
    addPlanetInput() {
        const planetInputs = this.planetDescriptions.getElementsByClassName('planet-input');
        const newIndex = planetInputs.length + 1;
        
        const planetDiv = document.createElement('div');
        planetDiv.className = 'form-group planet-input';
        planetDiv.innerHTML = `
            <h3>Planet ${newIndex}</h3>
            <label for="planet-name-${newIndex}">Planet Name:</label>
            <input type="text" id="planet-name-${newIndex}" placeholder="Enter a name for this planet">
            
            <label for="planet-description-${newIndex}">Planet Description:</label>
            <textarea id="planet-description-${newIndex}" rows="3" placeholder="Describe the planet (e.g., 'A rocky planet with large oceans and ice caps')"></textarea>
            
            <div class="planet-properties">
                <div class="property-row">
                    <label for="planet-size-${newIndex}">Size:</label>
                    <input type="range" id="planet-size-${newIndex}" min="300" max="1000" value="450" class="slider">
                    <span class="slider-value" id="planet-size-value-${newIndex}">450</span>
                </div>
                
                <div class="property-row">
                    <label for="planet-distance-${newIndex}">Distance from Star:</label>
                    <input type="range" id="planet-distance-${newIndex}" min="4000" max="60000" value="${4000 + newIndex * 6000}" class="slider">
                    <span class="slider-value" id="planet-distance-value-${newIndex}">${4000 + newIndex * 6000}</span>
                </div>
                
                <div class="property-row">
                    <label for="planet-speed-${newIndex}">Orbit Speed:</label>
                    <input type="range" id="planet-speed-${newIndex}" min="1" max="10" value="5" class="slider">
                    <span class="slider-value" id="planet-speed-value-${newIndex}">0.0015</span>
                </div>
                
                <div class="property-row">
                    <label for="planet-rings-${newIndex}">Has Rings:</label>
                    <input type="checkbox" id="planet-rings-${newIndex}">
                </div>
            </div>
            
            <button class="remove-planet-btn danger-btn">Remove</button>
        `;
        
        this.planetDescriptions.appendChild(planetDiv);
        
        // Set up event listeners for the sliders
        this.setupSliderListeners(newIndex);
        
        // Add event listener to remove button
        planetDiv.querySelector('.remove-planet-btn').addEventListener('click', () => {
            planetDiv.remove();
            // Update planet numbers
            this.updatePlanetNumbers();
        });
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
            alert('Please enter a system name and skybox description.');
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
            alert(`Failed to generate system: ${error.message}`);
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
    }
    
    travelToSystem() {
        if (!this.systemData) {
            alert('No system data available. Please generate a system first.');
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
            alert(`Failed to travel to custom system: ${error.message}`);
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
    
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            this.isVisible = true;
            
            // Reset UI state
            this.systemForm.style.display = 'block';
            this.generationProgress.style.display = 'none';
            this.systemPreview.style.display = 'none';
            
            // Inject CSS for new UI elements if it doesn't exist
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
                `;
                document.head.appendChild(style);
            }
        }
    }
    
    hide() {
        if (this.container && !this.isGenerating) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
} 