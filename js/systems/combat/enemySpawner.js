/**
 * Enemy Spawner - Main spawner system that coordinates all spawning subsystems
 * Refactored from 856 LOC to under 250 LOC by extracting functionality into modules
 */

// Import the new modular spawner
export { EnemySpawner } from './spawner/enemySpawner.js';