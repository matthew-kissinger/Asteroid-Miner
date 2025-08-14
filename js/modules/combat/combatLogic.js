/**
 * Combat Logic Module - Handles projectile firing and enemy collision detection
 * 
 * This module contains the core combat mechanics including weapon firing,
 * enemy collision detection, and damage application.
 */

import * as THREE from 'three';

export class CombatLogic {
    constructor(effectsManager, eventManager, aiSpawnerManager) {
        this.effectsManager = effectsManager;
        this.eventManager = eventManager;
        this.aiSpawnerManager = aiSpawnerManager;
    }

    /**
     * Fire the particle cannon with raycast-based enemy collision detection
     */
    fireParticleCannon(scene, spaceship, world, playerEntity, projectileDamage, lastFireTime, cooldown) {
        if (!spaceship || !spaceship.mesh) return { success: false, newLastFireTime: lastFireTime };
        
        // Check cooldown - prevent firing too rapidly
        const currentTime = performance.now();
        if (currentTime - lastFireTime < cooldown) {
            // Still in cooldown period
            return { success: false, newLastFireTime: lastFireTime };
        }
        
        console.log("*** COMBAT MODULE: Firing pulse cannon with railgun effect ***");
        
        // Get ship transform data
        const shipPosition = spaceship.mesh.position.clone();
        
        // IMPROVED AIMING: Use raycasting from camera through crosshair
        const camera = scene.camera;
        if (!camera) {
            console.error("Camera not available for aiming");
            return { success: false, newLastFireTime: lastFireTime };
        }
        
        // Create a raycaster from camera center (crosshair position)
        const raycaster = new THREE.Raycaster();
        const screenCenter = new THREE.Vector2(0, 0);
        
        // Set the raycaster from camera through crosshair
        raycaster.setFromCamera(screenCenter, camera);
        
        // Get the ray direction in world space
        const direction = raycaster.ray.direction.clone().normalize();
        
        // Maximum range for weapon
        const maxRange = 5000;
        
        // Log the new direction approach
        console.log(`Projectile direction (using camera ray): ${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)}`);
        
        // Calculate weapon positions
        const weaponPositions = this.calculateWeaponPositions(shipPosition, direction);
        
        // Play projectile sound
        if (window.game && window.game.audio) {
            console.log("Playing ASMR projectile sound for particle cannon");
            window.game.audio.playSound('projectile');
        }
        
        // Check for enemy collisions
        const { leftHitPoint, rightHitPoint, leftHitEnemy, rightHitEnemy } = 
            this.checkEnemyCollisions(world, raycaster, shipPosition, playerEntity, projectileDamage);
        
        // Create instant tracer beams from weapon ports
        const leftEndPoint = leftHitPoint || weaponPositions.leftWeaponPosition.clone().add(direction.clone().multiplyScalar(maxRange));
        this.effectsManager.createInstantTracer(weaponPositions.leftWeaponPosition, leftEndPoint, leftHitEnemy, 0.4);
        
        const rightEndPoint = rightHitPoint || weaponPositions.rightWeaponPosition.clone().add(direction.clone().multiplyScalar(maxRange));
        this.effectsManager.createInstantTracer(weaponPositions.rightWeaponPosition, rightEndPoint, rightHitEnemy, 0.4);
        
        // Create impact effects if we hit something
        if (leftHitPoint && leftHitEnemy) {
            this.effectsManager.createExplosionEffect(leftHitPoint, 0.5);
        }
        if (rightHitPoint && rightHitEnemy && rightHitPoint.distanceTo(leftHitPoint || rightHitPoint) > 10) {
            // Only create second explosion if hit points are far enough apart
            this.effectsManager.createExplosionEffect(rightHitPoint, 0.5);
        }
        
        // Return successful firing with updated last fire time
        return { success: true, newLastFireTime: currentTime };
    }

    /**
     * Calculate weapon port positions for dual projectiles
     */
    calculateWeaponPositions(shipPosition, direction) {
        // Calculate right vector for offset
        const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
        
        // Position offsets for dual projectiles
        const leftOffset = new THREE.Vector3().copy(right).multiplyScalar(-1.5);
        const rightOffset = new THREE.Vector3().copy(right).multiplyScalar(1.5);
        
        // Calculate weapon port positions (where the beams originate)
        // Start beams 25 units in front of ship to avoid self-intersection when moving forward
        const weaponForwardOffset = new THREE.Vector3().copy(direction).multiplyScalar(25);
        
        const leftWeaponPosition = new THREE.Vector3().copy(shipPosition)
            .add(leftOffset)
            .add(weaponForwardOffset);
            
        const rightWeaponPosition = new THREE.Vector3().copy(shipPosition)
            .add(rightOffset)
            .add(weaponForwardOffset);

        return { leftWeaponPosition, rightWeaponPosition };
    }

