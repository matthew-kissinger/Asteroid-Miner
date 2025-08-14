// settingsView.js - Settings panel layout and view management

export class SettingsView {
    constructor(styles, graphicsSettings, audioSettings, helpers) {
        this.styles = styles;
        this.graphicsSettings = graphicsSettings;
        this.audioSettings = audioSettings;
        this.helpers = helpers;
    }

    /**
     * Creates the complete settings UI
     */
    createSettingsUI() {
        // Create settings container
        const settingsContainer = this.styles.createSettingsContainer();
        
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
    createSettingsHTML() {
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
    createPerformanceSettingsHTML() {
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
    createPresetsHTML() {
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
    createActionButtonsHTML() {
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
    show() {
        const settingsContainer = document.getElementById('settings-container');
        if (settingsContainer) {
            settingsContainer.style.display = 'block';
            return true;
        }
        return false;
    }

    /**
     * Hides the settings panel
     */
    hide() {
        const settingsContainer = document.getElementById('settings-container');
        if (settingsContainer) {
            settingsContainer.style.display = 'none';
            return true;
        }
        return false;
    }

    /**
     * Updates the refresh rate display in the frame rate cap dropdown
     */
    updateRefreshRateDisplay(refreshRate) {
        const frameRateSelect = document.getElementById('frame-rate-cap');
        if (frameRateSelect) {
            const autoOption = frameRateSelect.querySelector('option[value="auto"]');
            if (autoOption) {
                autoOption.textContent = `Monitor Refresh Rate (${refreshRate}Hz)`;
            }
        }
    }

    /**
     * Shows a settings applied notification
     */
    showSettingsApplied() {
        // Create notification
        const notification = document.createElement('div');
        const notificationStyles = this.styles.getNotificationStyle();
        
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