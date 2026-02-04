// Shared docking-related types to avoid duplicate interface names.

export type MessageBus = {
    publish: (event: string, data?: unknown) => void;
};

type VectorLike = {
    clone: () => unknown;
    distanceTo: (pos: unknown) => number;
};

export type ResourceInventory = {
    iron: number;
    gold: number;
    platinum: number;
    orbs?: {
        common: number;
        uncommon: number;
        rare: number;
        epic: number;
        legendary: number;
        [rarity: string]: number;
    };
    [key: string]: number | Record<string, number> | undefined;
};

export type DockingSpaceship = {
    isDocked: boolean;
    credits: number;
    fuelUpgradeCost: number;
    engineUpgradeCost: number;
    miningUpgradeCost: number;
    hullUpgradeCost: number;
    scannerUpgradeCost: number;
    miningEfficiency: number;
    refuel: () => number;
    repairShield: () => number;
    repairHull: () => number;
    upgradeFuelTank: () => void;
    upgradeEngine: () => void;
    upgradeMiningLaser: () => void;
    upgradeHull: () => void;
    upgradeScanner: () => void;
    dock: () => void;
    undock: () => unknown;
    mesh: {
        position: VectorLike;
    };
    undockLocation?: {
        set: (x: number, y: number, z: number) => void;
    };
    world?: {
        messageBus?: MessageBus;
    };
    shield: number;
    maxShield: number;
    hull: number;
    maxHull: number;
    syncValuesToHealthComponent: () => void;
};

export type DockingUI = {
    stargateInterface?: {
        showStargateUI?: () => void;
        updateStargateUI?: (spaceship: DockingSpaceship, resources: ResourceInventory | null) => void;
        hideStargateUI?: () => void;
        showDockingPrompt?: () => void;
        hideDockingPrompt?: () => void;
    };
    controls?: {
        miningSystem?: {
            miningSpeedByType: Record<string, number>;
        };
        isMobile?: boolean;
        touchControls?: {
            showDockButton?: () => void;
            hideDockButton?: () => void;
        };
    };
    stargate?: unknown;
    hideUI?: () => void;
    showUI?: () => void;
};

export type ProximitySpaceship = {
    isDocked: boolean;
    mesh?: {
        position: {
            distanceTo: (pos: unknown) => number;
        };
    };
};

export type ProximityStargate = {
    getPosition: () => unknown;
};

export type ProximityUI = {
    stargateInterface?: {
        showDockingPrompt?: () => void;
        hideDockingPrompt?: () => void;
    };
    controls?: {
        isMobile?: boolean;
        touchControls?: {
            showDockButton?: () => void;
            hideDockButton?: () => void;
        };
    };
};
