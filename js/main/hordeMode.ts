// hordeMode.js - Horde mode management

import { DEBUG_MODE } from '../globals/debug.ts';
import { mainMessageBus } from '../globals/messageBus.ts';

type HordeAudio = {
    playSound: (soundId: string) => void;
};

type HordeUi = {
    showNotification?: (message: string, durationMs: number) => void;
    showUI?: () => void;
};

type HordeSpaceship = {
    isDocked: boolean;
    undock: () => void;
};

type HordeGameContext = {
    isHordeActive?: boolean;
    hordeStartTime?: number;
    hordeSurvivalTime?: number;
    audio?: HordeAudio;
    ui?: HordeUi;
    spaceship?: HordeSpaceship;
};

export class HordeMode {
    game: HordeGameContext;
    isActive: boolean;
    startTime: number;
    survivalTime: number;

    constructor(game: HordeGameContext) {
        this.game = game;
        this.isActive = false;
        this.startTime = 0;
        this.survivalTime = 0;
    }
    
    /**
     * Activate horde mode (extreme survival challenge)
     */
    activate(): void {
        if (this.isActive) return; // Already active
        
        if (DEBUG_MODE.enabled) console.log("ACTIVATING HORDE MODE - EXTREME SURVIVAL CHALLENGE");
        this.isActive = true;
        this.startTime = performance.now();
        this.survivalTime = 0;
        
        // Store horde state in game
        this.game.isHordeActive = true;
        this.game.hordeStartTime = this.startTime;
        this.game.hordeSurvivalTime = this.survivalTime;
        
        // Play an intense sound to signal the start of horde mode
        if (this.game.audio) {
            this.game.audio.playSound('boink');
        }
        
        // Notify UI to update
        mainMessageBus.publish('horde.activated', {
            startTime: this.startTime
        });
        
        // Notify the player
        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification("HORDE MODE ACTIVATED - SURVIVE!", 5000);
        }
        
        // Force player to undock if currently docked
        if (this.game.spaceship && this.game.spaceship.isDocked) {
            if (DEBUG_MODE.enabled) console.log("Horde mode forcing undock from stargate");
            
            // Undock the ship
            this.game.spaceship.undock();
            
            // Notify the docking system
            mainMessageBus.publish('player.requestUndock', {
                forced: true,
                reason: "horde_mode_activation"
            });
            
            // CRITICAL FIX: Explicitly show the HUD after forcing undock
            // Use a short delay to ensure undocking process is complete
            setTimeout(() => {
                if (DEBUG_MODE.enabled) console.log("Horde mode ensuring HUD is visible");
                if (this.game.ui && this.game.ui.showUI) {
                    this.game.ui.showUI();
                }
            }, 200);
        }
    }
    
    /**
     * Update horde mode survival time
     */
    update(): void {
        if (this.isActive) {
            this.survivalTime = performance.now() - this.startTime;
            this.game.hordeSurvivalTime = this.survivalTime;
        }
    }
    
    /**
     * Format horde survival time as MM:SS
     * @returns {string} Formatted time string
     */
    getFormattedSurvivalTime(): string {
        const totalSeconds = Math.floor(this.survivalTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
