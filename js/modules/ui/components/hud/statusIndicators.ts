// statusIndicators.js - Various status indicators (shields, weapons, targeting system, etc.)

import { HUDStyles } from './styles.ts';

export class HUDStatusIndicators {
    static createTargetingSystem(parent: HTMLElement): HTMLDivElement {
        // Main crosshair container
        const targetingSystem: HTMLDivElement = document.createElement('div');
        targetingSystem.id = 'targeting-system';
        HUDStyles.applyStyles(targetingSystem, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100px',
            height: '100px',
            zIndex: '100'
        });
        parent.appendChild(targetingSystem);
        
        // Crosshair - create using SVG for more precise styling
        const crosshair: HTMLDivElement = document.createElement('div');
        crosshair.id = 'crosshair';
        HUDStyles.applyStyles(crosshair, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50px',
            height: '50px'
        });
        
        // SVG crosshair
        crosshair.innerHTML = `
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="20" stroke="rgba(120, 220, 232, 0.5)" stroke-width="1" stroke-dasharray="8 4"/>
                <circle cx="25" cy="25" r="3" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <circle cx="25" cy="25" r="1" fill="rgba(120, 220, 232, 0.8)"/>
                <line x1="25" y1="10" x2="25" y2="18" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="25" y1="32" x2="25" y2="40" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="10" y1="25" x2="18" y2="25" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="32" y1="25" x2="40" y2="25" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <!-- Add a pulsing animation to the outer circle -->
                <circle cx="25" cy="25" r="24" stroke="rgba(120, 220, 232, 0.3)" stroke-width="1">
                    <animate attributeName="r" values="24;28;24" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;
        
        targetingSystem.appendChild(crosshair);
        
        // Target info display that appears when targeting something
        HUDStatusIndicators.createTargetInfoDisplay(parent);
        
        // Laser beam
        HUDStatusIndicators.createLaserBeam(parent);
        
        return targetingSystem;
    }

    static createTargetInfoDisplay(parent: HTMLElement): HTMLDivElement {
        const targetInfo: HTMLDivElement = document.createElement('div');
        targetInfo.id = 'target-info';
        targetInfo.className = 'hud-panel';
        
        // Detect mobile device and position accordingly
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
                          window.innerWidth <= 768;
        
        const positionStyles = isMobile ? {
            bottom: '15px',
            top: 'auto'
        } : {
            top: '15px',
            bottom: 'auto'
        };

        HUDStyles.applyStyles(targetInfo, {
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            padding: '10px 15px',
            backgroundColor: 'rgba(6, 22, 31, 0.7)',
            backdropFilter: 'blur(5px)',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'rgba(120, 220, 232, 0.9)',
            border: '1px solid rgba(120, 220, 232, 0.3)',
            boxShadow: '0 0 15px rgba(120, 220, 232, 0.2)',
            textAlign: 'center',
            display: 'none',
            zIndex: '999',
            fontFamily: '"Rajdhani", "Electrolize", sans-serif',
            ...positionStyles
        });
        
        parent.appendChild(targetInfo);
        
        // Add decorative corner elements to match other HUD panels
        HUDStyles.addCornerElements(targetInfo);
        
        // Target info content - simplified for less clutter
        targetInfo.innerHTML = `
            <div id="target-name" style="font-weight:600; margin-bottom:5px;">NO TARGET</div>
            <div id="target-distance" style="margin-bottom:0;">DISTANCE: ---</div>
        `;
        
        return targetInfo;
    }

    static createLaserBeam(parent: HTMLElement): HTMLDivElement {
        const laserBeam: HTMLDivElement = document.createElement('div');
        laserBeam.id = 'laser-beam';
        HUDStyles.applyStyles(laserBeam, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '0px',
            height: '2px',
            backgroundColor: 'rgba(255, 50, 50, 0.8)',
            boxShadow: '0 0 10px rgba(255, 50, 50, 0.8)',
            transformOrigin: 'left',
            transform: 'rotate(var(--angle, 0deg))',
            zIndex: '90',
            display: 'none'
        });
        parent.appendChild(laserBeam);
        
        return laserBeam;
    }

    static createScanlineEffect(_parent: HTMLElement): HTMLDivElement | null {
        // Scanline effect disabled - returning null
        return null;
        
        // Original scanline code commented out:
        /*
        // Scanline effect overlay
        const scanlineEffect = document.createElement('div');
        scanlineEffect.id = 'scanline-effect';
        HUDStyles.applyStyles(scanlineEffect, HUDStyles.getScanlineEffectStyles());
        parent.appendChild(scanlineEffect);
        
        // Add subtle scan line that moves
        const activeScanline = document.createElement('div');
        activeScanline.id = 'active-scanline';
        HUDStyles.applyStyles(activeScanline, HUDStyles.getActiveScanlineStyles());
        parent.appendChild(activeScanline);
        
        return activeScanline;
        */
    }

    /**
     * Update shield display with current shield status
     */
    static updateShieldDisplay(spaceship: any, world?: any): void {
        const shieldBar: HTMLDivElement | null = document.getElementById('shield-bar') as HTMLDivElement;
        if (!shieldBar) return;

        let shieldPercentage: number = 100;
        let shieldFound: boolean = false;

        // Try to directly access player's health component
        try {
            if (world) {
                const players: any[] = world.getEntitiesByTag('player');
                if (players && players.length > 0) {
                    const player: any = players[0];
                    const health: any = player.getComponent('HealthComponent');

                    if (health) {
                        shieldPercentage = health.getShieldPercentage();

                        // Ensure spaceship object is in sync with the HealthComponent
                        if (spaceship) {
                            // If HealthComponent shield is higher, use that value
                            if (health.shield > spaceship.shield) {
                                spaceship.shield = health.shield;
                                spaceship.maxShield = health.maxShield;
                            }
                            // If spaceship shield is higher (e.g., after repair), update health component
                            else if (spaceship.shield > health.shield) {
                                health.shield = spaceship.shield;
                                console.log(`Updated HealthComponent shield from spaceship: ${health.shield}`);
                                // Recalculate shield percentage
                                shieldPercentage = health.getShieldPercentage();
                            }
                        }

                        shieldFound = true;
                    }
                }
            }
        } catch (e: any) {
            console.error("Error accessing player shield component:", e);
        }

        // Fallback to spaceship object if health component not found
        if (!shieldFound && spaceship && spaceship.shield !== undefined) {
            shieldPercentage = (spaceship.shield / spaceship.maxShield) * 100;
        }

        // Update the shield bar
        shieldBar.style.width = `${shieldPercentage}%`;

        // Change color based on shield status
        if (shieldPercentage < 25) {
            shieldBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)'; // Red for low shields
        } else if (shieldPercentage < 50) {
            shieldBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)'; // Yellow for medium shields
        } else {
            shieldBar.style.backgroundColor = 'rgba(51, 153, 255, 0.8)'; // Blue for healthy shields
        }
    }

    /**
     * Update hull display with current hull status
     */
    static updateHullDisplay(spaceship: any, world?: any): void {
        const hullBar: HTMLDivElement | null = document.getElementById('hull-bar') as HTMLDivElement;
        if (!hullBar) return;

        let hullPercentage: number = 100;
        let healthFound: boolean = false;

        // Try to directly access player's health component
        try {
            if (world) {
                const players: any[] = world.getEntitiesByTag('player');
                if (players && players.length > 0) {
                    const player: any = players[0];
                    const health: any = player.getComponent('HealthComponent');

                    if (health) {
                        hullPercentage = health.getHealthPercentage();

                        // Ensure spaceship object is in sync with the HealthComponent
                        if (spaceship) {
                            // If HealthComponent health is higher, use that value
                            if (health.health > spaceship.hull) {
                                spaceship.hull = health.hull;
                                spaceship.maxHull = health.maxHull;
                            }
                            // If spaceship hull is higher (e.g., after repair), update health component
                            else if (spaceship.hull > health.health) {
                                health.health = spaceship.hull;
                                console.log(`Updated HealthComponent health from spaceship: ${health.hull}`);
                                // Recalculate hull percentage
                                hullPercentage = health.getHealthPercentage();
                            }
                        }

                        healthFound = true;
                    }
                }
            }
        } catch (e: any) {
            console.error("Error accessing player health component:", e);
        }

        // Fallback to spaceship object if health component not found
        if (!healthFound && spaceship && spaceship.hull !== undefined) {
            hullPercentage = (spaceship.hull / spaceship.maxHull) * 100;
        }

        // Update the hull bar
        hullBar.style.width = `${hullPercentage}%`;

        // Change color based on hull status
        if (hullPercentage < 30) {
            hullBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)';
        } else if (hullPercentage < 60) {
            hullBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)';
        } else {
            hullBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        }
    }

    /**
     * Update fuel display with current fuel status
     */
    static updateFuelDisplay(spaceship: any): void {
        const fuelBar: HTMLDivElement | null = document.getElementById('fuel-bar') as HTMLDivElement;
        const fuelValue: HTMLSpanElement | null = document.getElementById('fuel-value') as HTMLSpanElement;
        if (!fuelBar || !spaceship) return;
        
        // Correctly calculate fuel percentage based on maxFuel
        const fuelPercent: number = spaceship.maxFuel > 0 ? 
            (spaceship.fuel / spaceship.maxFuel) * 100 : 0;
        
        fuelBar.style.width = `${fuelPercent}%`;
        
        // Change color based on fuel level
        if (fuelPercent < 20) {
            fuelBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)';
        } else if (fuelPercent < 40) {
            fuelBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)';
        } else {
            fuelBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        }
        
        // Update text display if it exists
        if (fuelValue) {
            fuelValue.textContent = `${Math.round(spaceship.fuel)} / ${Math.round(spaceship.maxFuel)}`;
        }
    }

    /**
     * Update credits display
     */
    static updateCreditsDisplay(spaceship: any): void {
        const creditsDisplay: HTMLElement | null = document.getElementById('credits-value');
        if (creditsDisplay && spaceship) {
            creditsDisplay.textContent = `${spaceship.credits} CR`;
        }
    }

    /**
     * Update location coordinates display
     */
    static updateCoordinates(x: number, y: number, z: number): void {
        const coordsElement: HTMLElement | null = document.getElementById('location-coordinates');
        if (coordsElement) {
            coordsElement.textContent = `X: ${Math.round(x)} Y: ${Math.round(y)} Z: ${Math.round(z)}`;
        }
    }

    /**
     * Update FPS display
     */
    static updateFPS(fps: number, cap: number, settings?: any): void {
        const fpsElement: HTMLElement | null = document.getElementById('fps-display');
        if (fpsElement) {
            if (cap) {
                // Show actual FPS and the cap
                fpsElement.textContent = `FPS: ${Math.round(fps)}/${cap}`;

                // Color code based on performance relative to cap
                if (fps < cap * 0.9) {
                    // Below 90% of target - indicate performance issues
                    fpsElement.style.color = "rgba(255, 120, 120, 0.9)";
                } else {
                    // Normal performance - standard color
                    fpsElement.style.color = "rgba(120, 220, 232, 0.8)";
                }
            } else {
                // Just show FPS for uncapped mode
                fpsElement.textContent = `FPS: ${Math.round(fps)}`;
                fpsElement.style.color = "rgba(120, 220, 232, 0.8)";
            }

            // Add auto indicator if using monitor refresh rate
            if (settings && settings.settings && settings.settings.frameRateCap === 'auto') {
                if (cap > 0) {
                    // Show it's using auto mode with the detected refresh rate
                    fpsElement.textContent = `FPS: ${Math.round(fps)}/${cap} (Auto)`;
                } else {
                    // Using unlimited because refresh rate is high
                    fpsElement.textContent = `FPS: ${Math.round(fps)} (Auto: Unlimited)`;
                }
            }
        }
    }

    /**
     * Update location display
     */
    static updateLocation(_locationName: string, systemName: string = 'Unknown System'): void {
        const currentSystem: HTMLElement | null = document.getElementById('current-system');
        
        if (currentSystem) {
            currentSystem.textContent = systemName.toUpperCase();
        }
    }
}