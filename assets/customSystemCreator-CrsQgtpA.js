var g=Object.defineProperty;var f=(d,e,t)=>e in d?g(d,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):d[e]=t;var a=(d,e,t)=>f(d,typeof e!="symbol"?e+"":e,t);class v{constructor(){a(this,"apiBaseUrl");a(this,"token");a(this,"tokenExpiry");a(this,"clientId");a(this,"isRefreshing");a(this,"refreshCallbacks");this.apiBaseUrl=this.getApiBaseUrl(),this.token=null,this.tokenExpiry=null,this.clientId="game_client",this.isRefreshing=!1,this.refreshCallbacks=[],console.log(`API Client initialized with base URL: ${this.apiBaseUrl}`)}getApiBaseUrl(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?"http://localhost:8001":"https://aminer-skybox-generator-833fe937a945.herokuapp.com"}hasValidToken(){if(!this.token||!this.tokenExpiry)return!1;const e=new Date(this.tokenExpiry).getTime(),t=new Date().getTime(),s=5*60*1e3;return e-t>s}clearToken(){this.token=null,this.tokenExpiry=null}async getToken(){if(this.isRefreshing)return new Promise(e=>{this.refreshCallbacks.push(t=>e(t))});this.isRefreshing=!0;try{const e=await fetch(`${this.apiBaseUrl}/token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:this.clientId})});if(!e.ok){const r=(await e.json()).detail||"Failed to get token";throw console.error(`Token error (${e.status}): ${r}`),this.refreshCallbacks.forEach(n=>n(!1)),this.refreshCallbacks=[],this.isRefreshing=!1,new Error(r)}const t=await e.json();this.token=t.access_token;const s=new Date;return s.setHours(s.getHours()+1),this.tokenExpiry=s.toISOString(),this.refreshCallbacks.forEach(i=>i(!0)),this.refreshCallbacks=[],this.isRefreshing=!1,!0}catch(e){return console.error("Error getting token:",e),this.refreshCallbacks.forEach(t=>t(!1)),this.refreshCallbacks=[],this.isRefreshing=!1,!1}}async handleApiResponse(e){if(e.status===401){if(this.clearToken(),!await this.getToken())throw new Error("Authentication failed. Please reload the application.");return!1}if(e.status===429)throw new Error("Rate limit exceeded. Please try again later.");if(!e.ok){const t=await e.json();throw new Error(t.message||t.detail||`Error: ${e.status} ${e.statusText}`)}return!0}async generateSkybox(e,t){if(!this.hasValidToken()&&!await this.getToken())throw new Error("Failed to authenticate with the API");const s=await fetch(`${this.apiBaseUrl}/generate-skybox`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.token}`},body:JSON.stringify({system_name:e,skybox_description:t})});return await this.handleApiResponse(s)?await s.json():this.generateSkybox(e,t)}async generatePlanet(e,t){if(!this.hasValidToken()&&!await this.getToken())throw new Error("Failed to authenticate with the API");const s=await fetch(`${this.apiBaseUrl}/generate-planet`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.token}`},body:JSON.stringify({planet_name:e,planet_description:t})});return await this.handleApiResponse(s)?await s.json():this.generatePlanet(e,t)}getFullImageUrl(e){if(e.startsWith("http"))return e;const t=e.startsWith("/")?e.substring(1):e;return`${this.apiBaseUrl}/${t}`}}class b{constructor(e=!1){a(this,"isMobile");a(this,"stylesInjected");this.isMobile=e,this.stylesInjected=!1}injectStyles(){this.stylesInjected||(this.injectBaseStyles(),this.isMobile&&this.injectMobileStyles(),this.stylesInjected=!0)}injectBaseStyles(){if(!document.getElementById("custom-system-creator-styles")){const e=document.createElement("style");e.id="custom-system-creator-styles",e.textContent=`
                .property-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .property-row label {
                    flex: 0 0 150px;
                    margin-right: 10px;
                }

                .property-row .slider {
                    flex: 1;
                    height: 10px;
                    background: #2a2a2a;
                    outline: none;
                    border-radius: 5px;
                }

                .property-row .slider-value {
                    flex: 0 0 60px;
                    margin-left: 10px;
                    text-align: right;
                }

                .planet-properties {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 10px;
                    margin-bottom: 15px;
                }

                .help-text {
                    font-size: 12px;
                    color: #aaa;
                    margin-top: 5px;
                }

                select.form-control {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    background: #25303e;
                    color: white;
                    border: 1px solid #3a5472;
                }

                /* Active slider styles */
                .slider-active {
                    background: #3a5472 !important;
                }

                /* Add smooth transitions */
                #custom-system-creator button {
                    transition: all 0.2s ease;
                }

                #custom-system-creator button:active {
                    transform: scale(0.95);
                }

                /* Modal open styles */
                .modal-open {
                    overflow: hidden;
                    position: fixed;
                    width: 100%;
                    height: 100%;
                }
            `,document.head.appendChild(e)}}injectMobileStyles(){if(!document.getElementById("custom-system-creator-mobile-styles")){const e=document.createElement("style");e.id="custom-system-creator-mobile-styles",e.innerHTML=`
                @media (max-width: 900px) {
                    /* Mobile-specific styles for CustomSystemCreator */
                    #custom-system-creator .modal-content {
                        border-radius: 10px;
                        padding-bottom: 120px;
                    }

                    #custom-system-creator .form-group {
                        margin-bottom: 24px;
                    }

                    #custom-system-creator label {
                        font-size: 16px;
                        margin-bottom: 10px;
                        display: block;
                    }

                    #custom-system-creator .property-row {
                        flex-direction: column;
                        align-items: flex-start;
                        margin-bottom: 20px;
                    }

                    #custom-system-creator .property-row label {
                        margin-bottom: 10px;
                        width: 100%;
                    }

                    #custom-system-creator .slider {
                        width: 100%;
                        margin: 10px 0;
                    }

                    #custom-system-creator .slider-value {
                        margin-top: 5px;
                        align-self: flex-end;
                    }

                    #custom-system-creator .planet-input {
                        padding: 20px;
                        margin-bottom: 30px;
                    }

                    #custom-system-creator input[type="text"],
                    #custom-system-creator textarea,
                    #custom-system-creator select {
                        font-size: 16px !important;
                        padding: 14px !important;
                    }

                    #custom-system-creator .planet-preview {
                        flex: 0 0 100%;
                        margin-bottom: 15px;
                    }

                    #custom-system-creator .form-actions {
                        text-align: center;
                    }

                    /* Better slider for touch */
                    #custom-system-creator input[type="range"] {
                        -webkit-appearance: none;
                        height: 30px;
                        background: #0d1e2f;
                        border-radius: 15px;
                        padding: 0;
                        outline: none;
                    }

                    #custom-system-creator input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: #4a9dff;
                        cursor: pointer;
                    }

                    #custom-system-creator input[type="range"]::-moz-range-thumb {
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: #4a9dff;
                        cursor: pointer;
                        border: none;
                    }

                    /* Touch ripple effect for buttons */
                    .ripple {
                        position: relative;
                        overflow: hidden;
                        transform: translate3d(0, 0, 0);
                    }

                    .ripple:after {
                        content: "";
                        display: block;
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        top: 0;
                        left: 0;
                        pointer-events: none;
                        background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
                        background-repeat: no-repeat;
                        background-position: 50%;
                        transform: scale(10, 10);
                        opacity: 0;
                        transition: transform .5s, opacity 1s;
                    }

                    .ripple:active:after {
                        transform: scale(0, 0);
                        opacity: .3;
                        transition: 0s;
                    }

                    /* Character counter for text areas */
                    .char-counter {
                        font-size: 12px;
                        color: #aaa;
                        text-align: right;
                        margin-top: 5px;
                    }

                    .char-counter.warning {
                        color: #ff9900;
                    }

                    .char-counter.error {
                        color: #ff3030;
                    }
                }
            `,document.head.appendChild(e)}}getMobileStyles(e){const t={modalContent:this.isMobile?"width: 94%; max-height: 85vh; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: 100px; overscroll-behavior: contain;":"",closeBtn:this.isMobile?"font-size: 28px; padding: 12px; min-height: 48px; min-width: 48px;":"",modalBody:this.isMobile?"padding-bottom: 150px;":"",input:this.isMobile?"font-size: 16px; padding: 14px; height: 48px;":"",textarea:this.isMobile?"font-size: 16px; padding: 14px;":"",select:this.isMobile?"font-size: 16px; padding: 14px; height: 48px;":"",slider:this.isMobile?"height: 30px; margin: 10px 0;":"",checkbox:this.isMobile?"transform: scale(1.7); margin: 0 15px; min-height: 24px; min-width: 24px;":"",checkboxRow:this.isMobile?"margin-top: 15px;":"",primaryBtn:this.isMobile?"min-height: 54px; padding: 16px; font-size: 18px; margin-top: 20px; width: 100%;":"",secondaryBtn:this.isMobile?"min-height: 50px; padding: 14px; font-size: 16px; width: 100%; margin: 15px 0;":"",removeBtn:this.isMobile?"min-height: 50px; padding: 14px; font-size: 16px; right: 15px; top: 15px;":"",previewContainer:this.isMobile?"flex-direction: column;":"",skyboxPreview:this.isMobile?"width: 100%; margin-bottom: 20px;":"",planetsPreview:this.isMobile?"width: 100%;":"",formActions:this.isMobile?"padding-bottom: 30px;":""};return e?{[e]:t[e]}:t}getTextareaRows(e){return this.isMobile?Math.max(2,e-1):e}cleanup(){["custom-system-creator-styles","custom-system-creator-mobile-styles","modal-open-style"].forEach(t=>{const s=document.getElementById(t);s&&s.remove()}),this.stylesInjected=!1}}class w{constructor(e=!1){a(this,"isMobile");this.isMobile=e}validateSystemForm(e,t){const s=e.value.trim(),i=t.value.trim();return s?i?s.length<3?{isValid:!1,message:"System name must be at least 3 characters long."}:i.length<10?{isValid:!1,message:"Skybox description must be at least 10 characters long."}:{isValid:!0}:{isValid:!1,message:"Please enter a skybox description."}:{isValid:!1,message:"Please enter a system name."}}validatePlanetData(e,t){const s=e.querySelector('input[id^="planet-name-"]'),i=e.querySelector('textarea[id^="planet-description-"]');if(!s||!i)return{isValid:!1,message:`Planet ${t} is missing required fields.`};const r=s.value.trim(),n=i.value.trim();return r?n?r.length<2?{isValid:!1,message:`Planet ${t} name must be at least 2 characters long.`}:n.length<5?{isValid:!1,message:`Planet ${t} description must be at least 5 characters long.`}:{isValid:!0}:{isValid:!1,message:`Please enter a description for Planet ${t}.`}:{isValid:!1,message:`Please enter a name for Planet ${t}.`}}collectPlanetData(e){const t=[],s=[];for(let i=0;i<e.length;i++){const r=e[i],n=i+1,o=this.validatePlanetData(r,n);if(!o.isValid){o.message&&s.push(o.message);continue}const l=r.querySelector('input[id^="planet-name-"]'),c=r.querySelector('textarea[id^="planet-description-"]'),m=r.querySelector('input[id^="planet-size-"]'),u=r.querySelector('input[id^="planet-distance-"]'),h=r.querySelector('input[id^="planet-speed-"]'),p=r.querySelector('input[id^="planet-rings-"]');if(!l||!c||!m||!u||!h||!p){s.push(`Planet ${n} is missing required input fields.`);continue}const y=.001+(parseFloat(h.value)-1)*(.001/9);t.push({name:l.value.trim(),description:c.value.trim(),size:parseInt(m.value),distance:parseInt(u.value),speed:y,rings:p.checked})}return{planets:t,errors:s}}addCharacterCounter(e,t){var r;if(!e||!this.isMobile)return;const s=document.createElement("div");s.className="char-counter";const i=()=>{const n=t-e.value.length;s.textContent=`${n} characters remaining`,s.className="char-counter",n<30&&s.classList.add("warning"),n<10&&s.classList.add("error"),n<0&&(e.value=e.value.substring(0,t),s.textContent="0 characters remaining")};e.addEventListener("input",i),e.addEventListener("keydown",n=>{e.value.length>=t&&n.key!=="Backspace"&&n.key!=="Delete"&&n.key!=="ArrowLeft"&&n.key!=="ArrowRight"&&!n.ctrlKey&&!n.metaKey&&n.preventDefault()}),i(),(r=e.parentNode)==null||r.insertBefore(s,e.nextSibling),e.setAttribute("maxlength",t.toString())}setupCharacterCounters(e,t){if(!this.isMobile)return;this.addCharacterCounter(e,250);const s=document.getElementById("planet-description-1");s&&this.addCharacterCounter(s,150)}validatePlanetCount(e){return e.length===0?{isValid:!1,message:"Please add at least one planet to your system."}:e.length>8?{isValid:!1,message:"Maximum of 8 planets allowed per system."}:{isValid:!0}}showMobileAlert(e,t=null){if(this.isMobile){const s=document.createElement("div");s.style.position="fixed",s.style.top="0",s.style.left="0",s.style.width="100%",s.style.height="100%",s.style.backgroundColor="rgba(0, 0, 0, 0.7)",s.style.display="flex",s.style.justifyContent="center",s.style.alignItems="center",s.style.zIndex="10000";const i=document.createElement("div");i.style.backgroundColor="#0a1a2a",i.style.color="#c5d8f1",i.style.padding="20px",i.style.borderRadius="10px",i.style.maxWidth="80%",i.style.textAlign="center",i.style.border="2px solid #2c5a8c";const r=document.createElement("p");r.textContent=e,r.style.marginBottom="20px",r.style.fontSize="16px";const n=document.createElement("button");n.textContent="OK",n.style.padding="12px 30px",n.style.fontSize="16px",n.style.backgroundColor="#2c5a8c",n.style.color="white",n.style.border="none",n.style.borderRadius="5px",n.style.minHeight="48px",n.style.minWidth="120px",i.appendChild(r),i.appendChild(n),s.appendChild(i),document.body.appendChild(s),t&&t(),n.addEventListener("click",()=>{document.body.removeChild(s)}),n.addEventListener("touchend",o=>{o.preventDefault(),document.body.removeChild(s),t&&t()})}else alert(e)}}class S{constructor(){a(this,"starClasses");a(this,"planetDefaults");this.starClasses=this.getStarClasses(),this.planetDefaults=this.getPlanetDefaults()}getStarClasses(){return[{value:"O",label:"O - Blue Giant (Hot, Blue)",color:10203391},{value:"B",label:"B - Blue-White",color:11190271},{value:"A",label:"A - White",color:13293567},{value:"F",label:"F - Yellow-White",color:16316415},{value:"G",label:"G - Yellow (Sun-like)",color:16774378,selected:!0},{value:"K",label:"K - Orange",color:16765601},{value:"M",label:"M - Red Dwarf",color:16764015}]}getPlanetDefaults(){return{size:{min:300,max:1e3,default:450},distance:{min:4e3,max:6e4,default:8e3},speed:{min:1,max:10,default:5},rings:!1}}getStarColorForClass(e){const t=this.starClasses.find(s=>s.value===e);return t?t.color:16774378}createSystemData(e,t,s,i,r=.8){return{id:`Custom-${Date.now()}`,name:e,starClass:t,classification:"Custom",description:`Custom star system with ${i.length} planets`,skyboxUrl:s,lightIntensityMultiplier:r,planetData:i.map(n=>({name:n.name,textureUrl:n.textureUrl||null,size:n.size,distance:n.distance,speed:n.speed,color:this.getStarColorForClass(t),rings:n.rings}))}}calculatePlanetDistance(e,t=4e3,s=6e3){return t+e*s}convertSpeedSliderToOrbitSpeed(e){return .001+(e-1)*(.001/9)}getDefaultPlanetData(e){return{name:"",description:"",size:this.planetDefaults.size.default,distance:this.calculatePlanetDistance(e),speed:this.convertSpeedSliderToOrbitSpeed(this.planetDefaults.speed.default),rings:this.planetDefaults.rings}}getSystemPresets(){return{solar:{name:"Sol System",starClass:"G",skyboxDescription:"Deep space with distant stars and nebulae",planets:[{name:"Mercury",description:"A small, rocky planet closest to the star",size:350,distance:4e3,speed:.002,rings:!1},{name:"Venus",description:"A hot, cloudy planet with a thick atmosphere",size:420,distance:6e3,speed:.0018,rings:!1},{name:"Earth",description:"A blue planet with oceans and continents",size:450,distance:8e3,speed:.0015,rings:!1}]},binary:{name:"Binary System",starClass:"F",skyboxDescription:"A system with twin stars casting complex shadows",planets:[{name:"Proxima",description:"A tidally locked world with extreme temperature differences",size:380,distance:12e3,speed:.001,rings:!1},{name:"Gemini Prime",description:"A large gas giant with spectacular ring systems",size:800,distance:25e3,speed:8e-4,rings:!0}]},exotic:{name:"Exotic System",starClass:"O",skyboxDescription:"A violent nebula with intense radiation and stellar phenomena",planets:[{name:"Crystalline",description:"A planet of living crystal formations and energy storms",size:600,distance:15e3,speed:.0012,rings:!0}]}}}validateSystemData(e){var s;const t=[];return(!e.name||e.name.trim().length<3)&&t.push("System name must be at least 3 characters long"),(!e.starClass||!this.starClasses.find(i=>i.value===e.starClass))&&t.push("Invalid star class selected"),(!e.planetData||e.planetData.length===0)&&t.push("System must have at least one planet"),e.planetData&&e.planetData.length>8&&t.push("System cannot have more than 8 planets"),(s=e.planetData)==null||s.forEach((i,r)=>{(!i.name||i.name.trim().length<2)&&t.push(`Planet ${r+1} name must be at least 2 characters long`),(i.size<this.planetDefaults.size.min||i.size>this.planetDefaults.size.max)&&t.push(`Planet ${r+1} size must be between ${this.planetDefaults.size.min} and ${this.planetDefaults.size.max}`),(i.distance<this.planetDefaults.distance.min||i.distance>this.planetDefaults.distance.max)&&t.push(`Planet ${r+1} distance must be between ${this.planetDefaults.distance.min} and ${this.planetDefaults.distance.max}`)}),{isValid:t.length===0,errors:t}}}class x{constructor(e=!1,t=null){a(this,"isMobile");a(this,"styleManager");a(this,"scrollTimeout");a(this,"validationManager");this.isMobile=e,this.styleManager=t,this.scrollTimeout=null,this.validationManager=null}createMainContainer(){const e=document.createElement("div");return e.id="custom-system-creator",e.className="modal-container",e.style.display="none",e}createModalContent(){var t;const e=((t=this.styleManager)==null?void 0:t.getMobileStyles())||{};return`
            <div class="modal-content" style="${e.modalContent||""}">
                <div class="modal-header">
                    <h2>Create New Star System</h2>
                    <button id="close-system-creator" class="close-btn" style="${e.closeBtn||""}">&times;</button>
                </div>
                <div class="modal-body" style="${e.modalBody||""}">
                    <div id="system-creator-form">
                        ${this.createSystemForm()}
                        ${this.createPlanetSection()}
                        ${this.createFormActions()}
                    </div>
                    ${this.createProgressSection()}
                    ${this.createPreviewSection()}
                </div>
            </div>
        `}createSystemForm(){var t,s;const e=((t=this.styleManager)==null?void 0:t.getMobileStyles())||{};return`
            <div class="form-group">
                <label for="system-name">System Name:</label>
                <input type="text" id="system-name" placeholder="Enter a name for your star system" style="${e.input||""}">
            </div>

            <div class="form-group">
                <label for="skybox-description">Skybox Description:</label>
                <textarea id="skybox-description" rows="${((s=this.styleManager)==null?void 0:s.getTextareaRows(4))||4}" placeholder="Describe the skybox/space environment (e.g., 'A vibrant nebula with blue and purple clouds, dotted with bright stars')" style="${e.textarea||""}"></textarea>
            </div>

            <div class="form-group">
                <label for="star-class">Star Class:</label>
                <select id="star-class" class="form-control" style="${e.select||""}">
                    <option value="O">O - Blue Giant (Hot, Blue)</option>
                    <option value="B">B - Blue-White</option>
                    <option value="A">A - White</option>
                    <option value="F">F - Yellow-White</option>
                    <option value="G" selected>G - Yellow (Sun-like)</option>
                    <option value="K">K - Orange</option>
                    <option value="M">M - Red Dwarf</option>
                </select>
                <p class="help-text">Different star classes affect the lighting and appearance of your system.</p>
            </div>
        `}createPlanetSection(){var t;const e=((t=this.styleManager)==null?void 0:t.getMobileStyles())||{};return`
            <div id="planet-descriptions">
                <div class="form-group planet-input">
                    ${this.createPlanetForm(1,e)}
                </div>
            </div>

            <button id="add-planet-btn" class="secondary-btn" style="${e.secondaryBtn||""}">+ Add Another Planet</button>
        `}createPlanetForm(e,t={}){var s;return`
            <h3>Planet ${e}</h3>
            <label for="planet-name-${e}">Planet Name:</label>
            <input type="text" id="planet-name-${e}" placeholder="Enter a name for this planet" style="${t.input||""}">

            <label for="planet-description-${e}">Planet Description:</label>
            <textarea id="planet-description-${e}" rows="${((s=this.styleManager)==null?void 0:s.getTextareaRows(3))||3}" placeholder="Describe the planet (e.g., 'A rocky planet with large oceans and ice caps')" style="${t.textarea||""}" maxlength="150"></textarea>

            <div class="planet-properties">
                ${this.createPlanetSliders(e,t)}
                ${this.createPlanetRings(e,t)}
            </div>

            ${e>1?this.createRemoveButton(t):""}
        `}createPlanetSliders(e,t={}){return`
            <div class="property-row">
                <label for="planet-size-${e}">Size:</label>
                <input type="range" id="planet-size-${e}" min="300" max="1000" value="450" class="slider" style="${t.slider||""}">
                <span class="slider-value" id="planet-size-value-${e}">450</span>
            </div>

            <div class="property-row">
                <label for="planet-distance-${e}">Distance from Star:</label>
                <input type="range" id="planet-distance-${e}" min="4000" max="60000" value="${4e3+e*6e3}" class="slider" style="${t.slider||""}">
                <span class="slider-value" id="planet-distance-value-${e}">${4e3+e*6e3}</span>
            </div>

            <div class="property-row">
                <label for="planet-speed-${e}">Orbit Speed:</label>
                <input type="range" id="planet-speed-${e}" min="1" max="10" value="5" class="slider" style="${t.slider||""}">
                <span class="slider-value" id="planet-speed-value-${e}">0.0015</span>
            </div>
        `}createPlanetRings(e,t={}){return`
            <div class="property-row" style="${t.checkboxRow||""}">
                <label for="planet-rings-${e}">Has Rings:</label>
                <input type="checkbox" id="planet-rings-${e}" style="${t.checkbox||""}">
            </div>
        `}createRemoveButton(e={}){return`<button class="remove-planet-btn danger-btn ${this.isMobile?"ripple":""}" style="${e.removeBtn||""}">Remove</button>`}createFormActions(){var t;return`
            <div class="form-actions">
                <button id="generate-system-btn" class="primary-btn" style="${(((t=this.styleManager)==null?void 0:t.getMobileStyles())||{}).primaryBtn||""}">Generate System</button>
            </div>
        `}createProgressSection(){return`
            <div id="generation-progress" style="display: none;">
                <h3>Generating your star system...</h3>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p id="generation-status">Initializing...</p>
            </div>
        `}createPreviewSection(){var t;const e=((t=this.styleManager)==null?void 0:t.getMobileStyles())||{};return`
            <div id="system-preview" style="display: none;">
                <h3>Preview</h3>
                <div class="preview-container" style="${e.previewContainer||""}">
                    <div class="skybox-preview" style="${e.skyboxPreview||""}">
                        <h4>Skybox</h4>
                        <img id="skybox-preview-img" src="" alt="Skybox Preview">
                    </div>
                    <div class="planets-preview" id="planets-preview" style="${e.planetsPreview||""}">
                        <!-- Planet previews will be added here dynamically -->
                    </div>
                </div>
                <div class="form-actions" style="${e.formActions||""}">
                    <button id="travel-to-system-btn" class="primary-btn" style="${e.primaryBtn||""}">Travel to System</button>
                    <button id="regenerate-system-btn" class="secondary-btn" style="${e.secondaryBtn||""}">Regenerate</button>
                </div>
            </div>
        `}addPlanetInput(e,t,s,i){var m;const n=e.getElementsByClassName("planet-input").length+1,o=((m=this.styleManager)==null?void 0:m.getMobileStyles())||{},l=document.createElement("div");l.className="form-group planet-input",l.innerHTML=this.createPlanetForm(n,o),e.appendChild(l),t(n);const c=l.querySelector(".remove-planet-btn");return c&&this.setupRemoveButton(c,l,s,i),this.isMobile&&this.enhanceMobileInteraction(l),this.scrollToNewPlanet(e),l}setupRemoveButton(e,t,s,i){const r=n=>{n&&n.preventDefault(),t.remove(),s(),i&&i()};e.addEventListener("click",r),this.isMobile&&e.addEventListener("touchend",r)}enhanceMobileInteraction(e){e.querySelectorAll('input[type="range"]').forEach(i=>{i.addEventListener("touchstart",()=>{i.classList.add("slider-active")}),i.addEventListener("touchend",()=>{i.classList.remove("slider-active")})});const s=e.querySelector('textarea[id^="planet-description-"]');s&&this.validationManager&&this.validationManager.addCharacterCounter(s,150)}scrollToNewPlanet(e){this.isMobile&&(this.scrollTimeout&&clearTimeout(this.scrollTimeout),this.scrollTimeout=setTimeout(()=>{try{const t=document.querySelector("#custom-system-creator .modal-content"),s=e.lastElementChild;if(t&&s){const r=s.offsetTop-t.clientHeight/4;t.scrollTo({top:r,behavior:"smooth"})}}catch(t){console.warn("Error during scroll:",t)}},100))}updatePlanetNumbers(e){const t=e.getElementsByClassName("planet-input");for(let s=0;s<t.length;s++){const r=t[s].querySelector("h3");r&&(r.textContent=`Planet ${s+1}`)}}addRippleEffect(e){if(!this.isMobile)return;e.querySelectorAll("button").forEach(s=>{s.classList.contains("ripple")||s.classList.add("ripple")})}setupSliderListeners(e){const t=document.getElementById(`planet-size-${e}`),s=document.getElementById(`planet-size-value-${e}`);t&&s&&t.addEventListener("input",()=>{s.textContent=t.value});const i=document.getElementById(`planet-distance-${e}`),r=document.getElementById(`planet-distance-value-${e}`);i&&r&&i.addEventListener("input",()=>{r.textContent=i.value});const n=document.getElementById(`planet-speed-${e}`),o=document.getElementById(`planet-speed-value-${e}`);n&&o&&n.addEventListener("input",()=>{const l=.001+(parseFloat(n.value)-1)*.00011111111111111112;o.textContent=l.toFixed(4)}),this.isMobile&&[t,i,n].filter(c=>c!==null).forEach(c=>{c.addEventListener("touchstart",()=>{c.classList.add("slider-active")}),c.addEventListener("touchend",()=>{c.classList.remove("slider-active")})})}cleanup(){this.scrollTimeout&&(clearTimeout(this.scrollTimeout),this.scrollTimeout=null)}}class E{constructor(e=!1){a(this,"isMobile");this.isMobile=e}showSystemPreview(e,t,s){this.updateSkyboxPreview(e,s),this.updatePlanetPreviews(t,s),this.showPreviewUI()}updateSkyboxPreview(e,t){const s=document.getElementById("skybox-preview-img");s&&e&&t&&(s.src=t.getFullImageUrl(e))}updatePlanetPreviews(e,t){const s=document.getElementById("planets-preview");s&&(s.innerHTML="",!(!e||!Array.isArray(e))&&e.forEach(i=>{const r=document.createElement("div");r.className="planet-preview";const n=t&&i.url?t.getFullImageUrl(i.url):i.url||"";r.innerHTML=`
                <h4>${i.name||"Unknown Planet"}</h4>
                <img src="${n}" alt="${i.name||"Planet"}" loading="lazy">
            `,s.appendChild(r)}))}showPreviewUI(){const e=document.getElementById("generation-progress"),t=document.getElementById("system-preview");e&&(e.style.display="none"),t&&(t.style.display="block"),this.isMobile&&setTimeout(()=>{t&&t.scrollIntoView({behavior:"smooth",block:"start"})},50)}hidePreview(){const e=document.getElementById("system-preview"),t=document.getElementById("system-creator-form");e&&(e.style.display="none"),t&&(t.style.display="block")}showProgress(e="Initializing..."){const t=document.getElementById("system-creator-form"),s=document.getElementById("generation-progress"),i=document.getElementById("generation-status");t&&(t.style.display="none"),s&&(s.style.display="block"),i&&(i.textContent=e)}hideProgress(){const e=document.getElementById("generation-progress"),t=document.getElementById("system-creator-form");e&&(e.style.display="none"),t&&(t.style.display="block")}updateGenerationStatus(e){const t=document.getElementById("generation-status");t&&(t.textContent=e,console.log("Generation status:",e))}createPlanetPreviewElement(e,t){const s=document.createElement("div");s.className="planet-preview";const i=t&&e.url?t.getFullImageUrl(e.url):e.url||"",r=document.createElement("img");r.src=i,r.alt=e.name||"Planet",r.loading="lazy",r.onerror=()=>{r.style.display="none";const o=document.createElement("div");o.className="image-error",o.textContent="Image failed to load",o.style.padding="20px",o.style.textAlign="center",o.style.color="#999",s.appendChild(o)};const n=document.createElement("h4");return n.textContent=e.name||"Unknown Planet",s.appendChild(n),s.appendChild(r),s}clearPreviews(){const e=document.getElementById("skybox-preview-img"),t=document.getElementById("planets-preview");e&&(e.src=""),t&&(t.innerHTML="")}isPreviewVisible(){const e=document.getElementById("system-preview");return e!==null&&e.style.display!=="none"}isProgressVisible(){const e=document.getElementById("generation-progress");return e!==null&&e.style.display!=="none"}resetToForm(){this.hidePreview(),this.hideProgress(),this.clearPreviews()}}class M{constructor(e,t=!1){a(this,"customSystemCreator");a(this,"isMobile");a(this,"handlers");this.customSystemCreator=e,this.isMobile=t,this.handlers=new Map}setupAllEventHandlers(e,t){this.setupCloseHandlers(t.closeBtn),this.setupFormHandlers(t),this.setupKeyboardHandlers(),this.setupContainerHandlers(e),this.isMobile&&this.setupMobileHandlers(e,t)}setupCloseHandlers(e){const t=s=>{s&&s.preventDefault(),this.customSystemCreator.hide(),this.customSystemCreator.playUISound()};e.addEventListener("click",t),this.isMobile&&e.addEventListener("touchend",t)}setupFormHandlers(e){const t=n=>{n&&n.preventDefault(),this.customSystemCreator.addPlanetInput(),this.customSystemCreator.playUISound()};e.addPlanetBtn.addEventListener("click",t),this.isMobile&&e.addPlanetBtn.addEventListener("touchend",t);const s=n=>{n&&n.preventDefault(),this.customSystemCreator.generateSystem(),this.customSystemCreator.playUISound()};e.generateSystemBtn.addEventListener("click",s),this.isMobile&&e.generateSystemBtn.addEventListener("touchend",s);const i=n=>{n&&n.preventDefault(),this.customSystemCreator.travelToSystem(),this.customSystemCreator.playUISound()};e.travelToSystemBtn.addEventListener("click",i),this.isMobile&&e.travelToSystemBtn.addEventListener("touchend",i);const r=n=>{n&&n.preventDefault(),e.systemPreview.style.display="none",e.systemForm.style.display="block",this.customSystemCreator.playUISound()};e.regenerateSystemBtn.addEventListener("click",r),this.isMobile&&e.regenerateSystemBtn.addEventListener("touchend",r)}setupKeyboardHandlers(){const e=t=>{t.key==="Escape"&&this.customSystemCreator.isVisible&&this.customSystemCreator.hide()};document.addEventListener("keydown",e),this.handlers.set("escape",e)}setupContainerHandlers(e){const t=s=>{s.target===e&&this.customSystemCreator.hide()};e.addEventListener("click",t),this.handlers.set("clickOutside",t)}setupMobileHandlers(e,t){const s=r=>{r.target===e&&(r.preventDefault(),this.customSystemCreator.hide())};e.addEventListener("touchstart",s,{passive:!1}),this.handlers.set("touchClose",s),e.addEventListener("touchmove",r=>{r.stopPropagation()},{passive:!0});const i=e.querySelector(".modal-content");i&&(i.addEventListener("touchstart",()=>{},{passive:!0}),i.addEventListener("touchmove",()=>{},{passive:!0})),this.setupBodyScrollPrevention()}setupBodyScrollPrevention(){const e=t=>{this.customSystemCreator.isVisible&&t.preventDefault()};document.body.addEventListener("touchmove",e,{passive:!1}),this.handlers.set("preventScroll",e)}setupSliderHandlers(e,t){t&&typeof t.setupSliderListeners=="function"&&t.setupSliderListeners(e)}setupRemoveButtonHandler(e,t,s){const i=r=>{r&&r.preventDefault(),t.remove(),s(),this.customSystemCreator.playUISound()};e.addEventListener("click",i),this.isMobile&&(e.addEventListener("touchend",i),t.querySelectorAll('input[type="range"]').forEach(n=>{n.addEventListener("touchstart",()=>{n.classList.add("slider-active")}),n.addEventListener("touchend",()=>{n.classList.remove("slider-active")})}))}addDynamicEventHandlers(e,t={}){Object.entries(t).forEach(([s,i])=>{typeof i=="function"&&(e.addEventListener(s,i),this.handlers.has(e)||this.handlers.set(e,new Map),this.handlers.get(e).set(s,i))})}removeDynamicEventHandlers(e){this.handlers.has(e)&&(this.handlers.get(e).forEach((s,i)=>{e.removeEventListener(i,s)}),this.handlers.delete(e))}cleanup(){this.handlers.forEach((e,t)=>{if(typeof t=="string")switch(t){case"escape":document.removeEventListener("keydown",e);break;case"preventScroll":document.body.removeEventListener("touchmove",e);break}else t instanceof Element&&(e instanceof Map?e.forEach((s,i)=>{t.removeEventListener(i,s)}):(t.removeEventListener("click",e),t.removeEventListener("touchend",e),t.removeEventListener("touchstart",e),t.removeEventListener("touchmove",e)))}),this.handlers.clear()}addMobileFriendlyListener(e,t,s,i={}){const r=o=>{this.isMobile&&o.type==="touchend"&&o.preventDefault(),s(o)};return e.addEventListener(t,r,i),this.isMobile&&t==="click"&&e.addEventListener("touchend",r,i),this.handlers.has(e)||this.handlers.set(e,new Map),this.handlers.get(e).set(t,r),r}setupValidationHandlers(e,t){t&&(e.systemNameInput.addEventListener("blur",()=>{const s=t.validateSystemForm(e.systemNameInput,e.skyboxDescription);!s.isValid&&e.systemNameInput.value.trim()?this.showFieldError(e.systemNameInput,s.message||""):this.clearFieldError(e.systemNameInput)}),e.skyboxDescription.addEventListener("blur",()=>{const s=t.validateSystemForm(e.systemNameInput,e.skyboxDescription);!s.isValid&&e.skyboxDescription.value.trim()?this.showFieldError(e.skyboxDescription,s.message||""):this.clearFieldError(e.skyboxDescription)}))}showFieldError(e,t){var i;this.clearFieldError(e);const s=document.createElement("div");s.className="field-error",s.textContent=t,s.style.color="#ff3030",s.style.fontSize="12px",s.style.marginTop="5px",(i=e.parentNode)==null||i.insertBefore(s,e.nextSibling),e.style.borderColor="#ff3030"}clearFieldError(e){var s;const t=(s=e.parentNode)==null?void 0:s.querySelector(".field-error");t&&t.remove(),e.style.borderColor=""}}class k{constructor(){a(this,"scrollTimeout");this.scrollTimeout=null}detectMobile(){return"ontouchstart"in window||navigator.maxTouchPoints>0||navigator.msMaxTouchPoints>0||window.innerWidth<900}playUISound(){window.game&&window.game.audio&&window.game.audio.playSound("boink")}formatSliderValue(e,t="default"){switch(t){case"speed":return(.001+(e-1)*.00011111111111111112).toFixed(4);case"size":case"distance":return parseInt(e.toString()).toString();default:return e.toString()}}calculateDefaultDistance(e,t=4e3,s=6e3){return t+e*s}convertSpeedSliderValue(e){return .001+(e-1)*(.001/9)}cleanupScrolling(){this.scrollTimeout&&(clearTimeout(this.scrollTimeout),this.scrollTimeout=null)}safeScrollTo(e,t={}){e&&(this.cleanupScrolling(),this.scrollTimeout=setTimeout(()=>{try{typeof e.scrollIntoView=="function"&&e.scrollIntoView({behavior:"smooth",block:"start",...t})}catch(s){console.warn("Error during scroll:",s)}},100))}generateUniqueId(e="custom"){return`${e}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`}debounce(e,t,s=!1){let i;return function(...n){const o=()=>{i=null,s||e(...n)},l=s&&!i;i&&clearTimeout(i),i=setTimeout(o,t),l&&e(...n)}}throttle(e,t){let s;return function(...i){s||(e(...i),s=!0,setTimeout(()=>s=!1,t))}}sanitizeInput(e,t=null){if(typeof e!="string")return"";let s=e.trim();return t&&s.length>t&&(s=s.substring(0,t)),s}validateURL(e){try{return new URL(e),!0}catch{return!1}}formatFileSize(e){if(e===0)return"0 Bytes";const t=1024,s=["Bytes","KB","MB","GB"],i=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,i)).toFixed(2))+" "+s[i]}deepClone(e){if(e===null||typeof e!="object")return e;if(e instanceof Date)return new Date(e.getTime());if(e instanceof Array)return e.map(t=>this.deepClone(t));if(typeof e=="object"){const t={};return Object.keys(e).forEach(s=>{t[s]=this.deepClone(e[s])}),t}return e}createElement(e,t="",s="",i={}){const r=document.createElement(e);return t&&(r.className=t),s&&(r.textContent=s),Object.entries(i).forEach(([n,o])=>{r.setAttribute(n,o)}),r}removeElement(e){e&&e.parentNode&&e.parentNode.removeChild(e)}findElementById(e,t=document){return"getElementById"in t&&t.getElementById?t.getElementById(e):t.querySelector(`#${e}`)}findElementsByClass(e,t=document){return"getElementsByClassName"in t&&t.getElementsByClassName?Array.from(t.getElementsByClassName(e)):Array.from(t.querySelectorAll(`.${e}`))}addEventListenerSafe(e,t,s,i={}){return e&&typeof e.addEventListener=="function"?(e.addEventListener(t,s,i),!0):!1}removeEventListenerSafe(e,t,s,i={}){return e&&typeof e.removeEventListener=="function"?(e.removeEventListener(t,s,i),!0):!1}getElementDimensions(e){if(!e)return{width:0,height:0,top:0,left:0,bottom:0,right:0};const t=e.getBoundingClientRect();return{width:t.width,height:t.height,top:t.top,left:t.left,bottom:t.bottom,right:t.right}}isElementVisible(e){if(!e)return!1;const t=window.getComputedStyle(e);return t.display!=="none"&&t.visibility!=="hidden"&&t.opacity!=="0"}scrollToTop(e,t=!0){e&&(t&&e.scrollTo?e.scrollTo({top:0,behavior:"smooth"}):e.scrollTop=0)}addClassSafe(e,t){e&&e.classList&&e.classList.add(t)}removeClassSafe(e,t){e&&e.classList&&e.classList.remove(t)}toggleClassSafe(e,t){e&&e.classList&&e.classList.toggle(t)}hasClassSafe(e,t){return e!==null&&e.classList!==void 0&&e.classList.contains(t)}setStyleSafe(e,t,s){e&&e.style&&(e.style[t]=s)}getStyleSafe(e,t){return e&&e.style?e.style[t]:null}forceReflow(e){e&&e.offsetHeight}waitForElement(e,t=5e3){return new Promise((s,i)=>{const r=document.querySelector(e);if(r){s(r);return}const n=new MutationObserver((o,l)=>{const c=document.querySelector(e);c&&(l.disconnect(),s(c))});n.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{n.disconnect(),i(new Error(`Element ${e} not found within ${t}ms`))},t)})}async waitFor(e,t=5e3,s=100){const i=Date.now();for(;Date.now()-i<t;){if(e())return!0;await new Promise(r=>setTimeout(r,s))}throw new Error("Condition not met within timeout")}cleanup(){this.cleanupScrolling()}}class B{constructor(e,t){a(this,"starSystemGenerator");a(this,"environment");a(this,"apiClient");a(this,"isVisible");a(this,"isGenerating");a(this,"generatedSkyboxUrl");a(this,"generatedPlanetUrls");a(this,"systemData");a(this,"helpers");a(this,"isMobile");a(this,"styleManager");a(this,"validationManager");a(this,"systemDataManager");a(this,"formViewManager");a(this,"previewManager");a(this,"eventHandlerManager");a(this,"container");a(this,"systemNameInput");a(this,"skyboxDescription");a(this,"planetDescriptions");a(this,"addPlanetBtn");a(this,"generateSystemBtn");a(this,"generationProgress");a(this,"generationStatus");a(this,"systemForm");a(this,"systemPreview");a(this,"skyboxPreviewImg");a(this,"planetsPreview");a(this,"travelToSystemBtn");a(this,"regenerateSystemBtn");a(this,"closeBtn");this.starSystemGenerator=e,this.environment=t,this.apiClient=new v,this.isVisible=!1,this.isGenerating=!1,this.generatedSkyboxUrl=null,this.generatedPlanetUrls=[],this.systemData=null,this.helpers=new k,this.isMobile=this.helpers.detectMobile(),this.styleManager=new b(this.isMobile),this.validationManager=new w(this.isMobile),this.systemDataManager=new S,this.formViewManager=new x(this.isMobile,this.styleManager),this.previewManager=new E(this.isMobile),this.eventHandlerManager=new M(this,this.isMobile),this.container=null,this.systemNameInput=null,this.skyboxDescription=null,this.planetDescriptions=null,this.addPlanetBtn=null,this.generateSystemBtn=null,this.generationProgress=null,this.generationStatus=null,this.systemForm=null,this.systemPreview=null,this.skyboxPreviewImg=null,this.planetsPreview=null,this.travelToSystemBtn=null,this.regenerateSystemBtn=null,this.closeBtn=null,this.createUI(),this.setupEventHandlers(),this.setupSliderListeners(1)}createUI(){this.styleManager.injectStyles();const e=this.formViewManager.createMainContainer();e.innerHTML=this.formViewManager.createModalContent(),this.container=e,document.body.appendChild(e),this.captureElementReferences(),this.isMobile&&this.setupMobileEnhancements()}captureElementReferences(){this.systemNameInput=document.getElementById("system-name"),this.skyboxDescription=document.getElementById("skybox-description"),this.planetDescriptions=document.getElementById("planet-descriptions"),this.addPlanetBtn=document.getElementById("add-planet-btn"),this.generateSystemBtn=document.getElementById("generate-system-btn"),this.generationProgress=document.getElementById("generation-progress"),this.generationStatus=document.getElementById("generation-status"),this.systemForm=document.getElementById("system-creator-form"),this.systemPreview=document.getElementById("system-preview"),this.skyboxPreviewImg=document.getElementById("skybox-preview-img"),this.planetsPreview=document.getElementById("planets-preview"),this.travelToSystemBtn=document.getElementById("travel-to-system-btn"),this.regenerateSystemBtn=document.getElementById("regenerate-system-btn"),this.closeBtn=document.getElementById("close-system-creator")}setupMobileEnhancements(){this.container&&this.formViewManager.addRippleEffect(this.container),this.skyboxDescription&&this.planetDescriptions&&this.validationManager.setupCharacterCounters(this.skyboxDescription,this.planetDescriptions)}setupEventHandlers(){if(!this.container||!this.closeBtn||!this.addPlanetBtn||!this.generateSystemBtn||!this.travelToSystemBtn||!this.regenerateSystemBtn||!this.systemForm||!this.systemPreview||!this.systemNameInput||!this.skyboxDescription)return;const e={closeBtn:this.closeBtn,addPlanetBtn:this.addPlanetBtn,generateSystemBtn:this.generateSystemBtn,travelToSystemBtn:this.travelToSystemBtn,regenerateSystemBtn:this.regenerateSystemBtn,systemForm:this.systemForm,systemPreview:this.systemPreview,systemNameInput:this.systemNameInput,skyboxDescription:this.skyboxDescription};this.eventHandlerManager.setupAllEventHandlers(this.container,e),this.eventHandlerManager.setupValidationHandlers(e,this.validationManager)}addPlanetInput(){if(!this.planetDescriptions)return;const e=this.formViewManager.addPlanetInput(this.planetDescriptions,this.setupSliderListeners.bind(this),this.updatePlanetNumbers.bind(this),this.playUISound.bind(this));if(this.isMobile){const t=e.querySelector('textarea[id^="planet-description-"]');t&&this.validationManager.addCharacterCounter(t,150)}}setupSliderListeners(e){this.formViewManager.setupSliderListeners(e)}updatePlanetNumbers(){this.planetDescriptions&&this.formViewManager.updatePlanetNumbers(this.planetDescriptions)}async generateSystem(){var n,o;if(!this.systemNameInput||!this.skyboxDescription)return;const e=this.validationManager.validateSystemForm(this.systemNameInput,this.skyboxDescription);if(!e.isValid){this.validationManager.showMobileAlert(e.message||"Validation failed",this.playUISound.bind(this));return}if(!this.planetDescriptions)return;const t=this.planetDescriptions.getElementsByClassName("planet-input"),s=this.validationManager.validatePlanetCount(t);if(!s.isValid){this.validationManager.showMobileAlert(s.message||"Planet validation failed",this.playUISound.bind(this));return}const{planets:i,errors:r}=this.validationManager.collectPlanetData(t);if(r.length>0){this.validationManager.showMobileAlert(r[0],this.playUISound.bind(this));return}this.previewManager.showProgress("Initializing..."),this.isGenerating=!0;try{if(this.previewManager.updateGenerationStatus("Generating skybox..."),!this.systemNameInput||!this.skyboxDescription)throw new Error("Missing system input elements");const l=await this.apiClient.generateSkybox(this.systemNameInput.value.trim(),this.skyboxDescription.value.trim());if(!l.success||!((n=l.image_paths)!=null&&n.length))throw new Error(l.message||"Failed to generate skybox");this.generatedSkyboxUrl=l.image_paths[0],this.generatedPlanetUrls=[];for(let u=0;u<i.length;u++){const h=i[u];this.previewManager.updateGenerationStatus(`Generating planet ${u+1} of ${i.length}: ${h.name}...`);const p=await this.apiClient.generatePlanet(h.name,h.description);p.success&&((o=p.image_paths)!=null&&o.length)&&this.generatedPlanetUrls.push({name:h.name,url:p.image_paths[0]})}const c=document.getElementById("star-class"),m=c?c.value:"G";this.systemData=this.systemDataManager.createSystemData(this.systemNameInput.value.trim(),m,this.generatedSkyboxUrl,i.map((u,h)=>{var p;return{...u,textureUrl:((p=this.generatedPlanetUrls[h])==null?void 0:p.url)||null}})),this.previewManager.showSystemPreview(this.generatedSkyboxUrl,this.generatedPlanetUrls,this.apiClient)}catch(l){const c=l instanceof Error?l.message:String(l);console.error("Error generating system:",l),this.validationManager.showMobileAlert(`Failed to generate system: ${c}`,this.playUISound.bind(this)),this.previewManager.hideProgress()}this.isGenerating=!1}travelToSystem(){var e;if(!this.systemData){this.validationManager.showMobileAlert("No system data available. Please generate a system first.",this.playUISound.bind(this));return}try{if(!this.starSystemGenerator)throw new Error("Star system generator not available");if(!this.starSystemGenerator.addCustomSystem(this.systemData))throw new Error("Failed to add custom system");this.hide(),(e=this.environment)!=null&&e.travelToSystem?this.environment.travelToSystem(this.systemData.id):console.error("Environment or travelToSystem method not available")}catch(t){const s=t instanceof Error?t.message:String(t);console.error("Error traveling to custom system:",t),this.validationManager.showMobileAlert(`Failed to travel to custom system: ${s}`,this.playUISound.bind(this))}}playUISound(){this.helpers.playUISound()}show(){this.container&&(this.cleanupBeforeHiding(),this.container.style.display="flex",this.isVisible=!0,this.previewManager.resetToForm(),this.playUISound(),this.isMobile?this.setupMobileShow():this.setupDesktopShow())}setupMobileShow(){if(!this.container)return;const e=this.container.querySelector(".modal-content");e&&(this.helpers.scrollToTop(e),this.helpers.setStyleSafe(e,"overflowY","auto"),this.helpers.setStyleSafe(e,"webkitOverflowScrolling","touch"),this.helpers.setStyleSafe(e,"overscrollBehavior","contain")),this.helpers.addClassSafe(document.body,"modal-open"),setTimeout(()=>{this.systemNameInput&&this.systemNameInput.focus()},300)}setupDesktopShow(){setTimeout(()=>{this.systemNameInput&&this.systemNameInput.focus()},300)}hide(){!this.container||this.isGenerating||(this.cleanupBeforeHiding(),this.container.style.display="none",this.isVisible=!1,this.playUISound(),setTimeout(()=>{var e,t;if((t=(e=window.game)==null?void 0:e.ui)!=null&&t.stargateInterface)console.log("CustomSystemCreator: Returning to stargate UI"),window.game.ui.stargateInterface.showStargateUI();else{const s=document.getElementById("stargate-ui");s?(s.style.display="block",console.log("CustomSystemCreator: Showed stargate UI via direct DOM access")):console.warn("CustomSystemCreator: Could not find stargate UI to return to")}},100))}toggle(){this.isVisible?this.hide():this.show()}cleanupBeforeHiding(){this.isGenerating&&(this.isGenerating=!1,this.previewManager.hideProgress()),this.helpers.cleanupScrolling(),this.helpers.setStyleSafe(document.body,"pointerEvents","auto"),this.isMobile&&(this.helpers.setStyleSafe(document.body,"touchAction","auto"),this.helpers.removeClassSafe(document.body,"modal-open"),this.helpers.forceReflow(this.container))}destroy(){var e;this.cleanupBeforeHiding(),this.eventHandlerManager.cleanup(),this.styleManager.cleanup(),this.helpers.cleanup(),this.formViewManager.cleanup(),(e=this.container)!=null&&e.parentNode&&this.container.parentNode.removeChild(this.container)}}export{B as CustomSystemCreator};
//# sourceMappingURL=customSystemCreator-CrsQgtpA.js.map
