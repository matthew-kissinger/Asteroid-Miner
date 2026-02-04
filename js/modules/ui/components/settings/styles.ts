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
        
        return settingsContainer;
    }

    /**
     * Gets responsive styles for settings rows
     */
    getSettingsRowStyle(): string {
        return `display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-direction: ${this.isMobile ? 'column' : 'row'}; align-items: ${this.isMobile ? 'flex-start' : 'center'};`;
    }

    /**
     * Gets styles for setting labels
     */
    getSettingLabelStyle(): string {
        return `margin-bottom: ${this.isMobile ? '8px' : '0'}; ${this.isMobile ? 'width: 100%' : ''}`;
    }

    /**
     * Gets styles for setting controls
     */
    getSettingControlStyle(): string {
        return `${this.isMobile ? 'width: 100%' : ''}`;
    }

    /**
     * Gets styles for toggle controls
     */
    getToggleControlStyle(): string {
        return `${this.isMobile ? 'width: 100%; display: flex; justify-content: flex-end;' : ''}`;
    }

    /**
     * Gets styles for label text
     */
    getLabelTextStyle() {
        return `font-weight: bold; font-size: ${this.isMobile ? '15px' : 'inherit'};`;
    }

    /**
     * Gets styles for description text
     */
    getDescriptionTextStyle() {
        return `margin: 5px 0 0 0; font-size: ${this.isMobile ? '11px' : '12px'}; color: #aaa;`;
    }

    /**
     * Gets styles for select elements
     */
    getSelectStyle() {
        return `background-color: #2a3a5a; color: white; border: 1px solid #33aaff; padding: ${this.isMobile ? '10px' : '8px'}; border-radius: 5px; width: ${this.isMobile ? '100%' : 'auto'}; font-size: ${this.isMobile ? '16px' : 'inherit'};`;
    }

    /**
     * Gets styles for toggle switches
     */
    getToggleStyle() {
        return `display: inline-block; position: relative; width: ${this.isMobile ? '70px' : '60px'}; height: ${this.isMobile ? '34px' : '30px'};`;
    }

    /**
     * Gets styles for toggle inputs
     */
    getToggleInputStyle() {
        return 'opacity: 0; width: 0; height: 0;';
    }

    /**
     * Gets styles for toggle sliders
     */
    getToggleSliderStyle() {
        return `position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; border-radius: ${this.isMobile ? '17px' : '15px'}; transition: .4s;`;
    }

    /**
     * Gets styles for section headers
     */
    getSectionHeaderStyle() {
        return `color: #33aaff; border-bottom: 1px solid #33aaff; padding-bottom: 10px; font-size: ${this.isMobile ? '18px' : '20px'};`;
    }

    /**
     * Gets styles for main title
     */
    getMainTitleStyle() {
        return `text-align: center; color: #33aaff; margin-top: 0; font-size: ${this.isMobile ? '24px' : '28px'};`;
    }

    /**
     * Gets styles for preset buttons container
     */
    getPresetContainerStyle() {
        return `display: flex; justify-content: space-between; margin-bottom: 20px; flex-direction: ${this.isMobile ? 'column' : 'row'}; gap: ${this.isMobile ? '10px' : '0'};`;
    }

    /**
     * Gets styles for preset buttons
     */
    getPresetButtonStyle() {
        return `flex: 1; margin-right: ${this.isMobile ? '0' : '10px'}; padding: ${this.isMobile ? '15px' : '10px'}; background-color: #2a3a5a; color: white; border: 1px solid #33aaff; border-radius: 5px; cursor: pointer; font-size: ${this.isMobile ? '16px' : 'inherit'};`;
    }

    /**
     * Gets styles for action buttons container
     */
    getActionButtonsContainerStyle() {
        return `display: flex; justify-content: space-between; flex-direction: ${this.isMobile ? 'column' : 'row'}; gap: ${this.isMobile ? '15px' : '0'};`;
    }

    /**
     * Gets styles for apply button
     */
    getApplyButtonStyle() {
        return `flex: 1; margin-right: ${this.isMobile ? '0' : '10px'}; padding: ${this.isMobile ? '20px' : '15px'}; background-color: #33aaff; color: black; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: ${this.isMobile ? '18px' : '16px'};`;
    }

    /**
     * Gets styles for back button
     */
    getBackButtonStyle() {
        return `flex: 1; padding: ${this.isMobile ? '20px' : '15px'}; background-color: #555; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: ${this.isMobile ? '18px' : '16px'};`;
    }

    /**
     * Gets styles for notification
     */
    getNotificationStyle() {
        return {
            position: 'fixed',
            top: this.isMobile ? '25%' : '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#33aaff',
            padding: this.isMobile ? '20px 40px' : '15px 30px',
            borderRadius: '10px',
            fontFamily: 'Courier New, monospace',
            fontSize: this.isMobile ? '18px' : '16px',
            zIndex: '9999',
            textAlign: 'center'
        };
    }

    /**
     * Injects toggle slider CSS into the document head
     */
    injectToggleCSS() {
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
    }

    /**
     * Creates a settings row with label and control
     */
    createSettingRow(labelText, description, controlHtml) {
        return `
            <div class="settings-row" style="${this.getSettingsRowStyle()}">
                <div style="${this.getSettingLabelStyle()}">
                    <label style="${this.getLabelTextStyle()}">${labelText}</label>
                    <p style="${this.getDescriptionTextStyle()}">${description}</p>
                </div>
                <div style="${this.getSettingControlStyle()}">
                    ${controlHtml}
                </div>
            </div>
        `;
    }

    /**
     * Creates a toggle settings row
     */
    createToggleRow(labelText, description, inputId) {
        const toggleHtml = `
            <label class="toggle" style="${this.getToggleStyle()}">
                <input type="checkbox" id="${inputId}" style="${this.getToggleInputStyle()}">
                <span class="slider" style="${this.getToggleSliderStyle()}"></span>
            </label>
        `;

        return `
            <div class="settings-row" style="${this.getSettingsRowStyle()}">
                <div style="${this.getSettingLabelStyle()}">
                    <label style="${this.getLabelTextStyle()}">${labelText}</label>
                    <p style="${this.getDescriptionTextStyle()}">${description}</p>
                </div>
                <div style="${this.getToggleControlStyle()}">
                    ${toggleHtml}
                </div>
            </div>
        `;
    }

    /**
     * Creates a select dropdown settings row
     */
    createSelectRow(labelText, description, selectId, options) {
        const optionsHtml = options.map(option => 
            `<option value="${option.value}">${option.text}</option>`
        ).join('');

        const selectHtml = `
            <select id="${selectId}" style="${this.getSelectStyle()}">
                ${optionsHtml}
            </select>
        `;

        return this.createSettingRow(labelText, description, selectHtml);
    }
}