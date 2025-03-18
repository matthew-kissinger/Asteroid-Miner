/**
 * DataStore - Data-oriented component storage for ECS architecture
 * 
 * Provides high-performance typed array storage for component data,
 * improving cache coherency and reducing garbage collection.
 */

// Maximum number of entities to support in the system
const MAX_ENTITIES = 10000;

/**
 * Base class for typed component data stores
 */
export class ComponentDataStore {
    constructor(name) {
        this.name = name;
        this.entityIndices = new Map(); // Maps entity IDs to indices in the storage arrays
        this.activeEntities = new Set(); // Set of active entity IDs using this component
        this.freeIndices = []; // Recycled indices for reuse
        this.nextIndex = 0; // Next index to assign if no recycled indices are available
    }

    /**
     * Allocate storage for an entity's component data
     * @param {string} entityId The entity ID
     * @returns {number} The index in the storage arrays
     */
    allocate(entityId) {
        if (this.entityIndices.has(entityId)) {
            return this.entityIndices.get(entityId);
        }

        let index;
        if (this.freeIndices.length > 0) {
            index = this.freeIndices.pop();
        } else {
            index = this.nextIndex++;
            if (index >= MAX_ENTITIES) {
                console.error(`Maximum entity count exceeded for ${this.name} component!`);
                return -1;
            }
        }

        this.entityIndices.set(entityId, index);
        this.activeEntities.add(entityId);
        this.initializeData(index);
        return index;
    }

    /**
     * Free the storage for an entity's component data
     * @param {string} entityId The entity ID
     */
    free(entityId) {
        if (!this.entityIndices.has(entityId)) {
            return;
        }

        const index = this.entityIndices.get(entityId);
        this.freeIndices.push(index);
        this.entityIndices.delete(entityId);
        this.activeEntities.delete(entityId);
    }

    /**
     * Initialize component data at the specified index
     * @param {number} index The index to initialize
     */
    initializeData(index) {
        // Override in subclasses
    }

    /**
     * Get all entity IDs that have this component
     * @returns {string[]} Array of entity IDs
     */
    getEntityIds() {
        return Array.from(this.activeEntities);
    }

    /**
     * Check if an entity has this component
     * @param {string} entityId The entity ID
     * @returns {boolean} True if the entity has this component
     */
    hasEntity(entityId) {
        return this.activeEntities.has(entityId);
    }

    /**
     * Get the storage index for an entity
     * @param {string} entityId The entity ID
     * @returns {number} The index in the storage arrays, or -1 if not found
     */
    getIndex(entityId) {
        return this.entityIndices.has(entityId) ? this.entityIndices.get(entityId) : -1;
    }
}

/**
 * Transform component data store
 * Stores position, rotation (as quaternion), and scale in typed arrays
 */
export class TransformDataStore extends ComponentDataStore {
    constructor() {
        super('Transform');
        // Position (x, y, z)
        this.positions = new Float32Array(MAX_ENTITIES * 3);
        // Rotation as quaternion (x, y, z, w)
        this.quaternions = new Float32Array(MAX_ENTITIES * 4);
        // Scale (x, y, z)
        this.scales = new Float32Array(MAX_ENTITIES * 3);
        // Flags for updates (1 for each entity)
        this.needsUpdate = new Uint8Array(MAX_ENTITIES);
    }

    /**
     * Initialize default values for transform data
     * @param {number} index The index to initialize
     */
    initializeData(index) {
        // Position (x, y, z) = (0, 0, 0)
        const posIdx = index * 3;
        this.positions[posIdx] = 0;
        this.positions[posIdx + 1] = 0;
        this.positions[posIdx + 2] = 0;

        // Quaternion (x, y, z, w) = (0, 0, 0, 1) [identity]
        const quatIdx = index * 4;
        this.quaternions[quatIdx] = 0;
        this.quaternions[quatIdx + 1] = 0;
        this.quaternions[quatIdx + 2] = 0;
        this.quaternions[quatIdx + 3] = 1;

        // Scale (x, y, z) = (1, 1, 1)
        const scaleIdx = index * 3;
        this.scales[scaleIdx] = 1;
        this.scales[scaleIdx + 1] = 1;
        this.scales[scaleIdx + 2] = 1;

        // Needs update flag = 1 (true)
        this.needsUpdate[index] = 1;
    }

