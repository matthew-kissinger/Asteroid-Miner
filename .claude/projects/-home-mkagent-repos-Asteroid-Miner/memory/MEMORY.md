# Asteroid-Miner Memory

## Codebase State (as of 2026-02-06, Phase 5 IN PROGRESS)
- Build: succeeds, code-split (game-core 182 kB, combat chunk gone, env 64 kB, ui 65 kB)
- Typecheck: 0 errors
- Total TS files: ~235 (pure TypeScript codebase)
- HEAD at d2990aa (CSS import fix)
- Working tree: clean
- Branch in sync with origin
- bitECS systems ALL wired into ecsRunner.ts: physics, renderSync, enemyAI, combat, mining
- Vitest: 3 test files, 10 tests passing
- Runtime smoke test UNVERIFIED - no browser on NixOS hub (GitHub Pages deployed)

## Phase 5 Progress (HUD Overhaul)
**Infrastructure DONE:**
- Vite 6 upgraded (2b45218)
- Tailwind CSS 3.4 + PostCSS 8.4 + autoprefixer installed
- tailwind.config.ts + postcss.config.js configured
- src/styles/main.css entry point imports Tailwind directives + all 7 CSS files
- Dead legacy ECS code deleted (d9d648f) - only messageBus.ts, world.ts, events.ts remain

**CSS migrations DONE (committed + pushed):**
- src/styles/combat.css: 630 lines (6 combat TS files)
- src/styles/mobile-hud.css: 254 lines (mobileHUD.ts)
- src/styles/touch-controls.css: 132 lines (actionButtons.ts)
- src/styles/blackjack.css: 264 lines (blackjack/animations.ts)
- src/styles/game-over.css: 134 lines (gameOverScreen.ts)
- src/styles/settings.css: 337 lines (settings/ 3 files)
- src/styles/starmap.css: 300 lines (starmap/ 3 files)
- Total: ~1,751 lines of CSS extracted from inline styles

**Remaining inline styles: ~965 across codebase**
- combat/animations.ts: 38 (dynamic: widths, colors, animation strings)
- ui.ts: 49
- stargate/tradingView.ts: 42
- targetingUI.ts: 39
- blackjack/gameView.ts: 37
- controls.ts: 32
- src/main.ts: 29 (loading overlay)
- lockOnDisplay.ts: 27
- customSystem/validation.ts: 27
- stateManager.ts: 27
- gamepadHandler.ts: 27
- Many files with 19-26 remaining

**Window.* globals: ~264 across 64 files**
- physics.ts: CLEANED (77fdb44)
- src/main.ts: 17 (loading overlay, legitimate)
- diagnostics.ts: 17
- renderer.ts: 14 (includes necessary window.innerWidth/Height)
- starMap.ts: 13

## What's Next
1. **Continue CSS migration** - ui.ts (49), stargate/tradingView.ts (42), targetingUI.ts (39)
2. **Contextual UI** - show/hide HUD elements based on game state
3. **Mining progress UI** - satisfying feedback for mining
4. **Resource collection popups**
5. **Verify runtime** - Check GitHub Pages or test on Windows PC
6. **Phase 6: TSL Shaders** - Convert GLSL to TSL, WebGPU compute particles

## Key Milestones
1. Phase 2 COMPLETE - Pure TypeScript codebase (~235 TS, 0 JS)
2. Legacy ECS deleted (13c30a0) - js/systems/ and js/components/ removed
3. bitECS systems wired (e9d8f51) - all 5 systems in game loop
4. Phase 3 COMPLETE (2026-02-05) - All game feel features implemented
5. Phase 4 COMPLETE (2026-02-05) - All visual indicators implemented
6. Dead core ECS code deleted (d9d648f) - 7 files + optimized/ + spatial/
7. Vite 6 + Tailwind installed (2b45218)
8. physics.ts window.game globals removed (77fdb44)
9. Vitest smoke tests added (58f5fce) - 10 tests passing
10. CSS migration batch 1: combat + mobileHUD (ce67697)
11. CSS migration batch 2: starmap + settings + blackjack + gameOver + touch (b8308b2)
12. CSS import fix (d2990aa) - 4 missing @import lines added

## Agent Reliability
- **cline: UNRELIABLE.** Avoid.
- **cursor/composer-1: Does not commit.** Add explicit commit instructions. ALSO misses CSS imports - work needs QA.
- **cursor/sonnet-4.5: Reliable for CSS migration.** touch-controls done correctly (154s).
- **cursor/opus-4.6-thinking: Thorough but slow (385s).** Good quality mobileHUD migration.
- **kiro/default: Reliable for CSS migration.** Did starmap+settings+rolled up other uncommitted work (309s). BUT missed CSS imports in main.css.
- **codex: May claim credit for pre-existing work.** Always diff commits. gpt-5.2-codex-high can timeout.
- **copilot/claude-sonnet-4.5: Reliable for commits and tests.** vitest task (110s) and commit+push (53s) both clean.
- **claude/sonnet: Best for greenfield systems and refactoring.** physics.ts DI clean (166s).
- **claude/haiku: Fast, reliable for fixes.**
- **gemini/flash: Reliable for conversion.** gemini-3-pro had API error, use flash.
- **pi/groq: kimi-k2-instruct model available**

## Shepherd QA Findings
- **CSS imports not added by migration agents.** Both cursor and kiro created CSS files but didn't update main.css to import them. Shepherd caught and fixed this (d2990aa). Future CSS migration tasks MUST include "update main.css imports" as an explicit requirement.
- **Remaining .style. in "migrated" combat/animations.ts: 38.** These are dynamic values (widths, colors, animation strings). Acceptable but could be further reduced with CSS custom properties.

## Technical Notes
- WebGPURenderer not in @types/three - use type declaration
- ShaderPass requires raw GLSL/WGSL, not TSL nodes
- NixOS hub has no browser - runtime tests need Windows PC or CI
- Radar uses canvas 2D at 10fps update rate for performance
- Velocity indicator uses SVG arrow with CSS transforms
- Speed lines use DOM element pool (max 20 lines) with CSS animations
- Camera shake implemented in Physics.applyShake() using dual-frequency sine waves
- Screen flash uses HTML overlay (position: fixed, pointerEvents: none) with CSS transitions
- Damage numbers use DOM element pooling with world-to-screen projection
- Threat indicators use arrow pool (max 6), color-coded by distance (red/orange/green)
- Lock-on uses lead calculation: leadTime = distance / projectileSpeed (2000 units/s)
- Enemy AI state transitions: IDLE -> PATROL -> CHASE <-> EVADE (health-based)
- CSS migration pattern: extract inline styles to .css, replace .style.X = Y with .classList.add()
- Tailwind theme vars defined in main.css: --color-space-dark, --color-hud-green, --color-hud-red, --color-hud-blue
- CSS files use prefixed class names: combat-, bj-, game-over-, settings-, starmap-, touch-
