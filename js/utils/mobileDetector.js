/**
 * mobileDetector.js - Utility for detecting mobile devices and touch capabilities
 */

export class MobileDetector {
    /**
     * Check if the current device is a mobile device
     * @returns {boolean} True if the device is mobile
     */
    static isMobile() {
        // Check for mobile user agent
        const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for touch capabilities
        const touchCheck = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        // Check screen width (typically mobile devices are under 768px width)
        const screenCheck = window.innerWidth < 768;
        
        // Device is considered mobile if it matches user agent pattern or has touch capabilities
        // AND has a small screen (to exclude touch-enabled laptops/desktops)
        return (userAgentCheck || touchCheck) && screenCheck;
    }
    
    /**
     * Check if the device supports touch events
     * @returns {boolean} True if touch is supported
     */
    static hasTouch() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0);
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
        window.addEventListener('resize', () => {
            handler(MobileDetector.getOrientation());
        });
    }
} 