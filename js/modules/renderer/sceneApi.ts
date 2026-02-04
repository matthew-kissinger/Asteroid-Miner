// sceneApi.ts - Scene manipulation helpers including _withGuard system

import * as THREE from 'three';

interface ViewDef {
    [key: string]: any;
}

interface ECSWorld {
    entityManager?: any;
    getEntitiesWithComponents?: (components: string[]) => any[];
}

interface ECSMeshComponent {
    mesh?: THREE.Object3D;
}

interface ECSTransformComponent {
    position: THREE.Vector3;
    prevPosition: THREE.Vector3;
    quaternion: THREE.Quaternion;
    prevQuaternion: THREE.Quaternion;
}

interface ECSEntity {
    getComponent: (name: string) => ECSMeshComponent | ECSTransformComponent | null;
}

interface SceneWithECS extends THREE.Scene {
    ecsWorld?: ECSWorld;
}

export class SceneApiManager {
    scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.setupSceneGuard();
    }

    setupSceneGuard(): void {
        // Renderer facade guard
        if (typeof window !== 'undefined') {
            (window as any).__rendererGuard = false;
        }

        // Wrap scene add/remove to warn on direct mutations
        const originalAdd = this.scene.add.bind(this.scene);
        const originalRemove = this.scene.remove.bind(this.scene);
        
        this.scene.add = (...args: THREE.Object3D[]): THREE.Scene => {
            if (!(window as any).__rendererGuard && window && (window as any).DEBUG_MODE) {
                console.warn('[RendererFacade] Direct scene.add detected outside renderer facade');
            }
            return originalAdd(...args);
        };
        
        this.scene.remove = (...args: THREE.Object3D[]): THREE.Scene => {
            if (!(window as any).__rendererGuard && window && (window as any).DEBUG_MODE) {
                console.warn('[RendererFacade] Direct scene.remove detected outside renderer facade');
            }
            return originalRemove(...args);
        };
    }

    // Add an object to the scene through guarded path
    add(object: THREE.Object3D): void {
        this._withGuard(() => this.scene.add(object));
    }

    // Facade API for views
    addView(_entityId: number, _viewDef: ViewDef): void {
        // For future: create mesh/instanced entry based on viewDef
        // Placeholder; current rendering handled by systems
    }

    removeView(_entityId: number): void {
        // Placeholder for centralized removal
    }

    updateView(_entityId: number, _props: any): void {
        // Placeholder for centralized updates
    }

    _withGuard<T>(fn: () => T): T {
        const prev = (window as any).__rendererGuard;
        (window as any).__rendererGuard = true;
        try { 
            return fn(); 
        } finally { 
            (window as any).__rendererGuard = prev; 
        }
    }

    /**
     * Helper method to find the sun object in the scene
     * @returns The sun object or null if not found
     */
    findSunObject(): THREE.Object3D | null {
        let sun: THREE.Object3D | null = null;

        // First try by name
        sun = this.scene.getObjectByName('sun') ?? null;

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
    interpolateMeshes(alpha: number): void {
        // If ECS world present on scene, interpolate known meshes
        const sceneWithECS = this.scene as SceneWithECS;
        const world = sceneWithECS.ecsWorld;
        if (!world || !world.entityManager) return;
        
        try {
            if (!world.getEntitiesWithComponents) return;
            const entities = world.getEntitiesWithComponents(['TransformComponent', 'MeshComponent']) as ECSEntity[];
            for (const entity of entities) {
                const t = entity.getComponent('TransformComponent') as ECSTransformComponent | null;
                const m = entity.getComponent('MeshComponent') as ECSMeshComponent | null;
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
