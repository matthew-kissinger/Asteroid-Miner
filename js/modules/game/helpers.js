// helpers.js - Utility functions and helper methods
export class GameHelpers {
    constructor(game) {
        this.game = game;
    }

    /**
     * Format time in milliseconds as MM:SS
     * @param {number} timeMs - Time in milliseconds
     * @returns {string} Formatted time string
     */
    static formatTime(timeMs) {
        const totalSeconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Calculate distance between two 3D points
     * @param {THREE.Vector3} pos1 - First position
     * @param {THREE.Vector3} pos2 - Second position
     * @returns {number} Distance between points
     */
    static distance3D(pos1, pos2) {
        return pos1.distanceTo(pos2);
    }

    /**
     * Linear interpolation between two values
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics object
     */
    getPerformanceMetrics() {
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
     * @returns {Object} Game statistics object
     */
    getGameStatistics() {
        return {
            enemiesDestroyed: this.game.enemiesDestroyed,
            damageDealt: this.game.damageDealt,
            damageReceived: this.game.damageReceived,
            resources: this.game.controls && this.game.controls.resources ? this.game.controls.resources : {},
            combatStats: {
                enemiesDestroyed: this.game.combatManager && this.game.combatManager.stats ? this.game.combatManager.stats.enemiesDestroyed : 0,
                damageDealt: this.game.damageDealt || 0,
                damageReceived: this.game.damageReceived || 0
            },
            hordeMode: {
                active: this.game.isHordeActive,
                survivalTime: this.game.stateManager.getFormattedHordeSurvivalTime(),
                rawSurvivalTime: this.game.hordeSurvivalTime
            }
        };
    }

    /**
     * Check if all required systems are initialized
     * @returns {boolean} True if all systems are ready
     */
    areSystemsReady() {
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
    logSystemStatus() {
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