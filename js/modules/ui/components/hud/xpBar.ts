// xpBar.ts - XP progress bar and pilot rank display for HUD

import { HUDStyles } from './styles.ts';
import { xpForRank } from '../../../spaceship/systems/ranks.ts';
import { mainMessageBus } from '../../../../globals/messageBus.ts';
import type { GameEventMap } from '../../../../core/events.ts';

const RANK_TABLE_LENGTH = 10;

/** Spaceship or any object with XP/rank fields (e.g. HUD may pass partial). */
type SpaceshipWithXP = { xp: number; rank: number; xpToNextRank: number; rankName: string };

export class HUDXpBar {
  private container: HTMLDivElement | null = null;
  private barFill: HTMLDivElement | null = null;
  private rankLabel: HTMLElement | null = null;
  private xpText: HTMLElement | null = null;
  private rankUpOverlay: HTMLDivElement | null = null;
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;
  private rankUpTimeout: ReturnType<typeof setTimeout> | null = null;
  private unsubXp: (() => void) | null = null;
  private unsubRank: (() => void) | null = null;

  /**
   * Create the XP bar element and subscribe to xp.gained / rank.up.
   */
  create(parent: HTMLElement): void {
    const container = document.createElement('div');
    container.id = 'xp-bar-container';
    HUDStyles.applyStyles(container, {
      position: 'absolute',
      bottom: '8px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '280px',
      padding: '6px 12px',
      ...HUDStyles.getPanelStyles(),
      pointerEvents: 'auto'
    });
    parent.appendChild(container);

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '4px';
    header.style.fontSize = '11px';
    header.style.textTransform = 'uppercase';
    header.style.letterSpacing = '1px';
    const rankLabel = document.createElement('span');
    rankLabel.id = 'xp-rank-name';
    rankLabel.textContent = 'Cadet';
    rankLabel.style.color = 'rgba(120, 220, 232, 0.95)';
    const xpText = document.createElement('span');
    xpText.id = 'xp-numbers';
    xpText.textContent = '0 / 100 XP';
    xpText.style.color = 'rgba(120, 220, 232, 0.85)';
    header.appendChild(rankLabel);
    header.appendChild(xpText);
    container.appendChild(header);

    const barContainer = document.createElement('div');
    HUDStyles.applyStyles(barContainer, {
      height: '8px',
      ...HUDStyles.getBarContainerStyles()
    });
    const barFill = document.createElement('div');
    barFill.id = 'xp-bar-fill';
    HUDStyles.applyStyles(barFill, {
      width: '0%',
      backgroundColor: 'rgba(120, 220, 232, 0.85)',
      ...HUDStyles.getBarStyles()
    });
    barContainer.appendChild(barFill);
    container.appendChild(barContainer);

    this.container = container;
    this.barFill = barFill;
    this.rankLabel = rankLabel;
    this.xpText = xpText;

    this.unsubXp = mainMessageBus.subscribe('xp.gained', () => {
      this.flashOnXpGain();
    });
    this.unsubRank = mainMessageBus.subscribe('rank.up', (msg: { data: GameEventMap['rank.up'] }) => {
      this.showRankUpNotification(msg.data.rankName);
    });
  }

  /**
   * Update bar and text from spaceship state.
   * Accepts any object with xp/rank/xpToNextRank/rankName (e.g. from HUD).
   */
  update(spaceship: SpaceshipWithXP | Record<string, unknown> | null): void {
    if (!spaceship || !this.barFill || !this.rankLabel || !this.xpText) return;
    const xp = (spaceship as SpaceshipWithXP).xp;
    const rank = (spaceship as SpaceshipWithXP).rank;
    const xpToNextRank = (spaceship as SpaceshipWithXP).xpToNextRank;
    const rankName = (spaceship as SpaceshipWithXP).rankName;
    if (typeof xp !== 'number' || typeof rank !== 'number') return;

    this.rankLabel.textContent = typeof rankName === 'string' ? rankName : 'Cadet';

    const atMaxRank = rank >= RANK_TABLE_LENGTH;
    const xpIntoRank = xp - xpForRank(rank);
    const needed = typeof xpToNextRank === 'number' ? xpToNextRank : 100;
    const pct = atMaxRank || needed <= 0 ? 100 : Math.min(100, (xpIntoRank / needed) * 100);

    this.barFill.style.width = `${pct}%`;
    if (atMaxRank) {
      this.xpText.textContent = `${xp} XP (MAX)`;
    } else {
      const nextThreshold = xpForRank(rank) + needed;
      this.xpText.textContent = `${xp} / ${nextThreshold} XP`;
    }
  }

  private flashOnXpGain(): void {
    if (!this.container) return;
    if (this.flashTimeout) clearTimeout(this.flashTimeout);
    this.container.style.boxShadow = '0 0 20px rgba(120, 220, 232, 0.8)';
    this.flashTimeout = setTimeout(() => {
      this.flashTimeout = null;
      if (this.container) this.container.style.boxShadow = '';
    }, 200);
  }

  private showRankUpNotification(rankName: string): void {
    const parent = this.container?.parentElement ?? document.body;
    if (this.rankUpOverlay && this.rankUpOverlay.parentNode) {
      this.rankUpOverlay.remove();
    }
    if (this.rankUpTimeout) clearTimeout(this.rankUpTimeout);

    const overlay = document.createElement('div');
    overlay.textContent = `Rank Up: ${rankName}`;
    HUDStyles.applyStyles(overlay, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '16px 32px',
      fontSize: '20px',
      fontWeight: '600',
      color: 'rgba(120, 220, 232, 0.95)',
      backgroundColor: 'rgba(6, 22, 31, 0.9)',
      border: '2px solid rgba(120, 220, 232, 0.6)',
      borderRadius: '8px',
      boxShadow: '0 0 30px rgba(120, 220, 232, 0.4)',
      pointerEvents: 'none',
      zIndex: '2000',
      fontFamily: '"Rajdhani", "Electrolize", sans-serif',
      letterSpacing: '2px'
    });
    parent.appendChild(overlay);
    this.rankUpOverlay = overlay;

    this.rankUpTimeout = setTimeout(() => {
      this.rankUpTimeout = null;
      if (overlay.parentNode) overlay.remove();
      this.rankUpOverlay = null;
    }, 2500);
  }

  destroy(): void {
    if (this.flashTimeout) clearTimeout(this.flashTimeout);
    if (this.rankUpTimeout) clearTimeout(this.rankUpTimeout);
    this.unsubXp?.();
    this.unsubRank?.();
    if (this.rankUpOverlay?.parentNode) this.rankUpOverlay.remove();
    this.rankUpOverlay = null;
    if (this.container?.parentNode) this.container.parentNode.removeChild(this.container);
    this.container = null;
    this.barFill = null;
    this.rankLabel = null;
    this.xpText = null;
  }
}
