// styles.ts - CSS class application for combat UI elements
// Static styles are defined in src/styles/combat.css
// This module applies CSS classes instead of inline styles.

const BRACKET_CLASSES = [
    'combat-target-bracket--tl',
    'combat-target-bracket--tr',
    'combat-target-bracket--bl',
    'combat-target-bracket--br',
] as const;

export const combatStyles = {
    /**
     * Apply styles to the main combat container
     */
    applyCombatContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-container');
    },

    /**
     * Apply styles to the combat title
     */
    applyCombatTitleStyles(title: HTMLElement): void {
        title.classList.add('combat-title');
    },

    /**
     * Apply styles to UI items
     */
    applyUIItemStyles(item: HTMLElement): void {
        item.classList.add('combat-ui-item');
    },

    /**
     * Apply styles to UI labels
     */
    applyUILabelStyles(label: HTMLElement): void {
        label.classList.add('combat-ui-label');
    },

    /**
     * Apply styles to UI values
     */
    applyUIValueStyles(value: HTMLElement): void {
        value.classList.add('combat-ui-value');
    },

    /**
     * Apply styles to shield container
     */
    applyShieldContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-shield-container');
    },

    /**
     * Apply styles to shield label
     */
    applyShieldLabelStyles(label: HTMLElement): void {
        label.classList.add('combat-shield-label');
    },

    /**
     * Apply styles to progress bar containers
     */
    applyProgressBarContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-progress-bar');
    },

    /**
     * Apply styles to shield bar container
     */
    applyShieldBarContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-shield-bar-container');
    },

    /**
     * Apply styles to shield bar
     */
    applyShieldBarStyles(bar: HTMLElement): void {
        bar.classList.add('combat-shield-bar');
    },

    /**
     * Apply styles to value displays
     */
    applyValueDisplayStyles(value: HTMLElement): void {
        value.classList.add('combat-value-display');
    },

    /**
     * Apply styles to hull container
     */
    applyHullContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-hull-container');
    },

    /**
     * Apply styles to hull label
     */
    applyHullLabelStyles(label: HTMLElement): void {
        label.classList.add('combat-hull-label');
    },

    /**
     * Apply styles to hull bar container
     */
    applyHullBarContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-hull-bar-container');
    },

    /**
     * Apply styles to hull bar
     */
    applyHullBarStyles(bar: HTMLElement): void {
        bar.classList.add('combat-hull-bar');
    },

    /**
     * Apply styles to weapon container
     */
    applyWeaponContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-weapon-container');
    },

    /**
     * Apply styles to weapon label
     */
    applyWeaponLabelStyles(label: HTMLElement): void {
        label.classList.add('combat-weapon-label');
    },

    /**
     * Apply styles to weapon mode display
     */
    applyWeaponModeStyles(mode: HTMLElement): void {
        mode.classList.add('combat-weapon-mode');
    },

    /**
     * Apply styles to weapon energy bar container
     */
    applyWeaponEnergyContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-weapon-energy-container');
    },

    /**
     * Apply styles to weapon energy bar
     */
    applyWeaponEnergyBarStyles(bar: HTMLElement): void {
        bar.classList.add('combat-weapon-energy-bar');
    },

    /**
     * Apply styles to target container
     */
    applyTargetContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-target-container');
    },

    /**
     * Apply styles to target header
     */
    applyTargetHeaderStyles(header: HTMLElement): void {
        header.classList.add('combat-target-header');
    },

    /**
     * Apply styles to target info
     */
    applyTargetInfoStyles(info: HTMLElement): void {
        info.classList.add('combat-target-info');
    },

    /**
     * Apply styles to target health bar container
     */
    applyTargetHealthContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-target-health-container');
    },

    /**
     * Apply styles to target health bar
     */
    applyTargetHealthBarStyles(bar: HTMLElement): void {
        bar.classList.add('combat-target-health-bar');
    },

    /**
     * Apply styles to target shield container
     */
    applyTargetShieldContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-target-shield-container');
    },

    /**
     * Apply styles to target shield bar
     */
    applyTargetShieldBarStyles(bar: HTMLElement): void {
        bar.classList.add('combat-target-shield-bar');
    },

    /**
     * Apply styles to special weapons container
     */
    applySpecialContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-special-container');
    },

    /**
     * Apply styles to special weapons header
     */
    applySpecialHeaderStyles(header: HTMLElement): void {
        header.classList.add('combat-special-header');
    },

    /**
     * Apply styles to special weapon items
     */
    applySpecialItemStyles(item: HTMLElement): void {
        item.classList.add('combat-special-item');
    },

    /**
     * Apply styles to status indicators
     */
    applyStatusIndicatorStyles(indicator: HTMLElement): void {
        indicator.classList.add('combat-status-indicator');
    },

    /**
     * Apply styles to special weapon names
     * @param name Name element
     * @param color Text color (dynamic per weapon type)
     */
    applySpecialNameStyles(name: HTMLElement, color: string): void {
        name.classList.add('combat-special-name');
        name.style.color = color;
    },

    /**
     * Apply styles to cooldown displays
     */
    applyCooldownStyles(cooldown: HTMLElement): void {
        cooldown.classList.add('combat-cooldown');
    },

    /**
     * Apply styles to stats container
     */
    applyStatsContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-stats-container');
    },

    /**
     * Apply styles to stats title
     */
    applyStatsTitleStyles(title: HTMLElement): void {
        title.classList.add('combat-stats-title');
    },

    /**
     * Apply styles to stat items
     */
    applyStatItemStyles(item: HTMLElement): void {
        item.classList.add('combat-stat-item');
    },

    /**
     * Apply styles to stat labels
     */
    applyStatLabelStyles(label: HTMLElement): void {
        label.classList.add('combat-stat-label');
    },

    /**
     * Apply styles to stat values
     */
    applyStatValueStyles(value: HTMLElement): void {
        value.classList.add('combat-stat-value');
    },

    /**
     * Apply styles to controls hint
     */
    applyControlsHintStyles(hint: HTMLElement): void {
        hint.classList.add('combat-controls-hint');
    },

    /**
     * Apply styles to notification area
     */
    applyNotificationStyles(notification: HTMLElement): void {
        notification.classList.add('combat-notification');
    },

    /**
     * Apply styles to target HUD
     */
    applyTargetHUDStyles(targetHUD: HTMLElement): void {
        targetHUD.classList.add('combat-target-hud');
    },

    /**
     * Apply styles to target brackets
     * @param bracket Target bracket element
     * @param index Bracket index (0-3 for corners)
     */
    applyTargetBracketStyles(bracket: HTMLElement, index: number): void {
        bracket.classList.add('combat-target-bracket');
        if (index >= 0 && index < BRACKET_CLASSES.length) {
            bracket.classList.add(BRACKET_CLASSES[index]);
        }
    },

    /**
     * Apply styles to target HUD label
     */
    applyTargetHUDLabelStyles(label: HTMLElement): void {
        label.classList.add('combat-target-hud-label');
    },

    /**
     * Apply styles to target HUD health container
     */
    applyTargetHUDHealthContainerStyles(container: HTMLElement): void {
        container.classList.add('combat-target-hud-health-container');
    },

    /**
     * Apply styles to target HUD health bar
     */
    applyTargetHUDHealthBarStyles(bar: HTMLElement): void {
        bar.classList.add('combat-target-hud-health-bar');
    }
};
