// gestureDetector.js - Touch gesture recognition for mobile controls

type GesturePosition = {
    x: number;
    y: number;
};

type GestureCallback = (data: unknown) => void;

export class GestureDetector {
    isEnabled: boolean;
    gestureCallbacks: Map<string, GestureCallback>;
    touchStartTime: number;
    touchStartPos: GesturePosition;
    touchEndPos: GesturePosition;
    swipeThreshold: number;
    tapTimeout: number;

    constructor() {
        this.isEnabled = false;
        this.gestureCallbacks = new Map();
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.touchEndPos = { x: 0, y: 0 };
        this.swipeThreshold = 50; // minimum distance for swipe
        this.tapTimeout = 300; // maximum time for tap
    }

    enable(): void {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        
        // Add global touch event listeners for gesture detection
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    disable(): void {
        if (!this.isEnabled) return;
        
        this.isEnabled = false;
        
        // Remove global touch event listeners
        document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleTouchStart(event: TouchEvent): void {
        if (!this.isEnabled) return;
        
        // Ignore if touch is on a UI element (joystick or button)
        if (this.isTouchOnUIElement(event.target)) return;
        
        const touch = event.touches[0];
        this.touchStartTime = Date.now();
        this.touchStartPos = {
            x: touch.clientX,
            y: touch.clientY
        };
    }

    handleTouchMove(event: TouchEvent): void {
        if (!this.isEnabled) return;
        
        // Ignore if touch is on a UI element
        if (this.isTouchOnUIElement(event.target)) return;
        
        // Prevent default to avoid scrolling during gesture detection
        event.preventDefault();
    }

    handleTouchEnd(event: TouchEvent): void {
        if (!this.isEnabled) return;
        
        // Ignore if touch is on a UI element
        if (this.isTouchOnUIElement(event.target)) return;
        
        const touch = event.changedTouches[0];
        this.touchEndPos = {
            x: touch.clientX,
            y: touch.clientY
        };
        
        const touchDuration = Date.now() - this.touchStartTime;
        const distance = this.calculateDistance(this.touchStartPos, this.touchEndPos);
        
        // Detect gesture type
        if (touchDuration <= this.tapTimeout && distance < this.swipeThreshold) {
            this.triggerGesture('tap', {
                position: this.touchEndPos,
                duration: touchDuration
            });
        } else if (distance >= this.swipeThreshold) {
            const direction = this.getSwipeDirection(this.touchStartPos, this.touchEndPos);
            this.triggerGesture('swipe', {
                direction: direction,
                distance: distance,
                duration: touchDuration,
                startPos: this.touchStartPos,
                endPos: this.touchEndPos
            });
        }
    }

    isTouchOnUIElement(target: EventTarget | null): boolean {
        // Check if touch is on joystick zones or action buttons
        const uiSelectors = [
            '#leftJoystickZone',
            '#rightJoystickZone',
            '#mobile-action-buttons-left',
            '#mobile-action-buttons-right',
            '.mobile-action-button'
        ];
        
        for (const selector of uiSelectors) {
            if (target && 'closest' in target && typeof (target as Element).closest === 'function' && (target as Element).closest(selector)) {
                return true;
            }
        }
        
        return false;
    }

    calculateDistance(pos1: GesturePosition, pos2: GesturePosition): number {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getSwipeDirection(startPos: GesturePosition, endPos: GesturePosition): string {
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    triggerGesture(gestureType: string, data: unknown): void {
        const callback = this.gestureCallbacks.get(gestureType);
        if (callback && typeof callback === 'function') {
            callback(data);
        }
    }

    // Register callbacks for specific gestures
    onGesture(gestureType: string, callback: GestureCallback): void {
        this.gestureCallbacks.set(gestureType, callback);
    }

    // Remove gesture callback
    offGesture(gestureType: string): void {
        this.gestureCallbacks.delete(gestureType);
    }

    // Clear all gesture callbacks
    clearGestures(): void {
        this.gestureCallbacks.clear();
    }
}
