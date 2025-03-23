# Solar System Asteroid Miner

A 3D space mining simulation game you can play directly in your browser.

**[► Play Now](https://matthew-kissinger.github.io/Asteroid-Miner/)**

## Overview

Navigate the cosmos in your mining vessel, extract valuable resources from asteroids, and trade them at the mothership to upgrade your ship. Explore multiple star systems, each with unique resources and challenges.

## How to Play

1. **Controls:**
   - **WASD**: Move forward, left, backward, right
   - **Mouse**: Look/aim
   - **Left Mouse Button**: Activate mining laser
   - **Right Mouse Button**: Fire weapons
   - **Shift**: Boost (faster movement, uses more fuel)
   - **Space**: Dock with mothership (when in range)
   - **M**: Toggle audio
   - **ESC**: Release mouse / Pause game
   - **Tab**: View controls

2. **Mining Resources:**
   - Approach asteroids and use your mining laser (left click)
   - Different resources have different values and mining times
   - Watch your cargo capacity as you mine

3. **Upgrading Your Ship:**
   - Return to the mothership and dock (press Space when near)
   - Sell resources for credits
   - Purchase upgrades to improve your ship's capabilities

4. **Exploring the Universe:**
   - Travel between star systems via the star map at the mothership
   - Each system has different resource distributions
   - Watch your fuel levels when planning longer journeys

## Features

### Mining & Resource Collection
- Mine three resource types: Iron, Gold, and Platinum
- Visual mining beam with progress indicator
- Resource-specific extraction rates
- Cargo management system

### Ship Management
- Fuel and shield monitoring
- Hull integrity tracking
- Cargo capacity limitations
- Multiple upgrade paths

### Cosmic Exploration
- Multiple star systems to discover
- Unique visual environment for each system
- Different resource distributions across systems
- Dynamic asteroid fields

### Trading & Upgrades
- Sell resources at the mothership
- Upgrade your ship's capabilities:
  - Mining laser efficiency
  - Cargo capacity
  - Engine power
  - Shield strength
  - Hull durability
  - Scanner range

### Combat System
- Defend yourself against space hazards
- Shield management
- Weapon system with defensive capabilities

### Mothership Features
- Resource trading interface
- Ship repair and refueling
- Upgrade shop
- Star map for navigation
- Blackjack mini-game

## Technical Requirements

- Modern web browser with WebGL support
- Keyboard and mouse
- Recommended: Dedicated graphics card for optimal performance

## Development

This game was developed as a learning project using Three.js and modern JavaScript. For detailed technical documentation about the game's architecture, please see the [architecture.md](architecture.md) file.

## Credits

Created by [Matthew Kissinger](https://github.com/matthew-kissinger)

# Skybox Generator

A web application for generating space skyboxes and planet textures using Google's Gemini AI. The application consists of a FastAPI backend and a JavaScript frontend.

## Architecture

- **Backend**: FastAPI application deployed on Heroku
- **Frontend**: Static HTML/JS/CSS application deployed on GitHub Pages
- **Authentication**: JWT-based authentication
- **Image Generation**: Google Gemini AI with prompt engineering

## Security Features

- JWT authentication with 1-hour token expiration
- Rate limiting for API endpoints
- In-memory token storage (no localStorage)
- CORS restriction to GitHub Pages domain
- Security headers (CSP, HSTS, etc.)
- HTTPS-only communication

## Backend Deployment (Heroku)

1. **Create a Heroku account and install the CLI**
   ```bash
   # Install Heroku CLI
   # For macOS
   brew tap heroku/brew && brew install heroku
   # For Ubuntu
   curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
   # For Windows: Download installer from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a new Heroku app**
   ```bash
   heroku create your-skybox-generator
   ```

4. **Set up environment variables**
   ```bash
   heroku config:set JWT_SECRET_KEY=your_secure_random_string
   heroku config:set GEMINI_API_KEY=your_gemini_api_key
   heroku config:set GITHUB_PAGES_URL=https://matthew-kissinger.github.io
   heroku config:set VALID_CLIENT_IDS=game_client
   ```

5. **Deploy the application**
   ```bash
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku main
   ```

6. **Verify deployment**
   ```bash
   heroku open
   ```

## Frontend Deployment (GitHub Pages)

1. **Create a GitHub repository**
   ```bash
   # Initialize repository (if not already done)
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create repository on GitHub and push
   git remote add origin https://github.com/yourusername/your-skybox-generator.git
   git branch -M main
   git push -u origin main
   ```

2. **Update the API URL in apiClient.js**
   Update the `getApiBaseUrl()` method to point to your Heroku app:
   ```javascript
   getApiBaseUrl() {
       // For local development
       if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
           return 'http://localhost:8001';
       }
       
       // For production
       return 'https://asteroid-miner-api.herokuapp.com';
   }
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Select "main" branch and "/" (root) folder
   - Click "Save"

4. **Verify deployment**
   - Your site is available at `https://matthew-kissinger.github.io/Asteroid-Miner/`

## Local Development

1. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create a .env file**
   ```
   JWT_SECRET_KEY=your_local_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   VALID_CLIENT_IDS=game_client
   ```

4. **Run the backend**
   ```bash
   uvicorn api_server:app --reload --port 8001
   ```

5. **Run the frontend**
   Serve the static files using a local server:
   ```bash
   # If you have Python installed
   python -m http.server 8000
   
   # If you have Node.js installed
   npx serve -s .
   ```

## Security Considerations

- The JWT secret key should be a strong, random string
- All API communication uses HTTPS
- Tokens are stored in memory, not localStorage
- Rate limiting prevents API abuse
- CORS restrictions prevent cross-site requests
- Security headers are set for all responses

## Troubleshooting

- **Token errors**: Check that JWT_SECRET_KEY is set correctly and matches on both environments
- **CORS errors**: Verify GITHUB_PAGES_URL matches your actual GitHub Pages URL
- **Rate limiting**: The API has rate limits to prevent abuse. Wait before making more requests
- **Gemini API errors**: Ensure your API key is valid and has access to Gemini 2.0 models


