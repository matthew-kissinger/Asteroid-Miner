// saveSystem.ts - Save/Load system for player progress persistence

import { debugLog, debugWarn } from '../../globals/debug.ts';
import { mainMessageBus } from '../../globals/messageBus.ts';

// Current save schema version - increment when schema changes
const SAVE_VERSION = 1;
const STORAGE_KEY = 'asteroid-miner-save';
const DEFAULT_AUTOSAVE_INTERVAL = 30000; // 30 seconds

// ── Save Schema ──────────────────────────────────────────────────────

export interface SaveSchema {
    version: number;
    timestamp: number;
    meta: {
        totalPlaySessions: number;
        totalPlaytime: number; // seconds
    };
    player: {
        credits: number;
        fuel: number;
        maxFuel: number;
        hull: number;
        maxHull: number;
        shield: number;
        maxShield: number;
    };
    cargo: {
        iron: number;
        gold: number;
        platinum: number;
    };
    upgrades: {
        engineLevel: number;
        hullLevel: number;
        fuelTankLevel: number;
        miningLevel: number;
        scannerLevel: number;
        weaponLevel: number;
        shieldLevel: number;
    };
    progress: {
        totalPlaytime: number; // seconds (duplicated for convenience)
    };
    highScores: {
        bestCredits: number;
        bestHordeSurvivalTime: number; // seconds
        totalKills: number;
    };
    achievements?: Array<{
        id: string;
        unlocked: boolean;
        unlockedAt: number | null;
        progress: number;
    }>;
    settings?: {
        audio: {
            masterVolume: number;
            sfxVolume: number;
            musicVolume: number;
            isMuted: boolean;
        };
        controls: {
            mouseSensitivity: number;
            gamepadSensitivity: number;
        };
        graphics: {
            graphicalQuality: string;
            postProcessing: boolean;
            asteroidDetail: string;
            lightingQuality: string;
            particleEffects: string;
            resolutionScale: string;
            frameRateCap: string;
            showFPS: boolean;
            spatialAudio: boolean;
            autoQuality: boolean;
            godRaysEnabled: boolean;
            godRaysType: string;
        };
    };
}

// ── Default state ────────────────────────────────────────────────────

export function getDefaultSave(): SaveSchema {
    return {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        meta: {
            totalPlaySessions: 0,
            totalPlaytime: 0,
        },
        player: {
            credits: 1000,
            fuel: 100,
            maxFuel: 100,
            hull: 100,
            maxHull: 100,
            shield: 50,
            maxShield: 50,
        },
        cargo: {
            iron: 0,
            gold: 0,
            platinum: 0,
        },
        upgrades: {
            engineLevel: 1,
            hullLevel: 1,
            fuelTankLevel: 1,
            miningLevel: 1,
            scannerLevel: 1,
            weaponLevel: 1,
            shieldLevel: 1,
        },
        progress: {
            totalPlaytime: 0,
        },
        highScores: {
            bestCredits: 0,
            bestHordeSurvivalTime: 0,
            totalKills: 0,
        },
        settings: {
            audio: {
                masterVolume: 1.0,
                sfxVolume: 1.0,
                musicVolume: 1.0,
                isMuted: false,
            },
            controls: {
                mouseSensitivity: 0.001,
                gamepadSensitivity: 1.0,
            },
            graphics: {
                graphicalQuality: 'medium',
                postProcessing: true,
                asteroidDetail: 'medium',
                lightingQuality: 'medium',
                particleEffects: 'medium',
                resolutionScale: 'medium',
                frameRateCap: 'auto',
                showFPS: false,
                spatialAudio: true,
                autoQuality: true,
                godRaysEnabled: false,
                godRaysType: 'standard',
            },
        },
    };
}

// ── Deep merge utility ───────────────────────────────────────────────

export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key in source) {
        if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
        const srcVal = source[key];
        const tgtVal = target[key];
        if (
            srcVal !== null &&
            typeof srcVal === 'object' &&
            !Array.isArray(srcVal) &&
            tgtVal !== null &&
            typeof tgtVal === 'object' &&
            !Array.isArray(tgtVal)
        ) {
            (result as any)[key] = deepMerge(tgtVal, srcVal as any);
        } else if (srcVal !== undefined) {
            (result as any)[key] = srcVal;
        }
    }
    return result;
}

// ── Schema migration ─────────────────────────────────────────────────

