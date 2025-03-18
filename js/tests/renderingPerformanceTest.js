/**
 * Rendering Performance Test
 * 
 * This file contains a simple test to demonstrate the performance advantages
 * of using instanced rendering compared to traditional rendering approaches.
 */

import { runRenderingPerformanceTest, setupOptimizedRendering, setupGameLoop } from '../examples/optimizedRenderingUsage.js';

// DOM Setup
let container, renderer, scene, camera;
let testResults, demoInstance;

// Initialize Three.js
function initThree() {
    // Create container
    container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    document.body.appendChild(container);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    
    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Create directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 10000
    );
    camera.position.set(0, 100, 300);
    camera.lookAt(0, 0, 0);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Create animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    
    animate();
}

// Run the performance test
function runTest(entityCount = 5000) {
    clearUI();
    
    console.log(`Running performance test with ${entityCount} entities...`);
    showMessage(`Running test with ${entityCount} entities...<br>Please wait...`);
    
    // Delay to allow UI to update
    setTimeout(() => {
        testResults = runRenderingPerformanceTest(scene, camera, entityCount);
        displayResults(testResults);
    }, 100);
}

// Show the interactive demo
function runDemo(asteroidCount = 1000) {
    clearUI();
    
    console.log(`Running demo with ${asteroidCount} asteroids...`);
    showMessage(`Starting demo with ${asteroidCount} asteroids...<br>Use WASD to move, QE for up/down, ZC to roll.`);
    
    // Delay to allow UI to update
    setTimeout(() => {
        // Clean up previous demo if exists
        if (demoInstance && typeof demoInstance === 'function') {
            demoInstance();
        }
        
        // Run new demo
        const demo = setupOptimizedRendering(scene, camera, asteroidCount);
        demoInstance = setupGameLoop(demo, container);
        
        // Add button to stop demo
        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop Demo';
        stopButton.style.position = 'absolute';
        stopButton.style.bottom = '10px';
        stopButton.style.right = '10px';
        stopButton.style.padding = '10px';
        stopButton.addEventListener('click', () => {
            demoInstance();
            demoInstance = null;
            container.removeChild(stopButton);
            createUI();
        });
        container.appendChild(stopButton);
    }, 100);
}

// UI Helpers
function clearUI() {
    // Remove existing UI elements
    const uiContainer = document.getElementById('ui-container');
    if (uiContainer) {
        document.body.removeChild(uiContainer);
    }
}

function createUI() {
    clearUI();
    
    // Create UI container
    const uiContainer = document.createElement('div');
    uiContainer.id = 'ui-container';
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '50%';
    uiContainer.style.left = '50%';
    uiContainer.style.transform = 'translate(-50%, -50%)';
    uiContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    uiContainer.style.padding = '20px';
    uiContainer.style.borderRadius = '10px';
    uiContainer.style.color = 'white';
    uiContainer.style.fontFamily = 'Arial, sans-serif';
    uiContainer.style.textAlign = 'center';
    document.body.appendChild(uiContainer);
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Rendering Performance Tests';
    title.style.marginTop = '0';
    uiContainer.appendChild(title);
    
    // Create description
    const description = document.createElement('p');
    description.textContent = 'Choose an option below to see the performance difference between standard rendering and instanced rendering.';
    uiContainer.appendChild(description);
    
    // Create test section
    const testSection = document.createElement('div');
    testSection.style.marginBottom = '20px';
    uiContainer.appendChild(testSection);
    
    const testTitle = document.createElement('h3');
    testTitle.textContent = 'Performance Tests';
    testSection.appendChild(testTitle);
    
    // Test buttons
    const testButtons = [
        { count: 1000, label: 'Test with 1,000 entities' },
        { count: 5000, label: 'Test with 5,000 entities' },
        { count: 10000, label: 'Test with 10,000 entities' }
    ];
    
    testButtons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.label;
        button.style.margin = '5px';
        button.style.padding = '8px 16px';
        button.addEventListener('click', () => runTest(btn.count));
        testSection.appendChild(button);
    });
    
    // Create demo section
    const demoSection = document.createElement('div');
    uiContainer.appendChild(demoSection);
    
    const demoTitle = document.createElement('h3');
    demoTitle.textContent = 'Interactive Demos';
    demoSection.appendChild(demoTitle);
    
    // Demo buttons
    const demoButtons = [
        { count: 500, label: 'Demo with 500 asteroids' },
        { count: 2000, label: 'Demo with 2,000 asteroids' },
        { count: 5000, label: 'Demo with 5,000 asteroids' }
    ];
    
    demoButtons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.label;
        button.style.margin = '5px';
        button.style.padding = '8px 16px';
        button.addEventListener('click', () => runDemo(btn.count));
        demoSection.appendChild(button);
    });
}

