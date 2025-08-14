/**
 * Impact Type Handler Module
 * 
 * Handles different types of impact effects based on projectile type
 */

export class ImpactTypeHandler {
    constructor() {
        // No initialization needed
    }

    /**
     * Create an impact effect based on projectile type
     * @param {THREE.Vector3} position - Impact position
     * @param {string} projectileType - Type of projectile that impacted
     * @param {object} options - Effect options
     * @param {object} pools - Object containing the different effect pools
     * @returns {object} Created effects
     */
    createImpactEffect(position, projectileType = 'bullet', options = {}, pools = {}) {
        const effects = {};
        const { explosionPool, sparkPool, debrisPool } = pools;
        
        switch (projectileType) {
            case 'missile':
                // Large explosion for missiles
                if (explosionPool) {
                    effects.explosion = this._getExplosion(explosionPool, position, 1500);
                    effects.explosion.material.color.setHex(0xff4400);
                    effects.explosion.scale.set(2, 2, 2); // Larger explosion
                }
                break;
                
            case 'laser':
                // Bright spark effect for lasers
                if (sparkPool) {
                    effects.spark = this._getSparkEffect(sparkPool, position, 300);
                    effects.spark.material.color.setHex(0x00ffff);
                }
                break;
                
            case 'plasma':
                // Purple energy explosion for plasma
                if (explosionPool) {
                    effects.explosion = this._getExplosion(explosionPool, position, 800);
                    effects.explosion.material.color.setHex(0x8800ff);
                }
                if (sparkPool) {
                    effects.spark = this._getSparkEffect(sparkPool, position, 400);
                    effects.spark.material.color.setHex(0xaa00ff);
                }
                break;
                
            case 'bullet':
            default:
                // Sparks and debris for bullets
                if (sparkPool) {
                    effects.spark = this._getSparkEffect(sparkPool, position, 200);
                }
                if (debrisPool) {
                    effects.debris = this._getDebrisEffect(debrisPool, position, 1500);
                }
                break;
        }
        
        return effects;
    }

    /**
     * Helper method to get explosion from pool
     * @private
     */
    _getExplosion(explosionPool, position, duration) {
        const explosion = explosionPool.get();
        explosion.position.copy(position);
        explosion.visible = true;
        explosion.userData.active = true;
        explosion.userData.startTime = Date.now();
        explosion.userData.duration = duration;
        return explosion;
    }

    /**
     * Helper method to get spark effect from pool
     * @private
     */
    _getSparkEffect(sparkPool, position, duration) {
        const spark = sparkPool.get();
        spark.position.copy(position);
        spark.visible = true;
        spark.userData.active = true;
        spark.userData.startTime = Date.now();
        spark.userData.duration = duration;
        return spark;
    }

    /**
     * Helper method to get debris effect from pool
     * @private
     */
    _getDebrisEffect(debrisPool, position, duration) {
        const debris = debrisPool.get();
        debris.position.copy(position);
        debris.visible = true;
        debris.userData.active = true;
        debris.userData.startTime = Date.now();
        debris.userData.duration = duration;
        return debris;
    }
}