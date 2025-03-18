// settings.js - Handles game settings and performance options

export class Settings {
    constructor(game) {
        this.game = game;
        this.mothershipInterface = null;
        this.isVisible = false;
        
        // Default settings
        this.settings = {
            graphicalQuality: 'medium',    // low, medium, high
            postProcessing: true,          // true, false
            asteroidDetail: 'medium',      // low, medium, high
            lightingQuality: 'medium',     // low, medium, high
            particleEffects: 'medium',     // low, medium, high
            resolutionScale: 'medium',     // low, medium, high
            frameRateCap: 60,              // 30, 60, 0 (unlimited)
            showFPS: false,                // Show FPS counter
            spatialAudio: true,            // Enable spatial audio
            autoQuality: true              // Automatically adjust quality based on performance
        };
        
        // Load settings from localStorage if available
        this.loadSettings();
        
        // Create settings UI
        this.setupSettingsUI();
        
        // Apply initial settings
        this.applyAllSettings();
        
        // Apply initial FPS display visibility
        setTimeout(() => this.applyUISettings(), 100);
    }
    
    setMothershipInterface(mothershipInterface) {
        this.mothershipInterface = mothershipInterface;
    }
    
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('asteroidMinerSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Merge saved settings with defaults
                this.settings = {...this.settings, ...parsedSettings};
                console.log("Settings loaded from localStorage:", this.settings);
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('asteroidMinerSettings', JSON.stringify(this.settings));
            console.log("Settings saved to localStorage");
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    }
    
