// missionTracker.ts - Tracks mission progress by listening to game events

import { debugLog } from '../../globals/debug.ts';
import { mainMessageBus } from '../../globals/messageBus.ts';
import type { MissionSystem } from './missionSystem.ts';

export class MissionTracker {
  private missionSystem: MissionSystem;
  private survivalInterval: ReturnType<typeof setInterval> | null = null;

  constructor(missionSystem: MissionSystem) {
    this.missionSystem = missionSystem;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mining: resource collected
    mainMessageBus.subscribe('mining.resourceCollected', (message) => {
      const { amount, resourceType } = message.data;
      debugLog(`Mission tracker: collected ${amount} ${resourceType}`);
      this.missionSystem.updateProgress('collect', amount, { resourceType });
    });

    // Combat: enemy destroyed
    mainMessageBus.subscribe('enemy.destroyed', () => {
      debugLog('Mission tracker: enemy destroyed');
      this.missionSystem.updateProgress('destroy', 1);
    });

    // Delivery: system discovered/entered
    mainMessageBus.subscribe('system.discovered', (message) => {
      const { systemId } = message.data;
      debugLog(`Mission tracker: arrived at ${systemId}`);
      this.missionSystem.updateProgress('travel', 1, { systemName: systemId });
    });

    // Mission accepted: start survival timer if needed
    mainMessageBus.subscribe('mission.accepted', () => {
      const mission = this.missionSystem.getActiveMission();
      if (mission && mission.type === 'combat' && mission.objectives[0]?.type === 'survive') {
        this.startSurvivalTimer();
      }
    });

    // Mission abandoned/completed: stop survival timer
    mainMessageBus.subscribe('mission.abandoned', () => {
      this.stopSurvivalTimer();
    });

    mainMessageBus.subscribe('mission.completed', () => {
      this.stopSurvivalTimer();
    });
  }

  private startSurvivalTimer(): void {
    this.survivalInterval = setInterval(() => {
      this.missionSystem.updateProgress('survive', 1);
    }, 1000);
    debugLog('Mission tracker: started survival timer');
  }

  private stopSurvivalTimer(): void {
    if (this.survivalInterval) {
      clearInterval(this.survivalInterval);
      this.survivalInterval = null;
      debugLog('Mission tracker: stopped survival timer');
    }
  }

  cleanup(): void {
    this.stopSurvivalTimer();
  }
}
