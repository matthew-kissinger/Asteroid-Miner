// systemsView.js - Systems list and navigation UI

export class SystemsView {
    constructor() {
        this.starMap = null;
        this.blackjackGame = null;
        this.settings = null;
    }
    
    setStarMap(starMap) {
        this.starMap = starMap;
    }
    
    setBlackjackGame(blackjackGame) {
        this.blackjackGame = blackjackGame;
    }
    
    setSettings(settings) {
        this.settings = settings;
    }
    
    setupStarMapButton() {
        const starMapButton = document.getElementById('open-star-map');
        if (starMapButton && this.starMap) {
            starMapButton.addEventListener('click', () => {
                console.log("Opening star map");
                this.hideStargateUI();
                this.starMap.show();
            });
        } else if (starMapButton) {
            // If star map not available, disable the button
            starMapButton.disabled = true;
            starMapButton.style.backgroundColor = '#555';
            starMapButton.style.cursor = 'not-allowed';
            starMapButton.title = 'Star map not available';
        }
    }
    
    setupBlackjackButton() {
        const blackjackButton = document.getElementById('open-blackjack');
        if (blackjackButton && this.blackjackGame) {
            blackjackButton.addEventListener('click', () => {
                console.log("Opening blackjack game");
                this.hideStargateUI();
                this.blackjackGame.show();
            });
        } else if (blackjackButton) {
            // If blackjack game not available, disable the button
            blackjackButton.disabled = true;
            blackjackButton.style.backgroundColor = '#555';
            blackjackButton.style.cursor = 'not-allowed';
            blackjackButton.title = 'Blackjack game not available';
        }
    }
    
    setupSettingsButton() {
        if (!this.settings) return;
        
        const settingsButton = document.getElementById('open-settings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                console.log("Opening settings");
                this.hideStargateUI();
                this.settings.show();
            });
        }
    }
    
    setupCustomSystemButton() {
        const customSystemBtn = document.getElementById('create-custom-system');
        if (customSystemBtn) {
            customSystemBtn.addEventListener('click', () => {
                // Check if custom system creator is available on environment
                if (window.game && window.game.environment && window.game.environment.customSystemCreator) {
                    // Close stargate interface
                    this.hideStargateUI();
                    
                    // Show custom system creator
                    window.game.environment.customSystemCreator.show();
                } else {
                    console.error('Custom system creator not available');
                }
            });
        }
    }
    
    hideStargateUI() {
        const stargateUI = document.getElementById('stargate-ui');
        if (stargateUI) {
            stargateUI.style.display = 'none';
        }
    }
    
    setupAllSystemButtons() {
        this.setupStarMapButton();
        this.setupBlackjackButton();
        this.setupSettingsButton();
        this.setupCustomSystemButton();
    }
}