// miningHandler.js - Mining action handlers for touch controls

type MiningAsteroid = {
    resourceType?: string;
    mesh?: {
        position?: {
            toArray?: () => number[];
            distanceTo?: (pos: unknown) => number;
        };
    };
};

type MiningSystem = {
    isMining?: boolean;
    setTargetAsteroid: (asteroid: MiningAsteroid) => void;
    startMining: () => void;
    stopMining: () => void;
};

type TargetingSystem = {
    getCurrentTarget: () => MiningAsteroid | null;
    isLockOnEnabled: () => boolean;
    toggleLockOn: () => void;
    findNearestTarget: () => MiningAsteroid | null;
};

type MiningSpaceship = {
    mesh?: {
        position?: {
            distanceTo?: (pos: unknown) => number;
        };
    };
};

type GameWindow = Window & {
    game?: {
        environment?: {
            asteroids?: MiningAsteroid[];
        };
    };
    gameInstance?: {
        environment?: {
            asteroids?: MiningAsteroid[];
        };
    };
};

export class MiningHandler {
    spaceship: MiningSpaceship | null;
    miningSystem: MiningSystem | null;
    targetingSystem: TargetingSystem | null;

    constructor(spaceship: MiningSpaceship | null) {
        this.spaceship = spaceship;
        this.miningSystem = null;
        this.targetingSystem = null;
    }

    setMiningSystem(miningSystem: MiningSystem | null): void {
        this.miningSystem = miningSystem;
    }

    setTargetingSystem(targetingSystem: TargetingSystem | null): void {
        this.targetingSystem = targetingSystem;
    }

    handleMiningStart(): void {
        try {
            console.log("MiningHandler: handleMiningStart called");
            
            // First ensure we have targeting and mining systems
            if (!this.targetingSystem) {
                console.error("MiningHandler: Targeting system not available");
                return;
            }
            
            if (!this.miningSystem) {
                console.error("MiningHandler: Mining system not available");
                return;
            }
            
            // First, get the current target
            let targetAsteroid = this.targetingSystem.getCurrentTarget();
            console.log("MiningHandler: Initial target:", targetAsteroid);
            
            // If no target is selected, enable targeting and find nearest
            if (!targetAsteroid) {
                console.log("MiningHandler: No target selected, enabling targeting and finding nearest target");
                
                // Enable targeting if not already enabled
                if (!this.targetingSystem.isLockOnEnabled()) {
                    this.targetingSystem.toggleLockOn();
                }
                
                // Find nearest target
                targetAsteroid = this.targetingSystem.findNearestTarget();
                console.log("MiningHandler: Found nearest target:", targetAsteroid);
                
                if (!targetAsteroid) {
                    console.log("MiningHandler: No targets in range after scan");
                    return;
                }
            }
            
            // Essential validation: make sure we have a valid target asteroid with required properties
            if (!targetAsteroid || !targetAsteroid.mesh || !targetAsteroid.mesh.position) {
                console.error("MiningHandler: Target asteroid is missing required properties", targetAsteroid);
                
                // Try a different approach - get all asteroids from environment
                const windowWithGame = window as GameWindow;
                const game = windowWithGame.gameInstance || windowWithGame.game;
                if (game && game.environment && game.environment.asteroids && game.environment.asteroids.length > 0) {
                    console.log("MiningHandler: Attempting to get asteroid directly from environment");
                    // Find closest asteroid
                    let closestDist = Infinity;
                    let closestAsteroid = null;
                    
                    for (const asteroid of game.environment.asteroids) {
                        if (asteroid && asteroid.mesh && asteroid.mesh.position && this.spaceship && this.spaceship.mesh) {
                            const dist = asteroid.mesh.position.distanceTo(this.spaceship.mesh.position);
                            if (dist < closestDist) {
                                closestDist = dist;
                                closestAsteroid = asteroid;
                            }
                        }
                    }
                    
                    if (closestAsteroid) {
                        console.log("MiningHandler: Found closest asteroid from environment:", closestAsteroid);
                        targetAsteroid = closestAsteroid;
                    } else {
                        console.error("MiningHandler: Could not find any valid asteroids in environment");
                        return;
                    }
                } else {
                    console.error("MiningHandler: Could not access environment to find asteroids");
                    return;
                }
            }
            
            console.log("MiningHandler: Target asteroid found:", targetAsteroid);
            
            // Extra validation to make absolutely sure we have a valid targetAsteroid
            if (!targetAsteroid || !targetAsteroid.mesh || !targetAsteroid.mesh.position) {
                console.error("MiningHandler: Target asteroid is still invalid after fallback attempts");
                return;
            }
            
            // Explicitly set the target asteroid for mining
            this.miningSystem.setTargetAsteroid(targetAsteroid);
            
            // Log asteroid details
            console.log("MiningHandler: Target set for mining:", {
                resourceType: targetAsteroid.resourceType || "unknown",
                position: targetAsteroid.mesh ? targetAsteroid.mesh.position.toArray() : "no mesh",
                distance: targetAsteroid.mesh && this.spaceship && this.spaceship.mesh ? 
                    targetAsteroid.mesh.position.distanceTo(this.spaceship.mesh.position) : "unknown"
            });
            
            // Start mining
            console.log("MiningHandler: Starting mining operation");
            this.miningSystem.startMining();
            
            // Check if mining actually started
            console.log("MiningHandler: Mining started:", this.miningSystem.isMining);
            
        } catch (error) {
            console.error("MiningHandler: Error in handleMiningStart:", error);
        }
    }

    handleMiningEnd(): void {
        try {
            console.log("MiningHandler: handleMiningEnd called");
            
            // Make sure we have the mining system
            if (!this.miningSystem) {
                console.error("MiningHandler: Mining system not available for stopping");
                return;
            }
            
            // Stop mining
            this.miningSystem.stopMining();
            console.log("MiningHandler: Mining stopped");
            
        } catch (e) {
            console.error("MiningHandler: Error stopping mining:", e);
        }
    }
}
