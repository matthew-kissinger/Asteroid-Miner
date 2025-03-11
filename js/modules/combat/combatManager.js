/**
 * Combat Manager - Thin adapter for ECS-based combat systems
 * 
 * Acts as a bridge between the main game and the ECS combat implementation.
 * This refactored version removes all deprecated methods and provides a clean
 * interface to the underlying ECS systems.
 */

export class CombatManager {
    constructor(scene, spaceship, environment) {
        this.scene = scene;
        this.spaceship = spaceship;
        this.environment = environment;
        
        console.log("Initializing combat manager as ECS adapter...");
        
        // Provide a compatible interface for existing code
        this.enemies = [];
        
        // Combat stats for UI/game over screen
        this.stats = {
            enemiesDestroyed: 0,
            damageDealt: 0,
            damageReceived: 0
        };
        
        // Try to get a reference to the ECS world if it exists
        this.ecsWorld = scene.ecsWorld || (window.gameInstance && window.gameInstance.combat && 
                                          window.gameInstance.combat.world);
        
        if (!this.ecsWorld) {
            console.warn("CombatManager: No ECS world reference found - some functionality may be limited");
        } else {
            console.log("CombatManager: Successfully connected to ECS world");
        }
    }
    
    /**
     * Update adapter - syncs with ECS world and updates state
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Sync enemies from ECS world if available
        this.syncEnemiesFromECS();
        
        // Sync stats from ECS world if available
        this.syncStatsFromECS();
    }
    
    /**
     * Sync enemies from ECS world to provide backward compatibility
     */
    syncEnemiesFromECS() {
        // Clear current enemies array
        this.enemies = [];
        
        // If no ECS world, can't sync
        if (!this.ecsWorld) return;
        
        // Get all enemy entities from ECS world
        const enemyEntities = this.ecsWorld.getEntitiesByTag ? 
            this.ecsWorld.getEntitiesByTag('enemy') : [];
        
        // Convert to format expected by existing code
        for (const entity of enemyEntities) {
            // Get relevant components
            const transform = entity.getComponent('TransformComponent');
            const health = entity.getComponent('HealthComponent');
            const mesh = entity.getComponent('MeshComponent');
            
            if (transform && mesh && mesh.mesh) {
                // Create a compatible enemy object
                const enemy = {
                    id: entity.id,
                    type: 'pirate',
                    subtype: 'scout',
                    position: transform.position,
                    health: health ? health.health : 100,
                    maxHealth: health ? health.maxHealth : 100,
                    isDestroyed: health ? health.isDestroyed : false,
                    mesh: mesh.mesh,
                    // Reference to original entity for advanced operations
                    entity: entity
                };
                
                this.enemies.push(enemy);
            }
        }
    }
    
    /**
     * Sync game stats from ECS world to the main game
     */
    syncStatsFromECS() {
        // If no ECS world, can't sync
        if (!this.ecsWorld) return;
        
        // Get player entity
        const playerEntity = this.ecsWorld.getEntityById(this.spaceship.entityId);
        if (!playerEntity) return;
        
        // Sync health and shields if available
        const health = playerEntity.getComponent('HealthComponent');
        if (health && this.spaceship.stats) {
            this.spaceship.stats.health = health.health;
            this.spaceship.stats.shields = health.shields;
        }
    }
    
    /**
     * Create an explosion effect at a position
     * @param {THREE.Vector3} position Explosion position
     */
    createExplosion(position) {
        // This method is kept for backward compatibility
        // Try to delegate to ECS world if possible
        
        if (this.ecsWorld && this.ecsWorld.messageBus) {
            // Publish explosion event for VFX system to handle
            this.ecsWorld.messageBus.publish('vfx.explosion', {
                position: position.clone(),
                scale: 1.0,
                duration: 2.0
            });
            return;
        }
        
        // Fallback to simple particle effect if no ECS world
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 2 + 1;
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(size, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0xff5500,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Random position within explosion radius
            const radius = Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particle.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            
            // Random velocity
            particle.userData.velocity = particle.position.clone().normalize().multiplyScalar(
                Math.random() * 2 + 1
            );
            
            particles.add(particle);
        }
        
        // Position at explosion location
        particles.position.copy(position);
        
        // Add to scene
        this.scene.add(particles);
        
        // Animate particles
        let frame = 0;
        const maxFrames = 60;
        
        const animateExplosion = () => {
            frame++;
            
            if (frame >= maxFrames) {
                this.scene.remove(particles);
                return;
            }
            
            // Update particle positions and opacity
            particles.children.forEach(particle => {
                particle.position.add(particle.userData.velocity);
                particle.material.opacity -= 0.01;
                particle.scale.multiplyScalar(0.97);
            });
            
            requestAnimationFrame(animateExplosion);
        };
        
        animateExplosion();
    }
}