# Future Scaling Components

This directory contains components, systems, and utilities that are preserved for future scaling needs but are not currently active in the main game.

## Purpose

These files implement optimized versions of the game's systems using techniques like:
- Data-Oriented Design with TypedArrays
- Instanced rendering for many similar objects
- Optimized entity factories

## When to Use

Consider implementing these systems when:
1. The game needs to support thousands of entities simultaneously
2. Rendering performance bottlenecks occur with many similar objects
3. Physics simulation becomes a bottleneck
4. Memory usage and garbage collection pressure need to be reduced

## Implementation Notes

To implement these optimizations:
1. Import the optimized components from this directory
2. Register optimized systems in the world
3. Use the OptimizedEntityFactory for creating entities
4. Update rendering to use instanced rendering where appropriate

## Directory Structure

- `/components/` - Optimized component implementations
  - `/optimized/` - TypedArray-based components
  - `/rendering/` - Instanced rendering components
- `/core/` - Core ECS optimizations
  - `dataStore.js` - Data-Oriented component storage
  - `optimizedEntityFactory.js` - Factory for optimized entities
- `/systems/` - Optimized system implementations
  - `/rendering/` - Systems for instanced rendering 