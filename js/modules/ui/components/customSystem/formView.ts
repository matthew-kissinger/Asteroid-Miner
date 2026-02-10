// formView.ts - Form creation, input fields, UI layout

import type { StyleManager } from './styles.ts';
import type { ValidationManager } from './validation.ts';

export class FormViewManager {
    isMobile: boolean;
    styleManager: StyleManager | null;
    scrollTimeout: ReturnType<typeof setTimeout> | null;
    validationManager: ValidationManager | null;

    constructor(isMobile: boolean = false, styleManager: StyleManager | null = null) {
        this.isMobile = isMobile;
        this.styleManager = styleManager;
        this.scrollTimeout = null;
        this.validationManager = null;
    }

    createMainContainer(): HTMLDivElement {
        const container = document.createElement('div');
        container.id = 'custom-system-creator';
        container.className = 'modal-container';
        container.style.display = 'none';
        return container;
    }

    createModalContent(): string {
        const styles = this.styleManager?.getMobileStyles() || {};

        return `
            <div class="modal-content" style="${styles.modalContent || ''}">
                <div class="modal-header">
                    <h2>Create New Star System</h2>
                    <button id="close-system-creator" class="close-btn" style="${styles.closeBtn || ''}">&times;</button>
                </div>
                <div class="modal-body" style="${styles.modalBody || ''}">
                    <div id="system-creator-form">
                        ${this.createSystemForm()}
                        ${this.createPlanetSection()}
                        ${this.createFormActions()}
                    </div>
                    ${this.createProgressSection()}
                    ${this.createPreviewSection()}
                </div>
            </div>
        `;
    }

    createSystemForm(): string {
        const styles = this.styleManager?.getMobileStyles() || {};

        return `
            <div class="form-group">
                <label for="system-name">System Name:</label>
                <input type="text" id="system-name" placeholder="Enter a name for your star system" style="${styles.input || ''}">
            </div>

            <div class="form-group">
                <label for="skybox-description">Skybox Description:</label>
                <textarea id="skybox-description" rows="${this.styleManager?.getTextareaRows(4) || 4}" placeholder="Describe the skybox/space environment (e.g., 'A vibrant nebula with blue and purple clouds, dotted with bright stars')" style="${styles.textarea || ''}"></textarea>
            </div>

            <div class="form-group">
                <label for="star-class">Star Class:</label>
                <select id="star-class" class="form-control" style="${styles.select || ''}">
                    <option value="O">O - Blue Giant (Hot, Blue)</option>
                    <option value="B">B - Blue-White</option>
                    <option value="A">A - White</option>
                    <option value="F">F - Yellow-White</option>
                    <option value="G" selected>G - Yellow (Sun-like)</option>
                    <option value="K">K - Orange</option>
                    <option value="M">M - Red Dwarf</option>
                </select>
                <p class="help-text">Different star classes affect the lighting and appearance of your system.</p>
            </div>
        `;
    }

    createPlanetSection(): string {
        const styles = this.styleManager?.getMobileStyles() || {};

        return `
            <div id="planet-descriptions">
                <div class="form-group planet-input">
                    ${this.createPlanetForm(1, styles)}
                </div>
            </div>

            <button id="add-planet-btn" class="secondary-btn" style="${styles.secondaryBtn || ''}">+ Add Another Planet</button>
        `;
    }

    createPlanetForm(index: number, styles: Record<string, string> = {}): string {
        return `
            <h3>Planet ${index}</h3>
            <label for="planet-name-${index}">Planet Name:</label>
            <input type="text" id="planet-name-${index}" placeholder="Enter a name for this planet" style="${styles.input || ''}">

            <label for="planet-description-${index}">Planet Description:</label>
            <textarea id="planet-description-${index}" rows="${this.styleManager?.getTextareaRows(3) || 3}" placeholder="Describe the planet (e.g., 'A rocky planet with large oceans and ice caps')" style="${styles.textarea || ''}" maxlength="150"></textarea>

            <div class="planet-properties">
                ${this.createPlanetSliders(index, styles)}
                ${this.createPlanetRings(index, styles)}
            </div>

            ${index > 1 ? this.createRemoveButton(styles) : ''}
        `;
    }

