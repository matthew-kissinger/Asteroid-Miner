// docking.js - Ship docking and undocking systems
// Extracted from spaceship.js to improve maintainability

import * as THREE from 'three';

export class ShipDocking {
    constructor(mesh, scene) {
        this.mesh = mesh;
        this.scene = scene;
        this.undockLocation = new THREE.Vector3(0, 10000, 0); // Middle of the stargate
    }

    /**
     * Dock the spaceship at the stargate
     * @param {object} spaceshipState Reference to spaceship state
     * @param {function} syncCallback Callback to sync values to health component
     */
    dock(spaceshipState, syncCallback) {
        console.log("Docking spaceship");
        console.log("Spaceship values before docking:", {
            shield: spaceshipState.shield,
            maxShield: spaceshipState.maxShield,
            hull: spaceshipState.hull,
            maxHull: spaceshipState.maxHull,
            isDocked: spaceshipState.isDocked
        });
        
        spaceshipState.isDocked = true;
        spaceshipState.velocity.set(0, 0, 0);
        this.mesh.visible = false;
        
        console.log("Spaceship values after docking:", {
            shield: spaceshipState.shield,
            maxShield: spaceshipState.maxShield,
            hull: spaceshipState.hull,
            maxHull: spaceshipState.maxHull,
            isDocked: spaceshipState.isDocked
        });
    }

    /**
     * Undock the spaceship from the stargate
     * @param {object} spaceshipState Reference to spaceship state
     * @param {function} syncCallback Callback to sync values to health component
     * @returns {THREE.Vector3} New position of the ship
     */
    undock(spaceshipState, syncCallback) {
        console.log("Undocking spaceship");
        console.log("Spaceship values before undocking:", {
            shield: spaceshipState.shield,
            maxShield: spaceshipState.maxShield,
            hull: spaceshipState.hull,
            maxHull: spaceshipState.maxHull,
            isDocked: spaceshipState.isDocked
        });
        
        // Store shield value before undocking to diagnose reset issue
        const shieldBeforeUndock = spaceshipState.shield;
        
        spaceshipState.isDocked = false;
        this.mesh.visible = true;
        
        // Check if shield was reset and restore it
        if (spaceshipState.shield !== shieldBeforeUndock) {
            console.log(`SHIELD RESET DETECTED during undock! Value changed from ${shieldBeforeUndock} to ${spaceshipState.shield}`);
            console.log("Restoring shield value to:", shieldBeforeUndock);
            spaceshipState.shield = shieldBeforeUndock;
        }
        
        console.log("Spaceship values after undocking:", {
            shield: spaceshipState.shield,
            maxShield: spaceshipState.maxShield,
            hull: spaceshipState.hull,
            maxHull: spaceshipState.maxHull,
            isDocked: spaceshipState.isDocked
        });
        
        // When undocking, attempt to sync shield and hull values to the HealthComponent
        if (syncCallback) {
            syncCallback();
        }
        
        // Position the ship based on undock location
        if (this.undockLocation) {
            this.mesh.position.copy(this.undockLocation);
            
            // Point away from the stargate (down toward sun)
            this.mesh.rotation.set(Math.PI/2, 0, 0);
        } else {
            // Original behavior - position just outside the docking bay
            const stargatePosition = this.scene.getObjectByName('stargate').position.clone();
            stargatePosition.z += 550; // Move in front of the docking bay
            this.mesh.position.copy(stargatePosition);
            
            // Reset rotation to face away from the stargate
            this.mesh.rotation.set(0, Math.PI, 0);
        }
        
        spaceshipState.velocity.set(0, 0, 0); // This line resets velocity, but it's fine since we're undocking
        
        return this.mesh.position.clone();
    }

    /**
     * Set the undocking location
     * @param {THREE.Vector3} location New undocking position
     */
    setUndockLocation(location) {
        this.undockLocation = location.clone();
    }

    /**
     * Get the current undocking location
     * @returns {THREE.Vector3} Current undocking position
     */
    getUndockLocation() {
        return this.undockLocation.clone();
    }
}