// Display a message
function showMessage(message) {
    clearUI();
    
    const messageContainer = document.createElement('div');
    messageContainer.id = 'ui-container';
    messageContainer.style.position = 'absolute';
    messageContainer.style.top = '50%';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translate(-50%, -50%)';
    messageContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    messageContainer.style.padding = '20px';
    messageContainer.style.borderRadius = '10px';
    messageContainer.style.color = 'white';
    messageContainer.style.fontFamily = 'Arial, sans-serif';
    messageContainer.style.textAlign = 'center';
    messageContainer.innerHTML = message;
    document.body.appendChild(messageContainer);
}

// Display test results
function displayResults(results) {
    clearUI();
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'ui-container';
    resultsContainer.style.position = 'absolute';
    resultsContainer.style.top = '50%';
    resultsContainer.style.left = '50%';
    resultsContainer.style.transform = 'translate(-50%, -50%)';
    resultsContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    resultsContainer.style.padding = '20px';
    resultsContainer.style.borderRadius = '10px';
    resultsContainer.style.color = 'white';
    resultsContainer.style.fontFamily = 'Arial, sans-serif';
    resultsContainer.style.maxWidth = '600px';
    resultsContainer.style.maxHeight = '80vh';
    resultsContainer.style.overflow = 'auto';
    document.body.appendChild(resultsContainer);
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = `Performance Test Results (${results.entityCount} entities)`;
    title.style.marginTop = '0';
    resultsContainer.appendChild(title);
    
    // Create table for results
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '20px';
    resultsContainer.appendChild(table);
    
    // Table header
    const thead = document.createElement('thead');
    table.appendChild(thead);
    
    const headerRow = document.createElement('tr');
    thead.appendChild(headerRow);
    
    ['Metric', 'Standard', 'Instanced', 'Improvement'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.padding = '8px';
        th.style.borderBottom = '1px solid #666';
        headerRow.appendChild(th);
    });
    
    // Table body
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    
    // Format and add each row
    const rows = [
        {
            metric: 'Creation Time',
            standard: results.standard.creationTime.toFixed(2) + ' ms',
            instanced: results.instanced.creationTime.toFixed(2) + ' ms',
            improvement: results.improvement.creationSpeedup.toFixed(2) + 'x faster'
        },
        {
            metric: 'Update Time (100 frames)',
            standard: results.standard.updateTime.toFixed(2) + ' ms',
            instanced: results.instanced.updateTime.toFixed(2) + ' ms',
            improvement: results.improvement.updateSpeedup.toFixed(2) + 'x faster'
        },
        {
            metric: 'Total Time',
            standard: results.standard.totalTime.toFixed(2) + ' ms',
            instanced: results.instanced.totalTime.toFixed(2) + ' ms',
            improvement: results.improvement.totalSpeedup.toFixed(2) + 'x faster'
        },
        {
            metric: 'Creation Time per Entity',
            standard: results.standard.creationTimePerEntity.toFixed(3) + ' ms',
            instanced: results.instanced.creationTimePerEntity.toFixed(3) + ' ms',
            improvement: results.improvement.creationSpeedup.toFixed(2) + 'x faster'
        },
        {
            metric: 'Update Time per Entity per Frame',
            standard: (results.standard.updateTimePerEntity * 1000).toFixed(3) + ' μs',
            instanced: (results.instanced.updateTimePerEntity * 1000).toFixed(3) + ' μs',
            improvement: results.improvement.updateSpeedup.toFixed(2) + 'x faster'
        }
    ];
    
    rows.forEach((row, i) => {
        const tr = document.createElement('tr');
        tr.style.backgroundColor = i % 2 === 0 ? 'rgba(50, 50, 50, 0.3)' : 'transparent';
        tbody.appendChild(tr);
        
        Object.values(row).forEach((text, j) => {
            const td = document.createElement('td');
            td.textContent = text;
            td.style.padding = '8px';
            td.style.textAlign = j === 0 ? 'left' : 'right';
            tr.appendChild(td);
        });
    });
    
    // Create chart
    const chartContainer = document.createElement('div');
    chartContainer.style.marginTop = '20px';
    chartContainer.style.marginBottom = '20px';
    chartContainer.style.height = '200px';
    resultsContainer.appendChild(chartContainer);
    
    // Use simple div-based chart
    const chart = document.createElement('div');
    chart.style.display = 'flex';
    chart.style.height = '100%';
    chart.style.alignItems = 'flex-end';
    chart.style.justifyContent = 'space-evenly';
    chart.style.padding = '0 10px';
    chartContainer.appendChild(chart);
    
    // Creation time bars
    const createStandardBar = createBar(
        'Standard Creation',
        results.standard.creationTime,
        Math.max(results.standard.creationTime, results.instanced.creationTime),
        'rgba(255, 99, 132, 0.8)'
    );
    chart.appendChild(createStandardBar);
    
    const createInstancedBar = createBar(
        'Instanced Creation',
        results.instanced.creationTime,
        Math.max(results.standard.creationTime, results.instanced.creationTime),
        'rgba(54, 162, 235, 0.8)'
    );
    chart.appendChild(createInstancedBar);
    
    // Update time bars
    const updateStandardBar = createBar(
        'Standard Update',
        results.standard.updateTime,
        Math.max(results.standard.updateTime, results.instanced.updateTime),
        'rgba(255, 159, 64, 0.8)'
    );
    chart.appendChild(updateStandardBar);
    
    const updateInstancedBar = createBar(
        'Instanced Update',
        results.instanced.updateTime,
        Math.max(results.standard.updateTime, results.instanced.updateTime),
        'rgba(75, 192, 192, 0.8)'
    );
    chart.appendChild(updateInstancedBar);
    
    // Add conclusion
    const conclusion = document.createElement('div');
    resultsContainer.appendChild(conclusion);
    
    const conclusionTitle = document.createElement('h3');
    conclusionTitle.textContent = 'Conclusion';
    conclusion.appendChild(conclusionTitle);
    
    const conclusionText = document.createElement('p');
    if (results.improvement.totalSpeedup > 2) {
        conclusionText.textContent = `Using instanced rendering provides a significant ${results.improvement.totalSpeedup.toFixed(1)}x performance improvement over standard rendering with ${results.entityCount} entities. This would allow for much smoother gameplay with higher entity counts.`;
    } else if (results.improvement.totalSpeedup > 1.2) {
        conclusionText.textContent = `Using instanced rendering provides a moderate ${results.improvement.totalSpeedup.toFixed(1)}x performance improvement over standard rendering with ${results.entityCount} entities. This would be noticeable during gameplay with many entities.`;
    } else {
        conclusionText.textContent = `Using instanced rendering provides a small ${results.improvement.totalSpeedup.toFixed(1)}x performance improvement over standard rendering with ${results.entityCount} entities. The benefit would increase with higher entity counts.`;
    }
    conclusion.appendChild(conclusionText);
    
    // Add back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back to Menu';
    backButton.style.marginTop = '20px';
    backButton.style.padding = '8px 16px';
    backButton.addEventListener('click', createUI);
    resultsContainer.appendChild(backButton);
}

