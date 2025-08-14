// validation.js - Form validation, constraints, error handling

export class ValidationManager {
    constructor(isMobile = false) {
        this.isMobile = isMobile;
    }

    validateSystemForm(systemNameInput, skyboxDescription) {
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

    validatePlanetData(planetDiv, planetIndex) {
        const nameInput = planetDiv.querySelector(`input[id^="planet-name-"]`);
        const descInput = planetDiv.querySelector(`textarea[id^="planet-description-"]`);

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

    collectPlanetData(planetInputs) {
        const planets = [];
        const errors = [];

        for (let i = 0; i < planetInputs.length; i++) {
            const planetDiv = planetInputs[i];
            const planetIndex = i + 1;

            const validation = this.validatePlanetData(planetDiv, planetIndex);
            if (!validation.isValid) {
                errors.push(validation.message);
                continue;
            }

            const nameInput = planetDiv.querySelector(`input[id^="planet-name-"]`);
            const descInput = planetDiv.querySelector(`textarea[id^="planet-description-"]`);
            const sizeInput = planetDiv.querySelector(`input[id^="planet-size-"]`);
            const distanceInput = planetDiv.querySelector(`input[id^="planet-distance-"]`);
            const speedInput = planetDiv.querySelector(`input[id^="planet-speed-"]`);
            const ringsInput = planetDiv.querySelector(`input[id^="planet-rings-"]`);

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

    addCharacterCounter(textarea, maxChars) {
        if (!textarea || !this.isMobile) return;

        // Create counter element
        const counter = document.createElement('div');
        counter.className = 'char-counter';

        // Update counter text
        const updateCounter = () => {
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
                counter.textContent = "0 characters remaining";
            }
        };

        // Add event listeners
        textarea.addEventListener('input', updateCounter);
        textarea.addEventListener('keydown', (e) => {
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
        textarea.parentNode.insertBefore(counter, textarea.nextSibling);

        // Set maxlength attribute (fallback)
        textarea.setAttribute('maxlength', maxChars.toString());
    }

    setupCharacterCounters(skyboxDescription, planetDescriptions) {
        if (!this.isMobile) return;

        // Skybox description
        this.addCharacterCounter(skyboxDescription, 250);

        // Add counter to first planet and set up event listener for future planets
        const firstPlanetDesc = document.getElementById('planet-description-1');
        if (firstPlanetDesc) {
            this.addCharacterCounter(firstPlanetDesc, 150);
        }
    }

    validatePlanetCount(planetInputs) {
        if (planetInputs.length === 0) {
            return { isValid: false, message: 'Please add at least one planet to your system.' };
        }

        if (planetInputs.length > 8) {
            return { isValid: false, message: 'Maximum of 8 planets allowed per system.' };
        }

        return { isValid: true };
    }

    showMobileAlert(message, playUISound = null) {
        if (this.isMobile) {
            // Create a custom alert overlay for mobile
            const alertOverlay = document.createElement('div');
            alertOverlay.style.position = 'fixed';
            alertOverlay.style.top = '0';
            alertOverlay.style.left = '0';
            alertOverlay.style.width = '100%';
            alertOverlay.style.height = '100%';
            alertOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            alertOverlay.style.display = 'flex';
            alertOverlay.style.justifyContent = 'center';
            alertOverlay.style.alignItems = 'center';
            alertOverlay.style.zIndex = '10000';

            const alertBox = document.createElement('div');
            alertBox.style.backgroundColor = '#0a1a2a';
            alertBox.style.color = '#c5d8f1';
            alertBox.style.padding = '20px';
            alertBox.style.borderRadius = '10px';
            alertBox.style.maxWidth = '80%';
            alertBox.style.textAlign = 'center';
            alertBox.style.border = '2px solid #2c5a8c';

            const messageEl = document.createElement('p');
            messageEl.textContent = message;
            messageEl.style.marginBottom = '20px';
            messageEl.style.fontSize = '16px';

            const okButton = document.createElement('button');
            okButton.textContent = 'OK';
            okButton.style.padding = '12px 30px';
            okButton.style.fontSize = '16px';
            okButton.style.backgroundColor = '#2c5a8c';
            okButton.style.color = 'white';
            okButton.style.border = 'none';
            okButton.style.borderRadius = '5px';
            okButton.style.minHeight = '48px';
            okButton.style.minWidth = '120px';

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

            okButton.addEventListener('touchend', (e) => {
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