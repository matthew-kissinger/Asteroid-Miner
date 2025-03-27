# Solar System Asteroid Miner

A 3D space mining simulation game you can play directly in your browser.

**[► Play Now](https://matthew-kissinger.github.io/Asteroid-Miner/)**

## Overview

Navigate the cosmos in your mining vessel, extract valuable resources from asteroids, and trade them at the mothership to upgrade your ship. Explore multiple star systems, each with unique resources and challenges.

## How to Play

1. **Controls:**
   - WASD: Ship movement
   - Mouse: Ship rotation
   - Click: Fire particle cannon
   - SHIFT: Boost
   - E: Target lock-on
   - TAB: Cycle targets
   - R: Toggle mining
   - Q: Dock with mothership

3. **Mining Resources:**
   - Approach asteroids and use your mining laser
   - Different resources have different values and mining times
   - Watch your cargo capacity as you mine

4. **Upgrading Your Ship:**
   - Return to the mothership and dock (press Space when near)
   - Sell resources for credits
   - Purchase upgrades to improve your ship's capabilities

5. **Exploring the Universe:**
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