    /**
     * Set position for an entity
     * @param {string} entityId The entity ID
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {number} z Z coordinate
     */
    setPosition(entityId, x, y, z) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const posIdx = index * 3;
        this.positions[posIdx] = x;
        this.positions[posIdx + 1] = y;
        this.positions[posIdx + 2] = z;
        this.needsUpdate[index] = 1;
    }

    /**
     * Set quaternion for an entity
     * @param {string} entityId The entity ID
     * @param {number} x Quaternion x
     * @param {number} y Quaternion y
     * @param {number} z Quaternion z
     * @param {number} w Quaternion w
     */
    setQuaternion(entityId, x, y, z, w) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const quatIdx = index * 4;
        this.quaternions[quatIdx] = x;
        this.quaternions[quatIdx + 1] = y;
        this.quaternions[quatIdx + 2] = z;
        this.quaternions[quatIdx + 3] = w;
        this.needsUpdate[index] = 1;
    }

    /**
     * Set scale for an entity
     * @param {string} entityId The entity ID
     * @param {number} x X scale
     * @param {number} y Y scale
     * @param {number} z Z scale
     */
    setScale(entityId, x, y, z) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const scaleIdx = index * 3;
        this.scales[scaleIdx] = x;
        this.scales[scaleIdx + 1] = y;
        this.scales[scaleIdx + 2] = z;
        this.needsUpdate[index] = 1;
    }

    /**
     * Get position for an entity
     * @param {string} entityId The entity ID
     * @param {THREE.Vector3} out Optional Vector3 to store result
     * @returns {THREE.Vector3} The position
     */
    getPosition(entityId, out) {
        const index = this.getIndex(entityId);
        if (index === -1) return null;

        const posIdx = index * 3;
        const result = out || new THREE.Vector3();
        result.set(
            this.positions[posIdx],
            this.positions[posIdx + 1],
            this.positions[posIdx + 2]
        );
        return result;
    }

    /**
     * Get quaternion for an entity
     * @param {string} entityId The entity ID
     * @param {THREE.Quaternion} out Optional Quaternion to store result
     * @returns {THREE.Quaternion} The quaternion
     */
    getQuaternion(entityId, out) {
        const index = this.getIndex(entityId);
        if (index === -1) return null;

        const quatIdx = index * 4;
        const result = out || new THREE.Quaternion();
        result.set(
            this.quaternions[quatIdx],
            this.quaternions[quatIdx + 1],
            this.quaternions[quatIdx + 2],
            this.quaternions[quatIdx + 3]
        );
        return result;
    }

    /**
     * Get scale for an entity
     * @param {string} entityId The entity ID
     * @param {THREE.Vector3} out Optional Vector3 to store result
     * @returns {THREE.Vector3} The scale
     */
    getScale(entityId, out) {
        const index = this.getIndex(entityId);
        if (index === -1) return null;

        const scaleIdx = index * 3;
        const result = out || new THREE.Vector3();
        result.set(
            this.scales[scaleIdx],
            this.scales[scaleIdx + 1],
            this.scales[scaleIdx + 2]
        );
        return result;
    }
}

/**
 * Rigidbody component data store
 * Stores physics properties in typed arrays
 */
export class RigidbodyDataStore extends ComponentDataStore {
    constructor() {
        super('Rigidbody');
        // Velocity (x, y, z)
        this.velocities = new Float32Array(MAX_ENTITIES * 3);
        // Angular velocity (x, y, z)
        this.angularVelocities = new Float32Array(MAX_ENTITIES * 3);
        // Forces (x, y, z)
        this.forces = new Float32Array(MAX_ENTITIES * 3);
        // Torques (x, y, z)
        this.torques = new Float32Array(MAX_ENTITIES * 3);
        // Mass, drag, angular drag, collision radius
        this.properties = new Float32Array(MAX_ENTITIES * 4);
        // Flags (isKinematic, freezeRotation, useGravity, isTrigger)
        this.flags = new Uint8Array(MAX_ENTITIES * 4);
    }

