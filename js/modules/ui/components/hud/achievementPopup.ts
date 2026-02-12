// achievementPopup.ts - Toast notification popup for achievement unlocks

import { mainMessageBus } from '../../../../globals/messageBus.ts';
import { debugLog } from '../../../../globals/debug.ts';
import type { Message } from '../../../../core/messageBus.ts';
import type { AchievementUnlockedPayload } from '../../../game/achievements.ts';

const POPUP_DURATION = 4000;
const FADE_DURATION = 400;
const MAX_VISIBLE = 3;

interface PopupEntry {
    element: HTMLDivElement;
    timeout: ReturnType<typeof setTimeout>;
}

export class AchievementPopup {
    private container: HTMLDivElement | null = null;
    private activePopups: PopupEntry[] = [];
    private unsubscribe: (() => void) | null = null;

    /** Create the popup container and start listening for unlock events */
    init(): void {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'achievement-popup-container';
            this.container.className = 'achievement-popup-container';
            document.body.appendChild(this.container);
        }

        this.unsubscribe = mainMessageBus.subscribe(
            'achievement.unlocked' as keyof import('../../../../core/events.ts').GameEventMap,
            (msg: Message) => {
                const payload = msg.data as AchievementUnlockedPayload;
                this.showPopup(payload);
            }
        );

        debugLog('AchievementPopup: Initialized');
    }

    /** Display a toast notification for an unlocked achievement */
    private showPopup(payload: AchievementUnlockedPayload): void {
        if (!this.container) return;

        // Remove oldest if we exceed max visible
        while (this.activePopups.length >= MAX_VISIBLE) {
            this.dismissPopup(this.activePopups[0]);
        }

        const popup = document.createElement('div');
        popup.className = 'achievement-popup';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'achievement-popup-icon';
        iconSpan.textContent = payload.icon;

        const textDiv = document.createElement('div');
        textDiv.className = 'achievement-popup-text';

        const titleEl = document.createElement('div');
        titleEl.className = 'achievement-popup-title';
        titleEl.textContent = `🏅 ${payload.title}`;

        const descEl = document.createElement('div');
        descEl.className = 'achievement-popup-desc';
        descEl.textContent = payload.description;

        textDiv.appendChild(titleEl);
        textDiv.appendChild(descEl);
        popup.appendChild(iconSpan);
        popup.appendChild(textDiv);

        this.container.appendChild(popup);

        // Trigger slide-in animation on next frame
        requestAnimationFrame(() => {
            popup.classList.add('achievement-popup-visible');
        });

        const timeout = setTimeout(() => {
            const entry = this.activePopups.find((e) => e.element === popup);
            if (entry) {
                this.dismissPopup(entry);
            }
        }, POPUP_DURATION);

        this.activePopups.push({ element: popup, timeout });
        debugLog(`AchievementPopup: Showing "${payload.title}"`);
    }

    /** Fade out and remove a popup */
    private dismissPopup(entry: PopupEntry): void {
        clearTimeout(entry.timeout);
        entry.element.classList.remove('achievement-popup-visible');
        entry.element.classList.add('achievement-popup-hiding');

        setTimeout(() => {
            if (entry.element.parentNode) {
                entry.element.parentNode.removeChild(entry.element);
            }
        }, FADE_DURATION);

        const idx = this.activePopups.indexOf(entry);
        if (idx !== -1) {
            this.activePopups.splice(idx, 1);
        }
    }

    /** Clean up */
    destroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        for (const entry of this.activePopups) {
            clearTimeout(entry.timeout);
            if (entry.element.parentNode) {
                entry.element.parentNode.removeChild(entry.element);
            }
        }
        this.activePopups = [];

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        debugLog('AchievementPopup: Destroyed');
    }
}
