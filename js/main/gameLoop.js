// gameLoop.js - Ticking and requestAnimationFrame wiring

export class GameLoop {
    constructor(game) {
        this.game = game;
        
        // Frame rate cap (defaults to auto/monitor refresh rate)
        this.frameRateCap = 0; // Will be updated by settings or refresh rate detection
        this.warmupFrames = 10; // Number of frames to skip for timing stabilization
        this.currentWarmupFrame = 0;
        this.performanceStable = false;
        
        // Time tracking for frame rate cap and FPS calculation
        this.lastFrameTime = 0;
        this.actualFrameTime = 0;
        this.frameStartTime = 0;
        this.accumulator = 0;
        this.fixedDeltaTime = 1/60; // Fixed 60 Hz update rate
        
        // FPS averaging for smoother display
        this.fpsBuffer = [];
        this.fpsBufferSize = 15; // Smaller buffer for more responsive updates
        
        // Pre-bind animate method to avoid creating a new function every frame
        this.boundAnimate = this.animate.bind(this);
        
        // Reusable deltaTime variable to avoid creating new variables in hot path
        this.deltaTime = 0;
        
        // Performance tracking
        this.lastUpdateTime = performance.now();
        this.frameCount = 0;
        this.currentFPS = 0;
    }
    
    start() {
        requestAnimationFrame(this.boundAnimate);
    }
    
    animate(timestamp) {
        // Handle warm-up frames for timing stabilization
        if (this.currentWarmupFrame < this.warmupFrames) {
            this.currentWarmupFrame++;
            
            // Initialize timing on first real frame after warm-up
            if (this.currentWarmupFrame === this.warmupFrames) {
                this.lastFrameTime = timestamp;
                this.frameStartTime = performance.now();
                this.lastUpdateTime = performance.now();
                this.performanceStable = true;
            }
            
            // Continue warm-up
            requestAnimationFrame(this.boundAnimate);
            return;
        }
        
        // Initialize frame timing if needed (fallback)
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
            this.frameStartTime = performance.now();
            // Request next frame and return
            requestAnimationFrame(this.boundAnimate);
            return; // Skip first frame to establish baseline
        }
        
        // Track actual frame time for FPS calculation
        this.actualFrameTime = timestamp - this.lastFrameTime;
        
        // Frame rate cap handling
        if (this.frameRateCap > 0) {
            // Calculate target frame duration in milliseconds
            const targetFrameTime = 1000 / this.frameRateCap;
            
            // Calculate elapsed time since last rendered frame
            const elapsedSinceLastFrame = timestamp - this.lastFrameTime;
            
            // If we haven't reached the target frame time yet, skip this frame
            if (elapsedSinceLastFrame < targetFrameTime - 0.5) { // Subtract small amount to account for timing imprecision
                // Request next frame and return early
                requestAnimationFrame(this.boundAnimate);
                return;
            }
            
            // Update timing for next frame - use the exact target time
            // This helps maintain a more consistent frame rate
            this.lastFrameTime += targetFrameTime;
            
            // If we're more than one frame behind, catch up to avoid spiraling
            if (timestamp - this.lastFrameTime > targetFrameTime) {
                this.lastFrameTime = timestamp - targetFrameTime;
            }
        } else {
            // No frame rate cap - update normally
            this.lastFrameTime = timestamp;
        }
        
        // Calculate delta time for this frame - prevent huge deltas
        const now = performance.now();
        const rawDelta = Math.min((now - this.lastUpdateTime) / 1000, 0.1); // Cap at 100ms to prevent explosion on tab switch
        this.lastUpdateTime = now;
        
        // Update accumulator for fixed timestep
        this.accumulator += rawDelta;
        
        // Perform fixed timestep updates
        // This keeps physics and gameplay consistent regardless of frame rate
        while (this.accumulator >= this.fixedDeltaTime) {
            // Use fixed delta for deterministic updates
            this.deltaTime = this.fixedDeltaTime;
            
            // Store game time before update
            this.game.gameTime += this.deltaTime;
            
            // Update all game systems
            this.game.update(this.deltaTime);
            
            this.accumulator -= this.fixedDeltaTime;
        }
        
        // Interpolation factor for rendering (unused for now, but useful for smooth rendering)
        // const alpha = this.accumulator / this.fixedDeltaTime;
        
