// helpers.ts - Utility functions and helper methods
import * as THREE from 'three';
import { Game } from '../game';

export class GameHelpers {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Format time in milliseconds as MM:SS
     * @param timeMs - Time in milliseconds
     * @returns Formatted time string
     */
    static formatTime(timeMs: number): string {
        const totalSeconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Clamp a value between min and max
     * @param value - Value to clamp
     * @param min - Minimum value
     * @param max - Maximum value
     * @returns Clamped value
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Calculate distance between two 3D points
     * @param pos1 - First position
     * @param pos2 - Second position
     * @returns Distance between points
     */
    static distance3D(pos1: THREE.Vector3, pos2: THREE.Vector3): number {
        return pos1.distanceTo(pos2);
    }

    /**
     * Linear interpolation between two values
     * @param start - Start value
     * @param end - End value
     * @param t - Interpolation factor (0-1)
     * @returns Interpolated value
     */
    static lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }

    /**
     * Get current performance metrics
     * @returns Performance metrics object
     */
    getPerformanceMetrics(): any {
        return {
            fps: this.game.currentFPS,
            frameCount: this.game.frameCount,
            isGameOver: this.game.isGameOver,
            hordeActive: this.game.isHordeActive,
            hordeSurvivalTime: this.game.hordeSurvivalTime
        };
    }

    /**
     * Get current game statistics
     * @returns Game statistics object
     */
    getGameStatistics(): any {
        // Get horde mode data if active
        let hordeModeData: any = {
            active: this.game.isHordeActive,
            survivalTime: this.game.stateManager.getFormattedHordeSurvivalTime(),
            rawSurvivalTime: this.game.hordeSurvivalTime
        };
        
        // If horde mode is active and we have a hordeMode instance, get additional data
        if (this.game.isHordeActive && (this.game as any).hordeMode) {
            const hordeMode = (this.game as any).hordeMode;
            hordeModeData = {
                ...hordeModeData,
                wave: hordeMode.currentWave || 1,
                score: hordeMode.score || 0,
                isNewHighScore: hordeMode.isNewHighScore ? hordeMode.isNewHighScore() : false,
                topScores: hordeMode.getHighScores ? hordeMode.getHighScores() : []
            };
            
            // Save high score if game is over
            if (this.game.isGameOver && hordeMode.saveHighScore) {
                hordeMode.saveHighScore();
            }
        }
        
        return {
            enemiesDestroyed: this.game.enemiesDestroyed,
            damageDealt: this.game.damageDealt,
            damageReceived: this.game.damageReceived,
            resources: (this.game.controls as any)?.resources || {},
            combatStats: {
                enemiesDestroyed: this.game.combatManager?.stats?.enemiesDestroyed || 0,
                damageDealt: this.game.damageDealt || 0,
                damageReceived: this.game.damageReceived || 0
            },
            hordeMode: hordeModeData
        };
    }

    /**
     * Check if all required systems are initialized
     * @returns True if all systems are ready
     */
    areSystemsReady(): boolean {
        return !!(
            this.game.renderer &&
            this.game.scene &&
            this.game.camera &&
            this.game.physics &&
            this.game.environment &&
            this.game.spaceship &&
            this.game.ui &&
            this.game.combat &&
            this.game.combatManager &&
            this.game.controls &&
            this.game.audio
        );
    }

    /**
     * Log system status for debugging
     */
    logSystemStatus(): void {
        console.log("Game System Status:", {
            renderer: !!this.game.renderer,
            scene: !!this.game.scene,
            camera: !!this.game.camera,
            physics: !!this.game.physics,
            environment: !!this.game.environment,
            spaceship: !!this.game.spaceship,
            ui: !!this.game.ui,
            combat: !!this.game.combat,
            combatManager: !!this.game.combatManager,
            controls: !!this.game.controls,
            audio: !!this.game.audio,
            messageBus: !!this.game.messageBus,
            isGameOver: this.game.isGameOver,
            frameCount: this.game.frameCount,
            currentFPS: Math.round(this.game.currentFPS)
        });
    }
}
