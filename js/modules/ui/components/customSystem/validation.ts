// validation.ts - Form validation, constraints, error handling

type ValidationResult = {
    isValid: boolean;
    message?: string;
};

type PlanetDataCollectionResult = {
    planets: {
        name: string;
        description: string;
        size: number;
        distance: number;
        speed: number;
        rings: boolean;
    }[];
    errors: string[];
};

export class ValidationManager {
    isMobile: boolean;

    constructor(isMobile: boolean = false) {
        this.isMobile = isMobile;
    }

    validateSystemForm(systemNameInput: HTMLInputElement, skyboxDescription: HTMLTextAreaElement): ValidationResult {
        const systemName = systemNameInput.value.trim();
        const skyboxDesc = skyboxDescription.value.trim();

        if (!systemName) {
            return { isValid: false, message: 'Please enter a system name.' };
        }

        if (!skyboxDesc) {
            return { isValid: false, message: 'Please enter a skybox description.' };
        }

        if (systemName.length < 3) {
            return { isValid: false, message: 'System name must be at least 3 characters long.' };
        }

        if (skyboxDesc.length < 10) {
            return { isValid: false, message: 'Skybox description must be at least 10 characters long.' };
        }

        return { isValid: true };
    }

    validatePlanetData(planetDiv: HTMLElement, planetIndex: number): ValidationResult {
        const nameInput = planetDiv.querySelector<HTMLInputElement>(`input[id^="planet-name-"]`);
        const descInput = planetDiv.querySelector<HTMLTextAreaElement>(`textarea[id^="planet-description-"]`);

        if (!nameInput || !descInput) {
            return { isValid: false, message: `Planet ${planetIndex} is missing required fields.` };
        }

        const planetName = nameInput.value.trim();
        const planetDesc = descInput.value.trim();

        if (!planetName) {
            return { isValid: false, message: `Please enter a name for Planet ${planetIndex}.` };
        }

        if (!planetDesc) {
            return { isValid: false, message: `Please enter a description for Planet ${planetIndex}.` };
        }

        if (planetName.length < 2) {
            return { isValid: false, message: `Planet ${planetIndex} name must be at least 2 characters long.` };
        }

        if (planetDesc.length < 5) {
            return { isValid: false, message: `Planet ${planetIndex} description must be at least 5 characters long.` };
        }

        return { isValid: true };
    }

    collectPlanetData(planetInputs: HTMLCollectionOf<Element>): PlanetDataCollectionResult {
        const planets: {
            name: string;
            description: string;
            size: number;
            distance: number;
            speed: number;
            rings: boolean;
        }[] = [];
        const errors: string[] = [];

        for (let i = 0; i < planetInputs.length; i++) {
            const planetDiv = planetInputs[i] as HTMLElement;
            const planetIndex = i + 1;

            const validation = this.validatePlanetData(planetDiv, planetIndex);
            if (!validation.isValid) {
                if (validation.message) {
                    errors.push(validation.message);
                }
                continue;
            }

            const nameInput = planetDiv.querySelector<HTMLInputElement>(`input[id^="planet-name-"]`);
            const descInput = planetDiv.querySelector<HTMLTextAreaElement>(`textarea[id^="planet-description-"]`);
            const sizeInput = planetDiv.querySelector<HTMLInputElement>(`input[id^="planet-size-"]`);
            const distanceInput = planetDiv.querySelector<HTMLInputElement>(`input[id^="planet-distance-"]`);
            const speedInput = planetDiv.querySelector<HTMLInputElement>(`input[id^="planet-speed-"]`);
            const ringsInput = planetDiv.querySelector<HTMLInputElement>(`input[id^="planet-rings-"]`);

            if (!nameInput || !descInput || !sizeInput || !distanceInput || !speedInput || !ringsInput) {
                errors.push(`Planet ${planetIndex} is missing required input fields.`);
                continue;
            }

            // Calculate speed from slider (1-10 to 0.001-0.002)
            const speedValue = parseFloat(speedInput.value);
            const orbitSpeed = 0.001 + (speedValue - 1) * (0.001 / 9);

            planets.push({
                name: nameInput.value.trim(),
                description: descInput.value.trim(),
                size: parseInt(sizeInput.value),
                distance: parseInt(distanceInput.value),
                speed: orbitSpeed,
                rings: ringsInput.checked
            });
        }

        return { planets, errors };
    }

