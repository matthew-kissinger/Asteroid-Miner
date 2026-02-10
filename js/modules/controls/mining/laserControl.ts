// laserControl.js - Handles laser beam visuals and control

import * as THREE from 'three';
import { createLaserMaterial } from '../../render/laserMaterial.ts';

interface SceneLike {
    isScene?: boolean;
}

interface WindowWithGame {
    game?: {
        renderer?: {
            scene?: THREE.Scene;
        };
    };
}

interface HasMesh {
    mesh: THREE.Object3D;
}

interface Spaceship extends HasMesh {
    miningEfficiency?: number;
    activateMiningLaser?: () => void;
    deactivateMiningLaser?: () => void;
}

interface AsteroidTarget extends HasMesh {
    resourceType?: string;
}

export class LaserControl {
    scene: SceneLike;
    spaceship: Spaceship;
    laserMesh: THREE.Mesh<THREE.CylinderGeometry, THREE.Material> | null;
    currentMaterial: THREE.Material | null;

    constructor(scene: SceneLike, spaceship: Spaceship) {
        this.scene = scene;
        this.spaceship = spaceship;
        this.laserMesh = null;
        this.currentMaterial = null;
    }

    /**
     * Get the Three.js scene from the renderer
     */
    getThreeScene(): THREE.Scene | null {
        // Access scene via window.game.renderer.scene as specified
        const gameWindow = window as WindowWithGame;
        if (gameWindow.game && gameWindow.game.renderer && gameWindow.game.renderer.scene) {
            return gameWindow.game.renderer.scene;
        }
        // Fallback: if scene passed to constructor is the Three.js scene
        if (this.scene && this.scene.isScene) {
            return this.scene as THREE.Scene;
        }
        return null;
    }

    /**
     * Get laser color based on resource type
     */
    getLaserColor(resourceType?: string): number {
        if (!resourceType) return 0xff3030; // Default red for iron
        
        const type = resourceType.toLowerCase();
        if (type === 'gold') {
            return 0xffcc00; // Gold color
        } else if (type === 'platinum') {
            return 0x66ffff; // Cyan color for platinum
        }
        return 0xff3030; // Default red for iron
    }

    /**
     * Update laser beam position and appearance
     */
    updateLaserBeam(targetAsteroid: AsteroidTarget | null): void {
        if (!this.laserMesh || !targetAsteroid || !this.spaceship.mesh) return;
        
        // Get source position (spaceship with offset)
        const sourcePosition = this.spaceship.mesh.position.clone();
        const shipOffset = new THREE.Vector3(0, 0, -60);
        shipOffset.applyQuaternion(this.spaceship.mesh.quaternion);
        sourcePosition.add(shipOffset);
        
        // Get target position (asteroid)
        const targetPosition = targetAsteroid.mesh.position.clone();
        
        // Calculate direction and distance
        const direction = new THREE.Vector3().subVectors(targetPosition, sourcePosition);
        const distance = direction.length();
        
        if (distance < 0.01) {
            // Too close, hide laser
            this.laserMesh.visible = false;
            return;
        }
        
        // Calculate midpoint
        const midpoint = new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5);
        
        // Position cylinder at midpoint
        this.laserMesh.position.copy(midpoint);
        
        // Reset rotation before applying new orientation
        this.laserMesh.rotation.set(0, 0, 0);
        
        // Orient cylinder toward target (makes local -Z point toward target)
        this.laserMesh.lookAt(targetPosition);
        
        // CylinderGeometry is Y-up by default, so rotate 90 degrees around X axis
        // to align Y-axis (cylinder length) with the direction toward target
        this.laserMesh.rotateX(Math.PI / 2);
        
        // Scale cylinder to match distance (scale along Y axis which is now the length)
        const baseRadius = 0.15;
        const efficiency = this.spaceship.miningEfficiency || 1.0;
        const radius = baseRadius * Math.sqrt(efficiency);
        this.laserMesh.scale.set(radius / baseRadius, distance, radius / baseRadius);
        
        // Update material color based on resource type
        if (targetAsteroid.resourceType && this.currentMaterial) {
            // TSL materials update automatically, but we may need to recreate if color changed
            // For now, the pulsing effect from TSL handles the animation
        }
        
        // Make sure laser is visible
        this.laserMesh.visible = true;
    }

    /**
     * Create or get laser beam mesh
     */
    setupLaserBeam(targetAsteroid: AsteroidTarget): void {
        const threeScene = this.getThreeScene();
        if (!threeScene) {
            console.error("LaserControl: Could not access Three.js scene");
            return;
        }
        
        // Clean up old DOM element if it exists (from previous CSS implementation)
        const oldLaserBeam = document.getElementById('laser-beam');
        if (oldLaserBeam) {
            oldLaserBeam.remove();
        }
        
        // Create mesh if it doesn't exist
        if (!this.laserMesh) {
            console.log("LaserControl: Creating 3D laser beam mesh");
            
            // Create cylinder geometry (radiusTop, radiusBottom, height, radialSegments)
            const geometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
            
            // Get color based on resource type
            const baseColor = targetAsteroid && targetAsteroid.resourceType 
                ? this.getLaserColor(targetAsteroid.resourceType)
                : 0xff3030; // Default red
            
            // Create TSL material
            this.currentMaterial = createLaserMaterial(baseColor, 8, 0.3) as THREE.Material;
            
            // Create mesh
            this.laserMesh = new THREE.Mesh(geometry, this.currentMaterial);
            
            // Initially hidden
            this.laserMesh.visible = false;
            
            // Add to scene
            threeScene.add(this.laserMesh);
        } else {
            // Update material color if resource type changed
            if (targetAsteroid && targetAsteroid.resourceType) {
                const newColor = this.getLaserColor(targetAsteroid.resourceType);
                // Dispose old material
                if (this.currentMaterial) {
                    this.currentMaterial.dispose();
                }
                // Create new material with correct color
                this.currentMaterial = createLaserMaterial(newColor, 8, 0.3) as THREE.Material;
                this.laserMesh.material = this.currentMaterial;
            }
            
            // Show laser beam
            this.laserMesh.visible = true;
        }
    }
    
    /**
     * Cleanup method to dispose of resources
     */
    dispose(): void {
        const threeScene = this.getThreeScene();
        
        if (this.laserMesh) {
            if (threeScene) {
                threeScene.remove(this.laserMesh);
            }
            if (this.laserMesh.geometry) {
                this.laserMesh.geometry.dispose();
            }
            if (this.currentMaterial) {
                this.currentMaterial.dispose();
            }
            this.laserMesh = null;
            this.currentMaterial = null;
        }
        
        // Clean up old DOM element if it exists
        const oldLaserBeam = document.getElementById('laser-beam');
        if (oldLaserBeam) {
            oldLaserBeam.remove();
        }
    }

    /**
     * Hide laser beam
     */
    hideLaserBeam(): void {
        if (this.laserMesh) {
            this.laserMesh.visible = false;
        }
    }

    /**
     * Activate spaceship's mining laser
     */
    activateSpaceshipLaser(): void {
        if (this.spaceship && typeof this.spaceship.activateMiningLaser === 'function') {
            this.spaceship.activateMiningLaser();
        }
    }

    /**
     * Deactivate spaceship's mining laser
     */
    deactivateSpaceshipLaser(): void {
        if (this.spaceship && typeof this.spaceship.deactivateMiningLaser === 'function') {
            this.spaceship.deactivateMiningLaser();
        }
    }
}
