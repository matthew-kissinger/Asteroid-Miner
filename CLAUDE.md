# CLAUDE.md - Guide for Code Assistants

## Runtime Commands
- Launch: Open `index.html` in a browser (no build step required)
- Debug Mode: Set `DEBUG_MODE = true` in main.js for verbose console logging

## Code Style Guidelines
- **Formatting**: 4-space indentation, braces on same line
- **Naming**: 
  - PascalCase for classes (`Entity`, `Component`)
  - camelCase for variables/methods (`addComponent`, `updatePosition`)
  - Private properties prefixed with underscore (`_isEnemy`)
- **Imports**: Use ES module syntax with relative paths (`import { Entity } from './core/entity.js'`)
- **Documentation**: JSDoc comments for functions with @param and @returns tags
- **Error Handling**: Use try/catch with fallbacks and user notifications, log errors to console

## Architecture
- Entity Component System (ECS) pattern
- Components hold data, Systems contain logic
- Messaging system for inter-component communication
- Method chaining pattern with `return this`

## Development Notes
- The game uses Three.js for 3D rendering
- Audio, physics, and input handling are encapsulated in separate modules
- Resource loading is asynchronous with fallbacks for missing assets