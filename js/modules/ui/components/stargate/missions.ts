// missions.ts - Mission selection and display (including challenge systems)

import type { MissionManager, MissionDefinition } from '../../../game/missions.ts';

type GameReference = {
    ecsWorld?: {
        enemySystem?: {
            initialSpawnComplete?: boolean;
        };
    };
    activateHordeMode?: () => void;
};

const CATEGORY_ICONS: Record<string, string> = {
    mining: '⛏',
    combat: '⚔',
    trade: '💰',
};

const CATEGORY_COLORS: Record<string, string> = {
    mining: '#ff9900',
    combat: '#ff3333',
    trade: '#33cc66',
};

export class MissionsView {
    private hideStargateUICallback: (() => void) | null;
    private gameRef: GameReference | null;
    private missionManager: MissionManager | null;

    constructor() {
        this.hideStargateUICallback = null;
        this.gameRef = null;
        this.missionManager = null;
    }

    setGameReference(gameRef: GameReference): void {
        this.gameRef = gameRef;
    }

    setHideCallback(callback: () => void): void {
        this.hideStargateUICallback = callback;
    }

    setMissionManager(manager: MissionManager): void {
        this.missionManager = manager;
        manager.setOnMissionUpdate(() => this.renderContracts());
    }

    // ── Contract rendering ────────────────────────────────────────────

    /** Render the contracts section into the DOM container */
    renderContracts(): void {
        const container = document.getElementById('mission-contracts-list');
        if (!container || !this.missionManager) return;

        const active = this.missionManager.getActiveMission();
        const available = this.missionManager.getAvailableMissions();
        const completedCount = this.missionManager.getCompletedCount();
        const totalEarned = this.missionManager.getTotalCreditsEarned();

        let html = '';

        // Stats bar
        html += `<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:12px;color:#88aacc;">
            <span>Contracts completed: <strong style="color:#33aaff;">${completedCount}</strong></span>
            <span>Total earned: <strong style="color:#ffcc33;">${totalEarned.toLocaleString()} CR</strong></span>
        </div>`;

        // Active mission
        if (active) {
            html += this.renderActiveMission(active);
        } else if (available.length > 0) {
            // Available missions
            html += `<div style="font-size:12px;color:#88aacc;margin-bottom:8px;">Select a contract (max 1 active):</div>`;
            for (const mission of available) {
                html += this.renderAvailableMission(mission);
            }
        } else {
            html += `<div style="text-align:center;color:#556677;padding:20px;font-size:14px;">
                No contracts available. Undock and return later.
            </div>`;
        }

        container.innerHTML = html;

        // Attach event listeners after rendering
        this.attachContractListeners();
    }

    private renderAvailableMission(mission: MissionDefinition): string {
        const icon = CATEGORY_ICONS[mission.category] ?? '?';
        const color = CATEGORY_COLORS[mission.category] ?? '#33aaff';
        const timeLimitText = mission.timeLimit
            ? `<span style="color:#ff9999;font-size:11px;">Time limit: ${Math.floor(mission.timeLimit / 60)}min</span>`
            : '';

        return `<div class="mission-card" style="
            background:rgba(20,35,60,0.8);
            border:1px solid ${color}44;
            border-left:3px solid ${color};
            border-radius:6px;
            padding:12px;
            margin-bottom:8px;
            transition:border-color 0.2s;
        ">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:bold;color:${color};margin-bottom:4px;">
                        ${icon} ${mission.title}
                    </div>
                    <div style="font-size:12px;color:#aabbcc;margin-bottom:6px;">${mission.description}</div>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                        <span style="font-size:13px;color:#ffcc33;font-weight:bold;">+${mission.creditReward.toLocaleString()} CR</span>
                        ${timeLimitText}
                    </div>
                </div>
                <button data-accept-mission="${mission.id}" style="
                    background:${color};
                    color:#000;
                    border:none;
                    border-radius:4px;
                    padding:8px 14px;
                    font-family:'Courier New',monospace;
                    font-weight:bold;
                    font-size:12px;
                    cursor:pointer;
                    white-space:nowrap;
                    margin-left:10px;
                    align-self:center;
                ">ACCEPT</button>
            </div>
        </div>`;
    }

