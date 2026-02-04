// systemsView.ts - Systems list and navigation UI

interface StarMap {
    show(): void;
}

interface BlackjackGame {
    show(): void;
}

interface Settings {
    show(): void;
}

export class SystemsView {
    private starMap: StarMap | null;
    private blackjackGame: BlackjackGame | null;
    private settings: Settings | null;
    
    constructor() {
        this.starMap = null;
        this.blackjackGame = null;
        this.settings = null;
    }
    
    setStarMap(starMap: StarMap): void {
        this.starMap = starMap;
    }
    
    setBlackjackGame(blackjackGame: BlackjackGame): void {
        this.blackjackGame = blackjackGame;
    }
    
    setSettings(settings: Settings): void {
        this.settings = settings;
    }
    
    setupStarMapButton(): void {
        const starMapButton = document.getElementById('open-star-map');
        if (starMapButton && this.starMap) {
            starMapButton.addEventListener('click', () => {
                console.log("Opening star map");
                this.hideStargateUI();
                this.starMap!.show();
            });
        } else if (starMapButton) {
            // If star map not available, disable the button
            starMapButton.disabled = true;
            (starMapButton as HTMLElement).style.backgroundColor = '#555';
            (starMapButton as HTMLElement).style.cursor = 'not-allowed';
            starMapButton.title = 'Star map not available';
        }
    }
    
    setupBlackjackButton(): void {
        const blackjackButton = document.getElementById('open-blackjack');
        if (blackjackButton && this.blackjackGame) {
            blackjackButton.addEventListener('click', () => {
                console.log("Opening blackjack game");
                this.hideStargateUI();
                this.blackjackGame!.show();
            });
        } else if (blackjackButton) {
            // If blackjack game not available, disable the button
            blackjackButton.disabled = true;
            (blackjackButton as HTMLElement).style.backgroundColor = '#555';
            (blackjackButton as HTMLElement).style.cursor = 'not-allowed';
            blackjackButton.title = 'Blackjack game not available';
        }
    }
    
    setupSettingsButton(): void {
        if (!this.settings) return;
        
        const settingsButton = document.getElementById('open-settings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                console.log("Opening settings");
                this.hideStargateUI();
                this.settings!.show();
            });
        }
    }
    
    setupCustomSystemButton(): void {
        const customSystemBtn = document.getElementById('create-custom-system');
        if (customSystemBtn) {
            customSystemBtn.addEventListener('click', () => {
                // Check if custom system creator is available on environment
                if (window.game && (window.game as any).environment && (window.game as any).environment.customSystemCreator) {
                    // Close stargate interface
                    this.hideStargateUI();
                    
                    // Show custom system creator
                    (window.game as any).environment.customSystemCreator.show();
                } else {
                    console.error('Custom system creator not available');
                }
            });
        }
    }
    
    hideStargateUI(): void {
        const stargateUI = document.getElementById('stargate-ui');
        if (stargateUI) {
            stargateUI.style.display = 'none';
        }
    }
    
    setupAllSystemButtons(): void {
        this.setupStarMapButton();
        this.setupBlackjackButton();
        this.setupSettingsButton();
        this.setupCustomSystemButton();
    }
}
