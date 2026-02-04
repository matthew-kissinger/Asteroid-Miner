// sunFlares.ts - Sun lens flare and particle effects

import * as THREE from 'three';

export class SunFlares {
    private sunGroup: THREE.Group;
    private lensFlares: THREE.Sprite[] = [];

    constructor(_scene: THREE.Scene, sunGroup: THREE.Group) {
        this.sunGroup = sunGroup;
        this.lensFlares = [];
        this.createFireballFlares();
    }

    private createFireballFlares(): void {
        const flareTextures = [
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare0.png',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare2.png',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare3.png'
        ];
        
        const textureLoader = new THREE.TextureLoader();
        
        this.clearFlares();
        
        // Create main central flare
        const mainFlareTexture = textureLoader.load(flareTextures[0]);
        mainFlareTexture.colorSpace = THREE.SRGBColorSpace;
        const mainFlare = new THREE.Sprite(new THREE.SpriteMaterial({
            map: mainFlareTexture,
            color: 0xffaa55,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        }));
        mainFlare.scale.set(700, 700, 1.0);
        this.sunGroup.add(mainFlare);
        this.lensFlares.push(mainFlare);
        
        // Create smaller surrounding flares
        const flareCount = 8;
        const radius = 300;
        
        for (let i = 0; i < flareCount; i++) {
            const textureIndex = 1 + (i % 2);
            const flareTexture = textureLoader.load(flareTextures[textureIndex]);
            flareTexture.colorSpace = THREE.SRGBColorSpace;
            
            const flare = new THREE.Sprite(new THREE.SpriteMaterial({
                map: flareTexture,
                color: i % 3 === 0 ? 0xffcc77 : (i % 3 === 1 ? 0xff8855 : 0xff6622),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthTest: false
            }));
            
            const angle = (i / flareCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            flare.position.set(x, y, 0);
            
            const size = 200 + Math.random() * 200;
            flare.scale.set(size, size, 1.0);
            
            this.sunGroup.add(flare);
            this.lensFlares.push(flare);
            
            if (i % 2 === 0) {
                const smallFlareTexture = textureLoader.load(flareTextures[i % 3]);
                smallFlareTexture.colorSpace = THREE.SRGBColorSpace;
                
                const smallFlare = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: smallFlareTexture,
                    color: 0xffaa22,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthTest: false
                }));
                
                const farRadius = radius * 2;
                const farAngle = angle + (Math.random() * 0.2 - 0.1);
                const farX = Math.cos(farAngle) * farRadius;
                const farY = Math.sin(farAngle) * farRadius;
                smallFlare.position.set(farX, farY, 0);
                
                const smallSize = 100 + Math.random() * 150;
                smallFlare.scale.set(smallSize, smallSize, 1.0);
                
                this.sunGroup.add(smallFlare);
                this.lensFlares.push(smallFlare);
            }
        }
    }

    private clearFlares(): void {
        this.lensFlares.forEach(flare => {
            if (flare.parent) flare.parent.remove(flare);
        });
        this.lensFlares = [];
    }

    public updateFlareColors(color: THREE.ColorRepresentation): void {
        this.lensFlares.forEach((flare, index) => {
            if (flare && flare.material) {
                const flareColor = new THREE.Color(color);
                if (index % 3 === 0) {
                    flareColor.r = Math.min(1.0, flareColor.r * 1.2);
                } else if (index % 3 === 1) {
                    flareColor.g = Math.min(1.0, flareColor.g * 1.1);
                }
                flare.material.color = flareColor;
            }
        });
    }

    public update(time: number, camera: THREE.Camera): void {
        if (!camera) return;

        const viewVector = new THREE.Vector3().subVectors(
            camera.position,
            this.sunGroup.position
        ).normalize();

        this.lensFlares.forEach((flare, index) => {
            if (!flare) return;
            
            const pulseSpeed = 0.5 + (index % 3) * 0.3;
            const pulseFactor = 0.9 + Math.sin(time * pulseSpeed + index) * 0.1;
            
            if (index === 0) {
                const mainScale = 700 * pulseFactor;
                flare.scale.set(mainScale, mainScale, 1.0);
            } else {
                const originalSize = 200 + (index % 3) * 100;
                const size = originalSize * pulseFactor;
                flare.scale.set(size, size, 1.0);
                
                if (flare.userData.originalPos) {
                    const orbit = 0.1 + (index % 5) * 0.05;
                    const orbitSpeed = 0.3 + (index % 4) * 0.1;
                    flare.position.x = flare.userData.originalPos.x + Math.sin(time * orbitSpeed) * orbit * originalSize;
                    flare.position.y = flare.userData.originalPos.y + Math.cos(time * orbitSpeed) * orbit * originalSize;
                } else {
                    flare.userData.originalPos = flare.position.clone();
                }
            }
            
            const angleToCam = viewVector.dot(new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
            
            if (angleToCam > 0.5) {
                const opacity = Math.min(1.0, (angleToCam - 0.5) / 0.3 + 0.3);
                flare.material.opacity = opacity;
                flare.visible = true;
            } else {
                const reducedOpacity = Math.max(0.1, (angleToCam + 0.5) / 1.0) * 0.5;
                flare.material.opacity = reducedOpacity;
                flare.visible = true;
            }
        });
    }
}