// joystickZones.js - Joystick UI zone creation and management

interface ListenerBinding {
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
}

export class JoystickZones {
    leftJoystickZone: HTMLDivElement | null;
    rightJoystickZone: HTMLDivElement | null;
    private bindings: ListenerBinding[] = [];

    constructor() {
        this.leftJoystickZone = null;
        this.rightJoystickZone = null;
    }

    private addPreventDefaultListeners(zone: HTMLDivElement): void {
        const opts = { passive: false };
        const onTouchStart: EventListener = (e) => (e as TouchEvent).preventDefault();
        const onTouchMove: EventListener = (e) => (e as TouchEvent).preventDefault();
        const onTouchEnd: EventListener = (e) => (e as TouchEvent).preventDefault();
        zone.addEventListener('touchstart', onTouchStart, opts);
        zone.addEventListener('touchmove', onTouchMove, opts);
        zone.addEventListener('touchend', onTouchEnd, opts);
        this.bindings.push(
            { element: zone, event: 'touchstart', handler: onTouchStart, options: opts },
            { element: zone, event: 'touchmove', handler: onTouchMove, options: opts },
            { element: zone, event: 'touchend', handler: onTouchEnd, options: opts }
        );
    }

    createJoystickZones(): { leftZone: HTMLDivElement | null; rightZone: HTMLDivElement | null } {
        this.createLeftJoystickZone();
        this.createRightJoystickZone();
        return {
            leftZone: this.leftJoystickZone,
            rightZone: this.rightJoystickZone
        };
    }

    createLeftJoystickZone(): HTMLDivElement {
        const leftJoystickZone = document.createElement('div');
        leftJoystickZone.id = 'leftJoystickZone';
        leftJoystickZone.style.position = 'absolute';
        leftJoystickZone.style.bottom = '50px';
        leftJoystickZone.style.left = '50px';
        leftJoystickZone.style.width = '100px';
        leftJoystickZone.style.height = '100px';
        leftJoystickZone.style.zIndex = '1000';

        this.addPreventDefaultListeners(leftJoystickZone);

        document.body.appendChild(leftJoystickZone);
        this.leftJoystickZone = leftJoystickZone;

        return leftJoystickZone;
    }

    createRightJoystickZone(): HTMLDivElement {
        const rightJoystickZone = document.createElement('div');
        rightJoystickZone.id = 'rightJoystickZone';
        rightJoystickZone.style.position = 'absolute';
        rightJoystickZone.style.bottom = '50px';
        rightJoystickZone.style.right = '50px';
        rightJoystickZone.style.width = '100px';
        rightJoystickZone.style.height = '100px';
        rightJoystickZone.style.zIndex = '1000';

        this.addPreventDefaultListeners(rightJoystickZone);

        document.body.appendChild(rightJoystickZone);
        this.rightJoystickZone = rightJoystickZone;

        return rightJoystickZone;
    }

    hideZones(): void {
        if (this.leftJoystickZone) this.leftJoystickZone.style.display = 'none';
        if (this.rightJoystickZone) this.rightJoystickZone.style.display = 'none';
    }

    showZones(): void {
        if (this.leftJoystickZone) this.leftJoystickZone.style.display = 'block';
        if (this.rightJoystickZone) this.rightJoystickZone.style.display = 'block';
    }

    /** Removes all event listeners from joystick zones. Call when tearing down touch controls. */
    destroy(): void {
        for (const { element, event, handler, options } of this.bindings) {
            element.removeEventListener(event, handler, options);
        }
        this.bindings.length = 0;
    }

    getLeftZone(): HTMLDivElement | null {
        return this.leftJoystickZone;
    }

    getRightZone(): HTMLDivElement | null {
        return this.rightJoystickZone;
    }
}
