// helpers.ts - Utility functions and common operations

interface Resources {
    iron: number;
    gold: number;
    platinum: number;
    orbs?: {
        common: number;
        uncommon: number;
        rare: number;
        epic: number;
        legendary: number;
    };
}

interface Spaceship {
    credits: number;
    fuel: number;
    maxFuel: number;
    shield: number;
    maxShield: number;
    hull: number;
    maxHull: number;
}

interface GameSyncResult {
    spaceship: Spaceship;
    resources: Resources;
}

export class StargateHelpers {
    static updateResourceDisplays(resources: Resources): void {
        // Update resource display with visual elements
        const ironEl = document.getElementById('ms-iron');
        const goldEl = document.getElementById('ms-gold');
        const platinumEl = document.getElementById('ms-platinum');
        
        if (ironEl) ironEl.textContent = String(resources.iron);
        if (goldEl) goldEl.textContent = String(resources.gold);
        if (platinumEl) platinumEl.textContent = String(resources.platinum);
    }
    
    static updateCreditsDisplay(spaceship: Spaceship): void {
        // Update credits with styling
        const creditsEl = document.getElementById('ms-credits');
        if (creditsEl) {
            creditsEl.textContent = `${spaceship.credits} CR`;
        }
    }
    
    static updateStatusGauges(spaceship: Spaceship): void {
        // Update fuel gauge
        const fuelGauge = document.getElementById('fuel-gauge');
        const fuelLevel = document.getElementById('fuel-level');
        if (fuelGauge) {
            fuelGauge.style.width = `${(spaceship.fuel / spaceship.maxFuel) * 100}%`;
        }
        if (fuelLevel) {
            fuelLevel.textContent = String(Math.round((spaceship.fuel / spaceship.maxFuel) * 100));
        }
        
        // Update shield gauge
        const shieldGauge = document.getElementById('shield-gauge');
        const shieldLevel = document.getElementById('shield-level');
        if (shieldGauge) {
            shieldGauge.style.width = `${(spaceship.shield / spaceship.maxShield) * 100}%`;
        }
        if (shieldLevel) {
            shieldLevel.textContent = String(Math.round((spaceship.shield / spaceship.maxShield) * 100));
        }
        
        // Update hull gauge
        const hullGauge = document.getElementById('hull-gauge');
        const hullLevel = document.getElementById('hull-level');
        if (hullGauge) {
            hullGauge.style.width = `${(spaceship.hull / spaceship.maxHull) * 100}%`;
        }
        if (hullLevel) {
            hullLevel.textContent = String(Math.round((spaceship.hull / spaceship.maxHull) * 100));
        }
    }
    
    static updateServiceButtons(spaceship: Spaceship): void {
        // Disable refuel button if not enough credits or fuel is full
        const refuelBtn = document.getElementById('refuel-btn') as HTMLButtonElement;
        if (refuelBtn) {
            if (spaceship.credits < 100 || spaceship.fuel >= spaceship.maxFuel * 0.999) {
                refuelBtn.disabled = true;
                refuelBtn.style.backgroundColor = '#555';
                refuelBtn.style.cursor = 'not-allowed';
            } else {
                refuelBtn.disabled = false;
                refuelBtn.style.backgroundColor = '#00cc33';
                refuelBtn.style.cursor = 'pointer';
            }
        }
        
        // Disable shield repair button if not enough credits or shield is full
        const repairShieldBtn = document.getElementById('repair-shield-btn') as HTMLButtonElement;
        if (repairShieldBtn) {
            if (spaceship.credits < 150 || spaceship.shield >= spaceship.maxShield * 0.999) {
                repairShieldBtn.disabled = true;
                repairShieldBtn.style.backgroundColor = '#555';
                repairShieldBtn.style.cursor = 'not-allowed';
            } else {
                repairShieldBtn.disabled = false;
                repairShieldBtn.style.backgroundColor = '#3399ff';
                repairShieldBtn.style.cursor = 'pointer';
            }
        }
        
        // Disable hull repair button if not enough credits or hull is full
        const repairHullBtn = document.getElementById('repair-hull-btn') as HTMLButtonElement;
        if (repairHullBtn) {
            if (spaceship.credits < 200 || spaceship.hull >= spaceship.maxHull * 0.999) {
                repairHullBtn.disabled = true;
                repairHullBtn.style.backgroundColor = '#555';
                repairHullBtn.style.cursor = 'not-allowed';
            } else {
                repairHullBtn.disabled = false;
                repairHullBtn.style.backgroundColor = '#ff9900';
                repairHullBtn.style.cursor = 'pointer';
            }
        }
    }
    
    static configureMobileUI(stargateUI: HTMLElement, isMobile: boolean): void {
        if (!isMobile) return;
        
        // Ensure proper mobile styling
        stargateUI.style.width = '92%';
        stargateUI.style.maxWidth = '92vw';
        stargateUI.style.maxHeight = '85vh';
        (stargateUI.style as any).webkitOverflowScrolling = 'touch';
        stargateUI.style.touchAction = 'pan-y';
        stargateUI.style.overscrollBehavior = 'auto';
        
        // Ensure proper positioning
        stargateUI.style.position = 'absolute';
        stargateUI.style.top = '50%';
        stargateUI.style.left = '50%';
        stargateUI.style.transform = 'translate(-50%, -50%)';
        stargateUI.style.zIndex = '1000';
        
        // Ensure body is in a state that allows the UI to be visible
        document.body.classList.remove('undocking', 'modal-open');
    }
    
    static syncWithGameResources(): GameSyncResult | null {
        // Sync resources with game if available (similar to BlackjackGame)
        if (window.game && (window.game as any).controls) {
            // Get reference to spaceship and resources
            const spaceship = (window.game as any).spaceship;
            const resources = (window.game as any).controls.resources;
            
            // Return references for use by caller
            if (spaceship && resources) {
                console.log("Syncing stargate UI with game resources:", resources);
                return { spaceship, resources };
            }
        }
        return null;
    }
}
