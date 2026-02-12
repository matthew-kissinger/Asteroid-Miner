// pauseMenu.ts - Pause menu overlay (ESC / Start button)

export interface PauseMenuGame {
    pauseGame: () => void;
    resumeGame: () => void;
}

export interface PauseMenuSettings {
    show: () => void;
}

export interface PauseMenuControls {
    show: () => void;
}

export interface PauseMenuContext {
    game: PauseMenuGame;
    settings?: PauseMenuSettings | null;
    controlsMenu?: PauseMenuControls | null;
}

const PAUSE_MENU_ID = 'pause-menu-overlay';
const PAUSE_MENU_TITLE_ID = 'pause-menu-title';

export class PauseMenu {
    private context: PauseMenuContext;
    private overlay: HTMLDivElement | null = null;
    private _visible = false;

    constructor(context: PauseMenuContext) {
        this.context = context;
        this.createOverlay();
    }

    private createOverlay(): void {
        if (document.getElementById(PAUSE_MENU_ID)) return;

        const overlay = document.createElement('div');
        overlay.id = PAUSE_MENU_ID;
        overlay.className = 'pause-menu-overlay';
        overlay.setAttribute('aria-label', 'Pause menu');

        const panel = document.createElement('div');
        panel.className = 'pause-menu-panel';

        const title = document.createElement('h2');
        title.id = PAUSE_MENU_TITLE_ID;
        title.className = 'pause-menu-title';
        title.textContent = 'PAUSED';
        panel.appendChild(title);

        const menu = document.createElement('nav');
        menu.className = 'pause-menu-buttons';

        const resumeBtn = this.createButton('Resume', () => this.resume());
        resumeBtn.classList.add('pause-menu-btn-primary');
        menu.appendChild(resumeBtn);

        if (this.context.settings) {
            menu.appendChild(this.createButton('Settings', () => this.openSettings()));
        }
        if (this.context.controlsMenu) {
            menu.appendChild(this.createButton('Controls', () => this.openControls()));
        }
        menu.appendChild(this.createButton('Quit to Menu', () => this.quitToMenu()));

        panel.appendChild(menu);
        overlay.appendChild(panel);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.resume();
        });

        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    private createButton(label: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pause-menu-btn';
        btn.textContent = label;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        return btn;
    }

    isVisible(): boolean {
        return this._visible;
    }

    /** @param options.skipPauseGame - If true, do not call game.pauseGame() (e.g. when opening from tab visibility). */
    show(options?: { skipPauseGame?: boolean }): void {
        if (!this.overlay) return;
        if (document.pointerLockElement) document.exitPointerLock();
        if (!options?.skipPauseGame) this.context.game.pauseGame();
        this.overlay.classList.add('pause-menu-visible');
        this._visible = true;
    }

    hide(): void {
        if (!this.overlay) return;
        this.overlay.classList.remove('pause-menu-visible');
        this._visible = false;
        this.context.game.resumeGame();
    }

    private resume(): void {
        this.hide();
    }

    private openSettings(): void {
        this.hide();
        this.context.settings?.show();
    }

    private openControls(): void {
        this.context.controlsMenu?.show();
    }

    private quitToMenu(): void {
        this.hide();
        window.location.reload();
    }
}
