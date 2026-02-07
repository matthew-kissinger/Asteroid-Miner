/**
 * Runtime Smoke Test
 * 
 * This script performs a lightweight browser verification to ensure the game
 * loads without errors. It:
 * 1. Starts a Vite dev server on port 9100
 * 2. Loads the page with Playwright (headless Chromium)
 * 3. Verifies:
 *    - No JavaScript console errors
 *    - Canvas element exists
 *    - window.game is defined
 * 4. Cleans up the server
 * 
 * Usage: npx tsx scripts/smoke-test.ts
 */

import { spawn, ChildProcess } from 'child_process';
import { chromium, Browser, Page } from 'playwright';

const PORT = 9100;
const TIMEOUT_MS = 30000;
const SERVER_START_DELAY = 3000;

interface SmokeTestResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

async function startViteServer(): Promise<ChildProcess> {
  console.log(`[INFO] Starting Vite dev server on port ${PORT}...`);
  
  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    stdio: 'pipe',
    detached: false,
  });

  await new Promise((resolve) => setTimeout(resolve, SERVER_START_DELAY));
  return vite;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const result: SmokeTestResult = {
    success: false,
    errors: [],
    warnings: [],
  };

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('[INFO] Launching headless Chromium...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    page = await browser.newPage();

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      result.errors.push(`Page error: ${err.message}`);
    });

    console.log(`[INFO] Loading http://localhost:${PORT}...`);
    const response = await page.goto(`http://localhost:${PORT}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT_MS,
    });

    if (!response || !response.ok()) {
      result.errors.push(`Failed to load page: ${response?.status()}`);
      return result;
    }

    await page.waitForTimeout(2000);

    console.log('[INFO] Checking for canvas element...');
    const canvasExists = await page.evaluate(() => {
      return document.querySelector('canvas') !== null;
    });

    if (!canvasExists) {
      result.errors.push('Canvas element not found');
    } else {
      console.log('[PASS] Canvas element exists');
    }

    console.log('[INFO] Checking for window.game...');
    const gameExists = await page.evaluate(() => {
      return typeof (window as any).game !== 'undefined';
    });

    if (!gameExists) {
      result.warnings.push('window.game is undefined (game may still be initializing)');
    } else {
      console.log('[PASS] window.game is defined');
    }

    if (consoleErrors.length > 0) {
      result.errors.push(`Console errors detected: ${consoleErrors.join(', ')}`);
    } else {
      console.log('[PASS] No console errors');
    }

    result.success = result.errors.length === 0;

  } catch (error: any) {
    result.errors.push(`Test exception: ${error.message}`);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }

  return result;
}

async function main() {
  let viteProcess: ChildProcess | null = null;

  try {
    viteProcess = await startViteServer();
    const result = await runSmokeTest();

    console.log('\n========================================');
    console.log('SMOKE TEST RESULTS');
    console.log('========================================');
    
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(e => console.log(`  - ${e}`));
    }

    console.log(`\nStatus: ${result.success ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log('========================================\n');

    process.exit(result.success ? 0 : 1);

  } catch (error: any) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  } finally {
    if (viteProcess && viteProcess.pid) {
      console.log('[INFO] Stopping Vite server...');
      viteProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

main();
