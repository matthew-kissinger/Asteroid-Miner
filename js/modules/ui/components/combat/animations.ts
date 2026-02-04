// animations.ts - Combat animations, visual effects, and transitions

export interface ActiveAnimation {
    element: HTMLElement;
    startTime: number;
    duration: number;
}

export class CombatAnimations {
    activeAnimations: ActiveAnimation[];

    constructor() {
        this.activeAnimations = [];
        this.setupKeyframes();
    }

    /**
     * Setup CSS keyframes for animations
     */
    setupKeyframes(): void {
        if (document.querySelector('#combat-animations-keyframes')) return;
        
        const style = document.createElement('style');
        style.id = 'combat-animations-keyframes';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes shake {
                0% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                50% { transform: translateX(2px); }
                75% { transform: translateX(-1px); }
                100% { transform: translateX(0); }
            }
            
            @keyframes glow {
                0% { box-shadow: 0 0 5px currentColor; }
                50% { box-shadow: 0 0 20px currentColor; }
                100% { box-shadow: 0 0 5px currentColor; }
            }
            
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes slide-up {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes slide-down {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(20px); opacity: 0; }
            }
            
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes warning-flash {
                0% { background-color: transparent; }
                50% { background-color: rgba(255, 48, 48, 0.3); }
                100% { background-color: transparent; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Animate health bar change with color transition
     * @param healthBar Health bar element
     * @param fromPercent Starting percentage
     * @param toPercent Ending percentage
     * @param duration Animation duration in ms
     */
    animateHealthChange(healthBar: HTMLElement | null, fromPercent: number, toPercent: number, duration: number = 500): void {
        if (!healthBar) return;
        
        const startTime = Date.now();
        const startWidth = fromPercent;
        const targetWidth = toPercent;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentWidth = startWidth + (targetWidth - startWidth) * easeProgress;
            healthBar.style.width = `${currentWidth}%`;
            
            // Update color based on health percentage
            if (currentWidth < 25) {
                healthBar.style.backgroundColor = '#ff3030'; // Red
            } else if (currentWidth < 50) {
                healthBar.style.backgroundColor = '#ffcc00'; // Yellow
            } else {
                healthBar.style.backgroundColor = '#ff9900'; // Orange
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * Animate shield bar change with flicker effect
     * @param shieldBar Shield bar element
     * @param fromPercent Starting percentage
     * @param toPercent Ending percentage
     * @param duration Animation duration in ms
     */
    animateShieldChange(shieldBar: HTMLElement | null, fromPercent: number, toPercent: number, duration: number = 300): void {
        if (!shieldBar) return;
        
        const startTime = Date.now();
        const startWidth = fromPercent;
        const targetWidth = toPercent;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentWidth = startWidth + (targetWidth - startWidth) * progress;
            shieldBar.style.width = `${currentWidth}%`;
            
            // Add flicker effect when shields are low
            if (currentWidth < 25 && Math.random() > 0.7) {
                shieldBar.style.opacity = '0.5';
                setTimeout(() => {
                    shieldBar.style.opacity = '1';
                }, 50);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * Pulse animation for elements
     * @param element Element to pulse
     * @param duration Animation duration in ms
     * @param count Number of pulses
     */
    pulseElement(element: HTMLElement | null, duration: number = 1000, count: number = 3): void {
        if (!element) return;
        
        element.style.animation = `pulse ${duration / count}ms ease-in-out ${count}`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    /**
     * Shake animation for damage feedback
     * @param element Element to shake
     * @param intensity Shake intensity (1-5)
     * @param duration Animation duration in ms
     */
    shakeElement(element: HTMLElement | null, intensity: number = 2, duration: number = 500): void {
        if (!element) return;
        
        const keyframes = `
            @keyframes shake-${intensity} {
                0% { transform: translateX(0); }
                25% { transform: translateX(-${intensity}px); }
                50% { transform: translateX(${intensity}px); }
                75% { transform: translateX(-${intensity / 2}px); }
                100% { transform: translateX(0); }
            }
        `;
        
        // Add keyframes if not exists
        if (!document.querySelector(`#shake-${intensity}-keyframes`)) {
            const style = document.createElement('style');
            style.id = `shake-${intensity}-keyframes`;
            style.textContent = keyframes;
            document.head.appendChild(style);
        }
        
        element.style.animation = `shake-${intensity} ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    /**
     * Glow effect for special abilities
     * @param element Element to glow
     * @param color Glow color
     * @param duration Animation duration in ms
     */
    glowElement(element: HTMLElement | null, color: string = '#00ffff', duration: number = 2000): void {
        if (!element) return;
        
        const originalBoxShadow = element.style.boxShadow;
        element.style.animation = 'glow 1s ease-in-out infinite';
        element.style.setProperty('--glow-color', color);
        
        setTimeout(() => {
            element.style.animation = '';
            element.style.boxShadow = originalBoxShadow;
        }, duration);
    }

    /**
     * Warning flash animation
     * @param element Element to flash
     * @param count Number of flashes
     * @param speed Flash speed in ms
     */
    warningFlash(element: HTMLElement | null, count: number = 5, speed: number = 200): void {
        if (!element) return;
        
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            element.style.animation = `warning-flash ${speed}ms ease-in-out`;
            flashCount++;
            
            if (flashCount >= count) {
                clearInterval(flashInterval);
                setTimeout(() => {
                    element.style.animation = '';
                }, speed);
            }
        }, speed);
    }

    /**
     * Smooth fade in animation
     * @param element Element to fade in
     * @param duration Animation duration in ms
     */
    fadeIn(element: HTMLElement | null, duration: number = 500): void {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = 'block';
        element.style.animation = `fade-in ${duration}ms ease-out forwards`;
        
        setTimeout(() => {
            element.style.animation = '';
            element.style.opacity = '1';
        }, duration);
    }

    /**
     * Smooth fade out animation
     * @param element Element to fade out
     * @param duration Animation duration in ms
     * @param hideAfter Whether to hide element after fade
     */
    fadeOut(element: HTMLElement | null, duration: number = 500, hideAfter: boolean = true): void {
        if (!element) return;
        
        element.style.animation = `fade-out ${duration}ms ease-out forwards`;
        
        setTimeout(() => {
            element.style.animation = '';
            if (hideAfter) {
                element.style.display = 'none';
            }
            element.style.opacity = '0';
        }, duration);
    }

    /**
     * Slide up animation for notifications
     * @param element Element to slide up
     * @param duration Animation duration in ms
     */
    slideUp(element: HTMLElement | null, duration: number = 300): void {
        if (!element) return;
        
        element.style.animation = `slide-up ${duration}ms ease-out forwards`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    /**
     * Slide down animation for hiding elements
     * @param element Element to slide down
     * @param duration Animation duration in ms
     */
    slideDown(element: HTMLElement | null, duration: number = 300): void {
        if (!element) return;
        
        element.style.animation = `slide-down ${duration}ms ease-in forwards`;
        
        setTimeout(() => {
            element.style.animation = '';
            element.style.display = 'none';
        }, duration);
    }

    /**
     * Rotate animation for loading indicators
     * @param element Element to rotate
     * @param duration Rotation duration in ms
     * @param infinite Whether to rotate indefinitely
     */
    rotateElement(element: HTMLElement | null, duration: number = 1000, infinite: boolean = false): void {
        if (!element) return;
        
        const animation = `rotate ${duration}ms linear ${infinite ? 'infinite' : '1'}`;
        element.style.animation = animation;
        
        if (!infinite) {
            setTimeout(() => {
                element.style.animation = '';
            }, duration);
        }
    }

    /**
     * Animate weapon charging effect
     * @param weaponBar Weapon energy bar
     * @param chargeTime Charge time in ms
     */
    animateWeaponCharge(weaponBar: HTMLElement | null, chargeTime: number = 1000): void {
        if (!weaponBar) return;
        
        this.glowElement(weaponBar, '#00ffff', chargeTime);
        
        // Add charging effect
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / chargeTime;
            
            if (progress < 1) {
                // Pulsing brightness effect
                const brightness = 1 + Math.sin(progress * Math.PI * 10) * 0.3;
                weaponBar.style.filter = `brightness(${brightness})`;
                requestAnimationFrame(animate);
            } else {
                weaponBar.style.filter = '';
            }
        };
        
        animate();
    }

    /**
     * Animate energy depletion
     * @param energyBar Energy bar element
     * @param _fromPercent Starting percentage
     * @param toPercent Ending percentage
     */
    animateEnergyDepletion(energyBar: HTMLElement | null, _fromPercent: number, toPercent: number): void {
        if (!energyBar) return;
        
        // Quick snap to new value with flash effect
        energyBar.style.width = `${toPercent}%`;
        
        if (toPercent < 25) {
            this.warningFlash(energyBar, 3, 150);
        }
    }

    /**
     * Animate target lock-on effect
     * @param targetElement Target HUD element
     */
    animateTargetLock(targetElement: HTMLElement | null): void {
        if (!targetElement) return;
        
        // Pulse effect for lock-on
        this.pulseElement(targetElement, 500, 2);
        
        // Add scanning lines effect
        const scanLine = document.createElement('div');
        scanLine.style.position = 'absolute';
        scanLine.style.top = '0';
        scanLine.style.left = '0';
        scanLine.style.width = '100%';
        scanLine.style.height = '2px';
        scanLine.style.backgroundColor = '#ff3030';
        scanLine.style.boxShadow = '0 0 10px #ff3030';
        scanLine.style.animation = 'slide-down 1s ease-in-out 3';
        
        targetElement.appendChild(scanLine);
        
        setTimeout(() => {
            if (scanLine.parentNode) {
                scanLine.parentNode.removeChild(scanLine);
            }
        }, 3000);
    }

    /**
     * Clean up animations
     */
    cleanup(): void {
        this.activeAnimations.forEach(animation => {
            if (animation.element && animation.element.style) {
                animation.element.style.animation = '';
            }
        });
        this.activeAnimations = [];
    }

    /**
     * Stop all animations on an element
     * @param element Element to stop animations on
     */
    stopAnimations(element: HTMLElement | null): void {
        if (!element) return;
        
        element.style.animation = '';
        element.style.transform = '';
        element.style.filter = '';
        element.style.opacity = '';
    }
}