// settings.js - Handles game settings and performance options

import { MobileDetector } from '../../utils/mobileDetector.js';
import * as THREE from 'three';

export class Settings {
    constructor(game) {
        this.game = game;
        this.stargateInterface = null;
        this.isVisible = false;
        this.isMobile = MobileDetector.isMobile();
        
        console.log("Settings constructor - isMobile:", this.isMobile);
        
        // Detect monitor refresh rate
        this.detectMonitorRefreshRate();
        
        // Default settings
        this.settings = {
            graphicalQuality: 'medium',    // low, medium, high
            postProcessing: true,          // true, false
            asteroidDetail: 'medium',      // low, medium, high
            lightingQuality: 'medium',     // low, medium, high
            particleEffects: 'medium',     // low, medium, high
            resolutionScale: 'medium',     // low, medium, high
            frameRateCap: 'auto',          // 30, 60, auto (monitor refresh rate), 0 (unlimited)
            showFPS: false,                // Show FPS counter
            spatialAudio: true,            // Enable spatial audio
            autoQuality: true,             // Automatically adjust quality based on performance
            godRaysEnabled: false,          // Enable/disable volumetric lighting effects
            godRaysType: 'standard'        // 'standard' (new god rays) or 'claude' (Claude Rays)
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
    
    setStargateInterface(stargateInterface) {
        this.stargateInterface = stargateInterface;
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
        
        // Adjust size for mobile
        if (this.isMobile) {
            settingsContainer.style.width = '95%';
            settingsContainer.style.maxWidth = '600px';
            settingsContainer.style.height = '90vh';
        } else {
            settingsContainer.style.width = '700px';
            settingsContainer.style.maxHeight = '90vh';
        }
        
        settingsContainer.style.overflowY = 'auto';
        settingsContainer.style.backgroundColor = 'rgba(20, 30, 50, 0.9)';
        settingsContainer.style.color = '#fff';
        settingsContainer.style.padding = this.isMobile ? '20px' : '30px';
        settingsContainer.style.borderRadius = '15px';
        settingsContainer.style.border = '2px solid #33aaff';
        settingsContainer.style.boxShadow = '0 0 30px #33aaff';
        settingsContainer.style.fontFamily = 'Courier New, monospace';
        settingsContainer.style.zIndex = '1000';
        settingsContainer.style.display = 'none';
        
        // Add mobile-specific scroll support
        if (this.isMobile) {
            settingsContainer.style.webkitOverflowScrolling = 'touch';
            settingsContainer.style.touchAction = 'pan-y';
            settingsContainer.style.overscrollBehavior = 'contain';
        }
        
        // Create settings content
        settingsContainer.innerHTML = `
            <h2 style="text-align: center; color: #33aaff; margin-top: 0; font-size: ${this.isMobile ? '24px' : '28px'};">GAME SETTINGS</h2>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px; font-size: ${this.isMobile ? '18px' : '20px'};">GRAPHICS SETTINGS</h3>
                
                <!-- Graphical Quality Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Graphical Quality</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Affects overall visual fidelity and performance</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%' : ''}">
                        <select id="graphical-quality" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: ${this.isMobile ? '10px' : '8px'}; border-radius: 5px; width: ${this.isMobile ? '100%' : 'auto'}; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <!-- Post-processing Effects Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Post-processing Effects</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Bloom, anti-aliasing, and visual effects</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%; display: flex; justify-content: flex-end;' : ''}">
                        <label class="toggle" style="display: inline-block; position: relative; width: ${this.isMobile ? '70px' : '60px'}; height: ${this.isMobile ? '34px' : '30px'};">
                            <input type="checkbox" id="post-processing" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: ${this.isMobile ? '17px' : '15px'}; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
                
                <!-- Volumetric Light Rays (God Rays) Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Volumetric Light Rays</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Enable sunlight rays effect</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%; display: flex; justify-content: flex-end;' : ''}">
                        <label class="toggle" style="display: inline-block; position: relative; width: ${this.isMobile ? '70px' : '60px'}; height: ${this.isMobile ? '34px' : '30px'};">
                            <input type="checkbox" id="god-rays-enabled" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: ${this.isMobile ? '17px' : '15px'}; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
                
                <!-- God Ray Type Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Light Ray Type</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Choose light ray effect style</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%' : ''}">
                        <select id="god-rays-type" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: ${this.isMobile ? '10px' : '8px'}; border-radius: 5px; width: ${this.isMobile ? '100%' : 'auto'}; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                            <option value="standard">Standard God Rays</option>
                            <option value="claude">Claude Rays</option>
                        </select>
                    </div>
                </div>
                
                <!-- Asteroid Detail Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Asteroid Detail</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Affects asteroid count and model complexity</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%' : ''}">
                        <select id="asteroid-detail" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: ${this.isMobile ? '10px' : '8px'}; border-radius: 5px; width: ${this.isMobile ? '100%' : 'auto'}; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <!-- Lighting Quality Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Lighting Quality</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Affects light sources and shadows</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%' : ''}">
                        <select id="lighting-quality" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: ${this.isMobile ? '10px' : '8px'}; border-radius: 5px; width: ${this.isMobile ? '100%' : 'auto'}; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <!-- Particle Effects Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Particle Effects</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Affects thruster, explosion, and other particle effects</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%' : ''}">
                        <select id="particle-effects" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: ${this.isMobile ? '10px' : '8px'}; border-radius: 5px; width: ${this.isMobile ? '100%' : 'auto'}; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <!-- Resolution Scale Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Resolution Scale</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Adjusts rendering resolution</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%' : ''}">
                        <select id="resolution-scale" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: ${this.isMobile ? '10px' : '8px'}; border-radius: 5px; width: ${this.isMobile ? '100%' : 'auto'}; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                            <option value="low">Low (75%)</option>
                            <option value="medium">Medium (100%)</option>
                            <option value="high">High (125%)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px; font-size: ${this.isMobile ? '18px' : '20px'};">PERFORMANCE SETTINGS</h3>
                
                <!-- Frame Rate Cap Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Frame Rate Cap</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Limits maximum frame rate</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%' : ''}">
                        <select id="frame-rate-cap" style="background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: ${this.isMobile ? '10px' : '8px'}; border-radius: 5px; width: ${this.isMobile ? '100%' : 'auto'}; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                            <option value="30">30 FPS</option>
                            <option value="60">60 FPS</option>
                            <option value="auto">Monitor Refresh Rate (${this.monitorRefreshRate}Hz)</option>
                            <option value="0">Unlimited</option>
                        </select>
                    </div>
                </div>
                
                <!-- Show FPS Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Show FPS Counter</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Display current frame rate</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%; display: flex; justify-content: flex-end;' : ''}">
                        <label class="toggle" style="display: inline-block; position: relative; width: ${this.isMobile ? '70px' : '60px'}; height: ${this.isMobile ? '34px' : '30px'};">
                            <input type="checkbox" id="show-fps" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: ${this.isMobile ? '17px' : '15px'}; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
                
                <!-- Auto Quality Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Auto-Adjust Quality</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">Automatically adjusts settings based on performance</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%; display: flex; justify-content: flex-end;' : ''}">
                        <label class="toggle" style="display: inline-block; position: relative; width: ${this.isMobile ? '70px' : '60px'}; height: ${this.isMobile ? '34px' : '30px'};">
                            <input type="checkbox" id="auto-quality" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: ${this.isMobile ? '17px' : '15px'}; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px; font-size: ${this.isMobile ? '18px' : '20px'};">AUDIO SETTINGS</h3>
                
                <!-- Spatial Audio Setting -->
                <div class="settings-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};">
                    <div style="margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}">
                        <label style="font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};">Spatial Audio</label>
                        <p style="margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;">3D positional sound effects</p>
                    </div>
                    <div style="${this.isMobile ? 'width: 100%; display: flex; justify-content: flex-end;' : ''}">
                        <label class="toggle" style="display: inline-block; position: relative; width: ${this.isMobile ? '70px' : '60px'}; height: ${this.isMobile ? '34px' : '30px'};">
                            <input type="checkbox" id="spatial-audio" style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: ${this.isMobile ? '17px' : '15px'}; transition: .4s;"></span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px; font-size: ${this.isMobile ? '18px' : '20px'};">PRESETS</h3>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-direction: ${this.isMobile ? 'column' : 'row'}; gap: ${this.isMobile ? '10px' : '0'};">
                    <button id="preset-performance" style="flex: 1; margin-right: ${this.isMobile ? '0' : '10px'}; padding: ${this.isMobile ? '15px' : '10px'}; background-color: #2a3a5a; color: white; border: 1px solid #33aaff; border-radius: 5px; cursor: pointer; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                        PERFORMANCE
                    </button>
                    <button id="preset-balanced" style="flex: 1; margin-right: ${this.isMobile ? '0' : '10px'}; padding: ${this.isMobile ? '15px' : '10px'}; background-color: #2a3a5a; color: white; border: 1px solid #33aaff; border-radius: 5px; cursor: pointer; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                        BALANCED
                    </button>
                    <button id="preset-quality" style="flex: 1; padding: ${this.isMobile ? '15px' : '10px'}; background-color: #2a3a5a; color: white; border: 1px solid #33aaff; border-radius: 5px; cursor: pointer; font-size: ${this.isMobile ? '16px' : 'inherit'};">
                        QUALITY
                    </button>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; flex-direction: ${this.isMobile ? 'column' : 'row'}; gap: ${this.isMobile ? '15px' : '0'};">
                <button id="apply-settings" style="flex: 1; margin-right: ${this.isMobile ? '0' : '10px'}; padding: ${this.isMobile ? '20px' : '15px'}; background-color: #33aaff; color: black; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: ${this.isMobile ? '18px' : '16px'};">
                    APPLY
                </button>
                <button id="settings-back" style="flex: 1; padding: ${this.isMobile ? '20px' : '15px'}; background-color: #555; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: ${this.isMobile ? '18px' : '16px'};">
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
                height: ${this.isMobile ? '26px' : '22px'};
                width: ${this.isMobile ? '26px' : '22px'};
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
                transform: translateX(${this.isMobile ? '36px' : '30px'});
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(settingsContainer);
        
        // Add event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Back button
        const backButton = document.getElementById('settings-back');
        if (backButton) {
            // Mouse event
            backButton.addEventListener('click', () => {
                this.hide();
            });
            
            // Touch event for mobile
            if (this.isMobile) {
                backButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.hide();
                });
            }
        }
        
        // Apply button
        const applyButton = document.getElementById('apply-settings');
        if (applyButton) {
            const applyHandler = () => {
                this.updateSettings();
                this.saveSettings();
                this.applyAllSettings();
                
                // Show confirmation message
                this.showSettingsApplied();
            };
            
            // Mouse event
            applyButton.addEventListener('click', applyHandler);
            
            // Touch event for mobile
            if (this.isMobile) {
                applyButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    applyHandler();
                });
            }
        }
        
        // Preset buttons with both mouse and touch events
        this.setupPresetButton('preset-performance', 'performance');
        this.setupPresetButton('preset-balanced', 'balanced');
        this.setupPresetButton('preset-quality', 'quality');
    }
    
    setupPresetButton(buttonId, presetName) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        const presetHandler = () => {
            this.applyPreset(presetName);
        };
        
        // Mouse event
        button.addEventListener('click', presetHandler);
        
        // Touch event for mobile
        if (this.isMobile) {
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                presetHandler();
            });
        }
        
        // Add hover/touch effects
        if (this.isMobile) {
            button.addEventListener('touchstart', () => {
                button.style.backgroundColor = '#3a4b6a';
                button.style.boxShadow = '0 0 10px #33aaff';
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                button.style.backgroundColor = '#2a3a5a';
                button.style.boxShadow = 'none';
            }, { passive: true });
        } else {
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#3a4b6a';
                button.style.boxShadow = '0 0 10px #33aaff';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = '#2a3a5a';
                button.style.boxShadow = 'none';
            });
        }
    }
    
    updateSettings() {
        // Update settings object from UI values
        this.settings.graphicalQuality = document.getElementById('graphical-quality').value;
        this.settings.postProcessing = document.getElementById('post-processing').checked;
        this.settings.asteroidDetail = document.getElementById('asteroid-detail').value;
        this.settings.lightingQuality = document.getElementById('lighting-quality').value;
        this.settings.particleEffects = document.getElementById('particle-effects').value;
        this.settings.resolutionScale = document.getElementById('resolution-scale').value;
        this.settings.frameRateCap = document.getElementById('frame-rate-cap').value;
        this.settings.showFPS = document.getElementById('show-fps').checked;
        this.settings.spatialAudio = document.getElementById('spatial-audio').checked;
        this.settings.autoQuality = document.getElementById('auto-quality').checked;
        this.settings.godRaysEnabled = document.getElementById('god-rays-enabled').checked;
        this.settings.godRaysType = document.getElementById('god-rays-type').value;
    }
    
    updateUI() {
        // Set form values from current settings
        document.getElementById('graphical-quality').value = this.settings.graphicalQuality;
        document.getElementById('post-processing').checked = this.settings.postProcessing;
        document.getElementById('asteroid-detail').value = this.settings.asteroidDetail;
        document.getElementById('lighting-quality').value = this.settings.lightingQuality;
        document.getElementById('particle-effects').value = this.settings.particleEffects;
        document.getElementById('resolution-scale').value = this.settings.resolutionScale;
        document.getElementById('frame-rate-cap').value = this.settings.frameRateCap;
        document.getElementById('show-fps').checked = this.settings.showFPS;
        document.getElementById('spatial-audio').checked = this.settings.spatialAudio;
        document.getElementById('auto-quality').checked = this.settings.autoQuality;
        document.getElementById('god-rays-enabled').checked = this.settings.godRaysEnabled;
        document.getElementById('god-rays-type').value = this.settings.godRaysType;
    }
    
    applyPreset(preset) {
        console.log(`Applying ${preset} preset`);
        
        switch (preset) {
            case 'performance':
                // Performance preset - prioritizes frame rate
                this.settings.graphicalQuality = 'low';
                this.settings.postProcessing = false;
                this.settings.asteroidDetail = 'low';
                this.settings.lightingQuality = 'low';
                this.settings.particleEffects = 'low';
                this.settings.resolutionScale = 'low';
                this.settings.frameRateCap = 60; // Cap at 60 FPS for better consistency
                this.settings.spatialAudio = false;
                this.settings.godRaysEnabled = false; // Disable god rays for performance
                break;
                
            case 'balanced':
                // Balanced preset - moderate settings
                this.settings.graphicalQuality = 'medium';
                this.settings.postProcessing = true;
                this.settings.asteroidDetail = 'medium';
                this.settings.lightingQuality = 'medium';
                this.settings.particleEffects = 'medium';
                this.settings.resolutionScale = 'medium';
                this.settings.frameRateCap = 'auto'; // Use monitor refresh rate
                this.settings.spatialAudio = true;
                this.settings.godRaysEnabled = true; // Enable god rays
                this.settings.godRaysType = 'standard'; // Use standard rays
                break;
                
            case 'quality':
                // Quality preset - prioritizes visuals
                this.settings.graphicalQuality = 'high';
                this.settings.postProcessing = true;
                this.settings.asteroidDetail = 'high';
                this.settings.lightingQuality = 'high';
                this.settings.particleEffects = 'high';
                this.settings.resolutionScale = 'high';
                this.settings.frameRateCap = 0; // Unlimited
                this.settings.spatialAudio = true;
                this.settings.godRaysEnabled = true; // Enable god rays
                this.settings.godRaysType = 'claude'; // Use Claude rays for dramatic effect
                break;
                
            default:
                console.error(`Unknown preset: ${preset}`);
                return;
        }
        
        // Don't change auto quality and FPS display settings
        
        // Update the UI to reflect new settings
        this.updateUI();
        
        // Show confirmation message
        this.showSettingsApplied();
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
    
    applyGraphicsSettings() {
        if (!this.game) return;
        
        // Apply renderer settings (graphics-related)
        this.applyRendererSettings();
        
        // Apply environment settings (affects visual quality)
        this.applyEnvironmentSettings();
        
        console.log('Graphics settings applied successfully');
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
        
        // Apply god ray type setting first (this affects ambient light)
        if (renderer.setRayType) {
            const useClaudeRays = this.settings.godRaysType === 'claude';
            renderer.setRayType(useClaudeRays);
        }
        
        // Apply volumetric lighting (god rays) settings
        if (renderer.setVolumetricLightEnabled) {
            renderer.setVolumetricLightEnabled(this.settings.godRaysEnabled);
            
            // Ensure lighting is adjusted even when disabling god rays
            if (renderer.adjustLightingForRayType) {
                renderer.adjustLightingForRayType();
            }
        }
        
        // Apply volumetric light intensity based on quality setting
        if (renderer.setVolumetricLightIntensity) {
            let intensity;
            switch (this.settings.graphicalQuality) {
                case 'low':
                    intensity = 0.4; // Increased from 0.3
                    break;
                case 'medium':
                    intensity = 0.65; // Increased from 0.5
                    break;
                case 'high':
                    intensity = 0.85; // Increased from 0.7
                    break;
                default:
                    intensity = 0.65;
            }
            renderer.setVolumetricLightIntensity(intensity);
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
            
            // Handle auto (monitor refresh rate) setting
            if (this.settings.frameRateCap === 'auto') {
                // If refresh rate is over 65Hz, set to unlimited (0)
                if (this.monitorRefreshRate > 65) {
                    this.game.frameRateCap = 0;
                    console.log(`Using unlimited frame rate (refresh rate ${this.monitorRefreshRate}Hz > 65Hz)`);
                } else {
                    this.game.frameRateCap = this.monitorRefreshRate;
                    console.log(`Setting frame rate cap to monitor refresh rate: ${this.monitorRefreshRate}Hz`);
                }
            } else {
                // Use the selected numeric value
                this.game.frameRateCap = parseInt(this.settings.frameRateCap) || 0;
            }
            
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
        notification.style.top = this.isMobile ? '25%' : '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#33aaff';
        notification.style.padding = this.isMobile ? '20px 40px' : '15px 30px';
        notification.style.borderRadius = '10px';
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = this.isMobile ? '18px' : '16px';
        notification.style.zIndex = '9999';
        notification.style.textAlign = 'center';
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
            
            // Show the stargate UI when returning from settings
            if (this.stargateInterface) {
                this.stargateInterface.showStargateUI();
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
    
    detectMonitorRefreshRate() {
        // Start with intelligent default based on common scenarios
        this.monitorRefreshRate = 60;
        
        try {
            // Method 1: Try screen.refresh first (most reliable when available)
            if (window.screen && typeof window.screen.refresh === 'number' && window.screen.refresh > 0) {
                this.monitorRefreshRate = Math.round(window.screen.refresh);
                console.log(`Using screen.refresh value: ${this.monitorRefreshRate}Hz`);
                return; // Use this value immediately if available
            }
            
            // Method 2: Quick synchronous measurement (first few frames)
            // This provides an immediate estimate for game initialization
            const quickMeasure = this.quickRefreshRateMeasure();
            if (quickMeasure > 0) {
                this.monitorRefreshRate = quickMeasure;
                console.log(`Quick measure refresh rate: ${this.monitorRefreshRate}Hz`);
            }
            
            // Method 3: Start accurate async measurement for refinement
            // This will update the rate after more samples
            this.startAccurateRefreshDetection();
            
        } catch (error) {
            console.warn("Error detecting refresh rate:", error);
        }
    }
    
    quickRefreshRateMeasure() {
        // Quick estimate based on common monitor configurations
        // Avoid busy-wait which can cause initial lag
        
        // Check if we have screen refresh rate available
        if (window.screen && typeof window.screen.refresh === 'number' && window.screen.refresh > 0) {
            return Math.round(window.screen.refresh);
        }
        
        // Check common indicators for high refresh displays
        const userAgent = navigator.userAgent.toLowerCase();
        const isGaming = userAgent.includes('gaming') || userAgent.includes('rog');
        const isHighEnd = window.screen && window.screen.width > 2560;
        
        // Make educated guess based on device
        if (this.isMobile) {
            return 60; // Most mobile devices are 60Hz
        } else if (isGaming || isHighEnd) {
            return 144; // Assume high refresh for gaming systems
        }
        
        // Default to 60Hz for standard displays
        return 60;
    }
    
    startAccurateRefreshDetection() {
        // Accurate async detection over longer period
        let warmupFrames = 5; // Skip initial irregular frames
        let frameCount = 0;
        const timestamps = [];
        const startTime = performance.now();
        
        const detectFrame = (timestamp) => {
            frameCount++;
            
            // Skip warmup frames
            if (frameCount <= warmupFrames) {
                requestAnimationFrame(detectFrame);
                return;
            }
            
            timestamps.push(timestamp);
            
            // Collect for 1 second or 120 frames
            if (timestamps.length < 120 && performance.now() - startTime < 1000) {
                requestAnimationFrame(detectFrame);
            } else {
                this.processRefreshRateSamples(timestamps);
            }
        };
        
        requestAnimationFrame(detectFrame);
    }
    
    processRefreshRateSamples(timestamps) {
        if (timestamps.length < 2) return;
        
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            const delta = timestamps[i] - timestamps[i-1];
            if (delta > 0) {
                intervals.push(1000 / delta);
            }
        }
        
        if (intervals.length === 0) return;
        
        // Remove outliers using IQR method
        intervals.sort((a, b) => a - b);
        const q1 = intervals[Math.floor(intervals.length * 0.25)];
        const q3 = intervals[Math.floor(intervals.length * 0.75)];
        const iqr = q3 - q1;
        
        const validRates = intervals.filter(rate => 
            rate >= q1 - 1.5 * iqr && rate <= q3 + 1.5 * iqr
        );
        
        if (validRates.length > 0) {
            const avg = validRates.reduce((a, b) => a + b, 0) / validRates.length;
            const newRate = this.roundToCommonRefreshRate(avg);
            
            // Only update if significantly different
            if (Math.abs(newRate - this.monitorRefreshRate) >= 5) {
                console.log(`Refined refresh rate: ${this.monitorRefreshRate}Hz -> ${newRate}Hz`);
                this.monitorRefreshRate = newRate;
                
                // Update game settings if using auto mode
                if (this.settings.frameRateCap === 'auto' && this.game) {
                    this.applyUISettings();
                }
            }
        }
    }
    
    roundToCommonRefreshRate(rate) {
        // Common refresh rates in 2024
        const commonRates = [24, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360, 480];
        
        let closest = 60;
        let minDiff = Math.abs(rate - 60);
        
        for (const commonRate of commonRates) {
            const diff = Math.abs(rate - commonRate);
            if (diff < minDiff) {
                minDiff = diff;
                closest = commonRate;
            }
        }
        
        // Only accept if within 10% of a common rate
        if (minDiff / closest < 0.1) {
            return closest;
        }
        
        return Math.round(rate); // Return raw rate if no close match
    }
} 