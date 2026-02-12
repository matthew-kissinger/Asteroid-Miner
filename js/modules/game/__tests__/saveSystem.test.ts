// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../globals/debug', () => ({
    DEBUG_MODE: { enabled: false },
    debugLog: vi.fn(),
    debugWarn: vi.fn(),
    debugError: vi.fn(),
}));

vi.mock('../../../globals/messageBus', () => ({
    mainMessageBus: {
        subscribe: vi.fn(),
        publish: vi.fn(),
    },
}));

import {
    SaveSystem,
    getDefaultSave,
    deepMerge,
    migrateSave,
} from '../saveSystem';

// ── Helpers ──────────────────────────────────────────────────────────

function makeGameStub(overrides: Record<string, any> = {}) {
    return {
        isGameOver: false,
        spaceship: {
            credits: 5000,
            fuel: 80,
            maxFuel: 200,
            hull: 90,
            maxHull: 200,
            shield: 40,
            maxShield: 100,
            cargo: { iron: 10, gold: 5, platinum: 2 },
            shipUpgrades: {
                engineLevel: 2,
                hullLevel: 3,
                fuelTankLevel: 2,
                miningLevel: 1,
                scannerLevel: 2,
                engineUpgradeCost: 3200,
                hullUpgradeCost: 24000,
                fuelUpgradeCost: 4000,
                miningUpgradeCost: 1200,
                scannerUpgradeCost: 2400,
            },
            maxVelocity: 37.5,
            miningEfficiency: 1.0,
            collisionResistance: 2.25,
            scanRange: 2000,
            ...overrides,
        },
        hordeMode: { isActive: false, survivalTime: 0 },
    };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('SaveSystem', () => {
    let saveSystem: SaveSystem;

    beforeEach(() => {
        localStorage.clear();
        saveSystem = new SaveSystem(60000);
    });

    afterEach(() => {
        saveSystem.destroy();
    });

    // ── Save/Load roundtrip ──────────────────────────────────────

    describe('save/load roundtrip', () => {
        it('should save and load game state', () => {
            const game = makeGameStub();
            expect(saveSystem.save(game)).toBe(true);
            const loaded = saveSystem.load();
            expect(loaded).not.toBeNull();
            expect(loaded!.player.credits).toBe(5000);
            expect(loaded!.cargo.iron).toBe(10);
            expect(loaded!.upgrades.engineLevel).toBe(2);
        });

        it('should return null when no save exists', () => {
            expect(saveSystem.load()).toBeNull();
        });

        it('hasSave returns correct state', () => {
            expect(saveSystem.hasSave()).toBe(false);
            saveSystem.save(makeGameStub());
            expect(saveSystem.hasSave()).toBe(true);
        });

        it('should clear saves', () => {
            saveSystem.save(makeGameStub());
            expect(saveSystem.hasSave()).toBe(true);
            saveSystem.clear();
            expect(saveSystem.hasSave()).toBe(false);
        });
    });

    // ── Deep merge ───────────────────────────────────────────────

    describe('deepMerge', () => {
        it('should merge nested objects', () => {
            const target = { a: 1, b: { c: 2, d: 3 } };
            const source: Partial<typeof target> = { b: { c: 99, d: 3 } };
            const result = deepMerge(target, source);
            expect(result.a).toBe(1);
            expect(result.b.c).toBe(99);
            expect(result.b.d).toBe(3);
        });

        it('should handle missing fields gracefully', () => {
            const defaults = getDefaultSave();
            const partial = { player: { credits: 9999 } } as any;
            const merged = deepMerge(defaults, partial);
            expect(merged.player.credits).toBe(9999);
            expect(merged.player.fuel).toBe(100); // default
            expect(merged.cargo.iron).toBe(0); // default
        });

        it('should not mutate target', () => {
            const target = { a: { b: 1 } };
            const source = { a: { b: 2 } };
            const result = deepMerge(target, source);
            expect(target.a.b).toBe(1);
            expect(result.a.b).toBe(2);
        });
    });

    // ── Schema migration ─────────────────────────────────────────

    describe('migrateSave', () => {
        it('should fill in missing fields from defaults', () => {
            const partial = {
                version: 1,
                player: { credits: 3000 },
            };
            const migrated = migrateSave(partial);
            expect(migrated.player.credits).toBe(3000);
            expect(migrated.player.fuel).toBe(100);
            expect(migrated.cargo).toEqual({ iron: 0, gold: 0, platinum: 0 });
            expect(migrated.upgrades.engineLevel).toBe(1);
        });

        it('should preserve all fields from a complete save', () => {
            const full = getDefaultSave();
            full.player.credits = 42;
            full.highScores.bestCredits = 99;
            const migrated = migrateSave(full as any);
            expect(migrated.player.credits).toBe(42);
            expect(migrated.highScores.bestCredits).toBe(99);
        });
    });

    // ── Apply to game ────────────────────────────────────────────

    describe('applyToGame', () => {
        it('should restore player state from save', () => {
            const game = makeGameStub();
            const save = getDefaultSave();
            save.player.credits = 9999;
            save.player.fuel = 50;
            save.cargo.gold = 100;
            save.upgrades.engineLevel = 3;

            saveSystem.applyToGame(game, save);

            expect(game.spaceship.credits).toBe(9999);
            expect(game.spaceship.fuel).toBe(50);
            expect(game.spaceship.cargo.gold).toBe(100);
            expect(game.spaceship.shipUpgrades.engineLevel).toBe(3);
        });

        it('should recalculate upgrade costs', () => {
            const game = makeGameStub();
            const save = getDefaultSave();
            save.upgrades.engineLevel = 3;
            save.upgrades.hullLevel = 2;

            saveSystem.applyToGame(game, save);

            // engineUpgradeCost = 800 * 4^(3-1) = 800 * 16 = 12800
            expect(game.spaceship.shipUpgrades.engineUpgradeCost).toBe(12800);
            // hullUpgradeCost = 1500 * 4^(2-1) = 1500 * 4 = 6000
            expect(game.spaceship.shipUpgrades.hullUpgradeCost).toBe(6000);
        });

        it('should recalculate derived stats', () => {
            const game = makeGameStub();
            const save = getDefaultSave();
            save.upgrades.miningLevel = 3;

            saveSystem.applyToGame(game, save);

            // miningEfficiency = 1.0 * 2^(3-1) = 4.0
            expect(game.spaceship.miningEfficiency).toBe(4.0);
        });
    });

    // ── Auto-save timer ──────────────────────────────────────────

    describe('auto-save', () => {
        it('should start and stop auto-save timer', () => {
            vi.useFakeTimers();
            const game = makeGameStub();
            const saveSpy = vi.spyOn(saveSystem, 'save');

            saveSystem.startAutoSave(game);

            vi.advanceTimersByTime(60000);
            expect(saveSpy).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(60000);
            expect(saveSpy).toHaveBeenCalledTimes(2);

            saveSystem.stopAutoSave();

            vi.advanceTimersByTime(60000);
            expect(saveSpy).toHaveBeenCalledTimes(2); // no more saves

            vi.useRealTimers();
        });

        it('should not save when game is over', () => {
            vi.useFakeTimers();
            const game = makeGameStub();
            game.isGameOver = true;
            const saveSpy = vi.spyOn(saveSystem, 'save');

            saveSystem.startAutoSave(game);
            vi.advanceTimersByTime(60000);

            expect(saveSpy).not.toHaveBeenCalled();

            vi.useRealTimers();
        });
    });

    // ── High scores ──────────────────────────────────────────────

    describe('high score tracking', () => {
        it('should track best credits', () => {
            const game = makeGameStub({ credits: 10000 });
            saveSystem.save(game);

            let loaded = saveSystem.load()!;
            expect(loaded.highScores.bestCredits).toBe(10000);

            // Lower credits should not overwrite
            game.spaceship.credits = 5000;
            saveSystem.save(game);
            loaded = saveSystem.load()!;
            expect(loaded.highScores.bestCredits).toBe(10000);
        });

        it('should track horde survival time', () => {
            const game = makeGameStub();
            game.hordeMode = { isActive: true, survivalTime: 120000 };
            saveSystem.save(game);

            const loaded = saveSystem.load()!;
            expect(loaded.highScores.bestHordeSurvivalTime).toBe(120);
        });

        it('updateHighScores should preserve best scores', () => {
            const game = makeGameStub({ credits: 8000 });
            saveSystem.save(game);

            game.spaceship.credits = 3000;
            saveSystem.updateHighScores(game);

            const loaded = saveSystem.load()!;
            expect(loaded.highScores.bestCredits).toBe(8000);
        });
    });

    // ── Export/Import ────────────────────────────────────────────

    describe('export/import', () => {
        it('should export and import saves', () => {
            saveSystem.save(makeGameStub());
            const exported = saveSystem.exportSave();
            expect(exported).toBeTruthy();

            localStorage.clear();
            expect(saveSystem.hasSave()).toBe(false);

            const imported = saveSystem.importSave(exported!);
            expect(imported).not.toBeNull();
            expect(imported!.player.credits).toBe(5000);
            expect(saveSystem.hasSave()).toBe(true);
        });

        it('should handle invalid import gracefully', () => {
            const result = saveSystem.importSave('not-json{{{');
            expect(result).toBeNull();
        });

        it('should export null when no save exists', () => {
            expect(saveSystem.exportSave()).toBeNull();
        });
    });

    // ── Default save ─────────────────────────────────────────────

    describe('getDefaultSave', () => {
        it('should return valid defaults', () => {
            const defaults = getDefaultSave();
            expect(defaults.version).toBe(1);
            expect(defaults.player.credits).toBe(1000);
            expect(defaults.cargo.iron).toBe(0);
            expect(defaults.upgrades.engineLevel).toBe(1);
            expect(defaults.highScores.bestCredits).toBe(0);
        });
    });
});
