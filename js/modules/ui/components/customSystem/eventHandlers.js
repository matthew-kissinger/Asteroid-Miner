// eventHandlers.js - Form events, button clicks, interactions

export class EventHandlerManager {
    constructor(customSystemCreator, isMobile = false) {
        this.customSystemCreator = customSystemCreator;
        this.isMobile = isMobile;
        this.handlers = new Map();
    }

    setupAllEventHandlers(container, elements) {
        this.setupCloseHandlers(elements.closeBtn);
        this.setupFormHandlers(elements);
        this.setupKeyboardHandlers();
        this.setupContainerHandlers(container);
        
        if (this.isMobile) {
            this.setupMobileHandlers(container, elements);
        }
    }

    setupCloseHandlers(closeBtn) {
        const closeHandler = (e) => {
            if (e) e.preventDefault();
            this.customSystemCreator.hide();
            this.customSystemCreator.playUISound();
        };

        closeBtn.addEventListener('click', closeHandler);
        
        if (this.isMobile) {
            closeBtn.addEventListener('touchend', closeHandler);
        }
    }

    setupFormHandlers(elements) {
        // Add Planet button
        const addPlanetHandler = (e) => {
            if (e) e.preventDefault();
            this.customSystemCreator.addPlanetInput();
            this.customSystemCreator.playUISound();
        };

        elements.addPlanetBtn.addEventListener('click', addPlanetHandler);
        
        if (this.isMobile) {
            elements.addPlanetBtn.addEventListener('touchend', addPlanetHandler);
        }

        // Generate System button
        const generateHandler = (e) => {
            if (e) e.preventDefault();
            this.customSystemCreator.generateSystem();
            this.customSystemCreator.playUISound();
        };

        elements.generateSystemBtn.addEventListener('click', generateHandler);
        
        if (this.isMobile) {
            elements.generateSystemBtn.addEventListener('touchend', generateHandler);
        }

        // Travel to System button
        const travelHandler = (e) => {
            if (e) e.preventDefault();
            this.customSystemCreator.travelToSystem();
            this.customSystemCreator.playUISound();
        };

        elements.travelToSystemBtn.addEventListener('click', travelHandler);
        
        if (this.isMobile) {
            elements.travelToSystemBtn.addEventListener('touchend', travelHandler);
        }

        // Regenerate button
        const regenerateHandler = (e) => {
            if (e) e.preventDefault();
            elements.systemPreview.style.display = 'none';
            elements.systemForm.style.display = 'block';
            this.customSystemCreator.playUISound();
        };

        elements.regenerateSystemBtn.addEventListener('click', regenerateHandler);
        
        if (this.isMobile) {
            elements.regenerateSystemBtn.addEventListener('touchend', regenerateHandler);
        }
    }

