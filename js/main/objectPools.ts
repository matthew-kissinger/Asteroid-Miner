// objectPools.js - Object pool initialization and management

import * as THREE from 'three';
import { objectPool } from '../globals/objectPool.ts';

type GameRenderer = {
    renderer: {
        compile: (scene: THREE.Scene, camera: THREE.Camera) => void;
    };
    _withGuard: (fn: () => void) => void;
};

type GameContext = {
    scene?: THREE.Scene;
    camera?: THREE.Camera;
    renderer?: GameRenderer;
};

type HitEffectItem = {
    mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    material: THREE.MeshBasicMaterial;
    reset: (this: HitEffectItem, color?: number, size?: number) => void;
    clear: (this: HitEffectItem) => void;
};

type ParticlePoolItem = {
    mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    velocity: THREE.Vector3;
    life: number;
    reset: (this: ParticlePoolItem, position: THREE.Vector3, velocity: THREE.Vector3, color?: number) => void;
    update: (this: ParticlePoolItem, delta: number) => boolean;
    clear: (this: ParticlePoolItem) => void;
};

type ExplosionPoolItem = {
    container: THREE.Group;
    particles: ParticlePoolItem[];
    active: boolean;
    reset: (this: ExplosionPoolItem, position: THREE.Vector3, color?: number, force?: number) => void;
    update: (this: ExplosionPoolItem, delta: number) => boolean;
    clear: (this: ExplosionPoolItem) => void;
};

export class ObjectPools {
    game: GameContext;
    projectileGeometry?: THREE.SphereGeometry;
    projectileMaterial?: THREE.MeshStandardMaterial;
    hitEffectGeometry?: THREE.SphereGeometry;

    constructor(game: GameContext) {
        this.game = game;
    }
    
    // Pre-warm only the most essential shaders needed for immediate gameplay
    preWarmBasicShaders(): void {
        const scene = this.game.scene;
        const camera = this.game.camera;
        const renderer = this.game.renderer;
        if (!scene || !camera || !renderer) return;
        
        // Create template projectile geometry and materials
        this.projectileGeometry = new THREE.SphereGeometry(1.8, 12, 12);
        this.projectileMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 5,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Create simple dummy objects to warm up the renderer
        const dummyProjectile = new THREE.Mesh(this.projectileGeometry, this.projectileMaterial);
        
        // Add to scene temporarily
        scene.add(dummyProjectile);
        
        // Force shader compilation for better performance
        renderer.renderer.compile(scene, camera);
        
        // Remove dummy object after compilation
        renderer._withGuard(() => scene.remove(dummyProjectile));
        
    }
    
    initializeObjectPools(): void {
        
        try {
            // Initialize hit effect pool
            if (!this.hitEffectGeometry) {
                this.hitEffectGeometry = new THREE.SphereGeometry(2, 8, 8);
            }
            
            objectPool.createPool('hitEffect', (): HitEffectItem => {
                const material = new THREE.MeshBasicMaterial({
                    color: 0xff5500,
                    transparent: true,
                    opacity: 0.8
                });
                
                const mesh = new THREE.Mesh(this.hitEffectGeometry, material) as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
                mesh.visible = false;
                
                return {
                    mesh: mesh,
                    material: material,
                    reset: function(this: HitEffectItem, color = 0xff5500, size = 1) {
                        this.material.color.set(color);
                        this.material.opacity = 0.8;
                        this.mesh.scale.set(size, size, size);
                        this.mesh.visible = true;
                    },
                    clear: function(this: HitEffectItem) {
                        if (this.mesh.parent) {
                            this.mesh.parent.remove(this.mesh);
                        }
                        this.mesh.visible = false;
                    }
                };
            }, 5, 20);
            
            // Initialize projectile pool (if not already initialized by ProjectilePoolManager)
            if (!this.projectileGeometry) {
                this.projectileGeometry = new THREE.SphereGeometry(1.8, 12, 12);
            }
            
            // The projectile pool is now managed by ProjectilePoolManager
            // We just ensure the geometry is pre-created for shader warming
            
            // Initialize particle pool for explosions
            const particleGeometry = new THREE.SphereGeometry(0.5, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xff5500,
                transparent: true
            });
            
            objectPool.createPool('particle', (): ParticlePoolItem => {
                const mesh = new THREE.Mesh(particleGeometry, particleMaterial.clone()) as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
                mesh.visible = false;
                
                return {
                    mesh: mesh,
                    velocity: new THREE.Vector3(),
                    life: 0,
                    reset: function(this: ParticlePoolItem, position: THREE.Vector3, velocity: THREE.Vector3, color = 0xff5500) {
                        this.mesh.position.copy(position);
                        this.velocity.copy(velocity);
                        this.mesh.material.color.set(color);
                        this.mesh.material.opacity = 1;
                        this.mesh.visible = true;
                        this.life = 1;
                    },
                    update: function(this: ParticlePoolItem, delta: number) {
                        this.life -= delta * 2; // Fade out over 0.5 seconds
                        if (this.life <= 0) {
                            this.clear();
                            return false;
                        }
                        
                        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
                        this.mesh.material.opacity = this.life;
                        return true;
                    },
                    clear: function(this: ParticlePoolItem) {
                        if (this.mesh.parent) {
                            this.mesh.parent.remove(this.mesh);
                        }
                        this.mesh.visible = false;
                        this.life = 0;
                    }
                };
            }, 20, 100);
            
            // Initialize explosion effect pool
            const particleCount = 15;
            objectPool.createPool('explosion', (): ExplosionPoolItem => {
                const container = new THREE.Group();
                const particles: ParticlePoolItem[] = [];
                
                for (let i = 0; i < particleCount; i++) {
                    const particle = objectPool.get('particle') as ParticlePoolItem | null;
                    if (particle) {
                        particles.push(particle);
                    }
                }
                
                return {
                    container: container,
                    particles: particles,
                    active: false,
                    reset: function(this: ExplosionPoolItem, position: THREE.Vector3, color = 0xff5500, force = 50) {
                        this.container.position.copy(position);
                        this.active = true;
                        
                        // Reset all particles with random velocities
                        for (let i = 0; i < particleCount; i++) {
                            if (this.particles[i]) {
                                const velocity = new THREE.Vector3(
                                    (Math.random() - 0.5) * force,
                                    (Math.random() - 0.5) * force,
                                    (Math.random() - 0.5) * force
                                );
                                this.particles[i].reset(new THREE.Vector3(), velocity, color);
                                this.container.add(this.particles[i].mesh);
                            }
                        }
                        
                        if (!this.container.parent) {
                            window.game.scene.add(this.container);
                        }
                    },
                    update: function(this: ExplosionPoolItem, delta: number) {
                        if (!this.active) return false;
                        
                        let anyAlive = false;
                        for (let i = 0; i < particleCount; i++) {
                            if (this.particles[i] && this.particles[i].life > 0) {
                                if (this.particles[i].update(delta)) {
                                    anyAlive = true;
                                }
                            }
                        }
                        
                        if (!anyAlive) {
                            this.clear();
                            return false;
                        }
                        
                        return true;
                    },
                    clear: function(this: ExplosionPoolItem) {
                        this.active = false;
                        
                        // Clear all particles
                        for (let i = 0; i < particleCount; i++) {
                            if (this.particles[i]) {
                                this.particles[i].clear();
                            }
                        }
                        
                        if (this.container.parent) {
                            this.container.parent.remove(this.container);
                        }
                    }
                };
            }, 5, 20);
            
        } catch (error) {
            console.error("Error initializing object pools:", error);
        }
    }
}
