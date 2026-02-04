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
