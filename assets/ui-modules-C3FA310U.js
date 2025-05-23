import{M as b}from"./game-modules-DrL_oOTa.js";class x{constructor(e){this.spaceship=e,this.setupHUD(),this.animationFrames=[],this.glitchInterval=null,this.scanline=null,this.hudOpacity=0,this.animateHudIn()}setupHUD(){const e=document.createElement("div");e.id="hud-container",e.style.position="absolute",e.style.top="0",e.style.left="0",e.style.width="100%",e.style.height="100%",e.style.pointerEvents="none",e.style.fontFamily='"Rajdhani", "Electrolize", sans-serif',e.style.fontWeight="400",e.style.color="rgba(120, 220, 232, 0.9)",e.style.textShadow="0 0 10px rgba(120, 220, 232, 0.5)",e.style.opacity="0",e.style.transition="opacity 0.5s ease",document.body.appendChild(e);const t=document.createElement("link");t.href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600&family=Electrolize&display=swap",t.rel="stylesheet",document.head.appendChild(t),this.createScanlineEffect(e),this.createFlightPanel(e),this.createStatusPanel(e),this.createTargetingSystem(e),this.createLocationPanel(e),this.createResourcePanel(e),this.createNotificationsArea(e)}createScanlineEffect(e){const t=document.createElement("div");t.id="scanline-effect",t.style.position="absolute",t.style.top="0",t.style.left="0",t.style.width="100%",t.style.height="100%",t.style.background="linear-gradient(transparent 50%, rgba(120, 220, 232, 0.03) 50%)",t.style.backgroundSize="100% 4px",t.style.zIndex="1000",t.style.pointerEvents="none",t.style.opacity="0.5",e.appendChild(t);const o=document.createElement("div");o.id="active-scanline",o.style.position="absolute",o.style.left="0",o.style.width="100%",o.style.height="3px",o.style.background="linear-gradient(90deg, transparent 0%, rgba(120, 220, 232, 0.1) 50%, transparent 100%)",o.style.boxShadow="0 0 10px rgba(120, 220, 232, 0.3)",o.style.zIndex="1001",o.style.top="0",o.style.opacity="0.7",o.style.pointerEvents="none",e.appendChild(o),this.scanline=o}createFlightPanel(e){const t=document.createElement("div");t.id="flight-panel",t.className="hud-panel",t.style.position="absolute",t.style.bottom="20px",t.style.left="20px",t.style.width="260px",t.style.padding="15px",t.style.backgroundColor="rgba(6, 22, 31, 0.7)",t.style.backdropFilter="blur(5px)",t.style.borderRadius="10px",t.style.border="1px solid rgba(120, 220, 232, 0.3)",t.style.boxShadow="0 0 15px rgba(120, 220, 232, 0.2), inset 0 0 10px rgba(120, 220, 232, 0.1)",t.style.overflow="hidden",e.appendChild(t);const o=document.createElement("div");o.className="panel-header",o.innerHTML="<span>FLIGHT SYSTEMS</span>",o.style.fontWeight="600",o.style.fontSize="14px",o.style.textTransform="uppercase",o.style.letterSpacing="2px",o.style.marginBottom="15px",o.style.paddingBottom="8px",o.style.borderBottom="1px solid rgba(120, 220, 232, 0.3)",o.style.display="flex",o.style.justifyContent="space-between",o.style.alignItems="center",t.appendChild(o);const n=document.createElement("div");n.className="status-indicator",n.style.width="8px",n.style.height="8px",n.style.borderRadius="50%",n.style.backgroundColor="rgba(120, 220, 232, 0.8)",n.style.boxShadow="0 0 5px rgba(120, 220, 232, 0.8)",n.style.animation="pulse 2s infinite",o.appendChild(n);const s=document.createElement("div");s.className="panel-row",s.style.display="flex",s.style.justifyContent="space-between",s.style.alignItems="center",s.style.margin="10px 0",t.appendChild(s);const a=document.createElement("span");a.className="row-label",a.textContent="FUEL",a.style.width="40%",s.appendChild(a);const i=document.createElement("span");i.id="fuel-value",i.className="row-value",i.textContent="100 / 100",i.style.position="absolute",i.style.right="15px",i.style.top="-18px",i.style.fontSize="12px",i.style.color="rgba(120, 220, 232, 0.9)";const l=document.createElement("div");l.style.width="60%",l.style.height="10px",l.style.backgroundColor="rgba(10, 30, 40, 0.5)",l.style.borderRadius="5px",l.style.overflow="hidden",l.style.position="relative",l.appendChild(i),s.appendChild(l);const d=document.createElement("div");d.id="fuel-bar",d.style.width="100%",d.style.height="100%",d.style.backgroundColor="rgba(120, 220, 232, 0.8)",d.style.boxShadow="inset 0 0 5px rgba(255, 255, 255, 0.5)",d.style.transition="width 0.3s ease",l.appendChild(d),this.createPanelRow(t,"CREDITS","credits","1000 CR");const r=document.createElement("button");r.id="show-controls",r.textContent="SYSTEM CONTROLS",r.style.width="100%",r.style.marginTop="15px",r.style.padding="8px",r.style.backgroundColor="rgba(120, 220, 232, 0.15)",r.style.border="1px solid rgba(120, 220, 232, 0.5)",r.style.borderRadius="5px",r.style.color="rgba(120, 220, 232, 0.9)",r.style.fontSize="12px",r.style.fontFamily='"Rajdhani", sans-serif',r.style.cursor="pointer",r.style.transition="all 0.2s ease",r.style.textTransform="uppercase",r.style.letterSpacing="1px",r.style.fontWeight="600",r.style.outline="none",r.style.pointerEvents="auto",r.addEventListener("mouseover",()=>{r.style.backgroundColor="rgba(120, 220, 232, 0.3)",r.style.boxShadow="0 0 10px rgba(120, 220, 232, 0.5)"}),r.addEventListener("mouseout",()=>{r.style.backgroundColor="rgba(120, 220, 232, 0.15)",r.style.boxShadow="none"}),t.appendChild(r),this.addHolographicElements(t)}createStatusPanel(e){const t=document.createElement("div");t.id="status-panel",t.className="hud-panel",t.style.position="absolute",t.style.bottom="20px",t.style.right="20px",t.style.width="260px",t.style.padding="15px",t.style.backgroundColor="rgba(6, 22, 31, 0.7)",t.style.backdropFilter="blur(5px)",t.style.borderRadius="10px",t.style.border="1px solid rgba(120, 220, 232, 0.3)",t.style.boxShadow="0 0 15px rgba(120, 220, 232, 0.2), inset 0 0 10px rgba(120, 220, 232, 0.1)",e.appendChild(t);const o=document.createElement("div");o.className="panel-header",o.innerHTML="<span>SHIP STATUS</span>",o.style.fontWeight="600",o.style.fontSize="14px",o.style.textTransform="uppercase",o.style.letterSpacing="2px",o.style.marginBottom="15px",o.style.paddingBottom="8px",o.style.borderBottom="1px solid rgba(120, 220, 232, 0.3)",o.style.display="flex",o.style.justifyContent="space-between",o.style.alignItems="center",t.appendChild(o);const n=document.createElement("div");n.className="status-indicator",n.style.width="8px",n.style.height="8px",n.style.borderRadius="50%",n.style.backgroundColor="rgba(120, 220, 232, 0.8)",n.style.boxShadow="0 0 5px rgba(120, 220, 232, 0.8)",n.style.animation="pulse 2s infinite",o.appendChild(n);const s=document.createElement("div");s.className="panel-row",s.style.display="flex",s.style.justifyContent="space-between",s.style.alignItems="center",s.style.margin="10px 0",t.appendChild(s);const a=document.createElement("span");a.className="row-label",a.textContent="SHIELD",a.style.width="50%",s.appendChild(a);const i=document.createElement("div");i.style.width="50%",i.style.height="10px",i.style.backgroundColor="rgba(10, 30, 40, 0.5)",i.style.borderRadius="5px",i.style.overflow="hidden",s.appendChild(i);const l=document.createElement("div");l.id="shield-bar",l.style.width="100%",l.style.height="100%",l.style.backgroundColor="rgba(51, 153, 255, 0.8)",l.style.boxShadow="inset 0 0 5px rgba(255, 255, 255, 0.5)",l.style.transition="width 0.3s ease",i.appendChild(l);const d=document.createElement("div");d.className="panel-row",d.style.display="flex",d.style.justifyContent="space-between",d.style.alignItems="center",d.style.margin="10px 0",t.appendChild(d);const r=document.createElement("span");r.className="row-label",r.textContent="HULL INTEGRITY",r.style.width="50%",d.appendChild(r);const u=document.createElement("div");u.style.width="50%",u.style.height="10px",u.style.backgroundColor="rgba(10, 30, 40, 0.5)",u.style.borderRadius="5px",u.style.overflow="hidden",d.appendChild(u);const p=document.createElement("div");p.id="hull-bar",p.style.width="100%",p.style.height="100%",p.style.backgroundColor="rgba(120, 220, 232, 0.8)",p.style.boxShadow="inset 0 0 5px rgba(255, 255, 255, 0.5)",p.style.transition="width 0.3s ease",u.appendChild(p),this.addHolographicElements(t);const c=document.createElement("button");c.id="sound-toggle",c.textContent="SOUND: ON",c.style.background="none",c.style.border="1px solid rgba(120, 220, 232, 0.5)",c.style.color="rgba(120, 220, 232, 0.9)",c.style.padding="5px 10px",c.style.borderRadius="5px",c.style.cursor="pointer",c.style.fontFamily='"Rajdhani", sans-serif',c.style.fontSize="12px",c.style.marginLeft="10px",c.style.marginTop="10px",c.style.outline="none",c.style.pointerEvents="auto",c.addEventListener("click",()=>{if(window.game&&window.game.audio){const g=window.game.audio.toggleMute();c.textContent=g?"SOUND: OFF":"SOUND: ON"}}),t.appendChild(c)}createTargetingSystem(e){const t=document.createElement("div");t.id="targeting-system",t.style.position="absolute",t.style.top="50%",t.style.left="50%",t.style.transform="translate(-50%, -50%)",t.style.width="100px",t.style.height="100px",t.style.zIndex="100",e.appendChild(t);const o=document.createElement("div");o.id="crosshair",o.style.position="absolute",o.style.top="50%",o.style.left="50%",o.style.transform="translate(-50%, -50%)",o.style.width="50px",o.style.height="50px",o.innerHTML=`
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="20" stroke="rgba(120, 220, 232, 0.5)" stroke-width="1" stroke-dasharray="8 4"/>
                <circle cx="25" cy="25" r="3" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <circle cx="25" cy="25" r="1" fill="rgba(120, 220, 232, 0.8)"/>
                <line x1="25" y1="10" x2="25" y2="18" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="25" y1="32" x2="25" y2="40" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="10" y1="25" x2="18" y2="25" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="32" y1="25" x2="40" y2="25" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <!-- Add a pulsing animation to the outer circle -->
                <circle cx="25" cy="25" r="24" stroke="rgba(120, 220, 232, 0.3)" stroke-width="1">
                    <animate attributeName="r" values="24;28;24" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `,t.appendChild(o);const n=document.createElement("div");n.id="target-info",n.style.position="absolute",n.style.top="60px",n.style.left="50%",n.style.transform="translateX(-50%)",n.style.width="200px",n.style.backgroundColor="rgba(6, 22, 31, 0.5)",n.style.backdropFilter="blur(5px)",n.style.borderRadius="5px",n.style.padding="8px",n.style.fontSize="12px",n.style.color="rgba(120, 220, 232, 0.9)",n.style.border="1px solid rgba(120, 220, 232, 0.3)",n.style.boxShadow="0 0 10px rgba(120, 220, 232, 0.2)",n.style.textAlign="center",n.style.display="none",t.appendChild(n),n.innerHTML=`
            <div id="target-name" style="font-weight:600; margin-bottom:5px; font-size:14px;">NO TARGET</div>
            <div id="target-distance" style="margin-bottom:3px;">DISTANCE: ---</div>
            <div id="target-type" style="margin-bottom:3px;">TYPE: ---</div>
            <div id="target-resources" style="margin-bottom:3px;">RESOURCES: ---</div>
        `;const s=document.createElement("div");s.id="laser-beam",s.style.position="absolute",s.style.top="50%",s.style.left="50%",s.style.width="0px",s.style.height="2px",s.style.backgroundColor="rgba(255, 50, 50, 0.8)",s.style.boxShadow="0 0 10px rgba(255, 50, 50, 0.8)",s.style.transformOrigin="left",s.style.transform="rotate(var(--angle, 0deg))",s.style.zIndex="90",s.style.display="none",e.appendChild(s)}createLocationPanel(e){const t=document.createElement("div");t.id="location-panel",t.className="hud-panel",t.style.position="absolute",t.style.top="20px",t.style.left="20px",t.style.padding="10px 20px",t.style.backgroundColor="rgba(6, 22, 31, 0.7)",t.style.backdropFilter="blur(5px)",t.style.borderRadius="8px",t.style.border="1px solid rgba(120, 220, 232, 0.3)",t.style.boxShadow="0 0 15px rgba(120, 220, 232, 0.2)",t.style.fontSize="14px",e.appendChild(t),t.innerHTML=`
            <div style="display:flex; align-items:center; gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" 
                          fill="rgba(120, 220, 232, 0.8)"/>
                </svg>
                <span id="current-system" style="font-weight:600; letter-spacing:1px;">SOLAR SYSTEM</span>
            </div>
            <div id="location-coordinates" style="margin-top:5px; font-size:12px; opacity:0.8;">X: 0 Y: 0 Z: 0</div>
            <div id="fps-display" style="margin-top:5px; font-size:12px; opacity:0.8;">FPS: 0</div>
            <div style="margin-top:5px; display:flex; align-items:center; gap:10px; font-size:12px; opacity:0.8;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" 
                          fill="rgba(120, 220, 232, 0.8)"/>
                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" 
                          fill="rgba(120, 220, 232, 0.5)"/>
                </svg>
                <span>ANOMALIES: <span id="anomaly-count" style="font-weight:600;">0</span></span>
            </div>
        `,this.addCornerElements(t)}createResourcePanel(e){const t=document.createElement("div");t.id="resource-panel",t.className="hud-panel",t.style.position="absolute",t.style.top="20px",t.style.right="20px",t.style.width="180px",t.style.padding="10px 15px",t.style.backgroundColor="rgba(6, 22, 31, 0.7)",t.style.backdropFilter="blur(5px)",t.style.borderRadius="8px",t.style.border="1px solid rgba(120, 220, 232, 0.3)",t.style.boxShadow="0 0 15px rgba(120, 220, 232, 0.2)",t.style.fontSize="14px",e.appendChild(t);const o=document.createElement("div");o.className="panel-header",o.innerHTML="<span>CARGO BAY</span>",o.style.fontWeight="600",o.style.fontSize="12px",o.style.textTransform="uppercase",o.style.letterSpacing="1px",o.style.marginBottom="8px",o.style.paddingBottom="5px",o.style.borderBottom="1px solid rgba(120, 220, 232, 0.3)",o.style.display="flex",o.style.justifyContent="space-between",o.style.alignItems="center",t.appendChild(o);const n=(r,u,p)=>{const c=document.createElement("div");c.style.display="flex",c.style.alignItems="center",c.style.justifyContent="space-between",c.style.margin="5px 0";const g=document.createElement("div");g.style.width="12px",g.style.height="14px",g.style.clipPath="polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",g.style.backgroundColor=p,g.style.marginRight="8px";const m=document.createElement("div");m.style.display="flex",m.style.alignItems="center",m.style.width="50%",m.style.fontSize="12px",m.appendChild(g),m.appendChild(document.createTextNode(r));const y=document.createElement("div");y.id=u,y.style.width="50%",y.style.textAlign="right",y.style.fontWeight="600",y.style.fontSize="12px",y.textContent="0",c.appendChild(m),c.appendChild(y),t.appendChild(c)};n("IRON","iron-amount","rgba(180, 180, 180, 0.8)"),n("GOLD","gold-amount","rgba(255, 215, 0, 0.8)"),n("PLATINUM","platinum-amount","rgba(229, 228, 226, 0.8)");const s=document.createElement("div");s.style.marginTop="8px",s.style.display="flex",s.style.justifyContent="space-between",s.style.alignItems="center",s.style.borderTop="1px solid rgba(120, 220, 232, 0.3)",s.style.paddingTop="8px",t.appendChild(s);const a=document.createElement("div");a.textContent="CAPACITY",a.style.fontSize="12px",s.appendChild(a);const i=document.createElement("div");i.id="cargo-capacity",i.textContent="0 / 1000",i.style.fontSize="12px",i.style.fontWeight="600",s.appendChild(i);const l=document.createElement("div");l.style.width="100%",l.style.height="5px",l.style.backgroundColor="rgba(10, 30, 40, 0.5)",l.style.borderRadius="3px",l.style.overflow="hidden",l.style.marginTop="5px",t.appendChild(l);const d=document.createElement("div");d.id="capacity-bar",d.style.width="0%",d.style.height="100%",d.style.backgroundColor="rgba(120, 220, 232, 0.8)",d.style.transition="width 0.3s ease",l.appendChild(d),this.addCornerElements(t)}createNotificationsArea(e){const t=document.createElement("div");t.id="notifications-area",t.style.position="absolute",t.style.top="20px",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.display="flex",t.style.flexDirection="column",t.style.alignItems="center",t.style.gap="10px",e.appendChild(t);const o=document.createElement("div");o.id="horde-mode-indicator",o.className="hud-panel",o.style.display="none",o.style.padding="8px 12px",o.style.backgroundColor="rgba(51, 10, 10, 0.8)",o.style.backdropFilter="blur(5px)",o.style.borderRadius="8px",o.style.border="1px solid #ff3030",o.style.boxShadow="0 0 15px rgba(255, 48, 48, 0.5)",o.style.animation="pulse-horde 2s infinite",o.style.marginBottom="10px",o.style.fontSize="18px",o.style.fontWeight="600",o.style.letterSpacing="1px";const n=document.createElement("div");n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="center",n.style.gap="10px";const s=document.createElement("span");s.style.color="#ff3030",s.style.textShadow="0 0 5px rgba(255,48,48,0.5)",s.textContent="HORDE MODE";const a=document.createElement("span");a.id="horde-survival-time",a.style.color="#ff9999",a.style.fontWeight="bold",a.textContent="00:00",n.appendChild(s),n.appendChild(a),o.appendChild(n),this.addCornerElements(o),t.appendChild(o);const i=document.createElement("style");i.textContent=`
            @keyframes pulse-horde {
                0% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.5); }
                50% { box-shadow: 0 0 10px rgba(255, 30, 30, 0.8); }
                100% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.5); }
            }
        `,document.head.appendChild(i)}createPanelRow(e,t,o,n,s=!1){const a=document.createElement("div");a.className="panel-row",a.style.display="flex",a.style.justifyContent="space-between",a.style.alignItems="center",a.style.margin="8px 0",e.appendChild(a);const i=document.createElement("span");i.className="row-label",i.textContent=t,a.appendChild(i);const l=document.createElement("span");l.id=o,l.className="row-value",l.textContent=n,s&&n==="ON"?l.style.color="#5fff8f":s&&n==="OFF"&&(l.style.color="#ff7f7f"),a.appendChild(l)}createStatusRow(e,t,o,n){const s=document.createElement("div");s.className="status-row",s.style.display="flex",s.style.justifyContent="space-between",s.style.alignItems="center",s.style.margin="8px 0",e.appendChild(s);const a=document.createElement("span");a.className="row-label",a.textContent=t,a.style.fontSize="12px",s.appendChild(a);const i=document.createElement("span");i.id=o,i.className="row-value",i.textContent=n,i.style.fontSize="12px",i.style.fontWeight="600",n==="NOMINAL"?i.style.color="rgba(120, 220, 232, 0.9)":n==="WARNING"?i.style.color="#ffcc00":n==="CRITICAL"&&(i.style.color="#ff3030"),s.appendChild(i)}addHolographicElements(e){this.addCornerElements(e)}addCornerElements(e){const t=document.createElement("div");t.style.position="absolute",t.style.top="0",t.style.left="0",t.style.width="10px",t.style.height="10px",t.style.borderTop="2px solid rgba(120, 220, 232, 0.8)",t.style.borderLeft="2px solid rgba(120, 220, 232, 0.8)",e.appendChild(t);const o=document.createElement("div");o.style.position="absolute",o.style.top="0",o.style.right="0",o.style.width="10px",o.style.height="10px",o.style.borderTop="2px solid rgba(120, 220, 232, 0.8)",o.style.borderRight="2px solid rgba(120, 220, 232, 0.8)",e.appendChild(o);const n=document.createElement("div");n.style.position="absolute",n.style.bottom="0",n.style.left="0",n.style.width="10px",n.style.height="10px",n.style.borderBottom="2px solid rgba(120, 220, 232, 0.8)",n.style.borderLeft="2px solid rgba(120, 220, 232, 0.8)",e.appendChild(n);const s=document.createElement("div");s.style.position="absolute",s.style.bottom="0",s.style.right="0",s.style.width="10px",s.style.height="10px",s.style.borderBottom="2px solid rgba(120, 220, 232, 0.8)",s.style.borderRight="2px solid rgba(120, 220, 232, 0.8)",e.appendChild(s)}animateHudIn(){const e=document.createElement("style");e.textContent=`
            @keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
            
            @keyframes radar-ping {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0.5; }
                100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
            }
            
            @keyframes text-flicker {
                0% { opacity: 1; }
                3% { opacity: 0.4; }
                6% { opacity: 1; }
                9% { opacity: 0.4; }
                12% { opacity: 1; }
                35% { opacity: 1; }
                38% { opacity: 0.4; }
                41% { opacity: 1; }
                100% { opacity: 1; }
            }
            
            @keyframes blink {
                0% { opacity: 1; }
                49% { opacity: 1; }
                50% { opacity: 0; }
                100% { opacity: 0; }
            }
        `,document.head.appendChild(e),this.addStartupGlitchEffect(),setTimeout(()=>{this.scanline&&this.animateScanline()},1500)}addStartupGlitchEffect(){const e=document.getElementById("hud-container");e&&(setTimeout(()=>{e.style.opacity="0.3",this.addGlitch(e)},300),setTimeout(()=>{e.style.opacity="0.7",this.addGlitch(e)},800),setTimeout(()=>{e.style.opacity="1",this.addGlitch(e)},1200),this.glitchInterval=setInterval(()=>{Math.random()>.7&&this.addGlitch(e)},5e3))}addGlitch(e){const t=`
            @keyframes glitch-${Date.now()} {
                0% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg); }
                1% { transform: translate(2px, 2px) skew(1deg); filter: hue-rotate(90deg); }
                2% { transform: translate(-2px, -3px) skew(-1deg); filter: hue-rotate(180deg); }
                3% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg); }
                12% { clip-path: inset(0 0 0 0); }
                13% { clip-path: inset(10% 0 0 0); }
                14% { clip-path: inset(0 0 0 0); }
                15% { clip-path: inset(0 0 10% 0); }
                16% { clip-path: inset(0 0 0 0); }
                100% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg); }
            }
        `,o=document.createElement("style");o.textContent=t,document.head.appendChild(o);const n=`glitch-${Date.now()}`;e.style.animation=`${n} 1s forwards`,setTimeout(()=>{e.style.animation="",o.remove()},1e3)}animateScanline(){let e=0;const t=window.innerHeight,o=()=>{this.scanline&&(e=(e+2)%t,this.scanline.style.top=`${e}px`,Math.random()>.97&&(this.scanline.style.opacity="0",setTimeout(()=>{this.scanline&&(this.scanline.style.opacity="0.7")},50)),this.animationFrames.push(requestAnimationFrame(o)))};o()}update(){if(!this.spaceship)return;this.updateShieldDisplay(),this.updateHullDisplay();const e=document.getElementById("fuel-bar"),t=document.getElementById("fuel-value");if(e){const n=this.spaceship.maxFuel>0?this.spaceship.fuel/this.spaceship.maxFuel*100:0;e.style.width=`${n}%`,n<20?e.style.backgroundColor="rgba(255, 80, 80, 0.8)":n<40?e.style.backgroundColor="rgba(255, 204, 0, 0.8)":e.style.backgroundColor="rgba(120, 220, 232, 0.8)",t&&(t.textContent=`${Math.round(this.spaceship.fuel)} / ${Math.round(this.spaceship.maxFuel)}`)}const o=document.getElementById("credits-value");o&&(o.textContent=`${this.spaceship.credits} CR`),this.updateHordeModeDisplay()}updateHordeModeDisplay(){const e=document.getElementById("horde-mode-indicator"),t=document.getElementById("horde-survival-time");if(!(!e||!t))if(window.game&&window.game.isHordeActive){if(e.style.display==="none"&&(e.style.display="flex"),window.game.getFormattedHordeSurvivalTime)t.textContent=window.game.getFormattedHordeSurvivalTime();else{const o=Math.floor(window.game.hordeSurvivalTime/1e3),n=Math.floor(o/60),s=o%60;t.textContent=`${n.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`}if(window.game.hordeSurvivalTime>3*60*1e3){const o=document.createElement("style");o.textContent=`
                    @keyframes pulse-horde {
                        0% { box-shadow: 0 0 8px rgba(255, 30, 30, 0.7); }
                        50% { box-shadow: 0 0 15px rgba(255, 30, 30, 1); }
                        100% { box-shadow: 0 0 8px rgba(255, 30, 30, 0.7); }
                    }
                `,document.head.appendChild(o),e.style.animation="pulse-horde 1s infinite"}}else e.style.display="none"}updateShieldDisplay(){const e=document.getElementById("shield-bar");if(!e)return;let t=100,o=!1;try{if(window.game&&window.game.world){const n=window.game.world.getEntitiesByTag("player");if(n&&n.length>0){const a=n[0].getComponent("HealthComponent");a&&(t=a.getShieldPercentage(),this.spaceship&&(a.shield>this.spaceship.shield?(this.spaceship.shield=a.shield,this.spaceship.maxShield=a.maxShield):this.spaceship.shield>a.shield&&(a.shield=this.spaceship.shield,console.log(`Updated HealthComponent shield from spaceship: ${a.shield}`),t=a.getShieldPercentage())),o=!0)}}}catch(n){console.error("Error accessing player shield component:",n)}!o&&this.spaceship&&this.spaceship.shield!==void 0&&(t=this.spaceship.shield/this.spaceship.maxShield*100),e.style.width=`${t}%`,t<25?e.style.backgroundColor="rgba(255, 80, 80, 0.8)":t<50?e.style.backgroundColor="rgba(255, 204, 0, 0.8)":e.style.backgroundColor="rgba(51, 153, 255, 0.8)"}updateHullDisplay(){const e=document.getElementById("hull-bar");if(!e)return;let t=100,o=!1;try{if(window.game&&window.game.world){const n=window.game.world.getEntitiesByTag("player");if(n&&n.length>0){const a=n[0].getComponent("HealthComponent");a&&(t=a.getHealthPercentage(),this.spaceship&&(a.health>this.spaceship.hull?(this.spaceship.hull=a.health,this.spaceship.maxHull=a.maxHealth):this.spaceship.hull>a.health&&(a.health=this.spaceship.hull,console.log(`Updated HealthComponent health from spaceship: ${a.health}`),t=a.getHealthPercentage())),o=!0)}}}catch(n){console.error("Error accessing player health component:",n)}!o&&this.spaceship&&this.spaceship.hull!==void 0&&(t=this.spaceship.hull/this.spaceship.maxHull*100),e.style.width=`${t}%`,t<30?e.style.backgroundColor="rgba(255, 80, 80, 0.8)":t<60?e.style.backgroundColor="rgba(255, 204, 0, 0.8)":e.style.backgroundColor="rgba(120, 220, 232, 0.8)"}updateLocation(e,t="Unknown System"){const o=document.getElementById("current-system");if(o){o.textContent=t.toUpperCase();const n=document.getElementById("location-panel");n&&this.addGlitch(n)}}updateCoordinates(e,t,o){const n=document.getElementById("location-coordinates");n&&(n.textContent=`X: ${Math.round(e)} Y: ${Math.round(t)} Z: ${Math.round(o)}`)}updateFPS(e,t){const o=document.getElementById("fps-display");o&&(t?(o.textContent=`FPS: ${Math.round(e)}/${t}`,e<t*.9?o.style.color="rgba(255, 120, 120, 0.9)":o.style.color="rgba(120, 220, 232, 0.8)"):(o.textContent=`FPS: ${Math.round(e)}`,o.style.color="rgba(120, 220, 232, 0.8)"),window.game&&window.game.ui&&window.game.ui.settings&&window.game.ui.settings.settings.frameRateCap==="auto"&&(window.game.ui.settings.monitorRefreshRate,t>0?o.textContent=`FPS: ${Math.round(e)}/${t} (Auto)`:o.textContent=`FPS: ${Math.round(e)} (Auto: Unlimited)`))}hide(){const e=document.getElementById("hud-container");e&&(e.style.opacity="0"),this.animationFrames.forEach(t=>cancelAnimationFrame(t)),this.animationFrames=[],this.glitchInterval&&clearInterval(this.glitchInterval)}show(){const e=document.getElementById("hud-container");e&&(e.style.opacity="1"),this.scanline&&this.animateScanline(),this.glitchInterval||(this.glitchInterval=setInterval(()=>{Math.random()>.7&&this.addGlitch(e)},5e3))}destroy(){this.animationFrames.forEach(o=>{cancelAnimationFrame(o)}),this.animationFrames=[],this.glitchInterval&&(clearInterval(this.glitchInterval),this.glitchInterval=null);const e=document.getElementById("show-controls");e&&(e.removeEventListener("click",e.clickHandler),e.removeEventListener("mouseover",e.mouseoverHandler),e.removeEventListener("mouseout",e.mouseoutHandler));const t=document.getElementById("hud-container");t&&t.parentNode&&t.parentNode.removeChild(t),this.spaceship=null,this.scanline=null}}class v{constructor(){this.starMap=null,this.blackjackGame=null,this.settings=null,this.isMobile=b.isMobile(),this.setupStargateUI(),this.setupEventHandlers()}setStarMap(e){this.starMap=e}setBlackjackGame(e){this.blackjackGame=e}setSettings(e){this.settings=e,this.settings&&this.settings.setStargateInterface(this),this.setupSettingsButton()}setupStargateUI(){const e=document.createElement("style");e.textContent=`
            @keyframes pulse-warning {
                0% { box-shadow: 0 0 15px rgba(255, 48, 48, 0.5); }
                50% { box-shadow: 0 0 25px rgba(255, 48, 48, 0.8); }
                100% { box-shadow: 0 0 15px rgba(255, 48, 48, 0.5); }
            }
            
            /* Stargate Terminal Styles */
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
            
            #stargate-header {
                background-color: rgba(30, 40, 60, 0.9);
                padding: 15px 20px;
                border-bottom: 1px solid var(--primary-border);
                position: sticky;
                top: 0;
                z-index: 10;
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
                grid-row: 1 ;
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
            
            /* Footer */
            #stargate-footer {
                padding: 20px;
                border-top: 1px solid rgba(51, 170, 255, 0.3);
                text-align: center;
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
            
            /* Custom colors for buttons */
            .btn-fuel { background-color: var(--accent-green); }
            .btn-shield { background-color: var(--accent-blue); }
            .btn-hull { background-color: var(--accent-orange); }
            .btn-starmap { background-color: var(--accent-cyan); }
            .btn-blackjack { background-color: var(--accent-purple); }
            .btn-settings { background-color: var(--accent-blue); }
            .btn-horde { 
                background: linear-gradient(135deg, #990000 0%, var(--accent-red) 100%);
                color: #fff;
                border: 2px solid var(--accent-red);
                box-shadow: 0 0 15px rgba(255, 48, 48, 0.5);
                animation: pulse-warning 2s infinite;
            }
            .btn-undock {
                background-color: var(--accent-blue);
                font-size: 1.2em;
                padding: 15px;
            }
            
            .iron-border { border: 1px solid #cc6633; box-shadow: 0 0 10px rgba(204, 102, 51, 0.3); }
            .gold-border { border: 1px solid #ffcc33; box-shadow: 0 0 10px rgba(255, 204, 51, 0.3); }
            .platinum-border { border: 1px solid #33ccff; box-shadow: 0 0 10px rgba(51, 204, 255, 0.3); }
            .common-border { border: 1px solid #00ff66; box-shadow: 0 0 10px rgba(0, 255, 102, 0.3); }
            .uncommon-border { border: 1px solid #0066ff; box-shadow: 0 0 10px rgba(0, 102, 255, 0.3); }
            .rare-border { border: 1px solid #9900ff; box-shadow: 0 0 10px rgba(153, 0, 255, 0.3); }
            .epic-border { border: 1px solid #ff6600; box-shadow: 0 0 10px rgba(255, 102, 0, 0.3); }
            .legendary-border { border: 1px solid #ff0000; box-shadow: 0 0 10px rgba(255, 0, 0, 0.3); }
            
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
                
                .upgrade-footer {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .upgrade-description {
                    margin-bottom: 10px;
                }
            }
            
            #horde-confirm-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }
            
            #horde-confirm-content {
                background-color: rgba(30, 30, 35, 0.95);
                border: 2px solid #ff3030;
                border-radius: 10px;
                padding: 30px;
                max-width: 500px;
                width: 80%;
                color: #fff;
                box-shadow: 0 0 30px rgba(255, 48, 48, 0.7);
                text-align: center;
            }
            
            .horde-confirm-title {
                color: #ff3030;
                font-size: 24px;
                margin-bottom: 20px;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(255, 48, 48, 0.5);
            }
            
            .horde-confirm-text {
                margin-bottom: 25px;
                line-height: 1.5;
            }
            
            .horde-confirm-buttons {
                display: flex;
                justify-content: space-between;
            }
            
            .horde-confirm-btn {
                padding: 12px 25px;
                border-radius: 5px;
                border: none;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                width: 45%;
            }
            
            .horde-confirm-yes {
                background-color: #ff3030;
                color: #fff;
            }
            
            .horde-confirm-no {
                background-color: #333;
                color: #fff;
            }
        `,document.head.appendChild(e);const t=document.createElement("div");t.id="docking-prompt",t.style.position="absolute",t.style.top="50%",t.style.left="50%",t.style.transform="translate(-50%, -50%)",t.style.backgroundColor="rgba(0, 0, 0, 0.7)",t.style.color="#33aaff",t.style.padding="20px",t.style.borderRadius="10px",t.style.border="2px solid #33aaff",t.style.boxShadow="0 0 20px #33aaff",t.style.fontFamily="Courier New, monospace",t.style.fontSize="18px",t.style.textAlign="center",t.style.zIndex="1000",t.style.display="none",this.isMobile?(t.style.display="none",t.dataset.alwaysHide="true"):t.textContent="Press Q to dock with Stargate",document.body.appendChild(t);const o=document.createElement("div");o.id="stargate-ui",this.isMobile&&(o.style.width="95%",o.style.maxWidth="95vw",o.style.webkitOverflowScrolling="touch",o.style.touchAction="pan-y",o.style.overscrollBehavior="contain"),o.innerHTML=`
            <!-- Header -->
            <div id="stargate-header">
                <h2 style="text-align: center; color: #33aaff; margin: 0;">STARGATE TERMINAL</h2>
            </div>
            
            <!-- Main Content Grid -->
            <div id="stargate-content">
                <!-- Ship Status Section -->
                <div id="ship-status-section" class="stargate-section">
                    <h3>SHIP STATUS</h3>
                    
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
                </div>
                
                <!-- Market Section (Now spans 2 rows) -->
                <div id="market-section" class="stargate-section">
                    <h3>MARKET</h3>
                    
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
                        <button id="sell-orb-common" class="sell-btn common-border">
                            <div style="font-weight: bold;">COMMON ORB</div>
                            <div id="orb-common-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(100 CR each)</div>
                        </button>
                        <button id="sell-orb-uncommon" class="sell-btn uncommon-border">
                            <div style="font-weight: bold;">UNCOMMON ORB</div>
                            <div id="orb-uncommon-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(500 CR each)</div>
                        </button>
                        <button id="sell-orb-rare" class="sell-btn rare-border">
                            <div style="font-weight: bold;">RARE ORB</div>
                            <div id="orb-rare-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(1,500 CR each)</div>
                        </button>
                        <button id="sell-orb-epic" class="sell-btn epic-border">
                            <div style="font-weight: bold;">EPIC ORB</div>
                            <div id="orb-epic-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(5,000 CR each)</div>
                        </button>
                        <button id="sell-orb-legendary" class="sell-btn legendary-border">
                            <div style="font-weight: bold;">LEGENDARY ORB</div>
                            <div id="orb-legendary-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(15,000 CR each)</div>
                        </button>
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
                </div>
                
                <!-- Upgrades Section (Now in first row) -->
                <div id="upgrades-section" class="stargate-section">
                    <h3>SHIP UPGRADES</h3>
                    
                    <!-- Fuel Tank Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #00cc33;">Fuel Tank Level:</strong> <span id="current-fuel-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Capacity:</strong> <span id="current-fuel-capacity">100</span> units
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-fuel-capacity">200</span> units</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="fuel-upgrade-progress" class="upgrade-progress-bar" style="background-color: #00cc33; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Increases maximum fuel capacity, allowing for longer journeys.</p>
                            </div>
                            <button id="upgrade-fuel-tank" style="flex: 1; padding: 10px; background-color: #00cc33; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="fuel-upgrade-cost">1000</span> CR)
                            </button>
                        </div>
                    </div>
                    
                    <!-- Engine Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #ff9900;">Engine Level:</strong> <span id="current-engine-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Max Speed:</strong> <span id="current-max-velocity">25</span> units/s
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-max-velocity">31.25</span> units/s</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="engine-upgrade-progress" class="upgrade-progress-bar" style="background-color: #ff9900; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Enhances thruster power, increasing maximum velocity and maneuverability.</p>
                            </div>
                            <button id="upgrade-engine" style="flex: 1; padding: 10px; background-color: #ff9900; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="engine-upgrade-cost">800</span> CR)
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mining Laser Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #ff3030;">Mining Laser Level:</strong> <span id="current-mining-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Efficiency:</strong> <span id="current-mining-efficiency">100</span>%
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-mining-efficiency">130</span>%</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="mining-upgrade-progress" class="upgrade-progress-bar" style="background-color: #ff3030; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Increases mining speed and extraction efficiency, allowing faster resource collection.</p>
                            </div>
                            <button id="upgrade-mining" style="flex: 1; padding: 10px; background-color: #ff3030; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="mining-upgrade-cost">1200</span> CR)
                            </button>
                        </div>
                    </div>
                    
                    <!-- Hull Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #30cfd0;">Hull Level:</strong> <span id="current-hull-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Resistance:</strong> <span id="current-hull-resistance">100</span>%
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-hull-resistance">125</span>%</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="hull-upgrade-progress" class="upgrade-progress-bar" style="background-color: #30cfd0; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Reinforces ship structure, improving collision resistance and reducing damage.</p>
                            </div>
                            <button id="upgrade-hull" style="flex: 1; padding: 10px; background-color: #30cfd0; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="hull-upgrade-cost">1500</span> CR)
                            </button>
                        </div>
                    </div>
                    
                    <!-- Scanner Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #9933cc;">Scanner Level:</strong> <span id="current-scanner-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Range:</strong> <span id="current-scanner-range">1000</span> units
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-scanner-range">1200</span> units</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="scanner-upgrade-progress" class="upgrade-progress-bar" style="background-color: #9933cc; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Extends scanner range for detecting asteroids and other objects at greater distances.</p>
                            </div>
                            <button id="upgrade-scanner" style="flex: 1; padding: 10px; background-color: #9933cc; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="scanner-upgrade-cost">600</span> CR)
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Features Section -->
                <div id="features-section" class="stargate-section">
                    <h3>SERVICES</h3>
                    
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
                </div>
                
                <!-- Challenge Section -->
                <div id="challenge-section" class="stargate-section">
                    <h3>EXTREME CHALLENGE</h3>
                    <button id="unleash-horde" class="action-btn btn-horde">
                        UNLEASH THE HORDE
                    </button>
                    <p style="font-size: 12px; color: #ff9999; margin: 10px 0 0 0;">WARNING: Activate extreme survival mode with infinitely scaling difficulty</p>
                </div>
            </div>
            
            <!-- Footer -->
            <div id="stargate-footer">
                <button id="undock-btn" class="action-btn btn-undock" data-no-touch-overlay="true">UNDOCK</button>
            </div>
        `,document.body.appendChild(o)}setupSettingsButton(){if(!this.settings)return;const e=document.getElementById("open-settings");e&&e.addEventListener("click",()=>{console.log("Opening settings"),this.hideStargateUI(),this.settings.show()})}showDockingPrompt(){const e=document.getElementById("docking-prompt");e&&e.dataset.alwaysHide!=="true"&&(e.style.display="block")}hideDockingPrompt(){const e=document.getElementById("docking-prompt");e&&(e.style.display="none")}showStargateUI(){const e=document.getElementById("stargate-ui");e&&(console.log("Showing stargate UI on "+(this.isMobile?"mobile":"desktop")),e.style.display="block",e.style.backgroundColor="rgba(20, 30, 50, 0.9)",this.isMobile&&(e.style.width="92%",e.style.maxWidth="92vw",e.style.maxHeight="85vh",e.style.webkitOverflowScrolling="touch",e.style.touchAction="pan-y",e.style.overscrollBehavior="auto",e.style.position="absolute",e.style.top="50%",e.style.left="50%",e.style.transform="translate(-50%, -50%)",e.style.zIndex="1000",document.body.classList.remove("undocking","modal-open")));const t=document.getElementById("docking-prompt");if(t&&(t.style.display="none"),this.setupStarMapButton(),this.setupBlackjackButton(),this.setupSettingsButton(),this.isMobile&&this.setupTouchEvents(),window.game&&window.game.controls){const o=window.game.spaceship,n=window.game.controls.resources;o&&n&&(console.log("Syncing stargate UI with game resources:",n),this.updateStargateUI(o,n))}}setupStarMapButton(){const e=document.getElementById("open-star-map");e&&this.starMap?e.addEventListener("click",()=>{console.log("Opening star map"),this.hideStargateUI(),this.starMap.show()}):e&&(e.disabled=!0,e.style.backgroundColor="#555",e.style.cursor="not-allowed",e.title="Star map not available")}setupBlackjackButton(){const e=document.getElementById("open-blackjack");e&&this.blackjackGame?e.addEventListener("click",()=>{console.log("Opening blackjack game"),this.hideStargateUI(),this.blackjackGame.show()}):e&&(e.disabled=!0,e.style.backgroundColor="#555",e.style.cursor="not-allowed",e.title="Blackjack game not available")}hideStargateUI(){const e=document.getElementById("stargate-ui");e&&(e.style.display="none")}hide(){this.hideStargateUI()}updateStargateUI(e,t){document.getElementById("ms-iron").textContent=t.iron,document.getElementById("ms-gold").textContent=t.gold,document.getElementById("ms-platinum").textContent=t.platinum,document.getElementById("ms-credits").textContent=`${e.credits} CR`,document.getElementById("fuel-gauge").style.width=`${e.fuel/e.maxFuel*100}%`,document.getElementById("fuel-level").textContent=Math.round(e.fuel/e.maxFuel*100),document.getElementById("shield-gauge").style.width=`${e.shield/e.maxShield*100}%`,document.getElementById("shield-level").textContent=Math.round(e.shield/e.maxShield*100),document.getElementById("hull-gauge").style.width=`${e.hull/e.maxHull*100}%`,document.getElementById("hull-level").textContent=Math.round(e.hull/e.maxHull*100);const o=document.getElementById("refuel-btn");e.credits<100||e.fuel>=e.maxFuel*.999?(o.disabled=!0,o.style.backgroundColor="#555",o.style.cursor="not-allowed"):(o.disabled=!1,o.style.backgroundColor="#00cc33",o.style.cursor="pointer");const n=document.getElementById("repair-shield-btn");e.credits<150||e.shield>=e.maxShield*.999?(n.disabled=!0,n.style.backgroundColor="#555",n.style.cursor="not-allowed"):(n.disabled=!1,n.style.backgroundColor="#3399ff",n.style.cursor="pointer");const s=document.getElementById("repair-hull-btn");e.credits<200||e.hull>=e.maxHull*.999?(s.disabled=!0,s.style.backgroundColor="#555",s.style.cursor="not-allowed"):(s.disabled=!1,s.style.backgroundColor="#ff9900",s.style.cursor="pointer"),document.getElementById("current-fuel-level").textContent=e.fuelTankLevel,document.getElementById("current-fuel-capacity").textContent=e.maxFuel,document.getElementById("next-fuel-capacity").textContent=e.maxFuel*2,document.getElementById("fuel-upgrade-cost").textContent=e.fuelUpgradeCost,document.getElementById("fuel-upgrade-progress").style.width=`${Math.min(e.fuelTankLevel*20,100)}%`,document.getElementById("current-engine-level").textContent=e.engineLevel,document.getElementById("current-max-velocity").textContent=e.maxVelocity.toFixed(2),document.getElementById("next-max-velocity").textContent=(e.maxVelocity*1.25).toFixed(2),document.getElementById("engine-upgrade-cost").textContent=e.engineUpgradeCost,document.getElementById("engine-upgrade-progress").style.width=`${Math.min(e.engineLevel*20,100)}%`,document.getElementById("current-mining-level").textContent=e.miningLevel,document.getElementById("current-mining-efficiency").textContent=Math.round(e.miningEfficiency*100),document.getElementById("next-mining-efficiency").textContent=Math.round(e.miningEfficiency*130),document.getElementById("mining-upgrade-cost").textContent=e.miningUpgradeCost,document.getElementById("mining-upgrade-progress").style.width=`${Math.min(e.miningLevel*20,100)}%`,document.getElementById("current-hull-level").textContent=e.hullLevel,document.getElementById("current-hull-resistance").textContent=Math.round(e.collisionResistance*100),document.getElementById("next-hull-resistance").textContent=Math.round(e.collisionResistance*125),document.getElementById("hull-upgrade-cost").textContent=e.hullUpgradeCost,document.getElementById("hull-upgrade-progress").style.width=`${Math.min(e.hullLevel*20,100)}%`,document.getElementById("current-scanner-level").textContent=e.scannerLevel,document.getElementById("current-scanner-range").textContent=Math.round(e.scanRange),document.getElementById("next-scanner-range").textContent=Math.round(e.scanRange*1.2),document.getElementById("scanner-upgrade-cost").textContent=e.scannerUpgradeCost,document.getElementById("scanner-upgrade-progress").style.width=`${Math.min(e.scannerLevel*20,100)}%`,this.updateUpgradeButtonStatus("upgrade-fuel-tank",e.credits,e.fuelUpgradeCost,"#00cc33"),this.updateUpgradeButtonStatus("upgrade-engine",e.credits,e.engineUpgradeCost,"#ff9900"),this.updateUpgradeButtonStatus("upgrade-mining",e.credits,e.miningUpgradeCost,"#ff3030"),this.updateUpgradeButtonStatus("upgrade-hull",e.credits,e.hullUpgradeCost,"#30cfd0"),this.updateUpgradeButtonStatus("upgrade-scanner",e.credits,e.scannerUpgradeCost,"#9933cc"),document.getElementById("sell-iron").disabled=t.iron===0,document.getElementById("sell-gold").disabled=t.gold===0,document.getElementById("sell-platinum").disabled=t.platinum===0,this.updateSellButtonStatus("sell-iron",t.iron,"#cc6633"),this.updateSellButtonStatus("sell-gold",t.gold,"#ffcc33"),this.updateSellButtonStatus("sell-platinum",t.platinum,"#33ccff"),document.querySelectorAll(".sell-btn").forEach(d=>{d.disabled&&(d.style.backgroundColor="rgba(40, 40, 40, 0.8)",d.style.color="#777",d.style.cursor="not-allowed",d.style.boxShadow="none")});const a=document.getElementById("current-laser-count");a&&(a.textContent=e.deployableLaserCount||0);const i=document.getElementById("purchase-laser");i&&(e.credits<1e3?(i.disabled=!0,i.style.backgroundColor="#555",i.style.cursor="not-allowed"):(i.disabled=!1,i.style.backgroundColor="#FF3333",i.style.cursor="pointer")),t.orbs||(t.orbs={common:0,uncommon:0,rare:0,epic:0,legendary:0}),document.getElementById("orb-common-count").textContent=t.orbs.common>0?`${t.orbs.common} in inventory`:"0 in inventory",document.getElementById("orb-uncommon-count").textContent=t.orbs.uncommon>0?`${t.orbs.uncommon} in inventory`:"0 in inventory",document.getElementById("orb-rare-count").textContent=t.orbs.rare>0?`${t.orbs.rare} in inventory`:"0 in inventory",document.getElementById("orb-epic-count").textContent=t.orbs.epic>0?`${t.orbs.epic} in inventory`:"0 in inventory",document.getElementById("orb-legendary-count").textContent=t.orbs.legendary>0?`${t.orbs.legendary} in inventory`:"0 in inventory";const l=(d,r,u)=>{const p=document.getElementById(d);p&&(r===0?(p.disabled=!0,p.style.backgroundColor="rgba(40, 40, 40, 0.8)",p.style.color="#777",p.style.cursor="not-allowed",p.style.boxShadow="none"):(p.disabled=!1,p.style.backgroundColor="rgba(15, 40, 55, 0.8)",p.style.color="#fff",p.style.cursor="pointer",p.style.boxShadow=`0 0 10px ${u}`))};l("sell-orb-common",t.orbs.common,"rgba(0, 255, 102, 0.3)"),l("sell-orb-uncommon",t.orbs.uncommon,"rgba(0, 102, 255, 0.3)"),l("sell-orb-rare",t.orbs.rare,"rgba(153, 0, 255, 0.3)"),l("sell-orb-epic",t.orbs.epic,"rgba(255, 102, 0, 0.3)"),l("sell-orb-legendary",t.orbs.legendary,"rgba(255, 0, 0, 0.3)")}updateUpgradeButtonStatus(e,t,o,n){const s=document.getElementById(e);s&&(t<o?(s.disabled=!0,s.style.backgroundColor="#555",s.style.color="#777",s.style.cursor="not-allowed"):(s.disabled=!1,s.style.backgroundColor=n,s.style.color=n==="#ff9900"||n==="#30cfd0"?"#000":"#fff",s.style.cursor="pointer"))}updateSellButtonStatus(e,t,o){const n=document.getElementById(e);n&&(t===0?(n.disabled=!0,n.style.backgroundColor="rgba(40, 40, 40, 0.8)",n.style.borderColor="#555",n.style.color="#777",n.style.boxShadow="none",n.style.cursor="not-allowed"):(n.disabled=!1,n.style.backgroundColor="rgba(15, 40, 55, 0.8)",n.style.borderColor=o,n.style.color="#fff",n.style.boxShadow=`0 0 10px rgba(${parseInt(o.slice(1,3),16)}, ${parseInt(o.slice(3,5),16)}, ${parseInt(o.slice(5,7),16)}, 0.3)`,n.style.cursor="pointer"))}setupTouchEvents(){if(!this.isMobile)return;const e=document.getElementById("stargate-ui");if(!e)return;console.log("Setting up touch events for stargate UI");const t=document.getElementById("undock-btn");t&&(t.style.touchAction="manipulation",t.style.webkitTapHighlightColor="transparent",t.style.position="relative",t.style.zIndex="9999",t.addEventListener("touchstart",s=>{console.log("Touch start on undock button"),t.style.backgroundColor="#1b88db",t.style.transform="scale(0.98)",s.stopPropagation()},{passive:!1}),t.addEventListener("touchend",s=>{console.log("Touch end on undock button"),t.style.backgroundColor="#33aaff",t.style.transform="scale(1)",s.stopPropagation()},{passive:!1})),e.addEventListener("touchmove",s=>{s.stopPropagation()},{passive:!0}),e.addEventListener("touchstart",s=>{e.scrollTop<=0&&s.touches[0].screenY<s.touches[0].clientY&&s.preventDefault()},{passive:!1});const o=e.querySelectorAll(".tablinks");o.length>0&&o.forEach(s=>{s.addEventListener("touchend",a=>{a.preventDefault(),s.click()})}),e.querySelectorAll("button").forEach(s=>{s!==t&&(s.style.touchAction="manipulation",s.style.webkitTapHighlightColor="transparent",s.addEventListener("touchstart",()=>{s.style.transform="scale(0.98)"},{passive:!0}),s.addEventListener("touchend",()=>{s.style.transform="scale(1)"},{passive:!0}))})}setupEventHandlers(){const e=document.getElementById("create-custom-system");e&&e.addEventListener("click",()=>{window.game&&window.game.environment&&window.game.environment.customSystemCreator?(this.hide(),window.game.environment.customSystemCreator.show()):console.error("Custom system creator not available")});const t=document.getElementById("unleash-horde");t&&t.addEventListener("click",()=>{window.game&&window.game.ecsWorld&&window.game.ecsWorld.enemySystem&&window.game.ecsWorld.enemySystem.initialSpawnComplete?(console.log("HORDE MODE: Button clicked, showing confirmation"),this.showHordeConfirmation()):(console.log("HORDE MODE: Button clicked but spectral drones haven't appeared yet"),this.showNotification("Horde mode is only available after spectral drones appear in the sector.",16724016))});const o=document.getElementById("purchase-laser");o&&o.addEventListener("click",this.purchaseLaserTurret.bind(this)),document.getElementById("sell-orb-common").addEventListener("click",()=>{this.sellEnergyOrb("common")&&this.updateStargateUI(window.game.spaceship,window.game.controls.resources)}),document.getElementById("sell-orb-uncommon").addEventListener("click",()=>{this.sellEnergyOrb("uncommon")&&this.updateStargateUI(window.game.spaceship,window.game.controls.resources)}),document.getElementById("sell-orb-rare").addEventListener("click",()=>{this.sellEnergyOrb("rare")&&this.updateStargateUI(window.game.spaceship,window.game.controls.resources)}),document.getElementById("sell-orb-epic").addEventListener("click",()=>{this.sellEnergyOrb("epic")&&this.updateStargateUI(window.game.spaceship,window.game.controls.resources)}),document.getElementById("sell-orb-legendary").addEventListener("click",()=>{this.sellEnergyOrb("legendary")&&this.updateStargateUI(window.game.spaceship,window.game.controls.resources)})}showHordeConfirmation(){const e=document.createElement("div");e.id="horde-confirm-modal";const t=document.createElement("div");t.id="horde-confirm-content";const o=document.createElement("div");o.className="horde-confirm-title",o.textContent="UNLEASH THE HORDE?",t.appendChild(o);const n=document.createElement("div");n.className="horde-confirm-text",n.innerHTML=`
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
        `,t.appendChild(n);const s=document.createElement("div");s.className="horde-confirm-buttons";const a=document.createElement("button");a.className="horde-confirm-btn horde-confirm-yes",a.textContent="UNLEASH THEM",a.addEventListener("click",()=>{document.body.removeChild(e),this.hideStargateUI(),window.game&&typeof window.game.activateHordeMode=="function"?(window.game.activateHordeMode(),console.log("HORDE MODE: Activated via stargateInterface")):console.error("HORDE MODE: Failed to activate - game.activateHordeMode not available")});const i=document.createElement("button");i.className="horde-confirm-btn horde-confirm-no",i.textContent="CANCEL",i.addEventListener("click",()=>{document.body.removeChild(e)}),s.appendChild(i),s.appendChild(a),t.appendChild(s),e.appendChild(t),document.body.appendChild(e)}purchaseLaserTurret(){if(console.log("Attempting to purchase laser turret"),!window.game||!window.game.spaceship){console.error("Cannot purchase laser turret: game or spaceship not found");return}const e=window.game.spaceship;if(e.credits<1e3){console.log("Not enough credits to purchase laser turret"),window.mainMessageBus&&window.mainMessageBus.publish("ui.notification",{message:"Not enough credits to purchase laser turret",type:"error",duration:2});return}e.credits-=1e3,typeof e.deployableLaserCount>"u"&&(e.deployableLaserCount=0),e.deployableLaserCount++,window.game.audio&&window.game.audio.playSound&&window.game.audio.playSound("purchase"),this.updateStargateUI(e,window.game.controls.resources),window.mainMessageBus&&window.mainMessageBus.publish("ui.notification",{message:"Laser turret purchased",type:"success",duration:2}),console.log("Laser turret purchased successfully")}sellEnergyOrb(e){if(!window.game||!window.game.spaceship||!window.game.controls||!window.game.controls.resources)return console.error("Required game objects not available"),!1;const t=window.game.spaceship,o=window.game.controls.resources;if(!o.orbs)return o.orbs={common:0,uncommon:0,rare:0,epic:0,legendary:0},!1;if(!o.orbs[e]||o.orbs[e]<=0)return console.log(`No ${e} orbs available to sell`),!1;let n=0;switch(e){case"common":n=100;break;case"uncommon":n=500;break;case"rare":n=1500;break;case"epic":n=5e3;break;case"legendary":n=15e3;break;default:return console.error(`Unknown orb rarity: ${e}`),!1}o.orbs[e]--,t.credits+=n;const s=e.charAt(0).toUpperCase()+e.slice(1);return this.showNotification(`Sold ${s} Energy Orb for ${n} credits`,3386111),window.game.audio&&window.game.audio.playSoundEffect("sell",.5),!0}showNotification(e,t=3386111){const o=document.createElement("div");o.style.position="fixed",o.style.top="35%",o.style.left="50%",o.style.transform="translate(-50%, -50%)",o.style.backgroundColor="rgba(0, 0, 0, 0.8)",o.style.color="#fff",o.style.padding="15px 30px",o.style.borderRadius="10px",o.style.border=`2px solid #${t.toString(16).padStart(6,"0")}`,o.style.boxShadow=`0 0 15px #${t.toString(16).padStart(6,"0")}`,o.style.fontFamily="Courier New, monospace",o.style.fontSize="16px",o.style.zIndex="1001",o.style.textAlign="center",o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",o.style.transition="opacity 0.8s",setTimeout(()=>{o.remove()},800)},2e3)}}export{x as H,v as S};
//# sourceMappingURL=ui-modules-C3FA310U.js.map
