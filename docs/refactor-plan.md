# Asteroid Miner Refactor Plan - Phase 2

## Executive Summary
After successfully completing Phase 1 refactoring of 8 critical files (>800 LOC), we've reduced them by 67-86% and created 54 focused modules. This plan outlines the continuation of the refactoring effort to achieve our goal of limiting all files to under 500 LOC.

## Current State Analysis

### Phase 1 Accomplishments
- **8 Critical Files Refactored** (all previously >800 LOC):
  - `introSequence.js`: 1222 → 401 LOC (67% reduction)
  - `starDreadnought.js`: 1006 → 142 LOC (86% reduction)
  - `touchControls.js`: 912 → 190 LOC (79% reduction)
  - `audio.js`: 909 → 220 LOC (76% reduction)
  - `spaceship.js`: 874 → 215 LOC (75% reduction)
  - `enemySpawner.js`: 856 → 249 LOC (71% reduction)
  - `terminalView.js`: 849 → 157 LOC (81% reduction)
  - `ProjectilePoolManager.js`: 807 → 268 LOC (67% reduction)

### Remaining Files Exceeding 500 LOC
Based on latest analysis, 22 production files still exceed our 500 LOC target:

#### High Priority (600-800 LOC) - 9 files
1. `js/modules/controls/miningSystem.js` - 762 LOC
2. `js/modules/environment/sun.js` - 718 LOC
3. `js/systems/combat/enemySystem.js` - 686 LOC
4. `js/modules/game.js` - 685 LOC
5. `js/modules/ui/starMap.js` - 672 LOC
6. `js/systems/combat/spawner/factory/enemyFactory.js` - 649 LOC
7. `js/modules/combat/effects.js` - 630 LOC
8. `js/modules/environment/starSystemGenerator.js` - 619 LOC
9. `js/modules/controls/dockingSystem.js` - 603 LOC

#### Medium Priority (500-600 LOC) - 13 files
10. `js/modules/ui/components/blackjack/gameView.js` - 601 LOC
11. `js/modules/controls/gamepadHandler.js` - 598 LOC
12. `js/modules/physics.js` - 597 LOC
13. `js/systems/mining/miningSystem.js` - 579 LOC
14. `js/modules/environment.js` - 573 LOC
15. `js/systems/deployables/deploymentSystem.js` - 568 LOC
16. `js/modules/ui/components/blackjack/styles.js` - 556 LOC
17. `js/modules/environment/planets.js` - 554 LOC
18. `js/modules/controls/targetingSystem.js` - 551 LOC
19. `js/modules/pooling/projectiles/effects/impacts.js` - 551 LOC
20. `js/modules/ui.js` - 544 LOC
21. `js/modules/controls.js` - 528 LOC
22. `js/components/combat/enemyAI.js` - 525 LOC

#### Note: Backup files (3) will be removed, not refactored
- `js/modules/ui/hud_backup.js` - 1313 LOC
- `js/modules/ui/customSystemCreator_backup.js` - 1174 LOC
- `js/modules/audio_backup.js` - 909 LOC

## Refactoring Strategy

### Core Principles
1. **Modular Architecture**: Split files into focused modules under subdirectories
2. **Backward Compatibility**: Maintain all public APIs through delegation
3. **Factory Pattern**: For object creation and specialized behaviors
4. **Separation of Concerns**: Extract UI, logic, state, and effects into separate modules
5. **Renderer Facade**: Maintain safe scene manipulation through guard methods

### Task Breakdown

#### Task 1: Remove Backup Files
```bash
rm js/modules/ui/hud_backup.js
rm js/modules/ui/customSystemCreator_backup.js
rm js/modules/audio_backup.js
```

#### Task 2: Batch Refactor High Priority Files (600-800 LOC)
**Files to refactor:**
1. `miningSystem.js` → Extract: laser control, target validation, resource extraction, UI updates
2. `sun.js` → Extract: visual layers, heat system, shader effects, particle systems
3. `enemySystem.js` → Extract: spawning, AI behaviors, lifecycle management, pooling
4. `game.js` → Extract: initialization, state management, system coordination, lifecycle
5. `starMap.js` → Extract: rendering, navigation, data management, UI interactions
6. `enemyFactory.js` → Extract: enemy types, configuration, visual variants, creation logic
7. `effects.js` → Extract: explosions, damage effects, particle systems, visual feedback
8. `starSystemGenerator.js` → Extract: generation algorithms, celestial bodies, anomalies, configuration
9. `dockingSystem.js` → Extract: proximity detection, docking logic, UI integration, state management

#### Task 3: Batch Refactor Medium Priority Files (500-600 LOC)
**Files to refactor:**
1. `gameView.js` → Extract: card rendering, layout, animations, interactions
2. `gamepadHandler.js` → Extract: input mapping, button handlers, axis processing, vibration
3. `physics.js` → Extract: collision detection, movement, forces, constraints
4. `miningSystem.js` (systems) → Extract: beam mechanics, target tracking, resource collection
5. `environment.js` → Extract: scene setup, celestial objects, anomalies, transitions
6. `deploymentSystem.js` → Extract: laser deployment, pickup mechanics, state management
7. `blackjack/styles.js` → Extract: component styles, themes, responsive layouts
8. `planets.js` → Extract: planet types, generation, orbits, visual effects
9. `targetingSystem.js` → Extract: target acquisition, locking, UI feedback, priorities
10. `impacts.js` → Extract: impact types, particle effects, damage visualization
11. `ui.js` → Extract: screen management, HUD, menus, notifications
12. `controls.js` → Extract: input handlers, control schemes, mobile/desktop splits
13. `enemyAI.js` → Extract: behavior trees, pathfinding, attack patterns, state machines

## Implementation Plan

### Phase 2A: Critical Path (Week 1)
1. Remove backup files
2. Refactor `game.js` (central orchestrator)
3. Refactor `enemySystem.js` and `enemyFactory.js` (combat core)
4. Refactor `miningSystem.js` (gameplay mechanic)

### Phase 2B: Environment & Effects (Week 2)
1. Refactor `sun.js` and `planets.js`
2. Refactor `starSystemGenerator.js`
3. Refactor `effects.js` and `impacts.js`
4. Refactor `environment.js`

### Phase 2C: Controls & UI (Week 3)
1. Refactor `controls.js` and `gamepadHandler.js`
2. Refactor `targetingSystem.js` and `dockingSystem.js`
3. Refactor `ui.js` and `starMap.js`
4. Refactor blackjack components

### Phase 2D: Systems & Physics (Week 4)
1. Refactor `physics.js`
2. Refactor `deploymentSystem.js`
3. Refactor `enemyAI.js`
4. Final validation and testing

## Success Metrics
- All production files under 500 LOC
- Zero breaking changes to public APIs
- Improved code organization and maintainability
- All tests passing (when test suite exists)
- Performance maintained or improved

## Risk Mitigation
1. **Always read files before editing** to understand current structure
2. **Create modular subdirectories** for each refactored file
3. **Maintain delegation pattern** in original files for backward compatibility
4. **Test critical paths** after each refactor batch
5. **Use analyze tool** to verify LOC reductions

## Validation Steps
After each refactor:
1. Run `node tools/analyze.cjs` to verify LOC reduction
2. Check that all public APIs remain accessible
3. Verify no runtime errors in console
4. Test core gameplay mechanics remain functional

## Notes
- Files like `combat.js` (500 LOC exactly) are at the threshold but functional
- Some files may need minor adjustments post-refactor due to dependencies
- Focus on maintaining the hybrid ECS/Module architecture pattern
- Preserve all critical timing (e.g., 1-minute enemy spawn delay)