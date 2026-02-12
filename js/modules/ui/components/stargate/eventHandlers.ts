// eventHandlers.ts - Event handling and MessageBus subscriptions

interface Binding {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: AddEventListenerOptions;
}

interface TradingView {
    sellEnergyOrb(rarity: string): boolean;
    purchaseLaserTurret(): void;
}

export class EventHandlers {
    private tradingView: TradingView | null;
    private isMobile: boolean;
    private bindings: Binding[] = [];
    private touchBindings: Binding[] = [];

    constructor() {
        this.tradingView = null;
        this.isMobile = false;
    }

    setTradingView(tradingView: TradingView): void {
        this.tradingView = tradingView;
    }

    setMobile(isMobile: boolean): void {
        this.isMobile = isMobile;
    }

    private addBinding(
        list: Binding[],
        element: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions
    ): void {
        element.addEventListener(event, handler, options);
        list.push({ element, event, handler, options });
    }

    private removeBindings(list: Binding[]): void {
        for (const { element, event, handler, options } of list) {
            element.removeEventListener(event, handler, options);
        }
        list.length = 0;
    }

    setupOrbSellHandlers(updateUICallback: () => void): void {
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
        for (const rarity of rarities) {
            const el = document.getElementById(`sell-orb-${rarity}`);
            if (el) {
                const handler = (): void => {
                    if (this.tradingView && this.tradingView.sellEnergyOrb(rarity)) {
                        updateUICallback();
                    }
                };
                this.addBinding(this.bindings, el, 'click', handler);
            }
        }
    }

    setupLaserPurchaseHandler(updateUICallback: () => void): void {
        const purchaseLaserBtn = document.getElementById('purchase-laser');
        if (purchaseLaserBtn) {
            const handler = (): void => {
                if (this.tradingView) {
                    this.tradingView.purchaseLaserTurret();
                    updateUICallback();
                }
            };
            this.addBinding(this.bindings, purchaseLaserBtn, 'click', handler);
        }
    }

    setupTouchEvents(): void {
        if (!this.isMobile) return;

        const stargateUI = document.getElementById('stargate-ui');
        if (!stargateUI) return;

        console.log("Setting up touch events for stargate UI");

        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            undockBtn.style.touchAction = 'manipulation';
            (undockBtn.style as any).webkitTapHighlightColor = 'transparent';
            undockBtn.style.position = 'relative';
            undockBtn.style.zIndex = '9999';

            const onUndockTouchStart = (e: TouchEvent): void => {
                console.log("Touch start on undock button");
                undockBtn.style.backgroundColor = '#1b88db';
                undockBtn.style.transform = 'scale(0.98)';
                e.stopPropagation();
            };
            const onUndockTouchEnd = (e: TouchEvent): void => {
                console.log("Touch end on undock button");
                undockBtn.style.backgroundColor = '#33aaff';
                undockBtn.style.transform = 'scale(1)';
                e.stopPropagation();
            };
            this.addBinding(this.touchBindings, undockBtn, 'touchstart', onUndockTouchStart as EventListener, { passive: false });
            this.addBinding(this.touchBindings, undockBtn, 'touchend', onUndockTouchEnd as EventListener, { passive: false });
        }

        const onStargateTouchMove = (e: TouchEvent): void => {
            e.stopPropagation();
        };
        this.addBinding(this.touchBindings, stargateUI, 'touchmove', onStargateTouchMove as EventListener, { passive: true });

        const onStargateTouchStart = (e: TouchEvent): void => {
            const scrollTop = stargateUI.scrollTop;
            if (scrollTop <= 0 && e.touches[0].screenY < e.touches[0].clientY) {
                e.preventDefault();
            }
        };
        this.addBinding(this.touchBindings, stargateUI, 'touchstart', onStargateTouchStart as EventListener, { passive: false });

        const tabButtons = stargateUI.querySelectorAll('.tablinks');
        if (tabButtons.length > 0) {
            tabButtons.forEach(button => {
                const onTabTouchEnd = (e: TouchEvent): void => {
                    e.preventDefault();
                    (button as HTMLElement).click();
                };
                this.addBinding(this.touchBindings, button, 'touchend', onTabTouchEnd as EventListener);
            });
        }

        const allButtons = stargateUI.querySelectorAll('button');
        allButtons.forEach(button => {
            if (button !== undockBtn) {
                button.style.touchAction = 'manipulation';
                (button.style as any).webkitTapHighlightColor = 'transparent';

                const onBtnTouchStart = (): void => {
                    button.style.transform = 'scale(0.98)';
                };
                const onBtnTouchEnd = (): void => {
                    button.style.transform = 'scale(1)';
                };
                this.addBinding(this.touchBindings, button, 'touchstart', onBtnTouchStart, { passive: true });
                this.addBinding(this.touchBindings, button, 'touchend', onBtnTouchEnd, { passive: true });
            }
        });
    }

    /** Removes only touch event listeners (call when hiding stargate UI to avoid duplicates on next show). */
    destroyTouchEvents(): void {
        this.removeBindings(this.touchBindings);
    }

    /** Removes all event listeners. Call when tearing down the stargate UI. */
    destroy(): void {
        this.removeBindings(this.touchBindings);
        this.removeBindings(this.bindings);
    }
}
