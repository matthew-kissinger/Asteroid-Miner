// eventHandlers.ts - Form events, button clicks, interactions

import type { CustomSystemCreator } from '../../customSystemCreator.ts';
import type { FormViewManager } from './formView.ts';
import type { ValidationManager } from './validation.ts';

type EventHandler = (e?: Event) => void;

interface ElementRefs {
    closeBtn: HTMLButtonElement;
    addPlanetBtn: HTMLButtonElement;
    generateSystemBtn: HTMLButtonElement;
    travelToSystemBtn: HTMLButtonElement;
    regenerateSystemBtn: HTMLButtonElement;
    systemForm: HTMLDivElement;
    systemPreview: HTMLDivElement;
    systemNameInput: HTMLInputElement;
    skyboxDescription: HTMLTextAreaElement;
}

export class EventHandlerManager {
    customSystemCreator: CustomSystemCreator;
    isMobile: boolean;
    handlers: Map<string | Element, EventHandler | Map<string, EventHandler>>;

    constructor(customSystemCreator: CustomSystemCreator, isMobile: boolean = false) {
        this.customSystemCreator = customSystemCreator;
        this.isMobile = isMobile;
        this.handlers = new Map();
    }

    setupAllEventHandlers(container: HTMLElement, elements: ElementRefs): void {
        this.setupCloseHandlers(elements.closeBtn);
        this.setupFormHandlers(elements);
        this.setupKeyboardHandlers();
        this.setupContainerHandlers(container);

        if (this.isMobile) {
            this.setupMobileHandlers(container, elements);
        }
    }

    setupCloseHandlers(closeBtn: HTMLButtonElement): void {
        const closeHandler: EventHandler = (e?: Event) => {
            if (e) e.preventDefault();
            this.customSystemCreator.hide();
            this.customSystemCreator.playUISound();
        };

        closeBtn.addEventListener('click', closeHandler);

        if (this.isMobile) {
            closeBtn.addEventListener('touchend', closeHandler as EventListener);
        }
    }

    setupFormHandlers(elements: ElementRefs): void {
        // Add Planet button
        const addPlanetHandler: EventHandler = (e?: Event) => {
            if (e) e.preventDefault();
            this.customSystemCreator.addPlanetInput();
            this.customSystemCreator.playUISound();
        };

        elements.addPlanetBtn.addEventListener('click', addPlanetHandler);

        if (this.isMobile) {
            elements.addPlanetBtn.addEventListener('touchend', addPlanetHandler as EventListener);
        }

        // Generate System button
        const generateHandler: EventHandler = (e?: Event) => {
            if (e) e.preventDefault();
            this.customSystemCreator.generateSystem();
            this.customSystemCreator.playUISound();
        };

        elements.generateSystemBtn.addEventListener('click', generateHandler);

        if (this.isMobile) {
            elements.generateSystemBtn.addEventListener('touchend', generateHandler as EventListener);
        }

        // Travel to System button
        const travelHandler: EventHandler = (e?: Event) => {
            if (e) e.preventDefault();
            this.customSystemCreator.travelToSystem();
            this.customSystemCreator.playUISound();
        };

        elements.travelToSystemBtn.addEventListener('click', travelHandler);

        if (this.isMobile) {
            elements.travelToSystemBtn.addEventListener('touchend', travelHandler as EventListener);
        }

        // Regenerate button
        const regenerateHandler: EventHandler = (e?: Event) => {
            if (e) e.preventDefault();
            elements.systemPreview.style.display = 'none';
            elements.systemForm.style.display = 'block';
            this.customSystemCreator.playUISound();
        };

        elements.regenerateSystemBtn.addEventListener('click', regenerateHandler);

        if (this.isMobile) {
            elements.regenerateSystemBtn.addEventListener('touchend', regenerateHandler as EventListener);
        }
    }

    setupKeyboardHandlers(): void {
        const escapeHandler = (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && this.customSystemCreator.isVisible) {
                this.customSystemCreator.hide();
            }
        };

