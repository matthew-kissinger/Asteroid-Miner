// eventHandlers.js - Settings UI event handling

import { SettingsView } from './settingsView.ts';

export class SettingsEventHandlers {
    settings: SettingsView;
    isMobile: boolean;

    constructor(settings: SettingsView, isMobile: boolean) {
        this.settings = settings;
        this.isMobile = isMobile;
    }

    /**
     * Sets up all event listeners for the settings UI
     */
    setupEventListeners(): void {
        this.setupBackButton();
        this.setupApplyButton();
        this.setupPresetButtons();
    }

    /**
     * Sets up the back button event listeners
     */
    setupBackButton(): void {
        const backButton: HTMLButtonElement | null = document.getElementById('settings-back') as HTMLButtonElement;
        if (backButton) {
            // Mouse event
            backButton.addEventListener('click', () => {
                this.settings.hide();
            });
            
            // Touch event for mobile
            if (this.isMobile) {
                backButton.addEventListener('touchend', (e: TouchEvent) => {
                    e.preventDefault();
                    this.settings.hide();
                });
            }
        }
    }

    /**
     * Sets up the apply button event listeners
     */
    setupApplyButton(): void {
        const applyButton: HTMLButtonElement | null = document.getElementById('apply-settings') as HTMLButtonElement;
        if (applyButton) {
            const applyHandler = (): void => {
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
                applyButton.addEventListener('touchend', (e: TouchEvent) => {
                    e.preventDefault();
                    applyHandler();
                });
            }
        }
    }

    /**
     * Sets up preset button event listeners
     */
    setupPresetButtons(): void {
        this.setupPresetButton('preset-performance', 'performance');
        this.setupPresetButton('preset-balanced', 'balanced');
        this.setupPresetButton('preset-quality', 'quality');
    }

    /**
     * Sets up a single preset button with event listeners and effects
     */
    setupPresetButton(buttonId: string, presetName: string): void {
        const button: HTMLButtonElement | null = document.getElementById(buttonId) as HTMLButtonElement;
        if (!button) return;
        
        const presetHandler = (): void => {
            this.settings.applyPreset(presetName);
        };
        
        // Mouse event
        button.addEventListener('click', presetHandler);
        
        // Touch event for mobile
        if (this.isMobile) {
            button.addEventListener('touchend', (e: TouchEvent) => {
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
    setupButtonEffects(button: HTMLElement): void {
        if (this.isMobile) {
            // Touch effects for mobile
            button.addEventListener('touchstart', () => {
                button.classList.add('settings-preset-button-touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                button.classList.remove('settings-preset-button-touch-active');
            }, { passive: true });
        }
        // Desktop hover effects handled by CSS :hover
    }

    /**
     * Sets up keyboard navigation for settings (optional enhancement)
     */
    setupKeyboardNavigation(): void {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            // ESC key to close settings
            if (e.key === 'Escape' && this.settings.isVisible) {
                this.settings.hide();
                e.preventDefault();
            }
            
            // Enter key to apply settings
            if (e.key === 'Enter' && this.settings.isVisible && e.ctrlKey) {
                const applyButton: HTMLButtonElement | null = document.getElementById('apply-settings') as HTMLButtonElement;
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
    removeEventListeners(): void {
        // Remove button event listeners
        const buttons: string[] = [
            'settings-back',
            'apply-settings', 
            'preset-performance',
            'preset-balanced',
            'preset-quality'
        ];
        
        buttons.forEach((buttonId: string) => {
            const button: HTMLElement | null = document.getElementById(buttonId);
            if (button) {
                // Clone and replace to remove all event listeners
                const newButton: Node = button.cloneNode(true);
                button.parentNode?.replaceChild(newButton, button);
            }
        });
    }

    /**
     * Validates form inputs before applying settings
     */
    validateSettingsForm(): boolean {
        // Add validation logic here if needed
        // For now, all settings are from dropdowns/checkboxes so they're valid by default
        return true;
    }

    /**
     * Handles setting changes in real-time (optional)
     */
    setupRealTimeUpdates(): void {
        const settingElements: string[] = [
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

        settingElements.forEach((elementId: string) => {
            const element: HTMLElement | null = document.getElementById(elementId);
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