# Scripts

## smoke-test.ts

Runtime smoke test for the Asteroid Miner game. This script verifies the game loads without errors in a headless browser.

### What it does:
1. Starts Vite dev server on port 9100
2. Launches headless Chromium via Playwright
3. Loads the game page
4. Verifies:
   - No JavaScript console errors
   - Canvas element exists
   - `window.game` is defined
5. Cleans up the server

### Usage:

```bash
npm run test:smoke
```

Or directly:

```bash
npx tsx scripts/smoke-test.ts
```

### Requirements:
- Playwright (installed as dev dependency)
- tsx (for running TypeScript)
- Port 9100 must be available

### Exit codes:
- `0` - All checks passed
- `1` - One or more checks failed

### Output example:

```
[INFO] Starting Vite dev server on port 9100...
[INFO] Launching headless Chromium...
[INFO] Loading http://localhost:9100...
[INFO] Checking for canvas element...
[PASS] Canvas element exists
[INFO] Checking for window.game...
[PASS] window.game is defined
[PASS] No console errors

========================================
SMOKE TEST RESULTS
========================================

Status: PASS ✓
========================================

[INFO] Stopping Vite server...
```

### Notes:
- The test runs on a high port (9100) to avoid conflicts with other services
- Server cleanup is automatic - the process is terminated after testing
- Designed for CI/CD integration and headless NixOS environments
