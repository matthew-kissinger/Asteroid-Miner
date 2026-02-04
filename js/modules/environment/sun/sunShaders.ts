// sunShaders.ts - Sun shader materials and effects

import * as THREE from 'three';

export class SunShaders {
    static createSunMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                sunColor: { value: new THREE.Color(0xff7700) },
                surfaceDetail: { value: 1.2 },
                surfaceDistortion: { value: 0.3 },
                sunActivity: { value: 0.8 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
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
            `,
            side: THREE.FrontSide
        });
    }

    static createCoronaMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coronaColor: { value: new THREE.Color(0xff9940) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) },
                turbulence: { value: 0.6 }
            },
            vertexShader: `
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
            `,
            fragmentShader: `
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
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide
        });
    }

    static createOuterCoronaMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coronaColor: { value: new THREE.Color(0xff8800) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) }
            },
            vertexShader: `
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
            `,
            fragmentShader: `
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
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide
        });
    }
}