        document.addEventListener('keydown', escapeHandler);
        this.handlers.set('escape', escapeHandler as EventHandler);
    }

    setupContainerHandlers(container: HTMLElement): void {
        // Click outside to close
        const clickOutsideHandler = (e: MouseEvent): void => {
            if (e.target === container) {
                this.customSystemCreator.hide();
            }
        };

        container.addEventListener('click', clickOutsideHandler);
        this.handlers.set('clickOutside', clickOutsideHandler as EventHandler);
    }

    setupMobileHandlers(container: HTMLElement, elements: ElementRefs): void {
        // Touch start on container to close (mobile)
        const touchCloseHandler = (e: TouchEvent): void => {
            if (e.target === container) {
                e.preventDefault();
                this.customSystemCreator.hide();
            }
        };

        container.addEventListener('touchstart', touchCloseHandler, { passive: false });
        this.handlers.set('touchClose', touchCloseHandler as EventHandler);

        // Improve scroll handling
        container.addEventListener('touchmove', (e: TouchEvent) => {
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

    setupBodyScrollPrevention(): void {
        const preventScroll = (e: TouchEvent): void => {
            if (this.customSystemCreator.isVisible) {
                e.preventDefault();
            }
        };

        document.body.addEventListener('touchmove', preventScroll, { passive: false });
        this.handlers.set('preventScroll', preventScroll as EventHandler);
    }

    setupSliderHandlers(index: number, formViewManager: FormViewManager | null): void {
        if (formViewManager && typeof formViewManager.setupSliderListeners === 'function') {
            formViewManager.setupSliderListeners(index);
        }
    }

    setupRemoveButtonHandler(
        removeBtn: HTMLButtonElement,
        planetDiv: HTMLElement,
        updatePlanetNumbers: () => void
    ): void {
        const removeHandler: EventHandler = (e?: Event) => {
            if (e) e.preventDefault();
            planetDiv.remove();
            updatePlanetNumbers();
            this.customSystemCreator.playUISound();
        };

        removeBtn.addEventListener('click', removeHandler);

        if (this.isMobile) {
            removeBtn.addEventListener('touchend', removeHandler as EventListener);

            // Add touch feedback for sliders in this planet
            const sliders = planetDiv.querySelectorAll<HTMLInputElement>('input[type="range"]');
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

    addDynamicEventHandlers(element: Element, handlers: Record<string, EventListener> = {}): void {
        Object.entries(handlers).forEach(([event, handler]) => {
            if (typeof handler === 'function') {
                element.addEventListener(event, handler);

                // Store handler for cleanup
                if (!this.handlers.has(element)) {
                    this.handlers.set(element, new Map());
                }
                const elementHandlers = this.handlers.get(element) as Map<string, EventHandler>;
                elementHandlers.set(event, handler as EventHandler);
            }
        });
    }

    removeDynamicEventHandlers(element: Element): void {
        if (this.handlers.has(element)) {
            const elementHandlers = this.handlers.get(element) as Map<string, EventHandler>;
            elementHandlers.forEach((handler, event) => {
                element.removeEventListener(event, handler as EventListener);
            });
            this.handlers.delete(element);
        }
    }

    cleanup(): void {
        // Remove all registered event handlers
        this.handlers.forEach((handler, key) => {
            if (typeof key === 'string') {
                // Global handlers like escape key
                switch (key) {
                    case 'escape':
                        document.removeEventListener('keydown', handler as EventListener);
                        break;
                    case 'preventScroll':
                        document.body.removeEventListener('touchmove', handler as EventListener);
                        break;
                }
            } else if (key instanceof Element) {
                // Element-specific handlers
                if (handler instanceof Map) {
                    handler.forEach((handlerFunc, event) => {
                        key.removeEventListener(event, handlerFunc as EventListener);
                    });
                } else {
                    // Single handler
                    key.removeEventListener('click', handler as EventListener);
                    key.removeEventListener('touchend', handler as EventListener);
                    key.removeEventListener('touchstart', handler as EventListener);
                    key.removeEventListener('touchmove', handler as EventListener);
                }
            }
        });

        this.handlers.clear();
    }

    // Utility method to add mobile-friendly event listeners
    addMobileFriendlyListener(
        element: Element,
        eventType: string,
        handler: EventListener,
        options: AddEventListenerOptions = {}
    ): EventListener {
        const wrappedHandler = (e: Event): void => {
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
        const elementHandlers = this.handlers.get(element) as Map<string, EventHandler>;
        elementHandlers.set(eventType, wrappedHandler as EventHandler);

        return wrappedHandler;
    }

    // Method to handle form validation events
    setupValidationHandlers(elements: ElementRefs, validationManager: ValidationManager | null): void {
        if (!validationManager) return;

        // Real-time validation for system name
        elements.systemNameInput.addEventListener('blur', () => {
            const validation = validationManager.validateSystemForm(
                elements.systemNameInput,
                elements.skyboxDescription
            );

            if (!validation.isValid && elements.systemNameInput.value.trim()) {
                this.showFieldError(elements.systemNameInput, validation.message || '');
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
                this.showFieldError(elements.skyboxDescription, validation.message || '');
            } else {
                this.clearFieldError(elements.skyboxDescription);
            }
        });
    }

    showFieldError(field: HTMLInputElement | HTMLTextAreaElement, message: string): void {
        this.clearFieldError(field);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ff3030';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';

        field.parentNode?.insertBefore(errorDiv, field.nextSibling);
        field.style.borderColor = '#ff3030';
    }

    clearFieldError(field: HTMLInputElement | HTMLTextAreaElement): void {
        const existingError = field.parentNode?.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '';
    }
}