// Helper to create bar chart bars
function createBar(label, value, maxValue, color) {
    const barContainer = document.createElement('div');
    barContainer.style.display = 'flex';
    barContainer.style.flexDirection = 'column';
    barContainer.style.alignItems = 'center';
    barContainer.style.height = '100%';
    barContainer.style.width = '80px';
    
    const bar = document.createElement('div');
    const height = Math.max(10, (value / maxValue) * 100);
    bar.style.width = '50px';
    bar.style.height = `${height}%`;
    bar.style.backgroundColor = color;
    bar.style.position = 'relative';
    
    const valueText = document.createElement('div');
    valueText.textContent = value.toFixed(0) + 'ms';
    valueText.style.position = 'absolute';
    valueText.style.top = '-20px';
    valueText.style.width = '100%';
    valueText.style.textAlign = 'center';
    bar.appendChild(valueText);
    
    const labelText = document.createElement('div');
    labelText.textContent = label;
    labelText.style.marginTop = '10px';
    labelText.style.fontSize = '12px';
    labelText.style.textAlign = 'center';
    
    barContainer.appendChild(bar);
    barContainer.appendChild(labelText);
    
    return barContainer;
}

// Start the app
function init() {
    initThree();
    createUI();
}

// Run the init function when the page loads
window.addEventListener('load', init); 