    addCharacterCounter(textarea: HTMLTextAreaElement, maxChars: number): void {
        if (!textarea || !this.isMobile) return;

        // Create counter element
        const counter = document.createElement('div');
        counter.className = 'char-counter';

        // Update counter text
        const updateCounter = (): void => {
            const remaining = maxChars - textarea.value.length;
            counter.textContent = `${remaining} characters remaining`;

            // Change color based on remaining characters
            counter.className = 'char-counter';
            if (remaining < 30) {
                counter.classList.add('warning');
            }
            if (remaining < 10) {
                counter.classList.add('error');
            }

            // Enforce character limit
            if (remaining < 0) {
                textarea.value = textarea.value.substring(0, maxChars);
                counter.textContent = '0 characters remaining';
            }
        };

        // Add event listeners
        textarea.addEventListener('input', updateCounter);
        textarea.addEventListener('keydown', (e: KeyboardEvent) => {
            // Allow deletion even at max characters
            if (textarea.value.length >= maxChars &&
                e.key !== 'Backspace' &&
                e.key !== 'Delete' &&
                e.key !== 'ArrowLeft' &&
                e.key !== 'ArrowRight' &&
                !e.ctrlKey &&
                !e.metaKey) {
                e.preventDefault();
            }
        });

        // Set initial counter
        updateCounter();

        // Add counter after textarea
        textarea.parentNode?.insertBefore(counter, textarea.nextSibling);

        // Set maxlength attribute (fallback)
        textarea.setAttribute('maxlength', maxChars.toString());
    }

    setupCharacterCounters(skyboxDescription: HTMLTextAreaElement, _planetDescriptions: HTMLElement): void {
        if (!this.isMobile) return;

        // Skybox description
        this.addCharacterCounter(skyboxDescription, 250);

        // Add counter to first planet and set up event listener for future planets
        const firstPlanetDesc = document.getElementById('planet-description-1') as HTMLTextAreaElement | null;
        if (firstPlanetDesc) {
            this.addCharacterCounter(firstPlanetDesc, 150);
        }
    }

    validatePlanetCount(planetInputs: HTMLCollectionOf<Element>): ValidationResult {
        if (planetInputs.length === 0) {
            return { isValid: false, message: 'Please add at least one planet to your system.' };
        }

        if (planetInputs.length > 8) {
            return { isValid: false, message: 'Maximum of 8 planets allowed per system.' };
        }

        return { isValid: true };
    }

    showMobileAlert(message: string, playUISound: (() => void) | null = null): void {
        if (this.isMobile) {
            // Create a custom alert overlay for mobile
            const alertOverlay = document.createElement('div');
            alertOverlay.classList.add('mobile-alert-overlay');

            const alertBox = document.createElement('div');
            alertBox.classList.add('mobile-alert-content');

            const messageEl = document.createElement('p');
            messageEl.textContent = message;
            messageEl.classList.add('mobile-alert-message');

            const okButton = document.createElement('button');
            okButton.textContent = 'OK';
            okButton.classList.add('mobile-alert-button');

            alertBox.appendChild(messageEl);
            alertBox.appendChild(okButton);
            alertOverlay.appendChild(alertBox);
            document.body.appendChild(alertOverlay);

            // Play sound if available
            if (playUISound) {
                playUISound();
            }

            // Handle button click and touch
            okButton.addEventListener('click', () => {
                document.body.removeChild(alertOverlay);
            });

            okButton.addEventListener('touchend', (e: TouchEvent) => {
                e.preventDefault();
                document.body.removeChild(alertOverlay);
                if (playUISound) {
                    playUISound();
                }
            });

        } else {
            // Fall back to regular alert for desktop
            alert(message);
        }
    }
}
