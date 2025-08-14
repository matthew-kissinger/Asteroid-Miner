// weaponHandler.js - Weapon firing handlers for touch controls

export class WeaponHandler {
    constructor() {
        this.weaponSystem = null;
    }

    setWeaponSystem(weaponSystem) {
        this.weaponSystem = weaponSystem;
    }

    handleFiringStart() {
        try {
            // First try local reference to weapon system (which is actually the Combat class)
            if (this.weaponSystem) {
                // Attempt to use the setFiring method from the Combat class
                if (typeof this.weaponSystem.setFiring === 'function') {
                    this.weaponSystem.setFiring(true);
                } else {
                    // Fallback to the older isWeaponActive property
                    this.weaponSystem.isWeaponActive = true;
                }
                
                // Try to play sound if available
                const game = window.gameInstance || window.game;
                if (game && game.audio) {
                    game.audio.playSound('laser');
                }
                return;
            }
            
            // Fallback to global game reference
            const game = window.gameInstance || window.game;
            if (!game) {
                console.error("WeaponHandler: No game reference found");
                return;
            }
            
            // Try direct combat object on game first (preferred)
            if (game.combat) {
                game.combat.setFiring(true);
                
                // Play laser sound if available
                if (game.audio) {
                    game.audio.playSound('laser');
                }
                return;
            }
            
            // Legacy fallbacks
            if (game.weaponSystem) {
                if (typeof game.weaponSystem.setFiring === 'function') {
                    game.weaponSystem.setFiring(true);
                } else {
                    game.weaponSystem.isWeaponActive = true;
                }
                
                // Play laser sound if available
                if (game.audio) {
                    game.audio.playSound('laser');
                }
                return;
            }
            
            // Try through controls
            if (game.controls && game.controls.weaponSystem) {
                if (typeof game.controls.weaponSystem.setFiring === 'function') {
                    game.controls.weaponSystem.setFiring(true);
                } else {
                    game.controls.weaponSystem.isWeaponActive = true;
                }
                
                // Play laser sound if available
                if (game.audio) {
                    game.audio.playSound('laser');
                }
                return;
            }
            
            console.error("WeaponHandler: No weapon system or combat system found");
        } catch (e) {
            console.error("WeaponHandler: Error in handleFiringStart:", e);
        }
    }

    handleFiringEnd() {
        try {
            // First try local reference to weapon system (which is actually the Combat class)
            if (this.weaponSystem) {
                // Attempt to use the setFiring method from the Combat class
                if (typeof this.weaponSystem.setFiring === 'function') {
                    this.weaponSystem.setFiring(false);
                } else {
                    // Fallback to the older isWeaponActive property
                    this.weaponSystem.isWeaponActive = false;
                }
                
                // Try to stop sound if available
                const game = window.gameInstance || window.game;
                if (game && game.audio) {
                    game.audio.stopSound('laser');
                }
                return;
            }
            
            // Fallback to global game reference
            const game = window.gameInstance || window.game;
            if (!game) {
                console.error("WeaponHandler: No game reference found");
                return;
            }
            
            // Try direct combat object on game first (preferred)
            if (game.combat) {
                game.combat.setFiring(false);
                
                // Stop laser sound if available
                if (game.audio) {
                    game.audio.stopSound('laser');
                }
                return;
            }
            
            // Legacy fallbacks
            if (game.weaponSystem) {
                if (typeof game.weaponSystem.setFiring === 'function') {
                    game.weaponSystem.setFiring(false);
                } else {
                    game.weaponSystem.isWeaponActive = false;
                }
                
                // Stop laser sound if available
                if (game.audio) {
                    game.audio.stopSound('laser');
                }
                return;
            }
            
            // Try through controls
            if (game.controls && game.controls.weaponSystem) {
                if (typeof game.controls.weaponSystem.setFiring === 'function') {
                    game.controls.weaponSystem.setFiring(false);
                } else {
                    game.controls.weaponSystem.isWeaponActive = false;
                }
                
                // Stop laser sound if available
                if (game.audio) {
                    game.audio.stopSound('laser');
                }
                return;
            }
            
            console.error("WeaponHandler: No weapon system or combat system found");
        } catch (e) {
            console.error("WeaponHandler: Error in handleFiringEnd:", e);
        }
    }
}