    private renderActiveMission(mission: MissionDefinition): string {
        const icon = CATEGORY_ICONS[mission.category] ?? '?';
        const color = CATEGORY_COLORS[mission.category] ?? '#33aaff';
        const progress = Math.min(mission.currentProgress / mission.targetAmount, 1);
        const progressPct = Math.round(progress * 100);
        const progressText = `${Math.min(mission.currentProgress, mission.targetAmount)} / ${mission.targetAmount}`;

        let timeText = '';
        if (mission.timeLimit && mission.startedAt) {
            const elapsed = (Date.now() - mission.startedAt) / 1000;
            const remaining = Math.max(0, mission.timeLimit - elapsed);
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            timeText = `<span style="color:${remaining < 60 ? '#ff3333' : '#ff9999'};font-size:12px;">
                Time: ${minutes}:${String(seconds).padStart(2, '0')}
            </span>`;
        }

        return `<div style="
            background:rgba(20,35,60,0.8);
            border:1px solid ${color};
            border-radius:6px;
            padding:14px;
            margin-bottom:8px;
            box-shadow:0 0 8px ${color}22;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:14px;font-weight:bold;color:${color};">
                    ${icon} ${mission.title} <span style="font-size:11px;color:#88aacc;">[ACTIVE]</span>
                </div>
                ${timeText}
            </div>
            <div style="font-size:12px;color:#aabbcc;margin-bottom:10px;">${mission.description}</div>
            <div style="background:rgba(0,0,0,0.4);border-radius:4px;height:18px;overflow:hidden;margin-bottom:8px;position:relative;">
                <div style="
                    background:linear-gradient(90deg,${color}88,${color});
                    height:100%;
                    width:${progressPct}%;
                    border-radius:4px;
                    transition:width 0.3s ease;
                "></div>
                <span style="
                    position:absolute;
                    top:50%;
                    left:50%;
                    transform:translate(-50%,-50%);
                    font-size:11px;
                    color:#fff;
                    text-shadow:0 0 3px #000;
                    font-weight:bold;
                ">${progressText} (${progressPct}%)</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:13px;color:#ffcc33;font-weight:bold;">Reward: +${mission.creditReward.toLocaleString()} CR</span>
                <button data-cancel-mission="true" style="
                    background:transparent;
                    color:#ff6666;
                    border:1px solid #ff666644;
                    border-radius:4px;
                    padding:6px 12px;
                    font-family:'Courier New',monospace;
                    font-size:11px;
                    cursor:pointer;
                ">ABANDON</button>
            </div>
        </div>`;
    }

    private attachContractListeners(): void {
        // Accept buttons
        const acceptButtons = document.querySelectorAll('[data-accept-mission]');
        acceptButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const missionId = (e.currentTarget as HTMLElement).getAttribute('data-accept-mission');
                if (missionId && this.missionManager) {
                    this.missionManager.acceptMission(missionId);
                }
            });
        });

        // Cancel button
        const cancelBtn = document.querySelector('[data-cancel-mission]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.missionManager) {
                    this.missionManager.cancelMission();
                }
            });
        }
    }

    // ── Horde mode (existing) ─────────────────────────────────────────

    setupHordeButton(): void {
        const hordeButton = document.getElementById('unleash-horde');
        if (hordeButton) {
            hordeButton.addEventListener('click', () => {
                const dronesHaveSpawned = this.gameRef?.ecsWorld?.enemySystem?.initialSpawnComplete;

                if (dronesHaveSpawned) {
                    this.showHordeConfirmation();
                } else {
                    this.showNotification("Horde mode is only available after spectral drones appear in the sector.", 0xff3030);
                }
            });
        }
    }

    showHordeConfirmation(): void {
        const modal = document.createElement('div');
        modal.id = 'horde-confirm-modal';

        const content = document.createElement('div');
        content.id = 'horde-confirm-content';

        const title = document.createElement('div');
        title.className = 'horde-confirm-title';
        title.textContent = 'UNLEASH THE HORDE?';
        content.appendChild(title);

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

        const buttons = document.createElement('div');
        buttons.className = 'horde-confirm-buttons';

        const yesBtn = document.createElement('button');
        yesBtn.className = 'horde-confirm-btn horde-confirm-yes';
        yesBtn.textContent = 'UNLEASH THEM';
        yesBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            if (this.hideStargateUICallback) {
                this.hideStargateUICallback();
            }
            if (this.gameRef?.activateHordeMode) {
                this.gameRef.activateHordeMode();
            }
        });

        const noBtn = document.createElement('button');
        noBtn.className = 'horde-confirm-btn horde-confirm-no';
        noBtn.textContent = 'CANCEL';
        noBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        buttons.appendChild(noBtn);
        buttons.appendChild(yesBtn);
        content.appendChild(buttons);
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    showNotification(message: string, color = 0x33aaff): void {
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
        notification.style.zIndex = '1001';
        notification.style.textAlign = 'center';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.8s';
            setTimeout(() => {
                notification.remove();
            }, 800);
        }, 2000);
    }
}
