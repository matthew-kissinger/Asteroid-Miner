/**
 * Blackjack Game Styles - CSS styling and visual theming
 */

type StyleMap = Record<string, string>;

export class BlackjackStyles {
    isMobile: boolean;

    constructor(isMobile: boolean = false) {
        this.isMobile = isMobile;
    }

    /**
     * Get main game UI styles
     */
    getGameUIStyles(): StyleMap {
        return {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: this.isMobile ? '95%' : '900px',
            maxWidth: this.isMobile ? '600px' : 'none',
            height: this.isMobile ? 'auto' : '650px',
            maxHeight: this.isMobile ? '85vh' : 'none',
            backgroundColor: 'rgba(6, 22, 31, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #33aaff',
            borderRadius: '15px',
            boxShadow: '0 0 30px rgba(51, 170, 255, 0.5)',
            padding: this.isMobile ? '15px' : '25px',
            zIndex: '1000',
            display: 'none',
            fontFamily: 'Courier New, monospace',
            color: '#fff',
            userSelect: 'none',
            overflowY: this.isMobile ? 'auto' : 'hidden'
        };
    }

    /**
     * Get mobile-specific styles
     */
    getMobileStyles(): StyleMap {
        if (!this.isMobile) return {};
        
        return {
            webkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
        };
    }

