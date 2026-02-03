// uiUpdates.js - Handles UI updates and progress displays

import type { Object3D } from 'three';

interface TargetingSystem {
    isLockOnEnabled: () => boolean;
}

type WindowWithGame = {
    gameInstance?: {
        controls?: {
            targetingSystem?: TargetingSystem;
        };
    };
    game?: {
        controls?: {
            targetingSystem?: TargetingSystem;
        };
    };
};

interface HasMesh {
    mesh: Object3D;
}

interface AsteroidInfo extends HasMesh {
    resourceType?: string;
}

export class UIUpdates {
    constructor() {}

    /**
     * Update target info UI elements
     */
    updateTargetInfo(asteroid: AsteroidInfo | null, spaceship: HasMesh | null, miningDistance: number): void {
        if (!asteroid || !asteroid.mesh || !spaceship || !spaceship.mesh) return;
        
        try {
            // Check if targeting system is active
            const gameWindow = window as WindowWithGame;
            const targetingSystem = gameWindow.gameInstance?.controls?.targetingSystem || gameWindow.game?.controls?.targetingSystem;
            const isTargetingEnabled = targetingSystem && targetingSystem.isLockOnEnabled();
            
            if (!isTargetingEnabled) return;

            // Update distance calculation
            const distance = spaceship.mesh.position.distanceTo(asteroid.mesh.position);
            const inRange = distance <= miningDistance;
            
            // Update UI elements if they exist
            const targetDistance = document.getElementById('target-distance');
            if (targetDistance) {
                const rangeStatus = inRange ? ' [IN RANGE]' : ' [OUT OF RANGE]';
                const rangeColor = inRange ? '#00ff00' : '#ff4400';
                targetDistance.innerHTML = `Distance: ${Math.round(distance)} units<span style="color: ${rangeColor}">${rangeStatus}</span>`;
            }
            
            // Update target info color
            const targetInfo = document.getElementById('target-info');
            if (targetInfo) {
                targetInfo.style.color = inRange ? '#30cfd0' : '#ff4400';
                targetInfo.style.display = 'block';
            }
            
            // Update target name to show range status
            const targetName = document.getElementById('target-name');
            if (targetName && asteroid.resourceType) {
                const resourceType = asteroid.resourceType.toUpperCase();
                if (!inRange) {
                    targetName.textContent = `${resourceType} Asteroid - OUT OF RANGE`;
                    targetName.style.color = '#ff4400';
                } else {
                    targetName.textContent = `${resourceType} Asteroid`;
                    targetName.style.color = '#30cfd0';
                }
            }
        } catch (error) {
            console.error("UIUpdates: Error updating target info:", error);
        }
    }

    /**
     * Update mining status with time estimate
     */
    updateMiningStatusWithTime(asteroid: AsteroidInfo | null, miningSpeed: number, efficiency = 1.0): void {
        const miningStatusElement = document.getElementById('mining-status');
        if (!miningStatusElement || !asteroid || !asteroid.resourceType) return;
        
        // Calculate approximate time to mine based on resource type
        const resourceType = asteroid.resourceType.toLowerCase();
        const secondsRequired = Math.round(1 / miningSpeed);
        
        let efficiencyText = "";
        if (efficiency > 1.0) {
            efficiencyText = ` [${Math.round(efficiency * 100)}% efficiency]`;
        }
        
        miningStatusElement.textContent = `MINING ${resourceType.toUpperCase()} (${secondsRequired}s)${efficiencyText}`;
        miningStatusElement.style.color = '#ff4400';
    }

    /**
     * Reset mining status display
     */
    resetMiningStatus(): void {
        const miningStatusElement = document.getElementById('mining-status');
        if (miningStatusElement) {
            miningStatusElement.textContent = 'INACTIVE';
            miningStatusElement.style.color = '#30cfd0';
        }
    }

    /**
     * Create or update mining progress bar
     */
    setupMiningProgressBar(): void {
        let miningProgressContainer = document.getElementById('mining-progress-container');
        if (!miningProgressContainer) {
            console.log("UIUpdates: Creating mining progress container");
            miningProgressContainer = document.createElement('div');
            miningProgressContainer.id = 'mining-progress-container';
            miningProgressContainer.style.position = 'absolute';
            miningProgressContainer.style.bottom = '20px';
            miningProgressContainer.style.left = '50%';
            miningProgressContainer.style.transform = 'translateX(-50%)';
            miningProgressContainer.style.width = '200px';
            miningProgressContainer.style.height = '10px';
            miningProgressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            miningProgressContainer.style.border = '1px solid #30cfd0';
            miningProgressContainer.style.zIndex = '1000';
            document.body.appendChild(miningProgressContainer);
            
            const progressBar = document.createElement('div');
            progressBar.id = 'mining-progress-bar';
            progressBar.style.width = '0%';
            progressBar.style.height = '100%';
            progressBar.style.backgroundColor = '#30cfd0';
            miningProgressContainer.appendChild(progressBar);
        } else {
            miningProgressContainer.style.display = 'block';
            const progressBar = document.getElementById('mining-progress-bar');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }
    }

    /**
     * Update mining progress bar
     */
    updateMiningProgress(progress: number): void {
        const progressBar = document.getElementById('mining-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
    }

    /**
     * Hide mining progress bar
     */
    hideMiningProgressBar(): void {
        const miningProgressContainer = document.getElementById('mining-progress-container');
        if (miningProgressContainer) {
            miningProgressContainer.style.display = 'none';
        }
    }

    /**
     * Show out of range message
     */
    showOutOfRangeMessage(): void {
        const gameWindow = window as WindowWithGame;
        const targetingSystem = gameWindow.gameInstance?.controls?.targetingSystem || gameWindow.game?.controls?.targetingSystem;
        const isTargetingEnabled = targetingSystem && targetingSystem.isLockOnEnabled();
        
        const targetInfo = document.getElementById('target-info');
        if (targetInfo && isTargetingEnabled) {
            targetInfo.textContent = 'TARGET OUT OF RANGE';
            targetInfo.style.color = '#ff4400';
            targetInfo.style.display = 'block';
            
            // Hide after 2 seconds
            setTimeout(() => {
                if (!targetingSystem || !targetingSystem.isLockOnEnabled()) {
                    targetInfo.style.display = 'none';
                }
            }, 2000);
        }
    }
}
