// helpers.ts - Utility functions and data formatting

export class HelperManager {
    scrollTimeout: number | null;

    constructor() {
        this.scrollTimeout = null;
    }

    detectMobile(): boolean {
        return ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               ((navigator as any).msMaxTouchPoints > 0) ||
               (window.innerWidth < 900);
    }

    playUISound(): void {
        // Play UI sound if audio is available
        if (window.game && window.game.audio) {
            window.game.audio.playSound('boink');
        }
    }

    formatSliderValue(value: number, type: string = 'default'): string {
        switch (type) {
            case 'speed':
                // Convert 1-10 range to 0.001-0.002 range
                const speed = 0.001 + (value - 1) * (0.001 / 9);
                return speed.toFixed(4);
            case 'size':
            case 'distance':
                return parseInt(value.toString()).toString();
            default:
                return value.toString();
        }
    }

    calculateDefaultDistance(planetIndex: number, baseDistance: number = 4000, increment: number = 6000): number {
        return baseDistance + planetIndex * increment;
    }

    convertSpeedSliderValue(sliderValue: number): number {
        // Convert 1-10 range to 0.001-0.002 range
        return 0.001 + (sliderValue - 1) * (0.001 / 9);
    }

    cleanupScrolling(): void {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
    }

    safeScrollTo(element: HTMLElement | null, options: ScrollIntoViewOptions = {}): void {
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

    generateUniqueId(prefix: string = 'custom'): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number,
        immediate: boolean = false
    ): (...args: Parameters<T>) => void {
        let timeout: number | null;
        return function executedFunction(...args: Parameters<T>): void {
            const later = (): void => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
        let inThrottle: boolean;
        return function(...args: Parameters<T>): void {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    sanitizeInput(input: string | any, maxLength: number | null = null): string {
        if (typeof input !== 'string') return '';

        let sanitized = input.trim();

        if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }

    validateURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime()) as T;
        if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as T;
        if (typeof obj === 'object') {
            const clonedObj: any = {};
            Object.keys(obj).forEach(key => {
                clonedObj[key] = this.deepClone((obj as any)[key]);
            });
            return clonedObj as T;
        }
        return obj;
    }

    createElement(
        tag: string,
        className: string = '',
        content: string = '',
        attributes: Record<string, string> = {}
    ): HTMLElement {
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

    removeElement(element: HTMLElement | null): void {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    findElementById(id: string, container: Document | HTMLElement = document): HTMLElement | null {
        if ('getElementById' in container && container.getElementById) {
            return container.getElementById(id);
        }
        return container.querySelector(`#${id}`);
    }

    findElementsByClass(className: string, container: Document | HTMLElement = document): HTMLElement[] {
        if ('getElementsByClassName' in container && container.getElementsByClassName) {
            return Array.from(container.getElementsByClassName(className)) as HTMLElement[];
        }
        return Array.from(container.querySelectorAll(`.${className}`));
    }

    addEventListenerSafe(
        element: HTMLElement | null,
        event: string,
        handler: EventListener,
        options: AddEventListenerOptions = {}
    ): boolean {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener(event, handler, options);
            return true;
        }
        return false;
    }

    removeEventListenerSafe(
        element: HTMLElement | null,
        event: string,
        handler: EventListener,
        options: EventListenerOptions = {}
    ): boolean {
        if (element && typeof element.removeEventListener === 'function') {
            element.removeEventListener(event, handler, options);
            return true;
        }
        return false;
    }

    getElementDimensions(element: HTMLElement | null): {
        width: number;
        height: number;
        top: number;
        left: number;
        bottom: number;
        right: number;
    } {
        if (!element) return { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 };

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

    isElementVisible(element: HTMLElement | null): boolean {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
    }

    scrollToTop(container: HTMLElement | null, smooth: boolean = true): void {
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

    addClassSafe(element: HTMLElement | null, className: string): void {
        if (element && element.classList) {
            element.classList.add(className);
        }
    }

    removeClassSafe(element: HTMLElement | null, className: string): void {
        if (element && element.classList) {
            element.classList.remove(className);
        }
    }

    toggleClassSafe(element: HTMLElement | null, className: string): void {
        if (element && element.classList) {
            element.classList.toggle(className);
        }
    }

    hasClassSafe(element: HTMLElement | null, className: string): boolean {
        return element !== null && element.classList !== undefined && element.classList.contains(className);
    }

    setStyleSafe(element: HTMLElement | null, property: string, value: string): void {
        if (element && element.style) {
            (element.style as any)[property] = value;
        }
    }

    getStyleSafe(element: HTMLElement | null, property: string): string | null {
        if (element && element.style) {
            return (element.style as any)[property];
        }
        return null;
    }

    forceReflow(element: HTMLElement | null): void {
        if (element) {
            void element.offsetHeight; // Force reflow
        }
    }

    waitForElement(selector: string, timeout: number = 5000): Promise<Element> {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((_mutations, obs) => {
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

    async waitFor(condition: () => boolean, timeout: number = 5000, interval: number = 100): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        throw new Error('Condition not met within timeout');
    }

    cleanup(): void {
        this.cleanupScrolling();
    }
}
