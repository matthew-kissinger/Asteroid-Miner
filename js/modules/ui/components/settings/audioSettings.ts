// audioSettings.js - Audio settings controls and logic

import { SettingsStyles } from './styles.ts';

export class AudioSettings {
    game: any; // TODO: Define a proper interface for 'game'
    styles: SettingsStyles;

    constructor(game: any, styles: SettingsStyles) {
        this.game = game;
        this.styles = styles;
    }

    /**
     * Creates the audio settings section HTML
     */
    createAudioSettingsHTML(): string {
        return `
            <div style="margin-bottom: 20px;">
                <h3 style="${this.styles.getSectionHeaderStyle()}">AUDIO SETTINGS</h3>
                
                ${this.styles.createToggleRow(
                    'Spatial Audio',
                    '3D positional sound effects',
                    'spatial-audio'
                )}
            </div>
        `;
    }

    /**
     * Applies audio settings to the game
     */
    applyAudioSettings(settings: { spatialAudio: boolean }): void {
        if (!this.game.audio) return;
        
        const audio = this.game.audio;
        
        // Apply spatial audio setting
        if (audio.spatialAudio !== undefined) {
            audio.spatialAudio = settings.spatialAudio;
        }
    }

    /**
     * Updates audio-related UI elements with current settings
     */
    updateAudioUI(settings: { spatialAudio: boolean }): void {
        const spatialAudioElement: HTMLInputElement | null = document.getElementById('spatial-audio') as HTMLInputElement;
        if (spatialAudioElement) {
            spatialAudioElement.checked = settings.spatialAudio;
        }
    }

    /**
     * Reads audio settings from UI elements
     */
    readAudioSettings(): { spatialAudio: boolean } {
        const spatialAudioElement: HTMLInputElement | null = document.getElementById('spatial-audio') as HTMLInputElement;
        
        return {
            spatialAudio: spatialAudioElement ? spatialAudioElement.checked : true
        };
    }

    /**
     * Applies audio preset settings
     */
    applyAudioPreset(preset: string, settings: { spatialAudio: boolean }): { spatialAudio: boolean } {
        switch (preset) {
            case 'performance':
                settings.spatialAudio = false;
                break;
                
            case 'balanced':
            case 'quality':
                settings.spatialAudio = true;
                break;
        }
        
        return settings;
    }
}