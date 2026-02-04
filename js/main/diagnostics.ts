// diagnostics.js - Performance overlay and debug toggles

import { initPerfOverlay } from '../modules/debug/perfOverlay.js';
import { DEBUG_MODE, toggleDebugMode } from '../globals/debug.ts';
import { objectPool } from '../globals/objectPool.ts';

type GameLoopLike = {
    setFrameRateCap: (limit: number) => void;
    currentFPS?: number;
};

type UiLike = {
    initializePerformanceMonitor?: () => void;
    statsInterval?: number | null;
};

type StartupSequenceLike = {
    startIntroSequence?: () => void;
};

type CombatWorldLike = {
    entityManager?: { entities: Set<unknown> };
    systemManager?: { systems: unknown[] };
};

type CombatLike = {
    world?: CombatWorldLike;
};

type DifficultyManagerLike = {
    currentLevel?: number;
};

type DiagnosticsGame = {
    gameLoop?: GameLoopLike;
    ui?: UiLike;
    startupSequence?: StartupSequenceLike;
    isGameOver?: boolean;
    spaceship?: { isDocked?: boolean };
    introSequenceActive?: boolean;
    isHordeActive?: boolean;
    gameTime?: number;
    difficultyManager?: DifficultyManagerLike;
    activateHordeMode?: () => void;
    combat?: CombatLike;
    scene?: { children: unknown[] };
};

export class Diagnostics {
    game: DiagnosticsGame;

    constructor(game: DiagnosticsGame) {
        this.game = game;
        this.setupDiagnostics();
    }
    
    setupDiagnostics(): void {
        // Perf overlay & sink
        initPerfOverlay();
        const perf = window.__perf ?? (window.__perf = {
            enabled: false,
            fps: 0,
            simMs: 0,
            renderMs: 0,
            drawCalls: 0,
            visibleInstances: 0,
            pools: { hits: 0, misses: 0 },
            gc: 0,
            systems: {}
        });
        perf.enabled = false;
        
        // Add debug command for FPS limit
        window.setFPSLimit = (limit: number) => {
            if (this.game.gameLoop) {
                this.game.gameLoop.setFrameRateCap(limit);
                return `FPS limit set to ${limit > 0 ? limit : 'unlimited'}`;
            }
            return "Game loop not initialized";
        };
        
        // Add debug command for performance monitoring
        window.togglePerf = (): string => {
            perf.enabled = !perf.enabled;
            
            if (perf.enabled) {
                // Initialize performance monitor if needed
                if (this.game.ui && this.game.ui.initializePerformanceMonitor) {
                    this.game.ui.initializePerformanceMonitor();
                }
                
                // Force memory stats update
                if (window.MemoryStats) {
                    window.MemoryStats.update();
                    window.MemoryStats.logReport();
                }
            } else {
                // Remove performance monitor if it exists
                const statsElement = document.getElementById('performance-stats');
                if (statsElement) {
                    statsElement.remove();
                }
                
                // Clear interval if it exists
                if (this.game.ui && this.game.ui.statsInterval) {
                    clearInterval(this.game.ui.statsInterval);
                    this.game.ui.statsInterval = null;
                }
            }
            
            return perf.enabled ? "enabled" : "disabled";
        };
        
        // Add global debug command to trigger intro sequence
        window.playIntro = (): string => {
            if (this.game.startupSequence && this.game.startupSequence.startIntroSequence) {
                    this.game.startupSequence.startIntroSequence();
                return "Playing intro sequence...";
            }
            return "Intro sequence not available";
        };
        
        // Add debug command to toggle debug mode
        window.toggleDebug = (): string => {
            toggleDebugMode();
            return `Debug mode ${DEBUG_MODE.enabled ? 'enabled' : 'disabled'}`;
        };
        
        // Add debug command to show game state
        window.gameState = () => {
            return {
                isGameOver: this.game.isGameOver,
                isDocked: this.game.spaceship?.isDocked,
                introActive: this.game.introSequenceActive,
                hordeActive: this.game.isHordeActive,
                fps: this.game.gameLoop?.currentFPS,
                gameTime: this.game.gameTime,
                difficulty: this.game.difficultyManager?.currentLevel
            };
        };
        
        // Add debug command to force horde mode
        window.startHorde = (): string => {
            if (this.game.activateHordeMode) {
                this.game.activateHordeMode();
                return "Horde mode activated!";
            }
            return "Horde mode not available";
        };
        
        // Add debug command for memory stats
        window.memStats = () => {
            if (window.MemoryStats) {
                window.MemoryStats.update();
                return window.MemoryStats.getReport();
            }
            return "Memory stats not available";
        };
        
        // Add debug command to check object pool stats
        window.poolStats = (poolName?: string) => {
            if (objectPool && objectPool.getStats) {
                if (poolName) {
                    return objectPool.getStats(poolName);
                } else {
                    // Get stats for all pools
                    const allStats: Record<string, unknown> = {};
                    const pools = ['projectile', 'enemy', 'particle', 'hitEffect', 'explosion'];
                    for (const pool of pools) {
                        const stats = objectPool.getStats(pool);
                        if (stats) {
                            allStats[pool] = stats;
                        }
                    }
                    return allStats;
                }
            }
            return "Object pool not available";
        };
        
        // Add command to check entity count
        window.entityCount = () => {
            if (this.game.combat && this.game.combat.world && this.game.combat.world.entityManager) {
                const entities = this.game.combat.world.entityManager.entities.size;
                const systems = this.game.combat.world.systemManager?.systems.length ?? 0;
                return {
                    entities,
                    systems,
                    sceneChildren: this.game.scene?.children.length
                };
            }
            return "ECS world not available";
        };
        
    }
}