    /**
     * Check for enemy collisions using raycasting
     */
    checkEnemyCollisions(world, raycaster, shipPosition, playerEntity, projectileDamage) {
        let leftHitPoint = null;
        let rightHitPoint = null;
        let leftHitEnemy = false;
        let rightHitEnemy = false;
        
        // DIRECT ENEMY CHECK - Find any enemies in the scene and check for direct hits
        console.log("DIRECT ENEMY CHECK: Searching for enemies to destroy");
        if (world && world.entityManager) {
            const enemies = this.findEnemies(world);
            
            // Check for collision with each enemy - using raycasting for better precision
            for (const enemy of enemies) {
                if (!enemy) continue;
                
                const hitResult = this.checkSingleEnemyCollision(enemy, raycaster, shipPosition, playerEntity, projectileDamage);
                if (hitResult.hit) {
                    // For simplicity, assign hit to left weapon (could be enhanced for dual weapon targeting)
                    if (!leftHitEnemy) {
                        leftHitPoint = hitResult.hitPoint;
                        leftHitEnemy = true;
                    } else if (!rightHitEnemy) {
                        rightHitPoint = hitResult.hitPoint;
                        rightHitEnemy = true;
                    }
                }
            }
        } else {
            console.log("No world or entityManager available for enemy check");
        }

        return { leftHitPoint, rightHitPoint, leftHitEnemy, rightHitEnemy };
    }

    /**
     * Find enemies in the world
     */
    findEnemies(world) {
        let enemies = [];
        
        // Try to get enemies from tag map
        try {
            if (world.entityManager.entitiesByTag && world.entityManager.entitiesByTag.get('enemy')) {
                enemies = world.entityManager.entitiesByTag.get('enemy');
                console.log(`Found ${enemies.length} enemies via tag map`);
            } else {
                // Fallback to checking all entities
                console.log("No enemy tag map, checking all entities");
                const allEntities = Array.from(world.entityManager.entities.values());
                for (const entity of allEntities) {
                    if (entity.hasTag && entity.hasTag('enemy')) {
                        enemies.push(entity);
                    } else if (entity.hasComponent && entity.hasComponent('EnemyAIComponent')) {
                        enemies.push(entity);
                    }
                }
                console.log(`Found ${enemies.length} enemies by checking all entities`);
            }
        } catch (error) {
            console.error("Error finding enemies:", error);
        }

        return enemies;
    }

