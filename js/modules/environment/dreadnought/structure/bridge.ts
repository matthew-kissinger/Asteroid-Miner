// bridge.ts - Creates the command bridge and tower structures for the Star Dreadnought

import * as THREE from 'three';

interface BridgeComponents {
    mainTower: THREE.Mesh;
    leftTower: THREE.Mesh;
    rightTower: THREE.Mesh;
}

export class DreadnoughtBridge {
    static createCommandBridge(scale: number, ship: THREE.Group): BridgeComponents {
        // Command bridge superstructure - distinctive two-tower design
        const bridgeHeight = scale * 0.12;
        const bridgeWidth = scale * 0.06;
        const bridgeDepth = scale * 0.08;
        const bridgeY = scale * 0.085; // Position on top of hull
        const bridgeZ = scale * 0.28; // Position toward the back

        // Bridge material - slightly lighter than hull
        const bridgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x555566,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x222222,
            emissiveIntensity: 0.2
        });

        // Main command tower (larger)
        const mainTowerGeometry = new THREE.BoxGeometry(bridgeWidth, bridgeHeight, bridgeDepth);
        const mainTower = new THREE.Mesh(mainTowerGeometry, bridgeMaterial);
        mainTower.position.set(0, bridgeY, bridgeZ);
        mainTower.castShadow = true;
        mainTower.receiveShadow = true;
        ship.add(mainTower);

        // Add windows to the bridge
        this.addBridgeWindows(scale, ship, bridgeY, bridgeZ);

        // Secondary command towers (smaller)
        const secondaryTowerScale = 0.7; // 70% the size of main tower
        const secondaryTowerGeometry = new THREE.BoxGeometry(
            bridgeWidth * secondaryTowerScale,
            bridgeHeight * secondaryTowerScale,
            bridgeDepth * secondaryTowerScale
        );

        // Left tower
        const leftTower = new THREE.Mesh(secondaryTowerGeometry, bridgeMaterial);
        leftTower.position.set(-bridgeWidth * 1.2, bridgeY, bridgeZ + bridgeDepth * 0.6);
        leftTower.castShadow = true;
        leftTower.receiveShadow = true;
        ship.add(leftTower);

        // Right tower
        const rightTower = new THREE.Mesh(secondaryTowerGeometry, bridgeMaterial);
        rightTower.position.set(bridgeWidth * 1.2, bridgeY, bridgeZ + bridgeDepth * 0.6);
        rightTower.castShadow = true;
        rightTower.receiveShadow = true;
        ship.add(rightTower);

        return { mainTower, leftTower, rightTower };
    }

    static addBridgeWindows(scale: number, ship: THREE.Group, bridgeY: number, bridgeZ: number): void {
        // Add illuminated windows to the bridge
        const windowSize = scale * 0.003;
        const windowSpacing = scale * 0.006;
        const windowRows = 6;
        const windowCols = 10;
        const windowsStartY = bridgeY - scale * 0.02;
        const windowDepth = scale * 0.001;

        // Window material - emissive for glow
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xaabbcc,
            emissive: 0xaabbcc,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });

        // Create window instances
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                // Random chance to skip a window (for variety)
                if (Math.random() > 0.85) continue;

                const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, windowDepth);
                const window = new THREE.Mesh(windowGeometry, windowMaterial);

                // Position window on the front face of the bridge
                window.position.set(
                    (col - windowCols / 2) * windowSpacing,
                    windowsStartY + row * windowSpacing,
                    bridgeZ + scale * 0.04 + windowDepth
                );

                ship.add(window);
            }
        }
    }
}