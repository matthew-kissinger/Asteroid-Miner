// bootstrap.js - DOM readiness and loading overlay management

export async function startGameMainModule() {
    try {
        // Create loading overlay - hide the black loading screen after initialization
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            // Add a small delay to ensure everything is properly loaded
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.transition = 'opacity 1s ease-in-out';
                setTimeout(() => {
                    if (loadingOverlay.parentNode) {
                        loadingOverlay.remove();
                    }
                }, 1000);
            }, 100);
        }

        if (window.DEBUG_MODE) console.log("Starting game main module...");

        // Initialize the game
        window.game = new (await import('../main.js')).Game();

        if (window.DEBUG_MODE) console.log("Game started successfully");
    } catch (error) {
        console.error("Error starting game:", error);
        
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '50%';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translate(-50%, -50%)';
        errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorMessage.style.color = '#ff3030';
        errorMessage.style.padding = '20px';
        errorMessage.style.borderRadius = '10px';
        errorMessage.style.border = '1px solid #ff3030';
        errorMessage.style.zIndex = '9999';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.fontFamily = 'Courier New, monospace';
        errorMessage.style.maxWidth = '80%';
        
        errorMessage.innerHTML = `
            <h2>Error Starting Game</h2>
            <p>${error.message}</p>
            <p>Check the console for more details (F12).</p>
            <p>You can try refreshing the page or clearing your browser cache.</p>
            <button id="reload-button" style="background: #ff3030; color: white; border: none; padding: 10px; margin-top: 20px; cursor: pointer;">Reload Page</button>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Add event listener to reload button
        document.getElementById('reload-button').addEventListener('click', () => {
            // Add cache-busting parameter to the URL
            const cacheBuster = Date.now();
            window.location.href = window.location.pathname + '?cache=' + cacheBuster;
        });
    }
}

export function initializeDOM(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        // DOM is already ready (e.g., module imported after DOMContentLoaded)
        callback();
    }
}