    /**
     * Initialize default values for rigidbody data
     * @param {number} index The index to initialize
     */
    initializeData(index) {
        // Velocity (x, y, z) = (0, 0, 0)
        const velIdx = index * 3;
        this.velocities[velIdx] = 0;
        this.velocities[velIdx + 1] = 0;
        this.velocities[velIdx + 2] = 0;

        // Angular velocity (x, y, z) = (0, 0, 0)
        const angVelIdx = index * 3;
        this.angularVelocities[angVelIdx] = 0;
        this.angularVelocities[angVelIdx + 1] = 0;
        this.angularVelocities[angVelIdx + 2] = 0;

        // Forces (x, y, z) = (0, 0, 0)
        const forceIdx = index * 3;
        this.forces[forceIdx] = 0;
        this.forces[forceIdx + 1] = 0;
        this.forces[forceIdx + 2] = 0;

        // Torques (x, y, z) = (0, 0, 0)
        const torqueIdx = index * 3;
        this.torques[torqueIdx] = 0;
        this.torques[torqueIdx + 1] = 0;
        this.torques[torqueIdx + 2] = 0;

        // Properties: mass=1, drag=0.01, angularDrag=0.01, collisionRadius=1
        const propIdx = index * 4;
        this.properties[propIdx] = 1;        // mass
        this.properties[propIdx + 1] = 0.01;  // drag
        this.properties[propIdx + 2] = 0.01;  // angularDrag
        this.properties[propIdx + 3] = 1;    // collisionRadius

        // Flags: all false by default
        const flagIdx = index * 4;
        this.flags[flagIdx] = 0;      // isKinematic
        this.flags[flagIdx + 1] = 0;  // freezeRotation
        this.flags[flagIdx + 2] = 0;  // useGravity
        this.flags[flagIdx + 3] = 0;  // isTrigger
    }

    /**
     * Reset forces for an entity
     * @param {string} entityId The entity ID
     */
    resetForces(entityId) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const forceIdx = index * 3;
        this.forces[forceIdx] = 0;
        this.forces[forceIdx + 1] = 0;
        this.forces[forceIdx + 2] = 0;

