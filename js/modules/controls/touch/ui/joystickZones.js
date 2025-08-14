// joystickZones.js - Joystick UI zone creation and management

export class JoystickZones {
    constructor() {
        this.leftJoystickZone = null;
        this.rightJoystickZone = null;
    }

    createJoystickZones() {
        this.createLeftJoystickZone();
        this.createRightJoystickZone();
        return {
            leftZone: this.leftJoystickZone,
            rightZone: this.rightJoystickZone
        };
    }

    createLeftJoystickZone() {
        // Create left joystick zone (thrust control)
        const leftJoystickZone = document.createElement('div');
        leftJoystickZone.id = 'leftJoystickZone';
        leftJoystickZone.style.position = 'absolute';
        leftJoystickZone.style.bottom = '50px';
        leftJoystickZone.style.left = '50px';
        leftJoystickZone.style.width = '100px';
        leftJoystickZone.style.height = '100px';
        leftJoystickZone.style.zIndex = '1000';
        
        // Prevent default browser behavior to avoid scrolling when using joysticks
        leftJoystickZone.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        leftJoystickZone.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        leftJoystickZone.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
        
        document.body.appendChild(leftJoystickZone);
        this.leftJoystickZone = leftJoystickZone;
        
        return leftJoystickZone;
    }

    createRightJoystickZone() {
        // Create right joystick zone (rotation control)
        const rightJoystickZone = document.createElement('div');
        rightJoystickZone.id = 'rightJoystickZone';
        rightJoystickZone.style.position = 'absolute';
        rightJoystickZone.style.bottom = '50px';
        rightJoystickZone.style.right = '50px';
        rightJoystickZone.style.width = '100px';
        rightJoystickZone.style.height = '100px';
        rightJoystickZone.style.zIndex = '1000';
        
        // Prevent default browser behavior to avoid scrolling when using joysticks
        rightJoystickZone.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        rightJoystickZone.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        rightJoystickZone.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
        
        document.body.appendChild(rightJoystickZone);
        this.rightJoystickZone = rightJoystickZone;
        
        return rightJoystickZone;
    }

    hideZones() {
        if (this.leftJoystickZone) this.leftJoystickZone.style.display = 'none';
        if (this.rightJoystickZone) this.rightJoystickZone.style.display = 'none';
    }

    showZones() {
        if (this.leftJoystickZone) this.leftJoystickZone.style.display = 'block';
        if (this.rightJoystickZone) this.rightJoystickZone.style.display = 'block';
    }

    getLeftZone() {
        return this.leftJoystickZone;
    }

    getRightZone() {
        return this.rightJoystickZone;
    }
}