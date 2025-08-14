// helpers.js - Settings utility functions and validation

export class SettingsHelpers {
    constructor() {
        this.monitorRefreshRate = 60; // Default refresh rate
    }

    /**
     * Detects system capabilities for auto-configuration
     */
    detectSystemCapabilities() {
        const performance = {};
        
        // Check device pixel ratio (higher on high-end devices)
        performance.highDPI = window.devicePixelRatio > 1;
        
        // Check if WebGL2 is available
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        performance.webgl2 = !!gl;
        
        // Get GPU info if available
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                performance.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
        
        // Check for recent browser features that suggest a modern device
        performance.modernBrowser = 
            'IntersectionObserver' in window && 
            'requestAnimationFrame' in window &&
            'localStorage' in window;
            
        // Make a recommendation based on the detected capabilities
        if (performance.webgl2 && performance.highDPI && performance.modernBrowser) {
            return 'high';
        } else if (performance.webgl2 && performance.modernBrowser) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Detects monitor refresh rate
     */
    detectMonitorRefreshRate() {
        // Start with intelligent default based on common scenarios
        this.monitorRefreshRate = 60;
        
        try {
            // Method 1: Try modern Chrome API first (most reliable when available)
            if ('getScreenDetails' in window && window.getScreenDetails) {
                window.getScreenDetails().then(details => {
                    if (details && details.currentScreen && details.currentScreen.refreshRate) {
                        this.monitorRefreshRate = Math.round(details.currentScreen.refreshRate);
                        console.log(`Using getScreenDetails API: ${this.monitorRefreshRate}Hz`);
                        this.updateRefreshRateCallback?.();
                    }
                }).catch(err => {
                    console.log("getScreenDetails not available, falling back to other methods");
                });
            }
            
            // Method 2: Try screen.refresh (older API but sometimes available)
            if (window.screen && typeof window.screen.refresh === 'number' && window.screen.refresh > 0) {
                this.monitorRefreshRate = Math.round(window.screen.refresh);
                console.log(`Using screen.refresh value: ${this.monitorRefreshRate}Hz`);
                return; // Use this value immediately if available
            }
            
            // Method 3: Quick synchronous measurement (first few frames)
            const quickMeasure = this.quickRefreshRateMeasure();
            if (quickMeasure > 0) {
                this.monitorRefreshRate = quickMeasure;
                console.log(`Quick measure refresh rate: ${this.monitorRefreshRate}Hz`);
            }
            
            // Method 4: Start accurate async measurement for refinement
            this.startAccurateRefreshDetection();
            
        } catch (error) {
            console.warn("Error detecting refresh rate:", error);
        }
    }

    /**
     * Quick refresh rate measurement
     */
    quickRefreshRateMeasure() {
        // Check if we have screen refresh rate available
        if (window.screen && typeof window.screen.refresh === 'number' && window.screen.refresh > 0) {
            return Math.round(window.screen.refresh);
        }
        
        // Check common indicators for high refresh displays
        const userAgent = navigator.userAgent.toLowerCase();
        const isGaming = userAgent.includes('gaming') || userAgent.includes('rog');
        const isHighEnd = window.screen && window.screen.width > 2560;
        
        // Make educated guess based on device
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        if (isMobile) {
            return 60; // Most mobile devices are 60Hz
        } else if (isGaming || isHighEnd) {
            return 144; // Assume high refresh for gaming systems
        }
        
        // Default to 60Hz for standard displays
        return 60;
    }

    /**
     * Starts accurate refresh rate detection over time
     */
    startAccurateRefreshDetection() {
        let warmupFrames = 5; // Skip initial irregular frames
        let frameCount = 0;
        const timestamps = [];
        const startTime = performance.now();
        
        const detectFrame = (timestamp) => {
            frameCount++;
            
            // Skip warmup frames
            if (frameCount <= warmupFrames) {
                requestAnimationFrame(detectFrame);
                return;
            }
            
            timestamps.push(timestamp);
            
            // Collect for 1 second or 120 frames
            if (timestamps.length < 120 && performance.now() - startTime < 1000) {
                requestAnimationFrame(detectFrame);
            } else {
                this.processRefreshRateSamples(timestamps);
            }
        };
        
        requestAnimationFrame(detectFrame);
    }

    /**
     * Processes refresh rate samples to determine accurate rate
     */
    processRefreshRateSamples(timestamps) {
        if (timestamps.length < 2) return;
        
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            const delta = timestamps[i] - timestamps[i-1];
            if (delta > 0) {
                intervals.push(1000 / delta);
            }
        }
        
        if (intervals.length === 0) return;
        
        // Remove outliers using IQR method
        intervals.sort((a, b) => a - b);
        const q1 = intervals[Math.floor(intervals.length * 0.25)];
        const q3 = intervals[Math.floor(intervals.length * 0.75)];
        const iqr = q3 - q1;
        
        const validRates = intervals.filter(rate => 
            rate >= q1 - 1.5 * iqr && rate <= q3 + 1.5 * iqr
        );
        
        if (validRates.length > 0) {
            const avg = validRates.reduce((a, b) => a + b, 0) / validRates.length;
            const newRate = this.roundToCommonRefreshRate(avg);
            
            // Only update if significantly different
            if (Math.abs(newRate - this.monitorRefreshRate) >= 5) {
                console.log(`Refined refresh rate: ${this.monitorRefreshRate}Hz -> ${newRate}Hz`);
                this.monitorRefreshRate = newRate;
                
                // Notify callback if set
                this.updateRefreshRateCallback?.();
            }
        }
    }

