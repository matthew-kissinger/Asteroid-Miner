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
                refuelBtn.classList.add('stargate-service-btn-disabled');
                refuelBtn.classList.remove('stargate-service-btn-enabled-fuel');
            } else {
                refuelBtn.disabled = false;
                refuelBtn.classList.remove('stargate-service-btn-disabled');
                refuelBtn.classList.add('stargate-service-btn-enabled-fuel');
            }
        }
        
        // Disable shield repair button if not enough credits or shield is full
        const repairShieldBtn = document.getElementById('repair-shield-btn') as HTMLButtonElement;
        if (repairShieldBtn) {
            if (spaceship.credits < 150 || spaceship.shield >= spaceship.maxShield * 0.999) {
                repairShieldBtn.disabled = true;
                repairShieldBtn.classList.add('stargate-service-btn-disabled');
                repairShieldBtn.classList.remove('stargate-service-btn-enabled-shield');
            } else {
                repairShieldBtn.disabled = false;
                repairShieldBtn.classList.remove('stargate-service-btn-disabled');
                repairShieldBtn.classList.add('stargate-service-btn-enabled-shield');
            }
        }
        
        // Disable hull repair button if not enough credits or hull is full
        const repairHullBtn = document.getElementById('repair-hull-btn') as HTMLButtonElement;
        if (repairHullBtn) {
            if (spaceship.credits < 200 || spaceship.hull >= spaceship.maxHull * 0.999) {
                repairHullBtn.disabled = true;
                repairHullBtn.classList.add('stargate-service-btn-disabled');
                repairHullBtn.classList.remove('stargate-service-btn-enabled-hull');
            } else {
                repairHullBtn.disabled = false;
                repairHullBtn.classList.remove('stargate-service-btn-disabled');
                repairHullBtn.classList.add('stargate-service-btn-enabled-hull');
            }
        }
    }
    
    static configureMobileUI(stargateUI: HTMLElement, isMobile: boolean): void {
        if (!isMobile) return;
        
        // Ensure proper mobile styling
        stargateUI.classList.add('stargate-ui-mobile-config');
        
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
