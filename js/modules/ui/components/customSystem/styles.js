// styles.js - CSS styles for the custom system creator

export class StyleManager {
    constructor(isMobile = false) {
        this.isMobile = isMobile;
        this.stylesInjected = false;
    }

    injectStyles() {
        if (this.stylesInjected) return;

        this.injectBaseStyles();
        
        if (this.isMobile) {
            this.injectMobileStyles();
        }

        this.stylesInjected = true;
    }

    injectBaseStyles() {
        if (!document.getElementById('custom-system-creator-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-system-creator-styles';
            style.textContent = `
                .property-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .property-row label {
                    flex: 0 0 150px;
                    margin-right: 10px;
                }
                
                .property-row .slider {
                    flex: 1;
                    height: 10px;
                    background: #2a2a2a;
                    outline: none;
                    border-radius: 5px;
                }
                
                .property-row .slider-value {
                    flex: 0 0 60px;
                    margin-left: 10px;
                    text-align: right;
                }
                
                .planet-properties {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 10px;
                    margin-bottom: 15px;
                }
                
                .help-text {
                    font-size: 12px;
                    color: #aaa;
                    margin-top: 5px;
                }
                
                select.form-control {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    background: #25303e;
                    color: white;
                    border: 1px solid #3a5472;
                }
                
                /* Active slider styles */
                .slider-active {
                    background: #3a5472 !important;
                }
                
                /* Add smooth transitions */
                #custom-system-creator button {
                    transition: all 0.2s ease;
                }
                
                #custom-system-creator button:active {
                    transform: scale(0.95);
                }

                /* Modal open styles */
                .modal-open {
                    overflow: hidden;
                    position: fixed;
                    width: 100%;
                    height: 100%;
                }
            `;
            document.head.appendChild(style);
        }
    }

    injectMobileStyles() {
        if (!document.getElementById('custom-system-creator-mobile-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-system-creator-mobile-styles';
            style.innerHTML = `
                @media (max-width: 900px) {
                    /* Mobile-specific styles for CustomSystemCreator */
                    #custom-system-creator .modal-content {
                        border-radius: 10px;
                        padding-bottom: 120px;
                    }
                    
                    #custom-system-creator .form-group {
                        margin-bottom: 24px;
                    }
                    
                    #custom-system-creator label {
                        font-size: 16px;
                        margin-bottom: 10px;
                        display: block;
                    }
                    
                    #custom-system-creator .property-row {
                        flex-direction: column;
                        align-items: flex-start;
                        margin-bottom: 20px;
                    }
                    
                    #custom-system-creator .property-row label {
                        margin-bottom: 10px;
                        width: 100%;
                    }
                    
                    #custom-system-creator .slider {
                        width: 100%;
                        margin: 10px 0;
                    }
                    
                    #custom-system-creator .slider-value {
                        margin-top: 5px;
                        align-self: flex-end;
                    }
                    
                    #custom-system-creator .planet-input {
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    
                    #custom-system-creator input[type="text"],
                    #custom-system-creator textarea,
                    #custom-system-creator select {
                        font-size: 16px !important;
                        padding: 14px !important;
                    }
                    
                    #custom-system-creator .planet-preview {
                        flex: 0 0 100%;
                        margin-bottom: 15px;
                    }
                    
                    #custom-system-creator .form-actions {
                        text-align: center;
                    }
                    
                    /* Better slider for touch */
                    #custom-system-creator input[type="range"] {
                        -webkit-appearance: none;
                        height: 30px;
                        background: #0d1e2f;
                        border-radius: 15px;
                        padding: 0;
                        outline: none;
                    }
                    
                    #custom-system-creator input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: #4a9dff;
                        cursor: pointer;
                    }
                    
                    #custom-system-creator input[type="range"]::-moz-range-thumb {
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: #4a9dff;
                        cursor: pointer;
                        border: none;
                    }
                    
                    /* Touch ripple effect for buttons */
                    .ripple {
                        position: relative;
                        overflow: hidden;
                        transform: translate3d(0, 0, 0);
                    }
                    
                    .ripple:after {
                        content: "";
                        display: block;
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        top: 0;
                        left: 0;
                        pointer-events: none;
                        background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
                        background-repeat: no-repeat;
                        background-position: 50%;
                        transform: scale(10, 10);
                        opacity: 0;
                        transition: transform .5s, opacity 1s;
                    }
                    
                    .ripple:active:after {
                        transform: scale(0, 0);
                        opacity: .3;
                        transition: 0s;
                    }
                    
                    /* Character counter for text areas */
                    .char-counter {
                        font-size: 12px;
                        color: #aaa;
                        text-align: right;
                        margin-top: 5px;
                    }
                    
                    .char-counter.warning {
                        color: #ff9900;
                    }
                    
                    .char-counter.error {
                        color: #ff3030;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    getMobileStyles(type = '') {
        const styles = {
            modalContent: this.isMobile ? 'width: 94%; max-height: 85vh; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: 100px; overscroll-behavior: contain;' : '',
            closeBtn: this.isMobile ? 'font-size: 28px; padding: 12px; min-height: 48px; min-width: 48px;' : '',
            modalBody: this.isMobile ? 'padding-bottom: 150px;' : '',
            input: this.isMobile ? 'font-size: 16px; padding: 14px; height: 48px;' : '',
            textarea: this.isMobile ? 'font-size: 16px; padding: 14px;' : '',
            select: this.isMobile ? 'font-size: 16px; padding: 14px; height: 48px;' : '',
            slider: this.isMobile ? 'height: 30px; margin: 10px 0;' : '',
            checkbox: this.isMobile ? 'transform: scale(1.7); margin: 0 15px; min-height: 24px; min-width: 24px;' : '',
            checkboxRow: this.isMobile ? 'margin-top: 15px;' : '',
            primaryBtn: this.isMobile ? 'min-height: 54px; padding: 16px; font-size: 18px; margin-top: 20px; width: 100%;' : '',
            secondaryBtn: this.isMobile ? 'min-height: 50px; padding: 14px; font-size: 16px; width: 100%; margin: 15px 0;' : '',
            removeBtn: this.isMobile ? 'min-height: 50px; padding: 14px; font-size: 16px; right: 15px; top: 15px;' : '',
            previewContainer: this.isMobile ? 'flex-direction: column;' : '',
            skyboxPreview: this.isMobile ? 'width: 100%; margin-bottom: 20px;' : '',
            planetsPreview: this.isMobile ? 'width: 100%;' : '',
            formActions: this.isMobile ? 'padding-bottom: 30px;' : ''
        };

        return type ? styles[type] : styles;
    }

    getTextareaRows(defaultRows) {
        return this.isMobile ? Math.max(2, defaultRows - 1) : defaultRows;
    }

    cleanup() {
        const stylesToRemove = [
            'custom-system-creator-styles',
            'custom-system-creator-mobile-styles',
            'modal-open-style'
        ];

        stylesToRemove.forEach(id => {
            const style = document.getElementById(id);
            if (style) {
                style.remove();
            }
        });

        this.stylesInjected = false;
    }
}