        const torqueIdx = index * 3;
        this.torques[torqueIdx] = 0;
        this.torques[torqueIdx + 1] = 0;
        this.torques[torqueIdx + 2] = 0;
    }

    /**
     * Apply a force to an entity
     * @param {string} entityId The entity ID
     * @param {number} fx Force X component
     * @param {number} fy Force Y component
     * @param {number} fz Force Z component
     */
    applyForce(entityId, fx, fy, fz) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        // Check if entity is kinematic
        const flagIdx = index * 4;
        if (this.flags[flagIdx]) return; // isKinematic

        const forceIdx = index * 3;
        this.forces[forceIdx] += fx;
        this.forces[forceIdx + 1] += fy;
        this.forces[forceIdx + 2] += fz;
    }

    /**
     * Apply an impulse to an entity
     * @param {string} entityId The entity ID
     * @param {number} ix Impulse X component
     * @param {number} iy Impulse Y component
     * @param {number} iz Impulse Z component
     */
    applyImpulse(entityId, ix, iy, iz) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        // Check if entity is kinematic
        const flagIdx = index * 4;
        if (this.flags[flagIdx]) return; // isKinematic

        const propIdx = index * 4;
        const mass = this.properties[propIdx];
        const invMass = 1 / mass;

        const velIdx = index * 3;
        this.velocities[velIdx] += ix * invMass;
        this.velocities[velIdx + 1] += iy * invMass;
        this.velocities[velIdx + 2] += iz * invMass;
    }

    /**
     * Apply torque to an entity
     * @param {string} entityId The entity ID
     * @param {number} tx Torque X component
     * @param {number} ty Torque Y component
     * @param {number} tz Torque Z component
     */
    applyTorque(entityId, tx, ty, tz) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        // Check if entity is kinematic or has frozen rotation
        const flagIdx = index * 4;
        if (this.flags[flagIdx] || this.flags[flagIdx + 1]) return; // isKinematic or freezeRotation

        const torqueIdx = index * 3;
        this.torques[torqueIdx] += tx;
        this.torques[torqueIdx + 1] += ty;
        this.torques[torqueIdx + 2] += tz;
    }

    /**
     * Set velocity for an entity
     * @param {string} entityId The entity ID
     * @param {number} vx Velocity X component
     * @param {number} vy Velocity Y component
     * @param {number} vz Velocity Z component
     */
    setVelocity(entityId, vx, vy, vz) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const velIdx = index * 3;
        this.velocities[velIdx] = vx;
        this.velocities[velIdx + 1] = vy;
        this.velocities[velIdx + 2] = vz;
    }

    /**
     * Set angular velocity for an entity
     * @param {string} entityId The entity ID
     * @param {number} avx Angular velocity X component
     * @param {number} avy Angular velocity Y component
     * @param {number} avz Angular velocity Z component
     */
    setAngularVelocity(entityId, avx, avy, avz) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        // Check if entity has frozen rotation
        const flagIdx = index * 4;
        if (this.flags[flagIdx + 1]) return; // freezeRotation

        const angVelIdx = index * 3;
        this.angularVelocities[angVelIdx] = avx;
        this.angularVelocities[angVelIdx + 1] = avy;
        this.angularVelocities[angVelIdx + 2] = avz;
    }

    /**
     * Get velocity for an entity
     * @param {string} entityId The entity ID
     * @param {THREE.Vector3} out Optional Vector3 to store result
     * @returns {THREE.Vector3} The velocity
     */
    getVelocity(entityId, out) {
        const index = this.getIndex(entityId);
        if (index === -1) return null;

        const velIdx = index * 3;
        const result = out || new THREE.Vector3();
        result.set(
            this.velocities[velIdx],
            this.velocities[velIdx + 1],
            this.velocities[velIdx + 2]
        );
        return result;
    }

    /**
     * Get angular velocity for an entity
     * @param {string} entityId The entity ID
     * @param {THREE.Vector3} out Optional Vector3 to store result
     * @returns {THREE.Vector3} The angular velocity
     */
    getAngularVelocity(entityId, out) {
        const index = this.getIndex(entityId);
        if (index === -1) return null;

        const angVelIdx = index * 3;
        const result = out || new THREE.Vector3();
        result.set(
            this.angularVelocities[angVelIdx],
            this.angularVelocities[angVelIdx + 1],
            this.angularVelocities[angVelIdx + 2]
        );
        return result;
    }

    /**
     * Set mass for an entity
     * @param {string} entityId The entity ID
     * @param {number} mass New mass
     */
    setMass(entityId, mass) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const propIdx = index * 4;
        this.properties[propIdx] = mass;
    }

    /**
     * Set drag for an entity
     * @param {string} entityId The entity ID
     * @param {number} drag New drag value
     */
    setDrag(entityId, drag) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const propIdx = index * 4;
        this.properties[propIdx + 1] = drag;
    }

    /**
     * Set collision radius for an entity
     * @param {string} entityId The entity ID
     * @param {number} radius New collision radius
     */
    setCollisionRadius(entityId, radius) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const propIdx = index * 4;
        this.properties[propIdx + 3] = radius;
    }

    /**
     * Set kinematic flag for an entity
     * @param {string} entityId The entity ID
     * @param {boolean} isKinematic New kinematic state
     */
    setKinematic(entityId, isKinematic) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const flagIdx = index * 4;
        this.flags[flagIdx] = isKinematic ? 1 : 0;
    }

    /**
     * Set freezeRotation flag for an entity
     * @param {string} entityId The entity ID
     * @param {boolean} freezeRotation New freeze rotation state
     */
    setFreezeRotation(entityId, freezeRotation) {
        const index = this.getIndex(entityId);
        if (index === -1) return;

        const flagIdx = index * 4;
        this.flags[flagIdx + 1] = freezeRotation ? 1 : 0;
    }
} 