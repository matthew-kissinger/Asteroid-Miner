// eventHandlers.js - Event handling and MessageBus subscriptions

export class EventHandlers {
    constructor() {
        this.tradingView = null;
        this.isMobile = false;
    }
    
    setTradingView(tradingView) {
        this.tradingView = tradingView;
    }
    
    setMobile(isMobile) {
        this.isMobile = isMobile;
    }
    
    setupOrbSellHandlers(updateUICallback) {
        // Energy orb sell handlers
        document.getElementById('sell-orb-common').addEventListener('click', () => {
            if (this.tradingView && this.tradingView.sellEnergyOrb('common')) {
                updateUICallback();
            }
        });
        
        document.getElementById('sell-orb-uncommon').addEventListener('click', () => {
            if (this.tradingView && this.tradingView.sellEnergyOrb('uncommon')) {
                updateUICallback();
            }
        });
        
        document.getElementById('sell-orb-rare').addEventListener('click', () => {
            if (this.tradingView && this.tradingView.sellEnergyOrb('rare')) {
                updateUICallback();
            }
        });
        
        document.getElementById('sell-orb-epic').addEventListener('click', () => {
            if (this.tradingView && this.tradingView.sellEnergyOrb('epic')) {
                updateUICallback();
            }
        });
        
        document.getElementById('sell-orb-legendary').addEventListener('click', () => {
            if (this.tradingView && this.tradingView.sellEnergyOrb('legendary')) {
                updateUICallback();
            }
        });
    }
    
    setupLaserPurchaseHandler(updateUICallback) {
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
    setupTouchEvents() {
        if (!this.isMobile) return;
        
        const stargateUI = document.getElementById('stargate-ui');
        if (!stargateUI) return;
        
        console.log("Setting up touch events for stargate UI");
        
        // Make sure the undock button has proper touch handling
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            undockBtn.style.touchAction = 'manipulation';
            undockBtn.style.webkitTapHighlightColor = 'transparent';
            undockBtn.style.position = 'relative';
            undockBtn.style.zIndex = '9999';
            
            // Ensure proper touch handling
            undockBtn.addEventListener('touchstart', (e) => {
                console.log("Touch start on undock button");
                // Change appearance to show it's being touched
                undockBtn.style.backgroundColor = '#1b88db';
                undockBtn.style.transform = 'scale(0.98)';
                // Prevent any default behavior that might interfere
                e.stopPropagation();
            }, { passive: false });
            
            undockBtn.addEventListener('touchend', (e) => {
                console.log("Touch end on undock button");
                // Reset appearance
                undockBtn.style.backgroundColor = '#33aaff';
                undockBtn.style.transform = 'scale(1)';
                // Prevent any default behavior that might interfere
                e.stopPropagation();
            }, { passive: false });
        }
        
        // Prevent default touchmove on body but allow scrolling within the stargate UI
        stargateUI.addEventListener('touchmove', (e) => {
            // Allow the default scroll behavior within the stargate UI
            e.stopPropagation();
        }, { passive: true });
        
        // Fix for iOS scrolling issues - only prevent at the top, not at the bottom
        stargateUI.addEventListener('touchstart', (e) => {
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
                button.addEventListener('touchend', (e) => {
                    // Prevent rapid multiple touches
                    e.preventDefault();
                    
                    // Simulate a click event
                    button.click();
                });
            });
        }
        
        // Improve touch experience for all buttons in the stargate UI
        const allButtons = stargateUI.querySelectorAll('button');
        allButtons.forEach(button => {
            if (button !== undockBtn) { // We already handled the undock button specially
                button.style.touchAction = 'manipulation';
                button.style.webkitTapHighlightColor = 'transparent';
                
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