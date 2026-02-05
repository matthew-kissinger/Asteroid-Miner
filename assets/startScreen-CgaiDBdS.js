var l=Object.defineProperty;var r=(o,e,s)=>e in o?l(o,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):o[e]=s;var a=(o,e,s)=>r(o,typeof e!="symbol"?e+"":e,s);class d{constructor(e,s){a(this,"game");a(this,"ui");a(this,"isVisible");this.game=e,this.ui=s,this.isVisible=!1,this.setupStartScreen()}setupStartScreen(){const e=document.createElement("div");e.id="start-screen",e.className="start-screen",e.style.display="none",e.innerHTML=`
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
        `,document.body.appendChild(e),this.setupEventListeners()}setupEventListeners(){const e=document.getElementById("play-button");e&&e.addEventListener("click",()=>{console.log("Play button clicked"),console.log("Game object:",this.game),console.log("Game methods available:",Object.getOwnPropertyNames(Object.getPrototypeOf(this.game))),this.hide();const n=localStorage.getItem("introPlayed")==="true";console.log("Intro played before:",n),n?(console.log("Starting game in docked state for returning player"),this.game&&this.game.startDocked?this.game.startDocked():console.error("Game.startDocked not found",this.game)):(console.log("Starting intro sequence for new player"),this.game&&this.game.startIntroSequence?this.game.startIntroSequence():console.error("Game.startIntroSequence not found",this.game))});const s=document.getElementById("how-to-play-button"),t=document.getElementById("how-to-play-modal"),i=document.getElementById("close-how-to-play");s&&t&&s.addEventListener("click",()=>{t.style.display="flex"}),i&&t&&(i.addEventListener("click",()=>{t.style.display="none"}),t.addEventListener("click",n=>{n.target===t&&(t.style.display="none")}))}show(){const e=document.getElementById("start-screen");if(e){e.style.display="flex",this.isVisible=!0;const s=window.initialTimestamp;if(s){const t=performance.now()-s;console.log(`Time to start screen visible: ${t.toFixed(2)}ms`)}}}hide(){const e=document.getElementById("start-screen");e&&(e.style.display="none",this.isVisible=!1);const s=document.getElementById("how-to-play-modal");s&&(s.style.display="none")}}export{d as StartScreen};
//# sourceMappingURL=startScreen-CgaiDBdS.js.map
