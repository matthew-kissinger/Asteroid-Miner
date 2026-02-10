// settings.js - Handles game settings and performance options

import { MobileDetector } from '../../utils/mobileDetector.ts';
import { SettingsStyles } from './components/settings/styles.ts';
import { AudioSettings } from './components/settings/audioSettings.ts';
import { GraphicsSettings } from './components/settings/graphicsSettings.ts';
import { SettingsView } from './components/settings/settingsView.ts';
import { SettingsPersistence } from './components/settings/persistence.ts';
import { SettingsEventHandlers } from './components/settings/eventHandlers.ts';
import { SettingsHelpers } from './components/settings/helpers.ts';

type SettingsData = {
    frameRateCap: string;
    showFPS: boolean;
    autoQuality: boolean;
    spatialAudio?: boolean;
    [key: string]: unknown;
};

type SettingsGame = {
    frameRateCap: number;
    lastFrameTime: number;
    currentFPS?: number;
    [key: string]: unknown;
};

type StargateInterfaceRef = {
    showStargateUI: () => void;
};

export class Settings {
    game: SettingsGame | null;
    stargateInterface: StargateInterfaceRef | null;
    isVisible: boolean;
    isMobile: boolean;
    styles: SettingsStyles;
    helpers: SettingsHelpers;
    persistence: SettingsPersistence;
    graphicsSettings: GraphicsSettings;
    audioSettings: AudioSettings;
    settingsView: SettingsView;
    eventHandlers: SettingsEventHandlers;
    settings: SettingsData;

    constructor(game: SettingsGame | null) {
        this.game = game;
        this.stargateInterface = null;
        this.isVisible = false;
        this.isMobile = MobileDetector.isMobile();
        
        console.log("Settings constructor - isMobile:", this.isMobile);
        
        // Initialize submodules
        this.styles = new SettingsStyles(this.isMobile);
        this.helpers = new SettingsHelpers();
        this.persistence = new SettingsPersistence();
        this.graphicsSettings = new GraphicsSettings(this.game, this.styles);
        this.audioSettings = new AudioSettings(this.game, this.styles);
        this.settingsView = new SettingsView(
            this.styles,
            this.graphicsSettings,
            this.audioSettings,
            this.helpers,
            this.persistence as any
        );
        this.eventHandlers = new SettingsEventHandlers(this as unknown as SettingsView, this.isMobile);
        
        // Set up refresh rate callback
        this.helpers.setRefreshRateUpdateCallback(() => {
            this.settingsView.updateRefreshRateDisplay(this.helpers.getMonitorRefreshRate());
        });
        
        // Detect monitor refresh rate
        this.helpers.detectMonitorRefreshRate();
        
        // Load settings from localStorage if available
        this.settings = this.persistence.loadSettings() as SettingsData;
        
        // Create settings UI
        this.setupSettingsUI();
        
        // Apply initial settings
        this.applyAllSettings();
        
        // Apply initial FPS display visibility
        setTimeout(() => this.applyUISettings(), 100);
    }
    
    setStargateInterface(stargateInterface: StargateInterfaceRef): void {
        this.stargateInterface = stargateInterface;
    }
    
    loadSettings(): void {
        this.settings = this.persistence.loadSettings() as SettingsData;
    }
    
    saveSettings(): void {
        this.persistence.saveSettings(this.settings);
    }
    
    setupSettingsUI(): void {
        // Create settings UI using the settings view
        this.settingsView.createSettingsUI();
        
        // Add event listeners
        this.eventHandlers.setupEventListeners();
    }
    
    
    updateSettings(): void {
        // Read graphics settings
        const graphicsSettings = this.graphicsSettings.readGraphicsSettings() as Record<string, unknown>;
        Object.assign(this.settings, graphicsSettings);
        
        // Read audio settings
        const audioSettings = this.audioSettings.readAudioSettings() as Record<string, unknown>;
        Object.assign(this.settings, audioSettings);
        
        // Read performance settings
        const frameRateCapElement = document.getElementById('frame-rate-cap') as HTMLInputElement | HTMLSelectElement | null;
        const showFPSElement = document.getElementById('show-fps') as HTMLInputElement | null;
        const autoQualityElement = document.getElementById('auto-quality') as HTMLInputElement | null;
        
        if (frameRateCapElement) this.settings.frameRateCap = frameRateCapElement.value;
        if (showFPSElement) this.settings.showFPS = showFPSElement.checked;
        if (autoQualityElement) this.settings.autoQuality = autoQualityElement.checked;
    }
    