    /**
     * Rounds measured rate to common refresh rates
     */
    roundToCommonRefreshRate(rate) {
        // Common refresh rates in 2024
        const commonRates = [24, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360, 480];
        
        let closest = 60;
        let minDiff = Math.abs(rate - 60);
        
        for (const commonRate of commonRates) {
            const diff = Math.abs(rate - commonRate);
            if (diff < minDiff) {
                minDiff = diff;
                closest = commonRate;
            }
        }
        
        // Only accept if within 10% of a common rate
        if (minDiff / closest < 0.1) {
            return closest;
        }
        
        return Math.round(rate); // Return raw rate if no close match
    }

    /**
     * Gets the current monitor refresh rate
     */
    getMonitorRefreshRate() {
        return this.monitorRefreshRate;
    }

    /**
     * Sets a callback to be called when refresh rate is updated
     */
    setRefreshRateUpdateCallback(callback) {
        this.updateRefreshRateCallback = callback;
    }

    /**
     * Validates a settings object
     */
    validateSettings(settings) {
        const validationRules = {
            graphicalQuality: ['low', 'medium', 'high'],
            asteroidDetail: ['low', 'medium', 'high'],
            lightingQuality: ['low', 'medium', 'high'],
            particleEffects: ['low', 'medium', 'high'],
            resolutionScale: ['low', 'medium', 'high'],
            frameRateCap: ['30', '60', 'auto', '0'],
            godRaysType: ['standard', 'claude']
        };

        const errors = [];

        // Validate enum values
        for (const [key, validValues] of Object.entries(validationRules)) {
            if (settings[key] && !validValues.includes(settings[key])) {
                errors.push(`Invalid value for ${key}: ${settings[key]}`);
            }
        }

        // Validate boolean values
        const booleanSettings = ['postProcessing', 'showFPS', 'spatialAudio', 'autoQuality', 'godRaysEnabled'];
        booleanSettings.forEach(key => {
            if (settings[key] !== undefined && typeof settings[key] !== 'boolean') {
                errors.push(`Invalid value for ${key}: must be boolean`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Gets performance recommendation based on system capabilities
     */
    getPerformanceRecommendation() {
        const capability = this.detectSystemCapabilities();
        
        const recommendations = {
            low: {
                graphicalQuality: 'low',
                postProcessing: false,
                asteroidDetail: 'low',
                lightingQuality: 'low',
                particleEffects: 'low',
                resolutionScale: 'low',
                frameRateCap: '30',
                godRaysEnabled: false
            },
            medium: {
                graphicalQuality: 'medium',
                postProcessing: true,
                asteroidDetail: 'medium',
                lightingQuality: 'medium',
                particleEffects: 'medium',
                resolutionScale: 'medium',
                frameRateCap: '60',
                godRaysEnabled: true,
                godRaysType: 'standard'
            },
            high: {
                graphicalQuality: 'high',
                postProcessing: true,
                asteroidDetail: 'high',
                lightingQuality: 'high',
                particleEffects: 'high',
                resolutionScale: 'high',
                frameRateCap: 'auto',
                godRaysEnabled: true,
                godRaysType: 'claude'
            }
        };

        return recommendations[capability] || recommendations.medium;
    }

    /**
     * Formats settings for display
     */
    formatSettingsForDisplay(settings) {
        const formatted = {};
        
        for (const [key, value] of Object.entries(settings)) {
            if (typeof value === 'boolean') {
                formatted[key] = value ? 'Enabled' : 'Disabled';
            } else if (key === 'frameRateCap') {
                if (value === '0') {
                    formatted[key] = 'Unlimited';
                } else if (value === 'auto') {
                    formatted[key] = `Monitor Refresh Rate (${this.monitorRefreshRate}Hz)`;
                } else {
                    formatted[key] = `${value} FPS`;
                }
            } else {
                formatted[key] = value.charAt(0).toUpperCase() + value.slice(1);
            }
        }
        
        return formatted;
    }

    /**
     * Calculates estimated performance impact of settings
     */
    calculatePerformanceImpact(settings) {
        let impact = 0;
        
        // Quality settings impact
        const qualityMap = { low: 1, medium: 2, high: 3 };
        impact += qualityMap[settings.graphicalQuality] || 2;
        impact += qualityMap[settings.asteroidDetail] || 2;
        impact += qualityMap[settings.lightingQuality] || 2;
        impact += qualityMap[settings.particleEffects] || 2;
        impact += qualityMap[settings.resolutionScale] || 2;
        
        // Boolean settings impact
        if (settings.postProcessing) impact += 1;
        if (settings.godRaysEnabled) impact += 2;
        
        // Normalize to 0-100 scale
        const maxImpact = 17; // Maximum possible impact
        return Math.round((impact / maxImpact) * 100);
    }
}