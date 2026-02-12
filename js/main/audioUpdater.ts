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
    fuel?: number;
    maxFuel?: number;
    hull?: number;
    maxHull?: number;
    shield?: number;
    maxShield?: number;
};

type GameAudioContext = {
    audio?: AudioSystem & { updateAmbientAlarms?: (fuel: number, hull: number) => void };
    spaceship?: SpaceshipState;
};

export class AudioUpdater {
    game: GameAudioContext;
    private lastShieldPercent: number = 100;

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

        // Ambient warning alarms (low fuel / low hull)
        if (this.game.audio?.updateAmbientAlarms && this.game.spaceship) {
            const ship = this.game.spaceship;
            const fuelPercent = (ship.maxFuel != null && ship.maxFuel > 0 && ship.fuel != null)
                ? (ship.fuel / ship.maxFuel) * 100 : 100;
            const hullPercent = (ship.maxHull != null && ship.maxHull > 0 && ship.hull != null)
                ? (ship.hull / ship.maxHull) * 100 : 100;
            this.game.audio.updateAmbientAlarms(fuelPercent, hullPercent);
        }

        // Shield recharge complete: play sound when shields reach max from below
        if (this.game.audio && this.game.spaceship && this.game.spaceship.maxShield != null && this.game.spaceship.maxShield > 0) {
            const shield = this.game.spaceship.shield ?? 0;
            const maxShield = this.game.spaceship.maxShield;
            const shieldPercent = (shield / maxShield) * 100;
            if (this.lastShieldPercent < 99.5 && shieldPercent >= 99.5) {
                this.game.audio.playSound('shield-recharge');
            }
            this.lastShieldPercent = shieldPercent;
        }

        // Mining sound is handled by the mining system integration
    }
}
