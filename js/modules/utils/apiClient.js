// apiClient.js - Client for interacting with the skybox generation API

export class ApiClient {
    constructor() {
        // API configuration
        this.apiBaseUrl = this.getApiBaseUrl();
        
        // In-memory token storage (no localStorage)
        this.token = null;
        this.tokenExpiry = null;
        
        // Default client ID
        this.clientId = 'game_client';
        
        // For token refresh
        this.isRefreshing = false;
        this.refreshCallbacks = [];
        
        console.log(`API Client initialized with base URL: ${this.apiBaseUrl}`);
    }
    
    // Get base URL from environment or use default
    getApiBaseUrl() {
        // For local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8001';
        }
        
        // For production - Use the Heroku app URL
        return 'https://aminer-backend-b435530d633e.herokuapp.com';
    }
    
    // Check if token is valid and not expired
    hasValidToken() {
        if (!this.token || !this.tokenExpiry) {
            return false;
        }
        
        const expiryTime = new Date(this.tokenExpiry).getTime();
        const currentTime = new Date().getTime();
        
        // Consider token expired if less than 5 minutes remain
        const fiveMinutesInMs = 5 * 60 * 1000;
        return (expiryTime - currentTime) > fiveMinutesInMs;
    }
    
    // Clear token from memory
    clearToken() {
        this.token = null;
        this.tokenExpiry = null;
    }
    
    // Get a new token from the API
    async getToken() {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing) {
            return new Promise((resolve) => {
                this.refreshCallbacks.push((success) => resolve(success));
            });
        }
        
        this.isRefreshing = true;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ client_id: this.clientId })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || 'Failed to get token';
                console.error(`Token error (${response.status}): ${errorMessage}`);
                
                // Execute callbacks with failure
                this.refreshCallbacks.forEach(cb => cb(false));
                this.refreshCallbacks = [];
                this.isRefreshing = false;
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            // Save token in memory
            this.token = data.access_token;
            
            // Set expiry (tokens are valid for 1 hour)
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);
            this.tokenExpiry = expiryDate.toISOString();
            
            // Execute callbacks with success
            this.refreshCallbacks.forEach(cb => cb(true));
            this.refreshCallbacks = [];
            this.isRefreshing = false;
            
            return true;
        } catch (error) {
            console.error('Error getting token:', error);
            
            // Execute callbacks with failure
            this.refreshCallbacks.forEach(cb => cb(false));
            this.refreshCallbacks = [];
            this.isRefreshing = false;
            
            return false;
        }
    }
    
    // Handle API response errors
    async handleApiResponse(response) {
        if (response.status === 401) {
            // Token has expired or is invalid
            this.clearToken();
            
            // Try to get a new token and retry the request
            const success = await this.getToken();
            if (!success) {
                throw new Error('Authentication failed. Please reload the application.');
            }
            
            // Return false to indicate a retry is needed
            return false;
        }
        
        if (response.status === 429) {
            // Rate limit exceeded
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.detail || `Error: ${response.status} ${response.statusText}`);
        }
        
        // Return true to indicate success
        return true;
    }
    
    // Generate a skybox based on the system name and description
    async generateSkybox(systemName, description) {
        // Get a new token if current one is invalid
        if (!this.hasValidToken()) {
            const success = await this.getToken();
            if (!success) {
                throw new Error('Failed to authenticate with the API');
            }
        }
        
        // Make request to generate skybox
        const response = await fetch(`${this.apiBaseUrl}/generate-skybox`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                system_name: systemName,
                skybox_description: description
            })
        });
        
        // Handle response errors
        const isValid = await this.handleApiResponse(response);
        if (!isValid) {
            // Retry the request with the new token
            return this.generateSkybox(systemName, description);
        }
        
        return await response.json();
    }
    
    // Generate a planet texture based on the planet name and description
    async generatePlanet(planetName, description) {
        // Get a new token if current one is invalid
        if (!this.hasValidToken()) {
            const success = await this.getToken();
            if (!success) {
                throw new Error('Failed to authenticate with the API');
            }
        }
        
        // Make request to generate planet
        const response = await fetch(`${this.apiBaseUrl}/generate-planet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                planet_name: planetName,
                planet_description: description
            })
        });
        
        // Handle response errors
        const isValid = await this.handleApiResponse(response);
        if (!isValid) {
            // Retry the request with the new token
            return this.generatePlanet(planetName, description);
        }
        
        return await response.json();
    }
    
    // Convert a relative image path to a full URL
    getFullImageUrl(relativeUrl) {
        // If it's already a full URL, return as is
        if (relativeUrl.startsWith('http')) {
            return relativeUrl;
        }
        
        // Remove leading slash if present
        const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.substring(1) : relativeUrl;
        
        // Get the API base URL
        const baseUrl = this.apiBaseUrl;
        
        // Join with API base URL
        return `${baseUrl}/${cleanPath}`;
    }
} 