    setupKeyboardHandlers() {
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.customSystemCreator.isVisible) {
                this.customSystemCreator.hide();
            }
        };

        document.addEventListener('keydown', escapeHandler);
        this.handlers.set('escape', escapeHandler);
    }

    setupContainerHandlers(container) {
        // Click outside to close
        const clickOutsideHandler = (e) => {
            if (e.target === container) {
                this.customSystemCreator.hide();
            }
        };

        container.addEventListener('click', clickOutsideHandler);
        this.handlers.set('clickOutside', clickOutsideHandler);
    }

    setupMobileHandlers(container, elements) {
        // Touch start on container to close (mobile)
        const touchCloseHandler = (e) => {
            if (e.target === container) {
                e.preventDefault();
                this.customSystemCreator.hide();
            }
        };

        container.addEventListener('touchstart', touchCloseHandler, { passive: false });
        this.handlers.set('touchClose', touchCloseHandler);

        // Improve scroll handling
        container.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: true });

        // Improve scroll performance
        const modalContent = container.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('touchstart', () => {}, { passive: true });
            modalContent.addEventListener('touchmove', () => {}, { passive: true });
        }

        // Add body scroll prevention
        this.setupBodyScrollPrevention();
    }

    setupBodyScrollPrevention() {
        const preventScroll = (e) => {
            if (this.customSystemCreator.isVisible) {
                e.preventDefault();
            }
        };

        document.body.addEventListener('touchmove', preventScroll, { passive: false });
        this.handlers.set('preventScroll', preventScroll);
    }

    setupSliderHandlers(index, formViewManager) {
        if (formViewManager && typeof formViewManager.setupSliderListeners === 'function') {
            formViewManager.setupSliderListeners(index);
        }
    }

    setupRemoveButtonHandler(removeBtn, planetDiv, updatePlanetNumbers) {
        const removeHandler = (e) => {
            if (e) e.preventDefault();
            planetDiv.remove();
            updatePlanetNumbers();
            this.customSystemCreator.playUISound();
        };

        removeBtn.addEventListener('click', removeHandler);

        if (this.isMobile) {
            removeBtn.addEventListener('touchend', removeHandler);
            
            // Add touch feedback for sliders in this planet
            const sliders = planetDiv.querySelectorAll('input[type="range"]');
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

    addDynamicEventHandlers(element, handlers = {}) {
        Object.entries(handlers).forEach(([event, handler]) => {
            if (typeof handler === 'function') {
                element.addEventListener(event, handler);
                
                // Store handler for cleanup
                if (!this.handlers.has(element)) {
                    this.handlers.set(element, new Map());
                }
                this.handlers.get(element).set(event, handler);
            }
        });
    }

    removeDynamicEventHandlers(element) {
        if (this.handlers.has(element)) {
            const elementHandlers = this.handlers.get(element);
            elementHandlers.forEach((handler, event) => {
                element.removeEventListener(event, handler);
            });
            this.handlers.delete(element);
        }
    }

    cleanup() {
        // Remove all registered event handlers
        this.handlers.forEach((handler, key) => {
            if (typeof key === 'string') {
                // Global handlers like escape key
                switch (key) {
                    case 'escape':
                        document.removeEventListener('keydown', handler);
                        break;
                    case 'preventScroll':
                        document.body.removeEventListener('touchmove', handler);
                        break;
                }
            } else if (key instanceof Element) {
                // Element-specific handlers
                if (handler instanceof Map) {
                    handler.forEach((handlerFunc, event) => {
                        key.removeEventListener(event, handlerFunc);
                    });
                } else {
                    // Single handler
                    key.removeEventListener('click', handler);
                    key.removeEventListener('touchend', handler);
                    key.removeEventListener('touchstart', handler);
                    key.removeEventListener('touchmove', handler);
                }
            }
        });

        this.handlers.clear();
    }

    // Utility method to add mobile-friendly event listeners
    addMobileFriendlyListener(element, eventType, handler, options = {}) {
        const wrappedHandler = (e) => {
            if (this.isMobile && e.type === 'touchend') {
                e.preventDefault();
            }
            handler(e);
        };

        element.addEventListener(eventType, wrappedHandler, options);

        if (this.isMobile && eventType === 'click') {
            element.addEventListener('touchend', wrappedHandler, options);
        }

        // Store for cleanup
        if (!this.handlers.has(element)) {
            this.handlers.set(element, new Map());
        }
        this.handlers.get(element).set(eventType, wrappedHandler);

        return wrappedHandler;
    }

    // Method to handle form validation events
    setupValidationHandlers(elements, validationManager) {
        if (!validationManager) return;

        // Real-time validation for system name
        elements.systemNameInput.addEventListener('blur', () => {
            const validation = validationManager.validateSystemForm(
                elements.systemNameInput, 
                elements.skyboxDescription
            );
            
            if (!validation.isValid && elements.systemNameInput.value.trim()) {
                this.showFieldError(elements.systemNameInput, validation.message);
            } else {
                this.clearFieldError(elements.systemNameInput);
            }
        });

        // Real-time validation for skybox description
        elements.skyboxDescription.addEventListener('blur', () => {
            const validation = validationManager.validateSystemForm(
                elements.systemNameInput, 
                elements.skyboxDescription
            );
            
            if (!validation.isValid && elements.skyboxDescription.value.trim()) {
                this.showFieldError(elements.skyboxDescription, validation.message);
            } else {
                this.clearFieldError(elements.skyboxDescription);
            }
        });
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ff3030';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
        field.style.borderColor = '#ff3030';
    }

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '';
    }
}