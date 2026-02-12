/**
 * Mobile Smoke Test
 * 
 * Verifies that the game loads correctly on mobile devices and initializes touch controls.
 * 
 * Usage: npx tsx scripts/mobile-smoke-test.ts
 */

import { spawn, ChildProcess } from 'child_process';
import { chromium, Browser, Page, devices } from 'playwright';
import path from 'path';

const PORT = 9101;
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
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, SERVER_START_DELAY));
  return vite;
}

async function runMobileSmokeTest(): Promise<SmokeTestResult> {
  const result: SmokeTestResult = {
    success: false,
    errors: [],
    warnings: [],
  };

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('[INFO] Launching headless Chromium with iPhone 12 emulation...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const iphone12 = devices['iPhone 12'];
    const context = await browser.newContext({
      ...iphone12,
      ignoreHTTPSErrors: true,
    });

    page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Filter out expected WebGPU fallback warnings if any
        const text = msg.text();
        if (!text.includes('WebGPU')) {
          consoleErrors.push(text);
        }
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

    // Wait for game initialization
    await page.waitForTimeout(3000);

    // 1. Verify Mobile Detection
    console.log('[INFO] Verifying mobile detection...');
    const isMobile = await page.evaluate(() => {
        // Check if MobileDetector exists and is detected
        // @ts-ignore
        const win = window as any;
        // We can't easily access the exported class if it's not on window, 
        // but we can check if the game thinks it's mobile or check the DOM.
        
        // Check for touch class on body or specific mobile elements
        return document.querySelector('#leftJoystickZone') !== null;
    });

    if (!isMobile) {
      result.errors.push('Mobile controls not detected (Joystick zones missing)');
    } else {
      console.log('[PASS] Joystick zones detected');
    }

    // 2. Verify Touch Elements
    const elementsToCheck = [
        '#leftJoystickZone',
        '#rightJoystickZone',
        '#mobile-action-buttons-left',
        '#mobile-action-buttons-right',
        '.touch-action-btn' // At least one button
    ];

    for (const selector of elementsToCheck) {
        const exists = await page.$(selector);
        if (exists) {
            console.log(`[PASS] Element found: ${selector}`);
        } else {
            result.errors.push(`Missing element: ${selector}`);
        }
    }

    // 3. Verify Canvas
    console.log('[INFO] Checking for game canvas...');
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas !== null && canvas.width > 0 && canvas.height > 0;
    });

    if (!canvasExists) {
      result.errors.push('Canvas element not found or has 0 dimensions');
    } else {
      console.log('[PASS] Canvas element exists and has dimensions');
    }

    // 4. Check for console errors
    if (consoleErrors.length > 0) {
      result.warnings.push(`Console errors detected (may be non-critical): ${consoleErrors.join(', ')}`);
    } else {
      console.log('[PASS] No critical console errors');
    }

    // 5. Take Screenshot
    const screenshotPath = '/tmp/mobile-smoke-test.png';
    console.log(`[INFO] Saving screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath });
    console.log('[PASS] Screenshot saved');

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
    const result = await runMobileSmokeTest();

    console.log('\n========================================');
    console.log('MOBILE SMOKE TEST RESULTS');
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
