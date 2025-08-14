# Settings Components

This directory contains the refactored settings system, broken down into specialized modules for better maintainability and organization.

## Overview

The settings system was refactored from a single 1070-line file into a modular architecture with the main Settings class (251 lines) orchestrating several focused submodules.

## Architecture

### Main Settings Class (`../settings.js`)
- **251 lines** (down from 1070 lines)
- Orchestrates all submodules
- Maintains public API compatibility
- Handles initialization and coordination

### Submodules

#### `styles.js` (275 lines)
- All CSS styling logic and responsive design
- Style generation functions for different UI components
- Mobile and desktop styling variations
- CSS injection and management

#### `graphicsSettings.js` (389 lines)
- Graphics quality controls and logic
- Renderer settings application
- Environment and physics settings related to graphics
- God rays, post-processing, resolution scaling
- Graphics preset application

#### `audioSettings.js` (77 lines)
- Audio controls and spatial audio settings
- Audio preset application
- Audio UI management

#### `settingsView.js` (183 lines)
- Settings panel layout and view management
- HTML generation for settings UI
- Show/hide functionality
- Notification display

#### `persistence.js` (200 lines)
- Settings save/load functionality
- LocalStorage management
- Settings validation
- Backup and restore capabilities
- Import/export functionality

#### `eventHandlers.js` (214 lines)
- UI event handling (clicks, touches)
- Button effects and feedback
- Keyboard navigation
- Form validation

#### `helpers.js` (354 lines)
- Utility functions and system detection
- Monitor refresh rate detection
- System capability analysis
- Performance impact calculation
- Settings validation

## Key Features Preserved

✅ All existing functionality maintained
✅ Mobile and desktop responsive design
✅ Settings persistence to localStorage
✅ Graphics quality presets (Performance, Balanced, Quality)
✅ Real-time refresh rate detection
✅ God rays and post-processing controls
✅ Audio spatial controls
✅ Frame rate limiting
✅ FPS counter toggle
✅ Touch and mouse event handling

## Benefits of Refactoring

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Individual modules can be tested in isolation
3. **Reusability**: Modules can be reused in other parts of the application
4. **Readability**: Much easier to understand and modify specific functionality
5. **Performance**: Better code organization and potential for tree-shaking

## File Size Reduction

- **Original**: 1070 lines in single file
- **Refactored**: 251 lines in main file + 1692 lines in focused modules
- **Main settings file reduction**: 76.5% smaller
- **Total functionality**: Expanded with additional features like backups and validation

## Usage

The Settings class maintains the same public API, so no changes are required in existing code:

```javascript
import { Settings } from './modules/ui/settings.js';

const settings = new Settings(game);
settings.show();
settings.hide();
settings.toggle();
```

## Future Enhancements

The modular structure makes it easy to add:
- Control/keybinding settings (controlSettings.js module planned)
- Additional graphics options
- More audio controls
- Settings import/export UI
- Settings profiles/multiple presets
- Real-time settings preview