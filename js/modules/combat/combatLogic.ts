/**
 * Combat Logic Module - Handles particle cannon firing and raycasting
 * 
 * This module contains the core combat logic for firing weapons,
 * performing raycasts, and applying damage to entities.
 */

import * as THREE from 'three';

export class CombatLogic {
    effectsManager: any;
    eventManager: any;
    aiSpawnerManager: any;
    raycaster: THREE.Raycaster;

    constructor(effectsManager: any, eventManager: any, aiSpawnerManager: any) {
        this.effectsManager = effectsManager;
        this.eventManager = eventManager;
        this.aiSpawnerManager = aiSpawnerManager;
        
        // Raycaster for weapon fire
        this.raycaster = new THREE.Raycaster();
    }

    /**
     * Fire the particle cannon with instant raycast damage
     */
    fireParticleCannon(scene: THREE.Scene, spaceship: any, world: any, _playerEntity: any, damage: number, lastFireTime: number, cooldown: number) {
        const now = performance.now();
        
        // Rate limiting
        if (now - lastFireTime < cooldown) {
            return { newLastFireTime: lastFireTime, success: false };
        }
        
        // Skip if no scene or spaceship
        if (!scene || !spaceship || !spaceship.mesh) {
            return { newLastFireTime: lastFireTime, success: false };
        }
        
        // Get firing position and direction
        const startPos = new THREE.Vector3();
        spaceship.mesh.getWorldPosition(startPos);
        
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(spaceship.mesh.quaternion);
        
        // Set raycaster
        this.raycaster.set(startPos, direction);
        this.raycaster.far = 2000; // Max range for particle cannon
        
        // Find all meshes to hit (enemies)
        // Optimization: only check objects in a specific group or with a specific tag
        const hitObjects: THREE.Object3D[] = [];
        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj !== spaceship.mesh && obj.visible) {
                // Heuristic: only hit enemies or asteroids
                if (obj.name && (obj.name.includes('enemy') || obj.name.includes('asteroid'))) {
                    hitObjects.push(obj);
                } else if ((obj as any).userData && (obj as any).userData.entityId) {
                    hitObjects.push(obj);
                }
            }
        });
        
        const intersects = this.raycaster.intersectObjects(hitObjects);
        
        let endPos = startPos.clone().add(direction.clone().multiplyScalar(2000));
        let hitEntityId = null;
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            endPos = hit.point;
            
            // Try to find entity ID from userData
            if (hit.object.userData && hit.object.userData.entityId) {
                hitEntityId = hit.object.userData.entityId;
                
                // Apply damage via event if world exists
                if (world && world.messageBus) {
                    world.messageBus.publish('entity.damage', {
                        entityId: hitEntityId,
                        damage: damage,
                        source: 'player',
                        hitPoint: hit.point,
                        hitNormal: hit.face ? hit.face.normal : null
                    });
                }
            }
            
            // Create impact effect
            if (this.effectsManager) {
                this.effectsManager.createExplosionEffect(hit.point, 500, true);
            }
        }
        
        // Create visual tracer beam
        if (this.effectsManager) {
            this.effectsManager.createInstantTracer(startPos, endPos, hitEntityId !== null);
            
            // Create muzzle flash
            this.effectsManager.createMuzzleFlash(startPos, direction);
        }
        
        // Play sound
        if ((window as any).game && (window as any).game.audio) {
            (window as any).game.audio.playEffect('laser_fire', 0.4);
        }

        // Trigger gamepad rumble
        if ((window as any).mainMessageBus) {
            (window as any).mainMessageBus.publish('input.vibrate', { intensity: 0.3, duration: 50 });
        }
        
        return { newLastFireTime: now, success: true };
    }
}
