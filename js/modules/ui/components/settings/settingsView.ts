import { GraphicsSettings } from './graphicsSettings.ts';
import { AudioSettings } from './audioSettings.ts';
import { SettingsHelpers } from './helpers.ts';
import { SettingsPersistence } from './persistence.ts'; // Assuming this will be needed
import { SettingsStyles } from './styles.ts';

export class SettingsView {
    styles: SettingsStyles;
    graphicsSettings: GraphicsSettings;
    audioSettings: AudioSettings;
    helpers: SettingsHelpers;
    persistence: SettingsPersistence;
    private _isVisible: boolean = false; // Internal state for visibility

    constructor(
        styles: SettingsStyles,
        graphicsSettings: GraphicsSettings,
        audioSettings: AudioSettings,
        helpers: SettingsHelpers,
        persistence: SettingsPersistence
    ) {
        this.styles = styles;
        this.graphicsSettings = graphicsSettings;
        this.audioSettings = audioSettings;
        this.helpers = helpers;
        this.persistence = persistence;
    }

    // --- Methods expected by SettingsEventHandlers ---
    updateSettings(): void {
        console.warn("SettingsView: updateSettings not fully implemented yet.");
        // This method will read values from UI and prepare them for application
        // For example:
        // const newGraphicsSettings = this.graphicsSettings.readGraphicsSettings();
        // const newAudioSettings = this.audioSettings.readAudioSettings();
        // this.currentSettings = { ...this.currentSettings, ...newGraphicsSettings, ...newAudioSettings };
    }

    saveSettings(): void {
        console.warn("SettingsView: saveSettings not fully implemented yet.");
        // This method will save the current settings via persistence
        // For example:
        // this.persistence.saveSettings(this.currentSettings);
    }

    applyAllSettings(): void {
        console.warn("SettingsView: applyAllSettings not fully implemented yet.");
        // This method will apply all settings to the game
        // For example:
        // this.graphicsSettings.applyGraphicsSettings(this.currentSettings);
        // this.audioSettings.applyAudioSettings(this.currentSettings);
    }

    applyPreset(presetName: string): void {
        console.warn(`SettingsView: applyPreset('${presetName}') not fully implemented yet.`);
        // This method will apply a preset and update the UI
        // For example:
        // const newSettings = this.helpers.getPerformanceRecommendation(presetName); // Or a specific preset logic
        // this.currentSettings = { ...this.currentSettings, ...newSettings };
        // this.updateAllUI(this.currentSettings);
    }

    get isVisible(): boolean {
        return this._isVisible;
    }


    /**
     * Creates the complete settings UI
     */
    createSettingsUI(): HTMLElement {
        // Create settings container
        const settingsContainer: HTMLDivElement = this.styles.createSettingsContainer();
        
        // Create settings content
        settingsContainer.innerHTML = this.createSettingsHTML();
        
        // Inject toggle CSS
        this.styles.injectToggleCSS();
        
        // Add to document
        document.body.appendChild(settingsContainer);
        
        return settingsContainer;
    }

    /**
     * Creates the complete settings HTML content
     */
    createSettingsHTML(): string {
        return `
            <h2 style="${this.styles.getMainTitleStyle()}">GAME SETTINGS</h2>
            
            ${this.graphicsSettings.createGraphicsSettingsHTML()}
            
            ${this.createPerformanceSettingsHTML()}
            
            ${this.audioSettings.createAudioSettingsHTML()}
            
            ${this.createPresetsHTML()}
            
            ${this.createActionButtonsHTML()}
        `;
    }

    /**
     * Creates the performance settings section HTML
     */
    createPerformanceSettingsHTML(): string {
        return `
            <div style="margin-bottom: 20px;">
                <h3 style="${this.styles.getSectionHeaderStyle()}">PERFORMANCE SETTINGS</h3>
                
                ${this.styles.createSelectRow(
                    'Frame Rate Cap',
                    'Limits maximum frame rate',
                    'frame-rate-cap',
                    [
                        { value: '30', text: '30 FPS' },
                        { value: '60', text: '60 FPS' },
                        { value: 'auto', text: `Monitor Refresh Rate (60Hz)` },
                        { value: '0', text: 'Unlimited' }
                    ]
                )}
                
                ${this.styles.createToggleRow(
                    'Show FPS Counter',
                    'Display current frame rate',
                    'show-fps'
                )}
                
                ${this.styles.createToggleRow(
                    'Auto-Adjust Quality',
                    'Automatically adjusts settings based on performance',
                    'auto-quality'
                )}
            </div>
        `;
    }

    /**
     * Creates the presets section HTML
     */
    createPresetsHTML(): string {
        return `
            <div style="margin-bottom: 20px;">
                <h3 style="${this.styles.getSectionHeaderStyle()}">PRESETS</h3>
                
                <div style="${this.styles.getPresetContainerStyle()}">
                    <button id="preset-performance" style="${this.styles.getPresetButtonStyle()}">
                        PERFORMANCE
                    </button>
                    <button id="preset-balanced" style="${this.styles.getPresetButtonStyle()}">
                        BALANCED
                    </button>
                    <button id="preset-quality" style="${this.styles.getPresetButtonStyle()}">
                        QUALITY
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Creates the action buttons HTML
     */
    createActionButtonsHTML(): string {
        return `
            <div style="${this.styles.getActionButtonsContainerStyle()}">
                <button id="apply-settings" style="${this.styles.getApplyButtonStyle()}">
                    APPLY
                </button>
                <button id="settings-back" style="${this.styles.getBackButtonStyle()}">
                    BACK
                </button>
            </div>
        `;
    }

    /**
     * Shows the settings panel
     */
    show(): boolean {
        const settingsContainer: HTMLDivElement | null = document.getElementById('settings-container') as HTMLDivElement;
        if (settingsContainer) {
            settingsContainer.style.display = 'block';
            this._isVisible = true;
            return true;
        }
        return false;
    }

    /**
     * Hides the settings panel
     */
    hide(): boolean {
        const settingsContainer: HTMLDivElement | null = document.getElementById('settings-container') as HTMLDivElement;
        if (settingsContainer) {
            settingsContainer.style.display = 'none';
            this._isVisible = false;
            return true;
        }
        return false;
    }

    /**
     * Updates the refresh rate display in the frame rate cap dropdown
     */
    updateRefreshRateDisplay(refreshRate: number): void {
        const frameRateSelect: HTMLSelectElement | null = document.getElementById('frame-rate-cap') as HTMLSelectElement;
        if (frameRateSelect) {
            const autoOption: HTMLOptionElement | null = frameRateSelect.querySelector('option[value="auto"]');
            if (autoOption) {
                autoOption.textContent = `Monitor Refresh Rate (${refreshRate}Hz)`;
            }
        }
    }

    /**
     * Shows a settings applied notification
     */
    showSettingsApplied(): void {
        // Create notification
        const notification: HTMLDivElement = document.createElement('div');
        const notificationStyles: Record<string, string> = this.styles.getNotificationStyle();
        
        // Apply all styles
        Object.assign(notification.style, notificationStyles);
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
}