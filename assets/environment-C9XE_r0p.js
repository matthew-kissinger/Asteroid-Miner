const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/asteroidBelt-DcXBFntH.js","assets/three-DBvJLP14.js","assets/spaceAnomalies-bosCSd9q.js","assets/systemTransition-C90waWqc.js","assets/vibeVersePortals-CvNQUYkr.js"])))=>i.map(i=>d[i]);
var oe=Object.defineProperty;var ae=(m,e,t)=>e in m?oe(m,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):m[e]=t;var a=(m,e,t)=>ae(m,typeof e!="symbol"?e+"":e,t);import{_ as A}from"./game-core-OtPnLuF2.js";import{a2 as U,S as v,a0 as F,a3 as H,C as d,B as re,a as x,a4 as le,o as I,V as b,a5 as E,a6 as j,a7 as W,G as T,r as _,N as y,n as G,L as Y,a8 as L,c as ce,a9 as ue,m as he}from"./three-DBvJLP14.js";class me{constructor(e){a(this,"scene");a(this,"skybox");a(this,"time");a(this,"textureLoader");a(this,"milkyWayTexture");a(this,"skyboxTextures");a(this,"solarSystemParams");a(this,"skyMaterial");this.scene=e,this.skybox=null,this.time=0,this.textureLoader=new U,this.milkyWayTexture=this.textureLoader.load("./assets/2k_stars_milky_way.jpg"),this.milkyWayTexture.colorSpace=v,this.skyboxTextures={},this.solarSystemParams={starDensity:1,nebulaDensity:.5,color:16777215,texturePath:"./assets/2k_stars_milky_way.jpg",brightness:1},this.createProceduralSkybox(this.solarSystemParams)}updateForSystem(e){e&&(console.log("Updating skybox with parameters:",e),(e.isSolarSystem||e.color===16777215&&e.starDensity===1&&e.nebulaDensity===.5)&&(console.log("Detected Solar System skybox parameters, using stored solar system configuration"),e=this.solarSystemParams),this.skybox&&(console.log("Removing existing skybox"),this.scene.remove(this.skybox)),e.resetTime&&(this.time=0),this.createProceduralSkybox(e))}getTexture(e){if(!e)return this.milkyWayTexture;if(e==="./assets/2k_stars_milky_way.jpg")return this.milkyWayTexture;let t=e;if(e.startsWith("/images/")){const i=window.location;(i==null?void 0:i.port)==="8000"&&(t=`http://${i.hostname}:8001${e}`,console.log(`Adjusted texture path to API server: ${t}`))}return this.skyboxTextures[e]||(console.log(`Loading new skybox texture: ${t}`),this.skyboxTextures[e]=this.textureLoader.load(t),this.skyboxTextures[e].colorSpace=v),this.skyboxTextures[e]}createProceduralSkybox(e={}){let t=(e==null?void 0:e.starDensity)||1,i=(e==null?void 0:e.nebulaDensity)||.5,s=(e==null?void 0:e.color)||0,n=(e==null?void 0:e.brightness)!==void 0?e.brightness:1;const o=32e4,l=(e==null?void 0:e.texturePath)||"./assets/2k_stars_milky_way.jpg";console.log(`Creating enhanced skybox with star density: ${t}, nebula density: ${i}, color: 0x${s.toString(16)}, texture: ${l}, brightness: ${n}`);const u=this.getTexture(l),r=new F({uniforms:{time:{value:this.time||0},milkyWayTexture:{value:u},starDensity:{value:t},nebulaDensity:{value:i},skyColor:{value:new d(s)},brightness:{value:n}},vertexShader:`
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,fragmentShader:`
                uniform sampler2D milkyWayTexture;
                uniform float time;
                uniform float starDensity;
                uniform float nebulaDensity;
                uniform vec3 skyColor;
                uniform float brightness;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    // Sample the Milky Way texture with adjusted brightness
                    vec4 milkyWay = texture2D(milkyWayTexture, vUv);
                    milkyWay.rgb *= 1.5 * brightness; // Apply brightness factor
                    
                    // Use only the Milky Way texture without procedural stars
                    vec3 finalColor = milkyWay.rgb * nebulaDensity * 1.2 * brightness;
                    
                    // Reduced ambient light
                    finalColor += vec3(0.05);
                    
                    // Subtle color tint
                    finalColor = mix(finalColor, skyColor * 1.2 * brightness, 0.1);
                    
                    // Apply gamma correction for more natural brightness
                    finalColor = pow(finalColor, vec3(0.9));
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,side:H}),c=new re(o,o,o);this.skybox=new x(c,r),this.skybox.rotation.x=Math.PI/4,this.skybox.rotation.y=Math.PI/6,this.scene.add(this.skybox),this.skyMaterial=r,console.log("Enhanced skybox created with texture")}update(e=.016,t){this.skyMaterial&&(this.time+=e*.1,this.skyMaterial.uniforms.time.value=this.time),this.skybox&&t&&this.skybox.position.copy(t.position)}dispose(){this.skybox&&this.scene.remove(this.skybox)}}class B{static createSunMaterial(){return new F({uniforms:{time:{value:0},sunColor:{value:new d(16742144)},surfaceDetail:{value:1.2},surfaceDistortion:{value:.3},sunActivity:{value:.8}},vertexShader:`
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,fragmentShader:`
                uniform float time;
                uniform vec3 sunColor;
                uniform float surfaceDetail;
                uniform float surfaceDistortion;
                uniform float sunActivity;
                
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                float hash(float n) { return fract(sin(n) * 43758.5453123); }
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                
                float noise(vec3 x) {
                    vec3 p = floor(x);
                    vec3 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    
                    float n = p.x + p.y * 157.0 + 113.0 * p.z;
                    return mix(
                        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y),
                        f.z);
                }
                
                float fbm(vec3 x) {
                    float v = 0.0;
                    float a = 0.5;
                    vec3 shift = vec3(100);
                    
                    for (int i = 0; i < 7; ++i) {
                        v += a * noise(x);
                        x = x * 2.0 + shift;
                        a *= 0.5;
                    }
                    
                    return v;
                }
                
                void main() {
                    vec3 surfacePos = vPosition * surfaceDetail * 0.01;
                    float granulation = fbm(surfacePos + time * 0.15);
                    
                    float flareBase = fbm(surfacePos * 2.5 + time * 0.3);
                    float flares = pow(flareBase, 1.8) * sunActivity;
                    flares = smoothstep(0.65, 0.9, flares);
                    
                    float hotspots = fbm(surfacePos * 3.0 + time * 0.2) * fbm(surfacePos * 1.5 - time * 0.1);
                    hotspots = pow(hotspots, 3.0) * 1.5;
                    
                    vec3 distortedNormal = vNormal;
                    distortedNormal.x += noise(surfacePos * 6.0 + time * 0.15) * surfaceDistortion;
                    distortedNormal.y += noise(surfacePos * 6.0 + time * 0.2) * surfaceDistortion;
                    distortedNormal.z += noise(surfacePos * 6.0 + time * 0.17) * surfaceDistortion;
                    distortedNormal = normalize(distortedNormal);
                    
                    float edgeBrightness = 1.0 - dot(distortedNormal, vec3(0.0, 0.0, 1.0));
                    edgeBrightness = pow(edgeBrightness, 2.5) * 0.4;
                    
                    vec3 baseColor = sunColor;
                    vec3 hotColor = vec3(1.0, 0.8, 0.4);
                    vec3 flareColor = vec3(1.0, 0.6, 0.3);
                    
                    vec3 finalColor = baseColor * (1.0 + granulation * 0.4);
                    finalColor = mix(finalColor, hotColor, hotspots);
                    finalColor += flareColor * flares;
                    finalColor += vec3(1.0, 0.9, 0.7) * edgeBrightness;
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,side:le})}static createCoronaMaterial(){return new F({uniforms:{time:{value:0},coronaColor:{value:new d(16750912)},viewVector:{value:new b(0,0,1)},turbulence:{value:.6}},vertexShader:`
                uniform vec3 viewVector;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vIntensity;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    
                    vec3 viewDir = normalize(viewVector);
                    vIntensity = pow(1.15 - dot(vNormal, viewDir), 1.5) * 0.8 + 0.2;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,fragmentShader:`
                uniform float time;
                uniform vec3 coronaColor;
                uniform float turbulence;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vIntensity;
                
                float hash(vec3 p) {
                    p = fract(p * vec3(443.897, 441.423, 437.195));
                    p += dot(p, p.yzx + 19.19);
                    return fract((p.x + p.y) * p.z);
                }
                
                float noise(vec3 p) {
                    vec3 i = floor(p);
                    vec3 f = fract(p);
                    f = f*f*(3.0-2.0*f);
                    
                    return mix(
                        mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                }
                
                float fbm(vec3 p) {
                    float f = 0.0;
                    float weight = 0.5;
                    for (int i = 0; i < 5; i++) {
                        f += weight * noise(p);
                        weight *= 0.5;
                        p *= 2.0;
                    }
                    return f;
                }
                
                void main() {
                    float turbulenceFactor = fbm(vPosition * 0.005 + time * 0.15) * turbulence;
                    float finalIntensity = vIntensity * (1.0 + turbulenceFactor);
                    
                    float wisps = fbm(vPosition * 0.01 - time * 0.05) * fbm(vPosition * 0.02 + time * 0.1);
                    wisps = pow(wisps, 2.0) * 0.5;
                    
                    vec3 finalColor = coronaColor * (finalIntensity + wisps);
                    
                    if (finalIntensity > 0.7) {
                        finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), (finalIntensity - 0.7) * 3.0);
                    }
                    
                    float alpha = smoothstep(0.0, 0.15, finalIntensity + wisps * 0.5);
                    
                    gl_FragColor = vec4(finalColor, alpha * 0.9);
                }
            `,transparent:!0,blending:I,depthWrite:!1,side:H})}static createOuterCoronaMaterial(){return new F({uniforms:{time:{value:0},coronaColor:{value:new d(16746496)},viewVector:{value:new b(0,0,1)}},vertexShader:`
                uniform vec3 viewVector;
                varying float vIntensity;
                varying vec3 vPosition;
                
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(viewVector);
                    vIntensity = pow(1.05 - dot(vNormal, vNormel), 2.0) * 0.7 + 0.3;
                    vPosition = position;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,fragmentShader:`
                uniform float time;
                uniform vec3 coronaColor;
                varying float vIntensity;
                varying vec3 vPosition;
                
                float hash(vec3 p) {
                    p = fract(p * vec3(443.897, 441.423, 437.195));
                    p += dot(p, p.yzx + 19.19);
                    return fract((p.x + p.y) * p.z);
                }
                
                float noise(vec3 p) {
                    vec3 i = floor(p);
                    vec3 f = fract(p);
                    f = f*f*(3.0-2.0*f);
                    
                    return mix(
                        mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                }
                
                void main() {
                    float noiseVal = noise(vPosition * 0.002 + time * 0.1);
                    float pulseIntensity = vIntensity * (1.0 + 0.2 * sin(time + noiseVal * 5.0));
                    
                    pulseIntensity += noiseVal * 0.2;
                    
                    vec3 glow = coronaColor * pulseIntensity;
                    gl_FragColor = vec4(glow, pulseIntensity * 0.4);
                }
            `,transparent:!0,blending:I,depthWrite:!1,side:H})}}class ge{constructor(e,t){a(this,"sunGroup");a(this,"lensFlares",[]);this.sunGroup=t,this.lensFlares=[],this.createFireballFlares()}createFireballFlares(){const e=["https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare0.png","https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare2.png","https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare3.png"],t=new U;this.clearFlares();const i=t.load(e[0]);i.colorSpace=v;const s=new E(new j({map:i,color:16755285,transparent:!0,blending:I,depthTest:!1}));s.scale.set(700,700,1),this.sunGroup.add(s),this.lensFlares.push(s);const n=8,o=300;for(let l=0;l<n;l++){const u=1+l%2,r=t.load(e[u]);r.colorSpace=v;const c=new E(new j({map:r,color:l%3===0?16764023:l%3===1?16746581:16737826,transparent:!0,blending:I,depthTest:!1})),h=l/n*Math.PI*2,g=Math.cos(h)*o,M=Math.sin(h)*o;c.position.set(g,M,0);const C=200+Math.random()*200;if(c.scale.set(C,C,1),this.sunGroup.add(c),this.lensFlares.push(c),l%2===0){const P=t.load(e[l%3]);P.colorSpace=v;const S=new E(new j({map:P,color:16755234,transparent:!0,blending:I,depthTest:!1})),k=o*2,R=h+(Math.random()*.2-.1),z=Math.cos(R)*k,V=Math.sin(R)*k;S.position.set(z,V,0);const D=100+Math.random()*150;S.scale.set(D,D,1),this.sunGroup.add(S),this.lensFlares.push(S)}}}clearFlares(){this.lensFlares.forEach(e=>{e.parent&&e.parent.remove(e)}),this.lensFlares=[]}updateFlareColors(e){this.lensFlares.forEach((t,i)=>{if(t&&t.material){const s=new d(e);i%3===0?s.r=Math.min(1,s.r*1.2):i%3===1&&(s.g=Math.min(1,s.g*1.1)),t.material.color=s}})}update(e,t){if(!t)return;const i=new b().subVectors(t.position,this.sunGroup.position).normalize();this.lensFlares.forEach((s,n)=>{if(!s)return;const o=.5+n%3*.3,l=.9+Math.sin(e*o+n)*.1;if(n===0){const r=700*l;s.scale.set(r,r,1)}else{const r=200+n%3*100,c=r*l;if(s.scale.set(c,c,1),s.userData.originalPos){const h=.1+n%5*.05,g=.3+n%4*.1;s.position.x=s.userData.originalPos.x+Math.sin(e*g)*h*r,s.position.y=s.userData.originalPos.y+Math.cos(e*g)*h*r}else s.userData.originalPos=s.position.clone()}const u=i.dot(new b(0,0,-1).applyQuaternion(t.quaternion));if(u>.5){const r=Math.min(1,(u-.5)/.3+.3);s.material.opacity=r,s.visible=!0}else{const r=Math.max(.1,(u+.5)/1)*.5;s.material.opacity=r,s.visible=!0}})}}class de{constructor(e,t,i){a(this,"sunGroup");a(this,"lightingManager");a(this,"config");a(this,"sunPointLight");a(this,"sunFlickerIntensity");a(this,"sunFlickerDirection");this.sunGroup=t,this.lightingManager=i,this.config={pointLight:{intensity:3e3,distance:1e5,decay:2},flicker:{intensity:1,direction:.01,minIntensity:.95,maxIntensity:1.05,speed:.015}},this.sunFlickerIntensity=this.config.flicker.intensity,this.sunFlickerDirection=this.config.flicker.direction,this.createLights()}createLights(){this.sunPointLight=new W(16775920,this.config.pointLight.intensity,this.config.pointLight.distance,this.config.pointLight.decay),this.sunGroup.add(this.sunPointLight)}updateForStarType(e,t,i,s=1){if(this.sunPointLight){this.sunPointLight.color.copy(new d(t));const n=this.config.pointLight.intensity,o=i/3e4;this.sunPointLight.intensity=n*(.8+o*.4)*s,this.sunPointLight._intensityMultiplier=s}if(this.lightingManager&&this.lightingManager.sunLight){const n=new d(t),o=new d(16774640);n.lerp(o,.5),this.lightingManager.sunLight.color.copy(n)}}update(e,t,i){if(this.sunFlickerIntensity+=this.sunFlickerDirection*this.config.flicker.speed,this.sunFlickerIntensity>this.config.flicker.maxIntensity?(this.sunFlickerIntensity=this.config.flicker.maxIntensity,this.sunFlickerDirection=-Math.random()*this.config.flicker.speed):this.sunFlickerIntensity<this.config.flicker.minIntensity&&(this.sunFlickerIntensity=this.config.flicker.minIntensity,this.sunFlickerDirection=Math.random()*this.config.flicker.speed),this.sunPointLight){const s=this.sunPointLight._intensityMultiplier||1,n=this.config.pointLight.intensity,o=i==="G"?1.1:i==="O"||i==="B"?1.3:i==="M"?.9:1;this.sunPointLight.intensity=n*this.sunFlickerIntensity*s*o}if(this.lightingManager){if(this.lightingManager.updateSunPosition(this.sunGroup.position),this.lightingManager.sunLight){const s=this.lightingManager.config.sun.intensity;this.lightingManager.sunLight.intensity=s*this.sunFlickerIntensity}t&&this.lightingManager.updateExposure(t.position)}}toggleShadowHelper(e){e&&this.lightingManager&&this.lightingManager.sunLight&&console.log("Shadow debugging should be enabled through the main LightingManager")}dispose(){this.sunPointLight&&(this.sunGroup.remove(this.sunPointLight),this.sunPointLight.dispose())}}class pe{constructor(e){a(this,"scene");a(this,"sun");a(this,"time");a(this,"sunType");a(this,"sunMaterial");a(this,"coronaMaterial");a(this,"outerCoronaMaterial");a(this,"lighting");a(this,"flares");this.scene=e,this.sun=null,this.time=0,this.sunType="G",this.createSun()}createSun(){this.sun=new T,this.sun.name="sun",this.scene.add(this.sun);const e=new _(1e3,64,64);this.sunMaterial=B.createSunMaterial();const t=new x(e,this.sunMaterial);this.sun.add(t);const i=new _(2e3,64,64);this.coronaMaterial=B.createCoronaMaterial();const s=new x(i,this.coronaMaterial);this.sun.add(s);const n=new _(3e3,32,32);this.outerCoronaMaterial=B.createOuterCoronaMaterial();const o=new x(n,this.outerCoronaMaterial);this.sun.add(o);const l=this.scene.lightingManager||null;this.lighting=new de(this.scene,this.sun,l),this.flares=new ge(this.scene,this.sun)}updateSunType(e,t=1){this.sunType=e||"G";let i,s,n;switch(this.sunType){case"O":i=10335487,s=3e4,n=.8;break;case"B":i=11190271,s=2e4,n=.75;break;case"A":i=13293567,s=1e4,n=.7;break;case"F":i=16316415,s=7e3,n=.65;break;case"G":i=16774378,s=5500,n=.6;break;case"K":i=16765601,s=4e3,n=.5;break;case"M":i=16764015,s=3e3,n=.4;break;default:i=16774378,s=5500,n=.6}if(this.sunMaterial&&(this.sunMaterial.uniforms.sunColor.value.setHex(i),this.sunMaterial.uniforms.sunActivity.value=n),this.coronaMaterial){const o=new d(i);o.r=Math.min(1,o.r*1.2),o.g=Math.min(1,o.g*1.1),this.coronaMaterial.uniforms.coronaColor.value=o}if(this.outerCoronaMaterial){const o=new d(i);o.r=Math.min(1,o.r*1.3),o.g=Math.min(1,o.g*1.2),o.b=Math.min(1,o.b*1.1),this.outerCoronaMaterial.uniforms.coronaColor.value=o}this.lighting.updateForStarType(this.sunType,i,s,t),this.flares.updateFlareColors(i),console.log(`Updated sun to type ${this.sunType}, color: ${i.toString(16)}, intensity multiplier: ${t}`)}getRadius(){return 3e3}getPosition(){return new b(0,0,0)}update(e=.016){if(this.sun){if(this.time+=e*.4,this.sunMaterial&&this.sunMaterial.uniforms.time&&(this.sunMaterial.uniforms.time.value=this.time),this.coronaMaterial&&this.coronaMaterial.uniforms.time&&(this.coronaMaterial.uniforms.time.value=this.time),this.outerCoronaMaterial&&this.outerCoronaMaterial.uniforms.time&&(this.outerCoronaMaterial.uniforms.time.value=this.time),this.scene&&this.scene.camera){const t=new b().subVectors(this.scene.camera.position,this.sun.position).normalize();this.coronaMaterial&&this.coronaMaterial.uniforms.viewVector&&(this.coronaMaterial.uniforms.viewVector.value=t),this.outerCoronaMaterial&&this.outerCoronaMaterial.uniforms.viewVector&&(this.outerCoronaMaterial.uniforms.viewVector.value=t)}this.scene.camera&&(this.lighting.update(e,this.scene.camera,this.sunType),this.flares.update(this.time,this.scene.camera))}}toggleShadowHelper(e){this.lighting.toggleShadowHelper(e)}dispose(){this.sun&&this.scene.remove(this.sun)}}class X{static generatePlanetsForSystem(e,t){if(console.log(`Generating new planets for system: ${e}`),t&&t.customPlanetData&&t.customPlanetData[e]){const h=t.customPlanetData[e];return console.log(`Using ${h.length} custom planets for system: ${e}`),h.forEach(g=>{g.textureUrl?console.log(`Custom planet ${g.name} has texture URL: ${g.textureUrl}`):console.log(`Custom planet ${g.name} does not have a texture URL`)}),t.customPlanetData[e]}const i=["New","Alpha","Beta","Gamma","Delta","Nova","Proxima","Ultima","Astro","Cosmo","Stella","Terra","Astra","Prime","Orb"],s=["sphere","world","orb","terra","oid","globus","ium","ian","aria","anth","urus","alos","onos","era","ax","is","os"],n=e.includes("System-")?e.split("-")[1][0]:"M",o=2+Math.floor(Math.random()*7),l=[];let u=1,r=1,c=[];switch(n){case"O":u=1.8,r=1.6,c=[6711039,10066431,13421823,11184895,8947933];break;case"B":u=1.5,r=1.3,c=[10070783,11189247,13421823,14540287,12298956];break;case"A":u=1.3,r=1.1,c=[13421823,14540287,15658751,16777215,14535901];break;case"F":u=1.1,r=1,c=[10070783,11193514,13426124,16764074,15658700];break;case"G":u=1,r=1,c=[11184810,4286945,13000005,14070398,15787465];break;case"K":u=.8,r=.9,c=[15125660,13413e3,14531481,12294519,13404262];break;case"M":u=.6,r=.7,c=[13395524,14514005,15632486,16750967,12277043];break;default:c=[11184810,4286945,13000005,14070398,15787465]}for(let h=0;h<o;h++){const g=i[Math.floor(Math.random()*i.length)],M=s[Math.floor(Math.random()*s.length)],C=`${g}${M}`,P=Math.random();let S;P<.5?S=(240+Math.random()*200)*u:P<.8?S=(440+Math.random()*280)*u:S=(720+Math.random()*360)*u;const k=4800+h*8e3,R=k*.2,z=(k+(Math.random()*R-R/2))*r,V=.002/(z/1e3),D=c[Math.floor(Math.random()*c.length)],se=S>600?Math.random()<.4:!1,ie=Math.random()*Math.PI*.5,ne=Math.random()*Math.PI*.2;l.push({name:C,size:Math.floor(S),distance:Math.floor(z),speed:V,color:D,rings:se,axialTilt:ie,orbitalTilt:ne})}return l}static createHomeSolarSystemPlanets(){return[{name:"Mercury",size:220,distance:4800,speed:.0016,color:11184810,rings:!1},{name:"Venus",size:400,distance:8e3,speed:.0013,color:15125660,rings:!1},{name:"Earth",size:420,distance:12e3,speed:.001,color:4286945,rings:!1},{name:"Mars",size:320,distance:16800,speed:8e-4,color:13000005,rings:!1},{name:"Jupiter",size:1e3,distance:3e4,speed:4e-4,color:14070398,rings:!0},{name:"Saturn",size:880,distance:4e4,speed:3e-4,color:15787465,rings:!0},{name:"Uranus",size:720,distance:56e3,speed:2e-4,color:13298929,rings:!0},{name:"Neptune",size:700,distance:72e3,speed:16e-5,color:6267867,rings:!1}]}}const w=new U,p={mercury:w.load("./assets/2k_mercury.jpg"),venus:{surface:w.load("./assets/2k_venus_surface.jpg"),atmosphere:w.load("./assets/2k_venus_atmosphere.jpg")},earth:w.load("./assets/2k_earth_daymap.jpg"),mars:w.load("./assets/2k_mars.jpg"),jupiter:w.load("./assets/2k_jupiter.jpg"),saturn:{surface:w.load("./assets/2k_saturn.jpg"),rings:w.load("./assets/2k_saturn_ring_alpha.png")},uranus:w.load("./assets/2k_uranus.jpg"),neptune:w.load("./assets/2k_neptune.jpg")};p.mercury.colorSpace=v;p.venus.surface.colorSpace=v;p.venus.atmosphere.colorSpace=v;p.earth.colorSpace=v;p.mars.colorSpace=v;p.jupiter.colorSpace=v;p.saturn.surface.colorSpace=v;p.saturn.rings.colorSpace=v;p.uranus.colorSpace=v;p.neptune.colorSpace=v;const K=[];for(let m=1;m<=22;m++){const e=w.load(`./assets/p${m}.jpeg`);e.colorSpace=v,K.push(e)}const fe=new U;class J{static createMaterialForPlanet(e){if(e.textureUrl){console.log(`Creating planet ${e.name} with custom texture: ${e.textureUrl}`);let t=e.textureUrl;e.textureUrl.startsWith("/images/")&&window.location.port==="8000"&&(t=`http://${window.location.hostname}:8001${e.textureUrl}`,console.log(`Adjusted planet texture path to API server: ${t}`));const i=fe.load(t);return i.colorSpace=v,new y({map:i,roughness:.5,metalness:0,flatShading:!1,emissive:new d(e.color||2236962),emissiveIntensity:.3})}switch(e.name){case"Mercury":return new y({map:p.mercury,roughness:.95,metalness:0,flatShading:!1,emissive:new d(2763306),emissiveIntensity:.15});case"Venus":return new y({map:p.venus.surface,roughness:.85,metalness:0,flatShading:!1,emissive:new d(4469538),emissiveIntensity:.2});case"Earth":return new y({map:p.earth,roughness:.75,metalness:0,flatShading:!1,emissive:new d(1122867),emissiveIntensity:.18});case"Mars":return new y({map:p.mars,roughness:.9,metalness:0,flatShading:!1,emissive:new d(4465169),emissiveIntensity:.18});case"Jupiter":return new y({map:p.jupiter,roughness:.8,metalness:0,flatShading:!1,emissive:new d(3351057),emissiveIntensity:.15});case"Saturn":return new y({map:p.saturn.surface,roughness:.85,metalness:0,flatShading:!1,emissive:new d(3351057),emissiveIntensity:.15});case"Uranus":return new y({map:p.uranus,roughness:.85,metalness:0,flatShading:!1,emissive:new d(1122867),emissiveIntensity:.14});case"Neptune":return new y({map:p.neptune,roughness:.85,metalness:0,flatShading:!1,emissive:new d(1122884),emissiveIntensity:.14});default:const t=Math.floor(Math.random()*K.length);return new y({map:K[t],roughness:.85,metalness:0,color:new d(e.color),flatShading:!1,emissive:new d(2236962),emissiveIntensity:.15})}}static createRingMaterial(e){return e.name==="Saturn"?new y({map:p.saturn.rings,side:G,transparent:!0,opacity:.8,roughness:.8,metalness:.1,emissive:new d(15787465),emissiveIntensity:.2,emissiveMap:p.saturn.rings}):new y({color:e.color,side:G,transparent:!0,opacity:.4,roughness:.7,metalness:.2,emissive:new d(e.color),emissiveIntensity:.3})}}class q{static createPlanetMesh(e){const t=new _(e.size,32,32),i=J.createMaterialForPlanet(e),s=new x(t,i),n=Math.random()*Math.PI*2,o=e.orbitalTilt||0,l=e.axialTilt||0;if(s.position.x=Math.cos(n)*e.distance,s.position.y=Math.sin(o)*e.distance,s.position.z=Math.sin(n)*Math.cos(o)*e.distance,s.rotation.x=l,s.castShadow=!0,s.receiveShadow=!0,e.rings){const u=q.createRingMesh(e);s.add(u)}return{mesh:s,distance:e.distance,speed:e.speed,angle:n,orbitalTilt:o}}static createRingMesh(e){let t;e.name==="Saturn"?t=new Y(e.size*1.4,e.size*2,32):t=new Y(e.size*1.3,e.size*1.8,32);const i=J.createRingMaterial(e),s=new x(t,i);return s.rotation.x=Math.PI/2,s.castShadow=!0,s.receiveShadow=!0,s}}class ye{constructor(e,t){a(this,"scene");a(this,"starSystemGenerator");a(this,"planets");a(this,"planetRegions");a(this,"currentSystemId");a(this,"systemPlanets");this.scene=e,this.starSystemGenerator=t,this.planets=[],this.planetRegions={},this.currentSystemId="Solar System",this.systemPlanets={},this.createHomeSolarSystem()}createHomeSolarSystem(){const e=X.createHomeSolarSystemPlanets();this.systemPlanets["Solar System"]=e,this.createPlanetsForSystem("Solar System")}createPlanetsForSystem(e){if(this.clearPlanets(),this.currentSystemId=e,this.systemPlanets[e]){this.createPlanetsFromData(this.systemPlanets[e]);return}const t=this.generatePlanetsForSystem(e);this.systemPlanets[e]=t,this.createPlanetsFromData(t)}generatePlanetsForSystem(e){return X.generatePlanetsForSystem(e,this.starSystemGenerator)}createPlanetsFromData(e){this.clearPlanets(),e.forEach(t=>{const i=q.createPlanetMesh(t);this.scene.add(i.mesh),this.planets.push(i),this.planetRegions[t.name]={name:t.name,position:i.mesh.position.clone(),radius:t.size*2}})}clearPlanets(){this.planets.forEach(e=>{this.scene.remove(e.mesh)}),this.planets=[],this.planetRegions={}}updateForSystem(e){return console.log(`Updating planets for system: ${e}`),this.createPlanetsForSystem(e),!0}getPlanetRegions(){return this.planetRegions}getPlanets(){return this.planets}update(e){this.planets.forEach(t=>{t.angle+=t.speed*e,t.mesh.position.x=Math.cos(t.angle)*t.distance,t.mesh.position.z=Math.sin(t.angle)*Math.cos(t.orbitalTilt)*t.distance,t.mesh.position.y=Math.sin(t.angle)*Math.sin(t.orbitalTilt)*t.distance,t.mesh.rotation.y+=e*.1,t.mesh&&Object.values(this.planetRegions).forEach(i=>{i&&i.position&&i.position.distanceTo(t.mesh.position)<5e3&&i.position.copy(t.mesh.position)})})}dispose(){this.clearPlanets()}}class ve{constructor(e){a(this,"scene");a(this,"stargate");a(this,"navLights");a(this,"portalParticles");a(this,"portalShaderMaterial");a(this,"portalLight");a(this,"counterRotatingRing");this.scene=e,this.stargate=null,this.navLights=[],this.portalParticles=[],this.createStargate()}createStargate(){const e=new T;e.name="stargate";const t=new L(1e3,200,32,100),i=new y({color:1118481,roughness:.9,metalness:.1,emissive:0}),s=new x(t,i);e.add(s);const n=(c,h,g={x:0,y:0,z:0},M={x:0,y:0,z:0})=>{const C=new L(c,h,16,100),P=new y({color:65535,emissive:65535,emissiveIntensity:1.5,roughness:.2,metalness:.8}),S=new x(C,P);return S.position.set(g.x,g.y,g.z),S.rotation.set(M.x,M.y,M.z),S},o=n(1060,10),l=n(940,10),u=n(850,5);e.add(o),e.add(l),e.add(u),this.createPortalEffect(e);const r=this.createNeonDetails();e.add(r),e.position.set(0,1e4,0),e.rotation.x=Math.PI/2,this.scene.add(e),this.stargate=e,this.createCounterRotatingRing(e)}createCounterRotatingRing(e){const t=new T,i=new L(820,3,16,100),s=new y({color:65535,emissive:65535,emissiveIntensity:2,roughness:.1,metalness:.9,transparent:!0,opacity:.7});for(let n=0;n<3;n++){const o=new x(i,s.clone());o.rotation.x=Math.PI*n/3,o.rotation.y=Math.PI*n/3,t.add(o)}e.add(t),this.counterRotatingRing=t}createPortalEffect(e){const t=new F({uniforms:{time:{value:0},resolution:{value:new ce(1024,1024)},baseColor:{value:new d(65535)}},vertexShader:`
            varying vec2 vUv;
            
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,fragmentShader:`
            uniform float time;
            uniform vec2 resolution;
            uniform vec3 baseColor;
            varying vec2 vUv;
            
            // Simple noise function
            float noise(vec2 p) {
              return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            // Smoothed noise
            float smoothNoise(vec2 p) {
              vec2 ip = floor(p);
              vec2 fp = fract(p);
              
              vec2 u = fp * fp * (3.0 - 2.0 * fp);
              
              float a = noise(ip);
              float b = noise(ip + vec2(1.0, 0.0));
              float c = noise(ip + vec2(0.0, 1.0));
              float d = noise(ip + vec2(1.0, 1.0));
              
              return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }
            
            // Fractal Brownian Motion
            float fbm(vec2 p) {
              float value = 0.0;
              float amplitude = 0.5;
              float frequency = 3.0;
              
              for (int i = 0; i < 6; i++) {
                value += amplitude * smoothNoise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
              }
              
              return value;
            }
            
            void main() {
              // Convert uv to be centered at (0.5, 0.5) with range -1 to 1
              vec2 centeredUV = (vUv - 0.5) * 2.0;
              float dist = length(centeredUV);
              
              // Create angle for rotation
              float angle = atan(centeredUV.y, centeredUV.x);
              
              // Enhanced swirling effect parameters - more aggressive
              float swirl = sin(angle * 6.0 + time * 2.0) * 0.5 + 0.5;
              float pulse = sin(time * 0.8) * 0.5 + 0.5;
              
              // Create more distorted coordinates for noise - enhances warp feel
              vec2 distortedUV = vec2(
                centeredUV.x + sin(time * 0.7 + centeredUV.y * 5.0) * 0.2,
                centeredUV.y + cos(time * 0.6 + centeredUV.x * 5.0) * 0.2
              );
              
              // Create noise patterns - more contrast
              float noiseValue = fbm(distortedUV * 3.0 + time * 0.3);
              float ripple = sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5;
              
              // Combine effects with more intensity
              float alpha = smoothstep(0.9, 0.0, dist);
              float intensity = mix(noiseValue, ripple, 0.7) * swirl * pulse;
              
              // Enhanced portal colors - bright cyan to deep blue
              vec3 darkColor = vec3(0.0, 0.1, 0.3);
              vec3 brightColor = vec3(0.0, 1.0, 1.0) * 2.0;
              vec3 accentColor = vec3(0.3, 0.8, 1.0);
              
              // More complex color mixing
              vec3 finalColor = mix(darkColor, brightColor, intensity);
              finalColor = mix(finalColor, accentColor, ripple * swirl);
              
              // Enhanced edge glow for portal effect
              float edgeGlow = smoothstep(0.8, 0.4, dist) * smoothstep(0.0, 0.6, dist);
              finalColor = mix(finalColor, brightColor, edgeGlow * pulse);
              
              // Add portal event horizon effect
              float eventHorizon = smoothstep(0.8, 0.78, dist) * 2.0;
              finalColor += vec3(0.0, 1.0, 1.0) * eventHorizon;
              
              gl_FragColor = vec4(finalColor, alpha);
            }
          `,transparent:!0,side:G}),i=new ue(800,128),s=new x(i,t);e.add(s);const n=new W(65535,400,2e3,2);n.position.set(0,0,0),e.add(n);const o=()=>{const l=new L(650,10,8,100),u=new y({color:65535,emissive:65535,emissiveIntensity:2,transparent:!0,opacity:.3,side:G}),r=new x(l,u);return r.rotation.x=Math.random()*Math.PI,r.rotation.y=Math.random()*Math.PI,r.userData={rotationSpeed:{x:(Math.random()-.5)*.02,y:(Math.random()-.5)*.02,z:(Math.random()-.5)*.02},pulseSpeed:.5+Math.random()*.3},this.portalParticles.push(r),r};for(let l=0;l<8;l++)e.add(o());this.portalShaderMaterial=t,this.portalLight=n}createNeonDetails(){const e=new T,t=i=>{const s=new T,n=new he(10,10,300,8),o=new y({color:65535,emissive:65535,emissiveIntensity:1,transparent:!0,opacity:.8}),l=new x(n,o);l.rotation.x=Math.PI/2;const u=new W(65535,100,400,2);return u.position.set(0,0,0),s.add(l),s.add(u),s.position.x=Math.cos(i)*1e3,s.position.y=Math.sin(i)*1e3,s.rotation.z=i-Math.PI/2,u.userData={originalIntensity:u.intensity,phase:Math.random()*Math.PI*2},this.navLights.push({light:u,lightMesh:l}),s};for(let i=0;i<8;i++){const s=i/8*Math.PI*2;e.add(t(s))}return e}getPosition(){return new b(0,1e4,0)}getRegionInfo(){return{center:new b(0,1e4,0),radius:2e3}}update(){if(this.navLights&&this.navLights.forEach(({light:e,lightMesh:t})=>{const i=Date.now()*.001,s=.7+.3*Math.sin(i*2+e.userData.phase);if(e.intensity=e.userData.originalIntensity*s,t.material){const n=t.material;n.emissiveIntensity=s,n.opacity=.5+s*.5}}),this.portalShaderMaterial&&(this.portalShaderMaterial.uniforms.time.value=Date.now()*.001,this.portalLight)){const e=Date.now()*.001;this.portalLight.intensity=400+Math.sin(e*2)*150}this.portalParticles&&this.portalParticles.forEach(e=>{const t=Date.now()*.001;if(e.userData.rotationSpeed&&(e.rotation.x+=e.userData.rotationSpeed.x,e.rotation.y+=e.userData.rotationSpeed.y,e.rotation.z+=e.userData.rotationSpeed.z),e.userData.pulseSpeed){const i=.9+.2*Math.sin(t*e.userData.pulseSpeed);e.scale.set(i,i,i)}}),this.counterRotatingRing&&(this.counterRotatingRing.rotation.x+=.006,this.counterRotatingRing.rotation.y+=.009,this.counterRotatingRing.rotation.z-=.003),this.stargate&&(this.stargate.rotation.x+=.003,this.stargate.rotation.y+=.0045,this.stargate.rotation.z+=.006)}dispose(){this.stargate&&this.scene.remove(this.stargate),this.stargate=null,this.navLights=[],this.portalParticles=[],this.portalShaderMaterial=void 0,this.portalLight=void 0,this.counterRotatingRing=void 0}}const N=["O","B","A","F","G","K","M"],Q=["Resource-Rich","Ancient","Unstable","Barren","Hazardous","Peaceful"],Z=["./assets/s1.jpg","./assets/s2.jpg","./assets/s3.jpg","./assets/s4.jpg","./assets/s5.jpg","./assets/s6.jpg","./assets/s7.jpg","./assets/s8.jpg","./assets/s9.jpg"],Se={O:{iron:.3,gold:.4,platinum:.3},B:{iron:.2,gold:.3,platinum:.5},A:{iron:.2,gold:.5,platinum:.3},F:{iron:.3,gold:.4,platinum:.3},G:{iron:.4,gold:.3,platinum:.3},K:{iron:.5,gold:.3,platinum:.2},M:{iron:.6,gold:.2,platinum:.2}},xe={"Resource-Rich":{iron:2,gold:2,platinum:2},Ancient:{iron:1,gold:1.5,platinum:2.5},Unstable:{iron:1,gold:1,platinum:3},Barren:{iron:.5,gold:.5,platinum:.5},Hazardous:{iron:1.5,gold:1.5,platinum:1.5},Peaceful:{iron:1,gold:1,platinum:1},"Home System":{iron:1,gold:1,platinum:1}},ee={O:10203391,B:11190271,A:13293567,F:16316415,G:16774378,K:16765601,M:16764015},te={O:255,B:4474111,A:8947967,F:14540287,G:16777181,K:16768426,M:16746598};class O{static generateSystemName(e){const t=["Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Eta","Theta","Proxima","Nova","Sirius","Vega","Rigel","Antares","Arcturus"],i=["Prime","Major","Minor","A","B","I","II","III","IV","V"],s=t[Math.floor(Math.random()*t.length)],n=Math.random()>.7?` ${i[Math.floor(Math.random()*i.length)]}`:"",o=Math.floor(Math.random()*999)+1;return`${s} ${e}${o}${n}`}static generateSpecialFeatures(e){const t=[];switch(e){case"Resource-Rich":t.push("Dense Asteroid Fields","Rich Mineral Veins");break;case"Ancient":t.push("Abandoned Structures","Ancient Artifacts");break;case"Unstable":t.push("Solar Flares","Radiation Bursts");break;case"Barren":t.push("Minimal Resources","Few Planets");break;case"Hazardous":t.push("Asteroid Storms","Energy Anomalies");break;case"Peaceful":t.push("Stable Environment","Optimal Mining Conditions");break}return t}static generateDescription(e,t){const i={O:"A rare, hot blue star system with intense radiation.",B:"A blue-white star system with high energy output.",A:"A white star system with moderate radiation levels.",F:"A yellow-white star system with mild conditions.",G:"A yellow star system similar to our Solar System.",K:"An orange star system with reduced energy output.",M:"A common red dwarf system with low energy output."},s={"Resource-Rich":"The system is known for its abundant resources and dense asteroid fields.",Ancient:"This ancient system contains remnants of long-lost civilizations.",Unstable:"Be cautious as unpredictable stellar activity occurs in this system.",Barren:"Resources are scarce in this mostly empty star system.",Hazardous:"Environmental hazards make mining operations difficult but rewarding.",Peaceful:"This system offers stable and optimal conditions for mining operations.","Home System":"Our home system, containing Earth and the origin of humanity."};return`${i[e]} ${s[t]}`}}class f{static getRandomStarClass(){const e=[1,2,5,10,15,20,50],t=e.reduce((s,n)=>s+n,0);let i=Math.random()*t;for(let s=0;s<e.length;s++){if(i<e[s])return N[s];i-=e[s]}return N[f.getRandomInt(0,N.length-1)]}static getRandomClassification(){return Q[f.getRandomInt(0,Q.length-1)]}static getRandomSkyboxTexture(){return Z[f.getRandomInt(0,Z.length-1)]}static generateMapPosition(){const e=150+Math.random()*100,t=Math.random()*Math.PI*2,i=Math.cos(t)*e,s=Math.sin(t)*e;return new b(i,s,0)}static getRandomInt(e,t){return Math.floor(Math.random()*(t-e+1))+e}static getRandomFloat(e,t){return Math.random()*(t-e)+e}static getRandomColor(){return Math.floor(Math.random()*16777215)}}class ${static createSolarSystem(){return{id:"Solar System",name:"Solar System",starClass:"G",classification:"Home System",starColor:16776960,planetCount:8,asteroidDensity:1,specialFeatures:["Earth"],description:"Our home system, with Earth as the starting location.",connections:[],position:new b(0,0,0),skyboxParams:{starDensity:1,nebulaDensity:.5,color:16777215,texturePath:"./assets/2k_stars_milky_way.jpg",brightness:1},resourceMultipliers:{iron:1,gold:1,platinum:1}}}static createRandomSystem(e){const t=f.getRandomStarClass(),i=f.getRandomClassification(),s=ee[t]||16777215,n=$.calculateResourceMultipliers(t,i),o=f.getRandomSkyboxTexture();return{id:e,name:O.generateSystemName(t),starClass:t,classification:i,starColor:s,planetCount:f.getRandomInt(2,10),asteroidDensity:f.getRandomFloat(.5,2.5),specialFeatures:O.generateSpecialFeatures(i),description:O.generateDescription(t,i),connections:[],position:f.generateMapPosition(),skyboxParams:{starDensity:f.getRandomFloat(.7,1.5),nebulaDensity:f.getRandomFloat(.3,1.2),color:te[t]||16777215,texturePath:o,brightness:.8},resourceMultipliers:n}}static calculateResourceMultipliers(e,t){const i=Se[e],s=xe[t];return{iron:i.iron*s.iron,gold:i.gold*s.gold,platinum:i.platinum*s.platinum}}static createCustomSystem(e){var t,i,s,n;return!e||!e.id||!e.name?(console.error("Invalid system data",e),null):{id:e.id,name:e.name,starClass:e.starClass||f.getRandomStarClass(),classification:e.classification||"Custom",starColor:e.starColor||ee[e.starClass||"G"],planetCount:e.planetData?e.planetData.length:0,asteroidDensity:e.asteroidDensity||1,specialFeatures:e.specialFeatures||["User Created"],description:e.description||"A custom star system created by the user",connections:[],position:e.position||f.generateMapPosition(),skyboxParams:{starDensity:((t=e.skyboxParams)==null?void 0:t.starDensity)||1,nebulaDensity:((i=e.skyboxParams)==null?void 0:i.nebulaDensity)||.8,color:((s=e.skyboxParams)==null?void 0:s.color)||te[e.starClass||"G"],texturePath:e.skyboxUrl||f.getRandomSkyboxTexture(),brightness:((n=e.skyboxParams)==null?void 0:n.brightness)||.8,isCustomTexture:!!e.skyboxUrl},resourceMultipliers:e.resourceMultipliers||{iron:1,gold:1,platinum:1},isCustomSystem:!0}}}class we{constructor(e){a(this,"scene");a(this,"systems");a(this,"currentSystem");a(this,"warpGates");a(this,"customPlanetData");this.scene=e,this.systems={},this.currentSystem=null,this.warpGates={},this.initializeSystems()}initializeSystems(){console.log("Initializing star systems..."),this.systems["Solar System"]=$.createSolarSystem(),this.generateRandomSystems(5),this.createSystemConnections(),this.setCurrentSystem("Solar System"),console.log("Star systems initialized")}generateRandomSystems(e){for(let t=0;t<e;t++){const i=`System-${t+1}`;this.systems[i]=$.createRandomSystem(i)}}createSystemConnections(){const e=Object.keys(this.systems),t=this.getRandomSystemsExcept("Solar System",2);for(const s of t)this.createConnection("Solar System",s);for(const s of e)if(this.systems[s].connections.length===0){const o=this.getRandomSystemExcept(s);this.createConnection(s,o)}const i=Math.floor(e.length/2);for(let s=0;s<i;s++){const n=e[f.getRandomInt(0,e.length-1)],o=this.getRandomSystemExcept(n);this.systems[n].connections.includes(o)||this.createConnection(n,o)}}createConnection(e,t){this.systems[e].connections.push(t),this.systems[t].connections.push(e),this.warpGates[e]||(this.warpGates[e]=[]),this.warpGates[t]||(this.warpGates[t]=[]),this.warpGates[e].push(t),this.warpGates[t].push(e),console.log(`Created connection between ${e} and ${t}`)}getCurrentSystemConnections(){return this.currentSystem?this.systems[this.currentSystem].connections:[]}getCurrentSystemResources(){return this.currentSystem?this.systems[this.currentSystem].resourceMultipliers:{iron:1,gold:1,platinum:1}}setCurrentSystem(e){return this.systems[e]?(this.currentSystem=e,console.log(`Traveled to system: ${e}`),!0):!1}travelToSystem(e){if(!this.systems[e])return console.error(`System ${e} does not exist`),!1;if(!this.getCurrentSystemConnections().includes(e))return console.error(`No connection from ${this.currentSystem} to ${e}`),!1;const i=window.game;if(i!=null&&i.spaceship&&i.spaceship.isDocked&&console.log("Player is docked during interstellar travel"),this.currentSystem&&this.systems[this.currentSystem]){const s=this.systems[this.currentSystem].skyboxParams;console.log(`${this.currentSystem} skybox params before travel: 
                         color=${s.color.toString(16)}, 
                         starDensity=${s.starDensity}, 
                         nebulaDensity=${s.nebulaDensity}, 
                         texture=${s.texturePath}`)}if(this.systems[e]){const s=this.systems[e].skyboxParams;console.log(`Traveling to ${e} with skybox params: 
                         color=${s.color.toString(16)}, 
                         starDensity=${s.starDensity}, 
                         nebulaDensity=${s.nebulaDensity}, 
                         texture=${s.texturePath}`)}return this.setCurrentSystem(e),!0}getAllSystems(){return this.systems}getCurrentSystemData(){return this.currentSystem?this.systems[this.currentSystem]:null}getRandomSystemsExcept(e,t){const i=Object.keys(this.systems).filter(n=>n!==e),s=[];for(let n=0;n<Math.min(t,i.length);n++){const o=f.getRandomInt(0,i.length-1);s.push(i[o]),i.splice(o,1)}return s}getRandomSystemExcept(e){const t=Object.keys(this.systems).filter(s=>s!==e),i=f.getRandomInt(0,t.length-1);return t[i]}addCustomSystem(e){const t=$.createCustomSystem(e);if(!t)return!1;this.systems[e.id]&&console.warn(`System with ID ${e.id} already exists, overwriting`),console.log(`Adding custom system: ${e.name} (${e.id})`),e.planetData&&Array.isArray(e.planetData)&&this.storePlanetData(e.id,e.planetData),this.systems[e.id]=t,this.createConnection("Solar System",e.id);const i=this.getRandomSystemExcept(e.id);return i&&this.createConnection(e.id,i),console.log(`Custom system ${e.name} added successfully with connections to Solar System and ${i||"no other system"}`),!0}storePlanetData(e,t){if(!Array.isArray(t)){console.error("Planet data must be an array");return}const i=[];for(let s=0;s<t.length;s++){const n=t[s];i.push({name:n.name||`Planet-${s+1}`,size:n.size||300+Math.random()*500,distance:n.distance||4800+s*8e3+Math.random()*2e3,speed:n.speed||.001+Math.random()*.001,color:n.color||f.getRandomColor(),rings:n.rings!==void 0?n.rings:Math.random()>.7,textureUrl:n.textureUrl||void 0,axialTilt:n.axialTilt||Math.random()*Math.PI*.5,orbitalTilt:n.orbitalTilt||Math.random()*Math.PI*.2})}this.customPlanetData||(this.customPlanetData={}),this.customPlanetData[e]=i,console.log(`Stored ${i.length} planets for system ${e}`)}returnFromTravel(){var i,s,n;console.log("StarSystemGenerator: Handling return from interstellar travel");const e=window.game;if(!e||!e.spaceship)return console.error("StarSystemGenerator: Cannot return from travel - game or spaceship not found"),!1;e.spaceship.isDocked||(console.log("StarSystemGenerator: Setting ship to docked state after travel"),e.spaceship.dock&&e.spaceship.dock());const t=(i=e.controls)==null?void 0:i.dockingSystem;return t&&(console.log("StarSystemGenerator: Repositioning ship near stargate"),t.positionNearStargate&&t.positionNearStargate(),typeof t.showStargateUI=="function")?(console.log("StarSystemGenerator: Showing stargate UI via docking system"),t.showStargateUI(),!0):(n=(s=e.ui)==null?void 0:s.stargateInterface)!=null&&n.showStargateUI?(console.log("StarSystemGenerator: Showing stargate UI via game.ui.stargateInterface"),e.ui.stargateInterface.showStargateUI(),!0):(console.warn("StarSystemGenerator: Could not fully complete return from travel"),!1)}}class Me{constructor(e){a(this,"scene");a(this,"componentsLoaded");a(this,"skybox");a(this,"sun");a(this,"starSystemGenerator");a(this,"planets");a(this,"stargate");a(this,"asteroidBelt");a(this,"spaceAnomalies");a(this,"systemTransition");a(this,"customSystemCreator");a(this,"vibeVersePortals");this.scene=e,this.componentsLoaded=!1}initializeEssentialComponents(){return console.log("Initializing essential environment components..."),this.skybox=new me(this.scene),this.sun=new pe(this.scene),this.starSystemGenerator=new we(this.scene),this.planets=new ye(this.scene,this.starSystemGenerator),this.stargate=new ve(this.scene),console.log("Essential environment components initialized"),{skybox:this.skybox,sun:this.sun,starSystemGenerator:this.starSystemGenerator,planets:this.planets,stargate:this.stargate}}async loadRemainingComponents(){console.log("Loading remaining environment components...");const{AsteroidBelt:e}=await A(async()=>{const{AsteroidBelt:n}=await import("./asteroidBelt-DcXBFntH.js");return{AsteroidBelt:n}},__vite__mapDeps([0,1]));this.asteroidBelt=new e(this.scene);const{SpaceAnomalies:t}=await A(async()=>{const{SpaceAnomalies:n}=await import("./spaceAnomalies-bosCSd9q.js");return{SpaceAnomalies:n}},__vite__mapDeps([2,1]));this.spaceAnomalies=new t(this.scene);const{SystemTransition:i}=await A(async()=>{const{SystemTransition:n}=await import("./systemTransition-C90waWqc.js");return{SystemTransition:n}},__vite__mapDeps([3,1]));this.systemTransition=new i(this.scene,this.scene.camera);const{CustomSystemCreator:s}=await A(async()=>{const{CustomSystemCreator:n}=await import("./customSystemCreator-CrsQgtpA.js");return{CustomSystemCreator:n}},[]);return this.customSystemCreator=new s(this.starSystemGenerator??null,this),console.log("Custom system creator initialized:",this.customSystemCreator),this.componentsLoaded=!0,console.log("All environment components initialized"),{asteroidBelt:this.asteroidBelt,spaceAnomalies:this.spaceAnomalies,systemTransition:this.systemTransition,customSystemCreator:this.customSystemCreator}}async initializePortals(e){const{VibeVersePortals:t}=await A(async()=>{const{VibeVersePortals:i}=await import("./vibeVersePortals-CvNQUYkr.js");return{VibeVersePortals:i}},__vite__mapDeps([4,1]));return this.vibeVersePortals=new t(this.scene,e),console.log("VibeVerse portals initialized"),this.vibeVersePortals}dispose(){this.skybox&&this.skybox.dispose(),this.sun&&this.sun.dispose(),this.planets&&this.planets.dispose(),this.asteroidBelt&&this.asteroidBelt.dispose(),this.stargate&&this.stargate.dispose(),this.spaceAnomalies&&this.spaceAnomalies.clearAllAnomalies(),this.vibeVersePortals&&this.vibeVersePortals.dispose()}}class be{constructor(){a(this,"planetRegions");this.planetRegions={}}setupInitialRegions(e,t,i){if(console.log("Setting up essential environment regions"),this.planetRegions={},i&&typeof i.getPlanetRegions=="function")try{this.planetRegions=i.getPlanetRegions()}catch(n){console.warn("Error getting planet regions:",n)}else console.warn("planets.getPlanetRegions is not available, using empty object instead");this.planetRegions.Sun={center:e.getPosition(),radius:e.getRadius()};const s=t.getRegionInfo();this.planetRegions.Stargate={center:s.center,radius:s.radius}}setupRegions(e,t,i,s,n){if(console.log("Setting up environment regions"),this.planetRegions={},i&&typeof i.getPlanetRegions=="function")try{this.planetRegions=i.getPlanetRegions()}catch(r){console.warn("Error getting planet regions in setupRegions:",r)}else console.warn("planets.getPlanetRegions is not available in setupRegions, using empty object");this.planetRegions.Sun={center:e.getPosition(),radius:e.getRadius()};const o=s.getRegionInfo();this.planetRegions["Asteroid Belt"]={center:o.center,minRadius:o.innerRadius,maxRadius:o.outerRadius};const l=t.getRegionInfo();this.planetRegions.Stargate={center:l.center,radius:l.radius};const u=n.getRegionInfo();this.planetRegions["Space Anomalies"]={center:u.center,minRadius:u.innerRadius,maxRadius:u.outerRadius}}getPlayerLocation(e,t,i,s){if(!e)return"Unknown Location";const n=this.planetRegions.Stargate,o=(n==null?void 0:n.center)??(n==null?void 0:n.position);if(n&&o){const r=e.distanceTo(o);if(n.radius&&r<=n.radius)return"Stargate"}if(s&&t&&typeof t.findClosestAnomaly=="function"){const r=t.findClosestAnomaly(e,2e3);if(r&&e.distanceTo(r.position)<800){let h="";switch(r.type){case"vortex":h="Vortex";break;case"crystalCluster":h="Crystal Cluster";break;case"nebulaNexus":h="Nebula Nexus";break;case"quantumFlux":h="Quantum Flux";break;case"darkMatter":h="Dark Matter";break}const g=r.orbCollected?"Depleted":"Active";return`${h} Anomaly (${g})`}}for(const[r,c]of Object.entries(this.planetRegions))if(r==="Asteroid Belt"&&s&&i){const h=c.center??c.position;if(!h)continue;const g=e.distanceTo(h);if(c.minRadius&&c.maxRadius&&g>=c.minRadius&&g<=c.maxRadius){const M=i.filter(C=>e.distanceTo(C.mesh.position)<500);return M.length>0?`Asteroid Field (${M.length} nearby)`:"Asteroid Belt"}}else if(r==="Space Anomalies"&&s){const h=c.center??c.position;if(!h)continue;const g=e.distanceTo(h);if(c.minRadius&&c.maxRadius&&g>=c.minRadius&&g<=c.maxRadius)return"Space Anomaly Field"}else if(r!=="Sun"&&r!=="Stargate"&&(c.center||c.position)&&c.radius){const h=c.center??c.position;if(!h)continue;if(e.distanceTo(h)<=c.radius)return`Near ${r}`}const l=this.planetRegions.Sun,u=(l==null?void 0:l.center)??(l==null?void 0:l.position);if(l&&u){const r=e.distanceTo(u);if(l.radius&&r<=l.radius)return"Near Sun"}return"Deep Space"}getPlanetRegions(){return this.planetRegions}}class Ce{constructor(){a(this,"currentSystemId");this.currentSystemId="Solar System"}setupSystemTransitionHandlers(e,t){if(e&&t){const i=e.getCurrentSystemResources();t.setResourceMultipliers(i)}}travelToSystem(e,t,i,s){return!t||!i?!1:t.travelToSystem(e)?(console.log(`Starting transition to system: ${e}`),i.startTransition(()=>{console.log(`Transition complete, updating environment for: ${e}`),s(e),this.showSystemWelcomeNotification(e,t);const n=window.game;n!=null&&n.spaceship&&n.spaceship.isDocked&&(console.log("Player is docked after arriving in new system, showing interface"),n.controls&&n.controls.dockingSystem&&setTimeout(()=>{var o,l;(l=(o=n.controls)==null?void 0:o.dockingSystem)!=null&&l.dockWithStargate&&n.controls.dockingSystem.dockWithStargate()},500))}),!0):(console.error(`Cannot travel to system ${e}`),!1)}updateEnvironmentForSystem(e,t,i,s,n,o,l,u){const r=t.getAllSystems()[e];if(!r){console.error(`No system data found for ${e}`);return}if(console.log(`Updating environment for system: ${e}`,r),this.currentSystemId=e,i&&i.updateForSystem)if(e==="Solar System"){const c={starDensity:1,nebulaDensity:.5,color:16777215,isSolarSystem:!0,resetTime:!0};console.log("Updating skybox for Solar System with enforced white color"),i.updateForSystem(c)}else console.log(`Updating skybox for ${e} with params:`,r.skyboxParams),i.updateForSystem(r.skyboxParams);else console.warn("Skybox or updateForSystem method not available");if(s){const c=r.lightIntensityMultiplier||1;s.updateSunType&&r.starClass?(console.log(`Updating sun type for ${e} to ${r.starClass} with intensity multiplier: ${c}`),s.updateSunType(r.starClass,c)):s.updateColor?(console.log(`Updating sun color for ${e} to:`,r.starColor.toString(16)),s.updateColor(r.starColor),s.sunLight&&(s.sunLight._intensityMultiplier=c)):console.warn("Sun update methods not available")}else console.warn("Sun not available");if(n&&n.updateForSystem)if(console.log(`Updating planets for ${e}`),n.updateForSystem(e),typeof n.getPlanetRegions=="function")try{u.planetRegions=n.getPlanetRegions()}catch(c){console.warn(`Error getting planet regions for system ${e}:`,c)}else console.warn(`planets.getPlanetRegions is not available for system ${e}`);else console.warn("Planets or updateForSystem method not available");o?(o.dispose&&(console.log(`Disposing old asteroids before updating for ${e}`),o.dispose()),o.createAsteroidBelt&&(console.log(`Creating new asteroids for ${e}`),o.createAsteroidBelt()),o.setResourceMultipliers&&(console.log(`Updating asteroid resources for ${e}:`,r.resourceMultipliers),o.setResourceMultipliers(r.resourceMultipliers)),o.updateDensity&&(console.log(`Updating asteroid density for ${e}:`,r.asteroidDensity),o.updateDensity(r.asteroidDensity))):console.warn("AsteroidBelt not available"),l&&l.updateForSystem?(console.log(`Updating space anomalies for ${e}`),l.updateForSystem(r)):console.warn("SpaceAnomalies or updateForSystem method not available"),console.log(`Environment updated for ${e}`)}showSystemWelcomeNotification(e,t){const i=t.getAllSystems()[e];if(!i)return;const s=document.createElement("div");s.style.position="fixed",s.style.top="25%",s.style.left="50%",s.style.transform="translate(-50%, -50%)",s.style.backgroundColor="rgba(0, 0, 0, 0.8)",s.style.color="#fff",s.style.padding="20px 40px",s.style.borderRadius="10px",s.style.border=`2px solid #${i.starColor.toString(16).padStart(6,"0")}`,s.style.boxShadow=`0 0 30px #${i.starColor.toString(16).padStart(6,"0")}`,s.style.fontFamily="Courier New, monospace",s.style.fontSize="18px",s.style.zIndex="9999",s.style.textAlign="center",e==="Solar System"?s.innerHTML=`
                <h2 style="color: #30cfd0; margin-top: 0;">Welcome to the Solar System</h2>
                <p>Your home system, with Earth as your starting location.</p>
                <p style="font-size: 14px; margin-bottom: 0; color: #aaa;">Safe travels, commander.</p>
            `:s.innerHTML=`
                <h2 style="color: #${i.starColor.toString(16).padStart(6,"0")}; margin-top: 0;">Welcome to ${i.name}</h2>
                <p>${i.description}</p>
                <p style="font-size: 14px; margin-bottom: 0; color: #aaa;">Classification: ${i.classification} - Star Class: ${i.starClass}</p>
            `,document.body.appendChild(s),setTimeout(()=>{s.style.opacity="0",s.style.transition="opacity 1s",setTimeout(()=>{s.remove()},1e3)},5e3)}getCurrentSystemId(){return this.currentSystemId}}class Ae{constructor(e){a(this,"scene");a(this,"componentsLoaded");a(this,"sceneInitializer");a(this,"regionManager");a(this,"transitionManager");a(this,"skybox");a(this,"sun");a(this,"starSystemGenerator");a(this,"planets");a(this,"stargate");a(this,"asteroidBelt");a(this,"spaceAnomalies");a(this,"systemTransition");a(this,"customSystemCreator");a(this,"asteroids");a(this,"currentSystemId");a(this,"spaceship");a(this,"vibeVersePortals");this.scene=e,this.componentsLoaded=!1,this.sceneInitializer=new Me(e),this.regionManager=new be,this.transitionManager=new Ce;const t=this.sceneInitializer.initializeEssentialComponents();Object.assign(this,t),this.asteroids=[],this.currentSystemId=this.transitionManager.getCurrentSystemId(),this.regionManager.setupInitialRegions(this.sun,this.stargate,this.planets),setTimeout(async()=>{const i=await this.sceneInitializer.loadRemainingComponents();Object.assign(this,i),this.asteroidBelt&&(this.asteroids=this.asteroidBelt.getAsteroids()),this.componentsLoaded=!0},500)}async setSpaceship(e){this.spaceship=e,this.vibeVersePortals=await this.sceneInitializer.initializePortals(e)}travelToSystem(e){return this.transitionManager.travelToSystem(e,this.starSystemGenerator,this.systemTransition,t=>this.updateEnvironmentForSystem(t))}updateEnvironmentForSystem(e){this.transitionManager.updateEnvironmentForSystem(e,this.starSystemGenerator,this.skybox,this.sun,this.planets,this.asteroidBelt,this.spaceAnomalies,this.regionManager),this.currentSystemId=this.transitionManager.getCurrentSystemId()}getPlayerLocation(e){return this.regionManager.getPlayerLocation(e,this.spaceAnomalies,this.asteroids,this.componentsLoaded)}getPlanetRegions(){return this.regionManager.getPlanetRegions()}findClosestAsteroid(e,t){return this.componentsLoaded&&this.asteroidBelt&&typeof this.asteroidBelt.findClosestAsteroid=="function"?this.asteroidBelt.findClosestAsteroid(e,t):null}findClosestAnomaly(e,t){return this.componentsLoaded&&this.spaceAnomalies&&typeof this.spaceAnomalies.findClosestAnomaly=="function"?this.spaceAnomalies.findClosestAnomaly(e,t):null}checkAnomalyCollision(e){if(!this.componentsLoaded||!this.spaceAnomalies)return null;const t=this.spaceAnomalies.findClosestAnomaly(e,8e3);return t&&this.spaceAnomalies.checkCollision(e,t)?t:null}collectAnomalyOrb(e){if(this.componentsLoaded&&this.spaceAnomalies&&typeof this.spaceAnomalies.collectOrb=="function")return this.spaceAnomalies.collectOrb(e)}update(e=.016,t){this.skybox&&typeof this.skybox.update=="function"&&this.skybox.update(e),this.sun&&typeof this.sun.update=="function"&&this.sun.update(e),this.planets&&typeof this.planets.update=="function"&&this.planets.update(e),this.systemTransition&&typeof this.systemTransition.update=="function"&&this.systemTransition.update(e),this.componentsLoaded&&(this.asteroidBelt&&typeof this.asteroidBelt.update=="function"&&this.asteroidBelt.update(e),this.stargate&&typeof this.stargate.update=="function"&&this.stargate.update(e),this.spaceAnomalies&&typeof this.spaceAnomalies.update=="function"&&this.spaceAnomalies.update(e,t),this.vibeVersePortals&&typeof this.vibeVersePortals.update=="function"&&this.vibeVersePortals.update(e))}dispose(){this.sceneInitializer&&this.sceneInitializer.dispose()}}export{Ae as Environment};
//# sourceMappingURL=environment-C9XE_r0p.js.map