    createPlanetSliders(index: number, styles: Record<string, string> = {}): string {
        return `
            <div class="property-row">
                <label for="planet-size-${index}">Size:</label>
                <input type="range" id="planet-size-${index}" min="300" max="1000" value="450" class="slider" style="${styles.slider || ''}">
                <span class="slider-value" id="planet-size-value-${index}">450</span>
            </div>

            <div class="property-row">
                <label for="planet-distance-${index}">Distance from Star:</label>
                <input type="range" id="planet-distance-${index}" min="4000" max="60000" value="${4000 + index * 6000}" class="slider" style="${styles.slider || ''}">
                <span class="slider-value" id="planet-distance-value-${index}">${4000 + index * 6000}</span>
            </div>

            <div class="property-row">
                <label for="planet-speed-${index}">Orbit Speed:</label>
                <input type="range" id="planet-speed-${index}" min="1" max="10" value="5" class="slider" style="${styles.slider || ''}">
                <span class="slider-value" id="planet-speed-value-${index}">0.0015</span>
            </div>
        `;
    }

    createPlanetRings(index: number, styles: Record<string, string> = {}): string {
        return `
            <div class="property-row" style="${styles.checkboxRow || ''}">
                <label for="planet-rings-${index}">Has Rings:</label>
                <input type="checkbox" id="planet-rings-${index}" style="${styles.checkbox || ''}">
            </div>
        `;
    }

    createRemoveButton(styles: Record<string, string> = {}): string {
        const rippleClass = this.isMobile ? 'ripple' : '';
        return `<button class="remove-planet-btn danger-btn ${rippleClass}" style="${styles.removeBtn || ''}">Remove</button>`;
    }

    createFormActions(): string {
        const styles = this.styleManager?.getMobileStyles() || {};

        return `
            <div class="form-actions">
                <button id="generate-system-btn" class="primary-btn" style="${styles.primaryBtn || ''}">Generate System</button>
            </div>
        `;
    }

    createProgressSection(): string {
        return `
            <div id="generation-progress" style="display: none;">
                <h3>Generating your star system...</h3>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p id="generation-status">Initializing...</p>
            </div>
        `;
    }

    createPreviewSection(): string {
        const styles = this.styleManager?.getMobileStyles() || {};

        return `
            <div id="system-preview" style="display: none;">
                <h3>Preview</h3>
                <div class="preview-container" style="${styles.previewContainer || ''}">
                    <div class="skybox-preview" style="${styles.skyboxPreview || ''}">
                        <h4>Skybox</h4>
                        <img id="skybox-preview-img" src="" alt="Skybox Preview">
                    </div>
                    <div class="planets-preview" id="planets-preview" style="${styles.planetsPreview || ''}">
                        <!-- Planet previews will be added here dynamically -->
                    </div>
                </div>
                <div class="form-actions" style="${styles.formActions || ''}">
                    <button id="travel-to-system-btn" class="primary-btn" style="${styles.primaryBtn || ''}">Travel to System</button>
                    <button id="regenerate-system-btn" class="secondary-btn" style="${styles.secondaryBtn || ''}">Regenerate</button>
                </div>
            </div>
        `;
    }

    addPlanetInput(
        planetDescriptions: HTMLElement,
        setupSliderListeners: (index: number) => void,
        updatePlanetNumbers: () => void,
        playUISound: (() => void) | null
    ): HTMLDivElement {
        const planetInputs = planetDescriptions.getElementsByClassName('planet-input');
        const newIndex = planetInputs.length + 1;
        const styles = this.styleManager?.getMobileStyles() || {};

        const planetDiv = document.createElement('div');
        planetDiv.className = 'form-group planet-input';
        planetDiv.innerHTML = this.createPlanetForm(newIndex, styles);

        planetDescriptions.appendChild(planetDiv);

        // Set up event listeners for the sliders
        setupSliderListeners(newIndex);

        // Add event listener to remove button
        const removeBtn = planetDiv.querySelector<HTMLButtonElement>('.remove-planet-btn');
        if (removeBtn) {
            this.setupRemoveButton(removeBtn, planetDiv, updatePlanetNumbers, playUISound);
        }

        // Add mobile-specific enhancements
        if (this.isMobile) {
            this.enhanceMobileInteraction(planetDiv);
        }

        // Scroll to new planet on mobile
        this.scrollToNewPlanet(planetDescriptions);

        return planetDiv;
    }

