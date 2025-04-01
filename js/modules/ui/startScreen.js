// startScreen.js - Manages the game's start screen UI

export class StartScreen {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;
        this.isVisible = false;
        this.setupStartScreen();
    }

    setupStartScreen() {
        // Create start screen container
        const startScreen = document.createElement('div');
        startScreen.id = 'start-screen';
        startScreen.className = 'start-screen';
        startScreen.style.display = 'none';

        // Add content to start screen
        startScreen.innerHTML = `
            <div class="start-screen-inner">
                <h1 class="game-title">Solar System Asteroid Miner</h1>
                <div class="button-container">
                    <button id="play-button" class="start-button">Play</button>
                    <button id="how-to-play-button" class="start-button">How to Play</button>
                </div>
                <div class="version">v0.5.8</div>
            </div>
            
            <div id="how-to-play-modal" class="modal">
                <div class="modal-content">
                    <h2>How to Play</h2>
                    
                    <div class="gameplay-section">
                        <h3>Game Overview</h3>
                        <p>Welcome to Solar System Asteroid Miner! Your mission is to mine asteroids, collect resources, and upgrade your ship.</p>
                        
                        <h4>Core Objectives:</h4>
                        <ul>
                            <li><strong>Mining:</strong> Target asteroids (E key), then use your mining laser (R key) to extract resources.</li>
                            <li><strong>Trading:</strong> Dock at stargates (Q key) to sell resources and purchase ship upgrades.</li>
                            <li><strong>Combat:</strong> Defend yourself against enemy ships using your weapons.</li>
                            <li><strong>Exploration:</strong> Travel between star systems through stargates to discover new resources.</li>
                            <li><strong>Anomalies:</strong> Find and collect energy orbs from space anomalies for credits.</li>
                            <li><strong>Defense:</strong> Deploy autonomous laser turrets (T key) to protect mining operations.</li>
                        </ul>
                        
                        <h4>Horde Mode:</h4>
                        <p>Work toward activating the ultimate challenge - Horde Mode:</p>
                        <ul>
                            <li><strong>Endless Survival:</strong> Face waves of increasingly difficult enemies that never stop coming.</li>
                            <li><strong>Escalating Difficulty:</strong> Enemy health, damage, speed, and spawn rates increase over time.</li>
                            <li><strong>Preparation:</strong> Upgrade your ship's weapons, shields, and hull before activating.</li>
                            <li><strong>Strategy:</strong> Deploy multiple laser turrets (T key) around your position to create defensive perimeters.</li>
                            <li><strong>High Score:</strong> How long can you survive as difficulty scales to infinity?</li>
                        </ul>
                    </div>
                    
                    <div class="control-section">
                        <h3>Movement</h3>
                        <div class="control-row"><span class="key">W</span> <span>Forward</span></div>
                        <div class="control-row"><span class="key">S</span> <span>Backward</span></div>
                        <div class="control-row"><span class="key">A</span> <span>Left</span></div>
                        <div class="control-row"><span class="key">D</span> <span>Right</span></div>
                        <div class="control-row"><span class="key">SHIFT</span> <span>Boost</span></div>
                        <div class="control-row"><span class="key">Mouse</span> <span>Ship Rotation</span></div>
                    </div>
                    
                    <div class="control-section">
                        <h3>Combat & Mining</h3>
                        <div class="control-row"><span class="key">LMB</span> <span>Fire Weapons</span></div>
                        <div class="control-row"><span class="key">E</span> <span>Toggle Target Lock-On</span></div>
                        <div class="control-row"><span class="key">R</span> <span>Toggle Mining Laser</span></div>
                        <div class="control-row"><span class="key">TAB</span> <span>Cycle Targets</span></div>
                    </div>
                    
                    <div class="control-section">
                        <h3>Special</h3>
                        <div class="control-row"><span class="key">T</span> <span>Deploy Laser Turret</span></div>
                        <div class="control-row"><span class="key">Q</span> <span>Dock/Undock at Stargate</span></div>
                        <div class="control-row"><span class="key">ESC</span> <span>Pause Game</span></div>
                    </div>
                    
                    <button id="close-how-to-play" class="modal-close-button">Close</button>
                </div>
            </div>
        `;

        // Add to document body
        document.body.appendChild(startScreen);

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Play button
        const playButton = document.getElementById('play-button');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.hide();
                // Check if intro has been played before
                const introPlayed = localStorage.getItem('introPlayed') === 'true';
                if (introPlayed) {
                    // Returning player - go directly to docked state
                    if (this.game.startDocked) {
                        this.game.startDocked();
                    } else {
                        console.error("Game.startDocked not found");
                    }
                } else {
                    // New player - start intro sequence
                    if (this.game.startIntroSequence) {
                        this.game.startIntroSequence();
                    } else {
                        console.error("Game.startIntroSequence not found");
                    }
                }
            });
        }

        // How to Play button
        const howToPlayButton = document.getElementById('how-to-play-button');
        const howToPlayModal = document.getElementById('how-to-play-modal');
        const closeHowToPlayButton = document.getElementById('close-how-to-play');

        if (howToPlayButton && howToPlayModal) {
            howToPlayButton.addEventListener('click', () => {
                howToPlayModal.style.display = 'flex';
            });
        }

        if (closeHowToPlayButton && howToPlayModal) {
            closeHowToPlayButton.addEventListener('click', () => {
                howToPlayModal.style.display = 'none';
            });

            // Also close when clicking outside the modal content
            howToPlayModal.addEventListener('click', (e) => {
                if (e.target === howToPlayModal) {
                    howToPlayModal.style.display = 'none';
                }
            });
        }
    }

    show() {
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.style.display = 'flex';
            this.isVisible = true;
            
            // End timing for initialization when start screen becomes visible
            if (window.initialTimestamp) {
                const timeToStartScreen = performance.now() - window.initialTimestamp;
                console.log(`Time to start screen visible: ${timeToStartScreen.toFixed(2)}ms`);
                console.timeEnd("init");
            }
        }
    }

    hide() {
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.style.display = 'none';
            this.isVisible = false;
        }

        // Also hide How to Play modal if it's open
        const howToPlayModal = document.getElementById('how-to-play-modal');
        if (howToPlayModal) {
            howToPlayModal.style.display = 'none';
        }
    }
} 