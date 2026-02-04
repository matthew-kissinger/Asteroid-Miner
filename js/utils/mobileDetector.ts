/**
 * mobileDetector.js - Utility for detecting mobile devices and touch capabilities
 */

export class MobileDetector {
    /**
     * Check if the current device is a mobile device
     * @returns {boolean} True if the device is mobile
     */
    static isMobile() {
        // Store result in cache to avoid recalculation
        if (this._isMobileCache !== undefined) {
            return this._isMobileCache;
        }
        
        // Check for mobile user agent
        const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Android|iP(ad|hone|od)/i.test(navigator.userAgent);
        
        // Check for touch capabilities - more comprehensive check
        const touchCheck = (
            'ontouchstart' in window || 
            navigator.maxTouchPoints > 0 || 
            navigator.msMaxTouchPoints > 0 ||
            (window.DocumentTouch && document instanceof DocumentTouch)
        );
        
        // Check screen width and orientation
        const screenCheck = window.innerWidth < 900; // More generous width threshold
        
        // Check if viewport meta tag has mobile-optimized settings
        const viewportCheck = (() => {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                return viewport.content.includes('width=device-width');
            }
            return false;
        })();
        
        // Check for specific mobile browser features
        const mobileFeatureCheck = 'orientation' in window || 'onorientationchange' in window;
        
        // Check if device motion/orientation events are supported (typically mobile)
        const motionCheck = 'DeviceMotionEvent' in window || 'DeviceOrientationEvent' in window;
        
        // Improve detection of tablets - they are also considered mobile for our purposes
        const isTablet = (() => {
            // iPads now report as desktop in newer iOS, so we need specific checks
            const isIpad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
            // Android tablets often have larger screens
            const isAndroidTablet = /android/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
            
            return isIpad || isAndroidTablet;
        })();
        
        // More comprehensive detection logic - a device is mobile if:
        // 1. It matches mobile user agent patterns, OR
        // 2. It has touch capabilities AND either:
        //    a. Has a small-to-medium screen size, OR
        //    b. Has mobile browser features, OR
        //    c. Supports device motion/orientation, OR
        //    d. Is detected as a tablet
        this._isMobileCache = userAgentCheck || 
            (touchCheck && (screenCheck || mobileFeatureCheck || motionCheck || viewportCheck || isTablet));
        
        console.log(`MobileDetector: Device detected as ${this._isMobileCache ? 'mobile' : 'desktop'}`);
        console.log(`- UA: ${userAgentCheck}, touch: ${touchCheck}, screen: ${screenCheck}`);
        console.log(`- features: ${mobileFeatureCheck}, motion: ${motionCheck}, tablet: ${isTablet}`);
        
        return this._isMobileCache;
    }
    
    /**
     * Reset the mobile detection cache (useful after device orientation changes)
     */
    static resetCache() {
        this._isMobileCache = undefined;
    }
    
    /**
     * Check if the device supports touch events
     * @returns {boolean} True if touch is supported
     */
    static hasTouch() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0) ||
               (window.DocumentTouch && document instanceof DocumentTouch);
    }
    
    /**
     * Get device orientation
     * @returns {string} 'portrait' or 'landscape'
     */
    static getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    
    /**
     * Add handler for orientation changes
     * @param {Function} handler Function to call when orientation changes
     */
    static addOrientationChangeHandler(handler) {
        // Track previous orientation
        let prevOrientation = this.getOrientation();
        
        // Use both resize and orientationchange for better compatibility
        const checkOrientation = () => {
            const currentOrientation = this.getOrientation();
            if (currentOrientation !== prevOrientation) {
                prevOrientation = currentOrientation;
                // Reset mobile detection cache
                this.resetCache();
                // Call handler with new orientation
                handler(currentOrientation);
            }
        };
        
        window.addEventListener('resize', checkOrientation);
        
        // Add orientationchange listener if available
        if ('onorientationchange' in window) {
            window.addEventListener('orientationchange', checkOrientation);
        }
    }
} 