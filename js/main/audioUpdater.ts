// audioUpdater.js - Game audio state management

type AudioSystem = {
    playSound: (soundId: string) => void;
    stopSound: (soundId: string) => void;
    setThrustVolume: (volume: number) => void;
};

type ThrustState = {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    boost: boolean;
};

type SpaceshipState = {
    isDocked: boolean;
    thrust: ThrustState;
};

type GameAudioContext = {
    audio?: AudioSystem;
    spaceship?: SpaceshipState;
};

export class AudioUpdater {
    game: GameAudioContext;

    constructor(game: GameAudioContext) {
        this.game = game;
    }
    
    // Update game sounds based on current game state
    update(): void {
        if (!this.game.audio || !this.game.spaceship) return;
        
        // Handle thruster sounds based on current thrust state
        if (this.game.spaceship.isDocked) {
            // No thruster sounds when docked
            this.game.audio.stopSound('thrust');
        } else {
            const isThrusting = this.game.spaceship.thrust.forward || 
                              this.game.spaceship.thrust.backward || 
                              this.game.spaceship.thrust.left || 
                              this.game.spaceship.thrust.right;
                              
            if (isThrusting) {
                // Play thrust sound if not already playing
                this.game.audio.playSound('thrust');
                
                // Calculate thrust intensity for volume
                let thrustIntensity = 0.5; // Base level
                
                if (this.game.spaceship.thrust.forward) thrustIntensity += 0.2;
                if (this.game.spaceship.thrust.backward) thrustIntensity += 0.1;
                if (this.game.spaceship.thrust.left) thrustIntensity += 0.1;
                if (this.game.spaceship.thrust.right) thrustIntensity += 0.1;
                
                // Boost increases volume
                if (this.game.spaceship.thrust.boost) thrustIntensity *= 1.5;
                
                // Set thrust volume
                this.game.audio.setThrustVolume(thrustIntensity);
            } else {
                // Stop thrust sound if no thrusters active
                this.game.audio.stopSound('thrust');
            }
        }
        
        // Mining sound is handled by the mining system integration
    }
}
