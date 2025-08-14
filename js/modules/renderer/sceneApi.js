// sceneApi.js - Scene manipulation helpers including _withGuard system

import * as THREE from 'three';

export class SceneApiManager {
    constructor(scene) {
        this.scene = scene;
        this.setupSceneGuard();
    }

    setupSceneGuard() {
        // Renderer facade guard
        if (typeof window !== 'undefined') {
            window.__rendererGuard = false;
        }

        // Wrap scene add/remove to warn on direct mutations
        const originalAdd = this.scene.add.bind(this.scene);
        const originalRemove = this.scene.remove.bind(this.scene);
        
        this.scene.add = (...args) => {
            if (!window.__rendererGuard && window && window.DEBUG_MODE) {
                console.warn('[RendererFacade] Direct scene.add detected outside renderer facade');
            }
            return originalAdd(...args);
        };
        
        this.scene.remove = (...args) => {
            if (!window.__rendererGuard && window && window.DEBUG_MODE) {
                console.warn('[RendererFacade] Direct scene.remove detected outside renderer facade');
            }
            return originalRemove(...args);
        };
    }

    // Add an object to the scene through guarded path
    add(object) {
        return this._withGuard(() => this.scene.add(object));
    }

    // Facade API for views
    addView(entityId, viewDef) {
        // For future: create mesh/instanced entry based on viewDef
        // Placeholder; current rendering handled by systems
    }

    removeView(entityId) {
        // Placeholder for centralized removal
    }

    updateView(entityId, props) {
        // Placeholder for centralized updates
    }

    _withGuard(fn) {
        const prev = window.__rendererGuard;
        window.__rendererGuard = true;
        try { 
            return fn(); 
        } finally { 
            window.__rendererGuard = prev; 
        }
    }

    /**
     * Helper method to find the sun object in the scene
     * @returns {THREE.Object3D|null} The sun object or null if not found
     */
    findSunObject() {
        let sun = null;
        
        // First try by name
        sun = this.scene.getObjectByName('sun');
        
        // If not found by name, try to find by traversing scene
        if (!sun) {
            this.scene.traverse(object => {
                if (object.name === 'sun') {
                    sun = object;
                }
            });
        }
        
        return sun;
    }

    // Interpolate ECS meshes before compositing
    interpolateMeshes(alpha) {
        // If ECS world present on scene, interpolate known meshes
        const world = this.scene && this.scene.ecsWorld ? this.scene.ecsWorld : null;
        if (!world || !world.entityManager) return;
        
        try {
            const entities = world.getEntitiesWithComponents(['TransformComponent', 'MeshComponent']);
            for (const entity of entities) {
                const t = entity.getComponent('TransformComponent');
                const m = entity.getComponent('MeshComponent');
                if (!t || !m || !m.mesh) continue;
                
                // slerp rotation
                const q = new THREE.Quaternion().copy(t.prevQuaternion).slerp(t.quaternion, alpha);
                // lerp position
                const p = new THREE.Vector3().copy(t.prevPosition).lerp(t.position, alpha);
                m.mesh.position.copy(p);
                m.mesh.quaternion.copy(q);
            }
        } catch {}
    }
}