export class MobileDetector {
  static isMobile(): boolean;
  static resetCache(): void;
  static hasTouch(): boolean;
  static getOrientation(): 'portrait' | 'landscape';
  static addOrientationChangeHandler(handler: (orientation: 'portrait' | 'landscape') => void): void;
}
