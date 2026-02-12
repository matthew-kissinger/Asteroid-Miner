// graphicsSettings.js - Graphics settings controls and logic

import { PCFShadowMap, PCFSoftShadowMap } from 'three';
import { SettingsStyles } from './styles.ts';

export class GraphicsSettings {
    game: any; // TODO: Define a proper interface for 'game'
    styles: SettingsStyles;

    constructor(game: any, styles: SettingsStyles) {
        this.game = game;
        this.styles = styles;
    }

    /**
     * Creates the graphics settings section HTML
     */
    createGraphicsSettingsHTML(): string {
        return `
            <div style="margin-bottom: 20px;">
                <h3 style="${this.styles.getSectionHeaderStyle()}">GRAPHICS SETTINGS</h3>
                
                ${this.styles.createSelectRow(
                    'Graphical Quality',
                    'Affects overall visual fidelity and performance',
                    'graphical-quality',
                    [
                        { value: 'low', text: 'Low' },
                        { value: 'medium', text: 'Medium' },
                        { value: 'high', text: 'High' }
                    ]
                )}
                
                ${this.styles.createToggleRow(
                    'Post-processing Effects',
                    'Bloom, anti-aliasing, and visual effects',
                    'post-processing'
                )}
                
                ${this.styles.createToggleRow(
                    'Volumetric Light Rays',
                    'Enable sunlight rays effect',
                    'god-rays-enabled'
                )}
                
                ${this.styles.createSelectRow(
                    'Light Ray Type',
                    'Choose light ray effect style',
                    'god-rays-type',
                    [
                        { value: 'standard', text: 'Standard God Rays' },
                        { value: 'claude', text: 'Claude Rays' }
                    ]
                )}
                
                ${this.styles.createSelectRow(
                    'Asteroid Detail',
                    'Affects asteroid count and model complexity',
                    'asteroid-detail',
                    [
                        { value: 'low', text: 'Low' },
                        { value: 'medium', text: 'Medium' },
                        { value: 'high', text: 'High' }
                    ]
                )}
                
                ${this.styles.createSelectRow(
                    'Lighting Quality',
                    'Affects light sources and shadows',
                    'lighting-quality',
                    [
                        { value: 'low', text: 'Low' },
                        { value: 'medium', text: 'Medium' },
                        { value: 'high', text: 'High' }
                    ]
                )}
                
                ${this.styles.createSelectRow(
                    'Particle Effects',
                    'Affects thruster, explosion, and other particle effects',
                    'particle-effects',
                    [
                        { value: 'low', text: 'Low' },
                        { value: 'medium', text: 'Medium' },
                        { value: 'high', text: 'High' }
                    ]
                )}
                
                ${this.styles.createSelectRow(
                    'Resolution Scale',
                    'Adjusts rendering resolution',
                    'resolution-scale',
                    [
                        { value: 'low', text: 'Low (75%)' },
                        { value: 'medium', text: 'Medium (100%)' },
                        { value: 'high', text: 'High (125%)' }
                    ]
                )}
            </div>
        `;
    }

    /**
     * Applies graphics settings to the game renderer
     */
    applyGraphicsSettings(settings: any): void {
        if (!this.game) return;
        
        // Apply renderer settings
        this.applyRendererSettings(settings);
        
        // Apply environment settings
        this.applyEnvironmentSettings(settings);
        
        console.log('Graphics settings applied successfully');
    }

    /**
     * Applies renderer-specific graphics settings
     */
    applyRendererSettings(settings: any): void {
        if (!this.game.renderer) return;
        
        const renderer: any = this.game.renderer;
        
        // Apply graphical quality
        switch (settings.graphicalQuality) {
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
                    renderer.renderer.shadowMap.type = PCFShadowMap;
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
                    renderer.renderer.shadowMap.type = PCFSoftShadowMap;
                }
                break;
        }
        
        // Apply post-processing setting
        if (renderer.composer) {
            renderer.useBasicRendering = !settings.postProcessing;
        }
        
        // Apply god ray type setting first (this affects ambient light)
        if (renderer.setRayType) {
            const useClaudeRays = settings.godRaysType === 'claude';
            renderer.setRayType(useClaudeRays);
        }
        
        // Apply volumetric lighting (god rays) settings
        if (renderer.setVolumetricLightEnabled) {
            renderer.setVolumetricLightEnabled(settings.godRaysEnabled);
            
            // Ensure lighting is adjusted even when disabling god rays
            if (renderer.adjustLightingForRayType) {
                renderer.adjustLightingForRayType();
            }
        }
        
