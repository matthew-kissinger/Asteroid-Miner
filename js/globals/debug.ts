export type DebugState = {
    enabled: boolean;
};

export const DEBUG_MODE: DebugState = {
    enabled: false
};

export function setDebugMode(enabled: boolean): void {
    DEBUG_MODE.enabled = enabled;
    (globalThis as { DEBUG_MODE?: boolean }).DEBUG_MODE = enabled;
}

export function toggleDebugMode(): boolean {
    setDebugMode(!DEBUG_MODE.enabled);
    return DEBUG_MODE.enabled;
}

export function isDebugMode(): boolean {
    return DEBUG_MODE.enabled;
}

export function debugLog(...args: unknown[]): void {
    if (DEBUG_MODE.enabled) {
        console.log(...args);
    }
}

export function debugWarn(...args: unknown[]): void {
    console.warn(...args);
}

export function debugError(...args: unknown[]): void {
    console.error(...args);
}