    setupRemoveButton(
        removeBtn: HTMLButtonElement,
        planetDiv: HTMLElement,
        updatePlanetNumbers: () => void,
        playUISound: (() => void) | null
    ): void {
        const removeHandler = (e?: Event): void => {
            if (e) e.preventDefault();
            planetDiv.remove();
            updatePlanetNumbers();
            if (playUISound) playUISound();
        };

        removeBtn.addEventListener('click', removeHandler);

        if (this.isMobile) {
            removeBtn.addEventListener('touchend', removeHandler as EventListener);
        }
    }

    enhanceMobileInteraction(planetDiv: HTMLElement): void {
        // Add touch events to sliders for better mobile interaction
        const sliders = planetDiv.querySelectorAll<HTMLInputElement>('input[type="range"]');
        sliders.forEach(slider => {
            slider.addEventListener('touchstart', () => {
                slider.classList.add('slider-active');
            });

            slider.addEventListener('touchend', () => {
                slider.classList.remove('slider-active');
            });
        });

        // Add character counter to planet description
        const planetDesc = planetDiv.querySelector<HTMLTextAreaElement>(`textarea[id^="planet-description-"]`);
        if (planetDesc && this.validationManager) {
            this.validationManager.addCharacterCounter(planetDesc, 150);
        }
    }

    scrollToNewPlanet(planetDescriptions: HTMLElement): void {
        if (!this.isMobile) return;

        // Clear any existing scroll timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        // Use a safer scrolling approach
        this.scrollTimeout = setTimeout(() => {
            try {
                const modalContent = document.querySelector<HTMLElement>('#custom-system-creator .modal-content');
                const newPlanet = planetDescriptions.lastElementChild as HTMLElement | null;

                if (modalContent && newPlanet) {
                    const planetPos = newPlanet.offsetTop;
                    const scrollPos = planetPos - (modalContent.clientHeight / 4);

                    modalContent.scrollTo({
                        top: scrollPos,
                        behavior: 'smooth'
                    });
                }
            } catch (err) {
                console.warn('Error during scroll:', err);
            }
        }, 100);
    }

    updatePlanetNumbers(planetDescriptions: HTMLElement): void {
        const planetInputs = planetDescriptions.getElementsByClassName('planet-input');
        for (let i = 0; i < planetInputs.length; i++) {
            const planetDiv = planetInputs[i];
            const planetHeader = planetDiv.querySelector('h3');
            if (planetHeader) {
                planetHeader.textContent = `Planet ${i + 1}`;
            }
        }
    }

    addRippleEffect(container: HTMLElement): void {
        if (!this.isMobile) return;

        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
            if (!button.classList.contains('ripple')) {
                button.classList.add('ripple');
            }
        });
    }

    setupSliderListeners(index: number): void {
        // Size slider
        const sizeSlider = document.getElementById(`planet-size-${index}`) as HTMLInputElement | null;
        const sizeValue = document.getElementById(`planet-size-value-${index}`);

        if (sizeSlider && sizeValue) {
            sizeSlider.addEventListener('input', () => {
                sizeValue.textContent = sizeSlider.value;
            });
        }

        // Distance slider
        const distanceSlider = document.getElementById(`planet-distance-${index}`) as HTMLInputElement | null;
        const distanceValue = document.getElementById(`planet-distance-value-${index}`);

        if (distanceSlider && distanceValue) {
            distanceSlider.addEventListener('input', () => {
                distanceValue.textContent = distanceSlider.value;
            });
        }

        // Speed slider
        const speedSlider = document.getElementById(`planet-speed-${index}`) as HTMLInputElement | null;
        const speedValue = document.getElementById(`planet-speed-value-${index}`);

        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', () => {
                // Convert 1-10 range to 0.001-0.002 range
                const speed = 0.001 + (parseFloat(speedSlider.value) - 1) * (0.001 / 9);
                speedValue.textContent = speed.toFixed(4);
            });
        }

        // Add mobile visual feedback
        if (this.isMobile) {
            const sliders = [sizeSlider, distanceSlider, speedSlider].filter((s): s is HTMLInputElement => s !== null);
            sliders.forEach(slider => {
                slider.addEventListener('touchstart', () => {
                    slider.classList.add('slider-active');
                });

                slider.addEventListener('touchend', () => {
                    slider.classList.remove('slider-active');
                });
            });
        }
    }

    cleanup(): void {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
    }
}
