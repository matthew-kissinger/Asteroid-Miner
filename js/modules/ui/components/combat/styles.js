// styles.js - CSS styles for combat UI elements

export const combatStyles = {
    /**
     * Apply styles to the main combat container
     * @param {HTMLElement} container Combat container element
     */
    applyCombatContainerStyles(container) {
        container.style.position = 'absolute';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.backgroundColor = 'rgba(6, 22, 31, 0.8)';
        container.style.padding = '15px';
        container.style.borderRadius = '10px';
        container.style.border = '1px solid #ff3030';
        container.style.boxShadow = '0 0 10px rgba(255, 48, 48, 0.5)';
    },

    /**
     * Apply styles to the combat title
     * @param {HTMLElement} title Title element
     */
    applyCombatTitleStyles(title) {
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        title.style.color = '#ff3030';
        title.style.textAlign = 'center';
        title.style.fontSize = '14px';
        title.style.letterSpacing = '1px';
        title.style.textTransform = 'uppercase';
    },

    /**
     * Apply styles to UI items
     * @param {HTMLElement} item UI item element
     */
    applyUIItemStyles(item) {
        item.style.marginBottom = '8px';
    },

    /**
     * Apply styles to UI labels
     * @param {HTMLElement} label Label element
     */
    applyUILabelStyles(label) {
        label.style.display = 'inline-block';
        label.style.width = '120px';
        label.style.color = '#ff3030';
    },

    /**
     * Apply styles to UI values
     * @param {HTMLElement} value Value element
     */
    applyUIValueStyles(value) {
        value.style.color = '#fff';
        value.style.fontWeight = 'bold';
    },

    /**
     * Apply styles to shield container
     * @param {HTMLElement} container Shield container element
     */
    applyShieldContainerStyles(container) {
        container.style.marginBottom = '15px';
    },

    /**
     * Apply styles to shield label
     * @param {HTMLElement} label Shield label element
     */
    applyShieldLabelStyles(label) {
        label.style.color = '#3399ff';
        label.style.marginBottom = '5px';
    },

    /**
     * Apply styles to progress bar containers
     * @param {HTMLElement} container Progress bar container
     */
    applyProgressBarContainerStyles(container) {
        container.style.width = '100%';
        container.style.height = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        container.style.borderRadius = '5px';
        container.style.overflow = 'hidden';
    },

    /**
     * Apply styles to shield bar container
     * @param {HTMLElement} container Shield bar container
     */
    applyShieldBarContainerStyles(container) {
        this.applyProgressBarContainerStyles(container);
        container.style.border = '1px solid #3399ff';
    },

    /**
     * Apply styles to shield bar
     * @param {HTMLElement} bar Shield bar element
     */
    applyShieldBarStyles(bar) {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#3399ff';
        bar.style.transition = 'width 0.3s';
    },

    /**
     * Apply styles to value displays
     * @param {HTMLElement} value Value display element
     */
    applyValueDisplayStyles(value) {
        value.style.textAlign = 'right';
        value.style.fontSize = '12px';
        value.style.marginTop = '2px';
    },

    /**
     * Apply styles to hull container
     * @param {HTMLElement} container Hull container element
     */
    applyHullContainerStyles(container) {
        container.style.marginBottom = '15px';
    },

    /**
     * Apply styles to hull label
     * @param {HTMLElement} label Hull label element
     */
    applyHullLabelStyles(label) {
        label.style.color = '#ff9900';
        label.style.marginBottom = '5px';
    },

    /**
     * Apply styles to hull bar container
     * @param {HTMLElement} container Hull bar container
     */
    applyHullBarContainerStyles(container) {
        this.applyProgressBarContainerStyles(container);
        container.style.border = '1px solid #ff9900';
    },

    /**
     * Apply styles to hull bar
     * @param {HTMLElement} bar Hull bar element
     */
    applyHullBarStyles(bar) {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#ff9900';
        bar.style.transition = 'width 0.3s';
    },

    /**
     * Apply styles to weapon container
     * @param {HTMLElement} container Weapon container element
     */
    applyWeaponContainerStyles(container) {
        container.style.marginBottom = '15px';
    },

    /**
     * Apply styles to weapon label
     * @param {HTMLElement} label Weapon label element
     */
    applyWeaponLabelStyles(label) {
        label.style.color = '#33ccff';
        label.style.marginBottom = '5px';
    },

    /**
     * Apply styles to weapon mode display
     * @param {HTMLElement} mode Weapon mode element
     */
    applyWeaponModeStyles(mode) {
        mode.style.marginBottom = '5px';
    },

    /**
     * Apply styles to weapon energy bar container
     * @param {HTMLElement} container Energy bar container
     */
    applyWeaponEnergyContainerStyles(container) {
        container.style.width = '100%';
        container.style.height = '8px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        container.style.border = '1px solid #33ccff';
        container.style.borderRadius = '5px';
        container.style.overflow = 'hidden';
    },

    /**
     * Apply styles to weapon energy bar
     * @param {HTMLElement} bar Energy bar element
     */
    applyWeaponEnergyBarStyles(bar) {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#33ccff';
        bar.style.transition = 'width 0.1s';
    },

    /**
     * Apply styles to target container
     * @param {HTMLElement} container Target container element
     */
    applyTargetContainerStyles(container) {
        container.style.marginBottom = '15px';
        container.style.padding = '8px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        container.style.borderRadius = '5px';
        container.style.border = '1px solid rgba(255, 128, 0, 0.5)';
    },

    /**
     * Apply styles to target header
     * @param {HTMLElement} header Target header element
     */
    applyTargetHeaderStyles(header) {
        header.style.color = '#ff8000';
        header.style.fontSize = '12px';
        header.style.marginBottom = '5px';
    },

    /**
     * Apply styles to target info
     * @param {HTMLElement} info Target info element
     */
    applyTargetInfoStyles(info) {
        info.style.fontSize = '12px';
        info.style.color = '#cccccc';
        info.style.display = 'none';
    },

    /**
     * Apply styles to target health bar container
     * @param {HTMLElement} container Target health container
     */
    applyTargetHealthContainerStyles(container) {
        container.style.width = '100%';
        container.style.height = '8px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        container.style.border = '1px solid #ff5500';
        container.style.borderRadius = '4px';
        container.style.overflow = 'hidden';
        container.style.marginTop = '5px';
        container.style.display = 'none';
    },

    /**
     * Apply styles to target health bar
     * @param {HTMLElement} bar Target health bar element
     */
    applyTargetHealthBarStyles(bar) {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#ff5500';
        bar.style.transition = 'width 0.3s';
    },

    /**
     * Apply styles to target shield container
     * @param {HTMLElement} container Target shield container
     */
    applyTargetShieldContainerStyles(container) {
        container.style.width = '100%';
        container.style.height = '4px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        container.style.border = '1px solid #3399ff';
        container.style.borderRadius = '2px';
        container.style.overflow = 'hidden';
        container.style.marginTop = '3px';
        container.style.display = 'none';
    },

    /**
     * Apply styles to target shield bar
     * @param {HTMLElement} bar Target shield bar element
     */
    applyTargetShieldBarStyles(bar) {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#3399ff';
        bar.style.transition = 'width 0.3s';
    },

    /**
     * Apply styles to special weapons container
     * @param {HTMLElement} container Special weapons container
     */
    applySpecialContainerStyles(container) {
        container.style.marginBottom = '15px';
    },

    /**
     * Apply styles to special weapons header
     * @param {HTMLElement} header Special weapons header
     */
    applySpecialHeaderStyles(header) {
        header.style.color = '#33ccff';
        header.style.fontSize = '12px';
        header.style.marginBottom = '5px';
    },

    /**
     * Apply styles to special weapon items
     * @param {HTMLElement} item Special weapon item
     */
    applySpecialItemStyles(item) {
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.marginBottom = '6px';
    },

    /**
     * Apply styles to status indicators
     * @param {HTMLElement} indicator Status indicator element
     */
    applyStatusIndicatorStyles(indicator) {
        indicator.style.width = '10px';
        indicator.style.height = '10px';
        indicator.style.borderRadius = '50%';
        indicator.style.backgroundColor = '#555555';
        indicator.style.marginRight = '6px';
    },

    /**
     * Apply styles to special weapon names
     * @param {HTMLElement} name Name element
     * @param {string} color Text color
     */
    applySpecialNameStyles(name, color) {
        name.style.color = color;
        name.style.flex = '1';
        name.style.fontSize = '12px';
    },

    /**
     * Apply styles to cooldown displays
     * @param {HTMLElement} cooldown Cooldown element
     */
    applyCooldownStyles(cooldown) {
        cooldown.style.color = '#55ff55';
        cooldown.style.fontSize = '11px';
        cooldown.style.fontWeight = 'bold';
    },

    /**
     * Apply styles to stats container
     * @param {HTMLElement} container Stats container
     */
    applyStatsContainerStyles(container) {
        container.style.marginTop = '10px';
        container.style.borderTop = '1px solid rgba(255, 48, 48, 0.5)';
        container.style.paddingTop = '10px';
    },

    /**
     * Apply styles to stats title
     * @param {HTMLElement} title Stats title element
     */
    applyStatsTitleStyles(title) {
        title.style.color = '#ff3030';
        title.style.fontSize = '12px';
        title.style.marginBottom = '5px';
    },

    /**
     * Apply styles to stat items
     * @param {HTMLElement} item Stat item element
     */
    applyStatItemStyles(item) {
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.fontSize = '11px';
        item.style.marginBottom = '3px';
    },

    /**
     * Apply styles to stat labels
     * @param {HTMLElement} label Stat label element
     */
    applyStatLabelStyles(label) {
        label.style.color = '#aaaaaa';
    },

    /**
     * Apply styles to stat values
     * @param {HTMLElement} value Stat value element
     */
    applyStatValueStyles(value) {
        value.style.color = '#ffffff';
    },

    /**
     * Apply styles to controls hint
     * @param {HTMLElement} hint Controls hint element
     */
    applyControlsHintStyles(hint) {
        hint.style.fontSize = '11px';
        hint.style.color = '#cccccc';
        hint.style.marginTop = '10px';
    },

    /**
     * Apply styles to notification area
     * @param {HTMLElement} notification Notification area element
     */
    applyNotificationStyles(notification) {
        notification.style.position = 'absolute';
        notification.style.top = '100px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '8px';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = '#ff9900';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '1000';
        notification.style.display = 'none';
        notification.style.transition = 'opacity 0.5s';
    },

    /**
     * Apply styles to target HUD
     * @param {HTMLElement} targetHUD Target HUD element
     */
    applyTargetHUDStyles(targetHUD) {
        targetHUD.style.position = 'absolute';
        targetHUD.style.display = 'none';
        targetHUD.style.pointerEvents = 'none';
    },

    /**
     * Apply styles to target brackets
     * @param {HTMLElement} bracket Target bracket element
     * @param {number} index Bracket index (0-3 for corners)
     */
    applyTargetBracketStyles(bracket, index) {
        bracket.style.position = 'absolute';
        bracket.style.width = '12px';
        bracket.style.height = '12px';
        bracket.style.borderColor = '#ff3030';
        bracket.style.borderStyle = 'solid';
        bracket.style.borderWidth = '0';

        switch (index) {
            case 0: // Top left
                bracket.style.top = '0';
                bracket.style.left = '0';
                bracket.style.borderTopWidth = '2px';
                bracket.style.borderLeftWidth = '2px';
                break;
            case 1: // Top right
                bracket.style.top = '0';
                bracket.style.right = '0';
                bracket.style.borderTopWidth = '2px';
                bracket.style.borderRightWidth = '2px';
                break;
            case 2: // Bottom left
                bracket.style.bottom = '0';
                bracket.style.left = '0';
                bracket.style.borderBottomWidth = '2px';
                bracket.style.borderLeftWidth = '2px';
                break;
            case 3: // Bottom right
                bracket.style.bottom = '0';
                bracket.style.right = '0';
                bracket.style.borderBottomWidth = '2px';
                bracket.style.borderRightWidth = '2px';
                break;
        }
    },

    /**
     * Apply styles to target HUD label
     * @param {HTMLElement} label Target HUD label element
     */
    applyTargetHUDLabelStyles(label) {
        label.style.position = 'absolute';
        label.style.top = '100%';
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';
        label.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        label.style.color = '#ff3030';
        label.style.padding = '2px 6px';
        label.style.borderRadius = '3px';
        label.style.fontSize = '12px';
        label.style.whiteSpace = 'nowrap';
        label.style.marginTop = '5px';
    },

    /**
     * Apply styles to target HUD health container
     * @param {HTMLElement} container Health container element
     */
    applyTargetHUDHealthContainerStyles(container) {
        container.style.position = 'absolute';
        container.style.bottom = '100%';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '4px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        container.style.marginBottom = '3px';
    },

    /**
     * Apply styles to target HUD health bar
     * @param {HTMLElement} bar Health bar element
     */
    applyTargetHUDHealthBarStyles(bar) {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#ff3030';
    }
};