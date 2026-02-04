// eventHandlers.js - Event handling and updates for HUD components

import { HUDStyles } from './styles.ts';

export class HUDEventHandlers {
    animationFrames: number[];
    glitchInterval: ReturnType<typeof setInterval> | null;
    scanline: HTMLDivElement | null;
    constructor() {
        this.animationFrames = [];
        this.glitchInterval = null;
        this.scanline = null;
    }

    /**
     * Initialize startup animation and effects
     */
    animateHudIn(): void {
        // Add glitch effect for initialization
        this.addStartupGlitchEffect();
        
        // Animate scanlines
        setTimeout(() => {
            if (this.scanline) {
                this.animateScanline();
            }
        }, 1500);
    }

    /**
     * Add startup glitch effect to show HUD is initializing
     */
    addStartupGlitchEffect(): void {
        const hudContainer: HTMLDivElement | null = document.getElementById('hud-container') as HTMLDivElement;
        if (!hudContainer) return;
        
        // Incremental fade-in with glitches
        setTimeout(() => {
            hudContainer.style.opacity = '0.3';
            this.addGlitch(hudContainer);
        }, 300);
        
        setTimeout(() => {
            hudContainer.style.opacity = '0.7';
            this.addGlitch(hudContainer);
        }, 800);
        
        setTimeout(() => {
            hudContainer.style.opacity = '1';
            this.addGlitch(hudContainer);
        }, 1200);
        
        // Start random glitch effects at intervals
        this.glitchInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                this.addGlitch(hudContainer);
            }
        }, 5000);
    }

    /**
     * Add glitch effect to an element
     */
    addGlitch(element: HTMLElement): void {
        // Create a temporary animation
        const animationName = HUDStyles.createGlitchAnimation();
        
        // Apply animation
        element.style.animation = `${animationName} 1s forwards`;
        
        // Remove animation after it's complete
        setTimeout(() => {
            element.style.animation = '';
            // Find and remove the style element
            const styles = document.querySelectorAll('style');
            styles.forEach(style => {
                if (style.textContent.includes(animationName)) {
                    style.remove();
                }
            });
        }, 1000);
    }

    /**
     * Animate the scanline moving down the screen
     */
    animateScanline(): void {
        let position: number = 0;
        const height: number = window.innerHeight;
        
        const moveScanline = () => {
            if (!this.scanline) return;
            position = (position + 2) % height;
            this.scanline.style.top = `${position}px`;
            
            // Add random flicker
            if (Math.random() > 0.97) {
                this.scanline.style.opacity = '0';
                setTimeout(() => {
                    if (this.scanline) {
                        this.scanline.style.opacity = '0.7';
                    }
                }, 50);
            }
            
            this.animationFrames.push(requestAnimationFrame(moveScanline));
        };
        
        moveScanline();
    }

    /**
     * Set the scanline element reference
     */
    setScanline(scanlineElement: HTMLDivElement): void {
        this.scanline = scanlineElement;
    }

    /**
     * Handle location changes with glitch effect
     */
    handleLocationChange(_locationName: string, _systemName: string): void {
        const locationPanel: HTMLDivElement | null = document.getElementById('location-panel') as HTMLDivElement;
        if (locationPanel) {
            this.addGlitch(locationPanel);
        }
    }

    /**
     * Show HUD with animations
     */
    show(): void {
        const hudContainer: HTMLDivElement | null = document.getElementById('hud-container') as HTMLDivElement;
        if (hudContainer) {
            hudContainer.style.opacity = '1';
        }
        
        // Restart scanline animation
        if (this.scanline) {
            this.animateScanline();
        }
        
        // Restart glitch interval
        if (!this.glitchInterval) {
            this.glitchInterval = setInterval(() => {
                if (Math.random() > 0.7) {
                    this.addGlitch(hudContainer);
                }
            }, 5000);
        }
    }

    /**
     * Hide HUD
     */
    hide(): void {
        const hudContainer: HTMLDivElement | null = document.getElementById('hud-container') as HTMLDivElement;
        if (hudContainer) {
            hudContainer.style.opacity = '0';
        }
        
        // Clear animation frames
        this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
        this.animationFrames = [];
        
        // Clear glitch interval
        if (this.glitchInterval) {
            clearInterval(this.glitchInterval);
            this.glitchInterval = null;
        }
    }

    /**
     * Clean up resources and event listeners
     */
    destroy(): void {
        // Cancel any active animation frames
        this.animationFrames.forEach((frameId: number) => {
            cancelAnimationFrame(frameId);
        });
        this.animationFrames = [];
        
        // Clear intervals
        if (this.glitchInterval) {
            clearInterval(this.glitchInterval);
            this.glitchInterval = null;
        }
        
        // Remove DOM event listeners
        const controls: any = document.getElementById('show-controls');
        if (controls) {
            controls.removeEventListener('click', controls.clickHandler);
            controls.removeEventListener('mouseover', controls.mouseoverHandler);
            controls.removeEventListener('mouseout', controls.mouseoutHandler);
        }
        
        // Clear references
        this.scanline = null;
    }

    /**
     * Handle window resize events
     */
    handleResize(): void {
        // Update scanline animation bounds if needed
        if (this.scanline) {
            // Restart scanline animation with new dimensions
            this.animateScanline();
        }
    }

    /**
     * Handle performance monitoring
     */
    handlePerformanceUpdate(fps: number, _frameTime: number): void {
        // Could add performance-based UI adjustments here
        // For example, reduce effects if FPS is low
        if (fps < 30) {
            // Reduce glitch frequency if performance is poor
            if (this.glitchInterval) {
                clearInterval(this.glitchInterval);
                this.glitchInterval = setInterval(() => {
                    if (Math.random() > 0.9) { // Less frequent
                        this.addGlitch(document.getElementById('hud-container') as HTMLDivElement);
                    }
                }, 10000); // Less often
            }
        }
    }

    /**
     * Handle game state changes
     */
    handleGameStateChange(newState: string, _oldState: string): void {
        // React to game state changes with appropriate HUD updates
        switch (newState) {
            case 'playing':
                this.show();
                break;
            case 'paused':
                // Maybe dim the HUD slightly
                const hudContainer: HTMLDivElement | null = document.getElementById('hud-container') as HTMLDivElement;
                if (hudContainer) {
                    hudContainer.style.opacity = '0.5';
                }
                break;
            case 'game-over':
                this.hide();
                break;
        }
    }

    /**
     * Handle critical events that need immediate visual feedback
     */
    handleCriticalEvent(eventType: string, _data: any): void {
        const hudContainer: HTMLDivElement | null = document.getElementById('hud-container') as HTMLDivElement;
        
        switch (eventType) {
            case 'low-health':
                // Flash red for low health
                if (hudContainer) {
                    hudContainer.style.filter = 'hue-rotate(0deg) saturate(1.5)';
                    setTimeout(() => {
                        hudContainer.style.filter = 'none';
                    }, 200);
                }
                break;
            case 'shield-down':
                // Flash blue for shield failure
                if (hudContainer) {
                    hudContainer.style.filter = 'hue-rotate(240deg) saturate(1.5)';
                    setTimeout(() => {
                        hudContainer.style.filter = 'none';
                    }, 300);
                }
                break;
            case 'low-fuel':
                // Flash yellow for low fuel
                if (hudContainer) {
                    hudContainer.style.filter = 'hue-rotate(60deg) saturate(1.5)';
                    setTimeout(() => {
                        hudContainer.style.filter = 'none';
                    }, 250);
                }
                break;
        }
    }
}