export function migrateSave(raw: Record<string, any>): SaveSchema {
    // Currently only version 1 exists. Future migrations go here.
    // e.g. if (raw.version === 1) { raw = migrateV1toV2(raw); }
    return deepMerge(getDefaultSave(), raw as Partial<SaveSchema>);
}

// ── SaveSystem class ─────────────────────────────────────────────────

export class SaveSystem {
    private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
    private autoSaveInterval: number;
    private sessionStartTime: number;
    private saveIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(autoSaveInterval: number = DEFAULT_AUTOSAVE_INTERVAL) {
        this.autoSaveInterval = autoSaveInterval;
        this.sessionStartTime = Date.now();
    }

    // ── Core operations ──────────────────────────────────────────────

    /** Save current game state to localStorage */
    save(game: any): boolean {
        try {
            const spaceship = game.spaceship;
            if (!spaceship) {
                debugWarn('SaveSystem: No spaceship to save');
                return false;
            }

            const existing = this.loadRaw();
            const upgrades = spaceship.shipUpgrades;

            const data: SaveSchema = {
                version: SAVE_VERSION,
                timestamp: Date.now(),
                meta: {
                    totalPlaySessions: (existing?.meta?.totalPlaySessions ?? 0) + (existing ? 0 : 1),
                    totalPlaytime: (existing?.meta?.totalPlaytime ?? 0) + this.getSessionElapsed(),
                },
                player: {
                    credits: spaceship.credits ?? 1000,
                    fuel: spaceship.fuel ?? 100,
                    maxFuel: spaceship.maxFuel ?? 100,
                    hull: spaceship.hull ?? 100,
                    maxHull: spaceship.maxHull ?? 100,
                    shield: spaceship.shield ?? 50,
                    maxShield: spaceship.maxShield ?? 50,
                },
                cargo: {
                    iron: spaceship.cargo?.iron ?? 0,
                    gold: spaceship.cargo?.gold ?? 0,
                    platinum: spaceship.cargo?.platinum ?? 0,
                },
                upgrades: {
                    engineLevel: upgrades?.engineLevel ?? 1,
                    hullLevel: upgrades?.hullLevel ?? 1,
                    fuelTankLevel: upgrades?.fuelTankLevel ?? 1,
                    miningLevel: upgrades?.miningLevel ?? 1,
                    scannerLevel: upgrades?.scannerLevel ?? 1,
                    weaponLevel: upgrades?.weaponLevel ?? 1,
                    shieldLevel: upgrades?.shieldLevel ?? 1,
                },
                progress: {
                    totalPlaytime: (existing?.progress?.totalPlaytime ?? 0) + this.getSessionElapsed(),
                },
                highScores: {
                    bestCredits: Math.max(
                        existing?.highScores?.bestCredits ?? 0,
                        spaceship.credits ?? 0
                    ),
                    bestHordeSurvivalTime: existing?.highScores?.bestHordeSurvivalTime ?? 0,
                    totalKills: existing?.highScores?.totalKills ?? 0,
                },
            };

            // Update horde scores if active
            if (game.hordeMode?.isActive) {
                data.highScores.bestHordeSurvivalTime = Math.max(
                    data.highScores.bestHordeSurvivalTime,
                    (game.hordeMode.survivalTime ?? 0) / 1000
                );
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            this.resetSessionTimer();
            this.showSaveIndicator();
            debugLog('SaveSystem: Game saved');
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to save', error);
            return false;
        }
    }

    /** Load saved state from localStorage, returns null if no save exists */
    load(): SaveSchema | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return migrateSave(parsed);
        } catch (error) {
            console.error('SaveSystem: Failed to load', error);
            return null;
        }
    }

    /** Apply loaded state to the game */
    applyToGame(game: any, save: SaveSchema): void {
        const spaceship = game.spaceship;
        if (!spaceship) return;

        // Restore player state
        spaceship.credits = save.player.credits;
        spaceship.fuel = save.player.fuel;
        spaceship.maxFuel = save.player.maxFuel;
        spaceship.hull = save.player.hull;
        spaceship.maxHull = save.player.maxHull;
        spaceship.shield = save.player.shield;
        spaceship.maxShield = save.player.maxShield;

        // Restore cargo
        spaceship.cargo = { ...save.cargo };

        // Restore upgrades by simulating upgrade levels
        const upgrades = spaceship.shipUpgrades;
        if (upgrades) {
            upgrades.engineLevel = save.upgrades.engineLevel;
            upgrades.hullLevel = save.upgrades.hullLevel;
            upgrades.fuelTankLevel = save.upgrades.fuelTankLevel;
            upgrades.miningLevel = save.upgrades.miningLevel;
            upgrades.scannerLevel = save.upgrades.scannerLevel;
            upgrades.weaponLevel = save.upgrades.weaponLevel;
            upgrades.shieldLevel = save.upgrades.shieldLevel;

            // Recalculate upgrade costs based on levels
            upgrades.engineUpgradeCost = 800 * Math.pow(4, save.upgrades.engineLevel - 1);
            upgrades.hullUpgradeCost = 1500 * Math.pow(4, save.upgrades.hullLevel - 1);
            upgrades.fuelUpgradeCost = 1000 * Math.pow(4, save.upgrades.fuelTankLevel - 1);
            upgrades.miningUpgradeCost = 1200 * Math.pow(4, save.upgrades.miningLevel - 1);
            upgrades.scannerUpgradeCost = 600 * Math.pow(4, save.upgrades.scannerLevel - 1);
            upgrades.weaponUpgradeCost = 800 * Math.pow(3, save.upgrades.weaponLevel - 1);
            upgrades.shieldUpgradeCost = 600 * Math.pow(3, save.upgrades.shieldLevel - 1);
        }

        // Restore derived stats from upgrade levels
        spaceship.maxVelocity = 25.0 * Math.pow(1.5, save.upgrades.engineLevel - 1);
        spaceship.miningEfficiency = 1.0 * Math.pow(2, save.upgrades.miningLevel - 1);
        spaceship.collisionResistance = 1.0 * Math.pow(1.5, save.upgrades.hullLevel - 1);
        spaceship.scanRange = 1000 * Math.pow(2, save.upgrades.scannerLevel - 1);
        spaceship.maxShield = 50 * Math.pow(1.3, save.upgrades.shieldLevel - 1);
        if (spaceship.shield > spaceship.maxShield) {
            spaceship.shield = spaceship.maxShield;
        }

        // Increment play sessions
        this.incrementPlaySessions();

        debugLog('SaveSystem: Save applied to game');
    }

    /** Check if a save file exists */
    hasSave(): boolean {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }

    /** Clear saved data */
    clear(): boolean {
        try {
            localStorage.removeItem(STORAGE_KEY);
            debugLog('SaveSystem: Save cleared');
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to clear save', error);
            return false;
        }
    }

    // ── Export/Import ────────────────────────────────────────────────

    /** Export save as JSON string for backup */
    exportSave(): string | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return raw;
        } catch (error) {
            console.error('SaveSystem: Failed to export', error);
            return null;
        }
    }

    /** Import save from JSON string */
    importSave(jsonString: string): SaveSchema | null {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed || typeof parsed !== 'object') return null;
            const migrated = migrateSave(parsed);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            debugLog('SaveSystem: Save imported');
            return migrated;
        } catch (error) {
            console.error('SaveSystem: Failed to import', error);
            return null;
        }
    }

    /** Download save as a .json file */
    downloadSave(): void {
        const data = this.exportSave();
        if (!data) return;
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asteroid-miner-save-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /** Upload and import a save file */
    uploadSave(): Promise<SaveSchema | null> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) { resolve(null); return; }
                try {
                    const text = await file.text();
                    resolve(this.importSave(text));
                } catch {
                    resolve(null);
                }
            };
            input.click();
        });
    }

    // ── Auto-save management ─────────────────────────────────────────

    /** Start auto-save timer */
    startAutoSave(game: any): void {
        this.stopAutoSave();
        this.autoSaveTimer = setInterval(() => {
            if (!game.isGameOver && game.spaceship) {
                this.save(game);
            }
        }, this.autoSaveInterval);
        debugLog(`SaveSystem: Auto-save started (${this.autoSaveInterval / 1000}s interval)`);
    }

    /** Stop auto-save timer */
    stopAutoSave(): void {
        if (this.autoSaveTimer !== null) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // ── High score updates ───────────────────────────────────────────

    /** Update high scores (call on death before resetting state) */
    updateHighScores(game: any): void {
        try {
            const save = this.load() ?? getDefaultSave();
            const spaceship = game.spaceship;

            if (spaceship) {
                save.highScores.bestCredits = Math.max(
                    save.highScores.bestCredits,
                    spaceship.credits ?? 0
                );
            }

            if (game.hordeMode?.isActive) {
                save.highScores.bestHordeSurvivalTime = Math.max(
                    save.highScores.bestHordeSurvivalTime,
                    (game.hordeMode.survivalTime ?? 0) / 1000
                );
            }

            save.meta.totalPlaytime += this.getSessionElapsed();
            save.progress.totalPlaytime += this.getSessionElapsed();
            save.timestamp = Date.now();

            localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
            this.resetSessionTimer();
        } catch (error) {
            console.error('SaveSystem: Failed to update high scores', error);
        }
    }

    // ── Event subscriptions ──────────────────────────────────────────

    /** Subscribe to game events for automatic saving */
    subscribeToEvents(game: any): void {
        // Save when player docks at stargate
        mainMessageBus.subscribe('player.docked', () => {
            setTimeout(() => this.save(game), 500); // small delay to let state settle
        });

        // Update high scores on game over
        mainMessageBus.subscribe('game.over', () => {
            this.updateHighScores(game);
        });
    }

    // ── Settings persistence ─────────────────────────────────────────

    /** Save settings immediately (not on auto-save timer) */
    saveSettings(settings: SaveSchema['settings']): boolean {
        try {
            const existing = this.loadRaw() ?? getDefaultSave();
            existing.settings = settings;
            existing.timestamp = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
            debugLog('SaveSystem: Settings saved');
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to save settings', error);
            return false;
        }
    }

    /** Load settings from save file */
    loadSettings(): SaveSchema['settings'] | null {
        try {
            const save = this.load();
            return save?.settings ?? null;
        } catch (error) {
            console.error('SaveSystem: Failed to load settings', error);
            return null;
        }
    }

    /** Apply loaded settings to game systems */
    applySettings(game: any, settings: SaveSchema['settings']): void {
        if (!settings) return;

        // Apply audio settings
        if (game.audio && settings.audio) {
            game.audio.sfxVolume = settings.audio.sfxVolume;
            game.audio.musicVolume = settings.audio.musicVolume;
            if (settings.audio.isMuted && !game.audio.isMuted) {
                game.audio.toggleMute();
            } else if (!settings.audio.isMuted && game.audio.isMuted) {
                game.audio.toggleMute();
            }
        }

        // Apply control settings
        if (game.controls && settings.controls) {
            if (game.controls.inputHandler && typeof settings.controls.mouseSensitivity === 'number') {
                game.controls.inputHandler.mouseSensitivity = settings.controls.mouseSensitivity;
            }
            if (game.controls.gamepadHandler && typeof settings.controls.gamepadSensitivity === 'number') {
                game.controls.gamepadHandler.lookSensitivity = settings.controls.gamepadSensitivity;
            }
        }

        debugLog('SaveSystem: Settings applied to game');
    }

    /** Capture current settings from game systems */
    captureSettings(game: any): SaveSchema['settings'] {
        const defaults = getDefaultSave().settings!;
        const settings: SaveSchema['settings'] = {
            audio: {
                masterVolume: defaults.audio.masterVolume,
                sfxVolume: game.audio?.sfxVolume ?? defaults.audio.sfxVolume,
                musicVolume: game.audio?.musicVolume ?? defaults.audio.musicVolume,
                isMuted: game.audio?.isMuted ?? defaults.audio.isMuted,
            },
            controls: {
                mouseSensitivity: game.controls?.inputHandler?.mouseSensitivity ?? defaults.controls.mouseSensitivity,
                gamepadSensitivity: game.controls?.gamepadHandler?.lookSensitivity ?? defaults.controls.gamepadSensitivity,
            },
            graphics: defaults.graphics,
        };
        return settings;
    }

    // ── Private helpers ──────────────────────────────────────────────

    private loadRaw(): SaveSchema | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    private getSessionElapsed(): number {
        return Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }

    private resetSessionTimer(): void {
        this.sessionStartTime = Date.now();
    }

    private incrementPlaySessions(): void {
        try {
            const save = this.loadRaw();
            if (save) {
                save.meta.totalPlaySessions = (save.meta.totalPlaySessions ?? 0) + 1;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
            }
        } catch {
            // silently ignore
        }
    }

    private showSaveIndicator(): void {
        const indicator = document.getElementById('save-indicator');
        if (!indicator) return;
        indicator.classList.add('visible');
        if (this.saveIndicatorTimeout) clearTimeout(this.saveIndicatorTimeout);
        this.saveIndicatorTimeout = setTimeout(() => {
            indicator.classList.remove('visible');
        }, 2000);
    }

    /** Destroy and clean up */
    destroy(): void {
        this.stopAutoSave();
        if (this.saveIndicatorTimeout) {
            clearTimeout(this.saveIndicatorTimeout);
        }
    }
}
