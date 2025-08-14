// audioSettings.js - Audio settings controls and logic

export class AudioSettings {
    constructor(game, styles) {
        this.game = game;
        this.styles = styles;
    }

    /**
     * Creates the audio settings section HTML
     */
    createAudioSettingsHTML() {
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
    applyAudioSettings(settings) {
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
    updateAudioUI(settings) {
        const spatialAudioElement = document.getElementById('spatial-audio');
        if (spatialAudioElement) {
            spatialAudioElement.checked = settings.spatialAudio;
        }
    }

    /**
     * Reads audio settings from UI elements
     */
    readAudioSettings() {
        const spatialAudioElement = document.getElementById('spatial-audio');
        
        return {
            spatialAudio: spatialAudioElement ? spatialAudioElement.checked : true
        };
    }

    /**
     * Applies audio preset settings
     */
    applyAudioPreset(preset, settings) {
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