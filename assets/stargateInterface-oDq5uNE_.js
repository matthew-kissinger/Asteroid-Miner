var H=Object.defineProperty;var U=(l,e,t)=>e in l?H(l,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):l[e]=t;var r=(l,e,t)=>U(l,typeof e!="symbol"?e+"":e,t);import{m as d,c as L}from"./game-core-OtPnLuF2.js";import"./three-DBvJLP14.js";class R{constructor(){r(this,"isMobile");this.isMobile=!1}setMobile(e){this.isMobile=e}createDockingPrompt(){const e=document.createElement("div");return e.id="docking-prompt",e.style.position="absolute",e.style.top="50%",e.style.left="50%",e.style.transform="translate(-50%, -50%)",e.style.backgroundColor="rgba(0, 0, 0, 0.7)",e.style.color="#33aaff",e.style.padding="20px",e.style.borderRadius="10px",e.style.border="2px solid #33aaff",e.style.boxShadow="0 0 20px #33aaff",e.style.fontFamily="Courier New, monospace",e.style.fontSize="18px",e.style.textAlign="center",e.style.zIndex="1000",e.style.display="none",this.isMobile?(e.style.display="none",e.dataset.alwaysHide="true"):e.textContent="Press Q to dock with Stargate",document.body.appendChild(e),e}createMainUI(){const e=document.createElement("div");return e.id="stargate-ui",this.isMobile&&(e.style.width="95%",e.style.maxWidth="95vw",e.style.webkitOverflowScrolling="touch",e.style.touchAction="pan-y",e.style.overscrollBehavior="contain"),e}showDockingPrompt(){const e=document.getElementById("docking-prompt");e&&e.dataset.alwaysHide!=="true"&&(e.style.display="block")}hideDockingPrompt(){const e=document.getElementById("docking-prompt");e&&(e.style.display="none")}updateResourceDisplay(e,t){const s=document.getElementById(`ms-${e}`);s&&(s.textContent=String(t))}updateStatusBar(e,t){const s=document.getElementById(e);s&&(s.style.width=`${t}%`)}updateCredits(e){const t=document.getElementById("ms-credits");t&&(t.textContent=`${e} CR`)}updateOrbCount(e,t){const s=document.getElementById(`orb-${e}-count`);s&&(s.textContent=`${t} in inventory`)}updateUpgradeLevel(e,t){const s=document.getElementById(`current-${e}-level`);s&&(s.textContent=String(t))}updateUpgradeProgress(e,t){const s=document.getElementById(`${e}-upgrade-progress`);s&&(s.style.width=`${t}%`)}updateUpgradeCost(e,t){const s=document.getElementById(`${e}-upgrade-cost`);s&&(s.textContent=String(t))}showUI(){const e=document.getElementById("stargate-ui");e&&(e.style.display="block")}hideUI(){const e=document.getElementById("stargate-ui");e&&(e.style.display="none")}}class T{constructor(){r(this,"stylesInjected");this.stylesInjected=!1}createStyles(){if(this.stylesInjected)return;const e=document.createElement("style");e.textContent=`
            @keyframes pulse-warning {
                0% { box-shadow: 0 0 15px rgba(255, 48, 48, 0.5); }
                50% { box-shadow: 0 0 25px rgba(255, 48, 48, 0.8); }
                100% { box-shadow: 0 0 15px rgba(255, 48, 48, 0.5); }
            }
            
            @keyframes pulse-glow {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            
            /* Stargate Terminal Base Styles */
            #stargate-ui {
                --primary-bg: rgba(20, 30, 50, 0.9);
                --primary-border: #33aaff;
                --section-bg: rgba(10, 20, 35, 0.8);
                --accent-blue: #33aaff;
                --accent-green: #00cc33;
                --accent-orange: #ff9900;
                --accent-red: #ff3030;
                --accent-purple: #9933cc;
                --accent-cyan: #30cfd0;
                
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 1000px;
                max-height: 90vh;
                background-color: var(--primary-bg);
                color: #fff;
                border-radius: 15px;
                border: 2px solid var(--primary-border);
                box-shadow: 0 0 30px var(--primary-border);
                font-family: 'Courier New', monospace;
                z-index: 1000;
                display: none;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 0;
            }
            
            /* Layout and Structure Styles */
            #stargate-header {
                background-color: rgba(30, 40, 60, 0.9);
                padding: 15px 20px;
                border-bottom: 1px solid var(--primary-border);
                position: sticky;
                top: 0;
                z-index: 10;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            #stargate-content {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 20px;
                padding: 20px;
            }
            
            .stargate-section {
                background-color: var(--section-bg);
                border-radius: 10px;
                padding: 15px;
                border: 1px solid rgba(51, 170, 255, 0.3);
            }
            
            .stargate-section h3 {
                color: var(--accent-blue);
                margin-top: 0;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(51, 170, 255, 0.3);
                font-size: 1.2em;
            }
            
            ${this.getComponentStyles()}
            
            /* Resource Border Effects */
            .iron-border { 
                border: 1px solid #cc6633; 
                box-shadow: 0 0 10px rgba(204, 102, 51, 0.3); 
            }
            .gold-border { 
                border: 1px solid #ffcc33; 
                box-shadow: 0 0 10px rgba(255, 204, 51, 0.3); 
            }
            .platinum-border { 
                border: 1px solid #33ccff; 
                box-shadow: 0 0 10px rgba(51, 204, 255, 0.3); 
            }
            .common-border { 
                border: 1px solid #00ff66; 
                box-shadow: 0 0 10px rgba(0, 255, 102, 0.3); 
            }
            .uncommon-border { 
                border: 1px solid #0066ff; 
                box-shadow: 0 0 10px rgba(0, 102, 255, 0.3); 
            }
            .rare-border { 
                border: 1px solid #9900ff; 
                box-shadow: 0 0 10px rgba(153, 0, 255, 0.3); 
            }
            .epic-border { 
                border: 1px solid #ff6600; 
                box-shadow: 0 0 10px rgba(255, 102, 0, 0.3); 
            }
            .legendary-border { 
                border: 1px solid #ff0000; 
                box-shadow: 0 0 10px rgba(255, 0, 0, 0.3); 
            }
            
            /* Undock Button Glow Effects */
            .btn-undock {
                background: linear-gradient(135deg, #00a8ff 0%, #0066cc 100%);
                font-size: 1.4em;
                font-weight: bold;
                letter-spacing: 3px;
                padding: 16px 40px;
                width: auto;
                min-width: 200px;
                margin-bottom: 15px;
                border: 2px solid #00d4ff;
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 20px rgba(0, 168, 255, 0.2);
                text-transform: uppercase;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .btn-undock:hover {
                background: linear-gradient(135deg, #00d4ff 0%, #0088ff 100%);
                box-shadow: 0 0 30px rgba(0, 212, 255, 0.8), inset 0 0 20px rgba(0, 212, 255, 0.3);
                transform: translateY(-2px);
            }
            
            .btn-undock:active {
                transform: translateY(0);
            }
            
            .btn-undock::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, transparent, #00d4ff, transparent);
                z-index: -1;
                opacity: 0;
                transition: opacity 0.3s;
                animation: pulse-glow 2s infinite;
            }
            
            .btn-undock:hover::before {
                opacity: 1;
            }
            
            /* Horde Button Warning Effects */
            .btn-horde { 
                background: linear-gradient(135deg, #990000 0%, var(--accent-red) 100%);
                color: #fff;
                border: 2px solid var(--accent-red);
                box-shadow: 0 0 15px rgba(255, 48, 48, 0.5);
                animation: pulse-warning 2s infinite;
            }
        `,document.head.appendChild(e),this.stylesInjected=!0}applyGlowEffect(e,t="#33aaff",s=.5){e&&(e.style.boxShadow=`0 0 20px rgba(${this.hexToRgb(t)}, ${s})`)}removeGlowEffect(e){e&&(e.style.boxShadow="")}hexToRgb(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?`${parseInt(t[1],16)}, ${parseInt(t[2],16)}, ${parseInt(t[3],16)}`:"255, 255, 255"}addPulseAnimation(e,t="#ff3030"){e&&(e.style.animation="pulse-warning 2s infinite",e.style.boxShadow=`0 0 15px rgba(${this.hexToRgb(t)}, 0.5)`)}removePulseAnimation(e){e&&(e.style.animation="",e.style.boxShadow="")}addBorderGlow(e,t){if(!e)return;const s=["iron-border","gold-border","platinum-border","common-border","uncommon-border","rare-border","epic-border","legendary-border"];e.classList.remove(...s),t&&s.includes(`${t}-border`)&&e.classList.add(`${t}-border`)}getComponentStyles(){return`
            /* Ship Status Section */
            #ship-status-section {
                grid-column: 1;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .resources-container {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
            }
            
            .resource-display {
                flex: 1;
                padding: 8px;
                background-color: rgba(15, 40, 55, 0.8);
                border-radius: 5px;
                text-align: center;
            }
            
            .status-bar-container {
                width: 100%;
                height: 15px;
                background-color: #222;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            
            .status-bar {
                height: 100%;
                border-radius: 10px;
            }
            
            .status-label {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 0.9em;
            }
            
            /* Market Section */
            #market-section {
                grid-column: 2;
                grid-row: 1;
            }
            
            .sell-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 5px;
                margin-bottom: 15px;
            }
            
            .sell-btn {
                padding: 10px;
                background-color: rgba(15, 40, 55, 0.8);
                color: #fff;
                border-radius: 5px;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
                border: none;
                font-family: 'Courier New', monospace;
            }
            
            .orb-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            
            /* Upgrades Section */
            #upgrades-section {
                grid-column: 3;
                grid-row: 1;
            }
            
            .upgrade-item {
                margin-bottom: 15px;
                border: 1px solid rgba(85, 85, 85, 0.5);
                border-radius: 8px;
                padding: 12px;
                background-color: rgba(0, 0, 0, 0.3);
            }
            
            .upgrade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .upgrade-progress {
                position: relative;
                height: 8px;
                background-color: #333;
                border-radius: 4px;
                margin-bottom: 12px;
            }
            
            .upgrade-progress-bar {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 20%;
                border-radius: 4px;
            }
            
            .upgrade-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .upgrade-description {
                flex: 2;
                padding-right: 10px;
                font-size: 0.85em;
                opacity: 0.8;
            }
            
            /* Features Section */
            #features-section {
                grid-column: 1 / span 2;
                grid-row: 2;
            }
            
            .feature-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .feature-btn {
                padding: 15px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 16px;
                color: #fff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 80px;
            }
            
            .feature-btn small {
                font-size: 0.8em;
                opacity: 0.8;
                margin-top: 5px;
            }
            
            /* Challenge Section */
            #challenge-section {
                border-color: rgba(255, 48, 48, 0.5);
            }
            
            #challenge-section h3 {
                color: var(--accent-red);
                border-color: rgba(255, 48, 48, 0.3);
            }
            
            /* Common Button Styles */
            .action-btn {
                width: 100%;
                padding: 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                color: #000;
                margin-top: 5px;
            }
            
            /* Button color variations */
            .btn-fuel { background-color: var(--accent-green); }
            .btn-shield { background-color: var(--accent-blue); }
            .btn-hull { background-color: var(--accent-orange); }
            .btn-starmap { background-color: var(--accent-cyan); }
            .btn-blackjack { background-color: var(--accent-purple); }
            .btn-settings { background-color: var(--accent-blue); }
            
            /* Mobile Responsiveness */
            @media (max-width: 900px) {
                #stargate-ui {
                    width: 95%;
                    max-width: 95vw;
                    max-height: 85vh;
                    border-radius: 10px;
                }
                
                #stargate-content {
                    grid-template-columns: 1fr;
                    gap: 15px;
                    padding: 15px;
                }
                
                #ship-status-section,
                #market-section,
                #upgrades-section,
                #features-section {
                    grid-column: 1;
                }
                
                .feature-buttons {
                    grid-template-columns: 1fr;
                }
                
                .sell-buttons {
                    grid-template-columns: 1fr 1fr;
                }
                
                .action-btn {
                    padding: 12px;
                    min-height: 44px;
                }
            }
        `}}class A{constructor(){r(this,"commandHistory");r(this,"historyIndex");r(this,"aliases");this.commandHistory=[],this.historyIndex=-1,this.aliases=new Map,this.setupAliases()}setupAliases(){this.aliases.set("ls","list"),this.aliases.set("dir","list"),this.aliases.set("h","help"),this.aliases.set("?","help"),this.aliases.set("q","quit"),this.aliases.set("exit","quit"),this.aliases.set("cls","clear"),this.aliases.set("clr","clear"),this.aliases.set("buy","purchase"),this.aliases.set("sell","market"),this.aliases.set("upgrade","enhance"),this.aliases.set("status","info"),this.aliases.set("stat","info")}parseCommand(e){var o;if(!e||typeof e!="string")return{command:"",args:[],original:"",raw:""};const t=e.trim();if(!t)return{command:"",args:[],original:e,raw:""};this.commandHistory[this.commandHistory.length-1]!==t&&(this.commandHistory.push(t),this.commandHistory.length>50&&this.commandHistory.shift()),this.historyIndex=this.commandHistory.length;const s=this.tokenize(t),i=((o=s[0])==null?void 0:o.toLowerCase())||"",n=this.resolveAlias(i),a=s.slice(1);return{command:n,args:a,original:t,raw:i}}tokenize(e){const t=[];let s="",i=!1,n="";for(let a=0;a<e.length;a++){const o=e[a];(o==='"'||o==="'")&&!i?(i=!0,n=o):o===n&&i?(i=!1,n=""):o===" "&&!i?s&&(t.push(s),s=""):s+=o}return s&&t.push(s),t}resolveAlias(e){return this.aliases.get(e)||e}getCommandHistory(){return[...this.commandHistory]}getPreviousCommand(){return this.historyIndex>0?(this.historyIndex--,this.commandHistory[this.historyIndex]):null}getNextCommand(){return this.historyIndex<this.commandHistory.length-1?(this.historyIndex++,this.commandHistory[this.historyIndex]):this.historyIndex===this.commandHistory.length-1?(this.historyIndex++,""):null}validateCommand(e){return["help","list","clear","quit","info","status","purchase","market","enhance","upgrade","refuel","repair","undock","dock","scan","navigate","starmap","blackjack","settings","horde"].includes(e)}getCommandSuggestions(e){return["help","list","clear","quit","info","purchase","market","enhance","refuel","repair","undock","dock","scan","navigate","starmap","blackjack","settings","horde"].filter(s=>s.startsWith(e.toLowerCase()))}}class D{constructor(e){r(this,"stargate");r(this,"lastCommandTime");r(this,"commandCooldown");this.stargate=e,this.lastCommandTime=0,this.commandCooldown=100}async executeCommand(e){const t=Date.now();if(t-this.lastCommandTime<this.commandCooldown)return{success:!1,message:"Command rate limit exceeded"};this.lastCommandTime=t;const{command:s,args:i}=e;try{switch(s){case"help":return this.handleHelp(i);case"list":return this.handleList();case"clear":return this.handleClear();case"quit":case"undock":return this.handleUndock();case"info":return this.handleInfo(i);case"purchase":return this.handlePurchase(i);case"market":return this.handleMarket(i);case"enhance":return this.handleEnhance(i);case"refuel":return this.handleRefuel();case"repair":return this.handleRepair(i);case"scan":return this.handleScan();case"starmap":return this.handleStarmap();case"blackjack":return this.handleBlackjack();case"settings":return this.handleSettings();case"horde":return this.handleHorde();default:return{success:!1,message:`Unknown command: ${s}. Type 'help' for available commands.`}}}catch(n){return console.error("Command execution error:",n),{success:!1,message:"Command execution failed. Please try again."}}}handleHelp(e){const t={general:`Available Commands:
• help [topic] - Show this help or specific topic help
• list - Show available services and features  
• info [system] - Display ship or system information
• market [item] - Access trading interface
• purchase <item> - Buy upgrades or services
• enhance <system> - Upgrade ship systems
• refuel - Refill fuel tanks
• repair [system] - Repair ship systems
• scan - Perform system scan
• starmap - Open navigation interface
• blackjack - Access gaming interface
• settings - Configure terminal preferences
• undock - Leave stargate terminal
• clear - Clear terminal display`,market:`Market Commands:
• market - Show all available items
• market resources - Show resource prices
• market orbs - Show energy orb values
• purchase fuel - Refuel ship (100 CR)
• purchase shield - Repair shields (150 CR)
• purchase hull - Repair hull (200 CR)`,upgrade:`Upgrade Commands:
• enhance fuel - Upgrade fuel tank capacity
• enhance engine - Improve ship speed
• enhance mining - Increase mining efficiency
• enhance hull - Strengthen ship structure
• enhance scanner - Extend detection range`},s=e[0]||"general";return{success:!0,message:t[s]||t.general}}handleList(){return{success:!0,message:`STARGATE SERVICES:
• Ship Maintenance & Repair
• Resource Trading Market
• Ship System Upgrades
• Navigation & Mapping
• Entertainment (Stellar Blackjack)
• System Configuration
• Challenge Modes

Type 'help [service]' for detailed information.`}}handleClear(){return{success:!0,message:"",clearScreen:!0}}handleUndock(){return this.stargate&&typeof this.stargate.hide=="function"&&this.stargate.hide(),{success:!0,message:"Undocking from stargate terminal...",action:"undock"}}handleInfo(e){return{success:!0,message:`${(e[0]||"ship").toUpperCase()} STATUS:
System information would be displayed here.
Use the GUI panels for detailed status.`}}handlePurchase(e){const t=e[0];return t?{success:!0,message:`Attempting to purchase ${t}...`,action:"purchase",target:t}:{success:!1,message:'Please specify an item to purchase. Use "market" to see available items.'}}handleMarket(e){return{success:!0,message:`MARKET INTERFACE - ${(e[0]||"all").toUpperCase()}
Use the market panel for transactions.
Type 'help market' for command-line trading.`}}handleEnhance(e){const t=e[0];return t?{success:!0,message:`Initiating ${t} enhancement...`,action:"enhance",target:t}:{success:!1,message:'Please specify a system to enhance. Use "info" to see available systems.'}}handleRefuel(){return{success:!0,message:"Initiating refueling sequence...",action:"refuel"}}handleRepair(e){const t=e[0]||"all";return{success:!0,message:`Initiating ${t} repair sequence...`,action:"repair",target:t}}handleScan(){return{success:!0,message:`Performing system scan...
Scan results would appear here.`}}handleStarmap(){return{success:!0,message:"Opening stellar cartography interface...",action:"starmap"}}handleBlackjack(){return{success:!0,message:"Accessing gaming interface...",action:"blackjack"}}handleSettings(){return{success:!0,message:"Opening configuration interface...",action:"settings"}}handleHorde(){return{success:!0,message:"WARNING: Prepare for extreme challenge mode...",action:"horde"}}}class ${constructor(){r(this,"welcomeMessages");this.welcomeMessages=["STARGATE TERMINAL ONLINE","QUANTUM LINK ESTABLISHED","NEURAL INTERFACE ACTIVE","SYSTEM READY FOR COMMANDS"]}getMainUIContent(){return`
            <!-- Header -->
            <div id="stargate-header">
                <button id="undock-btn" class="action-btn btn-undock" data-no-touch-overlay="true">
                    <span class="undock-text">◆ UNDOCK ◆</span>
                </button>
                <h2 style="text-align: center; color: #33aaff; margin: 0;">STARGATE TERMINAL</h2>
            </div>
            
            <!-- Main Content Grid -->
            <div id="stargate-content">
                <!-- Ship Status Section -->
                <div id="ship-status-section" class="stargate-section">
                    <h3>SHIP STATUS</h3>
                    ${this.getShipStatusContent()}
                </div>
                
                <!-- Market Section -->
                <div id="market-section" class="stargate-section">
                    <h3>MARKET</h3>
                    ${this.getMarketContent()}
                </div>
                
                <!-- Upgrades Section -->
                <div id="upgrades-section" class="stargate-section">
                    <h3>SHIP UPGRADES</h3>
                    ${this.getUpgradesContent()}
                </div>
                
                <!-- Features Section -->
                <div id="features-section" class="stargate-section">
                    <h3>SERVICES</h3>
                    ${this.getFeaturesContent()}
                </div>
                
                <!-- Challenge Section -->
                <div id="challenge-section" class="stargate-section">
                    <h3>EXTREME CHALLENGE</h3>
                    ${this.getChallengeContent()}
                </div>
            </div>
            
            <!-- Footer -->
            <div id="stargate-footer">
                <!-- Footer now empty, undock button moved to header -->
            </div>
        `}getShipStatusContent(){return`
            <!-- Resources section -->
            <div>
                <h4 style="color: #33aaff; margin-top: 0; margin-bottom: 10px;">RESOURCES</h4>
                <div class="resources-container">
                    <div class="resource-display iron-border">
                        <div style="font-weight: bold; font-size: 14px;">IRON</div>
                        <div id="ms-iron" style="font-size: 18px; margin-top: 5px;">0</div>
                        <div style="font-size: 10px; opacity: 0.7;">UNITS</div>
                    </div>
                    <div class="resource-display gold-border">
                        <div style="font-weight: bold; font-size: 14px;">GOLD</div>
                        <div id="ms-gold" style="font-size: 18px; margin-top: 5px;">0</div>
                        <div style="font-size: 10px; opacity: 0.7;">UNITS</div>
                    </div>
                    <div class="resource-display platinum-border">
                        <div style="font-weight: bold; font-size: 14px;">PLATINUM</div>
                        <div id="ms-platinum" style="font-size: 18px; margin-top: 5px;">0</div>
                        <div style="font-size: 10px; opacity: 0.7;">UNITS</div>
                    </div>
                </div>
                
                <div style="margin-top: 15px;">
                    <h4 style="color: #33aaff; margin-top: 0; margin-bottom: 10px;">CREDITS</h4>
                    <div id="ms-credits" style="font-size: 18px; font-weight: bold; color: #ffcc33; text-shadow: 0 0 5px rgba(255, 204, 51, 0.5);">0 CR</div>
                </div>
            </div>
            
            <!-- Fuel section -->
            <div>
                <div class="status-label">
                    <h4 style="color: #00cc33; margin: 0;">FUEL</h4>
                    <span><span id="fuel-level">100</span>%</span>
                </div>
                <div class="status-bar-container" id="fuel-gauge-container">
                    <div class="status-bar" id="fuel-gauge" style="background-color: #00cc33; width: 100%;"></div>
                </div>
                <button id="refuel-btn" class="action-btn btn-fuel">REFUEL (100 CR)</button>
            </div>
            
            <!-- Shield section -->
            <div>
                <div class="status-label">
                    <h4 style="color: #3399ff; margin: 0;">SHIELD</h4>
                    <span><span id="shield-level">100</span>%</span>
                </div>
                <div class="status-bar-container" id="shield-gauge-container">
                    <div class="status-bar" id="shield-gauge" style="background-color: #3399ff; width: 100%;"></div>
                </div>
                <button id="repair-shield-btn" class="action-btn btn-shield">REPAIR SHIELD (150 CR)</button>
            </div>
            
            <!-- Hull section -->
            <div>
                <div class="status-label">
                    <h4 style="color: #ff9900; margin: 0;">HULL INTEGRITY</h4>
                    <span><span id="hull-level">100</span>%</span>
                </div>
                <div class="status-bar-container" id="hull-gauge-container">
                    <div class="status-bar" id="hull-gauge" style="background-color: #ff9900; width: 100%;"></div>
                </div>
                <button id="repair-hull-btn" class="action-btn btn-hull">REPAIR HULL (200 CR)</button>
            </div>
        `}getMarketContent(){return`
            <!-- Resources Market -->
            <h4 style="color: #33aaff; margin-top: 0; margin-bottom: 10px;">MATERIALS</h4>
            <div class="sell-buttons">
                <button id="sell-iron" class="sell-btn iron-border">
                    <div style="font-weight: bold;">SELL IRON</div>
                    <div style="font-size: 12px; margin-top: 3px;">(10 CR each)</div>
                </button>
                <button id="sell-gold" class="sell-btn gold-border">
                    <div style="font-weight: bold;">SELL GOLD</div>
                    <div style="font-size: 12px; margin-top: 3px;">(50 CR each)</div>
                </button>
                <button id="sell-platinum" class="sell-btn platinum-border">
                    <div style="font-weight: bold;">SELL PLATINUM</div>
                    <div style="font-size: 12px; margin-top: 3px;">(200 CR each)</div>
                </button>
            </div>
            
            <!-- Energy Orbs Market -->
            <h4 style="color: #33aaff; margin-top: 20px; margin-bottom: 10px;">ENERGY ORBS</h4>
            <div style="font-size: 14px; color: #aaa; margin-bottom: 10px;">
                Valuable artifacts collected from space anomalies. Increasing rarity yields higher value.
            </div>
            
            <div class="orb-buttons">
                ${this.getOrbButtons()}
            </div>
            
            <!-- Deployable Weapons Section -->
            <h4 style="color: #33aaff; margin-top: 20px; margin-bottom: 10px;">DEPLOYABLE WEAPONS</h4>
            <div class="upgrade-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <strong style="color: #FF3333;">Laser Turrets:</strong> <span id="current-laser-count">0</span>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 2; padding-right: 10px;">
                        <p style="margin: 0; font-size: 12px;">Deployable laser turrets automatically target and fire at enemies within 1000m range.</p>
                    </div>
                    <button id="purchase-laser" style="flex: 1; padding: 10px; background-color: #FF3333; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                        PURCHASE (1000 CR)
                    </button>
                </div>
            </div>
        `}getOrbButtons(){return[{type:"common",price:100},{type:"uncommon",price:500},{type:"rare",price:1500},{type:"epic",price:5e3},{type:"legendary",price:15e3}].map(t=>`
            <button id="sell-orb-${t.type}" class="sell-btn ${t.type}-border">
                <div style="font-weight: bold;">${t.type.toUpperCase()} ORB</div>
                <div id="orb-${t.type}-count" style="font-size: 12px;">0 in inventory</div>
                <div style="font-size: 12px; margin-top: 3px;">(${t.price.toLocaleString()} CR each)</div>
            </button>
        `).join("")}getUpgradesContent(){return[{type:"fuel",name:"Fuel Tank",color:"#00cc33",description:"Increases maximum fuel capacity, allowing for longer journeys."},{type:"engine",name:"Engine",color:"#ff9900",description:"Enhances thruster power, increasing maximum velocity and maneuverability."},{type:"mining",name:"Mining Laser",color:"#ff3030",description:"Increases mining speed and extraction efficiency, allowing faster resource collection."},{type:"hull",name:"Hull",color:"#30cfd0",description:"Reinforces ship structure, improving collision resistance and reducing damage."},{type:"scanner",name:"Scanner",color:"#9933cc",description:"Extends scanner range for detecting asteroids and other objects at greater distances."}].map(t=>this.getUpgradeItemHTML(t)).join("")}getUpgradeItemHTML(e){const t=e.color==="#ff3030"||e.color==="#9933cc"?"#fff":"#000";return`
            <div class="upgrade-item">
                <div class="upgrade-header">
                    <div>
                        <strong style="color: ${e.color};">${e.name} Level:</strong> <span id="current-${e.type}-level">1</span>
                    </div>
                    <div style="text-align: right;">
                        <strong>Current:</strong> <span id="current-${e.type}-capacity">--</span>
                        <br>
                        <small style="opacity: 0.8;">Next: <span id="next-${e.type}-capacity">--</span></small>
                    </div>
                </div>
                <div class="upgrade-progress">
                    <div id="${e.type}-upgrade-progress" class="upgrade-progress-bar" style="background-color: ${e.color}; width: 20%;"></div>
                </div>
                <div class="upgrade-footer">
                    <div class="upgrade-description">
                        <p style="margin: 0; font-size: 12px;">${e.description}</p>
                    </div>
                    <button id="upgrade-${e.type}" style="flex: 1; padding: 10px; background-color: ${e.color}; color: ${t}; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                        UPGRADE (<span id="${e.type}-upgrade-cost">1000</span> CR)
                    </button>
                </div>
            </div>
        `}getFeaturesContent(){return`
            <div class="feature-buttons">
                <button id="open-star-map" class="feature-btn" style="background-color: #30cfd0;">
                    STAR MAP
                    <small>Access star systems navigation</small>
                </button>
                <button id="create-custom-system" class="feature-btn" style="background: linear-gradient(135deg, #2c5a8c 0%, #4a76a8 100%); border: 1px solid #4a9dff; box-shadow: 0 0 10px rgba(74, 157, 255, 0.3);">
                    CREATE NEW SYSTEM
                    <small>Generate custom AI star systems</small>
                </button>
                <button id="open-blackjack" class="feature-btn" style="background-color: #9933cc;">
                    STELLAR BLACKJACK
                    <small>Wager resources in card games</small>
                </button>
                <button id="open-settings" class="feature-btn" style="background-color: #33aaff;">
                    SETTINGS
                    <small>Adjust graphics and audio options</small>
                </button>
            </div>
        `}getChallengeContent(){return`
            <button id="unleash-horde" class="action-btn btn-horde">
                UNLEASH THE HORDE
            </button>
            <p style="font-size: 12px; color: #ff9999; margin: 10px 0 0 0;">WARNING: Activate extreme survival mode with infinitely scaling difficulty</p>
        `}getRandomWelcomeMessage(){return this.welcomeMessages[Math.floor(Math.random()*this.welcomeMessages.length)]}}class V{constructor(){r(this,"keyHandlers");r(this,"inputBuffer");r(this,"isActive");r(this,"modifiers");this.keyHandlers=new Map,this.inputBuffer="",this.isActive=!1,this.modifiers={shift:!1,ctrl:!1,alt:!1},this.setupEventListeners()}setupEventListeners(){document.addEventListener("keydown",this.handleKeyDown.bind(this)),document.addEventListener("keyup",this.handleKeyUp.bind(this)),document.addEventListener("keypress",this.handleKeyPress.bind(this))}handleKeyDown(e){if(this.isActive){switch(this.updateModifiers(e,!0),e.code){case"Enter":this.handleEnter(e);break;case"Escape":this.handleEscape(e);break;case"Tab":this.handleTab(e);break;case"ArrowUp":this.handleArrowUp(e);break;case"ArrowDown":this.handleArrowDown(e);break;case"Backspace":this.handleBackspace(e);break;case"Delete":this.handleDelete(e);break;case"Home":this.handleHome(e);break;case"End":this.handleEnd(e);break;default:e.code.startsWith("F")&&this.handleFunctionKey(e);break}this.modifiers.ctrl&&this.handleCtrlCombination(e),this.modifiers.alt&&this.handleAltCombination(e)}}handleKeyUp(e){this.updateModifiers(e,!1)}handleKeyPress(e){this.isActive&&e.charCode>=32&&e.charCode<=126&&this.handleCharacterInput(e.key)}updateModifiers(e,t){(e.code==="ShiftLeft"||e.code==="ShiftRight")&&(this.modifiers.shift=t),(e.code==="ControlLeft"||e.code==="ControlRight")&&(this.modifiers.ctrl=t),(e.code==="AltLeft"||e.code==="AltRight")&&(this.modifiers.alt=t)}handleEnter(e){e.preventDefault(),this.triggerHandler("enter",{input:this.inputBuffer,modifiers:{...this.modifiers}}),this.inputBuffer=""}handleEscape(e){e.preventDefault(),this.triggerHandler("escape",{modifiers:{...this.modifiers}}),this.inputBuffer=""}handleTab(e){e.preventDefault(),this.triggerHandler("tab",{input:this.inputBuffer,modifiers:{...this.modifiers}})}handleArrowUp(e){e.preventDefault(),this.triggerHandler("arrowUp",{modifiers:{...this.modifiers}})}handleArrowDown(e){e.preventDefault(),this.triggerHandler("arrowDown",{modifiers:{...this.modifiers}})}handleBackspace(e){e.preventDefault(),this.inputBuffer.length>0&&(this.inputBuffer=this.inputBuffer.slice(0,-1),this.triggerHandler("backspace",{input:this.inputBuffer,modifiers:{...this.modifiers}}))}handleDelete(e){e.preventDefault(),this.triggerHandler("delete",{input:this.inputBuffer,modifiers:{...this.modifiers}})}handleHome(e){e.preventDefault(),this.triggerHandler("home",{modifiers:{...this.modifiers}})}handleEnd(e){e.preventDefault(),this.triggerHandler("end",{modifiers:{...this.modifiers}})}handleFunctionKey(e){e.preventDefault();const t=parseInt(e.code.substring(1));this.triggerHandler("function",{functionNumber:t,modifiers:{...this.modifiers}})}handleCtrlCombination(e){switch(e.code){case"KeyC":e.preventDefault(),this.triggerHandler("ctrlC",{input:this.inputBuffer,modifiers:{...this.modifiers}});break;case"KeyV":e.preventDefault(),this.handlePaste();break;case"KeyA":e.preventDefault(),this.triggerHandler("ctrlA",{input:this.inputBuffer,modifiers:{...this.modifiers}});break;case"KeyL":e.preventDefault(),this.triggerHandler("ctrlL",{modifiers:{...this.modifiers}});break}}handleAltCombination(e){this.triggerHandler("alt",{key:e.code,modifiers:{...this.modifiers}})}handleCharacterInput(e){this.inputBuffer+=e,this.triggerHandler("character",{character:e,input:this.inputBuffer,modifiers:{...this.modifiers}})}async handlePaste(){try{const e=await navigator.clipboard.readText();this.inputBuffer+=e,this.triggerHandler("paste",{text:e,input:this.inputBuffer,modifiers:{...this.modifiers}})}catch(e){console.warn("Clipboard access failed:",e)}}registerHandler(e,t){this.keyHandlers.has(e)||this.keyHandlers.set(e,[]),this.keyHandlers.get(e).push(t)}unregisterHandler(e,t){const s=this.keyHandlers.get(e);if(s){const i=s.indexOf(t);i>-1&&s.splice(i,1)}}triggerHandler(e,t){const s=this.keyHandlers.get(e);s&&s.forEach(i=>{try{i(t)}catch(n){console.error(`Error in ${e} handler:`,n)}})}activate(){this.isActive=!0,this.inputBuffer=""}deactivate(){this.isActive=!1,this.inputBuffer=""}clearInput(){this.inputBuffer=""}getInput(){return this.inputBuffer}setInput(e){this.inputBuffer=e||""}}class P{constructor(){r(this,"screen");r(this,"effects");r(this,"parser");r(this,"handlers");r(this,"messages");r(this,"keyboard");this.screen=new R,this.effects=new T,this.parser=new A,this.handlers=new D(this),this.messages=new $,this.keyboard=new V,this.setupKeyboardHandlers()}setMobile(e){this.screen.setMobile(e)}setupKeyboardHandlers(){this.keyboard.registerHandler("enter",e=>{var t;(t=e.input)!=null&&t.trim()&&this.handleCommand(e.input)}),this.keyboard.registerHandler("escape",()=>{this.hide()}),this.keyboard.registerHandler("ctrlL",()=>{this.clearTerminal()})}async handleCommand(e){const t=this.parser.parseCommand(e),s=await this.handlers.executeCommand(t);s.clearScreen?this.clearTerminal():s.message&&this.displayMessage(s.message),s.action&&this.handleAction(s.action,s.target)}handleAction(e,t){switch(e){case"undock":this.hide();break;case"refuel":this.triggerRefuel();break;case"repair":this.triggerRepair(t);break;case"enhance":this.triggerUpgrade(t);break;case"purchase":this.triggerPurchase(t);break}}displayMessage(e){console.log("Terminal:",e)}clearTerminal(){console.clear()}createStyles(){this.effects.createStyles()}createDockingPrompt(){return this.screen.createDockingPrompt()}createMainUI(){return this.screen.createMainUI()}getMainUIContent(){return this.messages.getMainUIContent()}getUpgradesContent(){return this.messages.getUpgradesContent()}showDockingPrompt(){this.screen.showDockingPrompt()}hideDockingPrompt(){this.screen.hideDockingPrompt()}show(){this.screen.showUI(),this.keyboard.activate()}hide(){this.screen.hideUI(),this.keyboard.deactivate()}triggerRefuel(){console.log("Refuel triggered")}triggerRepair(e){console.log("Repair triggered for:",e)}triggerUpgrade(e){console.log("Upgrade triggered for:",e)}triggerPurchase(e){console.log("Purchase triggered for:",e)}}class N{constructor(){r(this,"starMap");r(this,"blackjackGame");r(this,"settings");this.starMap=null,this.blackjackGame=null,this.settings=null}setStarMap(e){this.starMap=e}setBlackjackGame(e){this.blackjackGame=e}setSettings(e){this.settings=e}setupStarMapButton(){const e=document.getElementById("open-star-map");e&&this.starMap?e.addEventListener("click",()=>{console.log("Opening star map"),this.hideStargateUI(),this.starMap.show()}):e&&(e.disabled=!0,e.style.backgroundColor="#555",e.style.cursor="not-allowed",e.title="Star map not available")}setupBlackjackButton(){const e=document.getElementById("open-blackjack");e&&this.blackjackGame?e.addEventListener("click",()=>{console.log("Opening blackjack game"),this.hideStargateUI(),this.blackjackGame.show()}):e&&(e.disabled=!0,e.style.backgroundColor="#555",e.style.cursor="not-allowed",e.title="Blackjack game not available")}setupSettingsButton(){if(!this.settings)return;const e=document.getElementById("open-settings");e&&e.addEventListener("click",()=>{console.log("Opening settings"),this.hideStargateUI(),this.settings.show()})}setupCustomSystemButton(){const e=document.getElementById("create-custom-system");e&&e.addEventListener("click",()=>{window.game&&window.game.environment&&window.game.environment.customSystemCreator?(this.hideStargateUI(),window.game.environment.customSystemCreator.show()):console.error("Custom system creator not available")})}hideStargateUI(){const e=document.getElementById("stargate-ui");e&&(e.style.display="none")}setupAllSystemButtons(){this.setupStarMapButton(),this.setupBlackjackButton(),this.setupSettingsButton(),this.setupCustomSystemButton()}}class O{constructor(){r(this,"spaceship");r(this,"resources");this.spaceship=null,this.resources=null}setGameReferences(e,t){this.spaceship=e,this.resources=t}sellEnergyOrb(e){if(!this.spaceship||!this.resources)return console.error("Required game objects not available"),!1;if(!this.resources.orbs)return this.resources.orbs={common:0,uncommon:0,rare:0,epic:0,legendary:0},!1;if(!this.resources.orbs[e]||this.resources.orbs[e]<=0)return console.log(`No ${e} orbs available to sell`),!1;let t=0;switch(e){case"common":t=100;break;case"uncommon":t=500;break;case"rare":t=1500;break;case"epic":t=5e3;break;case"legendary":t=15e3;break;default:return console.error(`Unknown orb rarity: ${e}`),!1}const s=this.resources.orbs[e];this.resources.orbs[e]=s-1,this.spaceship.credits+=t;const i=e.charAt(0).toUpperCase()+e.slice(1);return this.showNotification(`Sold ${i} Energy Orb for ${t} credits`,3386111),window.game&&window.game.audio&&window.game.audio.playSoundEffect("sell",.5),!0}purchaseLaserTurret(){if(console.log("Attempting to purchase laser turret"),!this.spaceship){console.error("Cannot purchase laser turret: spaceship not found");return}if(this.spaceship.credits<1e3){console.log("Not enough credits to purchase laser turret"),d&&d.publish("ui.notification",{message:"Not enough credits to purchase laser turret",type:"error",duration:2});return}this.spaceship.credits-=1e3,typeof this.spaceship.deployableLaserCount>"u"&&(this.spaceship.deployableLaserCount=0),this.spaceship.deployableLaserCount++,window.game&&window.game.audio&&window.game.audio.playSound&&window.game.audio.playSound("purchase"),d&&d.publish("ui.notification",{message:"Laser turret purchased",type:"success",duration:2}),console.log("Laser turret purchased successfully")}showNotification(e,t=3386111){const s=document.createElement("div");s.style.position="fixed",s.style.top="35%",s.style.left="50%",s.style.transform="translate(-50%, -50%)",s.style.backgroundColor="rgba(0, 0, 0, 0.8)",s.style.color="#fff",s.style.padding="15px 30px",s.style.borderRadius="10px",s.style.border=`2px solid #${t.toString(16).padStart(6,"0")}`,s.style.boxShadow=`0 0 15px #${t.toString(16).padStart(6,"0")}`,s.style.fontFamily="Courier New, monospace",s.style.fontSize="16px",s.style.zIndex="1001",s.style.textAlign="center",s.textContent=e,document.body.appendChild(s),setTimeout(()=>{s.style.opacity="0",s.style.transition="opacity 0.8s",setTimeout(()=>{s.remove()},800)},2e3)}updateOrbCounts(){if(!this.resources)return;this.resources.orbs||(this.resources.orbs={common:0,uncommon:0,rare:0,epic:0,legendary:0});const e=document.getElementById("orb-common-count"),t=document.getElementById("orb-uncommon-count"),s=document.getElementById("orb-rare-count"),i=document.getElementById("orb-epic-count"),n=document.getElementById("orb-legendary-count");e&&(e.textContent=this.resources.orbs.common>0?`${this.resources.orbs.common} in inventory`:"0 in inventory"),t&&(t.textContent=this.resources.orbs.uncommon>0?`${this.resources.orbs.uncommon} in inventory`:"0 in inventory"),s&&(s.textContent=this.resources.orbs.rare>0?`${this.resources.orbs.rare} in inventory`:"0 in inventory"),i&&(i.textContent=this.resources.orbs.epic>0?`${this.resources.orbs.epic} in inventory`:"0 in inventory"),n&&(n.textContent=this.resources.orbs.legendary>0?`${this.resources.orbs.legendary} in inventory`:"0 in inventory")}updateOrbSellButtons(){if(!this.resources||!this.resources.orbs)return;const e=(t,s,i)=>{const n=document.getElementById(t);n&&(s===0?(n.disabled=!0,n.style.backgroundColor="rgba(40, 40, 40, 0.8)",n.style.color="#777",n.style.cursor="not-allowed",n.style.boxShadow="none"):(n.disabled=!1,n.style.backgroundColor="rgba(15, 40, 55, 0.8)",n.style.color="#fff",n.style.cursor="pointer",n.style.boxShadow=`0 0 10px ${i}`))};e("sell-orb-common",this.resources.orbs.common,"rgba(0, 255, 102, 0.3)"),e("sell-orb-uncommon",this.resources.orbs.uncommon,"rgba(0, 102, 255, 0.3)"),e("sell-orb-rare",this.resources.orbs.rare,"rgba(153, 0, 255, 0.3)"),e("sell-orb-epic",this.resources.orbs.epic,"rgba(255, 102, 0, 0.3)"),e("sell-orb-legendary",this.resources.orbs.legendary,"rgba(255, 0, 0, 0.3)")}updateLaserTurretDisplay(){if(!this.spaceship)return;const e=document.getElementById("current-laser-count");e&&(e.textContent=String(this.spaceship.deployableLaserCount||0));const t=document.getElementById("purchase-laser");t&&(this.spaceship.credits<1e3?(t.disabled=!0,t.style.backgroundColor="#555",t.style.cursor="not-allowed"):(t.disabled=!1,t.style.backgroundColor="#FF3333",t.style.cursor="pointer"))}updateResourceSellButtons(){if(!this.resources)return;const e=document.getElementById("sell-iron"),t=document.getElementById("sell-gold"),s=document.getElementById("sell-platinum");e&&(e.disabled=this.resources.iron===0),t&&(t.disabled=this.resources.gold===0),s&&(s.disabled=this.resources.platinum===0),this.updateSellButtonStatus("sell-iron",this.resources.iron,"#cc6633"),this.updateSellButtonStatus("sell-gold",this.resources.gold,"#ffcc33"),this.updateSellButtonStatus("sell-platinum",this.resources.platinum,"#33ccff"),document.querySelectorAll(".sell-btn").forEach(i=>{const n=i;n.disabled&&(n.style.backgroundColor="rgba(40, 40, 40, 0.8)",n.style.color="#777",n.style.cursor="not-allowed",n.style.boxShadow="none")})}updateSellButtonStatus(e,t,s){const i=document.getElementById(e);if(i)if(t===0)i.disabled=!0,i.style.backgroundColor="rgba(40, 40, 40, 0.8)",i.style.borderColor="#555",i.style.color="#777",i.style.boxShadow="none",i.style.cursor="not-allowed";else{i.disabled=!1,i.style.backgroundColor="rgba(15, 40, 55, 0.8)",i.style.borderColor=s,i.style.color="#fff";const n=parseInt(s.slice(1,3),16),a=parseInt(s.slice(3,5),16),o=parseInt(s.slice(5,7),16);i.style.boxShadow=`0 0 10px rgba(${n}, ${a}, ${o}, 0.3)`,i.style.cursor="pointer"}}}class j{constructor(){r(this,"spaceship");this.spaceship=null}setSpaceship(e){this.spaceship=e}updateUpgradeDisplays(){if(!this.spaceship)return;const e=document.getElementById("current-fuel-level"),t=document.getElementById("current-fuel-capacity"),s=document.getElementById("next-fuel-capacity"),i=document.getElementById("fuel-upgrade-cost"),n=document.getElementById("fuel-upgrade-progress");e&&(e.textContent=String(this.spaceship.fuelTankLevel)),t&&(t.textContent=String(this.spaceship.maxFuel)),s&&(s.textContent=String(this.spaceship.maxFuel*2)),i&&(i.textContent=String(this.spaceship.fuelUpgradeCost)),n&&(n.style.width=`${Math.min(this.spaceship.fuelTankLevel*20,100)}%`);const a=document.getElementById("current-engine-level"),o=document.getElementById("current-max-velocity"),u=document.getElementById("next-max-velocity"),p=document.getElementById("engine-upgrade-cost"),h=document.getElementById("engine-upgrade-progress");a&&(a.textContent=String(this.spaceship.engineLevel)),o&&(o.textContent=this.spaceship.maxVelocity.toFixed(2)),u&&(u.textContent=(this.spaceship.maxVelocity*1.25).toFixed(2)),p&&(p.textContent=String(this.spaceship.engineUpgradeCost)),h&&(h.style.width=`${Math.min(this.spaceship.engineLevel*20,100)}%`);const g=document.getElementById("current-mining-level"),m=document.getElementById("current-mining-efficiency"),f=document.getElementById("next-mining-efficiency"),y=document.getElementById("mining-upgrade-cost"),b=document.getElementById("mining-upgrade-progress");g&&(g.textContent=String(this.spaceship.miningLevel)),m&&(m.textContent=String(Math.round(this.spaceship.miningEfficiency*100))),f&&(f.textContent=String(Math.round(this.spaceship.miningEfficiency*130))),y&&(y.textContent=String(this.spaceship.miningUpgradeCost)),b&&(b.style.width=`${Math.min(this.spaceship.miningLevel*20,100)}%`);const x=document.getElementById("current-hull-level"),v=document.getElementById("current-hull-resistance"),w=document.getElementById("next-hull-resistance"),k=document.getElementById("hull-upgrade-cost"),C=document.getElementById("hull-upgrade-progress");x&&(x.textContent=String(this.spaceship.hullLevel)),v&&(v.textContent=String(Math.round(this.spaceship.collisionResistance*100))),w&&(w.textContent=String(Math.round(this.spaceship.collisionResistance*125))),k&&(k.textContent=String(this.spaceship.hullUpgradeCost)),C&&(C.style.width=`${Math.min(this.spaceship.hullLevel*20,100)}%`);const S=document.getElementById("current-scanner-level"),E=document.getElementById("current-scanner-range"),I=document.getElementById("next-scanner-range"),B=document.getElementById("scanner-upgrade-cost"),M=document.getElementById("scanner-upgrade-progress");S&&(S.textContent=String(this.spaceship.scannerLevel)),E&&(E.textContent=String(Math.round(this.spaceship.scanRange))),I&&(I.textContent=String(Math.round(this.spaceship.scanRange*1.2))),B&&(B.textContent=String(this.spaceship.scannerUpgradeCost)),M&&(M.style.width=`${Math.min(this.spaceship.scannerLevel*20,100)}%`),this.updateUpgradeButtonStatus("upgrade-fuel-tank",this.spaceship.credits,this.spaceship.fuelUpgradeCost,"#00cc33"),this.updateUpgradeButtonStatus("upgrade-engine",this.spaceship.credits,this.spaceship.engineUpgradeCost,"#ff9900"),this.updateUpgradeButtonStatus("upgrade-mining",this.spaceship.credits,this.spaceship.miningUpgradeCost,"#ff3030"),this.updateUpgradeButtonStatus("upgrade-hull",this.spaceship.credits,this.spaceship.hullUpgradeCost,"#30cfd0"),this.updateUpgradeButtonStatus("upgrade-scanner",this.spaceship.credits,this.spaceship.scannerUpgradeCost,"#9933cc")}updateUpgradeButtonStatus(e,t,s,i){const n=document.getElementById(e);n&&(t<s?(n.disabled=!0,n.style.backgroundColor="#555",n.style.color="#777",n.style.cursor="not-allowed"):(n.disabled=!1,n.style.backgroundColor=i,n.style.color=i==="#ff9900"||i==="#30cfd0"?"#000":"#fff",n.style.cursor="pointer"))}}class G{constructor(){r(this,"hideStargateUICallback");this.hideStargateUICallback=null}setHideCallback(e){this.hideStargateUICallback=e}setupHordeButton(){const e=document.getElementById("unleash-horde");e&&e.addEventListener("click",()=>{window.game&&window.game.ecsWorld&&window.game.ecsWorld.enemySystem&&window.game.ecsWorld.enemySystem.initialSpawnComplete?(console.log("HORDE MODE: Button clicked, showing confirmation"),this.showHordeConfirmation()):(console.log("HORDE MODE: Button clicked but spectral drones haven't appeared yet"),this.showNotification("Horde mode is only available after spectral drones appear in the sector.",16724016))})}showHordeConfirmation(){const e=document.createElement("div");e.id="horde-confirm-modal";const t=document.createElement("div");t.id="horde-confirm-content";const s=document.createElement("div");s.className="horde-confirm-title",s.textContent="UNLEASH THE HORDE?",t.appendChild(s);const i=document.createElement("div");i.className="horde-confirm-text",i.innerHTML=`
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
        `,t.appendChild(i);const n=document.createElement("div");n.className="horde-confirm-buttons";const a=document.createElement("button");a.className="horde-confirm-btn horde-confirm-yes",a.textContent="UNLEASH THEM",a.addEventListener("click",()=>{document.body.removeChild(e),this.hideStargateUICallback&&this.hideStargateUICallback(),window.game&&typeof window.game.activateHordeMode=="function"?(window.game.activateHordeMode(),console.log("HORDE MODE: Activated via stargateInterface")):console.error("HORDE MODE: Failed to activate - game.activateHordeMode not available")});const o=document.createElement("button");o.className="horde-confirm-btn horde-confirm-no",o.textContent="CANCEL",o.addEventListener("click",()=>{document.body.removeChild(e)}),n.appendChild(o),n.appendChild(a),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}showNotification(e,t=3386111){const s=document.createElement("div");s.style.position="fixed",s.style.top="35%",s.style.left="50%",s.style.transform="translate(-50%, -50%)",s.style.backgroundColor="rgba(0, 0, 0, 0.8)",s.style.color="#fff",s.style.padding="15px 30px",s.style.borderRadius="10px",s.style.border=`2px solid #${t.toString(16).padStart(6,"0")}`,s.style.boxShadow=`0 0 15px #${t.toString(16).padStart(6,"0")}`,s.style.fontFamily="Courier New, monospace",s.style.fontSize="16px",s.style.zIndex="1001",s.style.textAlign="center",s.textContent=e,document.body.appendChild(s),setTimeout(()=>{s.style.opacity="0",s.style.transition="opacity 0.8s",setTimeout(()=>{s.remove()},800)},2e3)}}class z{constructor(){r(this,"tradingView");r(this,"isMobile");this.tradingView=null,this.isMobile=!1}setTradingView(e){this.tradingView=e}setMobile(e){this.isMobile=e}setupOrbSellHandlers(e){const t=document.getElementById("sell-orb-common");t&&t.addEventListener("click",()=>{this.tradingView&&this.tradingView.sellEnergyOrb("common")&&e()});const s=document.getElementById("sell-orb-uncommon");s&&s.addEventListener("click",()=>{this.tradingView&&this.tradingView.sellEnergyOrb("uncommon")&&e()});const i=document.getElementById("sell-orb-rare");i&&i.addEventListener("click",()=>{this.tradingView&&this.tradingView.sellEnergyOrb("rare")&&e()});const n=document.getElementById("sell-orb-epic");n&&n.addEventListener("click",()=>{this.tradingView&&this.tradingView.sellEnergyOrb("epic")&&e()});const a=document.getElementById("sell-orb-legendary");a&&a.addEventListener("click",()=>{this.tradingView&&this.tradingView.sellEnergyOrb("legendary")&&e()})}setupLaserPurchaseHandler(e){const t=document.getElementById("purchase-laser");t&&t.addEventListener("click",()=>{this.tradingView&&(this.tradingView.purchaseLaserTurret(),e())})}setupTouchEvents(){if(!this.isMobile)return;const e=document.getElementById("stargate-ui");if(!e)return;console.log("Setting up touch events for stargate UI");const t=document.getElementById("undock-btn");t&&(t.style.touchAction="manipulation",t.style.webkitTapHighlightColor="transparent",t.style.position="relative",t.style.zIndex="9999",t.addEventListener("touchstart",n=>{console.log("Touch start on undock button"),t.style.backgroundColor="#1b88db",t.style.transform="scale(0.98)",n.stopPropagation()},{passive:!1}),t.addEventListener("touchend",n=>{console.log("Touch end on undock button"),t.style.backgroundColor="#33aaff",t.style.transform="scale(1)",n.stopPropagation()},{passive:!1})),e.addEventListener("touchmove",n=>{n.stopPropagation()},{passive:!0}),e.addEventListener("touchstart",n=>{e.scrollTop<=0&&n.touches[0].screenY<n.touches[0].clientY&&n.preventDefault()},{passive:!1});const s=e.querySelectorAll(".tablinks");s.length>0&&s.forEach(n=>{n.addEventListener("touchend",a=>{a.preventDefault(),n.click()})}),e.querySelectorAll("button").forEach(n=>{n!==t&&(n.style.touchAction="manipulation",n.style.webkitTapHighlightColor="transparent",n.addEventListener("touchstart",()=>{n.style.transform="scale(0.98)"},{passive:!0}),n.addEventListener("touchend",()=>{n.style.transform="scale(1)"},{passive:!0}))})}}class c{static updateResourceDisplays(e){const t=document.getElementById("ms-iron"),s=document.getElementById("ms-gold"),i=document.getElementById("ms-platinum");t&&(t.textContent=String(e.iron)),s&&(s.textContent=String(e.gold)),i&&(i.textContent=String(e.platinum))}static updateCreditsDisplay(e){const t=document.getElementById("ms-credits");t&&(t.textContent=`${e.credits} CR`)}static updateStatusGauges(e){const t=document.getElementById("fuel-gauge"),s=document.getElementById("fuel-level");t&&(t.style.width=`${e.fuel/e.maxFuel*100}%`),s&&(s.textContent=String(Math.round(e.fuel/e.maxFuel*100)));const i=document.getElementById("shield-gauge"),n=document.getElementById("shield-level");i&&(i.style.width=`${e.shield/e.maxShield*100}%`),n&&(n.textContent=String(Math.round(e.shield/e.maxShield*100)));const a=document.getElementById("hull-gauge"),o=document.getElementById("hull-level");a&&(a.style.width=`${e.hull/e.maxHull*100}%`),o&&(o.textContent=String(Math.round(e.hull/e.maxHull*100)))}static updateServiceButtons(e){const t=document.getElementById("refuel-btn");t&&(e.credits<100||e.fuel>=e.maxFuel*.999?(t.disabled=!0,t.style.backgroundColor="#555",t.style.cursor="not-allowed"):(t.disabled=!1,t.style.backgroundColor="#00cc33",t.style.cursor="pointer"));const s=document.getElementById("repair-shield-btn");s&&(e.credits<150||e.shield>=e.maxShield*.999?(s.disabled=!0,s.style.backgroundColor="#555",s.style.cursor="not-allowed"):(s.disabled=!1,s.style.backgroundColor="#3399ff",s.style.cursor="pointer"));const i=document.getElementById("repair-hull-btn");i&&(e.credits<200||e.hull>=e.maxHull*.999?(i.disabled=!0,i.style.backgroundColor="#555",i.style.cursor="not-allowed"):(i.disabled=!1,i.style.backgroundColor="#ff9900",i.style.cursor="pointer"))}static configureMobileUI(e,t){t&&(e.style.width="92%",e.style.maxWidth="92vw",e.style.maxHeight="85vh",e.style.webkitOverflowScrolling="touch",e.style.touchAction="pan-y",e.style.overscrollBehavior="auto",e.style.position="absolute",e.style.top="50%",e.style.left="50%",e.style.transform="translate(-50%, -50%)",e.style.zIndex="1000",document.body.classList.remove("undocking","modal-open"))}static syncWithGameResources(){if(window.game&&window.game.controls){const e=window.game.spaceship,t=window.game.controls.resources;if(e&&t)return console.log("Syncing stargate UI with game resources:",t),{spaceship:e,resources:t}}return null}}class q{constructor(){r(this,"starMap");r(this,"blackjackGame");r(this,"settings");r(this,"isMobile");r(this,"terminalView");r(this,"systemsView");r(this,"tradingView");r(this,"upgradesView");r(this,"missionsView");r(this,"eventHandlers");this.starMap=null,this.blackjackGame=null,this.settings=null,this.isMobile=L.isMobile(),this.terminalView=new P,this.systemsView=new N,this.tradingView=new O,this.upgradesView=new j,this.missionsView=new G,this.eventHandlers=new z,this.terminalView.setMobile(this.isMobile),this.eventHandlers.setMobile(this.isMobile),this.eventHandlers.setTradingView(this.tradingView),this.missionsView.setHideCallback(()=>this.hideStargateUI()),this.setupStargateUI(),this.setupEventHandlers()}setStarMap(e){this.starMap=e,this.systemsView.setStarMap(e)}setBlackjackGame(e){this.blackjackGame=e,this.systemsView.setBlackjackGame(e)}setSettings(e){this.settings=e,this.systemsView.setSettings(e),this.settings&&this.settings.setStargateInterface(this)}setupStargateUI(){this.terminalView.createStyles(),this.terminalView.createDockingPrompt();const e=this.terminalView.createMainUI();e.innerHTML=this.terminalView.getMainUIContent(),document.body.appendChild(e)}showDockingPrompt(){this.terminalView.showDockingPrompt()}hideDockingPrompt(){this.terminalView.hideDockingPrompt()}showStargateUI(){const e=document.getElementById("stargate-ui");e&&(console.log("Showing stargate UI on "+(this.isMobile?"mobile":"desktop")),e.style.display="block",e.style.backgroundColor="rgba(20, 30, 50, 0.9)",this.isMobile&&c.configureMobileUI(e,this.isMobile)),this.hideDockingPrompt(),this.systemsView.setupAllSystemButtons(),this.isMobile&&this.eventHandlers.setupTouchEvents();const t=c.syncWithGameResources();t&&this.updateStargateUI(t.spaceship,t.resources)}hideStargateUI(){const e=document.getElementById("stargate-ui");e&&(e.style.display="none")}hide(){this.hideStargateUI()}updateStargateUI(e,t){this.tradingView.setGameReferences(e,t),this.upgradesView.setSpaceship(e),c.updateResourceDisplays(t),c.updateCreditsDisplay(e),c.updateStatusGauges(e),c.updateServiceButtons(e),this.upgradesView.updateUpgradeDisplays(),this.tradingView.updateResourceSellButtons(),this.tradingView.updateOrbCounts(),this.tradingView.updateOrbSellButtons(),this.tradingView.updateLaserTurretDisplay()}setupEventHandlers(){const e=()=>{const t=c.syncWithGameResources();t&&this.updateStargateUI(t.spaceship,t.resources)};this.eventHandlers.setupOrbSellHandlers(e),this.eventHandlers.setupLaserPurchaseHandler(e),this.missionsView.setupHordeButton()}}export{q as StargateInterface};
//# sourceMappingURL=stargateInterface-oDq5uNE_.js.map
