class r{constructor(){this.setupTargetingUI()}setupTargetingUI(){const t=document.createElement("div");t.id="lock-on-display",t.style.position="absolute",t.style.top="50%",t.style.left="50%",t.style.width="150px",t.style.height="150px",t.style.transform="translate(-50%, -50%)",t.style.border="2px dashed #ff0000",t.style.borderRadius="50%",t.style.boxSizing="border-box",t.style.display="none",t.style.zIndex="997",t.style.pointerEvents="none",document.body.appendChild(t);const o=document.createElement("div");o.style.position="absolute",o.style.width="100%",o.style.height="100%",o.style.top="0",o.style.left="0",o.innerHTML=`
            <div style="position: absolute; width: 2px; height: 30px; background-color: #ff0000; top: 0; left: 50%; transform: translateX(-50%);"></div>
            <div style="position: absolute; width: 2px; height: 30px; background-color: #ff0000; bottom: 0; left: 50%; transform: translateX(-50%);"></div>
            <div style="position: absolute; width: 30px; height: 2px; background-color: #ff0000; left: 0; top: 50%; transform: translateY(-50%);"></div>
            <div style="position: absolute; width: 30px; height: 2px; background-color: #ff0000; right: 0; top: 50%; transform: translateY(-50%);"></div>
        `,t.appendChild(o);const e=document.createElement("div");e.id="target-indicator",e.style.position="absolute",e.style.bottom="120px",e.style.left="50%",e.style.transform="translateX(-50%)",e.style.width="200px",e.style.textAlign="center",e.style.backgroundColor="rgba(255, 50, 50, 0.4)",e.style.border="1px solid #ff3030",e.style.borderRadius="10px",e.style.padding="8px",e.style.color="#ffffff",e.style.fontFamily="monospace",e.style.zIndex="100",e.style.display="none",e.style.boxShadow="0 0 10px #ff3030",e.innerHTML=`
            <div style="font-weight: bold; margin-bottom: 5px;">◎ TARGET LOCKED ◎</div>
            <div id="target-type">Asteroid</div>
            <div id="target-distance">Distance: 0 units</div>
            <div id="target-resource" style="color: #ffcc00;">Resource: Unknown</div>
        `,document.body.appendChild(e)}showLockOn(){const t=document.getElementById("lock-on-display");t&&(t.style.display="block")}hideLockOn(){const t=document.getElementById("lock-on-display");t&&(t.style.display="none")}updateTargetInfo(t,o,e){const s=document.getElementById("target-indicator"),l=document.getElementById("target-type"),d=document.getElementById("target-distance"),i=document.getElementById("target-resource");if(s&&l&&d){if(s.style.display="block",l.textContent=`${t}`,d.textContent=`Distance: ${Math.round(o)} units`,i&&e){let n="#cccccc";e.toLowerCase()==="iron"?n="#cccccc":e.toLowerCase()==="gold"?n="#ffcc00":e.toLowerCase()==="platinum"&&(n="#66ffff"),i.textContent=`Resource: ${e}`,i.style.color=n}this.addPulseEffect(s)}}addPulseEffect(t){if(t.style.animation="none",t.offsetWidth,t.style.animation="targetPulse 2s infinite",!document.getElementById("targeting-keyframes")){const o=document.createElement("style");o.id="targeting-keyframes",o.textContent=`
                @keyframes targetPulse {
                    0% { box-shadow: 0 0 10px #ff3030; }
                    50% { box-shadow: 0 0 20px #ff3030; }
                    100% { box-shadow: 0 0 10px #ff3030; }
                }
            `,document.head.appendChild(o)}}hideTargetInfo(){const t=document.getElementById("target-indicator");t&&(t.style.display="none")}}export{r as TargetingUI};
//# sourceMappingURL=targetingUI-DljOVUld.js.map
