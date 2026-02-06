// styles.js - Settings UI styles and CSS generation

export class SettingsStyles {
    isMobile: boolean;

    constructor(isMobile: boolean) {
        this.isMobile = isMobile;
    }

    /**
     * Creates the main settings container with responsive styling
     */
    createSettingsContainer(): HTMLDivElement {
        const settingsContainer: HTMLDivElement = document.createElement('div');
        settingsContainer.id = 'settings-container';
        settingsContainer.classList.add('settings-container');
        
        // Adjust size for mobile
        if (this.isMobile) {
            settingsContainer.classList.add('settings-container-mobile');
        }
        
        return settingsContainer;
    }

    /**
     * Gets responsive styles for settings rows
     */
    getSettingsRowStyle(): string {
        return `settings-row ${this.isMobile ? 'settings-row-mobile' : ''}`;
    }

    /**
     * Gets styles for setting labels
     */
    getSettingLabelStyle(): string {
        return `settings-label-container ${this.isMobile ? 'settings-label-container-mobile' : ''}`;
    }

    /**
     * Gets styles for setting controls
     */
    getSettingControlStyle(): string {
        return `settings-control-container ${this.isMobile ? 'settings-control-container-mobile' : ''}`;
    }

    /**
     * Gets styles for toggle controls
     */
    getToggleControlStyle(): string {
        return `settings-control-container ${this.isMobile ? 'settings-toggle-container-mobile' : ''}`;
    }

    /**
     * Gets styles for label text
     */
    getLabelTextStyle(): string {
        return `settings-label-text ${this.isMobile ? 'settings-label-text-mobile' : ''}`;
    }

    /**
     * Gets styles for description text
     */
    getDescriptionTextStyle(): string {
        return `settings-description ${this.isMobile ? 'settings-description-mobile' : ''}`;
    }

    /**
     * Gets styles for select elements
     */
    getSelectStyle(): string {
        return `settings-select ${this.isMobile ? 'settings-select-mobile' : ''}`;
    }

    /**
     * Gets styles for toggle switches
     */
    getToggleStyle(): string {
        return `settings-toggle ${this.isMobile ? 'settings-toggle-mobile' : ''}`;
    }

    /**
     * Gets styles for toggle inputs
     */
    getToggleInputStyle(): string {
        return 'settings-toggle-input';
    }

    /**
     * Gets styles for toggle sliders
     */
    getToggleSliderStyle(): string {
        return `settings-toggle-slider ${this.isMobile ? 'settings-toggle-slider-mobile' : ''}`;
    }

    /**
     * Gets styles for section headers
     */
    getSectionHeaderStyle(): string {
        return `settings-section-header ${this.isMobile ? 'settings-section-header-mobile' : ''}`;
    }

    /**
     * Gets styles for main title
     */
    getMainTitleStyle(): string {
        return `settings-title ${this.isMobile ? 'settings-title-mobile' : ''}`;
    }

    /**
     * Gets styles for preset buttons container
     */
    getPresetContainerStyle(): string {
        return `settings-preset-container ${this.isMobile ? 'settings-preset-container-mobile' : ''}`;
    }

    /**
     * Gets styles for preset buttons
     */
    getPresetButtonStyle(): string {
        return `settings-preset-button ${this.isMobile ? 'settings-preset-button-mobile' : ''}`;
    }

    /**
     * Gets styles for action buttons container
     */
    getActionButtonsContainerStyle(): string {
        return `settings-action-buttons ${this.isMobile ? 'settings-action-buttons-mobile' : ''}`;
    }

    /**
     * Gets styles for apply button
     */
    getApplyButtonStyle(): string {
        return `settings-apply-button ${this.isMobile ? 'settings-apply-button-mobile' : ''}`;
    }

    /**
     * Gets styles for back button
     */
    getBackButtonStyle(): string {
        return `settings-back-button ${this.isMobile ? 'settings-back-button-mobile' : ''}`;
    }

    /**
     * Gets styles for notification
     */
    getNotificationStyle(): string {
        return `settings-notification ${this.isMobile ? 'settings-notification-mobile' : ''}`;
    }

    /**
     * Injects toggle slider CSS into the document head (no longer needed - using external CSS)
     */
    injectToggleCSS(): void {
        // CSS now in external stylesheet - this method kept for compatibility
    }

    /**
     * Creates a settings row with label and control
     */
    createSettingRow(labelText: string, description: string, controlHtml: string): string {
        return `
            <div class="${this.getSettingsRowStyle()}">
                <div class="${this.getSettingLabelStyle()}">
                    <label class="${this.getLabelTextStyle()}">${labelText}</label>
                    <p class="${this.getDescriptionTextStyle()}">${description}</p>
                </div>
                <div class="${this.getSettingControlStyle()}">
                    ${controlHtml}
                </div>
            </div>
        `;
    }

    /**
     * Creates a toggle settings row
     */
    createToggleRow(labelText: string, description: string, inputId: string): string {
        const toggleHtml: string = `
            <label class="${this.getToggleStyle()}">
                <input type="checkbox" id="${inputId}" class="${this.getToggleInputStyle()}">
                <span class="${this.getToggleSliderStyle()}"></span>
            </label>
        `;

        return `
            <div class="${this.getSettingsRowStyle()}">
                <div class="${this.getSettingLabelStyle()}">
                    <label class="${this.getLabelTextStyle()}">${labelText}</label>
                    <p class="${this.getDescriptionTextStyle()}">${description}</p>
                </div>
                <div class="${this.getToggleControlStyle()}">
                    ${toggleHtml}
                </div>
            </div>
        `;
    }

    /**
     * Creates a select dropdown settings row
     */
    createSelectRow(labelText: string, description: string, selectId: string, options: { value: string; text: string }[]): string {
        const optionsHtml: string = options.map(option => 
            `<option value="${option.value}">${option.text}</option>`
        ).join('');

        const selectHtml: string = `
            <select id="${selectId}" class="${this.getSelectStyle()}">
                ${optionsHtml}
            </select>
        `;

        return this.createSettingRow(labelText, description, selectHtml);
    }
}