        // Apply volumetric light intensity based on quality setting
        if (renderer.setVolumetricLightIntensity) {
            let intensity;
            switch (settings.graphicalQuality) {
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
            switch (settings.graphicalQuality) {
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
            
            switch (settings.resolutionScale) {
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

    /**
     * Applies environment-related graphics settings
     */
    applyEnvironmentSettings(settings: any): void {
        if (!this.game.environment) return;
        
        const environment: any = this.game.environment;
        
        // Apply asteroid detail settings
        if (environment.asteroidBelt && environment.asteroidBelt.updateDensity) {
            switch (settings.asteroidDetail) {
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

    /**
     * Applies physics settings related to graphics
     */
    applyPhysicsSettings(settings: any): void {
        // Physics settings don't need much adjustment, but we can optimize collision detection
        // based on asteroid detail setting
        if (this.game.physics) {
            const physics = this.game.physics;
            
            switch (settings.asteroidDetail) {
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

    /**
     * Updates graphics-related UI elements with current settings
     */
    updateGraphicsUI(settings: any): void {
        const elements: Record<string, any> = {
            'graphical-quality': settings.graphicalQuality,
            'post-processing': settings.postProcessing,
            'asteroid-detail': settings.asteroidDetail,
            'lighting-quality': settings.lightingQuality,
            'particle-effects': settings.particleEffects,
            'resolution-scale': settings.resolutionScale,
            'god-rays-enabled': settings.godRaysEnabled,
            'god-rays-type': settings.godRaysType
        };

        for (const [elementId, value] of Object.entries(elements)) {
            const element: HTMLInputElement | HTMLSelectElement | null = document.getElementById(elementId) as HTMLInputElement | HTMLSelectElement;
            if (element) {
                if (element.type === 'checkbox') {
                    (element as HTMLInputElement).checked = value;
                } else {
                    (element as HTMLSelectElement).value = value;
                }
            }
        }
    }

    /**
     * Reads graphics settings from UI elements
     */
    readGraphicsSettings(): {
        graphicalQuality: string;
        postProcessing: boolean;
        asteroidDetail: string;
        lightingQuality: string;
        particleEffects: string;
        resolutionScale: string;
        godRaysEnabled: boolean;
        godRaysType: string;
    } {
        return {
            graphicalQuality: this.getElementValue('graphical-quality', 'medium'),
            postProcessing: this.getElementChecked('post-processing', true),
            asteroidDetail: this.getElementValue('asteroid-detail', 'medium'),
            lightingQuality: this.getElementValue('lighting-quality', 'medium'),
            particleEffects: this.getElementValue('particle-effects', 'medium'),
            resolutionScale: this.getElementValue('resolution-scale', 'medium'),
            godRaysEnabled: this.getElementChecked('god-rays-enabled', false),
            godRaysType: this.getElementValue('god-rays-type', 'standard')
        };
    }

    /**
     * Helper to get element value with fallback
     */
    getElementValue(elementId: string, defaultValue: string): string {
        const element: HTMLSelectElement | null = document.getElementById(elementId) as HTMLSelectElement;
        return element ? element.value : defaultValue;
    }

    /**
     * Helper to get element checked state with fallback
     */
    getElementChecked(elementId: string, defaultValue: boolean): boolean {
        const element: HTMLInputElement | null = document.getElementById(elementId) as HTMLInputElement;
        return element ? element.checked : defaultValue;
    }

    /**
     * Applies graphics preset settings
     */
    applyGraphicsPreset(preset: string, settings: any): any {
        switch (preset) {
            case 'performance':
                // Performance preset - prioritizes frame rate
                settings.graphicalQuality = 'low';
                settings.postProcessing = false;
                settings.asteroidDetail = 'low';
                settings.lightingQuality = 'low';
                settings.particleEffects = 'low';
                settings.resolutionScale = 'low';
                settings.godRaysEnabled = false; // Disable god rays for performance
                break;
                
            case 'balanced':
                // Balanced preset - moderate settings
                settings.graphicalQuality = 'medium';
                settings.postProcessing = true;
                settings.asteroidDetail = 'medium';
                settings.lightingQuality = 'medium';
                settings.particleEffects = 'medium';
                settings.resolutionScale = 'medium';
                settings.godRaysEnabled = true; // Enable god rays
                settings.godRaysType = 'standard'; // Use standard rays
                break;
                
            case 'quality':
                // Quality preset - prioritizes visuals
                settings.graphicalQuality = 'high';
                settings.postProcessing = true;
                settings.asteroidDetail = 'high';
                settings.lightingQuality = 'high';
                settings.particleEffects = 'high';
                settings.resolutionScale = 'high';
                settings.godRaysEnabled = true; // Enable god rays
                settings.godRaysType = 'claude'; // Use Claude rays for dramatic effect
                break;
        }
        
        return settings;
    }
}