    /**
     * Check collision with a single enemy
     */
    checkSingleEnemyCollision(enemy, raycaster, shipPosition, playerEntity, projectileDamage) {
        try {
            // Get enemy position for debugging
            let enemyPosition = null;
            const enemyTransform = enemy.getComponent('TransformComponent');
            if (enemyTransform) {
                enemyPosition = enemyTransform.position;
            } else {
                console.log("Enemy missing transform component");
                return { hit: false };
            }
            
            // Get enemy mesh component for collision detection
            const enemyMeshComponent = enemy.getComponent('MeshComponent');
            if (!enemyMeshComponent || !enemyMeshComponent.mesh) {
                console.log(`Enemy ${enemy.id} has no mesh component or mesh`);
                return { hit: false };
            }
            
            // Debug mesh properties
            console.log(`Testing ray intersection with enemy ${enemy.id}:`);
            console.log(`- Position: (${enemyPosition.x.toFixed(1)}, ${enemyPosition.y.toFixed(1)}, ${enemyPosition.z.toFixed(1)})`);
            console.log(`- Mesh visible: ${enemyMeshComponent.mesh.visible}`);
            console.log(`- Mesh children: ${enemyMeshComponent.mesh.children ? enemyMeshComponent.mesh.children.length : 0}`);
            
            // Calculate distance from ship to enemy (for debugging)
            const distanceToEnemy = shipPosition.distanceTo(enemyPosition);
            console.log(`- Distance to enemy: ${distanceToEnemy.toFixed(1)}`);
            
            // Skip if mesh is not visible
            if (!enemyMeshComponent.mesh.visible) {
                console.log(`Mesh for enemy ${enemy.id} is not visible, skipping`);
                return { hit: false };
            }
            
            // Perform the precise mesh intersection test
            const intersections = raycaster.intersectObject(enemyMeshComponent.mesh, true);
            
            if (intersections.length > 0) {
                // We have a mesh intersection!
                const intersection = intersections[0]; // closest intersection
                
                // Debug the hit
                console.log(`*** MESH HIT on enemy ${enemy.id}! ***`);
                console.log(`- Hit distance: ${intersection.distance.toFixed(2)}`);
                console.log(`- Hit point: (${intersection.point.x.toFixed(1)}, ${intersection.point.y.toFixed(1)}, ${intersection.point.z.toFixed(1)})`);
                
                if (intersection.object) {
                    console.log(`- Hit specific object: ${intersection.object.name || 'unnamed'}`);
                }
                
                if (intersection.face) {
                    console.log(`- Hit face normal: (${intersection.face.normal.x.toFixed(2)}, ${intersection.face.normal.y.toFixed(2)}, ${intersection.face.normal.z.toFixed(2)})`);
                }
                
                // Apply damage and handle destruction
                this.handleEnemyDamage(enemy, enemyPosition, projectileDamage, playerEntity);
                
                return { hit: true, hitPoint: intersection.point };
            } else {
                // Debug the miss
                console.log(`Ray missed enemy ${enemy.id} - no mesh intersection`);
                return { hit: false };
            }
        } catch (error) {
            console.error("Error checking enemy collision:", error);
            return { hit: false };
        }
    }

    /**
     * Handle enemy damage and destruction
     */
    handleEnemyDamage(enemy, enemyPosition, projectileDamage, playerEntity) {
        // Force destroy enemy via all possible methods
        // Method 1: Apply damage via health component
        const health = enemy.getComponent('HealthComponent');
        if (health) {
            console.log("Applying damage to enemy");
            // Use the standardized projectile damage value
            const damageResult = health.applyDamage(projectileDamage, 'particle', playerEntity);
            
            // Check if the damage was enough to destroy the enemy
            if (health.health <= 0) {
                console.log("Enemy health depleted, destroying entity");
                health.isDestroyed = true;
                
                // Create explosion effect for destroyed enemy
                if (enemyPosition) {
                    this.effectsManager.createExplosionEffect(enemyPosition.clone());
                    
                    // Play explosion sound if available
                    if (window.game && window.game.audio) {
                        window.game.audio.playSound('boink');
                    }
                }
                
                // Handle enemy destruction through AI spawner manager
                this.aiSpawnerManager.handleEnemyDestruction(enemy, 'projectile');
                
                // Notify enemy system about destruction
                this.eventManager.notifyEnemySystemDestruction(enemy, 'projectile');
                
                // Publish event about destruction
                this.eventManager.publishEnemyDestroyed(enemy.world || window.game?.ecsWorld, enemy.id, 'playerProjectile', enemyPosition);
                
                // Method 2: Direct entity destruction only if health is depleted
                try {
                    // Use system-specific methods if available
                    if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
                        const enemySystem = window.game.ecsWorld.enemySystem;
                        // Try returnEnemyToPool first which properly handles cleanup
                        if (typeof enemySystem.returnEnemyToPool === 'function') {
                            console.log(`Using EnemySystem.returnEnemyToPool for enemy ${enemy.id}`);
                            enemySystem.returnEnemyToPool(enemy);
                        }
                        // Force validation of references in EnemySystem
                        if (typeof enemySystem.validateEnemyReferences === 'function') {
                            enemySystem.validateEnemyReferences();
                        }
                    } else {
                        // Fallback to direct destruction
                        const world = enemy.world || window.game?.ecsWorld;
                        if (world && typeof world.destroyEntity === 'function') {
                            world.destroyEntity(enemy.id);
                            console.log("Enemy destroyed via world.destroyEntity");
                        }
                    }
                } catch (e) {
                    console.error("Failed to destroy enemy:", e);
                }
            } else {
                console.log(`Enemy hit but survived with ${health.health}/${health.maxHealth} health remaining`);
                // Non-lethal hit - no visual effect
            }
        }
    }
}