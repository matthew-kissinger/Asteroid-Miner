// helpers.js - Utility functions and data formatting

export class HelperManager {
    constructor() {
        this.scrollTimeout = null;
    }

    detectMobile() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0) ||
               (window.innerWidth < 900);
    }

    playUISound() {
        // Play UI sound if audio is available
        if (window.game && window.game.audio) {
            window.game.audio.playSound('boink');
        }
    }

    formatSliderValue(value, type = 'default') {
        switch (type) {
            case 'speed':
                // Convert 1-10 range to 0.001-0.002 range
                const speed = 0.001 + (value - 1) * (0.001 / 9);
                return speed.toFixed(4);
            case 'size':
            case 'distance':
                return parseInt(value).toString();
            default:
                return value.toString();
        }
    }

    calculateDefaultDistance(planetIndex, baseDistance = 4000, increment = 6000) {
        return baseDistance + planetIndex * increment;
    }

    convertSpeedSliderValue(sliderValue) {
        // Convert 1-10 range to 0.001-0.002 range
        return 0.001 + (sliderValue - 1) * (0.001 / 9);
    }

    cleanupScrolling() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
    }

    safeScrollTo(element, options = {}) {
        if (!element) return;

        this.cleanupScrolling();

        this.scrollTimeout = setTimeout(() => {
            try {
                if (typeof element.scrollIntoView === 'function') {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        ...options
                    });
                }
            } catch (err) {
                console.warn('Error during scroll:', err);
            }
        }, 100);
    }

    generateUniqueId(prefix = 'custom') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    sanitizeInput(input, maxLength = null) {
        if (typeof input !== 'string') return '';
        
        let sanitized = input.trim();
        
        if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        
        return sanitized;
    }

    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            Object.keys(obj).forEach(key => {
                clonedObj[key] = this.deepClone(obj[key]);
            });
            return clonedObj;
        }
    }

    createElement(tag, className = '', content = '', attributes = {}) {
        const element = document.createElement(tag);
        
        if (className) {
            element.className = className;
        }
        
        if (content) {
            element.textContent = content;
        }
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        return element;
    }

    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    findElementById(id, container = document) {
        return container.getElementById ? container.getElementById(id) : container.querySelector(`#${id}`);
    }

    findElementsByClass(className, container = document) {
        return container.getElementsByClassName ? 
            Array.from(container.getElementsByClassName(className)) :
            Array.from(container.querySelectorAll(`.${className}`));
    }

    addEventListenerSafe(element, event, handler, options = {}) {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener(event, handler, options);
            return true;
        }
        return false;
    }

    removeEventListenerSafe(element, event, handler, options = {}) {
        if (element && typeof element.removeEventListener === 'function') {
            element.removeEventListener(event, handler, options);
            return true;
        }
        return false;
    }

    getElementDimensions(element) {
        if (!element) return { width: 0, height: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right
        };
    }

    isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
    }

    scrollToTop(container, smooth = true) {
        if (!container) return;
        
        if (smooth && container.scrollTo) {
            container.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            container.scrollTop = 0;
        }
    }

    addClassSafe(element, className) {
        if (element && element.classList) {
            element.classList.add(className);
        }
    }

    removeClassSafe(element, className) {
        if (element && element.classList) {
            element.classList.remove(className);
        }
    }

    toggleClassSafe(element, className) {
        if (element && element.classList) {
            element.classList.toggle(className);
        }
    }

    hasClassSafe(element, className) {
        return element && element.classList && element.classList.contains(className);
    }

    setStyleSafe(element, property, value) {
        if (element && element.style) {
            element.style[property] = value;
        }
    }

    getStyleSafe(element, property) {
        if (element && element.style) {
            return element.style[property];
        }
        return null;
    }

    forceReflow(element) {
        if (element) {
            void element.offsetHeight; // Force reflow
        }
    }

    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error('Condition not met within timeout');
    }

    cleanup() {
        this.cleanupScrolling();
    }
}