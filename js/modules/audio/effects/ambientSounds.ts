// ambientSounds.ts - Low fuel / low hull warning alarms with cooldown and pulse pattern

import type { UISoundGenerator } from './uiSounds.ts';

const FUEL_WARNING_THRESHOLD = 20;   // percent
const HULL_WARNING_THRESHOLD = 25;   // percent
const FUEL_BEEP_INTERVAL_MS = 2200; // beep-silence-beep
const HULL_BEEP_INTERVAL_MS = 1200; // faster pulse for hull

export interface AmbientAlarmState {
    lastFuelBeepTime: number;
    lastHullBeepTime: number;
}

/**
 * AmbientAlarms - Plays pulsing warning beeps when fuel < 20% or hull < 25%.
 * Uses cooldowns to avoid spam; only plays when conditions are met and interval has passed.
 */
export class AmbientAlarms {
    private uiSounds: UISoundGenerator;
    private muted: () => boolean;
    private state: AmbientAlarmState = {
        lastFuelBeepTime: 0,
        lastHullBeepTime: 0
    };

    constructor(uiSounds: UISoundGenerator, muted: () => boolean) {
        this.uiSounds = uiSounds;
        this.muted = muted;
    }

    /**
     * Call from game loop with current fuel and hull percentages (0–100).
     * Plays low-fuel or low-hull beep when below threshold, with cooldown.
     */
    update(fuelPercent: number, hullPercent: number): void {
        if (this.muted()) return;
        const now = performance.now();

        if (fuelPercent < FUEL_WARNING_THRESHOLD && fuelPercent >= 0) {
            if (now - this.state.lastFuelBeepTime >= FUEL_BEEP_INTERVAL_MS) {
                this.uiSounds.playLowFuelBeep();
                this.state.lastFuelBeepTime = now;
            }
        }

        if (hullPercent < HULL_WARNING_THRESHOLD && hullPercent >= 0) {
            if (now - this.state.lastHullBeepTime >= HULL_BEEP_INTERVAL_MS) {
                this.uiSounds.playLowHullBeep();
                this.state.lastHullBeepTime = now;
            }
        }
    }

    /** Reset cooldowns (e.g. when undocking or after mute). */
    reset(): void {
        this.state.lastFuelBeepTime = 0;
        this.state.lastHullBeepTime = 0;
    }
}
