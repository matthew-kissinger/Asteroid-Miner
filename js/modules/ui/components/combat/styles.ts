// styles.ts - CSS styles for combat UI elements

export const combatStyles = {
    /**
     * Apply styles to the main combat container
     * @param container Combat container element
     */
    applyCombatContainerStyles(container: HTMLElement): void {
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
     * @param title Title element
     */
    applyCombatTitleStyles(title: HTMLElement): void {
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
     * @param item UI item element
     */
    applyUIItemStyles(item: HTMLElement): void {
        item.style.marginBottom = '8px';
    },

    /**
     * Apply styles to UI labels
     * @param label Label element
     */
    applyUILabelStyles(label: HTMLElement): void {
        label.style.display = 'inline-block';
        label.style.width = '120px';
        label.style.color = '#ff3030';
    },

    /**
     * Apply styles to UI values
     * @param value Value element
     */
    applyUIValueStyles(value: HTMLElement): void {
        value.style.color = '#fff';
        value.style.fontWeight = 'bold';
    },

    /**
     * Apply styles to shield container
     * @param container Shield container element
     */
    applyShieldContainerStyles(container: HTMLElement): void {
        container.style.marginBottom = '15px';
    },

    /**
     * Apply styles to shield label
     * @param label Shield label element
     */
    applyShieldLabelStyles(label: HTMLElement): void {
        label.style.color = '#3399ff';
        label.style.marginBottom = '5px';
    },

    /**
     * Apply styles to progress bar containers
     * @param container Progress bar container
     */
    applyProgressBarContainerStyles(container: HTMLElement): void {
        container.style.width = '100%';
        container.style.height = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        container.style.borderRadius = '5px';
        container.style.overflow = 'hidden';
    },

    /**
     * Apply styles to shield bar container
     * @param container Shield bar container
     */
    applyShieldBarContainerStyles(container: HTMLElement): void {
        this.applyProgressBarContainerStyles(container);
        container.style.border = '1px solid #3399ff';
    },

    /**
     * Apply styles to shield bar
     * @param bar Shield bar element
     */
    applyShieldBarStyles(bar: HTMLElement): void {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#3399ff';
        bar.style.transition = 'width 0.3s';
    },

    /**
     * Apply styles to value displays
     * @param value Value display element
     */
    applyValueDisplayStyles(value: HTMLElement): void {
        value.style.textAlign = 'right';
        value.style.fontSize = '12px';
        value.style.marginTop = '2px';
    },

    /**
     * Apply styles to hull container
     * @param container Hull container element
     */
    applyHullContainerStyles(container: HTMLElement): void {
        container.style.marginBottom = '15px';
    },

    /**
     * Apply styles to hull label
     * @param label Hull label element
     */
    applyHullLabelStyles(label: HTMLElement): void {
        label.style.color = '#ff9900';
        label.style.marginBottom = '5px';
    },

    /**
     * Apply styles to hull bar container
     * @param container Hull bar container
     */
    applyHullBarContainerStyles(container: HTMLElement): void {
        this.applyProgressBarContainerStyles(container);
        container.style.border = '1px solid #ff9900';
    },

    /**
     * Apply styles to hull bar
     * @param bar Hull bar element
     */
    applyHullBarStyles(bar: HTMLElement): void {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#ff9900';
        bar.style.transition = 'width 0.3s';
    },

    /**
     * Apply styles to weapon container
     * @param container Weapon container element
     */
    applyWeaponContainerStyles(container: HTMLElement): void {
        container.style.marginBottom = '15px';
    },

    /**
     * Apply styles to weapon label
     * @param label Weapon label element
     */
    applyWeaponLabelStyles(label: HTMLElement): void {
        label.style.color = '#33ccff';
        label.style.marginBottom = '5px';
    },

    /**
     * Apply styles to weapon mode display
     * @param mode Weapon mode element
     */
    applyWeaponModeStyles(mode: HTMLElement): void {
        mode.style.marginBottom = '5px';
    },

    /**
     * Apply styles to weapon energy bar container
     * @param container Energy bar container
     */
    applyWeaponEnergyContainerStyles(container: HTMLElement): void {
        container.style.width = '100%';
        container.style.height = '8px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        container.style.border = '1px solid #33ccff';
        container.style.borderRadius = '5px';
        container.style.overflow = 'hidden';
    },

    /**
     * Apply styles to weapon energy bar
     * @param bar Energy bar element
     */
    applyWeaponEnergyBarStyles(bar: HTMLElement): void {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#33ccff';
        bar.style.transition = 'width 0.1s';
    },

    /**
     * Apply styles to target container
     * @param container Target container element
     */
    applyTargetContainerStyles(container: HTMLElement): void {
        container.style.marginBottom = '15px';
        container.style.padding = '8px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        container.style.borderRadius = '5px';
        container.style.border = '1px solid rgba(255, 128, 0, 0.5)';
    },

    /**
     * Apply styles to target header
     * @param header Target header element
     */
    applyTargetHeaderStyles(header: HTMLElement): void {
        header.style.color = '#ff8000';
        header.style.fontSize = '12px';
        header.style.marginBottom = '5px';
    },

    /**
     * Apply styles to target info
     * @param info Target info element
     */
    applyTargetInfoStyles(info: HTMLElement): void {
        info.style.fontSize = '12px';
        info.style.color = '#cccccc';
        info.style.display = 'none';
    },

    /**
     * Apply styles to target health bar container
     * @param container Target health container
     */
    applyTargetHealthContainerStyles(container: HTMLElement): void {
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
     * @param bar Target health bar element
     */
    applyTargetHealthBarStyles(bar: HTMLElement): void {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#ff5500';
        bar.style.transition = 'width 0.3s';
    },

    /**
     * Apply styles to target shield container
     * @param container Target shield container
     */
    applyTargetShieldContainerStyles(container: HTMLElement): void {
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
     * @param bar Target shield bar element
     */
    applyTargetShieldBarStyles(bar: HTMLElement): void {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#3399ff';
        bar.style.transition = 'width 0.3s';
    },

    /**
     * Apply styles to special weapons container
     * @param container Special weapons container
     */
    applySpecialContainerStyles(container: HTMLElement): void {
        container.style.marginBottom = '15px';
    },

    /**
     * Apply styles to special weapons header
     * @param header Special weapons header
     */
    applySpecialHeaderStyles(header: HTMLElement): void {
        header.style.color = '#33ccff';
        header.style.fontSize = '12px';
        header.style.marginBottom = '5px';
    },

    /**
     * Apply styles to special weapon items
     * @param item Special weapon item
     */
    applySpecialItemStyles(item: HTMLElement): void {
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.marginBottom = '6px';
    },

    /**
     * Apply styles to status indicators
     * @param indicator Status indicator element
     */
    applyStatusIndicatorStyles(indicator: HTMLElement): void {
        indicator.style.width = '10px';
        indicator.style.height = '10px';
        indicator.style.borderRadius = '50%';
        indicator.style.backgroundColor = '#555555';
        indicator.style.marginRight = '6px';
    },

    /**
     * Apply styles to special weapon names
     * @param name Name element
     * @param color Text color
     */
    applySpecialNameStyles(name: HTMLElement, color: string): void {
        name.style.color = color;
        name.style.flex = '1';
        name.style.fontSize = '12px';
    },

    /**
     * Apply styles to cooldown displays
     * @param cooldown Cooldown element
     */
    applyCooldownStyles(cooldown: HTMLElement): void {
        cooldown.style.color = '#55ff55';
        cooldown.style.fontSize = '11px';
        cooldown.style.fontWeight = 'bold';
    },

    /**
     * Apply styles to stats container
     * @param container Stats container
     */
    applyStatsContainerStyles(container: HTMLElement): void {
        container.style.marginTop = '10px';
        container.style.borderTop = '1px solid rgba(255, 48, 48, 0.5)';
        container.style.paddingTop = '10px';
    },

    /**
     * Apply styles to stats title
     * @param title Stats title element
     */
    applyStatsTitleStyles(title: HTMLElement): void {
        title.style.color = '#ff3030';
        title.style.fontSize = '12px';
        title.style.marginBottom = '5px';
    },

    /**
     * Apply styles to stat items
     * @param item Stat item element
     */
    applyStatItemStyles(item: HTMLElement): void {
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.fontSize = '11px';
        item.style.marginBottom = '3px';
    },

    /**
     * Apply styles to stat labels
     * @param label Stat label element
     */
    applyStatLabelStyles(label: HTMLElement): void {
        label.style.color = '#aaaaaa';
    },

    /**
     * Apply styles to stat values
     * @param value Stat value element
     */
    applyStatValueStyles(value: HTMLElement): void {
        value.style.color = '#ffffff';
    },

    /**
     * Apply styles to controls hint
     * @param hint Controls hint element
     */
    applyControlsHintStyles(hint: HTMLElement): void {
        hint.style.fontSize = '11px';
        hint.style.color = '#cccccc';
        hint.style.marginTop = '10px';
    },

    /**
     * Apply styles to notification area
     * @param notification Notification area element
     */
    applyNotificationStyles(notification: HTMLElement): void {
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
     * @param targetHUD Target HUD element
     */
    applyTargetHUDStyles(targetHUD: HTMLElement): void {
        targetHUD.style.position = 'absolute';
        targetHUD.style.display = 'none';
        targetHUD.style.pointerEvents = 'none';
    },

    /**
     * Apply styles to target brackets
     * @param bracket Target bracket element
     * @param index Bracket index (0-3 for corners)
     */
    applyTargetBracketStyles(bracket: HTMLElement, index: number): void {
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
     * @param label Target HUD label element
     */
    applyTargetHUDLabelStyles(label: HTMLElement): void {
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
     * @param container Health container element
     */
    applyTargetHUDHealthContainerStyles(container: HTMLElement): void {
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
     * @param bar Health bar element
     */
    applyTargetHUDHealthBarStyles(bar: HTMLElement): void {
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.backgroundColor = '#ff3030';
    }
};