# Available ECS Systems (Not Yet Activated)

## Overview
These ECS systems are fully implemented and tested but not currently registered in the combat module. They follow proper ECS patterns, include event-driven architecture, and can be activated when needed for feature expansion or migration from module-level systems to full ECS.

## Ready-to-Use Systems

### 1. HealthSystem (`js/systems/entity/healthSystem.js`)
**Status:** Complete with UI integration

**Features:**
- Unified health management for all entities
- Player-specific handling:
  - Death screen display
  - Respawn mechanics
  - Low health warnings
- UI integration hooks
- Damage visual effects
- Shield recharge events
- Death/respawn cycle management

**To Activate:**
```javascript
// In js/modules/combat.js
import { HealthSystem } from '../systems/entity/healthSystem.js';
this.healthSystem = new HealthSystem(this.world);
this.world.registerSystem(this.healthSystem);
```

**Benefits:** Centralizes all health logic, removes duplication between player and enemies

---

### 2. MovementSystem (`js/systems/physics/movementSystem.js`)
**Status:** Complete physics implementation

**Features:**
- Proper physics integration:
  - Force accumulation
  - Velocity integration:
  - Angular velocity handling
- Drag simulation (linear and angular)
- Kinematic body support
- Transform update notifications
- Quaternion-based rotation (prevents gimbal lock)

**To Activate:**
```javascript
// In js/modules/combat.js
import { MovementSystem } from '../systems/physics/movementSystem.js';
this.movementSystem = new MovementSystem(this.world);
this.world.registerSystem(this.movementSystem);
```

**Would Unify:** All entity movement (currently split between modules and ECS)

---

### 3. DockingSystem (`js/systems/docking/dockingSystem.js`)
**Status:** Complete with proximity detection

**Features:**
- Proximity-based docking detection
- State management (docked/undocked)
- UI notification system
- Keyboard input handling ('Q' key)
- Position/rotation storage for undocking
- Event-driven architecture

**To Activate:**
```javascript
// In js/modules/combat.js
import { DockingSystem } from '../systems/docking/dockingSystem.js';
this.dockingSystem = new DockingSystem(this.world);
this.world.registerSystem(this.dockingSystem);
```

**Would Replace:** `js/modules/controls/dockingSystem.js` (module version)

---

### 4. TradingSystem (`js/systems/trading/tradingSystem.js`)
**Status:** Complete with market mechanics

**Features:**
- Resource pricing system (10 resource types)
- UI integration for trading interface
- Sell resources functionality
- Buy upgrades system
- Refuel/repair services
- Automatic UI show/hide on dock/undock

**To Activate:**
```javascript
// In js/modules/combat.js
import { TradingSystem } from '../systems/trading/tradingSystem.js';
this.tradingSystem = new TradingSystem(this.world);
this.world.registerSystem(this.tradingSystem);
```

**Benefits:** Centralizes all economic transactions in ECS

---

## Migration Strategy

### Option 1: Progressive Migration
Activate systems one at a time, testing each:
1. Start with `MovementSystem` (lowest risk, high benefit)
2. Add `HealthSystem` (unifies health logic)
3. Complete with `DockingSystem` and `TradingSystem`

### Option 2: Feature-Based Activation
Activate systems when adding related features:
- Adding multiplayer → Activate all for state sync
- Improving mining → Activate `MiningSystem`
- Adding more enemies → Activate `HealthSystem`

### Option 3: Stay Hybrid
Keep current architecture, document these as "available for future use"

## Technical Notes

### Component Dependencies
These systems expect certain components to exist:
- `TransformComponent` - position/rotation
- `RigidbodyComponent` - physics data
- `HealthComponent` - health/shields
- `MiningLaserComponent` - mining capability
- `CargoComponent` - inventory
- `ShipStateComponent` - docking state

### Event Integration
All systems use the shared `MessageBus` for events:
- Subscribe to events in constructor
- Publish results via `this.world.messageBus.publish()`
- Auto-cleanup on system destruction

### Visual Integration
Systems that create Three.js objects:
- Get scene reference from `this.world.scene`
- Properly dispose geometries/materials in cleanup
- Use renderer facade for scene modifications

## Performance Considerations

- **MovementSystem:** Runs every frame for all moving entities
- **HealthSystem:** Minimal overhead, event-driven
- **DockingSystem:** Proximity checks only when near stargate
- **TradingSystem:** UI-heavy, only active when docked

## Testing Checklist

Before activating any system:
1. ✅ Verify required components exist
2. ✅ Check for event name conflicts
3. ✅ Test with existing module systems disabled
4. ✅ Verify visual effects render correctly
5. ✅ Check memory cleanup on destruction
6. ✅ Test save/load compatibility

## Future Enhancements

These systems are ready for:
- Network synchronization (state in components)
- Save/load system (serializable components)
- Replay system (deterministic updates)
- AI control (same systems, different input)