    /**
     * Get scanline effect styles
     */
    getScanlineStyles(): StyleMap {
        return {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)',
            backgroundSize: '100% 4px',
            pointerEvents: 'none',
            zIndex: '1001',
            opacity: '0.15'
        };
    }

    /**
     * Get header styles
     */
    getHeaderStyles(): StyleMap {
        return {
            textAlign: 'center',
            marginBottom: '20px',
            position: 'relative'
        };
    }

    /**
     * Get title styles
     */
    getTitleStyles(): StyleMap {
        return {
            color: '#30cfd0',
            textShadow: '0 0 10px rgba(48, 207, 208, 0.7)',
            margin: '0 0 5px 0',
            fontSize: this.isMobile ? '24px' : '32px'
        };
    }

    /**
     * Get subtitle styles
     */
    getSubtitleStyles(): StyleMap {
        return {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: this.isMobile ? '12px' : '14px',
            letterSpacing: '2px'
        };
    }

    /**
     * Get close button styles
     */
    getCloseButtonStyles(): StyleMap {
        const baseStyles: StyleMap = {
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#33aaff',
            fontSize: '32px',
            cursor: 'pointer',
            outline: 'none',
            padding: '0 10px',
            lineHeight: '1'
        };

        if (this.isMobile) {
            return {
                ...baseStyles,
                fontSize: '42px',
                padding: '5px 15px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 10px rgba(51, 170, 255, 0.5)',
                right: '5px',
                top: '5px'
            };
        }

        return baseStyles;
    }

    /**
     * Get game area styles
     */
    getGameAreaStyles(): StyleMap {
        return {
            display: 'flex',
            flexDirection: 'column',
            height: this.isMobile ? 'auto' : 'calc(100% - 80px)'
        };
    }

    /**
     * Get dealer/player area styles
     */
    getPlayerAreaStyles(): StyleMap {
        return {
            flex: '1',
            border: '1px solid rgba(51, 170, 255, 0.3)',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '15px',
            background: 'linear-gradient(to bottom, rgba(9, 30, 42, 0.4), rgba(9, 30, 42, 0.6))'
        };
    }

    /**
     * Get dealer area styles
     */
    getDealerAreaStyles(): StyleMap {
        return {
            ...this.getPlayerAreaStyles(),
            background: 'linear-gradient(to bottom, rgba(9, 30, 42, 0.6), rgba(9, 30, 42, 0.4))'
        };
    }

    /**
     * Get area header styles
     */
    getAreaHeaderStyles(): StyleMap {
        return {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px'
        };
    }

    /**
     * Get dealer title styles
     */
    getDealerTitleStyles(): StyleMap {
        return {
            color: '#33aaff',
            fontWeight: 'bold'
        };
    }

    /**
     * Get player title styles
     */
    getPlayerTitleStyles(): StyleMap {
        return {
            color: '#30cfd0',
            fontWeight: 'bold'
        };
    }

    /**
     * Get score display styles
     */
    getScoreStyles(isPlayer: boolean = false): StyleMap {
        return {
            color: '#fff',
            fontWeight: 'bold',
            backgroundColor: isPlayer ? 'rgba(48, 207, 208, 0.2)' : 'rgba(51, 170, 255, 0.2)',
            padding: '0 10px',
            borderRadius: '4px'
        };
    }

    /**
     * Get cards container styles
     */
    getCardsContainerStyles(): StyleMap {
        return {
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            height: this.isMobile ? 'auto' : '130px',
            minHeight: this.isMobile ? '120px' : '130px'
        };
    }

    /**
     * Get card element styles
     */
    getCardStyles(faceDown: boolean = false): StyleMap {
        return {
            width: this.isMobile ? '70px' : '100px',
            height: this.isMobile ? '105px' : '150px',
            fontSize: this.isMobile ? '80%' : '100%',
            backgroundColor: faceDown ? 'rgba(9, 30, 42, 0.8)' : 'rgba(15, 35, 50, 0.9)',
            border: faceDown ? 
                '2px solid rgba(51, 170, 255, 0.3)' : 
                '2px solid rgba(51, 170, 255, 0.7)',
            borderRadius: '10px',
            boxShadow: faceDown ?
                '0 0 5px rgba(51, 170, 255, 0.3)' :
                '0 0 10px rgba(51, 170, 255, 0.5)',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            transition: 'transform 0.3s ease'
        };
    }

    /**
     * Get card value styles
     */
    getCardValueStyles(position: 'top' | 'bottom' = 'top'): StyleMap {
        const baseStyles: StyleMap = {
            position: 'absolute',
            fontSize: this.isMobile ? '14px' : '20px',
            fontWeight: 'bold'
        };

        if (position === 'top') {
            return {
                ...baseStyles,
                top: '8px',
                left: '8px'
            };
        } else {
            return {
                ...baseStyles,
                bottom: '8px',
                right: '8px',
                transform: 'rotate(180deg)'
            };
        }
    }

    /**
     * Get card suit styles
     */
    getCardSuitStyles(position: 'top' | 'bottom' = 'top'): StyleMap {
        const baseStyles: StyleMap = {
            position: 'absolute',
            fontSize: this.isMobile ? '12px' : '16px'
        };

        if (position === 'top') {
            return {
                ...baseStyles,
                top: '8px',
                right: '8px'
            };
        } else {
            return {
                ...baseStyles,
                bottom: '8px',
                left: '8px',
                transform: 'rotate(180deg)'
            };
        }
    }

    /**
     * Get center symbol styles
     */
    getCenterSymbolStyles(): StyleMap {
        return {
            fontSize: this.isMobile ? '28px' : '40px',
            lineHeight: '1',
            opacity: '0.9'
        };
    }

    /**
     * Get card color based on suit
     */
    getCardColor(suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'): string {
        return ['hearts', 'diamonds'].includes(suit) ? '#e55c8a' : '#30cfd0';
    }

    /**
     * Get speech bubble styles
     */
    getSpeechBubbleStyles(): StyleMap {
        return {
            position: this.isMobile ? 'relative' : 'absolute',
            bottom: this.isMobile ? 'auto' : '15px',
            right: this.isMobile ? 'auto' : '15px',
            marginTop: this.isMobile ? '10px' : '0',
            backgroundColor: 'rgba(15, 40, 55, 0.9)',
            border: '1px solid #33aaff',
            borderRadius: '8px',
            padding: '10px 15px',
            maxWidth: this.isMobile ? '100%' : '300px',
            fontStyle: 'italic',
            color: '#fff',
            boxShadow: '0 0 10px rgba(51, 170, 255, 0.3)',
            display: 'none'
        };
    }

    /**
     * Get status area styles
     */
    getStatusAreaStyles(): StyleMap {
        return {
            height: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '15px'
        };
    }

    /**
     * Get game status styles
     */
    getGameStatusStyles(): StyleMap {
        return {
            padding: '8px 20px',
            borderRadius: '20px',
            backgroundColor: 'rgba(51, 170, 255, 0.2)',
            border: '1px solid rgba(51, 170, 255, 0.4)',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 'bold',
            letterSpacing: '1px',
            fontSize: this.isMobile ? '12px' : '14px',
            width: this.isMobile ? '100%' : 'auto'
        };
    }

    /**
     * Get controls area styles
     */
    getControlsAreaStyles(): StyleMap {
        return {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 'auto',
            flexDirection: this.isMobile ? 'column' : 'row',
            gap: this.isMobile ? '15px' : '0'
        };
    }

    /**
     * Get betting controls styles
     */
    getBettingControlsStyles(): StyleMap {
        return {
            display: 'flex',
            flexDirection: 'column',
            width: this.isMobile ? '100%' : '250px'
        };
    }

    /**
     * Get betting title styles
     */
    getBettingTitleStyles(): StyleMap {
        return {
            marginBottom: '10px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 'bold'
        };
    }

    /**
     * Get resource options styles
     */
    getResourceOptionsStyles(): StyleMap {
        return {
            display: 'flex',
            gap: '10px'
        };
    }

    /**
     * Get resource button styles
     */
    getResourceButtonStyles(color: string): StyleMap {
        return {
            flex: '1',
            padding: this.isMobile ? '10px 5px' : '8px 5px',
            backgroundColor: 'rgba(15, 40, 55, 0.8)',
            border: `1px solid ${color}`,
            borderRadius: '5px',
            color: '#fff',
            boxShadow: `0 0 10px rgba(${color.split('(')[1].split(')')[0]}, 0.3)`,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'background-color 0.2s, box-shadow 0.2s'
        };
    }

    /**
     * Get resource button hover styles
     */
    getResourceButtonHoverStyles(color: string): StyleMap {
        return {
            backgroundColor: 'rgba(25, 60, 80, 0.8)',
            boxShadow: `0 0 15px ${color}`
        };
    }

    /**
     * Get bet amount controls styles
     */
    getBetAmountControlsStyles(): StyleMap {
        return {
            display: 'flex',
            marginTop: '10px',
            gap: '10px'
        };
    }

    /**
     * Get bet amount display styles
     */
    getBetAmountDisplayStyles(): StyleMap {
        return {
            flex: '1',
            backgroundColor: 'rgba(15, 40, 55, 0.8)',
            border: '1px solid rgba(51, 170, 255, 0.5)',
            borderRadius: '5px',
            padding: '8px 10px',
            textAlign: 'center',
            fontWeight: 'bold'
        };
    }

    /**
     * Get control button styles
     */
    getControlButtonStyles(): StyleMap {
        return {
            width: this.isMobile ? '50px' : '40px',
            height: this.isMobile ? '40px' : 'auto',
            backgroundColor: 'rgba(15, 40, 55, 0.8)',
            border: '1px solid rgba(51, 170, 255, 0.5)',
            borderRadius: '5px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: this.isMobile ? '20px' : '16px'
        };
    }

    /**
     * Get control button hover styles
     */
    getControlButtonHoverStyles(): StyleMap {
        return {
            backgroundColor: 'rgba(25, 60, 80, 0.8)',
            boxShadow: '0 0 10px rgba(51, 170, 255, 0.3)'
        };
    }

    /**
     * Get game actions styles
     */
    getGameActionsStyles(): StyleMap {
        return {
            display: 'flex',
            gap: '15px',
            flexWrap: this.isMobile ? 'wrap' : 'nowrap',
            justifyContent: this.isMobile ? 'center' : 'flex-end',
            width: this.isMobile ? '100%' : 'auto'
        };
    }

    /**
     * Get action button styles
     */
    getActionButtonStyles(color: string): StyleMap {
        return {
            padding: this.isMobile ? '15px 20px' : '12px 18px',
            backgroundColor: 'rgba(15, 40, 55, 0.8)',
            border: `2px solid ${color}`,
            borderRadius: '5px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: `0 0 10px ${color}`,
            transition: 'all 0.2s',
            minWidth: this.isMobile ? '80px' : 'auto',
            flex: this.isMobile ? '1' : 'none'
        };
    }

    /**
     * Get action button hover styles
     */
    getActionButtonHoverStyles(color: string): StyleMap {
        return {
            backgroundColor: 'rgba(25, 60, 80, 0.8)',
            boxShadow: `0 0 15px ${color}`
        };
    }

    /**
     * Apply styles to an element
     */
    applyStyles(element: HTMLElement, styles: StyleMap): void {
        Object.assign(element.style, styles);
    }
}