    setupSettingsUI() {
        // Create settings container
        const settingsContainer = document.createElement('div');
        settingsContainer.id = 'settings-container';
        settingsContainer.style.position = 'absolute';
        settingsContainer.style.top = '50%';
        settingsContainer.style.left = '50%';
        settingsContainer.style.transform = 'translate(-50%, -50%)';
        settingsContainer.style.width = '700px';
        settingsContainer.style.maxHeight = '90vh';
        settingsContainer.style.overflowY = 'auto';
        settingsContainer.style.backgroundColor = 'rgba(20, 30, 50, 0.9)';
        settingsContainer.style.color = '#fff';
        settingsContainer.style.padding = '30px';
        settingsContainer.style.borderRadius = '15px';
        settingsContainer.style.border = '2px solid #33aaff';
        settingsContainer.style.boxShadow = '0 0 30px #33aaff';
        settingsContainer.style.fontFamily = 'Courier New, monospace';
        settingsContainer.style.zIndex = '1000';
        settingsContainer.style.display = 'none';
        
        // Create settings content
        settingsContainer.innerHTML = `
            <h2 style="text-align: center; color: #33aaff; margin-top: 0;">GAME SETTINGS</h2>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px;">GRAPHICS SETTINGS</h3>
                
                <!-- Graphical Quality Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Graphical Quality</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Affects overall visual fidelity and performance</p>
                    </div>
                    <div>
                        <select id="graphical-quality" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: 8px; border-radius: 5px;">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <!-- Post-processing Effects Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Post-processing Effects</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Bloom, anti-aliasing, and visual effects</p>
                    </div>
                    <div>
                        <label class="toggle" style="display: inline-block; position: relative; width: 60px; height: 30px;">
                            <input type="checkbox" id="post-processing" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: 15px; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
                
                <!-- Asteroid Detail Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Asteroid Detail</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Affects asteroid count and model complexity</p>
                    </div>
                    <div>
                        <select id="asteroid-detail" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: 8px; border-radius: 5px;">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <!-- Lighting Quality Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Lighting Quality</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Affects light sources and shadows</p>
                    </div>
                    <div>
                        <select id="lighting-quality" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: 8px; border-radius: 5px;">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <!-- Particle Effects Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Particle Effects</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Affects thruster, explosion, and other particle effects</p>
                    </div>
                    <div>
                        <select id="particle-effects" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: 8px; border-radius: 5px;">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <!-- Resolution Scale Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Resolution Scale</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Adjusts rendering resolution</p>
                    </div>
                    <div>
                        <select id="resolution-scale" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: 8px; border-radius: 5px;">
                            <option value="low">Low (75%)</option>
                            <option value="medium">Medium (100%)</option>
                            <option value="high">High (125%)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px;">PERFORMANCE SETTINGS</h3>
                
                <!-- Frame Rate Cap Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Frame Rate Cap</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Limits maximum frame rate</p>
                    </div>
                    <div>
                        <select id="frame-rate-cap" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: 8px; border-radius: 5px;">
                            <option value="30">30 FPS</option>
                            <option value="60">60 FPS</option>
                            <option value="0">Unlimited</option>
                        </select>
                    </div>
                </div>
                
                <!-- Show FPS Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Show FPS Counter</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Display current frame rate</p>
                    </div>
                    <div>
                        <label class="toggle" style="display: inline-block; position: relative; width: 60px; height: 30px;">
                            <input type="checkbox" id="show-fps" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: 15px; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
                
                <!-- Auto Quality Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Auto-Adjust Quality</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">Automatically adjusts settings based on performance</p>
                    </div>
                    <div>
                        <label class="toggle" style="display: inline-block; position: relative; width: 60px; height: 30px;">
                            <input type="checkbox" id="auto-quality" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: 15px; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px;">AUDIO SETTINGS</h3>
                
                <!-- Spatial Audio Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <label style="font-weight: bold;">Spatial Audio</label>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">3D positional sound effects</p>
                    </div>
                    <div>
                        <label class="toggle" style="display: inline-block; position: relative; width: 60px; height: 30px;">
                            <input type="checkbox" id="spatial-audio" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: 15px; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px;">PRESETS</h3>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <button id="preset-performance" style="flex: 1; margin-right: 10px; padding: 10px; background-color: #2a3a5a; color: white; border: 1px solid #33aaff; border-radius: 5px; cursor: pointer;">
                        PERFORMANCE
                    </button>
                    <button id="preset-balanced" style="flex: 1; margin-right: 10px; padding: 10px; background-color: #2a3a5a; color: white; border: 1px solid #33aaff; border-radius: 5px; cursor: pointer;">
                        BALANCED
                    </button>
                    <button id="preset-quality" style="flex: 1; padding: 10px; background-color: #2a3a5a; color: white; border: 1px solid #33aaff; border-radius: 5px; cursor: pointer;">
                        QUALITY
                    </button>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between;">
                <button id="apply-settings" style="flex: 1; margin-right: 10px; padding: 15px; background-color: #33aaff; color: black; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px;">
                    APPLY
                </button>
                <button id="settings-back" style="flex: 1; padding: 15px; background-color: #555; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px;">
                    BACK
                </button>
            </div>
        `;
        
        // Add slider style
        const style = document.createElement('style');
        style.textContent = `
            .slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                border-radius: 50%;
                transition: .4s;
            }
            
            input:checked + .slider {
                background-color: #33aaff;
            }
            
            input:checked + .slider:before {
                transform: translateX(30px);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(settingsContainer);
        
        // Add event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Back button
        document.getElementById('settings-back').addEventListener('click', () => {
            this.hide();
        });
        
        // Apply button
        document.getElementById('apply-settings').addEventListener('click', () => {
            this.updateSettings();
            this.saveSettings();
            this.applyAllSettings();
            
            // Show confirmation message
            this.showSettingsApplied();
        });
        
        // Preset buttons
        document.getElementById('preset-performance').addEventListener('click', () => {
            this.applyPreset('performance');
        });
        
        document.getElementById('preset-balanced').addEventListener('click', () => {
            this.applyPreset('balanced');
        });
        
        document.getElementById('preset-quality').addEventListener('click', () => {
            this.applyPreset('quality');
        });
    }
    
    updateSettings() {
        // Update settings object from UI values
        this.settings.graphicalQuality = document.getElementById('graphical-quality').value;
        this.settings.postProcessing = document.getElementById('post-processing').checked;
        this.settings.asteroidDetail = document.getElementById('asteroid-detail').value;
        this.settings.lightingQuality = document.getElementById('lighting-quality').value;
        this.settings.particleEffects = document.getElementById('particle-effects').value;
        this.settings.resolutionScale = document.getElementById('resolution-scale').value;
        this.settings.frameRateCap = parseInt(document.getElementById('frame-rate-cap').value);
        this.settings.showFPS = document.getElementById('show-fps').checked;
        this.settings.spatialAudio = document.getElementById('spatial-audio').checked;
        this.settings.autoQuality = document.getElementById('auto-quality').checked;
    }
    
    updateUI() {
        // Update UI elements from settings
        document.getElementById('graphical-quality').value = this.settings.graphicalQuality;
        document.getElementById('post-processing').checked = this.settings.postProcessing;
        document.getElementById('asteroid-detail').value = this.settings.asteroidDetail;
        document.getElementById('lighting-quality').value = this.settings.lightingQuality;
        document.getElementById('particle-effects').value = this.settings.particleEffects;
        document.getElementById('resolution-scale').value = this.settings.resolutionScale;
        document.getElementById('frame-rate-cap').value = this.settings.frameRateCap.toString();
        document.getElementById('show-fps').checked = this.settings.showFPS;
        document.getElementById('spatial-audio').checked = this.settings.spatialAudio;
        document.getElementById('auto-quality').checked = this.settings.autoQuality;
    }
    
    applyPreset(preset) {
        switch (preset) {
            case 'performance':
                this.settings = {
                    ...this.settings,
                    graphicalQuality: 'low',
                    postProcessing: false,
                    asteroidDetail: 'low',
                    lightingQuality: 'low',
                    particleEffects: 'low',
                    resolutionScale: 'low',
                    frameRateCap: 30,
                    autoQuality: false
                };
                break;
                
            case 'balanced':
                this.settings = {
                    ...this.settings,
                    graphicalQuality: 'medium',
                    postProcessing: true,
                    asteroidDetail: 'medium',
                    lightingQuality: 'medium',
                    particleEffects: 'medium',
                    resolutionScale: 'medium',
                    frameRateCap: 60,
                    autoQuality: true
                };
                break;
                
            case 'quality':
                this.settings = {
                    ...this.settings,
                    graphicalQuality: 'high',
                    postProcessing: true,
                    asteroidDetail: 'high',
                    lightingQuality: 'high',
                    particleEffects: 'high',
                    resolutionScale: 'high',
                    frameRateCap: 0,
                    autoQuality: false
                };
                break;
        }
        
        // Update UI with new settings
        this.updateUI();
    }
    
    applyAllSettings() {
        if (!this.game) return;
        
        // Apply renderer settings
        this.applyRendererSettings();
        
        // Apply physics settings
        this.applyPhysicsSettings();
        
        // Apply environment settings
        this.applyEnvironmentSettings();
        
        // Apply audio settings
        this.applyAudioSettings();
        
        // Apply UI settings
        this.applyUISettings();
        
        console.log('All settings applied successfully');
    }
    
    applyRendererSettings() {
        if (!this.game.renderer) return;
        
        const renderer = this.game.renderer;
        
        // Apply graphical quality
        switch (this.settings.graphicalQuality) {
            case 'low':
                // Disable antialiasing
                if (renderer.renderer) {
                    renderer.renderer.antialias = false;
                }
                
                // Set low shadow map size
                if (renderer.renderer && renderer.renderer.shadowMap) {
                    renderer.renderer.shadowMap.enabled = false;
                }
                break;
                
            case 'medium':
                // Enable antialiasing
                if (renderer.renderer) {
                    renderer.renderer.antialias = true;
                }
                
                // Set medium shadow map size
                if (renderer.renderer && renderer.renderer.shadowMap) {
                    renderer.renderer.shadowMap.enabled = true;
                    renderer.renderer.shadowMap.type = THREE.PCFShadowMap;
                }
                break;
                
            case 'high':
                // Enable antialiasing
                if (renderer.renderer) {
                    renderer.renderer.antialias = true;
                }
                
                // Set high shadow map size
                if (renderer.renderer && renderer.renderer.shadowMap) {
                    renderer.renderer.shadowMap.enabled = true;
                    renderer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                }
                break;
        }
        
        // Apply post-processing setting
        if (renderer.composer) {
            renderer.useBasicRendering = !this.settings.postProcessing;
        }
        
        // Apply bloom settings based on quality
        if (renderer.bloomPass) {
            switch (this.settings.graphicalQuality) {
                case 'low':
                    renderer.adjustBloom(0.4, 0.3, 0.9);
                    break;
                case 'medium':
                    renderer.adjustBloom(0.6, 0.4, 0.85);
                    break;
                case 'high':
                    renderer.adjustBloom(0.8, 0.5, 0.8);
                    break;
            }
        }
        
        // Apply resolution scaling
        if (renderer.renderer) {
            let pixelRatio = window.devicePixelRatio || 1;
            
            switch (this.settings.resolutionScale) {
                case 'low':
                    pixelRatio *= 0.75;
                    break;
                case 'medium':
                    // Use default pixel ratio
                    break;
                case 'high':
                    pixelRatio *= 1.25;
                    break;
            }
            
            renderer.renderer.setPixelRatio(pixelRatio);
            
            // Update size to apply new pixel ratio
            renderer.handleResize();
        }
    }
    
    applyPhysicsSettings() {
        // Physics settings don't need much adjustment, but we can optimize collision detection
        // based on asteroid detail setting
        if (this.game.physics) {
            const physics = this.game.physics;
            
            switch (this.settings.asteroidDetail) {
                case 'low':
                    physics.collisionDistance = 10; // Reduced collision distance
                    break;
                case 'medium':
                    physics.collisionDistance = 15; // Default
                    break;
                case 'high':
                    physics.collisionDistance = 20; // More precise collision
                    break;
            }
        }
    }
    
    applyEnvironmentSettings() {
        if (!this.game.environment) return;
        
        const environment = this.game.environment;
        
        // Apply asteroid detail settings
        if (environment.asteroidBelt && environment.asteroidBelt.updateDensity) {
            switch (this.settings.asteroidDetail) {
                case 'low':
                    environment.asteroidBelt.updateDensity(0.5); // 50% density
                    break;
                case 'medium':
                    environment.asteroidBelt.updateDensity(1.0); // 100% density
                    break;
                case 'high':
                    environment.asteroidBelt.updateDensity(1.5); // 150% density
                    break;
            }
        }
    }
    
    applyAudioSettings() {
        if (!this.game.audio) return;
        
        const audio = this.game.audio;
        
        // Apply spatial audio setting
        if (audio.spatialAudio !== undefined) {
            audio.spatialAudio = this.settings.spatialAudio;
        }
    }
    
    applyUISettings() {
        // Apply FPS counter setting - we'll use the existing HUD FPS display
        const fpsElement = document.getElementById('fps-display');
        if (fpsElement) {
            if (this.settings.showFPS) {
                // Show FPS display in HUD
                fpsElement.style.display = 'block';
                
                // Update FPS immediately if we have a current value
                if (this.game && this.game.currentFPS) {
                    fpsElement.textContent = `FPS: ${Math.round(this.game.currentFPS)}`;
                }
            } else {
                // Hide FPS display in HUD
                fpsElement.style.display = 'none';
            }
        } else {
            console.warn("FPS display element not found in HUD. It should have ID 'fps-display'");
        }
        
        // Update frame rate cap in game
        if (this.game) {
            const oldCap = this.game.frameRateCap;
            this.game.frameRateCap = this.settings.frameRateCap;
            
            // Only reset timing when changing from unlimited to limited or vice versa
            // This prevents disrupting the animation loop when just changing cap values
            if ((oldCap === 0 && this.game.frameRateCap > 0) || 
                (oldCap > 0 && this.game.frameRateCap === 0)) {
                this.game.lastFrameTime = 0;
            }
            
            console.log(`Frame rate cap changed from ${oldCap} to ${this.game.frameRateCap}`);
        }
    }
    
    showSettingsApplied() {
        // Create notification
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#33aaff';
        notification.style.padding = '15px 30px';
        notification.style.borderRadius = '10px';
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.zIndex = '9999';
        notification.textContent = 'Settings applied and saved';
        
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 1500);
    }
    
    show() {
        const settingsContainer = document.getElementById('settings-container');
        if (settingsContainer) {
            // Update UI to reflect current settings
            this.updateUI();
            
            // Show settings
            settingsContainer.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    hide() {
        const settingsContainer = document.getElementById('settings-container');
        if (settingsContainer) {
            settingsContainer.style.display = 'none';
            this.isVisible = false;
            
            // Show the mothership UI when returning from settings
            if (this.mothershipInterface) {
                this.mothershipInterface.showMothershipUI();
            }
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    // Helper method to check if system can run high quality settings
    detectSystemCapabilities() {
        const performance = {};
        
        // Check device pixel ratio (higher on high-end devices)
        performance.highDPI = window.devicePixelRatio > 1;
        
        // Check if WebGL2 is available
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        performance.webgl2 = !!gl;
        
        // Get GPU info if available
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                performance.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
        
        // Check for recent browser features that suggest a modern device
        performance.modernBrowser = 
            'IntersectionObserver' in window && 
            'requestAnimationFrame' in window &&
            'localStorage' in window;
            
        // Make a recommendation based on the detected capabilities
        if (performance.webgl2 && performance.highDPI && performance.modernBrowser) {
            return 'high';
        } else if (performance.webgl2 && performance.modernBrowser) {
            return 'medium';
        } else {
            return 'low';
        }
    }
} 