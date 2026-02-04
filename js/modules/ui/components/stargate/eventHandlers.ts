// eventHandlers.ts - Event handling and MessageBus subscriptions

interface TradingView {
    sellEnergyOrb(rarity: string): boolean;
    purchaseLaserTurret(): void;
}

export class EventHandlers {
    private tradingView: TradingView | null;
    private isMobile: boolean;
    
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
    
    setupOrbSellHandlers(updateUICallback: () => void): void {
        // Energy orb sell handlers
        const sellOrbCommon = document.getElementById('sell-orb-common');
        if (sellOrbCommon) {
            sellOrbCommon.addEventListener('click', () => {
                if (this.tradingView && this.tradingView.sellEnergyOrb('common')) {
                    updateUICallback();
                }
            });
        }
        
        const sellOrbUncommon = document.getElementById('sell-orb-uncommon');
        if (sellOrbUncommon) {
            sellOrbUncommon.addEventListener('click', () => {
                if (this.tradingView && this.tradingView.sellEnergyOrb('uncommon')) {
                    updateUICallback();
                }
            });
        }
        
        const sellOrbRare = document.getElementById('sell-orb-rare');
        if (sellOrbRare) {
            sellOrbRare.addEventListener('click', () => {
                if (this.tradingView && this.tradingView.sellEnergyOrb('rare')) {
                    updateUICallback();
                }
            });
        }
        
        const sellOrbEpic = document.getElementById('sell-orb-epic');
        if (sellOrbEpic) {
            sellOrbEpic.addEventListener('click', () => {
                if (this.tradingView && this.tradingView.sellEnergyOrb('epic')) {
                    updateUICallback();
                }
            });
        }
        
        const sellOrbLegendary = document.getElementById('sell-orb-legendary');
        if (sellOrbLegendary) {
            sellOrbLegendary.addEventListener('click', () => {
                if (this.tradingView && this.tradingView.sellEnergyOrb('legendary')) {
                    updateUICallback();
                }
            });
        }
    }
    
    setupLaserPurchaseHandler(updateUICallback: () => void): void {
        // Add handler for purchasing laser turrets
        const purchaseLaserBtn = document.getElementById('purchase-laser');
        if (purchaseLaserBtn) {
            purchaseLaserBtn.addEventListener('click', () => {
                if (this.tradingView) {
                    this.tradingView.purchaseLaserTurret();
                    updateUICallback();
                }
            });
        }
    }
    
    // Add a new method for setting up touch events
    setupTouchEvents(): void {
        if (!this.isMobile) return;
        
        const stargateUI = document.getElementById('stargate-ui');
        if (!stargateUI) return;
        
        console.log("Setting up touch events for stargate UI");
        
        // Make sure the undock button has proper touch handling
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            undockBtn.style.touchAction = 'manipulation';
            (undockBtn.style as any).webkitTapHighlightColor = 'transparent';
            undockBtn.style.position = 'relative';
            undockBtn.style.zIndex = '9999';
            
            // Ensure proper touch handling
            undockBtn.addEventListener('touchstart', (e: TouchEvent) => {
                console.log("Touch start on undock button");
                // Change appearance to show it's being touched
                undockBtn.style.backgroundColor = '#1b88db';
                undockBtn.style.transform = 'scale(0.98)';
                // Prevent any default behavior that might interfere
                e.stopPropagation();
            }, { passive: false });
            
            undockBtn.addEventListener('touchend', (e: TouchEvent) => {
                console.log("Touch end on undock button");
                // Reset appearance
                undockBtn.style.backgroundColor = '#33aaff';
                undockBtn.style.transform = 'scale(1)';
                // Prevent any default behavior that might interfere
                e.stopPropagation();
            }, { passive: false });
        }
        
        // Prevent default touchmove on body but allow scrolling within the stargate UI
        stargateUI.addEventListener('touchmove', (e: TouchEvent) => {
            // Allow the default scroll behavior within the stargate UI
            e.stopPropagation();
        }, { passive: true });
        
        // Fix for iOS scrolling issues - only prevent at the top, not at the bottom
        stargateUI.addEventListener('touchstart', (e: TouchEvent) => {
            // Only prevent pull-to-refresh at the top, don't interfere with bottom scrolling
            const scrollTop = stargateUI.scrollTop;
            
            if (scrollTop <= 0 && e.touches[0].screenY < e.touches[0].clientY) {
                e.preventDefault();
            }
            // Removed condition that was preventing scrolling at the bottom
        }, { passive: false });
        
        // Handle tabbed content for better touch experience
        const tabButtons = stargateUI.querySelectorAll('.tablinks');
        if (tabButtons.length > 0) {
            tabButtons.forEach(button => {
                button.addEventListener('touchend', ((e: TouchEvent) => {
                    // Prevent rapid multiple touches
                    e.preventDefault();

                    // Simulate a click event
                    (button as HTMLElement).click();
                }) as EventListener);
            });
        }
        
        // Improve touch experience for all buttons in the stargate UI
        const allButtons = stargateUI.querySelectorAll('button');
        allButtons.forEach(button => {
            if (button !== undockBtn) { // We already handled the undock button specially
                button.style.touchAction = 'manipulation';
                (button.style as any).webkitTapHighlightColor = 'transparent';
                
                // Provide visual feedback on touch
                button.addEventListener('touchstart', () => {
                    button.style.transform = 'scale(0.98)';
                }, { passive: true });
                
                button.addEventListener('touchend', () => {
                    button.style.transform = 'scale(1)';
                }, { passive: true });
            }
        });
    }
}
