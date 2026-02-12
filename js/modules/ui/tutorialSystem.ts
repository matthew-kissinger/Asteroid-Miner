import { debugLog } from '../../globals/debug.ts';
import { mainMessageBus } from '../../globals/messageBus.ts';
import { getAsteroids, getEnemies, getPlayerEntity } from '../../ecs/systems/ecsRunner.ts';
import { Position } from '../../ecs/components.ts';

interface TutorialTip {
  id: string;
  text: string;
  trigger: () => boolean;
  event?: string;
}

export class TutorialSystem {
  private shownTips: Set<string> = new Set();
  private activeTipId: string | null = null;
  private tipTimeout: number | null = null;
  private spaceship: any;
  private updateInterval: number | null = null;

  private tips: TutorialTip[] = [
    {
      id: 'move',
      text: 'WASD to move, Mouse to look, Shift to boost',
      trigger: () => true, // Triggered manually after intro or undock
    },
    {
      id: 'mine',
      text: 'Press E to target, then R to mine',
      trigger: () => {
        const playerEid = getPlayerEntity();
        if (playerEid === -1) return false;
        
        const asteroids = getAsteroids();
        const px = Position.x[playerEid];
        const py = Position.y[playerEid];
        const pz = Position.z[playerEid];

        for (const aid of asteroids) {
          const dx = Position.x[aid] - px;
          const dy = Position.y[aid] - py;
          const dz = Position.z[aid] - pz;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 10000 * 10000) return true; // 10000 units range
        }
        return false;
      }
    },
    {
      id: 'sell',
      text: 'Dock at the Stargate (Q when nearby) to sell resources',
      trigger: () => {
        return this.spaceship.cargo.iron > 0 || 
               this.spaceship.cargo.gold > 0 || 
               this.spaceship.cargo.platinum > 0;
      }
    },
    {
      id: 'upgrades',
      text: 'Buy upgrades and travel to new systems from the Stargate',
      event: 'player.docked',
      trigger: () => true
    },
    {
      id: 'combat',
      text: 'Left Click to fire weapons. Watch your shields!',
      trigger: () => {
        const playerEid = getPlayerEntity();
        if (playerEid === -1) return false;

        const enemies = getEnemies();
        const px = Position.x[playerEid];
        const py = Position.y[playerEid];
        const pz = Position.z[playerEid];

        for (const eid of enemies) {
          const dx = Position.x[eid] - px;
          const dy = Position.y[eid] - py;
          const dz = Position.z[eid] - pz;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 15000 * 15000) return true; // 15000 units range
        }
        return false;
      }
    },
    {
      id: 'credits',
      text: 'Visit the Upgrade menu to improve your ship',
      trigger: () => this.spaceship.credits >= 2000 // Tip for when they have enough for more upgrades
    }
  ];

  constructor(spaceship: any) {
    this.spaceship = spaceship;
    this.loadState();
    this.setupEventListeners();
    
    // Start periodic check for proximity-based tips
    this.updateInterval = window.setInterval(() => this.checkTriggers(), 2000);
    
    debugLog('Tutorial system initialized');
  }

  private loadState(): void {
    const saved = localStorage.getItem('asteroidMinerTutorial');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.shownTips = new Set(parsed);
        }
      } catch (e) {
        debugLog('Failed to load tutorial state', e);
      }
    }
  }

  private saveState(): void {
    localStorage.setItem('asteroidMinerTutorial', JSON.stringify(Array.from(this.shownTips)));
  }

  private setupEventListeners(): void {
    mainMessageBus.subscribe('intro.completed', () => {
      this.showTip('move');
    });

    mainMessageBus.subscribe('player.undocked', () => {
      this.showTip('move');
    });

    mainMessageBus.subscribe('player.docked', () => {
      this.showTip('upgrades');
    });

    // We can also listen for resource collection if we find the event
    // For now, sell tip is triggered by cargo > 0 in checkTriggers
  }

  private checkTriggers(): void {
    // If intro is active, don't show tips
    if ((window as any).game?.introSequenceActive) return;

    for (const tip of this.tips) {
      if (!this.shownTips.has(tip.id) && tip.trigger()) {
        this.showTip(tip.id);
      }
    }
  }

  private showTip(id: string): void {
    if (this.shownTips.has(id) || this.activeTipId === id) return;

    const tip = this.tips.find(t => t.id === id);
    if (!tip) return;

    this.displayTip(tip);
  }

  private displayTip(tip: TutorialTip): void {
    // Remove existing tip if any
    this.dismissTip();

    this.activeTipId = tip.id;
    this.shownTips.add(tip.id);
    this.saveState();

    const container = document.createElement('div');
    container.id = 'tutorial-tip';
    container.className = 'tutorial-tip';
    container.innerHTML = `
      <div class="tutorial-tip-content">
        <span class="tutorial-tip-text">${tip.text}</span>
        <button class="tutorial-tip-close">&times;</button>
      </div>
    `;

    document.body.appendChild(container);

    // Fade in
    setTimeout(() => container.classList.add('visible'), 10);

    // Auto-dismiss after 8 seconds
    this.tipTimeout = window.setTimeout(() => this.dismissTip(), 8000);

    // Manual dismiss
    const closeBtn = container.querySelector('.tutorial-tip-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.dismissTip());
    }
    container.addEventListener('click', (e) => {
      if (e.target !== closeBtn) this.dismissTip();
    });
  }

  private dismissTip(): void {
    const container = document.getElementById('tutorial-tip');
    if (container) {
      container.classList.remove('visible');
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 300);
    }

    if (this.tipTimeout) {
      clearTimeout(this.tipTimeout);
      this.tipTimeout = null;
    }
    this.activeTipId = null;
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.dismissTip();
  }
}