        // Render the frame
        if (this.game.renderer && this.game.renderer.render) {
            this.game.renderer.render();
        }
        
        // Update FPS calculation
        this.updateFPS();
        
        // Request next frame
        requestAnimationFrame(this.boundAnimate);
    }
    
    updateFPS() {
        const now = performance.now();
        const instantFPS = this.actualFrameTime ? 1000 / this.actualFrameTime : 60;
        
        // Add to FPS buffer with weighted preference to more recent readings
        // This helps the FPS display stabilize faster when frame rate changes
        this.fpsBuffer.push(instantFPS);
        if (this.fpsBuffer.length > this.fpsBufferSize) {
            this.fpsBuffer.shift(); // Remove oldest value
        }
        
        // Use weighted average to more accurately represent current FPS
        // Gives more importance to recent frames
        let totalWeight = 0;
        let weightedSum = 0;
        
        for (let i = 0; i < this.fpsBuffer.length; i++) {
            // Weight increases linearly with frame index (newer frames get higher weight)
            const weight = i + 1;
            weightedSum += this.fpsBuffer[i] * weight;
            totalWeight += weight;
        }
        
        // Calculate weighted average for smoother display
        this.currentFPS = Math.round(weightedSum / totalWeight);
        
        // Only update FPS display every few frames to reduce DOM operations
        if (this.frameCount % 5 === 0 && this.game.ui && this.game.ui.updateFPS) {
            // If capped, show cap information along with actual FPS
            if (this.frameRateCap > 0) {
                this.game.ui.updateFPS(this.currentFPS, this.frameRateCap);
            } else {
                this.game.ui.updateFPS(this.currentFPS);
            }
        }
        
        // Count frames for performance monitoring
        this.frameCount++;
    }
    
    setFrameRateCap(cap) {
        this.frameRateCap = cap;
    }
    
    applyFrameRateSettings() {
        // Apply frame rate settings from UI
        if (this.game.ui && this.game.ui.settings) {
            const frameRateSetting = this.game.ui.settings.getFrameRateCap ? 
                                   this.game.ui.settings.getFrameRateCap() : 0;
            
            if (frameRateSetting === 'auto' || frameRateSetting === 0) {
                // Auto-detect based on refresh rate
                this.setFrameRateCap(0); // Unlimited for now
                
                // Try to detect monitor refresh rate
                this.detectRefreshRate().then(rate => {
                    if (rate && rate > 0) {
                        this.setFrameRateCap(rate);
                    }
                });
            } else {
                // Use manual setting
                this.setFrameRateCap(parseInt(frameRateSetting));
            }
        }
    }
    
    async detectRefreshRate() {
        // Try to detect the monitor's refresh rate
        // This is a simple heuristic that measures frame timing
        return new Promise((resolve) => {
            let frames = 0;
            let startTime = 0;
            const samples = [];
            
            const measure = (timestamp) => {
                if (frames === 0) {
                    startTime = timestamp;
                } else if (frames > 10 && frames <= 70) {
                    // Collect samples after warm-up
                    const delta = timestamp - startTime;
                    samples.push(delta);
                    startTime = timestamp;
                }
                
                frames++;
                
                if (frames < 80) {
                    requestAnimationFrame(measure);
                } else {
                    // Calculate average frame time
                    if (samples.length > 0) {
                        const avgFrameTime = samples.reduce((a, b) => a + b, 0) / samples.length;
                        const detectedRate = Math.round(1000 / avgFrameTime);
                        
                        // Round to common refresh rates
                        const commonRates = [30, 60, 75, 90, 120, 144, 165, 240, 360];
                        let closestRate = 60;
                        let minDiff = Math.abs(detectedRate - 60);
                        
                        for (const rate of commonRates) {
                            const diff = Math.abs(detectedRate - rate);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestRate = rate;
                            }
                        }
                        
                        // Only use detected rate if we're confident
                        if (minDiff < 5) {
                            resolve(closestRate);
                        } else {
                            resolve(0); // Fallback to unlimited
                        }
                    } else {
                        resolve(0);
                    }
                }
            };
            
            requestAnimationFrame(measure);
        });
    }
    
    destroy() {
        // Cancel animation frame
        if (this.boundAnimate) {
            cancelAnimationFrame(this.boundAnimate);
            this.boundAnimate = null;
        }
    }
}