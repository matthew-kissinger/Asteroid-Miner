// missions.ts - Mission selection and display (including challenge systems)

type GameReference = {
    ecsWorld?: {
        enemySystem?: {
            initialSpawnComplete?: boolean;
        };
    };
    activateHordeMode?: () => void;
};

export class MissionsView {
    private hideStargateUICallback: (() => void) | null;
    private gameRef: GameReference | null;
    
    constructor() {
        this.hideStargateUICallback = null;
        this.gameRef = null;
    }
    
    setGameReference(gameRef: GameReference): void {
        this.gameRef = gameRef;
    }
    
    setHideCallback(callback: () => void): void {
        this.hideStargateUICallback = callback;
    }
    
    setupHordeButton(): void {
        const hordeButton = document.getElementById('unleash-horde');
        if (hordeButton) {
            hordeButton.addEventListener('click', () => {
                // Check if spectral drones have started spawning
                const dronesHaveSpawned = this.gameRef?.ecsWorld?.enemySystem?.initialSpawnComplete;
                
                if (dronesHaveSpawned) {
                    console.log("HORDE MODE: Button clicked, showing confirmation");
                    this.showHordeConfirmation();
                } else {
                    console.log("HORDE MODE: Button clicked but spectral drones haven't appeared yet");
                    // Show notification that horde mode is not available yet
                    this.showNotification("Horde mode is only available after spectral drones appear in the sector.", 0xff3030);
                }
            });
        }
    }
    
    /**
     * Show confirmation dialog for activating horde mode
     */
    showHordeConfirmation(): void {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'horde-confirm-modal';
        
        // Create content container
        const content = document.createElement('div');
        content.id = 'horde-confirm-content';
        
        // Add title
        const title = document.createElement('div');
        title.className = 'horde-confirm-title';
        title.textContent = 'UNLEASH THE HORDE?';
        content.appendChild(title);
        
        // Add warning text
        const text = document.createElement('div');
        text.className = 'horde-confirm-text';
        text.innerHTML = `
            <p>You are about to activate EXTREME SURVIVAL MODE.</p>
            <p>Enemies will continuously spawn with increasing:</p>
            <ul style="text-align: left; padding-left: 30px; margin: 15px 0;">
                <li>Numbers (starting at 50, scaling upward)</li>
                <li>Speed (progressively faster movement)</li>
                <li>Health (gradually becoming tougher)</li>
                <li>Damage (increasingly lethal hits)</li>
            </ul>
            <p>Difficulty will scale <strong>infinitely</strong> until you are overwhelmed.</p>
            <p style="color: #ff9999;">This is a test of survival. How long can you last?</p>
        `;
        content.appendChild(text);
        
        // Add buttons container
        const buttons = document.createElement('div');
        buttons.className = 'horde-confirm-buttons';
        
        // Add YES button
        const yesBtn = document.createElement('button');
        yesBtn.className = 'horde-confirm-btn horde-confirm-yes';
        yesBtn.textContent = 'UNLEASH THEM';
        yesBtn.addEventListener('click', () => {
            // Remove the confirmation dialog
            document.body.removeChild(modal);
            
            // Hide the stargate UI
            if (this.hideStargateUICallback) {
                this.hideStargateUICallback();
            }
            
            // Activate horde mode in the game
            if (this.gameRef?.activateHordeMode) {
                this.gameRef.activateHordeMode();
                console.log("HORDE MODE: Activated via stargateInterface");
            } else {
                console.error("HORDE MODE: Failed to activate - game.activateHordeMode not available");
            }
        });
        
        // Add NO button
        const noBtn = document.createElement('button');
        noBtn.className = 'horde-confirm-btn horde-confirm-no';
        noBtn.textContent = 'CANCEL';
        noBtn.addEventListener('click', () => {
            // Just remove the confirmation dialog
            document.body.removeChild(modal);
        });
        
        // Add buttons to container
        buttons.appendChild(noBtn);  // Cancel on left
        buttons.appendChild(yesBtn); // Confirm on right
        
        // Add buttons to content
        content.appendChild(buttons);
        
        // Add content to modal
        modal.appendChild(content);
        
        // Add modal to body
        document.body.appendChild(modal);
    }
    
    // Helper method to show notifications
    showNotification(message: string, color = 0x33aaff): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '35%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#fff';
        notification.style.padding = '15px 30px';
        notification.style.borderRadius = '10px';
        notification.style.border = `2px solid #${color.toString(16).padStart(6, '0')}`;
        notification.style.boxShadow = `0 0 15px #${color.toString(16).padStart(6, '0')}`;
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = '16px';
        notification.style.zIndex = '1001'; // Above the stargate UI
        notification.style.textAlign = 'center';
        
        // Set notification text
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.8s';
            
            setTimeout(() => {
                notification.remove();
            }, 800);
        }, 2000);
    }
}