    updateUI(): void {
        // Update graphics UI
        this.graphicsSettings.updateGraphicsUI(this.settings as any);
        
        // Update audio UI
        this.audioSettings.updateAudioUI(this.settings as any);
        
        // Update performance UI
        const frameRateCapElement = document.getElementById('frame-rate-cap') as HTMLInputElement | HTMLSelectElement | null;
        const showFPSElement = document.getElementById('show-fps') as HTMLInputElement | null;
        const autoQualityElement = document.getElementById('auto-quality') as HTMLInputElement | null;
        
        if (frameRateCapElement) frameRateCapElement.value = this.settings.frameRateCap;
        if (showFPSElement) showFPSElement.checked = this.settings.showFPS;
        if (autoQualityElement) autoQualityElement.checked = this.settings.autoQuality;
    }
    
    applyPreset(preset: string): void {
        console.log(`Applying ${preset} preset`);
        
        // Apply graphics preset
        this.settings = this.graphicsSettings.applyGraphicsPreset(preset, this.settings as any) as SettingsData;
        
        // Apply audio preset
        this.settings = this.audioSettings.applyAudioPreset(preset, this.settings as any) as SettingsData;
        
        // Apply performance preset
        switch (preset) {
            case 'performance':
                this.settings.frameRateCap = '60'; // Cap at 60 FPS for better consistency
                break;
                
            case 'balanced':
                this.settings.frameRateCap = 'auto'; // Use monitor refresh rate
                break;
                
            case 'quality':
                this.settings.frameRateCap = '0'; // Unlimited
                break;
        }
        
        // Don't change auto quality and FPS display settings
        
        // Update the UI to reflect new settings
        this.updateUI();
        
        // Show confirmation message
        this.showSettingsApplied();
    }
    
    applyAllSettings(): void {
        if (!this.game) return;
        
        // Apply graphics settings
        this.graphicsSettings.applyGraphicsSettings(this.settings as any);
        
        // Apply physics settings related to graphics
        this.graphicsSettings.applyPhysicsSettings(this.settings as any);
        
        // Apply audio settings
        this.audioSettings.applyAudioSettings(this.settings as any);
        
        // Apply UI settings
        this.applyUISettings();
        
        console.log('All settings applied successfully');
    }
    
    applyGraphicsSettings(): void {
        if (!this.game) return;
        
        // Apply graphics settings
        this.graphicsSettings.applyGraphicsSettings(this.settings as any);
        
        console.log('Graphics settings applied successfully');
    }
    
    
    applyUISettings(): void {
        // Apply FPS counter setting - we'll use the existing HUD FPS display
        const fpsElement = document.getElementById('fps-display') as HTMLDivElement | null;
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
            const monitorRefreshRate = this.helpers.getMonitorRefreshRate();
            
            // Handle auto (monitor refresh rate) setting
            if (this.settings.frameRateCap === 'auto') {
                // If refresh rate is over 65Hz, set to unlimited (0)
                if (monitorRefreshRate > 65) {
                    this.game.frameRateCap = 0;
                    console.log(`Using unlimited frame rate (refresh rate ${monitorRefreshRate}Hz > 65Hz)`);
                } else {
                    this.game.frameRateCap = monitorRefreshRate;
                    console.log(`Setting frame rate cap to monitor refresh rate: ${monitorRefreshRate}Hz`);
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
    
    showSettingsApplied(): void {
        this.settingsView.showSettingsApplied();
    }
    
    show(): void {
        // Update UI to reflect current settings
        this.updateUI();
        
        // Show settings
        if (this.settingsView.show()) {
            this.isVisible = true;
        }
    }
    
    hide(): void {
        if (this.settingsView.hide()) {
            this.isVisible = false;
            
            // Show the stargate UI when returning from settings
            if (this.stargateInterface) {
                this.stargateInterface.showStargateUI();
            }
        }
    }
    
    toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
} 
