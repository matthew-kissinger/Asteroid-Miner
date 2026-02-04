/**
 * Spaceship entity factory (legacy ECS)
 *
 * NOTE: The legacy ECS has been removed in favor of bitECS. This module is kept
 * only to satisfy existing imports/types. It now acts as a no-op shim.
 */

import * as THREE from 'three';

interface GameEntity {
    addTag: (tag: string) => void;
    addComponent: (component: unknown) => void;
}

interface WorldLike {
    createEntity?: (type: string) => GameEntity;
}

type SpaceshipEntity = GameEntity;
type AsteroidEntity = GameEntity;

/**
 * Create a player spaceship entity (legacy no-op shim).
 * @param world World-like object
 * @param position Initial position
 * @param scene Three.js scene (unused)
 * @returns A placeholder entity
 */
export function createPlayerShip(
    world: WorldLike,
    position: THREE.Vector3,
    scene?: THREE.Scene | null
): SpaceshipEntity {
    void position;
    void scene;

    console.warn('[ECS] createPlayerShip is deprecated (legacy ECS removed).');

    if (world?.createEntity) {
        return world.createEntity('player');
    }

    return {
        addTag: () => {},
        addComponent: () => {}
    };
}

/**
 * Create a generic asteroid entity (legacy no-op shim).
 * @param world World-like object
 * @param position Initial position
 * @param resourceType Resource type
 * @param size Asteroid size
 * @param scene Three.js scene (unused)
 * @returns A placeholder entity
 */
export function createAsteroid(
    world: WorldLike,
    position: THREE.Vector3,
    resourceType: string,
    size: number,
    scene?: THREE.Scene | null
): AsteroidEntity {
    void position;
    void resourceType;
    void size;
    void scene;

    console.warn('[ECS] createAsteroid is deprecated (legacy ECS removed).');

    if (world?.createEntity) {
        return world.createEntity('asteroid');
    }

    return {
        addTag: () => {},
        addComponent: () => {}
    };
}
