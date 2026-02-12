// missions.ts - Mission selection and display (including challenge systems)

import type { MissionSystem, Mission } from '../../../game/missionSystem.ts';
import { mainMessageBus } from '../../../../globals/messageBus.ts';
import { debugLog } from '../../../../globals/debug.ts';

type GameReference = {
    ecsWorld?: {
        enemySystem?: {
            initialSpawnComplete?: boolean;
        };
    };
    activateHordeMode?: () => void;
    missionSystem?: MissionSystem;
    spaceship?: {
        credits: number;
        addXP?: (amount: number) => void;
    };
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
    
    refreshMissionsDisplay(): void {
        const container = document.getElementById('missions-list');
        if (!container || !this.gameRef?.missionSystem) return;

        const missionSystem = this.gameRef.missionSystem;
        const activeMission = missionSystem.getActiveMission();
        const availableMissions = missionSystem.getAvailableMissions();

        container.innerHTML = '';

        // Show active mission if exists
        if (activeMission) {
            const activeCard = this.createActiveMissionCard(activeMission);
            container.appendChild(activeCard);
        }

        // Show available missions
        if (availableMissions.length > 0) {
            const header = document.createElement('div');
            header.style.cssText = 'color: #00ff88; font-size: 18px; margin: 20px 0 10px 0; font-weight: bold;';
            header.textContent = 'AVAILABLE CONTRACTS';
            container.appendChild(header);

            availableMissions.forEach(mission => {
                const card = this.createMissionCard(mission);
                container.appendChild(card);
            });
        }
    }

    private createMissionCard(mission: Mission): HTMLElement {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 20, 40, 0.8);
            border: 1px solid #00aaff;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            cursor: pointer;
            transition: all 0.2s;
        `;

        card.innerHTML = `
            <div style="color: #00ffff; font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                ${mission.title}
            </div>
            <div style="color: #aaaaaa; font-size: 14px; margin-bottom: 10px;">
                ${mission.description}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="color: #ffaa00; font-size: 14px;">
                    Reward: ${mission.rewards.credits} CR + ${mission.rewards.xp} XP
                </div>
                <button class="mission-accept-btn" style="
                    background: #00aa00;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">ACCEPT</button>
            </div>
        `;

        const acceptBtn = card.querySelector('.mission-accept-btn') as HTMLButtonElement;
        acceptBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.acceptMission(mission.id);
        });

        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#00ffff';
            card.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.borderColor = '#00aaff';
            card.style.boxShadow = 'none';
        });

        return card;
    }

    private createActiveMissionCard(mission: Mission): HTMLElement {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 40, 20, 0.9);
            border: 2px solid #00ff88;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0 20px 0;
        `;

        const objective = mission.objectives[0];
        const progress = objective ? (objective.current / objective.target) * 100 : 0;

        card.innerHTML = `
            <div style="color: #00ff88; font-size: 14px; font-weight: bold; margin-bottom: 5px;">
                ACTIVE MISSION
            </div>
            <div style="color: #00ffff; font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                ${mission.title}
            </div>
            <div style="color: #aaaaaa; font-size: 14px; margin-bottom: 10px;">
                ${objective?.description ?? 'No objectives'}
            </div>
            <div style="background: rgba(0, 0, 0, 0.5); border-radius: 4px; height: 20px; margin-bottom: 10px; overflow: hidden;">
                <div style="
                    background: linear-gradient(90deg, #00ff88, #00aa55);
                    height: 100%;
                    width: ${progress}%;
                    transition: width 0.3s;
                "></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="color: #ffffff; font-size: 14px;">
                    Progress: ${objective?.current ?? 0}/${objective?.target ?? 0}
                </div>
                <button class="mission-abandon-btn" style="
                    background: #aa0000;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">ABANDON</button>
            </div>
        `;

        const abandonBtn = card.querySelector('.mission-abandon-btn') as HTMLButtonElement;
        abandonBtn.addEventListener('click', () => {
            this.abandonMission();
        });

        return card;
    }

    private acceptMission(missionId: string): void {
        if (!this.gameRef?.missionSystem) return;

        const success = this.gameRef.missionSystem.acceptMission(missionId);
        if (success) {
            debugLog(`Accepted mission: ${missionId}`);
            mainMessageBus.publish('mission.accepted', { missionId });
            this.showNotification('Mission accepted!', 0x00ff88);
            this.refreshMissionsDisplay();
        } else {
            this.showNotification('Cannot accept mission', 0xff3030);
        }
    }

    private abandonMission(): void {
        if (!this.gameRef?.missionSystem) return;

        const success = this.gameRef.missionSystem.abandonMission();
        if (success) {
            debugLog('Abandoned mission');
            mainMessageBus.publish('mission.abandoned', {});
            this.showNotification('Mission abandoned', 0xffaa00);
            this.refreshMissionsDisplay();
        }
    }

    claimMissionReward(): void {
        if (!this.gameRef?.missionSystem || !this.gameRef?.spaceship) return;

        const mission = this.gameRef.missionSystem.getActiveMission();
        if (!mission || mission.status !== 'completed') return;

        const { credits, xp } = mission.rewards;
        this.gameRef.spaceship.credits += credits;
        
        if (this.gameRef.spaceship.addXP) {
            this.gameRef.spaceship.addXP(xp);
        }

        debugLog(`Claimed mission reward: ${credits} CR, ${xp} XP`);
        mainMessageBus.publish('mission.completed', { mission });
        this.showNotification(`Reward claimed: ${credits} CR + ${xp} XP`, 0x00ff88);
        
        this.gameRef.missionSystem.completeMission();
        this.refreshMissionsDisplay();
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
