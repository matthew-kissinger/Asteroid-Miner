// eventHandlers.js - Settings UI event handling

export class SettingsEventHandlers {
    constructor(settings, isMobile) {
        this.settings = settings;
        this.isMobile = isMobile;
    }

    /**
     * Sets up all event listeners for the settings UI
     */
    setupEventListeners() {
        this.setupBackButton();
        this.setupApplyButton();
        this.setupPresetButtons();
    }

    /**
     * Sets up the back button event listeners
     */
    setupBackButton() {
        const backButton = document.getElementById('settings-back');
        if (backButton) {
            // Mouse event
            backButton.addEventListener('click', () => {
                this.settings.hide();
            });
            
            // Touch event for mobile
            if (this.isMobile) {
                backButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.settings.hide();
                });
            }
        }
    }

    /**
     * Sets up the apply button event listeners
     */
    setupApplyButton() {
        const applyButton = document.getElementById('apply-settings');
        if (applyButton) {
            const applyHandler = () => {
                this.settings.updateSettings();
                this.settings.saveSettings();
                this.settings.applyAllSettings();
                
                // Show confirmation message
                this.settings.showSettingsApplied();
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
    }

    /**
     * Sets up preset button event listeners
     */
    setupPresetButtons() {
        this.setupPresetButton('preset-performance', 'performance');
        this.setupPresetButton('preset-balanced', 'balanced');
        this.setupPresetButton('preset-quality', 'quality');
    }

    /**
     * Sets up a single preset button with event listeners and effects
     */
    setupPresetButton(buttonId, presetName) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        const presetHandler = () => {
            this.settings.applyPreset(presetName);
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
        this.setupButtonEffects(button);
    }

    /**
     * Sets up visual effects for buttons (hover/touch feedback)
     */
    setupButtonEffects(button) {
        if (this.isMobile) {
            // Touch effects for mobile
            button.addEventListener('touchstart', () => {
                button.style.backgroundColor = '#3a4b6a';
                button.style.boxShadow = '0 0 10px #33aaff';
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                button.style.backgroundColor = '#2a3a5a';
                button.style.boxShadow = 'none';
            }, { passive: true });
        } else {
            // Mouse effects for desktop
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

    /**
     * Sets up keyboard navigation for settings (optional enhancement)
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC key to close settings
            if (e.key === 'Escape' && this.settings.isVisible) {
                this.settings.hide();
                e.preventDefault();
            }
            
            // Enter key to apply settings
            if (e.key === 'Enter' && this.settings.isVisible && e.ctrlKey) {
                const applyButton = document.getElementById('apply-settings');
                if (applyButton) {
                    applyButton.click();
                    e.preventDefault();
                }
            }
        });
    }

    /**
     * Removes all event listeners (cleanup)
     */
    removeEventListeners() {
        // Remove button event listeners
        const buttons = [
            'settings-back',
            'apply-settings', 
            'preset-performance',
            'preset-balanced',
            'preset-quality'
        ];
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                // Clone and replace to remove all event listeners
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
            }
        });
    }

    /**
     * Validates form inputs before applying settings
     */
    validateSettingsForm() {
        // Add validation logic here if needed
        // For now, all settings are from dropdowns/checkboxes so they're valid by default
        return true;
    }

    /**
     * Handles setting changes in real-time (optional)
     */
    setupRealTimeUpdates() {
        const settingElements = [
            'graphical-quality',
            'post-processing',
            'asteroid-detail',
            'lighting-quality',
            'particle-effects',
            'resolution-scale',
            'frame-rate-cap',
            'show-fps',
            'spatial-audio',
            'auto-quality',
            'god-rays-enabled',
            'god-rays-type'
        ];

        settingElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('change', () => {
                    // Optional: Apply settings immediately on change
                    // this.settings.updateSettings();
                    // this.settings.applyAllSettings();
                });
            }
        });
    }
}